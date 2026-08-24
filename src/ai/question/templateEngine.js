import { templateSignature } from '../diversity/duplicateDetector.js';

export function getTemplateId(question = {}) {
  return question.qip?.templateId || question.qde?.templateId || question.templateId || question.id || templateSignature(question);
}

export function applyTemplateIntelligence(question = {}, session = {}) {
  const templateId = getTemplateId(question);
  session.usedTemplates?.add(templateId);
  return {
    ...question,
    qip: {
      ...(question.qip || {}),
      templateId,
      templateVariant: question.qde?.templateUsed || question.q || ''
    }
  };
}
