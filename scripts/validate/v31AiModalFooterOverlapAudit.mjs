import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/styles/style.css', 'utf8');
assert.match(css, /--ai-modal-footer-height:\s*172px/);
assert.match(css, /--ai-modal-footer-height:\s*116px/);
assert.match(css, /padding-bottom:\s*calc\(var\(--ai-modal-footer-height\)/);
assert.match(css, /scroll-padding-bottom:\s*calc\(var\(--ai-modal-footer-height\)/);
assert.match(css, /env\(safe-area-inset-bottom/);
assert.match(css, /\.ai-explain-body[\s\S]*overflow-y:\s*auto/);
assert.match(css, /\.ai-explain-footer[\s\S]*position:\s*sticky/);
assert.match(css, /\.ai-explain-footer button,[\s\S]*min-height:\s*44px/);
assert.match(css, /\.ai-teacher-footer button,[\s\S]*min-height:\s*44px/);
console.log('v31AiModalFooterOverlapAudit: PASS');
