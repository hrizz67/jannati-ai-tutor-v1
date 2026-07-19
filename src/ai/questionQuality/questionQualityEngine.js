import {
  buildAcceptedAnswers,
  countWords,
  detectMalayLanguageIssues,
  inferAnswerType,
  inferQuestionStyle,
  normalizeText,
  scoreDiversity
} from './questionQualityRules.js';
import { classifyDifficultyFromStyle, evaluateDifficulty } from './questionDifficulty.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function uniqueList(items = []) {
  return [...new Set((Array.isArray(items) ? items : []).map(item => String(item ?? '').trim()).filter(Boolean))];
}

function getText(question = {}) {
  return String(question?.q || question?.question || question?.stem || question?.context || '').trim();
}

function classifyContextCompleteness(question = {}, text = '', options = {}) {
  const value = String(text || '').trim();
  const words = countWords(value);
  const hasContext = /[:.!?]/.test(value) || /\b(berikut|di bawah|dalam ayat|dalam gambar|di sekolah|di rumah|di taman|di kelas)\b/i.test(value);
  const hasInstruction = /\b(pilih|nyatakan|cari|apakah|siapakah|tandakan|bulatkan|isi|lengkapkan|padankan|senaraikan|jelaskan|bandingkan|ramalkan|kenal pasti|terangkan)\b/i.test(value);
  const isIslamMemorisation = String(options.subjectId || '').toLowerCase() === 'islam' && /[\u0600-\u06FF]/.test(value) && /_{3,}/.test(value);

  if (!value) {
    return { score: 0, level: 'fail', issues: ['empty_text'] };
  }
  if (isIslamMemorisation) {
    return { score: 92, level: 'pass', issues: [] };
  }
  if (words < 3) {
    return { score: 0, level: 'fail', issues: ['too_short'] };
  }
  if (hasInstruction && words <= 4 && !hasContext) {
    return { score: 15, level: 'fail', issues: ['instruction_without_context'] };
  }
  if (hasInstruction && words <= 6 && !hasContext) {
    return { score: 35, level: 'warn', issues: ['insufficient_context'] };
  }
  if (!hasContext && words <= 6) {
    return { score: 45, level: 'warn', issues: ['minimal_context'] };
  }
  if (question.answerType === 'open_answer' || question.qip?.metadata?.answerType === 'open_answer') {
    return { score: 85, level: 'pass', issues: [] };
  }
  return { score: 100, level: 'pass', issues: [] };
}

function classifyLanguageQuality(question = {}, text = '') {
  const issues = detectMalayLanguageIssues(text);
  let score = 100;
  for (const issue of issues) {
    switch (issue) {
      case 'too_short':
        score -= 18;
        break;
      case 'no_context':
        score -= 22;
        break;
      case 'awkward_phrase':
        score -= 20;
        break;
      case 'generic_template':
        score -= 14;
        break;
      case 'repeated_word':
        score -= 10;
        break;
      case 'extra_spaces':
        score -= 5;
        break;
      case 'capitalisation':
        score -= 4;
        break;
      default:
        score -= 6;
        break;
    }
  }
  if (countWords(text) < 5 && /[.!?]/.test(text) === false) score -= 8;
  if (/^pilih\s+[a-z\s]+\.?$/i.test(text) && !/dalam ayat|dalam gambar|berikut|di bawah/i.test(text)) {
    score -= 20;
    issues.push('missing_context');
  }
  return {
    score: Math.max(0, Math.min(100, score)),
    issues: uniqueList(issues)
  };
}

function classifyAnswerQuality(question = {}) {
  const acceptedAnswers = buildAcceptedAnswers(question);
  const answer = String(question.answer ?? '').trim();
  const answerType = inferAnswerType(question);
  const issues = [];

  if (answerType === 'open_answer') {
    return {
      score: acceptedAnswers.length > 0 || answer ? 80 : 0,
      issues: acceptedAnswers.length > 0 || answer ? [] : ['missing_answer'],
      answerType,
      acceptedAnswers
    };
  }

  if (!answer && acceptedAnswers.length === 0) {
    issues.push('missing_answer');
  }

  if (acceptedAnswers.length > 1 && answerType !== 'multiple_answer') {
    issues.push('multiple_answers_detected');
  }

  if (!acceptedAnswers.includes(answer) && acceptedAnswers.length > 0) {
    issues.push('answer_not_in_accepted_list');
  }

  if (acceptedAnswers.length > 1) {
    return {
      score: 100,
      issues,
      answerType: 'multiple_answer',
      acceptedAnswers
    };
  }

  if (answer) {
    return {
      score: 100,
      issues,
      answerType: answerType || 'single_answer',
      acceptedAnswers
    };
  }

  return {
    score: 20,
    issues,
    answerType: answerType || 'single_answer',
    acceptedAnswers
  };
}

function classifyDiversityQuality(question = {}, context = {}) {
  const questionStyle = inferQuestionStyle(question, getText(question));
  const diversityScore = scoreDiversity(question, {
    ...context,
    text: getText(question),
    recentStyles: context.recentStyles || [],
    recentTemplates: context.recentTemplates || [],
    recentQuestionIds: context.recentQuestionIds || []
  });
  const issues = [];
  if (diversityScore < 60) issues.push('template_repetition');
  if (diversityScore < 40) issues.push('style_repetition');
  return {
    score: diversityScore,
    issues,
    questionStyle
  };
}

export function evaluateQuestionQuality(question = {}, options = {}) {
  const text = getText(question);
  const contextResult = classifyContextCompleteness(question, text, options);
  const languageResult = classifyLanguageQuality(question, text);
  const answerResult = classifyAnswerQuality(question);
  const difficultyResult = evaluateDifficulty(question, { text });
  const diversityResult = classifyDiversityQuality(question, options);

  const qualityScore = Math.round(
    contextResult.score * 0.25 +
    languageResult.score * 0.25 +
    answerResult.score * 0.25 +
    difficultyResult.alignmentScore * 0.15 +
    diversityResult.score * 0.10
  );

  const issues = uniqueList([
    ...contextResult.issues,
    ...languageResult.issues,
    ...answerResult.issues,
    ...difficultyResult.alignmentScore < 60 ? ['difficulty_mismatch'] : [],
    ...diversityResult.issues
  ]);

  const qualityStatus = qualityScore >= 90
    ? 'excellent'
    : qualityScore >= 75
      ? 'good'
      : qualityScore >= 60
        ? 'needs_improvement'
        : 'reject';

  const shouldReject = qualityStatus === 'reject' || contextResult.level === 'fail' || answerResult.score < 50;
  const shouldWarn = !shouldReject && (qualityStatus === 'needs_improvement' || issues.length > 0);
  const questionStyle = diversityResult.questionStyle || inferQuestionStyle(question, text);
  const qualityDifficulty = difficultyResult.qualityDifficulty || classifyDifficultyFromStyle(questionStyle, question);

  const enhanced = {
    ...question,
    answerType: answerResult.answerType,
    acceptedAnswers: answerResult.acceptedAnswers,
    questionStyle,
    qualityDifficulty,
    difficulty: question.difficulty || qualityDifficulty,
    qualityScore,
    qualityStatus,
    qualityIssues: issues,
    quality: {
      score: qualityScore,
      status: qualityStatus,
      issues,
      contextScore: contextResult.score,
      languageScore: languageResult.score,
      answerScore: answerResult.score,
      difficultyScore: difficultyResult.alignmentScore,
      diversityScore: diversityResult.score
    }
  };

  return {
    question: enhanced,
    qualityScore,
    qualityStatus,
    qualityIssues: issues,
    contextScore: contextResult.score,
    languageScore: languageResult.score,
    answerScore: answerResult.score,
    difficultyScore: difficultyResult.alignmentScore,
    diversityScore: diversityResult.score,
    answerType: answerResult.answerType,
    acceptedAnswers: answerResult.acceptedAnswers,
    questionStyle,
    qualityDifficulty,
    shouldReject,
    shouldWarn
  };
}

function compareQuality(left = {}, right = {}) {
  if (right.qualityScore !== left.qualityScore) return right.qualityScore - left.qualityScore;
  const statusRank = { excellent: 3, good: 2, needs_improvement: 1, reject: 0 };
  if ((statusRank[right.qualityStatus] || 0) !== (statusRank[left.qualityStatus] || 0)) {
    return (statusRank[right.qualityStatus] || 0) - (statusRank[left.qualityStatus] || 0);
  }
  const rightPriority = toNumber(right.smartQuestion?.priorityScore ?? right.adaptiveQuestion?.priorityScore ?? right.qip?.priorityScore, 0);
  const leftPriority = toNumber(left.smartQuestion?.priorityScore ?? left.adaptiveQuestion?.priorityScore ?? left.qip?.priorityScore, 0);
  if (rightPriority !== leftPriority) return rightPriority - leftPriority;
  if (right.difficultyScore !== left.difficultyScore) return right.difficultyScore - left.difficultyScore;
  if (right.diversityScore !== left.diversityScore) return right.diversityScore - left.diversityScore;
  return String(left.id || '').localeCompare(String(right.id || ''));
}

function getRecentList(options = {}, key, fallback = []) {
  const value = options[key];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return Array.from(value);
  return fallback;
}

export function rankQuestionQuality(candidates = [], options = {}) {
  const recentStyles = getRecentList(options, 'recentStyles', []);
  const recentTemplates = getRecentList(options, 'recentTemplates', []);
  const recentQuestionIds = getRecentList(options, 'recentQuestionIds', []);
  const evaluated = (Array.isArray(candidates) ? candidates : []).map((question, index) => {
    const result = evaluateQuestionQuality(question, {
      ...options,
      recentStyles,
      recentTemplates,
      recentQuestionIds,
      index
    });
    return {
      ...result.question,
      qualityScore: result.qualityScore,
      qualityStatus: result.qualityStatus,
      qualityIssues: result.qualityIssues,
      quality: {
        ...result.question.quality,
        score: result.qualityScore,
        status: result.qualityStatus,
        issues: result.qualityIssues
      }
    };
  });
  return evaluated.sort(compareQuality);
}

export function selectQualityQuestions(candidates = [], options = {}) {
  const count = Math.max(0, Number(options.count || candidates.length) || candidates.length);
  const ranked = rankQuestionQuality(candidates, options);
  const recentQuestionIdSet = new Set(
    (Array.isArray(options.recentQuestionIds) ? options.recentQuestionIds : [])
      .map(value => String(value ?? '').trim())
      .filter(Boolean)
  );
  const preferredRanked = recentQuestionIdSet.size
    ? ranked.filter(question => !recentQuestionIdSet.has(String(question.id || question.questionId || '').trim()))
    : ranked;
  const selectionRanked = preferredRanked.length ? preferredRanked : ranked;
  const selected = [];
  const rejected = [];
  const warnings = [];
  const recentStyles = Array.isArray(options.recentStyles) ? [...options.recentStyles] : [];
  const recentTemplates = Array.isArray(options.recentTemplates) ? [...options.recentTemplates] : [];
  const recentQuestionIds = Array.isArray(options.recentQuestionIds) ? [...options.recentQuestionIds] : [];

  for (const question of selectionRanked) {
    const quality = question.quality || {};
    const templateId = String(question.qip?.metadata?.templateId || question.templateId || '');
    const style = String(question.questionStyle || '');
    const item = {
      ...question,
      qip: {
        ...(question.qip || {}),
        quality: {
          score: quality.score ?? question.qualityScore ?? 0,
          status: quality.status ?? question.qualityStatus ?? 'good',
          issues: Array.isArray(quality.issues) ? quality.issues : [],
          answerType: question.answerType,
          acceptedAnswers: question.acceptedAnswers,
          questionStyle: question.questionStyle,
          qualityDifficulty: question.qualityDifficulty
        }
      }
    };

    if ((quality.status || question.qualityStatus) === 'reject') {
      rejected.push({ ...item, reason: quality.issues || [] });
      continue;
    }

    if ((quality.status || question.qualityStatus) === 'needs_improvement') {
      warnings.push({ ...item, reason: quality.issues || [] });
    }

    selected.push(item);
    if (style) recentStyles.push(style);
    if (templateId) recentTemplates.push(templateId);
    recentQuestionIds.push(String(question.id || question.questionId || ''));
    if (selected.length >= count) break;
  }

  if (selected.length < count) {
    for (const question of ranked) {
      if (selected.length >= count) break;
      if (selected.some(item => item.id === question.id)) continue;
      const fallbackItem = {
        ...question,
        qip: {
          ...(question.qip || {}),
          quality: {
            score: question.qualityScore ?? 0,
            status: question.qualityStatus ?? 'needs_improvement',
            issues: Array.isArray(question.qualityIssues) ? question.qualityIssues : [],
            answerType: question.answerType,
            acceptedAnswers: question.acceptedAnswers,
            questionStyle: question.questionStyle,
            qualityDifficulty: question.qualityDifficulty
          },
          qualityFallback: true
        }
      };
      selected.push(fallbackItem);
    }
  }

  return {
    questions: selected,
    ranked,
    rejected,
    warnings,
    fallbackUsed: selected.some(item => item.qip?.qualityFallback === true)
  };
}

export function improveQuestionQuality(question = {}, options = {}) {
  return evaluateQuestionQuality(question, options).question;
}

export default {
  evaluateQuestionQuality,
  improveQuestionQuality,
  rankQuestionQuality,
  selectQualityQuestions
};
