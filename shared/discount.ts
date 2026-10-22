export function discountFor(product: { price?: unknown; old_price?: unknown; coupon_code?: unknown }) {
  const price = Math.round(Number(product.price) * 100);
  const previous = Math.round(Number(product.old_price) * 100);
  if (!Number.isSafeInteger(price) || price <= 0 || !Number.isSafeInteger(previous) || previous <= price) {
    throw new Error('Informe o preço anterior real da loja, maior que o preço atual, antes de divulgar o desconto.');
  }
  const coupon = typeof product.coupon_code === 'string' ? product.coupon_code.trim() : '';
  if (coupon.length > 64 || /[\r\n]/.test(coupon)) throw new Error('Confira o código do cupom: use até 64 caracteres em uma linha.');
  const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const percent = Math.floor((previous - price) * 1000 / previous) / 10;
  return { current: money(price), previous: money(previous), saving: money(previous - price), percent: percent > 0 ? percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '<0,1', coupon };
}
