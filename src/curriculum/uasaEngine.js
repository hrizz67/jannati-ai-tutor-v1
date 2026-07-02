export function summarizeUasaCoverage(curriculumCoverage = {}) {
  const rows = curriculumCoverage.rows || [];
  const byDifficulty = rows.reduce((acc, row) => {
    const key = row.difficulty || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const uasaRows = rows.filter(row => String(row.UASA || '').toLowerCase().includes('uasa'));

  return {
    totalQuestions: rows.length,
    uasaQuestions: uasaRows.length,
    byDifficulty,
    missingSkSp: curriculumCoverage.missingSkSp || []
  };
}

export function recommendMissingSkSp(curriculumCoverage = {}) {
  const missing = curriculumCoverage.missingSkSp || [];
  if (!missing.length) return null;
  const target = missing[0];
  return {
    subjectId: target.subjectId,
    SK: target.SK,
    SP: target.SP,
    reason: `Focus ${target.SK} / ${target.SP} because coverage is ${target.coverage}% and mastery is ${target.mastery}%.`
  };
}
