const DEFAULT_MIN_CONFIDENCE = 0;
const DEFAULT_MAX_CONFIDENCE = 100;

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clampConfidence(value) {
  return Math.max(DEFAULT_MIN_CONFIDENCE, Math.min(DEFAULT_MAX_CONFIDENCE, toNumber(value, 0)));
}

export function getConfidenceDelta({ correct = false, firstTry = false, repeatedWrong = false } = {}) {
  if (correct && firstTry) return 3;
  if (correct) return 2;
  return repeatedWrong ? -5 : -3;
}

export function getTopicStatus(confidence = 0) {
  const score = clampConfidence(confidence);
  if (score >= 90) return 'mastered';
  if (score >= 70) return 'good';
  if (score >= 40) return 'needs_practice';
  return 'weak';
}

export function getTopicStatusLabel(confidence = 0) {
  const status = getTopicStatus(confidence);
  if (status === 'mastered') return 'Mastered';
  if (status === 'good') return 'Good';
  if (status === 'needs_practice') return 'Needs Practice';
  return 'Weak';
}

export function updateConfidence(currentConfidence = 50, outcome = {}) {
  const delta = getConfidenceDelta(outcome);
  return clampConfidence(toNumber(currentConfidence, 50) + delta);
}

export default {
  clampConfidence,
  getConfidenceDelta,
  getTopicStatus,
  getTopicStatusLabel,
  updateConfidence
};
