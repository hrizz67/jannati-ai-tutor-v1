export const QA_PREVIEW_MODE = 'qa-preview';
export const QA_PREVIEW_BASE_PATH = '/jannati-ai-tutor-v1/';

export function isQaPreviewMode(mode = '') {
  return String(mode).trim() === QA_PREVIEW_MODE;
}

export function resolveBuildEnvironment({ mode = '', env = {} } = {}) {
  if (isQaPreviewMode(mode)) {
    return Object.freeze({
      qaPreview: true,
      supabaseUrl: '',
      supabasePublishableKey: '',
      sttEndpoint: ''
    });
  }

  return Object.freeze({
    qaPreview: false,
    supabaseUrl: String(env.VITE_SUPABASE_URL || '').trim(),
    supabasePublishableKey: String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim(),
    sttEndpoint: String(env.VITE_STT_ENDPOINT || '').trim()
  });
}

export function requireQaPreviewRevision(revision = '') {
  const normalized = String(revision).trim();
  if (!/^[0-9a-f]{40}$/i.test(normalized)) {
    throw new Error('QA preview requires VITE_BUILD_REVISION to be an immutable 40-character Git SHA.');
  }
  return normalized.toLowerCase();
}
