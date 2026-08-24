# V3 Canonical Progress Model

## Purpose

Progress is normalized at the boundary before dashboards, UASA, parent reports and rewards consume it. The model keeps global totals, subject totals, topic mastery, activities, revision entries and UASA sessions separate.

## Source and migration

`src/utils/canonicalProgress.js` accepts legacy profile/adaptive shapes, clamps percentages, removes non-finite numbers and supplies the eight subject buckets (`bm`, `english`, `math`, `sains`, `arab`, `islam`, `pj`, `pk`). Subject-scoped UASA state is persisted through `src/utils/subjectScopedStorage.js`.

Parent aggregation now merges the canonical/adaptive history rather than displaying zeroes when ordinary profile fields are sparse.

## Safety guarantees

- malformed JSON/storage is ignored safely;
- percentages are clamped to 0–100;
- active UASA sessions are separate from completed history;
- global XP/level and subject metrics are not conflated;
- no UI value is allowed to render `undefined`, `null`, `NaN` or `Infinity`.

## Validation

`canonicalProgressAudit.mjs` and `parentAnalyticsAggregationAudit.mjs` pass. Full device refresh/migration testing remains in the manual checklist.
