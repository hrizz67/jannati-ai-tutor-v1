import { afterEach, describe, expect, it, vi } from 'vitest';
import { subjectList } from '../../src/data/subjects/index.js';
import { createCanonicalProgress } from '../../src/utils/canonicalProgress.js';
import { DEFAULT_PROFILE, SUBJECT_KEYS, createDefaultProfile } from '../../src/ai/adaptive/studentProfile.js';
import { loadProfile, saveProfile } from '../../src/ai/adaptive/storageEngine.js';

const key = 'jannati.adaptive.studentProfile';

function useSyntheticStorage(serialized = null) {
  const values = new Map(serialized === null ? [] : [[key, JSON.stringify(serialized)]]);
  const fake = {
    getItem: name => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, String(value)),
    removeItem: name => values.delete(name)
  };
  vi.stubGlobal('localStorage', fake);
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe('P2-A adaptive Pendidikan Kesihatan default subject parity', () => {
  it('initializes all eight official subjects in both subjects and topics without invented attempts', () => {
    const ids = subjectList.map(subject => subject.id);
    expect(ids).toHaveLength(8);
    expect(new Set(SUBJECT_KEYS)).toEqual(new Set(ids));
    const fresh = createDefaultProfile();
    expect(Object.keys(fresh.subjects)).toEqual(SUBJECT_KEYS);
    expect(Object.keys(fresh.topics)).toEqual(SUBJECT_KEYS);
    expect(fresh.subjects.pk).toEqual({ accuracy: 0, correct: 0, total: 0 });
    expect(fresh.topics.pk).toEqual({});
    expect(DEFAULT_PROFILE.subjects.pk.total).toBe(0);
    expect(createCanonicalProgress(fresh).subjects.pk.attempts).toBe(0);
  });

  it('loads a synthetic legacy profile without PK and backfills empty PK buckets only', () => {
    useSyntheticStorage({
      version: 1,
      xp: 20,
      totalQuestions: 5,
      correctQuestions: 4,
      subjects: { bm: { accuracy: 80, total: 5, correct: 4 } },
      topics: { bm: { kata_nama: { total: 5, correct: 4, wrong: 1 } } }
    });
    const loaded = loadProfile();
    expect(loaded.subjects.pk).toEqual({ accuracy: 0, correct: 0, total: 0 });
    expect(loaded.topics.pk).toEqual({});
    expect(loaded.subjects.bm).toMatchObject({ accuracy: 80, total: 5, correct: 4 });
    expect(loaded.topics.bm.kata_nama.total).toBe(5);
    expect(loaded.totalQuestions).toBe(5);
    expect(loaded.correctQuestions).toBe(4);
  });

  it('retains existing PK learning evidence when loading an older versioned profile', () => {
    useSyntheticStorage({
      version: 1,
      totalQuestions: 3,
      correctQuestions: 2,
      subjects: { pk: { accuracy: 67, total: 3, correct: 2 } },
      topics: { pk: { kebersihan: { total: 3, correct: 2, wrong: 1 } } }
    });
    const loaded = loadProfile();
    expect(loaded.subjects.pk).toMatchObject({ accuracy: 67, total: 3, correct: 2 });
    expect(loaded.topics.pk.kebersihan).toEqual({ total: 3, correct: 2, wrong: 1 });
    expect(createCanonicalProgress(loaded).subjects.pk.attempts).toBe(3);
  });

  it('persists a synthetic default PK bucket without changing existing BM statistics', () => {
    const values = useSyntheticStorage();
    const saved = saveProfile({
      ...createDefaultProfile(),
      totalQuestions: 2,
      correctQuestions: 1,
      subjects: {
        ...createDefaultProfile().subjects,
        bm: { accuracy: 50, total: 2, correct: 1 }
      },
      topics: {
        ...createDefaultProfile().topics,
        bm: { kata_nama: { total: 2, correct: 1, wrong: 1 } }
      }
    });
    expect(saved.subjects.pk).toMatchObject({ total: 0, correct: 0 });
    expect(JSON.parse(values.get(key)).subjects.pk.total).toBe(0);
    expect(loadProfile().subjects.bm.total).toBe(2);
    expect(loadProfile().totalQuestions).toBe(2);
  });
});
