import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');
const adaptiveControllerPath = path.join(srcRoot, 'ai', 'adaptive', 'adaptiveController.js');
const studentDashboardPath = path.join(srcRoot, 'dashboard', 'StudentDashboard.jsx');

function assert(condition, message, details = '') {
  if (!condition) {
    const suffix = details ? `\n${details}` : '';
    throw new Error(`${message}${suffix}`);
  }
}

function collectFiles(rootDir) {
  const files = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const absolute = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolute));
      continue;
    }
    if (/\.(js|jsx|ts|tsx|mjs)$/i.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

function findUnsafeNodeGlobalMatches(filePath, source) {
  const matches = [];
  const lines = source.split(/\r?\n/);
  const hasLocalGlobalDeclaration = /\b(?:const|let|var)\s+global\s*=/.test(source);

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    if (/\bprocess\.env\b/.test(line)) {
      const context = [lines[index - 1] || '', line, lines[index + 1] || ''].join('\n');
      const guarded =
        /typeof process !== ['"]undefined['"]/.test(context) ||
        /process\?\.env/.test(context);
      if (!guarded) {
        matches.push({ line: index + 1, type: 'process.env', snippet: trimmed });
      }
    }

    if (/\bglobalThis\.process\b/.test(line) || /\bwindow\.process\b/.test(line)) {
      matches.push({ line: index + 1, type: 'polyfill', snippet: trimmed });
    }

    if (/\bBuffer\b/.test(line) || /\b__dirname\b/.test(line) || /\b__filename\b/.test(line)) {
      matches.push({ line: index + 1, type: 'node-global', snippet: trimmed });
    }

    if (/\bglobal\b/.test(line) && !/\bglobalThis\b/.test(line)) {
      const looksLikeNodeGlobal = /\bglobal\./.test(line) || /\b=\s*global\b/.test(line) || /\bglobal\s*===/.test(line);
      if (looksLikeNodeGlobal && !hasLocalGlobalDeclaration) {
        matches.push({ line: index + 1, type: 'global', snippet: trimmed });
      }
    }
  });

  return matches;
}

function createFixtureProfile() {
  return {
    adaptivePerformance: {
      version: 1,
      totalQuestions: 6,
      correctQuestions: 4,
      incorrectQuestions: 2,
      totalTime: 210,
      averageTime: 35,
      subjects: {
        math: {
          attempts: 6,
          correct: 4,
          incorrect: 2,
          totalTime: 210,
          averageTime: 35,
          usedHintCount: 1,
          usedExplainCount: 1,
          topics: {
            darab: {
              attempts: 6,
              correct: 4,
              incorrect: 2,
              totalTime: 210,
              averageTime: 35,
              usedHintCount: 1,
              usedExplainCount: 1,
              lastAnsweredAt: '2026-07-26T09:00:00.000Z',
              events: []
            }
          }
        }
      },
      events: [],
      updatedAt: '2026-07-26T09:00:00.000Z'
    }
  };
}

async function importAdaptiveController(cacheBuster) {
  const moduleUrl = `${pathToFileURL(adaptiveControllerPath).href}?audit=${cacheBuster}`;
  return import(moduleUrl);
}

async function main() {
  const adaptiveSource = fs.readFileSync(adaptiveControllerPath, 'utf8');
  const studentDashboardSource = fs.readFileSync(studentDashboardPath, 'utf8');
  const fixedNowIso = '2026-07-26T10:00:00.000Z';

  assert(
    !/process\.env\.[A-Z0-9_]+/.test(adaptiveSource),
    'adaptiveController still contains direct process.env property access.',
    adaptiveControllerPath
  );

  assert(
    /typeof process !== ['"]undefined['"]/.test(adaptiveSource),
    'adaptiveController is missing a process guard.',
    adaptiveControllerPath
  );

  const originalProcess = globalThis.process;
  try {
    globalThis.process = undefined;
    const adaptive = await importAdaptiveController(Date.now());
    const profile = createFixtureProfile();

    assert(typeof adaptive.isDebugEnabled === 'function', 'adaptiveController does not export isDebugEnabled().');
    assert(typeof adaptive.buildAdaptiveLearningSnapshot === 'function', 'adaptiveController does not export buildAdaptiveLearningSnapshot().');

    const debugFlag = adaptive.isDebugEnabled();
    assert(debugFlag === false, 'isDebugEnabled() should default to false without process/import.meta debug flags.');

    const snapshotWithoutProcess = adaptive.buildAdaptiveLearningSnapshot(profile, 'math', 'darab', { now: new Date(fixedNowIso) });
    assert(snapshotWithoutProcess && typeof snapshotWithoutProcess === 'object', 'buildAdaptiveLearningSnapshot() did not return an object.');
    assert(snapshotWithoutProcess.subjectId === 'math' && snapshotWithoutProcess.topicId === 'darab', 'Snapshot identity mismatch.');

    const dashboardFocus = { subjectId: 'math', topicId: 'darab' };
    assert(
      /buildAdaptiveLearningSnapshot\(adaptiveProfile \|\| profile, focus\.subjectId, focus\.topicId\)/.test(studentDashboardSource),
      'StudentDashboard snapshot flow no longer uses the expected adaptive snapshot builder.'
    );
    const dashboardSnapshot = adaptive.buildAdaptiveLearningSnapshot(profile, dashboardFocus.subjectId, dashboardFocus.topicId, { now: new Date(fixedNowIso) });
    assert(dashboardSnapshot.reason === snapshotWithoutProcess.reason, 'StudentDashboard-equivalent snapshot creation changed unexpectedly.');

    globalThis.process = originalProcess;
    const adaptiveWithProcess = await importAdaptiveController(Date.now() + 1);
    const snapshotWithProcess = adaptiveWithProcess.buildAdaptiveLearningSnapshot(createFixtureProfile(), 'math', 'darab', { now: new Date(fixedNowIso) });

    assert(
      JSON.stringify(snapshotWithoutProcess) === JSON.stringify(snapshotWithProcess),
      'Adaptive snapshot output changed between browser-like and normal Node environments.',
      JSON.stringify({ withoutProcess: snapshotWithoutProcess, withProcess: snapshotWithProcess }, null, 2)
    );

    const srcFiles = collectFiles(srcRoot);
    const unsafeMatches = srcFiles.flatMap((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      return findUnsafeNodeGlobalMatches(filePath, source).map((match) => ({
        file: path.relative(repoRoot, filePath),
        ...match
      }));
    });

    assert(
      unsafeMatches.length === 0,
      'Unsafe Node globals remain in browser runtime files.',
      unsafeMatches.map((match) => `${match.file}:${match.line} [${match.type}] ${match.snippet}`).join('\n')
    );

    console.log('v31BrowserEnvironmentAudit PASS');
    console.log(JSON.stringify({
      debugWithoutProcess: debugFlag,
      fixtureSnapshot: {
        subjectId: snapshotWithoutProcess.subjectId,
        topicId: snapshotWithoutProcess.topicId,
        mastery: snapshotWithoutProcess.mastery,
        recommendation: snapshotWithoutProcess.recommendation,
        reviewPriority: snapshotWithoutProcess.reviewPriority
      },
      studentDashboardSnapshotOk: true,
      unsafeMatches: unsafeMatches.length
    }, null, 2));
  } finally {
    globalThis.process = originalProcess;
  }
}

main().catch((error) => {
  console.error('v31BrowserEnvironmentAudit FAIL');
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
