import skspMapping from './sksp-mapping.json' with { type: 'json' };

function cleanCode(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function getMappedSKSP(subjectId, topicId) {
  return skspMapping.subjects?.[subjectId]?.topics?.[topicId] || null;
}

export function inferSKSP({ subject = {}, topic = {}, topicIndex = 0, question = {}, questionIndex = 0 } = {}) {
  const subjectCode = cleanCode(subject.short || subject.id || 'SUBJECT');
  const topicCode = cleanCode(topic.id || topic.title || `TOPIC_${topicIndex + 1}`);
  const band = Math.floor(questionIndex / 10) + 1;
  const mapped = getMappedSKSP(subject.id, topic.id);
  const sk = question.SK || question.sk || topic.SK || topic.sk || mapped?.SK || mapped?.sk || `${subjectCode}.SK.${topicIndex + 1}`;
  const sp = question.SP || question.sp || topic.SP || topic.sp || mapped?.SP || mapped?.sp || `${subjectCode}.SP.${topicIndex + 1}.${band}`;

  return {
    sk,
    sp,
    strand: question.strand || topic.strand || mapped?.strand || topic.title || topicCode,
    source: question.SK || question.sk || topic.SK || topic.sk ? 'content' : mapped ? 'mapping' : 'inferred',
    verified: Boolean(mapped?.verified)
  };
}

export function estimatedTimeFor(question = {}) {
  if (question.estimatedTime || question.estimated_time) return question.estimatedTime || question.estimated_time;
  const difficulty = String(question.difficulty || '').toLowerCase();
  if (difficulty.includes('sukar') || difficulty.includes('hard')) return 90;
  if (difficulty.includes('sederhana') || difficulty.includes('medium')) return 60;
  return 40;
}
