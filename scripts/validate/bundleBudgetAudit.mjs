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
  tutorIncrementalRuntimeBytes: 125 * kilobyte
};

function formatKilobytes(bytes) {
  return Number((bytes / kilobyte).toFixed(2));
}

function getLocalStaticJavaScriptImports(source = '') {
  const staticImportPattern = /(?:^|[;\n])\s*import\s*(?:(?:[^;"'()]*?)\bfrom\s*)?["'](\.[^"']+\.js)["']/g;
  const staticExportPattern = /(?:^|[;\n])\s*export[^;"'()]*?\bfrom\s*["'](\.[^"']+\.js)["']/g;
  return [...new Set([
    ...[...source.matchAll(staticImportPattern)].map(match => match[1]),
    ...[...source.matchAll(staticExportPattern)].map(match => match[1])
  ])];
}

function resolveLocalAssetImport(importerFile, importReference) {
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(importerFile), importReference));
  return resolved.startsWith('../') || path.posix.isAbsolute(resolved) ? null : resolved;
}

async function collectStaticJavaScriptClosure(startFile, sizes) {
  const pending = [startFile];
  const closure = new Set();
  while (pending.length > 0) {
    const currentFile = pending.pop();
    if (closure.has(currentFile)) continue;
    closure.add(currentFile);
    const source = await readFile(path.join(assetsDirectory, currentFile), 'utf8');
    for (const importReference of getLocalStaticJavaScriptImports(source)) {
      const importedFile = resolveLocalAssetImport(currentFile, importReference);
      if (!importedFile) continue;
      assert.ok(sizes.has(importedFile), `Static import ${importReference} from ${currentFile} is missing from dist/assets.`);
      if (!closure.has(importedFile)) pending.push(importedFile);
    }
  }
  return closure;
}

assert.deepEqual(
  getLocalStaticJavaScriptImports('import"./side-effect.js";import{x}from"./named.js";import("./dynamic.js");import(`./template-dynamic.js`);'),
  ['./side-effect.js', './named.js'],
  'Static import parser must exclude dynamic import() dependencies.'
);

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
const tutorModalChunk = sortedChunks.find(([file]) => file.startsWith('TutorAIModal-'));

assert.ok(tutorModalChunk, 'Tutor AI lazy chunk was not emitted.');
const tutorStaticClosure = await collectStaticJavaScriptClosure(tutorModalChunk[0], sizes);
const initialFileSet = new Set(initialFiles);
const tutorStaticClosureFiles = [...tutorStaticClosure]
  .map(file => [file, sizes.get(file) || 0])
  .sort((left, right) => right[1] - left[1]);
const tutorInitialOverlapFiles = tutorStaticClosureFiles.filter(([file]) => initialFileSet.has(file));
const tutorIncrementalFiles = tutorStaticClosureFiles.filter(([file]) => !initialFileSet.has(file));
const tutorStaticClosureBytes = tutorStaticClosureFiles.reduce((sum, [, bytes]) => sum + bytes, 0);
const tutorInitialOverlapBytes = tutorInitialOverlapFiles.reduce((sum, [, bytes]) => sum + bytes, 0);
const tutorIncrementalRuntimeBytes = tutorIncrementalFiles.reduce((sum, [, bytes]) => sum + bytes, 0);

assert.ok(entryBytes <= budgets.entryBytes, `Entry chunk ${entryFile} is ${formatKilobytes(entryBytes)} kB; budget is ${formatKilobytes(budgets.entryBytes)} kB.`);
assert.ok(initialJavaScriptBytes <= budgets.initialJavaScriptBytes, `Initial JavaScript is ${formatKilobytes(initialJavaScriptBytes)} kB; budget is ${formatKilobytes(budgets.initialJavaScriptBytes)} kB.`);
assert.ok(largestChunkBytes <= budgets.largestChunkBytes, `Largest chunk ${largestChunkFile} is ${formatKilobytes(largestChunkBytes)} kB; budget is ${formatKilobytes(budgets.largestChunkBytes)} kB.`);
assert.ok(tutorIncrementalRuntimeBytes <= budgets.tutorIncrementalRuntimeBytes, `Tutor incremental static runtime is ${formatKilobytes(tutorIncrementalRuntimeBytes)} kB; budget is ${formatKilobytes(budgets.tutorIncrementalRuntimeBytes)} kB.`);
assert.equal(initialFiles.some(file => file.startsWith('vendor-supabase-')), false, 'Supabase SDK must not be preloaded by dist/index.html.');
assert.equal(initialFiles.some(file => file.startsWith('TutorAIModal-')), false, 'Tutor AI must not be preloaded by dist/index.html.');

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Production Bundle Budget P2',
  metrics: {
    entry: { file: entryFile, kilobytes: formatKilobytes(entryBytes), budgetKilobytes: formatKilobytes(budgets.entryBytes) },
    initialJavaScript: { files: initialFiles.length, kilobytes: formatKilobytes(initialJavaScriptBytes), budgetKilobytes: formatKilobytes(budgets.initialJavaScriptBytes) },
    largestChunk: { file: largestChunkFile, kilobytes: formatKilobytes(largestChunkBytes), budgetKilobytes: formatKilobytes(budgets.largestChunkBytes) },
    tutorModalChunk: { file: tutorModalChunk[0], bytes: tutorModalChunk[1], kilobytes: formatKilobytes(tutorModalChunk[1]) },
    tutorRuntime: {
      staticClosureFiles: tutorStaticClosureFiles.length,
      staticClosureBytes: tutorStaticClosureBytes,
      staticClosureKilobytes: formatKilobytes(tutorStaticClosureBytes),
      initialOverlapFiles: tutorInitialOverlapFiles.length,
      initialOverlapBytes: tutorInitialOverlapBytes,
      initialOverlapKilobytes: formatKilobytes(tutorInitialOverlapBytes),
      incrementalFiles: tutorIncrementalFiles.length,
      incrementalBytes: tutorIncrementalRuntimeBytes,
      incrementalKilobytes: formatKilobytes(tutorIncrementalRuntimeBytes),
      budgetBytes: budgets.tutorIncrementalRuntimeBytes,
      budgetKilobytes: formatKilobytes(budgets.tutorIncrementalRuntimeBytes),
      incrementalAssets: tutorIncrementalFiles.map(([file, bytes]) => ({ file, bytes, kilobytes: formatKilobytes(bytes) }))
    }
  },
  deferredFromInitialHtml: ['vendor-supabase', 'TutorAIModal']
}, null, 2));
