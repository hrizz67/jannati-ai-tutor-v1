import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAnswerRevealPolicy } from '../../src/ai/policy/answerRevealPolicy.js';
import { buildInteractiveSuitabilityReport } from '../../src/ai/question/interactiveSuitability.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { getInteractiveQuestionConfig, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const CONTRACTS = Object.freeze({
  'BM-KATA_KERJA-009': {
    subjectId: 'bm', type: 'fillBlank', correct: 'melukis', distractors: ['Danish', 'rumah'], priorSuitability: 'teacher_review',
    source: {
      q: 'Di taman permainan, Danish melukis gambar rumah pada buku sketsa. Apakah kata kerja dalam ayat ini?',
      question: 'Di taman permainan, Danish melukis gambar rumah pada buku sketsa. Apakah kata kerja dalam ayat ini?',
      answer: 'melukis', accepted: ['melukis'], acceptedAnswers: ['melukis'], questionType: 'short_answer', difficulty: 'mudah', marks: 1,
      hint: 'Cari perbuatan Danish.', explanation: 'melukis ialah kata kerja.', dskp: 'KSSR Tahun 2', uasa: 'PBD Sumatif', assessment: 'PBD'
    }
  },
  'BM-KATA_ADJEKTIF-006': {
    subjectId: 'bm', type: 'fillBlank', correct: 'licin', distractors: ['lantai', 'hujan'], priorSuitability: 'teacher_review',
    source: {
      q: 'Selepas hujan, lantai di bilik air menjadi licin. Apakah kata adjektif dalam ayat ini?',
      question: 'Selepas hujan, lantai di bilik air menjadi licin. Apakah kata adjektif dalam ayat ini?',
      answer: 'licin', accepted: ['licin'], acceptedAnswers: ['licin'], questionType: 'short_answer', difficulty: 'mudah', marks: 1,
      hint: 'Cari perkataan yang menerangkan keadaan lantai.', explanation: 'licin ialah kata adjektif.', dskp: 'KSSR Tahun 2', uasa: 'PBD Sumatif', assessment: 'PBD'
    }
  },
  'PJ-MANIPULASI_ALATAN-001': {
    subjectId: 'pj', type: 'imageChoice', correct: 'membaling', distractors: ['menangkap', 'menggolek'], priorSuitability: 'auto_safe',
    source: {
      q: 'Dalam aktiviti membaling bola ke sasaran, apakah kemahiran manipulasi alatan yang digunakan?',
      question: 'Dalam aktiviti membaling bola ke sasaran, apakah kemahiran manipulasi alatan yang digunakan?',
      answer: 'membaling', accepted: ['membaling'], acceptedAnswers: ['membaling'],
      options: ['menangkap', 'melantun', 'memukul', 'membaling'], questionType: 'objective', difficulty: 'mudah', marks: 1,
      hint: 'Manipulasi alatan bermaksud mengawal objek.', explanation: 'Membaling melatih koordinasi mata dan tangan.',
      dskp: 'KSSR Semakan Pendidikan Jasmani Tahun 2', uasa: 'PBD Sumatif'
    }
  },
  'PJ-KESELAMATAN_AKTIVITI-001': {
    subjectId: 'pj', type: 'choice', correct: 'berhenti dan beritahu guru',
    distractors: ['terus bermain di gelanggang basah', 'berlari merentasi lantai basah'], priorSuitability: 'auto_safe',
    source: {
      q: 'Apakah tindakan paling selamat jika lantai gelanggang basah?',
      question: 'Apakah tindakan paling selamat jika lantai gelanggang basah?',
      answer: 'berhenti dan beritahu guru', accepted: ['berhenti dan beritahu guru'], acceptedAnswers: ['berhenti dan beritahu guru'],
      options: ['berhenti dan beritahu guru', 'minum air dan rehat di tempat teduh', 'berlari di lantai licin', 'minta bantuan guru'],
      questionType: 'objective', difficulty: 'sukar', cognitiveLevel: 'menilai', marks: 1,
      hint: 'Pilih tindakan yang menjaga diri dan rakan.', explanation: 'Lantai basah boleh menyebabkan murid tergelincir.',
      dskp: 'KSSR Semakan Pendidikan Jasmani Tahun 2', uasa: 'PBD Sumatif'
    }
  },
  'ISLAM-ADAB-006': {
    subjectId: 'islam', type: 'fillBlank', correct: 'izin', distractors: ['maaf', 'hadiah'], priorSuitability: 'teacher_review',
    source: {
      q: 'Sebelum masuk bilik orang, kita perlu meminta ________.', question: 'Sebelum masuk bilik orang, kita perlu meminta ________.',
      answer: 'izin', accepted: ['izin'], acceptedAnswers: ['izin'], questionType: 'fill_blank', difficulty: 'sederhana', cognitiveLevel: 'mengaplikasi', marks: 1,
      hint: 'Fikirkan adab menjaga privasi.', explanation: 'Meminta izin ialah adab yang baik.', dskp: 'KSSR PI', uasa: 'PBD Sumatif', assessmentFocus: 'Adab'
    }
  },
  'ISLAM-AKHLAK-009': {
    subjectId: 'islam', type: 'fillBlank', correct: 'pemurah', distractors: ['kedekut', 'sombong'], priorSuitability: 'teacher_review',
    source: {
      q: 'Berkongsi alat tulis dengan kawan menunjukkan sikap ________.', question: 'Berkongsi alat tulis dengan kawan menunjukkan sikap ________.',
      answer: 'pemurah', accepted: ['pemurah'], acceptedAnswers: ['pemurah'], questionType: 'fill_blank', difficulty: 'mudah', cognitiveLevel: 'memahami', marks: 1,
      hint: 'Fikirkan sifat suka memberi.', explanation: 'Pemurah bermaksud suka berkongsi dan memberi.', dskp: 'KSSR PI', uasa: 'PBD Sumatif', assessmentFocus: 'Akhlak'
    }
  }
});

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => (
  topic.questions.map(question => ({ ...question, subjectId: subject.id }))
)));
const byId = new Map(questions.map(question => [question.id, question]));

describe('P1.16C targeted subject coverage expansion Batch 6', () => {
  it('attaches exactly six reviewed overlays across BM, PJ and Islam without changing source contracts', () => {
    expect(Object.keys(CONTRACTS)).toHaveLength(6);
    expect(new Set(Object.values(CONTRACTS).map(contract => contract.subjectId))).toEqual(new Set(['bm', 'pj', 'islam']));
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

  it('accepts exactly one reviewed option and rejects every distractor', () => {
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const question = byId.get(id);
      expect(smartCheck(contract.correct, question).status).toBe('correct');
      contract.distractors.forEach(value => expect(smartCheck(value, question).status).not.toBe('correct'));
      expect(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct')).toHaveLength(1);
    }
  });

  it('upgrades exactly the two prior auto-safe PJ choices without changing their source options', () => {
    for (const id of ['PJ-MANIPULASI_ALATAN-001', 'PJ-KESELAMATAN_AKTIVITI-001']) {
      expect(CONTRACTS[id].priorSuitability).toBe('auto_safe');
      expect(byId.get(id).options).toEqual(CONTRACTS[id].source.options);
    }
    expect(byId.get('PJ-MANIPULASI_ALATAN-001').interaction.type).toBe('imageChoice');
    expect(byId.get('PJ-KESELAMATAN_AKTIVITI-001').interaction.type).toBe('choice');
  });

  it('uses labelled PJ visuals and deliberately keeps the multi-step safety action text-based', () => {
    const movement = byId.get('PJ-MANIPULASI_ALATAN-001');
    expect(movement.interaction.options.every(option => option.label && option.visual?.label && option.visual?.symbol)).toBe(true);
    const safety = byId.get('PJ-KESELAMATAN_AKTIVITI-001');
    expect(safety.interaction.options.every(option => option.label && !option.visual)).toBe(true);
    expect(safety.qualityReview.assessment).toContain('tidak boleh digambarkan dengan ikon ringkas tanpa kekaburan');
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

  it('preserves mobile, mouse, keyboard and existing retry/reveal contracts', () => {
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

  it('keeps authored IDs unique and every prior Batch 5 overlay intact', () => {
    const authoredIds = questions.filter(question => question.interaction).map(question => question.id);
    expect(new Set(authoredIds).size).toBe(authoredIds.length);
    for (const id of ['BM-KATA_NAMA_AM-009', 'ISLAM-IBADAH-002', 'MATH-MASA-PILOT-002', 'SAINS-KEMAHIRAN_SAINTIFIK-019', 'PJ-LOKOMOTOR-001', 'PK-KEBERSIHAN_DIRI-001']) {
      expect(byId.get(id).interaction).toBeTruthy();
    }
  });

  it('derives the final counts without double-counting the two auto-safe upgrades', () => {
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
