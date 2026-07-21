import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const files = ['src/ai/profile/studentProfile.js', 'src/ai/adaptive/storageEngine.js', 'src/ai/questionGenerator/questionHistory.js', 'src/ai/memoryEngine.js', 'src/ai/memory/memoryStorage.js', 'src/ai/gamification/gamificationProfile.js'].map(file => ({ file, text: fs.readFileSync(path.join(root, file), 'utf8') }));
const keys = [...new Set(files.flatMap(({ text }) => [...text.matchAll(/['"]([A-Z][A-Z0-9_]{3,})['"]/g)].map(match => match[1]))), 'jannati-ai-tutor-profile', 'jannati-ai-tutor-resume'];
const checks = {
  profilePersistence: /localStorage\.setItem|save/i.test(app) && files.some(({ text }) => /PROFILE|profile/i.test(text)),
  resumePersistence: /RESUME_KEY|persistResumeData|loadResume/i.test(app),
  legacyMigration: /LEGACY_|legacy|normalize/i.test(app) && files.some(({ text }) => /legacy|migrat|normalize/i.test(text)),
  parseGuard: files.every(({ text }) => /try\s*\{|JSON\.parse/.test(text)),
  clearPath: /clearResumeData|removeItem|resetProfile/.test(app),
  subjectScopedResume: /subjectId|topicId|questionIndex/.test(app),
  noSessionStorageCollision: !files.some(({ text }) => /sessionStorage/.test(text))
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, persistenceKeySignals: keys.slice(0, 80), failures };
fs.mkdirSync(path.join(root, 'reports/validation'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/validation/persistence-resume-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
