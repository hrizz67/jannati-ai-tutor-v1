import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadYearScopedSubjectData, loadYearScopedSubjects } from '../../src/data/yearScopedSubjectLoader.js';

const source = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');

describe('M1-B active-year UI subject boundary', () => {
  it('keeps legacy Year 2 dashboard selection while gating explicit different grades', () => {
    expect(source).toContain("const activeStudentYear = String(profile?.year || 'Tahun 2').trim()");
    expect(source).toContain("const activeYearBankReady = activeStudentYear === 'Tahun 2'");
    expect(source).toContain("if (!activeYearBankReady && !showAccountLogin && !adminRouteActive && !premiumSalesRouteActive) return <BetaChrome");
    expect(source).toContain("React.lazy(() => import('./components/learning/UnsupportedYearScreen.jsx'))");
    const unavailableScreenSource = readFileSync('src/components/learning/UnsupportedYearScreen.jsx', 'utf8');
    expect(unavailableScreenSource).toContain('Soalan Tahun 2 tidak akan dipaparkan untuk profil ini.');
    expect(source.indexOf('if (!activeYearBankReady && !showAccountLogin')).toBeLessThan(source.indexOf('if (showOnboarding && !showAccountLogin)'));
    expect(source.indexOf('if (!activeYearBankReady && !showAccountLogin')).toBeLessThan(source.indexOf('if (loadingSubject) return <BetaChrome'));
    expect(source.indexOf('if (!activeYearBankReady && !showAccountLogin')).toBeLessThan(source.indexOf("if (screen === 'quiz') {\n    const question = currentQuestion()"));
  });

  it('guards the existing Year 2 loader and cancels stale background results', () => {
    expect(source).toContain('if (!activeYearBankReady || !subjectLoadGateRef.current.isCurrent(lease))');
    expect(source).toContain('loadYear2SubjectForLease(selectedSubjectId, lease).then(subject =>');
    expect(source).toContain('if (!subjectLoadGateRef.current.isCurrent(lease)) return Promise.resolve([]);');
    expect(source).toContain('const request = loadAllSubjects()');
    expect(source).toContain('subjectLoadGateRef.current.setOwner({');
    expect(source).toContain('if (!subjectLoadGateRef.current.isCurrent(lease)) return [];');
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
