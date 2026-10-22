export const tables = ['profiles', 'products', 'offers', 'channels', 'templates', 'publications'] as const;
export type Table = typeof tables[number];
export type Row = Record<string, unknown>;
export const labels: Record<Table, string> = { profiles: 'Meu perfil', products: 'Produtos', offers: 'Ofertas', channels: 'Canais', templates: 'Modelos', publications: 'Publicações' };
export function parseRecord(text: string): Row {
  const value: unknown = JSON.parse(text);
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Informe um objeto JSON.');
  const row = value as Row;
  function checkFields(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (/token|secret|password|api.?key|authorization/i.test(key)) throw new Error('Credenciais privadas não podem ser salvas aqui.');
      checkFields(child);
    }
  }
  checkFields(row);
  return row;
}
export function titleOf(row: Row): string {
  return String(row.title ?? row.name ?? row.full_name ?? row.id ?? 'Registro');
}
