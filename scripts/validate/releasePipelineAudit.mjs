import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const {
  assertVersionAlignment,
  deriveReleaseStatus,
  getReleaseMetadata
} = require('../release/releaseMetadata');

const read = relativePath => fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');
const metadata = getReleaseMetadata();
const packageJson = JSON.parse(read('package.json'));
const deployWorkflow = read('.github/workflows/deploy.yml');
const ciWorkflow = read('.github/workflows/ci.yml');
const releaseRunner = read('scripts/release/release.js');
const versionGenerator = read('scripts/release/generateVersion.js');
const smokeTest = read('scripts/release/smokeTestDeployment.mjs');
const buildVerifier = read('scripts/release/verifyBuildOutput.js');
const structureVerifier = read('scripts/release/verifyBuildStructure.js');
const productionSttEndpoint = 'VITE_STT_ENDPOINT: https://jannati-ai-tutor-stt.jannati-ai-tutor-stt-hrizz67.workers.dev/v1/transcribe';
const productionQuizSttEndpoint = 'VITE_QUIZ_STT_ENDPOINT: https://jannati-ai-tutor-quiz-stt.jannati-ai-tutor-stt-hrizz67.workers.dev/v1/quiz/transcribe';
const productionQuizSttAutoFlag = "VITE_QUIZ_MOBILE_STT_AUTO_ENABLED: 'false'";

function readWorkflowSection(startMarker, endMarker) {
  const start = deployWorkflow.indexOf(startMarker);
  const end = deployWorkflow.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `Deploy workflow section is missing: ${startMarker}`);
  assert.ok(end > start, `Deploy workflow section has no valid boundary: ${startMarker}`);
  return deployWorkflow.slice(start, end);
}

const deployJobEnvironment = readWorkflowSection('    env:', '    steps:');
const productionEnvironmentStep = readWorkflowSection(
  '      - name: Verify production environment',
  '      - name: Verify tag and release artifacts'
);
const validationStep = readWorkflowSection(
  '      - name: Run validation suite',
  '      - name: Build production application'
);
const productionBuildStep = readWorkflowSection(
  '      - name: Build production application',
  '      - name: Verify production build assets'
);
const buildCheckStep = readWorkflowSection(
  '      - name: Verify production build assets',
  '      - name: Publish GitHub Pages'
);
const publishStep = readWorkflowSection(
  '      - name: Publish GitHub Pages',
  '      - name: Smoke-test production deployment'
);

assert.equal(assertVersionAlignment().version, packageJson.version, 'Package and lock versions must align.');
assert.equal(assertVersionAlignment({ tag: metadata.expectedTag }).version, metadata.version, 'Expected release tag must pass.');
assert.throws(
  () => assertVersionAlignment({ tag: 'v0.0.0-release-audit-mismatch' }),
  /does not match package version/,
  'A mismatched tag must fail closed.'
);
assert.equal(deriveReleaseStatus('3.2.22'), 'stable');
assert.equal(deriveReleaseStatus('3.3.0-rc.1'), 'release-candidate');
assert.equal(packageJson.scripts?.release, 'node scripts/release/prepareRelease.js');
assert.equal(packageJson.scripts?.['release:check'], 'node scripts/release/verifyReleaseVersion.js');
assert.equal(packageJson.scripts?.['build:structure-check'], 'node scripts/release/verifyBuildStructure.js');
assert.equal(packageJson.scripts?.['release:build-check'], 'node scripts/release/verifyBuildOutput.js');
assert.equal(packageJson.scripts?.['release:smoke'], 'node scripts/release/smokeTestDeployment.mjs');
assert.match(
  releaseRunner,
  /Release step 2\/10: validate'[\s\S]{0,200}runNpmScript\('validate', \['--write-reports'\]\)[\s\S]{0,200}Release step 3\/10: verify validation gate'[\s\S]{0,200}verifyValidation\(\)/,
  'Release validation must refresh canonical reports before the validation gate reads them.'
);
assert.match(ciWorkflow, /actions\/checkout@v7/, 'CI must use the current Node 24 checkout action.');
assert.match(deployWorkflow, /actions\/checkout@v7/, 'Deploy must use the current Node 24 checkout action.');
assert.match(ciWorkflow, /actions\/setup-node@v7/, 'CI must use the current setup-node action.');
assert.match(deployWorkflow, /actions\/setup-node@v7/, 'Deploy must use the current setup-node action.');
assert.match(ciWorkflow, /node-version:\s*24/, 'CI must validate and build on Node.js 24.');
assert.match(deployWorkflow, /node-version:\s*24/, 'Deploy must validate and build on Node.js 24.');
assert.match(ciWorkflow, /actions\/upload-artifact@v7/, 'CI must upload QA reports with the current artifact action.');
assert.match(deployWorkflow, /peaceiris\/actions-gh-pages@v4/, 'Deploy must use the Node 24 GitHub Pages action.');
assert.match(deployWorkflow, /tags:\s*(?:\r?\n\s*-\s*)?['"]v\*['"]/m, 'Deploy workflow must be triggered by version tags.');
assert.match(deployWorkflow, /release:check[^\n]*--tag[^\n]*--artifacts/, 'Deploy must verify tag and generated artifacts.');
assert.ok(
  deployWorkflow.indexOf('npm run validate') < deployWorkflow.indexOf('peaceiris/actions-gh-pages'),
  'Validation must run before deployment.'
);
assert.ok(
  deployWorkflow.indexOf('npm run build') < deployWorkflow.indexOf('peaceiris/actions-gh-pages'),
  'Production build must run before deployment.'
);
assert.match(deployWorkflow, /npm run release:smoke/, 'Deploy workflow must smoke-test production.');
assert.match(deployWorkflow, /npm run release:build-check/, 'Deploy workflow must verify local build assets.');
assert.ok(
  deployWorkflow.indexOf('npm run release:build-check') < deployWorkflow.indexOf('peaceiris/actions-gh-pages'),
  'The strict production build gate must run before deployment.'
);
assert.match(deployWorkflow, /secrets\.VITE_SUPABASE_URL/, 'Deploy must receive the production Supabase URL from GitHub Secrets.');
assert.match(deployWorkflow, /secrets\.VITE_SUPABASE_PUBLISHABLE_KEY/, 'Deploy must receive the production Supabase key from GitHub Secrets.');
assert.match(deployWorkflow, /Required production deployment configuration is missing\./, 'Deploy must fail closed when production configuration is unavailable.');
assert.doesNotMatch(
  deployJobEnvironment,
  /VITE_(?:QUIZ_)?STT_ENDPOINT|VITE_QUIZ_MOBILE_STT_AUTO_ENABLED/,
  'Production STT configuration must not leak from job-level env into validation.'
);
assert.ok(
  productionEnvironmentStep.includes(productionSttEndpoint),
  'Production environment verification must receive the production STT endpoint.'
);
assert.match(
  productionEnvironmentStep,
  /-z "\$VITE_STT_ENDPOINT"[\s\S]*-z "\$VITE_QUIZ_STT_ENDPOINT"[\s\S]*"\$VITE_QUIZ_MOBILE_STT_AUTO_ENABLED" != "false"/,
  'Production environment verification must fail closed unless Quiz automatic MediaRecorder-STT remains disabled.'
);
assert.doesNotMatch(
  validationStep,
  /VITE_(?:QUIZ_)?STT_ENDPOINT|VITE_QUIZ_MOBILE_STT_AUTO_ENABLED/,
  'Validation must run without production STT configuration.'
);
assert.ok(
  productionBuildStep.includes(productionSttEndpoint),
  'Production build must receive the production STT endpoint.'
);
for (const requiredQuizConfig of [productionQuizSttEndpoint, productionQuizSttAutoFlag]) {
  assert.ok(productionEnvironmentStep.includes(requiredQuizConfig), 'Production environment verification must receive Quiz STT configuration.');
  assert.ok(productionBuildStep.includes(requiredQuizConfig), 'Production build must receive Quiz STT configuration.');
}
assert.doesNotMatch(buildCheckStep, /VITE_(?:QUIZ_)?STT_ENDPOINT|VITE_QUIZ_MOBILE_STT_AUTO_ENABLED/, 'Build verification does not need STT configuration.');
assert.doesNotMatch(publishStep, /VITE_(?:QUIZ_)?STT_ENDPOINT|VITE_QUIZ_MOBILE_STT_AUTO_ENABLED/, 'Pages publish must not receive STT configuration.');
assert.equal(
  deployWorkflow.split(productionSttEndpoint).length - 1,
  2,
  'Production STT endpoint must be injected only for environment verification and the Vite build.'
);
assert.equal(deployWorkflow.split(productionQuizSttEndpoint).length - 1, 2, 'Production Quiz STT endpoint must be injected only for environment verification and the Vite build.');
assert.equal(deployWorkflow.split(productionQuizSttAutoFlag).length - 1, 2, 'Production Quiz STT disable flag must be injected only for environment verification and the Vite build.');
assert.doesNotMatch(deployWorkflow, /VITE_QUIZ_MOBILE_STT_AUTO_ENABLED:\s*['"]true['"]/, 'Tagged production builds must not automatically enable Quiz MediaRecorder-STT.');
assert.doesNotMatch(ciWorkflow, /secrets\.VITE_SUPABASE_URL|secrets\.VITE_SUPABASE_PUBLISHABLE_KEY/, 'Normal CI must not depend on production Supabase secrets.');
assert.match(ciWorkflow, /https:\/\/ci-placeholder\.supabase\.co/, 'Normal CI must use an explicit non-production Supabase URL fixture.');
assert.match(ciWorkflow, /sb_publishable_ci-placeholder/, 'Normal CI must use an explicit non-production publishable-key fixture.');
assert.match(ciWorkflow, /npm run build:structure-check/, 'Normal CI must run the structural build and credential-safety gate.');
assert.doesNotMatch(ciWorkflow, /npm run release:build-check/, 'Normal CI must not run the production configuration gate.');
assert.match(smokeTest, /deployedEntryPath !== manifest\.expectedEntryPath/, 'Smoke test must reject a stale production entry hash.');
assert.match(smokeTest, /entryUrl\.origin !== expectedBaseUrl\.origin/, 'Smoke test must reject a cross-origin HTML entry asset.');
assert.match(smokeTest, /createVerifiedBuildManifest/, 'Smoke test must derive the expected JavaScript asset manifest from the local production build.');
assert.match(smokeTest, /digest\(source\) !== asset\.digest/, 'Smoke test must reject stale production JavaScript chunks.');
assert.match(smokeTest, /assetUrl\.origin !== productionUrl\.origin/, 'Smoke test must restrict production assets to the configured origin.');
assert.match(smokeTest, /\/auth\/v1\/health/, 'Smoke test must verify safe Supabase Auth reachability.');
assert.match(smokeTest, /inspectProductionSupabaseBundle/, 'Smoke test must reject placeholder or secret-bearing production bundles.');
assert.match(buildVerifier, /inspectProductionSupabaseBundle/, 'Production build verification must inspect the entry bundle configuration.');
assert.match(buildVerifier, /verifyBuildStructure/, 'Production build verification must include structural verification.');
assert.match(structureVerifier, /assertNoServiceCredentials/, 'Every build verification must reject service-role credentials.');
assert.match(ciWorkflow, /npm run release:check/, 'CI must validate release metadata.');
assert.doesNotMatch(versionGenerator, /2\.0\.0-alpha\.1/, 'Version generation must not contain the retired hardcoded version.');

console.log(`releasePipelineAudit validation passed for ${metadata.expectedTag}`);
