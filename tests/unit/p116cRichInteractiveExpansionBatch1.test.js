import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildInteractiveSuitabilityReport } from '../../src/ai/question/interactiveSuitability.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { getInteractiveQuestionConfig, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const CONTRACTS = Object.freeze({
  'MATH-BAHAGI-PILOT-001': {
    type: 'visualMath', correct: '6', distractors: ['2', '10'],
    source: { q: 'Hitung 12 ÷ 2.', question: 'Hitung 12 ÷ 2.', answer: 'Hasil bahagi 12 ÷ 2 ialah 6.', accepted: ['Hasil bahagi 12 ÷ 2 ialah 6.', '6'], acceptedAnswers: ['Hasil bahagi 12 ÷ 2 ialah 6.', '6'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Cari fakta darab 2 yang menghasilkan 12.', explanation: '2 × 6 = 12, maka 12 ÷ 2 = 6.', uasa: 'PBD Sumatif', dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2' }
  },
  'MATH-BAHAGI-PILOT-003': {
    type: 'visualMath', correct: '5', distractors: ['4', '16'],
    source: { q: 'Cari hasil bagi 20 ÷ 4.', question: 'Cari hasil bagi 20 ÷ 4.', answer: 'Hasil bagi 20 ÷ 4 ialah 5.', accepted: ['Hasil bagi 20 ÷ 4 ialah 5.', '5'], acceptedAnswers: ['Hasil bagi 20 ÷ 4 ialah 5.', '5'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Gunakan fakta 4 × 5.', explanation: '4 × 5 = 20, maka 20 ÷ 4 = 5.', uasa: 'PBD Sumatif', dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2' }
  },
  'MATH-PANJANG-PILOT-002': {
    type: 'measurement', correct: 'meter', distractors: ['sentimeter', 'kilogram'],
    source: { q: 'Apakah unit yang sesuai untuk mengukur panjang sebuah bilik darjah?', question: 'Apakah unit yang sesuai untuk mengukur panjang sebuah bilik darjah?', answer: 'Unit yang sesuai ialah meter (m).', accepted: ['Unit yang sesuai ialah meter (m).', 'meter', 'm'], acceptedAnswers: ['Unit yang sesuai ialah meter (m).', 'meter', 'm'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Bilik darjah jauh lebih panjang daripada sebuah buku.', explanation: 'Meter digunakan untuk mengukur jarak atau objek yang lebih panjang.', uasa: 'PBD Sumatif', dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2' }
  },
  'MATH-JISIM-ISI-PADU-PILOT-004': {
    type: 'imageChoice', correct: 'penimbang', distractors: ['pembaris', 'jam'],
    source: { q: 'Namakan alat yang digunakan untuk mengukur jisim buah-buahan.', question: 'Namakan alat yang digunakan untuk mengukur jisim buah-buahan.', answer: 'Alat itu ialah penimbang.', accepted: ['Alat itu ialah penimbang.', 'penimbang', 'alat penimbang'], acceptedAnswers: ['Alat itu ialah penimbang.', 'penimbang', 'alat penimbang'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Buah diletakkan di atas alat ini sebelum bacaan diambil.', explanation: 'Penimbang digunakan untuk mengukur jisim dalam gram atau kilogram.', uasa: 'PBD Sumatif', dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2' }
  },
  'SAINS-KEMAHIRAN_SAINTIFIK-021': {
    type: 'imageChoice', correct: 'pembaris', distractors: ['penimbang', 'cawan penyukat'],
    source: { q: 'Alat yang sesuai untuk mengukur panjang buku ialah ________.', question: 'Alat yang sesuai untuk mengukur panjang buku ialah ________.', answer: 'pembaris', accepted: ['pembaris'], acceptedAnswers: ['pembaris'], difficulty: 'sederhana', questionType: 'short_answer', marks: 1, hint: 'Pilih alat yang sesuai untuk panjang.', explanation: 'Pembaris sesuai digunakan untuk mengukur panjang buku.', uasa: 'Sains', dskp: 'KSSR' }
  },
  'ARAB-HURUF_HIJAIYAH-032': {
    type: 'imageChoice', correct: 'ت', distractors: ['ب', 'ث'],
    source: { q: 'Huruf manakah yang berbentuk seperti ب tetapi mempunyai dua titik di atas? Jawapannya ________.', question: 'Huruf manakah yang berbentuk seperti ب tetapi mempunyai dua titik di atas? Jawapannya ________.', answer: 'ت', accepted: ['ت'], acceptedAnswers: ['ت'], difficulty: 'sederhana', questionType: 'fill_blank', marks: 1, hint: 'Bandingkan bentuk keluarga huruf ب, ت dan ث.', explanation: 'Huruf ت berbentuk seperti ب tetapi mempunyai dua titik di atas.', uasa: 'PBD Sumatif', dskp: 'KSSR Arab' }
  }
});

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions));
const byId = new Map(questions.map(question => [question.id, question]));

describe('P1.16C rich interactive expansion Batch 1', () => {
  it('attaches exactly six approved overlays without changing source contracts', () => {
    expect(Object.keys(CONTRACTS)).toHaveLength(6);
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const question = byId.get(id);
      expect(question).toBeTruthy();
      expect(question).toMatchObject({ id, ...contract.source });
      expect(question.interaction.type).toBe(contract.type);
      expect(getInteractiveQuestionConfig(question)).toBe(question.interaction);
      expect(validateInteractiveQuestionConfig(question.interaction)).toEqual([]);
      expect(question.qualityReview).toMatchObject({ curriculum: expect.any(String), assessment: expect.any(String), textbook: expect.any(String) });
      expect(question.learningIntelligence.hintSteps).toHaveLength(3);
    }
  });

  it('accepts one canonical option and rejects every distractor', () => {
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const question = byId.get(id);
      expect(smartCheck(contract.correct, question).status).toBe('correct');
      contract.distractors.forEach(value => expect(smartCheck(value, question).status).not.toBe('correct'));
      expect(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct')).toHaveLength(1);
    }
  });

  it('uses equal-sharing models without encoding the quotient in visual metadata', () => {
    const contracts = [
      ['MATH-BAHAGI-PILOT-001', { kind: 'equalGroups', mode: 'divisionSharing', total: 12, groups: 2 }, '6'],
      ['MATH-BAHAGI-PILOT-003', { kind: 'equalGroups', mode: 'divisionSharing', total: 20, groups: 4 }, '5']
    ];
    for (const [id, visual, quotient] of contracts) {
      const interaction = byId.get(id).interaction;
      expect(interaction.visual).toEqual(visual);
      expect(interaction.visual).not.toHaveProperty('itemsPerGroup');
      expect(interaction.instruction).not.toMatch(new RegExp(`(?:ialah|hasil|jawapan)\\s+${quotient}\\b`, 'i'));
    }
  });

  it('keeps the measurement prompt neutral and accessible', () => {
    const interaction = byId.get('MATH-PANJANG-PILOT-002').interaction;
    expect(interaction.visual).toEqual({ kind: 'object', symbol: '↔', label: 'Gambaran panjang bilik darjah tanpa skala atau unit' });
    expect(JSON.stringify(interaction.visual)).not.toMatch(/meter|sentimeter|kilogram/i);
    expect(interaction.options.map(option => option.value)).toEqual(['meter', 'sentimeter', 'kilogram']);
  });

  it('uses labelled lightweight choices and safe Arabic RTL glyph metadata', () => {
    for (const id of ['MATH-JISIM-ISI-PADU-PILOT-004', 'SAINS-KEMAHIRAN_SAINTIFIK-021', 'ARAB-HURUF_HIJAIYAH-032']) {
      expect(byId.get(id).interaction.options.every(option => option.label && option.visual?.label)).toBe(true);
    }
    const arabicOptions = byId.get('ARAB-HURUF_HIJAIYAH-032').interaction.options;
    expect(arabicOptions.map(option => option.value)).toEqual(['ت', 'ب', 'ث']);
    expect(arabicOptions.every(option => option.visual.lang === 'ar' && option.visual.dir === 'rtl')).toBe(true);
  });

  it('continues to use the existing click, keyboard and touch-compatible choice engine', () => {
    const engine = fs.readFileSync(new URL('../../src/components/questions/InteractiveQuestionEngine.jsx', import.meta.url), 'utf8');
    const styles = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');
    expect(engine).toContain('onClick={() => onChange(String(option.value))}');
    expect(engine).toContain("['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']");
    expect(styles).toContain('min-height: 48px');
  });

  it('updates only the approved interaction totals and suitability categories', () => {
    const authored = questions.filter(question => question.interaction);
    const typeCounts = authored.reduce((counts, question) => {
      counts[question.interaction.type] = (counts[question.interaction.type] || 0) + 1;
      return counts;
    }, {});
    expect(authored).toHaveLength(262);
    expect(typeCounts).toEqual({
      imageChoice: 60, choice: 46, fillBlank: 97, ordering: 21, visualMath: 25,
      multiSelect: 2, money: 1, clock: 2, measurement: 3, dragDrop: 1,
      matching: 1, hotspot: 3
    });
    expect(questions.filter(question => getInteractiveQuestionConfig(question))).toHaveLength(1254);
    expect(buildInteractiveSuitabilityReport(subjects).summary.categories).toEqual({
      reviewed_interactive: 262, auto_safe: 992, teacher_review: 2668, keep_standard: 608
    });
  });

  it('keeps the prior iPhone acceptance exception factual and untouched', () => {
    expect(byId.get('MATH-NOMBOR-PILOT-007').interaction.type).toBe('visualMath');
    expect(Object.keys(CONTRACTS)).not.toContain('MATH-NOMBOR-PILOT-007');
  });
});
