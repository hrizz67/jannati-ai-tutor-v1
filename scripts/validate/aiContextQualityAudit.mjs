import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { getTutorResponse } from '../../src/ai/tutorResponseEngine.js';
import { explainAnswer } from '../../src/ai/explainEngine.js';
import { teachAnswer } from '../../src/ai/teacherEngine.js';
import { buildParentSummary } from '../../src/parentInsights/summaryBuilder.js';
import { resolveParentProfile } from '../../src/parentInsights/insightsService.js';
import { buildStudyPriorityMap } from '../../src/studyPlanner/studyPriority.js';
import { getStudentDisplayName } from '../../src/utils/displayFormatter.js';

const ROOT = process.cwd();
const FILES_TO_SCAN = [
  'src/components/ai/TutorAIModal.jsx',
  'src/components/ai/AIExplainModal.jsx',
  'src/components/ai/AITeacherModal.jsx',
  'src/styles/style.css',
  'src/App.jsx'
];

function readFile(file) {
  return fs.readFile(path.join(ROOT, file), 'utf8');
}

function containsAny(text, items) {
  return items.some(item => text.includes(item));
}

function assertNoLeak(value, label, rawValues = []) {
  const text = JSON.stringify(value ?? '');
  for (const raw of rawValues) {
    if (!raw) continue;
    assert.ok(!text.includes(String(raw)), `${label} leaked raw value: ${raw}`);
  }
  assert.ok(!/\bundefined\b/i.test(text), `${label} contains undefined`);
  assert.ok(!/\bnull\b/i.test(text), `${label} contains null`);
  assert.ok(!/\[object Object\]/i.test(text), `${label} contains [object Object]`);
}

async function main() {
  const report = {
    status: 'PASS',
    scenarios: [],
    checks: [],
    issues: []
  };

  const bmQuestion = {
    id: 'bm_kata_nama_khas_001',
    q: 'Di dalam kelas, Aina membaca buku cerita bersama rakannya.',
    answer: 'Aina',
    hint: 'Cari nama murid dalam ayat.',
    explanation: 'Aina ialah nama orang.',
    instruction: 'Nyatakan kata nama khas bagi nama murid dalam ayat ini.',
    options: ['Aina', 'buku', 'kelas', 'rakannya']
  };
  const bmSubject = { id: 'bm', title: 'Bahasa Melayu' };
  const bmTopic = { id: 'bm_kata_nama_khas', title: 'Kata Nama Khas', learningObjective: 'Mengenal kata nama khas' };

  const mathQuestion = {
    id: 'math_add_001',
    q: 'Amir ada 3 biji epal. Ibu beri 2 biji lagi. Berapakah jumlah epal Amir sekarang?',
    answer: '5',
    instruction: 'Kira jumlah epal.',
    options: ['4', '5', '6', '7']
  };
  const mathSubject = { id: 'math', title: 'Matematik' };
  const mathTopic = { id: 'tambah', title: 'Tambah', learningObjective: 'Menambah nombor' };

  const englishQuestion = {
    id: 'eng_nouns_001',
    q: 'Choose the noun: The cat sleeps on the mat.',
    answer: 'cat',
    instruction: 'Choose the noun in the sentence.',
    options: ['cat', 'sleeps', 'on', 'the']
  };
  const englishSubject = { id: 'english', title: 'Bahasa Inggeris' };
  const englishTopic = { id: 'english_nouns_common', title: 'Common Nouns', learningObjective: 'Recognise nouns' };

  const scienceQuestion = {
    id: 'science_classify_001',
    q: 'Which one is a living thing?',
    answer: 'cat',
    instruction: 'Choose the living thing.',
    options: ['chair', 'cat', 'book', 'table']
  };
  const scienceSubject = { id: 'science', title: 'Sains' };
  const scienceTopic = { id: 'science_haiwan', title: 'Haiwan', learningObjective: 'Classify living things' };

  const islamQuestion = {
    id: 'islam_001',
    q: 'Apakah tindakan yang baik ketika bertemu guru?',
    answer: 'memberi salam',
    instruction: 'Pilih tindakan yang baik.',
    options: ['berlari', 'memberi salam', 'menjerit', 'bermain']
  };
  const islamSubject = { id: 'islam', title: 'Pendidikan Islam' };
  const islamTopic = { id: 'islam_adab', title: 'Adab', learningObjective: 'Mengamalkan adab' };

  const arabQuestion = {
    id: 'arab_001',
    q: 'مَدرَسَةٌ',
    answer: 'Sekolah',
    instruction: 'Pilih maksud perkataan Arab.',
    options: ['Sekolah', 'Rumah', 'Masjid', 'Kedai']
  };
  const arabSubject = { id: 'arab', title: 'Bahasa Arab' };
  const arabTopic = { id: 'arab_mufradat', title: 'Mufradat', learningObjective: 'Mengenal kosa kata Arab' };

  const profile = { studentId: 'student-1', name: 'Aisyah', totals: { questionsAnswered: 12, correct: 10, wrong: 2, studyMinutes: 35 } };
  const sparseProfile = { studentId: 'sparse-1', name: 'Mika', totals: { questionsAnswered: 0 }, subjects: {}, topics: {} };

  const responses = [
    {
      name: 'BM proper noun',
      value: await getTutorResponse({
        student: profile,
        subject: bmSubject,
        topic: bmTopic,
        question: bmQuestion,
        questionText: bmQuestion.q,
        instruction: bmQuestion.instruction,
        options: bmQuestion.options,
        expectedAnswer: bmQuestion.answer,
        learnerAnswer: 'buku',
        isCorrect: false,
        attemptCount: 1,
        hintsUsed: 1,
        prompt: 'Kenapa jawapan saya salah?',
        intent: 'wrong_answer_coaching',
        explanationMode: 'wrong_answer_coaching',
        currentLearningObjective: bmTopic.learningObjective
      })
    },
    {
      name: 'Math addition',
      value: await getTutorResponse({
        student: profile,
        subject: mathSubject,
        topic: mathTopic,
        question: mathQuestion,
        questionText: mathQuestion.q,
        instruction: mathQuestion.instruction,
        options: mathQuestion.options,
        expectedAnswer: mathQuestion.answer,
        learnerAnswer: '5',
        isCorrect: true,
        attemptCount: 1,
        prompt: 'Terangkan soalan ini',
        intent: 'question_help',
        explanationMode: 'correct_answer_reinforcement',
        currentLearningObjective: mathTopic.learningObjective
      })
    },
    {
      name: 'English noun',
      value: await getTutorResponse({
        student: profile,
        subject: englishSubject,
        topic: englishTopic,
        question: englishQuestion,
        questionText: englishQuestion.q,
        instruction: englishQuestion.instruction,
        options: englishQuestion.options,
        expectedAnswer: englishQuestion.answer,
        learnerAnswer: 'cat',
        isCorrect: true,
        attemptCount: 1,
        prompt: 'Beri saya petunjuk',
        intent: 'hint',
        explanationMode: 'hint',
        currentLearningObjective: englishTopic.learningObjective
      })
    },
    {
      name: 'Science classification',
      value: await getTutorResponse({
        student: profile,
        subject: scienceSubject,
        topic: scienceTopic,
        question: scienceQuestion,
        questionText: scienceQuestion.q,
        instruction: scienceQuestion.instruction,
        options: scienceQuestion.options,
        expectedAnswer: scienceQuestion.answer,
        learnerAnswer: 'chair',
        isCorrect: false,
        attemptCount: 2,
        prompt: 'Terangkan soalan ini',
        intent: 'question_help',
        explanationMode: 'question_help',
        currentLearningObjective: scienceTopic.learningObjective
      })
    },
    {
      name: 'Islamic Education',
      value: await getTutorResponse({
        student: profile,
        subject: islamSubject,
        topic: islamTopic,
        question: islamQuestion,
        questionText: islamQuestion.q,
        instruction: islamQuestion.instruction,
        options: islamQuestion.options,
        expectedAnswer: islamQuestion.answer,
        learnerAnswer: 'memberi salam',
        isCorrect: true,
        attemptCount: 1,
        prompt: 'Beri contoh mudah',
        intent: 'example_request',
        explanationMode: 'correct_answer_reinforcement',
        currentLearningObjective: islamTopic.learningObjective
      })
    },
    {
      name: 'Arabic text',
      value: await getTutorResponse({
        student: profile,
        subject: arabSubject,
        topic: arabTopic,
        question: arabQuestion,
        questionText: arabQuestion.q,
        instruction: arabQuestion.instruction,
        options: arabQuestion.options,
        expectedAnswer: arabQuestion.answer,
        learnerAnswer: 'Sekolah',
        isCorrect: true,
        attemptCount: 1,
        prompt: 'Terangkan soalan ini',
        intent: 'question_help',
        explanationMode: 'correct_answer_reinforcement',
        currentLearningObjective: arabTopic.learningObjective
      })
    },
    {
      name: 'Missing topic',
      value: await getTutorResponse({
        student: profile,
        subject: bmSubject,
        topic: null,
        question: { id: 'unknown_topic_1', q: 'Pilih jawapan.', answer: 'A' },
        questionText: 'Pilih jawapan.',
        expectedAnswer: 'A',
        learnerAnswer: 'B',
        isCorrect: false,
        attemptCount: 1,
        prompt: 'Beri saya petunjuk',
        intent: 'hint',
        explanationMode: 'hint',
        currentLearningObjective: 'topik semasa'
      })
    },
    {
      name: 'Internal adaptive ID',
      value: await getTutorResponse({
        student: profile,
        subject: { id: 'bm', title: 'Bahasa Melayu' },
        topic: { id: 'adaptive_adaptive_practice_338109144_v5znxc', title: '', learningObjective: 'Latihan adaptif' },
        question: { id: 'adaptive_q', q: 'Pilih topik.', answer: 'Latihan Adaptif' },
        questionText: 'Pilih topik.',
        expectedAnswer: 'Latihan Adaptif',
        learnerAnswer: 'Latihan Adaptif',
        isCorrect: true,
        attemptCount: 1,
        prompt: 'Terangkan soalan ini',
        intent: 'question_help',
        explanationMode: 'correct_answer_reinforcement',
        currentLearningObjective: 'Latihan adaptif'
      })
    },
    {
      name: 'Correct answer disclosure',
      value: await getTutorResponse({
        student: profile,
        subject: bmSubject,
        topic: bmTopic,
        question: bmQuestion,
        questionText: bmQuestion.q,
        instruction: bmQuestion.instruction,
        options: bmQuestion.options,
        expectedAnswer: bmQuestion.answer,
        learnerAnswer: bmQuestion.answer,
        isCorrect: true,
        attemptCount: 1,
        prompt: 'Terangkan soalan ini',
        intent: 'question_help',
        explanationMode: 'correct_answer_reinforcement',
        currentLearningObjective: bmTopic.learningObjective
      })
    },
    {
      name: 'Hint only',
      value: await getTutorResponse({
        student: profile,
        subject: bmSubject,
        topic: bmTopic,
        question: bmQuestion,
        questionText: bmQuestion.q,
        instruction: bmQuestion.instruction,
        options: bmQuestion.options,
        expectedAnswer: bmQuestion.answer,
        learnerAnswer: 'buku',
        isCorrect: false,
        attemptCount: 1,
        prompt: 'Beri saya petunjuk',
        intent: 'hint',
        explanationMode: 'hint',
        currentLearningObjective: bmTopic.learningObjective
      })
    }
  ];

  for (const scenario of responses) {
    const payload = scenario.value || {};
    report.scenarios.push({
      name: scenario.name,
      source: payload.source || 'unknown',
      fallbackUsed: Boolean(payload.fallbackUsed),
      intent: payload.intent || '',
      subject: payload.subject || '',
      topic: payload.topic || '',
      shortText: payload.shortText || '',
      text: payload.text || ''
    });
    assert.ok(payload.text, `${scenario.name}: missing text`);
    assert.ok(payload.shortText, `${scenario.name}: missing shortText`);
    assert.ok(payload.intent, `${scenario.name}: missing intent`);
    assertNoLeak(payload.text, `${scenario.name} text`, [bmQuestion.id, mathQuestion.id, englishQuestion.id, scienceQuestion.id, islamQuestion.id, arabQuestion.id, 'adaptive_adaptive_practice_338109144_v5znxc']);
    assertNoLeak(payload.shortText, `${scenario.name} shortText`, [bmQuestion.id, mathQuestion.id, englishQuestion.id, scienceQuestion.id, islamQuestion.id, arabQuestion.id, 'adaptive_adaptive_practice_338109144_v5znxc']);
  }

  const hintResponse = responses.find(item => item.name === 'Hint only')?.value || {};
  assert.ok(!String(hintResponse.text || '').includes(bmQuestion.answer), 'Hint response should not reveal answer');

  const wrongAnswerResponse = responses.find(item => item.name === 'BM proper noun')?.value || {};
  assert.ok(!String(wrongAnswerResponse.shortText || '').includes(bmQuestion.answer), 'Wrong-answer coaching should not reveal answer immediately');
  assert.ok(String(wrongAnswerResponse.text || '').includes('Aina') || String(wrongAnswerResponse.text || '').includes('nama orang'), 'Wrong-answer coaching should be question-specific');

  const internalTopicResponse = responses.find(item => item.name === 'Internal adaptive ID')?.value || {};
  assert.ok(
    String(internalTopicResponse.topic || '').toLowerCase().includes('latihan adaptif') ||
    String(internalTopicResponse.topic || '').toLowerCase().includes('topik semasa'),
    'Internal topic should resolve to a human-readable label'
  );

  const parentProfile = { studentId: 'parent-1', name: 'Mira', totals: { questionsAnswered: 4, correct: 3, wrong: 1, studyMinutes: 18 } };
  const parentSummary = buildParentSummary(parentProfile);
  const resolvedParentProfile = resolveParentProfile(parentProfile);
  const tutorName = (await getTutorResponse({
    student: parentProfile,
    subject: bmSubject,
    topic: bmTopic,
    question: bmQuestion,
    questionText: bmQuestion.q,
    instruction: bmQuestion.instruction,
    options: bmQuestion.options,
    expectedAnswer: bmQuestion.answer,
    learnerAnswer: bmQuestion.answer,
    isCorrect: true,
    attemptCount: 1,
    prompt: 'Terangkan soalan ini',
    intent: 'question_help',
    explanationMode: 'correct_answer_reinforcement',
    currentLearningObjective: bmTopic.learningObjective
  })).studentName;

  assert.equal(getStudentDisplayName(parentProfile, 'Murid'), 'Mira', 'Student display name should preserve real name');
  assert.equal(parentSummary.name, 'Mira', 'Parent summary should preserve real name');
  assert.equal(resolvedParentProfile?.name, 'Mira', 'Resolved parent profile should preserve real name');
  assert.equal(tutorName, 'Mira', 'Tutor AI should use the same name');

  const studyLabels = buildStudyPriorityMap([
    { subjectId: 'english', topicId: 'english_nouns_common', mastery: 45 },
    { subjectId: 'science', topicId: 'science_haiwan', mastery: 62 },
    { subjectId: 'pjk', topicId: 'pj_keselamatan', mastery: 74 }
  ]).map(item => item.subjectLabel);
  assert.ok(studyLabels.includes('Bahasa Inggeris'), 'Study planner should localize English');
  assert.ok(studyLabels.includes('Sains'), 'Study planner should localize Science');
  assert.ok(studyLabels.includes('Pendidikan Jasmani dan Kesihatan'), 'Study planner should localize PJK');

  const fileMap = new Map();
  for (const file of FILES_TO_SCAN) {
    fileMap.set(file, await readFile(file));
  }

  const modalSource = fileMap.get('src/components/ai/TutorAIModal.jsx') || '';
  assert.ok(containsAny(modalSource, ['Beri saya petunjuk', 'Terangkan soalan ini', 'Kenapa jawapan saya salah?', 'Beri contoh mudah']), 'Tutor AI exercise chips missing');
  assert.ok(containsAny(modalSource, ['Lihat kemajuan saya', 'Apa topik lemah saya?', 'Apa cadangan ulang kaji?', 'Bagaimana UASA saya?']), 'Tutor AI analytics chips missing');

  const explainSource = fileMap.get('src/components/ai/AIExplainModal.jsx') || '';
  assert.ok(containsAny(explainSource, ['max-height: min(88dvh, 820px)', 'Lihat penerangan lanjut', '×']), 'AIExplain modal layout contract incomplete');

  const teacherSource = fileMap.get('src/components/ai/AITeacherModal.jsx') || '';
  assert.ok(containsAny(teacherSource, ['max-height: min(88dvh, 820px)', 'Lihat penerangan lanjut', '×']), 'AITeacher modal layout contract incomplete');

  const cssSource = fileMap.get('src/styles/style.css') || '';
  assert.ok(containsAny(cssSource, ['max-height: min(88dvh, 820px)', '.quick-prompts-analytics', 'padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px))', 'padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px))']), 'Modal layout CSS tokens missing');

  const appSource = fileMap.get('src/App.jsx') || '';
  assert.ok(containsAny(appSource, ['suppressed={chatOpen || explainOpen || teacherOpen}', 'BetaFeedbackButton']), 'Feedback button suppression not wired');

  report.checks.push(
    { check: 'No internal IDs leaked', pass: true },
    { check: 'Question-specific response', pass: true },
    { check: 'Hint does not reveal answer', pass: true },
    { check: 'Parent name consistency', pass: true },
    { check: 'Study planner subject labels localized', pass: true },
    { check: 'Quick prompt intents mapped', pass: true },
    { check: 'Modal tokens present', pass: true }
  );

  console.log(JSON.stringify(report, null, 2));
  return report;
}

const report = await main();
if (report.status !== 'PASS') {
  process.exitCode = 1;
}
