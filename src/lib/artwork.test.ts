// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportArtwork } from './artwork';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const product = { id: 'example', title: 'DEMONSTRAÇÃO DE ARTE', price: 99.9, old_price: 150, coupon_code: 'TUPI10', image_url: 'https://example.invalid/product.png' };
function canvasSetup(fail = false) {
  const context = { fillRect: vi.fn(), beginPath: vi.fn(), roundRect: vi.fn(), fill: vi.fn(), drawImage: vi.fn(), fillText: vi.fn(), measureText: (value: string) => ({ width: value.length * 20 }) };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  let canvas: HTMLCanvasElement | undefined;
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function(this: HTMLCanvasElement, callback) { canvas = this; callback(new Blob(['test'], { type: 'image/png' })); });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.stubGlobal('Image', class {
    width = 800; height = 800; crossOrigin = ''; onload?: () => void; onerror?: () => void;
    set src(value: string) { if (value) queueMicrotask(() => fail ? this.onerror?.() : this.onload?.()); }
  });
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() });
  return { dimensions: () => [canvas?.width, canvas?.height], click, context };
}
describe('branded artwork export', () => {
  it('produces feed and story sizes with discount and coupon', async () => {
    const state = canvasSetup();
    await exportArtwork(product, 'feed'); expect(state.dimensions()).toEqual([1080, 1350]);
    await exportArtwork(product, 'story'); expect(state.dimensions()).toEqual([1080, 1920]);
    expect(state.context.drawImage).toHaveBeenCalledTimes(8); expect(state.click).toHaveBeenCalledTimes(2);
    const drawn = state.context.fillText.mock.calls.flat().join(' ');
    expect(drawn).toContain('33,4% OFF'); expect(drawn).toContain('CUPOM: TUPI10');
    expect(drawn).toContain('De R$'); expect(drawn).toContain('Por R$'); expect(drawn).not.toContain('Link de afiliado');
  });
  it('does not download artwork when the product image fails', async () => {
    const state = canvasSetup(true);
    await expect(exportArtwork(product, 'feed')).rejects.toThrow('bloqueou a imagem');
    expect(state.click).not.toHaveBeenCalled();
  });
  it('rejects absent images and invalid prices before rendering', async () => {
    await expect(exportArtwork({ ...product, image_url: '' }, 'feed')).rejects.toThrow();
    await expect(exportArtwork({ ...product, price: -1 }, 'story')).rejects.toThrow();
    await expect(exportArtwork({ ...product, old_price: null }, 'feed')).rejects.toThrow('preço anterior');
  });
});
