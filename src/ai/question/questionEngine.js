import { diversifyQuestions } from '../diversity/questionDiversityEngine.js';
import { calculateDiversityScore } from './diversityEngine.js';
import { detectDuplicates } from './duplicateDetector.js';
import { getQuestionFeatureFlags, isQuestionIntelligenceEnabled } from './featureFlags.js';
import { planQuestionSession } from './sessionPlanner.js';
import { calculateContextAnalytics } from './contextAnalytics.js';
import { calculateStemAnalytics } from './stemAnalytics.js';
import { calculateNumberAnalytics } from './numberAnalytics.js';

function legacyQuestionSession(options = {}) {
  return diversifyQuestions(options);
}

export function buildQuestionSession(options = {}) {
  const {
    count = options.questions?.length || options.topic?.questions?.length || 0,
    sessionSeed = Date.now()
  } = options;

  const featureFlags = getQuestionFeatureFlags(options.featureFlags || {});
  const enabled = isQuestionIntelligenceEnabled(featureFlags);
  if (!enabled) return legacyQuestionSession({ ...options, count, sessionSeed });

  const base = legacyQuestionSession({ ...options, count, sessionSeed });
  const planned = planQuestionSession(base.questions || [], {
    ...options,
    featureFlags,
    count,
    subject: options.subject,
    topic: options.topic,
    memory: options.memory || {}
  });
  const questions = planned.questions;
  const analytics = calculateDiversityScore(questions);
  const stemAnalytics = calculateStemAnalytics(questions);
  const contextAnalytics = calculateContextAnalytics(questions);
  const numberAnalytics = calculateNumberAnalytics(questions);
  const duplicateIssues = detectDuplicates(questions).filter(issue => issue.reason !== 'same answer pattern');
  return {
    questions,
    score: analytics,
    analytics: { ...analytics, stemAnalytics, contextAnalytics, numberAnalytics },
    balance: {
      topics: questions.reduce((acc, question) => {
        const key = question.qip?.metadata?.topic || question.topicId || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      difficulties: questions.reduce((acc, question) => {
        const key = question.qip?.metadata?.difficulty || question.difficulty || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    },
    debug: questions.map(question => ({
      id: question.id,
      selectedQuestion: question.qip?.metadata?.questionId || question.id || '',
      selectionReason: question.qip?.reasonSelected || '',
      template: question.qip?.metadata?.templateId || '',
      stemVariant: question.q || '',
      originalStem: question.qip?.originalStem || question.question || question.q || '',
      selectedStem: question.qip?.selectedStem || question.q || '',
      variationGroup: question.qip?.variationGroup || '',
      stemSelectionReason: question.qip?.stemSelectionReason || '',
      stemReuseCount: question.qip?.stemReuseCount || 0,
      contextVariant: 'not applied',
      originalContext: question.qip?.originalContext || question.question || question.q || '',
      selectedContext: question.qip?.selectedContext || question.q || '',
      contextGroup: question.qip?.contextGroup || '',
      contextSelectionReason: question.qip?.contextSelectionReason || '',
      contextReuseCount: question.qip?.contextReuseCount || 0,
      originalNumbers: question.qip?.numberEngine?.originalNumbers || [],
      selectedNumbers: question.qip?.numberEngine?.selectedNumbers || [],
      patternGroup: question.qip?.numberEngine?.patternGroup || '',
      difficultyProfile: question.qip?.numberEngine?.difficultyProfile || '',
      selectionReason: question.qip?.numberEngine?.selectionReason || question.qip?.reasonSelected || '',
      reuseCount: question.qip?.numberEngine?.reuseCount || 0,
      numberDiversityScore: question.qip?.numberEngine?.numberDiversityScore || numberAnalytics.numberDiversity,
      reasonSelected: question.qip?.reasonSelected || '',
      difficulty: question.qip?.metadata?.difficulty || question.difficulty || '',
      adaptiveTrigger: question.qip?.adaptiveTrigger || 'none',
      duplicateCheck: question.qip?.duplicateCheck || ['pass'],
      historyCheck: question.qip?.historyCheck || {}
    })),
    duplicateIssues,
    rejected: [...(base.rejected || []), ...(planned.rejected || [])],
    plan: planned.plan,
    featureFlag: featureFlags
  };
}

export { calculateDiversityScore };
export { rememberQuestionIntelligenceHistory } from './historyEngine.js';
