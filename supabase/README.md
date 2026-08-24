# Supabase database workflow

The production project is linked locally through ignored files under
`supabase/.temp`. Never commit access tokens, database passwords, or `.temp`.

## Authoritative database files

- `schemas/` is the read-only declarative snapshot pulled from production and
  adjusted to the intended least-privilege state.
- `migrations/` contains ordered production changes.
- `schema.sql` and `learning_data.sql` remain human-readable setup references.

## Safe workflow

1. Authenticate with `npx supabase login`.
2. Link the correct project with `npx supabase link --project-ref <ref>`.
3. Refresh the declarative snapshot with `npm run supabase:pull`.
4. Create a timestamped migration with `npx supabase migration new <name>`.
5. Review local and remote history with `npm run supabase:migrations`.
6. Preview production changes with `npm run supabase:push:dry`.
7. Run `npm run supabase:push` only after the dry-run is reviewed.

Never run `supabase db reset --linked` against production. It is destructive.
Do not use `--include-seed` for production deployments.

## Tutor AI Edge Function

The `tutor-ai` function is authenticated and Premium-gated, but its generative path is disabled unless both `TUTOR_AI_GENERATIVE_ENABLED` and `TUTOR_AI_U18_COMPLIANCE_CONFIRMED` are explicitly set to `true`. Input and output moderation plus a server-only `TUTOR_AI_SAFETY_SALT` are mandatory. Review `docs/engineering/TUTOR_AI_GENERATIVE_GATEWAY.md` before configuring or deploying it. Never commit `OPENAI_API_KEY` or expose it through a browser environment variable.
