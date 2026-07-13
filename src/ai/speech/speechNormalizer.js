function normalizeBase(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function normalizeSpeechText(value) {
  return normalizeBase(value);
}

export function normalizeMalaySpeech(value) {
  return normalizeBase(value);
}

export default {
  normalizeMalaySpeech,
  normalizeSpeechText
};
