import { calculateBalancePortion } from '@/utils/amountFormatting';

describe('calculateBalancePortion', () => {
  it('calculates BTC balance portions', () => {
    expect(calculateBalancePortion(100000000, 8, 0.5)).toBe('0.5');
  });

  it('calculates rune balance portions', () => {
    expect(calculateBalancePortion('123456789', 5, 0.1)).toBe('123.45678');
  });
});
