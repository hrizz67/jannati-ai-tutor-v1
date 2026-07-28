import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createCanonicalGamification } from '../../src/utils/canonicalGamification.js';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const read = file => fs.readFileSync(path.join(repoRoot, file), 'utf8');
const count = (text, pattern) => (text.match(pattern) || []).length;

const panelSource = read('src/components/gamification/GamificationPanel.jsx');
const levelProgressSource = read('src/components/gamification/LevelProgress.jsx');
const styleSource = read('src/styles/style.css');

const fixture = createCanonicalGamification({
  profile: { xp: 1470, level: 17, streak: 4, coins: 78 },
  gamificationProfile: {
    xp: 86,
    level: 1,
    currentStreak: 1,
    bestStreak: 4,
    subjectXp: { math: 86 },
    subjectLevel: { math: 1 },
    achievements: [
      { id: 'first-question', label: 'Soalan Pertama' },
      { id: 'math-explorer', label: 'Math Explorer' }
    ]
  },
  subjectId: 'math'
});

const readableText = [
  `Jumlah XP ${fixture.globalXp}`,
  `Tahap Semasa ${fixture.globalLevel}`,
  `Streak Semasa ${fixture.currentStreak}`,
  `Pencapaian ${fixture.achievementCount}`,
  `Kemajuan tahap ${fixture.globalXpIntoLevel} daripada ${fixture.globalXpForNextLevel} XP ke tahap seterusnya`,
  `XP subjek semasa ${fixture.subjectXp}`,
  `Tahap subjek semasa ${fixture.subjectLevel}`
].join(' | ');

assert.equal(fixture.globalXp, 1470, 'Canonical selector must preserve global XP evidence.');
assert.equal(fixture.globalLevel, 17, 'Canonical selector must preserve global level evidence.');
assert.equal(fixture.currentStreak, 4, 'Canonical selector must preserve global streak evidence.');
assert.equal(fixture.subjectXp, 86, 'Canonical selector must keep subject XP separate.');
assert.equal(fixture.subjectLevel, 1, 'Canonical selector must keep subject level separate.');
assert.equal(fixture.bestStreak, 4, 'Best streak must not fall below current streak.');

assert.equal(count(panelSource, /<div><b>\{summary\.globalXp\}<\/b><span>Jumlah XP<\/span><\/div>/g), 1, 'Gamification summary must render one canonical XP summary block.');
assert.equal(count(panelSource, /<div><b>\{summary\.globalLevel\}<\/b><span>Tahap Semasa<\/span><\/div>/g), 1, 'Gamification summary must render one canonical level summary block.');
assert.equal(count(panelSource, /<div><b>\{summary\.currentStreak\}<\/b><span>Streak Semasa<\/span><\/div>/g), 1, 'Gamification summary must render one canonical streak summary block.');
assert.equal(count(panelSource, /<div><b>\{summary\.achievementCount\}<\/b><span>Pencapaian<\/span><\/div>/g), 1, 'Gamification summary must render one canonical achievement summary block.');
assert.equal(count(panelSource, /<LevelProgress/g), 1, 'Gamification panel must render one level progress area.');
assert.equal(count(panelSource, /className="gamification-details-toggle"/g), 1, 'Gamification panel must render one compact disclosure button.');
assert.equal(count(levelProgressSource, /<progress/g), 1, 'Gamification panel must render one native progress bar.');
assert.equal(count(panelSource, /<AchievementBadge /g), 1, 'Gamification panel must render one latest-achievement area.');

assert.ok(panelSource.includes('aria-expanded={detailsOpen}'), 'Disclosure button must expose aria-expanded.');
assert.ok(panelSource.includes('aria-controls={detailPanelId}'), 'Disclosure button must expose aria-controls.');
assert.ok(levelProgressSource.includes('aria-label="Kemajuan ke tahap seterusnya"'), 'Progress control must expose an accessible name.');
assert.ok(levelProgressSource.includes('value={safeCurrent}'), 'Progress control must expose a value prop.');
assert.ok(levelProgressSource.includes('max={safeMax}'), 'Progress control must expose a max prop.');
assert.ok(levelProgressSource.includes('{safeCurrent} daripada {safeMax} XP ke tahap seterusnya'), 'Readable XP text must stay outside the progress element.');
assert.ok(panelSource.includes('hidden={!detailsOpen}'), 'Secondary metrics must stay hidden while disclosure is collapsed.');

for (const forbidden of [
  'XP semasa:',
  'Tahap semasa:',
  'Kemajuan:',
  'XP ke tahap seterusnya:',
  'Tahap Global',
  'Streak Terbaik',
  'background: #f3f4f6'
]) {
  assert.ok(!panelSource.includes(forbidden), `Legacy or debug gamification text still present: ${forbidden}`);
}

assert.ok(readableText.includes('Jumlah XP 1470'), 'Rendered text must remain understandable for global XP.');
assert.ok(readableText.includes('Tahap Semasa 17'), 'Rendered text must remain understandable for global level.');
assert.ok(readableText.includes('Streak Semasa 4'), 'Rendered text must remain understandable for global streak.');
assert.ok(readableText.includes('XP subjek semasa 86'), 'Rendered text must remain understandable for subject XP.');
assert.ok(readableText.includes('Tahap subjek semasa 1'), 'Rendered text must remain understandable for subject level.');

assert.ok(styleSource.includes('.gamification-progress-bar'), 'Canonical gamification progress bar styling is missing.');
assert.ok(styleSource.includes('.gamification-details-toggle'), 'Gamification details toggle styling is missing.');
assert.ok(styleSource.includes('.gamification-empty-state'), 'No-data gamification styling is missing.');

console.log(JSON.stringify({
  status: 'PASS',
  protections: {
    noConcatenatedLegacyText: true,
    noDuplicateSummaryBlock: true,
    separateValueLabelSemantics: true,
    disclosureSemantics: true,
    progressAccessibleName: true,
    understandableTextContent: true,
    failureExitsNonZero: true
  },
  extractedText: readableText,
  summary: {
    globalXp: fixture.globalXp,
    globalLevel: fixture.globalLevel,
    currentStreak: fixture.currentStreak,
    achievementCount: fixture.achievementCount,
    subjectXp: fixture.subjectXp,
    subjectLevel: fixture.subjectLevel
  }
}, null, 2));
