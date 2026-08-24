import {
  deriveChoiceInteraction,
  validateInteractiveQuestionConfig
} from '../../utils/interactiveQuestion.js';

export const INTERACTIVE_SUITABILITY_VERSION = 1;

export const INTERACTIVE_SUITABILITY_CATEGORIES = Object.freeze([
  'reviewed_interactive',
  'auto_safe',
  'teacher_review',
  'keep_standard'
]);

export const INTERACTIVE_MODE_TARGETS = Object.freeze({
  guidedLearning: Object.freeze({ minimum: 70, maximum: 80 }),
  practice: Object.freeze({ minimum: 50, maximum: 65 }),
  formativeAssessment: Object.freeze({ minimum: 30, maximum: 45 }),
  examSimulation: Object.freeze({ minimum: 0, maximum: 15 })
});

function normalized(value) {
  return String(value || '').trim().toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ');
}

function countBy(rows, keySelector) {
  return rows.reduce((counts, row) => {
    const key = keySelector(row) || 'unspecified';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function answerWordCount(question = {}) {
  return normalized(question.answer).split(/\s+/).filter(Boolean).length;
}

function hasBlank(question = {}) {
  return /_{3,}|\.{3,}|…|\b(?:tempat kosong|blank)\b/i.test(String(question.q || question.question || ''));
}

function hasOpenResponseCue(question = {}) {
  return /\b(?:jelaskan|huraikan|terangkan|berikan sebab|mengapakah|mengapa|bina ayat|tulis ayat|write a sentence|explain|why)\b/i
    .test(String(question.q || question.question || ''));
}

function recommendByContext(question = {}, { subjectId = '', topicId = '' } = {}) {
  const type = normalized(question.questionType || question.type);
  const context = `${normalized(topicId)} ${normalized(question.skill)} ${normalized(question.q || question.question)}`;

  if (type === 'ordering' || /\b(?:susun|turutan|urutan|langkah)\b/i.test(context)) return 'ordering';
  if (type === 'matching' || /\b(?:padan|matching)\b/i.test(context)) return 'matching';
  if (type === 'multiple_response') return 'multiSelect';

  if (subjectId === 'math') {
    if (/\b(?:masa|waktu|jam|minit)\b/i.test(context)) return 'clock';
    if (/\b(?:wang|ringgit|sen|harga|baki)\b/i.test(context)) return 'money';
    if (/\b(?:panjang|ukur|pembaris|sentimeter|meter)\b/i.test(context)) return 'measurement';
    if (/\b(?:bentuk|sisi|bucu|2d|3d)\b/i.test(context)) return 'imageChoice';
    return 'visualMath';
  }

  if (subjectId === 'sains') {
    if (/\b(?:bahagian|anggota|tumbuhan|deria|rajah)\b/i.test(context)) return 'hotspot';
    return 'matching';
  }

  if (subjectId === 'pj' || subjectId === 'pk') return 'choice';
  if (hasBlank(question) || ['fill_blank', 'short_answer'].includes(type)) return 'fillBlank';
  return answerWordCount(question) <= 4 ? 'imageChoice' : 'matching';
}

function result(question, context, values) {
  return Object.freeze({
    version: INTERACTIVE_SUITABILITY_VERSION,
    questionId: String(question.id || ''),
    subjectId: String(context.subjectId || ''),
    topicId: String(context.topicId || ''),
    questionType: String(question.questionType || question.type || 'unspecified'),
    ...values
  });
}

export function classifyInteractiveSuitability(question = {}, context = {}) {
  if (question.interaction) {
    const issues = validateInteractiveQuestionConfig(question.interaction);
    if (issues.length === 0) {
      return result(question, context, {
        category: 'reviewed_interactive',
        recommendedType: question.interaction.type,
        confidence: 100,
        priority: 0,
        reasonCodes: ['human_reviewed_interaction']
      });
    }
    return result(question, context, {
      category: 'teacher_review',
      recommendedType: String(question.interaction.type || recommendByContext(question, context)),
      confidence: 0,
      priority: 100,
      reasonCodes: ['invalid_authored_interaction', ...issues]
    });
  }

  const derivedChoice = deriveChoiceInteraction(question);
  if (derivedChoice) {
    return result(question, context, {
      category: 'auto_safe',
      recommendedType: 'choice',
      confidence: 100,
      priority: 0,
      reasonCodes: ['reviewed_options_and_single_canonical_answer']
    });
  }

  const questionType = normalized(question.questionType || question.type);
  const recommendedType = recommendByContext(question, context);
  if (['ordering', 'matching', 'multiple_response', 'fill_blank'].includes(questionType) || hasBlank(question)) {
    return result(question, context, {
      category: 'teacher_review',
      recommendedType,
      confidence: questionType === 'fill_blank' || hasBlank(question) ? 80 : 72,
      priority: questionType === 'fill_blank' || hasBlank(question) ? 90 : 80,
      reasonCodes: [questionType === 'fill_blank' || hasBlank(question) ? 'needs_reviewed_distractors' : 'needs_authored_interaction_mapping']
    });
  }

  if (question.rubric || Number(question.marks) > 1 || questionType === 'structured' || hasOpenResponseCue(question)) {
    return result(question, context, {
      category: 'keep_standard',
      recommendedType: 'textEntry',
      confidence: 95,
      priority: 0,
      reasonCodes: [question.rubric ? 'rubric_assessed_response' : 'constructed_or_reasoned_response']
    });
  }

  if (question.options) {
    return result(question, context, {
      category: 'teacher_review',
      recommendedType: 'choice',
      confidence: 25,
      priority: 100,
      reasonCodes: ['options_not_safe_for_automatic_conversion']
    });
  }

  if (answerWordCount(question) <= 8) {
    return result(question, context, {
      category: 'teacher_review',
      recommendedType,
      confidence: 60,
      priority: 55,
      reasonCodes: ['short_response_needs_authored_choices_or_visual']
    });
  }

  return result(question, context, {
    category: 'keep_standard',
    recommendedType: 'textEntry',
    confidence: 85,
    priority: 0,
    reasonCodes: ['extended_response_preserves_authentic_evidence']
  });
}

function summarizeRows(rows) {
  return {
    total: rows.length,
    categories: countBy(rows, row => row.category),
    recommendedTypes: countBy(rows, row => row.recommendedType)
  };
}

export function buildInteractiveSuitabilityReport(subjects = []) {
  const questionClassifications = [];
  const topicBreakdown = [];

  for (const subject of subjects) {
    for (const topic of subject.topics || []) {
      const rows = (topic.questions || []).map(question => classifyInteractiveSuitability(question, {
        subjectId: subject.id,
        topicId: topic.id
      }));
      questionClassifications.push(...rows);
      topicBreakdown.push({
        subjectId: subject.id,
        topicId: topic.id,
        topicTitle: topic.title,
        ...summarizeRows(rows)
      });
    }
  }

  const subjectBreakdown = subjects.map(subject => {
    const rows = questionClassifications.filter(row => row.subjectId === subject.id);
    return {
      subjectId: subject.id,
      subjectTitle: subject.title,
      topics: (subject.topics || []).length,
      ...summarizeRows(rows)
    };
  });
  const summary = summarizeRows(questionClassifications);
  const teacherReviewQueue = questionClassifications
    .filter(row => row.category === 'teacher_review')
    .sort((left, right) => right.priority - left.priority
      || right.confidence - left.confidence
      || left.subjectId.localeCompare(right.subjectId)
      || left.questionId.localeCompare(right.questionId));

  return {
    schemaVersion: INTERACTIVE_SUITABILITY_VERSION,
    policy: {
      principle: 'Gunakan interaksi hanya apabila ia menguatkan evidens pembelajaran tanpa memberi petunjuk jawapan.',
      modeTargets: INTERACTIVE_MODE_TARGETS,
      automaticConversion: 'Pilihan jawapan sedia ada hanya ditukar apabila unik dan tepat satu pilihan sepadan dengan jawapan diterima.',
      humanReview: 'Distraktor, visual, audio, hotspot, susunan dan padanan baharu memerlukan semakan guru sebelum diterbitkan.',
      standardProtection: 'Respons berstruktur, KBAT dan rubrik kekal sebagai input standard.'
    },
    summary: {
      ...summary,
      subjects: subjects.length,
      topics: topicBreakdown.length,
      allQuestionsClassified: questionClassifications.every(row => INTERACTIVE_SUITABILITY_CATEGORIES.includes(row.category)),
      unsafeAutomaticConversions: questionClassifications.filter(row => row.category === 'auto_safe' && row.confidence !== 100).length
    },
    subjectBreakdown,
    topicBreakdown,
    teacherReviewQueue,
    questionClassifications
  };
}

export function compactInteractiveSuitabilityReport(report = {}) {
  const {
    questionClassifications = [],
    teacherReviewQueue = [],
    ...summaryReport
  } = report;
  return {
    ...summaryReport,
    teacherReviewQueue: teacherReviewQueue.slice(0, 200),
    sampleClassifications: {
      reviewedInteractive: questionClassifications.filter(row => row.category === 'reviewed_interactive').slice(0, 24),
      automaticSafe: questionClassifications.filter(row => row.category === 'auto_safe').slice(0, 40),
      keepStandard: questionClassifications.filter(row => row.category === 'keep_standard').slice(0, 40)
    }
  };
}
