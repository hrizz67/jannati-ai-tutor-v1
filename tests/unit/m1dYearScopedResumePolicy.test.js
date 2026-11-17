import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getResumeScopeKey, normalizeResumeData } from '../../src/utils/resumeStorage.js';
import {
  getYearScopedResumeScopeKey,
  isYearScopedResumeReadable
} from '../../src/services/yearScopedResumePolicy.js';

function makeResume(extra = {}) {
  return {
    mode: 'quiz',
    studentId: 'child-a',
    childId: 'child-a',
    accountId: 'account-1',
    subjectId: 'bm',
    topicId: 'kata-nama',
    questions: [{ id: 'BM-001' }],
    currentIndex: 0,
    ...extra
  };
}

describe('M1-D year/curriculum resume isolation policy', () => {
  it('retains exact existing Year 2 legacy slot keys, even for older unlabelled records', () => {
    const resume = makeResume();
    expect(getYearScopedResumeScopeKey(resume, { year: 'Tahun 2' }))
      .toBe(getResumeScopeKey(resume));
    expect(isYearScopedResumeReadable(resume, { year: 'Tahun 2', childId: 'child-a', accountId: 'account-1' }))
      .toBe(true);
    expect(normalizeResumeData(resume)?.mode).toBe('quiz');
  });

  it('never permits implicit year selection or unsupported curriculum combinations', () => {
    const resume = makeResume();
    expect(() => getYearScopedResumeScopeKey(resume)).toThrow(/Missing explicit year/);
    expect(() => getYearScopedResumeScopeKey(resume, { year: 'Tahun 4' })).toThrow(/Unsupported or ambiguous/);
    expect(() => getYearScopedResumeScopeKey(resume, { year: 'Tahun 2', curriculumId: 'kp2027' }))
      .toThrow(/Unsupported or ambiguous/);
    expect(isYearScopedResumeReadable(resume, {})).toBe(false);
    expect(isYearScopedResumeReadable(resume, { year: 'Tahun 4' })).toBe(false);
  });

  it('derives distinct Year 1 and Year 3 future planning keys for the same child and topic', () => {
    const year1 = makeResume({ year: 'Tahun 1', curriculumId: 'kp2027' });
    const year3 = makeResume({ year: 'Tahun 3', curriculumId: 'kssr-current' });
    const key1 = getYearScopedResumeScopeKey(year1, { year: 'Tahun 1', childId: 'child-a', accountId: 'account-1' });
    const key3 = getYearScopedResumeScopeKey(year3, { year: 'Tahun 3', childId: 'child-a', accountId: 'account-1' });
    const oldKey = getResumeScopeKey(year1);
    expect(key1).not.toBe(key3);
    expect(key1).not.toBe(oldKey);
    expect(key3).not.toBe(oldKey);
    expect(key1).toMatch(/^m1::resume::kp2027::Tahun%201::/);
    expect(key3).toMatch(/^m1::resume::kssr-current::Tahun%203::/);
    expect(key1).toContain(encodeURIComponent(oldKey));
    expect(getResumeScopeKey(year1)).toBe(getResumeScopeKey(year3));
  });

  it('keeps all future planned banks inaccessible despite the ability to plan their keys', () => {
    const year1 = makeResume({ year: 'Tahun 1', curriculumId: 'kp2027' });
    const year3 = makeResume({ year: 'Tahun 3', curriculumId: 'kssr-current' });
    expect(isYearScopedResumeReadable(year1, { year: 'Tahun 1', curriculumId: 'kp2027' })).toBe(false);
    expect(isYearScopedResumeReadable(year3, { year: 'Tahun 3', curriculumId: 'kssr-current' })).toBe(false);
    expect(isYearScopedResumeReadable(year1, { year: 'Tahun 2' })).toBe(false);
    expect(isYearScopedResumeReadable(year3, { year: 'Tahun 2' })).toBe(false);
  });

  it('denies an explicitly mismatched year, curriculum or contradictory nested hints', () => {
    const wrongYear = makeResume({ year: 'Tahun 1', curriculumId: 'kp2027' });
    expect(() => getYearScopedResumeScopeKey(wrongYear, { year: 'Tahun 2' }))
      .toThrow(/does not match/);
    expect(isYearScopedResumeReadable(wrongYear, { year: 'Tahun 2' })).toBe(false);

    const contradictory = makeResume({
      year: 'Tahun 2', curriculumId: 'kssr-current',
      state: { year: 'Tahun 3' }
    });
    expect(isYearScopedResumeReadable(contradictory, { year: 'Tahun 2' })).toBe(false);
    expect(() => getYearScopedResumeScopeKey(contradictory, { year: 'Tahun 2' })).toThrow(/does not match/);

    const wrongEdition = makeResume({ year: 'Tahun 2', curriculumId: 'kp2027' });
    expect(isYearScopedResumeReadable(wrongEdition, { year: 'Tahun 2' })).toBe(false);
  });

  it('keeps older Year 2 records readable while refusing mismatched explicit child/account identity', () => {
    const resume = makeResume();
    expect(isYearScopedResumeReadable(resume, { year: 'Tahun 2', childId: 'child-b' })).toBe(false);
    expect(isYearScopedResumeReadable(resume, { year: 'Tahun 2', accountId: 'account-2' })).toBe(false);
    expect(isYearScopedResumeReadable(resume, { year: 'Tahun 2', childId: 'child-a', accountId: 'account-1' })).toBe(true);
  });

  it('requires future records to declare their year, curriculum, account and explicit child identity', () => {
    expect(() => getYearScopedResumeScopeKey(makeResume(), { year: 'Tahun 3' }))
      .toThrow(/does not match/);
    expect(() => getYearScopedResumeScopeKey(makeResume({
      year: 'Tahun 3', curriculumId: 'kssr-current', childId: '', studentId: 'default'
    }), { year: 'Tahun 3', childId: 'child-a', accountId: 'account-1' })).toThrow(/requires matching explicit child and account/);
    expect(() => getYearScopedResumeScopeKey(makeResume({
      year: 'Tahun 1', curriculumId: 'kp2027', accountId: ''
    }), { year: 'Tahun 1', childId: 'child-a', accountId: 'account-1' })).toThrow(/requires matching explicit child and account/);
  });

  it('does not reuse future keys across accounts or accept an implicit account/child selection', () => {
    const record = makeResume({ year: 'Tahun 3', curriculumId: 'kssr-current' });
    const selection = { year: 'Tahun 3', childId: 'child-a', accountId: 'account-1' };
    const original = getYearScopedResumeScopeKey(record, selection);
    expect(original).toContain('::account-1::child-a::');
    expect(() => getYearScopedResumeScopeKey(record, { year: 'Tahun 3' }))
      .toThrow(/requires matching explicit child and account/);
    expect(() => getYearScopedResumeScopeKey(record, { year: 'Tahun 3', childId: 'child-a', accountId: 'account-2' }))
      .toThrow(/requires matching explicit child and account/);
    const otherAccountRecord = makeResume({ year: 'Tahun 3', curriculumId: 'kssr-current', accountId: 'account-2' });
    expect(getYearScopedResumeScopeKey(otherAccountRecord, { ...selection, accountId: 'account-2' })).not.toBe(original);
  });

  it('rejects contradictory nested child/account identity rather than selecting one hint', () => {
    const contradictory = makeResume({ state: { childId: 'child-other', accountId: 'account-2' } });
    expect(isYearScopedResumeReadable(contradictory, {
      year: 'Tahun 2', childId: 'child-a', accountId: 'account-1'
    })).toBe(false);
  });

  it('does not activate a new storage path, migrate browser data or modify original records', () => {
    const record = makeResume();
    const before = JSON.stringify(record);
    getYearScopedResumeScopeKey(record, { year: 'Tahun 2' });
    isYearScopedResumeReadable(record, { year: 'Tahun 2' });
    expect(JSON.stringify(record)).toBe(before);

    const app = readFileSync('src/App.jsx', 'utf8');
    const activeStorage = readFileSync('src/utils/resumeStorage.js', 'utf8');
    expect(app).not.toContain('yearScopedResumePolicy');
    expect(activeStorage).not.toContain('yearScopedResumePolicy');
  });
});
