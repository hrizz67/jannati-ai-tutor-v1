export const DIFFICULTY_PROFILES = {
  mudah: {
    id: 'easy',
    label: 'Easy',
    min: 1,
    max: 40,
    allowCarry: false,
    allowBorrow: false
  },
  sederhana: {
    id: 'medium',
    label: 'Medium',
    min: 5,
    max: 100,
    allowCarry: true,
    allowBorrow: true
  },
  sukar: {
    id: 'hard',
    label: 'Hard',
    min: 10,
    max: 400,
    allowCarry: true,
    allowBorrow: true
  }
};

export const NUMBER_PROFILES = {
  addition_10: { id: 'addition_10', operation: 'add', min: 1, max: 10, resultMin: 2, resultMax: 10, allowCarry: false },
  addition_20: { id: 'addition_20', operation: 'add', min: 1, max: 20, resultMin: 2, resultMax: 20, allowCarry: true },
  addition_100: { id: 'addition_100', operation: 'add', min: 1, max: 100, resultMin: 2, resultMax: 100, allowCarry: true },
  subtraction_20: { id: 'subtraction_20', operation: 'subtract', min: 1, max: 20, resultMin: 0, resultMax: 20, allowBorrow: true },
  subtraction_100: { id: 'subtraction_100', operation: 'subtract', min: 1, max: 100, resultMin: 0, resultMax: 100, allowBorrow: true },
  multiplication_intro: { id: 'multiplication_intro', operation: 'multiply', min: 1, max: 5, resultMin: 1, resultMax: 50, allowCarry: false },
  division_intro: { id: 'division_intro', operation: 'divide', min: 1, max: 50, resultMin: 1, resultMax: 10, allowRemainder: false },
  money: { id: 'money', operation: 'money', min: 5, max: 10000, resultMin: 0, resultMax: 10000, units: ['RM', 'sen'] },
  time: { id: 'time', operation: 'time', hourMin: 1, hourMax: 12, minuteStep: 5, minuteMax: 55 },
  length: { id: 'length', operation: 'measure', min: 1, max: 100, units: ['cm', 'm'] },
  mass: { id: 'mass', operation: 'measure', min: 1, max: 1000, units: ['g', 'kg'] }
};

export function normalizeDifficulty(difficulty = '') {
  const value = String(difficulty || '').toLowerCase();
  if (value.includes('sukar') || value.includes('hard')) return 'sukar';
  if (value.includes('sederhana') || value.includes('medium')) return 'sederhana';
  return 'mudah';
}

export function detectNumberProfile(question = {}) {
  const text = `${question.q || question.question || ''} ${question.explanation || ''}`.toLowerCase();
  const topic = String(question.topicId || question.qip?.metadata?.topic || '').toLowerCase();
  const operation = detectOperation(question);

  if (/rm|sen|ringgit|duit|wang|harga|baki wang/.test(text)) return NUMBER_PROFILES.money;
  if (/jam|minit|pukul|masa/.test(text)) return NUMBER_PROFILES.time;
  if (/cm|meter|\bm\b|panjang|tinggi|jarak/.test(text)) return NUMBER_PROFILES.length;
  if (/kg|gram|\bg\b|jisim|berat/.test(text)) return NUMBER_PROFILES.mass;
  if (operation === 'multiply') return NUMBER_PROFILES.multiplication_intro;
  if (operation === 'divide') return NUMBER_PROFILES.division_intro;
  if (operation === 'subtract' || topic.includes('tolak')) {
    return maxFromDifficulty(question) <= 20 ? NUMBER_PROFILES.subtraction_20 : NUMBER_PROFILES.subtraction_100;
  }
  if (operation === 'add' || topic.includes('tambah')) {
    const max = maxFromDifficulty(question);
    if (max <= 10) return NUMBER_PROFILES.addition_10;
    if (max <= 20) return NUMBER_PROFILES.addition_20;
    return NUMBER_PROFILES.addition_100;
  }
  return null;
}

export function detectOperation(question = {}) {
  const text = `${question.q || question.question || ''} ${question.hint || ''} ${question.explanation || ''}`.toLowerCase();
  if (/[×x]/.test(text) || /darab|kali|setiap|kumpulan/.test(text)) return 'multiply';
  if (/[÷]/.test(text) || /bahagi|kongsi sama/.test(text)) return 'divide';
  if (/[−-]/.test(text) || /\btolak\b|\bbaki\b|\bbeza\b|\bkeluar\b|\bmemberikan kepada\b|\bberi kepada\b|\bdikurang\b/.test(text)) return 'subtract';
  if (/[+]/.test(text) || /\btambah\b|\bjumlah\b|\blagi\b|\bmembeli\b|\bmenerima\b|\bdapat\b|\bmemberi\b|\bdiberi\b/.test(text)) return 'add';
  return 'unknown';
}

export function buildConstraints(question = {}, profile = detectNumberProfile(question)) {
  const difficultyKey = normalizeDifficulty(question.difficulty || question.qip?.metadata?.difficulty);
  const difficulty = DIFFICULTY_PROFILES[difficultyKey];
  const base = profile || NUMBER_PROFILES.addition_100;
  const max = Math.min(base.max || difficulty.max, difficulty.max, year2MaxForProfile(base));
  return {
    ...base,
    difficultyKey,
    difficultyProfile: difficulty.id,
    difficultyLabel: difficulty.label,
    min: Math.max(base.min || 1, difficulty.min),
    max,
    resultMin: base.resultMin ?? 0,
    resultMax: Math.min(base.resultMax || max, year2ResultMaxForProfile(base)),
    allowCarry: base.allowCarry && difficulty.allowCarry,
    allowBorrow: base.allowBorrow && difficulty.allowBorrow
  };
}

function maxFromDifficulty(question = {}) {
  const key = normalizeDifficulty(question.difficulty || question.qip?.metadata?.difficulty);
  if (key === 'sukar') return 100;
  if (key === 'sederhana') return 100;
  return 20;
}

function year2MaxForProfile(profile = {}) {
  if (profile.operation === 'multiply') return 5;
  if (profile.operation === 'divide') return 50;
  if (profile.operation === 'money') return 10000;
  return 100;
}

function year2ResultMaxForProfile(profile = {}) {
  if (profile.operation === 'money') return 10000;
  if (profile.operation === 'multiply') return 50;
  return 100;
}
