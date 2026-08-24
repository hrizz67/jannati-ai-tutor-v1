import fs from 'node:fs';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const start = app.indexOf('async function startAdaptivePractice');
const end = app.indexOf('\n  function ', start + 20);
const source = app.slice(start, end > start ? end : start + 2200);
const issues = [];
if (!/resumeSubjectId\s*=/.test(source)) issues.push('resume_subject_id_missing');
if (!/resumeMatchesSelectedSubject/.test(source)) issues.push('resume_subject_guard_missing');
if (!/resumeMatchesSelectedSubject\s*&&/.test(source)) issues.push('resume_guard_not_applied');
console.log(JSON.stringify({ status: issues.length ? 'FAIL' : 'PASS', issueCount: issues.length, issues }, null, 2));
if (issues.length) process.exit(1);
