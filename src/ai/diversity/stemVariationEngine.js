import { normalizeStem } from './duplicateDetector.js';

const BM_PERSON_NAMES = ['Aina', 'Sara', 'Mira', 'Hana', 'Irfan', 'Danial', 'Rahman', 'Salmah', 'Amir', 'Ali'];
const BM_PLACE_NAMES = ['Kuala Lumpur', 'Melaka', 'Pulau Langkawi', 'Kota Bharu', 'Ipoh', 'Johor Bahru', 'Zoo Negara', 'Sekolah Kebangsaan Jaya'];
const BM_PERSON_PAIRS = [
  ['Amir', 'Faris'],
  ['Aina', 'Mira'],
  ['Hana', 'Irfan'],
  ['Sara', 'Danial'],
  ['Nadia', 'Johan']
];

function variationHash(value = '') {
  return [...String(value)].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
}

function replaceInQuestionFields(question, from, to) {
  const replace = value => typeof value === 'string' ? value.replaceAll(from, to) : value;
  const next = { ...question };
  for (const key of ['q', 'question', 'stem', 'hint', 'explanation', 'wrongExplanation']) next[key] = replace(next[key]);
  next.answer = replace(next.answer);
  if (Array.isArray(next.accepted)) next.accepted = next.accepted.map(replace);
  if (Array.isArray(next.acceptedAnswers)) next.acceptedAnswers = next.acceptedAnswers.map(replace);
  return next;
}

function replaceQuestionTextOnly(question, replacements = []) {
  const replace = value => {
    if (typeof value !== 'string') return value;
    return replacements.reduce((text, [from, to]) => text.replaceAll(from, to), value);
  };
  const next = { ...question };
  for (const key of ['q', 'question', 'stem', 'hint', 'explanation', 'wrongExplanation']) next[key] = replace(next[key]);
  return next;
}

function applyBmPronounEntityVariation(question, context = {}) {
  const text = String(question.q || question.question || '');
  const expected = String(question.answer || '').trim().toLowerCase();
  const hasPronounTopic = /kata[-_ ]ganti[-_ ]nama/i.test(`${question.topicId || ''} ${question.topicTitle || ''}`)
    || /kata ganti nama/i.test(text);
  if (!hasPronounTopic) return question;

  const pairPattern = /\b(Amir|Faris|Aina|Mira|Hana|Irfan|Sara|Danial|Nadia|Johan)\s+dan\s+(Amir|Faris|Aina|Mira|Hana|Irfan|Sara|Danial|Nadia|Johan)\b/i;
  const pairMatch = text.match(pairPattern);
  if (pairMatch) {
    const seed = variationHash(`${question.id || text}:pair:${context.index || 0}:${context.sessionSeed || 0}`);
    const pair = BM_PERSON_PAIRS[seed % BM_PERSON_PAIRS.length];
    const varied = replaceQuestionTextOnly(question, [[pairMatch[0], `${pair[0]} dan ${pair[1]}`]]);
    return { ...varied, qde: { ...(varied.qde || {}), entityVariation: true, entityGroup: 'person-pair', selectedEntity: pair.join(' dan ') } };
  }

  return question;
}

function applyBmEntityVariation(question = {}, context = {}) {
  if (context.subject?.id !== 'bm' && question.subjectId !== 'bm') return question;
  const pronounVaried = applyBmPronounEntityVariation(question, context);
  const answer = String(pronounVaried.answer || '').trim();
  const text = String(pronounVaried.q || pronounVaried.question || '');
  const pool = BM_PERSON_NAMES.includes(answer) ? BM_PERSON_NAMES : BM_PLACE_NAMES.includes(answer) ? BM_PLACE_NAMES : null;
  if (!pool) return pronounVaried;
  const seed = variationHash(`${question.id || text}:${context.index || 0}:${context.sessionSeed || 0}`);
  const offset = (seed % (pool.length - 1)) + 1;
  const replacement = pool[(pool.indexOf(answer) + offset) % pool.length];
  const varied = replaceInQuestionFields(pronounVaried, answer, replacement);
  return { ...varied, qde: { ...(varied.qde || {}), entityVariation: true, originalEntity: answer, selectedEntity: replacement, entityGroup: pool === BM_PERSON_NAMES ? 'person' : 'place' } };
}

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

export function applyStemVariation(question = {}, usedStems = new Set(), context = {}) {
  const entityVaried = applyBmEntityVariation(question, context);
  const alternatives = getStemAlternatives(entityVaried);
  const selected = alternatives.find(stem => !usedStems.has(normalizeStem(stem))) || alternatives[0] || entityVaried.q;
  return {
    ...entityVaried,
    q: selected,
    qde: {
      ...(entityVaried.qde || {}),
      originalStem: entityVaried.q || entityVaried.question || '',
      variationUsed: selected,
      stemAlternatives: alternatives.length
    }
  };
}
