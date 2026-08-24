# Performance P2 Report

## Outcome

Performance P2 passes its architecture and production bundle budgets. The work reduces initial parsing pressure, prevents every subject bank from loading during dashboard startup, and preserves on-demand access to complete learning data.

## Production comparison

| Metric | Before | After | Outcome |
| --- | ---: | ---: | --- |
| Entry JavaScript | 700.76 kB | 300.43 kB | 57.1% smaller |
| Entry gzip | 198.43 kB | 84.21 kB | 57.6% smaller |
| Largest JavaScript chunk | 699.22–700.76 kB | 456.55 kB | Below the 480 kB repository budget |
| BM base chunk | 551.61 kB | 456.55 kB | Enrichment isolated into a 95.16 kB cacheable chunk |
| Mathematics base chunk | 543.40 kB | 272.10 kB | Enrichment isolated into a 271.48 kB cacheable chunk |
| Supabase SDK | Initial graph | Deferred account chunk | Not preloaded by production HTML |
| Tutor AI modal | Initial graph | 11.21 kB lazy chunk | Loaded only when requested |

The BM and Mathematics total authored content is intentionally unchanged. Splitting reduces single-chunk download, parse and cache invalidation cost without deleting questions or weakening the learning journey.

## Loading policy

- The selected subject loads first.
- Other subject banks preload only after the dashboard is visible, a 3.5-second delay, and an idle-browser opportunity.
- Background subject preload is disabled while offline, when Data Saver is active, or on a 2G-class connection.
- Adaptive Practice explicitly hydrates all required subject data before generating a session.
- Supabase loads asynchronously and is cached after its first request.
- Tutor AI uses a lazy boundary with an accessible loading dialog and cancel action.
- The service worker registers only in production so local QA cannot receive stale source modules.

## Automated gates

Run:

```text
npm run validate:performance
npm run build
```

Every `npm run build` automatically runs `scripts/validate/bundleBudgetAudit.mjs` through `postbuild`. The build fails when:

- The entry chunk exceeds 350 kB.
- Initial JavaScript referenced by production HTML exceeds 900 kB.
- Any JavaScript chunk exceeds 480 kB.
- Tutor AI exceeds 25 kB or returns to the initial HTML graph.
- Supabase returns to the initial HTML graph.

## Remaining performance boundary

The 970 kB optimized Jati PNG remains the largest media asset. It does not block JavaScript parsing, but responsive image sizing or a smaller modern-format variant is the next media optimization candidate. Real-device Core Web Vitals should be recorded during the physical-device acceptance run.
