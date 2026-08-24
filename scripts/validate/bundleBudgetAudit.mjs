import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');
const distDirectory = path.join(projectRoot, 'dist');
const assetsDirectory = path.join(distDirectory, 'assets');
const kilobyte = 1000;
const budgets = {
  entryBytes: 350 * kilobyte,
  initialJavaScriptBytes: 900 * kilobyte,
  largestChunkBytes: 480 * kilobyte,
  tutorChunkBytes: 25 * kilobyte
};

function formatKilobytes(bytes) {
  return Number((bytes / kilobyte).toFixed(2));
}

const indexHtml = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
const assetFiles = await readdir(assetsDirectory);
const javascriptFiles = assetFiles.filter(file => file.endsWith('.js'));
assert.ok(javascriptFiles.length > 0, 'No production JavaScript assets found. Run npm run build first.');

const sizes = new Map();
await Promise.all(javascriptFiles.map(async file => {
  sizes.set(file, (await stat(path.join(assetsDirectory, file))).size);
}));

const entryMatch = indexHtml.match(/<script[^>]+src="[^"]*\/assets\/([^"]+\.js)"/i);
assert.ok(entryMatch, 'Production entry script is missing from dist/index.html.');
const entryFile = entryMatch[1];
const entryBytes = sizes.get(entryFile) || 0;

const initialReferences = [...indexHtml.matchAll(/(?:src|href)="[^"]*\/assets\/([^"]+\.js)"/gi)]
  .map(match => match[1]);
const initialFiles = [...new Set(initialReferences)];
const initialJavaScriptBytes = initialFiles.reduce((sum, file) => sum + (sizes.get(file) || 0), 0);
const sortedChunks = [...sizes.entries()].sort((left, right) => right[1] - left[1]);
const [largestChunkFile, largestChunkBytes] = sortedChunks[0];
const tutorChunk = sortedChunks.find(([file]) => file.startsWith('TutorAIModal-'));

assert.ok(entryBytes <= budgets.entryBytes, `Entry chunk ${entryFile} is ${formatKilobytes(entryBytes)} kB; budget is ${formatKilobytes(budgets.entryBytes)} kB.`);
assert.ok(initialJavaScriptBytes <= budgets.initialJavaScriptBytes, `Initial JavaScript is ${formatKilobytes(initialJavaScriptBytes)} kB; budget is ${formatKilobytes(budgets.initialJavaScriptBytes)} kB.`);
assert.ok(largestChunkBytes <= budgets.largestChunkBytes, `Largest chunk ${largestChunkFile} is ${formatKilobytes(largestChunkBytes)} kB; budget is ${formatKilobytes(budgets.largestChunkBytes)} kB.`);
assert.ok(tutorChunk, 'Tutor AI lazy chunk was not emitted.');
assert.ok(tutorChunk[1] <= budgets.tutorChunkBytes, `Tutor AI chunk is ${formatKilobytes(tutorChunk[1])} kB; budget is ${formatKilobytes(budgets.tutorChunkBytes)} kB.`);
assert.equal(initialFiles.some(file => file.startsWith('vendor-supabase-')), false, 'Supabase SDK must not be preloaded by dist/index.html.');
assert.equal(initialFiles.some(file => file.startsWith('TutorAIModal-')), false, 'Tutor AI must not be preloaded by dist/index.html.');

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Production Bundle Budget P2',
  metrics: {
    entry: { file: entryFile, kilobytes: formatKilobytes(entryBytes), budgetKilobytes: formatKilobytes(budgets.entryBytes) },
    initialJavaScript: { files: initialFiles.length, kilobytes: formatKilobytes(initialJavaScriptBytes), budgetKilobytes: formatKilobytes(budgets.initialJavaScriptBytes) },
    largestChunk: { file: largestChunkFile, kilobytes: formatKilobytes(largestChunkBytes), budgetKilobytes: formatKilobytes(budgets.largestChunkBytes) },
    tutorChunk: { file: tutorChunk[0], kilobytes: formatKilobytes(tutorChunk[1]), budgetKilobytes: formatKilobytes(budgets.tutorChunkBytes) }
  },
  deferredFromInitialHtml: ['vendor-supabase', 'TutorAIModal']
}, null, 2));
