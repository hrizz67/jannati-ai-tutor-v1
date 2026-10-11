import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import manualSalesConfig from '../../src/config/manualSalesConfig.js';
import { isInternalUiSurfaceEnabled } from '../../src/services/internalUiSurfaceVisibility.js';

const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const homeDashboardSource = fs.readFileSync(new URL('../../src/dashboard/HomeDashboard.jsx', import.meta.url), 'utf8');
const analyticsDashboardSource = fs.readFileSync(new URL('../../src/dashboard/AnalyticsDashboard.jsx', import.meta.url), 'utf8');
const brandStyles = fs.readFileSync(new URL('../../src/styles/brand.css', import.meta.url), 'utf8');

function sourceSection(start, end) {
  const startIndex = appSource.indexOf(start);
  const endIndex = appSource.indexOf(end, startIndex);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return appSource.slice(startIndex, endIndex);
}

const firstRunSource = sourceSection('function FirstRunWizard(', 'function BetaFeedbackButton(');
const loginSource = sourceSection('function Login(', 'function LoadingSkeleton(');
const footerSource = sourceSection('function AppVersiFooter(', 'function StorageRecoveryNotice(');
const betaChromeSource = sourceSection('function BetaChrome(', 'function TutorAIModalLoading(');
const quizSource = sourceSection('function Quiz(', 'function UasaSimulator(');

describe('P1.15A public copy and internal surface containment', () => {
  it('uses production first-run copy without beta, demo, testing, or reset language', () => {
    expect(firstRunSource).toContain('<p className="eyebrow">Permulaan</p>');
    expect(firstRunSource).toContain('Mulakan pembelajaran dengan menyediakan profil murid.');
    expect(firstRunSource).toContain('kemajuan akan disimpan pada peranti ini.');
    expect(firstRunSource).not.toMatch(/Permulaan Beta|Profil demo|\bdemo\b|\bbeta\b|diuji|reset data/i);
  });

  it('does not prefill the learner field with the placeholder Demo Murid identity', () => {
    expect(firstRunSource).toContain("isPlaceholderStudentName(profile?.name) ? ''");
    expect(firstRunSource).toContain('placeholder="Contoh: Fayyadh"');
    expect(firstRunSource).not.toContain("useState(profile.name || 'Demo Murid')");
  });

  it('labels the first-run account action for Free or Premium accounts', () => {
    expect(firstRunSource).toContain('>Log masuk akaun</button>');
    expect(firstRunSource).toContain('>Mula Belajar Free</button>');
    expect(firstRunSource).not.toContain('Log masuk Premium');
  });

  it('uses neutral account copy while preserving guest, signup, and login paths', () => {
    expect(loginSource).toContain('Akaun Jannati');
    expect(loginSource).not.toContain('Beta Tertutup');
    expect(loginSource).toContain('onClick={onResumeGuest}');
    expect(loginSource).toContain('onClick={() => onStart(name.trim(), avatar)}');
    expect(loginSource).toContain('supabase.auth.signInWithPassword');
    expect(loginSource).toContain('supabase.auth.signUp');
  });

  it('keeps branding, version, and copyright but removes the public CLOSED BETA badge', () => {
    expect(footerSource).toContain('APP_VERSION');
    expect(footerSource).toContain('Hak Cipta');
    expect(footerSource).not.toContain('CLOSED BETA');
  });

  it('disables every internal surface in normal production mode', () => {
    expect(isInternalUiSurfaceEnabled({ dev: false, search: '' })).toBe(false);
    expect(isInternalUiSurfaceEnabled({ dev: false, search: '?subject=bm' })).toBe(false);
  });

  it('retains internal surfaces only for DEV or the existing explicit debug query', () => {
    expect(isInternalUiSurfaceEnabled({ dev: true, search: '' })).toBe(true);
    expect(isInternalUiSurfaceEnabled({ dev: false, search: '?debug=1' })).toBe(true);
    expect(betaChromeSource).toContain('isInternalUiSurfaceEnabled() && <BetaFeedbackButton');
  });

  it('gates the complete QDE learner panel behind the internal visibility policy', () => {
    expect(quizSource).toContain('isInternalUiSurfaceEnabled() && <details className="qde-debug-panel"');
    expect(quizSource).toContain('<summary>Panel Bantuan</summary>');
  });

  it('gates the classroom pilot card and export while preserving the pilot engine', () => {
    expect(homeDashboardSource).toContain('showClassroomPilot: isInternalUiSurfaceEnabled()');
    expect(analyticsDashboardSource).toContain('showClassroomPilot = false');
    expect(analyticsDashboardSource).toContain('{showClassroomPilot ? <section className="card classroom-pilot-card">');
    expect(analyticsDashboardSource).toContain('buildClassroomPilotReport');
    expect(analyticsDashboardSource).toContain('Eksport Laporan Pilot Tanpa Nama');
  });

  it('does not present local-only feedback as production customer support', () => {
    expect(betaChromeSource).not.toMatch(/\n\s*<BetaFeedbackButton suppressed=\{feedbackSuppressed\}/);
    expect(appSource).toContain("localStorage.setItem(FEEDBACK_KEY");
  });

  it('preserves configured manual Premium sales behavior', () => {
    expect(manualSalesConfig.plans.map(plan => [plan.id, plan.priceMYR])).toEqual([
      ['premium-30', 10],
      ['premium-90', 25],
      ['premium-365', 100]
    ]);
    expect(manualSalesConfig.whatsappNumber).toBe('60134425202');
    expect(appSource).toContain("window.location.hash = '/premium'");
    expect(appSource).toContain('setPremiumSalesRouteActive(true)');
  });

  it('keeps the first-run actions single-column and reachable at 390px', () => {
    const mobileRules = brandStyles.slice(brandStyles.indexOf('@media (max-width: 650px)', brandStyles.indexOf('.first-run-shell')));
    expect(mobileRules).toContain('.first-run-shell');
    expect(mobileRules).toMatch(/\.wizard-actions,[\s\S]*\.wizard-final-actions,[\s\S]*grid-template-columns:\s*1fr/);
  });
});
