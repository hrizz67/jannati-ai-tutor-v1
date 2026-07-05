import { STEM_PATTERNS } from './stemPatterns.js';

function textOf(question = {}) {
  return `${question.q || question.question || ''} ${question.topicTitle || ''} ${question.topic || ''}`.toLowerCase();
}

export function getStemVariationGroup(question = {}) {
  const text = textOf(question);
  const subjectId = question.subjectId || question.qip?.metadata?.subject || '';
  if (subjectId === 'arab') return 'arabic_verified';
  if (subjectId === 'islam') return 'islam_safe_recall';
  if (subjectId === 'math' || /[+\-−x×÷=]|\bhitung\b|\bkira\b|\bjumlah\b/.test(text)) return 'math_calculation';
  if (/kata kerja|verb/.test(text)) return 'verb_identification';
  if (/kata nama|noun/.test(text)) return 'noun_identification';
  if (/kata adjektif|adjective/.test(text)) return 'adjective_identification';
  if (/tempat kosong|blank|________/.test(text)) return 'fill_blank';
  if (/petikan|passage|read/.test(text)) return 'reading_comprehension';
  if (/audio|dengar|listen/.test(text)) return 'listening_comprehension';
  if (/fungsi|kegunaan|akar|daun|batang|function/.test(text)) return 'science_function';
  if (Array.isArray(question.options) || Array.isArray(question.choices)) return 'multiple_choice';
  return 'choose_correct_answer';
}

export function getStemPatternSet(question = {}) {
  const variationGroup = getStemVariationGroup(question);
  return {
    variationGroup,
    patterns: STEM_PATTERNS[variationGroup] || []
  };
}
