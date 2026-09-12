import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const turnEnginePath = resolve(root, 'src/ai/conversation/studentTurnEngine.js');
const tutorEnginePath = resolve(root, 'src/ai/tutorResponseEngine.js');
const modalPath = resolve(root, 'src/components/ai/TutorAIModal.jsx');
const appPath = resolve(root, 'src/App.jsx');

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
assert.equal(understand('tak tahu').intent, 'misunderstanding', '“Tak tahu” mesti dianggap permintaan sokongan, bukan jawapan salah.');
assert.equal(understand('yang tadi').intent, 'clarification_needed', '“Yang tadi” mesti mengekalkan rujukan kepada langkah semasa.');
assert.equal(understand('Apa beza kata nama am dan kata nama khas?').intent, 'comparison_question', 'Soalan perbandingan mesti dikesan.');
assert.equal(understand('Boleh ajar saya darab?').intent, 'how_question', 'Permintaan mengajar cara mesti dikesan.');
assert.equal(understand('Boleh ajar saya darab?').answerCandidate, '', 'Permintaan belajar tidak boleh dianggap sebagai jawapan latihan.');
assert.equal(understand('Hari ni nak belajar apa?', { hasExerciseContext: false }).intent, 'learning_recommendation', 'Permintaan cadangan pelajaran hari ini mesti dikesan.');
assert.equal(understand('Apa patut saya belajar sekarang?', { hasExerciseContext: false }).intent, 'learning_recommendation', 'Variasi ayat cadangan belajar mesti dikesan.');
assert.equal(understand('Saya nak belajar kata nama am', { hasExerciseContext: false }).intent, 'how_question', 'Permintaan belajar topik tertentu mesti dikesan sebagai permintaan mengajar.');
assert.equal(understand('buku').intent, 'direct_answer', 'Jawapan ringkas yang sepadan mesti dianggap cubaan jawapan.');
assert.equal(understand('pensel').intent, 'direct_answer', 'Cubaan jawapan ringkas yang salah masih mesti disemak.');
for (const phrase of ['lepas tu', 'lepas itu', 'selepas tu', 'selepas itu', 'pastu', 'kemudian', 'seterusnya', 'yang seterusnya', 'langkah seterusnya', 'then', 'then what', "what's next", 'what next', 'next step']) {
  const turn = understand(phrase);
  assert.equal(turn.intent, 'question_help', `Frasa sambungan “${phrase}” mesti menggunakan intent bantuan soalan sedia ada.`);
  assert.equal(turn.messageType, 'follow_up_question', `Frasa sambungan “${phrase}” tidak boleh menjadi cubaan jawapan.`);
  assert.equal(turn.answerCandidate, '', `Frasa sambungan “${phrase}” tidak boleh menghasilkan answerCandidate.`);
  assert.equal(turn.referencesPreviousTurn, true, `Frasa sambungan “${phrase}” mesti merujuk perbualan aktif.`);
}
assert.equal(understand('kemudian', { history: [], hasExerciseContext: false, hasLearningContext: false }).intent, 'general', '“Kemudian” tanpa konteks aktif tidak boleh mencipta konteks soalan.');
assert.notEqual(understand('kemudian', { history: [], hasExerciseContext: false, hasLearningContext: false }).messageType, 'follow_up_question');
assert.equal(understand('kemudian', { expectedAnswer: 'kemudian', acceptedAnswers: ['kemudian'] }).intent, 'direct_answer', 'Frasa sambungan yang merupakan accepted answer mesti kekal sebagai jawapan.');
for (const numericAnswer of ['8', '15', '58', '150']) {
  assert.equal(understand(numericAnswer).messageType, 'answer_attempt', `Jawapan angka ${numericAnswer} mesti kekal sebagai cubaan jawapan.`);
}
assert.equal(understand('1 puluh 5 sa', { expectedAnswer: '1 puluh 5 sa', acceptedAnswers: ['1 puluh 5 sa', '1 puluh dan 5 sa'] }).messageType, 'answer_attempt', 'Jawapan perantaraan nilai tempat mesti kekal sebagai cubaan jawapan.');
assert.equal(understand('tolong').intent, 'clarification_needed', 'Permintaan kabur mesti menghasilkan soalan penjelasan.');
assert.equal(understand('Apa khabar?').messageType, 'social', 'Sapaan semula jadi mesti dianggap sebagai perbualan sosial.');
assert.equal(understand('Siapa awak?').intent, 'tutor_identity', 'Murid mesti boleh bertanya identiti Tutor AI.');
assert.equal(understand('Saya penat hari ini').intent, 'learner_state', 'Tutor mesti memahami keadaan emosi dan tenaga murid.');

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

const generalWithoutQuestion = await getTutorResponse({
  student: { id: 'student-1', name: 'Alya' },
  subject: { ...subject, topics: [topic] },
  topic: null,
  question: null,
  prompt: 'Saya tidak pasti hendak mula',
  intent: 'general',
  history: []
});
assert.equal(generalWithoutQuestion.intent, 'general');
assert.equal(generalWithoutQuestion.fallbackUsed, false, 'Pertanyaan umum tanpa soalan mesti dijawab sebagai perbualan, bukan fallback.');
assert.match(generalWithoutQuestion.text, /baik, saya dengar|mahu pastikan saya faham/i, 'Tutor mesti membalas seperti guru yang mendengar murid.');
assert.doesNotMatch(generalWithoutQuestion.text, /lihat soalan ini|klik petunjuk|semak jawapan/i, 'Perbualan umum tidak boleh dipaksa kembali kepada soalan latihan.');
assert.ok(generalWithoutQuestion.quickReplies.some(item => /topik|belajar/i.test(item)), 'Perbualan umum mesti menawarkan langkah susulan yang berguna.');

const learnerState = await getTutorResponse({
  student: { id: 'student-1', name: 'Alya' },
  subject: { ...subject, topics: [topic] },
  topic: null,
  question: null,
  prompt: 'Saya penat hari ini',
  intent: 'general',
  history: []
});
assert.equal(learnerState.intent, 'learner_state');
assert.equal(learnerState.fallbackUsed, false);
assert.match(learnerState.text, /penat|langkah kecil|berehat/i, 'Tutor mesti memberi respons empati yang sesuai dengan keadaan murid.');

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

const crossSubjectLookup = await getTutorResponse({
  student: { id: 'student-1', name: 'Alya' },
  subject: { ...subject, topics: [topic] },
  topic: null,
  question: null,
  availableSubjects: [
    { ...subject, topics: [topic] },
    {
      id: 'sains',
      title: 'Sains',
      topics: [{ id: 'bunyi', title: 'Bunyi', note: 'Bunyi terhasil daripada getaran.' }]
    }
  ],
  prompt: 'Apa itu getaran?',
  intent: 'general',
  history: []
});
assert.equal(crossSubjectLookup.intent, 'knowledge_question');
assert.equal(crossSubjectLookup.subject, 'Sains', 'Tutor mesti mencari konteks subjek lain apabila pertanyaan tidak berkaitan subjek yang sedang dipilih.');
assert.match(crossSubjectLookup.text, /bunyi terhasil daripada getaran/i, 'Pertanyaan umum mesti menggunakan nota kurikulum yang paling berkaitan merentas subjek.');

const unknownConcept = await ask('Apa itu fotosintesis?');
assert.equal(unknownConcept.intent, 'knowledge_question');
assert.match(unknownConcept.text, /belum pasti|nyatakan nama subjek|nama subjek atau topik/i, 'Tutor mesti meminta penjelasan apabila ilmu semasa tidak mencukupi.');
assert.doesNotMatch(unknownConcept.text, /kata nama am ialah/i, 'Tutor tidak boleh mereka jawapan daripada topik lama.');

const correct = await ask('buku');
assert.equal(correct.intent, 'correct_answer_reinforcement');
assert.equal(correct.isCorrect, true);
assert.ok(correct.quickReplies.length >= 1, 'Maklum balas jawapan juga mesti meneruskan perbualan.');

const mathSubject = { id: 'math', title: 'Matematik' };
const mathTopic = { id: 'tambah', title: 'Tambah' };
const mathQuestion = {
  id: 'math-add-34-28',
  subjectId: 'math',
  topicId: 'tambah',
  q: '34 + 28 = ?',
  answer: '62',
  acceptedAnswers: ['62']
};
const mathScopeA = 'account-1::child-a::math::tambah::session-1::math-add-34-28';

async function askMath(prompt, pendingPedagogicalStep = null, overrides = {}) {
  return getTutorResponse({
    student: { id: 'child-a', name: 'Alya' },
    subject: mathSubject,
    topic: mathTopic,
    question: mathQuestion,
    expectedAnswer: '62',
    acceptedAnswers: ['62'],
    prompt,
    intent: 'general',
    history: [],
    conversationKey: mathScopeA,
    pendingPedagogicalStep,
    attemptCount: 0,
    ...overrides
  });
}

function makeMathAction(actionId, label, intent = 'question_help', overrides = {}) {
  const activeQuestion = overrides.question || mathQuestion;
  return {
    actionId,
    label,
    intent,
    source: 'tutor_quick_action',
    conversationKey: overrides.conversationKey || mathScopeA,
    questionId: activeQuestion.id,
    subjectId: overrides.subjectId || 'math',
    topicId: overrides.topicId || activeQuestion.topicId || 'tambah'
  };
}

function clickMathAction(action, pendingPedagogicalStep = null, overrides = {}) {
  return askMath(action.label, pendingPedagogicalStep, {
    ...overrides,
    prompt: action.label,
    intent: action.intent,
    tutorAction: action
  });
}

const startedMathStep = await askMath('Beri saya petunjuk', null, { intent: 'hint' });
assert.equal(startedMathStep.source, 'deterministic-math-pedagogy');
assert.equal(startedMathStep.pedagogicalStepState, 'created');
assert.equal(startedMathStep.pendingPedagogicalStep?.conversationKey, mathScopeA);
assert.deepEqual(startedMathStep.pendingPedagogicalStep?.expectedAnswers.slice(0, 2), ['12', 'dua belas']);
assert.match(startedMathStep.text, /4 \+ 8/);
assert.doesNotMatch(startedMathStep.text, /\b62\b/, 'Langkah awal tidak boleh membocorkan jawapan asal.');

const correctIntermediate = await askMath('12', startedMathStep.pendingPedagogicalStep);
assert.equal(correctIntermediate.intent, 'pedagogical_step');
assert.equal(correctIntermediate.studentIntent, 'direct_answer');
assert.equal(correctIntermediate.pedagogicalStepCorrect, true);
assert.equal(correctIntermediate.isCorrect, false, 'Jawapan langkah tidak boleh menandakan soalan kuiz asal sebagai betul.');
assert.equal(correctIntermediate.pedagogicalStepState, 'correct');
assert.equal(correctIntermediate.pendingPedagogicalStep?.stepIndex, 1);
assert.match(correctIntermediate.text, /12 ialah 1 puluh dan 2 sa/i);
assert.doesNotMatch(correctIntermediate.text, /\b62\b/);

const spokenIntermediate = await askMath('dua belas', startedMathStep.pendingPedagogicalStep);
assert.equal(spokenIntermediate.pedagogicalStepCorrect, true, 'Jawapan nombor dalam perkataan mesti diterima untuk langkah Tutor.');

const wrongIntermediate = await askMath('11', startedMathStep.pendingPedagogicalStep, { attemptCount: 1 });
assert.equal(wrongIntermediate.pedagogicalStepState, 'retry_support');
assert.equal(wrongIntermediate.pendingPedagogicalStep?.attempts, 1);
assert.equal(wrongIntermediate.answerRevealPolicy.attemptCount, 1, 'Cubaan langkah mesti kekal berasingan daripada cubaan soalan asal.');
assert.doesNotMatch(wrongIntermediate.text, /\b62\b/);

const confusedIntermediate = await askMath('tak faham', startedMathStep.pendingPedagogicalStep);
assert.equal(confusedIntermediate.studentIntent, 'misunderstanding');
assert.equal(confusedIntermediate.pedagogicalStepState, 'awaiting_student');
assert.equal(confusedIntermediate.pendingPedagogicalStep?.attempts, 0, 'Isyarat tidak faham tidak boleh dikira sebagai cubaan salah.');
assert.match(confusedIntermediate.text, /digit sa|4 \+ 8/i);

const whyIntermediate = await askMath('kenapa tambah 4 dengan 8?', startedMathStep.pendingPedagogicalStep);
assert.equal(whyIntermediate.studentIntent, 'why_question');
assert.equal(whyIntermediate.pendingPedagogicalStep?.stepId, startedMathStep.pendingPedagogicalStep.stepId);
assert.match(whyIntermediate.text, /rumah sa|nilai tempat/i);

const secondMathStep = correctIntermediate.pendingPedagogicalStep;
const correctPlaceBreakdown = await askMath('1 puluh dan 2 sa', secondMathStep);
assert.equal(correctPlaceBreakdown.pedagogicalStepCorrect, true);
assert.equal(correctPlaceBreakdown.pendingPedagogicalStep?.stepIndex, 2);
assert.match(correctPlaceBreakdown.text, /3 puluh \+ 2 puluh \+ 1 puluh/i);
const completedMathFlow = await askMath('6', correctPlaceBreakdown.pendingPedagogicalStep);
assert.equal(completedMathFlow.pedagogicalStepState, 'completed');
assert.equal(completedMathFlow.pendingPedagogicalStep, null);
assert.match(completedMathFlow.text, /jawab soalan asal sendiri/i);
assert.doesNotMatch(completedMathFlow.text, /\b62\b/);

const simpleAdditionQuestion = {
  id: 'math-add-23-14',
  subjectId: 'math',
  topicId: 'tambah',
  q: '23 + 14 = ?',
  answer: '37',
  acceptedAnswers: ['37']
};
const simpleAdditionOverrides = {
  question: simpleAdditionQuestion,
  expectedAnswer: '37',
  acceptedAnswers: ['37'],
  conversationKey: 'account-1::child-a::math::tambah::session-1::math-add-23-14'
};
const simpleAdditionStart = await askMath('Beri saya petunjuk', null, { ...simpleAdditionOverrides, intent: 'hint' });
assert.match(simpleAdditionStart.text, /3 \+ 4/);
assert.ok(simpleAdditionStart.pendingPedagogicalStep?.expectedAnswers.includes('7'));
const simpleAdditionTens = await askMath('7', simpleAdditionStart.pendingPedagogicalStep, simpleAdditionOverrides);
assert.equal(simpleAdditionTens.pedagogicalStepCorrect, true);
assert.match(simpleAdditionTens.text, /2 puluh \+ 1 puluh/i);
assert.ok(simpleAdditionTens.pendingPedagogicalStep?.expectedAnswers.includes('3'));
const simpleAdditionCompleted = await askMath('3', simpleAdditionTens.pendingPedagogicalStep, simpleAdditionOverrides);
assert.equal(simpleAdditionCompleted.pedagogicalStepState, 'completed');
assert.equal(simpleAdditionCompleted.pendingPedagogicalStep, null);
assert.match(simpleAdditionCompleted.text, /kembali ke soalan.*masukkan jawapan/i);
assert.deepEqual(simpleAdditionCompleted.quickReplies, ['Kembali ke soalan', 'Ulang cara']);
assert.doesNotMatch(simpleAdditionCompleted.text, /\b37\b/, 'Handoff langkah tidak boleh menghantar jawapan kuiz secara automatik.');

const completedFlowHistory = [{ role: 'ai', text: simpleAdditionCompleted.text }];
const wrongFinalAnswer = await askMath('73', null, {
  ...simpleAdditionOverrides,
  history: completedFlowHistory,
  attemptCount: 1
});
assert.equal(wrongFinalAnswer.isCorrect, false);
assert.match(wrongFinalAnswer.shortText, /belum tepat.*semak semula nilai puluh dan sa/i);
assert.doesNotMatch(wrongFinalAnswer.shortText, /menjawab terlalu cepat|\bcuai\b|tidak fokus|\bmeneka\b/i, 'Tutor tidak boleh membuat diagnosis tingkah laku tanpa bukti.');

const completedQuestionAction = await askMath('Kembali ke soalan', null, {
  ...simpleAdditionOverrides,
  history: completedFlowHistory
});
assert.equal(completedQuestionAction.grounded, true);
assert.equal(completedQuestionAction.intent, 'general');
assert.match(completedQuestionAction.shortText, /masih pada soalan ini|kembali ke soalan/i);
assert.doesNotMatch(completedQuestionAction.shortText, /menerangkan satu topik|mencadangkan pelajaran|membantu latihan/i, 'Quick action soalan aktif tidak boleh jatuh ke Tutor-home generik.');

const repeatCompletedMethod = await askMath('Ulang cara', null, {
  ...simpleAdditionOverrides,
  history: completedFlowHistory
});
assert.equal(repeatCompletedMethod.intent, 'pedagogical_step');
assert.equal(repeatCompletedMethod.source, 'deterministic-math-pedagogy');
assert.equal(repeatCompletedMethod.pedagogicalStepState, 'created');
assert.match(repeatCompletedMethod.text, /3 \+ 4/);
assert.doesNotMatch(repeatCompletedMethod.text, /menerangkan satu topik|mencadangkan pelajaran|membantu latihan/i, 'Tindakan ulang cara mesti kekal pada soalan asal.');

const correctFinalAnswer = await askMath('37', null, {
  ...simpleAdditionOverrides,
  history: completedFlowHistory
});
assert.equal(correctFinalAnswer.isCorrect, true);
assert.match(correctFinalAnswer.shortText, /betul! kamu berjaya.*3 puluh dan 7 sa menjadi 37/i);
assert.match(correctFinalAnswer.shortText, /kembali ke soalan.*masukkan jawapan sendiri/i);
assert.deepEqual(correctFinalAnswer.quickReplies, ['Kembali ke soalan', 'Ulang cara']);
assert.doesNotMatch(correctFinalAnswer.shortText, /jawapan perlu disemak/i, 'Maklum balas betul mesti ringkas dan mesra murid Tahun 2.');

const hundredsQuestion = {
  id: 'math-add-120-30',
  subjectId: 'math',
  topicId: 'tambah',
  q: '120 + 30 = ?',
  answer: '150',
  acceptedAnswers: ['150']
};
const hundredsOverrides = {
  question: hundredsQuestion,
  expectedAnswer: '150',
  acceptedAnswers: ['150'],
  conversationKey: 'account-1::child-a::math::tambah::session-1::math-add-120-30'
};
const hundredsHintAction = makeMathAction('hint', 'Beri saya petunjuk', 'hint', hundredsOverrides);
const hundredsHint = await clickMathAction(hundredsHintAction, null, hundredsOverrides);
assert.equal(hundredsHint.source, 'deterministic-math-pedagogy');
assert.equal(hundredsHint.studentTurn.messageType, 'guided_action', 'Klik quick action mesti kekal sebagai guided_action.');
assert.match(hundredsHint.text, /120 ada 1 ratus.*30 ada 3 puluh/i);
assert.match(hundredsHint.text, /2 puluh \+ 3 puluh = berapa puluh/i);
assert.ok(hundredsHint.pendingPedagogicalStep?.expectedAnswers.includes('5'));
assert.doesNotMatch(hundredsHint.text, /\b150\b/, 'Petunjuk awal tidak boleh membocorkan jawapan asal 150.');
assert.equal(hundredsHint.answerRevealPolicy.canRevealAnswer, false);
assert.ok(hundredsHint.quickActions.every(action => action.source === 'tutor_quick_action'));

const identifyAction = hundredsHint.quickActions.find(action => action.actionId === 'identify_operands');
const identifyResponse = await clickMathAction(identifyAction, hundredsHint.pendingPedagogicalStep, hundredsOverrides);
assert.match(identifyResponse.text, /nombor yang hendak ditambah ialah 120 dan 30/i);
assert.ok(identifyResponse.pendingPedagogicalStep?.expectedAnswers.includes('5'));
assert.doesNotMatch(identifyResponse.text, /menerangkan satu topik|mencadangkan pelajaran|membantu latihan/i);

const methodAction = hundredsHint.quickActions.find(action => action.actionId === 'explain_place_value_method');
const methodResponse = await clickMathAction(methodAction, hundredsHint.pendingPedagogicalStep, hundredsOverrides);
assert.match(methodResponse.text, /rumah sa ialah 0 \+ 0/i);
assert.match(methodResponse.text, /rumah puluh ialah 2 puluh \+ 3 puluh/i);
assert.match(methodResponse.text, /rumah ratus ialah 1 ratus \+ 0 ratus/i);
assert.doesNotMatch(methodResponse.text, /\b150\b|menerangkan satu topik|mencadangkan pelajaran/i);

const checkAction = hundredsHint.quickActions.find(action => action.actionId === 'check_final_by_place_value');
const checkResponse = await clickMathAction(checkAction, null, hundredsOverrides);
assert.match(checkResponse.text, /menyemak 120 \+ 30.*sa 0 \+ 0.*puluh 2 \+ 3.*ratus 1 \+ 0/i);
assert.doesNotMatch(checkResponse.text, /\b150\b|menerangkan satu topik|mencadangkan pelajaran/i);

const exampleAction = makeMathAction('example_request', 'Beri contoh mudah', 'example_request', hundredsOverrides);
const analogousExample = await clickMathAction(exampleAction, null, hundredsOverrides);
assert.equal(analogousExample.pedagogicalStepState, 'example_created');
assert.match(analogousExample.text, /20 \+ 10/i);
assert.match(analogousExample.text, /berapa puluh semuanya/i);
assert.equal(analogousExample.pendingPedagogicalStep?.concept, 'analogous_example_tens');
assert.ok(analogousExample.pendingPedagogicalStep?.expectedAnswers.includes('3'));
assert.doesNotMatch(analogousExample.text, /\b150\b/, 'Contoh analogi tidak boleh membocorkan jawapan asal.');

const completedExample = await askMath('3', analogousExample.pendingPedagogicalStep, hundredsOverrides);
assert.equal(completedExample.pedagogicalStepState, 'example_completed');
assert.equal(completedExample.pendingPedagogicalStep, null);
const compareAction = completedExample.quickActions.find(action => action.actionId === 'compare_example');
assert.ok(compareAction, 'Contoh siap mesti menyediakan structured compare action.');
const comparedExample = await clickMathAction(compareAction, null, hundredsOverrides);
assert.equal(comparedExample.studentTurn.messageType, 'guided_action');
assert.equal(comparedExample.pedagogicalStepState, 'created');
assert.match(comparedExample.text, /dalam 20 \+ 10.*dalam 120 \+ 30/i);
assert.match(comparedExample.text, /2 puluh \+ 3 puluh = berapa puluh/i);
assert.ok(comparedExample.pendingPedagogicalStep?.expectedAnswers.includes('5'));
assert.doesNotMatch(comparedExample.text, /kamu jawab.*bimbing saya membandingkan.*belum tepat/i);
assert.doesNotMatch(comparedExample.text, /\b150\b/, 'Perbandingan contoh tidak boleh membocorkan jawapan asal.');

const typedComparisonLabel = await askMath('Bimbing saya membandingkan', null, hundredsOverrides);
assert.equal(typedComparisonLabel.studentTurn.messageType, 'answer_attempt', 'Teks yang ditaip sendiri mesti kekal melalui pengelas biasa.');
assert.notEqual(typedComparisonLabel.studentTurn.messageType, comparedExample.studentTurn.messageType, 'Klik berstruktur dan teks ditaip tidak boleh disamakan.');

const correctHundredsAnswer = await askMath('150', null, hundredsOverrides);
assert.equal(correctHundredsAnswer.isCorrect, true);
assert.match(correctHundredsAnswer.text, /^Betul! 120 ditambah 30 menjadi 150\./i);
assert.match(correctHundredsAnswer.text, /kembali ke soalan dan masukkan jawapan sendiri/i);
assert.deepEqual(correctHundredsAnswer.quickReplies, ['Kembali ke soalan', 'Ulang cara']);
assert.deepEqual(correctHundredsAnswer.quickActions.map(action => action.actionId), ['return_to_original_question', 'restart_guided_method']);
assert.equal(correctHundredsAnswer.pendingPedagogicalStep, null, 'Jawapan Tutor tidak boleh dihantar sebagai cubaan kuiz baharu.');
assert.doesNotMatch(correctHundredsAnswer.text, /jawapan perlu disemak|tepat\. kamu terus/i);

const childBActionResponse = await clickMathAction(identifyAction, null, {
  ...hundredsOverrides,
  student: { id: 'child-b', name: 'Irfan' },
  conversationKey: 'account-1::child-b::math::tambah::session-1::math-add-120-30'
});
assert.notEqual(childBActionResponse.source, 'deterministic-math-pedagogy', 'Quick action Child A tidak boleh mengubah flow Child B.');
assert.equal(childBActionResponse.pendingPedagogicalStep, undefined);

const otherHundredsQuestion = { id: 'math-add-130-30', subjectId: 'math', topicId: 'tambah', q: '130 + 30 = ?', answer: '160', acceptedAnswers: ['160'] };
const otherQuestionActionResponse = await clickMathAction(identifyAction, null, {
  question: otherHundredsQuestion,
  expectedAnswer: '160',
  acceptedAnswers: ['160'],
  conversationKey: 'account-1::child-a::math::tambah::session-1::math-add-130-30'
});
assert.notEqual(otherQuestionActionResponse.source, 'deterministic-math-pedagogy', 'Quick action Q1 tidak boleh mengubah flow Q2.');

const coreQuestion = { id: 'math-add-41-26', subjectId: 'math', topicId: 'tambah', q: '41 + 26 = ?', answer: '67', acceptedAnswers: ['67'] };
const coreOverrides = {
  question: coreQuestion,
  expectedAnswer: '67',
  acceptedAnswers: ['67'],
  conversationKey: 'account-1::child-a::math::tambah::session-1::math-add-41-26'
};
const coreStart = await askMath('Beri saya petunjuk', null, { ...coreOverrides, intent: 'hint' });
assert.match(coreStart.text, /1 \+ 6/);
const coreWrong = await askMath('8', coreStart.pendingPedagogicalStep, coreOverrides);
assert.equal(coreWrong.pedagogicalStepState, 'retry_support');
const coreOnes = await askMath('7', coreWrong.pendingPedagogicalStep, coreOverrides);
assert.match(coreOnes.text, /4 puluh \+ 2 puluh/i);
const coreTens = await askMath('6', coreOnes.pendingPedagogicalStep, coreOverrides);
assert.equal(coreTens.pedagogicalStepState, 'completed');
assert.equal(coreTens.pendingPedagogicalStep, null);
assert.doesNotMatch(coreTens.text, /\b67\b/);
const coreFinal = await askMath('67', null, coreOverrides);
assert.equal(coreFinal.isCorrect, true);
assert.match(coreFinal.text, /6 puluh dan 7 sa menjadi 67/i);

const childBResponse = await askMath('12', startedMathStep.pendingPedagogicalStep, {
  student: { id: 'child-b', name: 'Irfan' },
  conversationKey: 'account-1::child-b::math::tambah::session-1::math-add-34-28'
});
assert.notEqual(childBResponse.source, 'deterministic-math-pedagogy', 'Langkah Child A tidak boleh menilai jawapan Child B.');
assert.equal(childBResponse.pendingPedagogicalStep, undefined);

const otherQuestion = { id: 'math-add-45-12', subjectId: 'math', topicId: 'tambah', q: '45 + 12 = ?', answer: '57', acceptedAnswers: ['57'] };
const otherQuestionResponse = await askMath('12', startedMathStep.pendingPedagogicalStep, {
  question: otherQuestion,
  expectedAnswer: '57',
  acceptedAnswers: ['57'],
  conversationKey: 'account-1::child-a::math::tambah::session-1::math-add-45-12'
});
assert.notEqual(otherQuestionResponse.source, 'deterministic-math-pedagogy', 'Langkah Q1 tidak boleh menilai jawapan untuk Q2.');

const subtractionQuestion = { id: 'math-sub-52-27', subjectId: 'math', topicId: 'tolak', q: '52 - 27 = ?', answer: '25', acceptedAnswers: ['25'] };
const subtractionStart = await askMath('Terangkan soalan ini', null, {
  topic: { id: 'tolak', title: 'Tolak' },
  question: subtractionQuestion,
  expectedAnswer: '25',
  acceptedAnswers: ['25'],
  conversationKey: 'account-1::child-a::math::tolak::session-1::math-sub-52-27',
  intent: 'question_help'
});
assert.equal(subtractionStart.source, 'deterministic-math-pedagogy');
assert.match(subtractionStart.text, /pinjam 1 puluh/i);
assert.ok(subtractionStart.pendingPedagogicalStep.expectedAnswers.includes('10'));

const placeValueQuestion = { id: 'math-place-34', subjectId: 'math', topicId: 'nilai_tempat', q: '34 mempunyai berapa puluh dan berapa sa?', answer: '3 puluh dan 4 sa', acceptedAnswers: ['3 puluh dan 4 sa'] };
const placeValueStart = await askMath('Beri saya petunjuk', null, {
  topic: { id: 'nilai_tempat', title: 'Nilai Tempat' },
  question: placeValueQuestion,
  expectedAnswer: '3 puluh dan 4 sa',
  acceptedAnswers: ['3 puluh dan 4 sa'],
  conversationKey: 'account-1::child-a::math::nilai_tempat::session-1::math-place-34',
  intent: 'hint'
});
assert.equal(placeValueStart.source, 'deterministic-math-pedagogy');
assert.match(placeValueStart.text, /digit 3.*berapa puluh/i);

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

const sparseLearningRecommendation = await getTutorResponse({
  student: { id: 'student-2', name: 'Fayyadh' },
  subject: { ...subject, topics: [topic] },
  topic: null,
  question: null,
  weakTopics: [],
  studyPlan: { focusCount: 3, estimatedMinutes: 15 },
  prompt: 'Hari ni nak belajar apa?',
  intent: 'general',
  history: []
});
assert.match(sparseLearningRecommendation.text, /^Fayyadh, saya belum mempunyai cukup rekod/i, 'Tutor mesti menggunakan nama profil anak aktif walaupun rekod pembelajaran masih terhad.');

const modalText = readFileSync(modalPath, 'utf8');
const appText = readFileSync(appPath, 'utf8');
assert.match(modalText, /function handleTutorSuggestion\(suggestion\)/, 'Balasan pantas mesti menggunakan handler Tutor yang sama.');
assert.match(modalText, /function createTutorAction\(actionId, label, intent/, 'UI mesti mengekalkan identiti structured Tutor action.');
assert.match(modalText, /response\?\.quickActions\?\.length[\s\S]{0,80}response\.quickActions/, 'Structured quick actions mesti disimpan tanpa ditukar kepada string.');
assert.match(modalText, /tutorAction,/, 'Structured Tutor action mesti dihantar kepada enjin berasingan daripada label mesej.');
assert.match(modalText, /hasExerciseContext[\s\S]{0,100}createTutorAction\('continue_current_question'/, 'Suggestion string lama dalam soalan aktif mesti melalui guard tindakan, bukan answer checker.');
assert.match(modalText, /onSuggestion=\{handleTutorSuggestion\}/, 'Cadangan mesej mesti melalui handler balasan pantas Tutor.');
assert.match(modalText, /=== 'kembali ke soalan'[\s\S]{0,120}onTutup\(\)/, 'Tindakan kembali mesti menutup Tutor tanpa menghantar atau menyemak jawapan kuiz.');
assert.match(modalText, /<button type="button" onClick=\{\(\) => onSuggestion\?\.\(item\)\}>/, 'Cadangan Tutor AI mesti berupa butang interaktif.');
assert.doesNotMatch(modalText, /function extractDirectAnswer|function directAnswersMatch/, 'UI tidak boleh mempunyai enjin semakan jawapan pendua.');
assert.match(modalText, /Guru Pembelajaran AI/, 'Identiti Tutor AI mesti jelas sebagai guru pembelajaran.');
assert.match(modalText, /hasVisibleQuestionContext &&/, 'Kad konteks kosong tidak boleh dipaparkan tanpa soalan yang boleh dilihat.');
assert.match(modalText, /className="tutor-ai-tools"/, 'Alat bantuan mesti dipaparkan sebagai tindakan chat yang ringkas.');
assert.doesNotMatch(modalText, /<details[^>]+className="(?:tutor-ai-actions|quick-prompts-analytics)"/, 'Panel besar sebelum perbualan tidak boleh dikekalkan.');
assert.match(modalText, /getStudentDisplayName\(\[profile, adaptiveProfile\], ''\)/, 'Nama Tutor AI mesti mengutamakan profil anak aktif sebelum profil adaptif.');
assert.match(modalText, /student: tutorStudentProfile/, 'Enjin Tutor AI mesti menerima nama profil anak aktif tanpa memutasi data pembelajaran.');
assert.match(modalText, /setMessages\(current => current\.length \? current :/, 'Perbualan Tutor AI mesti kekal apabila modal ditutup dan dibuka semula.');
assert.match(modalText, /history: messages\.slice\(-TUTOR_ENGINE_HISTORY_LIMIT\)/, 'Konteks enjin Tutor mesti dibataskan tanpa memadam sejarah UI.');
assert.match(modalText, /pendingPedagogicalStep/, 'Modal mesti menghantar state langkah pedagogi yang diskop kepada perbualan semasa.');
assert.match(modalText, /createTutorSpeechInputSession/, 'Input suara Tutor mesti menggunakan infrastruktur speech sedia ada.');
assert.match(modalText, /languagePresentation\.contentLocale/, 'Locale pengecaman Tutor mesti datang daripada konfigurasi bahasa subjek.');
assert.match(modalText, /availableSubjects/, 'Tutor AI mesti menerima konteks semua subjek untuk pertanyaan pembelajaran umum.');
assert.match(appText, /const tutorHasExerciseContext = screen === 'quiz'/, 'Konteks soalan hanya boleh diaktifkan dari skrin kuiz.');
assert.match(appText, /const tutorQuestion = tutorHasExerciseContext \? currentQuestion\(\) : null/, 'Soalan latihan lama tidak boleh dihantar dari Papan Utama.');
assert.match(appText, /const tutorConversationRef = useRef\(new Map\(\)\)/, 'Tutor AI dan Tanya Tutor AI mesti berkongsi satu sejarah perbualan dalam memori aplikasi.');
assert.match(appText, /const chatWidget = chatOpen && chatSubject \?/, 'Modal Tutor AI mesti kekal lazy dan hanya dimuatkan apabila dibuka.');
assert.match(appText, /conversationKey=\{tutorConversationKey\}[\s\S]{0,250}initialMessages=\{tutorConversationRef\.current\.get/, 'Sejarah Tutor AI mesti dipulihkan mengikut profil anak aktif.');
assert.match(appText, /tutorConversationRef\.current\.clear\(\)/, 'Sejarah Tutor AI mesti dibersihkan apabila sesi akaun atau profil tempatan ditamatkan.');

console.log('Tutor conversation regression: PASS');
