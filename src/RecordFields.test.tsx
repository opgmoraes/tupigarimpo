// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialRecord, RecordFields } from './RecordFields';
afterEach(cleanup);
describe('schema-backed forms', () => {
  it('uses a publication draft without claiming a send', () => expect(initialRecord('publications')).toEqual({ status: 'draft' }));
  it('preserves existing values over defaults', () => expect(initialRecord('channels', { active: false }).active).toBe(false));
  it('requires product title and platform', () => {
    render(<RecordFields table="products" record={{}} onChange={vi.fn()} />);
    expect((screen.getByLabelText('Nome do produto') as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText('Loja ou plataforma') as HTMLInputElement).required).toBe(true);
  });
  it('serializes zero price as a number', () => {
    const onChange = vi.fn(); render(<RecordFields table="products" record={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Preço atual (R$)'), { target: { value: '0' } });
    expect(onChange).toHaveBeenCalledWith({ price: 0 });
  });
});
