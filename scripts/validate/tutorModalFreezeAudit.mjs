import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const modalPath = path.join(root, 'src', 'components', 'ai', 'TutorAIModal.jsx');
const source = readFileSync(modalPath, 'utf8');
const teacherSource = readFileSync(path.join(root, 'src', 'components', 'ai', 'AITeacherModal.jsx'), 'utf8');
const explainSource = readFileSync(path.join(root, 'src', 'components', 'ai', 'AIExplainModal.jsx'), 'utf8');
const issues = [];

function check(condition, message) {
  if (!condition) issues.push(message);
}

// Keep this audit intentionally static: it protects the open path from
// accidentally regressing into eager engine work or an unclosable modal.
const openEffect = source.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[open, sessionKey\]\);/)?.[0] || '';
const sendMessage = source.match(/async function sendMessage\([\s\S]*?\n  \}\n\n  function handlePromptClick/)?.[0] || '';

check(openEffect.includes('INITIAL_GREETING'), 'Opening the modal must show a short greeting.');
check(!openEffect.includes('getTutorResponse('), 'Opening the modal must not invoke getTutorResponse synchronously or eagerly.');
check(openEffect.includes('setLoading(false)'), 'Opening the modal must not leave loading active.');
check(sendMessage.includes('getTutorResponse('), 'Explicit prompt/message handling must invoke getTutorResponse.');
check(sendMessage.includes('withTimeout('), 'Response generation must have a timeout guard.');
check(source.includes('TUTOR_RESPONSE_TIMEOUT') && source.includes('TIMEOUT_MESSAGE'), 'Timeouts must show a recoverable retry message.');
check(/finally\s*\{[\s\S]*setLoading\(false\)/.test(sendMessage), 'Response loading must always clear in finally.');
check(source.includes("if (!text || loading) return;"), 'Duplicate requests must be blocked while loading.');
check(source.includes("if (event.key === 'Escape')") && source.includes('onTutupRef.current'), 'Escape must remain available while loading.');
check(source.includes('window.removeEventListener(\'keydown\', onKeyDown)'), 'Focus/keyboard listeners must be cleaned up.');
check(!/pointerEvents\s*[:=]\s*["']none/.test(source), 'The modal must not lock pointer events while loading or closing.');
check(source.includes('requestIdRef.current += 1'), 'Closing/resetting must invalidate stale requests.');
check(teacherSource.includes('onTutupRef.current') && teacherSource.includes('}, [open]);'), 'Ajar Saya focus handling must use a stable close callback dependency.');
check(explainSource.includes('onTutupRef.current') && explainSource.includes('}, [open]);'), 'AI Explain focus handling must use a stable close callback dependency.');

const report = { status: issues.length ? 'FAIL' : 'PASS', issues };
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
