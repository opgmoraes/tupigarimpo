# Esquema confirmado — 21/10/2026

Fonte: consultas somente leitura no SQL Editor do projeto egdoeevgrqktbsgemtbk. UUIDs usam gen_random_uuid e timestamps de criação usam now().

| Tabela | Campos |
| --- | --- |
| profiles | user_id PK/FK auth.users, name obrigatório, role admin/operator padrão operator, active padrão true, created_at |
| products | id PK, platform/title obrigatórios, original_url, affiliate_url, image_url, image_urls JSON padrão [], price/old_price não negativos, coupon_code, category, description, created_by FK Auth, created_at, updated_at |
| offers | id PK, product_id obrigatório FK products cascade, status new/review/approved/rejected/ready/published, score 0–100, notes, approved_by FK Auth, approved_at, created_at |
| channels | id PK, name obrigatório, platform padrão telegram, external_id, category, active padrão true, created_at |
| templates | id PK, name obrigatório, type message/story/feed/card obrigatório, content JSON padrão {}, active padrão true, created_at |
| publications | id PK, offer_id obrigatório FK offers cascade, channel_id obrigatório FK channels, message, image_url, status draft/scheduled/publishing/published/failed, scheduled_at, published_at, external_message_id, error_message, created_at |

Políticas encontradas: profiles Read own profile (SELECT authenticated, user_id=auth.uid()); demais tabelas Team access (ALL authenticated, USING/WITH CHECK is_garimpo_member()). RLS habilitado nas seis tabelas, confirmado por teste. A função verifica profile ativo e possui SECURITY DEFINER/search_path vazio.
