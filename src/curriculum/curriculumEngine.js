import { estimatedTimeFor, inferSKSP } from './skspEngine.js';

export function normalizeQuestionMetadata({ subject = {}, topic = {}, topicIndex = 0, question = {}, questionIndex = 0 } = {}) {
  const sksp = inferSKSP({ subject, topic, topicIndex, question, questionIndex });

  return {
    questionId: question.id,
    subjectId: subject.id,
    subject: subject.short || subject.title,
    topicId: topic.id,
    topic: topic.title,
    SK: sksp.sk,
    SP: sksp.sp,
    strand: sksp.strand,
    skspSource: sksp.source || 'inferred',
    skspVerified: Boolean(sksp.verified),
    UASA: question.UASA || question.uasa || topic.UASA || topic.uasa || 'Practice',
    difficulty: question.difficulty || topic.difficulty || 'mudah',
    estimatedTime: estimatedTimeFor(question)
  };
}

export function buildCurriculumRows(subjects = []) {
  return (subjects || []).flatMap(subject => (subject?.topics || []).flatMap((topic, topicIndex) => {
    return (topic.questions || []).map((question, questionIndex) => normalizeQuestionMetadata({
      subject,
      topic,
      topicIndex,
      question,
      questionIndex
    }));
  }));
}

export function buildTeacherPortalSnapshot(subjects = [], coverage = {}) {
  return {
    generatedAt: new Date().toISOString(),
    subjects: subjects.map(subject => ({
      id: subject.id,
      title: subject.title,
      topics: subject.topics?.length || 0,
      questions: subject.topics?.reduce((sum, topic) => sum + (topic.questions?.length || 0), 0) || 0
    })),
    coverageSummary: coverage.summary || {},
    skSpRows: coverage.skSpMastery || []
  };
}
