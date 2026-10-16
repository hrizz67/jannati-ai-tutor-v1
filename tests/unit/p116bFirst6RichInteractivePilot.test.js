import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildInteractiveSuitabilityReport } from '../../src/ai/question/interactiveSuitability.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { getInteractiveQuestionConfig, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const PILOT_CONTRACTS = Object.freeze({
  'MATH-BENTUK-PILOT-024': {
    type: 'imageChoice',
    correct: 'bulatan',
    distractors: ['segi tiga', 'segi empat sama'],
    source: {
      q: 'Lengkapkan pola: segi tiga, segi empat sama, bulatan, segi tiga, segi empat sama, ___.',
      question: 'Lengkapkan pola: segi tiga, segi empat sama, bulatan, segi tiga, segi empat sama, ___.',
      answer: 'Bentuk seterusnya ialah bulatan.',
      accepted: ['Bentuk seterusnya ialah bulatan.', 'bulatan'],
      acceptedAnswers: ['Bentuk seterusnya ialah bulatan.', 'bulatan'],
      marks: 1,
      difficulty: 'sederhana',
      questionType: 'fill_blank',
      hint: 'Cari kumpulan tiga bentuk yang berulang.',
      explanation: 'Pola berulang setiap tiga bentuk: segi tiga, segi empat sama, bulatan.',
      uasa: 'PBD Sumatif',
      dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2'
    }
  },
  'ENG-COLOURS-011': {
    type: 'imageChoice',
    correct: 'yellow',
    distractors: ['green', 'orange'],
    source: {
      q: 'Choose the correct answer word to complete this sentence: A ripe banana is ________.',
      question: 'Choose the correct answer word to complete this sentence: A ripe banana is ________.',
      answer: 'yellow', accepted: ['yellow'], acceptedAnswers: ['yellow'], marks: 1,
      difficulty: 'mudah', questionType: 'short_answer',
      hint: 'Think of the colour of a ripe banana.', explanation: 'A ripe banana is yellow.',
      uasa: 'PBD Sumatif', dskp: 'Malaysian Year 2 CEFR'
    }
  },
  'BM-KATA_SENDI-003': {
    type: 'fillBlank',
    correct: 'dari',
    distractors: ['di', 'ke'],
    source: {
      q: 'Lengkapkan ayat: Ayah pulang ______ kampung selepas cuti sekolah.',
      question: 'Lengkapkan ayat: Ayah pulang ______ kampung selepas cuti sekolah.',
      answer: 'dari', accepted: ['dari'], acceptedAnswers: ['dari'], marks: 1,
      difficulty: 'sederhana', questionType: 'short_answer',
      hint: 'Gunakan dari untuk tempat asal.', explanation: 'dari digunakan untuk menunjukkan tempat asal atau tempat datang.',
      uasa: 'PBD Sumatif', dskp: 'KSSR Tahun 2'
    }
  },
  'ARAB-WARNA_ARAB-002': {
    type: 'imageChoice',
    correct: 'biru',
    distractors: ['merah', 'hijau'],
    source: {
      q: 'Warna أَزْرَقُ bermaksud ________.', question: 'Warna أَزْرَقُ bermaksud ________.',
      answer: 'biru', accepted: ['biru'], acceptedAnswers: ['biru'], marks: 1,
      difficulty: 'mudah', questionType: 'short_answer',
      hint: 'Padankan warna Arab dengan maksudnya.', explanation: 'أَزْرَقُ bermaksud biru.',
      uasa: 'PBD Sumatif', dskp: 'KSSR Arab'
    }
  },
  'SAINS-TEKNOLOGI-001': {
    type: 'fillBlank',
    correct: 'memotong',
    distractors: ['menyukat', 'melekat'],
    source: {
      q: 'Gunting digunakan untuk ________.', question: 'Gunting digunakan untuk ________.',
      answer: 'memotong', accepted: ['memotong'], acceptedAnswers: ['memotong'], marks: 1,
      difficulty: 'mudah', questionType: 'short_answer',
      hint: 'Fikirkan fungsi alat.', explanation: 'Gunting digunakan untuk memotong kertas atau kain.',
      uasa: 'Sains', dskp: 'KSSR'
    }
  },
  'MATH-NOMBOR-PILOT-007': {
    type: 'visualMath',
    correct: '942',
    distractors: ['924', '492'],
    source: {
      q: 'Apakah nombor bagi 900 + 40 + 2?', question: 'Apakah nombor bagi 900 + 40 + 2?',
      answer: '942', accepted: ['942'], acceptedAnswers: ['942'], marks: 1,
      difficulty: 'mudah', questionType: 'short_answer',
      hint: 'Gabungkan nilai ratus, puluh dan sa.', explanation: '900 + 40 + 2 = 942.',
      uasa: 'PBD Sumatif', dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2'
    }
  }
});

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions));
const byId = new Map(questions.map(question => [question.id, question]));

describe('P1.16B first-six rich interactive pilot', () => {
  it('attaches exactly the six approved overlays with unchanged source contracts', () => {
    expect(Object.keys(PILOT_CONTRACTS)).toHaveLength(6);
    for (const [id, contract] of Object.entries(PILOT_CONTRACTS)) {
      const question = byId.get(id);
      expect(question).toBeTruthy();
      expect(question).toMatchObject({ id, ...contract.source });
      expect(question.interaction.type).toBe(contract.type);
      expect(getInteractiveQuestionConfig(question)).toBe(question.interaction);
      expect(validateInteractiveQuestionConfig(question.interaction)).toEqual([]);
    }
  });

  it('submits every canonical response and rejects every distractor through smartCheck', () => {
    for (const [id, contract] of Object.entries(PILOT_CONTRACTS)) {
      const question = byId.get(id);
      expect(smartCheck(contract.correct, question).status).toBe('correct');
      for (const distractor of contract.distractors) {
        expect(smartCheck(distractor, question).status).not.toBe('correct');
      }
      expect(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct')).toHaveLength(1);
    }
  });

  it('retains labelled visual choices and the existing Arabic text direction architecture', () => {
    for (const id of ['MATH-BENTUK-PILOT-024', 'ENG-COLOURS-011', 'ARAB-WARNA_ARAB-002']) {
      const question = byId.get(id);
      expect(question.interaction.options.every(option => option.label && option.visual?.label)).toBe(true);
    }
    expect(byId.get('ARAB-WARNA_ARAB-002').q).toContain('أَزْرَقُ');
  });

  it('keeps the place-value model equivalent without leaking 942 outside selectable responses', () => {
    const question = byId.get('MATH-NOMBOR-PILOT-007');
    expect(question.interaction.visual).toEqual({
      kind: 'placeValue',
      columns: [
        { id: 'hundreds', label: 'Ratus', value: 9, block: 'hundred' },
        { id: 'tens', label: 'Puluh', value: 4, block: 'ten' },
        { id: 'ones', label: 'Sa', value: 2, block: 'one' }
      ]
    });
    expect(JSON.stringify({ instruction: question.interaction.instruction, visual: question.interaction.visual })).not.toContain('942');
  });

  it('keeps the P1.16B pilot protected within the expanded approved interaction totals', () => {
    const authored = questions.filter(question => question.interaction);
    const typeCounts = authored.reduce((counts, question) => {
      counts[question.interaction.type] = (counts[question.interaction.type] || 0) + 1;
      return counts;
    }, {});
    expect(authored).toHaveLength(280);
    expect(typeCounts).toEqual({
      imageChoice: 68, choice: 47, fillBlank: 105, ordering: 21, dragDrop: 1,
      matching: 1, visualMath: 25, multiSelect: 2, hotspot: 3, clock: 2,
      money: 1, measurement: 4
    });
    expect(questions.filter(question => getInteractiveQuestionConfig(question))).toHaveLength(1270);
  });

  it('moves only the six approved IDs from teacher review into reviewed interactive', () => {
    const report = buildInteractiveSuitabilityReport(subjects);
    expect(report.summary.categories).toEqual({
      reviewed_interactive: 280,
      auto_safe: 990,
      teacher_review: 2652,
      keep_standard: 608
    });
    for (const id of Object.keys(PILOT_CONTRACTS)) {
      expect(report.questionClassifications.find(row => row.questionId === id)?.category).toBe('reviewed_interactive');
    }
  });

  it('preserves the raw BM source difficulty as mudah', () => {
    const source = fs.readFileSync(new URL('../../src/data/subjects/bm.js', import.meta.url), 'utf8');
    const block = source.match(/"id": "BM-KATA_SENDI-003"[\s\S]{0,700}/)?.[0] || '';
    expect(block).toContain('"difficulty": "mudah"');
  });
});
