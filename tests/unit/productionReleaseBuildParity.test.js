import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const readWorkflow = filename =>
  readFileSync(path.join(root, '.github', 'workflows', filename), 'utf8');

function getStep(source, name) {
  const marker = `      - name: ${name}\n`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing GitHub Actions step: ${name}`);
  const remainder = source.slice(start + marker.length);
  const next = remainder.indexOf('\n      - name: ');
  return next < 0 ? remainder : remainder.slice(0, next);
}

function getStepEnv(step, key) {
  const line = step.split('\n').find(value => value.trimStart().startsWith(`${key}:`));
  if (!line) throw new Error(`Missing build flag: ${key}`);
  return line.trim().slice(key.length + 1).trim().replace(/^['"]|['"]$/g, '');
}

describe('v3.13.43 production release preparation parity', () => {
  const prepare = getStep(readWorkflow('release-preparation.yml'), 'Run canonical production release preparation');
  const deploy = getStep(readWorkflow('deploy.yml'), 'Build production application');

  const buildOnlyFlags = [
    ['RELEASE_BUILD_STT_ENDPOINT', 'VITE_STT_ENDPOINT'],
    ['RELEASE_BUILD_QUIZ_STT_ENDPOINT', 'VITE_QUIZ_STT_ENDPOINT'],
    ['RELEASE_BUILD_QUIZ_MOBILE_STT_PILOT_ENABLED', 'VITE_QUIZ_MOBILE_STT_PILOT_ENABLED']
  ];

  it('passes exactly deployment STT flags to release build, never to validation', () => {
    for (const [releaseName, deployedName] of buildOnlyFlags) {
      expect(getStepEnv(prepare, releaseName), releaseName).toBe(getStepEnv(deploy, deployedName));
      expect(prepare).not.toMatch(new RegExp('^\\s*' + deployedName + '\\s*:', 'm'));
    }
    for (const key of ['VITE_TUTOR_AI_REMOTE_ENABLED', 'VITE_QUIZ_MOBILE_STT_AUTO_ENABLED']) {
      expect(getStepEnv(prepare, key), key).toBe(getStepEnv(deploy, key));
      expect(getStepEnv(prepare, key)).toBe('false');
    }
  });

  it('checks process isolation, including malicious inherited STT flags', async () => {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const { getValidationEnvironment, getReleaseBuildEnvironment } =
      require('../../scripts/release/release.js');
    const inherited = {
      PATH: '/test',
      VITE_STT_ENDPOINT: 'https://inherited.invalid',
      VITE_QUIZ_STT_ENDPOINT: 'https://inherited.invalid/quiz',
      VITE_QUIZ_MOBILE_STT_PILOT_ENABLED: 'true',
      RELEASE_BUILD_STT_ENDPOINT: 'https://example.test/v1/transcribe',
      RELEASE_BUILD_QUIZ_STT_ENDPOINT: 'https://example.test/v1/quiz/transcribe',
      RELEASE_BUILD_QUIZ_MOBILE_STT_PILOT_ENABLED: 'true'
    };
    const validation = getValidationEnvironment(inherited);
    const build = getReleaseBuildEnvironment(inherited);
    for (const [, name] of buildOnlyFlags) {
      expect(validation).not.toHaveProperty(name);
    }
    expect(build.VITE_STT_ENDPOINT).toBe(inherited.RELEASE_BUILD_STT_ENDPOINT);
    expect(build.VITE_QUIZ_STT_ENDPOINT).toBe(inherited.RELEASE_BUILD_QUIZ_STT_ENDPOINT);
    expect(build.VITE_QUIZ_MOBILE_STT_PILOT_ENABLED).toBe('true');
    expect(getReleaseBuildEnvironment({ VITE_STT_ENDPOINT: 'https://inherited.invalid' }))
      .not.toHaveProperty('VITE_STT_ENDPOINT');
    expect(inherited.VITE_STT_ENDPOINT).toBe('https://inherited.invalid');
  });
});
});
