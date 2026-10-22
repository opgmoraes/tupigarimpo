import type { Row } from './records';
import { discountFor } from '../../shared/discount';
async function image(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(); img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => { img.src = ''; reject(new Error('A imagem demorou para carregar.')); }, 12000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('A loja bloqueou a imagem para exportação. Cadastre uma imagem autorizada para gerar a arte.')); };
    img.src = url;
  });
}
export async function exportArtwork(product: Row, format: 'feed' | 'story') {
  const price = Number(product.price);
  if (!product.title || !Number.isFinite(price) || price <= 0 || typeof product.image_url !== 'string' || !product.image_url.startsWith('https://')) throw new Error('Preencha título, preço e imagem HTTPS do produto.');
  const discount = discountFor(product);
  const [photo, logo, tupi, seal] = await Promise.all([image(product.image_url), image('/brand/logo-lettering.png'), image('/brand/tupi-positivo.png'), image('/brand/selo-tupi.png')]);
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = format === 'feed' ? 1350 : 1920;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Seu navegador não conseguiu criar a arte.');
  const height = canvas.height;
  ctx.fillStyle = '#FFF4D6'; ctx.fillRect(0, 0, 1080, height);
  ctx.fillStyle = '#143D36'; ctx.fillRect(0, 0, 1080, 200);
  const contain = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => { const scale = Math.min(w / img.width, h / img.height); const dw = img.width * scale, dh = img.height * scale; ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); };
  contain(logo, 50, 15, 260, 170);
  ctx.fillStyle = '#FFCC49'; ctx.font = 'bold 35px Arial'; ctx.fillText('ACHADO DO TUPI', 535, 85);
  ctx.fillStyle = '#FF633E'; ctx.beginPath(); ctx.roundRect(535, 110, 470, 62, 16); ctx.fill();
  ctx.fillStyle = '#FFF4D6'; ctx.font = 'bold 35px Arial'; ctx.fillText(`${discount.percent}% OFF`, 560, 153, 420);
  const photoHeight = format === 'feed' ? 480 : 850;
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(60, 230, 960, photoHeight, 35); ctx.fill();
  contain(photo, 90, 250, 900, photoHeight - 40); contain(seal, 830, 215, 170, 170);
  let y = photoHeight + 295;
  ctx.fillStyle = '#143D36'; ctx.font = 'bold 45px Arial';
  const words = String(product.title).slice(0, 180).split(/\s+/); const lines: string[] = []; let line = '';
  for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (ctx.measureText(candidate).width > 900 && line) { lines.push(line); line = word; } else line = candidate; } if (line) lines.push(line);
  lines.slice(0, 3).forEach((text, index) => ctx.fillText(index === 2 && lines.length > 3 ? text.slice(0, -2) + '…' : text, 75, y + index * 54));
  y += 205;
  ctx.font = '32px Arial'; ctx.fillStyle = '#615C50'; ctx.fillText(`De ${discount.previous}`, 75, y - 43);
  ctx.fillStyle = '#143D36'; ctx.font = 'bold 85px Arial'; ctx.fillText(`Por ${discount.current}`, 75, y + 40, 710);
  ctx.font = 'bold 28px Arial'; ctx.fillText(`Economize ${discount.saving}`, 75, y + 89, 710);
  if (discount.coupon) { ctx.fillStyle = '#FFCC49'; ctx.beginPath(); ctx.roundRect(60, y + 115, 710, 76, 16); ctx.fill(); ctx.fillStyle = '#143D36'; ctx.font = 'bold 32px Arial'; ctx.fillText(`CUPOM: ${discount.coupon}`, 80, y + 165, 670); }
  contain(tupi, 800, height - 340, 220, 275);
  ctx.fillStyle = '#143D36'; ctx.fillRect(0, height - 70, 1080, 70); ctx.fillStyle = '#FFF4D6'; ctx.font = '22px Arial'; ctx.fillText('@tupigarimpo • Publicidade • Preço sujeito a alteração', 65, height - 28);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Não foi possível exportar a arte.')), 'image/png'));
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `tupi-${format}-${String(product.id || 'achado')}.png`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
