import { buildCoachResponse } from './coach/v3/coachController.js';
import { rankStrongTopics, rankWeakTopics } from './adaptive/weakTopicEngine.js';
import { buildRecommendation } from './recommendationEngine.js';
import { clampPercent, formatSubjectName, formatTopicName, getStudentDisplayName } from '../utils/displayFormatter.js';
import { sanitizeAiText } from './learningCopy.js';

const DEFAULT_FALLBACK = 'Saya belum dapat memproses soalan itu sekarang. Cuba tanya dengan ayat yang lebih ringkas.';

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return normalizeText(value[0], fallback);
  if (typeof value === 'object') {
    if (typeof value.text === 'string' || typeof value.text === 'number') return sanitizeAiText(String(value.text));
    if (typeof value.label === 'string' || typeof value.label === 'number') return sanitizeAiText(String(value.label));
    if (typeof value.value === 'string' || typeof value.value === 'number') return sanitizeAiText(String(value.value));
    return fallback;
  }
  const text = sanitizeAiText(String(value).trim());
  return text || fallback;
}

function normalizeList(value) {
  if (value === null || value === undefined || value === '') return [];
  const items = Array.isArray(value) ? value : [value];
  const result = [];
  const seen = new Set();
  for (const item of items.flat(Infinity)) {
    const text = normalizeText(item, '');
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function getQuestionText(question = {}) {
  return normalizeText(
    question?.q ||
    question?.question ||
    question?.stem ||
    question?.text ||
    question?.prompt ||
    ''
  );
}

function getCorrectAnswer(question = {}, fallback = '') {
  return normalizeText(
    question?.answer ||
    question?.correctAnswer ||
    question?.acceptedAnswers?.[0] ||
    fallback ||
    ''
  );
}

function getSubjectContext(subject = {}, subjectId = '') {
  const resolvedId = normalizeText(subject?.id || subjectId, '');
  return {
    id: resolvedId,
    title: normalizeText(subject?.title || subject?.name || formatSubjectName(resolvedId), resolvedId),
    short: normalizeText(subject?.short || subject?.code || resolvedId.toUpperCase(), resolvedId.toUpperCase()),
    topics: Array.isArray(subject?.topics) ? subject.topics : []
  };
}

function getTopicContext(topic = {}, topicId = '') {
  const resolvedId = normalizeText(topic?.id || topicId, '');
  return {
    id: resolvedId,
    title: normalizeText(topic?.title || topic?.name || formatTopicName(resolvedId), resolvedId),
    note: normalizeText(topic?.note || topic?.description || '', ''),
    questions: Array.isArray(topic?.questions) ? topic.questions : []
  };
}

function inferIntent({ intent = '', prompt = '', isCorrect, question = {} } = {}) {
  const direct = normalizeText(intent, '').toLowerCase();
  if (direct) return direct;

  const text = normalizeText(prompt, '').toLowerCase();
  if (/topik\s+lemah|weak_topic|lemah/.test(text)) return 'weak_topic';
  if (/ulang\s*kaji|revision_plan|cadangan ulang kaji|cadangan/.test(text)) return 'revision_plan';
  if (/uasa|summary/.test(text)) return 'uasa_summary';
  if (/petunjuk|hint/.test(text)) return 'hint';
  if (/terangkan|jelaskan|soalan ini|question help/.test(text)) return 'question_help';
  if (/salah/.test(text)) return 'wrong_answer_coaching';
  if (/betul|correct/.test(text)) return 'correct_answer_reinforcement';
  if (typeof isCorrect === 'boolean') return isCorrect ? 'correct_answer_reinforcement' : 'wrong_answer_coaching';
  if (getQuestionText(question)) return 'question_help';
  return 'general';
}

function formatTopicList(topics = [], limit = 3) {
  return normalizeList(topics)
    .slice(0, limit)
    .map(item => {
      if (typeof item === 'object' && item) {
        const subjectId = item.subjectId || item.subject || '';
        const topicId = item.topicId || item.topic || item.id || '';
        const title = normalizeText(item.title || item.name || formatTopicName(topicId), topicId);
        const subjectLabel = normalizeText(item.subjectTitle || item.subjectLabel || formatSubjectName(subjectId), subjectId);
        const mastery = Number.isFinite(Number(item.mastery)) ? clampPercent(Number(item.mastery)) : null;
        return `${subjectLabel} — ${title}${mastery === null ? '' : ` (${mastery}%)`}`;
      }
      return normalizeText(item, '');
    })
    .filter(Boolean);
}

function pickBestWeakTopic(weakTopics = [], profile = {}, subject = {}) {
  const fallbackSubjectId = subject?.id || '';
  const topByRank = Array.isArray(weakTopics) ? weakTopics.filter(Boolean) : [];
  if (topByRank.length) return topByRank[0];
  const ranked = rankWeakTopics(profile || {}, {
    subjectId: fallbackSubjectId || undefined,
    limit: 1,
    includeLowConfidence: true
  });
  return ranked[0] || null;
}

function pickBestStrongTopic(strongTopics = [], profile = {}, subject = {}) {
  const fallbackSubjectId = subject?.id || '';
  const topByRank = Array.isArray(strongTopics) ? strongTopics.filter(Boolean) : [];
  if (topByRank.length) return topByRank[0];
  const ranked = rankStrongTopics(profile || {}, {
    subjectId: fallbackSubjectId || undefined,
    limit: 1
  });
  return ranked[0] || null;
}

function buildUasaSummary(profile = {}, studyPlan = null, readiness = null) {
  const history = Array.isArray(profile?.uasaHistory) ? profile.uasaHistory.filter(Boolean) : [];
  const latest = history[0] || null;
  const best = history.reduce((acc, item) => Math.max(acc, Number(item?.score) || 0), 0);
  return {
    latestScore: Number(latest?.score) || 0,
    bestScore: best,
    attempts: history.length,
    readinessLevel: readiness?.level || 'needs_support',
    readinessMessage: readiness?.message || 'Belum cukup data UASA.',
    studyNote: normalizeText(studyPlan?.notes || '', '')
  };
}

function buildSuggestionList(intent, context = {}) {
  const generic = ['Cuba tanya dengan soalan yang lebih khusus.', 'Klik petunjuk jika perlukan bantuan.', 'Semak jawapan dan cuba lagi.'];
  switch (intent) {
    case 'weak_topic':
      return [
        'Latih topik lemah ini sekali lagi.',
        'Cuba 10 soalan ulang kaji.',
        'Minta penjelasan langkah demi langkah.'
      ];
    case 'revision_plan':
      return [
        'Ikut cadangan ulang kaji hari ini.',
        'Mulakan dengan topik paling lemah.',
        'Tamatkan dengan satu sesi latihan ringkas.'
      ];
    case 'uasa_summary':
      return [
        'Fokus pada topik yang belum stabil.',
        'Buat Simulator UASA selepas ulang kaji.',
        'Semak sejarah UASA untuk lihat perkembangan.'
      ];
    case 'hint':
      return [
        'Cari kata kunci penting dalam soalan.',
        'Baca pilihan jawapan satu demi satu.',
        'Bandingkan dengan jawapan yang kamu fikirkan.'
      ];
    case 'wrong_answer_coaching':
      return [
        'Semak semula langkah yang kamu pilih.',
        'Lihat sama ada soalan meminta maksud atau contoh.',
        'Baca petunjuk dahulu, kemudian cuba lagi.'
      ];
    case 'correct_answer_reinforcement':
      return [
        'Teruskan ke soalan seterusnya.',
        'Cuba soalan yang sedikit lebih mencabar.',
        'Bina keyakinan dengan satu latihan lagi.'
      ];
    case 'question_help':
      return [
        'Fokus pada kata kunci soalan ini.',
        'Bandingkan soalan dengan jawapan kamu.',
        'Gunakan penjelasan mudah untuk faham maksudnya.'
      ];
    default:
      return generic;
  }
}

function buildContextualText(intent, {
  studentName,
  subject,
  topic,
  question,
  answer,
  isCorrect,
  attemptCount = 0,
  hintsUsed = 0,
  coachResponse,
  weakTopics,
  strongTopics,
  studyPlan,
  readiness,
  adaptiveRecommendation,
  profile
} = {}) {
  const subjectLabel = subject?.title || formatSubjectName(subject?.id);
  const topicLabel = topic?.title || formatTopicName(topic?.id);
  const questionText = getQuestionText(question);
  const correctAnswer = getCorrectAnswer(question, answer);
  const explanation = normalizeText(coachResponse?.explanation?.explanation || coachResponse?.explanation || '', '');
  const simpleExplanation = normalizeText(coachResponse?.explanation?.simpleExplanation || coachResponse?.simpleExplanation || '', '');
  const hint = normalizeText(coachResponse?.hint?.hint || coachResponse?.hint || '', '');
  const praise = normalizeText(coachResponse?.praise?.praise || coachResponse?.praise || '', '');
  const learningTip = normalizeText(coachResponse?.learningTip || coachResponse?.tips?.spotlight || '', '');
  const steps = normalizeList(coachResponse?.steps || []);
  const weakTopic = pickBestWeakTopic(weakTopics, profile, subject);
  const strongTopic = pickBestStrongTopic(strongTopics, profile, subject);
  const uasaSummary = buildUasaSummary(profile, studyPlan, readiness);
  const recommendationReason = normalizeText(adaptiveRecommendation?.reason || studyPlan?.notes || readiness?.message || '', '');

  switch (intent) {
    case 'weak_topic': {
      const weakText = weakTopic
        ? `${formatSubjectName(weakTopic.subjectId)} — ${formatTopicName(weakTopic.topicId)}${Number.isFinite(Number(weakTopic.mastery)) ? ` (${clampPercent(weakTopic.mastery)}%)` : ''}`
        : `${subjectLabel} ${topicLabel}`.trim();
      const detail = weakTopic?.reason || weakTopic?.message || recommendationReason || 'Topik ini masih memerlukan lebih banyak latihan.';
      return `${studentName ? `${studentName}, ` : ''}topik lemah kamu ialah ${weakText}. ${detail}`;
    }
    case 'revision_plan': {
      const planText = recommendationReason || 'Ikut pelan ulang kaji yang seimbang hari ini.';
      const focusText = buildRecommendation(profile || {}, subject || {});
      const focus = focusText?.recommendedTitle || focusText?.recommendedTopicId;
      return `${studentName ? `${studentName}, ` : ''}cadangan ulang kaji: ${planText}${focus ? ` Fokus pada ${focus}.` : ''}`;
    }
    case 'uasa_summary': {
      return `${studentName ? `${studentName}, ` : ''}Ringkasan UASA kamu: markah terkini ${uasaSummary.latestScore}%, terbaik ${uasaSummary.bestScore}%, dan ${uasaSummary.attempts} rekod telah disimpan. ${uasaSummary.readinessMessage}`;
    }
    case 'hint': {
      const firstStep = steps[0] ? ` Langkah pertama: ${steps[0]}.` : '';
      return `${studentName ? `${studentName}, ` : ''}petunjuk untuk ${subjectLabel}${topicLabel ? `, ${topicLabel}` : ''}: ${hint || 'Baca soalan perlahan-lahan dan cari kata kunci.'}${firstStep}`;
    }
    case 'question_help': {
      const parts = [
        studentName ? `${studentName}, mari kita lihat soalan ini.` : 'Mari kita lihat soalan ini.',
        questionText ? `Soalan: ${questionText}.` : '',
        explanation || simpleExplanation || 'Jawapan ini sesuai dengan soalan ini.',
        hint || '',
        learningTip || '',
        attemptCount > 1 ? `Ini percubaan ke-${attemptCount}.` : '',
        hintsUsed > 0 ? `Petunjuk telah digunakan ${hintsUsed} kali.` : '',
        steps[0] ? `Langkah awal: ${steps[0]}.` : ''
      ].filter(Boolean);
      return parts.join(' ');
    }
    case 'wrong_answer_coaching': {
      const parts = [
        studentName ? `${studentName}, jawapan itu belum tepat.` : 'Jawapan itu belum tepat.',
        explanation || simpleExplanation || 'Cuba semak semula kata kunci pada soalan.',
        hint || 'Gunakan petunjuk jika perlu.',
        attemptCount > 1 ? `Ini percubaan ke-${attemptCount}.` : '',
        correctAnswer ? 'Cuba cari jawapan sendiri dahulu sebelum melihat jawapan tepat.' : ''
      ].filter(Boolean);
      return parts.join(' ');
    }
    case 'correct_answer_reinforcement': {
      const parts = [
        studentName ? `Bagus, ${studentName}!` : 'Bagus!',
        praise || 'Teruskan usaha kamu.',
        explanation || simpleExplanation || (correctAnswer ? `Jawapan yang betul ialah ${correctAnswer}.` : 'Kamu sudah menjawab dengan tepat.'),
        strongTopic ? `Kekuatan kamu: ${formatSubjectName(strongTopic.subjectId)} — ${formatTopicName(strongTopic.topicId)}.` : ''
      ].filter(Boolean);
      return parts.join(' ');
    }
    default: {
      const weakText = weakTopic
        ? `Fokus pada ${formatSubjectName(weakTopic.subjectId)} — ${formatTopicName(weakTopic.topicId)}.`
        : '';
      const strongText = strongTopic
        ? `Kekuatan kamu pula ialah ${formatSubjectName(strongTopic.subjectId)} — ${formatTopicName(strongTopic.topicId)}.`
        : '';
      const parts = [
        studentName ? `Hai ${studentName}!` : 'Hai!',
        subjectLabel ? `Kita sedang belajar ${subjectLabel}${topicLabel ? `, topik ${topicLabel}` : ''}.` : 'Saya sedia membantu belajar hari ini.',
        explanation || simpleExplanation || learningTip || 'Saya boleh terangkan, beri petunjuk, atau cadangkan ulang kaji.',
        weakText,
        strongText,
        recommendationReason ? `Cadangan hari ini: ${recommendationReason}` : ''
      ].filter(Boolean);
      return parts.join(' ');
    }
  }
}

export async function getTutorResponse(options = {}) {
  const {
    student = null,
    profile = null,
    subject = null,
    subjectId = '',
    topic = null,
    topicId = '',
    question = null,
    studentAnswer = '',
    correctAnswer = '',
    isCorrect = null,
    attemptCount = 0,
    hintsUsed = 0,
    weakTopics = [],
    strongTopics = [],
    uasaSummary = null,
    adaptiveRecommendation = null,
    prompt = '',
    intent = '',
    locale = 'ms-MY',
    history = [],
    adaptiveProfile = null,
    studyPlan = null,
    readiness = null,
    learningObservation = null,
    predictionProfile = null,
    gamificationProfile = null
  } = options;

  const studentProfile = student || profile || adaptiveProfile || {};
  const subjectContext = getSubjectContext(subject || {}, subjectId);
  const topicContext = getTopicContext(topic || {}, topicId);
  const studentName = getStudentDisplayName(studentProfile, '');
  const resolvedIntent = inferIntent({ intent, prompt, isCorrect, question });
  const questionText = getQuestionText(question || {});
  const answerText = normalizeText(studentAnswer, '');
  const expectedAnswer = getCorrectAnswer(question || {}, correctAnswer);
  const hasQuestionContext = Boolean(questionText || topicContext.id || subjectContext.id);

  let coachResponse = null;
  let source = 'fallback';

  if (hasQuestionContext && (subjectContext.id || topicContext.id)) {
    try {
      coachResponse = await buildCoachResponse({
        subjectId: subjectContext.id,
        topicId: topicContext.id,
        question: question || {},
        result: {
          correct: typeof isCorrect === 'boolean' ? isCorrect : Boolean(answerText && expectedAnswer && answerText === expectedAnswer),
          status: typeof isCorrect === 'boolean'
            ? (isCorrect ? 'correct' : 'wrong')
            : undefined,
          explanation: ''
        },
        userAnswer: answerText,
        context: {
          studentName,
          subject: subjectContext,
          topic: topicContext,
          prompt: normalizeText(prompt, ''),
          intent: resolvedIntent,
          locale,
          historyCount: Array.isArray(history) ? history.length : 0,
          attemptCount: Number(attemptCount) || 0,
          hintsUsed: Number(hintsUsed) || 0,
          level: Number(studentProfile.level || adaptiveProfile?.level || 0),
          xp: Number(studentProfile.xp || adaptiveProfile?.xp || 0),
          streak: Number(studentProfile.streak || adaptiveProfile?.streak || 0),
          learningObservation,
          predictionProfile,
          gamificationProfile
        }
      });
      if (coachResponse?.ready) {
        source = 'coach-v3';
      } else {
        coachResponse = null;
        source = 'fallback';
      }
    } catch (error) {
      coachResponse = null;
      source = 'fallback';
    }
  }
  const fallbackUsed = source !== 'coach-v3';

  const text = buildContextualText(resolvedIntent, {
    studentName,
    subject: subjectContext,
    topic: topicContext,
    question: question || {},
    answer: expectedAnswer || answerText,
    isCorrect,
    attemptCount: Number(attemptCount) || 0,
    hintsUsed: Number(hintsUsed) || 0,
    coachResponse,
    weakTopics: Array.isArray(weakTopics) && weakTopics.length ? weakTopics : rankWeakTopics(studentProfile || {}, {
      subjectId: subjectContext.id || undefined,
      limit: 5,
      includeLowConfidence: true
    }),
    strongTopics: Array.isArray(strongTopics) && strongTopics.length ? strongTopics : rankStrongTopics(studentProfile || {}, {
      subjectId: subjectContext.id || undefined,
      limit: 5
    }),
    studyPlan,
    readiness,
    adaptiveRecommendation,
    profile: studentProfile
  });

  const suggestions = buildSuggestionList(resolvedIntent, {
    subject: subjectContext,
    topic: topicContext,
    question: question || {}
  });

  const confidence = fallbackUsed
    ? 45
    : hasQuestionContext
      ? 92
      : resolvedIntent === 'general'
        ? 82
        : 88;

  const normalizedText = normalizeText(text, DEFAULT_FALLBACK);
  return {
    text: normalizedText || DEFAULT_FALLBACK,
    intent: resolvedIntent,
    confidence: clampPercent(confidence),
    suggestions,
    source,
    fallbackUsed: Boolean(fallbackUsed),
    error: null,
    studentName,
    subject: subjectContext.title,
    topic: topicContext.title,
    questionId: normalizeText(question?.id || '', ''),
    questionText,
    correctAnswer: expectedAnswer,
    studentAnswer: answerText,
    isCorrect: typeof isCorrect === 'boolean' ? isCorrect : Boolean(answerText && expectedAnswer && answerText === expectedAnswer)
  };
}

export default {
  getTutorResponse
};
