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

  const publicBuildFlags = [
    'VITE_TUTOR_AI_REMOTE_ENABLED',
    'VITE_STT_ENDPOINT',
    'VITE_QUIZ_STT_ENDPOINT',
    'VITE_QUIZ_MOBILE_STT_PILOT_ENABLED',
    'VITE_QUIZ_MOBILE_STT_AUTO_ENABLED'
  ];

  it('uses the same exact public STT and remote-AI build flags before tagging', () => {
    for (const key of publicBuildFlags) {
      expect(getStepEnv(prepare, key), key).toBe(getStepEnv(deploy, key));
    }
    expect(prepare).not.toMatch(/env\s+-u\s+VITE_(?:STT_ENDPOINT|QUIZ_STT_ENDPOINT|QUIZ_MOBILE_STT_PILOT_ENABLED)/);
  });

  it('preserves the owner-only remote and automatic quiz STT kill switches', () => {
    for (const step of [prepare, deploy]) {
      expect(getStepEnv(step, 'VITE_TUTOR_AI_REMOTE_ENABLED')).toBe('false');
      expect(getStepEnv(step, 'VITE_QUIZ_MOBILE_STT_AUTO_ENABLED')).toBe('false');
      expect(getStepEnv(step, 'VITE_QUIZ_MOBILE_STT_PILOT_ENABLED')).toBe('true');
      expect(getStepEnv(step, 'VITE_STT_ENDPOINT')).toMatch(/^https:\/\//);
      expect(getStepEnv(step, 'VITE_QUIZ_STT_ENDPOINT')).toMatch(/\/v1\/quiz\/transcribe$/);
    }
  });
});
