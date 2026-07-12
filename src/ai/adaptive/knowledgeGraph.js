import { MASTERY_STATUS } from './masteryEngine';
import { getSubjectPrerequisites } from './curriculumGraph';
import { formatTopicName } from '../../utils/displayFormatter';

function topicKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

export function buildKnowledgeGraph(subjects = []) {
  const nodes = {};
  const edges = [];

  (subjects || []).forEach(subject => {
    const prerequisites = getSubjectPrerequisites(subject);
    (subject?.topics || []).forEach(topic => {
      const key = topicKey(subject.id, topic.id);
      nodes[key] = {
        key,
        subjectId: subject.id,
        subject: subject.short || subject.title,
        topicId: topic.id,
        title: topic.title,
        prerequisites: prerequisites[topic.id] || []
      };
      (prerequisites[topic.id] || []).forEach(prerequisiteId => {
        edges.push({
          from: topicKey(subject.id, prerequisiteId),
          to: key,
          subjectId: subject.id
        });
      });
    });
  });

  return { nodes, edges };
}

export function getPrerequisites(subject = {}, topicId) {
  return getSubjectPrerequisites(subject)[topicId] || [];
}

export function isTopicMastered(topicMastery = {}, subjectId, topicId) {
  return topicMastery?.[topicKey(subjectId, topicId)]?.status === MASTERY_STATUS.MASTERED;
}

export function getBlockedPrerequisites(subject = {}, topicId, topicMastery = {}) {
  return getPrerequisites(subject, topicId).filter(prerequisiteId => {
    return !isTopicMastered(topicMastery, subject.id, prerequisiteId);
  });
}

export function isTopicUnlockedByGraph(subject = {}, topicId, topicMastery = {}) {
  return getBlockedPrerequisites(subject, topicId, topicMastery).length === 0;
}

export function listBlockedTopics(subjects = [], topicMastery = {}) {
  return (subjects || []).flatMap(subject => (subject?.topics || []).map(topic => {
    const blockedBy = getBlockedPrerequisites(subject, topic.id, topicMastery);
    return {
      subjectId: subject.id,
      subject: subject.short || subject.title,
      topicId: topic.id,
      title: topic.title,
      blockedBy
    };
  })).filter(topic => topic.blockedBy.length);
}

export function getDependencyArrow(subject = {}, topicId) {
  const prerequisites = getPrerequisites(subject, topicId);
  if (!prerequisites.length) return '';
  return `${prerequisites.map(formatTopicName).join(' + ')} → ${formatTopicName(topicId)}`;
}
