import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

function assertIncludes(source, expected, message) {
  assert.equal(source.includes(expected), true, message);
}

const [app, voiceButton, supabaseClient, main, viteConfig, packageSource] = await Promise.all([
  read('src/App.jsx'),
  read('src/components/VoiceButton.jsx'),
  read('src/services/supabaseClient.js'),
  read('src/main.jsx'),
  read('vite.config.mjs'),
  read('package.json')
]);
const packageJson = JSON.parse(packageSource);

const checks = [];
function check(name, assertion) {
  assertion();
  checks.push(name);
}

check('tutor-modal-lazy-boundary', () => {
  assertIncludes(app, "const TutorAIModal = React.lazy(() => import('./components/ai/TutorAIModal.jsx'))", 'Tutor AI must remain outside the initial bundle.');
  assertIncludes(app, 'TutorAIModalLoading', 'Tutor AI lazy loading requires an accessible fallback.');
  assertIncludes(app, 'Tutor AI sedang dimuat...', 'Tutor AI loading status is missing.');
});

check('direct-voice-imports', () => {
  assertIncludes(voiceButton, "from '../ai/voice/voiceEngine.js'", 'VoiceButton must import the focused voice engine.');
  assertIncludes(voiceButton, "from '../ai/voice/voiceCapability.js'", 'VoiceButton must import the focused capability helper.');
  assert.doesNotMatch(voiceButton, /from ['"]\.\.\/ai\/index\.js['"]/, 'VoiceButton must not pull the full AI barrel into the initial graph.');
});

check('connection-aware-subject-preload', () => {
  for (const token of ['allowsBackgroundSubjectPreload', 'connection?.saveData', 'effectiveType', 'requestIdleCallback', '3500', 'ensureAllSubjectsLoaded']) {
    assertIncludes(app, token, `Staged subject loading token is missing: ${token}`);
  }
  assertIncludes(app, "screen !== 'dashboard'", 'Background subject preload must not begin during onboarding or focused learning screens.');
  assert.doesNotMatch(app, /useEffect\(\(\)\s*=>\s*\{\s*loadAllSubjects\(\)\.then\(setAllSubjects\)/s, 'All subject banks must not load immediately on mount.');
  assertIncludes(app, 'practiceSubjects.length < subjectList.length', 'Adaptive practice must hydrate complete subject data on demand.');
});

check('supabase-dynamic-boundary', () => {
  assert.doesNotMatch(supabaseClient, /^import\s+\{\s*createClient\s*\}\s+from\s+['"]@supabase\/supabase-js['"]/m, 'Supabase must not be a static initial import.');
  assertIncludes(supabaseClient, "import('@supabase/supabase-js')", 'Supabase needs a dynamic import boundary.');
  assertIncludes(supabaseClient, 'clientPromise', 'Supabase dynamic import must be cached.');
  assertIncludes(app, 'getSupabaseClient()', 'The app must initialize the account client asynchronously.');
  assert.match(app, /supabase\.auth\.getSession\(\)[\s\S]*?\}, \[supabase\]\);/, 'Account session recovery must rerun when the lazy Supabase client becomes ready.');
});

check('stable-manual-chunks', () => {
  for (const chunk of ['vendor-react', 'vendor-supabase', 'bm-enrichment', 'math-enrichment']) {
    assertIncludes(viteConfig, `'${chunk}'`, `Manual chunk is missing: ${chunk}`);
  }
});

check('postbuild-budget-gate', () => {
  assert.equal(packageJson.scripts?.postbuild, 'node scripts/validate/bundleBudgetAudit.mjs', 'Every production build must run the bundle budget.');
  assert.equal(packageJson.scripts?.['validate:bundle'], 'node scripts/validate/bundleBudgetAudit.mjs', 'Focused bundle validation command is missing.');
});

check('production-only-service-worker', () => {
  assertIncludes(main, "import.meta.env.PROD && 'serviceWorker' in navigator", 'Development modules must not be cached by the production service worker.');
});

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Performance Architecture P2',
  checks: checks.length,
  coverage: {
    lazyTutor: true,
    focusedVoiceImports: true,
    stagedSubjectBanks: true,
    deferredAccountSdk: true,
    stableChunkGroups: true,
    postbuildBudget: true,
    cleanDevelopmentRuntime: true
  }
}, null, 2));
