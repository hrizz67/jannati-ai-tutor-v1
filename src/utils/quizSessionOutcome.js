const OUTCOME_ORDER = Object.freeze({ wrong: 0, almost: 1, correct: 2 });

export const QUIZ_OUTCOME_REWARDS = Object.freeze({
  wrong: Object.freeze({ xp: 0, coins: 0, score: 0 }),
  almost: Object.freeze({ xp: 5, coins: 2, score: 0.5 }),
  correct: Object.freeze({ xp: 10, coins: 5, score: 1 })
});

function normalizeQuestionId(questionId) {
  return String(questionId || '').trim();
}

function normalizeOutcome(status) {
  const normalized = String(status || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(OUTCOME_ORDER, normalized) ? normalized : null;
}

export function isQuizAnswerChecked(feedback) {
  return Boolean(normalizeOutcome(feedback?.status));
}

export function canRetryQuizAnswer(feedback) {
  return isQuizAnswerChecked(feedback) && feedback.status !== 'correct';
}

export function getBestCreditedQuizOutcome(answers = [], questionId) {
  const targetId = normalizeQuestionId(questionId);
  if (!targetId) return null;
  let bestStatus = null;
  for (const attempt of Array.isArray(answers) ? answers : []) {
    if (normalizeQuestionId(attempt?.questionId) !== targetId) continue;
    const status = normalizeOutcome(attempt?.status);
    if (status && (bestStatus === null || OUTCOME_ORDER[status] > OUTCOME_ORDER[bestStatus])) {
      bestStatus = status;
    }
  }
  return bestStatus;
}

export function summarizeCreditedQuizOutcomes(answers = [], options = {}) {
  const allowedQuestionIds = Array.isArray(options.questionIds)
    ? new Set(options.questionIds.map(normalizeQuestionId).filter(Boolean))
    : null;
  const bestByQuestion = new Map();

  for (const attempt of Array.isArray(answers) ? answers : []) {
    const questionId = normalizeQuestionId(attempt?.questionId);
    const status = normalizeOutcome(attempt?.status);
    if (!questionId || !status || (allowedQuestionIds && !allowedQuestionIds.has(questionId))) continue;
    const previous = bestByQuestion.get(questionId);
    if (!previous || OUTCOME_ORDER[status] > OUTCOME_ORDER[previous]) {
      bestByQuestion.set(questionId, status);
    }
  }

  const summary = {
    correct: 0,
    almost: 0,
    wrong: 0,
    answered: bestByQuestion.size,
    score: 0,
    xp: 0,
    coins: 0,
    percent: 0,
    bestByQuestion
  };
  for (const status of bestByQuestion.values()) {
    summary[status] += 1;
    summary.score += QUIZ_OUTCOME_REWARDS[status].score;
    summary.xp += QUIZ_OUTCOME_REWARDS[status].xp;
    summary.coins += QUIZ_OUTCOME_REWARDS[status].coins;
  }

  const requestedTotal = Number(options.totalQuestions);
  const totalQuestions = Number.isFinite(requestedTotal)
    ? Math.max(0, Math.floor(requestedTotal))
    : allowedQuestionIds?.size || bestByQuestion.size;
  summary.percent = totalQuestions > 0
    ? Math.min(100, Math.max(0, Math.round((summary.score / totalQuestions) * 100)))
    : 0;
  return summary;
}

export function reconcileQuizSessionCredits(session = {}, options = {}) {
  const answers = Array.isArray(session.answers) ? session.answers : [];
  const summary = summarizeCreditedQuizOutcomes(answers, options);
  return {
    ...session,
    answers,
    correct: summary.correct,
    almost: summary.almost,
    wrong: summary.wrong,
    xp: summary.xp,
    coins: summary.coins
  };
}

export function appendCreditedQuizAttempt(session = {}, attempt = {}, options = {}) {
  const questionId = normalizeQuestionId(attempt.questionId);
  const status = normalizeOutcome(attempt.status);
  const answers = Array.isArray(session.answers) ? session.answers : [];
  const previousStatus = getBestCreditedQuizOutcome(answers, questionId);
  if (!questionId || !status || previousStatus === 'correct') {
    return {
      accepted: false,
      session,
      previousStatus,
      creditedStatus: previousStatus,
      rewardDelta: { xp: 0, coins: 0 }
    };
  }

  const nextAnswers = [...answers, { ...attempt, questionId, status }];
  const nextSession = reconcileQuizSessionCredits({ ...session, answers: nextAnswers }, options);
  const creditedStatus = getBestCreditedQuizOutcome(nextAnswers, questionId);
  const previousReward = previousStatus ? QUIZ_OUTCOME_REWARDS[previousStatus] : QUIZ_OUTCOME_REWARDS.wrong;
  const creditedReward = QUIZ_OUTCOME_REWARDS[creditedStatus];

  return {
    accepted: true,
    session: nextSession,
    previousStatus,
    creditedStatus,
    rewardDelta: {
      xp: Math.max(0, creditedReward.xp - previousReward.xp),
      coins: Math.max(0, creditedReward.coins - previousReward.coins)
    }
  };
}
