import { readFile } from 'node:fs/promises';

const root = process.cwd();

const checks = [
  {
    file: 'src/data/subjects/bm.js',
    required: ['"icon": "📘"'],
    forbidden: ['"icon": "??"']
  },
  {
    file: 'src/components/gamification/GamificationPanel.jsx',
    required: [
      'XP Semasa',
      'Tahap Semasa',
      'Kemajuan ke Tahap Seterusnya',
      'Streak Semasa',
      'Streak Terbaik',
      'Pencapaian Terkini',
      'Belum ada pencapaian'
    ],
    forbidden: ['Current XP', 'Current Level', 'Progress to Next Level', 'Latest Achievement', 'Total Achievements']
  },
  {
    file: 'src/components/gamification/AchievementBadge.jsx',
    required: ['IconGlyph name="trophy"'],
    forbidden: ['ðŸŽ', 'Ã°Å¸Ââ€ ']
  },
  {
    file: 'src/components/ai/AIExplainModal.jsx',
    required: ['aria-label="Tutup"', 'Contoh langkah demi langkah', '×'],
    forbidden: ['Ãƒâ€”', 'Worked examples']
  },
  {
    file: 'src/components/ai/AITeacherModal.jsx',
    required: ['aria-label="Tutup"', 'Contoh langkah demi langkah', '×'],
    forbidden: ['Ãƒâ€”', 'Worked examples']
  },
  {
    file: 'src/dashboard/HomeDashboard.jsx',
    required: [
      'subject-quick-switch',
      'dashboard-disclosure',
      'Pilih subjek',
      'Ringkasan Murid',
      'Jadual Ulang Kaji',
      'Analitik & Kemajuan',
      'Sambung Belajar',
      'Sambung Latihan',
      'Simulator UASA',
      'Bacaan',
      'Mendengar',
      'Bertutur',
      'Menulis',
      'IconGlyph name="home"',
      'IconGlyph name="bot"',
      'IconGlyph name="trophy"',
      'IconGlyph name="family"',
      'IconGlyph name="spark"',
      'IconGlyph name="play"',
      'IconGlyph name="repeat"',
      'IconGlyph name="headphones"',
      'IconGlyph name="mic"',
      'IconGlyph name="pen"',
      'IconGlyph name="target"',
      'IconGlyph name="fire"'
    ],
    forbidden: ['Current XP', 'Current Level', 'Progress to Next Level', 'Latest Achievement', 'Total Achievements', 'Ã¢â‚¬Â¢', 'Ã°Å¸', 'Ãƒâ€”']
  },
  {
    file: 'src/dashboard/AnalyticsDashboard.jsx',
    required: [
      'IconGlyph name="book"',
      'IconGlyph name="chart"',
      'IconGlyph name="trophy"',
      'IconGlyph name="play"',
      'IconGlyph name="repeat"',
      'IconGlyph name="gift"',
      'IconGlyph name="check"'
    ],
    forbidden: ['Current XP', 'Current Level', 'Progress to Next Level', 'Latest Achievement', 'Total Achievements', 'Ã¢â‚¬Â¢', 'Ã°Å¸', 'Ãƒâ€”']
  },
  {
    file: 'src/dashboard/dashboardHelpers.jsx',
    required: ['IconGlyph name="bell"'],
    forbidden: ['Ã¢â‚¬Â¢', 'Ã°Å¸', 'Ãƒâ€”']
  },
  {
    file: 'src/components/IconGlyph.jsx',
    required: ['target:', 'check:', 'gift:', 'motion = \'none\'', 'active = false', 'decorative = false'],
    forbidden: []
  },
  {
    file: 'src/styles/style.css',
    required: [
      '.icon-glyph',
      '.quick-actions button',
      '.icon-button',
      '.subject-quick-switch',
      '.dashboard-disclosure',
      '@media (prefers-reduced-motion: reduce)'
    ],
    forbidden: ['Current XP', 'Current Level', 'Progress to Next Level']
  }
];

function reportIssue(file, issue) {
  return `${file}: ${issue}`;
}

async function main() {
  const issues = [];
  for (const check of checks) {
    const filePath = `${root}\\${check.file}`;
    const text = await readFile(filePath, 'utf8');
    for (const token of check.required || []) {
      if (!text.includes(token)) {
        issues.push(reportIssue(check.file, `missing required text: ${token}`));
      }
    }
    for (const token of check.forbidden || []) {
      if (text.includes(token)) {
        issues.push(reportIssue(check.file, `forbidden text present: ${token}`));
      }
    }
  }

  const result = {
    status: issues.length ? 'FAIL' : 'PASS',
    issueCount: issues.length,
    issues
  };

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = issues.length ? 1 : 0;
}

main().catch(error => {
  console.error(JSON.stringify({ status: 'FAIL', error: error.message || String(error) }, null, 2));
  process.exit(1);
});
