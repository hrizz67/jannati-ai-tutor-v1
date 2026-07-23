import { getAcceptedAnswers } from '../../utils/acceptedAnswers.js';

function text(value = '') {
  return value === null || value === undefined ? '' : String(value).trim();
}

function list(value) {
  return Object.freeze((Array.isArray(value) ? value : []).map(text).filter(Boolean));
}

export function resolveCoachContextSnapshot({
  requestId = 0,
  question = {},
  activeSubject = null,
  activeTopic = null,
  allSubjects = [],
  learnerAnswer = '',
  feedback = null,
  explanationMode = ''
} = {}) {
  const questionSubjectId = text(question?.subjectId || question?.metadata?.subjectId || question?.qip?.metadata?.subjectId || activeSubject?.id);
  const questionTopicId = text(question?.topicId || question?.metadata?.topicId || question?.qip?.metadata?.topicId || activeTopic?.id);
  const subject = allSubjects.find(item => item?.id === questionSubjectId) || activeSubject || allSubjects.find(item => item?.id === activeSubject?.id) || null;
  const topic = subject?.topics?.find(item => item?.id === questionTopicId) || activeTopic || null;
  const acceptedAnswers = getAcceptedAnswers(question);
  const snapshot = {
    requestId,
    questionId: text(question?.id || question?.questionId),
    subjectId: questionSubjectId,
    subjectTitle: text(subject?.title || subject?.name || question?.subjectTitle || questionSubjectId),
    topicId: questionTopicId,
    topicTitle: text(topic?.title || topic?.name || question?.topicTitle || questionTopicId),
    questionText: text(question?.q || question?.question || question?.stem || question?.text),
    instruction: text(question?.instruction || question?.direction || question?.prompt),
    options: list(question?.options || question?.choices),
    expectedAnswer: text(question?.answer || question?.correctAnswer || question?.expectedAnswer || acceptedAnswers[0]),
    acceptedAnswers: Object.freeze(acceptedAnswers.slice()),
    learnerAnswer: text(learnerAnswer),
    explanationMode: text(explanationMode || feedback?.status),
    learningObjective: text(question?.learningObjective || question?.objective || topic?.learningObjective || topic?.objective),
    sourceLanguage: text(question?.language || topic?.language || subject?.language || (questionSubjectId === 'english' ? 'en' : questionSubjectId === 'arab' ? 'ar' : 'ms'))
  };
  return Object.freeze(snapshot);
}

export function matchesCoachContext(snapshot, data, { requestId, mode, currentSnapshot, currentOpen } = {}) {
  if (!snapshot || !data) return false;
  if (currentOpen === false) return false;
  if (currentSnapshot && (
    currentSnapshot.requestId !== snapshot.requestId ||
    currentSnapshot.questionId !== snapshot.questionId ||
    currentSnapshot.subjectId !== snapshot.subjectId ||
    currentSnapshot.topicId !== snapshot.topicId
  )) return false;
  return (!requestId || snapshot.requestId === requestId) &&
    (!mode || data.generatedMode === mode) &&
    (!data.sourceQuestionId || data.sourceQuestionId === snapshot.questionId) &&
    (!data.sourceSubjectId || data.sourceSubjectId === snapshot.subjectId) &&
    (!data.sourceTopicId || data.sourceTopicId === snapshot.topicId);
}

export default { resolveCoachContextSnapshot, matchesCoachContext };
