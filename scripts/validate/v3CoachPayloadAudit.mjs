import assert from 'node:assert/strict';
import { normalizeCoachPayloadForAudit } from '../../src/ai/coach/coachAdapter.js';

const scenarios = [
  {
    name: 'complete coach payload',
    mode: 'explain',
    payload: {
      subjectId: 'bm',
      topicId: 'kata_nama',
      question: { answer: 'Ali', hint: 'Cari nama orang' },
      topic: { id: 'kata_nama', title: 'Kata Nama', subjectId: 'bm' },
      coachData: {
        explanation: { explanation: 'Ini ialah nama orang.', simpleExplanation: 'Nama orang.' },
        hint: { hint: 'Cari nama orang.' },
        praise: { praise: 'Bagus!' },
        learningTip: 'Cari kata kunci utama.',
        correctAnswer: 'Ali',
        subjectLabel: 'Bahasa Melayu',
        source: 'coach-v3',
        steps: ['Baca soalan.', 'Cari kata kunci.']
      }
    },
    expect: {
      fallbackUsed: false,
      source: 'coach-v3',
      explanation: 'Ini ialah nama orang.',
      steps: ['Baca soalan.', 'Cari kata kunci.']
    }
  },
  {
    name: 'partial coach payload',
    mode: 'teach',
    payload: {
      subjectId: 'math',
      topicId: 'tambah',
      question: { answer: '7' },
      topic: { id: 'tambah', title: 'Tambah', subjectId: 'math' },
      coachData: {
        explanation: { explanation: '' },
        hint: {},
        praise: {},
        subjectLabel: 'Matematik'
      }
    },
    expect: {
      fallbackUsed: true,
      source: 'fallback',
      steps: []
    }
  },
  {
    name: 'empty Knowledge Engine response',
    mode: 'explain',
    payload: {
      subjectId: 'english',
      topicId: 'verbs',
      question: { answer: 'run', hint: 'Look for action' },
      topic: { id: 'verbs', title: 'Verbs', subjectId: 'english' },
      coachData: null
    },
    expect: {
      fallbackUsed: true,
      source: 'fallback'
    }
  },
  {
    name: 'malformed steps',
    mode: 'teach',
    payload: {
      subjectId: 'sains',
      topicId: 'haiwan',
      question: { answer: 'haiwan' },
      topic: { id: 'haiwan', title: 'Haiwan', subjectId: 'sains' },
      coachData: {
        explanation: { explanation: 'Haiwan hidup.' },
        hint: { hint: 'Lihat ciri haiwan.' },
        praise: { praise: 'Hebat!' },
        steps: { bad: true },
        correctAnswer: 'haiwan',
        subjectLabel: 'Sains'
      }
    },
    expect: {
      fallbackUsed: true,
      source: 'fallback',
      steps: []
    }
  },
  {
    name: 'missing correct answer',
    mode: 'explain',
    payload: {
      subjectId: 'arab',
      topicId: 'huruf_hijaiyah',
      question: {},
      topic: { id: 'huruf_hijaiyah', title: 'Huruf Hijaiyah', subjectId: 'arab' },
      coachData: {
        explanation: { explanation: 'Huruf dibaca dari kanan ke kiri.' },
        hint: { hint: 'Perhatikan huruf.' },
        praise: { praise: 'Bagus!' },
        subjectLabel: 'Bahasa Arab'
      }
    },
    expect: {
      correctAnswer: '',
      fallbackUsed: true
    }
  },
  {
    name: 'unknown subject',
    mode: 'explain',
    payload: {
      subjectId: 'unknown',
      topicId: 'mystery',
      question: { answer: 'jawapan' },
      topic: { id: 'mystery', title: 'Mystery Topic' },
      coachData: {
        explanation: { explanation: 'Penjelasan umum.' },
        hint: { hint: 'Baca perlahan-lahan.' },
        praise: { praise: 'Bagus!' },
        learningTip: 'Cari kata kunci.',
        correctAnswer: 'jawapan'
      }
    },
    expect: {
      subject: 'Mystery Topic',
      topic: 'Mystery Topic'
    }
  },
  {
    name: 'Arabic/Jawi content',
    mode: 'explain',
    payload: {
      subjectId: 'arab',
      topicId: 'mufradat',
      question: { answer: 'كِتَابٌ' },
      topic: { id: 'mufradat', title: 'Mufradat', subjectId: 'arab' },
      coachData: {
        explanation: { explanation: 'كِتَابٌ bermaksud buku.' },
        hint: { hint: 'Sebut perlahan-lahan.' },
        praise: { praise: 'Bagus!' },
        learningTip: 'Baca dari kanan ke kiri.',
        correctAnswer: 'كِتَابٌ',
        pronunciationGuide: ['Ki-ta-bun']
      }
    },
    expect: {
      correctAnswer: 'كِتَابٌ',
      fallbackUsed: false
    }
  },
  {
    name: 'fallback response',
    mode: 'teach',
    payload: {
      subjectId: 'pk',
      topicId: 'pemakanan_sihat',
      question: { answer: 'sayur' },
      topic: { id: 'pemakanan_sihat', title: 'Pemakanan Sihat', subjectId: 'pk' },
      error: { code: 'LOAD_FAIL', message: 'fail' }
    },
    expect: {
      fallbackUsed: true,
      source: 'fallback'
    }
  }
];

for (const scenario of scenarios) {
  const normalized = normalizeCoachPayloadForAudit(scenario.mode, scenario.payload);
  assert.equal(typeof normalized.explanation, 'string', `${scenario.name}: explanation should be string`);
  assert.equal(typeof normalized.steps, 'object', `${scenario.name}: steps should be array-like`);
  assert.ok(Array.isArray(normalized.steps), `${scenario.name}: steps should be an array`);
  assert.equal(typeof normalized.hint, 'string', `${scenario.name}: hint should be string`);
  assert.equal(typeof normalized.learningTip, 'string', `${scenario.name}: learningTip should be string`);
  assert.equal(typeof normalized.praise, 'string', `${scenario.name}: praise should be string`);
  assert.equal(typeof normalized.correctAnswer, 'string', `${scenario.name}: correctAnswer should be string`);
  assert.equal(typeof normalized.subject, 'string', `${scenario.name}: subject should be string`);
  assert.equal(typeof normalized.topic, 'string', `${scenario.name}: topic should be string`);
  assert.equal(typeof normalized.fallbackUsed, 'boolean', `${scenario.name}: fallbackUsed should be boolean`);
  assert.ok(normalized.source === 'coach-v3' || normalized.source === 'fallback', `${scenario.name}: source should be stable`);
  assert.ok(normalized.error === null || typeof normalized.error === 'object', `${scenario.name}: error should be null or object`);

  if ('fallbackUsed' in scenario.expect) assert.equal(normalized.fallbackUsed, scenario.expect.fallbackUsed, `${scenario.name}: fallbackUsed mismatch`);
  if ('source' in scenario.expect) assert.equal(normalized.source, scenario.expect.source, `${scenario.name}: source mismatch`);
  if ('explanation' in scenario.expect) assert.equal(normalized.explanation, scenario.expect.explanation, `${scenario.name}: explanation mismatch`);
  if ('steps' in scenario.expect) assert.deepEqual(normalized.steps, scenario.expect.steps, `${scenario.name}: steps mismatch`);
  if ('correctAnswer' in scenario.expect) assert.equal(normalized.correctAnswer, scenario.expect.correctAnswer, `${scenario.name}: correctAnswer mismatch`);
  if ('subject' in scenario.expect) assert.equal(normalized.subject, scenario.expect.subject, `${scenario.name}: subject mismatch`);
  if ('topic' in scenario.expect) assert.equal(normalized.topic, scenario.expect.topic, `${scenario.name}: topic mismatch`);
}

console.log('V3 coach payload audit passed:', scenarios.length, 'scenarios');
