import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_BANK_CATALOG,
  LEGACY_CURRICULUM_ID,
  LEGACY_STUDENT_YEAR,
  isCurriculumBankReady,
  requireCurriculumBank,
  resolveCurriculumBank
} from '../../src/config/curriculumBankCatalog.js';
import { SUPPORTED_STUDENT_YEARS } from '../../src/config/studentYears.js';
import {
  loadYearScopedSubjectData,
  loadYearScopedSubjects
} from '../../src/data/yearScopedSubjectLoader.js';
import { loadSubjectData } from '../../src/data/subjects/index.js';
import { createTutorConversationScope } from '../../src/services/studentIdentity.js';
import {
  createYearScopedProgressKey,
  createYearScopedTutorConversationScope
} from '../../src/services/yearScopedLearningKeys.js';

describe('M1 multi-year foundation: fail-closed, no rollout', () => {
  it('retains only the existing Year 2 bank as ready and UI supported', () => {
    expect(CURRICULUM_BANK_CATALOG.map(item => [item.year, item.status])).toEqual([
      ['Tahun 1', 'planned'],
      ['Tahun 2', 'ready'],
      ['Tahun 3', 'planned']
    ]);
    expect(SUPPORTED_STUDENT_YEARS).toEqual(['Tahun 2']);
    expect(isCurriculumBankReady({ year: 'Tahun 2', curriculumId: LEGACY_CURRICULUM_ID })).toBe(true);
    expect(isCurriculumBankReady({ year: 'Tahun 1', curriculumId: 'kp2027' })).toBe(false);
    expect(isCurriculumBankReady({ year: 'Tahun 3', curriculumId: LEGACY_CURRICULUM_ID })).toBe(false);
  });

  it('rejects unknown, ambiguous and mismatched curricula without Year 2 fallback', () => {
    expect(resolveCurriculumBank({ year: 'Tahun 4' })).toBeNull();
    expect(resolveCurriculumBank({ year: 'Tahun 1', curriculumId: LEGACY_CURRICULUM_ID })).toBeNull();
    expect(() => requireCurriculumBank({ year: 'Tahun 3' }, { requireReady: true }))
      .toThrow(/Question bank not ready/);
    expect(() => requireCurriculumBank({ year: 'Tahun 4' })).toThrow(/Unsupported or ambiguous/);
  });

  it('loads exactly the existing 8 Year 2 subjects and 4,530 questions', async () => {
    const subjects = await loadYearScopedSubjects({
      year: LEGACY_STUDENT_YEAR, curriculumId: LEGACY_CURRICULUM_ID
    });
    expect(subjects).toHaveLength(8);
    expect(subjects.reduce((sum, item) => sum + item.topics.reduce(
      (total, topic) => total + topic.questions.length, 0
    ), 0)).toBe(4530);
    const current = await loadSubjectData('bm');
    const guarded = await loadYearScopedSubjectData({
      year: 'Tahun 2', curriculumId: LEGACY_CURRICULUM_ID, subjectId: 'bm'
    });
    expect(guarded.topics[0].questions[0].id).toBe(current.topics[0].questions[0].id);
    expect(guarded.topics[0].questions[0].answer).toBe(current.topics[0].questions[0].answer);
  });

  it('denies planned-year content and unknown subject instead of serving BM', async () => {
    await expect(loadYearScopedSubjectData({ subjectId: 'bm' }))
      .rejects.toThrow(/Missing explicit student year/);
    await expect(loadYearScopedSubjects())
      .rejects.toThrow(/Missing explicit student year/);
    await expect(loadYearScopedSubjectData({
      year: 'Tahun 1', curriculumId: 'kp2027', subjectId: 'bm'
    })).rejects.toThrow(/Question bank not ready/);
    await expect(loadYearScopedSubjectData({
      year: 'Tahun 3', curriculumId: LEGACY_CURRICULUM_ID, subjectId: 'math'
    })).rejects.toThrow(/Question bank not ready/);
    await expect(loadYearScopedSubjectData({
      year: 'Tahun 2', curriculumId: LEGACY_CURRICULUM_ID, subjectId: 'unlisted'
    })).rejects.toThrow(/Unknown subject ID/);
    await expect(loadYearScopedSubjects({
      year: 'Tahun 3', curriculumId: LEGACY_CURRICULUM_ID
    })).rejects.toThrow(/Question bank not ready/);
  });

  it('preserves Year 2 legacy progress key and namespaces future-year keys', () => {
    const common = { subjectId: 'bm', topicId: 'kata_nama' };
    const legacy = createYearScopedProgressKey({ ...common, year: 'Tahun 2' });
    const yearOne = createYearScopedProgressKey({ ...common, year: 'Tahun 1', curriculumId: 'kp2027' });
    const yearThree = createYearScopedProgressKey({ ...common, year: 'Tahun 3', curriculumId: LEGACY_CURRICULUM_ID });
    expect(legacy).toBe('bm_kata_nama');
    expect(() => createYearScopedProgressKey({ ...common }))
      .toThrow(/Missing year/);
    expect(new Set([legacy, yearOne, yearThree]).size).toBe(3);
    expect(() => createYearScopedProgressKey({ year: 'Tahun 1', subjectId: 'bm', topicId: '' }))
      .toThrow(/Missing topicId/);
  });

  it('preserves Year 2 Tutor scope and isolates planned grade/curriculum scopes', () => {
    const identity = { accountId: 'acct', childId: 'child-A' };
    const context = {
      subjectId: 'bm', topicId: 'kata_nama', sessionId: 'sess', questionId: 'BM-001'
    };
    const existing = createTutorConversationScope(identity, context);
    const legacy = createYearScopedTutorConversationScope(identity, {
      ...context, year: 'Tahun 2'
    });
    const one = createYearScopedTutorConversationScope(identity, {
      ...context, year: 'Tahun 1', curriculumId: 'kp2027'
    });
    const three = createYearScopedTutorConversationScope(identity, {
      ...context, year: 'Tahun 3', curriculumId: LEGACY_CURRICULUM_ID
    });
    expect(legacy).toBe(existing);
    expect(() => createYearScopedTutorConversationScope(identity, context))
      .toThrow(/Missing year/);
    expect(new Set([legacy, one, three]).size).toBe(3);
    expect(createYearScopedTutorConversationScope({ accountId: 'acct', childId: 'child-B' }, {
      ...context, year: 'Tahun 3'
    })).not.toBe(three);
  });
});
