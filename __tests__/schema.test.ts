import { DATABASE_VERSION, POINTS_MAX, POINTS_MIN } from '../lib/constants';
import { migrateDbIfNeeded } from '../lib/db/schema';
import { createTestDb, type TestDb } from '../test-utils/db';

describe('schema migrations', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = createTestDb();
    await migrateDbIfNeeded(db);
  });

  afterEach(() => {
    db.close();
  });

  it('applies cleanly and sets user_version', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(DATABASE_VERSION);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    const names = tables.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(['habits', 'habit_completions', 'player']));
  });

  it('is idempotent when run again', async () => {
    await expect(migrateDbIfNeeded(db)).resolves.toBeUndefined();
    const players = await db.getAllAsync('SELECT * FROM player');
    expect(players).toHaveLength(1);
  });

  it('seeds exactly one player row with currency 0 and level 0', async () => {
    const players = await db.getAllAsync<{ id: number; currency: number; level: number }>(
      'SELECT id, currency, level FROM player',
    );
    expect(players).toEqual([{ id: 1, currency: 0, level: 0 }]);
  });

  it('rejects points outside the allowed range via CHECK', async () => {
    await expect(
      db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', ['Too low', POINTS_MIN - 1]),
    ).rejects.toThrow();
    await expect(
      db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', ['Too high', POINTS_MAX + 1]),
    ).rejects.toThrow();
    await expect(
      db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', ['Min ok', POINTS_MIN]),
    ).resolves.toMatchObject({ changes: 1 });
    await expect(
      db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', ['Max ok', POINTS_MAX]),
    ).resolves.toMatchObject({ changes: 1 });
  });

  it('enforces curated_key uniqueness while allowing unlimited NULLs', async () => {
    await db.runAsync('INSERT INTO habits (name, points, curated_key) VALUES (?, ?, ?)', [
      'Dishes',
      10,
      'chores.dishes',
    ]);
    await expect(
      db.runAsync('INSERT INTO habits (name, points, curated_key) VALUES (?, ?, ?)', [
        'Dishes again',
        10,
        'chores.dishes',
      ]),
    ).rejects.toThrow();

    // NULL curated_key = custom habit; UNIQUE treats NULLs as distinct.
    await db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', ['Custom 1', 5]);
    await db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', ['Custom 2', 5]);
    const count = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM habits WHERE curated_key IS NULL',
    );
    expect(count?.n).toBe(2);
  });

  it('restricts player to a single row with id 1', async () => {
    await expect(
      db.runAsync('INSERT INTO player (id, currency, level) VALUES (?, ?, ?)', [2, 0, 0]),
    ).rejects.toThrow();
  });

  it('enforces once-per-day completions via UNIQUE(habit_id, completed_on)', async () => {
    const habit = await db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', [
      'Stretch',
      10,
    ]);
    await db.runAsync('INSERT INTO habit_completions (habit_id, completed_on) VALUES (?, ?)', [
      habit.lastInsertRowId,
      '2026-07-07',
    ]);
    await expect(
      db.runAsync('INSERT INTO habit_completions (habit_id, completed_on) VALUES (?, ?)', [
        habit.lastInsertRowId,
        '2026-07-07',
      ]),
    ).rejects.toThrow();
    // A different day is allowed.
    await expect(
      db.runAsync('INSERT INTO habit_completions (habit_id, completed_on) VALUES (?, ?)', [
        habit.lastInsertRowId,
        '2026-07-08',
      ]),
    ).resolves.toMatchObject({ changes: 1 });
  });

  it('cascades completion deletes when a habit is deleted', async () => {
    const habit = await db.runAsync('INSERT INTO habits (name, points) VALUES (?, ?)', [
      'Stretch',
      10,
    ]);
    await db.runAsync('INSERT INTO habit_completions (habit_id, completed_on) VALUES (?, ?)', [
      habit.lastInsertRowId,
      '2026-07-07',
    ]);
    await db.runAsync('DELETE FROM habits WHERE id = ?', [habit.lastInsertRowId]);
    const remaining = await db.getAllAsync('SELECT * FROM habit_completions');
    expect(remaining).toHaveLength(0);
  });

  it('rejects inserting a completion for a nonexistent habit (FK enforced)', async () => {
    await expect(
      db.runAsync('INSERT INTO habit_completions (habit_id, completed_on) VALUES (?, ?)', [
        999,
        '2026-07-07',
      ]),
    ).rejects.toThrow();
  });
});
