import { foundationSignature } from './duplicateDetector.js';
import { buildQuestionHistorySet } from './historyEngine.js';
import { getInteractiveQuestionConfig, isInteractiveQuestion } from '../../utils/interactiveQuestion.js';

const TARGET_MINIMUM = 50;
const TARGET_MAXIMUM = 65;

function normalizeCount(count) {
  const parsed = Number(count);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 10;
}

function getTargetInteractiveCount(count) {
  if (count <= 0) return 0;
  const minimum = Math.ceil(count * (TARGET_MINIMUM / 100));
  const maximum = Math.floor(count * (TARGET_MAXIMUM / 100));
  if (minimum <= maximum) return maximum;
  return Math.min(count, Math.max(0, Math.round(count * 0.6)));
}

function attachSourceMetadata(question, subject, topic) {
  return {
    ...question,
    subjectId: subject.id,
    subjectTitle: subject.title,
    subjectShort: subject.short,
    topicId: topic.id,
    topicTitle: topic.title
  };
}

function flattenSubjectQuestions(subject = {}, eligibleTopicIds) {
  const eligible = Array.isArray(eligibleTopicIds)
    ? new Set(eligibleTopicIds.map(String))
    : null;
  const seenIds = new Set();
  const candidates = [];

  (subject?.topics || []).forEach((topic, topicIndex) => {
    if (eligible && !eligible.has(String(topic?.id || ''))) return;
    (topic?.questions || []).forEach((question, questionIndex) => {
      const id = String(question?.id || question?.questionId || '').trim();
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);
      const sessionQuestion = attachSourceMetadata(question, subject, topic);
      const interactive = isInteractiveQuestion(sessionQuestion);
      const config = interactive ? getInteractiveQuestionConfig(sessionQuestion) : null;
      const authored = Boolean(interactive && question?.interaction);
      candidates.push({
        id,
        topicId: String(topic?.id || ''),
        topicIndex,
        questionIndex,
        question: sessionQuestion,
        interactive,
        authored,
        rich: Boolean(authored && config?.type !== 'choice'),
        recent: false
      });
    });
  });

  return candidates;
}

function isRecentQuestion(candidate, history) {
  const signature = foundationSignature(candidate.question);
  const fullSignature = `${signature.id}:${signature.stem}:${signature.template}:${signature.topic}`;
  return history.questionIds.has(candidate.id)
    || history.questions.has(candidate.id)
    || history.questions.has(fullSignature)
    || (signature.stem && history.questions.has(signature.stem));
}

function takeTopicSpread(candidates, limit, selectedIds) {
  if (limit <= 0 || !candidates.length) return [];
  const queues = new Map();
  candidates.forEach(candidate => {
    if (!queues.has(candidate.topicId)) queues.set(candidate.topicId, []);
    queues.get(candidate.topicId).push(candidate);
  });

  const selected = [];
  while (selected.length < limit) {
    let progressed = false;
    for (const queue of queues.values()) {
      let candidate = queue.shift();
      while (candidate && selectedIds.has(candidate.id)) candidate = queue.shift();
      if (!candidate) continue;
      selectedIds.add(candidate.id);
      selected.push(candidate);
      progressed = true;
      if (selected.length >= limit) break;
    }
    if (!progressed) break;
  }
  return selected;
}

function selectByPriority(groups, limit) {
  const selected = [];
  const selectedIds = new Set();
  for (const group of groups) {
    if (selected.length >= limit) break;
    selected.push(...takeTopicSpread(group, limit - selected.length, selectedIds));
  }
  return selected;
}

function interleaveQuestions(interactive, standard) {
  const total = interactive.length + standard.length;
  const ordered = [];
  let interactiveIndex = 0;
  let standardIndex = 0;

  for (let position = 1; position <= total; position += 1) {
    const desiredInteractive = Math.round((position * interactive.length) / total);
    const shouldUseInteractive = interactiveIndex < desiredInteractive
      && interactiveIndex < interactive.length;
    if (shouldUseInteractive || standardIndex >= standard.length) {
      ordered.push(interactive[interactiveIndex].question);
      interactiveIndex += 1;
    } else {
      ordered.push(standard[standardIndex].question);
      standardIndex += 1;
    }
  }

  return ordered;
}

export function rehydrateInteractivePracticeQuestions(subject = {}, savedQuestions = []) {
  const sourceById = new Map(flattenSubjectQuestions(subject).map(candidate => [candidate.id, candidate.question]));
  return (Array.isArray(savedQuestions) ? savedQuestions : []).map(savedQuestion => {
    const id = String(savedQuestion?.id || savedQuestion?.questionId || '').trim();
    const currentQuestion = sourceById.get(id);
    return currentQuestion ? { ...currentQuestion } : { ...savedQuestion };
  });
}

export function buildInteractivePracticeSession(subject = {}, {
  memory = {},
  count = 10,
  eligibleTopicIds
} = {}) {
  const requestedCount = normalizeCount(count);
  const history = buildQuestionHistorySet(memory || {});
  const candidates = flattenSubjectQuestions(subject, eligibleTopicIds)
    .map(candidate => ({ ...candidate, recent: isRecentQuestion(candidate, history) }));
  const actualLimit = Math.min(requestedCount, candidates.length);
  const targetInteractiveCount = getTargetInteractiveCount(actualLimit);
  const interactivePool = candidates.filter(candidate => candidate.interactive);
  const standardPool = candidates.filter(candidate => !candidate.interactive);

  let interactiveQuota = Math.min(targetInteractiveCount, interactivePool.length);
  let standardQuota = Math.min(actualLimit - interactiveQuota, standardPool.length);
  let remaining = actualLimit - interactiveQuota - standardQuota;
  if (remaining > 0) {
    const extraInteractive = Math.min(remaining, interactivePool.length - interactiveQuota);
    interactiveQuota += extraInteractive;
    remaining -= extraInteractive;
  }
  if (remaining > 0) standardQuota += Math.min(remaining, standardPool.length - standardQuota);

  const interactive = selectByPriority([
    interactivePool.filter(candidate => !candidate.recent && candidate.rich),
    interactivePool.filter(candidate => !candidate.recent && candidate.authored && !candidate.rich),
    interactivePool.filter(candidate => !candidate.recent && !candidate.authored),
    interactivePool.filter(candidate => candidate.recent && candidate.rich),
    interactivePool.filter(candidate => candidate.recent && candidate.authored && !candidate.rich),
    interactivePool.filter(candidate => candidate.recent && !candidate.authored)
  ], interactiveQuota);
  const standard = selectByPriority([
    standardPool.filter(candidate => !candidate.recent),
    standardPool.filter(candidate => candidate.recent)
  ], standardQuota);
  const questions = interleaveQuestions(interactive, standard);
  const actualCount = questions.length;
  const interactiveCount = interactive.length;
  const interactivePercent = actualCount ? Number(((interactiveCount / actualCount) * 100).toFixed(2)) : 0;
  const recentRepeatCount = [...interactive, ...standard].filter(candidate => candidate.recent).length;
  const targetMet = actualCount > 0
    && interactivePercent >= TARGET_MINIMUM
    && interactivePercent <= TARGET_MAXIMUM;
  const fallbackReasons = [];
  if (!actualCount) fallbackReasons.push('no-eligible-questions');
  else if (actualCount < requestedCount) fallbackReasons.push('insufficient-total-questions');
  if (interactivePool.length < targetInteractiveCount) fallbackReasons.push('insufficient-interactive-questions');
  if (standardPool.length < actualLimit - targetInteractiveCount) fallbackReasons.push('insufficient-standard-questions');
  if (recentRepeatCount > 0) fallbackReasons.push('recent-questions-reused');
  if (!targetMet && actualCount > 0) fallbackReasons.push('interactive-target-not-met');

  return {
    questions,
    metadata: {
      requestedCount,
      actualCount,
      interactiveCount,
      standardCount: standard.length,
      interactivePercent,
      authoredCount: interactive.filter(candidate => candidate.authored).length,
      derivedCount: interactive.filter(candidate => !candidate.authored).length,
      recentRepeatCount,
      topicsRepresented: [...new Set(questions.map(question => question.topicId).filter(Boolean))],
      targetMinimum: TARGET_MINIMUM,
      targetMaximum: TARGET_MAXIMUM,
      targetMet,
      fallbackUsed: fallbackReasons.length > 0,
      fallbackReason: fallbackReasons.length ? fallbackReasons.join(', ') : null
    }
  };
}

export default buildInteractivePracticeSession;
