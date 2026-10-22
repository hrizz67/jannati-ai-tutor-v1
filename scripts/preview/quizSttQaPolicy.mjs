// P1.17-V06: dedicated authenticated voice-QA artifact contract.
// Never reuse the public production build or the offline-only QA preview.
export const QUIZ_STT_QA_MODE = 'quiz-stt-qa';
export const QUIZ_STT_QA_CONFIRMATION = 'ISOLATED_QA_ARTIFACT_ONLY';
export const QUIZ_STT_QA_BASE_PATH = '/jannati-ai-tutor-v1/';
export const QUIZ_STT_QA_OUTPUT = 'qa-quiz-stt-site';
const SHA = /^[a-f\d]{40}$/i;
const PRODUCTION_ORIGIN = 'https://hrizz67.github.io';
const SHARED_STT_PATH = '/v1/transcribe';
const PILOT_STT_PATH = '/v1/quiz/transcribe';

export function exactHttpsOrigin(input) {
  if (typeof input !== 'string' || !input.trim()) return '';
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' || url.href !== url.origin + '/' ||
        url.username || url.password || url.port || url.search || url.hash) return '';
    return url.origin;
  } catch {
    return '';
  }
}
export function exactPilotEndpoint(input) {
  if (typeof input !== 'string' || !input.trim()) return '';
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' || url.username || url.password ||
        url.port || url.search || url.hash || url.pathname !== PILOT_STT_PATH) return '';
    if (url.origin === PRODUCTION_ORIGIN || url.pathname === SHARED_STT_PATH) return '';
    return url.href;
  } catch {
    return '';
  }
}
export function validateQuizSttQaConfig(config = {}) {
  const revision = String(config.VITE_BUILD_REVISION || '').trim().toLowerCase();
  if (!SHA.test(revision)) throw new Error('Quiz STT QA requires an immutable 40-character source SHA.');
  if (config.QUIZ_STT_QA_CONFIRM !== QUIZ_STT_QA_CONFIRMATION) {
    throw new Error('Quiz STT QA requires explicit isolated artifact-only confirmation.');
  }
  const qaOrigin = exactHttpsOrigin(config.QUIZ_STT_QA_ORIGIN);
  if (!qaOrigin || qaOrigin === PRODUCTION_ORIGIN || qaOrigin.endsWith('.github.io')) {
    throw new Error('Quiz STT QA requires a distinct HTTPS preview origin; production GitHub Pages is forbidden.');
  }
  const supabaseOrigin = exactHttpsOrigin(config.VITE_SUPABASE_URL);
  if (!supabaseOrigin) throw new Error('Quiz STT QA requires an explicit HTTPS test Supabase origin.');
  const key = String(config.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  if (!/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(key) || /service.role|secret/i.test(key)) {
    throw new Error('Quiz STT QA requires only a browser-safe test publishable key.');
  }
  const quizEndpoint = exactPilotEndpoint(config.VITE_QUIZ_STT_ENDPOINT);
  if (!quizEndpoint) throw new Error('Quiz STT QA requires exact HTTPS /v1/quiz/transcribe on a dedicated Worker.');
  if (quizEndpoint.startsWith(supabaseOrigin + '/')) {
    throw new Error('The dedicated Quiz STT Worker cannot be a Supabase endpoint.');
  }
  return Object.freeze({
    revision, qaOrigin, supabaseOrigin, publishableKey: key, quizEndpoint,
    backend: Object.freeze({ supabase: true, quizStt: true, sharedSpeechStt: false })
  });
}
