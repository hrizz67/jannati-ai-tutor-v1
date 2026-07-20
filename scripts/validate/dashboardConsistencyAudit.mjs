import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = [
  'src/data/subjects/index.js',
  'src/dashboard/HomeDashboard.jsx',
  'src/dashboard/ParentDashboard.jsx',
  'src/dashboard/StudentDashboard.jsx',
  'src/dashboard/dashboardHelpers.jsx',
  'src/parentInsights/insightsService.js',
  'src/parentInsights/summaryBuilder.js',
  'src/utils/displayFormatter.js',
  'src/styles/style.css'
];

const REQUIRED_SUBJECT_IDS = ['bm', 'math', 'english', 'sains', 'arab', 'islam', 'pj', 'pk'];

const REQUIRED_HOME_TOKENS = [
  'subject-quick-switch-shell',
  'subjectRailRef',
  'subjectButtonRefs',
  'visibleSubjects',
  'scrollIntoView',
  'Subjek sebelumnya',
  'Subjek seterusnya',
  'scrollSubjectSwitcher',
  'goToAdjacentSubject'
];

const REQUIRED_NAME_TOKENS = [
  'getStudentDisplayName'
];

const FORBIDDEN_TOKENS = [
  'Demo Murid',
  "profile.name || 'Anak'",
  'Ã¢',
  'Ã°',
  'Ãƒ',
  'ï¿½'
];

function read(file) {
  return fs.readFile(path.join(ROOT, file), 'utf8');
}

function unique(values) {
  return [...new Set(values)];
}

function parseSubjectIds(text) {
  const ids = [];
  const regex = /"id"\s*:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(text))) {
    ids.push(match[1]);
  }
  return ids;
}

async function main() {
  const contents = new Map();
  for (const file of FILES) {
    contents.set(file, await read(file));
  }

  const issues = [];

  const indexText = contents.get('src/data/subjects/index.js') || '';
  const subjectIds = parseSubjectIds(indexText);
  const subjectIdSet = unique(subjectIds);
  const missingSubjects = REQUIRED_SUBJECT_IDS.filter(id => !subjectIdSet.includes(id));
  const duplicateSubjects = subjectIds.filter((id, idx) => subjectIds.indexOf(id) !== idx);
  if (missingSubjects.length || duplicateSubjects.length) {
    issues.push({
      file: 'src/data/subjects/index.js',
      issue: 'Subject registry mismatch',
      missingSubjects,
      duplicateSubjects
    });
  }

  const homeText = contents.get('src/dashboard/HomeDashboard.jsx') || '';
  const homeMissing = REQUIRED_HOME_TOKENS.filter(token => !homeText.includes(token));
  if (homeMissing.length) {
    issues.push({
      file: 'src/dashboard/HomeDashboard.jsx',
      issue: 'Subject switcher visibility tokens missing',
      missingTokens: homeMissing
    });
  }

  const nameFiles = [
    'src/dashboard/HomeDashboard.jsx',
    'src/dashboard/ParentDashboard.jsx',
    'src/dashboard/StudentDashboard.jsx',
    'src/dashboard/dashboardHelpers.jsx',
    'src/parentInsights/insightsService.js',
    'src/parentInsights/summaryBuilder.js',
    'src/utils/displayFormatter.js'
  ];

  for (const file of nameFiles) {
    const text = contents.get(file) || '';
    const missing = REQUIRED_NAME_TOKENS.filter(token => !text.includes(token));
    if (missing.length) {
      issues.push({
        file,
        issue: 'Student name helper contract incomplete',
        missingTokens: missing
      });
    }
  }

  const styleText = contents.get('src/styles/style.css') || '';
  const styleMissing = ['.subject-quick-switch-shell', '.subject-quick-switch', '.subject-switch-arrow', 'width: 100%'].filter(token => !styleText.includes(token));
  if (styleMissing.length) {
    issues.push({
      file: 'src/styles/style.css',
      issue: 'Subject switcher layout tokens missing',
      missingTokens: styleMissing
    });
  }

  for (const token of FORBIDDEN_TOKENS) {
    const files = [...contents.entries()]
      .filter(([, text]) => text.includes(token))
      .map(([file]) => file);
    if (files.length) {
      issues.push({
        issue: `Forbidden token detected: ${token}`,
        files
      });
    }
  }

  const summary = {
    status: issues.length ? 'FAIL' : 'PASS',
    auditedFiles: FILES.length,
    subjectIds,
    missingSubjects,
    duplicateSubjects,
    issueCount: issues.length
  };

  console.log(JSON.stringify({ summary, issues }, null, 2));
  process.exitCode = issues.length ? 1 : 0;
}

await main();
