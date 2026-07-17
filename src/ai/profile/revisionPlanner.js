import { getWeakTopics, getStrongTopics, getStudentProfileSummary } from './progressAnalyzer.js';
import { getMistakeContext } from '../mistakes/index.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function subjectLabel(topic = {}) {
  return topic.subjectTitle || topic.subjectId || 'Subjek';
}

function topicLabel(topic = {}) {
  return topic.topicTitle || topic.topicId || 'Topik';
}

function allocateMinutes(index, totalTopics) {
  if (totalTopics <= 1) return 15;
  if (index === 0) return 15;
  if (index === 1) return 10;
  return 5;
}

function buildSubjectBuckets(topics = []) {
  const buckets = new Map();
  topics.forEach(topic => {
    const key = topic.subjectId || 'unknown';
    if (!buckets.has(key)) {
      buckets.set(key, {
        subjectId: topic.subjectId || '',
        subjectTitle: subjectLabel(topic),
        topics: []
      });
    }
    buckets.get(key).topics.push(topic);
  });
  return Array.from(buckets.values());
}

export function generateRevisionPlan(studentId = 'default', options = {}, profile = null) {
  const summary = getStudentProfileSummary(studentId, profile);
  const weakTopics = getWeakTopics(studentId, Math.max(3, toNumber(options.limit, 6)), profile);
  const strongTopics = getStrongTopics(studentId, 3, profile);
  const mistakeContext = getMistakeContext(profile || summary, '', '');
  const selectedTopics = weakTopics.length ? weakTopics : strongTopics.slice(0, Math.max(1, Math.min(3, strongTopics.length)));
  const groupedSubjects = buildSubjectBuckets(selectedTopics);
  const totalMinutes = groupedSubjects.reduce((sum, subject, subjectIndex) => {
    return sum + Math.max(5, groupedSubjects[subjectIndex].topics.length * 5);
  }, 0) || Math.max(10, selectedTopics.length * 5);

  const subjects = groupedSubjects.map((subject, subjectIndex) => {
    const topicCount = subject.topics.length;
    const baseMinutes = allocateMinutes(subjectIndex, groupedSubjects.length) + Math.max(0, (topicCount - 1) * 3);
    return {
      subjectId: subject.subjectId,
      subjectTitle: subject.subjectTitle,
      minutes: baseMinutes,
      focus: subjectIndex === 0 ? 'Weak' : topicCount > 1 ? 'Revision' : 'Practice',
      topics: subject.topics.slice(0, 3).map((topic, topicIndex) => ({
        subjectId: topic.subjectId,
        topicId: topic.topicId,
        title: topicLabel(topic),
        minutes: allocateMinutes(topicIndex, topicCount),
        confidence: topic.confidence,
        accuracy: topic.accuracy,
        status: topic.status,
        statusLabel: topic.statusLabel,
        lastPractised: topic.lastPractised
      })),
      note: subjectIndex === 0
        ? `Mulakan dengan topik yang paling lemah dan ulang ${mistakeContext.focusMistake === 'UNKNOWN_MISTAKE' ? 'langkah asas' : 'kesilapan yang berulang'}.`
        : 'Teruskan ulang kaji secara ringkas.'
    };
  });

  const focusTopic = selectedTopics[0] || null;

  return {
    studentId: summary.studentId || studentId || 'default',
    generatedAt: new Date().toISOString(),
    title: 'Hari Ini',
    totalMinutes,
    subjects,
    focusTopic,
    summary: subjects.length
      ? `Hari ini, fokus pada ${subjectLabel(focusTopic)} dan topik yang masih perlukan latihan.`
      : 'Belum cukup data untuk pelan ulang kaji.',
    strongTopics: strongTopics.slice(0, 3)
  };
}

export function summarizeRevisionPlan(studentId = 'default', profile = null) {
  return generateRevisionPlan(studentId, {}, profile);
}

export default {
  generateRevisionPlan,
  summarizeRevisionPlan
};
