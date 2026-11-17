import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createTutorConversationScope } from '../../src/services/studentIdentity.js';
import {
  createYearScopedProgressKey,
  createYearScopedTutorConversationScope
} from '../../src/services/yearScopedLearningKeys.js';
import { applyCanonicalLearnerReward } from '../../src/utils/learnerProgressIntegrity.js';

const identity = { accountId: 'synthetic-account', childId: 'synthetic-child' };
const context = {
  subjectId: 'bm', topicId: 'kata-nama', sessionId: 's1', questionId: 'bm-001'
};

describe('M1-E inventory: progress/Tutor/reward remain on explicit future migration hold', () => {
  it('retains Year 2 progress IDs exactly and isolates future curriculum editions in planning helpers', () => {
    const selected = { subjectId: 'bm', topicId: 'kata-nama' };
    const old = createYearScopedProgressKey({ ...selected, year: 'Tahun 2' });
    const one = createYearScopedProgressKey({ ...selected, year: 'Tahun 1' });
    const three = createYearScopedProgressKey({ ...selected, year: 'Tahun 3' });
    expect(old).toBe('bm_kata-nama');
    expect(new Set([old, one, three]).size).toBe(3);
    expect(one).toContain('kp2027');
    expect(three).toContain('kssr-current');
  });

  it('retains Year 2 Tutor scope exactly and plans separate scopes for Year 1/3', () => {
    const old = createTutorConversationScope(identity, context);
    const two = createYearScopedTutorConversationScope(identity, { ...context, year: 'Tahun 2' });
    const one = createYearScopedTutorConversationScope(identity, { ...context, year: 'Tahun 1' });
    const three = createYearScopedTutorConversationScope(identity, { ...context, year: 'Tahun 3' });
    expect(two).toBe(old);
    expect(new Set([two, one, three]).size).toBe(3);
    expect(one).toContain('kp2027');
    expect(three).toContain('Tahun%203');
  });

  it('demonstrates existing reward deduplication cannot distinguish a reused cross-year event key', () => {
    const profile = {
      ...identity,
      xp: 10, coins: 1,
      processedRewardKeys: ['quiz:bm-001']
    };
    const previousEvent = applyCanonicalLearnerReward({ identity, profile }, {
      eventKey: 'quiz:bm-001', xp: 5, coins: 2
    });
    expect(previousEvent.credited).toBe(false);
    expect(previousEvent.profile.xp).toBe(10);
    expect(previousEvent.profile.coins).toBe(1);
    // Preserve this important legacy dedup invariant. Future years must
    // namespace the reward event upstream, not disable duplicate prevention.
  });

  it('proves the active code remains yearless and therefore cannot enable new grades yet', () => {
    const app = readFileSync('src/App.jsx', 'utf8');
    const memory = readFileSync('src/ai/memoryEngine.js', 'utf8');
    const identitySource = readFileSync('src/services/studentIdentity.js', 'utf8');
    const reward = readFileSync('src/utils/learnerProgressIntegrity.js', 'utf8');
    const activeResume = readFileSync('src/utils/resumeStorage.js', 'utf8');

    expect(app).toContain('function progressKey(subjectId, topicId)');
    expect(app).toContain('${subjectId}_${topicId}');
    expect(memory).toContain('function progressKey(subjectId, topicId)');
    expect(identitySource).toContain('export function createTutorConversationScope(');
    expect(reward).toContain("const eventKey = String(reward.eventKey || '').trim()");
    expect(activeResume).not.toContain('getYearScopedResumeScopeKey');
    expect(app).not.toContain('multiYearResumeMigrationDryRun');
  });
});
