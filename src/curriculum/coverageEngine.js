import { buildCurriculumRows, buildTeacherPortalSnapshot } from './curriculumEngine.js';

function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function hasExplicitMapping(row = {}) {
  return Boolean(row.skspSource && row.skspSource !== 'inferred');
}

function statusFor(best = 0, attempts = 0) {
  if (!attempts) return 'NOT_STARTED';
  if (best >= 80) return 'MASTERED';
  if (best >= 50) return 'LEARNING';
  return 'NEEDS_PRACTICE';
}

function toSafeCount(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function summarizeMinutes(rows = []) {
  return Math.round(rows.reduce((sum, row) => sum + (row.estimatedTime || 0), 0) / 60);
}

function buildGroupedMastery(rows = []) {
  const grouped = new Map();
  rows.forEach(row => {
    const key = `${row.subjectId}_${row.SK}_${row.SP}`;
    const current = grouped.get(key) || {
      subjectId: row.subjectId,
      subject: row.subject,
      SK: row.SK,
      SP: row.SP,
      strand: row.strand,
      topicIds: new Set(),
      questionCount: 0,
      masteredCount: 0,
      attemptedCount: 0,
      best: 0,
      status: 'NOT_STARTED'
    };
    current.topicIds.add(row.topicId);
    current.questionCount += 1;
    if (row.attempts) current.attemptedCount += 1;
    if (row.status === 'MASTERED') current.masteredCount += 1;
    current.best = Math.max(current.best, row.best);
    grouped.set(key, current);
  });

  return [...grouped.values()].map(item => {
    const coverage = item.questionCount ? Math.round((item.attemptedCount / item.questionCount) * 100) : 0;
    const mastery = item.questionCount ? Math.round((item.masteredCount / item.questionCount) * 100) : 0;
    return {
      ...item,
      topicIds: [...item.topicIds],
      coverage,
      mastery,
      status: mastery >= 80 ? 'MASTERED' : coverage > 0 ? 'LEARNING' : 'MISSING'
    };
  });
}

export function getCurriculumCoverageState(summary = {}) {
  const questionCount = toSafeCount(summary.questionCount, 0);
  const mappedQuestionCount = toSafeCount(summary.mappedQuestionCount, 0);
  const mappedTopicCount = toSafeCount(summary.mappedTopicCount, 0);
  const mappedSkSpCount = toSafeCount(summary.mappedSkSpCount, 0);
  const hasMapping = Boolean(summary.hasMetadata || mappedQuestionCount > 0 || mappedTopicCount > 0 || mappedSkSpCount > 0);
  const hasEvidence = Boolean(summary.hasCoverageEvidence);
  const isPartial = hasMapping && questionCount > 0 && mappedQuestionCount > 0 && mappedQuestionCount < questionCount;
  const hasMeasuredZero = hasMapping && hasEvidence && (
    toSafeCount(summary.coveragePercent, 0) === 0
    || toSafeCount(summary.masteryPercent, 0) === 0
    || toSafeCount(summary.missing, 0) === 0
  );

  const metrics = isPartial
    ? [
        { label: 'Topik Berpeta', value: mappedTopicCount, subtitle: 'Dengan SK/SP yang disahkan' },
        { label: 'Soalan Berpeta', value: mappedQuestionCount, subtitle: 'Set data yang boleh diaudit' },
        { label: 'SK/SP Berpeta', value: mappedSkSpCount, subtitle: 'Item kurikulum yang disahkan' },
        { label: 'Anggaran Minit', value: toSafeCount(summary.mappedEstimatedMinutes, 0), subtitle: 'Berdasarkan kandungan berpeta' }
      ]
    : [
        { label: 'SK/SP Diliputi', value: `${toSafeCount(summary.coveragePercent, 0)}%` },
        { label: 'Penguasaan SK/SP', value: `${toSafeCount(summary.masteryPercent, 0)}%` },
        { label: 'SK/SP Belum Cukup', value: toSafeCount(summary.missing, 0) },
        { label: 'Anggaran Minit', value: toSafeCount(summary.estimatedMinutes, 0) }
      ];

  if (!hasMapping) {
    return {
      hasMapping: false,
      hasEvidence: false,
      hasMeasuredZero: false,
      state: 'no-mapping',
      title: 'Data liputan belum tersedia',
      message: 'Data liputan kurikulum belum tersedia untuk subjek ini.',
      metrics: []
    };
  }

  if (!hasEvidence) {
    return {
      hasMapping: true,
      hasEvidence: false,
      hasMeasuredZero: false,
      state: 'no-evidence',
      title: 'Belum ada bukti latihan',
      message: 'Belum ada data latihan yang mencukupi untuk mengira liputan.',
      metrics: []
    };
  }

  if (isPartial) {
    return {
      hasMapping: true,
      hasEvidence: true,
      hasMeasuredZero,
      state: 'partial',
      title: 'Liputan separa',
      message: 'Sebahagian topik belum dipetakan kepada SK/SP. Paparan ini hanya menunjukkan metrik yang boleh disahkan.',
      metrics
    };
  }

  return {
    hasMapping: true,
    hasEvidence: true,
    hasMeasuredZero,
    state: 'available',
    title: 'Liputan tersedia',
    message: '',
    metrics
  };
}

export function buildCurriculumCoverage(profile = {}, subjects = []) {
  const rows = buildCurriculumRows(subjects);
  const enriched = rows.map(row => {
    const progress = profile.progress?.[progressKey(row.subjectId, row.topicId)] || {};
    return {
      ...row,
      best: progress.best || 0,
      attempts: progress.attempts || 0,
      status: statusFor(progress.best || 0, progress.attempts || 0),
      topicKey: progressKey(row.subjectId, row.topicId)
    };
  });
  const mappedRows = enriched.filter(hasExplicitMapping);
  const skSpMastery = buildGroupedMastery(enriched);
  const mappedSkSpMastery = buildGroupedMastery(mappedRows);

  const missing = skSpMastery.filter(item => item.status !== 'MASTERED').sort((a, b) => a.coverage - b.coverage || a.mastery - b.mastery);
  const total = skSpMastery.length;
  const mastered = skSpMastery.filter(item => item.status === 'MASTERED').length;
  const covered = skSpMastery.filter(item => item.coverage > 0).length;
  const summary = {
    total,
    covered,
    mastered,
    missing: missing.length,
    coveragePercent: total ? Math.round((covered / total) * 100) : 0,
    masteryPercent: total ? Math.round((mastered / total) * 100) : 0,
    questionCount: rows.length,
    estimatedMinutes: summarizeMinutes(rows),
    hasMetadata: mappedRows.length > 0,
    hasCoverageEvidence: enriched.some(row => row.attempts > 0),
    mappedQuestionCount: mappedRows.length,
    mappedTopicCount: new Set(mappedRows.map(row => row.topicKey)).size,
    mappedSkSpCount: mappedSkSpMastery.length,
    mappedEstimatedMinutes: summarizeMinutes(mappedRows),
    missingCount: missing.length
  };

  return {
    rows: enriched,
    skSpMastery,
    missingSkSp: missing.slice(0, 20),
    topicGaps: missing.reduce((gaps, item) => {
      item.topicIds.forEach(topicId => {
        gaps[`${item.subjectId}_${topicId}`] = item;
      });
      return gaps;
    }, {}),
    summary,
    teacherPortal: buildTeacherPortalSnapshot(subjects, { summary, skSpMastery })
  };
}
