import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const ROOT = process.cwd();
const appPath = path.join(ROOT, 'src', 'App.jsx');
const appText = readFileSync(appPath, 'utf8');

function main() {
  const issues = [];
  const betaChromeMatch = appText.match(/function BetaChrome\(\{[\s\S]*?return <>\s*([\s\S]*?)\s*<\/>;\s*\}/);
  const betaChromeBody = betaChromeMatch?.[1] ?? '';

  assert(appText.includes('const [chatOpen, setChatOpen] = useState(false);'), 'Tutor AI open-state should remain declared in App.', issues);
  assert(appText.includes('const modalOpen = chatOpen || explainOpen || teacherOpen;'), 'App should derive a shared modalOpen state.', issues);
  assert(appText.includes('<BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen}>'), 'App should pass modalOpen into BetaChrome.', issues);
  assert(!appText.includes('suppressed={chatOpen || explainOpen || teacherOpen}'), 'Legacy chatOpen-based suppression must not remain in BetaChrome.', issues);
  assert(betaChromeBody.length > 0, 'BetaChrome body must be discoverable for audit checks.', issues);
  assert(!/chatOpen|explainOpen|teacherOpen/.test(betaChromeBody), 'BetaChrome must not read App-scoped modal state directly.', issues);
  assert(appText.includes('<BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen}><main className="app"><EmptyState title="Paparan tidak dijumpai."'), 'Fallback screen must also receive modalOpen.', issues);

  const report = {
    status: issues.length ? 'FAIL' : 'PASS',
    issues
  };

  console.log(JSON.stringify(report, null, 2));
  if (issues.length) process.exitCode = 1;
}

main();
