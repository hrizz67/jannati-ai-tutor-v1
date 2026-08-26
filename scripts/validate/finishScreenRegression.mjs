import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const finishSource = fs.readFileSync(new URL('../../src/components/FinishScreen.jsx', import.meta.url), 'utf8');
const iconSource = fs.readFileSync(new URL('../../src/components/IconGlyph.jsx', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');

const finishRouteStart = appSource.indexOf("if (screen === 'finish')");
const finishRouteEnd = appSource.indexOf("if (screen === 'reading')", finishRouteStart);
const finishRouteSource = appSource.slice(finishRouteStart, finishRouteEnd);
const imageIconMapStart = iconSource.indexOf('const IMAGE_ICONS = {');
const imageIconMapEnd = iconSource.indexOf('};', imageIconMapStart);
const imageIconMapSource = iconSource.slice(imageIconMapStart, imageIconMapEnd);

assert.ok(finishRouteStart >= 0 && finishRouteEnd > finishRouteStart, 'The finish route must remain discoverable.');
assert.ok(imageIconMapStart >= 0 && imageIconMapEnd > imageIconMapStart, 'The shared image-icon map must remain discoverable.');
assert.match(
  finishRouteSource,
  /<Finish[\s\S]*?onOpenAi={openTutorAi}[\s\S]*?{chatWidget}/,
  'The finish route must render the Tutor AI portal whenever its button can open chat.'
);

assert.match(
  appSource,
  /const Finish = React\.lazy\(\(\) => import\('\.\/components\/FinishScreen\.jsx'\)\)/,
  'The result screen must stay isolated in its own lazy-loaded component.'
);
assert.doesNotMatch(
  appSource,
  /function Finish\s*\(/,
  'App.jsx must not retain a second result-screen implementation.'
);
assert.doesNotMatch(
  finishSource,
  /GamificationSummary|gamificationProfile/,
  'The session result must not duplicate lifetime gamification totals.'
);
assert.doesNotMatch(
  finishSource,
  /Penguasaan Dijangka|forecast\.projected/,
  'A low-base mastery forecast must not be presented beside the session score.'
);

for (const label of ['Bintang', 'XP sesi', 'Streak', 'Topik untuk diulang', 'Cadangan Janna', 'Kesediaan belajar']) {
  assert.ok(finishSource.includes(label), `Missing result-screen label: ${label}`);
}
for (const icon of ['star', 'gift', 'fire', 'target', 'lightbulb', 'home', 'bot']) {
  assert.match(finishSource, new RegExp(`(?:name|icon)[=:]?[{\\s'\"]+${icon}`), `Missing consistent icon: ${icon}`);
}
for (const icon of ['trophy', 'target', 'star', 'gift', 'fire', 'clock', 'check', 'lightbulb', 'play', 'repeat', 'home', 'bot']) {
  assert.match(imageIconMapSource, new RegExp(`\\b${icon}:\\s*[^,]+`), `Missing rendered asset for finish icon: ${icon}`);
}
assert.match(finishSource, /Math\.max\(earnedStarCount\(session\.stars\), earnedStarCount\(scorePercent\)\)/, 'Visible stars must never fall below the score-derived award.');
assert.match(finishSource, /value: `\$\{stars\}\/3`/, 'The star reward must use a child-readable numeric value.');

assert.match(cssSource, /\.finish \.finish-summary-grid\s*{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/, 'Desktop learning guidance must use three stable cards.');
assert.match(cssSource, /@media \(max-width: 650px\)[\s\S]*?\.finish \.finish-summary-grid\s*{\s*grid-template-columns:\s*1fr/, 'Mobile learning guidance must stack without crushing words.');
assert.match(cssSource, /\.finish \.finish-summary-card b\s*{[\s\S]*?overflow-wrap:\s*normal;[\s\S]*?word-break:\s*normal;/, 'Guidance text must wrap at natural word boundaries.');
assert.match(cssSource, /\.finish \.finish-actions\s*{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/, 'Desktop result actions must remain aligned.');

console.log('Finish screen regression: PASS (icons, concise metrics, responsive text, action hierarchy)');
