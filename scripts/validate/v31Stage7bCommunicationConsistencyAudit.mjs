import fs from 'node:fs';
import path from 'node:path';
import {
  appendUniqueCommunicationResult,
  buildCommunicationSessionSummary,
  filterLegacyInvalidCommunicationRows,
  isAssessedCommunicationAttempt,
  normalizeCommunicationAttempt
} from '../../src/utils/communicationResult.js';

const root = process.cwd();
const appPath = path.join(root, 'src', 'App.jsx');
const appSource = fs.readFileSync(appPath, 'utf8');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function createHistory(items = []) {
  const seenKeys = new Set();
  let history = [];
  for (const item of items) {
    history = appendUniqueCommunicationResult(history, item, {
      attemptKey: item.attemptKey,
      itemKey: item.attemptKey,
      seenKeys
    });
  }
  return history;
}

const fixtures = {
  permissionDenied: { status: 'empty', errorCode: 'permission-denied', message: 'Kebenaran mikrofon diperlukan untuk latihan ini.', attemptKey: 'perm-1' },
  emptyAttempt: { status: 'empty', errorCode: 'empty', message: 'Belum ada percubaan yang sah.', attemptKey: 'empty-1' },
  technicalError: { status: 'technical-error', errorCode: 'validation-error', message: 'Semakan audio tidak dapat dijalankan sekarang.', attemptKey: 'tech-1' },
  audioFailure: { status: 'technical-error', errorCode: 'audio-unavailable', message: 'Audio tidak dapat dimainkan sekarang.', attemptKey: 'audio-1' },
  zeroScore: { status: 'completed', score: 0, correct: false, attemptKey: 'zero-1' },
  perfectScore: { status: 'completed', score: 100, correct: true, attemptKey: 'perfect-1' }
};

const normalizedPermission = normalizeCommunicationAttempt(fixtures.permissionDenied);
const normalizedEmpty = normalizeCommunicationAttempt(fixtures.emptyAttempt);
const normalizedTechnical = normalizeCommunicationAttempt(fixtures.technicalError);
const normalizedAudio = normalizeCommunicationAttempt(fixtures.audioFailure);
const normalizedZero = normalizeCommunicationAttempt(fixtures.zeroScore);
const normalizedPerfect = normalizeCommunicationAttempt(fixtures.perfectScore);

assert(!normalizedPermission.isAssessed && normalizedPermission.isPermissionDenied, 'Permission denied must be non-assessed and flagged as permission denied.');
assert(!normalizedEmpty.isAssessed && normalizedEmpty.isEmptyAttempt, 'Empty attempt must be non-assessed.');
assert(!normalizedTechnical.isAssessed && normalizedTechnical.isTechnicalError, 'Technical error must be non-assessed.');
assert(!normalizedAudio.isAssessed && normalizedAudio.isTechnicalError, 'Audio failure must be non-assessed.');
assert(normalizedZero.isAssessed && normalizedZero.scorePercent === 0, 'Valid 0% attempt must remain assessed evidence.');
assert(normalizedPerfect.isAssessed && normalizedPerfect.scorePercent === 100, 'Valid 100% attempt must remain assessed evidence.');

for (const [name, fixture] of Object.entries({
  A: fixtures.permissionDenied,
  B: fixtures.emptyAttempt,
  C: fixtures.technicalError,
  D: fixtures.audioFailure
})) {
  const history = createHistory([fixture]);
  const summary = buildCommunicationSessionSummary(history);
  assert(history.length === 0, `${name}: invalid attempt must not append history.`);
  assert(summary.completedItems === 0 && summary.averagePercent === null && summary.bestPercent === null, `${name}: invalid attempt must not produce summary evidence.`);
  assert(!normalizeCommunicationAttempt(fixture).canProceed, `${name}: invalid attempt must not allow next/proceed.`);
}

const historyZero = createHistory([fixtures.zeroScore]);
const summaryZero = buildCommunicationSessionSummary(historyZero);
assert(historyZero.length === 1 && historyZero[0] === 0, 'E: valid 0% attempt must append one history value of 0.');
assert(summaryZero.hasEvidence && summaryZero.completedItems === 1 && summaryZero.averagePercent === 0 && summaryZero.bestPercent === 0, 'E: valid 0% summary must show evidence with 0 average and 0 best.');
assert(normalizedZero.canProceed, 'E: valid 0% attempt must allow proceed.');

const historyPerfect = createHistory([fixtures.perfectScore]);
const summaryPerfect = buildCommunicationSessionSummary(historyPerfect);
assert(historyPerfect.length === 1 && historyPerfect[0] === 100, 'F: valid 100% attempt must append one history value of 100.');
assert(summaryPerfect.completedItems === 1 && summaryPerfect.averagePercent === 100 && summaryPerfect.bestPercent === 100, 'F: valid 100% summary must be 100.');

const deniedThenValid = createHistory([fixtures.permissionDenied, fixtures.perfectScore]);
const deniedThenValidSummary = buildCommunicationSessionSummary(deniedThenValid);
assert(deniedThenValid.length === 1 && deniedThenValid[0] === 100, 'G: denied then valid manual result must produce exactly one assessed row.');
assert(deniedThenValidSummary.completedItems === 1, 'G: denied then valid manual result must count one completed item.');

const doubleValid = createHistory([fixtures.perfectScore, { ...fixtures.perfectScore }]);
const doubleValidSummary = buildCommunicationSessionSummary(doubleValid);
assert(doubleValid.length === 1 && doubleValidSummary.completedItems === 1, 'H: duplicate attemptKey must be deduplicated.');

const mixedValid = createHistory([fixtures.zeroScore, fixtures.perfectScore]);
const mixedSummary = buildCommunicationSessionSummary(mixedValid);
assert(mixedValid.length === 2, 'I: valid 0 and valid 100 must both append.');
assert(mixedSummary.completedItems === 2 && mixedSummary.averagePercent === 50 && mixedSummary.bestPercent === 100, 'I: mixed valid attempts must average to 50 and best 100.');

const legacyRows = filterLegacyInvalidCommunicationRows([
  { language: 'BM', title: 'Makmal Mendengar', status: 'empty', score: 0, message: 'Belum ada percubaan yang sah.', attemptKey: 'legacy-invalid' },
  { language: 'BM', title: 'Makmal Mendengar', status: 'completed', score: 100, attemptKey: 'legacy-valid' }
]);
const legacySummary = buildCommunicationSessionSummary(legacyRows);
assert(legacyRows.length === 1 && legacyRows[0].attemptKey === 'legacy-valid', 'J: legacy invalid row must be excluded while valid row remains.');
assert(legacySummary.completedItems === 1 && legacySummary.averagePercent === 100, 'J: legacy summary must keep only assessed rows.');

assert(buildCommunicationSessionSummary([]).hasEvidence === false, 'No-evidence summary must return hasEvidence false.');
assert(buildCommunicationSessionSummary([]).averagePercent === null, 'No-evidence summary must return null metrics.');

const moduleChecks = [
  ['BacaanCoach', /function BacaanCoach[\s\S]*?normalizeCommunicationResult\(result\)[\s\S]*?recordCommunicationScore\(/],
  ['BertuturCoach', /function BertuturCoach[\s\S]*?normalizeCommunicationResult\(result\)[\s\S]*?recordCommunicationScore\(/],
  ['MenulisCoach', /function MenulisCoach[\s\S]*?normalizeCommunicationResult\(result\)[\s\S]*?recordCommunicationScore\(/],
  ['MendengarLab', /function MendengarLab[\s\S]*?normalizeCommunicationResult\(feedback\)[\s\S]*?recordCommunicationScore\(/]
];

for (const [label, pattern] of moduleChecks) {
  assert(pattern.test(appSource), `${label} must call the shared communication contract and recorder.`);
}

assert(appSource.includes('buildCommunicationSessionSummary(scoreHistory)'), 'App must use the shared communication session summary helper.');
assert(isAssessedCommunicationAttempt(fixtures.zeroScore) === true, 'Assessed helper must recognise 0% as valid evidence.');

if (failures.length) {
  console.error('v31Stage7bCommunicationConsistencyAudit FAILED');
  failures.forEach((failure, index) => {
    console.error(`${index + 1}. ${failure}`);
  });
  process.exit(1);
}

console.log('v31Stage7bCommunicationConsistencyAudit PASSED');
console.log(JSON.stringify({
  fixtures: {
    A: buildCommunicationSessionSummary(createHistory([fixtures.permissionDenied])),
    B: buildCommunicationSessionSummary(createHistory([fixtures.emptyAttempt])),
    C: buildCommunicationSessionSummary(createHistory([fixtures.technicalError])),
    D: buildCommunicationSessionSummary(createHistory([fixtures.audioFailure])),
    E: buildCommunicationSessionSummary(historyZero),
    F: buildCommunicationSessionSummary(historyPerfect),
    G: buildCommunicationSessionSummary(deniedThenValid),
    H: buildCommunicationSessionSummary(doubleValid),
    I: buildCommunicationSessionSummary(mixedValid),
    J: legacySummary
  }
}, null, 2));
