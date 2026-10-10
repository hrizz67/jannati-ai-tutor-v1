import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getAdaptiveProfile,
  recordQuestionResult,
  recordSessionEnd,
  recordSessionStart,
  saveAdaptiveProfile,
  synchronizeAdaptiveRewardProjection
} from '../../src/ai/adaptive/adaptiveSessionEngine.js';
import {
  loadGamificationProfile,
  recordGamificationEvent,
  saveGamificationProfile
} from '../../src/ai/gamification/gamificationEngine.js';
import { loadAIMemory, saveAIMemory, saveQuizMemory } from '../../src/ai/memoryEngine.js';
import { loadStudentCore, saveStudentCore } from '../../src/ai/studentIntelligence.js';
import { applyScopedLearningSnapshot, scopeChildLearningSnapshot } from '../../src/services/childScopedStorage.js';
import {
  acknowledgeCloudMutations,
  markCloudMutation,
  resolvePendingCloudOutbox
} from '../../src/services/cloudMutationOutbox.js';
import {
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  CLOUD_SYNC_META_KEY,
  normalizeActiveLearningProjection
} from '../../src/services/learningSync.js';
import { syncRevisionedCloudLearning } from '../../src/services/learningSyncCoordinator.js';
import { applyCanonicalLearnerReward } from '../../src/utils/learnerProgressIntegrity.js';
import { appendCreditedQuizAttempt, reconcileQuizSessionCredits } from '../../src/utils/quizSessionOutcome.js';

const ACCOUNT_ID = 'account-p1132-functional';
const CHILD_ID = 'child-p1132-functional';
const IDENTITY = Object.freeze({ accountId: ACCOUNT_ID, childId: CHILD_ID });
const QUESTION_IDS = Object.freeze(['q1', 'q2', 'q3', 'q4', 'q5']);
const OUTCOMES = Object.freeze(['correct', 'correct', 'correct', 'almost', 'wrong']);
const PROFILE_KEY = 'jannati_v151_profile';
const ADAPTIVE_KEY = 'jannati.adaptive.studentProfile';
const GAMIFICATION_KEY = 'jannati.gamification.profile';
const STUDENT_CORE_KEY = 'jannati_v152_student_core';

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

let storageDescriptor;

beforeEach(() => {
  storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage()
  });
});

afterEach(() => {
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else delete globalThis.localStorage;
});

function seedCanonicalState() {
  const profile = {
    ...IDENTITY,
    id: CHILD_ID,
    name: 'Murid',
    year: 'Tahun 2',
    xp: 1120,
    coins: 70,
    streak: 0,
    badges: [],
    history: [],
    progress: {},
    processedRewardKeys: []
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem('jannati_child_profiles', JSON.stringify([profile]));
  localStorage.setItem('jannati_active_child_id', CHILD_ID);
  saveAdaptiveProfile(profile);
  saveGamificationProfile({ ...profile, processedEventKeys: [], updatedAt: '2026-10-05T00:00:00.000Z' }, IDENTITY);
  saveAIMemory(profile, IDENTITY);
  saveStudentCore(profile, [], loadAIMemory(IDENTITY), IDENTITY);
  return profile;
}

function projectionBundle(profile) {
  return {
    identity: IDENTITY,
    profile,
    adaptiveProfile: getAdaptiveProfile(IDENTITY),
    gamificationProfile: loadGamificationProfile(IDENTITY),
    studentCore: { profile: loadStudentCore(profile, IDENTITY) },
    aiMemory: loadAIMemory(IDENTITY)
  };
}

function completeQuizSession(profile, sessionId) {
  let session = { adaptiveSessionId: sessionId, answers: [], questions: [] };
  let adaptive = recordSessionStart(getAdaptiveProfile(IDENTITY), {
    sessionId,
    subjectId: 'bm',
    topicId: 'reading',
    plannedQuestionCount: QUESTION_IDS.length,
    startedAt: '2026-10-05T01:00:00.000Z'
  });

  QUESTION_IDS.forEach((questionId, index) => {
    const status = OUTCOMES[index];
    const credit = appendCreditedQuizAttempt(session, {
      sessionId,
      questionId,
      subjectId: 'bm',
      topicId: 'reading',
      status,
      attemptNumber: 1,
      answeredAt: `2026-10-05T01:00:0${index + 1}.000Z`
    }, { questionIds: QUESTION_IDS });
    session = credit.session;
    const adaptiveResult = recordQuestionResult(adaptive, {
      sessionId,
      questionId,
      subjectId: 'bm',
      topicId: 'reading',
      attemptNumber: 1,
      correct: status === 'correct',
      difficulty: 'medium',
      timeSpent: 10,
      answeredAt: `2026-10-05T01:00:0${index + 1}.000Z`,
      awardXp: false
    });
    adaptive = adaptiveResult.profile;
    expect(adaptiveResult.summary.xpEarned).toBe(0);
  });

  const creditedSession = reconcileQuizSessionCredits(session, { questionIds: QUESTION_IDS });
  adaptive = recordSessionEnd(adaptive, {
    sessionId,
    subjectId: 'bm',
    topicId: 'reading',
    questions: QUESTION_IDS,
    plannedQuestionCount: QUESTION_IDS.length,
    correct: 3,
    wrong: 2,
    durationSeconds: 60,
    completed: true,
    endedAt: '2026-10-05T01:01:00.000Z'
  });
  const reward = applyCanonicalLearnerReward(projectionBundle(profile), {
    activityType: 'quiz',
    eventKey: `quiz::${sessionId}`,
    xp: creditedSession.xp,
    coins: creditedSession.coins
  });
  const updatedProfile = reward.profile;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
  saveQuizMemory({
    profile: updatedProfile,
    subject: { id: 'bm', short: 'BM', title: 'Bahasa Melayu' },
    topic: { id: 'reading', title: 'Bacaan', questions: QUESTION_IDS.map(id => ({ id })) },
    percent: 70,
    session: creditedSession,
    studySeconds: 60
  });
  saveStudentCore(updatedProfile, [], loadAIMemory(IDENTITY), IDENTITY);
  const alignedAdaptive = synchronizeAdaptiveRewardProjection(adaptive, updatedProfile);
  const gamification = recordGamificationEvent(
    loadGamificationProfile(IDENTITY),
    loadAIMemory(IDENTITY),
    {
      profile: { ...alignedAdaptive, ...updatedProfile },
      adaptiveProfile: alignedAdaptive,
      studentIdentity: IDENTITY,
      sessionId,
      sessionCompleted: true,
      today: new Date('2026-10-05T01:01:00.000Z')
    },
    { type: 'session-complete', sessionId, date: '2026-10-05T01:01:00.000Z' }
  );
  return { adaptive: alignedAdaptive, creditedSession, gamification, reward, profile: updatedProfile };
}

function buildCloudPayload(profile, capturedAt = 1_759_622_460_000) {
  const snapshotSource = {};
  [PROFILE_KEY, ADAPTIVE_KEY, GAMIFICATION_KEY, STUDENT_CORE_KEY, 'jannati_v151_ai_memory'].forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) snapshotSource[key] = value;
  });
  const scoped = scopeChildLearningSnapshot(snapshotSource, IDENTITY);
  expect(scoped.ok).toBe(true);
  const snapshot = {
    ...scoped.snapshot,
    __childSnapshotChildId: CHILD_ID,
    __childSnapshotAccountId: ACCOUNT_ID,
    __childSnapshotCapturedAt: capturedAt
  };
  return {
    [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
      version: 3,
      profiles: [{ ...profile, id: CHILD_ID }],
      activeChildId: CHILD_ID,
      deletedChildren: {},
      archivedChildren: {}
    }),
    jannati_child_profiles: JSON.stringify([{ ...profile, id: CHILD_ID }]),
    jannati_active_child_id: CHILD_ID,
    [PROFILE_KEY]: JSON.stringify(profile),
    [`${CHILD_SNAPSHOT_PREFIX}${CHILD_ID}`]: JSON.stringify(snapshot),
    [CLOUD_SYNC_META_KEY]: JSON.stringify({
      version: 3,
      activeChildId: CHILD_ID,
      deviceId: 'p1132-functional-device',
      updatedAt: new Date(capturedAt).toISOString()
    })
  };
}

function baselineCloudPayload() {
  const profile = JSON.parse(localStorage.getItem(PROFILE_KEY));
  return buildCloudPayload(profile, 1_759_622_400_000);
}

describe('P1.13.2 production-equivalent reward regression', () => {
  it('credits 3 correct + 1 almost + 1 wrong exactly once from 1120 XP / 70 coins', () => {
    const baseline = seedCanonicalState();
    const result = completeQuizSession(baseline, 'session-1');

    expect(result.creditedSession).toMatchObject({ xp: 35, coins: 17, correct: 3, almost: 1, wrong: 1 });
    expect(result.reward.credited).toBe(true);
    expect(result.reward.baseline).toMatchObject({ xp: 1120, coins: 70 });
    expect(result.profile).toMatchObject({ xp: 1155, coins: 87 });
    expect(result.adaptive).toMatchObject({ xp: 1155, coins: 87 });
    expect(result.gamification).toMatchObject({ xp: 1155, coins: 87 });
    expect(loadStudentCore(result.profile, IDENTITY)).toMatchObject({ xp: 1155, coins: 87 });
    expect(loadAIMemory(IDENTITY)).toMatchObject({ xp: 1155, coins: 87 });
  });

  it('keeps the rewarded snapshot and cloud payload stable through ack and refresh-equivalent reload', async () => {
    const baseline = seedCanonicalState();
    const result = completeQuizSession(baseline, 'session-refresh');
    const cloudBefore = baselineCloudPayload();
    const localPayload = buildCloudPayload(result.profile);
    let writes = 0;
    let reads = 0;
    const syncResult = await syncRevisionedCloudLearning({
      async rpc(name, args) {
        if (name.startsWith('get_learning_')) reads += 1;
        if (name === 'save_learning_data_v4') {
          writes += 1;
          return { data: { ok: true, revision: 2, payload: args.payload, serverUpdatedAt: 'revision-2' }, error: null };
        }
        throw new Error(`Unexpected RPC: ${name}`);
      }
    }, localPayload, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: cloudBefore, revision: 1, protocolVersion: 3, serverUpdatedAt: 'revision-1', error: null },
      retryBaseDelayMs: 0
    });

    expect(syncResult.ok).toBe(true);
    expect(writes).toBe(1);
    expect(reads).toBe(0);
    const normalized = normalizeActiveLearningProjection(syncResult.payload, CHILD_ID, { accountId: ACCOUNT_ID });
    const cloudProfile = JSON.parse(normalized[PROFILE_KEY]);
    const cloudSnapshot = JSON.parse(normalized[`${CHILD_SNAPSHOT_PREFIX}${CHILD_ID}`]);
    expect(cloudProfile).toMatchObject({ xp: 1155, coins: 87 });
    expect(JSON.parse(cloudSnapshot[PROFILE_KEY])).toMatchObject({ xp: 1155, coins: 87 });

    localStorage.clear();
    localStorage.setItem(PROFILE_KEY, normalized[PROFILE_KEY]);
    const restored = applyScopedLearningSnapshot(localStorage, cloudSnapshot, IDENTITY);
    expect(restored.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY))).toMatchObject({ xp: 1155, coins: 87 });
    expect(getAdaptiveProfile(IDENTITY)).toMatchObject({ xp: 1155, coins: 87 });
    expect(loadGamificationProfile(IDENTITY)).toMatchObject({ xp: 1155, coins: 87 });
    expect(loadStudentCore(cloudProfile, IDENTITY)).toMatchObject({ xp: 1155, coins: 87 });
  });

  it('credits a fresh session on the same topic but rejects an exact completion replay', () => {
    const baseline = seedCanonicalState();
    const first = completeQuizSession(baseline, 'session-1');
    const replay = applyCanonicalLearnerReward(projectionBundle(first.profile), {
      activityType: 'quiz',
      eventKey: 'quiz::session-1',
      xp: 35,
      coins: 17
    });
    expect(replay.credited).toBe(false);
    expect(replay.profile).toMatchObject({ xp: 1155, coins: 87 });

    const second = completeQuizSession(first.profile, 'session-2');
    expect(second.reward.credited).toBe(true);
    expect(second.reward.baseline).toMatchObject({ xp: 1155, coins: 87 });
    expect(second.profile).toMatchObject({ xp: 1190, coins: 104 });
  });

  it('keeps canonical rewards unchanged when a three-question partial quiz is abandoned', () => {
    const baseline = seedCanonicalState();
    let adaptive = recordSessionStart(getAdaptiveProfile(IDENTITY), {
      sessionId: 'session-partial',
      subjectId: 'bm',
      topicId: 'reading',
      plannedQuestionCount: QUESTION_IDS.length
    });

    QUESTION_IDS.slice(0, 3).forEach((questionId, index) => {
      const result = recordQuestionResult(adaptive, {
        sessionId: 'session-partial',
        questionId,
        subjectId: 'bm',
        topicId: 'reading',
        attemptNumber: 1,
        correct: index < 2,
        awardXp: false
      });
      expect(result.summary.xpEarned).toBe(0);
      adaptive = result.profile;
    });

    expect(baseline).toMatchObject({ xp: 1120, coins: 70 });
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY))).toMatchObject({ xp: 1120, coins: 70 });
    expect(adaptive).toMatchObject({ xp: 1120, coins: 70 });
    expect(loadGamificationProfile(IDENTITY)).toMatchObject({ xp: 1120, coins: 70 });
  });
});

describe('P1.13.2 production sync-state regression', () => {
  it('cannot create pending=true with dirty=[] from a mutation without an active child', () => {
    const dirty = new Set();
    const versions = new Map();
    const mutation = markCloudMutation(dirty, versions, '');
    expect(mutation.marked).toBe(false);
    expect([...dirty]).toEqual([]);
    expect([...versions]).toEqual([]);
  });

  it('repairs an interrupted pending marker using cached local/cloud evidence', () => {
    const baseline = seedCanonicalState();
    const cloud = baselineCloudPayload();
    const rewarded = completeQuizSession(baseline, 'session-recover');
    const local = buildCloudPayload(rewarded.profile);
    const recovered = resolvePendingCloudOutbox({
      pending: true,
      dirtyChildIds: [],
      localPayload: local,
      cloudPayload: cloud,
      localActiveChildId: CHILD_ID,
      accountId: ACCOUNT_ID
    });
    expect(recovered).toMatchObject({ recovered: true, clearPending: false, dirtyChildIds: [CHILD_ID] });

    const stale = resolvePendingCloudOutbox({ pending: true, dirtyChildIds: [], localPayload: {}, cloudPayload: cloud, accountId: ACCOUNT_ID });
    expect(stale).toMatchObject({ recovered: false, clearPending: true, dirtyChildIds: [] });
  });

  it('moves one activity from clean to pending to one cached-envelope write and saved ack', async () => {
    const baseline = seedCanonicalState();
    const cloud = baselineCloudPayload();
    const rewarded = completeQuizSession(baseline, 'session-sync');
    const dirty = new Set();
    const versions = new Map();
    let pending = false;
    let mutationVersion = 0;
    expect({ pending, dirty: [...dirty] }).toEqual({ pending: false, dirty: [] });

    const mutation = markCloudMutation(dirty, versions, CHILD_ID);
    pending = mutation.marked;
    mutationVersion = mutation.mutationVersion;
    expect({ pending, dirty: [...dirty], mutationVersion }).toEqual({ pending: true, dirty: [CHILD_ID], mutationVersion: 1 });
    const submitted = new Map(versions);
    let writes = 0;
    let reads = 0;
    const syncResult = await syncRevisionedCloudLearning({
      async rpc(name, args) {
        if (name.startsWith('get_learning_')) reads += 1;
        if (name === 'save_learning_data_v4') {
          writes += 1;
          return { data: { ok: true, revision: 2, payload: args.payload, serverUpdatedAt: 'revision-2' }, error: null };
        }
        throw new Error(`Unexpected RPC: ${name}`);
      }
    }, buildCloudPayload(rewarded.profile), {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [...dirty],
      cloudEnvelope: { data: cloud, revision: 1, protocolVersion: 3, serverUpdatedAt: 'revision-1', error: null },
      retryBaseDelayMs: 0
    });
    expect(syncResult.ok).toBe(true);
    const remaining = acknowledgeCloudMutations(dirty, versions, submitted);
    pending = remaining.length > 0;
    expect({ writes, reads, pending, dirty: remaining, status: syncResult.ok ? 'saved' : 'error' })
      .toEqual({ writes: 1, reads: 0, pending: false, dirty: [], status: 'saved' });
    const hydrated = normalizeActiveLearningProjection(syncResult.payload, CHILD_ID, { accountId: ACCOUNT_ID });
    expect(JSON.parse(hydrated[PROFILE_KEY])).toMatchObject({ xp: 1155, coins: 87 });
  });

  it('keeps a failed reward queued without a busy loop and reconnects exactly once', async () => {
    const baseline = seedCanonicalState();
    const cloud = baselineCloudPayload();
    const rewarded = completeQuizSession(baseline, 'session-offline');
    const local = buildCloudPayload(rewarded.profile);
    const dirty = new Set();
    const versions = new Map();
    markCloudMutation(dirty, versions, CHILD_ID);
    const submitted = new Map(versions);
    let failedAttempts = 0;
    const failed = await syncRevisionedCloudLearning({
      async rpc() {
        failedAttempts += 1;
        return { data: null, error: { status: 503, message: 'Temporarily unavailable' } };
      }
    }, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [...dirty],
      cloudEnvelope: { data: cloud, revision: 1, protocolVersion: 3, serverUpdatedAt: 'revision-1', error: null },
      retryBaseDelayMs: 0
    });
    expect(failed.ok).toBe(false);
    expect(failedAttempts).toBe(3);
    expect([...dirty]).toEqual([CHILD_ID]);
    expect(versions.get(CHILD_ID)).toBe(1);
    expect(JSON.parse(local[PROFILE_KEY])).toMatchObject({ xp: 1155, coins: 87 });

    let reconnectWrites = 0;
    const reconnected = await syncRevisionedCloudLearning({
      async rpc(name, args) {
        if (name === 'save_learning_data_v4') reconnectWrites += 1;
        return { data: { ok: true, revision: 2, payload: args.payload, serverUpdatedAt: 'revision-2' }, error: null };
      }
    }, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [...dirty],
      cloudEnvelope: { data: cloud, revision: 1, protocolVersion: 3, serverUpdatedAt: 'revision-1', error: null },
      retryBaseDelayMs: 0
    });
    expect(reconnected.ok).toBe(true);
    expect(reconnectWrites).toBe(1);
    expect(acknowledgeCloudMutations(dirty, versions, submitted)).toEqual([]);
    const hydrated = normalizeActiveLearningProjection(reconnected.payload, CHILD_ID, { accountId: ACCOUNT_ID });
    expect(JSON.parse(hydrated[PROFILE_KEY])).toMatchObject({ xp: 1155, coins: 87 });
  });

  it('does not clear a newer mutation when an older cloud write is acknowledged', () => {
    const dirty = new Set();
    const versions = new Map();
    markCloudMutation(dirty, versions, CHILD_ID);
    const submitted = new Map(versions);
    markCloudMutation(dirty, versions, CHILD_ID);
    expect(acknowledgeCloudMutations(dirty, versions, submitted)).toEqual([CHILD_ID]);
    expect(versions.get(CHILD_ID)).toBe(2);
  });
});
