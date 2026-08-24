import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildParentSummary,
  buildRecommendationSummary,
  buildRevisionSummary,
  createMockParentProfile,
  readAdaptiveInsights,
  readSubjectInsight,
  resolveParentProfile
} from '../../src/parentInsights/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const reportPath = path.join(repoRoot, 'docs', 'V3_PARENT_DASHBOARD_INTEGRATION.md');
const dashboardSource = fs.readFileSync(path.join(repoRoot, 'src', 'dashboard', 'ParentDashboard.jsx'), 'utf8');

function hasBadValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'number' && (!Number.isFinite(value) || Number.isNaN(value))) return true;
  if (typeof value === 'string' && (value.includes('undefined') || value.includes('null') || value.includes('[object Object]'))) return true;
  if (Array.isArray(value)) return value.some(hasBadValue);
  if (value && typeof value === 'object') return Object.values(value).some(hasBadValue);
  return false;
}

function assertSafePayload(payload, label) {
  assert.equal(hasBadValue(payload), false, `${label} should not contain undefined/null/NaN/[object Object].`);
}

function buildCompleteProfile() {
  const mathTopics = {
    tambah: { attempts: 12, correct: 10, wrong: 2, accuracy: 83, confidence: 88, status: 'strong', statusLabel: 'Strong', lastPractised: '2026-07-18', averageResponseTimeMs: 48 },
    tolak: { attempts: 8, correct: 5, wrong: 3, accuracy: 63, confidence: 64, status: 'needs_practice', statusLabel: 'Needs Practice', lastPractised: '2026-07-16', averageResponseTimeMs: 72 }
  };
  const bmTopics = {
    kata_kerja: { attempts: 10, correct: 8, wrong: 2, accuracy: 80, confidence: 82, status: 'strong', statusLabel: 'Strong', lastPractised: '2026-07-17', averageResponseTimeMs: 44 }
  };
  const englishTopics = {
    verbs: { attempts: 9, correct: 7, wrong: 2, accuracy: 78, confidence: 79, status: 'learning', statusLabel: 'Learning', lastPractised: '2026-07-15', averageResponseTimeMs: 52 }
  };
  return {
    studentId: 'complete-profile',
    name: 'Aina',
    totals: {
      questionsAnswered: 42,
      correct: 35,
      wrong: 7,
      accuracy: 83,
      currentStreak: 5,
      longestStreak: 11,
      studyMinutes: 68
    },
    topics: {
      math: {
        tambah: { attempts: 12, correct: 10, wrong: 2, averageTime: 48, usedHintCount: 1, usedExplainCount: 0, lastAnsweredAt: '2026-07-18T00:00:00.000Z' },
        tolak: { attempts: 8, correct: 5, wrong: 3, averageTime: 72, usedHintCount: 2, usedExplainCount: 1, lastAnsweredAt: '2026-07-16T00:00:00.000Z' }
      },
      bm: {
        kata_kerja: { attempts: 10, correct: 8, wrong: 2, averageTime: 44, usedHintCount: 1, usedExplainCount: 1, lastAnsweredAt: '2026-07-17T00:00:00.000Z' }
      },
      english: {
        verbs: { attempts: 9, correct: 7, wrong: 2, averageTime: 52, usedHintCount: 1, usedExplainCount: 0, lastAnsweredAt: '2026-07-15T00:00:00.000Z' }
      }
    },
    subjects: {
      math: {
        subjectId: 'math',
        title: 'Matematik',
        short: 'Math',
        attempts: 20,
        correct: 15,
        wrong: 5,
        accuracy: 75,
        averageResponseTimeMs: 60,
        topics: {
          tambah: { topicId: 'tambah', title: 'Tambah', attempts: 12, correct: 10, wrong: 2, accuracy: 83, confidence: 88, status: 'strong', statusLabel: 'Strong', lastPractised: '2026-07-18', averageResponseTimeMs: 48 },
          tolak: { topicId: 'tolak', title: 'Tolak', attempts: 8, correct: 5, wrong: 3, accuracy: 63, confidence: 64, status: 'needs_practice', statusLabel: 'Needs Practice', lastPractised: '2026-07-16', averageResponseTimeMs: 72 }
        }
      },
      bm: {
        subjectId: 'bm',
        title: 'Bahasa Melayu',
        short: 'BM',
        attempts: 10,
        correct: 8,
        wrong: 2,
        accuracy: 80,
        averageResponseTimeMs: 44,
        topics: {
          kata_kerja: { topicId: 'kata_kerja', title: 'Kata Kerja', attempts: 10, correct: 8, wrong: 2, accuracy: 80, confidence: 82, status: 'strong', statusLabel: 'Strong', lastPractised: '2026-07-17', averageResponseTimeMs: 44 }
        }
      },
      english: {
        subjectId: 'english',
        title: 'English',
        short: 'English',
        attempts: 9,
        correct: 7,
        wrong: 2,
        accuracy: 78,
        averageResponseTimeMs: 52,
        topics: {
          verbs: { topicId: 'verbs', title: 'Verbs', attempts: 9, correct: 7, wrong: 2, accuracy: 78, confidence: 79, status: 'learning', statusLabel: 'Learning', lastPractised: '2026-07-15', averageResponseTimeMs: 52 }
        }
      }
    }
  };
}

function buildSparseProfile() {
  return {
    studentId: 'sparse-profile',
    name: 'Murid',
    totals: {
      questionsAnswered: 3,
      correct: 2,
      wrong: 1,
      accuracy: 67,
      currentStreak: 1,
      longestStreak: 2,
      studyMinutes: 9
    },
    topics: {
      bm: {
        kata_nama: { attempts: 3, correct: 2, wrong: 1, averageTime: 80, usedHintCount: 1, usedExplainCount: 0, lastAnsweredAt: '2026-07-10T00:00:00.000Z' }
      }
    },
    subjects: {
      bm: {
        subjectId: 'bm',
        title: 'Bahasa Melayu',
        short: 'BM',
        attempts: 3,
        correct: 2,
        wrong: 1,
        accuracy: 67,
        averageResponseTimeMs: 80,
        topics: {
          kata_nama: { topicId: 'kata_nama', title: 'Kata Nama', attempts: 3, correct: 2, wrong: 1, accuracy: 67, confidence: 61, status: 'learning', statusLabel: 'Learning', lastPractised: '2026-07-10', averageResponseTimeMs: 80 }
        }
      }
    }
  };
}

function buildMalformedProfile() {
  return {
    studentId: 'malformed-profile',
    name: null,
    totals: {
      questionsAnswered: '12',
      correct: '9',
      wrong: '3',
      accuracy: '75',
      currentStreak: '2',
      longestStreak: '5',
      studyMinutes: '31'
    },
    topics: {
      math: {
        tambah: { attempts: '4', correct: '3', wrong: '1', averageTime: '45', usedHintCount: '1', usedExplainCount: '1', lastAnsweredAt: null }
      }
    },
    subjects: {
      math: {
        subjectId: 'math',
        title: 'Matematik',
        short: 'Math',
        attempts: 4,
        correct: 3,
        wrong: 1,
        accuracy: 75,
        averageResponseTimeMs: 45,
        topics: {
          tambah: { topicId: 'tambah', title: 'Tambah', attempts: 4, correct: 3, wrong: 1, accuracy: 75, confidence: 68, status: 'learning', statusLabel: 'Learning', lastPractised: '2026-07-19', averageResponseTimeMs: 45 }
        }
      }
    }
  };
}

function runScenario(label, profile, options = {}) {
  const summary = buildParentSummary(profile);
  const recommendations = buildRecommendationSummary(profile);
  const revision = buildRevisionSummary(profile, options);
  const adaptive = readAdaptiveInsights(profile, options);
  const subjectInsight = readSubjectInsight(profile, options.subjectId || 'math', options);

  assertSafePayload(summary, `${label} summary`);
  assertSafePayload(recommendations, `${label} recommendations`);
  assertSafePayload(revision, `${label} revision`);
  assertSafePayload(adaptive, `${label} adaptive`);
  assertSafePayload(subjectInsight, `${label} subject insight`);

  return { summary, recommendations, revision, adaptive, subjectInsight };
}

assert.equal(/['"`]\.\.\/ai\/adaptive/i.test(dashboardSource), false, 'ParentDashboard must not import adaptive modules directly.');
assert.equal(/from ['"`]\.\.\/ai\/adaptive/i.test(dashboardSource), false, 'ParentDashboard must not call adaptive modules directly.');

const complete = runScenario('complete', buildCompleteProfile(), { subjectId: 'math' });
assert.equal(complete.summary.questionsAnswered, 42);
assert.equal(complete.summary.accuracy, 83);
assert(complete.recommendations.strongestSubjects.length > 0, 'Complete profile should expose strong subjects.');
assert(complete.revision.reviewPriorities.length > 0, 'Complete profile should expose revision priorities.');

const sparse = runScenario('sparse', buildSparseProfile(), { subjectId: 'bm' });
assert.equal(sparse.summary.questionsAnswered, 3);
assert(sparse.recommendations.focusTopics.length > 0, 'Sparse profile should still produce a focused topic.');

const empty = runScenario('empty', null, { allowMock: false, subjectId: 'math' });
assert.equal(empty.summary.questionsAnswered, 0);
assert.equal(empty.recommendations.focusTopics.length, 0);
assert.equal(empty.revision.reviewPriorities.length, 0);

const malformed = runScenario('malformed', buildMalformedProfile(), { subjectId: 'math' });
assert.equal(malformed.summary.questionsAnswered, 12);
assert.equal(malformed.summary.accuracy, 75);

const unknownSubject = runScenario('unknown-subject', buildCompleteProfile(), { subjectId: 'xyz' });
assert.equal(unknownSubject.subjectInsight.topics.length, 0);

const overdueProfile = {
  studentId: 'overdue-profile',
  totals: { questionsAnswered: 10, correct: 6, wrong: 4, accuracy: 60, currentStreak: 0, longestStreak: 3, studyMinutes: 24 },
  topics: {
    math: {
      tambah: { attempts: 10, correct: 6, wrong: 4, averageTime: 70, lastAnsweredAt: '2026-06-01T00:00:00.000Z' }
    }
  },
  subjects: {
    math: {
      subjectId: 'math',
      title: 'Matematik',
      short: 'Math',
      attempts: 10,
      correct: 6,
      wrong: 4,
      accuracy: 60,
      averageResponseTimeMs: 70,
      topics: {
        tambah: { topicId: 'tambah', title: 'Tambah', attempts: 10, correct: 6, wrong: 4, accuracy: 60, confidence: 54, status: 'needs_practice', statusLabel: 'Needs Practice', lastPractised: '2026-06-01', averageResponseTimeMs: 70 }
      }
    }
  }
};
const overdue = runScenario('overdue', overdueProfile, { subjectId: 'math' });
assert(overdue.revision.overdueReviews.length > 0, 'Overdue profile should surface overdue reviews.');

const upcomingProfile = {
  studentId: 'upcoming-profile',
  totals: { questionsAnswered: 16, correct: 13, wrong: 3, accuracy: 81, currentStreak: 2, longestStreak: 4, studyMinutes: 30 },
  topics: {
    math: {
      tolak: { attempts: 8, correct: 7, wrong: 1, averageTime: 42, lastAnsweredAt: '2026-07-18T00:00:00.000Z' }
    }
  },
  subjects: {
    math: {
      subjectId: 'math',
      title: 'Matematik',
      short: 'Math',
      attempts: 8,
      correct: 7,
      wrong: 1,
      accuracy: 88,
      averageResponseTimeMs: 42,
      topics: {
        tolak: { topicId: 'tolak', title: 'Tolak', attempts: 8, correct: 7, wrong: 1, accuracy: 88, confidence: 82, status: 'strong', statusLabel: 'Strong', lastPractised: '2026-07-18', averageResponseTimeMs: 42 }
      }
    }
  }
};
const upcoming = runScenario('upcoming', upcomingProfile, { subjectId: 'math' });
assert(upcoming.revision.upcomingReviewSchedule.length > 0, 'Upcoming profile should surface upcoming reviews.');

assert.equal(resolveParentProfile(null, { allowMock: false }), null, 'Production mode should not create mock data.');
assert.deepEqual(buildParentSummary(null), {
  studentId: '',
  name: '',
  questionsAnswered: 0,
  correct: 0,
  wrong: 0,
  accuracy: 0,
  studyTime: 0,
  streak: { current: 0, longest: 0 }
});

const devMock = resolveParentProfile(null, { allowMock: true });
assert(devMock && devMock.studentId === 'mock-parent-insights', 'Development mode can use mock profile data.');

const report = `# V3 Parent Dashboard Integration Audit

## Scenario Coverage

| Scenario | Result |
| --- | --- |
| Complete profile | PASS |
| Sparse profile | PASS |
| Empty history | PASS |
| Malformed values | PASS |
| Unknown subject | PASS |
| Overdue review | PASS |
| Upcoming review | PASS |
| Production mode with no mock data | PASS |

## Validation Notes

- Parent Dashboard now reads through the Parent Insights layer instead of calling adaptive modules directly.
- Mock profile data is restricted to development mode only.
- Empty and partial profiles fall back to empty states rather than fabricated progress in production.
- Revision priorities are sorted with overdue items first, then nearest upcoming reviews.
- Recommendation keys are mapped to parent-friendly Malay labels.

## Accessibility Notes

- Summary values are rendered as plain text.
- Mastery cards use accessible progressbar semantics.
- Empty states remain readable without relying on color alone.
- Long topic labels stay inside card layouts through existing responsive grid styles.

## Manual Test Checklist

- Open Parent Dashboard with a complete profile.
- Open Parent Dashboard with a sparse profile.
- Open Parent Dashboard with no history in production mode.
- Open Parent Dashboard with malformed numeric values.
- Check overdue review items appear before upcoming review items.
- Confirm raw internal objects are not shown to parents.
- Confirm mock progress is only visible in development.
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report, 'utf8');

console.log('parentInsightsIntegrationAudit passed');
