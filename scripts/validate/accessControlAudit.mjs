import assert from 'node:assert/strict';
import {
  FREE_DAILY_QUESTION_LIMIT,
  getAccessFeatureLabel,
  getAccessLabel,
  getDailyQuestionCount,
  isPremiumAccess,
  resolveAuthoritativeAccess
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

const matchingPremium = resolveAuthoritativeAccess('account-premium', {
  id: 'account-premium',
  access_status: 'premium',
  access_expires_at: '2099-01-01T00:00:00Z'
});
assert.equal(matchingPremium.isPremium, true, 'A matching server Premium record must remain Premium.');
assert.equal(matchingPremium.verifiedForAccount, true);

const mismatchedPremium = resolveAuthoritativeAccess('account-new', {
  id: 'account-old',
  access_status: 'premium',
  access_expires_at: '2099-01-01T00:00:00Z'
});
assert.equal(mismatchedPremium.isPremium, false, 'A previous account entitlement must fail closed.');
assert.equal(mismatchedPremium.access_status, 'free');
assert.equal(mismatchedPremium.verifiedForAccount, false);

const forgedLocalPremium = resolveAuthoritativeAccess('', {
  id: 'account-old',
  access_status: 'premium',
  isPremium: true
});
assert.equal(forgedLocalPremium.isPremium, false, 'Anonymous/local profile data must never grant Premium.');

const matchingFreeWithStaleFlag = resolveAuthoritativeAccess('account-free', {
  id: 'account-free',
  access_status: 'free',
  isPremium: true
});
assert.equal(matchingFreeWithStaleFlag.isPremium, false, 'Server Free must override a stale local isPremium flag.');
assert.equal(matchingFreeWithStaleFlag.accessLabel, 'Versi Free');

const expiredPremium = resolveAuthoritativeAccess('account-expired', {
  id: 'account-expired',
  access_status: 'premium',
  access_expires_at: '2020-01-01T00:00:00Z'
});
assert.equal(expiredPremium.isPremium, false);
assert.equal(expiredPremium.access_status, 'expired', 'An elapsed Premium entitlement must resolve to expired immediately.');
assert.match(expiredPremium.accessLabel, /Premium tamat/);

const app = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../../src/dashboard/HomeDashboard.jsx', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8');
const learningSql = fs.readFileSync(new URL('../../supabase/learning_data.sql', import.meta.url), 'utf8');
for (const token of ['openTutorAi', 'openPremiumScreen', 'FREE_DAILY_QUESTION_LIMIT', 'onOpenUasa={() => openPremiumScreen']) {
  assert.ok(app.includes(token), `Missing access gate token: ${token}`);
}
assert.ok(!app.includes("onOpenUasa={() => setScreen('uasa')}"));
assert.ok(!app.includes("onStartBacaan={() => setScreen('reading')}"));
assert.match(app, /resolveAuthoritativeAccess\(accountUser\?\.id, accessProfile\)/, 'App access must be derived from the active account and server record.');
assert.match(app, /setAccessProfile\(current => String\(current\?\.id \|\| ''\) === String\(user\.id\) \? current : null\)/, 'Account switching must drop a previous account entitlement before hydration.');
assert.match(app, /if \(!accountUser\?\.id && \(screen === 'login' \|\| showAccountLogin\)\) return;/, 'Login must not resurrect a signed-out profile through persistence.');
assert.match(app, /setProfile\(\{ \.\.\.defaultProfile \}\)[\s\S]{0,300}setChildProfiles\(\[\]\)/, 'Logout must clear in-memory entitlement and child state.');
assert.match(app, /if \(scopedAccountId\) resetSignedOutAccountState\(scopedAccountId\)/, 'An expired or externally-ended session must clear the previous account state.');
assert.match(app, /activeScopedAccountId === previousAccountId[\s\S]{0,100}captureAccountSnapshot\(previousAccountId\)/, 'Repeated sign-out events must not overwrite the saved account snapshot with cleared state.');
assert.match(app, /const feature = PREMIUM_SCREEN_FEATURES\[screen\][\s\S]{0,200}if \(!feature \|\| isPremiumUser\) return;/, 'Protected screens must close when verified Premium access is absent or revoked.');
assert.ok(!dashboard.includes('profile?.isPremium'), 'Dashboard must not render Premium from local learning profile data.');
assert.match(dashboard, /hasAccountSession && accessProfile\?\.isPremium/, 'Dashboard Premium badge must require an authenticated account and authoritative access.');
assert.match(schema, /values \(new\.id, coalesce\([\s\S]{0,100}, 'free'\)/, 'New auth users must be inserted explicitly as Free.');
assert.match(schema, /revoke insert, update, delete on table public\.profiles from anon, authenticated;/, 'Client roles must not write entitlement rows directly.');
assert.match(learningSql, /values \(auth\.uid\(\), 'Murid', 'free'\)/, 'Learning-data fallback profile creation must be explicitly Free.');

console.log('Access-control audit: PASS');
