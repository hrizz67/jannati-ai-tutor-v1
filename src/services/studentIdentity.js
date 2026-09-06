export const LEGACY_STUDENT_ID = 'default';

function cleanId(value = '') {
  return String(value || '').trim();
}

function firstExplicitId(values = []) {
  return values
    .map(cleanId)
    .find(value => value && value !== LEGACY_STUDENT_ID) || '';
}

export function getLearningStorageScope(input = {}) {
  const profile = input?.profile && typeof input.profile === 'object' ? input.profile : {};
  const childId = firstExplicitId([
    input.childId,
    input.studentId,
    profile.childId,
    profile.studentId
  ]);
  const accountId = firstExplicitId([
    input.accountId,
    profile.accountId
  ]) || 'guest';
  const studentId = childId || LEGACY_STUDENT_ID;

  return Object.freeze({
    accountId,
    childId,
    studentId,
    explicit: Boolean(childId),
    legacyFallback: !childId,
    scopeKey: `${encodeURIComponent(accountId)}::${encodeURIComponent(studentId)}`
  });
}

export function stampLearningIdentity(record = {}, identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  const source = record && typeof record === 'object' && !Array.isArray(record) ? record : {};
  return {
    ...source,
    accountId: identity.accountId,
    childId: identity.childId || LEGACY_STUDENT_ID,
    studentId: identity.studentId,
    learningScope: identity.scopeKey
  };
}

export function getLearningIdentityMismatch(record = {}, identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  if (!identity.explicit || !record || typeof record !== 'object' || Array.isArray(record)) return '';
  const declaredChildId = firstExplicitId([record.childId, record.studentId]);
  if (declaredChildId && declaredChildId !== identity.childId) return 'child-scope-mismatch';
  const declaredAccountId = firstExplicitId([record.accountId]);
  if (declaredAccountId && declaredAccountId !== identity.accountId) return 'account-scope-mismatch';
  return '';
}

export function createTutorConversationScope(identityInput = {}, context = {}) {
  const identity = getLearningStorageScope(identityInput);
  return [
    identity.accountId,
    identity.studentId,
    cleanId(context.subjectId) || 'general',
    cleanId(context.topicId) || 'general',
    cleanId(context.sessionId) || 'general-session',
    cleanId(context.questionId) || 'general-question'
  ].map(value => encodeURIComponent(value)).join('::');
}

export function createChildLineageId(childId = '') {
  const stableId = cleanId(childId);
  return stableId ? `lineage:${stableId}` : '';
}

export function getStableChildIdentity(profile = {}) {
  return cleanId(profile.lineageId)
    || createChildLineageId(firstExplicitId([profile.id, profile.childId, profile.studentId]));
}

export default {
  LEGACY_STUDENT_ID,
  createChildLineageId,
  createTutorConversationScope,
  getLearningIdentityMismatch,
  getLearningStorageScope,
  getStableChildIdentity,
  stampLearningIdentity
};
