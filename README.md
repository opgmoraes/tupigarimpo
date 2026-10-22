# Garimpo Studio

React + TypeScript + Vite para a equipe TupiGarimpo. Supabase Auth por e-mail/senha, autorização pela função existente `is_garimpo_member()` e tabelas existentes `profiles`, `products`, `offers`, `channels`, `templates`, `publications`.

Frontend: https://garimpo-studio.pages.dev/. Identidade visual usa os PNGs originais do kit Tupi de 18/10/2026 em public/brand (logo, avatar, mascote em poses e selo), com paleta e tipografia recomendadas no manual. Direção documentada em docs/visual-design.md. Publicação atual via upload direto no Cloudflare Pages; novos commits não disparam deployment automaticamente.

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

A integração Telegram está implementada em `api/worker.ts`, separada do frontend. Requer deploy com `wrangler.api.jsonc`, variável pública SUPABASE_PUBLISHABLE_KEY e segredo TELEGRAM_BOT_TOKEN. GET /api/telegram/status testa bot e permissões; POST /api/publications/:id/send publica oferta aprovada no canal ativo @tupigarimpo. Todas as rotas validam membro pelo JWT e RLS. A reivindicação atômica bloqueia disparos duplicados; entregas incertas permanecem em publishing para reconciliação manual. Rotas ainda dependem de deploy/configuração e validação real. Não há cron de descoberta ativo nesta etapa.

Produtos têm exportação PNG feed 1080x1350 e story 1080x1920 usando os personagens e selo originais. A imagem deve permitir CORS; falha de carregamento bloqueia exportação. O arquivo gerado não é publicado no Instagram automaticamente. As quatro integrações de lojas dependem de acesso oficial de afiliado/API; login na loja não garante essa habilitação.

## Verificação

`npm test` (38 testes nesta etapa), `npm run check:api`, `npm run build`, `npm run check:workers`. CI em `.github/workflows/ci.yml`. Os testes de interface simulam a API e cobrem negação de acesso e revogação detectada ao atualizar. O build final deve conter as variáveis públicas corretas; rebuild após alterá-las.

## Cloudflare

Pages: build `npm run build`, saída `dist`, Node 24. Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente de build. Ou enviar a pasta dist pelo painel. Fallback/headers em public. Workers: `wrangler.jsonc` usa assets dist com fallback SPA; publicar com `npm run deploy:workers` após autenticação CLI. Isso cria o frontend garimpo-studio, sem substituir garimpo-studio-api.

Referências: [Cloudflare SPA](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Credenciais privadas antigas

Rotação ainda requer ação nos provedores. Revogar tokens antigos do bot no BotFather; invalidar tokens privados GitHub/Cloudflare divulgados; rotacionar chaves secretas Supabase conforme o tipo. Senha de banco/JWT signing secret exigem planejamento do impacto em conexões e sessões. Não colar valores novos no chat. Nenhum segredo privado foi copiado para o código ou repositório. No navegador, mudanças de credenciais ficam com o usuário.


## Backend no Pages (modo usado para upload direto)

O build também gera `dist/_worker.js` em modo avançado oficial do Pages. `_routes.json` executa o backend somente em /api/* e /health; demais arquivos continuam estáticos. O frontend usa a API no mesmo domínio. Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e STUDIO_ORIGIN nas variáveis de produção do Pages e TELEGRAM_BOT_TOKEN como segredo. Essas configurações exigem um novo deploy. O Worker separado é uma opção futura, exigindo mudar o endereço da API no frontend.

## Primeiro fluxo real validado

Em 21/10/2026, um copo térmico de 1,2 L anunciado por R$ 52,99 foi cadastrado com imagem e link gerado pela conta Shopee. Oferta aprovada, rascunho criado e envio realizado pelo Studio. Telegram confirmou a mensagem 3: https://t.me/tupigarimpo/3. Feed 1080x1350 e story 1080x1920 foram exportados pela interface publicada e conferidos visualmente. A conta Shopee informa ausência de acesso à Open API; o feed oficial está vazio. Portanto esse primeiro produto veio do painel de afiliados e a descoberta contínua continua pendente.

`public/.assetsignore` impede que o backend de Pages seja publicado como arquivo estático no modo alternativo Workers Assets. O deploy Pages reconhece `_worker.js` como servidor.

## Padrão de descontos e cupons

A partir desta versão, gerar arte ou enviar mensagem exige preço anterior real maior que o preço atual. Mensagens e artes exibem de/por, percentual calculado sem arredondar para cima e economia em reais. Cupons cadastrados são enviados completos na mensagem e incluídos no card. Nenhum preço anterior é inferido de percentuais aproximados. Produtos sem referência válida ficam para revisão. A indicação pública usa Publicidade em vez da expressão link de afiliado. O post histórico 3 não foi alterado.

Amazon: o painel Creators API da conta informa que a conta de associado ainda não está aprovada para acesso. Não há credenciais disponíveis para conectar no momento. Shopee permanece manual, conforme solicitado; sua Open API ainda não está liberada e o feed oficial está vazio.
