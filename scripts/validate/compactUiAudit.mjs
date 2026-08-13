import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = [
  'src/App.jsx',
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
  'src/components/IconGlyph.jsx',
  'src/components/GameBadge.jsx',
  'src/components/SubjectBadge.jsx',
  'src/components/VoiceButton.jsx',
  'src/components/studyPlanner/StudyPlannerPanel.jsx',
  'src/components/studyPlanner/DailyPlanCard.jsx',
  'src/components/studyPlanner/WeeklyPlanList.jsx',
  'src/components/studyPlanner/StudyBlockItem.jsx',
  'src/styles/style.css',
  'package.json'
];

const REQUIRED_TOKENS = [
  'Pilih subjek',
  'subject-quick-switch',
  'dashboard-disclosure',
  'Ringkasan Murid',
  'Jadual Ulang Kaji',
  'Analitik & Kemajuan',
  'Sambung Belajar',
  'Sambung Latihan',
  'Pentaksiran Sumatif',
  'Bacaan',
  'Mendengar',
  'Bertutur',
  'Menulis',
  'Jumlah XP',
  'Tahap Semasa',
  'Kemajuan Tahap',
  'Streak Semasa',
  'Streak Terbaik',
  'Pencapaian Terkini',
  'Belum ada pencapaian',
  'Butiran Lanjut',
  'aria-label="Tutup"',
  'Contoh langkah demi langkah',
  'motion="hover"',
  "motion='pulse'",
  'motion="celebrate"',
  'motion="sound"',
  'motion="load"',
  'prefers-reduced-motion',
  'IconGlyph',
  'data-motion',
  'data-active',
  'focus-visible',
  'role="progressbar"',
  'aria-valuenow',
  'overflow-wrap: anywhere',
  'word-break: break-word'
];

const FORBIDDEN = [
  'href="#"',
  "href='#'",
  'javascript:void',
  '<img src="#"',
  'Current XP',
  'Current Level',
  'Progress to Next Level',
  'Latest Achievement',
  'Total Achievements',
  'Worked examples',
  'Ã¢',
  'Ã°',
  'Ãƒ',
  'ï¿½',
  'framer-motion',
  'lottie',
  'animejs'
];

const UI_FILE_CHECKS = [
  {
    file: 'src/dashboard/HomeDashboard.jsx',
    required: [
      'home-badge.webp',
      'nota-badge.webp',
      'buku-teks-badge.webp',
      'tutor-ai-badge.webp',
      'uasa-badge.webp',
      'ibu-bapa-badge.webp',
      'bm-badge.webp',
      'math-badge.webp',
      'english-badge.webp',
      'sains-badge.webp',
      'arab-badge.webp',
      'islam-badge.webp',
      'pj-badge.webp',
      'pk-badge.webp',
      'bacaan-badge.webp',
      'mendengar-badge.webp',
      'bertutur-badge.webp',
      'menulis-badge.webp',
      'ganjaran-badge.webp',
      'target-badge.webp',
      'clock-badge.webp',
      'fire-badge.webp',
      'bell-badge.webp',
      'IconGlyph name="spark"',
      'IconGlyph name="play"',
      'IconGlyph name="repeat"'
    ]
  },
  {
    file: 'src/components/gamification/GamificationPanel.jsx',
    required: [
      'Jumlah XP',
      'Tahap Semasa',
      'Streak Semasa',
      'Pencapaian Terkini'
    ]
  },
  {
    file: 'src/components/SubjectBadge.jsx',
    required: ['arab-badge.webp', 'islam-badge.webp', 'pj-badge.webp', 'pk-badge.webp']
  },
  {
    file: 'src/components/IconGlyph.jsx',
    required: ['motion = \'none\'', 'active = false', 'decorative = false', 'data-motion', 'data-active']
  },
  {
    file: 'src/styles/style.css',
    required: [
      '.subject-quick-switch',
      '.dashboard-disclosure',
      '.icon-glyph',
      '.quick-actions button',
      '.icon-button',
      '@media (prefers-reduced-motion: reduce)'
    ]
  },
  {
    file: 'src/components/ai/AIExplainModal.jsx',
    required: ['aria-label="Tutup"']
  },
  {
    file: 'src/components/ai/AITeacherModal.jsx',
    required: ['aria-label="Tutup"']
  }
];

function scanDuplicateIds(text) {
  const ids = new Map();
  const regex = /\bid\s*=\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(text))) {
    const id = match[1];
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  return [...ids.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }));
}

async function read(file) {
  return fs.readFile(path.join(ROOT, file), 'utf8');
}

async function main() {
  const contents = new Map();
  for (const file of FILES) {
    contents.set(file, await read(file));
  }

  const issues = [];
  const checks = [];

  const sourceBundle = FILES.map(file => `${file}\n${contents.get(file) || ''}`).join('\n');
  const duplicateIds = scanDuplicateIds(sourceBundle);
  checks.push({ type: 'duplicate-ids', pass: duplicateIds.length === 0, duplicateIds });
  if (duplicateIds.length) {
    issues.push({ scope: 'static', issue: 'Duplicate DOM IDs detected', details: duplicateIds });
  }

  for (const token of REQUIRED_TOKENS) {
    const found = [...contents.entries()].some(([, text]) => text.includes(token));
    checks.push({ type: 'required', token, pass: found });
    if (!found) {
      issues.push({ scope: 'required', issue: `Missing required token: ${token}` });
    }
  }

  for (const token of FORBIDDEN) {
    const foundFiles = [...contents.entries()]
      .filter(([, text]) => text.includes(token))
      .map(([file]) => file);
    checks.push({ type: 'forbidden', token, pass: foundFiles.length === 0, files: foundFiles });
    if (foundFiles.length) {
      issues.push({ scope: 'forbidden', issue: `Forbidden token present: ${token}`, files: foundFiles });
    }
  }

  for (const check of UI_FILE_CHECKS) {
    const text = contents.get(check.file) || '';
    const required = check.required || [];
    const missing = required.filter(token => !text.includes(token));
    checks.push({ type: 'file-check', file: check.file, pass: missing.length === 0, missing });
    if (missing.length) {
      issues.push({ file: check.file, issue: 'Missing required compact UI tokens', details: missing });
    }
  }

  const packageJson = JSON.parse(contents.get('package.json') || '{}');
  const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
  const largeAnimationDeps = ['framer-motion', 'lottie-web', 'animejs', '@lottiefiles/lottie-player'].filter(dep => dep in dependencies);
  checks.push({ type: 'animation-dependency', pass: largeAnimationDeps.length === 0, dependencies: largeAnimationDeps });
  if (largeAnimationDeps.length) {
    issues.push({ scope: 'package', issue: 'Large animation dependency found', dependencies: largeAnimationDeps });
  }

  const summary = {
    status: issues.length ? 'FAIL' : 'PASS',
    issueCount: issues.length,
    auditedFiles: FILES.length
  };

  console.log(JSON.stringify({ summary, checks, issues }, null, 2));
  process.exitCode = issues.length ? 1 : 0;
}

await main();
