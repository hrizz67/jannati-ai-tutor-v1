const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const AUDIT_JSON = path.resolve('CURRICULUM_COVERAGE_V2.json');
const AUDIT_MD = path.resolve('CURRICULUM_AUDIT_V2.md');
const SUBJECT_INDEX = path.resolve('src/data/subjects/index.js');
const APP_FILE = path.resolve('src/App.jsx');
const SKSP_MAPPING_FILE = path.resolve('src/curriculum/sksp-mapping.json');

function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

async function loadSubjects() {
  const subjectModule = await import(`${pathToFileURL(SUBJECT_INDEX).href}?v=${Date.now()}`);
  return subjectModule.loadAllSubjects();
}

function questionText(question = {}) {
  return question.q || question.question || question.stem || '';
}

function hasAnswer(question = {}) {
  return question.answer !== undefined || (Array.isArray(question.accepted) && question.accepted.length > 0);
}

function hasExplicitSK(subject = {}, topic = {}, question = {}) {
  return Boolean(question.SK || question.sk || topic.SK || topic.sk || subject.SK || subject.sk);
}

function hasExplicitSP(subject = {}, topic = {}, question = {}) {
  return Boolean(question.SP || question.sp || topic.SP || topic.sp || subject.SP || subject.sp);
}

function loadSkspMapping() {
  if (!fs.existsSync(SKSP_MAPPING_FILE)) return { subjects: {} };
  return JSON.parse(fs.readFileSync(SKSP_MAPPING_FILE, 'utf8'));
}

function mappedSKSP(mapping, subjectId, topicId) {
  return mapping.subjects?.[subjectId]?.topics?.[topicId] || null;
}

function hasLearningOutcome(topic = {}, question = {}) {
  return Boolean(
    question.learningOutcome ||
    question.learning_outcome ||
    question.outcome ||
    question.outcomes ||
    question.dskp ||
    topic.learningOutcome ||
    topic.learning_outcome ||
    topic.outcome ||
    topic.outcomes ||
    topic.dskp ||
    topic.note
  );
}

function collectSubjectCoverage(subjects, mapping) {
  const bySubject = [];
  const totals = {
    subjects: subjects.length,
    topics: 0,
    questions: 0,
    metadataComplete: 0,
    learningOutcome: 0,
    explicitSK: 0,
    explicitSP: 0,
    mappedSK: 0,
    mappedSP: 0,
    inferredSK: 0,
    inferredSP: 0,
    missingSK: 0,
    missingSP: 0,
    verifiedSKSP: 0,
    uasaReady: 0,
    difficulty: {},
    missingOutcomes: []
  };

  subjects.forEach(subject => {
    const row = {
      subjectId: subject.id,
      title: subject.title,
      topics: subject.topics?.length || 0,
      questions: 0,
      metadataComplete: 0,
      learningOutcome: 0,
      explicitSK: 0,
      explicitSP: 0,
      mappedSK: 0,
      mappedSP: 0,
      inferredSK: 0,
      inferredSP: 0,
      missingSK: 0,
      missingSP: 0,
      verifiedSKSP: 0,
      uasaReady: 0,
      missingOutcomes: []
    };

    (subject.topics || []).forEach(topic => {
      totals.topics += 1;
      (topic.questions || []).forEach(question => {
        row.questions += 1;
        totals.questions += 1;
        const metadataOk = Boolean(
          question.id &&
          questionText(question) &&
          hasAnswer(question) &&
          question.hint &&
          question.explanation &&
          (question.difficulty || topic.difficulty)
        );
        const outcomeOk = hasLearningOutcome(topic, question);
        const skOk = hasExplicitSK(subject, topic, question);
        const spOk = hasExplicitSP(subject, topic, question);
        const mapped = mappedSKSP(mapping, subject.id, topic.id);
        const mappedSkOk = Boolean(mapped?.SK || mapped?.sk);
        const mappedSpOk = Boolean(mapped?.SP || mapped?.sp);
        const uasaOk = Boolean(question.uasa || question.UASA || topic.uasa || topic.UASA) && Boolean(question.difficulty || topic.difficulty) && hasAnswer(question);
        const difficulty = question.difficulty || topic.difficulty || 'missing';

        if (metadataOk) {
          row.metadataComplete += 1;
          totals.metadataComplete += 1;
        }
        if (outcomeOk) {
          row.learningOutcome += 1;
          totals.learningOutcome += 1;
        } else {
          const missing = {
            subjectId: subject.id,
            topicId: topic.id,
            questionId: question.id || null,
            reason: 'Missing explicit learning outcome / DSKP note'
          };
          row.missingOutcomes.push(missing);
          totals.missingOutcomes.push(missing);
        }
        if (skOk) {
          row.explicitSK += 1;
          totals.explicitSK += 1;
        } else if (mappedSkOk) {
          row.mappedSK += 1;
          totals.mappedSK += 1;
        } else {
          row.inferredSK += 1;
          totals.inferredSK += 1;
        }
        if (spOk) {
          row.explicitSP += 1;
          totals.explicitSP += 1;
        } else if (mappedSpOk) {
          row.mappedSP += 1;
          totals.mappedSP += 1;
        } else {
          row.inferredSP += 1;
          totals.inferredSP += 1;
        }
        if (!skOk && !mappedSkOk) {
          row.missingSK += 1;
          totals.missingSK += 1;
        }
        if (!spOk && !mappedSpOk) {
          row.missingSP += 1;
          totals.missingSP += 1;
        }
        if (mapped?.verified) {
          row.verifiedSKSP += 1;
          totals.verifiedSKSP += 1;
        }
        if (uasaOk) {
          row.uasaReady += 1;
          totals.uasaReady += 1;
        }
        totals.difficulty[difficulty] = (totals.difficulty[difficulty] || 0) + 1;
      });
    });

    row.coverage = {
      metadataCoverage: percent(row.metadataComplete, row.questions),
      learningOutcomeCoverage: percent(row.learningOutcome, row.questions),
      dskpSkCoverage: percent(row.explicitSK, row.questions),
      dskpSpCoverage: percent(row.explicitSP, row.questions),
      mappedSkCoverage: percent(row.mappedSK, row.questions),
      mappedSpCoverage: percent(row.mappedSP, row.questions),
      inferredSkCoverage: percent(row.inferredSK, row.questions),
      inferredSpCoverage: percent(row.inferredSP, row.questions),
      verifiedSkSpCoverage: percent(row.verifiedSKSP, row.questions),
      uasaReadiness: percent(row.uasaReady, row.questions)
    };
    bySubject.push(row);
  });

  return {
    totals,
    bySubject
  };
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function collectCoachCoverage(subjects) {
  const source = fs.readFileSync(APP_FILE, 'utf8');
  const subjectIds = new Set(subjects.map(subject => subject.id));
  const languageToSubject = {
    bm: 'bm',
    BM: 'bm',
    english: 'english',
    English: 'english',
    arab: 'arab',
    Arabic: 'arab'
  };
  const modules = {
    reading: {
      items: countMatches(source, /id:\s*'[^']+-1'[\s\S]*?speechLang:/g),
      subjects: ['bm', 'english', 'arab']
    },
    listening: {
      items: countMatches(source, /\{\s*id:\s*'(bm|english|arab)'[\s\S]*?choose:/g),
      modesPerSet: 4,
      subjects: ['bm', 'english', 'arab']
    },
    speaking: {
      items: countMatches(source, /title:\s*'(BM|English|Arabic) Speaking'/g),
      modesPerSet: 4,
      subjects: ['bm', 'english', 'arab']
    },
    writing: {
      items: countMatches(source, /title:\s*'(BM|English|Arabic) Writing'/g),
      modesPerSet: 5,
      subjects: ['bm', 'english', 'arab']
    }
  };

  Object.values(modules).forEach(module => {
    module.coveredSubjects = module.subjects.filter(subjectId => subjectIds.has(languageToSubject[subjectId] || subjectId));
    module.missingSubjects = [...subjectIds].filter(subjectId => !module.coveredSubjects.includes(subjectId));
    module.subjectCoverage = percent(module.coveredSubjects.length, subjects.length);
  });

  return modules;
}

function buildSkillCoverage(contentCoverage, coachCoverage) {
  const totalQuestions = contentCoverage.totals.questions;
  return {
    metadata: contentCoverage.totals.metadataComplete,
    learningOutcomes: contentCoverage.totals.learningOutcome,
    dskpSK: contentCoverage.totals.explicitSK,
    dskpSP: contentCoverage.totals.explicitSP,
    mappedSK: contentCoverage.totals.mappedSK,
    mappedSP: contentCoverage.totals.mappedSP,
    inferredSK: contentCoverage.totals.inferredSK,
    inferredSP: contentCoverage.totals.inferredSP,
    verifiedSKSP: contentCoverage.totals.verifiedSKSP,
    uasa: contentCoverage.totals.uasaReady,
    reading: coachCoverage.reading.items,
    listening: coachCoverage.listening.items * coachCoverage.listening.modesPerSet,
    speaking: coachCoverage.speaking.items * coachCoverage.speaking.modesPerSet,
    writing: coachCoverage.writing.items * coachCoverage.writing.modesPerSet,
    percentages: {
      metadata: percent(contentCoverage.totals.metadataComplete, totalQuestions),
      learningOutcomes: percent(contentCoverage.totals.learningOutcome, totalQuestions),
      dskpSK: percent(contentCoverage.totals.explicitSK, totalQuestions),
      dskpSP: percent(contentCoverage.totals.explicitSP, totalQuestions),
      mappedSK: percent(contentCoverage.totals.mappedSK, totalQuestions),
      mappedSP: percent(contentCoverage.totals.mappedSP, totalQuestions),
      inferredSK: percent(contentCoverage.totals.inferredSK, totalQuestions),
      inferredSP: percent(contentCoverage.totals.inferredSP, totalQuestions),
      verifiedSKSP: percent(contentCoverage.totals.verifiedSKSP, totalQuestions),
      uasa: percent(contentCoverage.totals.uasaReady, totalQuestions),
      readingSubjectCoverage: coachCoverage.reading.subjectCoverage,
      listeningSubjectCoverage: coachCoverage.listening.subjectCoverage,
      speakingSubjectCoverage: coachCoverage.speaking.subjectCoverage,
      writingSubjectCoverage: coachCoverage.writing.subjectCoverage
    }
  };
}

function overallReadiness(audit) {
  const p = audit.coverageSummary;
  const blocking = [];
  if (p.metadataCoverage < 95) blocking.push('metadata coverage below 95%');
  if (p.mappedSkCoverage < 50) blocking.push('mapped SK coverage below 50%');
  if (p.mappedSpCoverage < 50) blocking.push('mapped SP coverage below 50%');
  if (p.verifiedSkSpCoverage === 0) blocking.push('mapped SK/SP not yet verified against official DSKP');
  if (p.readingCoverage < 50 || p.listeningCoverage < 50 || p.speakingCoverage < 50 || p.writingCoverage < 50) {
    blocking.push('language coach subject coverage below 50%');
  }
  return {
    status: blocking.length ? 'ALPHA_READY_WITH_CURRICULUM_GAPS' : 'READY',
    blockingGaps: blocking,
    sprint11Recommendation: blocking.length ? 'Prioritize explicit SK/SP mapping and broaden coach module subject coverage.' : 'Proceed to Sprint 11 readiness validation.'
  };
}

function suggestedImprovements(audit) {
  const missingCoachSubjects = new Set();
  Object.values(audit.coverageByModule).forEach(module => {
    (module.missingSubjects || []).forEach(subjectId => missingCoachSubjects.add(subjectId));
  });
  return [
    'Verify the BM, Math, English, and Sains SK/SP mapping against official DSKP documents before claiming DSKP completion.',
    'Extend explicit SK/SP mapping to Arab, Islam, PJ, and PK.',
    'Add explicit learningOutcome fields where current coverage relies on topic notes or generic DSKP labels.',
    'Add explicit estimatedTime fields to support more accurate lesson planning.',
    `Expand Reading, Listening, Speaking, and Writing coverage for: ${[...missingCoachSubjects].join(', ') || 'none'}.`,
    'Map UASA readiness by paper section, cognitive level, and item type in addition to the existing UASA tag.'
  ];
}

function markdown(audit) {
  const lines = [
    '# Jannati AI Tutor V2.0 Curriculum Coverage Audit',
    '',
    `Generated: ${audit.generatedAt}`,
    '',
    '## Coverage Summary',
    '',
    `- Metadata Coverage: ${audit.coverageSummary.metadataCoverage}%`,
    `- Learning Outcome Coverage: ${audit.coverageSummary.learningOutcomeCoverage}%`,
    `- DSKP SK Coverage: ${audit.coverageSummary.mappedSkCoverage}% mapped (${audit.coverageSummary.verifiedSkSpCoverage}% verified)`,
    `- DSKP SP Coverage: ${audit.coverageSummary.mappedSpCoverage}% mapped (${audit.coverageSummary.verifiedSkSpCoverage}% verified)`,
    `- UASA Readiness: ${audit.coverageSummary.uasaReadiness}%`,
    `- Reading Coverage: ${audit.coverageSummary.readingCoverage}% subject coverage`,
    `- Listening Coverage: ${audit.coverageSummary.listeningCoverage}% subject coverage`,
    `- Speaking Coverage: ${audit.coverageSummary.speakingCoverage}% subject coverage`,
    `- Writing Coverage: ${audit.coverageSummary.writingCoverage}% subject coverage`,
    '',
    'Important: inferred SK/SP metadata is not counted as mapped or verified DSKP completion in this audit.',
    '',
    '## Coverage by Subject',
    '',
    '| Subject | Questions | Metadata | Outcomes | SK Mapped | SP Mapped | Inferred SK/SP | Verified | UASA |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...audit.coverageBySubject.map(row => `| ${row.title} | ${row.questions} | ${row.coverage.metadataCoverage}% | ${row.coverage.learningOutcomeCoverage}% | ${row.coverage.mappedSkCoverage}% | ${row.coverage.mappedSpCoverage}% | ${row.coverage.inferredSkCoverage}%/${row.coverage.inferredSpCoverage}% | ${row.coverage.verifiedSkSpCoverage}% | ${row.coverage.uasaReadiness}% |`),
    '',
    '## Coverage by Module',
    '',
    '| Module | Items | Covered Subjects | Missing Subjects | Subject Coverage |',
    '| --- | ---: | --- | --- | ---: |',
    ...Object.entries(audit.coverageByModule).map(([name, row]) => `| ${name} | ${row.items} | ${row.coveredSubjects.join(', ')} | ${row.missingSubjects.join(', ')} | ${row.subjectCoverage}% |`),
    '',
    '## Coverage by Skill',
    '',
    '| Skill | Coverage |',
    '| --- | ---: |',
    ...Object.entries(audit.coverageBySkill.percentages).map(([name, value]) => `| ${name} | ${value}% |`),
    '',
    '## SK/SP Mapping Status',
    '',
    `- Mapped SK: ${audit.skspMappingStatus.mappedSK}`,
    `- Mapped SP: ${audit.skspMappingStatus.mappedSP}`,
    `- Inferred SK: ${audit.skspMappingStatus.inferredSK}`,
    `- Inferred SP: ${audit.skspMappingStatus.inferredSP}`,
    `- Missing SK: ${audit.skspMappingStatus.missingSK}`,
    `- Missing SP: ${audit.skspMappingStatus.missingSP}`,
    `- Verified mapped rows: ${audit.skspMappingStatus.verifiedSKSP}`,
    '',
    '## Missing Outcomes',
    '',
    audit.missingOutcomes.length ? audit.missingOutcomes.slice(0, 20).map(item => `- ${item.subjectId}/${item.topicId}/${item.questionId || 'unknown'}: ${item.reason}`).join('\n') : '- No missing learning outcome rows detected by the current audit rules.',
    '',
    '## Suggested Improvements',
    '',
    ...audit.suggestedImprovements.map(item => `- ${item}`),
    '',
    '## Overall Readiness',
    '',
    `Status: ${audit.overallReadiness.status}`,
    '',
    audit.overallReadiness.blockingGaps.length ? audit.overallReadiness.blockingGaps.map(item => `- ${item}`).join('\n') : '- No blocking curriculum gaps detected.',
    '',
    `Sprint 11 recommendation: ${audit.overallReadiness.sprint11Recommendation}`,
    ''
  ];
  return `${lines.join('\n')}\n`;
}

async function runAudit() {
  const subjects = await loadSubjects();
  const mapping = loadSkspMapping();
  const contentCoverage = collectSubjectCoverage(subjects, mapping);
  const coachCoverage = collectCoachCoverage(subjects);
  const skillCoverage = buildSkillCoverage(contentCoverage, coachCoverage);
  const totalQuestions = contentCoverage.totals.questions;
  const audit = {
    generatedAt: new Date().toISOString(),
    note: 'Inferred metadata is reported separately and is not counted as explicit DSKP SK/SP completion.',
    totals: {
      subjects: contentCoverage.totals.subjects,
      topics: contentCoverage.totals.topics,
      questions: totalQuestions,
      difficulty: contentCoverage.totals.difficulty
    },
    coverageSummary: {
      metadataCoverage: percent(contentCoverage.totals.metadataComplete, totalQuestions),
      learningOutcomeCoverage: percent(contentCoverage.totals.learningOutcome, totalQuestions),
      dskpSkCoverage: percent(contentCoverage.totals.explicitSK, totalQuestions),
      dskpSpCoverage: percent(contentCoverage.totals.explicitSP, totalQuestions),
      mappedSkCoverage: percent(contentCoverage.totals.mappedSK, totalQuestions),
      mappedSpCoverage: percent(contentCoverage.totals.mappedSP, totalQuestions),
      inferredSkCoverage: percent(contentCoverage.totals.inferredSK, totalQuestions),
      inferredSpCoverage: percent(contentCoverage.totals.inferredSP, totalQuestions),
      verifiedSkSpCoverage: percent(contentCoverage.totals.verifiedSKSP, totalQuestions),
      uasaReadiness: percent(contentCoverage.totals.uasaReady, totalQuestions),
      readingCoverage: coachCoverage.reading.subjectCoverage,
      listeningCoverage: coachCoverage.listening.subjectCoverage,
      speakingCoverage: coachCoverage.speaking.subjectCoverage,
      writingCoverage: coachCoverage.writing.subjectCoverage
    },
    coverageBySubject: contentCoverage.bySubject,
    coverageByModule: coachCoverage,
    coverageBySkill: skillCoverage,
    missingOutcomes: contentCoverage.totals.missingOutcomes,
    skspMappingStatus: {
      mappedSubjects: Object.keys(mapping.subjects || {}),
      mappedSK: contentCoverage.totals.mappedSK,
      mappedSP: contentCoverage.totals.mappedSP,
      inferredSK: contentCoverage.totals.inferredSK,
      inferredSP: contentCoverage.totals.inferredSP,
      missingSK: contentCoverage.totals.missingSK,
      missingSP: contentCoverage.totals.missingSP,
      verifiedSKSP: contentCoverage.totals.verifiedSKSP,
      note: 'Mapped rows are explicit mappings but are not counted as verified DSKP completion until reviewed.'
    }
  };
  audit.suggestedImprovements = suggestedImprovements(audit);
  audit.overallReadiness = overallReadiness(audit);

  fs.writeFileSync(AUDIT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(AUDIT_MD, markdown(audit));
  return audit;
}

if (require.main === module) {
  runAudit()
    .then(audit => {
      console.log(`Curriculum audit complete: ${audit.coverageSummary.metadataCoverage}% metadata, ${audit.coverageSummary.mappedSkCoverage}% mapped SK, ${audit.coverageSummary.mappedSpCoverage}% mapped SP, ${audit.coverageSummary.verifiedSkSpCoverage}% verified.`);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runAudit };
