const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.resolve('reports/validation');
const REPORT_PATH = path.join(REPORT_DIR, 'storage-report.json');
const VALID_MASTERY_STATES = new Set(['NOT_STARTED', 'LEARNING', 'NEEDS_PRACTICE', 'MASTERED']);
const EXPECTED_KEYS = {
  profile: 'jannati_v151_profile',
  resume: 'jannati_v151_resume',
  aiMemory: 'jannati_v151_ai_memory',
  legacyProfile: ['jannati_v150_profile', 'jannati_v140_profile'],
  legacyResume: ['jannati_v150_resume', 'jannati_v140_resume'],
  legacyMemory: ['jannati_v150_ai_memory', 'jannati_v140_ai_memory']
};

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeParse(value) {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

function validateHistoryArray(name, rows, issues) {
  if (!Array.isArray(rows)) {
    issues.push(issue('error', 'INVALID_HISTORY', `${name} must be an array.`));
    return;
  }
  rows.forEach((item, index) => {
    if (!isObject(item)) issues.push(issue('error', 'INVALID_HISTORY_ITEM', `${name} item must be an object.`, { index }));
    if (item && item.score !== undefined && (!Number.isFinite(Number(item.score)) || Number(item.score) < 0 || Number(item.score) > 100)) {
      issues.push(issue('error', 'INVALID_HISTORY_SCORE', `${name} score must be between 0 and 100.`, { index, score: item.score }));
    }
    if (item && !item.date) issues.push(issue('warning', 'MISSING_HISTORY_TIMESTAMP', `${name} item is missing date.`, { index }));
  });
}

function validateMemory(memory, issues) {
  if (!isObject(memory)) {
    issues.push(issue('error', 'INVALID_AI_MEMORY', 'AI Memory must be an object.'));
    return;
  }

  ['weakTopics', 'strongTopics', 'readingHistory', 'listeningHistory', 'speakingHistory', 'writingHistory'].forEach(key => {
    if (memory[key] !== undefined && !Array.isArray(memory[key])) {
      issues.push(issue('error', 'INVALID_AI_MEMORY_ARRAY', `${key} must be an array.`));
    }
  });

  ['xp', 'coins', 'mastery', 'studyStreak', 'studyTime'].forEach(key => {
    if (memory[key] !== undefined && (!Number.isFinite(Number(memory[key])) || Number(memory[key]) < 0)) {
      issues.push(issue('error', 'INVALID_AI_MEMORY_NUMBER', `${key} must be a non-negative number.`, { key, value: memory[key] }));
    }
  });

  if (memory.mastery !== undefined && Number(memory.mastery) > 100) {
    issues.push(issue('error', 'INVALID_MASTERY', 'AI Memory mastery must be 0-100.', { mastery: memory.mastery }));
  }

  if (memory.topicMastery !== undefined) {
    if (!isObject(memory.topicMastery)) {
      issues.push(issue('error', 'INVALID_TOPIC_MASTERY', 'topicMastery must be an object.'));
    } else {
      Object.entries(memory.topicMastery).forEach(([key, row]) => {
        if (!isObject(row)) {
          issues.push(issue('error', 'INVALID_TOPIC_MASTERY_ROW', 'topicMastery row must be an object.', { key }));
          return;
        }
        if (!VALID_MASTERY_STATES.has(row.status)) {
          issues.push(issue('error', 'INVALID_MASTERY_STATE', 'Invalid mastery state.', { key, status: row.status }));
        }
      });
    }
  }

  validateHistoryArray('readingHistory', memory.readingHistory || [], issues);
  validateHistoryArray('listeningHistory', memory.listeningHistory || [], issues);
  validateHistoryArray('speakingHistory', memory.speakingHistory || [], issues);
  validateHistoryArray('writingHistory', memory.writingHistory || [], issues);

  if (memory.curriculumCoverage !== undefined && memory.curriculumCoverage !== null && !isObject(memory.curriculumCoverage)) {
    issues.push(issue('error', 'INVALID_CURRICULUM_COVERAGE', 'curriculumCoverage must be an object when present.'));
  }
}

function validateProfile(profile, issues) {
  if (!isObject(profile)) {
    issues.push(issue('error', 'INVALID_PROFILE', 'Profile must be an object.'));
    return;
  }
  if (profile.progress !== undefined && !isObject(profile.progress)) {
    issues.push(issue('error', 'INVALID_PROFILE_PROGRESS', 'Profile progress must be an object.'));
  }
  if (profile.history !== undefined && !Array.isArray(profile.history)) {
    issues.push(issue('error', 'INVALID_PROFILE_HISTORY', 'Profile history must be an array.'));
  }
}

function validateResume(resume, issues) {
  if (resume === null) return;
  if (!isObject(resume)) {
    issues.push(issue('error', 'INVALID_RESUME', 'Resume must be an object or null.'));
    return;
  }
  ['subjectId', 'topicId'].forEach(key => {
    if (!resume[key]) issues.push(issue('warning', 'MISSING_RESUME_KEY', `Resume is missing ${key}.`, { key }));
  });
}

function validateStorageSnapshot(snapshot, issues) {
  Object.entries(snapshot).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      issues.push(issue('error', 'INVALID_LOCALSTORAGE_VALUE', 'localStorage values must be strings.', { key }));
      return;
    }
    const parsed = safeParse(value);
    if (!parsed.ok) {
      issues.push(issue('error', 'CORRUPTED_LOCALSTORAGE_JSON', 'localStorage JSON is corrupted.', { key, error: parsed.error }));
      return;
    }
    if (key === EXPECTED_KEYS.aiMemory || EXPECTED_KEYS.legacyMemory.includes(key)) validateMemory(parsed.value, issues);
    if (key === EXPECTED_KEYS.profile || EXPECTED_KEYS.legacyProfile.includes(key)) validateProfile(parsed.value, issues);
    if (key === EXPECTED_KEYS.resume || EXPECTED_KEYS.legacyResume.includes(key)) validateResume(parsed.value, issues);
  });
}

async function runStorageValidation() {
  ensureReportDir();
  const issues = [];
  const appSource = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8');
  const memorySource = fs.readFileSync(path.resolve('src/ai/memoryEngine.js'), 'utf8');

  [
    EXPECTED_KEYS.profile,
    EXPECTED_KEYS.resume,
    ...EXPECTED_KEYS.legacyProfile,
    ...EXPECTED_KEYS.legacyResume
  ].forEach(key => {
    if (!appSource.includes(key)) {
      issues.push(issue('error', 'MISSING_MIGRATION_KEY', 'Expected profile/resume migration key is missing from App.jsx.', { key }));
    }
  });

  [EXPECTED_KEYS.aiMemory, ...EXPECTED_KEYS.legacyMemory].forEach(key => {
    if (!memorySource.includes(key)) {
      issues.push(issue('error', 'MISSING_MIGRATION_KEY', 'Expected AI Memory migration key is missing from memoryEngine.js.', { key }));
    }
  });

  const validSnapshot = {
    [EXPECTED_KEYS.profile]: JSON.stringify({ name: 'QA', progress: {}, history: [] }),
    [EXPECTED_KEYS.resume]: JSON.stringify(null),
    [EXPECTED_KEYS.aiMemory]: JSON.stringify({
      weakTopics: [],
      strongTopics: [],
      xp: 0,
      coins: 0,
      mastery: 0,
      topicMastery: {
        bm_kata_nama_am: { status: 'NOT_STARTED', masteryScore: 0 }
      },
      readingHistory: [],
      listeningHistory: [],
      speakingHistory: [],
      writingHistory: [],
      curriculumCoverage: { summary: {} },
      updatedAt: new Date().toISOString()
    })
  };
  validateStorageSnapshot(validSnapshot, issues);

  const corruptedProbeIssues = [];
  validateStorageSnapshot({ [EXPECTED_KEYS.aiMemory]: '{bad json' }, corruptedProbeIssues);
  if (!corruptedProbeIssues.some(item => item.code === 'CORRUPTED_LOCALSTORAGE_JSON')) {
    issues.push(issue('error', 'CORRUPTION_PROBE_FAILED', 'Corrupted localStorage probe was not detected.'));
  }

  const invalidMemoryIssues = [];
  validateStorageSnapshot({
    [EXPECTED_KEYS.aiMemory]: JSON.stringify({
      topicMastery: { broken: { status: 'BROKEN' } },
      readingHistory: [{ score: 120 }]
    })
  }, invalidMemoryIssues);
  if (!invalidMemoryIssues.some(item => item.code === 'INVALID_MASTERY_STATE')) {
    issues.push(issue('error', 'MASTERY_PROBE_FAILED', 'Invalid mastery state probe was not detected.'));
  }

  const errors = issues.filter(item => item.severity === 'error');
  const warnings = issues.filter(item => item.severity === 'warning');
  const infos = issues.filter(item => item.severity === 'info');
  const report = {
    validator: 'storage',
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'fail' : 'pass',
    totals: {
      infos: infos.length,
      errors: errors.length,
      warnings: warnings.length,
      migrationKeys: Object.values(EXPECTED_KEYS).flat().length
    },
    checked: [
      'AI Memory',
      'Mastery',
      'Reading',
      'Listening',
      'Speaking',
      'Writing',
      'Curriculum Coverage',
      'Migration keys',
      'Corrupted localStorage structures'
    ],
    issues
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (require.main === module) {
  runStorageValidation()
    .then(report => {
      console.log(`Storage validation ${report.status}: ${report.totals.errors} errors, ${report.totals.warnings} warnings, ${report.totals.infos} info.`);
      process.exit(report.totals.errors ? 1 : 0);
    })
    .catch(error => {
      ensureReportDir();
      fs.writeFileSync(REPORT_PATH, `${JSON.stringify({
        validator: 'storage',
        generatedAt: new Date().toISOString(),
        status: 'error',
        fatal: String(error.stack || error)
      }, null, 2)}\n`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runStorageValidation };
