import assert from 'node:assert/strict';
import {
  FREE_DAILY_QUESTION_LIMIT,
  getAccessFeatureLabel,
  getAccessLabel,
  getDailyQuestionCount,
  isPremiumAccess
} from '../../src/services/accessControl.js';
import fs from 'node:fs';

const today = '2026-08-08';
assert.equal(FREE_DAILY_QUESTION_LIMIT, 10);
assert.equal(isPremiumAccess({ access_status: 'free' }), false);
assert.equal(isPremiumAccess({ access_status: 'premium', access_expires_at: '2099-01-01T00:00:00Z' }), true);
assert.equal(isPremiumAccess({ access_status: 'premium', access_expires_at: '2020-01-01T00:00:00Z' }), false);
assert.match(getAccessLabel({ access_status: 'premium', access_expires_at: '2099-01-01T00:00:00Z' }), /Premium aktif.*Tamat/);
assert.equal(getAccessFeatureLabel('tutorAi'), 'Tutor AI');
assert.equal(getAccessFeatureLabel('unknown'), 'Ciri Premium');
assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    { questionId: 'q1', answeredAt: `${today}T01:00:00Z` },
    { questionId: 'q2', answeredAt: '2026-08-07T23:00:00Z' },
    { eventType: 'quiz-answer', date: `${today}T02:00:00Z` }
  ]
}, today), 2);
assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    { questionId: 'bm-1', subjectId: 'bm', answeredAt: `${today}T01:00:00Z` },
    { questionId: 'math-1', subjectId: 'math', answeredAt: `${today}T02:00:00Z` }
  ]
}, today, 'bm'), 1);

const app = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
for (const token of ['openTutorAi', 'openPremiumScreen', 'FREE_DAILY_QUESTION_LIMIT', 'onOpenUasa={() => openPremiumScreen']) {
  assert.ok(app.includes(token), `Missing access gate token: ${token}`);
}
assert.ok(!app.includes("onOpenUasa={() => setScreen('uasa')}"));
assert.ok(!app.includes("onStartBacaan={() => setScreen('reading')}"));

console.log('Access-control audit: PASS');
