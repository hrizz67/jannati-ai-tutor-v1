import { CONTEXT_POOLS, OBJECT_GROUPS, PLACE_GROUPS } from './contextPools.js';
import { getContextGroupsForQuestion, getContextTokens, isProtectedArabicContext, isProtectedIslamContext, isProtectedScienceContext } from './contextRegistry.js';

function answerTerms(question = {}) {
  return new Set([question.answer, ...(question.accepted || [])].map(value => String(value || '').toLowerCase()).filter(Boolean));
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceToken(text = '', source = '', target = '') {
  return text.replace(new RegExp(`(^|\\s|[,.!?;:])(${escapeRegExp(source)})(?=$|\\s|[,.!?;:])`, 'g'), `$1${target}`);
}

function chooseAlternative(group, current, session, blocked) {
  const pool = CONTEXT_POOLS[group] || [];
  const recent = group === 'people_year2'
    ? session.recentNames || new Set()
    : OBJECT_GROUPS.includes(group)
      ? session.recentObjects || new Set()
      : session.recentContexts || new Set();
  return pool.find(item => item !== current && !blocked.has(item.toLowerCase()) && !recent.has(item.toLowerCase())) ||
    pool.find(item => item !== current && !blocked.has(item.toLowerCase())) ||
    current;
}

function remember(group, value, session) {
  const normalized = String(value || '').toLowerCase();
  if (!normalized) return;
  session.usedContexts?.add(normalized);
  session.reuseCounts?.set(normalized, (session.reuseCounts.get(normalized) || 0) + 1);
  if (group === 'people_year2') session.usedNames?.add(normalized);
  if (OBJECT_GROUPS.includes(group)) session.usedObjects?.add(normalized);
  if (PLACE_GROUPS.includes(group)) session.usedPlaces?.add(normalized);
}

export function contextSignature(question = {}) {
  return question.qip?.selectedContext || question.qip?.contextVariant || '';
}

export function applyContextIntelligence(question = {}, session = {}, options = {}) {
  if (options.featureFlags?.QUESTION_CONTEXT_ENGINE === false) return question;

  const original = question.q || question.question || '';
  const blocked = answerTerms(question);
  const protectedReason = isProtectedArabicContext(question)
    ? 'Teks Arab dilindungi'
    : isProtectedIslamContext(question)
      ? 'Fakta agama dilindungi'
      : isProtectedScienceContext(question)
        ? 'Fakta sains dilindungi'
        : '';
  let next = original;
  const changes = [];

  for (const token of getContextTokens(question)) {
    if (blocked.has(token.value.toLowerCase())) continue;
    if (!next.includes(token.value)) continue;
    if (protectedReason && token.group !== 'people_year2' && !PLACE_GROUPS.includes(token.group)) continue;
    const replacement = chooseAlternative(token.group, token.value, session, blocked);
    if (replacement && replacement !== token.value) {
      next = replaceToken(next, token.value, replacement);
      changes.push({ group: token.group, from: token.value, to: replacement });
      remember(token.group, replacement, session);
      break;
    }
  }

  const selectedContext = changes.map(change => `${change.from}->${change.to}`).join(', ') || 'lama';
  const reuseCount = selectedContext === 'lama' ? 0 : (session.reuseCounts?.get(changes[0]?.to.toLowerCase()) || 1) - 1;
  return {
    ...question,
    q: next,
    qip: {
      ...(question.qip || {}),
      originalContext: original,
      selectedContext: next,
      contextVariant: selectedContext,
      contextGroup: changes[0]?.group || getContextGroupsForQuestion(question)[0] || 'none',
      contextSelectionReason: changes.length ? 'Alternatif konteks yang belum digunakan dipilih' : protectedReason || 'Tiada token konteks yang selamat ditemui',
      contextReuseCount: reuseCount,
      metadata: {
        ...(question.qip?.metadata || {}),
        contextGroup: changes[0]?.group || question.qip?.metadata?.contextGroup || null
      }
    }
  };
}

export function applyContextIntelligenceToSession(questions = [], options = {}) {
  const history = options.memory?.qipHistory || {};
  const session = {
    usedContexts: new Set(),
    usedNames: new Set(),
    usedObjects: new Set(),
    usedPlaces: new Set(),
    recentContexts: new Set((history.contexts || []).slice(0, 50).map(item => String(item.value || item.context || '').toLowerCase())),
    recentNames: new Set((history.names || []).slice(0, 30).map(item => String(item.value || item.name || '').toLowerCase())),
    recentObjects: new Set((history.objects || []).slice(0, 30).map(item => String(item.value || item.object || '').toLowerCase())),
    reuseCounts: new Map()
  };
  return questions.map(question => applyContextIntelligence(question, session, options));
}
