import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/styles/style.css', 'utf8');
const footerCount = (css.match(/\.ai-(?:explain|teacher)-footer\s*\{/g) || []).length;
assert.match(css, /env\(safe-area-inset-bottom/);
assert.match(css, /\.ai-explain-footer[\s\S]*padding[^;]*safe-area-inset-bottom/);
assert.match(css, /\.ai-teacher-footer[\s\S]*padding[^;]*safe-area-inset-bottom/);
assert.match(css, /scroll-padding-bottom:[^;]*safe-area-inset-bottom/);
assert.ok(footerCount >= 1, 'modal footer rules missing');
assert.doesNotMatch(css, /ai-explain-footer[^}]*bottom:\s*0[^}]*position:\s*fixed/);
console.log('v31AiModalSafeAreaAudit: PASS');
