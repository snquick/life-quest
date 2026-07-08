import { POINTS_MAX, POINTS_MIN } from '../lib/constants';
import { CURATED_CATEGORIES } from '../lib/curated-habits';

const EXPECTED_CATEGORY_KEYS = [
  'chores',
  'hygiene',
  'productivity',
  'working-out',
  'meal-prep',
  'relaxing',
];

describe('curated catalog', () => {
  it('has exactly the six expected categories', () => {
    expect(CURATED_CATEGORIES.map((c) => c.key)).toEqual(EXPECTED_CATEGORY_KEYS);
  });

  it('has at least 5 quests per category, each with a title', () => {
    for (const category of CURATED_CATEGORIES) {
      expect(category.title.trim().length).toBeGreaterThan(0);
      expect(category.quests.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('has globally unique curated keys, namespaced by category', () => {
    const keys = CURATED_CATEGORIES.flatMap((c) => c.quests.map((q) => q.curatedKey));
    expect(new Set(keys).size).toBe(keys.length);
    for (const category of CURATED_CATEGORIES) {
      for (const quest of category.quests) {
        expect(quest.curatedKey.startsWith(`${category.key}.`)).toBe(true);
      }
    }
  });

  it('keeps every quest name non-empty and points within the allowed range', () => {
    for (const category of CURATED_CATEGORIES) {
      for (const quest of category.quests) {
        expect(quest.name.trim().length).toBeGreaterThan(0);
        expect(Number.isInteger(quest.points)).toBe(true);
        expect(quest.points).toBeGreaterThanOrEqual(POINTS_MIN);
        expect(quest.points).toBeLessThanOrEqual(POINTS_MAX);
      }
    }
  });
});
