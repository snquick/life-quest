/**
 * Database schema, shared types, and the migration runner.
 *
 * All data access in the app goes through the {@link DbClient} interface so
 * the same data-layer code runs against expo-sqlite on device and against
 * Node's built-in `node:sqlite` in tests (see test-utils/db.ts).
 */
import { DATABASE_VERSION, POINTS_MAX, POINTS_MIN } from '../constants';

/** Values that can be bound to a SQL statement parameter. */
export type SqlValue = string | number | null;

/** Result of a write statement. */
export interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

/**
 * Minimal async database interface used by the data layer.
 *
 * expo-sqlite's `SQLiteDatabase` satisfies this structurally; tests provide a
 * `node:sqlite`-backed implementation. All methods reject on SQL errors,
 * and callers must handle or propagate the rejection.
 */
export interface DbClient {
  /** Execute one or more statements without parameter binding. */
  execAsync(sql: string): Promise<void>;
  /** Execute a single write statement with bound parameters. */
  runAsync(sql: string, params: SqlValue[]): Promise<RunResult>;
  /** Fetch the first result row, or null when the query returns no rows. */
  getFirstAsync<T>(sql: string): Promise<T | null>;
  getFirstAsync<T>(sql: string, params: SqlValue[]): Promise<T | null>;
  /** Fetch all result rows. */
  getAllAsync<T>(sql: string): Promise<T[]>;
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  /** Runs `task` inside a transaction and rolls back if the task rejects. */
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/** A habit as exposed to the UI (custom, or pinned from the curated catalog). */
export interface Habit {
  id: number;
  name: string;
  /** Points credited on completion, always between POINTS_MIN and POINTS_MAX. */
  points: number;
  /** Catalog key when the habit was pinned from a quest, null for custom habits. */
  curatedKey: string | null;
  /** ISO timestamp (UTC) of row creation. */
  createdAt: string;
  /** True when a completion exists for the device's current local date. */
  completedToday: boolean;
}

/** The single local player's progression state. */
export interface Player {
  currency: number;
  level: number;
}

/**
 * Migration for schema version 1: full initial schema plus the seeded
 * single player row. `CHECK` bounds on points mirror POINTS_MIN/POINTS_MAX.
 */
const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points BETWEEN ${POINTS_MIN} AND ${POINTS_MAX}),
  curated_key TEXT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_on TEXT NOT NULL,
  UNIQUE (habit_id, completed_on)
);

CREATE TABLE IF NOT EXISTS player (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  currency INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO player (id, currency, level) VALUES (1, 0, 0);
`;

/**
 * Bring the database up to {@link DATABASE_VERSION} using `PRAGMA
 * user_version` to track the applied schema version. It is safe to call on
 * every launch and does nothing when the version is already current. It also
 * enables foreign-key enforcement for the connection, which ON DELETE
 * CASCADE needs.
 *
 * @throws Rejects if any migration statement fails. Nothing is marked
 *   applied unless every statement of the migration succeeded.
 */
export async function migrateDbIfNeeded(db: DbClient): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }
  if (currentVersion < 1) {
    await db.execAsync(MIGRATION_V1);
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
