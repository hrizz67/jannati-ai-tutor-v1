import { loadKnowledge, primeKnowledgePack } from './loader/knowledgeLoader.js';
import { sanitizeAiText } from '../../learningCopy.js';
import { getStudentProfileSummary, getTopicProgress } from '../../profile/index.js';
import { getMistakeContext } from '../../mistakes/index.js';
import {
  asKnowledgeArray,
  collectPrioritizedKnowledgeText,
  dedupeKnowledgeText,
  rotateKnowledgeList,
  selectKnowledgeText,
  toKnowledgeText
} from './knowledgeText.js';

function rotated(pack, field, key) {
  return rotateKnowledgeList(dedupeKnowledgeText(toKnowledgeText(pack[field])), key);
}

function buildTutorKnowledgeData(pack, subjectId, topicId, question = {}, studentId = '', suppliedStudentProfile = null) {
  const questionIdentity = question?.id || question?.questionId || question?.q || question?.question || 'current';
  const scopedStudentId = String(studentId || '').trim();
  const hasScopedProfile = Boolean(
    scopedStudentId &&
    scopedStudentId !== 'default' &&
    suppliedStudentProfile &&
    typeof suppliedStudentProfile === 'object'
  );
  const contextKey = `${scopedStudentId || 'unscoped'}:${subjectId}:${topicId}:${questionIdentity}`;
  const studentProfile = hasScopedProfile
    ? getStudentProfileSummary(scopedStudentId, suppliedStudentProfile)
    : null;
  const topicStatus = studentProfile
    ? getTopicProgress(scopedStudentId, subjectId, topicId, studentProfile)?.status || 'new'
    : 'new';
  const mistakeContext = studentProfile ? getMistakeContext(studentProfile, subjectId, topicId) : null;
  const teacherExplanation = selectKnowledgeText(dedupeKnowledgeText([
    ...asKnowledgeArray(pack.teacherExplanation),
    ...asKnowledgeArray(pack.explanations),
    ...toKnowledgeText(pack.simpleExplanation)
  ]), `${subjectId}:${topicId}:teacherExplanation`);
  const questionStem = sanitizeAiText(question?.question || question?.q || question?.text || 'soalan ini');
  const explanation = sanitizeAiText(
    pack.simpleExplanation || teacherExplanation || question?.explanation || question?.hint ||
    `Mari teliti ${questionStem} dan pilih jawapan yang sepadan dengan arahan.`
  );
  const profileHint = topicStatus === 'mastered'
    ? 'Kamu sudah kuat dalam topik ini. Kita fokus pada kefahaman ringkas dan semak semula.'
    : topicStatus === 'weak'
      ? 'Topik ini masih perlukan latihan. Baca perlahan-lahan dan ikut langkah kecil.'
      : '';
  const mistakeHint = mistakeContext?.repeatedMistakes > 1
    ? 'Nampaknya kesilapan yang sama sering berulang. Cuba ikut satu langkah pada satu masa.'
    : '';
  const hint = selectKnowledgeText(dedupeKnowledgeText([
    ...toKnowledgeText(pack.tips),
    ...toKnowledgeText(pack.memoryTips),
    ...toKnowledgeText(pack.commonMistakes)
  ]), `${subjectId}:${topicId}:hint`) || sanitizeAiText(question?.hint || 'Cari kata kunci penting dalam soalan.');

  return {
    source: 'knowledge',
    teacherExplanation,
    explanation: teacherExplanation || explanation,
    simpleExplanation: [explanation, profileHint, mistakeHint].filter(Boolean).join(' ').trim() || explanation,
    hint: [hint, profileHint, mistakeHint].filter(Boolean).join(' ').trim() || hint,
    examples: rotateKnowledgeList(collectPrioritizedKnowledgeText(pack, subjectId), `${contextKey}:examples`),
    extraExamples: rotated(pack, 'extraExamples', `${contextKey}:extraExamples`),
    memoryTips: rotated(pack, 'memoryTips', `${contextKey}:memoryTips`),
    commonMistakes: rotated(pack, 'commonMistakes', `${contextKey}:commonMistakes`),
    followUpQuestions: rotated(pack, 'followUpQuestions', `${contextKey}:followUpQuestions`),
    workedExamples: rotated(pack, 'workedExamples', `${subjectId}:${topicId}:workedExamples`),
    packLoaded: true
  };
}

export async function fetchTutorKnowledgeData({ subjectId, topicId, question = {}, studentId = '', studentProfile = null } = {}) {
  if (!subjectId || !topicId) return null;
  try {
    const pack = await loadKnowledge(subjectId, topicId);
    if (!pack?.subjectId) return null;
    primeKnowledgePack(subjectId, topicId, pack);
    return buildTutorKnowledgeData(pack, subjectId, topicId, question, studentId, studentProfile);
  } catch {
    return null;
  }
}

export default { fetchTutorKnowledgeData };
