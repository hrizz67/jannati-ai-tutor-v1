import { normalizeMalaySpeech } from './speechNormalizer.js';

const MALAY_NUMBER_UNITS = {
  kosong: 0,
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  lapan: 8,
  sembilan: 9
};

function parseMalayNumber(value) {
  const normalized = normalizeMalaySpeech(value).replace(/[-]/g, ' ');
  if (!normalized) return null;
  if (/^\d+$/.test(normalized)) return Number(normalized);

  const tokens = normalized.split(' ').filter(token => token && token !== 'dan');
  if (!tokens.length) return null;

  // Mobile speech recognition often reads a written answer such as 139 as
  // separate digits: “satu tiga sembilan”. In that form, concatenate the
  // digit words instead of adding them as quantities (1 + 3 + 9 = 13).
  if (tokens.length > 1 && tokens.every(token => MALAY_NUMBER_UNITS[token] !== undefined)) {
    return Number(tokens.map(token => MALAY_NUMBER_UNITS[token]).join(''));
  }

  let total = 0;
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token === 'seribu') {
      total += 1000;
      index += 1;
      continue;
    }
    if (token === 'seratus') {
      total += 100;
      index += 1;
      continue;
    }
    const unit = MALAY_NUMBER_UNITS[token];
    if (unit === undefined) return null;
    const next = tokens[index + 1];
    if (next === 'ratus') {
      total += unit * 100;
      index += 2;
    } else if (next === 'puluh') {
      total += unit * 10;
      index += 2;
    } else if (next === 'belas') {
      total += unit + 10;
      index += 2;
    } else {
      total += unit;
      index += 1;
    }
  }
  return total <= 1000 ? total : null;
}

function isNumericAnswer(value) {
  return /^\d+$/.test(normalizeMalaySpeech(value));
}

export function matchSpeechAnswer(transcript, expectedAnswer, acceptedAnswers = []) {
  const normalizedTranscript = normalizeMalaySpeech(transcript);
  const normalizedExpected = normalizeMalaySpeech(expectedAnswer);
  const normalizedAccepted = Array.isArray(acceptedAnswers)
    ? acceptedAnswers.map(item => normalizeMalaySpeech(item)).filter(Boolean)
    : [];
  const answers = [normalizedExpected, ...normalizedAccepted].filter(Boolean);
  let matchedAnswer = answers.find(answer => answer === normalizedTranscript) || '';

  // Maths answers are stored as digits, but mobile speech recognition often
  // returns Malay number words (for example, "sembilan" instead of "9").
  // Keep normal text matching unchanged and only use numeric equivalence when
  // the configured answer itself is numeric.
  if (!matchedAnswer) {
    const numericAnswer = [normalizedExpected, ...normalizedAccepted].find(isNumericAnswer);
    if (numericAnswer) {
      const expectedNumber = parseMalayNumber(numericAnswer);
      const spokenNumber = parseMalayNumber(normalizedTranscript);
      if (expectedNumber !== null && spokenNumber !== null && expectedNumber === spokenNumber) {
        matchedAnswer = numericAnswer;
      }
    }
  }
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

export { parseMalayNumber };

export function compareSpeechTranscript(transcript, expectedAnswer, acceptedAnswers = []) {
  return matchSpeechAnswer(transcript, expectedAnswer, acceptedAnswers);
}

export default {
  compareSpeechTranscript,
  matchSpeechAnswer
};
