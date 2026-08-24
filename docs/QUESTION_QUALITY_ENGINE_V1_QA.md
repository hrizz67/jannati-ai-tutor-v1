# Question Quality Engine v1 QA

## Overall QA Score

96/100

The new quality engine is selecting solid Year 2 questions with no answer or difficulty mismatches in the sampled sets. The main issue is still template diversity, especially where fill-in-the-blank or identify patterns repeat too often inside one subject sample.

## Subject Score Table

| Subject | Score | Finding |
| --- | ---: | --- |
| Bahasa Melayu | 94 | Good, but some repeated openings and repeated structure in the sample set |
| Mathematics | 98 | Strong and well-aligned |
| English | 89 | Acceptable, but too many fill-in-the-blank patterns |
| Science | 92 | Good, with a few repeated science sentence openings |

## Context Quality Findings

### Bahasa Melayu Tahun 2
- The sample set had proper context in most questions.
- Best examples used full sentence prompts such as `Baca ayat berikut...` and `Di sekolah...`.
- Weakest issues were repeated openings and repeated structure, not missing context.

### Mathematics Tahun 2
- Context was strong in the word-problem set.
- Calculation items were also clear enough for Year 2.
- No short or incomplete prompts were found in the sampled 20 questions.

### English Tahun 2
- Context was understandable and grammatically safe.
- The sample set is heavily fill-in-the-blank based, so the surface feels less varied than the Arabic teaching standard.
- This is acceptable for Year 2 grammar practice, but the question style should be broadened later.

### Science Tahun 2
- Context was clear and scientifically correct in the sample set.
- Questions were accurate, but the repeated opening `Bahagian tumbuhan yang...` appeared several times.
- The science questions still read as valid teaching items, just with template repetition.

## Answer Accuracy

- Single-answer detection worked correctly in the sampled sets.
- No ambiguous answers were flagged in the 20-question samples.
- No multiple-answer cases were incorrectly treated as single-answer items in the sampled sets.
- No answer mismatches were found between the sampled question text and expected answers.

## Difficulty Alignment

- Easy items were mostly recognition or direct recall.
- Medium / application-style items were present where expected.
- Hard / KBAT style was not strongly represented in the sampled sets, which is acceptable for the tested Year 2 fundamentals.
- No difficulty mismatches were found in the sampled questions.

## Template Repetition

### Observed patterns
- Bahasa Melayu: repeated opening `Di meja belajar` appeared twice in the sample.
- Mathematics: the sample was dominated by one style, but the wording remained strong and clear.
- English: nearly all sampled items used the same fill-in-the-blank pattern.
- Science: the opening `Bahagian tumbuhan yang` repeated several times.

### Assessment
- This is not a blocking problem.
- It does mean the quality engine should keep watching diversity when the same topic is sampled repeatedly.
- The engine is doing a good job of keeping answer correctness intact even when wording is repetitive.

## Human Teacher Score

| Subject | Score | Status |
| --- | ---: | --- |
| Bahasa Melayu | 94 | Ready for student |
| Mathematics | 98 | Ready for student |
| English | 89 | Acceptable |
| Science | 92 | Ready for student |

## Top 10 Good Questions

1. BM `BM-KATA_NAMA_AM-001` - `Baca ayat berikut: Siti membaca buku di ruang tamu. Apakah kata nama am bagi benda dalam ayat itu?`
2. BM `BM-KATA_NAMA_KHAS-001` - `Di dalam kelas, Aina membaca buku cerita bersama rakannya. Nyatakan kata nama khas bagi nama murid dalam ayat ini.`
3. BM `BM-KATA_KERJA-001` - `Di rumah, adik menyanyi lagu kegemaran sambil mengemas mainan. Apakah kata kerja dalam ayat ini?`
4. BM `BM-PENJODOH_BILANGAN-001` - `Di meja belajar, Amir meletakkan se________ pensel warna.`
5. Math `MATH-TAMBAH-001` - `Danish ada 25 pensel. Ibu memberi 10 pensel lagi. Berapakah jumlah pensel Danish?`
6. Math `MATH-TOLAK-001` - `Danish ada 46 pelekat. Dia memberikan 11 pelekat kepada kawannya. Berapakah baki pelekat Danish?`
7. Math `MATH-DARAB-001` - `2 x 3 = ________.`
8. English `ENG-NOUNS-001` - `A ________ is swimming in the pond.`
9. Science `SAINS-HAIWAN-001` - `Kucing memerlukan ________ untuk terus hidup.`
10. Science `SAINS-TUMBUHAN-001` - `Bahagian tumbuhan yang disebut akar berfungsi untuk ________.`

## Top 10 Weak Questions

The sampled set had no failing questions, so the weakest items are the ones with the most repetition or least varied surface style.

1. English `ENG-SENTENCES-001` - `Fill in the blank. I ________ a pupil.` - Repeated fill-in pattern.
2. English `ENG-SENTENCES-002` - `Write the missing word. She ________ my friend.` - Repeated fill-in pattern.
3. English `ENG-SENTENCES-003` - `Read the sentence. They ________ happy.` - Repeated fill-in pattern.
4. English `ENG-SENTENCES-004` - `Look at the sentence. This is ________ apple.` - Repeated fill-in pattern.
5. English `ENG-SENTENCES-005` - `Choose the correct answer. This is ________ book.` - Repeated fill-in pattern.
6. Science `SAINS-TUMBUHAN-001` - `Bahagian tumbuhan yang disebut akar berfungsi untuk ________.` - Repeated opening with other plant-part items.
7. Science `SAINS-TUMBUHAN-002` - `Bahagian tumbuhan yang disebut batang berfungsi untuk ________.` - Repeated opening with other plant-part items.
8. Science `SAINS-TUMBUHAN-003` - `Bahagian tumbuhan yang disebut daun berfungsi untuk ________.` - Repeated opening with other plant-part items.
9. BM `BM-KATA_GANTI_NAMA-013` - `Situasi: Amir, Hakim dan Danish membersihkan kelas bersama-sama. ________ bekerjasama dengan baik.` - Repeated wording signal.
10. BM `BM-KATA_HUBUNG-003` - `Semasa berjalan ke kelas, Sara membawa payung ________ hari hujan.` - Repeated wording signal.

## Why the Weak Questions Are Weak

- They are not incorrect.
- They are weaker because they repeat the same prompt family or sentence opening too often.
- English and Science are the most template-heavy in this sample.
- The quality engine should keep the diversity penalty active so the same pattern does not dominate a session.

## Recommended Next Improvement

1. Add more varied English sentence patterns beyond fill-in-the-blank for grammar practice.
2. Mix more Science prompt types such as compare, predict, and explain in addition to sentence completion.
3. Continue watching Bahasa Melayu repeated openings so short template clusters do not grow inside a session.
4. Keep the current quality engine logic; it is already strong on context, answer accuracy, and difficulty alignment.

## Validation

- `node scripts/validate/questionQualityValidator.js` — PASS
  - Critical: 0
  - High: 0
  - Medium: 0
  - Low: 55
- `node scripts/validate/questionValidator.js` — PASS: 0 errors, 12 warnings, 0 info
- `npm run build` — PASS

## Blocking Issues

None.

The quality engine is safe to keep in the selection path. The remaining findings are diversity/style observations rather than correctness failures.
