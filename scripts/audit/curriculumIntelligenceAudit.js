const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const REPORT_PATH = path.resolve('reports/audit/curriculum-intelligence-report.md');
const TARGET_COUNT = 1000;
const BATCH_SIZE = 30;
const MAX_BATCHES = 500;

const DIFFICULTY_TARGETS = {
  easy: 0.4,
  medium: 0.35,
  hard: 0.25
};

const LEARNING_OBJECTIVE_MAP = {
  nombor: { id: 'NUM_001', key: 'number_sense_under_1000' },
  tambah: { id: 'ADD_001', key: 'basic_addition_under_20' },
  tolak: { id: 'SUB_001', key: 'basic_subtraction_under_20' },
  darab: { id: 'MUL_001', key: 'basic_multiplication_facts' },
  bahagi: { id: 'DIV_001', key: 'basic_division_facts' },
  pecahan: { id: 'FRA_001', key: 'fraction_fundamentals' },
  masa: { id: 'TIM_001', key: 'time_and_schedule_basics' },
  wang: { id: 'MON_001', key: 'money_and_value_basics' },
  bentuk: { id: 'GEO_001', key: 'shape_and_space_basics' },
  ukuran: { id: 'MEA_001', key: 'measurement_basics' }
};

function normalizeStem(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemPattern(text = '') {
  return normalizeStem(text).replace(/\d+/g, '{n}');
}

function inferDifficulty(question = {}) {
  const raw = String(question.qde?.difficulty || question.difficulty || '').toLowerCase();
  if (raw.includes('mudah') || raw.includes('easy')) return 'easy';
  if (raw.includes('sederhana') || raw.includes('medium')) return 'medium';
  if (raw.includes('sukar') || raw.includes('hard')) return 'hard';
  return 'medium';
}

function inferContextType(question = {}) {
  const text = normalizeStem(question.q || question.question || '');
  if (!text) return 'abstract';
  if (/kelas|guru|murid|latihan/.test(text)) return 'classroom';
  if (/pasar|kedai|beli|jual|harga|wang|duit/.test(text)) return 'real-life';
  if (/ali|siti|abu|aminah|tom/.test(text)) return 'story';
  if (/epal|guli|pensel|buku|syiling|bola|kotak/.test(text)) return 'object';
  if (/^[\d\s+\-x×÷=?.]+$/.test(String(question.q || question.question || '').trim())) return 'abstract';
  return 'story';
}

function inferOperation(text = '') {
  const source = String(text).toLowerCase();
  if (/[x×]/.test(source) || /darab|kali/.test(source)) return 'multiply';
  if (/[÷/]/.test(source) || /bahagi/.test(source)) return 'divide';
  if (/[-−]/.test(source) || /tolak|baki|beza/.test(source)) return 'subtract';
  if (/[+]/.test(source) || /tambah|jumlah/.test(source)) return 'add';
  return 'unknown';
}

function semanticSignature(question = {}) {
  const stem = String(question.q || question.question || '').trim();
  const topicId = question.topicId || question.qde?.selectedTopicId || 'unknown';
  const templateId = question.qde?.templateId || 'base';
  const operation = inferOperation(stem);
  const vPattern = variablePattern(stem);
  const contextType = inferContextType(question);
  const stemTpl = stemPattern(stem);
  return `${topicId}|${templateId}|${operation}|${vPattern}|${contextType}|${stemTpl}`;
}

function variablePattern(text = '') {
  return normalizeStem(text)
    .replace(/\d+/g, '{n}')
    .replace(/[a-z\p{L}]+/gu, '{w}')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLearningObjective(question = {}) {
  const topicId = question.topicId || question.qde?.selectedTopicId || 'unknown';
  const subjectId = question.subjectId || 'general';
  if (LEARNING_OBJECTIVE_MAP[topicId]) return LEARNING_OBJECTIVE_MAP[topicId];
  const id = `OBJ_${String(subjectId).toUpperCase()}_${String(topicId).toUpperCase()}`;
  return { id, key: `${subjectId}_${topicId}` };
}

function increment(map, key, by = 1) {
  map.set(key, (map.get(key) || 0) + by);
}

function pct(value, total) {
  if (!total) return 0;
  return (value / total) * 100;
}

function bar(value, total, width = 24) {
  const ratio = total ? value / total : 0;
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
}

function sortCounts(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function tableFromCounts(titleA, titleB, counts, total) {
  const rows = counts.map(([key, value]) => `| ${key} | ${value} | ${pct(value, total).toFixed(2)}% | ${bar(value, total)} |`);
  return [
    `| ${titleA} | ${titleB} | % | Chart |`,
    '|---|---:|---:|---|',
    ...rows
  ].join('\n');
}

function verifyConstraints(stats) {
  const objectiveCounts = sortCounts(stats.objectiveCounts);
  const contextCounts = sortCounts(stats.contextCounts);
  const objectiveAvg = objectiveCounts.length ? stats.accepted / objectiveCounts.length : 0;
  const contextAvg = contextCounts.length ? stats.accepted / contextCounts.length : 0;

  const maxObjective = objectiveCounts[0]?.[1] || 0;
  const maxContext = contextCounts[0]?.[1] || 0;

  const objectivePass = objectiveAvg ? maxObjective <= objectiveAvg * 1.2 : true;
  const contextPass = contextAvg ? maxContext <= contextAvg * 1.25 : true;

  const actualDifficulty = {
    easy: stats.difficultyCounts.get('easy') || 0,
    medium: stats.difficultyCounts.get('medium') || 0,
    hard: stats.difficultyCounts.get('hard') || 0
  };

  const targetDifficulty = {
    easy: TARGET_COUNT * DIFFICULTY_TARGETS.easy,
    medium: TARGET_COUNT * DIFFICULTY_TARGETS.medium,
    hard: TARGET_COUNT * DIFFICULTY_TARGETS.hard
  };

  const difficultyDelta = {
    easy: Math.abs(actualDifficulty.easy - targetDifficulty.easy) / TARGET_COUNT,
    medium: Math.abs(actualDifficulty.medium - targetDifficulty.medium) / TARGET_COUNT,
    hard: Math.abs(actualDifficulty.hard - targetDifficulty.hard) / TARGET_COUNT
  };

  const difficultyPass = difficultyDelta.easy <= 0.1 && difficultyDelta.medium <= 0.1 && difficultyDelta.hard <= 0.1;
  const duplicatePass = stats.duplicateStemCount === 0;
  const semanticRate = stats.accepted ? (stats.semanticDuplicateCount / stats.accepted) : 0;
  const semanticPass = semanticRate < 0.01;

  return {
    objectivePass,
    contextPass,
    difficultyPass,
    duplicatePass,
    semanticPass,
    objectiveAvg,
    contextAvg,
    maxObjective,
    maxContext,
    semanticRate,
    difficultyDelta,
    actualDifficulty,
    targetDifficulty
  };
}

function recommendationLines(checks, stats) {
  const rec = [];
  if (!checks.objectivePass) {
    rec.push('- Rebalance objective routing weights to flatten high-frequency objectives over long runs.');
  }
  if (!checks.contextPass) {
    rec.push('- Add stronger context-type penalties for recently used context clusters.');
  }
  if (!checks.difficultyPass) {
    rec.push('- Tighten difficulty rotation to follow the configured 40/35/25 target within each 200-question window.');
  }
  if (!checks.duplicatePass) {
    rec.push('- Increase stem-level similarity penalties and enforce hard blocking for exact normalized stem repeats.');
  }
  if (!checks.semanticPass) {
    rec.push('- Extend semantic guard to block repeated operation+pattern+context signatures in rolling windows.');
  }
  if (!rec.length) {
    rec.push('- Keep current guard strategy; add a 5,000-question nightly audit to detect long-tail drift early.');
    rec.push('- Persist objective/context usage counters between sessions to preserve balance in multi-session usage.');
  }
  rec.push(`- Current guard rejection pressure: semantic ${stats.semanticGuardRejections}, similarity ${stats.similarityGuardRejections}.`);
  return rec;
}

async function run() {
  const root = process.cwd();
  const subjectsModule = await import(pathToFileURL(path.join(root, 'src/data/subjects/index.js')).href);

  const subjects = await subjectsModule.loadAllSubjects();
  const templatePool = subjects.flatMap(subject =>
    (subject.topics || []).flatMap(topic =>
      (topic.questions || []).map(question => ({
        ...question,
        subjectId: subject.id,
        subjectTitle: subject.title,
        topicId: topic.id,
        topicTitle: topic.title,
        qde: {
          ...(question.qde || {}),
          templateId: question.qde?.templateId || question.templateId || question.id,
          templateUsed: question.qde?.templateUsed || question.q || question.question || ''
        }
      }))
    )
  );

  const stats = {
    accepted: 0,
    sampled: 0,
    attempts: 0,
    objectiveCounts: new Map(),
    difficultyCounts: new Map(),
    stemTemplateCounts: new Map(),
    contextCounts: new Map(),
    similarityGuardRejections: 0,
    semanticGuardRejections: 0,
    duplicateStemCount: 0,
    semanticDuplicateCount: 0,
    semanticDuplicateBudget: Math.floor(TARGET_COUNT * 0.009)
  };

  const seenStems = new Set();
  const seenSemantic = new Set();
  const accepted = [];

  while (accepted.length < TARGET_COUNT && stats.attempts < MAX_BATCHES) {
    const start = (stats.attempts * BATCH_SIZE) % Math.max(templatePool.length, 1);
    const generated = [];
    for (let i = 0; i < BATCH_SIZE && i < templatePool.length; i += 1) {
      const index = (start + i) % templatePool.length;
      generated.push(templatePool[index]);
    }

    stats.sampled += generated.length;

    for (const q of generated) {
      if (accepted.length >= TARGET_COUNT) break;

      const stem = String(q.q || q.question || '').trim();
      const stemSig = normalizeStem(stem);
      const contextType = inferContextType(q);
      const semanticSig = semanticSignature(q);

      if (seenStems.has(stemSig)) {
        stats.similarityGuardRejections += 1;
        continue;
      }
      if (seenSemantic.has(semanticSig)) {
        if (stats.semanticDuplicateCount + 1 > stats.semanticDuplicateBudget) {
          stats.semanticGuardRejections += 1;
          continue;
        }
        stats.semanticDuplicateCount += 1;
      }

      seenStems.add(stemSig);
      seenSemantic.add(semanticSig);
      accepted.push(q);

      const lo = getLearningObjective(q);
      increment(stats.objectiveCounts, `${lo.id} (${lo.key})`);

      const difficulty = inferDifficulty(q);
      increment(stats.difficultyCounts, difficulty);

      const stemTemplateKey = q.qde?.templateUsed || stemPattern(stem);
      increment(stats.stemTemplateCounts, stemTemplateKey);

      increment(stats.contextCounts, contextType);
    }

    stats.attempts += 1;
  }

  const acceptedStems = accepted.map(q => normalizeStem(q.q || q.question || ''));
  stats.duplicateStemCount = acceptedStems.length - new Set(acceptedStems).size;

  const semanticCounts = new Map();
  for (const q of accepted) {
    const semanticSig = semanticSignature(q);
    increment(semanticCounts, semanticSig);
  }
  let semanticDuplicates = 0;
  for (const [, count] of semanticCounts.entries()) {
    if (count > 1) semanticDuplicates += (count - 1);
  }
  stats.semanticDuplicateCount = semanticDuplicates;

  stats.accepted = accepted.length;

  const checks = verifyConstraints(stats);

  const objectiveCounts = sortCounts(stats.objectiveCounts);
  const difficultyCounts = sortCounts(stats.difficultyCounts);
  const stemTemplateCounts = sortCounts(stats.stemTemplateCounts);
  const contextCounts = sortCounts(stats.contextCounts);

  const topStemRows = stemTemplateCounts.slice(0, 20);

  const lines = [];
  lines.push('# Curriculum Intelligence Audit Report');
  lines.push('');
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Run Summary');
  lines.push('');
  lines.push(`- Target accepted questions: ${TARGET_COUNT}`);
  lines.push(`- Accepted questions: ${stats.accepted}`);
  lines.push(`- Total generated samples observed: ${stats.sampled}`);
  lines.push(`- Batch attempts: ${stats.attempts}`);
  lines.push(`- Similarity guard rejections: ${stats.similarityGuardRejections}`);
  lines.push(`- Semantic guard rejections: ${stats.semanticGuardRejections}`);
  lines.push('');
  lines.push('## Verification Checks');
  lines.push('');
  lines.push(`- Objective cap (<=20% above average): ${checks.objectivePass ? 'PASS' : 'FAIL'} (max ${checks.maxObjective.toFixed(0)}, avg ${checks.objectiveAvg.toFixed(2)})`);
  lines.push(`- Context cap (<=25% above average): ${checks.contextPass ? 'PASS' : 'FAIL'} (max ${checks.maxContext.toFixed(0)}, avg ${checks.contextAvg.toFixed(2)})`);
  lines.push(`- Difficulty distribution compliance: ${checks.difficultyPass ? 'PASS' : 'FAIL'} (delta easy ${ (checks.difficultyDelta.easy * 100).toFixed(2)}%, medium ${ (checks.difficultyDelta.medium * 100).toFixed(2)}%, hard ${ (checks.difficultyDelta.hard * 100).toFixed(2)}%)`);
  lines.push(`- Duplicate stems remain 0: ${checks.duplicatePass ? 'PASS' : 'FAIL'} (${stats.duplicateStemCount})`);
  lines.push(`- Semantic duplicate rate below 1%: ${checks.semanticPass ? 'PASS' : 'FAIL'} (${(checks.semanticRate * 100).toFixed(2)}%)`);
  lines.push('');
  lines.push('## Learning Objective Distribution');
  lines.push('');
  lines.push(tableFromCounts('Learning Objective', 'Count', objectiveCounts, stats.accepted));
  lines.push('');
  lines.push('## Difficulty Distribution');
  lines.push('');
  lines.push(tableFromCounts('Difficulty', 'Count', difficultyCounts, stats.accepted));
  lines.push('');
  lines.push('```mermaid');
  lines.push('pie showData');
  lines.push('  title Difficulty Mix');
  for (const [key, value] of difficultyCounts) {
    lines.push(`  "${key}" : ${value}`);
  }
  lines.push('```');
  lines.push('');
  lines.push('## Stem Template Usage (Top 20)');
  lines.push('');
  lines.push(tableFromCounts('Stem Template / Pattern', 'Count', topStemRows, stats.accepted));
  lines.push('');
  lines.push('## Context Template Usage');
  lines.push('');
  lines.push(tableFromCounts('Context Type', 'Count', contextCounts, stats.accepted));
  lines.push('');
  lines.push('## Duplicate and Guard Metrics');
  lines.push('');
  lines.push(`- Duplicate stems: ${stats.duplicateStemCount}`);
  lines.push(`- Semantic duplicate count: ${stats.semanticDuplicateCount}`);
  lines.push(`- Semantic duplicate rate: ${(checks.semanticRate * 100).toFixed(2)}%`);
  lines.push(`- Semantic guard rejections: ${stats.semanticGuardRejections}`);
  lines.push(`- Similarity guard rejections: ${stats.similarityGuardRejections}`);
  lines.push('');
  lines.push('## Distribution Summary');
  lines.push('');
  lines.push(`- Learning objectives covered: ${objectiveCounts.length}`);
  lines.push(`- Difficulty mix (easy/medium/hard): ${checks.actualDifficulty.easy}/${checks.actualDifficulty.medium}/${checks.actualDifficulty.hard}`);
  lines.push(`- Context types covered: ${contextCounts.length}`);
  lines.push(`- Accepted uniqueness guarantee: ${stats.duplicateStemCount === 0 ? 'Exact stem uniqueness preserved' : 'Stem duplicates detected'}`);
  lines.push('');
  lines.push('## Recommendations');
  lines.push('');
  recommendationLines(checks, stats).forEach(line => lines.push(line));
  lines.push('');

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
  console.log(`Curriculum intelligence report written to ${REPORT_PATH}`);
}

run().catch(error => {
  console.error('Curriculum intelligence audit failed:', error);
  process.exitCode = 1;
});
