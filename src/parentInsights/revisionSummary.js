import { resolveParentProfile } from './insightsService.js';
import { buildSpacedRevisionSchedule } from '../ai/adaptive/spacedRevision.js';

export function buildRevisionSummary(profile = null, options = {}) {
  const nextProfile = resolveParentProfile(profile);
  if (!nextProfile) {
    return {
      generatedAt: new Date().toISOString(),
      upcomingReviewSchedule: [],
      overdueReviews: [],
      reviewPriorities: []
    };
  }
  const revision = buildSpacedRevisionSchedule(nextProfile, options);
  const schedule = Array.isArray(revision.schedule) ? revision.schedule : [];

  return {
    generatedAt: revision.generatedAt || new Date().toISOString(),
    upcomingReviewSchedule: schedule.filter(item => !item.isOverdue).slice(0, 10),
    overdueReviews: schedule.filter(item => item.isOverdue).slice(0, 10),
    reviewPriorities: schedule.slice(0, 10).map(item => ({
      subjectId: item.subjectId,
      topicId: item.topicId,
      priority: item.priority,
      reviewLevel: item.reviewLevel,
      nextReviewAt: item.nextReviewAt,
      overdueDays: item.overdueDays || 0
    }))
  };
}

export default {
  buildRevisionSummary
};
