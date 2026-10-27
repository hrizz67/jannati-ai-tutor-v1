import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createScopedConversationState,
  getScopedConversationWrite,
  readScopedConversationMessages,
  updateScopedConversationMessages
} from '../../src/ai/conversation/scopedConversationState.js';

function scope({ account = 'account-a', child = 'child-a', session = 'session-a', question = 'question-a' } = {}) {
  return `${account}::${child}::bm::kata-nama::${session}::${question}`;
}

describe('Tutor conversation scope isolation hardening', () => {
  it.each([
    ['child A to child B', scope(), scope({ child: 'child-b' })],
    ['account A to account B', scope(), scope({ account: 'account-b' })],
    ['session A to session B', scope(), scope({ session: 'session-b' })],
    ['question A to question B', scope(), scope({ question: 'question-b' })]
  ])('prevents cross-scope writes for %s', (_label, previousScope, nextScope) => {
    const previousState = createScopedConversationState(previousScope, [{ role: 'user', text: 'old-scope-message' }]);
    expect(getScopedConversationWrite(previousState, nextScope)).toBeNull();
    expect(readScopedConversationMessages(previousState, nextScope)).toEqual([]);

    const nextState = createScopedConversationState(nextScope, [{ role: 'ai', text: 'new-scope-message' }]);
    const staleUpdate = updateScopedConversationMessages(nextState, previousScope, messages => [
      ...messages,
      { role: 'ai', text: 'late-old-scope-response' }
    ]);
    expect(staleUpdate).toBe(nextState);
    expect(getScopedConversationWrite(staleUpdate, nextScope)?.messages).toEqual([{ role: 'ai', text: 'new-scope-message' }]);
  });

  it('keeps 10,000 simulated transitions free from wrong-scope writes', () => {
    let activeScope = scope();
    let state = createScopedConversationState(activeScope, [{ role: 'ai', text: 'turn-0' }]);
    let wrongScopeWrites = 0;

    for (let index = 1; index <= 10_000; index += 1) {
      const previousScope = activeScope;
      activeScope = scope({
        account: `account-${index % 7}`,
        child: `child-${index % 19}`,
        session: `session-${index % 31}`,
        question: `question-${index}`
      });
      if (getScopedConversationWrite(state, activeScope)) wrongScopeWrites += 1;
      state = createScopedConversationState(activeScope, [{ role: 'ai', text: `turn-${index}` }]);
      const staleState = updateScopedConversationMessages(state, previousScope, messages => [
        ...messages,
        { role: 'ai', text: 'stale-response' }
      ]);
      if (staleState !== state) wrongScopeWrites += 1;
      const write = getScopedConversationWrite(state, activeScope);
      if (!write || write.scopeKey !== activeScope || write.messages[0]?.text !== `turn-${index}`) wrongScopeWrites += 1;
    }

    expect(wrongScopeWrites).toBe(0);
  });

  it('wires the modal to atomic scoped state and adds no network request path', () => {
    const modalSource = readFileSync(resolve('src/components/ai/TutorAIModal.jsx'), 'utf8');
    const scopedStateSource = readFileSync(resolve('src/ai/conversation/scopedConversationState.js'), 'utf8');
    expect(modalSource).toContain('getScopedConversationWrite(conversationState, sessionKey)');
    expect(modalSource).toContain('updateScopedConversationMessages(current, sessionKey, update)');
    expect(modalSource).not.toContain('onMessagesChange?.(sessionKey, messages)');
    expect(`${modalSource}\n${scopedStateSource}`).not.toMatch(/functions\.invoke|fetch\s*\(|XMLHttpRequest|WebSocket/);
  });
});
