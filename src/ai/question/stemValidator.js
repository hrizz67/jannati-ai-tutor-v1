import { normalizeStem } from '../diversity/duplicateDetector.js';
import { STEM_VARIATION_GROUPS, STEM_PATTERNS } from './stemPatterns.js';
import { buildStemVariants } from './stemEngine.js';
import { getStemVariationGroup } from './stemRegistry.js';

function nearIdentical(a = '', b = '') {
  const left = normalizeStem(a);
  const right = normalizeStem(b);
  if (!left || !right || left === right) return left === right;
  return left.includes(right) || right.includes(left);
}

export function validateStemMappings(questions = []) {
  const issues = [];
  const usedGroups = new Set();
  questions.forEach((question, index) => {
    const variationGroup = getStemVariationGroup(question);
    usedGroups.add(variationGroup);
    const { variants } = buildStemVariants(question);
    if (!STEM_VARIATION_GROUPS.includes(variationGroup)) {
      issues.push({ severity: 'error', code: 'BROKEN_STEM_GROUP', index, questionId: question.id || null, variationGroup });
    }
    if (!variants.length) {
      issues.push({ severity: 'error', code: 'EMPTY_STEM_VARIANTS', index, questionId: question.id || null, variationGroup });
    }
    variants.forEach((variant, variantIndex) => {
      variants.slice(variantIndex + 1).forEach(other => {
        if (nearIdentical(variant, other)) {
          issues.push({ severity: 'info', code: 'NEAR_IDENTICAL_STEM', index, questionId: question.id || null, variationGroup });
        }
      });
    });
  });
  const unusedVariationGroups = STEM_VARIATION_GROUPS.filter(group => !usedGroups.has(group) && (STEM_PATTERNS[group] || []).length);
  return { issues, unusedVariationGroups };
}
