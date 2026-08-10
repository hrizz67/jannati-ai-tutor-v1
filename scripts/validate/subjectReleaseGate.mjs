import { loadAllSubjects } from '../../src/data/subjects/index.js';

const subjectList = await loadAllSubjects();
const issues = [];
let records = 0;

for (const subject of subjectList) {
  if (!subject || subject.id === 'bm') continue;
  for (const topic of subject.topics || []) {
    const seen = new Map();
    for (const question of topic.questions || []) {
      records += 1;
      const id = String(question.id || '');
      const q = String(question.q ?? question.question ?? '').trim();
      const questionField = String(question.question ?? question.q ?? '').trim();
      const answer = String(question.answer ?? '').trim();
      const accepted = [...new Set([
        ...(Array.isArray(question.accepted) ? question.accepted : []),
        ...(Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : []),
        answer
      ].map(value => String(value ?? '').trim()).filter(Boolean))];
      const stemKey = q.toLocaleLowerCase().replace(/\s+/g, ' ');

      if (!id || !q || !questionField || !answer) issues.push({ id, code: 'missing_core_field' });
      if (q !== questionField) issues.push({ id, code: 'q_question_mismatch' });
      if (!accepted.some(value => value.toLocaleLowerCase() === answer.toLocaleLowerCase())) {
        issues.push({ id, code: 'answer_not_accepted' });
      }
      if (seen.has(stemKey)) issues.push({ id, code: 'duplicate_stem', duplicateOf: seen.get(stemKey) });
      else seen.set(stemKey, id);

      if (subject.id === 'math' && topic.id === 'panjang' && /\b(alat|benda)\b.*\b(pembaris|mengukur)\b/i.test(q)) {
        const normalizedAnswer = answer.toLocaleLowerCase();
        if (/\balat\b|\bpembaris\b/i.test(q) && !['pembaris', 'pensel', 'panjang'].includes(normalizedAnswer)) {
          issues.push({ id, code: 'length_tool_answer_mismatch' });
        }
      }
      if (subject.id === 'sains' && /perlu diingat kerana/i.test(q)) {
        issues.push({ id, code: 'awkward_safety_prompt' });
      }
      if (/\b(\p{L}+)\s+\1\b/iu.test(q)) issues.push({ id, code: 'repeated_adjacent_word' });
    }
  }
}

const byCode = Object.fromEntries([...new Set(issues.map(issue => issue.code))].map(code => [code, issues.filter(issue => issue.code === code).length]));
const result = { status: issues.length ? 'FAIL' : 'PASS', subjectsChecked: subjectList.filter(subject => subject?.id !== 'bm').length, records, issueCount: issues.length, byCode, issues };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exit(1);
