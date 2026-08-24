const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const REPORT_DIR = path.resolve('reports/audit');
const JSON_PATH = path.join(REPORT_DIR, 'subject-coverage.json');
const MD_PATH = path.join(REPORT_DIR, 'subject-coverage.md');

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function loadSubjects() {
  const modulePath = path.resolve('src/data/subjects/index.js');
  const subjectsModule = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
  return subjectsModule.loadAllSubjects();
}

function recordCount(map, key) {
  const current = map.get(key) || 0;
  map.set(key, current + 1);
  return current + 1;
}

function toSortedArray(map) {
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# Subject Coverage Audit');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Subject | Questions | Unique Stems | Duplicate Stems | Unique Templates | Template Reuse |');
  lines.push('|---|---|---|---|---|---|');
  report.subjects.forEach(subject => {
    lines.push(`| ${subject.id} | ${subject.totalQuestions} | ${subject.uniqueStems} | ${subject.duplicateStemCount} | ${subject.uniqueTemplates} | ${subject.templateReuseCount} |`);
  });
  lines.push('');

  report.subjects.forEach(subject => {
    lines.push(`## ${subject.title} (${subject.id})`);
    lines.push('');
    lines.push(`- Total questions: **${subject.totalQuestions}**`);
    lines.push(`- Unique normalized stems: **${subject.uniqueStems}**`);
    lines.push(`- Duplicate stems: **${subject.duplicateStemCount}**`);
    lines.push(`- Unique templates: **${subject.uniqueTemplates}**`);
    lines.push(`- Template reuse count: **${subject.templateReuseCount}**`);
    lines.push('');
    lines.push('### Per-topic breakdown');
    lines.push('');
    lines.push('| Topic | Questions | Unique Stems | Duplicate Stems |');
    lines.push('|---|---|---|---|');
    subject.topics.forEach(topic => {
      lines.push(`| ${topic.id} | ${topic.totalQuestions} | ${topic.uniqueStems} | ${topic.duplicateStemCount} |`);
    });
    lines.push('');
    if (subject.topTemplateReuses.length) {
      lines.push('### Top reused templates');
      lines.push('');
      lines.push('| Template | Count |');
      lines.push('|---|---|');
      subject.topTemplateReuses.forEach(item => {
        lines.push(`| ${item.value.replace(/\|/g, '\\|')} | ${item.count} |`);
      });
      lines.push('');
    }
    if (subject.topDuplicateStems.length) {
      lines.push('### Top duplicate stems');
      lines.push('');
      lines.push('| Stem | Count |');
      lines.push('|---|---|');
      subject.topDuplicateStems.forEach(item => {
        lines.push(`| ${item.value.replace(/\|/g, '\\|')} | ${item.count} |`);
      });
      lines.push('');
    }
  });

  return lines.join('\n');
}

async function runAudit() {
  ensureReportDir();
  const subjects = await loadSubjects();
  const detectorPath = path.resolve('src/ai/diversity/duplicateDetector.js');
  const duplicateModule = await import(`${pathToFileURL(detectorPath).href}?v=${Date.now()}`);
  const { normalizeStem, templateSignature } = duplicateModule;

  const report = {
    generatedAt: new Date().toISOString(),
    subjects: []
  };

  subjects.forEach(subject => {
    const subjectStemCounts = new Map();
    const subjectTemplateCounts = new Map();
    const subjectTopicStats = [];
    let totalQuestions = 0;

    (subject.topics || []).forEach(topic => {
      const topicStemCounts = new Map();
      const topicQuestions = (topic.questions || []).length;
      totalQuestions += topicQuestions;

      topic.questions.forEach(question => {
        const stem = normalizeStem(question.q || question.question || '');
        recordCount(topicStemCounts, stem);
        recordCount(subjectStemCounts, stem);

        const template = templateSignature(question);
        recordCount(subjectTemplateCounts, template);
      });

      const topicUniqueStems = [...topicStemCounts.keys()].filter(k => k).length;
      const topicDuplicateStemCount = Array.from(topicStemCounts.values()).reduce((count, value) => count + Math.max(0, value - 1), 0);

      subjectTopicStats.push({
        id: topic.id || topic.title || 'unknown',
        title: topic.title || '',
        totalQuestions: topicQuestions,
        uniqueStems: topicUniqueStems,
        duplicateStemCount: topicDuplicateStemCount
      });
    });

    const uniqueStems = [...subjectStemCounts.keys()].filter(k => k).length;
    const duplicateStemCount = Array.from(subjectStemCounts.values()).reduce((count, value) => count + Math.max(0, value - 1), 0);
    const uniqueTemplates = [...subjectTemplateCounts.keys()].filter(k => k).length;
    const templateReuseCount = Array.from(subjectTemplateCounts.values()).reduce((count, value) => count + Math.max(0, value - 1), 0);
    const topTemplateReuses = toSortedArray(subjectTemplateCounts).filter(item => item.count > 1).slice(0, 10);
    const topDuplicateStems = toSortedArray(subjectStemCounts).filter(item => item.count > 1).slice(0, 10);

    report.subjects.push({
      id: subject.id,
      title: subject.title,
      totalQuestions,
      uniqueStems,
      duplicateStemCount,
      uniqueTemplates,
      templateReuseCount,
      topics: subjectTopicStats,
      topTemplateReuses,
      topDuplicateStems
    });
  });

  fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(MD_PATH, buildMarkdown(report), 'utf8');
  console.log(`Audit written to ${JSON_PATH} and ${MD_PATH}`);
}

runAudit().catch(error => {
  console.error('Subject coverage audit failed:', error);
  process.exit(1);
});
