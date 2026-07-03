# UX Language Audit

Date: 2026-07-03
Sprint: Beta Preparation Sprint 2
Scope: UI language standardisation to Bahasa Melayu

## Consistency Rules

- Use Bahasa Melayu for all UI chrome, actions, labels, empty states, dialogs, popups, loading states, errors, and success messages.
- Keep English subject content, English questions, English passages, and English learning prompts unchanged.
- Use child-friendly verbs:
  - `Mula` for start actions
  - `Sambung` for continue/resume actions
  - `Semak` for check actions
  - `Simpan` for save actions
  - `Tutup` for close actions
  - `Latih Semula` for practice-again actions
- Use consistent feature names:
  - Dashboard: `Papan Utama`
  - Parent Dashboard: `Laporan Ibu Bapa`
  - AI Tutor: `Tutor AI`
  - Reading Coach: `Jurulatih Bacaan`
  - Listening Lab: `Makmal Mendengar`
  - Speaking Coach: `Jurulatih Bertutur`
  - Writing Coach: `Jurulatih Menulis`
  - Learning Path: `Laluan Belajar`
  - UASA Simulator: `Simulator UASA`
- Use `penguasaan` consistently for mastery, `liputan` for coverage, and `topik lemah/topik kuat` for weak/strong topics.
- Use `luar talian` for offline descriptions, while keeping technical identifiers and class names unchanged.

## Changed UI Labels

| Previous | Standardised Bahasa Melayu |
| --- | --- |
| Dashboard | Papan Utama |
| Parent / Parent Dashboard Pro | Ibu Bapa / Laporan Ibu Bapa |
| AI Tutor | Tutor AI |
| AI Recommendation | Cadangan AI |
| AI Recommendation for Parent | Cadangan AI untuk Ibu Bapa |
| Reading Coach | Jurulatih Bacaan |
| Listening Lab | Makmal Mendengar |
| Speaking Coach | Jurulatih Bertutur |
| Writing Coach | Jurulatih Menulis |
| Learning Path | Laluan Belajar |
| Today's Learning Journey | Laluan Belajar Hari Ini |
| Curriculum Coverage | Liputan Kurikulum |
| Curriculum Intelligence | Analisis Kurikulum |
| Mastery Summary | Ringkasan Penguasaan |
| Topic Mastery | Penguasaan Topik |
| Mastery Score | Skor Penguasaan |
| Mastered | Dikuasai |
| Learning | Sedang Belajar |
| Needs Practice | Perlu Latihan |
| Need Revision | Perlu Ulang Kaji |
| UASA Practice | Latihan UASA |
| UASA Simulator | Simulator UASA |
| Auto Resume | Sambung Automatik |
| Version | Versi |
| Build Date | Tarikh Binaan |
| Closed Beta Prep | Persediaan Beta Tertutup |
| Beta Feedback | Maklum Balas Beta |
| Category | Kategori |
| Details | Butiran |
| Save Feedback | Simpan Maklum Balas |
| Feedback saved locally. | Maklum balas disimpan pada peranti ini. |
| Storage recovered | Simpanan dipulihkan |
| Start Journey | Mula Laluan |
| Start Reading Coach | Mula Latihan Bacaan |
| Start Listening Lab | Mula Latihan Mendengar |
| Start Speaking Coach | Mula Latihan Bertutur |
| Start Writing Coach | Mula Latihan Menulis |
| Check Answer | Semak Jawapan |
| Check Text | Semak Teks |
| Check Transcript | Semak Transkrip |
| Check Writing | Semak Tulisan |
| Save Reading Result | Simpan Keputusan Bacaan |
| Save Lab Score | Simpan Skor Latihan |
| Save Speaking Result | Simpan Keputusan Bertutur |
| Save Writing Result | Simpan Keputusan Menulis |
| Close | Tutup |
| Practice | Latih |
| Teach Me | Ajar Saya |
| Hint | Petunjuk |
| Reset | Tetap Semula |
| Bookmark | Tanda Soalan |
| Bookmarked | Ditanda |
| XP gained | XP diterima |
| Coins gained | Syiling diterima |
| Offline Reading Coach | Jurulatih Bacaan Luar Talian |
| Offline Listening Lab | Makmal Mendengar Luar Talian |
| Offline Speaking Coach | Jurulatih Bertutur Luar Talian |
| Offline Writing Coach | Jurulatih Menulis Luar Talian |
| Weak Topics | Topik Lemah |
| Strong Topics | Topik Kuat |
| Teacher Snapshot | Ringkasan Guru |
| Classroom View | Paparan Kelas |
| Study Time | Masa Belajar |
| SK/SP Covered | SK/SP Diliputi |
| Missing SK/SP | SK/SP Belum Cukup |

## Empty States Standardised

- `Belum ada aktiviti pembelajaran`
- `Belum ada rekod bacaan`
- `Belum ada rekod mendengar`
- `Belum ada rekod bertutur`
- `Belum ada rekod menulis`
- `Belum ada topik lemah`
- `Belum ada topik kuat`
- `Belum ada sejarah UASA`
- `Belum ada aktiviti`

## Dialogs, Popups, And Messages

- Beta feedback dialog now uses Bahasa Melayu labels and categories: `Pepijat`, `Cadangan`, `Kandungan`, `AI`, `Pengalaman`.
- AI explain modal uses `Penerangan AI`, `Petunjuk`, and `Ajar Saya`.
- AI teacher modal uses `Guru AI`, `Penerangan`, `Contoh`, `Kesilapan biasa`, and `Tip ingatan`.
- Corrupted storage recovery messages now explain safe reset in Bahasa Melayu.
- UASA curriculum recommendation now uses Bahasa Melayu: `Fokus ... kerana liputan ... dan penguasaan ...`.

## Intentionally Kept English

- English subject name and English subject content.
- English questions, English passages, English listening/speaking/writing prompts, and expected English answers.
- Technical acronyms and terms used naturally in this product: `AI`, `UASA`, `SK/SP`, `XP`, `PDF`.
- Internal code identifiers such as `Dashboard`, `saveResult`, and `onStartTopic`; these are not visible UI strings.
