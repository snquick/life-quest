import { POINTS_MAX, POINTS_MIN } from '../lib/constants';
import { completeHabit, createHabit, deleteHabit, listHabits } from '../lib/db/habits';
import { getPlayer } from '../lib/db/player';
import { migrateDbIfNeeded } from '../lib/db/schema';
import { createTestDb, type TestDb } from '../test-utils/db';

const TODAY = '2026-07-07';
const TOMORROW = '2026-07-08';

describe('habits data layer', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = createTestDb();
    await migrateDbIfNeeded(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createHabit', () => {
    it('creates a habit with a trimmed name and returns it', async () => {
      const habit = await createHabit(db, '  Stretch  ', 10);
      expect(habit).toMatchObject({
        name: 'Stretch',
        points: 10,
        curatedKey: null,
        completedToday: false,
      });
      expect(habit.id).toBeGreaterThan(0);
    });

    it('rejects an empty or whitespace-only name', async () => {
      await expect(createHabit(db, '', 10)).rejects.toThrow();
      await expect(createHabit(db, '   ', 10)).rejects.toThrow();
    });

    it('clamps points into the allowed range', async () => {
      const low = await createHabit(db, 'Low', POINTS_MIN - 3);
      const high = await createHabit(db, 'High', POINTS_MAX + 50);
      expect(low.points).toBe(POINTS_MIN);
      expect(high.points).toBe(POINTS_MAX);
    });

    it('rounds fractional points to the nearest integer', async () => {
      const habit = await createHabit(db, 'Fraction', 10.6);
      expect(habit.points).toBe(11);
    });
  });

  describe('listHabits', () => {
    it('returns an empty list on a fresh database', async () => {
      expect(await listHabits(db, TODAY)).toEqual([]);
    });

    it('flags habits completed on the given day', async () => {
      const a = await createHabit(db, 'A', 5);
      await createHabit(db, 'B', 5);
      await completeHabit(db, a.id, TODAY);

      const habits = await listHabits(db, TODAY);
      const flags = Object.fromEntries(habits.map((h) => [h.name, h.completedToday]));
      expect(flags).toEqual({ A: true, B: false });

      const nextDay = await listHabits(db, TOMORROW);
      expect(nextDay.every((h) => !h.completedToday)).toBe(true);
    });
  });

  describe('completeHabit', () => {
    it('credits the habit points to the player once per day', async () => {
      const habit = await createHabit(db, 'Stretch', 10);

      await expect(completeHabit(db, habit.id, TODAY)).resolves.toBe(true);
      expect((await getPlayer(db)).currency).toBe(10);

      // Same day again is a friendly no-op with no extra credit.
      await expect(completeHabit(db, habit.id, TODAY)).resolves.toBe(false);
      expect((await getPlayer(db)).currency).toBe(10);

      // A new day credits again.
      await expect(completeHabit(db, habit.id, TOMORROW)).resolves.toBe(true);
      expect((await getPlayer(db)).currency).toBe(20);
    });

    it('rejects completing a habit that does not exist', async () => {
      await expect(completeHabit(db, 999, TODAY)).rejects.toThrow();
    });
  });

  describe('deleteHabit', () => {
    it('removes the habit and its completions', async () => {
      const habit = await createHabit(db, 'Stretch', 10);
      await completeHabit(db, habit.id, TODAY);

      await deleteHabit(db, habit.id);

      expect(await listHabits(db, TODAY)).toEqual([]);
      const completions = await db.getAllAsync('SELECT * FROM habit_completions');
      expect(completions).toHaveLength(0);
    });

    it('does not touch the player balance', async () => {
      const habit = await createHabit(db, 'Stretch', 10);
      await completeHabit(db, habit.id, TODAY);
      await deleteHabit(db, habit.id);
      expect((await getPlayer(db)).currency).toBe(10);
    });
  });
});
