# V3 Bahasa Melayu Full Content Quality Audit

## Coverage

Audited the complete BM subject boundary, all 14 current topic categories, BM sentence-quality utilities, Tutor AI context, teacher guidance and adaptive question context.

| Metric | Result |
|---|---:|
| Static questions checked | 760 |
| Generated samples checked | 5,000 |
| Topic/template categories | 14 |
| Repaired representative cases | 16 |
| Regenerated samples | 16 |
| Rejected samples | 0 |
| High-severity findings after repair | 0 |

## Semantic quality layer

`src/utils/bmSentenceQuality.js` now includes deterministic registries and checks for:

- verb–object compatibility (`membaca`, `menulis`, `makan`, `minum`, `memakai`, `menaiki`, `menyiram`, `menggosok` and related actions);
- verb–place and time-context compatibility;
- approved semantic roles and compound nouns;
- person-role distinctness;
- classifier checks such as `sebatang pensel` and `seekor kucing`;
- instrument placement using `dengan`;
- BM instruction quality, options and expected-answer presence;
- semantic and grammatical issue severity, confidence and repair output.

The BM subject is normalized at the data boundary. When a question sentence is repaired, the displayed question, matching answer fields and explanation references are updated together where they contain the original sentence. Question IDs, topic IDs, scoring fields and bank size are preserved.

## Representative semantic repairs

| Before | After |
|---|---|
| Di dalam kelas, Aina membaca pensel cerita bersama rakannya. | Di dalam kelas, Aina membaca buku cerita bersama rakannya. |
| Datuk berkebun bersama datuk. | Datuk berkebun bersama Nenek. |
| Ibu minum gelas air. | Ibu minum air. |
| Aina menulis pensel. | Aina menulis ayat dengan pensel. |
| Ali bermain bola dengan pensel. | Ali bermain bola bersama rakannya. |
| Adik menggosok nasi. | Adik menggosok gigi. |
| Pada waktu malam, murid menghadiri perhimpunan pagi. | Pada waktu pagi, murid menghadiri perhimpunan sekolah. |
| Seekor pensel. | Sebatang pensel. |

## Tutor AI BM checks

- Subject context remains `Bahasa Melayu`.
- Repaired sentence text is used in the child-facing question context.
- Internal set IDs and adaptive labels remain filtered.
- Early hints remain non-revealing.
- Explanations and answer context are generated from the normalized question object.

## Validation

- `bmFullContentQualityAudit.mjs`: PASS
- `bmSentenceQualityAudit.mjs`: PASS (1,000 generated samples; 760 source questions)
- English, guided-learning, modal, AI context, dashboard, UI and release-candidate audits: PASS
- Production build: PASS

## Responsive and read-aloud notes

Existing UI and overflow audits pass for mobile, tablet, desktop, long labels and modal text. Manual device and read-aloud verification remains a release-checklist activity.

## Known limitations

- The semantic registry is intentionally controlled and not a full Malay parser.
- Authored quotations, learner answers and free-form creative sentence responses require context-aware validation before future automatic repair.
- The build retains the existing large-main-chunk warning and ESM package warning.

## Recommendation

The BM bank is suitable for continued Release Candidate testing. Keep the semantic validator in the regression chain whenever new templates, vocabulary or adaptive builders are added.
