/**
 * Every balance number and storage name lives here so nothing is
 * hardcoded elsewhere.
 */

/** Minimum points a habit can be worth (inclusive). */
export const POINTS_MIN = 5;

/** Maximum points a habit can be worth (inclusive). */
export const POINTS_MAX = 25;

/** Base price of the first Level upgrade. */
export const UPGRADE_BASE_PRICE = 10;

/** Each purchased level multiplies the next upgrade price by this factor. */
export const UPGRADE_PRICE_MULTIPLIER = 1.25;

/** SQLite database file name (opened via SQLiteProvider). */
export const DB_NAME = 'habittracker.db';

/** Current schema version, applied via `PRAGMA user_version`. */
export const DATABASE_VERSION = 1;
