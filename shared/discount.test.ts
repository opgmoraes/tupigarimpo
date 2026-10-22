import { describe, expect, it } from 'vitest';
import { discountFor } from './discount';
describe('verified discount data', () => {
  it('requires real previous prices greater than the current price', () => {
    for (const old_price of [undefined, null, '', 0, -1, 50, 49, Infinity]) expect(() => discountFor({ price: 50, old_price })).toThrow();
  });
  it('does not round the percentage upward', () => {
    expect(discountFor({ price: 52.99, old_price: 79.99 }).percent).toBe('33,7');
    expect(discountFor({ price: 999.99, old_price: 1000 }).percent).toBe('<0,1');
  });
  it('keeps the complete coupon and trims surrounding spaces', () => {
    expect(discountFor({ price: 50, old_price: 100, coupon_code: '  CUPOM-PROMO-VALIDO-2026  ' }).coupon).toBe('CUPOM-PROMO-VALIDO-2026');
    expect(() => discountFor({ price: 50, old_price: 100, coupon_code: 'ABC\nDEF' })).toThrow('cupom');
  });
  it('uses currency precision and displays the exact savings', () => {
    const discount = discountFor({ price: '52.99', old_price: '79.99' });
    expect(discount.saving.replace(/\s/g, '')).toBe('R$27,00');
    expect(discount.current.replace(/\s/g, '')).toBe('R$52,99');
  });
});
