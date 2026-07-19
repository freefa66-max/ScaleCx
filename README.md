# ScaleCX

ScaleCX is a bilingual customer-service platform under active development.

## Supabase connection

Target project: `emtygujjgdhsorkgmwjn`

The repository contains:

- A protected `early_access` table migration.
- A public Supabase Edge Function that performs validation, consent enforcement, spam filtering and server-side storage.
- No Supabase secret or service-role key in source control.

## Deployment

1. Apply `supabase/migrations/202607190001_create_early_access.sql`.
2. Set `ALLOWED_ORIGINS` and `IP_HASH_SECRET` as Edge Function secrets.
3. Deploy `supabase/functions/early-access` with JWT verification disabled because this is a public form; authorization and abuse controls are implemented in the function.
4. Test OPTIONS, rejected input, successful insertion and duplicate-email update.
5. Run Supabase security and performance advisors.

The function endpoint will be:

`https://emtygujjgdhsorkgmwjn.supabase.co/functions/v1/early-access`
