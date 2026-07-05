import { normalizeStem } from './duplicateDetector.js';

const STEM_PATTERNS = [
  {
    match: /^pilih\s+(.+?)\.?$/i,
    build: phrase => [
      `Pilih ${phrase}.`,
      `Yang manakah ${phrase}?`,
      `Kenal pasti ${phrase}.`,
      `Cari ${phrase}.`,
      `Perkataan manakah ialah ${phrase}?`
    ]
  },
  {
    match: /^apakah\s+(.+?)\?$/i,
    build: phrase => [
      `Apakah ${phrase}?`,
      `Nyatakan ${phrase}.`,
      `Kenal pasti ${phrase}.`,
      `Yang manakah ${phrase}?`
    ]
  },
  {
    match: /^isi\s+tempat\s+kosong/i,
    build: () => [
      'Isi tempat kosong.',
      'Lengkapkan ayat ini.',
      'Pilih jawapan yang melengkapkan ayat.',
      'Cari perkataan yang sesuai.'
    ]
  }
];

export function getStemAlternatives(question = {}) {
  const base = question.q || question.question || '';
  if (Array.isArray(question.stemVariations) && question.stemVariations.length) {
    return [...new Set([base, ...question.stemVariations].filter(Boolean))];
  }

  for (const pattern of STEM_PATTERNS) {
    const matched = base.match(pattern.match);
    if (matched) return [...new Set(pattern.build(matched[1] || base).filter(Boolean))];
  }

  return [base];
}

export function applyStemVariation(question = {}, usedStems = new Set()) {
  const alternatives = getStemAlternatives(question);
  const selected = alternatives.find(stem => !usedStems.has(normalizeStem(stem))) || alternatives[0] || question.q;
  return {
    ...question,
    q: selected,
    qde: {
      ...(question.qde || {}),
      originalStem: question.q || question.question || '',
      variationUsed: selected,
      stemAlternatives: alternatives.length
    }
  };
}
