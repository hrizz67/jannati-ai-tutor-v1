const HISTORY_LIMIT = 100;

export function getQuestionHistory(memory = {}) {
  return Array.isArray(memory.questionHistory) ? memory.questionHistory.slice(0, HISTORY_LIMIT) : [];
}

export function buildHistorySet(memory = {}) {
  return new Set(getQuestionHistory(memory).map(item => item.signature || item.id || item.stem).filter(Boolean));
}

export function questionHistoryRow(question = {}) {
  return {
    id: question.id || '',
    stem: question.q || question.question || '',
    signature: question.qde?.historySignature || question.id || question.q || '',
    templateId: question.qde?.templateId || '',
    numbers: question.qde?.numbers || [],
    difficulty: question.difficulty || '',
    date: new Date().toISOString()
  };
}

export function rememberQuestionHistory(memory = {}, questions = []) {
  const rows = questions.map(questionHistoryRow);
  return {
    ...memory,
    questionHistory: [...rows, ...getQuestionHistory(memory)].slice(0, HISTORY_LIMIT)
  };
}
