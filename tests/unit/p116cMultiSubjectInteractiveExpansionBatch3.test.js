import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAnswerRevealPolicy } from '../../src/ai/policy/answerRevealPolicy.js';
import { buildInteractiveSuitabilityReport } from '../../src/ai/question/interactiveSuitability.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { getInteractiveQuestionConfig, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const CONTRACTS = Object.freeze({
  'BM-KATA_NAMA_AM-005': {
    subjectId: 'bm', type: 'imageChoice', correct: 'kucing', distractors: ['meja', 'tidur'],
    source: { q: 'Baca situasi ini: Seekor kucing tidur di bawah meja. Apakah kata nama am bagi haiwan?', question: 'Baca situasi ini: Seekor kucing tidur di bawah meja. Apakah kata nama am bagi haiwan?', answer: 'kucing', accepted: ['kucing'], acceptedAnswers: ['kucing'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Cari nama haiwan dalam ayat.', explanation: 'kucing ialah kata nama am bagi haiwan.', uasa: 'PBD Sumatif', dskp: 'KSSR Tahun 2' }
  },
  'ENG-VERBS-018': {
    subjectId: 'english', type: 'fillBlank', correct: 'cut', distractors: ['drink', 'sleep'],
    source: { q: 'At art time, the boy will ________ the paper.', question: 'At art time, the boy will ________ the paper.', answer: 'cut', accepted: ['cut'], acceptedAnswers: ['cut'], difficulty: 'sederhana', questionType: 'short_answer', marks: 1, hint: 'Choose the action with scissors.', explanation: 'Cut is an action word.', uasa: 'PBD Sumatif', dskp: 'Malaysian Year 2 CEFR' }
  },
  'SAINS-TUMBUHAN-022': {
    subjectId: 'sains', type: 'fillBlank', correct: 'pokok dewasa', distractors: ['biji benih', 'akar'],
    source: { q: 'Anak pokok boleh menjadi ________.', question: 'Anak pokok boleh menjadi ________.', answer: 'pokok dewasa', accepted: ['pokok dewasa'], acceptedAnswers: ['pokok dewasa'], difficulty: 'sederhana', questionType: 'short_answer', marks: 1, hint: 'Fikirkan urutan pertumbuhan tumbuhan.', explanation: 'Anak pokok membesar menjadi pokok dewasa.', uasa: 'Sains', dskp: 'KSSR' }
  },
  'ISLAM-IBADAH-005': {
    subjectId: 'islam', type: 'fillBlank', correct: 'dua', distractors: ['tiga', 'empat'],
    source: { q: 'Solat Subuh mempunyai ________ rakaat.', question: 'Solat Subuh mempunyai ________ rakaat.', answer: 'dua', accepted: ['dua'], acceptedAnswers: ['dua'], difficulty: 'mudah', questionType: 'fill_blank', marks: 1, hint: 'Ingat bilangan rakaat Subuh.', explanation: 'Solat Subuh mempunyai dua rakaat.', uasa: 'PBD Sumatif', dskp: 'KSSR PI' }
  },
  'ARAB-NOMBOR_ARAB-002': {
    subjectId: 'arab', type: 'choice', correct: 'dua', distractors: ['satu', 'tiga'],
    source: { q: 'Simbol ٢ mewakili nombor ________ dalam Bahasa Melayu.', question: 'Simbol ٢ mewakili nombor ________ dalam Bahasa Melayu.', answer: 'dua', accepted: ['dua'], acceptedAnswers: ['dua'], difficulty: 'sederhana', questionType: 'fill_blank', marks: 1, hint: 'Kenal pasti nilai simbol nombor Arab.', explanation: 'Simbol ٢ mewakili dua; perkataan Arabnya ialah اِثْنَانِ.', uasa: 'PBD Sumatif', dskp: 'KSSR Arab' }
  },
  'MATH-WANG-PILOT-006': {
    subjectId: 'math', type: 'fillBlank', correct: 'RM 16', distractors: ['RM 15', 'RM 17'],
    source: { q: 'Cari jumlah bagi wang kertas RM 10, RM 5 dan RM 1.', question: 'Cari jumlah bagi wang kertas RM 10, RM 5 dan RM 1.', answer: 'Jumlah wang kertas ialah RM 16.', accepted: ['Jumlah wang kertas ialah RM 16.', 'RM 16', 'RM16', '16'], acceptedAnswers: ['Jumlah wang kertas ialah RM 16.', 'RM 16', 'RM16', '16'], difficulty: 'mudah', questionType: 'short_answer', marks: 1, hint: 'Tambah nilai ketiga-tiga wang kertas.', explanation: 'RM 10 + RM 5 + RM 1 = RM 16.', uasa: 'PBD Sumatif', dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2' }
  }
});

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => (
  topic.questions.map(question => ({ ...question, subjectId: subject.id }))
)));
const byId = new Map(questions.map(question => [question.id, question]));

describe('P1.16C multi-subject interactive expansion Batch 3', () => {
  it('attaches exactly six reviewed overlays across six subjects without changing source contracts', () => {
    expect(Object.keys(CONTRACTS)).toHaveLength(6);
    expect(new Set(Object.values(CONTRACTS).map(contract => contract.subjectId)).size).toBe(6);
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const question = byId.get(id);
      expect(question).toBeTruthy();
      expect(question).toMatchObject({ id, subjectId: contract.subjectId, ...contract.source });
      expect(question.interaction.type).toBe(contract.type);
      expect(getInteractiveQuestionConfig(question)).toBe(question.interaction);
      expect(validateInteractiveQuestionConfig(question.interaction)).toEqual([]);
      expect(question.qualityReview).toMatchObject({ curriculum: expect.any(String), assessment: expect.any(String), textbook: expect.any(String) });
      expect(question.learningIntelligence.hintSteps).toHaveLength(3);
    }
  });

  it('accepts exactly one canonical option and rejects every reviewed distractor', () => {
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const question = byId.get(id);
      expect(smartCheck(contract.correct, question).status).toBe('correct');
      contract.distractors.forEach(value => expect(smartCheck(value, question).status).not.toBe('correct'));
      expect(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct')).toHaveLength(1);
    }
  });

  it('keeps the authored prompt, instructions and metadata free of pre-submission answer flags', () => {
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const { options, ...nonOptionConfig } = byId.get(id).interaction;
      expect(nonOptionConfig).not.toHaveProperty('answer');
      expect(nonOptionConfig).not.toHaveProperty('correctOptionId');
      expect(JSON.stringify(nonOptionConfig).toLocaleLowerCase()).not.toContain(contract.correct.toLocaleLowerCase());
      expect(options.every(option => !Object.hasOwn(option, 'correct') && !Object.hasOwn(option, 'isCorrect'))).toBe(true);
      expect(options.every(option => !/jawapan betul|correct answer/i.test(option.visual?.label || ''))).toBe(true);
    }
  });

  it('keeps the English and curriculum-sensitive completions factual and unambiguous', () => {
    expect(byId.get('ENG-VERBS-018').interaction).toMatchObject({
      sentenceParts: ['At art time, the boy will ', ' the paper.']
    });
    expect(byId.get('SAINS-TUMBUHAN-022').interaction.options.map(option => option.value)).toEqual(['pokok dewasa', 'biji benih', 'akar']);
    expect(byId.get('ISLAM-IBADAH-005').interaction.options.map(option => option.value)).toEqual(['dua', 'tiga', 'empat']);
  });

  it('preserves the Arabic digit glyph, mixed-direction source and accessible Malay choice labels', () => {
    const question = byId.get('ARAB-NOMBOR_ARAB-002');
    expect(question.q).toContain('٢');
    expect(question.interaction).toMatchObject({ type: 'choice', instruction: expect.any(String) });
    expect(question.interaction.options.map(option => option.label)).toEqual(['Satu', 'Dua', 'Tiga']);
    expect(question.interaction.options.every(option => option.id && option.label && option.value)).toBe(true);
    expect(question.interaction.options.every(option => !option.visual)).toBe(true);
  });

  it('keeps currency formatting accepted and uses near-value distractors', () => {
    const question = byId.get('MATH-WANG-PILOT-006');
    expect(question.interaction).toMatchObject({
      type: 'fillBlank',
      sentenceParts: ['Jumlah wang kertas itu ialah ', '.']
    });
    expect(question.interaction.options.map(option => option.label)).toEqual(['RM 16', 'RM 15', 'RM 17']);
    expect(smartCheck('RM16', question).status).toBe('correct');
    expect(smartCheck('16', question).status).toBe('correct');
  });

  it('retains labelled mobile controls, keyboard input and the existing retry/reveal policy', () => {
    const imageChoice = byId.get('BM-KATA_NAMA_AM-005').interaction;
    expect(imageChoice.options.every(option => option.label && option.visual?.label)).toBe(true);
    expect(imageChoice.options.every(option => /\p{L}/u.test(option.label))).toBe(true);

    const engine = fs.readFileSync(new URL('../../src/components/questions/InteractiveQuestionEngine.jsx', import.meta.url), 'utf8');
    const styles = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');
    expect(engine).toContain('onClick={() => onChange(String(option.value))}');
    expect(engine).toContain("['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']");
    expect(engine).toContain('role="radiogroup"');
    expect(styles).toContain('min-height: 48px');
    expect(getAnswerRevealPolicy({ status: 'wrong', attemptCount: 1 })).toMatchObject({ canRevealAnswer: false, stage: 'guiding_question' });
    expect(getAnswerRevealPolicy({ status: 'wrong', attemptCount: 2 })).toMatchObject({ canRevealAnswer: false, stage: 'strong_hint' });
    expect(getAnswerRevealPolicy({ status: 'wrong', attemptCount: 3 })).toMatchObject({ canRevealAnswer: true, stage: 'answer_reveal_allowed' });
  });

  it('updates only the six reviewed overlays and derives the resulting interaction totals', () => {
    const authored = questions.filter(question => question.interaction);
    const typeCounts = authored.reduce((counts, question) => {
      counts[question.interaction.type] = (counts[question.interaction.type] || 0) + 1;
      return counts;
    }, {});
    expect(authored).toHaveLength(274);
    expect(typeCounts).toEqual({
      imageChoice: 64, choice: 47, fillBlank: 103, ordering: 21, visualMath: 25,
      multiSelect: 2, money: 1, clock: 2, measurement: 4, dragDrop: 1,
      matching: 1, hotspot: 3
    });
    expect(questions.filter(question => getInteractiveQuestionConfig(question))).toHaveLength(1266);
    expect(buildInteractiveSuitabilityReport(subjects).summary.categories).toEqual({
      reviewed_interactive: 274, auto_safe: 992, teacher_review: 2656, keep_standard: 608
    });
  });
});
