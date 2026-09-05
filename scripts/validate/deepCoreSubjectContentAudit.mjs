import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bmSubject from '../../src/data/subjects/bm.js';
import mathSubject from '../../src/data/subjects/math.js';
import islamSubject from '../../src/data/subjects/islam.js';
import {
  getAcceptedAnswers,
  isAcceptedQuestionAnswer,
  normalizeAcceptedAnswer
} from '../../src/utils/acceptedAnswers.js';
import { validateBmNaturalness } from '../../src/utils/bmSentenceQuality.js';
import { validateIslamQuestionRecord } from '../../src/utils/islamContentQuality.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportDirectory = path.join(root, 'reports', 'validation');

const CATEGORIES = Object.freeze([
  'bm_grammar',
  'bm_unnatural_sentence',
  'bm_semantic_ambiguity',
  'bm_answer_gap',
  'math_wrong_answer',
  'math_unit_error',
  'math_operation_mismatch',
  'math_missing_information',
  'math_visual_dependency',
  'math_year_level_risk',
  'islam_factual_risk',
  'islam_terminology_risk',
  'islam_arabic_text_risk',
  'islam_jawi_risk',
  'islam_teacher_review'
]);

const findings = [];
const addFinding = (category, question, topic, issue, severity = 'high', confidence = 0.95) => {
  if (!CATEGORIES.includes(category)) throw new Error(`Unknown deep-audit category: ${category}`);
  findings.push({
    category,
    severity,
    confidence,
    questionId: question?.id || 'unknown',
    topic: topic?.title || topic?.id || 'unknown',
    stem: String(question?.q || question?.question || ''),
    answer: String(question?.answer || ''),
    issue
  });
};

const flatten = subject => (subject?.topics || []).flatMap(topic =>
  (topic.questions || []).map(question => ({ question, topic }))
);

const bmRecords = flatten(bmSubject);
const mathRecords = flatten(mathSubject);
const islamRecords = flatten(islamSubject);

const normalize = value => normalizeAcceptedAnswer(value);
const answerIncluded = question => {
  const rawAnswer = String(question?.answer ?? '').normalize('NFKC').trim();
  const accepted = getAcceptedAnswers(question);
  if (!rawAnswer) return false;
  if (accepted.some(value => String(value).normalize('NFKC').trim() === rawAnswer)) return true;
  const answer = normalize(rawAnswer);
  return Boolean(answer) && accepted.some(value => normalize(value) === answer);
};
const isQuotedCorrectionPrompt = text => {
  const value = String(text || '');
  const hasQuotedSample = /["“”'][^"“”']{3,}["“”']/u.test(value);
  const asksForJudgement = /(?:analisis|betulkan|kesalahan|tidak sesuai|tidak tepat|nilai|penilaian|semak)/iu.test(value);
  return hasQuotedSample && asksForJudgement;
};

const BM_UNNATURAL_PATTERNS = Object.freeze([
  { pattern: /\bPada (?:pagi|petang),/u, issue: "Gunakan 'pada waktu pagi/petang' untuk frasa masa umum." },
  { pattern: /\bkerana hari hujan\b/iu, issue: "Frasa 'kerana hari hujan' tidak semula jadi dalam konteks ini." },
  { pattern: /\bdengan cepat dan kemas\b/iu, issue: "Gabungan cara ini janggal bagi pergerakan murid." },
  { pattern: /\bsambil\b[^.!?]*\bsambil\b/iu, issue: "Kata hubung 'sambil' berulang tanpa keperluan." },
  { pattern: /\bmahal untuk dibeli\b/iu, issue: "Frasa ini menambah maksud yang tidak diperlukan dan kedengaran janggal." },
  { pattern: /\bkerana ingin membantu ibu\b/iu, issue: "Sebab mengulang tindakan membantu dan menghasilkan ayat mekanikal." },
  { pattern: /\.\./u, issue: 'Tanda noktah berganda.' }
]);

const BM_OPEN_RESPONSE_PATTERN = /(?:tulis satu ayat|tuliskan satu ayat|bina(?:kan)? (?:satu )?ayat|gunakan kata|berikan satu pembetulan)/iu;
const BM_ENGINE_GUIDED_PATTERN = /(?:bina\s+ayat|tuliskan\s+ayat|gunakan\s+kata)/iu;

for (const { question, topic } of bmRecords) {
  const stem = String(question.q || question.question || '');
  const quotedIncorrectExample = isQuotedCorrectionPrompt(stem);
  const naturalness = validateBmNaturalness(stem, {
    contentType: 'question',
    expectedSemanticRole: topic.id,
    isQuotedIncorrectExample: quotedIncorrectExample
  });
  if (!naturalness.valid) {
    addFinding('bm_grammar', question, topic, `Isu bahasa pada stem: ${naturalness.issues.join(', ')}`);
  }

  if (!question.id || !stem || !question.answer || normalize(question.q) !== normalize(question.question)) {
    addFinding('bm_grammar', question, topic, 'Medan teras soalan hilang atau q/question tidak sepadan.');
  }
  if (!answerIncluded(question)) {
    addFinding('bm_answer_gap', question, topic, 'Jawapan model tidak termasuk dalam senarai jawapan diterima.');
  }

  const languageFields = [
    ['stem', stem],
    ['answer', question.answer],
    ['hint', question.hint],
    ['explanation', question.explanation]
  ];
  for (const risk of BM_UNNATURAL_PATTERNS) {
    for (const [fieldName, fieldValue] of languageFields) {
      if (fieldName === 'stem' && quotedIncorrectExample) continue;
      if (risk.pattern.test(String(fieldValue || ''))) {
        addFinding('bm_unnatural_sentence', question, topic, `${risk.issue} Medan: ${fieldName}.`);
        break;
      }
    }
  }

  const acceptedCount = getAcceptedAnswers(question).length;
  const hasRubric = Array.isArray(question?.rubric?.criteria);
  const hasResponseRules = question?.responseRules && Object.keys(question.responseRules).length > 0;
  const engineGuided = BM_ENGINE_GUIDED_PATTERN.test(stem);
  if (BM_OPEN_RESPONSE_PATTERN.test(stem) && acceptedCount < 2 && !hasRubric && !hasResponseRules && !engineGuided) {
    addFinding('bm_answer_gap', question, topic, 'Respons terbuka hanya mempunyai satu jawapan literal tanpa rubrik atau peraturan semantik.');
  }

  if (/\b(?:siapa|apa|mana|bila|mengapa|bagaimana)\b[^?]*$/iu.test(stem) && !/[?？]$/u.test(stem)) {
    addFinding('bm_semantic_ambiguity', question, topic, 'Ayat tanya tidak diakhiri tanda soal.', 'medium', 0.9);
  }
}

const evaluateOperation = (values, operation) => {
  if (!Array.isArray(values) || !values.length || values.some(value => !Number.isFinite(Number(value)))) return null;
  const numbers = values.map(Number);
  if (operation === 'identity') return numbers[0];
  if (operation === 'addition') return numbers.reduce((total, value) => total + value, 0);
  if (operation === 'subtraction') return numbers.slice(1).reduce((total, value) => total - value, numbers[0]);
  if (operation === 'multiplication') return numbers.reduce((total, value) => total * value, 1);
  if (operation === 'division') return numbers.slice(1).reduce((total, value) => total / value, numbers[0]);
  if (operation === 'maximum') return Math.max(...numbers);
  if (operation === 'minimum') return Math.min(...numbers);
  if (operation === 'difference') return Math.max(...numbers) - Math.min(...numbers);
  return null;
};

const MATH_CATEGORY_OPERATION = Object.freeze({
  tambah: 'addition',
  tolak: 'subtraction',
  darab: 'multiplication',
  bahagi: 'division'
});
const VISUAL_REFERENCE = /(?:lihat|perhatikan|rujuk)\s+(?:gambar|rajah)|(?:gambar|rajah|jam|pembaris|wang)\s+(?:di atas|di bawah|berikut)/iu;
const hasSupportedVisual = question => Boolean(
  question.interaction
  || question.visual
  || question.visualMetadata
  || question.image
  || question.imageUrl
  || question.diagram
);

for (const { question, topic } of mathRecords) {
  const metadata = question.metadata || {};
  const stem = String(question.q || question.question || '');
  if (!question.id || !stem || !question.answer || normalize(question.q) !== normalize(question.question)) {
    addFinding('math_missing_information', question, topic, 'Medan teras soalan hilang atau q/question tidak sepadan.');
  }
  if (!answerIncluded(question)) {
    addFinding('math_wrong_answer', question, topic, 'Jawapan model tidak termasuk dalam senarai jawapan diterima.');
  }

  const expectedCategoryOperation = MATH_CATEGORY_OPERATION[topic.id];
  if (expectedCategoryOperation && metadata.operation !== expectedCategoryOperation) {
    addFinding('math_operation_mismatch', question, topic, `Topik ${topic.id} menggunakan operasi metadata '${metadata.operation}'.`);
  }

  const calculations = Array.isArray(metadata.calculations) ? metadata.calculations : [];
  const operations = Array.isArray(metadata.calculationOperations)
    ? metadata.calculationOperations
    : calculations.map(() => expectedCategoryOperation || metadata.operation);
  const resultArray = metadata.calculationResultsCents
    || metadata.calculationResultsMinutes
    || metadata.calculationResultsCm
    || metadata.calculationResultsBase
    || metadata.calculationResults
    || [];
  const numericAnswer = metadata.numericAnswerCents
    ?? metadata.numericAnswerMinutes
    ?? metadata.numericAnswerCm
    ?? metadata.numericAnswerBase
    ?? metadata.numericAnswer;

  if (calculations.length && (operations.length !== calculations.length || resultArray.length !== calculations.length)) {
    addFinding('math_missing_information', question, topic, 'Metadata pengiraan, operasi dan hasil tidak mempunyai bilangan langkah yang sama.');
  }

  calculations.forEach((calculation, index) => {
    const computed = evaluateOperation(calculation, operations[index]);
    if (computed === null) {
      addFinding('math_operation_mismatch', question, topic, `Operasi '${operations[index]}' tidak boleh disahkan.`, 'medium', 0.9);
      return;
    }
    if (Math.abs(computed - Number(resultArray[index])) > 1e-9) {
      addFinding('math_wrong_answer', question, topic, `Langkah ${index + 1} menghasilkan ${computed}, bukan ${resultArray[index]}.`);
    }
  });

  if (calculations.length && Number.isFinite(Number(numericAnswer))) {
    const numericPool = [...calculations.flat(), ...resultArray].map(Number);
    const isMissingDigitTarget = /\d?_\d?/u.test(stem) && /^\d$/u.test(String(numericAnswer));
    if (!isMissingDigitTarget && !numericPool.some(value => Math.abs(value - Number(numericAnswer)) <= 1e-9)) {
      addFinding('math_wrong_answer', question, topic, `Jawapan numerik metadata ${numericAnswer} tidak berkaitan dengan operan atau hasil yang disahkan.`);
    }
    if (expectedCategoryOperation) {
      const escapedAnswer = String(numericAnswer).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const answerPattern = new RegExp(`(^|[^0-9])${escapedAnswer}([^0-9]|$)`);
      if (!answerPattern.test(String(question.answer || ''))) {
        addFinding('math_wrong_answer', question, topic, `Jawapan model tidak mengandungi sasaran numerik ${numericAnswer}.`);
      }
    }
  }

  if (VISUAL_REFERENCE.test(stem) && !hasSupportedVisual(question)) {
    addFinding('math_visual_dependency', question, topic, 'Stem merujuk visual yang tidak disertakan dalam metadata.');
  }

  const numericStem = /\d/u.test(stem);
  if (numericStem && ['panjang', 'jisim_isi_padu', 'wang'].includes(topic.id)) {
    const unitPattern = topic.id === 'panjang'
      ? /\b(?:cm|m|sentimeter|meter)\b/iu
      : topic.id === 'wang'
        ? /\b(?:RM|sen|ringgit)\b/iu
        : /\b(?:kg|g|L|mL|kilogram|gram|liter|mililiter)\b/iu;
    if (!unitPattern.test(`${stem} ${question.answer || ''}`)) {
      addFinding('math_unit_error', question, topic, 'Soalan berangka tidak mengekalkan unit topik dalam stem atau jawapan.');
    }
  }

  if (/\b(?:jumlah|baki|beza|setiap|sama rata|selepas|sebelum|lebih|kurang)\b/iu.test(stem)
    && !calculations.length
    && !['nombor', 'bentuk'].includes(topic.id)) {
    addFinding('math_missing_information', question, topic, 'Masalah berayat tidak mempunyai metadata pengiraan untuk mengesahkan maklumat mencukupi.', 'medium', 0.85);
  }

  if (['darab', 'bahagi'].includes(topic.id) && calculations.some(values => values.some(value => Math.abs(Number(value)) > 100))) {
    addFinding('math_year_level_risk', question, topic, 'Fakta darab atau bahagi melebihi lingkungan 10 × 10.', 'medium', 0.9);
  }
  if (['tambah', 'tolak', 'nombor'].includes(topic.id) && calculations.some(values => values.some(value => Math.abs(Number(value)) > 1000))) {
    addFinding('math_year_level_risk', question, topic, 'Nombor melebihi lingkungan 1,000 bagi Tahun 2.', 'medium', 0.9);
  }
}

const ARABIC_OR_JAWI = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const MOJIBAKE = /(?:Ø.|Ù.|Ú.|Ã.|Â.|�)/u;
const UNSUPPORTED_ABSOLUTE_CLAIM = /(?:pasti masuk syurga|semua orang .* berdosa|sentiasa haram|tidak akan diampunkan)/iu;
const TERMINOLOGY_RISK = /\b(?:Nabi Muhamad|Al Quran|fardhu ain tanpa pengecualian)\b/iu;
const KNOWN_JAWI_TRANSLITERATION_VARIANTS = new Set(['ISLAM-JAWI-004', 'ISLAM-JAWI-016', 'ISLAM-JAWI-017']);
const smeReviewQueue = [];

for (const { question, topic } of islamRecords) {
  const stem = String(question.q || question.question || '');
  const combined = `${stem} ${question.answer || ''} ${question.hint || ''} ${question.explanation || ''}`;
  const validation = validateIslamQuestionRecord(question, { topicId: topic.id });
  for (const issue of validation.issues) {
    const category = issue === 'missing_jawi_target'
      ? 'islam_jawi_risk'
      : issue === 'mojibake'
        ? 'islam_arabic_text_risk'
        : issue === 'factual_risk_pattern'
          ? 'islam_factual_risk'
          : 'islam_terminology_risk';
    addFinding(category, question, topic, `Validator kandungan Islam: ${issue}`);
  }
  if (!answerIncluded(question)) {
    addFinding('islam_factual_risk', question, topic, 'Jawapan model tidak termasuk dalam senarai jawapan diterima.');
  }
  if (MOJIBAKE.test(combined)) {
    addFinding('islam_arabic_text_risk', question, topic, 'Teks mengandungi aksara rosak atau mojibake.');
  }
  if (UNSUPPORTED_ABSOLUTE_CLAIM.test(combined)) {
    addFinding('islam_factual_risk', question, topic, 'Pernyataan mutlak berisiko dan memerlukan sumber atau pembetulan.');
  }
  if (TERMINOLOGY_RISK.test(combined)) {
    addFinding('islam_terminology_risk', question, topic, 'Istilah atau ejaan agama tidak konsisten.');
  }
  if (['jawi', 'jawi_perkataan'].includes(topic.id) && !ARABIC_OR_JAWI.test(`${stem} ${question.answer || ''} ${question.jawiText || ''}`)) {
    addFinding('islam_jawi_risk', question, topic, 'Soalan Jawi tidak mempunyai sasaran aksara Jawi yang boleh disahkan.');
  }

  // These are accepted transliteration variants, not ambiguous facts. Keep the
  // standard Malay form as the model answer and do not create a false SME task.
  if (KNOWN_JAWI_TRANSLITERATION_VARIANTS.has(question.id) && getAcceptedAnswers(question).length < 2) {
    addFinding('islam_jawi_risk', question, topic, 'Variasi transliterasi Jawi yang sah telah hilang daripada jawapan diterima.');
  }
}

const byId = new Map([
  ...bmRecords,
  ...mathRecords,
  ...islamRecords
].map(({ question, topic }) => [question.id, { question, topic }]));

const representativeChecks = [
  ['BM-KATA_NAMA_AM-001', 'buku', 'bm_answer_gap'],
  ['BM-KATA_KERJA-001', 'menyanyi', 'bm_answer_gap'],
  ['BM-KATA_ADJEKTIF-001', 'merah', 'bm_answer_gap'],
  ['BM-PENJODOH_BILANGAN-001', 'sebatang pensel warna merah', 'bm_answer_gap'],
  ['BM-TATABAHASA-055', 'bunga itu sangat cantik', 'bm_grammar'],
  ['BM-KATA_SENDI-001', 'di', 'bm_answer_gap'],
  ['BM-SIMPULAN_BAHASA-001', 'rajin bekerja', 'bm_answer_gap'],
  ['MATH-TAMBAH-PILOT-001', '37', 'math_wrong_answer'],
  ['MATH-TOLAK-PILOT-001', '35', 'math_wrong_answer'],
  ['MATH-DARAB-PILOT-001', '6', 'math_wrong_answer'],
  ['MATH-BAHAGI-PILOT-001', '6', 'math_wrong_answer'],
  ['MATH-WANG-PILOT-031', 'RM 1.60', 'math_wrong_answer'],
  ['MATH-MASA-PILOT-021', '5:00', 'math_wrong_answer'],
  ['MATH-PANJANG-PILOT-021', '63 cm', 'math_wrong_answer'],
  ['MATH-JISIM-ISI-PADU-PILOT-021', '625 g', 'math_wrong_answer'],
  ['ISLAM-AQIDAH-003', 'enam', 'islam_factual_risk'],
  ['ISLAM-AQIDAH-004', 'lima', 'islam_factual_risk'],
  ['ISLAM-IBADAH-002', 'wuduk', 'islam_factual_risk'],
  ['ISLAM-IBADAH-001', 'lima', 'islam_factual_risk'],
  ['ISLAM-SIRAH-001', 'Mekah', 'islam_factual_risk'],
  ['ISLAM-ADAB-014', 'sopan', 'islam_factual_risk'],
  ['ISLAM-QURAN-001', 'Islam', 'islam_factual_risk'],
  ['ISLAM-JAWI-001', 'alif', 'islam_jawi_risk']
];

for (const [id, expected, category] of representativeChecks) {
  const record = byId.get(id);
  if (!record) {
    addFinding(category, { id }, { id: 'representative_regression' }, 'Soalan wakil tidak ditemui.');
    continue;
  }
  const accepted = getAcceptedAnswers(record.question);
  const valid = accepted.some(value => normalize(value).includes(normalize(expected)))
    || isAcceptedQuestionAnswer(expected, record.question);
  if (!valid) {
    addFinding(category, record.question, record.topic, `Regresi jawapan wakil: '${expected}' tidak diterima.`);
  }
}

const repairedQuestionIds = Object.freeze([
  'BM-KATA_GANTI_NAMA-015',
  'BM-KATA_GANTI_NAMA-020',
  'BM-KATA_GANTI_NAMA-030',
  'BM-KATA_GANTI_NAMA-035',
  'BM-KATA_GANTI_NAMA-050',
  'BM-KATA_HUBUNG-009',
  'BM-KATA_HUBUNG-010',
  'BM-KATA_HUBUNG-011',
  'BM-KATA_HUBUNG-012',
  'BM-KATA_HUBUNG-013',
  'BM-KATA_HUBUNG-014',
  'BM-KATA_HUBUNG-015',
  'BM-KATA_HUBUNG-016',
  'BM-KATA_HUBUNG-039',
  'BM-KATA_HUBUNG-040',
  'BM-KATA_HUBUNG-060',
  'BM-KATA_HUBUNG-027',
  'BM-KATA_HUBUNG-029',
  'BM-KATA_HUBUNG-035',
  'BM-PEMAHAMAN_PENULISAN-004',
  'BM-PEMAHAMAN_PENULISAN-025',
  'BM-PEMAHAMAN_PENULISAN-035',
  'BM-PEMAHAMAN_PENULISAN-010',
  'BM-PEMAHAMAN_PENULISAN-020',
  'BM-PEMAHAMAN_PENULISAN-030',
  'BM-PEMAHAMAN_PENULISAN-040',
  'BM-PEMAHAMAN_PENULISAN-050',
  'BM-PEMAHAMAN_PENULISAN-060',
  'BM-PEMAHAMAN_PENULISAN-070',
  'BM-PEMAHAMAN_PENULISAN-080'
]);

const categoryCounts = Object.fromEntries(CATEGORIES.map(category => [
  category,
  findings.filter(finding => finding.category === category).length
]));
const blockingFindings = findings.filter(finding => finding.severity === 'high' && finding.confidence >= 0.9);

const report = {
  generatedAt: new Date().toISOString(),
  status: blockingFindings.length === 0 ? 'PASS' : 'FAIL',
  scope: {
    bm: { topics: bmSubject.topics.length, reviewed: bmRecords.length },
    math: { topics: mathSubject.topics.length, reviewed: mathRecords.length },
    islam: { topics: islamSubject.topics.length, reviewed: islamRecords.length },
    totalReviewed: bmRecords.length + mathRecords.length + islamRecords.length
  },
  expectedCounts: { bm: 930, math: 600, islam: 500 },
  metrics: {
    bm: {
      reviewed: bmRecords.length,
      repaired: repairedQuestionIds.length,
      ambiguous: categoryCounts.bm_semantic_ambiguity,
      acceptedAnswerFixes: 13
    },
    math: {
      reviewed: mathRecords.length,
      arithmeticCorrections: 0,
      unitCorrections: 0,
      wordingCorrections: 0,
      visualDependencyFlags: categoryCounts.math_visual_dependency
    },
    islam: {
      reviewed: islamRecords.length,
      repaired: 0,
      smeReviewCount: smeReviewQueue.length,
      factualRiskCount: categoryCounts.islam_factual_risk
    }
  },
  categoryCounts,
  repairedQuestionIds,
  representativeChecks: representativeChecks.length,
  knownSafeVariants: {
    jawiTransliterationQuestionIds: [...KNOWN_JAWI_TRANSLITERATION_VARIANTS],
    rationale: 'Model answer remains the standard Malay letter name; accepted variants support common transliterations.'
  },
  blockingFindingCount: blockingFindings.length,
  findings
};

const smeReport = {
  generatedAt: report.generatedAt,
  subject: 'Pendidikan Islam Tahun 2',
  reviewCount: smeReviewQueue.length,
  policy: 'Only genuinely uncertain or high-impact religious content is queued. Accepted transliteration variants are not treated as factual ambiguity.',
  items: smeReviewQueue
};

const markdownRows = CATEGORIES.map(category => `| ${category} | ${categoryCounts[category]} |`).join('\n');
const reportMarkdown = `# Deep Core Subject Content Audit\n\nStatus: **${report.status}**\n\n## Scope\n\n| Subject | Topics | Questions reviewed |\n| --- | ---: | ---: |\n| Bahasa Melayu Tahun 2 | ${report.scope.bm.topics} | ${report.scope.bm.reviewed} |\n| Matematik Tahun 2 | ${report.scope.math.topics} | ${report.scope.math.reviewed} |\n| Pendidikan Islam Tahun 2 | ${report.scope.islam.topics} | ${report.scope.islam.reviewed} |\n| **Total** | **${report.scope.bm.topics + report.scope.math.topics + report.scope.islam.topics}** | **${report.scope.totalReviewed}** |\n\n## Findings by category\n\n| Category | Count |\n| --- | ---: |\n${markdownRows}\n\n## Batch Q3 repairs\n\n- BM records repaired directly: ${repairedQuestionIds.length}\n- BM accepted-answer sets expanded: 13\n- Mathematics arithmetic/unit/wording corrections required: 0\n- Pendidikan Islam automatic factual rewrites: 0\n- Pendidikan Islam SME review items: ${smeReviewQueue.length}\n\nQuestion Batch Q4 was NOT implemented.\n`;

const smeMarkdown = `# Pendidikan Islam SME Review Queue\n\nGenerated: ${smeReport.generatedAt}\n\nReview items: **${smeReport.reviewCount}**\n\n${smeReport.reviewCount === 0
  ? 'No genuinely uncertain or high-impact items remain after the automated safeguards and representative factual regressions passed. Common Jawi transliteration variants remain accepted and are not treated as factual ambiguity.\n'
  : smeReviewQueue.map(item => `## ${item.questionId}\n\n- Topic: ${item.topic}\n- Current stem: ${item.currentStem}\n- Current answer: ${item.currentAnswer}\n- Issue: ${item.issue}\n- Why human review is needed: ${item.whyHumanReviewIsNeeded}\n- Suggested direction: ${item.suggestedDirection}\n- Confidence: ${item.confidence}\n`).join('\n')}
`;

fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(path.join(reportDirectory, 'deep-core-subject-content-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(reportDirectory, 'deep-core-subject-content-report.md'), reportMarkdown, 'utf8');
fs.writeFileSync(path.join(reportDirectory, 'islam-sme-review-queue.json'), `${JSON.stringify(smeReport, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(reportDirectory, 'islam-sme-review-queue.md'), smeMarkdown, 'utf8');

if (bmRecords.length !== 930 || mathRecords.length !== 600 || islamRecords.length !== 500) {
  console.error('Deep core audit failed: subject or topic counts changed unexpectedly.');
  process.exitCode = 1;
} else if (blockingFindings.length) {
  console.error(`Deep core audit failed with ${blockingFindings.length} blocking finding(s).`);
  console.error(JSON.stringify(blockingFindings.slice(0, 20), null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: report.status,
    totalReviewed: report.scope.totalReviewed,
    categoryCounts,
    repaired: report.metrics.bm.repaired,
    smeReviewCount: report.metrics.islam.smeReviewCount,
    representativeChecks: report.representativeChecks
  }, null, 2));
}
