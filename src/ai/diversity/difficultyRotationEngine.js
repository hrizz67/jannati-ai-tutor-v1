const ORDER = ['mudah', 'sederhana', 'mudah', 'sukar', 'sederhana', 'easy', 'medium', 'hard'];

function normalizeDifficulty(value = '') {
  const text = String(value).toLowerCase();
  if (text.includes('easy')) return 'easy';
  if (text.includes('medium')) return 'medium';
  if (text.includes('hard')) return 'hard';
  if (text.includes('sukar')) return 'sukar';
  if (text.includes('sederhana')) return 'sederhana';
  return 'mudah';
}

export function rotateDifficulty(items = [], options = {}) {
  if (options.allowAdaptiveOverride || items.length <= 2) return [...items];
  const buckets = new Map();
  items.forEach(item => {
    const difficulty = normalizeDifficulty(item.difficulty || item.topicDifficulty || item.question?.difficulty);
    if (!buckets.has(difficulty)) buckets.set(difficulty, []);
    buckets.get(difficulty).push(item);
  });

  const rotated = [];
  let cursor = 0;
  while ([...buckets.values()].some(bucket => bucket.length)) {
    const target = ORDER[cursor % ORDER.length];
    const bucket = buckets.get(target);
    if (bucket?.length) {
      rotated.push(bucket.shift());
    } else {
      const fallback = [...buckets.values()].find(nextBucket => nextBucket.length);
      if (fallback) rotated.push(fallback.shift());
    }
    cursor += 1;
  }
  return rotated;
}
