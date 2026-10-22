-- Matches the schema inspected in the Supabase dashboard on 2026-10-21.
-- Existing production policies already implement this model. Do not reapply
-- without reviewing any local changes. No separate membership table is used.
begin;
create or replace function public.is_garimpo_member()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.profiles where user_id=(select auth.uid()) and active=true); $$;
revoke all on function public.is_garimpo_member() from public, anon;
grant execute on function public.is_garimpo_member() to authenticated;
do $$ declare t text; begin
  foreach t in array array['profiles','products','offers','channels','templates','publications'] loop
    if to_regclass(format('public.%I',t)) is null then raise exception 'Missing table %',t; end if;
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('drop policy if exists "Team access" on public.%I',t);
    if t='profiles' then
      execute 'grant select on public.profiles to authenticated';
      execute 'drop policy if exists "Read own profile" on public.profiles';
      execute 'create policy "Read own profile" on public.profiles for select to authenticated using (user_id=(select auth.uid()))';
    else
      execute format('grant select,insert,update,delete on public.%I to authenticated',t);
      execute format('create policy "Team access" on public.%I for all to authenticated using ((select public.is_garimpo_member())) with check ((select public.is_garimpo_member()))',t);
    end if;
  end loop;
end $$;
commit;
-- Authorize/revoke through existing profiles.active, as administrator only.
-- Never grant profile INSERT/UPDATE/DELETE to browser users.
