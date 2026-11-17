# M1 — Multi-year foundation (design gate; no student rollout)

## Purpose and boundaries

This draft introduces a **fail-closed compatibility foundation** for a future Year 1 / Year 3 rollout without changing the currently deployed or locally selected Year 2 experience. The current 4,530 Year 2 questions, IDs, answers and progress keys remain canonical.

No Year 1 or Year 3 content is authored, loaded or made selectable. Curriculum mappings and cohort transitions must receive an independent KPM document + educator review before a new bank becomes `ready`. The planning catalog is **not** a claim of KPM sign-off.

## Contracts in this draft

| File | Contract |
| --- | --- |
| `src/config/curriculumBankCatalog.js` | Year + curriculum pair with `planned` / `ready` status. Only Year 2 KSSR-current is ready |
| `src/data/yearScopedSubjectLoader.js` | Opt-in guarded loader. Unready/unknown combinations fail closed; never use BM as the fallback for a planned year |
| `src/services/yearScopedLearningKeys.js` | Helpers for year/curriculum-scoped progress and Tutor conversation identifiers |
| `tests/unit/m1MultiYearFoundation.test.js` | Guards for Year 2 backward compatibility, Year 1/3 denial, ID separation, 4,530 unchanged questions |

### Compatibility invariant

- The legacy `loadSubjectData(id)` / `loadAllSubjects()` APIs and existing `SUPPORTED_STUDENT_YEARS = ['Tahun 2']` are untouched.
- Existing Year 2 progress keys remain `${subjectId}_${topicId}`.
- Existing Year 2 Tutor scope keys remain untouched.
- All new year-scoped APIs require an explicit year; missing years fail closed instead of selecting Year 2.
- The new guarded APIs intentionally are **not wired into App.jsx** or a selector. No new UI, premium claims, content availability or cloud writes follow from this draft.
- Future year keys use versioned, encoded segments; they do not reuse Year 2 identifiers.

### Known limitations — NOT MERGE-READY for actual multi-year support

1. **Integration absent:** `App.jsx`, session/resume handlers, adaptive progress, quota, report, reward and syncing call sites still require explicit year/curriculum propagation and migration tests.
2. **Identity:** account/child identity remains stable across years; *learning state* must be year- and curriculum-scoped. Do not split a child account when the same student progresses to another year.
3. **Question bank:** Year 1 (KP2027 planning candidate) and Year 3 (current KSSR planning candidate) have zero approved question records in this draft.
4. **Curriculum version:** a year is not a curriculum edition. Multiple editions may coexist and must require an explicit unambiguous selection; never silently convert Year 1/3 to Year 2.
5. **Safety:** no premature reward, grading, answers, hints or incomplete curriculum should appear in the UI. `teacher_review` required for authored content.
6. **Performance:** validate exact production flags and bundle gates separately; this unmerged branch must not affect v3.13.43 bundle recovery.
7. **Rollout:** owner-only synthetic QA first, browser and device acceptance later; real-child, paid rollout, Gate A2 and remote AI remain HOLD.

## Next implementation sequence (separate PRs)

- M1-B: Wire read-only current-year selection to the guarded loader while UI still exposes only Year 2; add negative Year 1/3 e2e fixtures.
- M1-C: Replace direct progress/resume/quota/reward/Tutor key construction with explicit year/curriculum-scoped contracts; add migration and cross-year isolation tests.
- M1-D: Add Parent Mode, analytics, login restore, multi-device/cloud safety checks and accessibility acceptance.
- M2: Author **draft** Year 3 core-subject pilot (BM, English, Math, Science), map each question to reviewed curriculum outcome.
- M3: Author KP2027 Year 1 pilot only once official cohort curriculum documents and teaching outcomes are verified.

## Merge and deployment policy

This PR is **DRAFT, CODE REVIEW ONLY**. CI PASS is not a release or a multi-year GO. Do not merge/deploy without the owner approving a separate integration gate after current release recovery. Do not modify production, immutable v3.13.42 tag, Supabase, Worker or student records.
