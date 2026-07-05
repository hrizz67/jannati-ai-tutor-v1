import { addSeenSignature, createSeenSignatures, detectDuplicateIssues, duplicateReasons, normalizeStem, numberSignature, questionSignature } from './duplicateDetector.js';
import { applyNumberVariation, buildVirtualQuestion, VIRTUAL_QUESTION_TEMPLATES } from './numberVariationEngine.js';
import { applyStemVariation } from './stemVariationEngine.js';
import { rotateDifficulty } from './difficultyRotationEngine.js';
import { rotateTopics } from './topicRotationEngine.js';
import { buildHistorySet, rememberQuestionHistory } from './sessionHistoryEngine.js';

function shuffleStable(items = [], seed = Date.now()) {
  return [...items]
    .map((item, index) => ({ item, score: Math.sin((index + 1) * 999 + seed) }))
    .sort((a, b) => a.score - b.score)
    .map(row => row.item);
}

function decorateQuestion(question, context) {
  const withNumbers = applyNumberVariation(question, context);
  const withStem = applyStemVariation(withNumbers, context.usedStems);
  const signature = questionSignature(withStem);
  context.usedStems.add(signature.stem || normalizeStem(withStem.q));
  if (signature.numbers) context.usedNumberSequences.add(signature.numbers);
  return {
    ...withStem,
    qde: {
      ...(withStem.qde || {}),
      selectedTopic: context.topic?.title || withStem.topicTitle || '',
      selectedTopicId: context.topic?.id || withStem.topicId || '',
      difficulty: withStem.difficulty || context.topic?.difficulty || 'mudah',
      historySignature: `${signature.template}:${signature.numbers}:${signature.answer}`,
      reason: context.reason || 'QDE selected for session diversity'
    }
  };
}

function buildCandidates({ subject, topic, topics = null, questions = [] }) {
  if (Array.isArray(topics) && topics.length) {
    return topics.flatMap(sourceTopic => (sourceTopic.questions || []).map(question => ({
      ...question,
      topicId: sourceTopic.id,
      topicTitle: sourceTopic.title,
      subjectId: subject?.id,
      subjectTitle: subject?.title,
      topicDifficulty: sourceTopic.difficulty
    })));
  }
  return questions.map(question => ({
    ...question,
    topicId: topic?.id || question.topicId,
    topicTitle: topic?.title || question.topicTitle,
    subjectId: subject?.id || question.subjectId,
    subjectTitle: subject?.title || question.subjectTitle,
    topicDifficulty: topic?.difficulty || question.topicDifficulty
  }));
}

function addVirtualTemplates(candidates, context) {
  if (context.subject?.id !== 'math') return candidates;
  const templates = VIRTUAL_QUESTION_TEMPLATES
    .filter(template => template.subjectId === context.subject.id)
    .map((template, index) => ({
      ...buildVirtualQuestion(template, { ...context, index: candidates.length + index }),
      topicId: context.topic?.id || candidates[0]?.topicId || 'math-virtual',
      topicTitle: context.topic?.title || candidates[0]?.topicTitle || 'Matematik',
      subjectId: context.subject.id,
      subjectTitle: context.subject.title
    }));
  return [...candidates, ...templates];
}

export function calculateDiversityScore(questions = []) {
  const total = Math.max(questions.length, 1);
  const stems = new Set(questions.map(question => normalizeStem(question.q)).filter(Boolean)).size;
  const topics = new Set(questions.map(question => question.topicId || question.qde?.selectedTopicId).filter(Boolean)).size;
  const difficulties = new Set(questions.map(question => question.difficulty || question.qde?.difficulty).filter(Boolean)).size;
  const numbers = new Set(questions.map(numberSignature).filter(Boolean)).size;
  const stemDiversity = Math.round((stems / total) * 100);
  const topicDiversity = Math.round((topics / total) * 100);
  const difficultyDiversity = Math.round((difficulties / Math.min(total, 3)) * 100);
  const numberDiversity = numbers ? Math.round((numbers / total) * 100) : 100;
  const overallDiversity = Math.round((stemDiversity + topicDiversity + difficultyDiversity + numberDiversity) / 4);
  return { stemDiversity, topicDiversity, difficultyDiversity, numberDiversity, overallDiversity };
}

export function diversifyQuestions(options = {}) {
  const {
    subject = null,
    topic = null,
    topics = null,
    questions = topic?.questions || [],
    count = questions.length,
    memory = {},
    allowReinforcement = false,
    allowAdaptiveOverride = false,
    sessionSeed = Date.now()
  } = options;

  const context = {
    subject,
    topic,
    usedStems: new Set(),
    usedNumberSequences: new Set(),
    sessionSeed,
    reason: allowReinforcement ? 'Adaptive reinforcement allowed' : 'Diversity rotation'
  };
  const history = buildHistorySet(memory);
  const rawCandidates = addVirtualTemplates(buildCandidates({ subject, topic, topics, questions }), context);
  const ordered = rotateDifficulty(
    rotateTopics(shuffleStable(rawCandidates, sessionSeed), { allowReinforcement }),
    { allowAdaptiveOverride }
  );
  const seen = createSeenSignatures();
  const selected = [];
  const rejected = [];

  for (const candidate of ordered) {
    if (selected.length >= count) break;
    const varied = decorateQuestion(candidate, { ...context, index: selected.length });
    const signature = questionSignature(varied);
    const historyMatch = history.has(signature.id) || history.has(varied.qde.historySignature);
    const reasons = duplicateReasons(varied, seen);
    const blocked = reasons.length || historyMatch;
    if (!blocked || rawCandidates.length <= count) {
      selected.push({
        ...varied,
        qde: {
          ...(varied.qde || {}),
          historyMatch,
          duplicateCheck: reasons.length ? reasons : ['pass']
        }
      });
      addSeenSignature(seen, varied);
    } else {
      rejected.push({ id: varied.id, reasons: historyMatch ? ['history', ...reasons] : reasons });
    }
  }

  if (selected.length < Math.min(count, ordered.length)) {
    for (const candidate of ordered) {
      if (selected.length >= Math.min(count, ordered.length)) break;
      if (selected.some(question => question.id === candidate.id)) continue;
      selected.push(decorateQuestion(candidate, { ...context, index: selected.length, reason: 'Question bank exhausted fallback' }));
    }
  }

  const finalQuestions = selected.slice(0, count);
  const duplicateIssues = detectDuplicateIssues(finalQuestions);
  const diversityScore = calculateDiversityScore(finalQuestions);
  return {
    questions: finalQuestions,
    score: diversityScore,
    debug: finalQuestions.map(question => ({
      id: question.id,
      selectedTopic: question.qde?.selectedTopic,
      difficulty: question.qde?.difficulty,
      reason: question.qde?.reason,
      variationUsed: question.qde?.variationUsed,
      templateUsed: question.qde?.templateId || '',
      historyMatch: Boolean(question.qde?.historyMatch),
      duplicateCheck: question.qde?.duplicateCheck || ['pass']
    })),
    rejected,
    duplicateIssues
  };
}

export function appendQuestionHistory(memory = {}, questions = []) {
  return rememberQuestionHistory(memory, questions);
}
