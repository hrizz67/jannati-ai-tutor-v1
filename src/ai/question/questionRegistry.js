export function getQuestionId(question = {}, index = 0) {
  return question.id || question.questionId || `runtime-question-${index}`;
}

export function getQuestionStem(question = {}) {
  return question.q || question.question || question.stem || '';
}

export function getQuestionMetadata(question = {}, context = {}, index = 0) {
  const subject = context.subject || {};
  const topic = context.topic || {};
  return {
    questionId: getQuestionId(question, index),
    subject: question.subjectId || subject.id || '',
    topic: question.topicId || topic.id || '',
    difficulty: question.difficulty || question.qde?.difficulty || topic.difficulty || 'mudah',
    SK: question.SK || question.sk || question.standard || null,
    SP: question.SP || question.sp || question.learningStandard || null,
    UASA: question.UASA || question.uasa || null,
    templateId: question.templateId || question.qde?.templateId || null,
    variationGroup: question.variationGroup || question.qde?.templateId || null,
    contextGroup: question.contextGroup || question.qip?.contextVariant || null,
    estimatedTime: question.estimatedTime || 45
  };
}

export function registerQuestion(question = {}, context = {}, index = 0) {
  const metadata = getQuestionMetadata(question, context, index);
  return {
    ...question,
    qip: {
      ...(question.qip || {}),
      metadata,
      templateId: metadata.templateId,
      stemVariant: getQuestionStem(question),
      reasonSelected: question.qip?.reasonSelected || 'QIP foundation metadata registered',
      adaptiveTrigger: context.allowReinforcement || context.allowAdaptiveOverride ? 'allowed' : 'none',
      difficulty: metadata.difficulty
    }
  };
}

export function registerQuestionBank(questions = [], context = {}) {
  return questions.map((question, index) => registerQuestion(question, context, index));
}
