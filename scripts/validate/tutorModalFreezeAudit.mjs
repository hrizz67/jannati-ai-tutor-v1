import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const modalPath = path.join(root, 'src', 'components', 'ai', 'TutorAIModal.jsx');
const source = readFileSync(modalPath, 'utf8');
const modalRuntimeSource = readFileSync(path.join(root, 'src', 'components', 'ai', 'modalRuntime.js'), 'utf8');
const issues = [];

function check(condition, message) {
  if (!condition) issues.push(message);
}

// Keep this audit intentionally static: it protects the open path from
// accidentally regressing into eager engine work or an unclosable modal.
const openEffect = source.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[open, sessionKey, speechSupported\]\);/)?.[0] || '';
const sendMessage = source.match(/async function sendMessage\([\s\S]*?\r?\n  \}\r?\n\r?\n  function handlePromptClick/)?.[0] || '';

check(openEffect.includes('buildNaturalGreeting'), 'Opening the modal must show a short contextual greeting.');
check(!openEffect.includes('getTutorResponse('), 'Opening the modal must not invoke getTutorResponse synchronously or eagerly.');
check(openEffect.includes('setLoading(false)'), 'Opening the modal must not leave loading active.');
check(sendMessage.includes('getTutorResponse('), 'Explicit prompt/message handling must invoke getTutorResponse.');
check(sendMessage.includes('withTimeout('), 'Response generation must have a timeout guard.');
check(source.includes('TUTOR_RESPONSE_TIMEOUT') && source.includes('TIMEOUT_MESSAGE'), 'Timeouts must show a recoverable retry message.');
check(/finally\s*\{[\s\S]*setLoading\(false\)/.test(sendMessage), 'Response loading must always clear in finally.');
check(source.includes("if (!text || loading) return;"), 'Duplicate requests must be blocked while loading.');
check(source.includes('useModalRuntime({'), 'Tutor modal must use the shared modal lifecycle runtime.');
check(modalRuntimeSource.includes("if (event.key === 'Escape')") && modalRuntimeSource.includes('onCloseRef.current'), 'Escape must remain available while loading.');
check(modalRuntimeSource.includes('window.removeEventListener(\'keydown\', onKeyDown)'), 'Focus/keyboard listeners must be cleaned up.');
check(!/pointerEvents\s*[:=]\s*["']none/.test(source), 'The modal must not lock pointer events while loading or closing.');
check(source.includes('requestIdRef.current += 1'), 'Closing/resetting must invalidate stale requests.');
check(source.includes('speechSessionRef.current?.cancel?.()'), 'Closing/resetting must cancel active microphone sessions.');
check(source.includes('setPendingPedagogicalStep(null)'), 'Closing/resetting must discard pending pedagogical state.');

const report = { status: issues.length ? 'FAIL' : 'PASS', issues };
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
