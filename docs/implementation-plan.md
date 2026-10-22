# Garimpo Studio — plano

Escopo autorizado: React/TypeScript, Supabase Auth, seis tabelas existentes, membros, RLS e Cloudflare. Nenhum segredo no repositório.

1. Inspecionar remoto/contexto. Base main 813a9d6, somente README; ZIP original inacessível; API retornou 401.
2. Login por senha, sessão persistente e verificação via RPC existente is_garimpo_member. Negar acesso quando configuração ou autorização falharem.
3. Após acesso ao painel: confirmar esquema, usar profiles.user_id e formulários por campo nas tabelas editoriais. Perfil somente leitura; publicações como rascunho.
4. Reutilizar profiles.active e políticas Team access existentes. Nenhuma tabela de membros adicional. Migração de referência preserva esquema/dados. Equipe compartilha registros; perfis individuais.
5. Configurar Pages/Workers estáticos, headers e CI. Telegram depende de backend e credenciais novas; fora desta base.
6. Executar testes, TypeScript/build e dry-run Workers. Testes de isolamento de leitura executados com transação somente leitura e rollback no projeto real; mutações devem ser testadas em clone descartável.

Verificar especialmente: configuração ausente, usuário não aprovado, revogação de membro, campos obrigatórios desconhecidos, RPCs/views que contornam RLS. Rotação exige acesso administrativo não disponível.
