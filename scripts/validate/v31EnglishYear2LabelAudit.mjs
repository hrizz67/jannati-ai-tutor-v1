import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { formatSubjectName } from '../../src/utils/displayFormatter.js';

const homeSource = await fs.readFile('src/dashboard/HomeDashboard.jsx', 'utf8');
const subjectSource = await fs.readFile('src/data/subjects/english.js', 'utf8');
const coachSource = await fs.readFile('src/ai/coach/v3/explanationEngine.js', 'utf8');

assert.match(homeSource, /formatSubjectName\(subject\?\.title\s*\|\|\s*subject\?\.id\)/, 'Home subject display must use the shared formatter');
assert.equal(formatSubjectName('English Year 2'), 'Bahasa Inggeris Tahun 2', 'Canonical English subject label mismatch');
assert.equal(formatSubjectName('English Year 2').includes('English Year 2'), false, 'Visible path still exposes raw English Year 2');
assert.match(subjectSource, /title:\s*['"]English Year 2['"]|['"]title['"]\s*:\s*['"]English Year 2['"]/, 'Raw source subject value must remain unchanged');
assert.match(homeSource, /onSelectSubject\(subject\?\.id\)/, 'Subject routing identity must remain keyed by raw subject id');
assert.match(homeSource, /subjectButtonRefs\.current\.set\(subject\?\.id/, 'Subject switcher identity must remain keyed by raw subject id');
assert.match(coachSource, /const explanation = simpleExplanation \|\| explanations\[0\] \|\| responseFocus/, 'P1 Coach explanation repair must remain present');
assert.doesNotMatch(homeSource, /subjectTitle\s*=\s*subject\?\.title\s*\|\|\s*formatSubjectName/, 'Raw title fallback bypasses the display formatter');

console.log('English Year 2 canonical label audit PASS');
console.log(JSON.stringify({
  rawSource: 'English Year 2',
  renderedLabel: formatSubjectName('English Year 2'),
  sharedFormatter: true,
  rawIdsPreserved: true,
  coachRepairPresent: true
}, null, 2));
