import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPAIR_SUGGESTIONS = {
  missing_arabic_text: 'Tambah perkataan/ayat Arab asal',
  pronunciation_hint_missing: 'Tambah transliteration dan panduan sebutan',
  translation_mismatch: 'Semak padanan maksud Arab-BM',
  ambiguous_operation: 'Jelaskan operasi tambah/tolak/darab/bahagi',
  missing_unit: 'Tambah unit seperti cm, kg, RM, minit',
  unclear_numbers: 'Semak nombor dan konteks soalan',
  grammar_error: 'Semak struktur ayat Tahun 2',
  incorrect_tense: 'Guna perkataan sesuai tahap CEFR Tahun 2',
  incomplete_sentence: 'Lengkapkan ayat',
  inaccurate_concept: 'Semak fakta konsep sains',
  missing_context: 'Tambah situasi dunia sebenar',
  kbat_without_enough_information: 'Tambah sebab/mengapa/bandingkan',
  same_answer_pattern_repeated: 'Randomkan kedudukan jawapan',
  multiple_possible_answers: 'Jadikan pilihan jawapan lebih jelas',
  identical_question_text: 'Tambah variasi struktur ayat',
  same_wording_template_too_frequent: 'Tambah variasi struktur ayat',
  answer_not_matching_options: 'Selaraskan jawapan dengan pilihan',
  duplicate_answer_options: 'Semak pilihan jawapan yang berulang',
  no_correct_answer: 'Tambah jawapan yang betul',
  answer_without_question: 'Tambah konteks soalan',
  missing_instruction: 'Tambah arahan yang jelas',
  too_long: 'Ringkaskan ayat',
  awkward_malay_structure: 'Baiki ayat supaya lebih semula jadi',
  too_easy_or_ambiguous: 'Tambah konteks yang lebih jelas',
  non_year2_wording: 'Guna ayat yang lebih sesuai untuk Tahun 2',
  unclear_distractors: 'Baiki pilihan jawapan yang mengelirukan'
};

const PRIORITY_BY_SEVERITY = {
  Critical: 'P1',
  High: 'P1',
  Medium: 'P2',
  Low: 'P3'
};

const SUBJECT_LABELS = {
  bm: 'Bahasa Melayu',
  math: 'Matematik',
  english: 'English',
  sains: 'Sains',
  arab: 'Bahasa Arab',
  islam: 'Pendidikan Islam',
  pj: 'Pendidikan Jasmani',
  pk: 'Pendidikan Kesihatan'
};

const TOPIC_HINTS = {
  missing_arabic_text: 'Tambah teks Arab sebenar pada soalan dan jawapan.',
  pronunciation_hint_missing: 'Sediakan panduan sebutan yang mudah dibaca murid.',
  translation_mismatch: 'Semak semula padanan terjemahan Arab-BM supaya tepat.',
  ambiguous_operation: 'Nyatakan operasi matematik dengan lebih jelas dalam ayat.',
  missing_unit: 'Sebutkan unit yang diperlukan supaya jawapan tidak kabur.',
  grammar_error: 'Tukar kepada struktur ayat yang lebih natural dan ringkas.',
  incorrect_tense: 'Pilih kata kerja yang sesuai dengan masa dan tahap murid.',
  inaccurate_concept: 'Semak semula fakta atau contoh sains yang digunakan.',
  missing_context: 'Tambahkan latar situasi supaya soalan lebih lengkap.',
  kbat_without_enough_information: 'Sediakan maklumat yang cukup untuk murid membuat alasan.',
  same_answer_pattern_repeated: 'Ubah susunan jawapan supaya tidak terlalu berulang.',
  multiple_possible_answers: 'Hadkan soalan kepada satu jawapan jelas atau jelaskan lebih awal.',
  identical_question_text: 'Variasikan ayat tanpa mengubah objektif pembelajaran.',
  same_wording_template_too_frequent: 'Gunakan beberapa bentuk ayat yang setara.',
  answer_not_matching_options: 'Samakan pilihan jawapan dengan jawapan betul.',
  duplicate_answer_options: 'Pastikan pilihan jawapan tidak berulang.',
  no_correct_answer: 'Tambahkan jawapan yang tepat dan sah.',
  answer_without_question: 'Tambahkan stem soalan yang lengkap.',
  missing_instruction: 'Nyatakan tugas murid dengan lebih jelas.',
  too_long: 'Pendekkan ayat supaya mesra Tahun 2.',
  awkward_malay_structure: 'Baiki susunan kata supaya lebih semula jadi.',
  unclear_distractors: 'Perbaiki pilihan jawapan agar lebih seimbang.',
  too_easy_or_ambiguous: 'Beri konteks yang cukup untuk satu jawapan sahaja.'
};

function normalizeIssueType(issueType = '') {
  return String(issueType || '').trim();
}

function getRepairSuggestion(issueType = '') {
  return REPAIR_SUGGESTIONS[normalizeIssueType(issueType)] || 'Semak semula soalan dan konteks jawapan.';
}

function getRepairPriority(severity = '') {
  return PRIORITY_BY_SEVERITY[String(severity || '').trim()] || 'P3';
}

function getIssueExplanation(issueType = '') {
  const normalized = normalizeIssueType(issueType);
  if (normalized === 'missing_arabic_text') return 'Soalan atau jawapan Arab tidak memaparkan skrip Arab yang diperlukan.';
  if (normalized === 'pronunciation_hint_missing') return 'Petunjuk sebutan untuk bacaan Arab belum disediakan.';
  if (normalized === 'translation_mismatch') return 'Padanan maksud Arab-BM kelihatan tidak selaras.';
  if (normalized === 'ambiguous_operation') return 'Operasi matematik belum cukup jelas untuk satu jawapan tepat.';
  if (normalized === 'missing_unit') return 'Unit ukuran penting tidak disebut dalam soalan atau jawapan.';
  if (normalized === 'grammar_error') return 'Struktur ayat Inggeris nampak tidak natural untuk Tahun 2.';
  if (normalized === 'incorrect_tense') return 'Pilihan kata kerja Inggeris nampak tidak sesuai dengan tense yang diingini.';
  if (normalized === 'inaccurate_concept') return 'Fakta atau idea sains memerlukan semakan semula.';
  if (normalized === 'missing_context') return 'Soalan terlalu ringkas dan memerlukan konteks tambahan.';
  if (normalized === 'kbat_without_enough_information') return 'Soalan KBAT tidak memberi maklumat yang mencukupi.';
  if (normalized === 'same_answer_pattern_repeated') return 'Corak jawapan yang sama berulang dengan terlalu kerap.';
  if (normalized === 'multiple_possible_answers') return 'Lebih daripada satu jawapan nampak munasabah tanpa penjelasan tambahan.';
  if (normalized === 'identical_question_text') return 'Teks soalan sama berulang dalam set yang sama.';
  if (normalized === 'same_wording_template_too_frequent') return 'Templat ayat yang sama digunakan terlalu kerap.';
  if (normalized === 'answer_not_matching_options') return 'Jawapan tidak sepadan dengan pilihan yang dipaparkan.';
  if (normalized === 'duplicate_answer_options') return 'Pilihan jawapan mengandungi nilai berulang.';
  if (normalized === 'no_correct_answer') return 'Tiada jawapan betul yang dikenal pasti.';
  if (normalized === 'answer_without_question') return 'Ada jawapan tetapi tiada soalan lengkap.';
  if (normalized === 'missing_instruction') return 'Arahan murid terlalu pendek atau tidak jelas.';
  if (normalized === 'too_long') return 'Ayat melebihi tahap panjang yang selesa untuk Tahun 2.';
  if (normalized === 'awkward_malay_structure') return 'Struktur ayat Bahasa Melayu kedengaran kurang semula jadi.';
  if (normalized === 'unclear_distractors') return 'Pilihan jawapan belum cukup jelas untuk berfungsi sebagai pengganggu.';
  if (normalized === 'too_easy_or_ambiguous') return 'Soalan terlalu kabur atau terlalu mudah tanpa konteks.';
  if (normalized === 'non_year2_wording') return 'Wording mengandungi istilah yang terlalu teknikal untuk murid Tahun 2.';
  return 'Soalan memerlukan semakan kualiti lanjut.';
}

function getSubjectLabel(subject = '') {
  const normalized = String(subject || '').trim().toLowerCase();
  return SUBJECT_LABELS[normalized] || subject || 'Unknown';
}

function loadAuditReport(reportPath) {
  const fullPath = reportPath || path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../reports/validation/question-bank-audit-report.json');
  const content = readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}

export {
  getIssueExplanation,
  getRepairPriority,
  getRepairSuggestion,
  getSubjectLabel,
  loadAuditReport,
  normalizeIssueType,
  REPAIR_SUGGESTIONS,
  TOPIC_HINTS
};

export default {
  getIssueExplanation,
  getRepairPriority,
  getRepairSuggestion,
  getSubjectLabel,
  loadAuditReport,
  normalizeIssueType,
  REPAIR_SUGGESTIONS,
  TOPIC_HINTS
};
