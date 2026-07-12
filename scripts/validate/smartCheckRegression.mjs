import assert from 'node:assert/strict';
import { smartCheck, normalizeAnswer } from '../../src/utils/smartCheck.js';

const makeQuestion = (answer, accepted = []) => ({ answer, accepted });

const cases = [
  ['mereka', true],
  [' Mereka  ', true],
  ['mereka.', true],
  ['me', false],
  ['mer', false],
  ['merek', false],
  ['dia', false],
  ['kami', false],
  ['mereka semua', false]
];

for (const [answer, expected] of cases) {
  const result = smartCheck(answer, makeQuestion('mereka'));
  assert.equal(result.status === 'correct', expected, `Case failed for ${answer}`);
}

assert.equal(smartCheck('pa', makeQuestion('padang')).status, 'wrong');
assert.equal(smartCheck('pad', makeQuestion('padang')).status, 'wrong');
assert.equal(smartCheck('padang', makeQuestion('padang')).status, 'correct');

assert.equal(smartCheck('bu', makeQuestion('buku')).status, 'wrong');
assert.equal(smartCheck('buku', makeQuestion('buku')).status, 'correct');

assert.equal(normalizeAnswer(' Mereka. '), 'mereka');

console.log('smartCheck regression tests passed');
