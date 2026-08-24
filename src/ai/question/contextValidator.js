import { getContextGroupsForQuestion, hasArabicText, isProtectedIslamContext, isProtectedScienceContext } from './contextRegistry.js';

export function validateContextMappings(questions = []) {
  const issues = [];
  questions.forEach((question, index) => {
    const groups = getContextGroupsForQuestion(question);
    if (!groups.length) {
      issues.push({ severity: 'error', code: 'EMPTY_CONTEXT_GROUP', index, questionId: question.id || null });
    }
    const changed = question.qip?.originalContext && question.qip?.selectedContext && question.qip.originalContext !== question.qip.selectedContext;
    if (changed && isProtectedScienceContext(question) && /akar|daun|batang|air|cahaya|udara/i.test(question.qip?.contextVariant || '')) {
      issues.push({ severity: 'error', code: 'UNSAFE_SCIENCE_CONTEXT_CHANGE', index, questionId: question.id || null });
    }
    if (changed && isProtectedIslamContext(question) && /quran|hadis|doa|hukum|solat|wuduk|puasa|akidah/i.test(question.qip?.contextVariant || '')) {
      issues.push({ severity: 'error', code: 'UNSAFE_ISLAM_CONTEXT_CHANGE', index, questionId: question.id || null });
    }
    if (changed && hasArabicText(question.qip?.contextVariant || '')) {
      issues.push({ severity: 'error', code: 'UNSAFE_ARABIC_CONTEXT_CHANGE', index, questionId: question.id || null });
    }
  });
  return issues;
}
