import { MASTERY_STATUS } from './masteryEngine';
import { getBlockedPrerequisites, isTopicUnlockedByGraph, listBlockedTopics } from './knowledgeGraph';

function topicKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function firstQuestionId(topic = {}) {
  return topic.questions?.[0]?.id || null;
}

function toLesson(subject, topic, mastery, reason) {
  if (!subject || !topic) return null;
  return {
    subjectId: subject.id,
    subject: subject.short || subject.title,
    topicId: topic.id,
    title: topic.title,
    questionId: firstQuestionId(topic),
    masteryStatus: mastery?.status || MASTERY_STATUS.NOT_STARTED,
    masteryScore: mastery?.masteryScore || 0,
    reason
  };
}

function rankLesson(candidate) {
  const status = candidate.mastery?.status || MASTERY_STATUS.NOT_STARTED;
  let score = 30;
  if (status === MASTERY_STATUS.NEEDS_PRACTICE) score += 60;
  if (status === MASTERY_STATUS.LEARNING) score += 38;
  if (status === MASTERY_STATUS.NOT_STARTED) score += 24;
  if (status === MASTERY_STATUS.MASTERED) score -= 35;
  score += 100 - (candidate.mastery?.masteryScore || 0);
  score -= candidate.index * 2;
  return score;
}

export function buildLessonPlan({ subjects = [], topicMastery = {} } = {}) {
  const blockedTopics = listBlockedTopics(subjects, topicMastery);
  const candidates = (subjects || []).flatMap(subject => (subject?.topics || []).map((topic, index) => {
    const mastery = topicMastery[topicKey(subject.id, topic.id)];
    return {
      subject,
      topic,
      mastery,
      index,
      blockedBy: getBlockedPrerequisites(subject, topic.id, topicMastery),
      unlocked: isTopicUnlockedByGraph(subject, topic.id, topicMastery)
    };
  })).filter(candidate => candidate.unlocked);

  const activeCandidates = candidates
    .filter(candidate => candidate.mastery?.status !== MASTERY_STATUS.MASTERED)
    .sort((a, b) => rankLesson(b) - rankLesson(a));
  const masteredReview = candidates
    .filter(candidate => candidate.mastery?.status === MASTERY_STATUS.MASTERED)
    .sort((a, b) => (a.mastery?.nextReviewDate || '').localeCompare(b.mastery?.nextReviewDate || ''));

  const todayCandidate = activeCandidates[0] || masteredReview[0] || candidates[0];
  const nextCandidate = activeCandidates.find(candidate => {
    return candidate.subject.id !== todayCandidate?.subject.id || candidate.topic.id !== todayCandidate?.topic.id;
  }) || activeCandidates[1] || masteredReview[0] || null;
  const reviewCandidate = activeCandidates.find(candidate => candidate.mastery?.status === MASTERY_STATUS.NEEDS_PRACTICE) || masteredReview[0] || null;

  const todayLesson = toLesson(
    todayCandidate?.subject,
    todayCandidate?.topic,
    todayCandidate?.mastery,
    'Topik ini dipilih kerana syarat terdahulu telah lengkap dan ia masih memerlukan perhatian.'
  );
  const nextLesson = toLesson(
    nextCandidate?.subject,
    nextCandidate?.topic,
    nextCandidate?.mastery,
    'Topik seterusnya yang terbuka selepas pelajaran hari ini.'
  );
  const recommendedReview = toLesson(
    reviewCandidate?.subject,
    reviewCandidate?.topic,
    reviewCandidate?.mastery,
    'Cadangan ulang kaji berdasarkan tahap penguasaan dan masa ulang kaji.'
  );

  const reason = todayLesson
    ? `Latihan ini dipilih berdasarkan tahap penguasaan, sejarah pembelajaran dan keseimbangan topik.`
    : 'Tiada pelajaran tersedia kerana semua topik yang kelihatan masih dikunci atau tidak tersedia.';

  return {
    todayLesson,
    nextLesson,
    blockedTopics: blockedTopics.slice(0, 12),
    recommendedReview,
    reason
  };
}
