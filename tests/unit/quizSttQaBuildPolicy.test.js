import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  QUIZ_STT_QA_CONFIRMATION,
  exactHttpsOrigin,
  exactPilotEndpoint,
  validateQuizSttQaConfig
} from '../../scripts/preview/quizSttQaPolicy.mjs';

const REVISION = '7a798878b92bee0f1206d843165569ef2ba5bcc9';
const baseConfig = {
  VITE_BUILD_REVISION: REVISION,
  QUIZ_STT_QA_CONFIRM: QUIZ_STT_QA_CONFIRMATION,
  QUIZ_STT_QA_ORIGIN: 'https://qa.example.com',
  VITE_SUPABASE_URL: 'https://sandbox.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example123456',
  VITE_QUIZ_STT_ENDPOINT: 'https://pilot.workers.dev/v1/quiz/transcribe'
};
const source = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

describe('P1.17-V06 dedicated authenticated speech QA artifact', () => {
  it('accepts only explicit immutable, protected-origin artifact-only config', () => {
    expect(validateQuizSttQaConfig(baseConfig)).toMatchObject({
      revision: REVISION,
      qaOrigin: 'https://qa.example.com',
      supabaseOrigin: 'https://sandbox.supabase.co',
      quizEndpoint: 'https://pilot.workers.dev/v1/quiz/transcribe',
      backend: { supabase: true, quizStt: true, sharedSpeechStt: false }
    });
  });

  it.each([
    [{ VITE_BUILD_REVISION: 'main' }, 'immutable'],
    [{ QUIZ_STT_QA_CONFIRM: '' }, 'confirmation'],
    [{ QUIZ_STT_QA_ORIGIN: 'https://hrizz67.github.io' }, 'distinct'],
    [{ QUIZ_STT_QA_ORIGIN: 'http://qa.example.com' }, 'distinct'],
    [{ QUIZ_STT_QA_ORIGIN: 'https://qa.example.com/jannati' }, 'distinct'],
    [{ QUIZ_STT_QA_ORIGIN: 'https://unreviewed.github.io' }, 'distinct'],
    [{ VITE_SUPABASE_URL: 'http://sandbox.supabase.co' }, 'Supabase'],
    [{ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_never' }, 'publishable'],
    [{ VITE_SUPABASE_PUBLISHABLE_KEY: 'service_role_secret' }, 'publishable'],
    [{ VITE_QUIZ_STT_ENDPOINT: 'https://pilot.workers.dev/v1/transcribe' }, 'Worker'],
    [{ VITE_QUIZ_STT_ENDPOINT: 'https://pilot.workers.dev/v1/quiz/transcribe?token=bad' }, 'Worker'],
    [{ VITE_QUIZ_STT_ENDPOINT: 'http://pilot.workers.dev/v1/quiz/transcribe' }, 'Worker']
  ])('rejects unsafe or incomplete QA configuration %#', (overrides, expected) => {
    expect(() => validateQuizSttQaConfig({ ...baseConfig, ...overrides })).toThrow(expected);
  });

  it('does not permit embedded URL credentials, fragments, ports or fallback to shared STT', () => {
    expect(exactHttpsOrigin('https://qa.example.com/')).toBe('https://qa.example.com');
    expect(exactHttpsOrigin('https://alice:secret@qa.example.com/')).toBe('');
    expect(exactHttpsOrigin('https://qa.example.com:8080/')).toBe('');
    expect(exactPilotEndpoint('https://pilot.workers.dev/v1/quiz/transcribe#frag')).toBe('');
    expect(exactPilotEndpoint('https://pilot.workers.dev/v1/transcribe')).toBe('');
  });

  it('keeps the existing QA preview without backend and production deploy without pilot flags', () => {
    const offlinePreview = source('scripts/preview/qaPreviewPolicy.mjs');
    const publicDeploy = source('.github/workflows/deploy.yml');
    const vite = source('vite.config.mjs');
    expect(offlinePreview).toContain("sttEndpoint: ''");
    expect(offlinePreview).toContain("supabaseUrl: ''");
    expect(publicDeploy).not.toContain('VITE_QUIZ_MOBILE_STT_PILOT_ENABLED');
    expect(publicDeploy).not.toContain('VITE_QUIZ_STT_ENDPOINT');
    expect(vite).toContain("quizSttQa ? 'true' : 'false'");
    expect(vite).toContain("quizSttQa ? quizSttQaConfig.quizEndpoint : ''");
    expect(vite).toContain('envDir: quizSttQa ? false');
  });

  it('builds artifact-only with sanitized process env and no hosting or direct cloud upload', () => {
    const runner = source('scripts/preview/buildQuizSttQa.mjs');
    const packager = source('scripts/preview/prepareQuizSttQa.mjs');
    expect(runner).toContain("clean[name] = process.env[name]");
    expect(runner).not.toContain("...process.env");
    expect(runner).toContain("'--mode', 'quiz-stt-qa'");
    expect(runner).not.toMatch(/wrangler.+deploy|pages.+deploy|gh-pages.+publish/i);
    expect(packager).toContain("Content-Security-Policy:");
    expect(packager).toContain("noindex, nofollow, noarchive");
    expect(packager).toContain('qa-quiz-stt-manifest.json');
    expect(packager).not.toContain("deploy(");
    expect(source('package.json')).toContain('"build:quiz-stt-qa"');
  });
});
