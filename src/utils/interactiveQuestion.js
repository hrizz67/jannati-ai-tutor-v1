import { hasSingleAcceptedOption } from './acceptedAnswers.js';

export const INTERACTIVE_QUESTION_TYPES = Object.freeze([
  'choice',
  'imageChoice',
  'dragDrop',
  'matching',
  'ordering',
  'visualMath',
  'fillBlank',
  'multiSelect',
  'hotspot',
  'clock',
  'money',
  'measurement'
]);

function hasUniqueIds(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  const ids = rows.map(row => String(row?.id || '').trim());
  return ids.every(Boolean) && new Set(ids).size === ids.length;
}

export function validateInteractiveQuestionConfig(config = {}) {
  const issues = [];
  if (Number(config.version) !== 1) issues.push('unsupported_version');
  if (!INTERACTIVE_QUESTION_TYPES.includes(config.type)) issues.push('unsupported_type');
  if (!String(config.instruction || '').trim()) issues.push('missing_instruction');

  if (['choice', 'imageChoice', 'visualMath', 'fillBlank', 'multiSelect', 'clock', 'measurement'].includes(config.type)) {
    if (!hasUniqueIds(config.options) || config.options.length < 2) issues.push('invalid_options');
    if ((config.options || []).some(option => !String(option?.label || '').trim() || !String(option?.value ?? '').trim())) {
      issues.push('invalid_option_content');
    }
  }

  if (config.type === 'fillBlank' && (!Array.isArray(config.sentenceParts) || config.sentenceParts.length !== 2)) {
    issues.push('invalid_sentence_parts');
  }

  if (config.type === 'multiSelect') {
    const optionIds = new Set((config.options || []).map(option => option.id));
    if (!Array.isArray(config.correctOptionIds)
      || config.correctOptionIds.length < 2
      || new Set(config.correctOptionIds).size !== config.correctOptionIds.length
      || config.correctOptionIds.some(id => !optionIds.has(id))) {
      issues.push('invalid_multi_select_answers');
    }
  }

  if (config.type === 'hotspot') {
    if (!hasUniqueIds(config.hotspots) || config.hotspots.length < 2) issues.push('invalid_hotspots');
    if (!config.visual || !String(config.visual.kind || '').trim()) issues.push('invalid_visual');
    if (!(config.hotspots || []).some(hotspot => hotspot.id === config.correctHotspotId)) issues.push('invalid_hotspot_answer');
    if ((config.hotspots || []).some(hotspot => !String(hotspot.label || '').trim()
      || !String(hotspot.value ?? '').trim()
      || !Number.isFinite(Number(hotspot.x))
      || !Number.isFinite(Number(hotspot.y)))) issues.push('invalid_hotspot_content');
  }

  if (config.type === 'clock' && (config.options || []).some(option => option.visual?.kind !== 'clock'
    || !Number.isFinite(Number(option.visual?.hour))
    || !Number.isFinite(Number(option.visual?.minute)))) {
    issues.push('invalid_clock_options');
  }

  if (config.type === 'money') {
    if (!hasUniqueIds(config.denominations) || config.denominations.length < 2) issues.push('invalid_denominations');
    if (!Number.isInteger(Number(config.targetSen)) || Number(config.targetSen) <= 0) issues.push('invalid_money_target');
    if ((config.denominations || []).some(row => !String(row.label || '').trim()
      || !Number.isInteger(Number(row.valueSen))
      || Number(row.valueSen) <= 0)) issues.push('invalid_denomination_content');
  }

  if (config.type === 'measurement' && (!config.visual || !String(config.visual.kind || '').trim())) {
    issues.push('invalid_measurement_visual');
  }

  if (config.type === 'dragDrop') {
    if (!hasUniqueIds(config.items) || config.items.length < 2) issues.push('invalid_items');
    if (!hasUniqueIds(config.zones) || config.zones.length < 2) issues.push('invalid_zones');
    const itemIds = new Set((config.items || []).map(item => item.id));
    const assignedIds = (config.zones || []).flatMap(zone => zone.acceptedItemIds || []);
    if (assignedIds.length !== itemIds.size || new Set(assignedIds).size !== itemIds.size || assignedIds.some(id => !itemIds.has(id))) {
      issues.push('invalid_zone_answers');
    }
  }

  if (config.type === 'matching') {
    if (!hasUniqueIds(config.items) || config.items.length < 2) issues.push('invalid_items');
    if (!hasUniqueIds(config.targets) || config.targets.length < 2) issues.push('invalid_targets');
    const targetIds = new Set((config.targets || []).map(target => target.id));
    if ((config.items || []).some(item => !targetIds.has(item.targetId))) issues.push('invalid_matches');
  }

  if (config.type === 'ordering') {
    if (!hasUniqueIds(config.items) || config.items.length < 2) issues.push('invalid_items');
    const itemIds = (config.items || []).map(item => item.id);
    if (!Array.isArray(config.correctOrder)
      || config.correctOrder.length !== itemIds.length
      || new Set(config.correctOrder).size !== itemIds.length
      || config.correctOrder.some(id => !itemIds.includes(id))) {
      issues.push('invalid_correct_order');
    }
  }

  if (config.type === 'visualMath' && (!config.visual || !String(config.visual.kind || '').trim())) {
    issues.push('invalid_visual');
  }

  return [...new Set(issues)];
}

export function getInteractiveQuestionConfig(question = {}) {
  const config = question?.interaction;
  if (config && validateInteractiveQuestionConfig(config).length === 0) return config;
  return deriveChoiceInteraction(question);
}

function normalizeChoiceValue(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('ms-MY')
    .replace(/\s+/g, ' ');
}

function normalizeChoiceOption(option, index) {
  if (option && typeof option === 'object' && !Array.isArray(option)) {
    const label = String(option.label ?? option.text ?? option.value ?? '').trim();
    const value = String(option.value ?? label).trim();
    return {
      id: String(option.id || `choice-${index + 1}`),
      label,
      value,
      ...(option.visual ? { visual: option.visual } : {})
    };
  }
  const value = String(option ?? '').trim();
  return { id: `choice-${index + 1}`, label: value, value };
}

export function deriveChoiceInteraction(question = {}) {
  if (question?.interaction || !Array.isArray(question?.options)) return null;
  if (question.options.length < 2 || question.options.length > 6) return null;

  const options = question.options.map(normalizeChoiceOption);
  const optionValues = options.map(option => normalizeChoiceValue(option.value));
  if (optionValues.some(value => !value) || new Set(optionValues).size !== optionValues.length) return null;

  if (!hasSingleAcceptedOption(question)) return null;

  const config = {
    version: 1,
    type: 'choice',
    instruction: String(question.interactionInstruction || 'Pilih satu jawapan yang betul.'),
    options
  };
  return validateInteractiveQuestionConfig(config).length === 0 ? config : null;
}

export function isInteractiveQuestion(question = {}) {
  return Boolean(getInteractiveQuestionConfig(question));
}

const RICH_INTERACTIVE_PRIORITY_TYPES = new Set([
  'dragDrop',
  'matching',
  'ordering',
  'visualMath',
  'multiSelect',
  'hotspot',
  'clock',
  'money',
  'measurement'
]);

export function prioritizeInteractiveQuestions(questions = []) {
  const ordered = Array.isArray(questions) ? [...questions] : [];
  const richReviewedIndex = ordered.findIndex(question => question?.interaction
    && RICH_INTERACTIVE_PRIORITY_TYPES.has(question.interaction.type)
    && isInteractiveQuestion(question));
  const reviewedIndex = richReviewedIndex >= 0
    ? richReviewedIndex
    : ordered.findIndex(question => question?.interaction && isInteractiveQuestion(question));
  const interactiveIndex = reviewedIndex >= 0 ? reviewedIndex : ordered.findIndex(isInteractiveQuestion);
  if (interactiveIndex <= 0) return ordered;
  const [interactiveQuestion] = ordered.splice(interactiveIndex, 1);
  return [interactiveQuestion, ...ordered];
}

export function serializeDragDropResponse(config, assignments = {}) {
  if (!config || (config.items || []).some(item => !assignments[item.id])) return '';
  return (config.zones || []).map(zone => {
    const labels = (config.items || [])
      .filter(item => assignments[item.id] === zone.id)
      .map(item => String(item.responseLabel || item.label || '').toLowerCase());
    return `${zone.responseLabel || zone.label}: ${labels.join(', ')}`;
  }).join('; ');
}

export function serializeMatchingResponse(config, matches = {}) {
  if (!config || (config.items || []).some(item => !matches[item.id])) return '';
  const targetById = new Map((config.targets || []).map(target => [target.id, target]));
  return (config.items || []).map(item => {
    const target = targetById.get(matches[item.id]);
    return `${String(item.responseLabel || item.label || '').toLowerCase()}-${String(target?.responseLabel || target?.label || '').toLowerCase()}`;
  }).join(', ');
}

export function serializeOrderingResponse(config, orderedIds = []) {
  if (!config || orderedIds.length !== (config.items || []).length) return '';
  const itemById = new Map((config.items || []).map(item => [item.id, item]));
  const sentence = orderedIds
    .map(id => itemById.get(id)?.responseLabel || itemById.get(id)?.label || '')
    .join(config.responseSeparator || ' ')
    .trim();
  return sentence ? `${sentence}${config.responseSuffix || ''}` : '';
}

export function serializeMultiSelectResponse(config, selectedIds = []) {
  if (!config || !Array.isArray(selectedIds) || selectedIds.length === 0) return '';
  const selected = new Set(selectedIds);
  return (config.options || [])
    .filter(option => selected.has(option.id))
    .map(option => String(option.value ?? option.label ?? '').trim())
    .filter(Boolean)
    .join(config.responseJoiner || ', ');
}

export function serializeMoneyResponse(totalSen = 0) {
  const normalizedTotal = Math.max(0, Math.round(Number(totalSen) || 0));
  if (!normalizedTotal) return '';
  return `RM ${(normalizedTotal / 100).toFixed(2)}`;
}
