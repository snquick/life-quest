import { nextUpgradePrice } from '../lib/game/economy';

describe('nextUpgradePrice', () => {
  it('follows the spec price sequence 10, 13, 16, 20, 25', () => {
    expect([0, 1, 2, 3, 4].map(nextUpgradePrice)).toEqual([10, 13, 16, 20, 25]);
  });

  it('keeps rounding up at higher levels', () => {
    // 10 * 1.25^10 = 93.13..., rounded up
    expect(nextUpgradePrice(10)).toBe(94);
  });

  it('rejects negative levels', () => {
    expect(() => nextUpgradePrice(-1)).toThrow(RangeError);
  });

  it('rejects non-integer levels', () => {
    expect(() => nextUpgradePrice(1.5)).toThrow(RangeError);
  });
});
