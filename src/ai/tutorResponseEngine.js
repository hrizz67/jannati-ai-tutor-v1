import { buildCoachResponse } from './coach/v3/coachController.js';
import { rankStrongTopics, rankWeakTopics } from './adaptive/weakTopicEngine.js';
import { buildRecommendation } from './recommendationEngine.js';
import {
  clampPercent,
  formatSubjectName,
  formatTopicName,
  getHumanReadableTopic,
  getStudentDisplayName
} from '../utils/displayFormatter.js';
import {
  detectLearningCategory,
  getLearningExamples,
  getLearningMemoryTip,
  sanitizeChildFacingText
} from './learningCopy.js';
import {
  buildGuidedLearning,
  limitTutorText,
  sanitizeTutorText
} from './guidedLearning/index.js';

const DEFAULT_FALLBACK = 'Saya akan bantu berdasarkan soalan yang sedang kamu jawab.';

const CATEGORY_COMMON_MISTAKES = {
  person: ['Memilih nama tempat.', 'Memilih perkataan yang bukan nama orang.'],
  place: ['Memilih nama orang.', 'Memilih kata kerja atau sifat.'],
  animal: ['Memilih benda atau tempat.', 'Memilih perkataan yang bukan haiwan.'],
  object: ['Memilih nama orang.', 'Memilih kata kerja.'],
  verb: ['Memilih kata nama.', 'Memilih kata adjektif.'],
  adjective: ['Memilih nama benda.', 'Memilih perbuatan.'],
  penjodoh: ['Memilih kata nama biasa.', 'Menggunakan penjodoh yang tidak sesuai.'],
  simpulan: ['Membaca setiap perkataan secara literal.', 'Memilih frasa yang tiada maksud khas.'],
  conjunction: ['Memilih kata sendi nama.', 'Memilih kata nama.'],
  sendi: ['Memilih kata kerja.', 'Memilih kata hubung.'],
  generic: ['Menjawab terlalu cepat.', 'Tidak semak ayat penuh.']
};

const INTENT_STEPS = {
  hint: ['Cari kata kunci penting dalam soalan.', 'Bandingkan pilihan jawapan dengan kata kunci.'],
  question_help: ['Baca soalan perlahan-lahan.', 'Cari kata kunci penting.', 'Semak jawapan dengan ayat penuh.'],
  wrong_answer_coaching: ['Semak semula jawapan yang kamu pilih.', 'Cari petunjuk dalam ayat.', 'Bandingkan dengan maksud soalan.'],
  correct_answer_reinforcement: ['Ulang sebab jawapan itu betul.', 'Cuba soalan yang sedikit lebih mencabar.'],
  weak_topic: ['Lihat topik yang paling lemah dahulu.', 'Ulang satu langkah pada satu masa.'],
  revision_plan: ['Ikut topik keutamaan hari ini.', 'Buat ulang kaji ringkas dahulu.'],
  uasa_summary: ['Semak skor dan topik yang perlu dikuatkan.', 'Rancang ulang kaji sebelum simulasi seterusnya.'],
  example_request: ['Baca contoh mudah.', 'Bandingkan dengan soalan yang sedang kamu jawab.'],
  general: ['Baca soalan perlahan-lahan.', 'Cari kata kunci penting.']
};

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return normalizeText(value[0], fallback);
  if (typeof value === 'object') {
    if (typeof value.text === 'string' || typeof value.text === 'number') return normalizeText(value.text, fallback);
    if (typeof value.label === 'string' || typeof value.label === 'number') return normalizeText(value.label, fallback);
    if (typeof value.value === 'string' || typeof value.value === 'number') return normalizeText(value.value, fallback);
    return fallback;
  }
  const text = sanitizeChildFacingText(String(value).trim());
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

function getQuestionText(question = {}, explicit = '') {
  const text = normalizeText(
    explicit ||
    question?.q ||
    question?.question ||
    question?.stem ||
    question?.text ||
    question?.prompt ||
    ''
  );
  return text
    .replace(/\s*\((?:set|set bina ayat|set uasa|set adaptive)[^)]*\)/gi, '')
    .replace(/\s*\[(?:set|adaptive)[^\]]*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getInstruction(question = {}, explicit = '') {
  return normalizeText(
    explicit ||
    question?.instruction ||
    question?.direction ||
    question?.prompt ||
    question?.task ||
    ''
  );
}

function getOptions(question = {}, explicit = []) {
  if (Array.isArray(explicit) && explicit.length) return normalizeList(explicit);
  return normalizeList(question?.options || question?.choices || question?.answers || []);
}

function getExpectedAnswer(question = {}, explicit = '') {
  return normalizeText(
    explicit ||
    question?.answer ||
    question?.correctAnswer ||
    question?.expectedAnswer ||
    question?.acceptedAnswers?.[0] ||
    ''
  );
}

function getLearnerAnswer(explicit = '', question = {}) {
  return normalizeText(explicit || question?.learnerAnswer || question?.studentAnswer || question?.answerAttempt || '', '');
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
    objective: normalizeText(
      topic?.objective ||
      topic?.learningObjective ||
      topic?.currentLearningObjective ||
      '',
      ''
    ),
    questions: Array.isArray(topic?.questions) ? topic.questions : []
  };
}

function resolveTopicLabel({ subject = null, topic = null, question = null, metadata = null } = {}) {
  const label = getHumanReadableTopic({ subject, topic, question, metadata });
  return normalizeText(label, 'topik semasa');
}

function inferIntent({ intent = '', prompt = '', isCorrect, question = {} } = {}) {
  const direct = String(intent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (direct) return direct;

  const text = String(prompt ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (/topik\s+lemah|weak_topic|lemah/.test(text)) return 'weak_topic';
  if (/ulang\s*kaji|revision_plan|cadangan ulang kaji|cadangan/.test(text)) return 'revision_plan';
  if (/uasa|summary/.test(text)) return 'uasa_summary';
  if (/beri\s+saya\s+petunjuk|petunjuk|hint/.test(text)) return 'hint';
  if (/kenapa\s+jawapan\s+saya\s+salah|wrong_answer_coaching|salah/.test(text)) return 'wrong_answer_coaching';
  if (/terangkan|jelaskan|soalan ini|question help/.test(text)) return 'question_help';
  if (/beri\s+contoh\s+mudah|contoh\s+mudah|example/.test(text)) return 'example_request';
  if (/betul|correct/.test(text)) return 'correct_answer_reinforcement';
  if (typeof isCorrect === 'boolean') return isCorrect ? 'correct_answer_reinforcement' : 'wrong_answer_coaching';
  if (getQuestionText(question)) return 'question_help';
  return 'general';
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
    case 'example_request':
      return [
        'Baca contoh mudah dulu.',
        'Cari persamaan dengan soalan semasa.',
        'Cuba jawab dengan gaya yang sama.'
      ];
    default:
      return context.questionText ? ['Baca soalan perlahan-lahan.', 'Cari kata kunci penting.', 'Semak jawapan dengan maksud soalan.'] : generic;
  }
}

function getCategoryRule(question = {}, topic = {}) {
  const category = detectLearningCategory(question, topic);
  const commonMistakes = CATEGORY_COMMON_MISTAKES[category] || CATEGORY_COMMON_MISTAKES.generic;
  const example = getLearningExamples(question, topic)[0] || '';
  const memoryTip = getLearningMemoryTip(question, topic);
  return {
    category,
    commonMistakes,
    example,
    memoryTip
  };
}

function buildContextualSections({
  intent,
  questionText,
  instruction,
  options,
  subject,
  topic,
  topicLabel,
  question,
  answer,
  learnerAnswer,
  isCorrect,
  attemptCount,
  hintsUsed,
  coachResponse,
  studyPlan,
  readiness,
  adaptiveRecommendation,
  profile,
  explanationMode,
  currentLearningObjective,
  weakTopics = [],
  strongTopics = [],
  guided = null
}) {
  const categoryRule = getCategoryRule(question, topic);
  const subjectLabel = subject?.title || formatSubjectName(subject?.id);
  const resolvedQuestion = questionText || getQuestionText(question);
  const resolvedInstruction = instruction || getInstruction(question);
  const resolvedOptions = options.length ? options : getOptions(question);
  const expectedAnswer = getExpectedAnswer(question, answer);
  const learner = getLearnerAnswer(learnerAnswer, question);
  const explanationText = normalizeText(
    coachResponse?.explanation?.explanation ||
    coachResponse?.explanation ||
    coachResponse?.simpleExplanation ||
    question?.explanation ||
    ''
  );
  const simpleExplanationText = normalizeText(
    coachResponse?.explanation?.simpleExplanation ||
    coachResponse?.simpleExplanation ||
    explanationText ||
    question?.simpleExplanation ||
    ''
  );
  const hintText = normalizeText(
    guided?.hint ||
    coachResponse?.hint?.hint ||
    coachResponse?.hint ||
    question?.hint ||
    categoryRule.memoryTip ||
    'Cari kata kunci penting dalam soalan.'
  );
  const praiseText = normalizeText(
    guided?.praise ||
    coachResponse?.praise?.praise ||
    coachResponse?.praise ||
    'Bagus! Teruskan usaha kamu.'
  );
  const learningTipText = normalizeText(
    coachResponse?.learningTip ||
    coachResponse?.tips?.spotlight ||
    categoryRule.memoryTip ||
    'Fokus pada kata kunci penting.'
  );
  const coachKnowledge = coachResponse?.knowledge || {};
  const steps = normalizeList(
    coachResponse?.steps ||
    coachKnowledge?.steps ||
    coachKnowledge?.learningSteps ||
    INTENT_STEPS[intent] ||
    INTENT_STEPS.general
  );
  const commonMistake = normalizeText(
    coachKnowledge?.commonMistakes?.[0] ||
    coachResponse?.commonMistakes?.[0] ||
    categoryRule.commonMistakes?.[0] ||
    ''
  );
  const example = normalizeText(
    coachKnowledge?.examples?.[0] ||
    coachResponse?.examples?.[0] ||
    categoryRule.example ||
    (resolvedQuestion ? resolvedQuestion : '')
  );
  const memoryTip = normalizeText(
    coachKnowledge?.memoryTips?.[0] ||
    coachResponse?.memoryTips?.[0] ||
    categoryRule.memoryTip ||
    getLearningMemoryTip(question, topic)
  );
  const learningObjective = normalizeText(currentLearningObjective || topic?.objective || topic?.learningObjective || topic?.currentLearningObjective || '', '');
  const weakTopic = Array.isArray(weakTopics) && weakTopics.length
    ? weakTopics[0]
    : Array.isArray(profile?.weakTopics)
      ? profile.weakTopics[0] || null
      : null;
  const strongTopic = Array.isArray(strongTopics) && strongTopics.length
    ? strongTopics[0]
    : Array.isArray(profile?.strongTopics)
      ? profile.strongTopics[0] || null
      : null;
  const weakTopicLabel = weakTopic
    ? normalizeText(
        getHumanReadableTopic({
          subject: { id: weakTopic.subjectId || subject?.id || '' },
          topic: { id: weakTopic.topicId || '' },
          metadata: {
            topicId: weakTopic.topicId || '',
            displayName: weakTopic.topicTitle || weakTopic.title || ''
          }
        }) || formatTopicName(weakTopic.topicId || ''),
        ''
      )
    : '';
  const strongTopicLabel = strongTopic
    ? normalizeText(
        getHumanReadableTopic({
          subject: { id: strongTopic.subjectId || subject?.id || '' },
          topic: { id: strongTopic.topicId || '' },
          metadata: {
            topicId: strongTopic.topicId || '',
            displayName: strongTopic.topicTitle || strongTopic.title || ''
          }
        }) || formatTopicName(strongTopic.topicId || ''),
        ''
      )
    : '';
  const recommendationReason = normalizeText(
    adaptiveRecommendation?.reason ||
    studyPlan?.notes ||
    readiness?.message ||
    ''
  );
  const isHintIntent = intent === 'hint';
  const safeHintLead = sanitizeChildFacingText(
    hintText || 'Cari kata kunci penting dalam soalan.'
  );

  const revealAnswer =
    Boolean(isCorrect) ||
    explanationMode === 'correct_answer_reinforcement' ||
    explanationMode === 'show_answer' ||
    (intent === 'wrong_answer_coaching' && Number(attemptCount) >= 3) ||
    Boolean(guided?.revealAnswer && intent !== 'hint');

  const instructionCore = resolvedInstruction.replace(/[.!?]+$/g, '').trim();
  const friendlyInstruction = instructionCore
    ? instructionCore.charAt(0).toLocaleLowerCase('ms-MY') + instructionCore.slice(1)
    : '';
  const friendlyQuestionSummary = friendlyInstruction
    ? `Soalan ini meminta kamu ${friendlyInstruction}.`
    : topicLabel && topicLabel !== 'topik semasa'
      ? `Mari kita faham soalan tentang ${topicLabel}.`
      : 'Mari kita faham soalan ini bersama-sama.';

  const summary = sanitizeChildFacingText(
    isHintIntent
      ? [
          friendlyInstruction ? `Cuba ikut arahan: ${friendlyInstruction}.` : '',
          topicLabel && topicLabel !== 'topik semasa' ? `Fokus pada ${topicLabel}.` : ''
        ].filter(Boolean).join(' ')
      : intent === 'weak_topic'
        ? [
            weakTopicLabel ? `Topik lemah kamu ialah ${weakTopicLabel}.` : 'Topik lemah kamu memerlukan latihan lagi.',
            resolvedInstruction ? `Arahan: ${resolvedInstruction}.` : '',
            subjectLabel ? `Subjek: ${subjectLabel}.` : ''
          ].filter(Boolean).join(' ')
        : intent === 'revision_plan'
          ? [
              'Cadangan ulang kaji hari ini memfokuskan latihan yang perlu dikuatkan.',
              recommendationReason ? `Sebab: ${recommendationReason}.` : '',
              strongTopicLabel ? `Topik yang sudah kuat: ${strongTopicLabel}.` : ''
            ].filter(Boolean).join(' ')
          : intent === 'uasa_summary'
            ? [
                'Ringkasan UASA menunjukkan kemajuan dan topik yang perlu diperkemas.',
                recommendationReason ? `Butiran: ${recommendationReason}.` : '',
                weakTopicLabel ? `Fokus seterusnya: ${weakTopicLabel}.` : ''
              ].filter(Boolean).join(' ')
            : [
                friendlyQuestionSummary,
                resolvedQuestion ? `Lihat ayat ini: ${resolvedQuestion}.` : ''
              ].filter(Boolean).join(' ')
  ) || (
    isHintIntent
      ? `Mari kita lihat petunjuk untuk ${topicLabel || 'topik semasa'}.`
      : `Mari kita lihat topik ${topicLabel || 'topik semasa'}.`
  );

  const whyCorrect = sanitizeChildFacingText(
    !revealAnswer && guided?.stage !== 'correct_first_try' && guided?.stage !== 'correct_after_support'
      ? (guided?.guidingQuestion || guided?.misconception?.childSafeLabel || hintText)
      : isHintIntent
      ? 'Fokus pada petunjuk ini.'
      : explanationText ||
        simpleExplanationText ||
        (revealAnswer && expectedAnswer ? `Jawapan yang betul ialah ${expectedAnswer}.` : 'Mari kita semak sebab jawapan ini sesuai.')
  );

  const hint = sanitizeChildFacingText(
    safeHintLead
  );

  const coachMessage = sanitizeTutorText(
    isCorrect
      ? praiseText
      : intent === 'wrong_answer_coaching'
        ? `Jawapan kamu belum tepat. ${guided?.misconception?.childSafeLabel || 'Cuba semak semula bersama.'}`
        : intent === 'hint'
          ? 'Cuba guna petunjuk ini untuk mencari jawapan.'
          : intent === 'weak_topic'
            ? 'Mari fokus pada topik lemah ini sedikit demi sedikit.'
            : intent === 'revision_plan'
              ? 'Ikut cadangan ulang kaji ini untuk kemajuan yang lebih baik.'
              : intent === 'uasa_summary'
                ? 'Semak ringkasan ini untuk lihat perkembangan kamu.'
                : 'Saya akan bantu langkah demi langkah.'
  );

  const shortText = sanitizeTutorText(
    isHintIntent
        ? `${limitTutorText(hint, 'hint')}`
      : intent === 'wrong_answer_coaching'
        ? `${coachMessage}${commonMistake ? ` ${commonMistake}` : ''}`
        : intent === 'correct_answer_reinforcement'
          ? `${coachMessage}${revealAnswer && expectedAnswer ? ` Jawapan betul ialah ${expectedAnswer}.` : ''}`
          : summary
  );

  const text = sanitizeTutorText([
    summary,
    isHintIntent ? hint : '',
    !isHintIntent && intent === 'wrong_answer_coaching' ? commonMistake || whyCorrect : (!isHintIntent ? whyCorrect : ''),
    steps[0] ? `Langkah pertama: ${steps[0]}.` : '',
    !isHintIntent && example ? `Contoh mudah: ${example}.` : '',
    !isHintIntent && memoryTip ? `Tip ingatan: ${memoryTip}.` : '',
    !isHintIntent && revealAnswer && expectedAnswer ? `Jawapan betul: ${expectedAnswer}.` : '',
    coachMessage,
    !isHintIntent && guided?.nextAction ? `Seterusnya: ${guided.nextAction}.` : ''
  ].filter(Boolean).join(' ')) || DEFAULT_FALLBACK;

  const sections = {
    summary,
    whyCorrect,
    hint,
    steps,
    commonMistake,
    example,
    memoryTip,
    correctAnswer: revealAnswer ? expectedAnswer : '',
    coachMessage,
    learningObjective,
    questionText: resolvedQuestion,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    subject: subjectLabel,
    topic: topicLabel
  };

  const contextUsed = {
    hasQuestion: Boolean(resolvedQuestion),
    hasInstruction: Boolean(resolvedInstruction),
    optionCount: resolvedOptions.length,
    questionText: resolvedQuestion,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    subject: subjectLabel,
    topic: topicLabel,
    expectedAnswer,
    learnerAnswer: learner,
    isCorrect: Boolean(isCorrect),
    attemptCount: Number(attemptCount) || 0,
    hintsUsed: Number(hintsUsed) || 0,
    explanationMode: normalizeText(explanationMode, ''),
    currentLearningObjective: learningObjective,
    subjectId: subject?.id || '',
    topicId: topic?.id || '',
    intent,
    hasCoachData: Boolean(coachResponse?.ready),
    tutorMode: guided?.mode || '',
    supportStage: guided?.stage || '',
    misconceptionType: guided?.misconception?.type || ''
  };

  return {
    text,
    shortText,
    sections,
    contextUsed,
    guided
  };
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
    questionText = '',
    instruction = '',
    options: questionOptions = [],
    expectedAnswer = '',
    learnerAnswer = '',
    studentAnswer = '',
    correctAnswer = '',
    explanationMode = '',
    currentLearningObjective = '',
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
  const resolvedQuestion = question || {};
  const studentName = getStudentDisplayName(studentProfile, 'Murid');
  const resolvedIntent = inferIntent({ intent, prompt, isCorrect, question: resolvedQuestion });
  const resolvedQuestionText = getQuestionText(resolvedQuestion, questionText);
  const resolvedInstruction = getInstruction(resolvedQuestion, instruction);
  const resolvedOptions = getOptions(resolvedQuestion, questionOptions);
  const answerText = getLearnerAnswer(learnerAnswer || studentAnswer, resolvedQuestion);
  const expected = getExpectedAnswer(resolvedQuestion, expectedAnswer || correctAnswer);
  const resolvedCorrect = typeof isCorrect === 'boolean'
    ? isCorrect
    : Boolean(answerText && expected && normalizeText(answerText).toLowerCase() === normalizeText(expected).toLowerCase());
  const hasQuestionContext = Boolean(resolvedQuestionText || resolvedInstruction || topicContext.id || subjectContext.id);

  let coachResponse = null;
  let source = 'fallback';

  if (hasQuestionContext && (subjectContext.id || topicContext.id)) {
    try {
      coachResponse = await buildCoachResponse({
        subjectId: subjectContext.id,
        topicId: topicContext.id,
        question: resolvedQuestion,
        result: {
          correct: resolvedCorrect,
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
          gamificationProfile,
          questionText: resolvedQuestionText,
          instruction: resolvedInstruction,
          options: resolvedOptions,
          expectedAnswer: expected,
          learnerAnswer: answerText,
          explanationMode,
          currentLearningObjective
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

  const weakList = Array.isArray(weakTopics) && weakTopics.length ? weakTopics : rankWeakTopics(studentProfile || {}, {
    subjectId: subjectContext.id || undefined,
    limit: 5,
    includeLowConfidence: true
  });
  const strongList = Array.isArray(strongTopics) && strongTopics.length ? strongTopics : rankStrongTopics(studentProfile || {}, {
    subjectId: subjectContext.id || undefined,
    limit: 5
  });

  const guided = buildGuidedLearning({
    subjectId: subjectContext.id,
    topicId: topicContext.id,
    intent: resolvedIntent,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    expectedAnswer: expected,
    learnerAnswer: answerText,
    isCorrect: resolvedCorrect,
    attemptCount: Number(attemptCount) || 0,
    hintsUsed: Number(hintsUsed) || 0,
    question: resolvedQuestion,
    completionState: resolvedIntent === 'uasa_summary' || resolvedIntent === 'revision_plan',
    explicitAnswerRequest: /tunjuk(?:kan)?\s+(?:jawapan|jawapan betul)|show answer|jawapan sebenar/i.test(prompt)
  });

  const resolvedTopicLabel = resolveTopicLabel({
    subject: subjectContext,
    topic: topicContext,
    question: resolvedQuestion,
    metadata: {
      displayName: topicContext.title,
      title: topicContext.title,
      topicId: topicContext.id
    }
  });
  const fallbackTopicLabel = resolvedTopicLabel || 'topik semasa';
  const contextBundle = buildContextualSections({
    intent: resolvedIntent,
    questionText: resolvedQuestionText,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    subject: subjectContext,
    topic: topicContext,
    topicLabel: fallbackTopicLabel,
    question: resolvedQuestion,
    answer: expected,
    learnerAnswer: answerText,
    isCorrect,
    attemptCount: Number(attemptCount) || 0,
    hintsUsed: Number(hintsUsed) || 0,
    coachResponse,
    studyPlan,
    readiness,
    adaptiveRecommendation,
    profile: studentProfile,
    explanationMode,
    currentLearningObjective,
    weakTopics,
    strongTopics,
    guided
  });

  const suggestions = buildSuggestionList(resolvedIntent, {
    subject: subjectContext,
    topic: topicContext,
    question: resolvedQuestion,
    questionText: resolvedQuestionText
  });

  const recommendation = buildRecommendation(studentProfile || {}, subjectContext || {});
  const confidence = fallbackUsed
    ? 45
    : hasQuestionContext
      ? 92
      : resolvedIntent === 'general'
        ? 82
        : 88;

  const fallbackText = sanitizeChildFacingText(
    hasQuestionContext
      ? `Mari kita lihat soalan ini bersama-sama.`
      : `Saya akan bantu berdasarkan ${fallbackTopicLabel}.`
  );

  return {
    text: contextBundle.text || fallbackText || DEFAULT_FALLBACK,
    shortText: contextBundle.shortText || fallbackText || DEFAULT_FALLBACK,
    intent: resolvedIntent,
    confidence: clampPercent(confidence),
    suggestions,
    suggestedActions: suggestions,
    source,
    fallbackUsed: Boolean(fallbackUsed),
    error: null,
    studentName,
    subject: subjectContext.title,
    topic: fallbackTopicLabel,
    questionId: normalizeText(resolvedQuestion?.id || '', ''),
    questionText: resolvedQuestionText,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    expectedAnswer: expected,
    learnerAnswer: answerText,
    correctAnswer: expected,
    isCorrect: resolvedCorrect,
    contextUsed: contextBundle.contextUsed,
    sections: contextBundle.sections,
    recommendationKey: recommendation?.recommendedTopicId || null,
    weakTopics: weakList,
    strongTopics: strongList,
    uasaSummary,
    adaptiveRecommendation,
    explanationMode,
    currentLearningObjective,
    learnerAnswerText: answerText,
    tutorMode: guided.mode,
    supportStage: guided.stage,
    misconception: guided.misconception,
    guidingQuestion: guided.guidingQuestion,
    quickReplies: guided.quickReplies,
    nextAction: guided.nextAction,
    praise: guided.praise,
    learningExperience: guided
  };
}

export default {
  getTutorResponse
};
