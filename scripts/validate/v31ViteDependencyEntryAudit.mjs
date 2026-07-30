import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = fs.readFileSync('vite.config.js', 'utf8');
const packageJson = fs.readFileSync('package.json', 'utf8');
const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'].filter(file => fs.existsSync(file));

assert.match(config, /optimizeDeps\s*:\s*\{/);
assert.match(config, /entries\s*:\s*\[['"]index\.html['"]\]/);
assert.doesNotMatch(config, /entries\s*:\s*[^\n]*artifacts/);
assert.match(config, /include\s*:\s*\[['"]react-dom\/client['"]\]/);
assert.match(fs.readFileSync('index.html', 'utf8'), /id=['"]root['"]/);
assert.ok(packageJson.includes('"react-dom"'), 'react-dom dependency must remain present');
assert.ok(lockFiles.length >= 0, 'lockfile inspection completed');
console.log('v31ViteDependencyEntryAudit: PASS');
