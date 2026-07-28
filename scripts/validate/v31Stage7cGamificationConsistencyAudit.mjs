import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_GAMIFICATION_SOURCE_VERSION,
  GLOBAL_GAMIFICATION_SOURCE_PRECEDENCE,
  createCanonicalGamification
} from '../../src/utils/canonicalGamification.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function count(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function runFixture(label, input, expectations) {
  const output = createCanonicalGamification(input);
  for (const [key, value] of Object.entries(expectations)) {
    assert.deepStrictEqual(
      output[key],
      value,
      `${label}: expected ${key}=${JSON.stringify(value)} but got ${JSON.stringify(output[key])}`
    );
  }
  return output;
}

const fixtures = {
  A: runFixture('A', {
    profile: { xp: 1470, level: 17, streak: 4, coins: 78 },
    gamificationProfile: { achievements: [{ id: 'first-question' }, { id: 'math-explorer' }], bestStreak: 4 }
  }, {
    hasEvidence: true,
    globalXp: 1470,
    globalLevel: 17,
    currentStreak: 4,
    bestStreak: 4,
    achievementCount: 2,
    starCount: 78
  }),
  B: runFixture('B', {
    profile: { xp: 1470, level: 17, streak: 4, coins: 78 },
    gamificationProfile: { achievements: [{ id: 'first-question' }, { id: 'math-explorer' }], subjectXp: { math: 86 }, subjectLevel: { math: 1 } },
    subjectId: 'math'
  }, {
    globalXp: 1470,
    globalLevel: 17,
    currentStreak: 4,
    subjectId: 'math',
    subjectXp: 86,
    subjectLevel: 1,
    scope: 'global+subject'
  }),
  C: runFixture('C', {
    profile: { xp: 1470, level: 17, streak: 4, coins: 78 },
    gamificationProfile: { xp: 86, level: 1, currentStreak: 1, bestStreak: 1, achievements: [{ id: 'legacy-1' }, { id: 'legacy-2' }] }
  }, {
    globalXp: 1470,
    globalLevel: 17,
    currentStreak: 4,
    bestStreak: 4,
    globalSourceKey: 'profile'
  }),
  D: runFixture('D', {
    profile: {},
    adaptiveProfile: {},
    gamificationProfile: {}
  }, {
    hasEvidence: false,
    globalXp: 0,
    currentStreak: 0,
    achievementCount: 0
  }),
  E: runFixture('E', {
    profile: { streak: 4, xp: 1470, level: 17 },
    gamificationProfile: { currentStreak: 4, bestStreak: 1 }
  }, {
    currentStreak: 4,
    bestStreak: 4
  }),
  F1: createCanonicalGamification({ gamificationProfile: { xp: 99 } }),
  F2: createCanonicalGamification({ gamificationProfile: { xp: 100 } }),
  F3: createCanonicalGamification({ gamificationProfile: { xp: -50, currentStreak: -2, coins: -9 } }),
  G: runFixture('G', {
    gamificationProfile: { xp: 1470, level: 17, sourceVersion: CANONICAL_GAMIFICATION_SOURCE_VERSION }
  }, {
    globalXp: 1470,
    globalLevel: 17,
    globalSourceKey: 'gamificationProfile',
    globalSourceVersion: CANONICAL_GAMIFICATION_SOURCE_VERSION
  }),
  H: runFixture('H', {
    gamificationProfile: { xp: 1470, level: 17, sourceVersion: 'legacy-v1' }
  }, {
    globalXp: 1470,
    globalSourceKey: 'gamificationProfile',
    globalSourceVersion: 'legacy-v1'
  })
};

assert.equal(fixtures.F1.globalLevel, 1, 'F1: xp 99 should stay on level 1');
assert.equal(fixtures.F1.globalXpIntoLevel, 99, 'F1: xp 99 should be 99 into level');
assert.equal(fixtures.F1.globalXpForNextLevel, 100, 'F1: xp 99 should use 100 XP span');
assert.equal(fixtures.F2.globalLevel, 2, 'F2: xp 100 should advance to level 2');
assert.equal(fixtures.F2.globalXpIntoLevel, 0, 'F2: xp 100 should reset current progress');
assert.equal(fixtures.F2.globalXpForNextLevel, 150, 'F2: xp 100 should target 150 XP next span');
assert.equal(fixtures.F3.globalXp, 0, 'F3: negative XP must normalize to 0');
assert.equal(fixtures.F3.currentStreak, 0, 'F3: negative streak must normalize to 0');
assert.equal(fixtures.F3.starCount, 0, 'F3: negative rewards must normalize to 0');
assert.notEqual(fixtures.H.globalLevel, 17, 'H: legacy source version must not preserve explicit stored level blindly.');

const homeDashboard = read('src/dashboard/HomeDashboard.jsx');
const studentDashboard = read('src/dashboard/StudentDashboard.jsx');
const parentDashboard = read('src/dashboard/ParentDashboard.jsx');
const analyticsDashboard = read('src/dashboard/AnalyticsDashboard.jsx');
const gamificationSummary = read('src/components/GamificationSummary.jsx');
const gamificationPanel = read('src/components/gamification/GamificationPanel.jsx');
const levelProgress = read('src/components/gamification/LevelProgress.jsx');
const canonicalSelector = read('src/utils/canonicalGamification.js');

assert(canonicalSelector.includes('CANONICAL_GAMIFICATION_SOURCE_VERSION'), 'Canonical selector must expose a source version constant.');
assert(canonicalSelector.includes('GLOBAL_GAMIFICATION_SOURCE_PRECEDENCE'), 'Canonical selector must expose documented source precedence.');
assert(canonicalSelector.includes('shouldPreserveExplicitLevel'), 'Canonical selector must gate explicit level preservation.');
assert.deepEqual(
  GLOBAL_GAMIFICATION_SOURCE_PRECEDENCE,
  ['adaptiveProfile', 'profile', 'gamificationProfile'],
  'Canonical selector precedence must stay adaptiveProfile -> profile -> gamificationProfile.'
);

assert(homeDashboard.includes('createCanonicalGamification'), 'HomeDashboard must import canonical gamification helper');
assert(homeDashboard.includes('canonicalGamification.globalXp'), 'HomeDashboard must use canonical global XP');
assert(homeDashboard.includes('canonicalGamification.globalLevel'), 'HomeDashboard must use canonical global level');
assert(homeDashboard.includes('canonicalGamification.currentStreak'), 'HomeDashboard must use canonical streak');
assert(!homeDashboard.includes('className="level-line"'), 'HomeDashboard must remove duplicate level-line block from hero section');

assert(studentDashboard.includes('canonicalGamification'), 'StudentDashboard must accept canonical gamification data');
assert(studentDashboard.includes('canonical={gamification}'), 'StudentDashboard must pass canonical gamification to the panel');

assert(parentDashboard.includes('createCanonicalGamification'), 'ParentDashboard must import canonical gamification helper');
assert(parentDashboard.includes('canonical={canonicalGamification}'), 'ParentDashboard must pass canonical gamification to the panel');

assert(analyticsDashboard.includes('createCanonicalGamification'), 'AnalyticsDashboard must import canonical gamification helper');
assert(analyticsDashboard.includes('canonical={canonicalGamification}'), 'AnalyticsDashboard must pass canonical gamification to the panel');

assert(gamificationSummary.includes('createCanonicalGamification'), 'GamificationSummary must resolve canonical gamification');

assert.equal(count(gamificationPanel, /Jumlah XP/g), 1, 'GamificationPanel must render one Jumlah XP summary metric');
assert.equal(count(gamificationPanel, /Tahap Semasa/g), 1, 'GamificationPanel must render one Tahap Semasa summary metric');
assert.equal(count(gamificationPanel, /Streak Semasa/g), 1, 'GamificationPanel must render one Streak Semasa summary metric');
assert.equal(count(gamificationPanel, /Pencapaian/g), 2, 'GamificationPanel should mention Pencapaian once in summary and once in latest heading');
assert.equal(count(gamificationPanel, /<LevelProgress/g), 1, 'GamificationPanel must render one level progress block');
assert.equal(count(gamificationPanel, /className="gamification-details-toggle"/g), 1, 'GamificationPanel must render one compact disclosure control');
assert.equal(count(gamificationPanel, /<AchievementBadge /g), 1, 'GamificationPanel must render one latest-achievement badge area');
assert(gamificationPanel.includes('hidden={!detailsOpen}'), 'Secondary metrics must stay hidden while disclosure is collapsed.');
assert(gamificationPanel.includes('aria-expanded={detailsOpen}'), 'Butiran Lanjut must expose aria-expanded');
assert(gamificationPanel.includes('aria-controls={detailPanelId}'), 'Butiran Lanjut must expose aria-controls');
assert(gamificationPanel.includes('Belum ada data ganjaran.'), 'GamificationPanel must expose intentional no-data state');
assert(!gamificationPanel.includes('XP semasa:'), 'GamificationPanel must remove legacy duplicated XP semasa label');
assert(!gamificationPanel.includes('Tahap semasa:'), 'GamificationPanel must remove legacy duplicated Tahap semasa label');
assert(!gamificationPanel.includes('Kemajuan:'), 'GamificationPanel must remove legacy duplicated Kemajuan label');
assert(!gamificationPanel.includes('XP ke tahap seterusnya:'), 'GamificationPanel must remove legacy duplicated XP ke tahap seterusnya label');

assert(levelProgress.includes('<progress'), 'LevelProgress must use a native progress element');
assert(levelProgress.includes('aria-label="Kemajuan ke tahap seterusnya"'), 'LevelProgress must expose accessible progress label');
assert(levelProgress.includes('daripada {safeMax} XP ke tahap seterusnya'), 'LevelProgress must describe XP progress in text');

console.log('v31Stage7cGamificationConsistencyAudit PASS');
console.log(JSON.stringify({
  precedenceOrder: GLOBAL_GAMIFICATION_SOURCE_PRECEDENCE,
  fixtures: {
    A: fixtures.A,
    B: fixtures.B,
    C: fixtures.C,
    D: fixtures.D,
    E: fixtures.E,
    F1: fixtures.F1,
    F2: fixtures.F2,
    F3: fixtures.F3,
    G: fixtures.G,
    H: fixtures.H
  },
  sourceChecks: {
    homeCanonical: true,
    studentCanonical: true,
    parentCanonical: true,
    analyticsCanonical: true,
    panelCanonical: true,
    nativeProgress: true,
    disclosureSemantics: true
  }
}, null, 2));
