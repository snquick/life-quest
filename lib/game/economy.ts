import { UPGRADE_BASE_PRICE, UPGRADE_PRICE_MULTIPLIER } from '../constants';

/**
 * Price of the next Level upgrade for a player at the given level,
 * computed as ceil(base * multiplier^level). Computing from the level each
 * time avoids storing a running price that could drift.
 *
 * @param level Current player level. Must be a non-negative integer.
 * @throws {RangeError} When level is negative or not an integer.
 */
export function nextUpgradePrice(level: number): number {
  if (!Number.isInteger(level) || level < 0) {
    throw new RangeError(`level must be a non-negative integer, got ${level}`);
  }
  return Math.ceil(UPGRADE_BASE_PRICE * UPGRADE_PRICE_MULTIPLIER ** level);
}
