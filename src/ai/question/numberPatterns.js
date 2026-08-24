function toInteger(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeOperation(value = '') {
  const text = String(value || '').toLowerCase().trim();
  if (!text) return 'add';
  if (['add', 'plus', '+', 'addition', 'tambah', 'jumlah'].includes(text)) return 'add';
  if (['subtract', 'minus', '-', 'take away', 'tolak', 'baki', 'beza'].includes(text)) return 'subtract';
  if (['multiply', 'times', 'x', '×', 'darab', 'kali'].includes(text)) return 'multiply';
  if (['divide', 'division', '÷', '/', 'bahagi', 'kongsi'].includes(text)) return 'divide';
  return 'add';
}

export function hashText(text = '') {
  const source = String(text || '');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function extractNumbers(text = '') {
  const source = String(text || '');
  const matches = [];
  const pattern = /\d+/g;
  let match = pattern.exec(source);
  while (match) {
    matches.push({
      value: Number(match[0]),
      index: match.index
    });
    match = pattern.exec(source);
  }
  return matches;
}





export function rangeBucket(value, min = 0, max = 100) {
  const low = Math.min(Number(min ?? 0), Number(max ?? 0));
  const high = Math.max(Number(min ?? 0), Number(max ?? 0));
  const span = Math.max(1, high - low + 1);
  const bucketCount = Math.max(3, Math.min(5, Math.ceil(span / 25)));
  const normalized = Math.max(0, Math.min(span - 1, Number(value) - low));
  const index = Math.min(bucketCount - 1, Math.floor((normalized / span) * bucketCount));
  return `${index + 1}/${bucketCount}`;
}

export function pairBucket(values = [], min = 0, max = 100) {
  const first = toInteger(values[0] ?? 0);
  const second = toInteger(values[1] ?? 0);
  return rangeBucket((first + second) / 2, min, max);
}
export function equationSignature(operation, values = []) {
  const normalized = normalizeOperation(operation);
  const first = toInteger(values[0] ?? 0);
  const second = toInteger(values[1] ?? 0);

  return `${normalized}:${first}:${second}`;
}
export function patternGroup(operation, values = []) {
  const normalized = normalizeOperation(operation);
  const first = toInteger(values[0] ?? 0);
  const second = toInteger(values[1] ?? 0);

  if (normalized === 'add') {
    const total = first + second;
    const carry = (first % 10) + (second % 10) >= 10;
    if (total <= 20) return carry ? 'addition_small_carry' : 'addition_small_nocarry';
    if (total <= 50) return carry ? 'addition_medium_carry' : 'addition_medium_nocarry';
    return carry ? 'addition_large_carry' : 'addition_large_nocarry';
  }

  if (normalized === 'subtract') {
    const difference = Math.abs(first - second);
    const borrow = (first % 10) < (second % 10);
    if (difference <= 10) return borrow ? 'subtraction_small_borrow' : 'subtraction_small_noborrow';
    if (difference <= 40) return borrow ? 'subtraction_medium_borrow' : 'subtraction_medium_noborrow';
    return borrow ? 'subtraction_large_borrow' : 'subtraction_large_noborrow';
  }

  if (normalized === 'multiply') {
    const product = first * second;
    if (product <= 20) return first === second ? 'multiplication_small_square' : 'multiplication_small';
    if (product <= 40) return first === second ? 'multiplication_medium_square' : 'multiplication_medium';
    return first === second ? 'multiplication_large_square' : 'multiplication_large';
  }

  if (normalized === 'divide') {
    const quotient = first / second;
    if (quotient <= 5) return 'division_small';
    if (quotient <= 10) return 'division_medium';
    return 'division_large';
  }

  return 'general';
}

export function hasCarry(operation, values = []) {
  const normalized = normalizeOperation(operation);
  if (normalized !== 'add') return false;

  const first = toInteger(values[0] ?? 0);
  const second = toInteger(values[1] ?? 0);

  return (first % 10) + (second % 10) >= 10;
}

export function hasBorrow(operation, values = []) {
  const normalized = normalizeOperation(operation);
  if (normalized !== 'subtract') return false;

  const first = toInteger(values[0] ?? 0);
  const second = toInteger(values[1] ?? 0);

  return (first % 10) < (second % 10);
}

export function pairSignature(operation, values = []) {
  const normalized = normalizeOperation(operation);
  const first = toInteger(values[0] ?? 0);
  const second = toInteger(values[1] ?? 0);

  return `${normalized}:${first}:${second}`;
}
export function computeAnswer(operation, values = []) {
  const normalized = normalizeOperation(operation);
  const first = toInteger(values[0] ?? 0);
  const second = toInteger(values[1] ?? 0);

  if (normalized === 'add') return first + second;
  if (normalized === 'subtract') return first - second;
  if (normalized === 'multiply') return first * second;
  if (normalized === 'divide') {
    if (second === 0) return null;
    return first / second;
  }

  return null;
}

export function generateCandidate(seed, attempt, constraints = {}, context = {}) {
  const operation = normalizeOperation(constraints.operation || 'add');
  const profileId = constraints.profileId || constraints.id || '';
  const difficulty = String(constraints.difficultyProfile || constraints.difficultyKey || 'easy').toLowerCase();
  const min = Math.max(0, Number(constraints.min ?? 0));
  const max = Math.max(min + 1, Number(constraints.max ?? 20));
  const resultMin = Number(constraints.resultMin ?? 0);
  const resultMax = Number(constraints.resultMax ?? max);

  const baseSeed = Number(seed || 0) + (Number(attempt || 0) * 37) + (Number(context.sessionIndex || 0) * 11);
  const span = Math.max(1, max - min + 1);

  function pickValue(index, offset = 0) {
    const valueIndex = Math.abs(hashText(`${baseSeed}:${index}:${offset}:${profileId}:${operation}`)) % span;
    return min + valueIndex;
  }

  function buildMoneyValues(firstValue, secondValue) {
    const moneyFirst = clampValue(Math.max(5, Math.trunc(firstValue / 5) * 5), 5, 1000);
    const moneySecond = clampValue(Math.max(5, Math.trunc(secondValue / 5) * 5), 5, 1000);
    return [moneyFirst, moneySecond];
  }

  function buildTimeValues(firstValue, secondValue) {
    const hour = clampValue(Math.max(1, Math.min(12, firstValue)), 1, 12);
    const minute = clampValue(Math.max(0, Math.min(55, Math.trunc(secondValue / 5) * 5)), 0, 55);
    return [hour, minute];
  }

  let first = pickValue(0, attempt + (profileId === 'division_intro' ? 2 : 0));
  let second = pickValue(1, attempt + 3 + (operation === 'subtract' ? 2 : 0));

  if (profileId === 'money') {
    [first, second] = buildMoneyValues(first, second);
  } else if (profileId === 'time') {
    [first, second] = buildTimeValues(first, second);
  } else if (profileId === 'length' || profileId === 'mass') {
    first = clampValue(first, 1, Math.max(1, max));
    second = clampValue(second, 1, Math.max(1, max));
  } else if (operation === 'multiply') {
    let product = first * second;
    while (product > resultMax && second > 1) {
      second -= 1;
      product = first * second;
    }
    while (product < resultMin && second < max) {
      second += 1;
      product = first * second;
    }
  } else if (operation === 'divide') {
    const divisor = clampValue(Math.max(1, second), 1, Math.max(1, max));
    const quotient = clampValue(Math.max(1, Math.trunc(first / Math.max(1, divisor))), 1, Math.max(1, resultMax));
    first = quotient * divisor;
    second = divisor;
  }

  if (operation === 'add') {
    const total = first + second;
    const preferCarry = constraints.allowCarry === true && ((attempt + (difficulty === 'hard' ? 1 : 0)) % 2 === 0);

    if (preferCarry) {
      const onesSum = (first % 10) + (second % 10);
      if (onesSum < 10) {
        second = clampValue(second + (10 - onesSum), min, max);
      }
    } else if (constraints.allowCarry === false && (first % 10) + (second % 10) >= 10) {
      second = clampValue(second - 1, min, max);
    }

    if (first + second > resultMax) {
      second = clampValue(second - ((first + second) - resultMax), min, max);
    }

    if (total < resultMin) {
      second = clampValue(second + (resultMin - total), min, max);
    }
  }

  if (operation === 'subtract') {
    if (first < second) {
      [first, second] = [second, first];
    }

    const preferBorrow = constraints.allowBorrow === true && ((attempt + (difficulty === 'hard' ? 1 : 0)) % 2 === 0);
    if (constraints.allowBorrow === true && preferBorrow) {
      const onesFirst = first % 10;
      const onesSecond = second % 10;
      if (onesFirst >= onesSecond) {
        first = clampValue(first + (10 - onesFirst) + onesSecond, min, max);
      }
    }

    if (constraints.allowBorrow === false && (first % 10) < (second % 10)) {
      first = clampValue(first + 1, min, max);
    }

    const difference = first - second;
    if (difference < resultMin) {
      first = clampValue(second + resultMin, min, max);
    }

    if (difference > resultMax) {
      first = clampValue(second + resultMax, min, max);
    }
  }

  if (operation === 'multiply') {
    const product = first * second;
    if (product > resultMax) {
      second = clampValue(Math.max(1, Math.trunc(resultMax / Math.max(1, first))), 1, max);
    }
  }

  const answer = computeAnswer(operation, [first, second]);
  if (answer === null || answer === undefined) return null;

  return {
    values: [first, second],
    answer,
    operation,
    profileId,
    difficulty
  };
}

export function replaceFirstNumbers(text = '', values = []) {
  const source = String(text || '');
  const numericValues = Array.isArray(values) ? values : [];
  const pattern = /\d+/g;
  let index = 0;

  return source.replace(pattern, (match) => {
    if (index >= numericValues.length) return match;
    const replacement = String(numericValues[index]);
    index += 1;
    return replacement;
  });
}
