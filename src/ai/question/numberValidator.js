import { computeAnswer, equationSignature, normalizeOperation, pairSignature, patternGroup } from './numberPatterns.js';

function hasCarry(first, second) {
  return (Math.abs(first) % 10) + (Math.abs(second) % 10) >= 10;
}

function hasBorrow(first, second) {
  return (Math.abs(first) % 10) < (Math.abs(second) % 10);
}

function isRealisticMoneyPair(values = []) {
  const [first, second] = values.map(Number);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return false;
  if (first < 0 || second < 0) return false;
  if (first % 5 !== 0 || second % 5 !== 0) return false;
  return first <= 1000 && second <= 1000;
}

function isValidTimePair(values = []) {
  const [first, second] = values.map(Number);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return false;
  if (first < 0 || second < 0) return false;
  if (first > 12 || second > 55) return false;
  return true;
}

function isValidLengthPair(values = []) {
  const [first, second] = values.map(Number);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return false;
  return first >= 0 && second >= 0 && first <= 100 && second <= 100;
}

function isValidMassPair(values = []) {
  const [first, second] = values.map(Number);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return false;
  return first >= 0 && second >= 0 && first <= 1000 && second <= 1000;
}

export function validateNumberCandidate(candidate = {}, context = {}) {
  const issues = [];
  const { constraints = {}, memory = {}, operation: contextOperation, recentPatternGroups = [] } = context;
  const resolvedOperation = normalizeOperation(candidate.operation || contextOperation || constraints.operation || 'add') || 'add';

  const values = Array.isArray(candidate.values) ? candidate.values : [];
  if (values.length < 2) {
    issues.push('needs exactly two values');
    return { ok: false, issues };
  }

  const [first, second] = values.map(Number);
  const answer = candidate.answer ?? computeAnswer(resolvedOperation, values);

  if (!Number.isInteger(first) || !Number.isInteger(second)) {
    issues.push('values must be whole numbers');
  }

  if (first < 0 || second < 0) {
    issues.push('values cannot be negative');
  }

  if (resolvedOperation === 'add') {
    const total = first + second;
    if (total > (constraints.max ?? 100)) {
      issues.push('addition exceeds maximum');
    }
    if (constraints.allowCarry === false && hasCarry(first, second)) {
      issues.push('carry not allowed');
    }
  }

  if (resolvedOperation === 'subtract') {
    if (first < second) {
      issues.push('subtraction would create a negative result');
    }
    if (constraints.allowBorrow === false && hasBorrow(first, second)) {
      issues.push('borrow not allowed');
    }
  }

  if (resolvedOperation === 'multiply') {
    const product = first * second;
    if (product > (constraints.resultMax ?? constraints.max ?? 100)) {
      issues.push('multiplication exceeds maximum');
    }
  }

  if (resolvedOperation === 'divide') {
    if (second === 0) {
      issues.push('division by zero');
    } else if (!Number.isInteger(first / second)) {
      issues.push('division produces non-integer result');
    }
  }

  if (constraints.difficultyProfile === 'easy' && (first > 20 || second > 20 || answer > 20)) {
    issues.push('easy profile mismatch');
  }

  if (constraints.difficultyProfile === 'medium' && (first > 100 || second > 100 || answer > 100)) {
    issues.push('medium profile mismatch');
  }

  if (constraints.difficultyProfile === 'hard' && (first > 400 || second > 400 || answer > 400)) {
    issues.push('hard profile mismatch');
  }

  const pair = pairSignature(values);
  const equation = equationSignature(resolvedOperation, values);

  if (memory?.pairs?.has(pair)) {
    issues.push('repeated number pair');
  }

  if (memory?.equations?.has(equation)) {
    issues.push('repeated equation');
  }

  if (constraints.profileId === 'money' && !isRealisticMoneyPair(values)) {
    issues.push('money values are not realistic');
  }

  if (constraints.profileId === 'time' && !isValidTimePair(values)) {
    issues.push('time values are invalid');
  }

  if (constraints.profileId === 'length' && !isValidLengthPair(values)) {
    issues.push('length values are invalid');
  }

  if (constraints.profileId === 'mass' && !isValidMassPair(values)) {
    issues.push('mass values are invalid');
  }

  const repeatedPattern = recentPatternGroups.slice(-3).includes(patternGroup(resolvedOperation, values));
  if (repeatedPattern) {
    issues.push('pattern group repeated');
  }

  if (answer === null || answer === undefined || !Number.isFinite(answer)) {
    issues.push('invalid answer');
  }

  return {
    ok: issues.length === 0,
    issues,
    answer
  };
}

export function validateNumberQuestion(question = {}) {
  const meta = question.qip?.numberEngine;
  if (!meta) return { ok: true, issues: [] };
  const values = meta.selectedNumbers || [];
  return validateNumberCandidate({ values, answer: Number(question.answer) }, {
    constraints: meta.constraints || {},
    memory: { pairs: new Set(), equations: new Set() },
    operation: meta.operation
  });
}
