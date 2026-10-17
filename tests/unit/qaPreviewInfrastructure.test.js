import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  QA_PREVIEW_BASE_PATH,
  isQaPreviewMode,
  requireQaPreviewRevision,
  resolveBuildEnvironment
} from '../../scripts/preview/qaPreviewPolicy.mjs';

const root = process.cwd();
const readProjectFile = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

describe('P1.16F isolated QA preview policy', () => {
  it('forces browser backend integrations off even when environment values are supplied', () => {
    expect(resolveBuildEnvironment({
      mode: 'qa-preview',
      env: {
        VITE_SUPABASE_URL: 'https://should-not-be-used.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_should-not-be-used',
        VITE_STT_ENDPOINT: 'https://should-not-be-used.example/v1/transcribe'
      }
    })).toEqual({
      qaPreview: true,
      supabaseUrl: '',
      supabasePublishableKey: '',
      sttEndpoint: ''
    });
  });

  it('preserves the existing configured production build policy outside preview mode', () => {
    expect(resolveBuildEnvironment({
      mode: 'production',
      env: {
        VITE_SUPABASE_URL: ' https://project.example ',
        VITE_SUPABASE_PUBLISHABLE_KEY: ' browser-safe-key ',
        VITE_STT_ENDPOINT: ' https://speech.example/v1/transcribe '
      }
    })).toEqual({
      qaPreview: false,
      supabaseUrl: 'https://project.example',
      supabasePublishableKey: 'browser-safe-key',
      sttEndpoint: 'https://speech.example/v1/transcribe'
    });
  });

  it('requires an immutable full Git SHA and retains the established base path', () => {
    const sha = '5243e65b65a2d2ea97ff07fc40368b116c6d07ea';
    expect(isQaPreviewMode('qa-preview')).toBe(true);
    expect(requireQaPreviewRevision(sha.toUpperCase())).toBe(sha);
    expect(() => requireQaPreviewRevision('main')).toThrow(/40-character Git SHA/);
    expect(QA_PREVIEW_BASE_PATH).toBe('/jannati-ai-tutor-v1/');
  });

  it('keeps the preview workflow manual, artifact-only, and free of deployment credentials', () => {
    const workflow = readProjectFile('.github/workflows/qa-preview-build.yml');
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).not.toMatch(/^\s+push:/m);
    expect(workflow).not.toMatch(/^\s+pull_request:/m);
    expect(workflow).toMatch(/permissions:\s*\n\s*contents: read/);
    expect(workflow).toMatch(/actions\/upload-artifact@v7/);
    expect(workflow).toMatch(/git merge-base --is-ancestor "\$VITE_BUILD_REVISION" origin\/main/);
    expect(workflow).not.toMatch(/cloudflare|wrangler|pages-action|deploy/i);
    expect(workflow).not.toMatch(/VITE_SUPABASE_URL:\s*\$\{\{/);
  });

  it('does not add an exact-ID harness or production route', () => {
    const app = readProjectFile('src/App.jsx');
    const packageJson = JSON.parse(readProjectFile('package.json'));
    expect(app).toContain('PRATONTON QA TERASING');
    expect(app).not.toContain('MATH-JISIM-ISI-PADU-PILOT-004');
    expect(packageJson.scripts['build:qa-preview']).toContain('--mode qa-preview');
    expect(packageJson.scripts['validate:qa-preview']).toContain('qaPreviewIsolationAudit.mjs');
  });

  it('locks negative environment coverage and complete artifact reference validation into the preview build', () => {
    const packageJson = JSON.parse(readProjectFile('package.json'));
    const environmentAudit = readProjectFile('scripts/validate/qaPreviewEnvironmentIsolationAudit.mjs');
    const isolationAudit = readProjectFile('scripts/validate/qaPreviewIsolationAudit.mjs');

    expect(packageJson.scripts['build:qa-preview']).toContain('qaPreviewEnvironmentIsolationAudit.mjs');
    expect(environmentAudit).toContain("'.env.local'");
    expect(environmentAudit).toContain('inheritedSentinels');
    expect(environmentAudit).toContain('localFileSentinels');
    expect(environmentAudit).toContain('assertSentinelsAbsent');
    expect(isolationAudit).toContain('auditAssetIntegrity');
    expect(isolationAudit).toContain('service-worker-precache');
    expect(isolationAudit).toContain('productionOriginPattern');
  });
});
