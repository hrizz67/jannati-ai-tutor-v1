function normalizeScopeKey(value = '') {
  return String(value ?? '').trim();
}

function normalizeMessages(value = []) {
  return Array.isArray(value) ? value.slice() : [];
}

export function createScopedConversationState(scopeKey = '', messages = []) {
  return {
    scopeKey: normalizeScopeKey(scopeKey),
    messages: normalizeMessages(messages)
  };
}

export function readScopedConversationMessages(state = {}, expectedScopeKey = '') {
  const scopeKey = normalizeScopeKey(expectedScopeKey);
  if (!scopeKey || state?.scopeKey !== scopeKey) return [];
  return normalizeMessages(state.messages);
}

export function updateScopedConversationMessages(state = {}, expectedScopeKey = '', update = []) {
  const scopeKey = normalizeScopeKey(expectedScopeKey);
  if (!scopeKey || state?.scopeKey !== scopeKey) return state;
  const currentMessages = normalizeMessages(state.messages);
  const nextMessages = typeof update === 'function' ? update(currentMessages) : update;
  return createScopedConversationState(scopeKey, nextMessages);
}

export function getScopedConversationWrite(state = {}, expectedScopeKey = '') {
  const scopeKey = normalizeScopeKey(expectedScopeKey);
  if (!scopeKey || state?.scopeKey !== scopeKey) return null;
  return {
    scopeKey,
    messages: normalizeMessages(state.messages)
  };
}

export default {
  createScopedConversationState,
  readScopedConversationMessages,
  updateScopedConversationMessages,
  getScopedConversationWrite
};
