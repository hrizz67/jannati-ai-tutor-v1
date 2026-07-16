import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');
const reportDir = path.join(root, 'reports', 'validation');
const reportJsonPath = path.join(reportDir, 'knowledge-report.json');
const reportDocPath = path.join(root, 'docs', 'KNOWLEDGE_ENGINE_VALIDATION_REPORT.md');

const CORE_MINIMUMS = {
  teacherExplanation: 4,
  examples: 10,
  extraExamples: 8,
  tips: 5,
  memoryTips: 5,
  commonMistakes: 5,
  keywords: 12,
  questionPatterns: 8,
  wrongAnswerPatterns: 6,
  followUpQuestions: 8,
  encouragement: { correct: 10, retry: 10, excellent: 10 }
};

const SUBJECT_RULES = {
  math: {
    workedExamples: 5,
    problemSolvingSteps: 5
  },
  sains: {
    scientificFacts: 8,
    observationPrompts: 6,
    comparisonPrompts: 5,
    investigationIdeas: 4,
    realLifeConnections: 5,
    safetyNotes: 3,
    misconceptions: 5,
    evidenceQuestions: 6
  },
  arab: {
    pronunciationTips: 5,
    letterRecognitionTips: 5,
    writingTips: 5,
    vocabularyGroups: 4,
    translationHints: 4,
    readingPractice: 4,
    listeningPractice: 4,
    speakingPractice: 4,
    writingPractice: 4,
    commonPronunciationMistakes: 4
  },
  islam: {
    dailyPractice: 5,
    adabApplications: 5,
    realLifeExamples: 5,
    reflectionQuestions: 5,
    goodDeedsIdeas: 5,
    misconceptions: 5
  },
  pj: {
    movementSteps: 5,
    coordinationTips: 5,
    fitnessActivities: 5,
    warmUpIdeas: 4,
    coolDownIdeas: 4,
    safetyRules: 5,
    equipmentUse: 4,
    gameApplications: 5,
    bodyAwareness: 5,
    dailyMovementIdeas: 5
  },
  pk: {
    healthyHabits: 5,
    hygieneSteps: 5,
    nutritionTips: 5,
    personalSafety: 5,
    emotionSkills: 5,
    helpSeekingSteps: 4,
    realLifeScenarios: 5,
    bodyCare: 5,
    familyHealthIdeas: 4,
    dailyPractice: 5
  }
};

const ARABIC_FIELDS = [
  'pronunciationTips',
  'letterRecognitionTips',
  'writingTips',
  'vocabularyGroups',
  'translationHints',
  'readingPractice',
  'listeningPractice',
  'speakingPractice',
  'writingPractice',
  'commonPronunciationMistakes'
];

const LANGUAGE_RULES = {
  bm: {
    forbidden: ['gimana', 'silakan', 'berikanlah', 'kamu semua', 'tiada siapa', 'jawablah', 'boleh tak', 'tolonglah'],
    technical: ['engine', 'adaptive', 'prediction', 'confidence', 'memory profile', 'observation engine']
  },
  english: {
    robotic: ['according to the data', 'analysis shows', 'perform the task', 'selected because'],
    cefrOutliers: ['approximately', 'classification', 'imperative', 'conjunction', 'pronunciation', 'plurality', 'independently', 'comprehension']
  },
  islam: {
    terms: ['Allah SWT', 'Rasulullah SAW', 'Kalimah Syahadah']
  }
};

const PLACEHOLDER_PATTERNS = [
  /TODO/i,
  /TBD/i,
  /PLACEHOLDER/i,
  /Lorem ipsum/i,
  /^\?{2,3}$/,
  /\uFFFD/,
  /\\u[0-9a-fA-F]{4}/,
  /subjectId/i,
  /topicId/i
];

const GENERIC_SHARED_WORDING = new Set([
  'pilih jawapan yang betul',
  'baca soalan dengan teliti',
  'tak mengapa cuba lagi',
  'tak mengapa, cuba lagi',
  'bagus! kamu memahami topik ini dengan baik.',
  'syabas! jawapan kamu betul.',
  'hebat! kamu membaca dengan teliti.',
  'cemerlang! pilihan kamu tepat.',
  'mantap! teruskan usaha ini.',
  'baca soalan sekali lagi dengan perlahan.',
  'think about the naming word',
  'read the sentence once more',
  'choose the correct answer',
  'look for the naming word'
]);

function normalize(value = '') {
  return String(value).replace(/\s+/g, ' ').trim().toLowerCase();
}

function count(value) {
  return Array.isArray(value) ? value.length : 0;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function flattenStrings(value) {
  const out = [];
  const visit = item => {
    if (typeof item === 'string') {
      out.push(item);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item && typeof item === 'object') {
      Object.values(item).forEach(visit);
    }
  };
  visit(value);
  return out;
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function pushCountIssue(issues, severity, code, message, context, actual, minimum) {
  issues.push(issue(severity, code, message, { ...context, actual, minimum }));
}

async function loadSubjectData() {
  const subjectsModule = await import(`${pathToFileURL(path.join(root, 'src', 'data', 'subjects', 'index.js')).href}?v=${Date.now()}`);
  const registryModule = await import(`${pathToFileURL(path.join(root, 'src', 'ai', 'coach', 'knowledge', 'registry', 'knowledgeRegistry.js')).href}?v=${Date.now()}`);
  const loaderModule = await import(`${pathToFileURL(path.join(root, 'src', 'ai', 'coach', 'knowledge', 'loader', 'knowledgeLoader.js')).href}?v=${Date.now()}`);
  return { subjectsModule, registryModule, loaderModule };
}

function validatePackShape(pack, subjectId, topicId, subjectName, topicTitle, canonicalIds, aliasMap, issues) {
  const context = { subjectId, topicId, subjectName, topicTitle };
  const requiredStrings = ['subjectId', 'topicId', 'displayName', 'simpleExplanation', 'difficulty'];
  const requiredArrays = [
    'learningObjectives',
    'teacherExplanation',
    'examples',
    'extraExamples',
    'tips',
    'memoryTips',
    'commonMistakes',
    'keywords',
    'questionPatterns',
    'wrongAnswerPatterns',
    'followUpQuestions'
  ];

  for (const key of requiredStrings) {
    if (!nonEmptyString(pack?.[key])) {
      issues.push(issue('Critical', 'MISSING_FIELD', `Missing required string field: ${key}.`, { ...context, field: key }));
    }
  }
  for (const key of requiredArrays) {
    if (!Array.isArray(pack?.[key]) || pack[key].length === 0) {
      issues.push(issue('Critical', 'MISSING_FIELD', `Missing required array field: ${key}.`, { ...context, field: key }));
    }
  }
  if (!pack?.encouragement || typeof pack.encouragement !== 'object') {
    issues.push(issue('Critical', 'MISSING_FIELD', 'Missing encouragement object.', context));
  } else {
    for (const mood of ['correct', 'retry', 'excellent']) {
      if (!Array.isArray(pack.encouragement[mood]) || pack.encouragement[mood].length === 0) {
        issues.push(issue('Critical', 'MISSING_FIELD', `Missing encouragement.${mood}.`, { ...context, field: `encouragement.${mood}` }));
      }
    }
  }

  if (!canonicalIds.has(topicId) && !aliasMap.has(topicId)) {
    issues.push(issue('High', 'UNKNOWN_TOPIC', 'Loaded topic is not part of the subject bank or registered aliases.', context));
  }

  const topicMatches = pack?.topicId === topicId || (aliasMap.has(topicId) && pack?.topicId === aliasMap.get(topicId));
  if (pack?.subjectId !== subjectId || !topicMatches) {
    issues.push(issue('Critical', 'LOADER_MISMATCH', 'Loader returned pack with mismatched subject/topic ids.', {
      ...context,
      loadedSubjectId: pack?.subjectId ?? null,
      loadedTopicId: pack?.topicId ?? null
    }));
  }

  const minimums = {
    ...CORE_MINIMUMS,
    ...(SUBJECT_RULES[subjectId] || {})
  };

  for (const [field, min] of Object.entries(minimums)) {
    if (field === 'encouragement') {
      for (const [mood, moodMin] of Object.entries(min)) {
        const actual = count(pack?.encouragement?.[mood]);
        if (actual < moodMin) {
          pushCountIssue(issues, 'Critical', 'MINIMUM_COUNT_FAILURE', `Encouragement ${mood} below minimum.`, { ...context, field: `encouragement.${mood}` }, actual, moodMin);
        }
      }
      continue;
    }
    const actual = count(pack?.[field]);
    if (actual < min) {
      const severity = min >= 5 ? 'Critical' : 'High';
      pushCountIssue(issues, severity, 'MINIMUM_COUNT_FAILURE', `${field} below minimum.`, { ...context, field }, actual, min);
    }
  }
}

function validatePlaceholders(pack, subjectId, topicId, issues) {
  const context = { subjectId, topicId, displayName: pack?.displayName || '' };
  const strings = flattenStrings(pack);
  for (const value of strings) {
    const text = String(value);
    const normalized = normalize(text);
    if (!normalized) continue;
    if (PLACEHOLDER_PATTERNS.some(pattern => pattern.test(text))) {
      const severity = /TODO|TBD|PLACEHOLDER|Lorem ipsum/i.test(text) || /\uFFFD|\\u[0-9a-fA-F]{4}/.test(text) ? 'Critical' : 'High';
      issues.push(issue(severity, 'PLACEHOLDER', 'Placeholder literal found in knowledge pack.', { ...context, value: text }));
    }
  }
}

function validateLanguage(pack, subjectId, topicId, issues) {
  const context = { subjectId, topicId, displayName: pack?.displayName || '' };
  const { relatedTopics: _relatedTopics, ...languagePack } = pack || {};
  const fields = flattenStrings({
    teacherExplanation: pack?.teacherExplanation,
    simpleExplanation: pack?.simpleExplanation,
    examples: pack?.examples,
    extraExamples: pack?.extraExamples,
    tips: pack?.tips,
    memoryTips: pack?.memoryTips,
    commonMistakes: pack?.commonMistakes,
    questionPatterns: pack?.questionPatterns,
    wrongAnswerPatterns: pack?.wrongAnswerPatterns,
    followUpQuestions: pack?.followUpQuestions,
    encouragement: pack?.encouragement,
    ...languagePack
  });
  const joined = fields.map(value => normalize(value)).join(' | ');

  if (subjectId === 'bm') {
    for (const phrase of LANGUAGE_RULES.bm.forbidden) {
      if (joined.includes(phrase)) {
        issues.push(issue('Low', 'BM_LANGUAGE', 'Potential non-standard Malay wording detected.', { ...context, phrase }));
      }
    }
    for (const phrase of LANGUAGE_RULES.bm.technical) {
      if (joined.includes(phrase)) {
        issues.push(issue('Low', 'BM_LANGUAGE', 'Potentially technical English wording detected in Malay pack.', { ...context, phrase }));
      }
    }
  }

  if (subjectId === 'english') {
    for (const phrase of LANGUAGE_RULES.english.robotic) {
      if (joined.includes(phrase)) {
        issues.push(issue('Low', 'EN_LANGUAGE', 'Potential robotic English phrasing detected.', { ...context, phrase }));
      }
    }
    for (const phrase of LANGUAGE_RULES.english.cefrOutliers) {
      if (joined.includes(phrase)) {
        issues.push(issue('Low', 'EN_LANGUAGE', 'Potential CEFR outlier vocabulary detected.', { ...context, phrase }));
      }
    }
  }

  if (subjectId === 'arab') {
    const fieldValues = ARABIC_FIELDS.flatMap(field => (Array.isArray(pack?.[field]) ? pack[field] : []).map(value => ({ field, value: String(value) })));
    const hasArabicUnicode = fieldValues.some(entry => /[\u0600-\u06FF]/.test(entry.value));
    const hasMojibake = fieldValues.some(entry => /[\uFFFD]/.test(entry.value) || /\\u[0-9a-fA-F]{4}/.test(entry.value));

    if (!fieldValues.length || !hasArabicUnicode) {
      issues.push(issue('Critical', 'ARABIC_RENDERING', 'Arabic knowledge fields do not contain Arabic Unicode.', {
        ...context,
        fields: ARABIC_FIELDS
      }));
    }

    if (hasMojibake) {
      issues.push(issue('Critical', 'ARABIC_RENDERING', 'Arabic knowledge fields contain mojibake or literal escaped Unicode.', context));
    }
  }

  if (subjectId === 'islam') {
    if (/kalima syahadah/i.test(joined)) {
      issues.push(issue('Low', 'ISLAM_TERM', 'Found inconsistent Kalimah Syahadah spelling.', { ...context, phrase: 'Kalima syahadah' }));
    }
    for (const term of LANGUAGE_RULES.islam.terms) {
      if (joined.includes(normalize(term)) === false && joined.includes('syahadah')) {
        issues.push(issue('Info', 'ISLAM_TERM', 'Syahadah content should prefer the standard Kalimah Syahadah terminology.', { ...context, term }));
        break;
      }
    }
  }
}

function addDuplicateFinding(findings, severity, classification, field, value, count, subjects, context = {}) {
  findings.push({
    severity,
    classification,
    field,
    value,
    count,
    subjects: [...subjects].sort(),
    context
  });
}

function collectDuplicates(packs, fieldNames) {
  const groups = new Map();
  for (const pack of packs) {
    for (const field of fieldNames) {
      const values = Array.isArray(pack[field]) ? pack[field] : [];
      for (const item of values) {
        const text = normalize(item);
        if (!text) continue;
        const key = `${field}:${text}`;
        if (!groups.has(key)) groups.set(key, { field, value: text, occurrences: [] });
        groups.get(key).occurrences.push({
          subjectId: pack.subjectId,
          topicId: pack.topicId,
          displayName: pack.displayName
        });
      }
    }
  }

  const findings = [];
  for (const group of groups.values()) {
    if (group.occurrences.length < 2) continue;
    const subjects = new Set(group.occurrences.map(item => item.subjectId));
    const distinctTopics = new Set(group.occurrences.map(item => `${item.subjectId}:${item.topicId}`));
    const length = group.value.split(' ').filter(Boolean).length;
    let classification = 'acceptable shared wording';
    let severity = 'Info';

    if (group.occurrences.length >= 2 && distinctTopics.size === 1) {
      classification = 'confirmed duplicate';
      severity = 'Low';
    } else if (length >= 8) {
      classification = 'probable template reuse';
      severity = 'Low';
    }

    if (group.field === 'encouragement' && length <= 8) {
      classification = 'acceptable shared wording';
      severity = 'Info';
    }

    if (GENERIC_SHARED_WORDING.has(group.value)) {
      classification = 'acceptable shared wording';
      severity = 'Info';
    }

    addDuplicateFinding(findings, severity, classification, group.field, group.value, group.occurrences.length, subjects, {
      topics: group.occurrences.slice(0, 5)
    });
  }

  return findings.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function validateRelatedTopics(pack, subjectId, canonicalIds, aliasIds, allSubjectIds, issues) {
  const seen = new Set();
  for (const related of Array.isArray(pack?.relatedTopics) ? pack.relatedTopics : []) {
    const normalized = String(related || '').trim();
    if (!normalized) continue;
    if (seen.has(normalized)) {
      issues.push(issue('Low', 'DUPLICATE_RELATED_TOPIC', 'Duplicate related topic entry.', { subjectId, topicId: pack?.topicId, related }));
      continue;
    }
    seen.add(normalized);
    if (normalized === pack?.topicId) {
      issues.push(issue('Low', 'SELF_REFERENCE', 'Pack references itself in relatedTopics.', { subjectId, topicId: pack?.topicId, related }));
      continue;
    }
    if (canonicalIds.has(normalized) || aliasIds.has(normalized)) continue;
    if (allSubjectIds.has(normalized)) continue;
    issues.push(issue('Medium', 'UNKNOWN_RELATED_TOPIC', 'Related topic id does not exist in the registry.', {
      subjectId,
      topicId: pack?.topicId,
      related
    }));
  }
}

function buildSubjectSummary(subject, canonicalTopics, aliasTopics, packs, issues) {
  const subjectIssues = issues.filter(issue => issue.context?.subjectId === subject.id);
  return {
    subjectId: subject.id,
    title: subject.title,
    topics: canonicalTopics.length,
    packsValidated: packs.length,
    aliases: aliasTopics.length,
    issues: {
      Critical: subjectIssues.filter(issue => issue.severity === 'Critical').length,
      High: subjectIssues.filter(issue => issue.severity === 'High').length,
      Medium: subjectIssues.filter(issue => issue.severity === 'Medium').length,
      Low: subjectIssues.filter(issue => issue.severity === 'Low').length,
      Info: subjectIssues.filter(issue => issue.severity === 'Info').length
    }
  };
}

function markdownTable(rows, headers) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
  return [head, sep, body].join('\n');
}

async function main() {
  const { subjectsModule, registryModule, loaderModule } = await loadSubjectData();
  const subjects = await subjectsModule.loadAllSubjects();
  const subjectList = subjectsModule.subjectList || [];
  const registry = registryModule.KNOWLEDGE_REGISTRY;
  const loadKnowledge = loaderModule.loadKnowledge;

  const issues = [];
  const aliasFindings = [];
  const allPacks = [];
  const subjectSummaries = [];
  const knownTopicIds = new Set();

  const subjectById = new Map(subjectList.map(item => [item.id, item]));
  const allRegistryTopicIds = new Set();
  const aliasLookup = new Map();

  for (const subject of subjects) {
    const registryTopics = Object.keys(registry[subject.id] || {});
    const canonicalTopics = Array.isArray(subject.topics) ? subject.topics : [];
    canonicalTopics.forEach(topic => knownTopicIds.add(topic.id));
    registryTopics.forEach(topicId => allRegistryTopicIds.add(topicId));
    const canonicalIds = new Set(canonicalTopics.map(topic => topic.id));
    const aliasMap = new Map();
    const seenRegistryObjects = new WeakMap();
    for (const registryTopicId of registryTopics) {
      const value = registry[subject.id]?.[registryTopicId];
      if (!value || typeof value !== 'object') continue;
      if (!seenRegistryObjects.has(value)) {
        seenRegistryObjects.set(value, registryTopicId);
      } else if (!aliasMap.has(registryTopicId)) {
        aliasMap.set(registryTopicId, seenRegistryObjects.get(value));
      }
    }
    const aliasIds = new Set([...aliasMap.keys()]);
    aliasIds.forEach(alias => aliasLookup.set(`${subject.id}:${alias}`, true));

    for (const topic of canonicalTopics) {
      const expected = { subjectId: subject.id, topicId: topic.id, subjectName: subject.title, topicTitle: topic.title };
      const inRegistry = registryTopics.includes(topic.id);
      if (!inRegistry) {
        issues.push(issue('Critical', 'MISSING_PACK', 'Topic id is missing from registry.', expected));
      }
      const pack = loadKnowledge(subject.id, topic.id);
      allPacks.push(pack);
      validatePackShape(pack, subject.id, topic.id, subject.title, topic.title, canonicalIds, aliasMap, issues);
      validateRelatedTopics(pack, subject.id, canonicalIds, aliasIds, new Set(allRegistryTopicIds), issues);
      validatePlaceholders(pack, subject.id, topic.id, issues);
      validateLanguage(pack, subject.id, topic.id, issues);
    }

    for (const alias of aliasIds) {
      const aliasPack = loadKnowledge(subject.id, alias);
      aliasFindings.push({
        subjectId: subject.id,
        alias,
        resolvedTopicId: aliasPack?.topicId || null,
        displayName: aliasPack?.displayName || '',
        valid: Boolean(aliasPack?.subjectId === subject.id && nonEmptyString(aliasPack?.displayName))
      });
    }

    subjectSummaries.push(buildSubjectSummary(subject, canonicalTopics, [...aliasIds].map(alias => ({ alias })), allPacks.filter(p => p.subjectId === subject.id), issues));
  }

  const duplicateFindings = collectDuplicates(allPacks, [
    'teacherExplanation',
    'examples',
    'extraExamples',
    'tips',
    'memoryTips',
    'commonMistakes',
    'followUpQuestions',
    'questionPatterns',
    'wrongAnswerPatterns',
    'encouragement'
  ]);
  const duplicateSummary = {
    harmfulDuplicates: duplicateFindings.filter(item => item.classification === 'confirmed duplicate'),
    acceptableSharedWording: duplicateFindings.filter(item => item.classification === 'acceptable shared wording'),
    templateReuseSignals: duplicateFindings.filter(item => item.classification === 'probable template reuse')
  };

  const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
  for (const issue of issues) {
    severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
  }

  const packsValidated = subjects.reduce((sum, subject) => sum + (subject.topics || []).length, 0);
  const registryCoverage = allPacks.filter(pack => pack?.subjectId && pack?.topicId).length;
  const loaderCoverage = subjectSummaries.reduce((sum, item) => sum + item.packsValidated, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      totalSubjects: subjects.length,
      totalTopics: packsValidated,
      packsValidated,
      registryCoverage: Number(((registryCoverage / packsValidated) * 100).toFixed(1)),
      loaderCoverage: Number(((loaderCoverage / packsValidated) * 100).toFixed(1))
    },
    severityCounts,
    issues,
    duplicateFindings,
    duplicateSummary,
    placeholderFindings: issues.filter(item => item.code === 'PLACEHOLDER'),
    languageFindings: issues.filter(item => item.code.startsWith('BM_') || item.code.startsWith('EN_') || item.code.startsWith('ARABIC_') || item.code.startsWith('ISLAM_')),
    aliasFindings,
    subjectSummaries
  };

  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const countByCode = code => report.issues.filter(issue => issue.code === code).length;
  const missingFieldFailures = countByCode('MISSING_FIELD');
  const minimumCountFailures = countByCode('MINIMUM_COUNT_FAILURE');
  const placeholderCount = report.placeholderFindings.length;
  const duplicateCount = report.duplicateFindings.length;
  const recommendation = (severityCounts.Critical === 0 && severityCounts.High === 0)
    ? 'Ready for App integration'
    : 'Not ready for App integration; resolve Critical/High issues first';

  const rows = subjectSummaries.map(item => [
    item.subjectId,
    item.title,
    String(item.topics),
    String(item.packsValidated),
    `${item.issues.Critical}/${item.issues.High}/${item.issues.Medium}/${item.issues.Low}/${item.issues.Info}`
  ]);

  const doc = `# AI Coach Knowledge Engine Validation Report

## Summary

- Total subjects: ${report.totals.totalSubjects}
- Total topics: ${report.totals.totalTopics}
- Packs validated: ${report.totals.packsValidated}
- Registry coverage: ${report.totals.registryCoverage}%
- Loader coverage: ${report.totals.loaderCoverage}%

## Errors by severity

- Critical: ${severityCounts.Critical}
- High: ${severityCounts.High}
- Medium: ${severityCounts.Medium}
- Low: ${severityCounts.Low}
- Info: ${severityCounts.Info}

## Validation breakdown

- Missing field failures: ${missingFieldFailures}
- Minimum-count failures: ${minimumCountFailures}
- Duplicate-content findings: ${duplicateCount}
- Placeholder findings: ${placeholderCount}
- Language-specific findings: ${report.languageFindings.length}

## Subject readiness

${markdownTable(rows, ['Subject', 'Title', 'Topics', 'Validated', 'Issue counts (C/H/M/L/I)'])}

## Loader and registry coverage

- Registry coverage: ${report.totals.registryCoverage}%
- Loader coverage: ${report.totals.loaderCoverage}%
- Alias entries validated separately: ${report.aliasFindings.length}

## Duplicate-content findings

${duplicateCount === 0 ? '- None' : duplicateCount + ' duplicate-content groups recorded in the JSON report.'}

## Placeholder findings

${placeholderCount === 0 ? '- None' : placeholderCount + ' placeholder-related findings recorded in the JSON report.'}

## Language-specific findings

${report.languageFindings.length === 0 ? '- None' : '- See the JSON report for BM, English, Arabic, and Islam language-signal findings.'}

## Integration recommendation

**${recommendation}**

## Notes

- Alias entries were validated separately and labelled in the JSON report.
- Placeholder, duplicate-content, and language-signal findings are recorded in the JSON report.
- The validator is designed to treat common short encouragement phrases as acceptable shared wording.
`;

  await fs.writeFile(reportDocPath, doc, 'utf8');

  console.log(JSON.stringify({
    totals: report.totals,
    severityCounts,
    duplicateFindings: duplicateFindings.length,
    duplicateSummary: {
      harmfulDuplicates: duplicateSummary.harmfulDuplicates.length,
      acceptableSharedWording: duplicateSummary.acceptableSharedWording.length,
      templateReuseSignals: duplicateSummary.templateReuseSignals.length
    },
    placeholderFindings: report.placeholderFindings.length,
    languageFindings: report.languageFindings.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
