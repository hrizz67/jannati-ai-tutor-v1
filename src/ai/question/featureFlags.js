export const QUESTION_INTELLIGENCE = true;
// Keep the original question wording. Automatic stem variants can remove the
// sentence context while leaving the original answer and explanation behind.
export const QUESTION_STEM_ENGINE = false;
export const QUESTION_TEMPLATE_ENGINE = false;
export const USE_TEMPLATE_ENGINE = false;
// Disabled until context substitutions can update the answer and explanation
// atomically; correctness is more important than surface variation.
export const QUESTION_CONTEXT_ENGINE = false;
export const QUESTION_NUMBER_ENGINE = true;
export const QUESTION_DISTRACTOR_ENGINE = false;

function readEnvFlag(name, fallback) {
  const viteValue = typeof import.meta !== 'undefined' ? import.meta.env?.[`VITE_${name}`] : undefined;
  const nodeValue = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  const value = viteValue ?? nodeValue;
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
}

export function getQuestionFeatureFlags(overrides = {}) {
  return {
    QUESTION_INTELLIGENCE: overrides.QUESTION_INTELLIGENCE ?? readEnvFlag('QUESTION_INTELLIGENCE', QUESTION_INTELLIGENCE),
    QUESTION_STEM_ENGINE: overrides.QUESTION_STEM_ENGINE ?? readEnvFlag('QUESTION_STEM_ENGINE', QUESTION_STEM_ENGINE),
    QUESTION_TEMPLATE_ENGINE: overrides.QUESTION_TEMPLATE_ENGINE ?? readEnvFlag('QUESTION_TEMPLATE_ENGINE', QUESTION_TEMPLATE_ENGINE),
    USE_TEMPLATE_ENGINE: overrides.USE_TEMPLATE_ENGINE ?? readEnvFlag('USE_TEMPLATE_ENGINE', USE_TEMPLATE_ENGINE),
    QUESTION_CONTEXT_ENGINE: overrides.QUESTION_CONTEXT_ENGINE ?? readEnvFlag('QUESTION_CONTEXT_ENGINE', QUESTION_CONTEXT_ENGINE),
    QUESTION_NUMBER_ENGINE: overrides.QUESTION_NUMBER_ENGINE ?? readEnvFlag('QUESTION_NUMBER_ENGINE', QUESTION_NUMBER_ENGINE),
    QUESTION_DISTRACTOR_ENGINE: overrides.QUESTION_DISTRACTOR_ENGINE ?? readEnvFlag('QUESTION_DISTRACTOR_ENGINE', QUESTION_DISTRACTOR_ENGINE)
  };
}

export function isQuestionIntelligenceEnabled(overrides = {}) {
  return getQuestionFeatureFlags(overrides).QUESTION_INTELLIGENCE;
}
