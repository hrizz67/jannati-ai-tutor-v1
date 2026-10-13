import assert from 'node:assert/strict';
import fs from 'node:fs';

const homeSource = fs.readFileSync(new URL('../../src/dashboard/HomeDashboard.jsx', import.meta.url), 'utf8');
const studentSource = fs.readFileSync(new URL('../../src/dashboard/StudentDashboard.jsx', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');

assert.match(homeSource, /className="journey-steps"[\s\S]*?>Seterusnya</, 'The responsive learning-journey contract must cover the next-step card.');
assert.match(studentSource, /className="card streak-summary-card"[\s\S]{0,800}>Motivasi</, 'The streak motivation card needs a stable responsive scope.');

assert.match(
  cssSource,
  /@media \(max-width: 430px\)[\s\S]*?\.dashboard-main \.smart-lesson-card \.journey-steps\s*{[\s\S]*?grid-template-columns:\s*1fr;/,
  'Learning-journey cards must stack across normal modern phone widths before Malay words are compressed.'
);
assert.match(
  cssSource,
  /\.dashboard-main \.smart-lesson-card \.journey-steps span,[\s\S]*?overflow-wrap:\s*normal;[\s\S]*?word-break:\s*normal;[\s\S]*?hyphens:\s*none;/,
  'Learning-journey copy must wrap only at natural word boundaries.'
);
assert.match(
  cssSource,
  /@media \(max-width: 340px\)[\s\S]*?\.dashboard-main \.quick-actions button\s*{[\s\S]*?flex-direction:\s*column;/,
  'Quick-action icons must move above their labels on very small phones.'
);
assert.match(
  cssSource,
  /\.dashboard-main \.streak-summary-card \.mastery-summary-grid > div:last-child\s*{[\s\S]*?grid-column:\s*1 \/ -1;/,
  'The motivation card must receive a full text lane on very small phones.'
);

console.log('Responsive text regression: PASS (320-430px learning journey, 320px actions/streak, natural word boundaries)');
