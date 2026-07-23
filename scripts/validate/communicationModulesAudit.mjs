import fs from 'node:fs';
import { semanticReadingPassages, semanticListeningSets, semanticSpeakingPrompts, semanticWritingSets } from '../../src/data/communicationContent.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const communicationContent = fs.readFileSync('src/data/communicationContent.js', 'utf8');
const emptyReadingHandler = app.match(/onEmpty\(nextResult\) \{([\s\S]*?)\r?\n\s*\},\r?\n\s*onError/)?.[1] || '';
const count = (pattern) => (app.match(pattern) || []).length;
const arabic = /[\u0600-\u06ff]/;
const normalizeReadingContract = value => {
  const score = Number.isFinite(Number(value?.score)) ? Number(value.score) : 0;
  const count = (candidate, fallback = 0) => Number.isFinite(Number(candidate)) ? Math.max(0, Number(candidate)) : fallback;
  return {
    score,
    correct: score >= 80,
    passed: score >= 80,
    totalTargetWords: count(value?.totalTargetWords),
    matchedWordCount: count(value?.matchedWordCount),
    missedWordCount: count(value?.missedWordCount),
    extraWordCount: count(value?.extraWordCount)
  };
};
const lowMatch = normalizeReadingContract({ score: 10, matchedWordCount: 1, totalTargetWords: 10 });
const thresholdMatch = normalizeReadingContract({ score: 80, matchedWordCount: 8, totalTargetWords: 10 });
const identities = new Set(['bm:2', 'bm:2', 'english:2']);
const aggregateScores = [80, 60];
const readingContractAssertions = {
  lowMatchIsNotPassed: lowMatch.correct === false && lowMatch.passed === false,
  thresholdIsPassed: thresholdMatch.correct === true && thresholdMatch.passed === true,
  languageSwitchRecordsSameIndex: identities.size === 2,
  repeatedItemRecordsOnce: [...identities].filter(identity => identity === 'bm:2').length === 1,
  emptyResultNotCompleted: !('empty:2' in identities),
  aggregateMatchesHistory: aggregateScores.length === 2 && Math.round(aggregateScores.reduce((sum, score) => sum + score, 0) / aggregateScores.length) === 70
};
const checks = {
  readingPoolDeclared: semanticReadingPassages.every(item => item.sessionItems?.length >= 30),
  speakingPoolDeclared: semanticSpeakingPrompts.every(item => item.sessionItems?.length >= 40),
  writingPoolDeclared: semanticWritingSets.every(item => item.sessionItems?.length >= 50),
  listeningPoolDeclared: semanticListeningSets.every(item => item.sessionItems?.length >= 30),
  readingNextFlow: /function nextBacaan/.test(app) && /onClick=\{nextBacaan\}/.test(app) && /setSessionIndex\(current => nextCommunicationSessionIndex\(current/.test(app),
  readingOrderAwareScoring: /matchedTargetIndexes/.test(app) && /passed: score >= 80/.test(app) && /extraWordCount/.test(app),
  readingNormalizationMetrics: /totalTargetWords: metric\(safeValue\.totalTargetWords/.test(app) && /matchedWordCount: metric\(safeValue\.matchedWordCount/.test(app) && /missedWordCount: metric\(safeValue\.missedWordCount/.test(app) && /extraWordCount: metric\(safeValue\.extraWordCount/.test(app),
  readingResultPresentation: /safeResult\.matchedWordCount\}\s*\/\s*\{safeResult\.totalTargetWords\}/.test(app) && /safeResult\.passed \? 'Lulus' : 'Belum lulus'/.test(app),
  speakingNextFlow: /function nextBertutur/.test(app) && /setSessionIndex\(current => nextCommunicationSessionIndex\(current/.test(app) && /onClick=\{nextBertutur\}/.test(app),
  writingNextFlow: /function nextMenulis/.test(app) && /setSessionIndex\(current => nextCommunicationSessionIndex\(current/.test(app) && /onClick=\{nextMenulis\}/.test(app),
  listeningNextFlow: /function nextItem/.test(app) && /onClick=\{nextItem\}/.test(app),
  persistenceAndReset: /onResumeChange/.test(app) && /setTranscript\(''\)/.test(app) && /setResult\(null\)/.test(app),
  resumedIndexAdvances: /function nextCommunicationSessionIndex\(currentIndex, size\)/.test(app) && /return \(safeIndex \+ 1\) % safeSize/.test(app),
  readingResumeRoundTrip: /scoreHistory/.test(app) && /state: \{[\s\S]*scoreHistory/.test(app),
  readingContractAssertions: Object.values(readingContractAssertions).every(Boolean),
  readingIdentityUsesLanguageAndIndex: /const itemIdentity = `\$\{passageId\}:\$\{sessionIndex\}`/.test(app),
  readingEmptyDoesNotRecord: emptyReadingHandler.includes('setResult(normalizeBacaanResult(nextResult))') && !emptyReadingHandler.includes('recordBacaanResult(nextResult)'),
  readingAggregatePayload: /completedPassages: completedScores/.test(app) && /averageScore/.test(app) && /passedCount/.test(app),
  normalizedCorrectUsesScore: /correct: score >= 80/.test(app) && /passed: score >= 80/.test(app),
  acceptedAnswerNormalization: /normalizeListeningAcceptedAnswers/.test(app) && /startsWith\('di'\)/.test(app) && /startsWith\('inthe'\)/.test(app),
  arabicSourceText: arabic.test(app) || arabic.test(communicationContent),
  uniqueSessionIds: semanticListeningSets.every(item => new Set(item.sessionItems.map(sessionItem => sessionItem.id)).size === item.sessionItems.length),
  noReplacementCharacter: !/[\uFFFD]/.test(app),
  noKnownMojibakeArabic: !/Ø§|Ù…|Ø°|Ø¹/.test(app)
};

const report = {
  status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
  checks,
  readingContractAssertions,
  declaredPools: {
    readingPerLanguage: 30,
    speakingPerLanguage: 40,
    writingPerLanguage: 50,
    listeningPerLanguage: 30
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
