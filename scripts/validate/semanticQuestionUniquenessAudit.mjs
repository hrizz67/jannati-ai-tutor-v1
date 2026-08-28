import fs from 'node:fs';
import path from 'node:path';
import englishSubject from '../../src/data/subjects/english.js';
import sainsSubject from '../../src/data/subjects/sains.js';
import arabSubject from '../../src/data/subjects/arab.js';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'reports', 'validation');
const JSON_REPORT = path.join(REPORT_DIR, 'semantic-question-uniqueness-report.json');
const MARKDOWN_REPORT = path.join(REPORT_DIR, 'semantic-question-uniqueness-report.md');

const EXPECTED_COUNTS = Object.freeze({ english: 500, sains: 500, arab: 500 });
const FORBIDDEN_ENGLISH_STEMS = Object.freeze([
  /The\s+_{2,}\s+is on the table\./i,
  /The\s+_{2,}\s+helps sick people\./i
]);
const FORBIDDEN_SAINS_STEMS = Object.freeze([
  /Contoh bagi kumpulan haiwan berkaki empat ialah\s+_{2,}/i,
  /Contoh bagi kumpulan bahan lutsinar ialah\s+_{2,}/i
]);
const OPEN_EXAMPLE_PATTERN = /^(?:Contoh|Sejenis|Salah satu)\b/iu;
const ARABIC_DOT_ONLY_PATTERN = /Huruf yang mempunyai\s+(?:satu|dua|tiga)\s+titik\s+(?:di atas|di bawah)/iu;
const ARABIC_COMPARISON_PATTERN = /(?:berbentuk seperti|hampir sama dengan|bandingkan|antara berikut)/iu;
const GENERIC_ENGLISH_BLANK_PATTERN = /^(?:The|A|An|My|Our|His|Her)\s+_{2,}\s+\S+/i;

const REVIEWED_ENGLISH_GENERIC_IDS = new Set([
  'ENG-NOUNS-002',
  'ENG-NOUNS-006',
  'ENG-NOUNS-011',
  ...[1, 2, 4].flatMap(offset => [0, 10, 20, 30, 40]
    .map(block => `ENG-ANIMALS-${String(block + offset).padStart(3, '0')}`))
]);

const ENGLISH_NOUN_REPAIR_NUMBERS = [
  1, 5, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 25, 27, 28, 29,
  30, 31, 32, 34, 35, 36, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
];
const ENGLISH_ANIMAL_REPAIR_OFFSETS = [3, 5, 6, 7, 8, 9, 10];
const ENGLISH_FOOD_REPAIR_OFFSETS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const ENGLISH_REPAIRED_IDS = new Set([
  ...ENGLISH_NOUN_REPAIR_NUMBERS.map(number => `ENG-NOUNS-${String(number).padStart(3, '0')}`),
  ...ENGLISH_ANIMAL_REPAIR_OFFSETS.flatMap(offset => [0, 10, 20, 30, 40]
    .map(block => `ENG-ANIMALS-${String(block + offset).padStart(3, '0')}`)),
  ...ENGLISH_FOOD_REPAIR_OFFSETS.flatMap(offset => [0, 10, 20, 30, 40]
    .map(block => `ENG-FOOD-${String(block + offset).padStart(3, '0')}`))
]);
const SAINS_REPAIRED_IDS = new Set(
  Array.from({ length: 10 }, (_, index) => `SAINS-KEMAHIRAN_SAINTIFIK-${String(index + 11).padStart(3, '0')}`)
);
const ARAB_REPAIRED_IDS = new Set(
  [31, 32, 33].map(number => `ARAB-HURUF_HIJAIYAH-${String(number).padStart(3, '0')}`)
);

function normalizeText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value = '') {
  return normalizeText(value)
    .toLocaleLowerCase('ms-MY')
    .replace(/[.!?,;:؟،؛]+$/u, '')
    .trim();
}

function getQuestions(subject = {}, subjectId = '') {
  return (subject.topics || []).flatMap(topic => (topic.questions || []).map(question => ({
    ...question,
    subjectId,
    topicId: topic.id
  })));
}

function getAccepted(question = {}) {
  const source = Array.isArray(question.accepted)
    ? question.accepted
    : Array.isArray(question.acceptedAnswers)
      ? question.acceptedAnswers
      : [];
  return source.map(normalizeText).filter(Boolean);
}

function getOptions(question = {}) {
  const source = question.options || question.choices || question.answerOptions || [];
  return Array.isArray(source) ? source.map(normalizeText).filter(Boolean) : [];
}

function stripEnglishInstruction(value = '') {
  return normalizeText(value)
    .replace(/^(?:Choose the correct answer word to complete this sentence|Complete the sentence with the best word|Read and Fill in the blank|In [^,]+, choose one word):\s*/i, '')
    .replace(/\s+Practice\s+\d+\.$/i, '.')
    .trim();
}

const subjects = {
  english: getQuestions(englishSubject, 'english'),
  sains: getQuestions(sainsSubject, 'sains'),
  arab: getQuestions(arabSubject, 'arab')
};
const allQuestions = Object.values(subjects).flat();
const findings = [];
const teacherReview = [];
const reviewedAllowlist = [];

function addFinding(question, category, detail, confidence = 'high') {
  findings.push({
    subject: question.subjectId,
    topicId: question.topicId,
    id: question.id,
    category,
    confidence,
    detail,
    stem: normalizeText(question.q || question.question)
  });
}

for (const [subjectId, questions] of Object.entries(subjects)) {
  if (questions.length !== EXPECTED_COUNTS[subjectId]) {
    findings.push({
      subject: subjectId,
      topicId: '',
      id: '',
      category: 'question_count_changed',
      confidence: 'high',
      detail: `Expected ${EXPECTED_COUNTS[subjectId]} questions but found ${questions.length}.`,
      stem: ''
    });
  }

  const ids = questions.map(question => question.id);
  if (new Set(ids).size !== ids.length) {
    findings.push({
      subject: subjectId,
      topicId: '',
      id: '',
      category: 'duplicate_question_id',
      confidence: 'high',
      detail: 'Question IDs must remain unique.',
      stem: ''
    });
  }
}

for (const question of allQuestions) {
  const stem = normalizeText(question.q || question.question);
  const answer = normalizeText(question.answer);
  const answerKey = normalizeKey(answer);
  const accepted = getAccepted(question);
  const acceptedKeys = new Set(accepted.map(normalizeKey));
  const options = getOptions(question);
  const optionKeys = options.map(normalizeKey);

  if (!answerKey || !acceptedKeys.has(answerKey)) {
    addFinding(question, 'accepted_answer_gap', 'The canonical answer is missing from accepted answers.');
  }

  if (options.length) {
    if (new Set(optionKeys).size !== optionKeys.length) {
      addFinding(question, 'duplicate_options', 'Objective options contain duplicate normalized values.');
    }
    if (!optionKeys.includes(answerKey)) {
      addFinding(question, 'answer_distractor_overlap', 'The canonical answer is missing from the objective options.');
    }
    const acceptedDistractors = optionKeys.filter(key => key !== answerKey && acceptedKeys.has(key));
    if (acceptedDistractors.length) {
      addFinding(question, 'answer_distractor_overlap', 'An accepted alternative also appears as a distractor.');
    }
  }

  if (question.subjectId === 'english') {
    if (FORBIDDEN_ENGLISH_STEMS.some(pattern => pattern.test(stem))) {
      addFinding(question, 'multiple_valid_answer_risk', 'Known ambiguous English regression stem remains.');
    }
    const childStem = stripEnglishInstruction(stem);
    if (!options.length && GENERIC_ENGLISH_BLANK_PATTERN.test(childStem)) {
      if (REVIEWED_ENGLISH_GENERIC_IDS.has(question.id)) {
        reviewedAllowlist.push({
          subject: 'english',
          id: question.id,
          category: 'ambiguous_generic_blank',
          reason: 'Reviewed clue identifies one Year 2 answer through a role, animal sound or distinctive body feature.'
        });
      } else {
        addFinding(question, 'ambiguous_generic_blank', 'Generic noun blank lacks a reviewed identifying clue.');
      }
    }
  }

  if (question.subjectId === 'sains') {
    if (FORBIDDEN_SAINS_STEMS.some(pattern => pattern.test(stem))) {
      addFinding(question, 'open_example_single_answer', 'Known ambiguous Sains example stem remains.');
    }
    if (OPEN_EXAMPLE_PATTERN.test(stem) && !options.length && acceptedKeys.size <= 1) {
      addFinding(question, 'open_example_single_answer', 'Open example question has only one accepted answer.');
    }
  }

  if (question.subjectId === 'arab') {
    if (ARABIC_DOT_ONLY_PATTERN.test(stem) && !ARABIC_COMPARISON_PATTERN.test(stem)) {
      addFinding(question, 'arabic_visual_ambiguity', 'Dot count or position is not enough to identify one Arabic letter.');
    }
  }
}

function findQuestion(id) {
  return allQuestions.find(question => question.id === id);
}

const regressionCases = [
  {
    id: 'english_ambiguous_object',
    pass: !subjects.english.some(question => FORBIDDEN_ENGLISH_STEMS[0].test(normalizeText(question.q || question.question))),
    detail: '"The ________ is on the table." does not survive as a single-answer open blank.'
  },
  {
    id: 'english_profession',
    pass: /examines patients and gives medical treatment/i.test(findQuestion('ENG-NOUNS-011')?.q || ''),
    detail: 'The doctor clue uniquely describes the intended profession.'
  },
  {
    id: 'sains_four_legged_animal',
    pass: getOptions(findQuestion('SAINS-KEMAHIRAN_SAINTIFIK-011')).length === 4
      && !/^Contoh/iu.test(findQuestion('SAINS-KEMAHIRAN_SAINTIFIK-011')?.q || ''),
    detail: 'The four-legged-animal example is now a constrained objective question.'
  },
  {
    id: 'sains_transparent_material',
    pass: getOptions(findQuestion('SAINS-KEMAHIRAN_SAINTIFIK-014')).length === 4
      && normalizeKey(findQuestion('SAINS-KEMAHIRAN_SAINTIFIK-014')?.answer) === 'kaca',
    detail: 'The transparent-material question has one correct option.'
  },
  {
    id: 'arabic_one_dot_below',
    pass: /berbentuk seperti ت/iu.test(findQuestion('ARAB-HURUF_HIJAIYAH-031')?.q || '')
      && normalizeText(findQuestion('ARAB-HURUF_HIJAIYAH-031')?.answer) === 'ب',
    detail: 'The one-dot-below clue identifies ب through its letter family shape.'
  }
];

for (const regression of regressionCases) {
  if (!regression.pass) {
    findings.push({
      subject: 'regression',
      topicId: '',
      id: regression.id,
      category: 'known_regression_case',
      confidence: 'high',
      detail: regression.detail,
      stem: ''
    });
  }
}

for (const [label, ids] of [
  ['English', ENGLISH_REPAIRED_IDS],
  ['Sains', SAINS_REPAIRED_IDS],
  ['Arab', ARAB_REPAIRED_IDS]
]) {
  for (const id of ids) {
    const question = findQuestion(id);
    if (!question) {
      findings.push({
        subject: label.toLowerCase(),
        topicId: '',
        id,
        category: 'repair_id_missing',
        confidence: 'high',
        detail: 'A repaired question ID is missing from the final bank.',
        stem: ''
      });
      continue;
    }
    const answerKey = normalizeKey(question.answer);
    if (!normalizeKey(question.explanation).includes(answerKey)) {
      findings.push({
        subject: question.subjectId,
        topicId: question.topicId,
        id,
        category: 'explanation_answer_mismatch',
        confidence: 'high',
        detail: 'The repaired explanation does not explicitly support the canonical answer.',
        stem: normalizeText(question.q || question.question)
      });
    }
  }
}

const categoryCounts = findings.reduce((counts, finding) => {
  counts[finding.category] = (counts[finding.category] || 0) + 1;
  return counts;
}, {});
const highConfidenceFindings = findings.filter(finding => finding.confidence === 'high');
const status = highConfidenceFindings.length
  ? 'FAIL'
  : teacherReview.length
    ? 'PASS_WITH_TEACHER_REVIEW'
    : 'PASS';

const report = {
  status,
  scope: ['english', 'sains', 'arab'],
  questionsReviewed: {
    english: subjects.english.length,
    sains: subjects.sains.length,
    arab: subjects.arab.length,
    total: allQuestions.length
  },
  repairs: {
    englishQuestionsRepaired: ENGLISH_REPAIRED_IDS.size,
    sainsOpenExampleQuestionsRepaired: SAINS_REPAIRED_IDS.size,
    arabicVisualAmbiguityQuestionsRepaired: ARAB_REPAIRED_IDS.size,
    totalQuestionsRepaired: ENGLISH_REPAIRED_IDS.size + SAINS_REPAIRED_IDS.size + ARAB_REPAIRED_IDS.size,
    ambiguousStemsFixed: ENGLISH_REPAIRED_IDS.size + SAINS_REPAIRED_IDS.size + ARAB_REPAIRED_IDS.size,
    acceptedAnswerSetsExpanded: 0
  },
  findings: {
    total: findings.length,
    highConfidence: highConfidenceFindings.length,
    teacherReview: teacherReview.length,
    byCategory: categoryCounts,
    items: findings
  },
  teacherReview,
  reviewedAllowlist,
  regressionCases
};

function markdownTable(rows = []) {
  if (!rows.length) return '_None._';
  return [
    '| Subject | ID | Category | Detail |',
    '| --- | --- | --- | --- |',
    ...rows.map(row => `| ${row.subject} | ${row.id || '-'} | ${row.category} | ${row.detail.replace(/\|/g, '\\|')} |`)
  ].join('\n');
}

const markdown = `# Semantic Question Uniqueness Audit

Status: **${status}**

## Scope

| Subject | Questions reviewed |
| --- | ---: |
| English | ${subjects.english.length} |
| Sains | ${subjects.sains.length} |
| Bahasa Arab | ${subjects.arab.length} |
| **Total** | **${allQuestions.length}** |

## Repairs

- English questions repaired: ${ENGLISH_REPAIRED_IDS.size}
- Sains open-example questions repaired: ${SAINS_REPAIRED_IDS.size}
- Arabic visual-ambiguity questions repaired: ${ARAB_REPAIRED_IDS.size}
- Total questions repaired: ${report.repairs.totalQuestionsRepaired}
- Accepted-answer sets expanded: ${report.repairs.acceptedAnswerSetsExpanded}

## High-confidence findings

${markdownTable(highConfidenceFindings)}

## Remaining teacher review

${markdownTable(teacherReview)}

## Known regression cases

${regressionCases.map(item => `- ${item.pass ? 'PASS' : 'FAIL'} — ${item.detail}`).join('\n')}

## Reviewed allowlist

${reviewedAllowlist.length} generic English clue(s) were retained after explicit review because the role, animal sound or body feature identifies one Year 2 answer.
`;

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(MARKDOWN_REPORT, markdown);

console.log(JSON.stringify({
  status,
  questionsReviewed: report.questionsReviewed,
  repairs: report.repairs,
  findings: report.findings,
  regressionCases
}, null, 2));

if (status === 'FAIL') process.exitCode = 1;
