const STAGE_ORDER = [
  'objective',
  'notes',
  'examples',
  'guidedPractice',
  'assessment',
  'feedback',
  'remediation'
];

const STAGE_LABELS = {
  objective: 'Objektif dan hasil pembelajaran',
  notes: 'Nota pengajaran',
  examples: 'Contoh dan pemodelan',
  guidedPractice: 'Latihan berpandu',
  assessment: 'Latihan kendiri dan pentaksiran',
  feedback: 'Maklum balas diagnostik',
  remediation: 'Pemulihan dan perkembangan'
};

const COMMON_EXAMPLE_FIELDS = ['workedExamples', 'examples', 'extraExamples'];

const SUBJECT_EXAMPLE_FIELDS = {
  bm: ['exampleSentences', 'readingSteps'],
  math: ['problemSolvingSteps', 'realLifeApplications'],
  english: ['wordMeaning', 'exampleSentences', 'readingSteps'],
  sains: [
    'scientificFacts',
    'observationPrompts',
    'comparisonPrompts',
    'investigationIdeas',
    'realLifeConnections',
    'whyQuestions',
    'predictionQuestions'
  ],
  arab: [
    'pronunciationGuide',
    'letterBreakdown',
    'vocabularyGroups',
    'readingPractice',
    'listeningPractice',
    'speakingPractice',
    'writingPractice',
    'exampleSentences'
  ],
  islam: [
    'dailyPractice',
    'adabApplications',
    'realLifeExamples',
    'ayahOrHadithReference',
    'reflectionQuestions',
    'goodDeedsIdeas'
  ],
  pj: [
    'movementSteps',
    'coordinationTips',
    'fitnessActivities',
    'warmUpIdeas',
    'coolDownIdeas',
    'equipmentUse',
    'gameApplications',
    'dailyMovementIdeas'
  ],
  pk: [
    'healthyHabits',
    'hygieneSteps',
    'nutritionTips',
    'personalSafety',
    'emotionSkills',
    'helpSeekingSteps',
    'realLifeScenarios',
    'bodyCare',
    'familyHealthIdeas'
  ]
};

const OBSERVABLE_VERBS = [
  'answer', 'apply', 'build', 'classify', 'compare', 'complete', 'construct', 'count',
  'describe', 'differentiate', 'explain', 'form', 'identify', 'match', 'name', 'perform',
  'read', 'recognise', 'recognize', 'show', 'solve', 'sort', 'use', 'write',
  'baca', 'bina', 'banding', 'bezakan', 'hitung', 'jelas', 'kelas', 'kira', 'lakukan',
  'lengkap', 'kenal', 'guna', 'padan', 'nyata', 'sebut', 'selesai', 'susun', 'tambah',
  'tentu', 'tulis', 'tolak', 'tunjuk', 'ukur', 'faham', 'mengenal', 'mengelaskan',
  'menghubungkan', 'meramal', 'menerangkan', 'mengaplikasikan', 'memahami', 'memilih',
  'mengamalkan', 'menyebut', 'memerhati', 'bermain', 'bertindak', 'mengetahui',
  'mengulang', 'membuat', 'menilai'
];

const TEACHING_FIELDS = [
  'learningObjectives',
  'teacherExplanation',
  'simpleExplanation',
  'explanations',
  'workedExamples',
  'examples',
  'extraExamples',
  'problemSolvingSteps',
  'pronunciationGuide',
  'readingSteps',
  'letterBreakdown',
  'wordMeaning',
  'exampleSentences',
  'realLifeApplications',
  'movementSteps',
  'fitnessActivities',
  'gameApplications',
  'healthyHabits',
  'hygieneSteps',
  'nutritionTips',
  'personalSafety',
  'emotionSkills',
  'helpSeekingSteps',
  'realLifeScenarios',
  'scientificFacts',
  'observationPrompts',
  'comparisonPrompts',
  'investigationIdeas',
  'realLifeConnections',
  'pronunciationTips',
  'letterRecognitionTips',
  'writingTips',
  'vocabularyGroups',
  'translationHints',
  'readingPractice',
  'listeningPractice',
  'speakingPractice',
  'writingPractice',
  'dailyPractice',
  'adabApplications',
  'realLifeExamples',
  'ayahOrHadithReference',
  'goodDeedsIdeas',
  'tips',
  'memoryTips',
  'curriculum'
];

const NON_TEACHING_FIELDS = new Set([
  'version',
  'subjectId',
  'topicId',
  'displayName',
  'difficulty',
  'keywords',
  'questionPatterns',
  'wrongAnswerPatterns',
  'commonMistakes',
  'misconceptions',
  'commonPronunciationMistakes',
  'followUpQuestions',
  'relatedTopics',
  'encouragement'
]);

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function ratio(value, total) {
  return total > 0 ? value / total : 0;
}

function round(value, precision = 0) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function toList(value) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null || value === '' ? [] : [value];
}

function flattenText(value) {
  if (value === undefined || value === null) return [];
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text ? [text] : [];
  }
  if (Array.isArray(value)) return value.flatMap(flattenText);
  if (typeof value === 'object') return Object.values(value).flatMap(flattenText);
  return [];
}

function normalizeText(value) {
  return flattenText(value)
    .join(' ')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('ms-MY')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueText(values) {
  const seen = new Set();
  return flattenText(values).filter(value => {
    const key = normalizeText(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function containsConcept(corpus, concept) {
  const normalizedConcept = normalizeText(concept);
  if (!corpus || !normalizedConcept) return false;
  return ` ${corpus} `.includes(` ${normalizedConcept} `);
}

function makeIssue(stage, code, message, severity = 'High', blocker = true, evidence = {}) {
  return { stage, code, severity, blocker, message, evidence };
}

function makeStage(id, score, passed, evidence, issues = []) {
  return {
    id,
    label: STAGE_LABELS[id],
    score: clamp(Math.round(score)),
    passed: Boolean(passed),
    evidence,
    issues
  };
}

function getQuestionText(question = {}) {
  return String(question.q ?? question.question ?? '').trim();
}

function getObjectives(topic = {}, pack = {}) {
  return uniqueText([
    topic.learningObjectives,
    topic.learningObjective,
    topic.learningOutcome,
    pack.learningObjectives
  ]);
}

function hasObservableOutcome(objectives = []) {
  const corpus = normalizeText(objectives);
  return OBSERVABLE_VERBS.some(verb => corpus.includes(verb));
}

function getExampleItems(subjectId, pack = {}) {
  const fields = [...COMMON_EXAMPLE_FIELDS, ...(SUBJECT_EXAMPLE_FIELDS[subjectId] || [])];
  return uniqueText(fields.flatMap(field => toList(pack[field])));
}

function getSemanticEvidence(topic, pack, questions) {
  const keywords = uniqueText(pack.keywords);
  const authoredTeachingContent = Object.entries(pack)
    .filter(([field]) => !NON_TEACHING_FIELDS.has(field))
    .map(([, value]) => value);
  const teachingCorpus = normalizeText([
    topic.title,
    topic.note,
    topic.learningObjectives,
    topic.learningObjective,
    topic.learningOutcome,
    ...TEACHING_FIELDS.map(field => pack[field]),
    authoredTeachingContent
  ]);
  const assessmentCorpus = normalizeText(questions.map(question => [
    getQuestionText(question),
    question.answer,
    question.accepted,
    question.options
  ]));
  const feedbackCorpus = normalizeText([
    questions.map(question => [question.hint, question.explanation]),
    pack.commonMistakes,
    pack.misconceptions,
    pack.wrongAnswerPatterns,
    pack.followUpQuestions
  ]);

  const taughtKeywords = keywords.filter(keyword => containsConcept(teachingCorpus, keyword));
  const assessedKeywords = keywords.filter(keyword => containsConcept(assessmentCorpus, keyword));
  const feedbackKeywords = keywords.filter(keyword => containsConcept(feedbackCorpus, keyword));
  const taughtSet = new Set(taughtKeywords.map(normalizeText));
  const bridgedKeywords = assessedKeywords.filter(keyword => taughtSet.has(normalizeText(keyword)));
  const untaughtAssessedKeywords = assessedKeywords.filter(keyword => !taughtSet.has(normalizeText(keyword)));
  const keywordCount = keywords.length;
  const bridgePrecision = assessedKeywords.length ? ratio(bridgedKeywords.length, assessedKeywords.length) : 0;
  const score = keywordCount
    ? round(
      ratio(taughtKeywords.length, keywordCount) * 30
      + ratio(assessedKeywords.length, keywordCount) * 25
      + ratio(feedbackKeywords.length, keywordCount) * 15
      + bridgePrecision * 30
    )
    : 0;

  return {
    score: clamp(score),
    keywordCount,
    taughtKeywords,
    assessedKeywords,
    feedbackKeywords,
    bridgedKeywords,
    untaughtAssessedKeywords,
    teachingCoverage: round(ratio(taughtKeywords.length, keywordCount) * 100, 1),
    assessmentCoverage: round(ratio(assessedKeywords.length, keywordCount) * 100, 1),
    feedbackCoverage: round(ratio(feedbackKeywords.length, keywordCount) * 100, 1),
    bridgePrecision: round(bridgePrecision * 100, 1)
  };
}

export const LEARNING_JOURNEY_ALIGNMENT_VERSION = 1;

export const DEFAULT_ALIGNMENT_CONFIG = {
  minimumQuestions: 10,
  minimumHintCoverage: 0.9,
  minimumExplanationCoverage: 0.9,
  minimumExamples: 3,
  minimumCommonMistakes: 3,
  minimumWrongAnswerPatterns: 3,
  minimumFollowUpQuestions: 3,
  semanticReviewThreshold: 45,
  semanticMismatchMinimum: 2,
  semanticMismatchRatio: 0.3
};

export function auditTopicJourney({ subject = {}, topic = {}, pack = {}, adaptiveRouteAvailable = true } = {}, options = {}) {
  const config = { ...DEFAULT_ALIGNMENT_CONFIG, ...options };
  const questions = Array.isArray(topic.questions) ? topic.questions : [];
  const objectives = getObjectives(topic, pack);
  const observableOutcome = hasObservableOutcome(objectives);
  const hasCurriculumMapping = Boolean(pack.curriculum?.SK && pack.curriculum?.SP);
  const objectiveIssues = [];
  if (!objectives.length) {
    objectiveIssues.push(makeIssue('objective', 'missing_learning_objective', 'Topik tidak mempunyai objektif pembelajaran.'));
  }
  if (!observableOutcome) {
    objectiveIssues.push(makeIssue('objective', 'non_observable_learning_outcome', 'Objektif tidak menyatakan hasil yang boleh diperhatikan atau diukur.'));
  }
  const objectiveStage = makeStage(
    'objective',
    Math.min(50, ratio(objectives.length, 3) * 50) + (observableOutcome ? 30 : 0) + (hasCurriculumMapping ? 20 : 0),
    objectives.length > 0 && observableOutcome,
    { objectiveCount: objectives.length, observableOutcome, hasCurriculumMapping },
    objectiveIssues
  );

  const topicNote = String(topic.note || '').trim();
  const simpleExplanation = String(pack.simpleExplanation || '').trim();
  const teacherExplanationCount = toList(pack.teacherExplanation).filter(Boolean).length;
  const noteIssues = [];
  if (!topicNote) noteIssues.push(makeIssue('notes', 'missing_topic_note', 'Nota ringkas topik belum tersedia.'));
  if (!simpleExplanation) noteIssues.push(makeIssue('notes', 'missing_simple_explanation', 'Penerangan mudah untuk murid belum tersedia.'));
  if (teacherExplanationCount < 2) noteIssues.push(makeIssue('notes', 'insufficient_teacher_explanation', 'Nota guru memerlukan sekurang-kurangnya dua poin penerangan.', 'High', true, { teacherExplanationCount }));
  const notesStage = makeStage(
    'notes',
    (topicNote ? 30 : 0) + (simpleExplanation ? 25 : 0) + Math.min(45, ratio(teacherExplanationCount, 4) * 45),
    Boolean(topicNote && simpleExplanation && teacherExplanationCount >= 2),
    { hasTopicNote: Boolean(topicNote), hasSimpleExplanation: Boolean(simpleExplanation), teacherExplanationCount },
    noteIssues
  );

  const exampleItems = getExampleItems(subject.id, pack);
  const hasWorkedModel = toList(pack.workedExamples).length > 0
    || (SUBJECT_EXAMPLE_FIELDS[subject.id] || []).some(field => toList(pack[field]).length > 0);
  const exampleIssues = exampleItems.length >= config.minimumExamples
    ? []
    : [makeIssue('examples', 'insufficient_examples', `Topik memerlukan sekurang-kurangnya ${config.minimumExamples} contoh atau aktiviti pemodelan.`, 'High', true, { exampleCount: exampleItems.length })];
  const examplesStage = makeStage(
    'examples',
    Math.min(70, ratio(exampleItems.length, 10) * 70) + (hasWorkedModel ? 30 : 0),
    exampleItems.length >= config.minimumExamples,
    { exampleCount: exampleItems.length, hasWorkedModel },
    exampleIssues
  );

  const hintCount = questions.filter(question => String(question.hint || '').trim()).length;
  const hintCoverage = ratio(hintCount, questions.length);
  const cognitiveLevels = [...new Set(questions.map(question => String(question.cognitiveLevel || '').trim()).filter(Boolean))];
  const difficultyLevels = [...new Set(questions.map(question => String(question.difficulty || '').trim()).filter(Boolean))];
  const questionTypes = [...new Set(questions.map(question => String(question.questionType || '').trim()).filter(Boolean))];
  const hasFoundationPractice = cognitiveLevels.some(level => ['mengingat', 'memahami', 'remember', 'understand'].includes(level.toLocaleLowerCase('ms-MY')))
    || difficultyLevels.some(level => ['mudah', 'easy'].includes(level.toLocaleLowerCase('ms-MY')));
  const guidedIssues = [];
  if (questions.length < config.minimumQuestions) guidedIssues.push(makeIssue('guidedPractice', 'insufficient_practice_questions', `Topik memerlukan sekurang-kurangnya ${config.minimumQuestions} soalan latihan.`, 'High', true, { questionCount: questions.length }));
  if (hintCoverage < config.minimumHintCoverage) guidedIssues.push(makeIssue('guidedPractice', 'insufficient_hint_coverage', 'Liputan petunjuk latihan berpandu berada di bawah ambang.', 'High', true, { hintCoverage: round(hintCoverage * 100, 1) }));
  const guidedStage = makeStage(
    'guidedPractice',
    Math.min(30, ratio(questions.length, config.minimumQuestions) * 30) + hintCoverage * 50 + (hasFoundationPractice ? 20 : 0),
    questions.length >= config.minimumQuestions && hintCoverage >= config.minimumHintCoverage,
    { questionCount: questions.length, hintCount, hintCoverage: round(hintCoverage * 100, 1), hasFoundationPractice },
    guidedIssues
  );

  const answerCount = questions.filter(question => question.answer !== undefined && question.answer !== null && String(question.answer).trim()).length;
  const answerCoverage = ratio(answerCount, questions.length);
  const hasAssessmentDiversity = cognitiveLevels.length >= 2 || difficultyLevels.length >= 2 || questionTypes.length >= 2;
  const assessmentIssues = [];
  if (questions.length < config.minimumQuestions) assessmentIssues.push(makeIssue('assessment', 'insufficient_assessment_questions', 'Bank topik belum cukup untuk latihan kendiri dan pentaksiran.'));
  if (answerCoverage < 1) assessmentIssues.push(makeIssue('assessment', 'missing_canonical_answers', 'Setiap item pentaksiran mesti mempunyai jawapan kanonik.', 'Critical', true, { answerCoverage: round(answerCoverage * 100, 1) }));
  if (!hasAssessmentDiversity) assessmentIssues.push(makeIssue('assessment', 'insufficient_assessment_diversity', 'Pentaksiran memerlukan variasi aras kognitif, kesukaran atau bentuk soalan.', 'High', true, { cognitiveLevels, difficultyLevels, questionTypes }));
  const assessmentStage = makeStage(
    'assessment',
    Math.min(20, ratio(questions.length, config.minimumQuestions) * 20) + answerCoverage * 40 + Math.min(25, ratio(Math.max(cognitiveLevels.length, difficultyLevels.length, questionTypes.length), 2) * 25) + Math.min(15, ratio(Math.max(difficultyLevels.length, cognitiveLevels.length, questionTypes.length), 3) * 15),
    questions.length >= config.minimumQuestions && answerCoverage === 1 && hasAssessmentDiversity,
    { questionCount: questions.length, answerCount, answerCoverage: round(answerCoverage * 100, 1), cognitiveLevels, difficultyLevels, questionTypes },
    assessmentIssues
  );

  const explanationCount = questions.filter(question => String(question.explanation || '').trim()).length;
  const explanationCoverage = ratio(explanationCount, questions.length);
  const commonMistakeCount = toList(pack.commonMistakes).filter(Boolean).length;
  const retryMessageCount = toList(pack.encouragement?.retry).filter(Boolean).length;
  const feedbackIssues = [];
  if (explanationCoverage < config.minimumExplanationCoverage) feedbackIssues.push(makeIssue('feedback', 'insufficient_explanation_coverage', 'Maklum balas selepas menjawab tidak meliputi bank soalan dengan mencukupi.', 'High', true, { explanationCoverage: round(explanationCoverage * 100, 1) }));
  if (commonMistakeCount < config.minimumCommonMistakes) feedbackIssues.push(makeIssue('feedback', 'insufficient_common_mistakes', 'Maklum balas belum merangkumi salah faham lazim yang mencukupi.', 'High', true, { commonMistakeCount }));
  if (retryMessageCount < 3) feedbackIssues.push(makeIssue('feedback', 'insufficient_retry_support', 'Sokongan cuba semula belum mencukupi.', 'High', true, { retryMessageCount }));
  const feedbackStage = makeStage(
    'feedback',
    explanationCoverage * 45 + Math.min(30, ratio(commonMistakeCount, config.minimumCommonMistakes) * 30) + Math.min(25, ratio(retryMessageCount, 3) * 25),
    explanationCoverage >= config.minimumExplanationCoverage && commonMistakeCount >= config.minimumCommonMistakes && retryMessageCount >= 3,
    { explanationCount, explanationCoverage: round(explanationCoverage * 100, 1), commonMistakeCount, retryMessageCount },
    feedbackIssues
  );

  const wrongAnswerPatternCount = toList(pack.wrongAnswerPatterns).filter(Boolean).length;
  const followUpQuestionCount = toList(pack.followUpQuestions).filter(Boolean).length;
  const relatedTopicCount = toList(pack.relatedTopics).filter(Boolean).length;
  const remediationIssues = [];
  if (wrongAnswerPatternCount < config.minimumWrongAnswerPatterns) remediationIssues.push(makeIssue('remediation', 'insufficient_wrong_answer_patterns', 'Corak jawapan salah belum cukup untuk diagnosis pemulihan.', 'High', true, { wrongAnswerPatternCount }));
  if (followUpQuestionCount < config.minimumFollowUpQuestions) remediationIssues.push(makeIssue('remediation', 'insufficient_follow_up_questions', 'Soalan susulan pemulihan belum mencukupi.', 'High', true, { followUpQuestionCount }));
  if (!relatedTopicCount) remediationIssues.push(makeIssue('remediation', 'missing_progression_link', 'Topik belum mempunyai pautan kemahiran berkaitan atau perkembangan seterusnya.'));
  if (!adaptiveRouteAvailable) remediationIssues.push(makeIssue('remediation', 'adaptive_route_unavailable', 'Laluan adaptif pemulihan atau perkembangan tidak tersedia.', 'Critical'));
  const remediationStage = makeStage(
    'remediation',
    Math.min(35, ratio(wrongAnswerPatternCount, config.minimumWrongAnswerPatterns) * 35)
      + Math.min(35, ratio(followUpQuestionCount, config.minimumFollowUpQuestions) * 35)
      + (relatedTopicCount ? 20 : 0)
      + (adaptiveRouteAvailable ? 10 : 0),
    wrongAnswerPatternCount >= config.minimumWrongAnswerPatterns
      && followUpQuestionCount >= config.minimumFollowUpQuestions
      && relatedTopicCount > 0
      && adaptiveRouteAvailable,
    { wrongAnswerPatternCount, followUpQuestionCount, relatedTopicCount, adaptiveRouteAvailable },
    remediationIssues
  );

  const stages = {
    objective: objectiveStage,
    notes: notesStage,
    examples: examplesStage,
    guidedPractice: guidedStage,
    assessment: assessmentStage,
    feedback: feedbackStage,
    remediation: remediationStage
  };
  const issues = STAGE_ORDER.flatMap(stageId => stages[stageId].issues);
  const semantic = getSemanticEvidence(topic, pack, questions);
  const mismatchLimit = Math.max(
    config.semanticMismatchMinimum,
    Math.ceil(semantic.assessedKeywords.length * config.semanticMismatchRatio)
  );
  if (semantic.untaughtAssessedKeywords.length >= mismatchLimit) {
    issues.push(makeIssue(
      'assessment',
      'assessment_concepts_not_taught',
      'Beberapa konsep kanonik muncul dalam pentaksiran tetapi tidak ditemui dalam bahan pengajaran.',
      'High',
      true,
      { concepts: semantic.untaughtAssessedKeywords }
    ));
  }
  if (semantic.score < config.semanticReviewThreshold) {
    issues.push(makeIssue(
      'alignment',
      'low_semantic_bridge_evidence',
      'Bukti hubungan istilah antara pengajaran, pentaksiran dan maklum balas memerlukan semakan manusia.',
      'Medium',
      false,
      { semanticScore: semantic.score }
    ));
  }

  const stageScore = round(STAGE_ORDER.reduce((sum, stageId) => sum + stages[stageId].score, 0) / STAGE_ORDER.length, 1);
  const alignmentScore = round(stageScore * 0.85 + semantic.score * 0.15, 1);
  const blockers = issues.filter(issue => issue.blocker);
  const status = blockers.length
    ? 'blocked'
    : issues.some(issue => !issue.blocker) || alignmentScore < 85
      ? 'review'
      : 'aligned';

  return {
    version: LEARNING_JOURNEY_ALIGNMENT_VERSION,
    subjectId: subject.id || pack.subjectId || null,
    subject: subject.title || subject.id || pack.subjectId || '',
    topicId: topic.id || pack.topicId || null,
    topic: topic.title || pack.displayName || topic.id || '',
    status,
    structuralPassed: STAGE_ORDER.every(stageId => stages[stageId].passed) && blockers.length === 0,
    stageScore,
    semanticScore: semantic.score,
    alignmentScore,
    stages,
    semantic,
    issues,
    blockers
  };
}

export async function auditLearningJourneyBank(subjects = [], options = {}) {
  const loadKnowledge = options.loadKnowledge;
  if (typeof loadKnowledge !== 'function') {
    throw new TypeError('auditLearningJourneyBank memerlukan fungsi loadKnowledge(subjectId, topicId).');
  }

  const topicResults = [];
  for (const subject of subjects) {
    for (const topic of subject.topics || []) {
      const pack = await loadKnowledge(subject.id, topic.id);
      topicResults.push(auditTopicJourney({
        subject,
        topic,
        pack,
        adaptiveRouteAvailable: options.adaptiveRouteAvailable !== false
      }, options.config));
    }
  }

  const subjectResults = subjects.map(subject => {
    const topics = topicResults.filter(result => result.subjectId === subject.id);
    return {
      subjectId: subject.id,
      subject: subject.title,
      topics: topics.length,
      aligned: topics.filter(topic => topic.status === 'aligned').length,
      review: topics.filter(topic => topic.status === 'review').length,
      blocked: topics.filter(topic => topic.status === 'blocked').length,
      structuralPassed: topics.filter(topic => topic.structuralPassed).length,
      averageAlignmentScore: round(ratio(topics.reduce((sum, topic) => sum + topic.alignmentScore, 0), topics.length), 1),
      averageSemanticScore: round(ratio(topics.reduce((sum, topic) => sum + topic.semanticScore, 0), topics.length), 1)
    };
  });
  const blockers = topicResults.flatMap(topic => topic.blockers.map(issue => ({
    subjectId: topic.subjectId,
    topicId: topic.topicId,
    topic: topic.topic,
    ...issue
  })));
  const reviewIssues = topicResults.flatMap(topic => topic.issues
    .filter(issue => !issue.blocker)
    .map(issue => ({ subjectId: topic.subjectId, topicId: topic.topicId, topic: topic.topic, ...issue })));

  return {
    version: LEARNING_JOURNEY_ALIGNMENT_VERSION,
    generatedAt: new Date().toISOString(),
    gatePassed: blockers.length === 0,
    summary: {
      subjects: subjectResults.length,
      topics: topicResults.length,
      aligned: topicResults.filter(topic => topic.status === 'aligned').length,
      review: topicResults.filter(topic => topic.status === 'review').length,
      blocked: topicResults.filter(topic => topic.status === 'blocked').length,
      structuralPassed: topicResults.filter(topic => topic.structuralPassed).length,
      averageAlignmentScore: round(ratio(topicResults.reduce((sum, topic) => sum + topic.alignmentScore, 0), topicResults.length), 1),
      averageSemanticScore: round(ratio(topicResults.reduce((sum, topic) => sum + topic.semanticScore, 0), topicResults.length), 1),
      blockers: blockers.length,
      reviewIssues: reviewIssues.length
    },
    stageOrder: STAGE_ORDER.map(id => ({ id, label: STAGE_LABELS[id] })),
    subjects: subjectResults,
    topics: topicResults,
    blockers,
    reviewIssues
  };
}

export default {
  LEARNING_JOURNEY_ALIGNMENT_VERSION,
  DEFAULT_ALIGNMENT_CONFIG,
  auditTopicJourney,
  auditLearningJourneyBank
};
