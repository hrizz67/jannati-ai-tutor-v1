# Final AI Coach Quality Audit

## Summary

This is a read-only audit of coach-facing content across the repository. The strongest findings are not in one single engine; they come from a repeated pattern of generic teaching copy, subject-agnostic fallback text, and a few internal-label leaks into user-facing recommendations.

### Estimated scores

- Release Readiness Score: 63/100
- AI Coach Quality Score: 66/100
- Content Diversity Score: 57/100

### Overall assessment

The repository is close to release in structure, but coach copy still feels template-led in several surfaces. BM has the richest scaffolding but also the most repetition. English, Math, Science, Arabic, Islam, PJ, and PK often fall back to generic guidance because the shared learning-copy classifier is BM-centric. Parent-facing advice is helpful, but a few strings still expose internal identifiers.

## Method

Reviewed the following coach-copy surfaces and generators:

- `src/ai/learningCopy.js`
- `src/ai/teacherEngine.js`
- `src/ai/explainEngine.js`
- `src/ai/coach/*`
- `src/ai/personality/*`
- `src/ai/narrative/*`
- `src/ai/observation/learningInsightEngine.js`
- `src/ai/adaptive/parentReportEngine.js`
- `src/ai/parentAnalytics/*`
- `src/ai/prediction/*`
- `src/dashboard/*` for visible coach/report surfaces

I also cross-checked validator outputs already present in the repo:

- BM style validator: 800 questions, 768 unique stems, 0 repeated stem groups, 788 repeated hint templates, 768 repeated explanation templates, 0 confirmed DBP issues, 148 possible DBP issues.
- English style validator: 500 questions, 454 unique stems, 16 repeated stem groups, 92 repeated hint templates, 105 repeated explanation templates, 30 CEFR outliers.
- Question validator: 12 warnings, concentrated in BM `pemahaman_penulisan` and English `sentences`.

## Diversity snapshot by subject

| Subject | Total questions | Generic coach fallback | Unique hints | Unique explanations | Notes |
|---|---:|---:|---:|---:|---|
| Bahasa Melayu | 800 | 26.0% | 112 | 189 | Best subject-specific coverage, but still highly templated. |
| English | 500 | 100.0% | 92 | 105 | All questions fall back to the generic category. |
| Matematik | 800 | 84.5% | 178 | 602 | Most content gets generic BM scaffolding. |
| Sains | 500 | 86.0% | 95 | 486 | Good factual content, weak topic-specific coaching variety. |
| Bahasa Arab | 500 | 77.2% | 69 | 432 | Support text is mostly generic and not skill-specific enough. |
| Pendidikan Islam | 500 | 96.6% | 374 | 494 | Strong factual base, but coach copy is still mostly generic. |
| Pendidikan Jasmani | 500 | 34.0% | 96 | 248 | Better than most, but many prompts still repeat. |
| Pendidikan Kesihatan | 500 | 24.4% | 45 | 199 | The most repetitive subject for hint variety. |

## High-priority issues

| Subject | Topic / surface | Current content | Problem | Severity | Recommended improvement |
|---|---|---|---|---|---|
| Bahasa Melayu | `Tip Ingatan` in `src/ai/learningCopy.js` | `Tip Ingatan` blocks such as `NAMA ORANG = Ali, Aiman, Siti, Farah` (and similar blocks for place/animal/object/verb/adjective/penjodoh/simpulan/conjunction/sendi) | The icon prefix is encoded inconsistently and the same memory-tip format is reused across many categories. | High | Replace the unstable icon prefix with a stable icon component or plain text, and diversify the tip framing so each topic family feels distinct. |
| Bahasa Melayu | `Contoh` / `Contoh Lain` via `getLearningExamples()` | Person examples always reuse `Ali, Aiman, Siti, Farah`; place examples reuse `padang, sekolah, hospital, kedai, pasar`; animal/object examples are also fixed. | Examples are valid, but too small a pool makes the guidance feel repetitive across unrelated topics. | Medium | Expand and rotate examples by topic family, while keeping the same educational objective. |
| Bahasa Melayu | `Ajar Saya` / `Terangkan` in `teacherEngine.js` and `explainEngine.js` | `Ini ialah nama orang yang sesuai dengan soalan.` / `Jawapan ini betul kerana ia ialah nama orang yang sesuai dengan soalan.` | Explanations are accurate at category level, but they read like category labels rather than topic-teaching answers. | Medium | Add topic-specific reasoning for key BM grammar areas so the explanation teaches the exact concept, not just the category. |
| Bahasa Melayu | `Kesilapan Biasa` in `teacherEngine.js` / `explainEngine.js` | `Memilih nama tempat.`, `Memilih kata kerja.`, `Menjawab terlalu cepat.`, `Tidak semak ayat penuh.` | The common-mistake list is useful, but it repeats the same few error patterns across many BM topics. | Medium | Replace broad mistake buckets with topic-linked mistakes, especially for grammar topics such as kata nama, kata kerja, kata hubung, dan penjodoh bilangan. |
| Bahasa Melayu | `Petunjuk` in `explainEngine.js` | `Baca soalan sekali lagi dan cari kata kunci penting.` | Safe, but generic; many BM questions get the same hint language. | Medium | Use more topic-aware hints, e.g. grammar clues, sentence-structure prompts, or answer-type prompts. |
| English | `AI Explain`, `Ajar Saya`, `Petunjuk` via `detectLearningCategory()` | 500/500 questions fall into the `generic` category. | The learning-copy classifier is BM-centric, so English content does not receive subject/skill-specific coaching. | High | Add English-aware category detection and English-specific coaching templates before release. |
| English | Question bank / coaching repetition | Validator still reports 16 repeated stem groups, 92 repeated hint templates, 105 repeated explanation templates, and 30 CEFR outliers. | English pedagogy is still template-heavy and some wording is outside Year 2 CEFR comfort. | High | Reduce repeated stems and align explanations/hints to shorter Year 2 classroom English. |
| Matematik | `Ajar Saya` / `Terangkan` | 676 of 800 questions fall back to `generic`. | Math explanations are not consistently math-aware; most guidance is shared generic wording. | High | Introduce math-specific coaching paths (number, operation, money, time, measure, shape, data) so explanations mention the actual concept. |
| Matematik | `Tip` / `Petunjuk` | Generic coaching phrases such as `Baca soalan perlahan-lahan dan cari kata kunci.` dominate. | Helpful, but too little math-specific hinting for problem-solving questions. | Medium | Add calculation, unit, and word-problem hint patterns. |
| Sains | `AI Explain` / `Contoh` | 430/500 questions are treated as generic. | Science topics get correct basic support, but topic-level guidance is limited. | High | Split coach copy by Science domain: living things, plants, energy, light, sound, Earth, weather, and safety. |
| Sains | `Kesilapan Biasa` | Generic misunderstanding warnings repeat across topics. | The same mistake patterns are reused too often, reducing instructional value. | Medium | Make mistake lists topic-specific (for example, plant parts vs. animal needs vs. light/shadow). |
| Bahasa Arab | `AI Explain` / `Petunjuk` | 386/500 questions fall into generic fallback; Malay support text is reused broadly. | Arabic skills (greetings, numbers, colours, family, objects, animals, food) do not get distinct coaching enough. | High | Build Arabic skill-specific coach copy, especially for reading, matching, and daily conversation. |
| Bahasa Arab | RTL / rendering support | Coach copy mostly appears as Malay scaffolding around Arabic text. | Content is understandable, but the pedagogy does not clearly separate Arabic rendering from Malay support. | Medium | Keep Malay support concise and pair it with skill-specific Arabic prompts and RTL-safe examples. |
| Pendidikan Islam | `AI Explain` / `Tip` | 483/500 questions fall into generic fallback. | The coach layer does not reflect Islamic content distinctions (aqidah, ibadah, akhlak, sirah, Jawi, doa). | High | Add Islamic-topic coaching templates so explanations use the right terminology and context. |
| Pendidikan Islam | `Ajar Saya` / `Kesilapan Biasa` | Generic explanations are doing most of the work. | Many questions need term-specific support; generic lines are not enough for Jawi, Rukun, doa, and adab content. | Medium | Create topic-linked Islamic examples, especially for Jawi and adab-based questions. |
| Pendidikan Jasmani | `Petunjuk` / `Kesilapan Biasa` | `Lokomotor ialah pergerakan yang berpindah tempat.` / `Fikirkan keselamatan rakan.` | The guidance is clear, but repeated safety and movement lines dominate. | Medium | Diversify by movement skill, coordination, games, fitness, and safety scenario. |
| Pendidikan Kesihatan | `Tip` / `Encouragement` | `Gaya hidup sihat baik untuk tubuh dan emosi.` / `Teruskan usaha yang baik!` | Very repetitive across hygiene, nutrition, emotions, and personal safety topics. | High | Add topic-specific health coaching so the advice distinguishes hygiene, food choices, safety, and emotions. |
| Janna Coach | `Motivation` / `Encouragement` | `Janna sangat bangga dengan kemajuan kamu.` / `Janna ada di sini untuk membantu kamu.` / `Teruskan usaha yang baik.` | Warm and safe, but repeated across many states and subjects with low variety. | Medium | Keep the tone, but rotate by subject and situation so encouragement feels less scripted. |
| Jati Coach | `Greeting` / `Motivation` / `Farewell` | `Kita bergerak perlahan supaya setiap langkah jelas.` / `Kekalkan disiplin ini...` / `Selesai untuk sekarang...` | Good analytical tone, but subject/topic relevance is still weak; it sounds like one coach for everything. | Medium | Add topic-aware references so Jati can name the skill or topic under discussion. |
| Adaptive recommendation | `buildStudyAdvice()` and `generateParentReport()` | `Fokus kepada 2 topik lemah dahulu, termasuk ${focus.topicId}.` / `Menguasai ${bestSubject.subjectId}.` / `${subjectAnalytics.subjectId} memerlukan lebih latihan.` | Internal identifiers leak into learner/parent-friendly language. | High | Replace `subjectId`/`topicId` with human-readable names before any user-facing rendering. |
| Parent analytics | `buildSubjectComparison()`, `buildImprovement()`, `buildParentRecommendation()`, `buildLearningTimeline()` | Mostly strong and readable, but a lot of copy resolves to `Belum cukup data...` across cards. | The section is useful, but several cards share the same fallback tone and lose distinction. | Medium | Add more distinct empty-state copy per card type while keeping the data model unchanged. |
| Narrative surfaces | `progressNarrative`, `achievementNarrative`, `encouragementNarrative`, `dailyGreetingNarrative`, `learningJourneyNarrative` | `Bagus! Kamu semakin yakin...`, `Tak mengapa. Kita cuba sekali lagi.`, `Selamat datang semula. Jom kita sambung belajar.` | Friendly, but short phrase reuse is high and the narratives rarely mention the actual topic. | Medium | Keep the warmth, but route the narratives through topic-aware inputs so they can mention the skill being learned. |

## Subject-by-subject notes

### Bahasa Melayu

- Strengths: best-developed topic-specific scaffolding in the repo.
- Gaps: `Tip Ingatan` is visually corrupted in source, and the same small example sets repeat across large grammar families.
- Highest priority BM topics: kata nama, kata kerja, kata adjektif, penjodoh bilangan, simpulan bahasa, kata hubung, kata sendi nama.

### English

- Strengths: simple vocabulary, short prompts.
- Gaps: the shared coach classifier does not distinguish English skills, so the guidance is generic for the entire subject.
- Highest priority topic: `sentences` (validator still flags repeated stem groups and CEFR outliers).

### Matematik

- Strengths: arithmetic content itself is generally well-structured.
- Gaps: coach copy is far too generic for word problems, money, time, measurement, and fraction concepts.
- Highest priority topics: operation word problems, unit-based questions, and money/time items.

### Sains

- Strengths: factual material is mostly clear and age-appropriate.
- Gaps: science-specific coaching layers are thin; many prompts read like generic study advice.
- Highest priority topics: living things, plants, energy, light, sound, weather, safety.

### Bahasa Arab

- Strengths: basic vocabulary recall and matching are clear.
- Gaps: most support text is generic Malay scaffolding; skill-specific coaching is limited.
- Highest priority topics: greetings, numbers, family, colours, objects, animals, food.

### Pendidikan Islam

- Strengths: terminology is generally on the right track.
- Gaps: coach explanations do not consistently distinguish aqidah, ibadah, akhlak, sirah, doa, and Jawi.
- Highest priority topics: Jawi, Rukun Islam/Rukun Iman, adab, doa harian.

### Pendidikan Jasmani & Kesihatan

- Strengths: safety and movement guidance is understandable.
- Gaps: repeating the same safety prompts makes the guidance feel templated.
- Highest priority topics: locomotor/non-lokomotor, coordination, hygiene, nutrition, emotions, personal safety.

## Top 20 improvements before Release Candidate

1. Replace the corrupted `🧠 Tip Ingatan` prefix with a stable icon or plain text in BM coach tips.
2. Expand BM example pools so `Contoh`/`Contoh Lain` do not feel recycled across many topics.
3. Add topic-specific BM explanations for grammar families instead of only category-level explanations.
4. Diversify BM `Kesilapan Biasa` beyond the same four or five mistake patterns.
5. Add English-aware category detection so `AI Explain` and `Petunjuk` are not 100% generic.
6. Reduce English repeated stem groups and CEFR outliers.
7. Build math-specific coaching for operations, word problems, money, time, and measurement.
8. Add science-specific coach copy by topic domain.
9. Build Arabic skill-specific support for reading, matching, and conversation tasks.
10. Add Islamic-topic coaching for Jawi, aqidah, ibadah, akhlak, sirah, and doa.
11. Make PJ coach copy vary by movement skill instead of only generic safety lines.
12. Make PK coach copy vary by hygiene, nutrition, emotions, and personal safety.
13. Remove internal `subjectId` / `topicId` leaks from parent advice strings.
14. Replace repeated parent fallbacks with card-specific, more distinct copy.
15. Keep Janna warm, but vary encouragement phrases by scenario and subject.
16. Make Jati topic-aware so the analytical voice names the actual skill or topic.
17. Route narrative messages through subject/topic context where possible.
18. Reduce duplicate fallback messages in narrative surfaces (`Tak mengapa...`, `Teruskan usaha...`).
19. Audit `AI Explain` and `Ajar Saya` outputs for subject relevance on non-BM subjects.
20. Re-run the content validators after any coach-copy cleanup to confirm the template ratio improves without hurting clarity.

## Release recommendation

**Recommendation: Remediation required before Release Candidate freeze.**

The repository is structurally strong, but the coach layer still relies on a lot of shared wording and fallback text. The biggest release risk is not correctness; it is that many users will feel the coaching is generic, repetitive, or occasionally exposed to internal IDs. The good news is that the issues are concentrated in a handful of shared generators, so this is a tractable cleanup rather than a whole-system rewrite.
