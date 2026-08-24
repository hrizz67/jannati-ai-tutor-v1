import assert from 'node:assert/strict';
import fs from 'node:fs';
const css = fs.readFileSync('src/styles/style.css', 'utf8');
assert.match(css, /--tutor-composer-height/); assert.match(css, /--ai-modal-footer-height/); assert.match(css, /safe-area-inset-(top|bottom)/); assert.match(css, /scroll-padding-bottom/); assert.match(css, /min-height:\s*44px/); assert.match(css, /100dvh/);
assert.match(css, /\.ai-chat-body[\s\S]*overflow-y:\s*auto/); assert.match(css, /\.ai-explain-body[\s\S]*overflow-y:\s*auto/); assert.match(css, /\.ai-teacher-body[\s\S]*overflow-y:\s*auto/);
console.log('PASS v31AllAiSurfacesMobileSafetyAudit');
