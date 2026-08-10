import assert from 'node:assert/strict';
import fs from 'node:fs';
const app = fs.readFileSync('src/App.jsx', 'utf8'); const greeting = fs.readFileSync('src/ai/personality/greetingEngine.js', 'utf8');
assert.match(app, /quizCharacter === 'jati' \? 'Jati' : 'Janna'/);
assert.match(app, /Jangan putus asa\. Semak petunjuk dan cuba sekali lagi\./);
assert.doesNotMatch(app, /feedbackMessage[\s\S]{0,350}personality\?\.farewell/);
assert.match(greeting, /if \(persona === 'jati'\)/); assert.doesNotMatch(greeting.slice(greeting.indexOf("if (persona === 'jati')"), greeting.indexOf('return streak >= 7')), /Janna/);
console.log('PASS v31CharacterStateMatrixAudit');
