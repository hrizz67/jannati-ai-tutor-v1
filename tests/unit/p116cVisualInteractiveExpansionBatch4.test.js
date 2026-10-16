import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAnswerRevealPolicy } from '../../src/ai/policy/answerRevealPolicy.js';
import { buildInteractiveSuitabilityReport } from '../../src/ai/question/interactiveSuitability.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { getInteractiveQuestionConfig, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const CONTRACTS = Object.freeze({
  'PJ-PERGERAKAN_ASAS-002': {
    subjectId: 'pj', type: 'imageChoice', correct: 'melompat', distractors: ['berlari', 'berjalan'], priorSuitability: 'auto_safe',
    source: {
      q: 'Apakah pergerakan yang menggunakan kedua-dua kaki untuk menolak badan ke atas?',
      question: 'Apakah pergerakan yang menggunakan kedua-dua kaki untuk menolak badan ke atas?',
      answer: 'melompat', accepted: ['melompat'], acceptedAnswers: ['melompat'],
      options: ['melompat', 'berlari', 'menolak', 'mengilas'], questionType: 'objective', difficulty: 'mudah', marks: 1,
      hint: 'Badan akan naik seketika dari lantai.',
      explanation: 'Melompat menggunakan kaki untuk menolak badan ke atas dan mendarat dengan terkawal.',
      dskp: 'KSSR Semakan Pendidikan Jasmani Tahun 2', uasa: 'PBD Sumatif'
    }
  },
  'PK-KESELAMATAN_JALAN_RAYA-006': {
    subjectId: 'pk', type: 'imageChoice', correct: 'berhenti', distractors: ['mula melintas', 'berlari melintas'], priorSuitability: 'auto_safe',
    source: {
      q: 'Apakah tindakan selamat apabila lampu isyarat pejalan kaki berwarna merah?',
      question: 'Apakah tindakan selamat apabila lampu isyarat pejalan kaki berwarna merah?',
      answer: 'Apabila lampu isyarat pejalan kaki berwarna merah, tindakan yang selamat ialah "berhenti".',
      accepted: ['Apabila lampu isyarat pejalan kaki berwarna merah, tindakan yang selamat ialah "berhenti".', 'berhenti'],
      acceptedAnswers: ['Apabila lampu isyarat pejalan kaki berwarna merah, tindakan yang selamat ialah "berhenti".', 'berhenti'],
      options: [
        'Apabila lampu isyarat pejalan kaki berwarna merah, tindakan yang selamat ialah "bermain di jalan raya".',
        'Apabila lampu isyarat pejalan kaki berwarna merah, tindakan yang selamat ialah "melintas sambil bergurau".',
        'Apabila lampu isyarat pejalan kaki berwarna merah, tindakan yang selamat ialah "berlari tanpa melihat".',
        'Apabila lampu isyarat pejalan kaki berwarna merah, tindakan yang selamat ialah "berhenti".'
      ],
      questionType: 'objective', difficulty: 'sederhana', marks: 1,
      hint: 'Fikirkan peraturan keselamatan jalan raya.', explanation: 'Merah bermaksud pejalan kaki perlu berhenti.',
      dskp: 'KSSR Semakan Pendidikan Kesihatan Tahun 2', uasa: 'PBD Sumatif'
    }
  },
  'ARAB-WARNA_ARAB-003': {
    subjectId: 'arab', type: 'imageChoice', correct: 'kuning', distractors: ['hijau', 'biru'], priorSuitability: 'teacher_review',
    source: {
      q: 'Warna أَصْفَرُ bermaksud ________.', question: 'Warna أَصْفَرُ bermaksud ________.',
      answer: 'kuning', accepted: ['kuning'], acceptedAnswers: ['kuning'], questionType: 'short_answer', difficulty: 'mudah', marks: 1,
      hint: 'Padankan warna Arab dengan maksudnya.', explanation: 'أَصْفَرُ bermaksud kuning.', dskp: 'KSSR Arab', uasa: 'PBD Sumatif'
    }
  },
  'ENG-NOUNS-012': {
    subjectId: 'english', type: 'imageChoice', correct: 'dog', distractors: ['cat', 'cow'], priorSuitability: 'teacher_review',
    source: {
      q: "The pet that says 'woof' is barking loudly. It is a ________.",
      question: "The pet that says 'woof' is barking loudly. It is a ________.",
      answer: 'dog', accepted: ['dog'], acceptedAnswers: ['dog'], questionType: 'short_answer', difficulty: 'sederhana', marks: 1,
      hint: "Which pet says 'woof' and barks?", explanation: "A dog says 'woof' and barks.",
      dskp: 'Malaysian Year 2 CEFR', uasa: 'PBD Sumatif'
    }
  },
  'SAINS-BAHAN-008': {
    subjectId: 'sains', type: 'fillBlank', correct: 'menyerap air', distractors: ['kalis air', 'telus cahaya'], priorSuitability: 'teacher_review',
    source: {
      q: 'Span sesuai mengelap air kerana boleh ________.', question: 'Span sesuai mengelap air kerana boleh ________.',
      answer: 'menyerap air', accepted: ['menyerap air'], acceptedAnswers: ['menyerap air'], questionType: 'short_answer', difficulty: 'mudah', marks: 1,
      hint: 'Perhatikan sifat bahan.', explanation: 'Span boleh menyerap air.', dskp: 'KSSR', uasa: 'Sains'
    }
  },
  'MATH-WANG-PILOT-007': {
    subjectId: 'math', type: 'fillBlank', correct: '300 sen', distractors: ['30 sen', '3 sen'], priorSuitability: 'teacher_review',
    source: {
      q: 'Tukarkan RM 3 kepada sen.', question: 'Tukarkan RM 3 kepada sen.', answer: 'RM 3 bersamaan dengan 300 sen.',
      accepted: ['RM 3 bersamaan dengan 300 sen.', '300 sen', '300'], acceptedAnswers: ['RM 3 bersamaan dengan 300 sen.', '300 sen', '300'],
      questionType: 'short_answer', difficulty: 'mudah', marks: 1, hint: 'Setiap RM 1 bersamaan dengan 100 sen.',
      explanation: '3 × 100 sen = 300 sen, maka RM 3 = 300 sen.',
      dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2', uasa: 'PBD Sumatif', assessment: 'PBD Formatif/Sumatif'
    }
  }
});

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => (
  topic.questions.map(question => ({ ...question, subjectId: subject.id }))
)));
const byId = new Map(questions.map(question => [question.id, question]));

describe('P1.16C visual and interactive learning expansion Batch 4', () => {
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

  it('upgrades two prior auto-safe choices without duplicating runtime interactions', () => {
    for (const id of ['PJ-PERGERAKAN_ASAS-002', 'PK-KESELAMATAN_JALAN_RAYA-006']) {
      expect(CONTRACTS[id].priorSuitability).toBe('auto_safe');
      expect(byId.get(id).interaction.type).toBe('imageChoice');
      expect(byId.get(id).options).toEqual(CONTRACTS[id].source.options);
    }
    expect(byId.get('PJ-PERGERAKAN_ASAS-002').options).toEqual(['melompat', 'berlari', 'menolak', 'mengilas']);
    expect(byId.get('PK-KESELAMATAN_JALAN_RAYA-006').options).toHaveLength(4);
  });

  it('keeps instructions, progressive hints and hidden fields free of premature answer leakage', () => {
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const question = byId.get(id);
      const { options, ...nonOptionConfig } = question.interaction;
      expect(nonOptionConfig).not.toHaveProperty('answer');
      expect(nonOptionConfig).not.toHaveProperty('correctOptionId');
      expect(nonOptionConfig.instruction.toLocaleLowerCase()).not.toContain(contract.correct.toLocaleLowerCase());
      expect(question.learningIntelligence.hintSteps.join(' ').toLocaleLowerCase()).not.toContain(contract.correct.toLocaleLowerCase());
      expect(options.every(option => !Object.hasOwn(option, 'correct') && !Object.hasOwn(option, 'isCorrect'))).toBe(true);
      expect(options.every(option => !/jawapan betul|correct answer/i.test(option.visual?.label || ''))).toBe(true);
    }
  });

  it('uses meaningful labelled visuals without relying on colour or animal movement shortcuts', () => {
    for (const id of ['PJ-PERGERAKAN_ASAS-002', 'PK-KESELAMATAN_JALAN_RAYA-006', 'ARAB-WARNA_ARAB-003', 'ENG-NOUNS-012']) {
      expect(byId.get(id).interaction.options.every(option => option.label && option.visual?.label && option.visual?.symbol)).toBe(true);
    }
    expect(byId.get('PJ-PERGERAKAN_ASAS-002').interaction.options.map(option => option.visual.symbol).join('')).not.toMatch(/🐇|🐸|🦘/u);
    expect(byId.get('ARAB-WARNA_ARAB-003').interaction.options.map(option => option.label)).toEqual(['Kuning', 'Hijau', 'Biru']);
    expect(byId.get('ARAB-WARNA_ARAB-003').q).toContain('أَصْفَرُ');
  });

  it('preserves currency normalization and fair material-property choices', () => {
    const money = byId.get('MATH-WANG-PILOT-007');
    expect(money.interaction).toMatchObject({ type: 'fillBlank', sentenceParts: ['RM 3 bersamaan dengan ', '.'] });
    expect(money.interaction.options.map(option => option.label)).toEqual(['300 sen', '30 sen', '3 sen']);
    expect(smartCheck('300', money).status).toBe('correct');

    const science = byId.get('SAINS-BAHAN-008');
    expect(science.interaction.options.map(option => option.value)).toEqual(['menyerap air', 'kalis air', 'telus cahaya']);
  });

  it('retains labelled mobile controls, keyboard input and the existing retry/reveal policy', () => {
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

  it('derives authored, runtime and suitability totals without double-counting prior auto-safe questions', () => {
    const authored = questions.filter(question => question.interaction);
    const typeCounts = authored.reduce((counts, question) => {
      counts[question.interaction.type] = (counts[question.interaction.type] || 0) + 1;
      return counts;
    }, {});
    expect(authored).toHaveLength(292);
    expect(typeCounts).toEqual({
      imageChoice: 73, choice: 48, fillBlank: 111, ordering: 21, visualMath: 25,
      multiSelect: 2, money: 1, clock: 2, measurement: 4, dragDrop: 1,
      matching: 1, hotspot: 3
    });
    expect(questions.filter(question => getInteractiveQuestionConfig(question))).toHaveLength(1277);
    expect(buildInteractiveSuitabilityReport(subjects).summary.categories).toEqual({
      reviewed_interactive: 292, auto_safe: 985, teacher_review: 2645, keep_standard: 608
    });
  });
});
