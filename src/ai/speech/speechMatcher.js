import { normalizeMalaySpeech } from './speechNormalizer.js';

export function matchSpeechAnswer(transcript, expectedAnswer, acceptedAnswers = []) {
  const normalizedTranscript = normalizeMalaySpeech(transcript);
  const normalizedExpected = normalizeMalaySpeech(expectedAnswer);
  const normalizedAccepted = Array.isArray(acceptedAnswers)
    ? acceptedAnswers.map(item => normalizeMalaySpeech(item)).filter(Boolean)
    : [];
  const answers = [normalizedExpected, ...normalizedAccepted].filter(Boolean);
  const matchedAnswer = answers.find(answer => answer === normalizedTranscript) || '';
  const correct = Boolean(matchedAnswer);

  return {
    correct,
    confidence: correct ? 100 : 0,
    transcript: String(transcript ?? '').trim(),
    normalizedTranscript,
    normalizedExpected,
    matchedAnswer,
    acceptedAnswers: answers
  };
}

export function compareSpeechTranscript(transcript, expectedAnswer, acceptedAnswers = []) {
  return matchSpeechAnswer(transcript, expectedAnswer, acceptedAnswers);
}

export default {
  compareSpeechTranscript,
  matchSpeechAnswer
};
