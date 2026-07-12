import { buildConstraints, detectNumberProfile, detectOperation, NUMBER_PROFILES } from './numberRegistry.js';
import { equationSignature, extractNumbers, generateCandidate, hashText, pairBucket, pairSignature, patternGroup, replaceFirstNumbers } from './numberPatterns.js';
import { validateNumberCandidate } from './numberValidator.js';
import { createNumberAnalytics, recordSelection, summarizeNumberAnalytics } from './numberAnalytics.js';

function legacy(question = {}) {
  return {
    ...question,
    qip: {
      ...(question.qip || {}),
      numberEngine: {
        enabled: false,
        selectionReason: 'Enjin nombor soalan dilumpuhkan; nombor lama dikekalkan'
      }
    }
  };
}

function createNumberMemory(options = {}) {
  const history = options.memory?.qipHistory?.numbers || {};
  return {
    pairs: new Set((history.pairs || []).slice(0, 50).map((item) => String(item))),
    equations: new Set((history.equations || []).slice(0, 30).map((item) => String(item))),
    reuseCounts: new Map(),
    pairMeta: new Map(),
    equationMeta: new Map(),
    patternMeta: new Map()
  };
}

function getMemoryWeight(metaMap, key, selectionIndex) {
  const meta = metaMap.get(key);
  if (!meta) return 0;
  const age = Math.max(0, selectionIndex - (meta.lastSeenIndex || 0));
  return (meta.count || 0) * Math.exp(-age / 6);
}

function normalizeStemValue(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function isStructuredNumberTopic(question = {}) {
  const topic = String(question.topicId || question.qip?.metadata?.topic || '').toLowerCase();
  const text = `${question.q || question.question || ''} ${question.hint || ''} ${question.explanation || ''}`.toLowerCase();
  if (topic.includes('nombor') || topic.includes('sequence') || topic.includes('pattern')) return true;
  return /nombor selepas|nombor sebelum|nilai digit|paling kecil|paling besar|nilai tempat|ratus|puluh|sa\b/.test(text);
}

function computeExpectedAnswer(operation, values = []) {
  const [a, b] = values.map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (operation === 'add') return a + b;
  if (operation === 'subtract') return a - b;
  if (operation === 'multiply') return a * b;
  if (operation === 'divide') return b !== 0 ? a / b : null;
  return null;
}

function getRepeatedAdditionPattern(text = '') {
  return String(text || '').match(/(\d+(?:\s*\+\s*\d+){2,}\s*=\s*_{2,})/);
}

function renderRepeatedAdditionStem(text = '', values = []) {
  const [term, repeatCount] = values.map(Number);
  if (!Number.isInteger(term) || !Number.isInteger(repeatCount) || term < 0 || repeatCount < 1) return null;

  const source = String(text || '');
  const match = getRepeatedAdditionPattern(source);
  if (!match) return null;

  const renderedExpression = repeatCount === 1
    ? `${term} x 1 = ________`
    : `${Array.from({ length: repeatCount }, () => String(term)).join(' + ')} = ________`;
  return source.replace(match[0], renderedExpression);
}

function renderQuestionText(text = '', operation, values = []) {
  if (operation === 'multiply') {
    const repeatedAdditionText = renderRepeatedAdditionStem(text, values);
    if (repeatedAdditionText) return repeatedAdditionText;
  }

  return replaceFirstNumbers(text, values);
}

function buildExplanation(text = '', operation, values = [], answer = '') {
  const [first, second] = values.map(Number);
  if (operation === 'multiply' && second >= 2 && getRepeatedAdditionPattern(text)) {
    return `${first} ditambah ${second} kali menjadi ${answer}.`;
  }

  const operator = operation === 'add' ? '+' : operation === 'subtract' ? '-' : operation === 'multiply' ? 'x' : '÷';
  return `${first} ${operator} ${second} = ${answer}.`;
}

function remember(memory, operation, values, selectionIndex = 0) {
  const pair = pairSignature(values);
  const equation = equationSignature(operation, values);
  const pattern = patternGroup(operation, values);

  memory.pairs.add(pair);
  memory.equations.add(equation);

  while (memory.pairs.size > 50) {
    memory.pairs.delete(memory.pairs.values().next().value);
  }

  while (memory.equations.size > 30) {
    memory.equations.delete(memory.equations.values().next().value);
  }

  const pairMeta = memory.pairMeta.get(pair) || { count: 0, lastSeenIndex: -1 };
  pairMeta.count += 1;
  pairMeta.lastSeenIndex = selectionIndex;
  memory.pairMeta.set(pair, pairMeta);

  const equationMeta = memory.equationMeta.get(equation) || { count: 0, lastSeenIndex: -1 };
  equationMeta.count += 1;
  equationMeta.lastSeenIndex = selectionIndex;
  memory.equationMeta.set(equation, equationMeta);

  const patternMeta = memory.patternMeta.get(pattern) || { count: 0, lastSeenIndex: -1 };
  patternMeta.count += 1;
  patternMeta.lastSeenIndex = selectionIndex;
  memory.patternMeta.set(pattern, patternMeta);

  memory.reuseCounts.set(pair, (memory.reuseCounts.get(pair) || 0) + 1);
}

function canSafelyRotate(question = {}, operation, numbers = []) {
  if (question.subjectId && question.subjectId !== 'math') return false;
  if (!['add', 'subtract', 'multiply', 'divide'].includes(operation)) return false;
  if (numbers.length < 2) return false;
  if (!/^\d+$/.test(String(question.answer || ''))) return false;
  const explicitProfile = question.numberProfile || question.profileId || question.profile || question.qip?.metadata?.numberProfile || question.qip?.metadata?.profileId;
  if (!explicitProfile && isStructuredNumberTopic(question)) return false;
  return true;
}

function resolveProfile(question = {}) {
  const requestedProfile = question.numberProfile || question.profileId || question.profile || question.qip?.metadata?.numberProfile || question.qip?.metadata?.profileId;
  if (typeof requestedProfile === 'string' && NUMBER_PROFILES[requestedProfile]) {
    return NUMBER_PROFILES[requestedProfile];
  }

  if (requestedProfile && typeof requestedProfile === 'object' && requestedProfile.id) {
    return requestedProfile;
  }

  return detectNumberProfile(question);
}

function scoreCandidate(candidate, context = {}) {
  const {
    constraints = {},
    memory = {},
    analytics = {},
    recentPatternGroups = [],
    recentBuckets = [],
    operation = 'add',
    selectionIndex = 0
  } = context;

  const min = Number(constraints.min ?? 0);
  const max = Number(constraints.max ?? 100);
  const pair = pairSignature(candidate.values || []);
  const equation = equationSignature(candidate.operation || operation, candidate.values || []);
  const pattern = patternGroup(candidate.operation || operation, candidate.values || []);
  const bucket = pairBucket(candidate.values || [], min, max);

  const recentPairs = new Set((analytics.entries || []).slice(-20).map((entry) => pairSignature(entry.values || [])));
  const recentEquations = new Set((analytics.entries || []).slice(-20).map((entry) => equationSignature(entry.operation || operation, entry.values || [])));
  const recentPatternSet = new Set(recentPatternGroups);

  const pairRecentlySeen = memory.pairs?.has(pair) || recentPairs.has(pair);
  const equationRecentlySeen = memory.equations?.has(equation) || recentEquations.has(equation);
  const patternRecentlySeen = recentPatternSet.has(pattern);
  const bucketRecentlySeen = recentBuckets.includes(bucket);

  const pairReusePenalty = getMemoryWeight(memory.pairMeta, pair, selectionIndex);
  const equationReusePenalty = getMemoryWeight(memory.equationMeta, equation, selectionIndex);
  const patternReusePenalty = getMemoryWeight(memory.patternMeta, pattern, selectionIndex);

  const reuseCount = memory.reuseCounts?.get(pair) || 0;
  const historyValues = (analytics.entries || []).flatMap((entry) => entry.values || []);
  const uniqueHistoryValues = new Set(historyValues);
  const novelty = (candidate.values || []).filter((value) => !uniqueHistoryValues.has(value)).length;

  const spread = Math.abs((candidate.values[0] || 0) - (candidate.values[1] || 0));
  const bucketUsage = analytics.bucketUsage?.get(bucket) || 0;

  let score = 0;
  const reasons = [];

  if (!pairRecentlySeen) {
    score += 12;
    reasons.push('pair-fresh');
  } else {
    score -= 8 + pairReusePenalty;
    reasons.push('pair-recent');
  }

  if (!equationRecentlySeen) {
    score += 12;
    reasons.push('equation-fresh');
  } else {
    score -= 8 + equationReusePenalty;
    reasons.push('equation-recent');
  }

  if (!patternRecentlySeen) {
    score += 6;
    reasons.push('pattern-fresh');
  } else {
    score -= 6 + patternReusePenalty;
    reasons.push('pattern-recent');
  }

  score += Math.max(0, 5 - bucketUsage);
  if (!bucketRecentlySeen) {
    score += 4;
    reasons.push('bucket-fresh');
  } else {
    score -= 3;
    reasons.push('bucket-recent');
  }

  score += Math.min(4, novelty * 2);
  score += Math.min(3, Math.floor(spread / 10));
  score -= reuseCount * 1.5;

  const explorationScore = (pairRecentlySeen ? 0 : 6) + (equationRecentlySeen ? 0 : 6) + (patternRecentlySeen ? 0 : 4) + (bucketRecentlySeen ? 0 : 3) + Math.min(4, novelty);

  return {
    score,
    explorationScore,
    reasons,
    pair,
    equation,
    pattern,
    bucket,
    reuseCount,
    memoryDecayPenalty: pairReusePenalty + equationReusePenalty + patternReusePenalty
  };
}

export function applyNumberIntelligence(question = {}, session = {}, options = {}) {
  if (options.featureFlags?.QUESTION_NUMBER_ENGINE !== true) return legacy(question);

  const originalText = question.q || question.question || '';
  const originalNumbers = extractNumbers(originalText).map((item) => item.value);
  const requestedProfile = resolveProfile(question);
  const operation = question.operation || question.qde?.operation || detectOperation(question);
  const profile = requestedProfile || detectNumberProfile(question);

  const requestedDifficulty = question.difficulty || question.qip?.metadata?.difficulty || question.qip?.difficulty;
  const fallbackDifficulty = requestedDifficulty || (
    ['addition_100', 'subtraction_100', 'money', 'time', 'length', 'mass'].includes(profile?.id)
      ? 'sederhana'
      : 'mudah'
  );

  const constraints = buildConstraints({
    ...question,
    difficulty: fallbackDifficulty
  }, profile);

  const memory = session.numberMemory || createNumberMemory(options);
  const analytics = session.numberAnalytics || createNumberAnalytics();
  session.numberMemory = memory;
  session.numberAnalytics = analytics;

  if (!profile || !canSafelyRotate(question, operation, originalNumbers)) {
    return {
      ...question,
      qip: {
        ...(question.qip || {}),
        numberEngine: {
          enabled: true,
          originalNumbers,
          selectedNumbers: originalNumbers,
          patternGroup: 'lama',
          difficultyProfile: constraints.difficultyProfile,
          selectionReason: 'Tiada corak nombor Tahap 2 yang selamat ditemui',
          reuseCount: 0,
          numberDiversityScore: 100
        }
      }
    };
  }

  const seed = hashText(`${question.id || originalText}:${session.index || 0}:${options.sessionSeed || 0}`);
  const recentPatternGroups = (analytics.entries || []).slice(-6).map((entry) => entry.patternGroup);
  const recentBuckets = (analytics.entries || []).slice(-8).map((entry) => entry.bucketLabel).filter(Boolean);
  const selectionIndex = session.selectionCount || 0;
  const protectedStems = new Set(session.protectedStems || []);
  const originalStem = normalizeStemValue(originalText);
  if (originalStem) protectedStems.delete(originalStem);

  let selected = null;
  let selectionReason = 'No candidate generated';
  let validCandidates = [];
  let selectedCandidateMetadata = null;
  let explorationUsed = false;

  for (let attempt = 0; attempt < 140; attempt += 1) {
    const candidate = generateCandidate(seed, attempt, constraints, {
      sessionIndex: session.index || 0,
      recentPatternGroups,
      memory
    });

    if (!candidate) continue;

    const candidateText = renderQuestionText(originalText, operation, candidate.values);
    const candidateStem = normalizeStemValue(candidateText);
    if (candidateStem && protectedStems.has(candidateStem)) continue;

    const validation = validateNumberCandidate(candidate, {
      constraints,
      memory,
      operation,
      recentPatternGroups
    });

    if (validation.ok) {
      const candidatePatternGroup = patternGroup(operation, candidate.values);
      if (recentPatternGroups.slice(-3).includes(candidatePatternGroup) && attempt < 120) {
        continue;
      }

      const scoredCandidate = scoreCandidate(candidate, {
        constraints,
        memory,
        analytics,
        recentPatternGroups,
        recentBuckets,
        operation,
        selectionIndex
      });

      validCandidates.push({
        candidate,
        score: scoredCandidate.score,
        explorationScore: scoredCandidate.explorationScore,
        reasons: scoredCandidate.reasons,
        attempt,
        scoreMetadata: scoredCandidate
      });
    } else {
      selectionReason = validation.issues.join(', ');
    }
  }

  const shouldExplore = (selectionIndex % 7 === 0) || validCandidates.every((item) => item.score <= 6);

  if (validCandidates.length > 0) {
    const sortedCandidates = validCandidates
      .slice()
      .sort((left, right) => {
        const leftScore = shouldExplore ? left.explorationScore : left.score;
        const rightScore = shouldExplore ? right.explorationScore : right.score;
        return rightScore - leftScore || left.attempt - right.attempt;
      });

    for (const candidateRow of sortedCandidates) {
      const expected = computeExpectedAnswer(operation, candidateRow.candidate.values || []);
      if (expected === null || expected !== Number(candidateRow.candidate.answer)) {
        continue;
      }
      selected = candidateRow.candidate;
      selectedCandidateMetadata = candidateRow.scoreMetadata;
      selectionReason = candidateRow.reasons.join(', ') || 'Highest-scoring valid candidate selected';
      explorationUsed = shouldExplore;
      break;
    }
  }

  if (!selected) {
    const fallbackCandidate = generateCandidate(seed, 999, constraints, {
      sessionIndex: session.index || 0,
      recentPatternGroups,
      memory
    });

    if (fallbackCandidate) {
      const fallbackValidation = validateNumberCandidate(fallbackCandidate, {
        constraints,
        memory,
        operation,
        recentPatternGroups: []
      });

      if (fallbackValidation.ok) {
        selected = fallbackCandidate;
        selectionReason = 'Fallback candidate accepted';
        selectedCandidateMetadata = {
          score: 0,
          explorationScore: 0,
          reasons: ['fallback'],
          bucket: pairBucket(fallbackCandidate.values || [], constraints.min || 0, constraints.max || 100),
          reuseCount: 0,
          memoryDecayPenalty: 0
        };
      }
    }
  }

  const selectedExpected = computeExpectedAnswer(operation, selected?.values || []);
  if (selectedExpected === null || selectedExpected !== Number(selected?.answer)) {
    return {
      ...question,
      qip: {
        ...(question.qip || {}),
        numberEngine: {
          enabled: true,
          originalNumbers,
          selectedNumbers: originalNumbers,
          patternGroup: 'lama',
          difficultyProfile: constraints.difficultyProfile,
          selectionReason: 'Tidak sepadan dengan integriti; calon ditolak dan nombor lama dikekalkan',
          reuseCount: 0,
          numberDiversityScore: 100
        }
      }
    };
  }

  if (!selected) {
    return {
      ...question,
      qip: {
        ...(question.qip || {}),
        numberEngine: {
          enabled: true,
          originalNumbers,
          selectedNumbers: originalNumbers,
          patternGroup: 'lama',
          difficultyProfile: constraints.difficultyProfile,
          selectionReason: `Nombor lama dikekalkan: ${selectionReason}`,
          reuseCount: 0,
          numberDiversityScore: 100
        }
      }
    };
  }

  const selectedNumbers = selected.values;
  const nextText = renderQuestionText(originalText, operation, selectedNumbers);
  const pair = pairSignature(selectedNumbers);
  const reuseCount = memory.reuseCounts.get(pair) || 0;
  const selectedPattern = patternGroup(operation, selectedNumbers);
  const selectedBucket = pairBucket(selectedNumbers, constraints.min || 0, constraints.max || 100);

  session.selectionCount = (session.selectionCount || 0) + 1;
  remember(memory, operation, selectedNumbers, session.selectionCount);

  const analyticsSnapshot = recordSelection(analytics, {
    operation,
    values: selectedNumbers,
    answer: selected.answer,
    patternGroup: selectedPattern,
    profileId: constraints.profileId,
    difficultyProfile: constraints.difficultyProfile,
    reuseCount,
    carry: constraints.allowCarry === true && ((selectedNumbers[0] % 10) + (selectedNumbers[1] % 10) >= 10),
    borrow: constraints.allowBorrow === true && ((selectedNumbers[0] % 10) < (selectedNumbers[1] % 10)),
    score: selectedCandidateMetadata?.score || 0,
    bucketLabel: selectedBucket,
    candidateCount: validCandidates.length,
    explorationUsed,
    memoryDecayPenalty: selectedCandidateMetadata?.memoryDecayPenalty || 0
  });

  const analyticsSummary = summarizeNumberAnalytics(analytics);

  return {
    ...question,
    q: nextText,
    answer: String(selected.answer),
    accepted: [String(selected.answer)],
    explanation: buildExplanation(originalText, operation, selectedNumbers, selected.answer),
    qip: {
      ...(question.qip || {}),
      originalNumbers,
      selectedNumbers,
      numberPatternGroup: selectedPattern,
      numberDifficultyProfile: constraints.difficultyProfile,
      numberSelectionReason: selectionReason,
      numberReuseCount: reuseCount,
      numberDiversityScore: analyticsSummary.numberDiversity * 100,
      numberEngine: {
        enabled: true,
        originalNumbers,
        selectedNumbers,
        operation,
        profile: profile.id,
        patternGroup: selectedPattern,
        difficultyProfile: constraints.difficultyProfile,
        selectionReason,
        reuseCount,
        numberDiversityScore: analyticsSummary.numberDiversity * 100,
        constraints,
        analytics: analyticsSummary,
        debug: {
          originalNumbers,
          selectedNumbers,
          patternGroup: selectedPattern,
          bucket: selectedBucket,
          candidateCount: validCandidates.length,
          topCandidateScores: validCandidates
            .slice()
            .sort((left, right) => (shouldExplore ? right.explorationScore : right.score) - (shouldExplore ? left.explorationScore : left.score))
            .slice(0, 5)
            .map((entry) => ({
              score: shouldExplore ? entry.explorationScore : entry.score,
              attempt: entry.attempt,
              bucket: entry.scoreMetadata?.bucket || pairBucket(entry.candidate.values || [], constraints.min || 0, constraints.max || 100),
              pattern: patternGroup(operation, entry.candidate.values || [])
            })),
          chosenBucket: selectedBucket,
          chosenPattern: selectedPattern,
          reasonSelected: selectionReason,
          explorationUsed
        }
      }
    }
  };
}

export function applyNumberIntelligenceToSession(questions = [], options = {}) {
  const session = {
    numberMemory: createNumberMemory(options),
    numberAnalytics: createNumberAnalytics(),
    protectedStems: new Set(questions.map((question) => normalizeStemValue(question.q || question.question || question.stem || '')))
  };

  return questions.map((question, index) => {
    const originalStem = normalizeStemValue(question.q || question.question || question.stem || '');
    if (originalStem) session.protectedStems.delete(originalStem);
    const enhanced = applyNumberIntelligence(question, { ...session, index }, options);
    const finalStem = normalizeStemValue(enhanced.q || enhanced.question || enhanced.stem || '');
    if (finalStem) session.protectedStems.add(finalStem);
    return enhanced;
  });
}
