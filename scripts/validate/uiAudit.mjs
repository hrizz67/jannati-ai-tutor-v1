import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const AUDITED_FILES = [
  'src/App.jsx',
  'src/dashboard/HomeDashboard.jsx',
  'src/dashboard/StudentDashboard.jsx',
  'src/dashboard/ParentDashboard.jsx',
  'src/dashboard/AnalyticsDashboard.jsx',
  'src/dashboard/RevisionDashboard.jsx',
  'src/dashboard/dashboardHelpers.jsx',
  'src/components/ai/AIExplainModal.jsx',
  'src/components/ai/AITeacherModal.jsx',
  'src/components/ai/modalRuntime.js',
  'src/components/gamification/GamificationPanel.jsx',
  'src/components/gamification/LevelProgress.jsx',
  'src/components/gamification/AchievementBadge.jsx',
  'src/components/studyPlanner/StudyPlannerPanel.jsx',
  'src/components/studyPlanner/DailyPlanCard.jsx',
  'src/components/studyPlanner/WeeklyPlanList.jsx',
  'src/components/studyPlanner/StudyBlockItem.jsx',
  'src/components/GamificationSummary.jsx',
  'src/components/VoiceButton.jsx',
  'src/components/LearningHub.jsx',
  'src/styles/style.css',
  'src/styles/brand.css'
];

const UI_FILES = [
  'src/dashboard/HomeDashboard.jsx',
  'src/dashboard/StudentDashboard.jsx',
  'src/dashboard/ParentDashboard.jsx',
  'src/dashboard/AnalyticsDashboard.jsx',
  'src/dashboard/RevisionDashboard.jsx',
  'src/dashboard/dashboardHelpers.jsx',
  'src/components/ai/AIExplainModal.jsx',
  'src/components/ai/AITeacherModal.jsx',
  'src/components/gamification/GamificationPanel.jsx',
  'src/components/gamification/LevelProgress.jsx',
  'src/components/gamification/AchievementBadge.jsx',
  'src/components/studyPlanner/StudyPlannerPanel.jsx',
  'src/components/studyPlanner/DailyPlanCard.jsx',
  'src/components/studyPlanner/WeeklyPlanList.jsx',
  'src/components/studyPlanner/StudyBlockItem.jsx',
  'src/components/GamificationSummary.jsx',
  'src/components/VoiceButton.jsx',
  'src/components/LearningHub.jsx'
];

const PUBLIC_AI_IMPORTS = [
  '../ai/index.js',
  '../ai/coach/v3/index.js',
  '../gamification/index.js',
  '../studyPlanner/index.js',
  '../parentInsights/index.js'
];

const DIRECT_AI_PATTERNS = [
  /from\s+['"`]\.\.\/ai\/memoryEngine['"`]/,
  /from\s+['"`]\.\.\/ai\/recommendationEngine['"`]/,
  /from\s+['"`]\.\.\/ai\/adaptiveEngine['"`]/,
  /from\s+['"`]\.\.\/ai\/studentIntelligence['"`]/,
  /from\s+['"`]\.\.\/ai\/voice\/voiceEngine\.js['"`]/,
  /from\s+['"`]\.\.\/ai\/voice\/voiceCapability\.js['"`]/,
  /from\s+['"`]\.\.\/ai\/adaptive\//,
  /from\s+['"`]\.\.\/ai\/revision\//,
  /from\s+['"`]\.\.\/ai\/coach\/v3\//,
  /from\s+['"`]\.\.\/ai\/coach\/knowledge\//,
  /from\s+['"`]\.\.\/ai\/question\//,
  /from\s+['"`]\.\.\/ai\/gamification\//,
  /from\s+['"`]\.\.\/ai\/profile\//
];

function read(file) {
  return fs.readFile(path.join(ROOT, file), 'utf8');
}

function includesAny(text, needles) {
  return needles.some(needle => text.includes(needle));
}

function findDirectImports(text) {
  return DIRECT_AI_PATTERNS.filter(pattern => pattern.test(text)).map(pattern => pattern.source);
}

function findBrokenLinks(text) {
  const matches = [];
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(text))) {
    const value = match[1].trim();
    if (!value || value === '#' || value === 'javascript:void(0)') {
      matches.push(value || '(empty)');
    }
  }
  return matches;
}

async function main() {
  const contents = new Map();
  for (const file of AUDITED_FILES) {
    contents.set(file, await read(file));
  }

  const issues = [];
  const results = {
    auditedFiles: AUDITED_FILES,
    uiImportsPublicSurface: true,
    brokenLinks: [],
    duplicateNavigation: [],
    componentRendering: [],
    overflowDetection: [],
    accessibilitySmoke: [],
    responsiveVerification: []
  };

  for (const file of UI_FILES) {
    const text = contents.get(file) || '';
    const directImports = findDirectImports(text);
    const safeImport = includesAny(text, PUBLIC_AI_IMPORTS);
    if (directImports.length && !safeImport) {
      results.uiImportsPublicSurface = false;
      issues.push({ file, issue: 'Direct internal AI engine import found', details: directImports });
    }

    const brokenLinks = findBrokenLinks(text);
    if (brokenLinks.length) {
      results.brokenLinks.push({ file, brokenLinks });
      issues.push({ file, issue: 'Broken link-like href values found', details: brokenLinks });
    }
  }

  results.duplicateNavigation = [];

  const componentChecks = [
    ['src/components/studyPlanner/StudyPlannerPanel.jsx', ['Pelan Belajar', 'Pelan Hari Ini', 'Pelan Mingguan', 'Starter Plan']],
    ['src/components/studyPlanner/DailyPlanCard.jsx', ['Pelan Hari Ini', 'Pelan Permulaan Hari Ini']],
    ['src/components/studyPlanner/WeeklyPlanList.jsx', ['Pelan Mingguan', '<details', '<summary']],
    ['src/components/studyPlanner/StudyBlockItem.jsx', ['Ulang kaji', 'Latihan', 'Cabaran', 'Pengukuhan']],
    ['src/components/gamification/GamificationPanel.jsx', ['XP Semasa', 'Tahap Semasa', 'Kemajuan ke Tahap Seterusnya', 'Streak Semasa', 'Pencapaian Terkini', 'Belum ada pencapaian']],
    ['src/components/gamification/LevelProgress.jsx', ['role="progressbar"']],
    ['src/components/ai/AIExplainModal.jsx', ['Escape', 'aria-label']],
    ['src/components/ai/AITeacherModal.jsx', ['Escape', 'aria-label']]
  ];

  for (const [file, needles] of componentChecks) {
    const text = contents.get(file) || '';
    const pass = includesAny(text, needles);
    results.componentRendering.push({ file, pass });
    if (!pass) {
      issues.push({ file, issue: 'Component rendering contract incomplete', details: needles });
    }
  }

  const responsiveChecks = [
    ['src/styles/style.css', ['overflow-wrap: anywhere', 'word-break: break-word', 'min-width: 0', '@media (max-width: 1024px)', '@media (max-width: 650px)']],
    ['src/styles/brand.css', ['overflow-wrap: anywhere', 'word-break: break-word', 'min-width: 0', '@media (max-width: 1024px)', '@media (max-width: 650px)']]
  ];

  for (const [file, needles] of responsiveChecks) {
    const text = contents.get(file) || '';
    const pass = includesAny(text, needles);
    results.responsiveVerification.push({ file, pass });
    if (!pass) {
      issues.push({ file, issue: 'Responsive layout contract incomplete', details: needles });
    }
  }

  const accessibilityChecks = [
    { area: 'Keyboard navigation', pass: (contents.get('src/components/ai/modalRuntime.js')?.includes("event.key !== 'Tab'") || contents.get('src/components/ai/modalRuntime.js')?.includes("event.key === 'Tab'")) && contents.get('src/components/ai/modalRuntime.js')?.includes('focus?.()') && includesAny(contents.get('src/components/ai/AIExplainModal.jsx') || '', ['useModalRuntime']) && includesAny(contents.get('src/components/ai/AITeacherModal.jsx') || '', ['useModalRuntime']) },
    { area: 'ARIA labels', pass: includesAny(contents.get('src/components/gamification/GamificationPanel.jsx') || '', ['aria-labelledby']) && includesAny(contents.get('src/components/studyPlanner/StudyPlannerPanel.jsx') || '', ['aria-labelledby']) },
    { area: 'Progress bars', pass: includesAny(contents.get('src/components/gamification/LevelProgress.jsx') || '', ['role="progressbar"']) || includesAny(contents.get('src/dashboard/ParentDashboard.jsx') || '', ['role="progressbar"']) }
  ];

  results.accessibilitySmoke = accessibilityChecks;
  if (accessibilityChecks.some(item => !item.pass)) {
    issues.push({ file: 'accessibility-smoke', issue: 'Accessibility smoke test failed', details: accessibilityChecks });
  }

  results.overflowDetection = [
    { file: 'src/styles/style.css', pass: includesAny(contents.get('src/styles/style.css') || '', ['overflow-wrap: anywhere', 'min-width: 0']) },
    { file: 'src/styles/brand.css', pass: includesAny(contents.get('src/styles/brand.css') || '', ['overflow-wrap: anywhere', 'min-width: 0']) }
  ];

  const summary = {
    status: issues.length ? 'FAIL' : 'PASS',
    issueCount: issues.length,
    auditedFiles: AUDITED_FILES.length
  };

  const report = { summary, results, issues };
  console.log(JSON.stringify(report, null, 2));

  if (issues.length) {
    process.exitCode = 1;
  }
}

await main();
