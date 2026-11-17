import {
  LEGACY_CURRICULUM_ID,
  LEGACY_STUDENT_YEAR,
  requireCurriculumBank
} from '../config/curriculumBankCatalog.js';
import {
  createYearScopedProgressKey,
  createYearScopedTutorConversationScope
} from './yearScopedLearningKeys.js';

const MAX_TUTOR_SCOPE_LENGTH = 320;

function id(value, label) {
  if (typeof value !== 'string') throw new Error('Missing explicit ' + label);
  const cleaned = value.trim();
  if (!cleaned || cleaned === 'default') throw new Error('Missing explicit ' + label);
  return cleaned;
}

function bankFor(selection = {}) {
  return requireCurriculumBank({
    year: id(selection.year, 'year'),
    curriculumId: id(selection.curriculumId, 'curriculumId')
  });
}

function legacy(bank) {
  return bank.year === LEGACY_STUDENT_YEAR && bank.curriculumId === LEGACY_CURRICULUM_ID;
}

function scopedIdentity(selection) {
  return {
    accountId: id(selection.accountId, 'accountId'),
    childId: id(selection.childId, 'childId')
  };
}

function scopeParts(parts) {
  return parts.map(part => encodeURIComponent(part)).join('::');
}

/**
 * Pure migration-planning policy: year 2 exact key parity, and future keys
 * incorporate account+child+year+edition. No runtime store imports this file.
 */
export function planYearScopedProgressKey(selection = {}) {
  const bank = bankFor(selection);
  const subjectId = id(selection.subjectId, 'subjectId');
  const topicId = id(selection.topicId, 'topicId');
  const legacyOrFuture = createYearScopedProgressKey({
    year: bank.year, curriculumId: bank.curriculumId, subjectId, topicId
  });
  if (legacy(bank)) return legacyOrFuture;
  const identity = scopedIdentity(selection);
  return scopeParts(['m1', 'account-progress', identity.accountId, identity.childId, legacyOrFuture]);
}

/**
 * New-year Tutor conversations require fully explicit account/child/subject
 * and question-scoped identity, including session token, before planning.
 * Historical Year 2 keys remain unchanged byte-for-byte.
 */
export function planYearScopedTutorScope(identity = {}, context = {}) {
  const bank = bankFor(context);
  if (!legacy(bank)) {
    scopedIdentity(identity);
    for (const field of ['subjectId', 'topicId', 'sessionId', 'questionId']) {
      id(context[field], field);
    }
  }
  const scope = createYearScopedTutorConversationScope(identity, {
    ...context, year: bank.year, curriculumId: bank.curriculumId
  });
  if (!legacy(bank) && scope.length > MAX_TUTOR_SCOPE_LENGTH) {
    throw new Error('Future Tutor scope exceeds memory guard');
  }
  return scope;
}

/**
 * Reward credits are NOT issued here. New years get disjoint idempotency
 * keys so two editions cannot suppress or double-credit the same event.
 */
export function planYearScopedRewardEventKey(selection = {}) {
  const bank = bankFor(selection);
  const eventKey = id(selection.eventKey, 'eventKey');
  if (legacy(bank)) return eventKey;
  const identity = scopedIdentity(selection);
  return scopeParts([
    'm1', 'reward', bank.curriculumId, bank.year,
    identity.accountId, identity.childId, eventKey
  ]);
}
