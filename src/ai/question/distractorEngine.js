function numericDistractors(answer) {
  const value = Number(answer);
  if (!Number.isFinite(value)) return [];
  return [value + 1, value - 1, value + 10, Math.max(0, value - 10)]
    .filter(item => item !== value)
    .map(String);
}

function textDistractors(answer = '', question = {}) {
  const topic = `${question.topicTitle || ''} ${question.q || ''}`.toLowerCase();
  if (topic.includes('kata kerja')) return ['makan', 'buku', 'cantik', 'di'];
  if (topic.includes('kata nama')) return ['guru', 'berlari', 'besar', 'dan'];
  if (topic.includes('adjektif')) return ['besar', 'membaca', 'rumah', 'ke'];
  if (topic.includes('english')) return ['is', 'are', 'the', 'go'];
  return ['jawapan hampir sama', 'pilihan terbalik', 'perkataan lain'];
}

function stablePosition(question = {}, optionCount = 4) {
  const seed = [...String(question.id || question.q || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return seed % optionCount;
}

export function distractorSignature(question = {}) {
  const distractors = question.qip?.distractors || [];
  return distractors.length ? distractors.join('|').toLowerCase() : '';
}

export function answerPositionSignature(question = {}) {
  const index = question.qip?.answerPosition ?? question.answerIndex ?? question.answer_index ?? question.correctIndex;
  return Number.isInteger(index) ? `pos:${index}` : '';
}

export function applyDistractorIntelligence(question = {}, session = {}) {
  const answer = String(question.answer ?? '').trim();
  if (!answer) return question;
  const rawDistractors = Number.isFinite(Number(answer)) ? numericDistractors(answer) : textDistractors(answer, question);
  const distractors = [...new Set(rawDistractors.filter(item => item && item.toLowerCase() !== answer.toLowerCase()))].slice(0, 3);
  const answerPosition = stablePosition(question, distractors.length + 1);
  const options = [...distractors];
  options.splice(answerPosition, 0, answer);
  session.usedDistractors?.add(distractors.join('|').toLowerCase());
  session.usedAnswerPositions?.add(`pos:${answerPosition}`);
  return {
    ...question,
    qip: {
      ...(question.qip || {}),
      distractors,
      answerPosition,
      distractorReason: Number.isFinite(Number(answer)) ? 'near-number misconception' : 'topic-near misconception'
    },
    options: question.options || options,
    answerIndex: question.answerIndex ?? answerPosition
  };
}
