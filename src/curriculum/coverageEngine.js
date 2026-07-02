import { buildCurriculumRows, buildTeacherPortalSnapshot } from './curriculumEngine';

function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function statusFor(best = 0, attempts = 0) {
  if (!attempts) return 'NOT_STARTED';
  if (best >= 80) return 'MASTERED';
  if (best >= 50) return 'LEARNING';
  return 'NEEDS_PRACTICE';
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

  const grouped = new Map();
  enriched.forEach(row => {
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

  const skSpMastery = [...grouped.values()].map(item => {
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
    estimatedMinutes: Math.round(rows.reduce((sum, row) => sum + (row.estimatedTime || 0), 0) / 60)
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
