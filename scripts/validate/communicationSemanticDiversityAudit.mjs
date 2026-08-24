import { semanticReadingPassages, semanticListeningSets, semanticSpeakingPrompts, semanticWritingSets, normalizeCommunicationText } from '../../src/data/communicationContent.js';

function duplicates(values) {
  const seen = new Map();
  for (const value of values) {
    const key = normalizeCommunicationText(value);
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([key, count]) => ({ key, count }));
}

function nearDuplicates(values) {
  const normalized = values.map(value => normalizeCommunicationText(value).split(' ').filter(Boolean));
  const pairs = [];
  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      const a = new Set(normalized[i]);
      const b = new Set(normalized[j]);
      if (!a.size || !b.size) continue;
      const overlap = [...a].filter(token => b.has(token)).length / Math.max(a.size, b.size);
      if (overlap >= 0.8 && normalizeCommunicationText(values[i]) !== normalizeCommunicationText(values[j])) pairs.push([i, j]);
    }
  }
  return pairs;
}

const result = { status: 'PASS', modules: {}, failures: [] };
for (const set of semanticReadingPassages) {
  const rows = set.sessionItems || [];
  const passages = rows.map(row => row.text);
  const titles = rows.map(row => row.title);
  const dupes = duplicates(passages);
  const near = nearDuplicates(passages);
  const titleDupes = duplicates(titles);
  const templates = duplicates(passages.map(text => normalizeCommunicationText(text).split(' ').slice(0, 4).join(' ')));
  result.modules['reading:' + set.id] = {
    count: rows.length,
    uniquePassages: passages.length - dupes.reduce((sum, item) => sum + item.count - 1, 0),
    duplicateGroups: dupes.length,
    nearDuplicatePairs: near.length,
    duplicateTitleGroups: titleDupes.length,
    repeatedTemplateGroups: templates.length
  };
  if (rows.length < 30 || dupes.length || near.length || titleDupes.length || templates.length) result.failures.push('reading:' + set.id);
}
for (const set of semanticListeningSets) {
  const rows = set.sessionItems || [];
  const texts = rows.map(row => [row.prompt, row.choose.question, row.choose.options.join('|'), row.choose.answer, row.arrange.join('|'), row.spell, row.answer.question, row.answer.accepted.join('|')].join(' :: '));
  const dupes = duplicates(texts);
  result.modules[`listening:${set.id}`] = { count: rows.length, uniqueSemanticItems: texts.length - dupes.reduce((sum, item) => sum + item.count - 1, 0), duplicateGroups: dupes.length };
  if (rows.length < 30 || dupes.length) result.failures.push(`listening:${set.id}`);
}
for (const set of semanticSpeakingPrompts) {
  const texts = (set.sessionItems || []).map(item => Object.values(item.prompts || {}).map(prompt => prompt.text).join(' '));
  const dupes = duplicates(texts);
  result.modules[`speaking:${set.id}`] = { count: texts.length, duplicateGroups: dupes.length };
  if (texts.length < 40 || dupes.length) result.failures.push(`speaking:${set.id}`);
}
for (const set of semanticWritingSets) {
  const texts = (set.sessionItems || []).map(item => Object.values(item.tasks || {}).map(task => task.prompt).join(' '));
  const dupes = duplicates(texts);
  result.modules[`writing:${set.id}`] = { count: texts.length, duplicateGroups: dupes.length };
  if (texts.length < 50 || dupes.length) result.failures.push(`writing:${set.id}`);
}
if (result.failures.length) result.status = 'FAIL';
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'PASS' ? 0 : 1;
