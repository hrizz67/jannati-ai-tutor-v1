import {
  LEGACY_CURRICULUM_ID,
  LEGACY_STUDENT_YEAR,
  requireCurriculumBank
} from '../config/curriculumBankCatalog.js';
import { createTutorConversationScope } from './studentIdentity.js';

function requiredId(value, label) {
  const id = String(value ?? '').trim();
  if (!id) throw new Error(`Missing ${label} for year-scoped learning state.`);
  return id;
}

function isLegacyYearTwo(bank) {
  return bank.year === LEGACY_STUDENT_YEAR
    && bank.curriculumId === LEGACY_CURRICULUM_ID;
}

// Preserve original Year 2 progress IDs. Future years use an unambiguous
// curriculum+year prefix so scores never leak across grades/curriculum editions.
export function createYearScopedProgressKey({ year, curriculumId, subjectId, topicId } = {}) {
  const explicitYear = requiredId(year, 'year');
  const bank = requireCurriculumBank({ year: explicitYear, curriculumId });
  const subject = requiredId(subjectId, 'subjectId');
  const topic = requiredId(topicId, 'topicId');
  if (isLegacyYearTwo(bank)) return `${subject}_${topic}`;
  return ['m1', 'progress', bank.curriculumId, bank.year, subject, topic]
    .map(encodeURIComponent).join('::');
}

// Keep historical Year 2 Tutor session keys unchanged. A future year gets an
// explicit year/curriculum suffix in addition to child/subject/question scope.
export function createYearScopedTutorConversationScope(identity = {}, context = {}) {
  const explicitYear = requiredId(context.year, 'year');
  const bank = requireCurriculumBank({ year: explicitYear, curriculumId: context.curriculumId });
  const existingScope = createTutorConversationScope(identity, context);
  if (isLegacyYearTwo(bank)) return existingScope;
  return `${existingScope}::${['m1', bank.curriculumId, bank.year].map(encodeURIComponent).join('::')}`;
}
