const VALID_COGNITIVE_LEVELS = new Set([
  'mengingat',
  'memahami',
  'mengaplikasi',
  'menganalisis',
  'menilai',
  'mencipta'
]);

const VALID_DIFFICULTIES = new Set(['mudah', 'sederhana', 'sukar']);

function normalizeText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value = '') {
  return normalizeText(value)
    .toLocaleLowerCase('ms-MY')
    .replace(/[.!?,;:؟،؛]+$/u, '')
    .trim();
}

export function stableQuestionHash(value = '') {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function deterministicOptionOrder(answer, sourceOptions = [], seed = '', maxOptions = Infinity) {
  if (!Array.isArray(sourceOptions) || sourceOptions.length < 2) return sourceOptions;
  const canonical = normalizeText(answer);
  const canonicalKey = normalizeKey(canonical);
  const uniqueOptions = [...new Map(
    sourceOptions
      .map(normalizeText)
      .filter(Boolean)
      .map(option => [normalizeKey(option), option])
  ).values()];
  if (!canonicalKey || !uniqueOptions.some(option => normalizeKey(option) === canonicalKey)) return uniqueOptions;

  const distractors = uniqueOptions
    .filter(option => normalizeKey(option) !== canonicalKey)
    .sort((left, right) => {
      const leftHash = stableQuestionHash(`${seed}:distractor:${normalizeKey(left)}`);
      const rightHash = stableQuestionHash(`${seed}:distractor:${normalizeKey(right)}`);
      return leftHash - rightHash || normalizeKey(left).localeCompare(normalizeKey(right));
    });
  const limited = distractors.slice(0, Math.max(1, Number(maxOptions) - 1));
  const ordered = [...limited];
  const answerPosition = stableQuestionHash(`${seed}:answer-position`) % (ordered.length + 1);
  ordered.splice(answerPosition, 0, uniqueOptions.find(option => normalizeKey(option) === canonicalKey));
  return ordered;
}

function questionTypeFor(question = {}) {
  const options = question.options || question.choices || question.answerOptions;
  if (Array.isArray(options) && options.length >= 2) return 'objective';
  return String(question.questionType || question.type || '').toLocaleLowerCase('ms-MY');
}

function cognitiveEvidence(question = {}) {
  const stem = normalizeText(question.q || question.question);
  const lower = stem.toLocaleLowerCase('ms-MY');
  const type = questionTypeFor(question);
  const marks = Number(question.marks || 1);
  const hasCreationRubric = Array.isArray(question.rubric?.criteria) && question.rubric.criteria.length >= 2;

  if (/^(?:mencipta\s*:|cipta(?:kan)?\b|hasilkan\b|karang\b|create\b)/iu.test(lower)
    || (/^(?:bina (?:satu )?ayat\b|tulis (?:satu )?ayat\b|write (?:a|one) sentence\b)/iu.test(lower) && (marks >= 3 || hasCreationRubric))) {
    return { cognitiveLevel: 'mencipta', evidence: 'creation_prompt' };
  }
  if (/\bpilih ayat yang paling sesuai untuk menunjukkan (?:tambahan|pertentangan|sebab|pilihan|dua perbuatan|urutan)\b/iu.test(lower)) {
    return { cognitiveLevel: 'memahami', evidence: 'relationship_interpretation' };
  }
  if (/^(?:penilaian(?: kbat)?\s*:)/iu.test(lower)
    || /\bnilai(?:kan)?\s+(?:pernyataan|dakwaan|jawapan|pilihan|penggunaan|strategi|ketepatan|sama ada|ayat)\b/iu.test(lower)
    || /\b(?:nilaikan|wajarkah|justifikasikan|tindakan terbaik|tindakan paling selamat|justify|evaluate|best action|safest action)\b/iu.test(lower)
    || /\b(?:pilih|manakah|antara)\b[^?]*(?:lebih|paling)\s+(?:tepat|sesuai|cekap|jelas|munasabah|selamat|gramatis|sopan|bertanggungjawab|jujur)\b/iu.test(lower)
    || /\b(?:pilih|tentukan).*(?:terbaik|paling sesuai).*(?:dan|serta).*(?:sebab|mengapa|bukti)\b/iu.test(lower)) {
    return { cognitiveLevel: 'menilai', evidence: 'evaluation_prompt' };
  }
  if (/\b(?:analisis|bandingkan|bezakan|rumuskan|bukti|kesimpulan|ramalkan|compare|analyse|analyze|conclusion)\b/iu.test(lower)
    || /\b(?:berikan|beri|give).*(?:sebab|reason)\b/iu.test(lower)
    || /\b(?:adakah|is).*(?:betul|tepat|correct).*(?:jelaskan|explain|sebab|reason)\b/iu.test(lower)) {
    return { cognitiveLevel: 'menganalisis', evidence: 'analysis_prompt' };
  }
  if (/\b(?:mengapakah|mengapa|jelaskan|terangkan|apakah maksud|apakah tujuan|apakah kebaikan|apakah kesan|bermaksud|menunjukkan|why|explain|meaning|purpose|benefit)\b/iu.test(lower)) {
    return { cognitiveLevel: 'memahami', evidence: 'understanding_prompt' };
  }
  if (/\bperkataan manakah (?:ialah|menunjukkan|menerangkan)\b/iu.test(lower)) {
    return { cognitiveLevel: 'memahami', evidence: 'concept_identification' };
  }
  if (/\b(?:which|choose|pick|select)\b.*\b(?:sentence|statement)\b/iu.test(lower)) {
    return { cognitiveLevel: 'memahami', evidence: 'sentence_interpretation' };
  }
  if (/_{2,}/u.test(stem)) {
    return { cognitiveLevel: 'mengaplikasi', evidence: 'contextual_completion' };
  }
  if (/\b(?:apakah tindakan|apakah yang perlu|apakah cara|bagaimanakah|jika|apabila|semasa|ketika|situasi|paling selamat|paling sesuai|gunakan|lengkapkan|susun|padankan|what should|what is the safest|how should|if|when)\b/iu.test(lower)) {
    return { cognitiveLevel: 'mengaplikasi', evidence: 'application_scenario' };
  }
  if (type === 'structured' || marks > 1) {
    return { cognitiveLevel: 'menganalisis', evidence: 'structured_response' };
  }
  return { cognitiveLevel: 'mengingat', evidence: 'direct_recall' };
}

function difficultyForEvidence(question = {}, cognitiveLevel = '', evidence = '') {
  const stem = normalizeText(question.q || question.question);
  const answer = normalizeText(question.answer || question.correctAnswer);
  const combined = `${stem} ${answer}`;
  const wordCount = stem.split(/\s+/u).filter(Boolean).length;
  const marks = Number(question.marks || 1);
  const multiStep = /\b(?:dan mengapa|dan jelaskan|serta berikan sebab|kemudian|sebelum.*selepas|dua langkah|two steps|and explain|give a reason)\b/iu.test(stem);

  if (['menilai', 'mencipta'].includes(cognitiveLevel)) return 'sukar';
  if (cognitiveLevel === 'menganalisis') return multiStep || marks > 1 || wordCount > 24 ? 'sukar' : 'sederhana';
  if (cognitiveLevel === 'mengaplikasi') {
    if (evidence === 'contextual_completion' && wordCount <= 7) return 'mudah';
    return 'sederhana';
  }
  if (cognitiveLevel === 'memahami') {
    const complexSpatialRelation = evidence === 'sentence_interpretation'
      && /\b(?:between|in front of|behind|above|opposite|beside)\b/iu.test(combined);
    return wordCount > 24 || evidence === 'structured_response' || complexSpatialRelation ? 'sederhana' : 'mudah';
  }
  return 'mudah';
}

export function inferQuestionDemand(question = {}) {
  const evidence = cognitiveEvidence(question);
  return {
    ...evidence,
    difficulty: difficultyForEvidence(question, evidence.cognitiveLevel, evidence.evidence)
  };
}

export function alignQuestionDemand(question = {}, options = {}) {
  const inferred = inferQuestionDemand(question);
  const originalCognitiveLevel = normalizeKey(question.cognitiveLevel || question.cognitive_level);
  const originalDifficulty = normalizeKey(question.difficulty);
  const forceCanonical = options.forceCanonical === true;
  const cognitiveRank = { mengingat: 0, memahami: 1, mengaplikasi: 2, menganalisis: 3, menilai: 4, mencipta: 5 };
  const explicitHigherDemand = ['analysis_prompt', 'evaluation_prompt', 'creation_prompt'].includes(inferred.evidence)
    && (cognitiveRank[inferred.cognitiveLevel] ?? 0) > (cognitiveRank[originalCognitiveLevel] ?? -1);
  const reviewedPresentationDemand = Boolean(question.presentationOriginalQuestion)
    && originalCognitiveLevel === 'mengingat'
    && ['memahami', 'mengaplikasi'].includes(inferred.cognitiveLevel);
  const preserveReviewedCognitive = question.demandReviewed === true && VALID_COGNITIVE_LEVELS.has(originalCognitiveLevel);
  const justifiedExistingEvaluation = originalCognitiveLevel === 'menilai'
    && /\b(?:tindakan terbaik|tindakan paling selamat|best action|safest action)\b/iu.test(normalizeText(question.q || question.question));
  const suspiciousCognitive = !preserveReviewedCognitive && !justifiedExistingEvaluation && ((
    ['menilai', 'menganalisis'].includes(originalCognitiveLevel) && inferred.cognitiveLevel !== originalCognitiveLevel
  ) || (
    originalCognitiveLevel === 'mengingat' && ['menganalisis', 'menilai', 'mencipta'].includes(inferred.cognitiveLevel)
  ) || explicitHigherDemand || reviewedPresentationDemand);
  const suspiciousDifficulty = (
    ['mudah', 'sederhana'].includes(originalDifficulty)
    && (
      ['menilai', 'mencipta'].includes(inferred.cognitiveLevel)
      || ['menilai', 'mencipta'].includes(originalCognitiveLevel)
    )
  ) || (
    originalDifficulty === 'mudah' && (
      ['menganalisis', 'menilai', 'mencipta'].includes(inferred.cognitiveLevel)
      || ['menganalisis', 'menilai', 'mencipta'].includes(originalCognitiveLevel)
    )
  ) || (
    originalDifficulty === 'sukar' && inferred.cognitiveLevel === 'mengingat'
  ) || (
    originalDifficulty === 'mudah' && /(?:multi_step|analysis|evaluation|creation)/u.test(inferred.evidence)
  ) || (
    originalDifficulty === 'mudah'
    && inferred.difficulty === 'sederhana'
    && ['contextual_completion', 'sentence_interpretation'].includes(inferred.evidence)
  );
  const cognitiveLevel = forceCanonical || !VALID_COGNITIVE_LEVELS.has(originalCognitiveLevel) || suspiciousCognitive
    ? inferred.cognitiveLevel
    : originalCognitiveLevel;
  const alignedDifficulty = difficultyForEvidence(question, cognitiveLevel, inferred.evidence);
  const difficulty = forceCanonical || !VALID_DIFFICULTIES.has(originalDifficulty) || suspiciousDifficulty
    ? alignedDifficulty
    : originalDifficulty;

  return {
    ...question,
    difficulty,
    cognitiveLevel,
    demandAudit: {
      originalDifficulty,
      originalCognitiveLevel,
      inferredDifficulty: inferred.difficulty,
      inferredCognitiveLevel: inferred.cognitiveLevel,
      evidence: inferred.evidence,
      difficultyAdjusted: Boolean(originalDifficulty && difficulty !== originalDifficulty),
      cognitiveAdjusted: Boolean(originalCognitiveLevel && cognitiveLevel !== originalCognitiveLevel),
      source: forceCanonical ? 'canonical-demand-rule' : 'canonical-mismatch-guard'
    }
  };
}
