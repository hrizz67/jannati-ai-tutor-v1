import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = process.cwd();
const files = {
  index: `${root}\\src\\ai\\index.js`,
  modal: `${root}\\src\\components\\ai\\TutorAIModal.jsx`,
  app: `${root}\\src\\App.jsx`,
  engine: `${root}\\src\\ai\\tutorResponseEngine.js`,
  service: `${root}\\src\\utils\\tutorResponseService.js`,
  mathPedagogy: `${root}\\src\\ai\\pedagogy\\mathPedagogicalTurn.js`,
  mathTambahQuestions: `${root}\\src\\data\\mathTambahQuestions.js`,
  mathTolakQuestions: `${root}\\src\\data\\mathTolakQuestions.js`,
  mathDarabQuestions: `${root}\\src\\data\\mathDarabQuestions.js`,
  mathBahagiQuestions: `${root}\\src\\data\\mathBahagiQuestions.js`,
  formatter: `${root}\\src\\utils\\displayFormatter.js`
};

function read(filePath) {
  return readFileSync(filePath, 'utf8');
}

function has(text, pattern) {
  return pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text || fallback;
}

async function main() {
  const issues = [];
  const report = {
    files: {},
    scenarios: []
  };

  const indexText = read(files.index);
  const modalText = read(files.modal);
  const appText = read(files.app);
  const engineText = read(files.engine);
  const formatterText = read(files.formatter);

  report.files.publicApi = has(indexText, /export\s+\{\s*getTutorResponse\s*\}/);
  report.files.modalImportsEngine = has(modalText, "from '../../utils/tutorResponseService.js'") &&
    has(modalText, "from '../../utils/childText.js'");
  report.files.modalUsesHelper = has(modalText, 'getStudentDisplayName');
  report.files.modalUsesTutorAIModal = has(appText, '<TutorAIModal');
  report.files.modalUsesLoadingState = has(modalText, 'Tutor AI sedang menaip');
  report.files.modalUsesFallbackState = has(modalText, 'jawapan sandaran yang selamat');
  report.files.modalUsesErrorState = has(modalText, 'Tutor AI sedang berfikir') && has(modalText, 'status === \'error\'');
  report.files.noAiReply = !has(appText, 'aiReply(');
  report.files.noDemoMurid = !has(modalText, 'Demo Murid');
  report.files.noMojibake = !has(modalText, /â|�/) && !has(engineText, /â|�/);
  report.files.studentDisplayHelperPresent = has(formatterText, 'export function getStudentDisplayName');
  report.files.intentSupport = ['weak_topic', 'revision_plan', 'uasa_summary', 'hint', 'question_help', 'wrong_answer_coaching', 'correct_answer_reinforcement']
    .every(intent => has(modalText, intent) || has(engineText, intent));
  report.files.modalForwardsPedagogicalContext = ['tutorAction,', 'conversationKey: sessionKey', 'pendingPedagogicalStep,']
    .every(value => has(modalText, value));

  assert(report.files.publicApi, 'src/ai/index.js must export getTutorResponse.', issues);
  assert(report.files.modalImportsEngine, 'TutorAIModal must import the public tutor response utilities.', issues);
  assert(report.files.modalUsesHelper, 'TutorAIModal must use getStudentDisplayName.', issues);
  assert(report.files.modalUsesTutorAIModal, 'App must render TutorAIModal.', issues);
  assert(report.files.modalUsesLoadingState, 'TutorAIModal should expose a loading state message.', issues);
  assert(report.files.modalUsesFallbackState, 'TutorAIModal should expose a fallback state message.', issues);
  assert(report.files.modalUsesErrorState, 'TutorAIModal should expose an error state message.', issues);
  assert(report.files.noAiReply, 'Legacy aiReply() usage should not remain in App.', issues);
  assert(report.files.noDemoMurid, 'TutorAIModal should not hardcode Demo Murid.', issues);
  assert(report.files.noMojibake, 'Tutor AI files contain mojibake or replacement characters.', issues);
  assert(report.files.studentDisplayHelperPresent, 'displayFormatter helper must remain available.', issues);
  assert(report.files.intentSupport, 'Tutor AI intent support is incomplete.', issues);
  assert(report.files.modalForwardsPedagogicalContext, 'TutorAIModal must forward action identity and active pedagogical context.', issues);

  // Exercise the same service boundary used by TutorAIModal, not the engine in isolation.
  const { getTutorResponse } = await import(pathToFileURL(files.service).href);
  const { resolveMathQuestionContext } = await import(pathToFileURL(files.mathPedagogy).href);
  const [{ mathTambahQuestions }, { mathTolakQuestions }, { mathDarabQuestions }, { mathBahagiQuestions }] = await Promise.all([
    import(pathToFileURL(files.mathTambahQuestions).href),
    import(pathToFileURL(files.mathTolakQuestions).href),
    import(pathToFileURL(files.mathDarabQuestions).href),
    import(pathToFileURL(files.mathBahagiQuestions).href)
  ]);

  const completeProfile = {
    studentId: 'student-01',
    name: 'Alya',
    level: 7,
    xp: 340,
    streak: 4,
    uasaHistory: [{ score: 84 }, { score: 76 }]
  };
  const subject = {
    id: 'bm',
    title: 'Bahasa Melayu',
    topics: [{ id: 'kata_nama', title: 'Kata Nama' }]
  };
  const topic = { id: 'kata_nama', title: 'Kata Nama' };
  const question = { id: 'q-1', q: 'Pilih kata nama.', answer: 'buku' };
  const mathSubject = {
    id: 'math',
    title: 'Matematik',
    topics: [
      { id: 'tambah', title: 'Tambah' },
      { id: 'tolak', title: 'Tolak' },
      { id: 'darab', title: 'Darab' },
      { id: 'bahagi', title: 'Bahagi' }
    ]
  };
  const mathTopic = { id: 'tambah', title: 'Tambah' };
  const subtractionTopic = { id: 'tolak', title: 'Tolak' };
  const multiplicationTopic = { id: 'darab', title: 'Darab' };
  const divisionTopic = { id: 'bahagi', title: 'Bahagi' };
  const mathQuestion = mathTambahQuestions.find(item => item.q === 'Cari jumlah 120 dan 30.');
  assert(Boolean(mathQuestion), 'The real Year 2 Math question must exist in the authored question bank.', issues);
  const mathConversationKey = 'account-01::student-01::math::tambah::session-01::math-add-120-30';
  const buildMathModalPayload = (activeQuestion, conversationKey, activeTopic = mathTopic) => ({
    student: completeProfile,
    subject: mathSubject,
    topic: activeTopic,
    availableSubjects: [mathSubject],
    question: activeQuestion,
    questionText: activeQuestion.q,
    instruction: '',
    options: [],
    expectedAnswer: activeQuestion.answer,
    learnerAnswer: '',
    studentAnswer: '',
    correctAnswer: activeQuestion.answer,
    acceptedAnswers: activeQuestion.acceptedAnswers,
    explanationMode: '',
    currentLearningObjective: activeTopic.title,
    isCorrect: null,
    attemptCount: 0,
    hintsUsed: 0,
    history: [],
    conversationKey,
    pendingPedagogicalStep: null,
    locale: 'ms-MY'
  });
  const mathModalPayload = buildMathModalPayload(mathQuestion, mathConversationKey);
  const mathTutorAction = (actionId, label, intent, activeQuestion = mathQuestion, conversationKey = mathConversationKey, activeTopic = mathTopic) => ({
    actionId,
    label,
    intent,
    source: 'tutor_quick_action',
    conversationKey,
    questionId: activeQuestion.id,
    subjectId: mathSubject.id,
    topicId: activeTopic.id
  });
  const authoredMathQuestions = {
    structuredAddition: mathTambahQuestions.find(item => item.q.includes('mencari jumlah 36 dan 22')),
    symbolicAddition: mathTambahQuestions.find(item => item.q === 'Hitung 23 + 14.'),
    regroupingExplanation: mathTambahQuestions.find(item => item.q.includes('Dalam 48 + 27')),
    threeOperands: mathTambahQuestions.find(item => item.q.includes('Gabungkan 120, 30 dan 5')),
    complexEvaluation: mathTambahQuestions.find(item => item.skill === 'menilai_jawapan_salah'),
    errorAnalysis: mathTambahQuestions.find(item => item.q.includes('387 + 246 = 523')),
    operationEvaluation: mathTambahQuestions.find(item => item.q.includes('Siti mempunyai 245 pelekat')),
    creationTask: mathTambahQuestions.find(item => item.skill === 'mencipta_ayat_tambah_dua_nombor'),
    missingNumber: mathTambahQuestions.find(item => item.skill === 'nombor_hilang_ke_500'),
    ordering: mathTambahQuestions.find(item => item.questionType === 'ordering'),
    symbolicSubtraction: mathTolakQuestions.find(item => item.q === 'Hitung 47 - 12.'),
    naturalSubtraction: mathTolakQuestions.find(item => item.q === 'Cari beza antara 150 dengan 30.'),
    borrowingExplanation: mathTolakQuestions.find(item => item.q.includes('Dalam 75 - 28')),
    multiplication: mathDarabQuestions.find(item => item.q === 'Hitung 2 x 3.'),
    division: mathBahagiQuestions.find(item => item.q === 'Hitung 12 ÷ 2.')
  };
  Object.entries(authoredMathQuestions).forEach(([name, item]) => {
    assert(Boolean(item), `Required authored Math fixture is missing: ${name}`, issues);
  });
  const canonicalCases = {
    A: resolveMathQuestionContext(authoredMathQuestions.structuredAddition),
    B: resolveMathQuestionContext(mathQuestion),
    C: resolveMathQuestionContext(authoredMathQuestions.symbolicAddition),
    subtractionFoundation: resolveMathQuestionContext(authoredMathQuestions.symbolicSubtraction),
    D: resolveMathQuestionContext(authoredMathQuestions.naturalSubtraction),
    E: resolveMathQuestionContext(authoredMathQuestions.regroupingExplanation),
    F: resolveMathQuestionContext(authoredMathQuestions.borrowingExplanation),
    G: resolveMathQuestionContext(authoredMathQuestions.multiplication),
    H: resolveMathQuestionContext(authoredMathQuestions.division),
    I: resolveMathQuestionContext(authoredMathQuestions.threeOperands),
    J: resolveMathQuestionContext(authoredMathQuestions.complexEvaluation),
    K: resolveMathQuestionContext({ q: '120 + 30', answer: '150', acceptedAnswers: ['150'] }),
    L: resolveMathQuestionContext({ q: 'Dua nombor ialah 120 dan 30.', answer: '150', acceptedAnswers: ['150'] })
  };
  report.canonicalContexts = canonicalCases;
  const hasContext = (key, operation, operands, source = 'structured_metadata') => {
    const context = canonicalCases[key];
    assert(context.operation === operation, `Canonical case ${key} must resolve operation ${operation}.`, issues);
    assert(context.operands.join(',') === operands.join(','), `Canonical case ${key} must preserve operands ${operands.join(',')}.`, issues);
    assert(context.source === source, `Canonical case ${key} must use source ${source}.`, issues);
  };
  hasContext('A', 'addition', [36, 22]);
  assert(canonicalCases.A.numericAnswer === 58 && canonicalCases.A.pedagogyShape === 'binary_compute', 'Case A must be eligible as binary compute with numeric answer 58.', issues);
  hasContext('B', 'addition', [120, 30]);
  assert(canonicalCases.B.pedagogyShape === 'binary_place_value', 'Case B must use binary place-value pedagogy.', issues);
  hasContext('C', 'addition', [23, 14]);
  hasContext('subtractionFoundation', 'subtraction', [47, 12]);
  assert(canonicalCases.subtractionFoundation.deterministicSupported === true, 'Direct 47 - 12 subtraction must remain supported.', issues);
  hasContext('D', 'subtraction', [150, 30]);
  assert(canonicalCases.D.deterministicSupported === false, 'Case D must be recognized without inventing unsupported 3-digit subtraction pedagogy.', issues);
  hasContext('E', 'addition', [48, 27]);
  assert(canonicalCases.E.calculationShape === 'binary_regrouping' && canonicalCases.E.pedagogyShape === 'unsupported_complex_task', 'Case E must preserve its regrouping-explanation semantics.', issues);
  hasContext('F', 'subtraction', [75, 28]);
  assert(canonicalCases.F.calculationShape === 'binary_borrowing' && canonicalCases.F.pedagogyShape === 'unsupported_complex_task', 'Case F must preserve its borrowing-explanation semantics.', issues);
  hasContext('G', 'multiplication', [2, 3]);
  assert(canonicalCases.G.deterministicSupported === false, 'Case G must not receive unsupported multiplication pedagogy.', issues);
  hasContext('H', 'division', [12, 2]);
  assert(canonicalCases.H.deterministicSupported === false, 'Case H must not receive unsupported division pedagogy.', issues);
  hasContext('I', 'addition', [120, 30, 5]);
  assert(canonicalCases.I.pedagogyShape === 'unsupported_complex_task', 'Case I must not be forced into binary pedagogy.', issues);
  hasContext('J', 'addition', [475, 128]);
  assert(canonicalCases.J.pedagogyShape === 'unsupported_complex_task', 'Case J must preserve evaluation task semantics.', issues);
  hasContext('K', 'addition', [120, 30], 'text_parser');
  assert(canonicalCases.K.deterministicSupported === true, 'Case K must retain conservative text-parser fallback.', issues);
  assert(canonicalCases.L.source === 'unsupported' && !canonicalCases.L.operation, 'Case L must not guess an operation from ambiguous text.', issues);
  const additionStems = [
    '120 + 30',
    '120 tambah 30',
    'Tambah 120 dengan 30',
    'Cari jumlah 120 dan 30.',
    'Berapakah jumlah 120 dan 30?',
    'Hitung 120 + 30'
  ];
  const additionParserScenarios = additionStems.map((stem, index) => {
    const activeQuestion = {
      id: `math-parser-addition-${index + 1}`,
      q: stem,
      question: stem,
      answer: '150',
      acceptedAnswers: ['150']
    };
    const conversationKey = `${mathConversationKey}::parser-addition-${index + 1}`;
    return {
      name: `math_parser_addition_${index + 1}`,
      payload: {
        ...buildMathModalPayload(activeQuestion, conversationKey),
        prompt: 'Beri saya petunjuk',
        intent: 'hint',
        tutorAction: mathTutorAction('hint', 'Beri saya petunjuk', 'hint', activeQuestion, conversationKey)
      },
      expect: response => {
        assert(response.source === 'deterministic-math-pedagogy', `Safe addition stem must reach deterministic Math: ${stem}`, issues);
        assert(response.pendingPedagogicalStep?.expectedAnswers?.includes('5'), `Safe addition stem must produce intermediate answer 5: ${stem}`, issues);
        assert(!/\b150\b/.test(response.text), `Safe addition stem must not reveal 150: ${stem}`, issues);
      }
    };
  });
  const nonAdditionStems = ['120 tolak 30', 'Apakah beza 120 dan 30?'];
  const nonAdditionParserScenarios = nonAdditionStems.map((stem, index) => {
    const activeQuestion = {
      id: `math-parser-guard-${index + 1}`,
      q: stem,
      question: stem,
      answer: '90',
      acceptedAnswers: ['90']
    };
    const conversationKey = `${mathConversationKey}::parser-guard-${index + 1}`;
    return {
      name: `math_parser_non_addition_guard_${index + 1}`,
      payload: {
        ...buildMathModalPayload(activeQuestion, conversationKey),
        prompt: 'Beri saya petunjuk',
        intent: 'hint',
        tutorAction: mathTutorAction('hint', 'Beri saya petunjuk', 'hint', activeQuestion, conversationKey)
      },
      expect: response => {
        assert(response.source !== 'deterministic-math-pedagogy', `Non-addition stem must not be parsed as supported addition: ${stem}`, issues);
        assert(!response.pendingPedagogicalStep, `Non-addition stem must not create an addition step: ${stem}`, issues);
      }
    };
  });
  const buildGroundedScenario = ({ name, question: activeQuestion, topic: activeTopic = mathTopic, prompt = 'Beri saya petunjuk', intent = 'hint', actionId = 'hint', forbidden = '', expect }) => {
    const conversationKey = `${mathConversationKey}::${name}`;
    return {
      name,
      payload: {
        ...buildMathModalPayload(activeQuestion, conversationKey, activeTopic),
        prompt,
        intent,
        tutorAction: mathTutorAction(actionId, prompt, intent, activeQuestion, conversationKey, activeTopic)
      },
      expect: response => {
        assert(response.source === 'grounded-math-question-support', `${name} must use grounded complex Math support.`, issues);
        assert(response.mathQuestionContext?.source === 'structured_metadata', `${name} must retain canonical metadata grounding.`, issues);
        assert(response.questionText === activeQuestion.q, `${name} must preserve the authored question.`, issues);
        assert(response.pendingPedagogicalStep === null, `${name} must not create a false deterministic step.`, issues);
        assert(response.quickActions?.every(action => action && typeof action === 'object' && action.source === 'tutor_quick_action'), `${name} quick actions must remain structured.`, issues);
        if (forbidden) assert(!response.text.includes(forbidden), `${name} must not reveal protected answer ${forbidden}.`, issues);
        expect(response);
      }
    };
  };
  const groundedComplexScenarios = [
    buildGroundedScenario({
      name: 'grounded_regrouping_explanation_48_27',
      question: authoredMathQuestions.regroupingExplanation,
      forbidden: '75',
      expect: response => {
        assert(/8 \+ 7 = 15 sa/i.test(response.text), '48 + 27 hint must ground the learner in 8 + 7 and 15 ones.', issues);
        assert(/kumpul(?:kan)? semula/i.test(response.text) && /10 sa.*1 puluh/i.test(response.text), '48 + 27 hint must preserve the reason-for-regrouping task.', issues);
        assert(!/Gabungkan nilai mengikut tempat nilai/i.test(response.text), '48 + 27 must not fall back to the old generic place-value hint.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_regrouping_question_explanation_48_27',
      question: authoredMathQuestions.regroupingExplanation,
      prompt: 'Terangkan soalan ini',
      intent: 'question_help',
      actionId: 'explain_current_question',
      forbidden: '75',
      expect: response => {
        assert(/menerangkan sebab 8 \+ 7 perlu dikumpul semula/i.test(response.text), 'Question explanation must retain the WHY requirement.', issues);
        assert(/kemudian mencari jumlah 48 \+ 27/i.test(response.text), 'Question explanation must retain the final-total requirement.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_regrouping_example_request_48_27',
      question: authoredMathQuestions.regroupingExplanation,
      prompt: 'Beri contoh mudah',
      intent: 'example_request',
      actionId: 'example_request',
      forbidden: '75',
      expect: response => {
        assert(/idea pengumpulan semula/i.test(response.text) && /15 sa/i.test(response.text), 'Unsafe generic example must be replaced by a question-grounded regrouping scaffold.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_borrowing_explanation_75_28',
      question: authoredMathQuestions.borrowingExplanation,
      topic: subtractionTopic,
      forbidden: '47',
      expect: response => {
        assert(/5 sa belum cukup.*8 sa/i.test(response.text), '75 - 28 help must explain why the ones need regrouping.', issues);
        assert(/1 puluh.*10 sa/i.test(response.text), '75 - 28 help must remain grounded in exchanging one ten.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_error_analysis_387_246',
      question: authoredMathQuestions.errorAnalysis,
      forbidden: '633',
      expect: response => {
        assert(/lajur atau langkah yang tersilap/i.test(response.text), 'Error-analysis help must preserve inspection semantics.', issues);
        assert(/8 puluh \+ 4 puluh \+ 1 puluh/i.test(response.text), 'Error-analysis help must use the authored column hint.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_operation_evaluation_245_138',
      question: authoredMathQuestions.operationEvaluation,
      forbidden: '383',
      expect: response => {
        assert(/menilai sama ada operasi yang dipilih sesuai/i.test(response.text), 'Operation-evaluation help must preserve evaluation semantics.', issues);
        assert(/menerima lagi.*bertambah/i.test(response.text), 'Operation-evaluation help must use the authored situation cue.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_creation_task',
      question: authoredMathQuestions.creationTask,
      forbidden: '399',
      expect: response => {
        assert(/membina jawapan sendiri/i.test(response.text), 'Creation help must not answer the construction task.', issues);
        assert(/semua maklumat yang diwajibkan/i.test(response.text), 'Creation help must retain authored response constraints.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_multi_operand_task',
      question: authoredMathQuestions.threeOperands,
      forbidden: '155',
      expect: response => {
        assert(/lebih daripada satu langkah/i.test(response.text), 'Three-operand help must remain multi-step.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_missing_number_task',
      question: authoredMathQuestions.missingNumber,
      forbidden: '154',
      expect: response => {
        assert(/mencari nombor yang hilang/i.test(response.text), 'Missing-number help must retain the missing-number task.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_ordering_task',
      question: authoredMathQuestions.ordering,
      forbidden: '367',
      expect: response => {
        assert(/beberapa hasil sebelum menyusunnya/i.test(response.text), 'Ordering help must retain the ordering task.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_multiplication_hint',
      question: authoredMathQuestions.multiplication,
      topic: multiplicationTopic,
      forbidden: '6',
      expect: response => {
        assert(/Tambah 3 sebanyak 2 kali/i.test(response.text), 'Multiplication must use its safe authored hint without a new deterministic engine.', issues);
      }
    }),
    buildGroundedScenario({
      name: 'grounded_division_hint',
      question: authoredMathQuestions.division,
      topic: divisionTopic,
      forbidden: '6',
      expect: response => {
        assert(/fakta darab 2.*menghasilkan 12/i.test(response.text), 'Division must use its safe authored hint without a new deterministic engine.', issues);
      }
    })
  ];
  const canonicalIntegrationScenarios = [
    {
      name: 'metadata_structured_addition_hint_36_22',
      question: authoredMathQuestions.structuredAddition,
      topic: mathTopic,
      prompt: 'Beri saya petunjuk',
      intent: 'hint',
      actionId: 'hint',
      expect: response => {
        assert(response.source === 'deterministic-math-pedagogy', 'Structured 36 + 22 hint must use deterministic Math.', issues);
        assert(response.mathQuestionContext?.source === 'structured_metadata', 'Structured 36 + 22 must prove metadata-first resolution.', issues);
        assert(response.mathQuestionContext?.operands?.join(',') === '36,22', 'Structured 36 + 22 must retain authored operands.', issues);
        assert(/6 \+ 2/.test(response.text), 'Structured 36 + 22 hint must begin with the ones step.', issues);
        assert(response.pendingPedagogicalStep?.expectedAnswers?.includes('8'), 'Structured 36 + 22 hint must expect intermediate answer 8.', issues);
        assert(!/\b58\b/.test(response.text), 'Structured 36 + 22 hint must not reveal the final answer.', issues);
      }
    },
    {
      name: 'metadata_structured_addition_example_36_22',
      question: authoredMathQuestions.structuredAddition,
      topic: mathTopic,
      prompt: 'Beri contoh mudah',
      intent: 'example_request',
      actionId: 'example_request',
      expect: response => {
        assert(response.source === 'deterministic-math-pedagogy', 'Structured 36 + 22 example must use deterministic Math.', issues);
        assert(response.mathQuestionContext?.source === 'structured_metadata', 'Structured 36 + 22 example must remain metadata-first.', issues);
        assert(response.pendingPedagogicalStep?.concept === 'analogous_example_tens', 'Structured 36 + 22 must create an analogous example step.', issues);
        assert(!/\b58\b/.test(response.text), 'Structured 36 + 22 example must protect the final answer.', issues);
      }
    },
    {
      name: 'metadata_structured_addition_final_36_22',
      question: authoredMathQuestions.structuredAddition,
      topic: mathTopic,
      prompt: '58',
      intent: 'general',
      expect: response => {
        assert(response.source === 'deterministic-math-pedagogy', 'Structured 36 + 22 final answer must use deterministic Math.', issues);
        assert(response.isCorrect === true, 'Structured 36 + 22 final answer must be recognized.', issues);
        assert(/5 puluh dan 8 sa menjadi 58/.test(response.text), 'Structured 36 + 22 must provide a child-friendly final handoff.', issues);
        assert(response.quickActions?.some(action => action.actionId === 'return_to_original_question'), 'Structured 36 + 22 handoff must offer return to question.', issues);
        assert(response.quickActions?.some(action => action.actionId === 'restart_guided_method'), 'Structured 36 + 22 handoff must offer repeat method.', issues);
      }
    },
    {
      name: 'metadata_natural_subtraction_150_30',
      question: authoredMathQuestions.naturalSubtraction,
      topic: subtractionTopic,
      prompt: 'Beri saya petunjuk',
      intent: 'hint',
      actionId: 'hint',
      expect: response => {
        assert(response.mathQuestionContext?.source === 'structured_metadata', 'Natural subtraction must resolve through metadata.', issues);
        assert(response.mathQuestionContext?.operation === 'subtraction', 'Natural subtraction must retain its operation.', issues);
        assert(response.mathQuestionContext?.operands?.join(',') === '150,30', 'Natural subtraction must retain operands 150 and 30.', issues);
        assert(response.source !== 'deterministic-math-pedagogy', 'Unsupported three-digit subtraction must retain the safe grounded fallback.', issues);
        assert(!response.pendingPedagogicalStep, 'Unsupported three-digit subtraction must not create a false deterministic step.', issues);
      }
    },
    ...[
      ['metadata_complex_regrouping_guard', authoredMathQuestions.regroupingExplanation, mathTopic],
      ['metadata_complex_borrowing_guard', authoredMathQuestions.borrowingExplanation, subtractionTopic],
      ['metadata_multiplication_recognition', authoredMathQuestions.multiplication, multiplicationTopic],
      ['metadata_division_recognition', authoredMathQuestions.division, divisionTopic],
      ['metadata_three_operand_guard', authoredMathQuestions.threeOperands, mathTopic],
      ['metadata_complex_evaluation_guard', authoredMathQuestions.complexEvaluation, mathTopic]
    ].map(([name, activeQuestion, activeTopic]) => ({
      name,
      question: activeQuestion,
      topic: activeTopic,
      prompt: 'Beri saya petunjuk',
      intent: 'hint',
      actionId: 'hint',
      expect: response => {
        assert(response.mathQuestionContext?.source === 'structured_metadata', `${name} must resolve through metadata.`, issues);
        assert(response.source !== 'deterministic-math-pedagogy', `${name} must not receive unsupported deterministic pedagogy.`, issues);
        assert(!response.pendingPedagogicalStep, `${name} must not create a false binary step.`, issues);
        assert(response.questionText === activeQuestion.q, `${name} must preserve the authored task text.`, issues);
      }
    }))
  ].map(item => {
    const conversationKey = `${mathConversationKey}::${item.name}`;
    const payload = {
      ...buildMathModalPayload(item.question, conversationKey, item.topic),
      prompt: item.prompt,
      intent: item.intent
    };
    if (item.actionId) {
      payload.tutorAction = mathTutorAction(item.actionId, item.prompt, item.intent, item.question, conversationKey, item.topic);
    }
    return { name: item.name, payload, expect: item.expect };
  });

  const scenarios = [
    {
      name: 'complete_payload',
      payload: {
        student: completeProfile,
        subject,
        topic,
        question,
        studentAnswer: 'buku',
        correctAnswer: 'buku',
        isCorrect: true,
        intent: 'general',
        prompt: 'Hai',
        weakTopics: [{ subjectId: 'bm', topicId: 'kata_kerja', mastery: 42 }],
        strongTopics: [{ subjectId: 'math', topicId: 'tambah', mastery: 91 }],
        studyPlan: { notes: 'Ulang kaji kata kerja dahulu.' },
        readiness: { message: 'Sedia untuk latihan.' }
      },
      expect: response => {
        assert(normalizeText(response.text), 'Complete payload should return text.', issues);
        assert(Array.isArray(response.suggestions), 'Complete payload suggestions must be an array.', issues);
        assert(response.subject === 'Bahasa Melayu', 'Complete payload should preserve subject label.', issues);
      }
    },
    {
      name: 'weak_topic',
      payload: {
        student: completeProfile,
        subject,
        topic,
        question,
        intent: 'weak_topic',
        prompt: 'Apa topik lemah saya?',
        weakTopics: [{ subjectId: 'bm', topicId: 'kata_kerja', mastery: 42, reason: 'Topik ini perlukan latihan.' }]
      },
      expect: response => {
        assert(/kata kerja/i.test(response.text), 'Weak topic response should mention the weak topic.', issues);
      }
    },
    {
      name: 'revision_plan',
      payload: {
        student: completeProfile,
        subject,
        topic,
        question,
        intent: 'revision_plan',
        prompt: 'Apa cadangan ulang kaji?',
        studyPlan: { notes: 'Fokus pada topik lemah dahulu.' }
      },
      expect: response => {
        assert(/ulang kaji/i.test(response.text), 'Revision plan response should mention revision.', issues);
      }
    },
    {
      name: 'uasa_summary',
      payload: {
        student: completeProfile,
        subject,
        topic,
        question,
        intent: 'uasa_summary',
        prompt: 'Bagaimana UASA saya?',
        readiness: { message: 'Teruskan latihan.' }
      },
      expect: response => {
        assert(/ringkasan|markah|rekod/i.test(response.text), 'UASA summary response should mention summary progress details.', issues);
      }
    },
    {
      name: 'hint',
      payload: {
        student: completeProfile,
        subject,
        topic,
        question,
        intent: 'hint',
        prompt: 'Beri petunjuk'
      },
      expect: response => {
        assert(/petunjuk/i.test(response.text), 'Hint response should mention a hint.', issues);
      }
    },
    {
      name: 'wrong_answer_coaching',
      payload: {
        student: completeProfile,
        subject,
        topic,
        question,
        studentAnswer: 'pensel',
        correctAnswer: 'buku',
        isCorrect: false,
        intent: 'wrong_answer_coaching',
        prompt: 'Jawapan saya salah'
      },
      expect: response => {
        assert(/belum tepat|cuba semak/i.test(response.text), 'Wrong answer coaching should coach the learner.', issues);
      }
    },
    {
      name: 'correct_answer_reinforcement',
      payload: {
        student: completeProfile,
        subject,
        topic,
        question,
        studentAnswer: 'buku',
        correctAnswer: 'buku',
        isCorrect: true,
        intent: 'correct_answer_reinforcement',
        prompt: 'Betul'
      },
      expect: response => {
        assert(/Bagus|teruskan/i.test(response.text), 'Correct answer reinforcement should sound encouraging.', issues);
      }
    },
    {
      name: 'unknown_subject',
      payload: {
        student: completeProfile,
        subject: { id: 'unknown', title: 'Unknown Subject', topics: [] },
        topic: { id: 'unknown_topic', title: 'Unknown Topic' },
        question: { id: 'q-unknown', q: 'Soalan ujian?', answer: 'ya' },
        prompt: 'Apa ini?',
        intent: 'general'
      },
      expect: response => {
        assert(normalizeText(response.text), 'Unknown subject should still return safe text.', issues);
        assert(response.fallbackUsed === false, 'Unknown subject should receive a safe clarification instead of a technical fallback.', issues);
        assert(/belum pasti|nyatakan nama subjek|nama subjek atau topik/i.test(response.text), 'Unknown subject should ask the learner for clearer learning context.', issues);
      }
    },
    ...groundedComplexScenarios,
    ...canonicalIntegrationScenarios,
    ...additionParserScenarios,
    ...nonAdditionParserScenarios,
    {
      name: 'math_without_usable_authored_grounding_uses_generic_fallback',
      payload: (() => {
        const activeQuestion = { ...authoredMathQuestions.naturalSubtraction, id: 'math-no-safe-hint', hint: '' };
        const conversationKey = `${mathConversationKey}::no-safe-hint`;
        return {
          ...buildMathModalPayload(activeQuestion, conversationKey, subtractionTopic),
          prompt: 'Beri saya petunjuk',
          intent: 'hint',
          tutorAction: mathTutorAction('hint', 'Beri saya petunjuk', 'hint', activeQuestion, conversationKey, subtractionTopic)
        };
      })(),
      expect: response => {
        assert(!['deterministic-math-pedagogy', 'grounded-math-question-support'].includes(response.source), 'Math without a safe authored hint must retain the existing generic fallback.', issues);
        assert(response.pendingPedagogicalStep == null, 'Generic fallback must not invent a pedagogical step.', issues);
      }
    },
    {
      name: 'modal_service_math_hint_120_30',
      payload: {
        ...mathModalPayload,
        prompt: 'Beri saya petunjuk',
        intent: 'hint',
        tutorAction: mathTutorAction('hint', 'Beri saya petunjuk', 'hint')
      },
      expect: response => {
        assert(response.source === 'deterministic-math-pedagogy', 'Modal hint input must reach deferred deterministic Math.', issues);
        assert(response.mathQuestionContext?.source === 'structured_metadata', 'Real 120 + 30 must use structured metadata before its parsable stem.', issues);
        assert(/120 ada 1 ratus, 2 puluh/i.test(response.text), 'Math hint must decompose 120 by place value.', issues);
        assert(/30 ada 3 puluh/i.test(response.text), 'Math hint must decompose 30 by place value.', issues);
        assert(/2 puluh \+ 3 puluh/i.test(response.text), 'Math hint must ask the question-specific tens step.', issues);
        assert(!/\b150\b/.test(response.text), 'Math hint must not reveal the original final answer.', issues);
        assert(response.pendingPedagogicalStep?.parentQuestionId === mathQuestion.id, 'Math hint must retain the active original question.', issues);
      }
    },
    {
      name: 'modal_service_math_example_120_30',
      payload: {
        ...mathModalPayload,
        prompt: 'Beri contoh mudah',
        intent: 'example_request',
        tutorAction: mathTutorAction('example_request', 'Beri contoh mudah', 'example_request')
      },
      expect: response => {
        assert(response.source === 'deterministic-math-pedagogy', 'Modal example input must reach deferred deterministic Math.', issues);
        assert(/20 \+ 10/i.test(response.text), 'Math example must use the supported analogous 20 + 10 example.', issues);
        assert(response.pendingPedagogicalStep?.concept === 'analogous_example_tens', 'Math example must create the analogous-example step.', issues);
        assert(!/\b150\b/.test(response.text), 'Math example must not reveal the original final answer.', issues);
      }
    },
    {
      name: 'modal_service_math_correct_150',
      payload: {
        ...mathModalPayload,
        prompt: '150',
        intent: 'general'
      },
      expect: response => {
        assert(response.source === 'deterministic-math-pedagogy', 'Typed correct answer must reach deferred deterministic Math.', issues);
        assert(response.text === 'Betul! 120 ditambah 30 menjadi 150. Sekarang kembali ke soalan dan masukkan jawapan sendiri.', 'Typed correct answer must receive the question-specific handoff.', issues);
        assert(response.isCorrect === true, 'Typed correct answer must be recognized as correct.', issues);
        assert(response.pendingPedagogicalStep === null, 'Correct handoff must not leave a pending pedagogical step.', issues);
        assert(response.quickActions?.some(action => action.actionId === 'return_to_original_question'), 'Correct handoff must offer Kembali ke soalan.', issues);
        assert(response.quickActions?.some(action => action.actionId === 'restart_guided_method'), 'Correct handoff must offer Ulang cara.', issues);
        assert(!/Jawapan perlu disemak/i.test(response.text), 'Correct handoff must not fall through to the old Coach response.', issues);
      }
    },
    {
      name: 'arabic_content',
      payload: {
        student: completeProfile,
        subject: { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'huruf_hijaiyah', title: 'Huruf Hijaiyah' }] },
        topic: { id: 'huruf_hijaiyah', title: 'Huruf Hijaiyah' },
        question: { id: 'q-arab', q: 'اختر الحرف الصحيح', answer: 'ب' },
        studentAnswer: 'ب',
        correctAnswer: 'ب',
        isCorrect: true,
        intent: 'question_help',
        prompt: 'Terangkan soalan ini'
      },
      expect: response => {
        assert(normalizeText(response.text), 'Arabic scenario should return text.', issues);
        assert(!/[�]/.test(response.text), 'Arabic scenario should not contain replacement characters.', issues);
      }
    },
    {
      name: 'malformed_data',
      payload: {
        student: null,
        subject: null,
        topic: null,
        question: null,
        studentAnswer: null,
        correctAnswer: null,
        prompt: null,
        intent: null,
        history: null
      },
      expect: response => {
        assert(normalizeText(response.text), 'Malformed payload should still return safe text.', issues);
        assert(Array.isArray(response.suggestions), 'Malformed payload should still return suggestions array.', issues);
      }
    }
  ];

  for (const scenario of scenarios) {
    const started = performance.now();
    const response = await getTutorResponse(scenario.payload);
    const elapsed = performance.now() - started;
    const pass = {
      name: scenario.name,
      elapsedMs: Number(elapsed.toFixed(2)),
      source: response.source,
      fallbackUsed: response.fallbackUsed,
      intent: response.intent,
      confidence: response.confidence,
      textPreview: normalizeText(response.text).slice(0, 120),
      suggestions: Array.isArray(response.suggestions) ? response.suggestions.length : -1
    };
    report.scenarios.push(pass);
    assert(typeof response.text === 'string' && response.text.length > 0, `${scenario.name} must return text.`, issues);
    assert(Array.isArray(response.suggestions), `${scenario.name} suggestions must be an array.`, issues);
    assert(typeof response.fallbackUsed === 'boolean', `${scenario.name} fallbackUsed must be boolean.`, issues);
    assert(Number.isFinite(response.confidence), `${scenario.name} confidence must be numeric.`, issues);
    scenario.expect(response);
  }

  const continuationQuestion = authoredMathQuestions.regroupingExplanation;
  const continuationKey = `${mathConversationKey}::grounded-continu-48-27`;
  const groundedHint = await getTutorResponse({
    ...buildMathModalPayload(continuationQuestion, continuationKey),
    prompt: 'Beri saya petunjuk',
    intent: 'hint',
    tutorAction: mathTutorAction('hint', 'Beri saya petunjuk', 'hint', continuationQuestion, continuationKey)
  });
  const groundedContinuation = await getTutorResponse({
    ...buildMathModalPayload(continuationQuestion, continuationKey),
    prompt: 'lepas tu',
    intent: 'general',
    history: [
      { role: 'user', text: 'Beri saya petunjuk' },
      { role: 'ai', text: groundedHint.text }
    ]
  });
  const recordContinuation = (name, response) => report.scenarios.push({
    name,
    source: response.source,
    fallbackUsed: response.fallbackUsed,
    intent: response.intent,
    confidence: response.confidence,
    textPreview: normalizeText(response.text).slice(0, 160),
    suggestions: response.suggestions.length
  });
  recordContinuation('grounded_48_27_short_continuation', groundedContinuation);
  assert(groundedHint.source === 'grounded-math-question-support', '48 + 27 setup hint must use grounded Math support.', issues);
  assert(groundedContinuation.source === 'grounded-math-question-support', '“lepas tu” must remain in grounded 48 + 27 support.', issues);
  assert(groundedContinuation.studentTurn?.intent === 'question_help', '“lepas tu” must reuse the existing question-help intent.', issues);
  assert(groundedContinuation.studentTurn?.messageType === 'follow_up_question', '“lepas tu” must not become an answer attempt.', issues);
  assert(groundedContinuation.studentTurn?.answerCandidate === '', '“lepas tu” must not produce an answer candidate.', issues);
  assert(!/Kamu jawab ['“”]?lepas tu/i.test(groundedContinuation.text), 'Continuation must not receive wrong-answer wording.', issues);
  assert(/4 puluh \+ 2 puluh \+ 1 puluh/i.test(groundedContinuation.text), '48 + 27 continuation must advance to the carried-tens scaffold.', issues);
  assert(groundedContinuation.text !== groundedHint.text, 'Continuation must not repeat the previous grounded hint.', issues);
  assert(!groundedContinuation.text.includes('75'), 'Continuation must not reveal the protected final answer 75.', issues);
  assert(groundedContinuation.pendingPedagogicalStep?.expectedAnswers?.includes('7'), '48 + 27 continuation must use the existing scoped pending-step mechanism for the tens scaffold.', issues);
  assert(groundedContinuation.pendingPedagogicalStep?.attempts === 0, 'Continuation must not count as a wrong Tutor-step attempt.', issues);
  assert(groundedContinuation.answerRevealPolicy?.attemptCount === 0, 'Grounded continuation must not increment quiz attempts.', issues);

  const repeatedContinuation = await getTutorResponse({
    ...buildMathModalPayload(continuationQuestion, continuationKey),
    prompt: 'pastu?',
    intent: 'general',
    pendingPedagogicalStep: groundedContinuation.pendingPedagogicalStep,
    history: [
      { role: 'user', text: 'Beri saya petunjuk' },
      { role: 'ai', text: groundedHint.text },
      { role: 'user', text: 'lepas tu' },
      { role: 'ai', text: groundedContinuation.text }
    ]
  });
  recordContinuation('grounded_48_27_repeated_continuation', repeatedContinuation);
  assert(/cuba jawab langkah ini dahulu/i.test(repeatedContinuation.text), 'Repeated continuation must keep the learner on the current scaffold.', issues);
  assert(repeatedContinuation.pendingPedagogicalStep?.attempts === 0, 'Repeated continuation must not increment Tutor-step attempts.', issues);
  assert(!/\b75\b|7 puluh|jawapannya/i.test(repeatedContinuation.text), 'Repeated continuation must not auto-solve or reveal 75.', issues);
  assert(repeatedContinuation.answerRevealPolicy?.attemptCount === 0, 'Repeated continuation must not increment original quiz attempts.', issues);

  const groundedStepAnswer = await getTutorResponse({
    ...buildMathModalPayload(continuationQuestion, continuationKey),
    prompt: '7',
    intent: 'general',
    pendingPedagogicalStep: repeatedContinuation.pendingPedagogicalStep,
    history: [
      { role: 'user', text: 'pastu?' },
      { role: 'ai', text: repeatedContinuation.text }
    ]
  });
  recordContinuation('grounded_48_27_tens_answer', groundedStepAnswer);
  assert(groundedStepAnswer.pedagogicalStepState === 'grounded_step_completed', 'Accepted carried-tens answer must complete the grounded intermediate step.', issues);
  assert(/mengapa 8 \+ 7 perlu dikumpul semula/i.test(groundedStepAnswer.text), 'After the tens step, Tutor must return to the original WHY requirement.', issues);
  assert(!/\b75\b/.test(groundedStepAnswer.text), 'Completing the intermediate step must not reveal the original answer.', issues);

  const explicitExplanation = await getTutorResponse({
    ...buildMathModalPayload(continuationQuestion, `${continuationKey}::explicit`),
    prompt: 'Terangkan soalan ini',
    intent: 'question_help',
    tutorAction: mathTutorAction('explain_current_question', 'Terangkan soalan ini', 'question_help', continuationQuestion, `${continuationKey}::explicit`)
  });
  recordContinuation('grounded_48_27_explicit_explanation', explicitExplanation);
  assert(/soalan ini meminta kamu menerangkan sebab/i.test(explicitExplanation.text), 'Explicit explain action must continue to explain the original task.', issues);
  assert(!/sekarang cuba: Berapa 4 puluh/i.test(explicitExplanation.text), 'Explicit explain action must not be treated as typed continuation.', issues);

  const deterministicQuestion = authoredMathQuestions.structuredAddition;
  const deterministicKey = `${mathConversationKey}::continuation-36-22`;
  const deterministicStart = await getTutorResponse({
    ...buildMathModalPayload(deterministicQuestion, deterministicKey),
    prompt: 'Beri saya petunjuk',
    intent: 'hint',
    tutorAction: mathTutorAction('hint', 'Beri saya petunjuk', 'hint', deterministicQuestion, deterministicKey)
  });
  const deterministicContinuation = await getTutorResponse({
    ...buildMathModalPayload(deterministicQuestion, deterministicKey),
    prompt: 'lepas tu',
    intent: 'general',
    pendingPedagogicalStep: deterministicStart.pendingPedagogicalStep,
    history: [
      { role: 'user', text: 'Beri saya petunjuk' },
      { role: 'ai', text: deterministicStart.text }
    ]
  });
  recordContinuation('deterministic_36_22_pending_continuation', deterministicContinuation);
  assert(/6 \+ 2/.test(deterministicContinuation.text), '36 + 22 continuation must keep the learner on the current 6 + 2 step.', issues);
  assert(deterministicContinuation.pendingPedagogicalStep?.stepIndex === 0, 'Continuation must not skip to the tens step.', issues);
  assert(deterministicContinuation.pendingPedagogicalStep?.attempts === 0, 'Continuation must not count as a wrong intermediate answer.', issues);
  assert(!/\b58\b|3 puluh \+ 2 puluh/i.test(deterministicContinuation.text), 'Pending-step continuation must not reveal or jump ahead.', issues);
  const deterministicAnswer = await getTutorResponse({
    ...buildMathModalPayload(deterministicQuestion, deterministicKey),
    prompt: '8',
    intent: 'general',
    pendingPedagogicalStep: deterministicContinuation.pendingPedagogicalStep,
    history: [
      { role: 'user', text: 'lepas tu' },
      { role: 'ai', text: deterministicContinuation.text }
    ]
  });
  recordContinuation('deterministic_36_22_actual_answer', deterministicAnswer);
  assert(deterministicAnswer.studentTurn?.messageType === 'answer_attempt', 'Numeric answer 8 must keep answer-attempt priority.', issues);
  assert(/3 puluh \+ 2 puluh/i.test(deterministicAnswer.text), 'Accepted answer 8 must advance the existing deterministic flow.', issues);

  const continueGroundedShape = async (activeQuestion, activeTopic, suffix, forbidden) => {
    const conversationKey = `${mathConversationKey}::continuation-${suffix}`;
    const hint = await getTutorResponse({
      ...buildMathModalPayload(activeQuestion, conversationKey, activeTopic),
      prompt: 'Beri saya petunjuk',
      intent: 'hint',
      tutorAction: mathTutorAction('hint', 'Beri saya petunjuk', 'hint', activeQuestion, conversationKey, activeTopic)
    });
    const response = await getTutorResponse({
      ...buildMathModalPayload(activeQuestion, conversationKey, activeTopic),
      prompt: 'lepas tu',
      intent: 'general',
      history: [
        { role: 'user', text: 'Beri saya petunjuk' },
        { role: 'ai', text: hint.text }
      ]
    });
    recordContinuation(`grounded_${suffix}_continuation`, response);
    assert(response.source === 'grounded-math-question-support', `${suffix} continuation must stay grounded.`, issues);
    assert(response.studentTurn?.messageType === 'follow_up_question', `${suffix} continuation must not be an answer attempt.`, issues);
    assert(!new RegExp(`\\b${forbidden}\\b`).test(response.text), `${suffix} continuation must not reveal ${forbidden}.`, issues);
    assert(response.answerRevealPolicy?.attemptCount === 0, `${suffix} continuation must not increment quiz attempts.`, issues);
    return response;
  };
  const errorContinuation = await continueGroundedShape(authoredMathQuestions.errorAnalysis, mathTopic, 'error_analysis', '633');
  assert(/lajur puluh/i.test(errorContinuation.text) && /dikumpul semula/i.test(errorContinuation.text), 'Error-analysis continuation must advance to the carried-value/next-column check.', issues);
  const operationContinuation = await continueGroundedShape(authoredMathQuestions.operationEvaluation, mathTopic, 'operation_evaluation', '383');
  assert(/operasi yang sepadan/i.test(operationContinuation.text) && /terangkan sebab/i.test(operationContinuation.text), 'Operation-evaluation continuation must advance operation-choice reasoning.', issues);
  const multiplicationContinuation = await continueGroundedShape(authoredMathQuestions.multiplication, multiplicationTopic, 'multiplication', '6');
  assert(/3 ditambah sebanyak 2 kali/i.test(multiplicationContinuation.text), 'Multiplication continuation must remain grounded in repeated addition.', issues);
  assert(multiplicationContinuation.mathQuestionContext?.operation === 'multiplication', 'Multiplication continuation must not activate addition pedagogy.', issues);

  if (issues.length) {
    console.error(JSON.stringify({ ok: false, issues, report }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2));
}

await main();
