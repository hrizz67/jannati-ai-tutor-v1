function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function buildQuestionSignature(question = {}, context = {}) {
  const questionId = String(question.id || question.questionId || '');
  const subjectId = String(question.subjectId || context.subjectId || context.subject?.id || '');
  const topicId = String(question.topicId || context.topicId || context.topic?.id || '');
  const stem = normalizeText(question.q || question.question || '');
  const answer = normalizeText(question.answer || '');
  return [subjectId, topicId, questionId, stem, answer].filter(Boolean).join('::');
}

function listRecentQuestions(state = {}, limit = 50) {
  const history = Array.isArray(state.lastQuestions) ? state.lastQuestions : [];
  return history.slice(0, Math.max(0, limit));
}

export function calculateRepeatScore(question = {}, state = {}, context = {}) {
  const questionId = String(question.id || question.questionId || '');
  const subjectId = String(question.subjectId || context.subjectId || context.subject?.id || '');
  const topicId = String(question.topicId || context.topicId || context.topic?.id || '');
  const stem = normalizeText(question.q || question.question || '');
  const signature = buildQuestionSignature(question, context);
  const recent = listRecentQuestions(state, context.limit || 50);

  let score = 0;
  const reasons = [];

  recent.forEach((item, index) => {
    const recentQuestionId = String(item?.questionId || '');
    const recentStem = normalizeText(item?.q || item?.question || '');
    const recentSubjectId = String(item?.subjectId || '');
    const recentTopicId = String(item?.topicId || '');
    const recentKey = String(item?.key || '');

    const sameSignature = recentKey === signature;
    const sameQuestion = questionId && recentQuestionId && questionId === recentQuestionId;
    const sameStem = stem && recentStem && stem === recentStem;
    const sameTopic = topicId && recentTopicId && topicId === recentTopicId && subjectId === recentSubjectId;

    if (sameSignature || sameQuestion) {
      score = Math.max(score, 100 - Math.min(index * 4, 20));
      reasons.push('same_question');
    } else if (sameStem) {
      score = Math.max(score, 85 - Math.min(index * 3, 18));
      reasons.push('same_stem');
    } else if (sameTopic) {
      score = Math.max(score, 55 - Math.min(index * 2, 10));
      reasons.push('same_topic');
    }
  });

  return {
    repeatScore: score,
    repeated: score >= 70,
    signature,
    reasons: [...new Set(reasons)]
  };
}

export function shouldAvoidQuestion(question = {}, state = {}, context = {}) {
  const result = calculateRepeatScore(question, state, context);
  return result.repeatScore >= 70 && !context.allowRevisionRepeat;
}

export function buildRepeatSummary(question = {}, state = {}, context = {}) {
  const result = calculateRepeatScore(question, state, context);
  return {
    signature: result.signature,
    repeatScore: result.repeatScore,
    reasons: result.reasons,
    repeated: result.repeated
  };
}

export default {
  buildQuestionSignature,
  buildRepeatSummary,
  calculateRepeatScore,
  shouldAvoidQuestion
};
