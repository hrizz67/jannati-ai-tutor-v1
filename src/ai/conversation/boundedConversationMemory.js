const DEFAULT_MAX_SCOPES = 24;
const DEFAULT_MAX_TURNS = 12;
const DEFAULT_TTL_MS = 30 * 60 * 1000;
const MAX_SCOPE_LENGTH = 320;
const MAX_MESSAGE_LENGTH = 1400;

function cleanText(value = '', maxLength = MAX_MESSAGE_LENGTH) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanScope(value = '') {
  return cleanText(value, MAX_SCOPE_LENGTH);
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

function cleanMessage(value = {}) {
  const role = value?.role === 'user' ? 'user' : value?.role === 'ai' || value?.role === 'assistant' ? 'ai' : '';
  const text = cleanText(value?.text);
  if (!role || !text) return null;
  return {
    role,
    text,
    tone: cleanText(value?.tone, 40),
    source: cleanText(value?.source, 60),
    intent: cleanText(value?.intent, 60),
    dialogueClassification: cleanText(value?.dialogueClassification, 40),
    suggestions: (Array.isArray(value?.suggestions) ? value.suggestions : [])
      .slice(0, 3)
      .map(cleanSuggestion)
      .filter(Boolean)
  };
}

function cloneMessages(messages = []) {
  return messages.map(message => ({
    ...message,
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
      .map(cleanMessage)
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
  ttlMs: DEFAULT_TTL_MS
});

export default {
  createBoundedTutorConversationMemory,
  TUTOR_CONVERSATION_MEMORY_LIMITS
};
