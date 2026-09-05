import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { classifyInteractiveSuitability } from '../../src/ai/question/interactiveSuitability.js';
import { buildAdaptivePracticeSession } from '../../src/ai/adaptive/adaptivePracticeEngine.js';
import {
  getInteractiveQuestionConfig,
  serializeDragDropResponse,
  serializeMatchingResponse,
  serializeMoneyResponse,
  serializeMultiSelectResponse,
  serializeOrderingResponse,
  validateInteractiveQuestionConfig
} from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const ROOT = process.cwd();
const REPORT_DIRECTORY = path.join(ROOT, 'reports', 'validation');
const CONFIG_DIRECTORY = path.join(ROOT, 'scripts', 'validate', 'config');
const REPORT_JSON = path.join(REPORT_DIRECTORY, 'question-release-report.json');
const REPORT_MARKDOWN = path.join(REPORT_DIRECTORY, 'question-release-report.md');
const MANIFEST_PATH = path.join(REPORT_DIRECTORY, 'question-manifest.json');
const REVIEW_JSON = path.join(REPORT_DIRECTORY, 'teacher-review-queue.json');
const REVIEW_MARKDOWN = path.join(REPORT_DIRECTORY, 'teacher-review-queue.md');
const VALIDATOR_RESULTS_PATH = path.join(REPORT_DIRECTORY, 'question-release-validator-results.json');
const BASELINE_PATH = path.join(CONFIG_DIRECTORY, 'question-manifest-baseline.json');
const POLICY_PATH = path.join(CONFIG_DIRECTORY, 'question-release-policy.json');
const ALLOWLIST_PATH = path.join(CONFIG_DIRECTORY, 'question-release-allowlist.json');
const VALIDATOR_VERSION = '1.0.0';
const EVIDENCE_FILES = [REPORT_JSON, MANIFEST_PATH, REVIEW_JSON];
const VISUAL_TYPES = new Set(['imageChoice', 'visualMath', 'hotspot', 'clock', 'money', 'measurement']);
const SINGLE_CHOICE_TYPES = new Set(['choice', 'imageChoice', 'visualMath', 'fillBlank', 'clock', 'measurement']);
const VALID_DIFFICULTIES = new Set(['mudah', 'sederhana', 'sukar']);
const VALID_COGNITIVE_LEVELS = new Set(['mengingat', 'memahami', 'mengaplikasi', 'menganalisis', 'menilai', 'mencipta']);
const args = new Set(process.argv.slice(2));

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function gitValue(parameters, fallback = 'unavailable') {
  try {
    return execFileSync('git', parameters, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function normalizeText(value = '') {
  return String(value ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim();
}

function normalizeKey(value = '') {
  return normalizeText(value)
    .toLocaleLowerCase('ms-MY')
    .replace(/[.!?,;:؟،؛'"“”‘’()[\]{}\-–—]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function optionsFor(question = {}) {
  const source = question.options || question.choices || question.answerOptions || [];
  return Array.isArray(source)
    ? source.map(option => normalizeText(option?.value ?? option?.label ?? option?.text ?? option)).filter(Boolean)
    : [];
}

function acceptedFor(question = {}) {
  const source = Array.isArray(question.accepted)
    ? question.accepted
    : Array.isArray(question.acceptedAnswers)
      ? question.acceptedAnswers
      : [];
  return [...new Set([question.answer, ...source].map(normalizeText).filter(Boolean))];
}

function visualNodes(config = {}) {
  return [
    config.visual,
    ...(config.options || []).map(option => option.visual),
    ...(config.items || []).map(item => item.visual),
    ...(config.hotspots || []).map(item => item.visual)
  ].filter(Boolean);
}

function hasVisual(question, config) {
  return Boolean(question.visual || (config && (VISUAL_TYPES.has(config.type) || visualNodes(config).length)));
}

function questionTypeFor(question, config) {
  if (config?.type === 'imageChoice') return 'imageChoice';
  if (config?.type === 'matching') return 'matching';
  if (config?.type === 'ordering') return 'ordering';
  if (config?.type === 'dragDrop') return 'dragDrop';
  if (config?.type === 'fillBlank' || /_{2,}/u.test(normalizeText(question.q || question.question))) return 'fillBlank';
  if (optionsFor(question).length >= 2) return 'MCQ';
  return normalizeText(question.questionType || question.type || 'openAnswer') || 'openAnswer';
}

function answerTypeFor(question, config) {
  if (config?.type === 'matching') return 'mapping';
  if (config?.type === 'ordering') return 'ordering';
  if (config?.type === 'dragDrop') return 'grouping';
  if (config?.type === 'multiSelect') return 'multiSelect';
  if (['money', 'measurement', 'visualMath'].includes(config?.type)) return 'numericOrChoice';
  if (optionsFor(question).length >= 2 || SINGLE_CHOICE_TYPES.has(config?.type)) return 'singleChoice';
  return 'text';
}

function cognitiveKey(value = '') {
  return ({
    mengingat: 'recall',
    memahami: 'understanding',
    mengaplikasi: 'application',
    menganalisis: 'analysis',
    menilai: 'evaluation',
    mencipta: 'creation'
  })[normalizeKey(value)] || 'unspecified';
}

function difficultyKey(value = '') {
  return ({ mudah: 'easy', sederhana: 'medium', sukar: 'hard' })[normalizeKey(value)] || 'unspecified';
}

function makeCounter() {
  return {
    total: 0,
    MCQ: 0,
    fillBlank: 0,
    openAnswer: 0,
    matching: 0,
    ordering: 0,
    dragDrop: 0,
    imageChoice: 0,
    visual: 0,
    recall: 0,
    understanding: 0,
    application: 0,
    analysis: 0,
    evaluation: 0,
    creation: 0,
    unspecifiedCognitive: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    unspecifiedDifficulty: 0
  };
}

function addMetrics(counter, row) {
  counter.total += 1;
  if (Object.hasOwn(counter, row.questionType)) counter[row.questionType] += 1;
  else counter.openAnswer += 1;
  if (row.hasVisual) counter.visual += 1;
  const cognitive = cognitiveKey(row.cognitiveLevel);
  counter[cognitive === 'unspecified' ? 'unspecifiedCognitive' : cognitive] += 1;
  const difficulty = difficultyKey(row.difficulty);
  counter[difficulty === 'unspecified' ? 'unspecifiedDifficulty' : difficulty] += 1;
  return counter;
}

function jaccardSimilarity(left, right) {
  const a = new Set(normalizeKey(left).split(' ').filter(Boolean));
  const b = new Set(normalizeKey(right).split(' ').filter(Boolean));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function templateKey(stem = '') {
  return normalizeKey(stem)
    .replace(/\b\d+(?:[.,]\d+)?\b/gu, '#')
    .replace(/[“"][^”"]+[”"]/gu, '“…”')
    .replace(/\b(?:latihan|practice)\s+#\b/gu, 'latihan #');
}

function markdownSafe(value = '') {
  return normalizeText(value).replace(/\|/gu, '\\|');
}

function serializeAuthoredSolution(question, config) {
  if (SINGLE_CHOICE_TYPES.has(config.type)) {
    const correctOptions = (config.options || []).filter(option => smartCheck(option.value, question).status === 'correct');
    return correctOptions.length === 1 ? String(correctOptions[0].value) : '';
  }
  if (config.type === 'ordering') return serializeOrderingResponse(config, config.correctOrder);
  if (config.type === 'multiSelect') return serializeMultiSelectResponse(config, config.correctOptionIds);
  if (config.type === 'matching') {
    return serializeMatchingResponse(config, Object.fromEntries(config.items.map(item => [item.id, item.targetId])));
  }
  if (config.type === 'dragDrop') {
    const assignments = {};
    for (const zone of config.zones || []) {
      for (const itemId of zone.acceptedItemIds || []) assignments[itemId] = zone.id;
    }
    return serializeDragDropResponse(config, assignments);
  }
  if (config.type === 'hotspot') {
    return String(config.hotspots.find(item => item.id === config.correctHotspotId)?.value || '');
  }
  if (config.type === 'money') return serializeMoneyResponse(config.targetSen);
  return '';
}

function answerLeakInVisual(question, config) {
  if (!config) return false;
  const accepted = acceptedFor(question).map(normalizeKey).filter(answer => answer.length >= 2);
  return (config.options || []).some(option => {
    if (!option.visual || smartCheck(option.value, question).status !== 'correct') return false;
    const visible = normalizeKey(option.label);
    const semantic = normalizeKey(option.visual.label);
    const generic = /^(?:jam|kad|pilihan|gambar|simbol)\s*[a-z0-9]+$/iu.test(visible);
    return generic && accepted.some(answer => semantic.includes(answer));
  });
}

function deterministicShuffle(items, seed) {
  let state = Number(seed) >>> 0 || 1;
  const random = () => {
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

const policy = readJson(POLICY_PATH, {});
const allowlistDocument = readJson(ALLOWLIST_PATH, { entries: [] });
const subjects = await loadAllSubjects();
const gitCommitSha = gitValue(['rev-parse', 'HEAD']);
const workingTreeDirty = gitValue(['status', '--porcelain', '--untracked-files=no'], '') !== '';
const generatedAt = new Date().toISOString();
const findings = [];
const suppressedFindings = [];
const flagsByQuestion = new Map();
const questionIndex = new Map();
const allowlistEntries = Array.isArray(allowlistDocument.entries) ? allowlistDocument.entries : [];
const allowlistByKey = new Map(allowlistEntries.map(entry => [`${entry.questionId}:${entry.rule}`, entry]));

function flagQuestion(questionId, rule) {
  if (!questionId) return;
  if (!flagsByQuestion.has(questionId)) flagsByQuestion.set(questionId, new Set());
  flagsByQuestion.get(questionId).add(rule);
}

function addFinding({ severity, rule, questionId = '', subjectId = '', topicId = '', confidence = 'medium', why, action, relatedQuestionIds = [] }) {
  const record = {
    severity,
    confidence,
    rule,
    questionId,
    subjectId,
    topicId,
    why,
    suggestedReviewAction: action,
    relatedQuestionIds
  };
  const allowlist = allowlistByKey.get(`${questionId}:${rule}`);
  flagQuestion(questionId, rule);
  if (allowlist) {
    suppressedFindings.push({ ...record, allowlist });
    flagQuestion(questionId, `ALLOWLISTED:${rule}`);
    return;
  }
  findings.push(record);
}

const flattened = [];
const subjectCounts = {};
const topicCounts = {};
for (const subject of subjects) {
  subjectCounts[subject.id] = 0;
  const seenTopicIds = new Set();
  for (const topic of subject.topics || []) {
    if (!topic.id || seenTopicIds.has(topic.id)) {
      addFinding({
        severity: 'P0', rule: 'INVALID_TOPIC_ASSOCIATION', subjectId: subject.id, topicId: topic.id || '', confidence: 'high',
        why: topic.id ? 'ID topik berulang dalam subjek.' : 'Topik tidak mempunyai ID.',
        action: 'Betulkan ID dan kaitan topik sebelum pelepasan.'
      });
    }
    seenTopicIds.add(topic.id);
    const topicKey = `${subject.id}/${topic.id}`;
    topicCounts[topicKey] = 0;
    for (const question of topic.questions || []) {
      const entry = { question, subject, topic };
      flattened.push(entry);
      subjectCounts[subject.id] += 1;
      topicCounts[topicKey] += 1;
      if (question.id) questionIndex.set(String(question.id), entry);
    }
    if (!(topic.questions || []).length) {
      addFinding({
        severity: 'P0', rule: 'EMPTY_QUESTION_POOL', subjectId: subject.id, topicId: topic.id, confidence: 'high',
        why: 'Topik tidak mempunyai soalan yang boleh dipilih semasa sesi.',
        action: 'Tambah sekurang-kurangnya satu soalan sah pada topik.'
      });
    }
  }
}

for (const entry of allowlistEntries) {
  const valid = entry && normalizeText(entry.questionId) && normalizeText(entry.rule)
    && normalizeText(entry.reason) && /^\d{4}-\d{2}-\d{2}$/u.test(String(entry.reviewedAt || ''));
  if (!valid) {
    addFinding({
      severity: 'P0', rule: 'INVALID_ALLOWLIST_ENTRY', questionId: normalizeText(entry?.questionId), confidence: 'high',
      why: 'Entri allowlist mesti mempunyai questionId, rule, reason dan reviewedAt.',
      action: 'Lengkapkan rekod semakan bernama atau buang suppression yang tidak sah.'
    });
  } else if (!questionIndex.has(String(entry.questionId))) {
    addFinding({
      severity: 'P1', rule: 'ORPHANED_ALLOWLIST_ENTRY', questionId: String(entry.questionId), confidence: 'high',
      why: 'Allowlist merujuk soalan yang tidak lagi wujud.',
      action: 'Semak sama ada ID berubah atau entri ini patut dibuang.'
    });
  }
}

const seenQuestionIds = new Map();
const manifestRows = [];
for (const { question, subject, topic } of flattened) {
  const questionId = normalizeText(question.id);
  const stem = normalizeText(question.q || question.question);
  const answer = normalizeText(question.answer);
  const options = optionsFor(question);
  const accepted = acceptedFor(question);
  const optionKeys = options.map(normalizeKey);
  const acceptedKeys = new Set(accepted.map(normalizeKey));
  const answerKey = normalizeKey(answer);
  const config = getInteractiveQuestionConfig(question);
  const suitability = classifyInteractiveSuitability(question, { subjectId: subject.id, topicId: topic.id });

  if (!questionId) {
    addFinding({ severity: 'P0', rule: 'MISSING_QUESTION_ID', subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Soalan tidak mempunyai ID.', action: 'Tetapkan ID stabil yang unik.' });
  } else if (seenQuestionIds.has(questionId)) {
    addFinding({ severity: 'P0', rule: 'DUPLICATE_QUESTION_ID', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: `ID turut digunakan pada ${seenQuestionIds.get(questionId)}.`, action: 'Berikan ID unik tanpa menukar identiti soalan lain.' });
  } else {
    seenQuestionIds.set(questionId, `${subject.id}/${topic.id}`);
  }
  if (!stem) addFinding({ severity: 'P0', rule: 'MISSING_STEM', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Teks soalan kosong.', action: 'Tulis stem soalan lengkap.' });
  if (!answer) addFinding({ severity: 'P0', rule: 'MISSING_ANSWER', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Jawapan kanonik kosong.', action: 'Tetapkan jawapan kanonik yang boleh disemak.' });
  if (question.subjectId && question.subjectId !== subject.id) addFinding({ severity: 'P0', rule: 'SUBJECT_ASSOCIATION_MISMATCH', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: `Metadata subjectId ${question.subjectId} tidak sepadan dengan bekas subjek ${subject.id}.`, action: 'Selaraskan subjectId dengan subjek pemilik.' });
  if (question.topicId && question.topicId !== topic.id) addFinding({ severity: 'P0', rule: 'TOPIC_ASSOCIATION_MISMATCH', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: `Metadata topicId ${question.topicId} tidak sepadan dengan bekas topik ${topic.id}.`, action: 'Selaraskan topicId dengan topik pemilik.' });
  if (Array.isArray(question.options) && question.options.length < 2) addFinding({ severity: 'P0', rule: 'MALFORMED_OPTIONS', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Senarai pilihan objektif mempunyai kurang daripada dua pilihan.', action: 'Lengkapkan pilihan atau tukar soalan kepada respons terbuka.' });
  if (options.length && new Set(optionKeys).size !== optionKeys.length) addFinding({ severity: 'P0', rule: 'DUPLICATE_OPTIONS', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Pilihan jawapan berulang selepas normalisasi.', action: 'Ganti distraktor berulang.' });
  if (options.length && !optionKeys.includes(answerKey)) addFinding({ severity: 'P0', rule: 'ANSWER_NOT_REACHABLE', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Jawapan kanonik tidak terdapat dalam pilihan objektif.', action: 'Masukkan jawapan tepat atau betulkan jawapan kanonik.' });
  const acceptedDistractors = optionKeys.filter(value => value !== answerKey && acceptedKeys.has(value));
  if (acceptedDistractors.length) addFinding({ severity: 'P0', rule: 'MULTIPLE_CORRECT_OPTIONS', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Lebih daripada satu pilihan objektif diterima sebagai betul.', action: 'Kekalkan satu jawapan objektif atau ubah kepada multi-pilih.' });
  const rawAccepted = Array.isArray(question.accepted) ? question.accepted : Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];
  if (rawAccepted.length && !new Set(rawAccepted.map(normalizeKey)).has(answerKey)) addFinding({ severity: 'P1', rule: 'CANONICAL_ANSWER_MISSING_FROM_ACCEPTED', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Senarai accepted tidak mengandungi jawapan kanonik.', action: 'Tambah jawapan kanonik kepada accepted tanpa membuang variasi sah.' });
  if (!VALID_DIFFICULTIES.has(normalizeKey(question.difficulty))) addFinding({ severity: 'P2', rule: 'DIFFICULTY_REVIEW', questionId, subjectId: subject.id, topicId: topic.id, why: 'Aras kesukaran tiada atau tidak menggunakan nilai kanonik.', action: 'Semak kesesuaian mudah, sederhana atau sukar untuk Tahun 2.' });
  if (!VALID_COGNITIVE_LEVELS.has(normalizeKey(question.cognitiveLevel))) addFinding({ severity: 'P2', rule: 'COGNITIVE_REVIEW', questionId, subjectId: subject.id, topicId: topic.id, why: 'Aras kognitif tiada atau tidak menggunakan nilai kanonik.', action: 'Semak aras mengingat hingga mencipta berdasarkan konstruk sebenar.' });
  if (!normalizeText(question.hint)) addFinding({ severity: 'P2', rule: 'MISSING_HINT', questionId, subjectId: subject.id, topicId: topic.id, why: 'Petunjuk pembelajaran belum tersedia.', action: 'Tambah petunjuk yang membantu tanpa mendedahkan jawapan.' });
  if (!normalizeText(question.explanation)) addFinding({ severity: 'P2', rule: 'MISSING_EXPLANATION', questionId, subjectId: subject.id, topicId: topic.id, why: 'Penerangan selepas jawapan belum tersedia.', action: 'Tambah penerangan ringkas yang menerangkan sebab jawapan.' });
  const hintKey = normalizeKey(question.hint);
  if (answerKey.length >= 3 && (hintKey === answerKey || new RegExp(`^(?:jawapan(?:nya)?|answer)\\s*(?:ialah|adalah|is)?\\s*${answerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'iu').test(hintKey))) {
    addFinding({ severity: 'P1', rule: 'HINT_ANSWER_LEAK', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Petunjuk menyatakan jawapan secara langsung sebelum semakan.', action: 'Tukar petunjuk kepada langkah atau ciri, bukan jawapan.' });
  }
  if (/\uFFFD/u.test(`${stem}${answer}${question.hint || ''}${question.explanation || ''}`)) addFinding({ severity: 'P1', rule: 'UNICODE_CORRUPTION', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Aksara gantian Unicode menunjukkan kandungan rosak.', action: 'Pulihkan teks asal, khususnya Arab atau Jawi.' });
  if (/^(?:Contoh|Sejenis|Salah satu)\b/iu.test(stem) && !options.length && accepted.length <= 1) addFinding({ severity: 'P1', rule: 'OPEN_EXAMPLE_AMBIGUITY', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Soalan meminta contoh terbuka tetapi hanya satu jawapan diterima.', action: 'Kekang soalan dengan pilihan atau tambah semua variasi jawapan sah.' });
  if (subject.id === 'arab' && /Huruf yang mempunyai\s+(?:satu|dua|tiga)\s+titik\s+(?:di atas|di bawah)/iu.test(stem) && !/(?:berbentuk seperti|hampir sama dengan|bandingkan|antara berikut)/iu.test(stem)) addFinding({ severity: 'P1', rule: 'ARABIC_VISUAL_AMBIGUITY', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Bilangan dan kedudukan titik sahaja mungkin menerangkan beberapa huruf Arab.', action: 'Tambah petunjuk bentuk keluarga huruf atau pilihan visual.' });
  if (question.interaction) {
    const interactionIssues = validateInteractiveQuestionConfig(question.interaction);
    if (interactionIssues.length) addFinding({ severity: 'P0', rule: 'INVALID_INTERACTION_STRUCTURE', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: `Struktur interaktif tidak boleh dijalankan: ${interactionIssues.join(', ')}.`, action: 'Betulkan konfigurasi interaksi mengikut kontrak enjin.' });
    const solution = interactionIssues.length ? '' : serializeAuthoredSolution(question, question.interaction);
    if (!interactionIssues.length && (!solution || smartCheck(solution, question).status !== 'correct')) addFinding({ severity: 'P0', rule: 'INTERACTIVE_ANSWER_NOT_REACHABLE', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Respons penyelesaian interaktif tidak disemak sebagai jawapan betul.', action: 'Selaraskan serializer interaksi, answer dan accepted.' });
  }
  if (answerLeakInVisual(question, config)) addFinding({ severity: 'P1', rule: 'VISUAL_METADATA_ANSWER_LEAK', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Label semantik visual neutral mendedahkan jawapan pilihan betul.', action: 'Gunakan penerangan bentuk yang bermakna tanpa menyebut jawapan.' });
  if (config && visualNodes(config).some(visual => /[\u0600-\u06FF]/u.test(String(visual.symbol || '')) && (visual.lang !== 'ar' || visual.dir !== 'rtl'))) addFinding({ severity: 'P1', rule: 'ARABIC_JAWI_DIRECTION', questionId, subjectId: subject.id, topicId: topic.id, confidence: 'high', why: 'Visual Arab/Jawi tidak menetapkan lang=ar dan dir=rtl.', action: 'Tambah metadata bahasa dan arah pada visual.' });

  const fingerprintPayload = {
    subject: subject.id,
    topic: topic.id,
    stem: normalizeKey(stem),
    answer: answerKey,
    accepted: accepted.map(normalizeKey).sort(),
    options: optionKeys.sort()
  };
  manifestRows.push({
    questionId,
    subjectId: subject.id,
    subjectTitle: subject.title,
    topicId: topic.id,
    topicTitle: topic.title,
    difficulty: normalizeKey(question.difficulty) || 'unspecified',
    cognitiveLevel: normalizeKey(question.cognitiveLevel) || 'unspecified',
    questionType: questionTypeFor(question, config),
    answerType: answerTypeFor(question, config),
    interactionType: config?.type || 'standard',
    interactiveClassification: config ? 'AUTO_SAFE' : suitability.category === 'teacher_review' ? 'TEACHER_REVIEW' : 'KEEP_STANDARD',
    acceptedAnswerCount: accepted.length,
    hasVisual: hasVisual(question, config),
    hasHint: Boolean(normalizeText(question.hint)),
    hasExplanation: Boolean(normalizeText(question.explanation)),
    fingerprint: sha256(JSON.stringify(fingerprintPayload)),
    qualityFlags: []
  });
}

const exactGroups = [];
const exactMap = new Map();
for (const row of manifestRows) {
  const source = questionIndex.get(row.questionId)?.question || {};
  const key = `${row.subjectId}/${row.topicId}/${normalizeKey(source.q || source.question)}/${normalizeKey(source.answer)}`;
  if (!exactMap.has(key)) exactMap.set(key, []);
  exactMap.get(key).push(row.questionId);
}
for (const ids of exactMap.values()) {
  if (ids.length < 2) continue;
  exactGroups.push(ids);
  const first = questionIndex.get(ids[0]);
  addFinding({ severity: 'P2', rule: 'EXACT_SEMANTIC_DUPLICATE', questionId: ids[0], subjectId: first.subject.id, topicId: first.topic.id, why: `${ids.length} soalan mempunyai stem dan jawapan semantik yang sama.`, action: 'Sahkan pengulangan ini mempunyai tujuan pedagogi atau pelbagaikan konstruk.', relatedQuestionIds: ids.slice(1) });
}

const nearGroups = [];
const candidateGroups = new Map();
for (const row of manifestRows) {
  const source = questionIndex.get(row.questionId)?.question || {};
  const key = `${row.subjectId}/${row.topicId}/${normalizeKey(source.answer)}`;
  if (!candidateGroups.has(key)) candidateGroups.set(key, []);
  candidateGroups.get(key).push(row);
}
const nearSeen = new Set();
for (const rows of candidateGroups.values()) {
  for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < rows.length; rightIndex += 1) {
      const left = rows[leftIndex];
      const right = rows[rightIndex];
      const leftQuestion = questionIndex.get(left.questionId)?.question || {};
      const rightQuestion = questionIndex.get(right.questionId)?.question || {};
      const leftStem = normalizeKey(leftQuestion.q || leftQuestion.question);
      const rightStem = normalizeKey(rightQuestion.q || rightQuestion.question);
      if (leftStem === rightStem || Math.min(leftStem.split(' ').length, rightStem.split(' ').length) < 6) continue;
      const similarity = jaccardSimilarity(leftStem, rightStem);
      if (similarity < Number(policy.nearDuplicateThreshold || 0.92)) continue;
      const key = [left.questionId, right.questionId].sort().join(':');
      if (nearSeen.has(key)) continue;
      nearSeen.add(key);
      const group = { questionIds: [left.questionId, right.questionId], similarity: Number(similarity.toFixed(3)) };
      nearGroups.push(group);
      addFinding({ severity: 'P2', rule: 'NEAR_SEMANTIC_DUPLICATE', questionId: left.questionId, subjectId: left.subjectId, topicId: left.topicId, why: `Stem sangat hampir sama (${group.similarity}) dengan ${right.questionId}.`, action: 'Semak sama ada kedua-duanya menguji bukti atau konteks yang berbeza.', relatedQuestionIds: [right.questionId] });
    }
  }
}

const templateClusters = [];
const templateMap = new Map();
for (const row of manifestRows) {
  const source = questionIndex.get(row.questionId)?.question || {};
  const key = `${row.subjectId}/${row.topicId}/${templateKey(source.q || source.question)}`;
  if (!templateMap.has(key)) templateMap.set(key, []);
  templateMap.get(key).push(row.questionId);
}
for (const ids of templateMap.values()) {
  if (ids.length < Number(policy.templateClusterMinimum || 12)) continue;
  const answers = new Set(ids.map(id => normalizeKey(questionIndex.get(id)?.question?.answer)));
  const answerDiversity = answers.size / ids.length;
  if (answerDiversity > 0.25 && ids.length < 20) continue;
  const first = questionIndex.get(ids[0]);
  const cluster = { representativeQuestionId: ids[0], questionCount: ids.length, answerDiversity: Number(answerDiversity.toFixed(3)), questionIds: ids };
  templateClusters.push(cluster);
  addFinding({ severity: 'P2', rule: 'EXCESSIVE_TEMPLATE_CLUSTER', questionId: ids[0], subjectId: first.subject.id, topicId: first.topic.id, why: `${ids.length} soalan berkongsi templat yang sama dengan kepelbagaian jawapan ${cluster.answerDiversity}.`, action: 'Semak nilai latihan berulang dan pelbagaikan konteks jika tiada tujuan khusus.', relatedQuestionIds: ids.slice(1) });
}

const diversity = { overall: makeCounter(), bySubject: {}, byTopic: {} };
for (const row of manifestRows) {
  addMetrics(diversity.overall, row);
  if (!diversity.bySubject[row.subjectId]) diversity.bySubject[row.subjectId] = makeCounter();
  if (!diversity.byTopic[`${row.subjectId}/${row.topicId}`]) diversity.byTopic[`${row.subjectId}/${row.topicId}`] = makeCounter();
  addMetrics(diversity.bySubject[row.subjectId], row);
  addMetrics(diversity.byTopic[`${row.subjectId}/${row.topicId}`], row);
}

const simulations = {
  deterministicSeeds: policy.adaptiveSeeds || [1103, 2207, 3301],
  topicSessions: 0,
  adaptiveSessions: 0,
  questionsSelected: 0,
  repeatedQuestionFailures: 0,
  impossibleInteractionFailures: 0,
  emptyPools: findings.filter(item => item.rule === 'EMPTY_QUESTION_POOL').length,
  shortfalls: 0,
  answerPositionRuns: 0,
  uncoveredTopics: []
};
const coveredTopics = new Set();
for (const subject of subjects) {
  for (const topic of subject.topics || []) {
    for (const seed of simulations.deterministicSeeds) {
      const selected = deterministicShuffle(topic.questions || [], seed).slice(0, Math.min(10, (topic.questions || []).length));
      simulations.topicSessions += 1;
      simulations.questionsSelected += selected.length;
      const ids = selected.map(question => question.id);
      if (new Set(ids).size !== ids.length) simulations.repeatedQuestionFailures += 1;
      if (selected.length) coveredTopics.add(`${subject.id}/${topic.id}`);
      let previousPosition = null;
      let positionRun = 0;
      for (const question of selected) {
        const config = getInteractiveQuestionConfig(question);
        if (question.interaction && validateInteractiveQuestionConfig(question.interaction).length) simulations.impossibleInteractionFailures += 1;
        const options = optionsFor(question).map(normalizeKey);
        const position = options.indexOf(normalizeKey(question.answer));
        if (position >= 0 && position === previousPosition) positionRun += 1;
        else positionRun = position >= 0 ? 1 : 0;
        if (positionRun === 4) simulations.answerPositionRuns += 1;
        previousPosition = position;
      }
    }
  }
  for (const seed of simulations.deterministicSeeds) {
    for (const difficulty of ['mudah', 'sederhana', 'sukar']) {
      const session = buildAdaptivePracticeSession({}, subjects, {
        subjectId: subject.id,
        questionCount: 10,
        difficulty,
        seed: `${subject.id}:${difficulty}:${seed}`,
        sessionId: `question-release-${subject.id}-${difficulty}-${seed}`
      });
      simulations.adaptiveSessions += 1;
      simulations.questionsSelected += session.questions.length;
      if (session.questions.length !== new Set(session.questions.map(question => question.id)).size) simulations.repeatedQuestionFailures += 1;
      if (session.metadata.shortfall) simulations.shortfalls += 1;
      for (const question of session.questions) coveredTopics.add(`${question.subjectId}/${question.topicId}`);
    }
  }
}
simulations.uncoveredTopics = Object.keys(topicCounts).filter(key => !coveredTopics.has(key));
if (simulations.repeatedQuestionFailures) addFinding({ severity: 'P0', rule: 'SESSION_REPEAT_FAILURE', confidence: 'high', why: `${simulations.repeatedQuestionFailures} sesi deterministik mengulangi ID soalan.`, action: 'Betulkan pemilih sesi supaya satu ID tidak berulang dalam sesi yang sama.' });
if (simulations.impossibleInteractionFailures) addFinding({ severity: 'P0', rule: 'SESSION_INTERACTION_FAILURE', confidence: 'high', why: `${simulations.impossibleInteractionFailures} kombinasi interaksi tidak boleh dijalankan.`, action: 'Betulkan konfigurasi interaktif sebelum pelepasan.' });
if (simulations.shortfalls) addFinding({ severity: 'P1', rule: 'ADAPTIVE_SESSION_SHORTFALL', confidence: 'high', why: `${simulations.shortfalls} sesi adaptif tidak dapat memenuhi bilangan soalan diminta.`, action: 'Semak pool, penapis subjek dan fallback adaptif.' });
if (simulations.uncoveredTopics.length) addFinding({ severity: 'P2', rule: 'TOPIC_STARVATION', why: `${simulations.uncoveredTopics.length} topik tidak pernah dipilih dalam simulasi.`, action: 'Semak berat dan laluan pemilihan topik.', relatedQuestionIds: simulations.uncoveredTopics });
if (simulations.answerPositionRuns) addFinding({ severity: 'P2', rule: 'ANSWER_POSITION_PATTERN', why: `${simulations.answerPositionRuns} sesi mempunyai sekurang-kurangnya empat kedudukan jawapan betul berturut-turut.`, action: 'Semak pengacakan kedudukan jawapan dalam sesi.' });

const legacyJawiReport = readJson(path.join(REPORT_DIRECTORY, 'jawi-cleanup-report.json'), { findings: [] });
for (const legacyFinding of legacyJawiReport.findings || []) {
  addFinding({
    severity: 'P1',
    rule: 'JAWI_ACCEPTED_TRANSLITERATIONS',
    questionId: String(legacyFinding.questionId || ''),
    subjectId: 'islam',
    topicId: 'jawi',
    confidence: 'high',
    why: `Validator Jawi lama mengesan beberapa transliterasi diterima: ${(legacyFinding.acceptedAnswers || []).join(', ')}.`,
    action: 'Sahkan variasi transliterasi dengan guru Pendidikan Islam dan kekalkan satu jawapan kanonik.'
  });
}

for (const row of manifestRows) {
  const baseFlags = [];
  if (row.interactionType !== 'standard') baseFlags.push('INTERACTIVE');
  if (row.hasVisual) baseFlags.push('VISUAL');
  if (row.interactiveClassification === 'TEACHER_REVIEW') baseFlags.push('INTERACTION_TEACHER_REVIEW');
  row.qualityFlags = [...new Set([...baseFlags, ...(flagsByQuestion.get(row.questionId) || [])])].sort();
}

manifestRows.sort((left, right) => left.questionId.localeCompare(right.questionId));
const questionDigest = sha256(manifestRows.map(row => `${row.questionId}:${row.fingerprint}`).join('\n'));
const validatorResultsDocument = readJson(VALIDATOR_RESULTS_PATH, { validators: [] });
const validatorResults = Array.isArray(validatorResultsDocument.validators) ? validatorResultsDocument.validators : [];
const validatorSourceFiles = [...new Set([
  path.relative(ROOT, import.meta.filename),
  'scripts/validate/questionReleaseGate.mjs',
  path.relative(ROOT, POLICY_PATH),
  path.relative(ROOT, ALLOWLIST_PATH),
  ...validatorResults.map(item => item.script).filter(Boolean)
])].sort();
const validatorDigest = sha256(validatorSourceFiles.map(filePath => {
  const absolutePath = path.resolve(ROOT, filePath);
  return `${filePath}:${fs.existsSync(absolutePath) ? sha256(fs.readFileSync(absolutePath)) : 'missing'}`;
}).join('\n'));
const metadata = {
  generatedAt,
  gitCommitSha,
  workingTreeDirty,
  questionCount: manifestRows.length,
  subjectCounts,
  validatorVersion: VALIDATOR_VERSION,
  questionDigest,
  validatorDigest
};

if (args.has('--verify-evidence')) {
  const problems = [];
  for (const filePath of EVIDENCE_FILES) {
    const evidence = readJson(filePath);
    const evidenceMetadata = evidence?.metadata;
    if (!evidenceMetadata) problems.push(`${path.basename(filePath)}:missing_metadata`);
    else {
      if (evidenceMetadata.gitCommitSha !== metadata.gitCommitSha) problems.push(`${path.basename(filePath)}:commit_mismatch`);
      if (evidenceMetadata.questionCount !== metadata.questionCount) problems.push(`${path.basename(filePath)}:question_count_mismatch`);
      if (evidenceMetadata.validatorVersion !== metadata.validatorVersion) problems.push(`${path.basename(filePath)}:validator_version_mismatch`);
      if (evidenceMetadata.questionDigest !== metadata.questionDigest) problems.push(`${path.basename(filePath)}:question_digest_mismatch`);
      if (evidenceMetadata.validatorDigest !== metadata.validatorDigest) problems.push(`${path.basename(filePath)}:validator_digest_mismatch`);
      if (JSON.stringify(evidenceMetadata.subjectCounts) !== JSON.stringify(metadata.subjectCounts)) problems.push(`${path.basename(filePath)}:subject_counts_mismatch`);
    }
  }
  console.log(JSON.stringify({ status: problems.length ? 'STALE' : 'FRESH', metadata, problems }, null, 2));
  process.exit(problems.length ? 1 : 0);
}

const baseline = readJson(BASELINE_PATH, { questions: {} });
const currentById = Object.fromEntries(manifestRows.map(row => [row.questionId, {
  fingerprint: row.fingerprint,
  subjectId: row.subjectId,
  topicId: row.topicId
}]));
const baselineQuestions = baseline.questions || {};
const changes = {
  baselineAvailable: Object.keys(baselineQuestions).length > 0,
  new: Object.keys(currentById).filter(id => !baselineQuestions[id]),
  changed: Object.keys(currentById).filter(id => baselineQuestions[id] && baselineQuestions[id].fingerprint !== currentById[id].fingerprint),
  removed: Object.keys(baselineQuestions).filter(id => !currentById[id])
};

if (args.has('--update-baseline')) {
  fs.mkdirSync(CONFIG_DIRECTORY, { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify({ metadata, reviewedAt: generatedAt.slice(0, 10), questions: currentById }, null, 2)}\n`);
}

const failedValidators = validatorResults.filter(item => item.status !== 'PASS');
if (!validatorResults.length && !args.has('--update-baseline')) addFinding({ severity: 'P0', rule: 'MISSING_VALIDATOR_EVIDENCE', confidence: 'high', why: 'Audit kanonik tidak menerima keputusan validator prasyarat.', action: 'Jalankan npm run validate:questions:release, bukan audit kanonik secara berasingan.' });

const severityCounts = ['P0', 'P1', 'P2', 'P3'].reduce((counts, severity) => {
  counts[severity] = findings.filter(item => item.severity === severity).length;
  return counts;
}, {});
const highConfidenceP1 = findings.filter(item => item.severity === 'P1' && item.confidence === 'high').length;
const blocking = severityCounts.P0 > 0 || highConfidenceP1 > 0 || failedValidators.length > 0 || (policy.blockOnP2 === true && severityCounts.P2 > 0);
const teacherCandidates = findings.filter(item => ['P1', 'P2'].includes(item.severity));
const maximumReviewItems = Number(policy.maximumTeacherReviewItems || 200);
const teacherReviewItems = teacherCandidates.slice(0, maximumReviewItems).map(item => {
  const source = questionIndex.get(item.questionId);
  return {
    questionId: item.questionId || null,
    subject: source?.subject?.title || item.subjectId || 'Bank soalan',
    topic: source?.topic?.title || item.topicId || 'Lintas topik',
    severity: item.severity,
    issueType: item.rule,
    question: normalizeText(source?.question?.q || source?.question?.question),
    answer: normalizeText(source?.question?.answer),
    whyFlagged: item.why,
    suggestedReviewAction: item.suggestedReviewAction,
    relatedQuestionIds: item.relatedQuestionIds
  };
});
const readiness = blocking
  ? 'NOT_READY'
  : teacherReviewItems.length
    ? 'READY_WITH_TEACHER_REVIEW'
    : 'READY_FOR_BETA';

const manifest = { metadata, changes, questions: manifestRows };
const reviewQueue = {
  metadata,
  policy: { blockOnP2: policy.blockOnP2 === true, maximumTeacherReviewItems: maximumReviewItems },
  summary: { candidates: teacherCandidates.length, included: teacherReviewItems.length, omitted: Math.max(0, teacherCandidates.length - teacherReviewItems.length) },
  items: teacherReviewItems
};
const report = {
  metadata,
  status: readiness,
  releasePolicy: { blockOnP2: policy.blockOnP2 === true, blockers: ['P0', 'P1_HIGH_CONFIDENCE', 'REQUIRED_VALIDATOR_FAILURE'] },
  summary: {
    totalQuestions: manifestRows.length,
    subjects: subjects.length,
    topics: Object.keys(topicCounts).length,
    severity: severityCounts,
    highConfidenceP1,
    teacherReview: teacherReviewItems.length,
    exactDuplicateGroups: exactGroups.length,
    nearDuplicateGroups: nearGroups.length,
    templateClusters: templateClusters.length,
    interactiveCoverage: diversity.overall.total ? Number(((manifestRows.filter(row => row.interactionType !== 'standard').length / diversity.overall.total) * 100).toFixed(2)) : 0,
    visualCoverage: diversity.overall.total ? Number(((diversity.overall.visual / diversity.overall.total) * 100).toFixed(2)) : 0
  },
  counts: { subjectCounts, topicCounts },
  changes,
  duplicateStats: { exactGroups, nearGroups, templateClusters },
  diversity,
  simulations,
  staleReportProtection: { status: 'FRESHLY_GENERATED', evidenceFiles: EVIDENCE_FILES.map(file => path.relative(ROOT, file).replace(/\\/g, '/')), checkedByDigest: true },
  validatorResults,
  failedValidators,
  allowlist: { entries: allowlistEntries.length, suppressedFindings: suppressedFindings.length, suppressed: suppressedFindings },
  findings
};

fs.mkdirSync(REPORT_DIRECTORY, { recursive: true });
fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(REVIEW_JSON, `${JSON.stringify(reviewQueue, null, 2)}\n`);
fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

const subjectRows = Object.entries(subjectCounts).map(([subject, count]) => `| ${subject} | ${count} |`).join('\n');
const validatorRows = validatorResults.map(item => `| ${item.id} | ${item.status} | ${item.durationMs} |`).join('\n') || '| Tiada | FAIL | 0 |';
const reviewRows = teacherReviewItems.length
  ? teacherReviewItems.map(item => `| ${markdownSafe(item.questionId || '-')} | ${markdownSafe(item.subject)} | ${markdownSafe(item.topic)} | ${item.severity} | ${markdownSafe(item.issueType)} | ${markdownSafe(item.whyFlagged)} |`).join('\n')
  : '| - | - | - | - | - | Tiada item semakan. |';

fs.writeFileSync(REPORT_MARKDOWN, `# Question Release Audit\n\nStatus: **${readiness}**\n\n- Generated: ${generatedAt}\n- Git commit: ${gitCommitSha}\n- Working tree dirty: ${workingTreeDirty}\n- Validator version: ${VALIDATOR_VERSION}\n- Question digest: ${questionDigest}\n\n## Summary\n\n- Total questions: ${manifestRows.length}\n- Subjects: ${subjects.length}\n- Topics: ${Object.keys(topicCounts).length}\n- P0: ${severityCounts.P0}\n- P1: ${severityCounts.P1}\n- P2: ${severityCounts.P2}\n- P3: ${severityCounts.P3}\n- Teacher review queue: ${teacherReviewItems.length}\n- Exact duplicate groups: ${exactGroups.length}\n- Near duplicate groups: ${nearGroups.length}\n- Template clusters: ${templateClusters.length}\n- Interactive coverage: ${report.summary.interactiveCoverage}%\n- Visual coverage: ${report.summary.visualCoverage}%\n\n## Subject Counts\n\n| Subject | Questions |\n| --- | ---: |\n${subjectRows}\n\n## Change-aware Audit\n\n- Baseline available: ${changes.baselineAvailable}\n- New: ${changes.new.length}\n- Changed: ${changes.changed.length}\n- Removed: ${changes.removed.length}\n\n## Required Validators\n\n| Validator | Status | Duration ms |\n| --- | --- | ---: |\n${validatorRows}\n\n## Release Decision\n\nP0 and high-confidence P1 are blocking. P2 is ${policy.blockOnP2 === true ? 'blocking' : 'reported for teacher review but non-blocking'} by explicit policy.\n`);

fs.writeFileSync(REVIEW_MARKDOWN, `# Teacher Review Queue\n\n- Generated: ${generatedAt}\n- Git commit: ${gitCommitSha}\n- Validator version: ${VALIDATOR_VERSION}\n- Question count: ${manifestRows.length}\n- Included: ${teacherReviewItems.length}\n- Omitted after quality cap: ${Math.max(0, teacherCandidates.length - teacherReviewItems.length)}\n\n| Question ID | Subject | Topic | Severity | Issue | Why flagged |\n| --- | --- | --- | --- | --- | --- |\n${reviewRows}\n`);

console.log(JSON.stringify({
  status: readiness,
  summary: report.summary,
  changes: { baselineAvailable: changes.baselineAvailable, new: changes.new.length, changed: changes.changed.length, removed: changes.removed.length },
  validatorFailures: failedValidators.map(item => item.id),
  evidence: report.staleReportProtection
}, null, 2));

if (blocking) process.exitCode = 1;
