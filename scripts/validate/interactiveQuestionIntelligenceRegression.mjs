import assert from 'node:assert/strict';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { recordQuestionResult } from '../../src/ai/adaptive/adaptiveSessionEngine.js';
import {
  buildPersonalizedHintPlan,
  buildVariantReadiness,
  resolveQuestionIntelligence,
  summarizeQuestionIntelligence,
  validateQuestionIntelligence
} from '../../src/ai/question/interactiveQuestionIntelligence.js';
import { calculateQuestionAnalytics, summarizeBalance } from '../../src/ai/question/analyticsEngine.js';
import { resolveQuestionMeta } from '../../src/ai/questionGenerator/questionPriority.js';

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions));
const interactiveQuestions = questions.filter(question => question.interaction);
const reviewedQuestions = questions.filter(question => question.learningIntelligence);

assert.equal(questions.length, 4530, 'Phase 3 readiness must not add or remove bank questions.');
assert.equal(reviewedQuestions.length, interactiveQuestions.length, 'Every interactive example requires reviewed Phase 3 intelligence.');

for (const question of reviewedQuestions) {
  assert.deepEqual(validateQuestionIntelligence(question), [], `${question.id} has invalid Phase 3 intelligence.`);
  const intelligence = resolveQuestionIntelligence(question);
  assert.equal(intelligence.questionType, question.interaction.type, `${question.id} must retain its renderer type.`);
  assert.ok(intelligence.skillId, `${question.id} requires a stable skill identifier.`);
  assert.equal(intelligence.masteryEligible, true, `${question.id} must contribute to mastery.`);
  assert.equal(intelligence.weakTopicEligible, true, `${question.id} must contribute to weak-topic targeting.`);
  assert.equal(question.learningIntelligence.adaptiveSignals.questionType, question.interaction.type, `${question.id} must expose its adaptive question type.`);
  assert.equal(question.learningIntelligence.adaptiveSignals.skillId, intelligence.skillId, `${question.id} must expose its adaptive skill identity.`);
  assert.equal(buildVariantReadiness(question, { variationSeed: 17 }).canGenerate, false, `${question.id} AI variants must remain locked pending review.`);
}

const imageQuestion = reviewedQuestions.find(question => question.id === 'MATH-BENTUK-PILOT-001');
const confidentHint = buildPersonalizedHintPlan(imageQuestion, { mastery: 90, confidence: 90, attemptNumber: 1 });
const supportedHint = buildPersonalizedHintPlan(imageQuestion, { mastery: 30, confidence: 35, attemptNumber: 3 });
assert.equal(confidentHint.hintLevel, 1, 'A confident learner should receive the lightest reviewed hint.');
assert.equal(supportedHint.hintLevel, 3, 'A learner needing support should receive a deeper reviewed hint.');
assert.notEqual(confidentHint.hint, supportedHint.hint, 'Personalized hint levels must provide progressive scaffolding.');
assert.equal(confidentHint.source, 'reviewed_interactive_scaffold');

const priorityMeta = resolveQuestionMeta(imageQuestion, { subjectId: 'math', topicId: 'bentuk' });
assert.equal(priorityMeta.questionType, 'imageChoice', 'Adaptive selection must see the interactive question type.');
assert.equal(priorityMeta.skillId, 'bentuk.sisi_segi_tiga', 'Adaptive selection must see the reviewed skill.');

const analytics = calculateQuestionAnalytics(reviewedQuestions);
const balance = summarizeBalance(reviewedQuestions);
assert.ok(analytics.interactionTypeDiversity > 0, 'Question analytics must report interaction-type diversity.');
assert.ok(analytics.responseModeDiversity > 0, 'Question analytics must report response-mode diversity.');
assert.equal(Object.keys(balance.interactionTypes).length, 11, 'Analytics must retain all eleven reviewed interaction types.');

const intelligenceSummary = summarizeQuestionIntelligence(reviewedQuestions);
assert.equal(intelligenceSummary.masteryEligible, reviewedQuestions.length);
assert.equal(intelligenceSummary.weakTopicEligible, reviewedQuestions.length);
assert.equal(intelligenceSummary.variantReady, 0, 'No AI variant may bypass human review in this phase.');
assert.equal(intelligenceSummary.variantReviewRequired, reviewedQuestions.length);

const adaptiveBase = {
  xp: 0,
  level: 1,
  streak: 0,
  subjects: {},
  topics: {},
  learningHistory: [],
  questionLog: [],
  sessionHistory: [],
  currentSession: {
    sessionId: 'phase3-regression-session',
    subjectId: 'math',
    topicId: 'bentuk',
    questions: [],
    correct: 0,
    wrong: 0
  }
};
const adaptiveResult = recordQuestionResult(adaptiveBase, {
  sessionId: 'phase3-regression-session',
  questionId: imageQuestion.id,
  subjectId: 'math',
  topicId: 'bentuk',
  correct: true,
  difficulty: 'easy',
  timeSpent: 8,
  answeredAt: '2026-08-24T00:00:00.000Z',
  questionType: priorityMeta.questionType,
  skillId: priorityMeta.skillId
});
assert.equal(adaptiveResult.profile.learningHistory[0].questionType, 'imageChoice');
assert.equal(adaptiveResult.profile.learningHistory[0].skillId, 'bentuk.sisi_segi_tiga');

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Interactive Question Intelligence Phase 3',
  questionBankCount: questions.length,
  reviewedQuestions: reviewedQuestions.length,
  adaptiveSignals: ['questionType', 'skillId'],
  personalizedHintLevels: 3,
  aiVariantGate: 'review_required',
  masteryFormulaChanged: false
}, null, 2));
