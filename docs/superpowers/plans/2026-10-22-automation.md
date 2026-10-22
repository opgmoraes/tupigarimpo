# Tupi automation implementation plan

**Goal:** Discover real affiliate offers, generate branded feed/story assets, and publish to @tupigarimpo.
**Architecture:** Keep the existing React app and member RLS. A separate Cloudflare Worker holds credentials and authenticates user requests with Supabase. Add scheduled ingestion only for official affiliate APIs available to the account.
**Tech stack:** React/TypeScript, Supabase, Cloudflare Workers, Telegram Bot API.

## Constraints and review focus
- Never include private credentials in source, logs, browser bundles, or error responses.
- Validate member access on the server; do not trust client membership flags.
- Claim publication atomically before contacting Telegram. Ambiguous delivery remains blocked for manual reconciliation, never automatically retried.
- Require a real affiliate URL and approved offer. Never invent prices, discounts, or API availability.
- Store discovery and publication separately; scheduled ingestion requires server Supabase access.

## Tasks
- [x] Add `api/worker.ts`: authenticated bot health and publication delivery using existing tables and user RLS; test revoked members, wrong channels, concurrent claims, and ambiguous delivery.
- [x] Add `src/TelegramPanel.tsx`: connection test and explicit publication action with session token; no secret fields.
- [x] Generate feed/story artwork from validated product data and original brand assets; verify dimensions and failure handling.
- [ ] Inspect affiliate accounts: Shopee API, Mercado Livre affiliate links, Amazon Creators API eligibility, Shein official feeds. Implement each verified integration in a separate provider module.
- [ ] Add ingestion schema, secret bindings, scheduled discovery and deduplication after available provider credentials are known.
- [ ] Test build, worker types and delivery behavior, deploy, and verify real bot permissions. A production message requires a genuine offer.

User has explicitly authorized implementation and Telegram delivery; proceed in this session without a separate planning approval.

## Verified deployment

Pages advanced mode deployed successfully on 2026-10-21. Live authenticated status confirmed @TupiGarimpoBot can publish to @tupigarimpo. The real channel record was created successfully through the member UI. Discovery and scheduling remain pending affiliate API access. A real Shopee cup offer was published to https://t.me/tupigarimpo/3. Both PNG exports were generated in the published UI and visually verified. Shopee API panel explicitly denies account access and the product feed is empty. The first offer was obtained through the official affiliate UI, not automatic ingestion.

## User pricing revision

New publications and artwork require a real previous price above the current price. Show de/por, rounded-down percentage and exact savings. Include the complete coupon in Telegram text and both artwork formats when present. Use Publicidade as the public disclosure. Shared implementation in shared/discount.ts prevents divergent calculations. Amazon Creators API currently reports the account is not approved; no credentials can be provisioned from this account yet.
