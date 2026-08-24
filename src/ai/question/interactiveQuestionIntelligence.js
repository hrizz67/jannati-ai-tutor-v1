export const INTERACTIVE_INTELLIGENCE_VERSION = 1;

export const INTERACTION_RESPONSE_MODES = Object.freeze({
  imageChoice: 'visual_selection',
  dragDrop: 'classification',
  matching: 'pairing',
  ordering: 'sequencing',
  visualMath: 'visual_reasoning',
  fillBlank: 'completion',
  multiSelect: 'multiple_selection',
  hotspot: 'spatial_selection',
  clock: 'time_representation',
  money: 'value_construction',
  measurement: 'visual_measurement',
  textEntry: 'text_entry'
});

const DEFAULT_LOCKED_FIELDS = Object.freeze(['answer', 'accepted', 'interaction']);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toStringList(value) {
  return (Array.isArray(value) ? value : [])
    .map(item => String(item || '').trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('ms-MY')
    .replace(/\s+/g, ' ');
}

function acceptedAnswers(question = {}) {
  return [question.answer, ...(Array.isArray(question.accepted) ? question.accepted : [])]
    .map(normalizeText)
    .filter(Boolean);
}

function leaksAnswer(candidate, question = {}) {
  const text = normalizeText(candidate);
  if (!text) return true;
  return acceptedAnswers(question).some(answer => {
    const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u').test(text);
  });
}

export function resolveQuestionIntelligence(question = {}) {
  const authored = question.learningIntelligence && typeof question.learningIntelligence === 'object'
    ? question.learningIntelligence
    : {};
  const questionType = String(question.interaction?.type || authored.questionType || question.questionType || 'textEntry');
  const variantPolicy = authored.variantPolicy && typeof authored.variantPolicy === 'object'
    ? authored.variantPolicy
    : {};

  return {
    version: Number(authored.version) || INTERACTIVE_INTELLIGENCE_VERSION,
    questionType,
    responseMode: String(authored.responseMode || INTERACTION_RESPONSE_MODES[questionType] || INTERACTION_RESPONSE_MODES.textEntry),
    skillId: String(authored.skillId || question.skill || question.topicId || ''),
    conceptTags: toStringList(authored.conceptTags),
    misconceptionTags: toStringList(authored.misconceptionTags),
    masteryEligible: authored.masteryEligible !== false,
    weakTopicEligible: authored.weakTopicEligible !== false,
    hintSteps: toStringList(authored.hintSteps),
    variantPolicy: {
      enabled: variantPolicy.enabled === true,
      reviewStatus: String(variantPolicy.reviewStatus || 'review_required'),
      mutableFields: toStringList(variantPolicy.mutableFields),
      lockedFields: [...new Set([...DEFAULT_LOCKED_FIELDS, ...toStringList(variantPolicy.lockedFields)])]
    }
  };
}

export function buildPersonalizedHintPlan(question = {}, context = {}) {
  const intelligence = resolveQuestionIntelligence(question);
  const mastery = clamp(Number(context.mastery) || 0, 0, 100);
  const confidence = clamp(Number(context.confidence) || 0, 0, 100);
  const attemptNumber = Math.max(1, Math.floor(Number(context.attemptNumber) || 1));
  const requestedLevel = Number(context.hintLevel);
  const hintLevel = Number.isFinite(requestedLevel)
    ? clamp(Math.round(requestedLevel), 1, 3)
    : mastery < 50 || confidence < 50 || attemptNumber >= 3
      ? 3
      : mastery < 75 || confidence < 70 || attemptNumber === 2
        ? 2
        : 1;
  const safeSteps = intelligence.hintSteps.filter(step => !leaksAnswer(step, question));
  const hint = safeSteps[Math.min(hintLevel - 1, safeSteps.length - 1)]
    || (!leaksAnswer(question.hint, question) ? String(question.hint || '').trim() : '')
    || 'Perhatikan maklumat penting, buat satu langkah pada satu masa, kemudian semak pilihan kamu.';

  return {
    hint,
    hintLevel,
    source: safeSteps.length ? 'reviewed_interactive_scaffold' : 'safe_fallback',
    questionType: intelligence.questionType,
    responseMode: intelligence.responseMode,
    skillId: intelligence.skillId
  };
}

export function buildVariantReadiness(question = {}, context = {}) {
  const intelligence = resolveQuestionIntelligence(question);
  const policy = intelligence.variantPolicy;
  const approved = policy.enabled && policy.reviewStatus === 'approved' && policy.mutableFields.length > 0;
  return {
    canGenerate: approved,
    status: approved ? 'ready' : policy.reviewStatus,
    seed: Number.isFinite(Number(context.variationSeed)) ? Number(context.variationSeed) : null,
    mutableFields: [...policy.mutableFields],
    lockedFields: [...policy.lockedFields],
    reason: approved
      ? 'Variasi hanya boleh mengubah medan yang telah diluluskan.'
      : 'Variasi AI dikunci sehingga kandungan dan jawapan disemak oleh penggubal.'
  };
}

export function validateQuestionIntelligence(question = {}) {
  const authored = question.learningIntelligence;
  if (!authored) return ['missing_learning_intelligence'];
  const intelligence = resolveQuestionIntelligence(question);
  const issues = [];
  if (intelligence.version !== INTERACTIVE_INTELLIGENCE_VERSION) issues.push('unsupported_intelligence_version');
  if (!intelligence.skillId) issues.push('missing_skill_id');
  if (!intelligence.responseMode) issues.push('missing_response_mode');
  if (intelligence.conceptTags.length === 0) issues.push('missing_concept_tags');
  if (intelligence.misconceptionTags.length === 0) issues.push('missing_misconception_tags');
  if (intelligence.hintSteps.length < 2) issues.push('insufficient_hint_steps');
  if (intelligence.hintSteps.some(step => leaksAnswer(step, question))) issues.push('hint_leaks_answer');
  if (!['approved', 'review_required', 'locked'].includes(intelligence.variantPolicy.reviewStatus)) issues.push('invalid_variant_review_status');
  if (intelligence.variantPolicy.enabled && intelligence.variantPolicy.reviewStatus !== 'approved') issues.push('unapproved_variant_generation');
  return [...new Set(issues)];
}

export function summarizeQuestionIntelligence(questions = []) {
  const rows = (Array.isArray(questions) ? questions : []).map(resolveQuestionIntelligence);
  const countBy = key => rows.reduce((summary, row) => {
    const value = row[key] || 'unknown';
    summary[value] = (summary[value] || 0) + 1;
    return summary;
  }, {});
  return {
    total: rows.length,
    questionTypes: countBy('questionType'),
    responseModes: countBy('responseMode'),
    masteryEligible: rows.filter(row => row.masteryEligible).length,
    weakTopicEligible: rows.filter(row => row.weakTopicEligible).length,
    variantReady: rows.filter(row => row.variantPolicy.enabled && row.variantPolicy.reviewStatus === 'approved').length,
    variantReviewRequired: rows.filter(row => !row.variantPolicy.enabled || row.variantPolicy.reviewStatus !== 'approved').length
  };
}

export default {
  buildPersonalizedHintPlan,
  buildVariantReadiness,
  resolveQuestionIntelligence,
  summarizeQuestionIntelligence,
  validateQuestionIntelligence
};
