# ScaleCX Roadmap

Status: In development  
Last updated: 2026-07-19

## Delivery rules

- Complete one coherent, testable increment at a time.
- Preserve Arabic/English parity, responsive behavior and accessibility.
- Never represent an integration as live before an end-to-end test passes.
- Keep secrets out of the repository and use only fictional development data.
- Protect every exposed Supabase table with RLS and least privilege.

## M0 — Positioning and validation

- [x] Create bilingual product positioning and conversion page.
- [x] Add responsive interactive service-workspace preview.
- [x] Add consent-based early-access form and campaign attribution.
- [ ] Deploy and verify the early-access database and Edge Function.
- [ ] Add approved launch pricing and FAQ.

## M1 — Secure application foundation

- [ ] Define tenant, workspace, user, membership and role models.
- [ ] Implement Supabase Auth and tenant-isolated RLS policies.
- [ ] Add audit logs, validation, rate limits and retention controls.
- [ ] Establish automated tests and deployment checks.

## M2 — Service desk MVP

- [ ] Build customer profiles and interaction history.
- [ ] Build ticket lifecycle, priorities, tags and ownership.
- [ ] Add queues, assignment rules and collision-safe handling.
- [ ] Implement SLA policies, timers, warnings and escalation.
- [ ] Add internal notes, saved replies, attachments and search.
- [ ] Build agent and supervisor dashboards.

## M3 — Channels

- [ ] Add email ingestion and outbound replies.
- [ ] Add a website live-chat widget.
- [ ] Add WhatsApp Cloud API with verified webhooks and templates.
- [ ] Add channel health, retry queues and delivery monitoring.

## M4 — Quality, insight and AI assistance

- [ ] Add CSAT surveys and reporting.
- [ ] Add QA scorecards, sampling and coaching.
- [ ] Add complaint taxonomy and root-cause reporting.
- [ ] Add SLA, FCR, resolution-time and backlog analytics.
- [ ] Add human-reviewed conversation summaries and grounded reply suggestions.
- [ ] Add PII controls, prompt-injection defenses and AI auditability.

## M5 — Commercial launch

- [ ] Complete accessibility, performance and security reviews.
- [ ] Run a controlled pilot using test or consented pilot data.
- [ ] Validate onboarding, billing, cancellation, renewal and support.
- [ ] Publish privacy terms, subprocessors and channel disclosures.
- [ ] Pass launch checks and change public status from In development to Live.
