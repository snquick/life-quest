/**
 * The curated quest catalog: static app content, never stored in the
 * database. Pinning copies a quest into the habits table with its
 * curatedKey, so pinned state always derives from the habits rows.
 */

/** A preset habit the user can pin from the catalog. */
export interface CuratedQuest {
  /** Globally unique key, namespaced by category (for example 'chores.dishes'). */
  curatedKey: string;
  name: string;
  /** Preset point value, within the allowed points range. */
  points: number;
}

/** A themed group of quests shown as one catalog section. */
export interface CuratedCategory {
  key: 'chores' | 'hygiene' | 'productivity' | 'working-out' | 'meal-prep' | 'relaxing';
  title: string;
  quests: CuratedQuest[];
}

export const CURATED_CATEGORIES: CuratedCategory[] = [
  {
    key: 'chores',
    title: 'Chores',
    quests: [
      { curatedKey: 'chores.dishes', name: 'Do the dishes', points: 10 },
      { curatedKey: 'chores.laundry', name: 'Run a load of laundry', points: 10 },
      { curatedKey: 'chores.trash', name: 'Take out the trash', points: 5 },
      { curatedKey: 'chores.vacuum', name: 'Vacuum a room', points: 10 },
      { curatedKey: 'chores.tidy-desk', name: 'Tidy your desk', points: 5 },
    ],
  },
  {
    key: 'hygiene',
    title: 'Hygiene',
    quests: [
      { curatedKey: 'hygiene.floss', name: 'Floss', points: 5 },
      { curatedKey: 'hygiene.shower', name: 'Take a shower', points: 5 },
      { curatedKey: 'hygiene.skincare', name: 'Do your skincare routine', points: 10 },
      { curatedKey: 'hygiene.brush-night', name: 'Brush teeth before bed', points: 5 },
      { curatedKey: 'hygiene.clean-towels', name: 'Swap in fresh towels', points: 10 },
    ],
  },
  {
    key: 'productivity',
    title: 'Productivity',
    quests: [
      { curatedKey: 'productivity.plan-day', name: 'Plan tomorrow tonight', points: 5 },
      { curatedKey: 'productivity.inbox-zero', name: 'Clear your inbox', points: 10 },
      { curatedKey: 'productivity.deep-work', name: 'One hour of deep work', points: 20 },
      { curatedKey: 'productivity.read-20', name: 'Read 20 pages', points: 10 },
      { curatedKey: 'productivity.no-phone-hour', name: 'First hour phone-free', points: 15 },
    ],
  },
  {
    key: 'working-out',
    title: 'Working out',
    quests: [
      { curatedKey: 'working-out.stretch', name: 'Stretch for 10 minutes', points: 5 },
      { curatedKey: 'working-out.walk', name: 'Walk for 30 minutes', points: 10 },
      { curatedKey: 'working-out.run', name: 'Go for a run', points: 20 },
      { curatedKey: 'working-out.gym', name: 'Full gym session', points: 25 },
      { curatedKey: 'working-out.pushups', name: 'Do 20 push-ups', points: 10 },
    ],
  },
  {
    key: 'meal-prep',
    title: 'Meal prep',
    quests: [
      { curatedKey: 'meal-prep.grocery-list', name: 'Write a grocery list', points: 5 },
      { curatedKey: 'meal-prep.pack-lunch', name: "Pack tomorrow's lunch", points: 15 },
      { curatedKey: 'meal-prep.cook-dinner', name: 'Cook dinner at home', points: 15 },
      { curatedKey: 'meal-prep.batch-cook', name: 'Batch-cook for the week', points: 25 },
      { curatedKey: 'meal-prep.prep-veg', name: 'Wash and chop vegetables', points: 10 },
    ],
  },
  {
    key: 'relaxing',
    title: 'Relaxing',
    quests: [
      { curatedKey: 'relaxing.meditate', name: 'Meditate for 10 minutes', points: 10 },
      { curatedKey: 'relaxing.journal', name: 'Write in your journal', points: 10 },
      { curatedKey: 'relaxing.read-fun', name: 'Read something for fun', points: 10 },
      { curatedKey: 'relaxing.screen-free', name: 'Screen-free hour before bed', points: 15 },
      { curatedKey: 'relaxing.early-night', name: 'Lights out by 11', points: 15 },
    ],
  },
];
