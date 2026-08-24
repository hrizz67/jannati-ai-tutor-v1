const path = require('path');
const { pathToFileURL } = require('url');

async function loadModule(relPath) {
  const abs = path.resolve(relPath);
  return import(`${pathToFileURL(abs).href}?v=${Date.now()}`);
}

function detectOperation(text = '') {
  const lower = String(text).toLowerCase();
  if (/[x×]/.test(lower) || /\bdarab\b|\bkali\b/.test(lower)) return 'multiply';
  if (/[÷]/.test(lower) || /\bbahagi\b/.test(lower)) return 'divide';
  if (/[−-]/.test(lower) || /\btolak\b|\bbaki\b|\bbeza\b|\bmemberikan\b|\bberi\b|\bdiberi\b|\bmemberi kepada\b/.test(lower)) return 'subtract';
  if (/[+]/.test(lower) || /\btambah\b|\bjumlah\b|\blagi\b|\bmembeli\b|\bmenerima\b|\bdapat\b/.test(lower)) return 'add';
  return 'unknown';
}

function computeExpected(operation, numbers = []) {
  const [a, b] = numbers;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (operation === 'add') return a + b;
  if (operation === 'subtract') return a - b;
  if (operation === 'multiply') return a * b;
  if (operation === 'divide') return b !== 0 ? a / b : null;
  return null;
}

function extractDisplayedNumbers(stem = '') {
  return String(stem).match(/\d+/g)?.map(Number) || [];
}

async function run() {
  const subjects = await loadModule('src/data/subjects/index.js');
  const qe = await loadModule('src/ai/question/questionEngine.js');

  const math = await subjects.loadSubjectData('math');
  const additionTopic = (math.topics || []).find(t => t.id === 'tambah');
  if (!additionTopic) {
    throw new Error('Topic tambah not found in math subject');
  }

  const questions = [];
  let batch = 0;
  while (questions.length < 100 && batch < 10) {
    const session = await qe.buildQuestionSession({
      count: 100,
      subject: math,
      topic: additionTopic,
      sessionSeed: Date.now() + batch,
      featureFlags: {
        USE_TEMPLATE_ENGINE: true,
        QUESTION_TEMPLATE_ENGINE: true
      }
    });
    const generated = Array.isArray(session.questions) ? session.questions : [];
    questions.push(...generated);
    batch += 1;
  }
  const auditedQuestions = questions.slice(0, 100);
  console.log(`questions: ${auditedQuestions.length}`);

  const audited = auditedQuestions.map(q => {
    const stem = q.q || q.question || q.stem || '';
    const displayedNumbers = extractDisplayedNumbers(stem).slice(0, 2);
    const operation = q.qde?.numberVariation
      ? (q.qde?.operation || detectOperation(stem))
      : detectOperation(stem);
    const expectedAnswer = computeExpected(operation, displayedNumbers);
    const actualAnswer = Number(q.answer);
    const pass = expectedAnswer !== null && Number.isFinite(actualAnswer) && actualAnswer === expectedAnswer;

    return {
      id: q.id,
      stem,
      displayedNumbers,
      variables: q.qip?.numberEngine?.selectedNumbers || q.qde?.numbers || q.qip?.originalVariables || q.qip?.metadata?.variables || null,
      operation,
      answer: q.answer,
      expectedAnswer,
      pass,
      templateId: q.qip?.metadata?.templateId || q.qde?.templateId || null,
      qdeOperation: q.qde?.operation || null,
      numberEngineOperation: q.qip?.numberEngine?.operation || null,
      explanation: q.explanation || null
    };
  });

  const mismatches = audited.filter(item => !item.pass);
  console.log(`answer_mismatches: ${mismatches.length}`);

  const preview = audited.slice(0, 10);

  console.log(JSON.stringify(preview, null, 2));
  if (mismatches.length > 0) {
    console.log('mismatch_samples:');
    console.log(JSON.stringify(mismatches.slice(0, 10), null, 2));
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
