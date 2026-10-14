# Jannati AI Tutor 3.13.27 Release Notes

Status: stable
Tag: v3.13.27
Build date: 2026-10-14T16:30:29.048Z

## P1.16C Rich Interactive Expansion — Batch 1

- `MATH-BAHAGI-PILOT-001` now uses the existing `visualMath` equal-groups visual for `12 ÷ 2` → `6`.
- `MATH-BAHAGI-PILOT-003` now uses the existing `visualMath` equal-groups visual for `20 ÷ 4` → `5`.
- `MATH-PANJANG-PILOT-002` now uses the existing `measurement` interaction for the metre (`m`) unit.
- `MATH-JISIM-ISI-PADU-PILOT-004` now uses `imageChoice` for identifying a weighing scale.
- `SAINS-KEMAHIRAN_SAINTIFIK-021` now uses `imageChoice` for identifying a ruler.
- `ARAB-HURUF_HIJAIYAH-032` now uses `imageChoice` for identifying `ت` with its RTL semantics preserved.

## Preserved Learning Evidence

- The six source questions, IDs, wording, canonical and accepted answers, difficulty, marks, hints, explanations, and curriculum metadata are unchanged.
- Existing interaction primitives and lightweight visuals are reused; no renderer, engine, dependency, or external asset was added.
- The question bank remains at 4,530 questions, with 262 reviewed interactions and 1,254 runtime-interactive questions.
- Mobile-unsafe and accessibility-risk audit counts remain zero.

## Scope Boundaries

- No Supabase, database, schema, RPC, cloud-sync, reward, authentication, Premium, payment, STT, voice, Admin, or Parent logic changed.
- No physical iPhone, Android, VoiceOver, or TalkBack acceptance is claimed by this release preparation.
- The existing `MATH-NOMBOR-PILOT-007` iPhone acceptance exception remains open and is not reported as verified PASS.
- Wrong-answer feedback wording and mixed Arabic–Malay text ordering remain separate observations outside this release scope.

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.

## Validation Summary

- Status: pass
- Info: 14816
- Warnings: 0
- Errors: 0

## Curriculum Coverage

- Subjects: 8
- Topics: 84
- Questions: 4530
- Unique SK/SP pairs: 453
- Curriculum coverage: 100%
- Difficulty balance: mudah 2086, sederhana 1753, sukar 691

## Known Follow-ups

- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
