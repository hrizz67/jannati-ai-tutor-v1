const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const REPORT_DIR = path.resolve('reports/audit');
const JSON_PATH = path.join(REPORT_DIR, 'math-stress-test.json');
const MD_PATH = path.join(REPORT_DIR, 'math-stress-test.md');
const SESSION_COUNT = 10000;
const QUESTIONS_PER_SESSION = 20;

const LEARNING_OBJECTIVE_MAP = {
  nombor: 'NUM_001:number_sense_under_1000',
  tambah: 'ADD_001:basic_addition',
  tolak: 'SUB_001:basic_subtraction',
  darab: 'MUL_001:basic_multiplication',
  bahagi: 'DIV_001:basic_division',
  wang: 'MON_001:money_operations',
  masa: 'TIM_001:time_and_schedule',
  panjang: 'MEA_001:length_measurement',
  jisim_isi_padu: 'MEA_002:mass_and_volume',
  bentuk: 'GEO_001:shapes_and_space'
};

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function loadModule(relPath) {
  const modulePath = path.resolve(relPath);
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function normalizeDifficulty(value = '') {
  const text = String(value || '').toLowerCase();
  if (text.includes('sukar') || text.includes('hard')) return 'hard';
  if (text.includes('sederhana') || text.includes('medium')) return 'medium';
  return 'easy';
}

function expectedFromGroupedMultiplicationPattern(text = '') {
  const source = String(text).toLowerCase();
  const numbers = extractDisplayedNumbers(source);
  if (numbers.length < 2) return null;

  const groupedPatterns = [
    /\bbaris\b.*\bsetiap\s+baris\b/,
    /\bada\s+\d+\s+kumpulan\s+dan\s+setiap\s+kumpulan\s+ada\s+\d+\b/,
    /\bada\s+\d+\s+kumpulan\s+dengan\s+\d+\b/,
    /\bsatu\s+set\b.*\bmengandungi\b/,
    /\bjika\s+ada\s+\d+\s+set\b/,
    /\bset\s+mengandungi\b/,
    /\bset\b.*\bsetiap\s+set\b/,
    /\bberapa\s+jumlah\s+objek\b/,
    /\bkumpulan\b.*\bsetiap\s+kumpulan\b/,
    /\bkumpulan\b.*\bmasing(?:-|\s+)masing\s+ada\b/,
    /\bkumpulan\b.*\bada\b.*\bsetiap\s+satu\b/,
    /\bada\s+\d+\s+(?:kotak|kumpulan|beg|bungkus|rak|pinggan|dulang|bekas)\b.*\bada\s+\d+\b/,
    /\bsatu\s+(?:kotak|kumpulan|beg|bungkus|rak|pinggan|dulang|bekas)\b.*\bada\s+\d+\s+(?:kotak|kumpulan|beg|bungkus|rak|pinggan|dulang|bekas)\b/,
    /\bsetiap\s+kumpulan\s+ada\b/,
    /\bjumlah\s+item\s+ialah\b/,
    /\bkotak\b.*\bsetiap\s+kotak\b/,
    /\bbungkus\b.*\bsetiap\s+bungkus\b/,
    /\brak\b.*\bsetiap\s+rak\b/,
    /\bpinggan\b.*\bsetiap\s+pinggan\s+ada\b/,
    /\bbekas\b.*\bsetiap\s+bekas\s+ada\b/,
    /\bbeg\b.*\bsetiap\s+beg\s+ada\b/,
    /\bdulang\b.*\bsetiap\s+dulang\s+ada\b/,
    /\bmeja\b.*\bsetiap\s+meja\s+ada\b/
  ];

  if (!groupedPatterns.some((pattern) => pattern.test(source))) return null;
  if (/\bdikongsi\s+sama\s+rata\b|\bdibahagi\b|\bdiagihkan\b|\bsetiap\s+murid\s+mendapat\b/.test(source)) return null;
  return Number(numbers[0]) * Number(numbers[1]);
}

function expectedFromEqualSharingPattern(text = '') {
  const source = String(text).toLowerCase();
  const numbers = extractDisplayedNumbers(source);
  if (numbers.length < 2) return null;

  const sharingPatterns = [
    /\bdikongsi\s+sama\s+rata\s+kepada\b/,
    /\bdibahagi\s+sama\s+rata\s+kepada\b/,
    /\bdiagihkan\s+sama\s+rata\s+kepada\b/,
    /\bke\s+dalam\s+\d+\s+\w+\s+sama\s+banyak\b/,
    /\bdibahagi\s+kepada\s+kumpulan\b/,
    /\bdibahagi\s+kepada\b.*\bkumpulan\b/
  ];

  const recipientPatterns = [
    /\bsetiap\s+bekas\s+ada\b/,
    /\bsetiap\s+murid\s+mendapat\b/,
    /\bsetiap\s+kumpulan\s+ada\b/,
    /\bsetiap\s+kumpulan\s+mendapat\b/
  ];

  const hasSharingPhrase = sharingPatterns.some((pattern) => pattern.test(source));
  const hasRecipientPhrase = recipientPatterns.some((pattern) => pattern.test(source));
  const hasDivisionCue = /\bbahagi\b|\bdikongsi\b|\bkongsi\b|\bdiagihkan\b|\bdibahagi\b|\bsama\s+banyak\b|\bke\s+dalam\b/.test(source);

  if (!(hasSharingPhrase || (hasRecipientPhrase && hasDivisionCue))) return null;
  return Number(numbers[0]) / Number(numbers[1]);
}

function detectOperation(text = '') {
  const source = String(text).toLowerCase();
  if ((source.match(/\+/g) || []).length >= 1) return 'add';
  if (expectedFromEqualSharingPattern(source) !== null) return 'divide';
  if (expectedFromGroupedMultiplicationPattern(source) !== null) return 'multiply';
  if (/[x×]/.test(source) || /\bdarab\b|\bkali\b/.test(source)) return 'multiply';
  if (/[÷]/.test(source) || /\bbahagi\b|\bdikongsi sama rata\b|\bdibahagi sama rata\b|\bdiagihkan sama rata\b|\bdibahagi kepada kumpulan\b|\bkongsi sama rata\b|\bsetiap murid mendapat\b|\bsetiap kumpulan ada\b|\bsetiap kumpulan mendapat\b|\bsetiap bekas ada\b|\bsetiap bakul ada\b/.test(source)) return 'divide';
  if (/[−-]/.test(source) || /\btolak\b|\bbaki\b|\bbeza\b|\bmemberikan\b|\bberi\b|\bkeluar\b/.test(source)) return 'subtract';
  if (/[+]/.test(source) || /\btambah\b|\bjumlah\b|\blagi\b|\bmembeli\b|\bmemberi\b|\bdiberi\b/.test(source)) return 'add';
  return 'unknown';
}

function computeExpected(operation, numbers = []) {
  const values = numbers.map(Number).filter(Number.isFinite);
  if (values.length < 2) return null;
  if (operation === 'add') return values.reduce((sum, value) => sum + value, 0);
  if (operation === 'subtract') return values.slice(1).reduce((total, value) => total - value, values[0]);
  if (operation === 'multiply') return values.reduce((total, value) => total * value, 1);
  if (operation === 'divide') {
    return values.slice(1).reduce((total, value) => {
      if (value === 0 || total === null) return null;
      return total / value;
    }, values[0]);
  }
  return null;
}

function extractDisplayedNumbers(stem = '') {
  return String(stem).match(/\d+/g)?.map(Number) || [];
}

function extractMoneyValuesCents(text = '') {
  const source = String(text || '');
  const values = [];
  for (const match of source.matchAll(/RM\s*(\d+)(?:\.(\d{1,2}))?/gi)) {
    const ringgit = Number(match[1]);
    const senText = match[2] || '';
    const sen = senText ? Number(senText.padEnd(2, '0')) : 0;
    values.push((ringgit * 100) + sen);
  }
  for (const match of source.matchAll(/\b(\d+)\s*sen\b/gi)) {
    values.push(Number(match[1]));
  }
  return values;
}

function extractTimeValues(text = '') {
  const source = String(text || '');
  const values = [];
  const dayValues = { isnin: 1, selasa: 2, rabu: 3, khamis: 4, jumaat: 5, sabtu: 6, ahad: 7 };
  for (const match of source.matchAll(/\b(\d{1,2}):(\d{2})\b/g)) {
    values.push((Number(match[1]) * 60) + Number(match[2]));
  }
  for (const match of source.matchAll(/\b(\d+)\s+jam\s+(\d+)\s+minit\b/gi)) {
    values.push((Number(match[1]) * 60) + Number(match[2]));
  }
  for (const match of source.matchAll(/\b(\d+)\s+jam\b/gi)) values.push(Number(match[1]) * 60);
  for (const match of source.matchAll(/\b(\d+)\s+minit\b/gi)) values.push(Number(match[1]));
  for (const match of source.matchAll(/\b(isnin|selasa|rabu|khamis|jumaat|sabtu|ahad)\b/gi)) {
    values.push(dayValues[match[1].toLowerCase()]);
  }
  values.push(...extractDisplayedNumbers(source));
  return [...new Set(values.filter(Number.isFinite))];
}

function extractLengthValuesCm(text = '') {
  const source = String(text || '');
  const values = [];
  for (const match of source.matchAll(/\b(\d+)\s*(?:m|meter)\s*(?:dan\s*)?(\d+)\s*(?:cm|sentimeter)\b/gi)) {
    values.push((Number(match[1]) * 100) + Number(match[2]));
  }
  for (const match of source.matchAll(/\b(\d+)\s*(?:cm|sentimeter)\b/gi)) {
    values.push(Number(match[1]));
  }
  for (const match of source.matchAll(/\b(\d+)\s*(?:m|meter)\b(?!\s*(?:dan\s*)?\d+\s*(?:cm|sentimeter))/gi)) {
    values.push(Number(match[1]) * 100);
  }
  return [...new Set(values.filter(Number.isFinite))];
}

function extractMeasurementValuesBase(text = '', kind = '') {
  const source = String(text || '');
  const values = [];
  if (kind === 'mass') {
    for (const match of source.matchAll(/\b(\d+)\s*(?:kg|kilogram)\s*(?:dan\s*)?(\d+)\s*(?:g|gram)\b/gi)) {
      values.push((Number(match[1]) * 1000) + Number(match[2]));
    }
    for (const match of source.matchAll(/\b(\d+)\s*(?:g|gram)\b/gi)) values.push(Number(match[1]));
    for (const match of source.matchAll(/\b(\d+)\s*(?:kg|kilogram)\b(?!\s*(?:dan\s*)?\d+\s*(?:g|gram))/gi)) {
      values.push(Number(match[1]) * 1000);
    }
  }
  if (kind === 'volume') {
    for (const match of source.matchAll(/\b(\d+)\s*(?:L|liter)\s*(?:dan\s*)?(\d+)\s*(?:mL|mililiter)\b/gi)) {
      values.push((Number(match[1]) * 1000) + Number(match[2]));
    }
    for (const match of source.matchAll(/\b(\d+)\s*(?:mL|mililiter)\b/gi)) values.push(Number(match[1]));
    for (const match of source.matchAll(/\b(\d+)\s*(?:L|liter)\b(?!\s*(?:dan\s*)?\d+\s*(?:mL|mililiter))/gi)) {
      values.push(Number(match[1]) * 1000);
    }
  }
  return [...new Set(values.filter(Number.isFinite))];
}

function computeAuditedCalculation(operation = '', operands = []) {
  const values = Array.isArray(operands) ? operands.map(Number) : [];
  if (values.length < 2 || values.some(value => !Number.isFinite(value))) return null;
  if (operation === 'addition') return values.reduce((sum, value) => sum + value, 0);
  if (operation === 'subtraction') return values.slice(1).reduce((result, value) => result - value, values[0]);
  if (operation === 'multiplication') return values.reduce((product, value) => product * value, 1);
  if (operation === 'division') {
    return values.slice(1).reduce((result, value) => value === 0 ? null : result / value, values[0]);
  }
  if (operation === 'identity') return values[0];
  if (operation === 'maximum') return Math.max(...values);
  if (operation === 'minimum') return Math.min(...values);
  if (operation === 'difference') return Math.max(...values) - Math.min(...values);
  return null;
}

function auditedMoneyIntegrity(question = {}, displayedText = '') {
  if (String(question.metadata?.category || '').toLowerCase() !== 'wang') return null;
  const calculations = question.metadata?.calculations;
  const operations = question.metadata?.calculationOperations;
  const results = question.metadata?.calculationResultsCents;
  const numericAnswerCents = Number(question.metadata?.numericAnswerCents);
  const calculationsValid = Array.isArray(calculations)
    && calculations.length > 0
    && Array.isArray(operations)
    && operations.length === calculations.length
    && Array.isArray(results)
    && results.length === calculations.length
    && calculations.every((operands, index) => Array.isArray(operands)
      && operands.length >= 2
      && operands.every(value => Number.isFinite(Number(value)))
      && computeAuditedCalculation(operations[index], operands) === Number(results[index]));
  if (!calculationsValid || !Number.isInteger(numericAnswerCents)) return false;
  const displayedValues = extractMoneyValuesCents(displayedText);
  return displayedValues.includes(numericAnswerCents)
    || (operations.every(operation => operation === 'identity')
      && displayedValues.length === 0
      && /\b(?:RM|ringgit|sen|wang|baki|bayaran)\b/i.test(String(displayedText || '')));
}

function auditedTimeIntegrity(question = {}, displayedText = '') {
  if (String(question.metadata?.category || '').toLowerCase() !== 'masa') return null;
  const calculations = question.metadata?.calculations;
  const operations = question.metadata?.calculationOperations;
  const results = question.metadata?.calculationResultsMinutes;
  const numericAnswer = Number(question.metadata?.numericAnswerMinutes);
  const calculationsValid = Array.isArray(calculations)
    && calculations.length > 0
    && Array.isArray(operations)
    && operations.length === calculations.length
    && Array.isArray(results)
    && results.length === calculations.length
    && calculations.every((operands, index) => Array.isArray(operands)
      && operands.length >= 2
      && operands.every(value => Number.isFinite(Number(value)))
      && computeAuditedCalculation(operations[index], operands) === Number(results[index]));
  if (!calculationsValid || !Number.isInteger(numericAnswer)) return false;
  const displayedValues = extractTimeValues(displayedText);
  return displayedValues.includes(numericAnswer)
    || (operations.every(operation => operation === 'identity')
      && /\b(?:hari|minggu|bulan|tahun|jam|minit|waktu|jarum)\b/i.test(String(displayedText || '')));
}

function auditedLengthIntegrity(question = {}, displayedText = '') {
  if (String(question.metadata?.category || '').toLowerCase() !== 'panjang') return null;
  const calculations = question.metadata?.calculations;
  const operations = question.metadata?.calculationOperations;
  const results = question.metadata?.calculationResultsCm;
  const numericAnswer = Number(question.metadata?.numericAnswerCm);
  const calculationsValid = Array.isArray(calculations)
    && calculations.length > 0
    && Array.isArray(operations)
    && operations.length === calculations.length
    && Array.isArray(results)
    && results.length === calculations.length
    && calculations.every((operands, index) => Array.isArray(operands)
      && operands.length >= 2
      && operands.every(value => Number.isFinite(Number(value)))
      && computeAuditedCalculation(operations[index], operands) === Number(results[index]));
  if (!calculationsValid || !Number.isInteger(numericAnswer)) return false;
  const displayedValues = extractLengthValuesCm(displayedText);
  return displayedValues.includes(numericAnswer)
    || (operations.every(operation => operation === 'identity')
      && /\b(?:cm|sentimeter|m|meter|panjang|tinggi|lebar|jarak|pembaris|pita ukur|skala|hujung)\b/i.test(String(displayedText || '')));
}

function auditedMeasurementIntegrity(question = {}, displayedText = '') {
  if (String(question.metadata?.category || '').toLowerCase() !== 'jisim_isi_padu') return null;
  const calculations = question.metadata?.calculations;
  const operations = question.metadata?.calculationOperations;
  const results = question.metadata?.calculationResultsBase;
  const numericAnswer = Number(question.metadata?.numericAnswerBase);
  const kind = String(question.metadata?.measurementKind || '').toLowerCase();
  const calculationsValid = ['mass', 'volume'].includes(kind)
    && Array.isArray(calculations)
    && calculations.length > 0
    && Array.isArray(operations)
    && operations.length === calculations.length
    && Array.isArray(results)
    && results.length === calculations.length
    && calculations.every((operands, index) => Array.isArray(operands)
      && operands.length >= 2
      && operands.every(value => Number.isFinite(Number(value)))
      && computeAuditedCalculation(operations[index], operands) === Number(results[index]));
  if (!calculationsValid || !Number.isInteger(numericAnswer)) return false;
  const displayedValues = extractMeasurementValuesBase(displayedText, kind);
  const contextPattern = kind === 'mass'
    ? /\b(?:g|gram|kg|kilogram|jisim|penimbang|berat|ringan)\b/i
    : /\b(?:mL|mililiter|L|liter|isi padu|cecair|jag|silinder|sukat|air|jus|skala|paras|bacaan)\b/i;
  return displayedValues.includes(numericAnswer)
    || (operations.every(operation => operation === 'identity')
      && contextPattern.test(String(displayedText || '')));
}

function auditedGeometryIntegrity(question = {}, displayedText = '') {
  if (String(question.metadata?.category || '').toLowerCase() !== 'bentuk') return null;
  const domain = String(question.metadata?.geometryDomain || '').toLowerCase();
  const shape = String(question.metadata?.shape || '').trim();
  const factType = String(question.metadata?.factType || '').trim();
  const tokens = Array.isArray(question.metadata?.answerTokens) ? question.metadata.answerTokens : [];
  if (!['2d', '3d', 'spatial'].includes(domain) || !shape || !factType || !tokens.length) return false;
  const source = String(displayedText || '')
    .toLocaleLowerCase('ms-MY')
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return tokens.every(token => source.includes(String(token || '').toLocaleLowerCase('ms-MY').trim()));
}

function expectedFromExpressionBeforeBlank(question = {}) {
  const stem = String(question.q || question.question || '');
  if (!stem.includes('______')) return null;

  const expressionMatch = stem.match(/(\d+(?:\s*[+x×÷−-]\s*\d+)+)\s*=\s*_{2,}/i);
  if (!expressionMatch) return null;

  const expression = expressionMatch[1];
  const numbers = expression.match(/\d+/g)?.map(Number) || [];
  if (numbers.length < 2) return null;

  if (expression.includes('+')) return numbers.reduce((sum, value) => sum + value, 0);
  if (/[−-]/.test(expression)) return numbers.slice(1).reduce((total, value) => total - value, numbers[0]);
  if (/[x×]/.test(expression)) return numbers.reduce((total, value) => total * value, 1);
  if (/[÷]/.test(expression)) {
    return numbers.slice(1).reduce((total, value) => {
      if (value === 0 || total === null) return null;
      return total / value;
    }, numbers[0]);
  }

  return null;
}

function expectedFromRepeatedAdditionMultiplication(text = '') {
  const match = String(text || '').match(/(\d+(?:\s*\+\s*\d+){2,})/);
  if (!match) return null;
  const values = match[1].match(/\d+/g)?.map(Number) || [];
  if (values.length < 3 || !values.every((value) => value === values[0])) return null;
  return values[0] * values.length;
}

function expectedFromBlankEquation(question = {}) {
  const expressionExpected = expectedFromExpressionBeforeBlank(question);
  if (expressionExpected !== null) return expressionExpected;

  const stem = String(question.q || question.question || '');
  const answerValue = Number(question.answer);
  if (!stem.includes('______') || !Number.isFinite(answerValue)) return null;

  const numbers = extractDisplayedNumbers(stem);
  if (numbers.length < 2) return null;

  if (/[x×]/.test(stem)) {
    const [left, right] = numbers;
    if (/=\s*\d+/.test(stem)) return left * answerValue === right ? answerValue : null;
    if (/^\s*\d+\s*[x×]/.test(stem)) return answerValue * right === left ? answerValue : null;
  }

  if (/[÷]/.test(stem) || /\bbahagi\b/i.test(stem)) {
    const [left, right] = numbers;
    if (/=\s*\d+/.test(stem)) return answerValue !== 0 && left / answerValue === right ? answerValue : null;
    if (/^\s*\d+\s*[÷]/.test(stem)) return right !== 0 && answerValue / right === left ? answerValue : null;
  }

  if (/[+]/.test(stem)) {
    const [left, right] = numbers;
    if (/=\s*\d+/.test(stem)) return left + answerValue === right ? answerValue : null;
  }

  if (/[−-]/.test(stem)) {
    const [left, right] = numbers;
    if (/=\s*\d+/.test(stem)) return left - answerValue === right ? answerValue : null;
  }

  return null;
}

function explanationIntegrity(question = {}) {
  const answer = String(question.answer ?? '').trim();
  const explanation = String(question.explanation || '').trim();
  if (!answer || !explanation) return false;

  const normalizedAnswer = answer.toLowerCase();
  const normalizedExplanation = explanation.toLowerCase();
  const auditedNumericAnswer = Number(question.metadata?.numericAnswer);
  const auditedCalculations = question.metadata?.calculations;
  const auditedResults = question.metadata?.calculationResults;
  const auditedOperation = String(question.metadata?.operation || '').toLowerCase();
  const moneyIntegrity = auditedMoneyIntegrity(question, explanation);
  if (moneyIntegrity !== null) return moneyIntegrity;
  const timeIntegrity = auditedTimeIntegrity(question, explanation);
  if (timeIntegrity !== null) return timeIntegrity;
  const lengthIntegrity = auditedLengthIntegrity(question, explanation);
  if (lengthIntegrity !== null) return lengthIntegrity;
  const measurementIntegrity = auditedMeasurementIntegrity(question, explanation);
  if (measurementIntegrity !== null) return measurementIntegrity;
  const geometryIntegrity = auditedGeometryIntegrity(question, explanation);
  if (geometryIntegrity !== null) return geometryIntegrity;
  if (!question.qde?.numberVariation && Number.isFinite(auditedNumericAnswer) && Array.isArray(auditedCalculations) && Array.isArray(auditedResults)) {
    const calculationsValid = auditedCalculations.length === auditedResults.length
      && auditedCalculations.every((operands, index) => Array.isArray(operands)
        && operands.length >= 2
        && operands.every(value => Number.isFinite(Number(value)))
        && computeAuditedCalculation(auditedOperation, operands) === Number(auditedResults[index]));
    return calculationsValid && extractDisplayedNumbers(explanation).includes(auditedNumericAnswer);
  }
  if (normalizedExplanation.includes(normalizedAnswer)) return true;
  const wholeToken = new RegExp(`(^|[^\\p{L}\\p{N}])${normalizedAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'u');
  if (wholeToken.test(normalizedExplanation)) return true;

  const answerNumbers = extractDisplayedNumbers(answer);
  const explanationNumbers = extractDisplayedNumbers(explanation);
  if (answerNumbers.length && answerNumbers.every(value => explanationNumbers.includes(value))) return true;

  const answerTokens = normalizedAnswer.match(/[\p{L}\p{N}]+/gu) || [];
  const stopwords = new Set(['dan', 'ialah', 'kerana', 'yang', 'itu', 'jawapan', 'betul', 'salah', 'tidak', 'ya']);
  const meaningfulTokens = answerTokens.filter(token => !stopwords.has(token));
  if (meaningfulTokens.length && meaningfulTokens.every(token => {
    const tokenPattern = new RegExp(`(^|[^\\p{L}\\p{N}])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'u');
    return tokenPattern.test(normalizedExplanation);
  })) return true;

  const numbers = extractDisplayedNumbers(question.q || question.question || '');
  const expressionExpected = expectedFromExpressionBeforeBlank(question);
  const equalSharingExpected = expectedFromEqualSharingPattern(question.q || question.question || '');
  const groupedExpected = expectedFromGroupedMultiplicationPattern(question.q || question.question || '');
  const operation = question.qip?.numberEngine?.operation || question.qde?.operation || detectOperation(question.q || question.question || '');
  const repeatedAdditionExpected = operation === 'multiply'
    ? expectedFromRepeatedAdditionMultiplication(question.q || question.question || '')
    : null;
  const expected = expressionExpected ?? equalSharingExpected ?? groupedExpected ?? repeatedAdditionExpected ?? computeExpected(operation, numbers);
  return expected !== null && String(expected) === answer && normalizedExplanation.includes(String(expected));
}

function answerIntegrity(question = {}) {
  const topicId = String(question.topicId || question.qip?.metadata?.topic || question.metadata?.category || '').toLowerCase();
  if (topicId === 'nombor') {
    return String(question.answer ?? '').trim().length > 0;
  }

  const auditedNumericAnswer = Number(question.metadata?.numericAnswer);
  const auditedCalculations = question.metadata?.calculations;
  const auditedResults = question.metadata?.calculationResults;
  const auditedOperation = String(question.metadata?.operation || '').toLowerCase();
  const moneyIntegrity = auditedMoneyIntegrity(question, question.answer);
  if (moneyIntegrity !== null) return moneyIntegrity;
  const timeIntegrity = auditedTimeIntegrity(question, question.answer);
  if (timeIntegrity !== null) return timeIntegrity;
  const lengthIntegrity = auditedLengthIntegrity(question, question.answer);
  if (lengthIntegrity !== null) return lengthIntegrity;
  const measurementIntegrity = auditedMeasurementIntegrity(question, question.answer);
  if (measurementIntegrity !== null) return measurementIntegrity;
  const geometryIntegrity = auditedGeometryIntegrity(question, question.answer);
  if (geometryIntegrity !== null) return geometryIntegrity;
  if (!question.qde?.numberVariation && Number.isFinite(auditedNumericAnswer) && Array.isArray(auditedCalculations) && Array.isArray(auditedResults)) {
    const calculationsValid = auditedCalculations.length === auditedResults.length
      && auditedCalculations.every((operands, index) => Array.isArray(operands)
        && operands.length >= 2
        && operands.every(value => Number.isFinite(Number(value)))
        && computeAuditedCalculation(auditedOperation, operands) === Number(auditedResults[index]));
    return calculationsValid && extractDisplayedNumbers(question.answer).includes(auditedNumericAnswer);
  }

  const blankEquationExpected = expectedFromBlankEquation(question);
  if (blankEquationExpected !== null) {
    return String(blankEquationExpected) === String(question.answer);
  }

  const numbers = extractDisplayedNumbers(question.q || question.question || '');
  const equalSharingExpected = expectedFromEqualSharingPattern(question.q || question.question || '');
  const groupedExpected = expectedFromGroupedMultiplicationPattern(question.q || question.question || '');
  const operation = question.qip?.numberEngine?.operation || question.qde?.operation || detectOperation(question.q || question.question || '');
  const repeatedAdditionExpected = operation === 'multiply'
    ? expectedFromRepeatedAdditionMultiplication(question.q || question.question || '')
    : null;
  const expected = equalSharingExpected ?? groupedExpected ?? repeatedAdditionExpected ?? computeExpected(operation, numbers);
  if (expected === null) return true;
  return String(expected) === String(question.answer);
}

function sortEntries(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function table(lines, headers, rows) {
  lines.push(`| ${headers.join(' | ')} |`);
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
  rows.forEach(row => lines.push(`| ${row.join(' | ')} |`));
  lines.push('');
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# Math Stress Test');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Status');
  lines.push('');
  lines.push(`- Status: ${report.status.toUpperCase()}`);
  lines.push(`- Sessions attempted: ${report.sessionsAttempted}`);
  lines.push(`- Sessions completed: ${report.sessionsCompleted}`);
  lines.push(`- Questions evaluated: ${report.questionsEvaluated}`);
  if (report.failure) {
    lines.push(`- Failed session index: ${report.failure.sessionIndex}`);
    lines.push(`- Failed question id: ${report.failure.questionId}`);
    lines.push(`- Failure code: ${report.failure.code}`);
  }
  lines.push('');

  lines.push('## Session Metrics');
  lines.push('');
  lines.push(`- Duplicate session rate: ${report.statistics.duplicateSessionRate}`);
  lines.push(`- Duplicate stem rate: ${report.statistics.duplicateStemRate}`);
  lines.push(`- Duplicate number signature rate: ${report.statistics.duplicateNumberSignatureRate}`);
  lines.push(`- Answer mismatch count: ${report.statistics.answerMismatchCount}`);
  lines.push(`- Explanation mismatch count: ${report.statistics.explanationMismatchCount}`);
  lines.push('');

  lines.push('## Difficulty Distribution');
  lines.push('');
  table(lines, ['Difficulty', 'Count', 'Percent'], sortEntries(new Map(Object.entries(report.statistics.difficultyDistribution))).map(([key, value]) => [key, String(value.count), value.percent]));

  lines.push('## Topic Distribution');
  lines.push('');
  table(lines, ['Topic', 'Count', 'Percent'], sortEntries(new Map(Object.entries(report.statistics.topicDistribution))).map(([key, value]) => [key, String(value.count), value.percent]));

  lines.push('## Learning Objective Distribution');
  lines.push('');
  table(lines, ['Learning Objective', 'Count', 'Percent'], sortEntries(new Map(Object.entries(report.statistics.learningObjectiveDistribution))).map(([key, value]) => [key, String(value.count), value.percent]));

  if (report.failure) {
    lines.push('## Failure Details');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(report.failure, null, 2));
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

async function run() {
  ensureReportDir();
  const subjectsModule = await loadModule('src/data/subjects/index.js');
  const questionEngine = await loadModule('src/ai/question/questionEngine.js');
  const duplicateEngine = await loadModule('src/ai/question/duplicateEngine.js');
  const duplicateDetector = await loadModule('src/ai/diversity/duplicateDetector.js');

  const math = await subjectsModule.loadSubjectData('math');
  const topics = Array.isArray(math.topics) ? math.topics : [];
  const topicCount = topics.length;

  const stats = {
    sessionsAttempted: SESSION_COUNT,
    sessionsCompleted: 0,
    questionsEvaluated: 0,
    duplicateSessions: 0,
    duplicateStemEvents: 0,
    duplicateNumberSignatureEvents: 0,
    answerMismatchCount: 0,
    explanationMismatchCount: 0,
    difficultyCounts: new Map(),
    topicCounts: new Map(),
    objectiveCounts: new Map()
  };

  let failure = null;

  for (let sessionIndex = 0; sessionIndex < SESSION_COUNT; sessionIndex += 1) {
    const topic = topics[(sessionIndex * 37 + 11) % topicCount];
    const result = questionEngine.buildQuestionSession({
      subject: math,
      topic,
      questions: topic.questions,
      count: Math.min(QUESTIONS_PER_SESSION, topic.questions.length),
      memory: {},
      sessionSeed: 50000 + sessionIndex
    });

    const selected = Array.isArray(result.questions) ? result.questions : [];
    const localStems = new Set();
    const localNumbers = new Set();
    let sessionHasDuplicate = false;

    for (let index = 0; index < selected.length; index += 1) {
      const question = selected[index];
      const questionId = question.id || null;
      const stem = duplicateDetector.normalizeStem(question.q || question.question || '');
      const numberSignature = duplicateEngine.questionIntelligenceSignature(question).numbers || '';

      if (typeof question.q === 'string' && typeof question.question === 'string' && question.q !== question.question) {
        failure = {
          sessionIndex,
          questionIndex: index,
          questionId,
          topicId: topic.id,
          code: 'STALE_QUESTION_TEXT_ALIAS',
          q: question.q,
          question: question.question
        };
        break;
      }

      if (stem && localStems.has(stem)) {
        stats.duplicateStemEvents += 1;
        stats.duplicateSessions += sessionHasDuplicate ? 0 : 1;
        sessionHasDuplicate = true;
        failure = {
          sessionIndex,
          questionIndex: index,
          questionId,
          topicId: topic.id,
          code: 'DUPLICATE_NORMALIZED_STEM',
          stem,
          numberSignature
        };
        break;
      }
      localStems.add(stem);

      if (numberSignature && localNumbers.has(numberSignature)) {
        stats.duplicateNumberSignatureEvents += 1;
        stats.duplicateSessions += sessionHasDuplicate ? 0 : 1;
        sessionHasDuplicate = true;
        failure = {
          sessionIndex,
          questionIndex: index,
          questionId,
          topicId: topic.id,
          code: 'DUPLICATE_PROTECTED_NUMBER_SIGNATURE',
          stem,
          numberSignature
        };
        break;
      }
      if (numberSignature) localNumbers.add(numberSignature);

      if (!answerIntegrity(question)) {
        stats.answerMismatchCount += 1;
        failure = {
          sessionIndex,
          questionIndex: index,
          questionId,
          topicId: topic.id,
          code: 'ANSWER_INTEGRITY_MISMATCH',
          stem,
          answer: question.answer,
          explanation: question.explanation,
          numberSignature
        };
        break;
      }

      if (!explanationIntegrity(question)) {
        stats.explanationMismatchCount += 1;
        failure = {
          sessionIndex,
          questionIndex: index,
          questionId,
          topicId: topic.id,
          code: 'EXPLANATION_INTEGRITY_MISMATCH',
          stem,
          answer: question.answer,
          explanation: question.explanation,
          numberSignature
        };
        break;
      }

      if (!String(question.hint || '').trim()) {
        failure = {
          sessionIndex,
          questionIndex: index,
          questionId,
          topicId: topic.id,
          code: 'MISSING_HINT'
        };
        break;
      }

      if (!question.qip?.metadata || !question.qip.metadata.topic || !question.qip.metadata.difficulty) {
        failure = {
          sessionIndex,
          questionIndex: index,
          questionId,
          topicId: topic.id,
          code: 'MISSING_METADATA',
          metadata: question.qip?.metadata || null
        };
        break;
      }

      stats.questionsEvaluated += 1;
      increment(stats.difficultyCounts, normalizeDifficulty(question.qip?.metadata?.difficulty || question.difficulty));
      increment(stats.topicCounts, question.topicId || question.qip?.metadata?.topic || topic.id);
      const objectiveKey = LEARNING_OBJECTIVE_MAP[question.topicId || question.qip?.metadata?.topic || topic.id] || `OBJ:${question.topicId || topic.id}`;
      increment(stats.objectiveCounts, objectiveKey);
    }

    if (failure) {
      break;
    }

    stats.sessionsCompleted += 1;
  }

  const distribution = (map) => {
    const total = [...map.values()].reduce((sum, value) => sum + value, 0);
    const out = {};
    for (const [key, count] of map.entries()) {
      out[key] = {
        count,
        percent: total ? `${((count / total) * 100).toFixed(2)}%` : '0.00%'
      };
    }
    return out;
  };

  const report = {
    generatedAt: new Date().toISOString(),
    status: failure ? 'fail' : 'pass',
    sessionsAttempted: SESSION_COUNT,
    sessionsCompleted: stats.sessionsCompleted,
    questionsEvaluated: stats.questionsEvaluated,
    statistics: {
      duplicateSessionRate: `${((stats.duplicateSessions / SESSION_COUNT) * 100).toFixed(4)}%`,
      duplicateStemRate: `${(stats.questionsEvaluated ? (stats.duplicateStemEvents / stats.questionsEvaluated) * 100 : 0).toFixed(6)}%`,
      duplicateNumberSignatureRate: `${(stats.questionsEvaluated ? (stats.duplicateNumberSignatureEvents / stats.questionsEvaluated) * 100 : 0).toFixed(6)}%`,
      answerMismatchCount: stats.answerMismatchCount,
      explanationMismatchCount: stats.explanationMismatchCount,
      averageDifficultyDistribution: {
        easy: `${((stats.difficultyCounts.get('easy') || 0) / Math.max(stats.sessionsCompleted, 1)).toFixed(4)}`,
        medium: `${((stats.difficultyCounts.get('medium') || 0) / Math.max(stats.sessionsCompleted, 1)).toFixed(4)}`,
        hard: `${((stats.difficultyCounts.get('hard') || 0) / Math.max(stats.sessionsCompleted, 1)).toFixed(4)}`
      },
      difficultyDistribution: distribution(stats.difficultyCounts),
      topicDistribution: distribution(stats.topicCounts),
      learningObjectiveDistribution: distribution(stats.objectiveCounts)
    },
    failure
  };

  fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(MD_PATH, buildMarkdown(report), 'utf8');

  if (failure) {
    console.error(`Math stress test failed at session ${failure.sessionIndex} question ${failure.questionIndex} (${failure.questionId}) with ${failure.code}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Math stress test passed: ${stats.sessionsCompleted}/${SESSION_COUNT} sessions, ${stats.questionsEvaluated} questions evaluated.`);
}

run().catch(error => {
  ensureReportDir();
  const report = {
    generatedAt: new Date().toISOString(),
    status: 'error',
    fatal: String(error.stack || error)
  };
  fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(MD_PATH, `# Math Stress Test\n\nStatus: ERROR\n\n\`\`\`\n${report.fatal}\n\`\`\`\n`, 'utf8');
  console.error(error);
  process.exit(1);
});
