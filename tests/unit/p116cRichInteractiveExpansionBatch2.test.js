import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAnswerRevealPolicy } from '../../src/ai/policy/answerRevealPolicy.js';
import { buildInteractiveSuitabilityReport } from '../../src/ai/question/interactiveSuitability.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { getInteractiveQuestionConfig, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const CONTRACTS = Object.freeze({
  'BM-KATA_NAMA_AM-006': {
    type: 'imageChoice', correct: 'kasut', distractors: ['rak', 'sekolah'],
    source: { q: 'Adik menyimpan kasut di rak selepas pulang dari sekolah. Cari kata nama am bagi benda yang dipakai.', question: 'Adik menyimpan kasut di rak selepas pulang dari sekolah. Cari kata nama am bagi benda yang dipakai.', answer: 'kasut', accepted: ['kasut'], acceptedAnswers: ['kasut'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Cari nama benda yang dipakai.', explanation: 'kasut ialah kata nama am bagi benda.', uasa: 'PBD Sumatif', dskp: 'KSSR Tahun 2' }
  },
  'ENG-NOUNS-006': {
    type: 'imageChoice', correct: 'cat', distractors: ['dog', 'cow'],
    source: { q: 'A ________ says meow.', question: 'A ________ says meow.', answer: 'cat', accepted: ['cat'], acceptedAnswers: ['cat'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Choose the animal that says meow.', explanation: 'A cat says meow.', uasa: 'PBD Sumatif', dskp: 'Malaysian Year 2 CEFR' }
  },
  'SAINS-HAIWAN-023': {
    type: 'imageChoice', correct: 'bulu pelepah', distractors: ['sisik', 'cangkerang'],
    source: { q: 'Badan burung dilitupi ________.', question: 'Badan burung dilitupi ________.', answer: 'bulu pelepah', accepted: ['bulu pelepah'], acceptedAnswers: ['bulu pelepah'], difficulty: 'sederhana', questionType: 'short_answer', marks: 1, hint: 'Lihat bahagian luar badan haiwan.', explanation: 'Burung mempunyai bulu pelepah pada sayap dan badan.', uasa: 'Sains', dskp: 'KSSR' }
  },
  'SAINS-HAIWAN-022': {
    type: 'fillBlank', correct: 'sisik', distractors: ['bulu pelepah', 'cangkerang'],
    source: { q: 'Badan ikan dilitupi ________.', question: 'Badan ikan dilitupi ________.', answer: 'sisik', accepted: ['sisik'], acceptedAnswers: ['sisik'], difficulty: 'sederhana', questionType: 'short_answer', marks: 1, hint: 'Lihat bahagian luar badan haiwan.', explanation: 'Badan ikan dilitupi sisik.', uasa: 'Sains', dskp: 'KSSR' }
  },
  'MATH-MASA-PILOT-005': {
    type: 'fillBlank', correct: '30', distractors: ['15', '60'],
    source: { q: 'Berapakah minit dalam setengah jam?', question: 'Berapakah minit dalam setengah jam?', answer: 'Setengah jam ialah 30 minit.', accepted: ['Setengah jam ialah 30 minit.', '30 minit', '30'], acceptedAnswers: ['Setengah jam ialah 30 minit.', '30 minit', '30'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Cari separuh daripada 60 minit.', explanation: '60 ÷ 2 = 30, jadi setengah jam bersamaan dengan 30 minit.', uasa: 'PBD Sumatif', dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2' }
  },
  'MATH-JISIM-ISI-PADU-PILOT-006': {
    type: 'measurement', correct: 'liter', distractors: ['mililiter', 'kilogram'],
    source: { q: 'Apakah unit yang sesuai untuk isi padu air di dalam sebuah baldi?', question: 'Apakah unit yang sesuai untuk isi padu air di dalam sebuah baldi?', answer: 'Unit yang sesuai ialah liter (L).', accepted: ['Unit yang sesuai ialah liter (L).', 'liter', 'L'], acceptedAnswers: ['Unit yang sesuai ialah liter (L).', 'liter', 'L'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Baldi menampung lebih banyak air daripada sebuah sudu.', explanation: 'Liter digunakan untuk menyatakan isi padu cecair yang lebih banyak.', uasa: 'PBD Sumatif', dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2' }
  }
});

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions));
const byId = new Map(questions.map(question => [question.id, question]));

describe('P1.16C rich interactive expansion Batch 2', () => {
  it('attaches exactly six reviewed overlays without changing source contracts', () => {
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

  it('does not add answer metadata or non-option prompts that disclose the answer', () => {
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const { options, ...nonOptionConfig } = byId.get(id).interaction;
      expect(nonOptionConfig).not.toHaveProperty('answer');
      expect(nonOptionConfig).not.toHaveProperty('correctOptionId');
      expect(JSON.stringify(nonOptionConfig).toLocaleLowerCase()).not.toContain(contract.correct.toLocaleLowerCase());
      expect(options.every(option => !Object.hasOwn(option, 'correct') && !Object.hasOwn(option, 'isCorrect'))).toBe(true);
      expect(options.every(option => !/jawapan betul|correct answer/i.test(option.visual?.label || ''))).toBe(true);
    }
  });

  it('keeps choices labelled, accessible and compatible with the existing mobile input engine', () => {
    for (const id of ['BM-KATA_NAMA_AM-006', 'ENG-NOUNS-006', 'SAINS-HAIWAN-023']) {
      expect(byId.get(id).interaction.options.every(option => option.label && option.visual?.label)).toBe(true);
    }
    const engine = fs.readFileSync(new URL('../../src/components/questions/InteractiveQuestionEngine.jsx', import.meta.url), 'utf8');
    const styles = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');
    expect(engine).toContain('onClick={() => onChange(String(option.value))}');
    expect(engine).toContain("['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']");
    expect(styles).toContain('min-height: 48px');
  });

  it('keeps the half-hour construct textual and the bucket visual free of unit clues', () => {
    const time = byId.get('MATH-MASA-PILOT-005').interaction;
    expect(time).toMatchObject({ type: 'fillBlank', sentenceParts: ['Setengah jam ialah ', ' minit.'] });
    expect(time).not.toHaveProperty('visual');

    const volume = byId.get('MATH-JISIM-ISI-PADU-PILOT-006').interaction;
    expect(volume.type).toBe('measurement');
    expect(JSON.stringify(volume.visual)).not.toMatch(/liter|mililiter|kilogram|\bmL\b|\bkg\b/i);
  });

  it('rejects the ambiguous duck movement candidate and records the safe substitution', () => {
    expect(byId.get('SAINS-HAIWAN-017')).toMatchObject({ answer: 'berenang' });
    expect(byId.get('SAINS-HAIWAN-017')).not.toHaveProperty('interaction');
    expect(byId.get('SAINS-HAIWAN-022')).toMatchObject({ answer: 'sisik', interaction: { type: 'fillBlank' } });
    expect(Object.keys(CONTRACTS)).not.toContain('SAINS-HAIWAN-017');
    expect(Object.keys(CONTRACTS)).toContain('SAINS-HAIWAN-022');
  });

  it('preserves the answer reveal and retry policy', () => {
    expect(getAnswerRevealPolicy({ status: 'wrong', attemptCount: 1 })).toMatchObject({ canRevealAnswer: false, stage: 'guiding_question' });
    expect(getAnswerRevealPolicy({ status: 'wrong', attemptCount: 2 })).toMatchObject({ canRevealAnswer: false, stage: 'strong_hint' });
    expect(getAnswerRevealPolicy({ status: 'wrong', attemptCount: 3 })).toMatchObject({ canRevealAnswer: true, stage: 'answer_reveal_allowed' });
  });

  it('updates only the six approved interaction totals and suitability categories', () => {
    const authored = questions.filter(question => question.interaction);
    const typeCounts = authored.reduce((counts, question) => {
      counts[question.interaction.type] = (counts[question.interaction.type] || 0) + 1;
      return counts;
    }, {});
    expect(authored).toHaveLength(286);
    expect(typeCounts).toEqual({
      imageChoice: 72, choice: 47, fillBlank: 107, ordering: 21, visualMath: 25,
      multiSelect: 2, money: 1, clock: 2, measurement: 4, dragDrop: 1,
      matching: 1, hotspot: 3
    });
    expect(questions.filter(question => getInteractiveQuestionConfig(question))).toHaveLength(1273);
    expect(buildInteractiveSuitabilityReport(subjects).summary.categories).toEqual({
      reviewed_interactive: 286, auto_safe: 987, teacher_review: 2649, keep_standard: 608
    });
  });
});
