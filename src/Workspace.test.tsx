// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { Workspace } from './Workspace';
const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), signOut: vi.fn() }));
vi.mock('./lib/supabase', () => ({ supabase: { rpc: mock.rpc, from: mock.from, auth: { signOut: mock.signOut } } }));
const session = { user: { id: 'member-id', email: 'member@example.invalid' }, access_token: 'test-session' } as Session;
describe('workspace authorization', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);
  it('does not query tables for an unapproved account', async () => {
    mock.rpc.mockResolvedValue({ data: false, error: null });
    render(<Workspace session={session} />);
    await screen.findByText('Acesso pendente');
    expect(mock.from).not.toHaveBeenCalled();
    expect(mock.rpc).toHaveBeenCalledWith('is_garimpo_member');
  });
  it('denies access when authorization fails', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'unavailable' } });
    render(<Workspace session={session} />);
    await screen.findByText('Acesso pendente');
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('clears loaded records when membership is revoked', async () => {
    mock.rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValue({ data: false, error: null });
    const query = { select: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), then: (callback: (result: unknown) => unknown) => Promise.resolve({ data: [{ id: 1, title: 'Achado de teste' }], error: null }).then(callback) };
    mock.from.mockReturnValue(query);
    render(<Workspace session={session} />);
    await screen.findByRole('heading', { name: 'Achado de teste' });
    fireEvent.click(screen.getByText('Atualizar'));
    await screen.findByText('Acesso pendente');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Achado de teste' })).toBeNull());
  });
  it('loads the profile by its existing user_id key', async () => {
    mock.rpc.mockResolvedValue({ data: true, error: null });
    const query = { select: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), then: (callback: (result: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(callback) };
    mock.from.mockReturnValue(query);
    render(<Workspace session={session} />);
    fireEvent.click(await screen.findByText('Meu perfil'));
    await waitFor(() => expect(query.eq).toHaveBeenCalledWith('user_id', 'member-id'));
    expect(query.order).toHaveBeenCalledWith('user_id');
  });
});
