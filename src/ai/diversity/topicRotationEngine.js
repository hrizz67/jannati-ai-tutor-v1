export function rotateTopics(items = [], options = {}) {
  if (options.allowReinforcement || items.length <= 2) return [...items];
  const buckets = new Map();
  items.forEach(item => {
    const key = item.topicId || item.topic?.id || 'topic';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  });

  const rotated = [];
  while ([...buckets.values()].some(bucket => bucket.length)) {
    for (const bucket of buckets.values()) {
      const next = bucket.shift();
      if (next) rotated.push(next);
    }
  }
  return rotated;
}
