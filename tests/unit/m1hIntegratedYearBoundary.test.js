import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  isCurriculumBankReady
} from '../../src/config/curriculumBankCatalog.js';
import { loadYearScopedSubjectData } from '../../src/data/yearScopedSubjectLoader.js';
import {
  planYearScopedTutorScope,
  planYearScopedRewardEventKey
} from '../../src/services/yearScopedLearningMigrationKeys.js';
import { auditMultiYearCloudBoundary } from '../../src/services/multiYearCloudBoundaryAudit.js';
import {
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY
} from '../../src/services/learningSync.js';

const app = readFileSync('src/App.jsx', 'utf8');
const screen = readFileSync('src/components/learning/UnsupportedYearScreen.jsx', 'utf8');
const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const year2 = { year: 'Tahun 2', curriculumId: 'kssr-current' };
const year3 = { year: 'Tahun 3', curriculumId: 'kssr-current' };

describe('M1-H integrated owner-only runtime, policy and bundle gate', () => {
  it('blocks planned-year teaching before onboarding, dashboard, subject loads and quiz', () => {
    expect(app).toContain("const activeStudentYear = String(profile?.year || 'Tahun 2').trim()");
    expect(app).toContain("const activeYearBankReady = activeStudentYear === 'Tahun 2'");
    const boundary = app.indexOf('if (!activeYearBankReady && !showAccountLogin && !adminRouteActive && !premiumSalesRouteActive)');
    expect(boundary).toBeGreaterThan(0);
    expect(boundary).toBeLessThan(app.indexOf('if (showOnboarding && !showAccountLogin)'));
    expect(boundary).toBeLessThan(app.indexOf("if (screen === 'quiz') {\n    const question = currentQuestion()"));
    expect(app).toMatch(/if \(!activeYearBankReady\) \{\s+allSubjectsLoadRef\.current = null;/);
    expect(app).toContain('activeStudentYearRef.current !== activeStudentYear');
    expect(isCurriculumBankReady(year2)).toBe(true);
    expect(isCurriculumBankReady(year3)).toBe(false);
    expect(isCurriculumBankReady({ year: 'Tahun 1', curriculumId: 'kp2027' })).toBe(false);
  });

  it('prohibits future bank fallback to Year2 questions and offers only existing Year2 child profiles', async () => {
    await expect(loadYearScopedSubjectData({ ...year3, subjectId: 'bm' })).rejects.toThrow(/Question bank not ready/);
    await expect(loadYearScopedSubjectData({ year: 'Tahun 1', curriculumId: 'kp2027', subjectId: 'bm' }))
      .rejects.toThrow(/Question bank not ready/);
    expect(app).toContain("React.lazy(() => import('./components/learning/UnsupportedYearScreen.jsx'))");
    expect(app).toContain('onSelectChild={handleSelectChild}');
    expect(screen).toContain("String(child.year || 'Tahun 2').trim() === 'Tahun 2'");
    expect(screen).toContain('Soalan Tahun 2 tidak akan dipaparkan untuk profil ini.');
    expect(screen).not.toMatch(/localStorage\.|\.setItem\(|\.removeItem\(/);
  });

  it('keeps versioned year-aware Tutor/reward keys isolated, without wiring unapproved Year1/3 learning', () => {
    const identity = { accountId: 'synthetic-account', childId: 'synthetic-child' };
    const context = { subjectId: 'bm', topicId: 'kata-nama', sessionId: 'synthetic-session', questionId: 'BM-001' };
    const tutor2 = planYearScopedTutorScope(identity, { ...context, ...year2 });
    const tutor3 = planYearScopedTutorScope(identity, { ...context, ...year3 });
    expect(tutor2).not.toBe(tutor3);
    expect(planYearScopedRewardEventKey({ eventKey: 'quiz:BM-001', ...year2 })).toBe('quiz:BM-001');
    expect(planYearScopedRewardEventKey({ eventKey: 'quiz:BM-001', ...year3, ...identity }))
      .not.toBe('quiz:BM-001');
    expect(app).not.toContain('multiYearCloudBoundaryAudit');
    expect(app).not.toContain('multiYearMigrationRecoveryPlan');
  });

  it('rejects wrong-year cloud data even if a profile selected in UI is Year2', () => {
    const accountId = 'synthetic-account';
    const childId = 'synthetic-child';
    const profile = { id: childId, year: 'Tahun 3', name: 'Synthetic only' };
    const payload = {
      [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
        profiles: [profile], activeChildId: childId, deletedChildren: {}, archivedChildren: {}
      }),
      [`${CHILD_SNAPSHOT_PREFIX}${childId}`]: JSON.stringify({
        __childSnapshotAccountId: accountId, __childSnapshotChildId: childId
      })
    };
    const result = auditMultiYearCloudBoundary({
      localPayload: payload,
      cloudPayload: payload,
      selection: { ...year2, childId, accountId }
    });
    expect(result.findings).toContain('cloud_child_year_mismatch');
    expect(result.canMerge).toBe(false);
    expect(result.canRelease).toBe(false);
    expect(result.proposedWrites).toBe(0);
  });

  it('retains initial-JS optimizations and checks exact tagged-production flags in CI', () => {
    expect(app).toContain("React.lazy(() => import('./components/questions/QuizDiagnosticsPanel.jsx'))");
    expect(app).toContain("React.lazy(() => import('./components/feedback/BetaFeedbackButton.jsx'))");
    expect(app).toContain("React.lazy(() => import('./components/speech/QuizSpeechConsent.jsx'))");
    expect(app).not.toContain('function BetaFeedbackButton({ suppressed = false })');
    expect(app).not.toContain('<details className="qde-debug-panel">');
    expect(workflow).toContain('- name: Verify tagged-production flag parity bundle');
    expect(workflow).toContain("VITE_TUTOR_AI_REMOTE_ENABLED: 'false'");
    expect(workflow).toContain("VITE_QUIZ_MOBILE_STT_AUTO_ENABLED: 'false'");
    expect(workflow).toContain('VITE_QUIZ_MOBILE_STT_PILOT_ENABLED: \'true\'');
    expect(workflow).toContain('VITE_SUPABASE_URL: https://ci-placeholder.supabase.co');
    expect(workflow).not.toContain('secrets.');
  });
});
