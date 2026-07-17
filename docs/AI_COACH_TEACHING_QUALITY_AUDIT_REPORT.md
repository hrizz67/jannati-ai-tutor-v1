# AI Coach Teaching Quality Audit

Branch: `feature/adaptive-question-engine-v2`

Audit scope:
- `src/components/ai/AIExplainModal.jsx`
- `src/components/ai/AITeacherModal.jsx`
- `src/ai/explainEngine.js`
- `src/ai/teacherEngine.js`
- `src/ai/coach/knowledge/knowledgeAdapter.js`
- knowledge packs under `src/ai/coach/knowledge/subjects/`

## Overall Score

| Subject | Score | Status | Issues |
|---|---:|---|---|
| Bahasa Melayu | 93 | Excellent | A few fallback-style phrases still feel generic; encouragement reuse is visible across topics |
| Mathematics | 97 | Excellent | Very strong worked examples and step-by-step teaching; minor room for more real-life context in some topics |
| English | 91 | Good | Clear CEFR-aligned support; some wording still reads more templated than conversational |
| Science | 95 | Excellent | Strong scientific facts, observation prompts, and inquiry support; a few topics could add richer real-life links |
| Arabic | 84 | Needs improvement | Pronunciation and reading support exist, but some teacher explanations are still generic |
| Pendidikan Islam | 88 | Good | Terminology is consistent; could use more everyday application and adab-driven practice |
| Pendidikan Jasmani | 86 | Good | Safety and movement guidance are solid; teaching depth is lighter than BM/Math/Science |
| Pendidikan Kesihatan | 87 | Good | Practical and age-appropriate; some guidance is repetitive and could feel more scenario-based |

**Overall AI Coach teaching quality score: 90/100**

## Audit Method

This audit checked whether the AI Coach surfaces can consistently teach through:
- simple explanation
- teacher explanation
- examples
- extra examples
- memory tips
- common mistakes
- follow-up questions
- encouragement

It also checked whether the knowledge adapter gives a consistent fallback path when a pack is missing and whether each subject has a topic-specific teaching shape instead of a one-size-fits-all template.

## AI Explain Audit

### Findings

- The AI Explain flow is structurally strong: the modal can render explanation, examples, extra examples, tips, memory tips, common mistakes, and follow-up questions when the adapter provides them.
- The knowledge adapter returns subject-aware content and rotates list entries so repeated openings do not always show the same item first.
- Fallback behavior is consistent: when a pack cannot be loaded, the system falls back to the legacy explain engine instead of failing visibly.
- The legacy fallback text is safe, but it is still fairly generic compared with the knowledge-pack content.
- This means AI Explain is reliable, but the teaching quality depends heavily on the quality and specificity of the loaded pack.

### Strong points

- Mathematics and Science surface the richest explanation layers.
- BM has good topic-aligned examples and mistakes.
- English is clear and age-appropriate.
- Arabic, Islam, PJ, and PK all have dedicated pack fields rather than relying only on generic copy.

### Weak points

- Some fallback examples in the legacy explain engine are generic classroom reminders rather than subject-specific teaching.
- Arabic explanations can still feel template-like in a few places.
- A few subjects rely more on list-style content than on expanded teacher explanation.

## Ajar Saya Audit

### Findings

The Ajar Saya flow already follows a strong teaching sequence:
1. concept explanation
2. step-by-step teaching
3. example
4. common mistake
5. memory technique
6. practice question

The knowledge adapter improves this further by supplying:
- teacher explanation
- examples
- follow-up questions
- practice prompts
- profile-aware encouragement

### Strong points

- Mathematics is the strongest Ajar Saya subject because it uses worked examples and problem-solving steps naturally.
- Science is strong because it can teach with facts, observation prompts, and investigation ideas.
- BM is good for guided language learning and topic recognition.

### Weak points

- Arabic needs more visible pronunciation and reading scaffolding in some topics.
- PJ and PK are correct and safe, but they sometimes feel more list-driven than coached.
- Islam is consistent and respectful, but it would benefit from more everyday application examples.

## Subject-by-subject findings

### Bahasa Melayu

**Topics inspected:** `kata_nama`, `kata_kerja`, `kata_adjektif`, `penjodoh_bilangan`, `pemahaman_penulisan`

**Strengths**
- Strong topic separation and clear Year 2 language.
- Good use of name/verb/adjective/penjodoh patterns.
- Topic packs are rich enough to support both AI Explain and Ajar Saya.

**Weaknesses**
- Some encouragement and fallback phrasing is reused across packs.
- A few lines still read like a template rather than a teacher voice.

**Recommended improvement**
- Add more BM-specific variation in teacher tone and practice prompts.

### Mathematics

**Topics inspected:** `tambah`, `tolak`, `darab`, `bahagi`, `wang`, `masa`

**Strengths**
- Best overall teaching structure in the engine.
- Worked examples and problem-solving steps are very strong.
- Good alignment with the way a Year 2 teacher would explain a calculation.

**Weaknesses**
- A few explanations could use more real-life settings instead of pure calculation framing.

**Recommended improvement**
- Add more everyday contexts to reinforce meaning, not just computation.

### English

**Topics inspected:** `nouns`, `verbs`, `adjectives`, `prepositions`, `reading`

**Strengths**
- Clear, CEFR-appropriate grammar support.
- Examples and memory tips are practical for Year 2.
- The teaching flow is consistent across packs.

**Weaknesses**
- Some wording is still slightly templated.
- A few examples could sound more naturally like classroom English.

**Recommended improvement**
- Increase conversational classroom tone and reduce repeated instruction phrasing.

### Science

**Topics inspected:** `haiwan`, `tumbuhan`, `manusia`, `cahaya`, `bunyi`

**Strengths**
- Strong factual content and good scientific framing.
- Observation prompts and investigation ideas make the teaching active.
- Packs are well suited to simple “observe, compare, explain” teaching.

**Weaknesses**
- Some topics could use richer real-life examples and simpler cause-and-effect explanations.

**Recommended improvement**
- Expand real-life connections for a few topics without making the text longer.

### Arabic

**Topics inspected:** `huruf_hijaiyah`, `mufradat`, `ayat_mudah_arab`

**Strengths**
- Arabic script support is present.
- Pronunciation-related fields exist, which is important for this subject.
- Reading and writing practice are surfaced by the adapter.

**Weaknesses**
- Teacher explanations can still feel generic.
- Pronunciation guidance is not yet as rich as the rest of the content.
- This is the weakest subject for teaching consistency.

**Recommended improvement**
- Add more child-friendly pronunciation and reading scaffolds per topic.

### Pendidikan Islam

**Topics inspected:** `aqidah`, `ibadah`, `jawi`, `quran`, `akhlak`

**Strengths**
- Terminology is consistent and respectful.
- Daily practice and adab-based support are a good fit for the subject.
- The tone remains suitable for Year 2.

**Weaknesses**
- Some explanation lines are broad rather than topic-specific.
- More everyday practice examples would make the teaching stronger.

**Recommended improvement**
- Expand real-life examples and reflection prompts for each topic.

### Pendidikan Jasmani

**Topics inspected:** `pergerakan_asas`, `lokomotor`, `bukan_lokomotor`

**Strengths**
- Safety guidance is clear and appropriate.
- Movement-step content is useful and practical.
- The packs suit a “show me, try it, do it safely” style of teaching.

**Weaknesses**
- The teaching voice is slightly more list-like than conversational.
- Some practice guidance could be more explicit.

**Recommended improvement**
- Add more guided practice wording and short motivational coaching.

### Pendidikan Kesihatan

**Topics inspected:** `kebersihan_diri`, `pemakanan_sihat`, `keselamatan_diri`, `kesihatan_mental_emosi`, `gaya_hidup_sihat`

**Strengths**
- Practical, age-appropriate and easy to understand.
- Good real-life relevance for hygiene, nutrition, and emotions.
- Strong fit for Year 2 classroom teaching.

**Weaknesses**
- Some guidance repeats similar health phrasing across topics.
- A few topics could benefit from more scenario-based examples.

**Recommended improvement**
- Replace some repeated health reminders with small real-life situations.

## Consistency Audit

### AI Explain consistency

- Consistent structure across subjects.
- Pack-driven content works well for BM, Math, Science, English.
- Arabic / Islam / PJ / PK are present and usable, but the teacher voice is less rich in a few packs.

### Ajar Saya consistency

- Strongest consistency is in Mathematics.
- Science is close behind because it naturally supports inquiry-based teaching.
- The weakest subject experience is Arabic because pronunciation support needs more depth.

### Fallback behavior

- Adapter fallback is safe and does not break the UI.
- The legacy fallback copy is acceptable, but it is noticeably more generic than the knowledge-pack content.

## Priority Fix List

### P0 Critical

None.

### P1 Important

1. Strengthen Arabic pronunciation and reading scaffolding in more packs.
2. Replace generic fallback-style teaching lines with more topic-specific teacher language where possible.
3. Add more everyday application examples for Pendidikan Islam.
4. Make PJ and PK teaching prompts a little more guided and less list-like.

### P2 Enhancement

1. Reduce repeated encouragement phrasing across subjects.
2. Add more conversational English classroom tone.
3. Add more real-life context to selected Science and Mathematics topics.

## Summary

The AI Coach knowledge-based teaching layer is in good shape overall.

What is working well:
- subject-aware knowledge packs
- consistent teaching flow in both AI Explain and Ajar Saya
- fallback-safe behavior
- strong Mathematics and Science depth

What still needs attention:
- Arabic teaching richness
- more topic-specific teacher voice in a few subjects
- less template repetition in fallback-style wording

## Validation Result

- `node scripts/validate/knowledgeValidator.mjs`
  - `Critical: 0`
  - `High: 0`
  - `Medium: 0`
  - `Low: 0`
  - `duplicateFindings: 193`
  - `harmfulDuplicates: 0`
  - `acceptableSharedWording: 187`
  - `templateReuseSignals: 6`
- `node scripts/validate/questionValidator.js`
  - `0 errors, 12 warnings, 0 info`
- `node scripts/validate/speechRegression.mjs`
  - passed
- `npm run build`
  - passed
  - current main bundle warning remains above 500 kB, but build is successful

## Final Recommendation

**Release readiness for AI Coach teaching quality: YES, with targeted follow-up work for Arabic and template reduction.**

