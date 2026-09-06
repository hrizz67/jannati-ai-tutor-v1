import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULT_STUDENT_YEAR,
  getStudentYearSupportLabel,
  normalizeSupportedStudentYear,
  SUPPORTED_STUDENT_YEARS
} from '../../src/config/studentYears.js';
import { getDailyQuestionCount } from '../../src/services/accessControl.js';
import { getLocalDateKey, getLocalDayBounds, PRODUCT_TIME_ZONE } from '../../src/utils/localDate.js';

assert.equal(PRODUCT_TIME_ZONE, 'Asia/Kuala_Lumpur');
assert.equal(getLocalDateKey('2026-08-27T15:59:00Z'), '2026-08-27', '23:59 Malaysia must remain on 27 August.');
assert.equal(getLocalDateKey('2026-08-27T16:00:00Z'), '2026-08-28', '00:00 Malaysia must start 28 August.');
assert.equal(getLocalDateKey('2026-08-27T16:30:00Z'), '2026-08-28', 'Malaysia day must advance while UTC is still on the previous date.');
assert.equal(getLocalDateKey('2026-08-27T16:30:00Z', 'UTC'), '2026-08-27', 'The optional timezone argument must remain functional.');
assert.equal(getLocalDayBounds('2026-08-28').start.toISOString(), '2026-08-27T16:00:00.000Z');
assert.equal(getLocalDayBounds('2026-08-28').end.toISOString(), '2026-08-28T15:59:59.999Z');

const day = '2026-08-28';
const projectedAttempt = {
  questionId: 'bm-1',
  subjectId: 'bm',
  topicId: 'kata-nama-am',
  sessionId: 'session-1',
  attemptNumber: 1,
  answeredAt: '2026-08-28T01:00:00Z'
};
assert.equal(getDailyQuestionCount(
  { history: [projectedAttempt] },
  { learningHistory: [{ ...projectedAttempt, correct: true }] },
  day,
  'bm'
), 1, 'The same answer projected into two histories must count once.');
assert.equal(getDailyQuestionCount({}, { learningHistory: [projectedAttempt] }, '2026-08-28', 'bm'), 1, 'Malaysia-local quota day must include the attempt.');
assert.equal(getDailyQuestionCount({}, { learningHistory: [projectedAttempt] }, '2026-08-27', 'bm'), 0, 'The attempt must not leak into the previous Malaysia day.');

assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    projectedAttempt,
    { ...projectedAttempt, attemptNumber: 2, answeredAt: '2026-08-28T01:01:00Z' }
  ]
}, day, 'bm'), 2, 'Two genuine attempts at the same question must both count.');

const multipleSubjects = {
  learningHistory: [
    projectedAttempt,
    { ...projectedAttempt, questionId: 'math-1', subjectId: 'math', topicId: 'nombor', sessionId: 'session-2' },
    { ...projectedAttempt, questionId: 'bm-2', sessionId: 'session-3' }
  ]
};
assert.equal(getDailyQuestionCount({}, multipleSubjects, day), 3);
assert.equal(getDailyQuestionCount({}, multipleSubjects, day, 'bm'), 2);
assert.equal(getDailyQuestionCount({}, multipleSubjects, day, 'math'), 1);

const childFayyadh = { history: [{ ...projectedAttempt, eventId: 'fayyadh-event-1' }] };
const childAina = { history: [{ ...projectedAttempt, eventId: 'aina-event-1' }, { ...projectedAttempt, eventId: 'aina-event-2' }] };
assert.equal(getDailyQuestionCount(childFayyadh, {}, day, 'bm'), 1);
assert.equal(getDailyQuestionCount(childAina, {}, day, 'bm'), 2);
assert.equal(getDailyQuestionCount({}, {}, day, 'bm'), 0);
assert.equal(getDailyQuestionCount({ history: [{ questionId: 'legacy-without-date' }, null, 'broken'] }, {}, day, 'bm'), 0);
assert.equal(getDailyQuestionCount({ history: [{ questionId: 'legacy-date', subject: 'BM', date: day }] }, {}, day, 'bm'), 1, 'A valid legacy date-only answer must remain countable.');
assert.equal(getDailyQuestionCount({}, {}, 'not-a-date', 'bm'), 0);

assert.deepEqual(SUPPORTED_STUDENT_YEARS, ['Tahun 2']);
assert.equal(DEFAULT_STUDENT_YEAR, 'Tahun 2');
assert.equal(normalizeSupportedStudentYear('Tahun 2'), 'Tahun 2');
assert.equal(normalizeSupportedStudentYear('Tahun 5'), 'Tahun 2');
assert.equal(getStudentYearSupportLabel('Tahun 2'), 'Tahun 2');
assert.match(getStudentYearSupportLabel('Tahun 5'), /Tahun 5.*Tahun 2/, 'Historical year must be preserved in presentation with an honest content notice.');

const app = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../../src/dashboard/HomeDashboard.jsx', import.meta.url), 'utf8');
assert.match(app, /const years = SUPPORTED_STUDENT_YEARS;/);
assert.match(app, /year: normalizeSupportedStudentYear\(year\)/, 'Child creation must reject unsupported years outside the UI too.');
assert.match(app, /const nextYear = normalizeSupportedStudentYear\(year \|\| profile\.year\)/);
assert.match(dashboard, /SUPPORTED_STUDENT_YEARS\.map/);
assert.doesNotMatch(`${app}\n${dashboard}`, /\['Tahun 1',[^\]]*'Tahun 2'/, 'Year selectors must not expose unsupported years.');

console.log('Profile, Malaysia-date and Free-quota regression: PASS');
