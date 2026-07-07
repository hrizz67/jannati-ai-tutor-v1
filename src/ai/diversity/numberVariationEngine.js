import { extractNumbers } from './duplicateDetector.js';

const YEAR_2_DEFAULTS = {
  min: 1,
  max: 99,
  addMax: 100,
  subtractMin: 0
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashText(text = '') {
  return [...String(text)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function choosePair(seed, usedNumberSequences = new Set(), config = {}) {
  const limits = { ...YEAR_2_DEFAULTS, ...config };
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const a = clamp(((seed * 17 + attempt * 23) % limits.max) + limits.min, limits.min, limits.max);
    const b = clamp(((seed * 31 + attempt * 19) % limits.max) + limits.min, limits.min, limits.max);
    const signature = `${a}|${b}`;
    if (!usedNumberSequences.has(signature) && Math.abs(a - b) > 2) return [a, b];
  }
  return [
    clamp((seed % limits.max) + limits.min, limits.min, limits.max),
    clamp(((seed + 37) % limits.max) + limits.min, limits.min, limits.max)
  ];
}

function operationFor(question = {}, seed = 0) {
  const text = `${question.q || ''} ${question.hint || ''} ${question.explanation || ''}`;
  const topicText = `${question.topicId || ''} ${question.topicTitle || ''}`;
  if (/darab|multiply|kali/i.test(topicText)) return 'multiply';
  if (/[x×]/.test(text) || /darab|kali|setiap|kumpulan/i.test(text)) return 'multiply';
  if (/[÷]/.test(text) || /bahagi/i.test(text)) return 'divide';
  if (/[−-]/.test(text) || /tolak|baki|beza/i.test(text)) return 'subtract';
  if (/[+]/.test(text) || /tambah|lagi|membeli/i.test(text)) return 'add';
  return seed % 2 === 0 ? 'unknown' : 'unknown';
}

function renderTemplate(template, values) {
  return template.replace(/\{A\}/g, values.A).replace(/\{B\}/g, values.B);
}

function computeAnswer(operation, a, b) {
  if (operation === 'subtract') return a - b;
  if (operation === 'add') return a + b;
  if (operation === 'multiply') return a * b;
  if (operation === 'divide') return b !== 0 ? a / b : null;
  return null;
}

function computeRenderedIntegrity(text, operation) {
  const numbers = extractNumbers(text).slice(0, 2);
  if (numbers.length < 2) return { ok: false, numbers, expected: null };
  const expected = computeAnswer(operation, numbers[0], numbers[1]);
  if (expected === null) return { ok: false, numbers, expected: null };
  return { ok: true, numbers, expected };
}

function operationPair(seed, operation, usedNumberSequences = new Set(), range = {}) {
  const limits = { ...YEAR_2_DEFAULTS, ...range };
  for (let attempt = 0; attempt < 80; attempt += 1) {
    let [a, b] = choosePair(seed + attempt * 41, usedNumberSequences, limits);
    if (operation === 'subtract' && b > a) [a, b] = [b, a];
    if (operation === 'add' && a + b > limits.addMax) b = Math.max(1, limits.addMax - a);
    if (operation === 'subtract' && a - b < limits.subtractMin) b = Math.max(0, a - limits.subtractMin);
    const signature = `${a}|${b}`;
    if (!usedNumberSequences.has(signature)) return [a, b];
  }
  return choosePair(seed + 997, usedNumberSequences, limits);
}

export const VIRTUAL_QUESTION_TEMPLATES = [
  {
    id: 'year2-add-apples',
    subjectId: 'math',
    difficulty: 'mudah',
    template: 'Ali ada {A} biji epal. Dia membeli {B} lagi. Jumlah epal ialah?',
    operation: 'add',
    range: { min: 1, max: 60, addMax: 100 }
  },
  {
    id: 'year2-subtract-marbles',
    subjectId: 'math',
    difficulty: 'sederhana',
    template: 'Siti ada {A} biji guli. Dia beri {B} kepada kawan. Baki guli ialah?',
    operation: 'subtract',
    range: { min: 1, max: 99, subtractMin: 0 }
  }
];

export function applyNumberVariation(question = {}, context = {}) {
  const subjectId = context.subject?.id || question.subjectId;
  const sourceText = question.q || '';
  const existingNumbers = extractNumbers(sourceText);
  if (subjectId !== 'math' || existingNumbers.length < 2) return question;

  const seed = hashText(`${question.id || sourceText}:${context.index || 0}:${context.sessionSeed || 0}`);
  const operation = operationFor(question, seed);
  if (!['add', 'subtract'].includes(operation)) return question;
  let values = null;
  let nextText = sourceText;
  let expectedAnswer = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const [a, b] = operationPair(seed + attempt * 101, operation, context.usedNumberSequences, context.range);
    const candidateValues = [a, b];
    let candidateText = sourceText;
    existingNumbers.slice(0, 2).forEach((number, numberIndex) => {
      candidateText = candidateText.replace(String(number), String(candidateValues[numberIndex]));
    });

    const integrity = computeRenderedIntegrity(candidateText, operation);
    if (!integrity.ok) continue;

    values = integrity.numbers;
    nextText = candidateText;
    expectedAnswer = integrity.expected;
    break;
  }

  if (!values || expectedAnswer === null) {
    return {
      ...question,
      qip: {
        ...(question.qip || {}),
        integrity: {
          ok: false,
          reason: 'Number variation integrity failed'
        }
      }
    };
  }

  return {
    ...question,
    q: nextText,
    answer: String(expectedAnswer),
    accepted: [String(expectedAnswer)],
    qde: {
      ...(question.qde || {}),
      numberVariation: true,
      numbers: values,
      operation,
      originalNumbers: existingNumbers,
      integrity: {
        ok: true,
        expectedAnswer: expectedAnswer
      }
    }
  };
}

export function buildVirtualQuestion(template, context = {}) {
  const seed = hashText(`${template.id}:${context.index || 0}:${context.sessionSeed || 0}`);
  let text = '';
  let values = null;
  let expectedAnswer = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const [a, b] = operationPair(seed + attempt * 131, template.operation, context.usedNumberSequences, template.range);
    const candidateText = renderTemplate(template.template, { A: a, B: b });
    const integrity = computeRenderedIntegrity(candidateText, template.operation);
    if (!integrity.ok) continue;
    text = candidateText;
    values = integrity.numbers;
    expectedAnswer = integrity.expected;
    break;
  }

  if (!values || expectedAnswer === null) {
    throw new Error(`Unable to build virtual question with valid integrity for template ${template.id}`);
  }

  const [a, b] = values;
  return {
    id: `${template.id}_${a}_${b}`,
    q: text,
    answer: String(expectedAnswer),
    accepted: [String(expectedAnswer)],
    hint: template.operation === 'subtract' ? 'Tolak nombor kedua daripada nombor pertama.' : 'Tambah kedua-dua nombor.',
    explanation: template.operation === 'subtract' ? `${a} - ${b} = ${expectedAnswer}` : `${a} + ${b} = ${expectedAnswer}`,
    difficulty: template.difficulty || 'mudah',
    qde: {
      virtual: true,
      templateId: template.id,
      templateUsed: template.template,
      numbers: [a, b],
      operation: template.operation,
      integrity: {
        ok: true,
        expectedAnswer
      }
    }
  };
}
