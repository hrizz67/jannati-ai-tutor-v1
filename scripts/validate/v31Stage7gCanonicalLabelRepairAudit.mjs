import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const appPath = path.join(root, 'src/App.jsx');
const contentPath = path.join(root, 'src/data/communicationContent.js');
const app = fs.readFileSync(appPath, 'utf8');
const content = fs.readFileSync(contentPath, 'utf8');
const resumeStorage = fs.readFileSync(path.join(root, 'src/utils/resumeStorage.js'), 'utf8');
const formatter = await import(pathToFileURL(path.join(root, 'src/utils/displayFormatter.js')).href + `?t=${Date.now()}`);
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const bertuturHeading = formatter.formatScopeLabel('BM Bertutur 2');
const topicHeading = formatter.formatTopicName('bm_intro', { subjectId: 'bm_bertutur_2' });

assert(bertuturHeading === 'Bertutur Bahasa Melayu Tahun 2', 'Bertutur heading fixture must canonicalize BM Bertutur 2');
assert(bertuturHeading !== 'BM Bertutur 2', 'Bertutur heading must not retain BM Bertutur 2');
assert(topicHeading === 'Pengenalan Bertutur', 'Bertutur topic fixture must canonicalize Bm Intro');
assert(app.includes("formatScopeLabel, formatStatus"), 'App must import the shared formatScopeLabel formatter');
assert(app.includes("const set = rawSet ? { ...rawSet, title: formatScopeLabel(rawSetTitle) } : rawSet;"), 'Bertutur display title must use the shared formatter at the display boundary');
assert(app.includes('<h1>{set.title}</h1>'), 'Bertutur heading must render the canonical display title');
assert(app.includes('const rawSetTitle = rawSet?.title ||'), 'Raw Bertutur title must remain available separately');
assert(app.includes('subjectTitle: rawSetTitle'), 'Resume metadata must preserve the raw Bertutur title');
assert(app.includes('title: rawSetTitle'), 'Finish/session payload must preserve the raw Bertutur title');
assert(content.includes('title: `${language} Bertutur ${index + 1}`'), 'Raw communication title source must remain unchanged');
assert(app.includes('function recordCommunicationScore('), 'Communication scoring helper must remain present');
assert(app.includes('itemKey: `${setId}:${mode}:${sessionIndex}`'), 'Communication session identity must remain unchanged');
assert(resumeStorage.includes("RESUME_KEY = 'jannati_v151_resume';"), 'Resume storage key must remain unchanged');
assert(app.includes("const PROFILE_KEY = 'jannati_v151_profile';"), 'Profile storage key must remain unchanged');
assert(!app.includes('BM Bertutur 2</h1>'), 'Raw BM Bertutur 2 must not be a visible heading');

if (failures.length) {
  console.error('Stage 7G canonical-label repair audit FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Stage 7G canonical-label repair audit PASS');
console.log(JSON.stringify({ bertuturHeading, topicHeading, rawTitleSourcePreserved: true, scoringSessionStorageContractsPreserved: true }, null, 2));
