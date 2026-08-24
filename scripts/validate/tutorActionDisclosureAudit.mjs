import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const modal = readFileSync(path.join(root, 'src', 'components', 'ai', 'TutorAIModal.jsx'), 'utf8');
const styles = readFileSync(path.join(root, 'src', 'styles', 'style.css'), 'utf8');
const issues = [];
const check = (condition, message) => { if (!condition) issues.push(message); };

check(/<details[^>]*className="tutor-ai-actions"[^>]*>[\s\S]*exercisePrompts\.map/.test(modal), 'Question actions must be inside one disclosure.');
check(/<details[^>]*className="quick-prompts-analytics"[^>]*>[\s\S]*analyticsPrompts\.map/.test(modal), 'Analytics actions must remain in a separate disclosure.');
check(/<details[^>]*className="tutor-ai-actions"[^>]*>/.test(modal) && !/<details[^>]*open/.test(modal), 'Action disclosures must be collapsed by default.');
for (const intent of ['hint', 'question_help', 'wrong_answer_coaching', 'example_request', 'weak_topic', 'revision_plan', 'uasa_summary']) check(modal.includes(`intent: '${intent}'`), `Intent removed: ${intent}`);
check(modal.includes('className="ai-chat-body"') && styles.includes('.ai-chat-body') && styles.includes('overflow-y: auto'), 'Conversation area must scroll and keep available height.');
check(modal.includes('aria-label="Tanya Guru AI"'), 'Tutor input must remain accessible.');
check(modal.includes('focus') && modal.includes('body.scrollTop = body.scrollHeight'), 'Response focus/scroll behavior is missing.');
check(styles.includes('prefers-reduced-motion') && styles.includes('tutor-ai-actions'), 'Disclosure chevron/reduced-motion styling is missing.');

console.log(JSON.stringify({ status: issues.length ? 'FAIL' : 'PASS', issues }, null, 2));
if (issues.length) process.exitCode = 1;
