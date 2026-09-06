import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const REPORT_DIRECTORY = path.join(ROOT, 'reports', 'validation');
const RESULT_PATH = path.join(REPORT_DIRECTORY, 'question-release-validator-results.json');

const validators = [
  ['schema-and-session', 'scripts/validate/questionValidator.js'],
  ['curriculum', 'scripts/validate/curriculumValidator.js'],
  ['metadata', 'scripts/validate/metadataValidator.js'],
  ['content-quality', 'scripts/validate/contentQualityValidator.js'],
  ['accepted-answers', 'scripts/validate/multipleAcceptedAnswersAudit.mjs'],
  ['question-regressions', 'scripts/validate/questionAuditRegression.mjs'],
  ['semantic-uniqueness', 'scripts/validate/semanticQuestionUniquenessAudit.mjs'],
  ['distractor-difficulty', 'scripts/validate/distractorDifficultyAudit.mjs'],
  ['deep-core-content', 'scripts/validate/deepCoreSubjectContentAudit.mjs'],
  ['bm-release', 'scripts/validate/bmReleaseGate.mjs'],
  ['english-content', 'scripts/validate/englishDeepContentAudit.mjs'],
  ['sains-content', 'scripts/validate/sainsContentQualityAudit.mjs'],
  ['arab-content', 'scripts/validate/arabContentQualityAudit.mjs'],
  ['islam-content', 'scripts/validate/islamContentQualityAudit.mjs'],
  ['jawi-integrity', 'scripts/validate/jawiCleanupValidator.js'],
  ['feedback-answer-leak', 'scripts/validate/quizFeedbackSafetyAudit.mjs'],
  ['tutor-answer-leak', 'scripts/validate/v31TutorAiAnswerLeakAudit.mjs'],
  ['cross-subject-answer-leak', 'scripts/validate/v31CrossSubjectAnswerLeakAudit.mjs'],
  ['question-presentation', 'scripts/validate/questionPresentationRegression.mjs'],
  ['interactive-engine', 'scripts/validate/interactiveQuestionEngineRegression.mjs'],
  ['interactive-intelligence', 'scripts/validate/interactiveQuestionIntelligenceRegression.mjs'],
  ['interactive-suitability', 'scripts/validate/interactiveSuitabilityAudit.mjs'],
  ['interactive-coverage', 'scripts/validate/interactiveCoverageQualityAudit.mjs']
];

fs.mkdirSync(REPORT_DIRECTORY, { recursive: true });

const results = [];
for (const [id, script] of validators) {
  const startedAt = Date.now();
  console.log(`\n[question-release] ${id}`);
  const result = spawnSync(process.execPath, [path.join(ROOT, script)], {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit'
  });
  results.push({
    id,
    script,
    status: result.status === 0 ? 'PASS' : 'FAIL',
    exitCode: Number.isInteger(result.status) ? result.status : 1,
    signal: result.signal || null,
    durationMs: Date.now() - startedAt
  });
}

fs.writeFileSync(RESULT_PATH, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  validators: results
}, null, 2)}\n`);

console.log('\n[question-release] canonical-release-audit');
const canonical = spawnSync(process.execPath, [path.join(ROOT, 'scripts/validate/questionReleaseAudit.mjs')], {
  cwd: ROOT,
  env: process.env,
  stdio: 'inherit'
});

console.log('\n[question-release] stale-evidence-verification');
const evidence = spawnSync(process.execPath, [
  path.join(ROOT, 'scripts/validate/questionReleaseAudit.mjs'),
  '--verify-evidence'
], {
  cwd: ROOT,
  env: process.env,
  stdio: 'inherit'
});

const failedValidators = results.filter(item => item.status === 'FAIL');
if (failedValidators.length || canonical.status !== 0 || evidence.status !== 0) {
  console.error(JSON.stringify({
    status: 'NOT_READY',
    failedValidators: failedValidators.map(item => item.id),
    canonicalExitCode: canonical.status,
    evidenceExitCode: evidence.status
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  validators: results.length,
  durationMs: results.reduce((sum, item) => sum + item.durationMs, 0)
}, null, 2));
