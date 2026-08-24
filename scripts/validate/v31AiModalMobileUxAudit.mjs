import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/styles/style.css', 'utf8');
const explain = fs.readFileSync('src/components/ai/AIExplainModal.jsx', 'utf8');
const teacher = fs.readFileSync('src/components/ai/AITeacherModal.jsx', 'utf8');
const runtime = fs.readFileSync('src/components/ai/modalRuntime.js', 'utf8');
assert.match(css, /100dvh/);
assert.match(css, /\.ai-explain-body[\s\S]*overflow-y:\s*auto/);
assert.match(css, /safe-area-inset-bottom/);
assert.match(runtime, /document\.body\.style\.overflow\s*=\s*'hidden'/);
assert.match(explain, /Lihat bahan tambahan/);
assert.match(teacher, /Lihat bahan tambahan/);
assert.match(explain, /aria-modal="true"/);
assert.match(css, /\.ai-explain-footer button,[\s\S]*min-height:\s*44px/);
assert.match(css, /\.ai-explain-body \.mascot-card-avatar[\s\S]*width:\s*48px/);
assert.doesNotMatch(css, /@media \(max-width: 480px\)[\s\S]{0,800}\.ai-explain-modal[^}]*max-height:\s*calc\(100vh/);
console.log('v31AiModalMobileUxAudit: PASS');
