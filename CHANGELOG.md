# CHANGELOG - V1.5.1 Quality Release

## Fixed

- Rebalanced BM, Math, English and Sains difficulty distribution to 40% mudah, 40% sederhana and 20% sukar.
- Removed exact repeated stems from BM, Math, English and Sains while preserving IDs, answers and topic structure.
- Filled accepted-answer arrays where older banks had empty values.
- Migrated localStorage keys from older V1.4/V1.5 names to V1.5.1 names without wiping progress.
- Updated app title and service worker cache labels to V1.5.1.
- Changed service worker navigation handling to network-first for HTML to reduce stale app-shell risk.
- Ignored local Vite dev-server log files.

## Verified

- `npm run build` passes.
- GitHub Pages base path remains `/jannati-ai-tutor-v1/`.
