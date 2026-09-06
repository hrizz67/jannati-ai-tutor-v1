import { describe, expect, it } from 'vitest';
import { getAnswerRevealPolicy, textContainsExpectedAnswer } from '../../src/ai/policy/answerRevealPolicy.js';
import { getDailyQuestionCount, resolveAuthoritativeAccess } from '../../src/services/accessControl.js';
import { applyScopedLearningSnapshot, scopeChildLearningSnapshot } from '../../src/services/childScopedStorage.js';
import { getServiceWorkerUrl } from '../../src/services/serviceWorkerRegistration.js';
import { createTutorConversationScope, getLearningStorageScope } from '../../src/services/studentIdentity.js';
import { isAcceptedQuestionAnswer } from '../../src/utils/acceptedAnswers.js';
import { createCanonicalProgress, getCanonicalAccuracy } from '../../src/utils/canonicalProgress.js';
import { getLocalDateKey } from '../../src/utils/localDate.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

describe('date and quota policy', () => {
  it('uses the Malaysia calendar day at the UTC boundary', () => {
    expect(getLocalDateKey('2026-09-05T16:30:00.000Z')).toBe('2026-09-06');
  });

  it('deduplicates one recorded attempt across profile stores', () => {
    const attempt = {
      eventId: 'event-1',
      questionId: 'math-1',
      subjectId: 'math',
      topicId: 'nombor',
      answeredAt: '2026-09-06T01:00:00.000Z'
    };
    expect(getDailyQuestionCount(
      { history: [attempt] },
      { learningHistory: [{ ...attempt }] },
      '2026-09-06',
      'math'
    )).toBe(1);
  });
});

describe('access and answer safety', () => {
  it('fails closed when premium data belongs to another account', () => {
    const access = resolveAuthoritativeAccess('account-a', {
      id: 'account-b',
      access_status: 'premium',
      access_expires_at: '2999-01-01T00:00:00.000Z'
    });
    expect(access.isPremium).toBe(false);
    expect(access.verifiedForAccount).toBe(false);
  });

  it('reveals an answer only after the protected support threshold', () => {
    expect(getAnswerRevealPolicy({ attemptCount: 2 }).canRevealAnswer).toBe(false);
    expect(getAnswerRevealPolicy({ attemptCount: 3 }).canRevealAnswer).toBe(true);
    expect(textContainsExpectedAnswer('Cuba fikirkan haiwan itu.', ['ikan'])).toBe(false);
  });

  it('accepts exact punctuation without weakening ordinary answers', () => {
    const question = { answer: '.', acceptedAnswers: ['.'] };
    expect(isAcceptedQuestionAnswer('.', question)).toBe(true);
    expect(isAcceptedQuestionAnswer(',', question)).toBe(false);
  });
});

describe('student identity and normalized analytics', () => {
  it('isolates same-name children and Tutor conversations by ID', () => {
    const aina = getLearningStorageScope({ accountId: 'family', childId: 'child-a', name: 'Aina' });
    const ainaTwo = getLearningStorageScope({ accountId: 'family', childId: 'child-b', name: 'Aina' });
    expect(aina.scopeKey).not.toBe(ainaTwo.scopeKey);
    expect(createTutorConversationScope(aina, { subjectId: 'bm', topicId: 'kata-nama', sessionId: 's1' }))
      .not.toBe(createTutorConversationScope(ainaTwo, { subjectId: 'bm', topicId: 'kata-nama', sessionId: 's1' }));
  });

  it('normalizes negative totals and derives canonical accuracy', () => {
    const progress = createCanonicalProgress({
      xp: -10,
      totalQuestions: 10,
      correctQuestions: 8,
      incorrectQuestions: 2
    });
    expect(progress.global.totalXp).toBe(0);
    expect(getCanonicalAccuracy(progress)).toBe(80);
  });

  it('rejects a child snapshot restored to another child', () => {
    const identity = getLearningStorageScope({ accountId: 'family', childId: 'child-a' });
    const wrongIdentity = getLearningStorageScope({ accountId: 'family', childId: 'child-b' });
    const scoped = scopeChildLearningSnapshot({
      jannati_v151_profile: JSON.stringify({ name: 'Aina', xp: 25 })
    }, identity);
    const storage = new MemoryStorage();
    expect(scoped.ok).toBe(true);
    expect(applyScopedLearningSnapshot(storage, scoped.snapshot, wrongIdentity).ok).toBe(false);
    expect(storage.getItem('jannati_v151_profile')).toBeNull();
  });
});

describe('service worker cache version', () => {
  it('derives the registration URL from the application version', () => {
    expect(getServiceWorkerUrl('/jannati-ai-tutor-v1/', '3.10.0'))
      .toBe('/jannati-ai-tutor-v1/service-worker.js?v=3.10.0');
  });
});
