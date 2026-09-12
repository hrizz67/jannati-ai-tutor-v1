import { getSupabaseClient, supabaseConfigured } from '../../services/supabaseClient.js';
import { sanitizeChildFacingText } from '../../utils/childText.js';
import { getAnswerRevealPolicy, selectAnswerSafeText } from '../policy/answerRevealPolicy.js';
import { getSubjectLanguagePresentation } from '../voice/voiceConfig.js';
import {
  buildTutorSafetyResponse,
  containsPotentialPersonalData,
  detectTutorSafetyRisk,
  sanitizeTutorGatewayPayload,
  sanitizeTutorModelOutput
} from '../../../supabase/functions/_shared/tutorPolicy.js';

const REMOTE_INTENTS = new Set(['knowledge_question', 'comparison_question', 'why_question', 'how_question', 'clarification_needed']);
const ANSWER_PROTECTED_INTENTS = new Set(['hint', 'wrong_answer_coaching', 'question_help', 'direct_answer', 'correct_answer_reinforcement', 'show_answer']);
const runtimeEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const remoteEnabledByEnvironment = runtimeEnv.VITE_TUTOR_AI_REMOTE_ENABLED === 'true';

function normalizeText(value = '', maxLength = 1400) {
  return sanitizeChildFacingText(String(value ?? '').replace(/\s+/g, ' ').trim()).slice(0, maxLength);
}

function redactKnownStudentNames(history = [], options = {}) {
  const names = [
    options.student?.name,
    options.student?.displayName,
    options.profile?.name,
    options.profile?.displayName,
    options.adaptiveProfile?.name,
    options.adaptiveProfile?.displayName
  ].map(value => normalizeText(value, 80)).filter(value => value.length >= 2);
  return (Array.isArray(history) ? history : []).map(item => {
    let text = normalizeText(item?.text, 500);
    for (const name of names) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(escapedName, 'giu'), 'murid');
    }
    return { role: item?.role, text };
  });
}

export function buildTutorGatewayPayload(options = {}, localResponse = {}) {
  const languagePresentation = options.languagePresentation || getSubjectLanguagePresentation(options.subject || options.subjectId);
  const answerRevealPolicy = localResponse.answerRevealPolicy || getAnswerRevealPolicy({
    status: localResponse.isCorrect ? 'correct' : '',
    isCorrect: localResponse.isCorrect,
    attemptCount: options.attemptCount,
    hintsUsed: options.hintsUsed,
    explanationMode: options.explanationMode
  });
  const protectedAnswers = [
    options.expectedAnswer,
    options.correctAnswer,
    ...(Array.isArray(options.acceptedAnswers) ? options.acceptedAnswers : [])
  ].filter(Boolean);
  const protectAnswer = answerProtectionApplies(localResponse, options) && !answerRevealPolicy.canRevealAnswer;
  const localGuidance = !protectAnswer
    ? (localResponse.shortText || localResponse.text)
    : selectAnswerSafeText(
        [localResponse.shortText, localResponse.text],
        protectedAnswers,
        languagePresentation.teachingLanguage === 'en'
          ? 'Guide the learner with a clue without revealing the answer.'
          : 'Bimbing murid dengan petunjuk tanpa mendedahkan jawapan.'
      );
  return sanitizeTutorGatewayPayload({
    message: options.prompt,
    intent: localResponse.intent || options.intent,
    locale: options.locale || languagePresentation.contentLocale,
    context: {
      subjectId: options.subject?.id || options.subjectId,
      subjectTitle: options.subject?.title || options.subject?.name,
      topicId: options.topic?.id || options.topicId,
      topicTitle: options.topic?.title || options.topic?.name,
      topicNote: options.topic?.note || options.topic?.description,
      questionText: options.questionText || options.question?.q || options.question?.question,
      instruction: options.instruction || options.question?.instruction,
      options: options.options || options.question?.options,
      supportStage: localResponse.supportStage,
      localGuidance
    },
    history: redactKnownStudentNames(options.history, options)
  });
}

export function shouldUseGenerativeTutor(localResponse = {}, options = {}, { enabled = remoteEnabledByEnvironment } = {}) {
  if (!enabled || !normalizeText(options.prompt, 700)) return false;
  if (!REMOTE_INTENTS.has(localResponse.intent)) return false;
  if (!localResponse.needsGenerativeTutor && localResponse.grounded !== false) return false;
  const userConversation = [
    options.prompt,
    ...(Array.isArray(options.history) ? options.history.filter(item => item?.role === 'user').map(item => item?.text) : [])
  ].join(' ');
  return !containsPotentialPersonalData(userConversation) && !detectTutorSafetyRisk(userConversation);
}

function responseContainsHiddenAnswer(text = '', options = {}) {
  const answers = [
    options.expectedAnswer,
    options.correctAnswer,
    ...(Array.isArray(options.acceptedAnswers) ? options.acceptedAnswers : [])
  ]
    .map(value => normalizeText(value, 180))
    .filter(value => value && /[\p{L}\p{N}]/u.test(value))
    .sort((left, right) => right.length - left.length);
  return answers.some(answer => {
    const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'iu').test(text);
  });
}

function answerProtectionApplies(localResponse = {}, options = {}) {
  const intent = String(localResponse.intent || options.intent || '').trim().toLowerCase();
  if (ANSWER_PROTECTED_INTENTS.has(intent)) return true;
  return Boolean(
    localResponse.contextUsed?.hasQuestion &&
    ['why_question', 'how_question', 'clarification_needed'].includes(intent) &&
    (localResponse.referencesPreviousTurn || options.explanationMode)
  );
}

export function mergeGenerativeTutorResponse(localResponse = {}, remoteResponse = {}, options = {}) {
  const safeRemote = sanitizeTutorModelOutput(remoteResponse);
  if (!safeRemote?.canAnswerSafely) return localResponse;
  const text = normalizeText(safeRemote.text, 1400);
  if (!text) return localResponse;
  const answerRevealPolicy = localResponse.answerRevealPolicy || getAnswerRevealPolicy({
    status: localResponse.isCorrect ? 'correct' : '',
    isCorrect: localResponse.isCorrect,
    attemptCount: options.attemptCount,
    hintsUsed: options.hintsUsed,
    explanationMode: options.explanationMode
  });
  if (answerProtectionApplies(localResponse, options) && !answerRevealPolicy.canRevealAnswer && responseContainsHiddenAnswer(text, options)) return localResponse;
  return {
    ...localResponse,
    text,
    shortText: text,
    quickReplies: safeRemote.quickReplies.map(item => normalizeText(item, 90)).filter(Boolean),
    suggestions: safeRemote.quickReplies.map(item => normalizeText(item, 90)).filter(Boolean),
    suggestedActions: safeRemote.quickReplies.map(item => normalizeText(item, 90)).filter(Boolean),
    confidence: safeRemote.confidence,
    source: 'generative-gateway',
    fallbackUsed: false,
    generativeUsed: true,
    grounded: true,
    needsGenerativeTutor: false,
    needsAdultHelp: safeRemote.needsAdultHelp,
    answerRevealPolicy
  };
}

export function buildTutorPrivacyResponse(localResponse = {}, options = {}) {
  const text = 'Untuk keselamatan kamu, jangan kongsi nama penuh, alamat, sekolah, nombor telefon, kata laluan atau maklumat peribadi. Tulis semula soalan tanpa maklumat tersebut.';
  const quickReplies = ['Tulis semula soalan', 'Kembali kepada pelajaran', 'Minta bantuan orang dewasa'];
  return {
    ...localResponse,
    text,
    shortText: text,
    quickReplies,
    suggestions: quickReplies,
    suggestedActions: quickReplies,
    source: 'child-privacy',
    fallbackUsed: false,
    generativeUsed: false,
    needsGenerativeTutor: false,
    pendingPedagogicalStep: options.pendingPedagogicalStep || null
  };
}

export function buildLocalTutorSafetyResponse(localResponse = {}, risk = '', options = {}) {
  const safe = buildTutorSafetyResponse(risk);
  return {
    ...localResponse,
    ...safe,
    shortText: safe.text,
    suggestions: safe.quickReplies,
    suggestedActions: safe.quickReplies,
    source: 'child-safety',
    fallbackUsed: false,
    generativeUsed: false,
    needsGenerativeTutor: false,
    intent: 'child_safety',
    pendingPedagogicalStep: options.pendingPedagogicalStep || null
  };
}

export async function maybeEnhanceTutorResponse(localResponse = {}, options = {}, {
  enabled = remoteEnabledByEnvironment,
  clientFactory = getSupabaseClient,
  configured = supabaseConfigured,
  timeoutMs = 11000
} = {}) {
  const userConversation = [
    options.prompt,
    ...(Array.isArray(options.history) ? options.history.filter(item => item?.role === 'user').map(item => item?.text) : [])
  ].join(' ');
  const safetyRisk = detectTutorSafetyRisk(userConversation);
  if (safetyRisk) return buildLocalTutorSafetyResponse(localResponse, safetyRisk, options);
  if (containsPotentialPersonalData(userConversation)) return buildTutorPrivacyResponse(localResponse, options);
  if (!configured || !shouldUseGenerativeTutor(localResponse, options, { enabled })) return localResponse;

  const payload = buildTutorGatewayPayload(options, localResponse);
  if (!payload) return localResponse;
  try {
    const client = await clientFactory();
    if (!client?.functions?.invoke) return localResponse;
    const { data, error } = await client.functions.invoke('tutor-ai', { body: payload, timeout: timeoutMs });
    if (error || !data?.ok || !data?.response) return localResponse;
    return mergeGenerativeTutorResponse(localResponse, data.response, options);
  } catch {
    return localResponse;
  }
}

export default {
  buildTutorGatewayPayload,
  shouldUseGenerativeTutor,
  mergeGenerativeTutorResponse,
  maybeEnhanceTutorResponse
};
