import { InsufficientFundsError, getPlayer, purchaseUpgrade } from '../lib/db/player';
import { migrateDbIfNeeded } from '../lib/db/schema';
import { nextUpgradePrice } from '../lib/game/economy';
import { createTestDb, type TestDb } from '../test-utils/db';

async function seedCurrency(db: TestDb, amount: number): Promise<void> {
  await db.runAsync('UPDATE player SET currency = ? WHERE id = 1', [amount]);
}

describe('player data layer', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = createTestDb();
    await migrateDbIfNeeded(db);
  });

  afterEach(() => {
    db.close();
  });

  it('reads the seeded player', async () => {
    expect(await getPlayer(db)).toEqual({ currency: 0, level: 0 });
  });

  describe('purchaseUpgrade', () => {
    it('debits the price and increments the level when funds suffice', async () => {
      await seedCurrency(db, 10);
      const player = await purchaseUpgrade(db);
      expect(player).toEqual({ currency: 0, level: 1 });
      expect(nextUpgradePrice(player.level)).toBe(13);
    });

    it('supports consecutive purchases at rising prices', async () => {
      await seedCurrency(db, 23); // exactly 10 + 13
      await purchaseUpgrade(db);
      const player = await purchaseUpgrade(db);
      expect(player).toEqual({ currency: 0, level: 2 });
    });

    it('rejects when funds are insufficient and leaves the player untouched', async () => {
      await seedCurrency(db, 9);
      await expect(purchaseUpgrade(db)).rejects.toThrow(InsufficientFundsError);
      expect(await getPlayer(db)).toEqual({ currency: 9, level: 0 });
    });
  });
});
