import assert from 'node:assert/strict';
import { createDefaultProfile } from '../../src/ai/adaptive/studentProfile.js';
import { buildSmartQuestionSession, recordSmartQuestionState } from '../../src/ai/questionGenerator/smartQuestionGenerator.js';
import { createDefaultSmartQuestionState } from '../../src/ai/questionGenerator/questionHistory.js';
import { getRecommendedDifficulty, calculateDifficultyScore } from '../../src/ai/questionGenerator/difficultyEngine.js';
import { buildRevisionQueue } from '../../src/ai/questionGenerator/revisionQueue.js';

const TRACE = String(process.env.SMART_GENERATOR_TRACE || '').trim() === '1';

function traceScenario(label, decision, extras = {}) {
  if (!TRACE) return;
  const summary = {
    label,
    subject: extras.subject || '',
    topic: extras.topic || '',
    seed: extras.seed ?? '',
    requestedProfile: extras.requestedProfile || {},
    candidateIds: Array.isArray(extras.candidateIds) ? extras.candidateIds : [],
    rejectedCandidateIds: Array.isArray(extras.rejectedCandidateIds) ? extras.rejectedCandidateIds : [],
    rejectionReasons: Array.isArray(extras.rejectionReasons) ? extras.rejectionReasons : [],
    retryCount: Number(extras.retryCount || 0),
    finalSelectedId: decision?.question?.id || '',
    recentHistorySnapshot: Array.isArray(extras.recentHistorySnapshot) ? extras.recentHistorySnapshot : [],
    order: Array.isArray(decision?.questions) ? decision.questions.map(item => item?.id).filter(Boolean) : [],
    repeatScore: decision?.question?.smartQuestion?.repeatScore ?? null,
    selectionReason: decision?.selectionReason || ''
  };
  console.log(JSON.stringify(summary, null, 2));
}

const sampleQuestions = [
  {
    id: 'Q1',
    q: 'Ali bermain bola di padang.',
    question: 'Ali bermain bola di padang.',
    answer: 'bola',
    subjectId: 'bm',
    topicId: 'kata_kerja',
    difficulty: 'mudah',
    uasa: 'UASA'
  },
  {
    id: 'Q2',
    q: 'Aina membaca buku di perpustakaan.',
    question: 'Aina membaca buku di perpustakaan.',
    answer: 'buku',
    subjectId: 'bm',
    topicId: 'kata_nama_am',
    difficulty: 'sederhana',
    uasa: 'UASA'
  },
  {
    id: 'Q3',
    q: 'Hakim menanam pokok di taman.',
    question: 'Hakim menanam pokok di taman.',
    answer: 'pokok',
    subjectId: 'bm',
    topicId: 'kata_kerja',
    difficulty: 'sukar',
    uasa: 'UASA'
  }
];

const duplicateQuestions = [
  sampleQuestions[0],
  { ...sampleQuestions[0], id: 'Q1-DUP', q: sampleQuestions[0].q, question: sampleQuestions[0].question },
  sampleQuestions[1]
];

const profile = createDefaultProfile({
  streak: 4,
  xp: 180,
  topics: {
    bm: {
      kata_kerja: { total: 8, correct: 3, wrong: 5, mastery: 28, confidence: 26, accuracy: 38, lastPlayed: '2026-07-12' },
      kata_nama_am: { total: 10, correct: 9, wrong: 1, mastery: 88, confidence: 84, accuracy: 90, lastPlayed: '2026-07-13' }
    }
  }
});

const memory = {
  topics: {
    bm: {
      kata_kerja: { masterySnapshot: 28, confidenceSnapshot: 26, reviewCount: 3, wrongCount: 5, lastAnsweredAt: '2026-07-12' },
      kata_nama_am: { masterySnapshot: 88, confidenceSnapshot: 84, reviewCount: 1, wrongCount: 1, lastAnsweredAt: '2026-07-13' }
    }
  },
  mistakes: {
    bm: {
      kata_kerja: { totalMistakes: 5 }
    }
  },
  dailySnapshots: []
};

const observation = {
  strongestTopic: { subjectId: 'bm', topicId: 'kata_nama_am', title: 'Kata Nama Am', mastery: 88, confidence: 84 },
  weakestTopic: { subjectId: 'bm', topicId: 'kata_kerja', title: 'Kata Kerja', mastery: 28, confidence: 26 },
  improvingTopic: { subjectId: 'bm', topicId: 'kata_nama_am', title: 'Kata Nama Am', mastery: 88, confidence: 84 },
  decliningTopic: { subjectId: 'bm', topicId: 'kata_kerja', title: 'Kata Kerja', mastery: 28, confidence: 26 },
  learningTrend: 'menurun'
};
const predictionProfile = {
  evidence: { mastery: 28, confidence: 26, hintLevel: 3 },
  teachingStrategy: { hintLevel: 3, explanationDepth: 3 }
};
const readiness = {
  score: 42,
  level: 'needs_support',
  message: 'Perlu lebih latihan sebelum ke tahap seterusnya.'
};
const parentAnalytics = {
  weeklyTrend: {
    trend: { direction: 'declining' },
    totals: { questions: 12, accuracy: 54 }
  }
};
const gamificationProfile = {
  currentStreak: 4
};

const firstDecision = buildSmartQuestionSession(sampleQuestions, {
  profile,
  memory,
  learningObservation: observation,
  predictionProfile,
  readiness,
  parentAnalytics,
  gamificationProfile,
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_kerja', title: 'Kata Kerja' },
  mode: 'quiz'
});

const secondDecision = buildSmartQuestionSession(sampleQuestions, {
  profile,
  memory,
  learningObservation: observation,
  predictionProfile,
  readiness,
  parentAnalytics,
  gamificationProfile,
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_kerja', title: 'Kata Kerja' },
  mode: 'quiz'
});

assert.deepEqual(
  firstDecision.questions.map(item => item.id),
  secondDecision.questions.map(item => item.id),
  'Smart generator must be deterministic for the same inputs.'
);

const repeatState = {
  ...createDefaultSmartQuestionState(),
  lastQuestions: [
    { key: 'quiz::bm::kata_kerja::Q1::mudah::0::0', questionId: 'Q1', subjectId: 'bm', topicId: 'kata_kerja', q: sampleQuestions[0].q }
  ],
  history: [
    { key: 'quiz::bm::kata_kerja::Q1::mudah::0::0', questionId: 'Q1', subjectId: 'bm', topicId: 'kata_kerja', q: sampleQuestions[0].q }
  ]
};

const repeatDecision = buildSmartQuestionSession(sampleQuestions, {
  profile: createDefaultProfile(),
  memory: {},
  smartState: repeatState,
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_kerja', title: 'Kata Kerja' },
  mode: 'quiz'
});

traceScenario('repeat-guard', repeatDecision, {
  subject: 'bm',
  topic: 'kata_kerja',
  seed: repeatState.variationSeed || 0,
  requestedProfile: {
    streak: 0,
    topics: {}
  },
  candidateIds: sampleQuestions.map(item => item.id),
  rejectedCandidateIds: [],
  rejectionReasons: [],
  retryCount: 0,
  recentHistorySnapshot: repeatState.lastQuestions
});

assert.notEqual(repeatDecision.question?.id, 'Q1', 'Repeat guard should avoid the most recent question.');

assert.equal(getRecommendedDifficulty({ mastery: 20, confidence: 25, total: 4, wrong: 3 }), 'mudah');
assert.equal(getRecommendedDifficulty({ mastery: 72, confidence: 68, total: 10, wrong: 2 }), 'sederhana');
assert.equal(getRecommendedDifficulty({ mastery: 92, confidence: 90, total: 14, wrong: 0 }), 'sukar');
assert(calculateDifficultyScore({ mastery: 20, confidence: 25, total: 4, wrong: 3 }).score < calculateDifficultyScore({ mastery: 92, confidence: 90, total: 14, wrong: 0 }).score);

const revisionQueue = buildRevisionQueue(profile, {
  observation,
  readiness,
  parentAnalytics,
  limit: 5
});

assert.equal(revisionQueue[0]?.topicId, 'kata_kerja', 'Revision queue should prioritise the weakest topic.');

const duplicateDecision = buildSmartQuestionSession(duplicateQuestions, {
  profile,
  memory,
  learningObservation: observation,
  predictionProfile,
  readiness,
  parentAnalytics,
  gamificationProfile,
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_kerja', title: 'Kata Kerja' },
  mode: 'quiz'
});

assert.equal(new Set(duplicateDecision.questions.map(item => item.id)).size, duplicateDecision.questions.length, 'Duplicate questions should be removed from the session.');

const emptyState = createDefaultSmartQuestionState();
const decisionForStorage = buildSmartQuestionSession(sampleQuestions, {
  profile,
  memory,
  learningObservation: observation,
  predictionProfile,
  readiness,
  parentAnalytics,
  gamificationProfile,
  smartState: emptyState,
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_kerja', title: 'Kata Kerja' },
  mode: 'quiz'
});

const storedOnce = recordSmartQuestionState(emptyState, decisionForStorage, {
  mode: 'quiz',
  subjectId: 'bm',
  topicId: 'kata_kerja',
  revisionQueue
});
const storedTwice = recordSmartQuestionState(storedOnce, decisionForStorage, {
  mode: 'quiz',
  subjectId: 'bm',
  topicId: 'kata_kerja',
  revisionQueue
});

assert.equal(storedOnce.history.length, 1, 'First smart question event should be stored once.');
assert.equal(storedTwice.history.length, 1, 'Duplicate smart question event must not be duplicated.');
assert.equal(storedTwice.revisionQueue.length, revisionQueue.length, 'Revision queue should be preserved.');

console.log('smartQuestionGenerator regression tests passed');
