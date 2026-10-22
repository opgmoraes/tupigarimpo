-- Non-mutating checks against the existing project. Transaction rolls back.
begin read only;
do $$ declare t text; begin
  foreach t in array array['profiles','products','offers','channels','templates','publications'] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t and c.relrowsecurity) then raise exception 'RLS missing: %',t; end if;
  end loop;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1122e58-2604-48e8-8456-b355f975c112","role":"authenticated"}',true);
do $$ declare t text; n bigint; begin
  if public.is_garimpo_member() then raise exception 'Non-member accepted'; end if;
  foreach t in array array['profiles','products','offers','channels','templates','publications'] loop
    execute format('select count(*) from public.%I',t) into n;
    if n<>0 then raise exception 'Non-member can read %',t; end if;
  end loop;
end $$;
reset role;
set local role anon;
do $$ declare t text; n bigint; begin
  foreach t in array array['profiles','products','offers','channels','templates','publications'] loop
    begin
      execute format('select count(*) from public.%I',t) into n;
      if n<>0 then raise exception 'Anonymous can read %',t; end if;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;
reset role;
select 'RLS and read isolation checks passed' as result;
rollback;
-- After this check, test insert/update/delete with valid business fixtures on
-- a disposable clone. Empty tables cannot prove mutation policy correctness.
