# Changelog

## 3.4.0 - 2026-08-21

### Tutor AI two-way teaching

- Upgraded Tutor AI from a one-response helper into a teacher that recognises knowledge, comparison, why, how, misunderstanding, alternative-explanation, confirmation, and clarification turns.
- Added short conversation memory so follow-up prompts such as requests for another example or a different explanation retain the current learning context.
- Converted suggested replies into accessible 44-pixel-or-larger buttons that continue the conversation directly.
- Kept answer evaluation in the shared Tutor AI engine to avoid conflicting or duplicated marking logic in the modal.

### Safe optional generative gateway

- Added an authenticated Supabase Edge Function with server-side Premium checks, rate limiting, strict origin control, and no service-role bypass.
- Minimized remote payloads by excluding profile IDs, names, progress, scores, XP, streaks, expected answers, accepted-answer banks, and complete sync records.
- Added personal-data redaction, local child-safety routing, input and output moderation, strict structured output, pseudonymous safety identifiers, and local fallback on every remote failure path.
- Kept the generative path disabled by default until the under-18 privacy, legal, parental-consent, and required data-control review is complete.

### Compatibility and data preservation

- Preserved all existing question, note, textbook, assessment, resume, and learning-sync data.
- Free accounts remain blocked from Tutor AI, while Premium access is also checked by the server before any generative request.
- The deployed `tutor-ai` endpoint requires a valid JWT; an unauthenticated smoke test returned HTTP 401.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Tutor conversation and generative-gateway privacy, safety, timeout, and fallback regressions passed.
- The Tutor AI production chunk is 17.66 kB against a 25 kB budget.
- Mobile acceptance at 390 pixels found no horizontal overflow and no browser runtime warnings.
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Complete Premium end-to-end acceptance on the newly deployed frontend before enabling any remote generative response.
- Keep the generative feature switches off until approved under-18 data controls and a supervised classroom pilot are complete.
- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
