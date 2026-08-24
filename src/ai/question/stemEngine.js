import { normalizeStem } from '../diversity/duplicateDetector.js';
import { getStemPatternSet } from './stemRegistry.js';

function originalStem(question = {}) {
  return question.q || question.question || question.stem || '';
}

function replaceScienceTerm(pattern = '', stem = '') {
  const term = stem.match(/fungsi\s+(.+?)\?/i)?.[1] || stem.match(/kegunaan\s+(.+?)\?/i)?.[1] || 'bahagian ini';
  return pattern.replaceAll('{term}', term).replaceAll('{hint}', 'fungsi tersebut');
}

function preserveContext(pattern = '', stem = '') {
  const sentenceMatch = stem.match(/^(apakah|pilih|kenal pasti|cari|yang manakah).*?\?\s*(.+)$/i);
  const suffix = sentenceMatch?.[2] ? ` ${sentenceMatch[2]}` : '';
  if (pattern.includes('{term}') || pattern.includes('{hint}')) return replaceScienceTerm(pattern, stem);
  return suffix && !pattern.includes(suffix.trim()) ? `${pattern} ${suffix}` : pattern;
}

export function buildStemVariants(question = {}) {
  const stem = originalStem(question);
  const { variationGroup, patterns } = getStemPatternSet(question);
  if (variationGroup === 'arabic_verified') return { variationGroup, variants: [stem], protected: true };
  const variants = [...new Set([stem, ...patterns.map(pattern => preserveContext(pattern, stem))].filter(Boolean))];
  return { variationGroup, variants, protected: false };
}

export function applyStemIntelligence(question = {}, session = {}, options = {}) {
  if (options.featureFlags?.QUESTION_STEM_ENGINE === false) return question;
  const stem = originalStem(question);
  const used = session.usedStems || new Set();
  const history = session.historyStems || new Set();
  const reuseCounts = session.reuseCounts || new Map();
  const { variationGroup, variants, protected: protectedStem } = buildStemVariants(question);
  const selected = variants.find(item => !used.has(normalizeStem(item)) && !history.has(item.toLowerCase())) ||
    variants.find(item => !used.has(normalizeStem(item))) ||
    variants[0] ||
    stem;
  const normalized = normalizeStem(selected);
  const reuseCount = reuseCounts.get(normalized) || 0;
  used.add(normalized);
  reuseCounts.set(normalized, reuseCount + 1);
  session.usedStems = used;
  session.reuseCounts = reuseCounts;
  return {
    ...question,
    q: selected,
    qip: {
      ...(question.qip || {}),
      originalStem: stem,
      selectedStem: selected,
      stemVariant: selected,
      variationGroup,
      stemSelectionReason: protectedStem ? 'Protected subject stem preserved' : selected === stem ? 'Original stem selected' : 'Unused stem variation selected',
      stemReuseCount: reuseCount,
      stemVariantCount: variants.length
    }
  };
}

export function applyStemIntelligenceToSession(questions = [], options = {}) {
  const historyRows = options.memory?.qipHistory?.stems || [];
  const session = {
    usedStems: new Set(),
    historyStems: new Set(historyRows.slice(0, 30).map(item => String(item.stem || item.signature || '').toLowerCase())),
    reuseCounts: new Map()
  };
  return questions.map(question => applyStemIntelligence(question, session, options));
}
