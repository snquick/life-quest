/**
 * Habit CRUD and completion recording. Completing a habit credits its
 * points to the player inside the same transaction, so the balance and the
 * completion row can never disagree.
 */
import { POINTS_MAX, POINTS_MIN } from '../constants';
import type { DbClient, Habit } from './schema';

/** Shape of a habits row joined with its completion flag. */
interface HabitRow {
  id: number;
  name: string;
  points: number;
  curated_key: string | null;
  created_at: string;
  completed_today: number;
}

/**
 * The current date in the device's local timezone as YYYY-MM-DD. Local time
 * matters here: completions must roll over at the user's midnight, not UTC's.
 */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Round to an integer and clamp into the allowed points range. */
function clampPoints(points: number): number {
  return Math.min(POINTS_MAX, Math.max(POINTS_MIN, Math.round(points)));
}

function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    points: row.points,
    curatedKey: row.curated_key,
    createdAt: row.created_at,
    completedToday: row.completed_today === 1,
  };
}

/**
 * Create a custom habit. The name is trimmed and required; points are
 * rounded and clamped into the allowed range.
 *
 * @returns The created habit.
 * @throws {Error} When the trimmed name is empty, or on SQL failure.
 */
export async function createHabit(db: DbClient, name: string, points: number): Promise<Habit> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Habit name is required');
  }
  const result = await db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', [
    trimmed,
    clampPoints(points),
  ]);
  const row = await db.getFirstAsync<HabitRow>(
    'SELECT id, name, points, curated_key, created_at, 0 AS completed_today FROM habits WHERE id = ?',
    [result.lastInsertRowId],
  );
  if (row === null) {
    throw new Error('Habit was not created');
  }
  return toHabit(row);
}

/**
 * List all habits, oldest first, with their completion flag for the given
 * local date (defaults to today on the device).
 */
export async function listHabits(
  db: DbClient,
  on: string = localDateString(),
): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT h.id, h.name, h.points, h.curated_key, h.created_at,
            EXISTS (
              SELECT 1 FROM habit_completions c
              WHERE c.habit_id = h.id AND c.completed_on = ?
            ) AS completed_today
     FROM habits h
     ORDER BY h.id`,
    [on],
  );
  return rows.map(toHabit);
}

/**
 * Delete a habit; its completion rows go with it via ON DELETE CASCADE.
 * Deleting an id that no longer exists is a no-op.
 */
export async function deleteHabit(db: DbClient, habitId: number): Promise<void> {
  await db.runAsync('DELETE FROM habits WHERE id = ?', [habitId]);
}

/**
 * Record a completion for the given local date and credit the habit's
 * points to the player, both inside one transaction. Completing a habit
 * that is already done that day is a friendly no-op.
 *
 * @returns True when the completion was recorded and points credited;
 *   false when the habit was already completed on that date.
 * @throws {Error} When the habit does not exist, or on SQL failure
 *   (the transaction rolls back).
 */
export async function completeHabit(
  db: DbClient,
  habitId: number,
  on: string = localDateString(),
): Promise<boolean> {
  let credited = false;
  await db.withTransactionAsync(async () => {
    const habit = await db.getFirstAsync<{ points: number }>(
      'SELECT points FROM habits WHERE id = ?',
      [habitId],
    );
    if (habit === null) {
      throw new Error(`Habit ${habitId} does not exist`);
    }
    const inserted = await db.runAsync(
      'INSERT OR IGNORE INTO habit_completions (habit_id, completed_on) VALUES (?, ?)',
      [habitId, on],
    );
    if (inserted.changes === 1) {
      await db.runAsync('UPDATE player SET currency = currency + ? WHERE id = 1', [habit.points]);
      credited = true;
    }
  });
  return credited;
}
