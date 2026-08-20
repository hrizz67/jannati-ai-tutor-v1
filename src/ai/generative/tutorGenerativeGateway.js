import { getSupabaseClient, supabaseConfigured } from '../../services/supabaseClient.js';
import { sanitizeChildFacingText } from '../../utils/childText.js';
import {
  buildTutorSafetyResponse,
  containsPotentialPersonalData,
  detectTutorSafetyRisk,
  sanitizeTutorGatewayPayload,
  sanitizeTutorModelOutput
} from '../../../supabase/functions/_shared/tutorPolicy.js';

const REMOTE_INTENTS = new Set(['knowledge_question', 'comparison_question', 'why_question', 'how_question', 'clarification_needed']);
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
  return sanitizeTutorGatewayPayload({
    message: options.prompt,
    intent: localResponse.intent || options.intent,
    locale: options.locale || 'ms-MY',
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
      localGuidance: localResponse.shortText || localResponse.text
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

export function mergeGenerativeTutorResponse(localResponse = {}, remoteResponse = {}) {
  const safeRemote = sanitizeTutorModelOutput(remoteResponse);
  if (!safeRemote?.canAnswerSafely) return localResponse;
  const text = normalizeText(safeRemote.text, 1400);
  if (!text) return localResponse;
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
    needsAdultHelp: safeRemote.needsAdultHelp
  };
}

export function buildTutorPrivacyResponse(localResponse = {}) {
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
    needsGenerativeTutor: false
  };
}

export function buildLocalTutorSafetyResponse(localResponse = {}, risk = '') {
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
    intent: 'child_safety'
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
  if (safetyRisk) return buildLocalTutorSafetyResponse(localResponse, safetyRisk);
  if (containsPotentialPersonalData(userConversation)) return buildTutorPrivacyResponse(localResponse);
  if (!configured || !shouldUseGenerativeTutor(localResponse, options, { enabled })) return localResponse;

  const payload = buildTutorGatewayPayload(options, localResponse);
  if (!payload) return localResponse;
  try {
    const client = await clientFactory();
    if (!client?.functions?.invoke) return localResponse;
    const { data, error } = await client.functions.invoke('tutor-ai', { body: payload, timeout: timeoutMs });
    if (error || !data?.ok || !data?.response) return localResponse;
    return mergeGenerativeTutorResponse(localResponse, data.response);
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
