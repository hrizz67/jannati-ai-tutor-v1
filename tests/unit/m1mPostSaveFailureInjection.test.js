import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  applyCloudPostSaveEffects,
  markCloudMutation
} from '../../src/services/cloudMutationOutbox.js';

const CHILD_ID = 'synthetic-child-a';

function createPendingMutation() {
  const dirty = new Set();
  const versions = new Map();
  markCloudMutation(dirty, versions, CHILD_ID);
  return { dirty, versions, submitted: new Map(versions) };
}

describe('M1-M post-save failure injection', () => {
  it('MM-01 retains every outbox when post-save local metadata throws', () => {
    const mutation = createPendingMutation();
    const acknowledgeResume = vi.fn();
    const acknowledgeMutations = vi.fn();

    const result = applyCloudPostSaveEffects({
      applyMetadata() { throw new Error('quota exceeded'); },
      acknowledgeResume,
      acknowledgeMutations
    });

    expect(result).toMatchObject({ ok: false, phase: 'local_metadata' });
    expect(acknowledgeResume).not.toHaveBeenCalled();
    expect(acknowledgeMutations).not.toHaveBeenCalled();
    expect([...mutation.dirty]).toEqual([CHILD_ID]);
  });

  it('MM-02 treats a swallowed metadata persistence failure as a failed local commit', () => {
    const acknowledgeResume = vi.fn();
    const acknowledgeMutations = vi.fn();

    const result = applyCloudPostSaveEffects({
      applyMetadata: () => ({ persisted: false, activeChildId: CHILD_ID }),
      acknowledgeResume,
      acknowledgeMutations
    });

    expect(result).toMatchObject({ ok: false, phase: 'local_metadata' });
    expect(acknowledgeResume).not.toHaveBeenCalled();
    expect(acknowledgeMutations).not.toHaveBeenCalled();
  });

  it('MM-03 retains the mutation outbox when resume acknowledgement throws', () => {
    const mutation = createPendingMutation();
    const acknowledgeMutations = vi.fn(() => []);

    const result = applyCloudPostSaveEffects({
      applyMetadata: () => ({ persisted: true, activeChildId: CHILD_ID }),
      acknowledgeResume() { throw new Error('resume storage unavailable'); },
      acknowledgeMutations
    });

    expect(result).toMatchObject({ ok: false, phase: 'outbox_acknowledgement' });
    expect(acknowledgeMutations).not.toHaveBeenCalled();
    expect([...mutation.dirty]).toEqual([CHILD_ID]);
  });

  it('MM-04 reports a mutation acknowledgement failure instead of claiming success', () => {
    const result = applyCloudPostSaveEffects({
      applyMetadata: () => ({ persisted: true, activeChildId: CHILD_ID }),
      acknowledgeResume: () => true,
      acknowledgeMutations() { throw new Error('mutation acknowledgement failed'); }
    });

    expect(result).toMatchObject({ ok: false, phase: 'outbox_acknowledgement' });
  });

  it('MM-05 returns the exact remaining outboxes after a successful local commit', () => {
    const mutation = createPendingMutation();
    markCloudMutation(mutation.dirty, mutation.versions, CHILD_ID);

    const result = applyCloudPostSaveEffects({
      applyMetadata: () => ({ persisted: true, activeChildId: CHILD_ID }),
      acknowledgeResume: () => true,
      acknowledgeMutations: () => [CHILD_ID]
    });

    expect(result).toEqual({
      ok: true,
      phase: 'complete',
      activeChildId: CHILD_ID,
      pendingResumeDelete: true,
      remainingDirtyChildIds: [CHILD_ID]
    });
  });

  it('MM-06 wires metadata completion before either outbox acknowledgement', () => {
    const app = readFileSync('src/App.jsx', 'utf8');
    const write = app.slice(
      app.indexOf('const syncResult = await syncRevisionedCloudLearning'),
      app.indexOf('function scheduleCloudLearningSave')
    );
    const effects = write.indexOf('applyCloudPostSaveEffects({');
    const metadata = write.indexOf('applyMetadata:', effects);
    const resumeAck = write.indexOf('acknowledgeResume:', effects);
    const mutationAck = write.indexOf('acknowledgeMutations:', effects);
    const failure = write.indexOf("phase: postSaveResult.phase", effects);

    expect(effects).toBeGreaterThan(-1);
    expect(metadata).toBeGreaterThan(effects);
    expect(resumeAck).toBeGreaterThan(metadata);
    expect(mutationAck).toBeGreaterThan(resumeAck);
    expect(failure).toBeGreaterThan(mutationAck);
  });
});
