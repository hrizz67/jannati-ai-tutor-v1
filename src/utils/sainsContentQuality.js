const ROBOTIC_SAINS_STEM = /(?:Dalam topik .+jawab berdasarkan petunjuk|Soalan Sains .+Petunjuknya ialah|Baca petunjuk|Latihan .+\d+:|\(Set \d+\))/i;
const VAGUE_RELATION_STEM = /berkaitan dengan\s+_{2,}/i;
const UNSAFE_CHILD_ACTION = /Api kecil boleh dipadamkan dengan|Ketika menggunakan soket elektrik|Ketika menggunakan wayar rosak|Ketika menggunakan lampu rosak/i;
const UNDERDETERMINED_STEM = /(?:memerlukan\s+_{2,}\s+untuk terus hidup|mempunyai (?:sifat|ciri)\s+_{2,})/i;
const OPEN_ENDED_FOOD_STEM = /(?:mendapat|memperoleh).*tenaga.*(?:daripada|dengan memakan)\s+_{2,}/i;

function normalizeText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value = '') {
  return normalizeText(value).toLocaleLowerCase('ms-MY');
}

function inferSainsQuestionType(record = {}) {
  if (record.questionType) return record.questionType;
  const options = record.options || record.choices || record.answerOptions;
  if (Array.isArray(options) && options.length >= 2) return 'objective';
  const stem = normalizeText(record.q || record.question);
  if (/\b(?:susun|atur)\b.*\b(?:urutan|langkah|peringkat)\b/i.test(stem)) return 'ordering';
  if (Number(record.marks || 1) > 1 || /\b(?:jelaskan|terangkan|cadangkan|berikan sebab)\b/i.test(stem)) return 'structured';
  return 'short_answer';
}

function inferSainsCognitiveLevel(record = {}, context = {}) {
  if (record.cognitiveLevel) return record.cognitiveLevel;
  const stem = normalizeText(record.q || record.question);
  if (/\b(?:tindakan paling selamat|tindakan terbaik|paling sesuai|wajarkah)\b/i.test(stem)) return 'menilai';
  if (/\b(?:berdasarkan pemerhatian|bandingkan|kesimpulan|persamaan dan perbezaan|apakah kesan|mengapakah)\b/i.test(stem)) return 'menganalisis';
  if (/\b(?:jika|apabila|semasa|ketika|untuk keselamatan|sesuai|perlu|membantu|mengurangkan|mengelakkan)\b/i.test(stem)) return 'mengaplikasi';
  if (/\b(?:berfungsi|bermaksud|menunjukkan|menghasilkan|memerlukan|membenarkan|menghalang|berubah|membesar)\b/i.test(stem)) return 'memahami';
  if (context.topicId === 'kemahiran_saintifik' && Number(context.index) >= 30) return 'menganalisis';
  const difficulty = normalizeKey(record.difficulty);
  if (difficulty === 'sukar') return 'mengaplikasi';
  if (difficulty === 'sederhana') return 'memahami';
  return 'mengingat';
}

export function normalizeSainsQuestionRecord(record = {}, context = {}) {
  const override = context.questionOverrides?.[record.id] || {};
  const answerChanged = Object.prototype.hasOwnProperty.call(override, 'answer')
    && normalizeKey(override.answer) !== normalizeKey(record.answer);
  const next = { ...record, ...override };
  const stem = normalizeText(next.q || next.question);
  next.q = stem;
  next.question = stem;
  next.answer = normalizeText(next.answer);

  const acceptedSource = Array.isArray(override.accepted)
    ? override.accepted
    : answerChanged
      ? []
      : Array.isArray(record.accepted)
        ? record.accepted
        : [];
  next.accepted = [...new Map(
    [next.answer, ...acceptedSource]
      .map(normalizeText)
      .filter(Boolean)
      .map(value => [normalizeKey(value), value])
  ).values()];
  next.questionType = inferSainsQuestionType(next);
  next.cognitiveLevel = inferSainsCognitiveLevel(next, context);
  return next;
}

export function normalizeSainsSubject(subject = {}, config = {}) {
  return {
    ...subject,
    icon: subject.icon === 'ðŸ”¬' ? '🔬' : subject.icon,
    topics: Array.isArray(subject.topics)
      ? subject.topics.map(topic => ({
          ...topic,
          ...(config.topicEnrichments?.[topic.id] || {}),
          questions: Array.isArray(topic.questions)
            ? topic.questions.map((question, index) => normalizeSainsQuestionRecord(question, {
                topicId: topic.id,
                index,
                questionOverrides: config.questionOverrides
              }))
            : topic.questions
        }))
      : subject.topics
  };
}

export function validateSainsQuestionRecord(question = {}) {
  const issues = [];
  const stem = normalizeText(question.q || question.question);
  const answer = normalizeText(question.answer);
  const accepted = Array.isArray(question.accepted) ? question.accepted.map(normalizeKey) : [];
  if (!question.id || !stem || !answer) issues.push('missing_core_field');
  if (normalizeText(question.q) !== normalizeText(question.question)) issues.push('q_question_mismatch');
  if ((stem.match(/_{2,}/g) || []).length !== 1) issues.push('invalid_blank_count');
  if (!accepted.includes(normalizeKey(answer))) issues.push('answer_not_accepted');
  if (!question.hint || !question.explanation) issues.push('missing_learning_support');
  if (!question.questionType || !question.cognitiveLevel) issues.push('missing_learning_metadata');
  if (ROBOTIC_SAINS_STEM.test(stem)) issues.push('robotic_instruction');
  if (VAGUE_RELATION_STEM.test(stem)) issues.push('vague_relation_stem');
  if (UNSAFE_CHILD_ACTION.test(stem)) issues.push('unsafe_child_action');
  if (UNDERDETERMINED_STEM.test(stem)) issues.push('underdetermined_stem');
  if (OPEN_ENDED_FOOD_STEM.test(stem)) issues.push('open_ended_food_stem');
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

export default {
  normalizeSainsQuestionRecord,
  normalizeSainsSubject,
  validateSainsQuestionRecord
};
