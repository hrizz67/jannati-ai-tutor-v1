import {
  containsPotentialPersonalData,
  detectTutorSafetyRisk
} from '../../../supabase/functions/_shared/tutorPolicy.js';

const DEFAULT_MAX_SCOPES = 24;
const DEFAULT_MAX_TURNS = 12;
const DEFAULT_TTL_MS = 30 * 60 * 1000;
const MAX_SCOPE_LENGTH = 320;
const MAX_MESSAGE_LENGTH = 1400;
const RETAINED_SAFETY_SIGNALS = new Set(['self_harm', 'exploitation', 'dangerous']);

export const TUTOR_MEMORY_REDACTION_TEXT = Object.freeze({
  personalData: 'Maklumat peribadi tidak disimpan.',
  safety: 'Mesej keselamatan tidak disimpan.'
});

function cleanText(value = '', maxLength = MAX_MESSAGE_LENGTH) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanScope(value = '') {
  const scope = String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return scope && scope.length <= MAX_SCOPE_LENGTH ? scope : '';
}

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function removeStudentIdentityFromAssistantText(value = '', studentName = '') {
  const text = cleanText(value);
  const identity = cleanText(studentName, 160);
  if (!text || !identity) return text;
  const identityPattern = escapeRegExp(identity).replace(/\s+/g, '\\s+');
  const boundaryPattern = new RegExp(`(^|[^\\p{L}\\p{N}\\p{M}_])${identityPattern}(?=$|[^\\p{L}\\p{N}\\p{M}_])`, 'giu');
  return cleanText(text.replace(boundaryPattern, '$1kamu'));
}

export function prepareTutorConversationMessagesForPersistence(messages = [], studentName = '') {
  return (Array.isArray(messages) ? messages : []).map(message => {
    const role = message?.role === 'ai' || message?.role === 'assistant' ? 'ai' : message?.role;
    if (role !== 'ai') return message;
    const { persistedText, ...safeMessage } = message || {};
    const storageText = cleanText(persistedText) || cleanText(message?.text);
    return {
      ...safeMessage,
      role: 'ai',
      text: removeStudentIdentityFromAssistantText(storageText, studentName)
    };
  });
}

function cleanSuggestion(value) {
  if (typeof value === 'string') return cleanText(value, 90);
  if (!value || typeof value !== 'object') return '';
  const label = cleanText(value.label, 90);
  if (!label) return '';
  return {
    actionId: cleanText(value.actionId, 80),
    label,
    intent: cleanText(value.intent, 60),
    source: cleanText(value.source, 60)
  };
}

export function sanitizeTutorPedagogicalState(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const pendingFollowUp = cleanText(value.pendingFollowUp, 200);
  const state = {
    supportStage: cleanText(value.supportStage, 48),
    misunderstandingCount: Math.max(0, Math.min(3, Math.floor(Number(value.misunderstandingCount) || 0))),
    strategyUsed: cleanText(value.strategyUsed, 64),
    currentConcept: cleanText(value.currentConcept, 240),
    pendingFollowUp: containsPotentialPersonalData(pendingFollowUp) ? '' : pendingFollowUp,
    signal: cleanText(value.signal, 40),
    misconceptionType: cleanText(value.misconceptionType, 80)
  };
  return Object.values(state).some(item => item !== '' && item !== 0) ? state : null;
}

export function sanitizeTutorConversationMessage(value = {}) {
  const role = value?.role === 'user' ? 'user' : value?.role === 'ai' || value?.role === 'assistant' ? 'ai' : '';
  const rawText = cleanText(value?.text);
  if (!role || !rawText) return null;
  const retainedText = role === 'ai' ? cleanText(value?.persistedText) || rawText : rawText;
  const declaredSafetySignal = cleanText(value?.safetySignal, 40);
  const safetySignal = role === 'user'
    ? detectTutorSafetyRisk(rawText) || (RETAINED_SAFETY_SIGNALS.has(declaredSafetySignal) ? declaredSafetySignal : '')
    : '';
  const privacySignal = containsPotentialPersonalData(retainedText) || value?.privacySignal === 'personal-data'
    ? 'personal-data'
    : '';
  const text = privacySignal
    ? TUTOR_MEMORY_REDACTION_TEXT.personalData
    : safetySignal
      ? TUTOR_MEMORY_REDACTION_TEXT.safety
      : retainedText;
  return {
    role,
    text,
    tone: cleanText(value?.tone, 40),
    source: cleanText(value?.source, 60),
    intent: cleanText(value?.intent, 60),
    dialogueClassification: cleanText(value?.dialogueClassification, 40),
    privacySignal,
    safetySignal,
    pedagogicalState: sanitizeTutorPedagogicalState(value?.pedagogicalState),
    suggestions: (Array.isArray(value?.suggestions) ? value.suggestions : [])
      .slice(0, 3)
      .map(cleanSuggestion)
      .filter(Boolean)
  };
}

function cloneMessages(messages = []) {
  return messages.map(message => ({
    ...message,
    pedagogicalState: message.pedagogicalState ? { ...message.pedagogicalState } : null,
    suggestions: message.suggestions.map(item => typeof item === 'string' ? item : { ...item })
  }));
}

export function createBoundedTutorConversationMemory({
  maxScopes = DEFAULT_MAX_SCOPES,
  maxTurns = DEFAULT_MAX_TURNS,
  ttlMs = DEFAULT_TTL_MS,
  now = () => Date.now()
} = {}) {
  const scopes = new Map();
  const safeMaxScopes = Math.max(1, Number(maxScopes) || DEFAULT_MAX_SCOPES);
  const safeMaxTurns = Math.max(2, Number(maxTurns) || DEFAULT_MAX_TURNS);
  const safeTtlMs = Math.max(1000, Number(ttlMs) || DEFAULT_TTL_MS);

  function removeExpired(currentTime = now()) {
    for (const [scope, entry] of scopes.entries()) {
      if (currentTime - entry.lastUsedAt >= safeTtlMs) scopes.delete(scope);
    }
  }

  function get(scopeValue) {
    const scope = cleanScope(scopeValue);
    if (!scope) return [];
    const currentTime = now();
    removeExpired(currentTime);
    const entry = scopes.get(scope);
    if (!entry) return [];
    scopes.delete(scope);
    scopes.set(scope, { ...entry, lastUsedAt: currentTime });
    return cloneMessages(entry.messages);
  }

  function set(scopeValue, messages = []) {
    const scope = cleanScope(scopeValue);
    if (!scope) return [];
    const currentTime = now();
    removeExpired(currentTime);
    const boundedMessages = (Array.isArray(messages) ? messages : [])
      .map(sanitizeTutorConversationMessage)
      .filter(Boolean)
      .slice(-safeMaxTurns);
    scopes.delete(scope);
    if (boundedMessages.length) scopes.set(scope, { messages: boundedMessages, lastUsedAt: currentTime });
    while (scopes.size > safeMaxScopes) scopes.delete(scopes.keys().next().value);
    return cloneMessages(boundedMessages);
  }

  function clear() {
    scopes.clear();
  }

  function deleteScope(scopeValue) {
    return scopes.delete(cleanScope(scopeValue));
  }

  function size() {
    removeExpired();
    return scopes.size;
  }

  return Object.freeze({ get, set, clear, delete: deleteScope, size });
}

export const TUTOR_CONVERSATION_MEMORY_LIMITS = Object.freeze({
  maxScopes: DEFAULT_MAX_SCOPES,
  maxTurns: DEFAULT_MAX_TURNS,
  ttlMs: DEFAULT_TTL_MS,
  maxScopeLength: MAX_SCOPE_LENGTH
});

export default {
  createBoundedTutorConversationMemory,
  prepareTutorConversationMessagesForPersistence,
  removeStudentIdentityFromAssistantText,
  sanitizeTutorPedagogicalState,
  sanitizeTutorConversationMessage,
  TUTOR_MEMORY_REDACTION_TEXT,
  TUTOR_CONVERSATION_MEMORY_LIMITS
};
