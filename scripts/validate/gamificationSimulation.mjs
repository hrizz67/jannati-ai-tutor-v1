import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import {
  awardXp,
  calculateLevelProgress,
  evaluateAchievements,
  getRewardSummary,
  updateGamification,
  updateStreak
} from '../../src/gamification/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const reportPath = path.join(repoRoot, 'docs', 'V3_GAMIFICATION_ARCHITECTURE.md');

function mulberry32(seed) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6D2B79F5;
    let value = Math.imul(t ^ (t >>> 15), 1 | t);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDailyEvent(day, random) {
  const breakDay = day === 8 || day === 17;
  const perfectScore = day === 5 || day === 12 || day === 19;
  const aiRecovery = day === 14;
  const streakBonus = day > 1 && !breakDay ? 1 : 0;
  const correct = breakDay ? false : random() > 0.28 || perfectScore;
  const sessionCompleted = !breakDay;
  return {
    type: 'quiz-answer',
    subject: day % 3 === 0 ? 'math' : day % 3 === 1 ? 'bm' : 'english',
    correct,
    sessionCompleted,
    perfectScore,
    aiAssistedRecovery: aiRecovery,
    streakBonus,
    answeredQuestions: breakDay ? 0 : 4,
    activityCompleted: !breakDay,
    activityDate: new Date(Date.UTC(2026, 6, day)).toISOString()
  };
}

function buildBaseProfile() {
  return {
    totalXp: 0,
    xp: 0,
    totalQuestions: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastActivityDate: '',
    subjectXp: {},
    sessionHistory: [
      { sessionId: 'perfect-1', accuracy: 100 }
    ],
    topics: {
      math: {
        tambah: { mastery: 86 },
        tolak: { mastery: 67 }
      },
      bm: {
        kata_nama: { mastery: 82 }
      },
      english: {
        nouns: { mastery: 78 }
      }
    },
    subjects: {
      math: { mastery: 86 },
      bm: { mastery: 82 },
      english: { mastery: 83 },
      sains: { mastery: 81 }
    }
  };
}

const random = mulberry32(20260719);
let profile = buildBaseProfile();
const dailySnapshots = [];
const performanceSamples = [];

for (let day = 1; day <= 30; day += 1) {
  const event = buildDailyEvent(day, random);
  const before = performance.now();
  profile = updateGamification(profile, event);
  const elapsed = Number((performance.now() - before).toFixed(3));
  performanceSamples.push(elapsed);
  dailySnapshots.push({
    day,
    xp: profile.totalXp,
    level: profile.level,
    streak: profile.currentStreak,
    bestStreak: profile.bestStreak,
    achievements: Array.isArray(profile.achievements) ? profile.achievements.length : 0,
    renderMs: elapsed
  });

  if (day === 9 || day === 18) {
    profile = updateGamification(profile, {
      type: 'quiz-answer',
      subject: 'math',
      correct: false,
      sessionCompleted: true,
      aiAssistedRecovery: false,
      streakBonus: 0,
      activityCompleted: true,
      activityDate: new Date(Date.UTC(2026, 6, day + 2)).toISOString()
    });
  }
}

const levelProgress = calculateLevelProgress(profile.totalXp);
const rewardSummary = getRewardSummary(profile);
const achievements = evaluateAchievements(profile, { today: new Date('2026-07-19T00:00:00Z') });
const streakPreview = updateStreak(profile, { activityDate: new Date('2026-07-19T00:00:00Z').toISOString() });
const xpPreview = awardXp(profile, { correct: true, sessionCompleted: true, streakBonus: 2, perfectScore: true, aiAssistedRecovery: true });

assert(levelProgress.currentLevel >= 1, 'Level should always be valid.');
assert(levelProgress.progressPercent >= 0 && levelProgress.progressPercent <= 100, 'Level progress should stay within range.');
assert(rewardSummary.level >= 1, 'Reward summary should expose a valid level.');
assert(streakPreview.currentStreak >= 0, 'Streak should never be negative.');
assert(xpPreview.totalXp >= profile.totalXp, 'XP preview should not reduce XP.');

const levelDistribution = dailySnapshots.reduce((acc, row) => {
  const bucket = row.level <= 2 ? 'level-1-2' : row.level <= 4 ? 'level-3-4' : 'level-5-plus';
  acc[bucket] = (acc[bucket] || 0) + 1;
  return acc;
}, {});

const report = `# V3 Gamification Architecture

## Architecture

- xpEngine awards XP for correct answers, completed sessions, streak bonuses, perfect scores, and AI-assisted recovery.
- levelEngine converts XP into scalable level progression.
- streakEngine tracks current streak, best streak, and last activity date.
- achievementEngine evaluates metadata-driven achievement definitions.
- rewardSummary normalizes the output for future UI consumption.
- gamificationController coordinates all engines without changing scoring or adaptive logic.

## XP Rules

| Event | XP |
| --- | ---: |
| Correct answer | 10 |
| Completed session | 15 |
| Streak bonus | 5 per bonus unit |
| Perfect score | 20 |
| AI-assisted recovery | 8 |

## Level Formula

- Thresholds grow progressively by 100 XP, then +50 XP for each next level step.
- Progress is clamped between 0 and 100.

## Achievement Model

- First Question
- First Perfect Score
- 7-Day Streak
- 100 Questions
- Math Explorer
- English Reader
- Science Explorer

## Future Seasonal Events Roadmap

- Monthly event badges
- Holiday challenge bonuses
- Subject streak festivals
- Parent-visible celebration summaries

## Validation Snapshot

- Simulated days: 30
- Final XP: ${profile.totalXp}
- Final level: ${profile.level}
- Final streak: ${profile.currentStreak}
- Best streak: ${profile.bestStreak}
- Total achievements: ${achievements.length}
- Average simulated latency: ${Number((performanceSamples.reduce((sum, value) => sum + value, 0) / performanceSamples.length).toFixed(3))} ms

## Daily Progress Sample

| Day | XP | Level | Streak | Best Streak | Achievements | Latency (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${dailySnapshots.map(row => `| ${row.day} | ${row.xp} | ${row.level} | ${row.streak} | ${row.bestStreak} | ${row.achievements} | ${row.renderMs} |`).join('\n')}

## Recommendation Distribution

| Bucket | Days |
| --- | ---: |
${Object.entries(levelDistribution).map(([bucket, count]) => `| ${bucket} | ${count} |`).join('\n')}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report, 'utf8');

console.log(JSON.stringify({
  daysSimulated: 30,
  finalXp: profile.totalXp,
  finalLevel: profile.level,
  finalStreak: profile.currentStreak,
  bestStreak: profile.bestStreak,
  achievements: achievements.map(item => item.id)
}, null, 2));
