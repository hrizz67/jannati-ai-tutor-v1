import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadYearScopedSubjectData, loadYearScopedSubjects } from '../../src/data/yearScopedSubjectLoader.js';

const source = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');

describe('M1-B active-year UI subject boundary', () => {
  it('keeps legacy Year 2 dashboard selection while gating explicit different grades', () => {
    expect(source).toContain("const activeStudentYear = String(profile?.year || 'Tahun 2').trim()");
    expect(source).toContain("const activeYearBankReady = activeStudentYear === 'Tahun 2'");
    expect(source).toContain("if (!activeYearBankReady && !showAccountLogin && !adminRouteActive && !premiumSalesRouteActive) return <BetaChrome");
    expect(source).toContain('Bank soalan bagi tahun profil ini belum diluluskan.');
    expect(source.indexOf('if (!activeYearBankReady && !showAccountLogin')).toBeLessThan(source.indexOf('if (showOnboarding && !showAccountLogin)'));
    expect(source.indexOf('if (!activeYearBankReady && !showAccountLogin')).toBeLessThan(source.indexOf('if (loadingSubject) return <BetaChrome'));
    expect(source.indexOf('if (!activeYearBankReady) return <BetaChrome')).toBeLessThan(source.indexOf("if (screen === 'quiz') {\n    const question = currentQuestion()"));
  });

  it('routes selected and background-loaded subjects through explicit guarded year', () => {
    expect(source).toMatch(/if \(!activeYearBankReady\) \{\s+allSubjectsLoadRef\.current = null;\s+setSelectedSubject\(null\);\s+setAllSubjects\(\[\]\);/);
    expect(source).toMatch(/loadYearScopedSubjectData\(\{\s+year: activeStudentYear,\s+subjectId: selectedSubjectId\s+\}\)/);
    expect(source).toMatch(/if \(!activeYearBankReady\) return Promise\.resolve\(\[\]\);/);
    expect(source).toMatch(/loadYearScopedSubjects\(\{\s+year: activeStudentYear\s+\}\)/);
    expect(source).toContain('activeStudentYearRef.current !== activeStudentYear');
  });

  it('preserves safe failure for planned years and unknown subjects', async () => {
    await expect(loadYearScopedSubjectData({ year: 'Tahun 1', curriculumId: 'kp2027', subjectId: 'bm' }))
      .rejects.toThrow(/Question bank not ready/);
    await expect(loadYearScopedSubjectData({ year: 'Tahun 3', subjectId: 'bm' }))
      .rejects.toThrow(/Question bank not ready/);
    await expect(loadYearScopedSubjects({ year: 'Tahun 3' }))
      .rejects.toThrow(/Question bank not ready/);
    await expect(loadYearScopedSubjectData({ year: 'Tahun 2', subjectId: 'invalid' }))
      .rejects.toThrow(/Unknown subject ID/);
  });

  it('keeps canonical Year 2 questions unchanged through the new path', async () => {
    const bm = await loadYearScopedSubjectData({ year: 'Tahun 2', subjectId: 'bm' });
    const subjects = await loadYearScopedSubjects({ year: 'Tahun 2' });
    expect(bm.title).toBe('Bahasa Melayu Tahun 2');
    expect(subjects).toHaveLength(8);
    expect(subjects.reduce((count, subject) => count + subject.topics.reduce(
      (total, topic) => total + topic.questions.length, 0
    ), 0)).toBe(4530);
  });
});
