import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createTutorConversationScope
} from '../../src/services/studentIdentity.js';
import {
  createScopedConversationState,
  getScopedConversationWrite,
  updateScopedConversationMessages
} from '../../src/ai/conversation/scopedConversationState.js';
import { applyCanonicalLearnerReward } from '../../src/utils/learnerProgressIntegrity.js';
import {
  planYearScopedProgressKey,
  planYearScopedTutorScope,
  planYearScopedRewardEventKey
} from '../../src/services/yearScopedLearningMigrationKeys.js';

const identity = { accountId: 'family-a', childId: 'child-a' };
const context = { subjectId: 'bm', topicId: 'kata-nama', sessionId: 'session-1', questionId: 'BM-001' };
const two = { year: 'Tahun 2', curriculumId: 'kssr-current' };
const one = { year: 'Tahun 1', curriculumId: 'kp2027' };
const three = { year: 'Tahun 3', curriculumId: 'kssr-current' };

describe('M1-F year-aware Tutor, progress and reward contract (planning only)', () => {
  it('keeps original Year 2 Tutor, progress and reward keys byte-for-byte', () => {
    expect(planYearScopedProgressKey({ ...two, subjectId: 'bm', topicId: 'kata-nama' }))
      .toBe('bm_kata-nama');
    expect(planYearScopedTutorScope(identity, { ...context, ...two }))
      .toBe(createTutorConversationScope(identity, context));
    expect(planYearScopedRewardEventKey({ ...two, eventKey: 'quiz:BM-001' }))
      .toBe('quiz:BM-001');
  });

  it('separates the same topic across both grade and account/child for future years', () => {
    const a = { ...identity, ...one, subjectId: 'bm', topicId: 'kata-nama' };
    const b = { ...a, ...three };
    const otherChild = { ...a, childId: 'child-b' };
    const otherAccount = { ...a, accountId: 'family-b' };
    expect(new Set([a, b, otherChild, otherAccount]
      .map(planYearScopedProgressKey)).size).toBe(4);
    expect(planYearScopedProgressKey(a)).toContain('kp2027');
    expect(planYearScopedProgressKey(b)).toContain('Tahun%203');
  });

  it('requires explicit identity, year/edition, and context before planning a future Tutor scope', () => {
    expect(() => planYearScopedTutorScope({}, { ...context, ...one })).toThrow(/accountId/);
    expect(() => planYearScopedTutorScope(identity, { ...context, ...one, questionId: '' }))
      .toThrow(/questionId/);
    expect(() => planYearScopedTutorScope(identity, { ...context, ...one, sessionId: '' }))
      .toThrow(/sessionId/);
    expect(() => planYearScopedTutorScope(identity, { ...context, year: 'Tahun 4', curriculumId: 'kssr-current' }))
      .toThrow(/Unsupported or ambiguous/);
    expect(() => planYearScopedTutorScope(identity, { ...context, ...one, questionId: 'x'.repeat(400) }))
      .toThrow(/scope exceeds memory guard/);
  });

  it('protects future Tutor conversation state against late stale replies across grade boundaries', () => {
    const year1Scope = planYearScopedTutorScope(identity, { ...context, ...one });
    const year3Scope = planYearScopedTutorScope(identity, { ...context, ...three });
    const childBScope = planYearScopedTutorScope({ ...identity, childId: 'child-b' }, { ...context, ...one });
    expect(new Set([year1Scope, year3Scope, childBScope]).size).toBe(3);
    const state = createScopedConversationState(year3Scope, [{ role: 'user', text: 'synthetic current turn' }]);
    expect(getScopedConversationWrite(state, year1Scope)).toBeNull();
    expect(updateScopedConversationMessages(state, year1Scope, turns => [
      ...turns, { role: 'ai', text: 'synthetic stale answer' }
    ])).toBe(state);
    expect(getScopedConversationWrite(state, year3Scope)?.messages).toHaveLength(1);
  });

  it('namespaces future-year reward idempotency without disabling replay protection', () => {
    const year1Key = planYearScopedRewardEventKey({ ...identity, ...one, eventKey: 'quiz:BM-001' });
    const year3Key = planYearScopedRewardEventKey({ ...identity, ...three, eventKey: 'quiz:BM-001' });
    const otherChildKey = planYearScopedRewardEventKey({ ...identity, childId: 'child-b', ...one, eventKey: 'quiz:BM-001' });
    expect(new Set([year1Key, year3Key, otherChildKey, 'quiz:BM-001']).size).toBe(4);
    expect(year1Key).toContain('Tahun%201');
    const profile = { ...identity, xp: 0, coins: 0, processedRewardKeys: [] };
    const first = applyCanonicalLearnerReward({ identity, profile }, { eventKey: year1Key, xp: 5, coins: 1 });
    const second = applyCanonicalLearnerReward({ identity, profile: first.profile }, { eventKey: year3Key, xp: 5, coins: 1 });
    const replay = applyCanonicalLearnerReward({ identity, profile: second.profile }, { eventKey: year1Key, xp: 5, coins: 1 });
    expect(first.credited).toBe(true);
    expect(second.credited).toBe(true);
    expect(replay.credited).toBe(false);
    expect(replay.profile.xp).toBe(10);
    expect(replay.profile.coins).toBe(2);
  });

  it('fails closed rather than borrowing Year 2 identity for unsupported or incomplete future keys', () => {
    expect(() => planYearScopedProgressKey({ ...one, subjectId: 'bm', topicId: 'nombor' }))
      .toThrow(/accountId/);
    expect(() => planYearScopedRewardEventKey({ ...one, eventKey: 'quiz:BM-001' }))
      .toThrow(/accountId/);
    expect(() => planYearScopedRewardEventKey({ ...identity, ...one, eventKey: '' }))
      .toThrow(/eventKey/);
    expect(() => planYearScopedRewardEventKey({ ...identity, year: 'Tahun 3', curriculumId: 'kp2027', eventKey: 'x' }))
      .toThrow(/Unsupported or ambiguous/);
  });

  it('does not wire new planning helpers into active teaching, XP, Tutor or browser storage', () => {
    for (const path of [
      'src/App.jsx',
      'src/utils/learnerProgressIntegrity.js',
      'src/utils/resumeStorage.js',
      'src/components/ai/TutorAIModal.jsx'
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toContain('yearScopedLearningMigrationKeys');
    }
    const source = readFileSync('src/services/yearScopedLearningMigrationKeys.js', 'utf8');
    expect(source).not.toMatch(/localStorage\.|sessionStorage\.|\.setItem\(|\.removeItem\(/);
  });
});
