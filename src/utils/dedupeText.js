export function normalizeContentText(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupeContent(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [items])
    .filter(item => item !== null && item !== undefined)
    .map(item => String(item).replace(/\s+/g, ' ').trim())
    .filter(item => {
      const key = normalizeContentText(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function dedupeSections(sections = []) {
  const seen = new Set();
  return sections.map(items => dedupeContent(items).filter(item => {
    const key = normalizeContentText(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}
