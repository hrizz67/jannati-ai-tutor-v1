import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdvancedRecoveryTools, SettingsPanel } from '../../src/dashboard/dashboardHelpers.jsx';

const recoveryProps = {
  onExportBetaReport: () => {},
  onImportLearningData: () => {},
  onRecoverLearningData: () => {},
  onSyncLearningData: () => {},
  onLoadLearningData: () => {},
  cloudSyncStatus: 'saved',
  onReset: () => {}
};

const homeDashboardSource = fs.readFileSync(new URL('../../src/dashboard/HomeDashboard.jsx', import.meta.url), 'utf8');
const analyticsDashboardSource = fs.readFileSync(new URL('../../src/dashboard/AnalyticsDashboard.jsx', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');

describe('P1.13.1 advanced recovery tools visibility', () => {
  it('renders no beta panel, controls, or empty card for a normal learner', () => {
    const markup = renderToStaticMarkup(React.createElement(AdvancedRecoveryTools, recoveryProps));

    expect(markup).toBe('');
    expect(markup).not.toContain('Kesediaan Beta Tertutup');
    expect(markup).not.toContain('Reset Semua Data');
    expect(markup).not.toContain('Import Data Pembelajaran JSON');
    expect(markup).not.toContain('Backup Data Pembelajaran JSON');
    expect(markup).not.toContain('settings-card');
  });

  it('keeps the recovery component and every support action available behind the internal gate', () => {
    const markup = renderToStaticMarkup(React.createElement(AdvancedRecoveryTools, {
      ...recoveryProps,
      enabled: true
    }));

    expect(SettingsPanel).toBeTypeOf('function');
    expect(markup).toContain('Kesediaan Beta Tertutup');
    expect(markup).toContain('Backup Data Pembelajaran JSON');
    expect(markup).toContain('Import Data Pembelajaran JSON');
    expect(markup).toContain('Pulihkan Backup Lama');
    expect(markup).toContain('Sync Sekarang');
    expect(markup).toContain('Muat dari Cloud');
    expect(markup).toContain('Reset Semua Data');
    expect(markup).toContain('Status sync:');
  });

  it('uses only the existing development gate rather than a public query switch', () => {
    expect(homeDashboardSource).toContain('showAdvancedRecoveryTools: import.meta.env.DEV');
    expect(analyticsDashboardSource).toContain('enabled={showAdvancedRecoveryTools}');
    expect(homeDashboardSource).not.toMatch(/URLSearchParams[\s\S]{0,200}showAdvancedRecoveryTools/);
  });

  it('preserves recovery handlers and the existing reset safeguards', () => {
    expect(appSource).toContain('function exportBetaReport(');
    expect(appSource).toContain('async function importLearningData(');
    expect(appSource).toContain('async function recoverStoredLearningData(');
    expect(appSource).toContain('async function syncLearningDataNow(');
    expect(appSource).toContain('async function loadLearningDataNow(');
    expect(appSource).toContain('function resetProfile(');
    expect(appSource).toContain('Reset akaun dinyahaktifkan untuk melindungi data cloud.');
    expect(appSource).toContain("confirm('Reset semua data beta pada peranti ini? Tindakan ini tidak boleh dibatalkan.')");
  });
});
