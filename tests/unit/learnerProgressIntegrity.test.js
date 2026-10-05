import { describe, expect, it } from 'vitest';
import {
  applyCanonicalLearnerReward,
  reconcileCumulativeLearnerProfile,
  resolveCanonicalRewardBaseline
} from '../../src/utils/learnerProgressIntegrity.js';
import { createBoundedRecoveryNoticeTracker } from '../../src/utils/recoveryNotice.js';
import { applyGamificationEvent } from '../../src/ai/gamification/rewardEngine.js';
import { loadGamificationProfile, saveGamificationProfile } from '../../src/ai/gamification/gamificationProfile.js';
import { loadProfile as loadAdaptiveProfile, saveProfile as saveAdaptiveProfile } from '../../src/ai/adaptive/storageEngine.js';
import { loadAIMemory, saveAIMemory } from '../../src/ai/memoryEngine.js';
import { loadStudentCore, saveStudentCore } from '../../src/ai/studentIntelligence.js';
import { createCanonicalGamification } from '../../src/utils/canonicalGamification.js';
import {
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  mergeCloudLearningPayload,
  normalizeActiveLearningProjection
} from '../../src/services/learningSync.js';

const ACCOUNT_ID = 'account-a';
const CHILD_ID = 'child-a';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}

function withMemoryStorage(run) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage()
  });
  try {
    return run(globalThis.localStorage);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
}

function scoped(value = {}, identity = {}) {
  return {
    accountId: identity.accountId ?? ACCOUNT_ID,
    childId: identity.childId ?? CHILD_ID,
    ...value
  };
}

function staleRewardFixture() {
  return {
    identity: { accountId: ACCOUNT_ID, childId: CHILD_ID },
    profile: scoped({
      xp: 90,
      coins: 0,
      badges: ['Pembaca'],
      history: [{ id: 'old-session', percent: 90 }],
      progress: {
        bm_topic_1: { attempts: 3, best: 90, last: 70, stars: 3 }
      },
      mastery: 41,
      readiness: 'needs_support',
      latestScore: 55
    }),
    adaptiveProfile: scoped({
      xp: 1120,
      coins: 70,
      totalQuestions: 35,
      mastery: 88,
      readiness: 'ready',
      latestScore: 99
    }),
    gamificationProfile: scoped({
      xp: 1120,
      coins: 70,
      badges: ['Pembaca', 'Juara'],
      achievements: [{ id: 'first-quiz' }],
      processedEventKeys: ['older-event']
    }),
    studentCore: scoped({
      profile: scoped({ xp: 1120, coins: 70 }),
      core: scoped({ xp: 1120, coins: 70, completedTopics: 4 })
    }),
    aiMemory: scoped({ xp: 1120, coins: 70 })
  };
}

function learningPayload({ xp, mastery = 50, capturedAt = 1, childId = CHILD_ID, accountId = ACCOUNT_ID } = {}) {
  const profile = scoped({ xp, coins: 70, mastery, updatedAt: new Date(capturedAt).toISOString() }, { accountId, childId });
  const snapshot = {
    __childSnapshotChildId: childId,
    __childSnapshotAccountId: accountId,
    __childSnapshotCapturedAt: capturedAt,
    jannati_v151_profile: JSON.stringify(profile),
    'jannati.adaptive.studentProfile': JSON.stringify(scoped({ xp, mastery, updatedAt: profile.updatedAt }, { accountId, childId })),
    'jannati.gamification.profile': JSON.stringify(scoped({ xp, coins: 70, updatedAt: profile.updatedAt }, { accountId, childId }))
  };
  return {
    [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
      version: 3,
      profiles: [{ id: childId, name: childId, year: 'Tahun 2', accountId }],
      activeChildId: childId,
      deletedChildren: {},
      archivedChildren: {}
    }),
    jannati_child_profiles: JSON.stringify([{ id: childId, name: childId, year: 'Tahun 2', accountId }]),
    jannati_active_child_id: childId,
    jannati_v151_profile: snapshot.jannati_v151_profile,
    [`${CHILD_SNAPSHOT_PREFIX}${childId}`]: JSON.stringify(snapshot)
  };
}

describe('P1.13 learner progress monotonic integrity', () => {
  it.each([
    'quiz',
    'reading',
    'listening',
    'speaking',
    'writing',
    'uasa',
    'daily-challenge',
    'interactive',
    'adaptive-practice'
  ])('credits %s from the canonical 1120 XP baseline', activityType => {
    const result = applyCanonicalLearnerReward(staleRewardFixture(), {
      activityType,
      eventKey: `${activityType}-session-1`,
      xp: 50,
      coins: 5
    });

    expect(result.credited).toBe(true);
    expect(result.baseline.xp).toBe(1120);
    expect(result.profile.xp).toBe(1170);
    expect(result.profile.coins).toBe(75);
  });

  it('does not credit the same completion event twice', () => {
    const first = applyCanonicalLearnerReward(staleRewardFixture(), {
      activityType: 'reading',
      eventKey: 'reading-session-1',
      xp: 50,
      coins: 5
    });
    const replay = applyCanonicalLearnerReward({
      ...staleRewardFixture(),
      profile: first.profile,
      gamificationProfile: {
        ...staleRewardFixture().gamificationProfile,
        xp: first.profile.xp,
        coins: first.profile.coins,
        processedEventKeys: first.profile.processedRewardKeys
      }
    }, {
      activityType: 'reading',
      eventKey: 'reading-session-1',
      xp: 50,
      coins: 5
    });

    expect(replay.credited).toBe(false);
    expect(replay.profile.xp).toBe(1170);
    expect(replay.profile.coins).toBe(75);
  });

  it('preserves cumulative stars, badges, achievements and historical progress evidence', () => {
    const result = applyCanonicalLearnerReward(staleRewardFixture(), {
      activityType: 'quiz',
      eventKey: 'quiz-session-1',
      xp: 50,
      coins: 5,
      patch: {
        badges: ['Topik Baharu'],
        history: [{ id: 'new-session', percent: 60 }],
        progress: {
          bm_topic_1: { attempts: 4, best: 60, last: 60, stars: 1 }
        }
      }
    });

    expect(result.profile.coins).toBe(75);
    expect(result.profile.badges).toEqual(expect.arrayContaining(['Pembaca', 'Juara', 'Topik Baharu']));
    expect(result.profile.achievements).toEqual([{ id: 'first-quiz' }]);
    expect(result.profile.history.map(item => item.id)).toEqual(expect.arrayContaining(['new-session', 'old-session']));
    expect(result.profile.progress.bm_topic_1).toMatchObject({ attempts: 4, best: 90, last: 60, stars: 3 });
  });

  it('does not force pedagogical current estimates to be monotonic', () => {
    const result = reconcileCumulativeLearnerProfile(staleRewardFixture());

    expect(result.mastery).toBe(41);
    expect(result.readiness).toBe('needs_support');
    expect(result.latestScore).toBe(55);
  });

  it('uses only evidence belonging to the requested account and child', () => {
    const input = staleRewardFixture();
    input.adaptiveProfile = scoped({ xp: 9000 }, { childId: 'child-b' });
    input.gamificationProfile = scoped({ xp: 8000 }, { accountId: 'account-b' });
    input.studentCore = {};
    input.aiMemory = {};

    expect(resolveCanonicalRewardBaseline(input).xp).toBe(90);
  });

  it('does not give a new child progress from another child', () => {
    const baseline = resolveCanonicalRewardBaseline({
      identity: { accountId: ACCOUNT_ID, childId: 'new-child' },
      profile: scoped({ xp: 0 }, { childId: 'new-child' }),
      adaptiveProfile: scoped({ xp: 1120 }, { childId: CHILD_ID }),
      gamificationProfile: scoped({ xp: 1120 }, { childId: CHILD_ID })
    });

    expect(baseline.xp).toBe(0);
  });

  it('deduplicates the same optional recovery-cache warning per account and failure', () => {
    const tracker = createBoundedRecoveryNoticeTracker(4);
    const warning = { accountId: ACCOUNT_ID, reason: 'quota_exceeded', failedKey: 'jannati_child_snapshot:child-a' };

    expect(tracker.shouldAnnounce(warning)).toBe(true);
    expect(tracker.shouldAnnounce(warning)).toBe(false);
    expect(tracker.shouldAnnounce({ ...warning, accountId: 'account-b' })).toBe(true);
  });

  it('recovers a stale root projection from richer child evidence on reload', () => {
    const payload = learningPayload({ xp: 1120, capturedAt: 1000 });
    payload.jannati_v151_profile = JSON.stringify(scoped({ xp: 140, coins: 0, updatedAt: new Date(2000).toISOString() }));

    const normalized = normalizeActiveLearningProjection(payload, CHILD_ID, { accountId: ACCOUNT_ID });

    expect(JSON.parse(normalized.jannati_v151_profile).xp).toBe(1120);
  });

  it('preserves a legitimate local reward across a cross-device cloud merge', () => {
    const cloud = learningPayload({ xp: 1120, capturedAt: 1000 });
    const localReward = applyCanonicalLearnerReward({
      ...staleRewardFixture(),
      profile: scoped({ xp: 90, coins: 0 })
    }, { activityType: 'quiz', eventKey: 'device-b-quiz', xp: 50, coins: 5 });
    const local = learningPayload({ xp: localReward.profile.xp, capturedAt: 2000 });
    const merged = mergeCloudLearningPayload(local, cloud, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      mergeDirtySnapshots: true
    });

    expect(JSON.parse(merged.jannati_v151_profile).xp).toBe(1170);
    expect(JSON.parse(JSON.parse(merged[`${CHILD_SNAPSHOT_PREFIX}${CHILD_ID}`]).jannati_v151_profile).xp).toBe(1170);
  });

  it('does not let a newer but much poorer local snapshot downgrade cloud XP', () => {
    const cloud = learningPayload({ xp: 1120, capturedAt: 1000 });
    const staleLocal = learningPayload({ xp: 140, capturedAt: 5000 });
    const merged = mergeCloudLearningPayload(staleLocal, cloud, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: []
    });

    expect(JSON.parse(merged.jannati_v151_profile).xp).toBe(1120);
  });

  it('uses the newer current mastery estimate while keeping XP cumulative', () => {
    const cloud = learningPayload({ xp: 1120, mastery: 80, capturedAt: 1000 });
    const local = learningPayload({ xp: 1170, mastery: 40, capturedAt: 2000 });
    const merged = mergeCloudLearningPayload(local, cloud, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      mergeDirtySnapshots: true
    });
    const profile = JSON.parse(merged.jannati_v151_profile);

    expect(profile.xp).toBe(1170);
    expect(profile.mastery).toBe(40);
  });

  it('keeps canonical stars when the adaptive projection has XP but zero coins', () => {
    const canonical = createCanonicalGamification({
      profile: { xp: 1120, coins: 70 },
      adaptiveProfile: { xp: 1120, coins: 0 },
      gamificationProfile: { xp: 1120, coins: 70 }
    });

    expect(canonical.globalXp).toBe(1120);
    expect(canonical.starCount).toBe(70);
  });

  it('keeps gamification XP monotonic and replay-idempotent', () => {
    const current = scoped({ xp: 1120, coins: 70, processedEventKeys: [], updatedAt: '2026-10-04T00:00:00.000Z' });
    const context = {
      studentIdentity: { accountId: ACCOUNT_ID, childId: CHILD_ID },
      profile: scoped({ xp: 1170, coins: 75, totalQuestions: 1, correctQuestions: 1 }),
      today: new Date('2026-10-04T01:00:00.000Z')
    };
    const event = { type: 'session-complete', sessionId: 'session-1', date: context.today };
    const first = applyGamificationEvent(current, {}, context, event);
    const replay = applyGamificationEvent(first, {}, context, event);

    expect(first.xp).toBeGreaterThanOrEqual(1170);
    expect(first.coins).toBeGreaterThanOrEqual(75);
    expect(replay.xp).toBe(first.xp);
    expect(replay.processedEventKeys).toEqual(first.processedEventKeys);
  });

  it('does not persist a newer lower XP projection over richer local evidence', () => withMemoryStorage(() => {
    const identity = { accountId: ACCOUNT_ID, childId: CHILD_ID };

    saveGamificationProfile(scoped({ xp: 1120, coins: 70, updatedAt: '2026-10-04T00:00:00.000Z' }), identity);
    saveGamificationProfile(scoped({ xp: 140, coins: 0, updatedAt: '2026-10-04T01:00:00.000Z' }), identity);
    expect(loadGamificationProfile(identity)).toMatchObject({ xp: 1120, coins: 70 });

    saveAdaptiveProfile(scoped({ xp: 1120, coins: 70 }), identity);
    saveAdaptiveProfile(scoped({ xp: 140, coins: 0 }), identity);
    expect(loadAdaptiveProfile(identity)).toMatchObject({ xp: 1120, coins: 70 });

    saveAIMemory(scoped({ xp: 1120, coins: 70 }), identity);
    saveAIMemory(scoped({ xp: 140, coins: 0 }), identity);
    expect(loadAIMemory(identity)).toMatchObject({ xp: 1120, coins: 70 });

    saveStudentCore(scoped({ xp: 1120, coins: 70 }), [], {}, identity);
    saveStudentCore(scoped({ xp: 140, coins: 0 }), [], {}, identity);
    expect(loadStudentCore(scoped({ xp: 0, coins: 0 }), identity)).toMatchObject({ xp: 1120, coins: 70 });
  }));
});
