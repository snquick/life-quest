import { DatabaseSync } from 'node:sqlite';

import type { DbClient, RunResult, SqlValue } from '../lib/db/schema';

export interface TestDb extends DbClient {
  /** Close the underlying database; call in afterEach to avoid leaks. */
  close(): void;
}

class NodeSqliteClient implements TestDb {
  private readonly db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(':memory:');
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, params: SqlValue[] = []): Promise<RunResult> {
    const result = this.db.prepare(sql).run(...params);
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }

  async getFirstAsync<T>(sql: string, params: SqlValue[] = []): Promise<T | null> {
    const row = this.db.prepare(sql).get(...params);
    return (row as T | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await task();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}

/** Create a fresh in-memory database implementing the app's DbClient. */
export function createTestDb(): TestDb {
  return new NodeSqliteClient();
}
