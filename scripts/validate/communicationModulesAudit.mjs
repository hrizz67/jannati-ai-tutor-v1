import fs from 'node:fs';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const count = (pattern) => (app.match(pattern) || []).length;
const arabic = /[\u0600-\u06ff]/;
const checks = {
  readingPoolDeclared: /readingPassages\.forEach\(item => \{[\s\S]*length: 30/.test(app),
  speakingPoolDeclared: /speakingPrompts\.forEach\(item => \{[\s\S]*length: 40/.test(app),
  writingPoolDeclared: /writingSets\.forEach\(item => \{[\s\S]*length: 50/.test(app),
  listeningPoolDeclared: /listeningSets\.forEach\(item => \{[\s\S]*length: 12/.test(app),
  arabicSourceText: arabic.test(app),
  uniqueSessionIds: /id: `\$\{item\.id\}-\$\{index \+ 1\}`/.test(app),
  noReplacementCharacter: !/[\uFFFD]/.test(app),
  noKnownMojibakeArabic: !/Ø§|Ù…|Ø°|Ø¹/.test(app)
};

const report = {
  status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
  checks,
  declaredPools: {
    readingPerLanguage: 30,
    speakingPerLanguage: 40,
    writingPerLanguage: 50,
    listeningPerLanguage: 12
  },
  sourceReferences: {
    reading: count(/readingPassages/g),
    listening: count(/listeningSets/g),
    speaking: count(/speakingPrompts/g),
    writing: count(/writingSets/g)
  }
};
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/communication-modules-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
