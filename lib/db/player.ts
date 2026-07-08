/**
 * Player state reads and the Level upgrade purchase. The purchase runs in a
 * transaction that verifies the balance before debiting, so the balance can
 * never go negative.
 */
import { nextUpgradePrice } from '../game/economy';
import type { DbClient, Player } from './schema';

/** Thrown when a purchase is attempted with a balance below the price. */
export class InsufficientFundsError extends Error {
  constructor(currency: number, price: number) {
    super(`Insufficient funds: have ${currency}, need ${price}`);
    this.name = 'InsufficientFundsError';
  }
}

/**
 * Read the single player row.
 *
 * @throws {Error} When the player row is missing (the database was not
 *   migrated), or on SQL failure.
 */
export async function getPlayer(db: DbClient): Promise<Player> {
  const player = await db.getFirstAsync<Player>(
    'SELECT currency, level FROM player WHERE id = 1',
  );
  if (player === null) {
    throw new Error('Player row is missing; was the database migrated?');
  }
  return player;
}

/**
 * Buy the next Level upgrade: verify the balance covers the current price,
 * debit it, and increment the level, all in one transaction.
 *
 * @returns The player state after the purchase.
 * @throws {InsufficientFundsError} When the balance is below the price;
 *   the player row is left untouched.
 * @throws {Error} On SQL failure (the transaction rolls back).
 */
export async function purchaseUpgrade(db: DbClient): Promise<Player> {
  let updated: Player | null = null;
  await db.withTransactionAsync(async () => {
    const player = await getPlayer(db);
    const price = nextUpgradePrice(player.level);
    if (player.currency < price) {
      throw new InsufficientFundsError(player.currency, price);
    }
    await db.runAsync(
      'UPDATE player SET currency = currency - ?, level = level + 1 WHERE id = 1',
      [price],
    );
    updated = await getPlayer(db);
  });
  if (updated === null) {
    throw new Error('Purchase transaction did not complete');
  }
  return updated;
}
