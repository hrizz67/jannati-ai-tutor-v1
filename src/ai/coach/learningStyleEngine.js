import { loadAIMemory } from '../memoryEngine.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function scoreHistory(entries = []) {
  return entries.reduce((sum, item) => sum + toNumber(item?.score, 0), 0);
}

export function getLearningStyle(profile = {}, memory = loadAIMemory()) {
  const readingScore = scoreHistory(memory.readingHistory || []);
  const listeningScore = scoreHistory(memory.listeningHistory || []);
  const speakingScore = scoreHistory(memory.speakingHistory || []);
  const writingScore = scoreHistory(memory.writingHistory || []);
  const attemptBias = Math.max(
    toNumber(profile.totalQuestions, 0),
    toNumber(profile.studyMinutes, 0)
  );

  const candidates = [
    { style: 'visual', score: readingScore + attemptBias * 0.1 },
    { style: 'auditory', score: listeningScore + speakingScore * 0.5 },
    { style: 'practice', score: writingScore + toNumber(profile.streak, 0) * 2 },
    { style: 'balanced', score: (readingScore + listeningScore + speakingScore + writingScore) / 4 }
  ];

  candidates.sort((a, b) => b.score - a.score || a.style.localeCompare(b.style));
  const chosen = candidates[0] || { style: 'balanced', score: 0 };
  return {
    style: chosen.style,
    score: Math.round(chosen.score),
    evidence: {
      readingScore,
      listeningScore,
      speakingScore,
      writingScore
    }
  };
}

export default {
  getLearningStyle
};
