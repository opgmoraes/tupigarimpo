# Garimpo Studio

React + TypeScript + Vite para a equipe TupiGarimpo. Supabase Auth por e-mail/senha, autorização pela função existente `is_garimpo_member()` e tabelas existentes `profiles`, `products`, `offers`, `channels`, `templates`, `publications`.

## Configuração

Node 24. Execute `npm ci`, copie `.env.example` para `.env.local` e preencha a chave **publishable** atual do projeto. Depois execute `npm run dev`. PowerShell: `Copy-Item .env.example .env.local`.

Variáveis `VITE_*` são públicas no bundle. Nunca colocar service_role, senha de banco, token Telegram/Cloudflare nelas. O cliente aceita somente chave `sb_publishable_` e URL HTTPS.

## Banco verificado no painel em 21/10/2026

O repositório tinha apenas README (main, 813a9d6); o ZIP inicial não foi disponibilizado pelo histórico recuperado. O acesso ao painel confirmou as seis tabelas e as políticas existentes. A primeira consulta HTTP de metadados retornou 401; o acesso pelo SQL Editor permitiu verificar o esquema real.

`profiles` usa **user_id**, não id; possui name, role (admin/operator), active e created_at. Usuários leem apenas seu próprio perfil. A função SQL SECURITY DEFINER `is_garimpo_member`, com search_path vazio, verifica `profiles.user_id=auth.uid()` e `active=true`. As cinco tabelas editoriais têm a política Team access para membros autenticados. Membros ativos compartilham os registros editoriais; ambos os papéis existentes têm esse acesso. Nenhuma nova lista de membros foi criada.

O script `supabase/tests/existing-access.sql` valida RLS nas seis tabelas e isolamento de leitura de visitante/não membro, com transação somente leitura e rollback. Foi executado no projeto real e retornou aprovação. Ainda testar CRUD com fixtures válidas em banco descartável: leitura vazia não prova permissões de mutação. `supabase/inspect.sql` fornece inventário somente leitura.

`supabase/migrations/202610220001_existing_profiles_rls.sql` registra o modelo de políticas para revisão/reprodução; não foi reaplicada ao banco ativo, que já tinha esse modelo. Antes de aplicar em outro ambiente, fazer backup e revisar políticas extras, views privilegiadas, funções security-definer e grants existentes. Essa migração pressupõe as tabelas criadas; não inventa o esquema.

Criar/convidar membros no painel Auth e completar o profile como administrador. Para revogar, definir profiles.active=false pelo painel. Não conceder escrita de profiles ao browser nem usar user_metadata como autorização. Desabilitar cadastro público e login anônimo; configurar Site URL/redirects para os domínios finais. Recuperação de senha é administrada pelo painel nesta versão.

## Funcionalidades e limites

Produtos, ofertas, canais e modelos possuem formulários baseados no esquema confirmado. Ofertas e publicações escolhem os registros relacionados. Publicações são salvas como rascunho. Até 100 registros por consulta; coleções maiores exigem paginação futura. A tela de modelos mantém um campo JSON para seu conteúdo estruturado. Perfil somente leitura, sem exclusão de registros.

Não há envio/agendamento Telegram. O Worker existente `garimpo-studio-api` foi identificado e preservado. O frontend funciona diretamente com Supabase e RLS. Uma integração futura exige JWT/autorização no servidor e token **novo** guardado como secret do Worker; nunca em channels ou no browser. Publicação de rascunho não deve ser confundida com disparo ao canal.

## Verificação

`npm test` (24 testes), `npm run build`, `npm run check:workers`. CI em `.github/workflows/ci.yml`. Os testes de interface simulam a API e cobrem negação de acesso e revogação detectada ao atualizar. O build final deve conter as variáveis públicas corretas; rebuild após alterá-las.

## Cloudflare

Pages: build `npm run build`, saída `dist`, Node 24. Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente de build. Ou enviar a pasta dist pelo painel. Fallback/headers em public. Workers: `wrangler.jsonc` usa assets dist com fallback SPA; publicar com `npm run deploy:workers` após autenticação CLI. Isso cria o frontend garimpo-studio, sem substituir garimpo-studio-api.

Referências: [Cloudflare SPA](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Credenciais privadas antigas

Rotação ainda requer ação nos provedores. Revogar tokens antigos do bot no BotFather; invalidar tokens privados GitHub/Cloudflare divulgados; rotacionar chaves secretas Supabase conforme o tipo. Senha de banco/JWT signing secret exigem planejamento do impacto em conexões e sessões. Não colar valores novos no chat. Nenhum segredo privado foi copiado para o código ou repositório. No navegador, mudanças de credenciais ficam com o usuário.

