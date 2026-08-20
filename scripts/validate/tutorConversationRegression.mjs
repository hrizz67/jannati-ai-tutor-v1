import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const turnEnginePath = resolve(root, 'src/ai/conversation/studentTurnEngine.js');
const tutorEnginePath = resolve(root, 'src/ai/tutorResponseEngine.js');
const modalPath = resolve(root, 'src/components/ai/TutorAIModal.jsx');

const { understandStudentTurn } = await import(pathToFileURL(turnEnginePath).href);
const { getTutorResponse } = await import(pathToFileURL(tutorEnginePath).href);

const subject = { id: 'bm', title: 'Bahasa Melayu' };
const topic = {
  id: 'kata_nama_am',
  title: 'Kata Nama Am',
  note: 'Kata nama am ialah nama umum bagi orang, haiwan, benda atau tempat.'
};
const question = {
  id: 'bm-kna-1',
  q: 'Pilih kata nama am dalam ayat.',
  instruction: 'Cari nama umum bagi benda.',
  answer: 'buku',
  acceptedAnswers: ['buku'],
  hint: 'Cari perkataan yang menamakan benda.',
  explanation: 'Buku ialah nama umum bagi benda.'
};
const history = [
  { role: 'user', text: 'Apa itu kata nama am?' },
  { role: 'ai', text: 'Kata nama am ialah nama umum.' }
];

function understand(prompt, overrides = {}) {
  return understandStudentTurn({
    prompt,
    intent: 'general',
    history,
    expectedAnswer: 'buku',
    acceptedAnswers: ['buku'],
    hasExerciseContext: true,
    hasLearningContext: true,
    ...overrides
  });
}

assert.equal(understand('Kenapa?').intent, 'why_question', 'Soalan susulan “Kenapa?” mesti dikenal pasti.');
assert.equal(understand('Kenapa?').referencesPreviousTurn, true, 'Soalan susulan mesti merujuk sejarah perbualan.');
assert.equal(understand('Bagaimana fotosintesis berlaku?').referencesPreviousTurn, false, 'Soalan konsep lengkap tidak boleh dianggap merujuk mesej lama.');
assert.equal(understand('Saya masih tak faham').intent, 'misunderstanding', 'Isyarat belum faham mesti dikesan.');
assert.ok(understand('Saya masih tak faham').quickReplies.length >= 2, 'Isyarat belum faham mesti mempunyai balasan pantas.');
assert.equal(understand('Apa beza kata nama am dan kata nama khas?').intent, 'comparison_question', 'Soalan perbandingan mesti dikesan.');
assert.equal(understand('Boleh ajar saya darab?').intent, 'how_question', 'Permintaan mengajar cara mesti dikesan.');
assert.equal(understand('Boleh ajar saya darab?').answerCandidate, '', 'Permintaan belajar tidak boleh dianggap sebagai jawapan latihan.');
assert.equal(understand('Hari ni nak belajar apa?', { hasExerciseContext: false }).intent, 'learning_recommendation', 'Permintaan cadangan pelajaran hari ini mesti dikesan.');
assert.equal(understand('Apa patut saya belajar sekarang?', { hasExerciseContext: false }).intent, 'learning_recommendation', 'Variasi ayat cadangan belajar mesti dikesan.');
assert.equal(understand('Saya nak belajar kata nama am', { hasExerciseContext: false }).intent, 'how_question', 'Permintaan belajar topik tertentu mesti dikesan sebagai permintaan mengajar.');
assert.equal(understand('buku').intent, 'direct_answer', 'Jawapan ringkas yang sepadan mesti dianggap cubaan jawapan.');
assert.equal(understand('pensel').intent, 'direct_answer', 'Cubaan jawapan ringkas yang salah masih mesti disemak.');
assert.equal(understand('tolong').intent, 'clarification_needed', 'Permintaan kabur mesti menghasilkan soalan penjelasan.');

async function ask(prompt, overrides = {}) {
  return getTutorResponse({
    student: { id: 'student-1', name: 'Alya' },
    subject,
    topic,
    question,
    prompt,
    intent: 'general',
    history,
    ...overrides
  });
}

const comparison = await ask('Apa beza kata nama am dan kata nama khas?');
assert.equal(comparison.intent, 'comparison_question');
assert.match(comparison.text, /kata nama am/i);
assert.match(comparison.text, /kata nama khas/i);
assert.match(comparison.text, /perbezaan|beza/i);
assert.ok(comparison.quickReplies.length >= 2, 'Respons perbandingan mesti meneruskan komunikasi dua hala.');

const why = await ask('Kenapa?');
assert.equal(why.intent, 'why_question');
assert.equal(why.referencesPreviousTurn, true);
assert.match(why.text, /sebab|petunjuk/i);
assert.ok(why.quickReplies.length >= 2, 'Respons sebab mesti mempunyai balasan susulan.');

const misunderstood = await ask('Saya masih tak faham');
assert.equal(misunderstood.intent, 'misunderstanding');
assert.match(misunderstood.text, /cara yang lebih mudah|idea paling asas/i);
assert.match(misunderstood.text, /bahagian mana/i);
assert.ok(misunderstood.quickReplies.includes('Terangkan cara lain'));

const greeting = await ask('Hai');
assert.equal(greeting.fallbackUsed, false, 'Sapaan biasa mesti menerima balasan perbualan, bukan keadaan fallback.');
assert.match(greeting.text, /mencadangkan pelajaran|menerangkan sesuatu topik/i, 'Sapaan mesti diteruskan dengan pilihan pembelajaran yang berguna.');

const crossTopic = await ask('Boleh ajar saya darab?');
assert.equal(crossTopic.intent, 'how_question');
assert.match(crossTopic.text, /darab/i);
assert.match(crossTopic.text, /4 \+ 4 \+ 4/);
assert.doesNotMatch(crossTopic.text, /kata nama am ialah/i, 'Pertanyaan konsep baharu tidak boleh dicampur dengan konteks topik lama.');

const scienceTopicLookup = await getTutorResponse({
  student: { id: 'student-1', name: 'Alya' },
  subject: {
    id: 'sains',
    title: 'Sains',
    topics: [
      { id: 'haiwan', title: 'Haiwan', note: 'Haiwan memerlukan makanan, air dan udara.' },
      { id: 'bunyi', title: 'Bunyi', note: 'Bunyi terhasil daripada getaran.' }
    ]
  },
  topic: { id: 'haiwan', title: 'Haiwan', note: 'Haiwan memerlukan makanan, air dan udara.' },
  question: null,
  prompt: 'Apa itu getaran?',
  intent: 'general'
});
assert.equal(scienceTopicLookup.intent, 'knowledge_question');
assert.match(scienceTopicLookup.text, /bunyi terhasil daripada getaran/i, 'Tutor mesti mencari nota topik berkaitan dalam subjek semasa.');
assert.doesNotMatch(scienceTopicLookup.text, /haiwan memerlukan makanan/i, 'Nota topik lama tidak boleh mencampuri pertanyaan konsep baharu.');

const unknownConcept = await ask('Apa itu fotosintesis?');
assert.equal(unknownConcept.intent, 'knowledge_question');
assert.match(unknownConcept.text, /belum pasti|nyatakan nama subjek|nama subjek atau topik/i, 'Tutor mesti meminta penjelasan apabila ilmu semasa tidak mencukupi.');
assert.doesNotMatch(unknownConcept.text, /kata nama am ialah/i, 'Tutor tidak boleh mereka jawapan daripada topik lama.');

const correct = await ask('buku');
assert.equal(correct.intent, 'correct_answer_reinforcement');
assert.equal(correct.isCorrect, true);
assert.ok(correct.quickReplies.length >= 1, 'Maklum balas jawapan juga mesti meneruskan perbualan.');

const helpRequest = await ask('Boleh ajar saya darab?');
assert.notEqual(helpRequest.studentTurn?.messageType, 'answer_attempt', 'Permintaan bantuan tidak boleh disemak sebagai jawapan.');

const hint = await ask('Beri saya petunjuk', { intent: 'hint', attemptCount: 0, isCorrect: false });
assert.doesNotMatch(hint.text, /jawapan (?:betul|yang diterima).*buku|jawapannya ialah buku/i, 'Petunjuk awal tidak boleh membocorkan jawapan.');

const learningRecommendation = await getTutorResponse({
  student: {
    id: 'student-1',
    name: 'Alya',
    topics: {
      bm: {
        kata_nama_am: { total: 5, correct: 2, wrong: 3, mastery: 40, accuracy: 40, confidence: 50 }
      }
    }
  },
  subject: { ...subject, topics: [topic] },
  topic: null,
  question: null,
  weakTopics: [{ subjectId: 'bm', topicId: 'kata_nama_am', priority: 85, status: 'weak' }],
  studyPlan: { focusCount: 3, estimatedMinutes: 15 },
  prompt: 'Hari ni nak belajar apa?',
  intent: 'general',
  history: []
});
assert.equal(learningRecommendation.intent, 'learning_recommendation');
assert.equal(learningRecommendation.source, 'adaptive-teacher');
assert.equal(learningRecommendation.fallbackUsed, false, 'Cadangan pembelajaran setempat bukan keadaan fallback.');
assert.match(learningRecommendation.text, /kata nama am/i, 'Tutor mesti memilih topik khusus daripada kemajuan murid.');
assert.match(learningRecommendation.text, /berdasarkan kemajuan|perlu dikuatkan/i, 'Tutor mesti menerangkan sebab cadangan secara mesra murid.');
assert.match(learningRecommendation.text, /penerangan atau latihan/i, 'Tutor mesti meneruskan komunikasi dua hala.');
assert.doesNotMatch(learningRecommendation.text, /tanya dengan soalan yang lebih khusus|klik petunjuk|semak jawapan dan cuba lagi/i, 'Permintaan cadangan belajar tidak boleh menerima balasan generik.');
assert.ok(learningRecommendation.quickReplies.some(item => /ajar saya kata nama am/i.test(item)), 'Cadangan mesti menyediakan tindakan susulan khusus.');

const modalText = readFileSync(modalPath, 'utf8');
assert.match(modalText, /onSuggestion=\{suggestion => void sendMessage\(suggestion, 'general'\)\}/, 'Balasan pantas mesti boleh dihantar sebagai mesej pelajar.');
assert.match(modalText, /<button type="button" onClick=\{\(\) => onSuggestion\?\.\(item\)\}>/, 'Cadangan Tutor AI mesti berupa butang interaktif.');
assert.doesNotMatch(modalText, /function extractDirectAnswer|function directAnswersMatch/, 'UI tidak boleh mempunyai enjin semakan jawapan pendua.');
assert.match(modalText, /Guru Pembelajaran AI/, 'Identiti Tutor AI mesti jelas sebagai guru pembelajaran.');
assert.match(modalText, /hasVisibleQuestionContext &&/, 'Kad konteks kosong tidak boleh dipaparkan tanpa soalan yang boleh dilihat.');
assert.match(modalText, /className="tutor-ai-tools"/, 'Alat bantuan mesti dipaparkan sebagai tindakan chat yang ringkas.');
assert.doesNotMatch(modalText, /<details[^>]+className="(?:tutor-ai-actions|quick-prompts-analytics)"/, 'Panel besar sebelum perbualan tidak boleh dikekalkan.');

console.log('Tutor conversation regression: PASS');
