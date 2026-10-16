import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAnswerRevealPolicy } from '../../src/ai/policy/answerRevealPolicy.js';
import { buildInteractiveSuitabilityReport } from '../../src/ai/question/interactiveSuitability.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { getInteractiveQuestionConfig, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const CONTRACTS = Object.freeze({
  'BM-KATA_NAMA_AM-009': {
    subjectId: 'bm', type: 'imageChoice', correct: 'burung', distractors: ['kucing', 'ikan'], priorSuitability: 'teacher_review',
    source: {
      q: 'Burung hinggap di dahan pokok. Pilih kata nama am bagi haiwan dalam ayat tersebut.',
      question: 'Burung hinggap di dahan pokok. Pilih kata nama am bagi haiwan dalam ayat tersebut.',
      answer: 'burung', accepted: ['burung'], acceptedAnswers: ['burung'], questionType: 'short_answer', difficulty: 'mudah', marks: 1,
      hint: 'Cari nama haiwan dalam ayat.', explanation: 'burung ialah kata nama am bagi haiwan.',
      dskp: 'KSSR Tahun 2', uasa: 'PBD Sumatif', assessment: 'PBD'
    }
  },
  'ISLAM-IBADAH-002': {
    subjectId: 'islam', type: 'fillBlank', correct: 'wuduk', distractors: ['zakat', 'puasa'], priorSuitability: 'teacher_review',
    source: {
      q: 'Sebelum solat, kita perlu mengambil ________.', question: 'Sebelum solat, kita perlu mengambil ________.',
      answer: 'wuduk', accepted: ['wuduk'], acceptedAnswers: ['wuduk'], questionType: 'fill_blank', difficulty: 'mudah', marks: 1,
      hint: 'Fikirkan syarat sebelum solat.', explanation: 'Wuduk dilakukan sebelum solat.', dskp: 'KSSR PI', uasa: 'PBD Sumatif'
    }
  },
  'MATH-MASA-PILOT-002': {
    subjectId: 'math', type: 'fillBlank', correct: 'Ahad', distractors: ['Selasa', 'Jumaat'], priorSuitability: 'teacher_review',
    source: {
      q: 'Dalam susunan hari seminggu, nyatakan hari yang hadir sebelum Isnin.',
      question: 'Dalam susunan hari seminggu, nyatakan hari yang hadir sebelum Isnin.',
      answer: 'Hari sebelum Isnin ialah Ahad.', accepted: ['Hari sebelum Isnin ialah Ahad.', 'Ahad'],
      acceptedAnswers: ['Hari sebelum Isnin ialah Ahad.', 'Ahad'], questionType: 'short_answer', difficulty: 'mudah', marks: 1,
      hint: 'Urutan minggu berulang selepas Ahad.', explanation: 'Ahad diikuti oleh Isnin, maka hari sebelum Isnin ialah Ahad.',
      dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2', uasa: 'PBD Sumatif', assessment: 'PBD Formatif/Sumatif'
    }
  },
  'SAINS-KEMAHIRAN_SAINTIFIK-019': {
    subjectId: 'sains', type: 'imageChoice', correct: 'pensel', distractors: ['pemadam', 'pembaris'], priorSuitability: 'auto_safe',
    source: {
      q: 'Antara berikut, alat yang digunakan untuk menulis ialah ________.',
      question: 'Antara berikut, alat yang digunakan untuk menulis ialah ________.',
      answer: 'pensel', accepted: ['pensel'], acceptedAnswers: ['pensel'],
      options: ['pensel', 'pemadam', 'pembaris', 'buku'], questionType: 'objective', difficulty: 'mudah', marks: 1,
      hint: 'Pilih alat yang menghasilkan tulisan pada kertas.',
      explanation: 'Pensel digunakan untuk menulis. Pemadam memadam tulisan, pembaris mengukur dan buku menyimpan catatan.',
      dskp: 'KSSR', uasa: 'Sains'
    }
  },
  'PJ-LOKOMOTOR-001': {
    subjectId: 'pj', type: 'imageChoice', correct: 'berjalan', distractors: ['berlari', 'melompat'], priorSuitability: 'auto_safe',
    source: {
      q: 'Dalam aktiviti berjalan ke kon, apakah pergerakan lokomotor utama?',
      question: 'Dalam aktiviti berjalan ke kon, apakah pergerakan lokomotor utama?',
      answer: 'berjalan', accepted: ['berjalan'], acceptedAnswers: ['berjalan'],
      options: ['berjalan', 'mencongklang', 'menarik', 'menolak'], questionType: 'objective', difficulty: 'mudah', marks: 1,
      hint: 'Lokomotor ialah pergerakan yang berpindah tempat.',
      explanation: 'Berjalan memindahkan badan dari satu tempat ke tempat lain dengan kawalan.',
      dskp: 'KSSR Semakan Pendidikan Jasmani Tahun 2', uasa: 'PBD Sumatif'
    }
  },
  'PK-KEBERSIHAN_DIRI-001': {
    subjectId: 'pk', type: 'imageChoice', correct: 'basuh tangan dengan sabun', distractors: ['lap tangan pada baju', 'makan tanpa cuci tangan'], priorSuitability: 'auto_safe',
    source: {
      q: 'Apakah amalan kebersihan yang betul sebelum makan di kantin?',
      question: 'Apakah amalan kebersihan yang betul sebelum makan di kantin?',
      answer: 'Dalam situasi sebelum makan di kantin, amalan yang betul ialah "basuh tangan dengan sabun".',
      accepted: ['Dalam situasi sebelum makan di kantin, amalan yang betul ialah "basuh tangan dengan sabun".', 'basuh tangan dengan sabun'],
      acceptedAnswers: ['Dalam situasi sebelum makan di kantin, amalan yang betul ialah "basuh tangan dengan sabun".', 'basuh tangan dengan sabun'],
      options: [
        'Dalam situasi sebelum makan di kantin, amalan yang betul ialah "basuh tangan dengan sabun".',
        'Dalam situasi sebelum makan di kantin, amalan yang betul ialah "kongsi berus gigi".',
        'Dalam situasi sebelum makan di kantin, amalan yang betul ialah "pakai baju kotor".',
        'Dalam situasi sebelum makan di kantin, amalan yang betul ialah "makan tanpa cuci tangan".'
      ],
      questionType: 'objective', difficulty: 'mudah', marks: 1,
      hint: 'Pilih amalan yang menjaga kebersihan badan.', explanation: 'Tangan yang bersih membantu mengurangkan kuman dalam badan.',
      dskp: 'KSSR Semakan Pendidikan Kesihatan Tahun 2', uasa: 'PBD Sumatif'
    }
  }
});

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => (
  topic.questions.map(question => ({ ...question, subjectId: subject.id }))
)));
const byId = new Map(questions.map(question => [question.id, question]));

describe('P1.16C visual and sequencing interactive expansion Batch 5', () => {
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

  it('accepts exactly one reviewed option and rejects every distractor', () => {
    for (const [id, contract] of Object.entries(CONTRACTS)) {
      const question = byId.get(id);
      expect(smartCheck(contract.correct, question).status).toBe('correct');
      contract.distractors.forEach(value => expect(smartCheck(value, question).status).not.toBe('correct'));
      expect(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct')).toHaveLength(1);
    }
    expect(smartCheck('basuh tangan dengan sabun', byId.get('PK-KEBERSIHAN_DIRI-001')).status).toBe('correct');
    expect(smartCheck('Hari sebelum Isnin ialah Ahad.', byId.get('MATH-MASA-PILOT-002')).status).toBe('correct');
  });

  it('rejects the mismatched requested ID and uses the safe current-runtime substitute', () => {
    const mismatched = byId.get('MATH-MASA-PILOT-019');
    expect(mismatched).toMatchObject({
      q: 'Terangkan hubungan antara 2 minggu dengan bilangan hari.',
      answer: 'Dua minggu bersamaan dengan 14 hari.',
      questionType: 'structured', marks: 2
    });
    expect(mismatched.interaction).toBeUndefined();
    expect(getInteractiveQuestionConfig(mismatched)).toBeNull();

    const existingOrdering = byId.get('MATH-MASA-PILOT-018');
    expect(existingOrdering).toMatchObject({
      q: 'Susun Isnin, Rabu dan Selasa mengikut urutan hari yang betul.',
      answer: 'Urutannya ialah Isnin, Selasa, Rabu.',
      interaction: { type: 'ordering' }
    });
    expect(byId.get('MATH-MASA-PILOT-002').interaction.type).toBe('fillBlank');
  });

  it('upgrades exactly three prior auto-safe choices without changing their source options', () => {
    for (const id of ['SAINS-KEMAHIRAN_SAINTIFIK-019', 'PJ-LOKOMOTOR-001', 'PK-KEBERSIHAN_DIRI-001']) {
      expect(CONTRACTS[id].priorSuitability).toBe('auto_safe');
      expect(byId.get(id).interaction.type).toBe('imageChoice');
      expect(byId.get(id).options).toEqual(CONTRACTS[id].source.options);
    }
  });

  it('keeps instructions, hints and hidden fields free of premature answer leakage', () => {
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

  it('uses equivalent labelled visuals and preserves the Islamic purification exception boundary', () => {
    for (const id of ['BM-KATA_NAMA_AM-009', 'SAINS-KEMAHIRAN_SAINTIFIK-019', 'PJ-LOKOMOTOR-001', 'PK-KEBERSIHAN_DIRI-001']) {
      expect(byId.get(id).interaction.options.every(option => option.label && option.visual?.label && option.visual?.symbol)).toBe(true);
    }
    expect(byId.get('PJ-LOKOMOTOR-001').interaction.options.map(option => option.visual.symbol).join('')).not.toMatch(/🐇|🐸|🦘/u);
    expect(byId.get('PK-KEBERSIHAN_DIRI-001').interaction.options.map(option => option.visual.symbol).join('')).not.toContain('🦶');
    const islam = byId.get('ISLAM-IBADAH-002');
    expect(islam.interaction.options.map(option => option.value)).not.toContain('tayamum');
    expect(islam.qualityReview.assessment).toContain('tayamum');
    expect(islam.learningIntelligence.hintSteps.join(' ')).toContain('apabila air tersedia');
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

  it('keeps authored IDs unique and prior Batch 4 overlays intact', () => {
    const authoredIds = questions.filter(question => question.interaction).map(question => question.id);
    expect(new Set(authoredIds).size).toBe(authoredIds.length);
    for (const id of ['PJ-PERGERAKAN_ASAS-002', 'PK-KESELAMATAN_JALAN_RAYA-006', 'ARAB-WARNA_ARAB-003', 'ENG-NOUNS-012', 'SAINS-BAHAN-008', 'MATH-WANG-PILOT-007']) {
      expect(byId.get(id).interaction).toBeTruthy();
    }
  });

  it('derives final authored, runtime and suitability totals without double-counting auto-safe upgrades', () => {
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
