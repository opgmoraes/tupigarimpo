-- Read-only inventory; export before applying migration.
select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns
where table_schema='public' and table_name in ('profiles','products','offers','channels','templates','publications') order by table_name,ordinal_position;
select * from pg_policies where schemaname in ('public','studio_private');
select table_name,grantee,privilege_type from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated');
select n.nspname,p.proname,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public';
