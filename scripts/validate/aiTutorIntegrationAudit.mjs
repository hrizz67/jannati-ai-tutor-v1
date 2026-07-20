import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = process.cwd();
const files = {
  index: `${root}\\src\\ai\\index.js`,
  modal: `${root}\\src\\components\\ai\\TutorAIModal.jsx`,
  app: `${root}\\src\\App.jsx`,
  engine: `${root}\\src\\ai\\tutorResponseEngine.js`,
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
  report.files.modalImportsEngine = has(modalText, "from '../../ai/index.js'");
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

  assert(report.files.publicApi, 'src/ai/index.js must export getTutorResponse.', issues);
  assert(report.files.modalImportsEngine, 'TutorAIModal must import getTutorResponse from src/ai/index.js.', issues);
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

  const { getTutorResponse } = await import(pathToFileURL(files.engine).href);

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
        assert(response.fallbackUsed === true, 'Unknown subject should use the fallback path.', issues);
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

  if (issues.length) {
    console.error(JSON.stringify({ ok: false, issues, report }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2));
}

await main();
