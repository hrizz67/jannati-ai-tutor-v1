const VALID_DIFFICULTIES = new Set(['mudah', 'sederhana', 'sukar']);
const JAWI_OR_ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const MOJIBAKE = /(?:Ø.|Ù.|Ú.|Ã.|Â.|�)/u;
const FACTUAL_RISK_PATTERNS = [
  /meminta doa kepada selain/iu,
  /Wuduk dimulakan dengan membasuh tangan/iu,
  /Sujud dilakukan dengan meletakkan dahi ke lantai/iu,
  /Kebersihan ialah sebahagian daripada iman/iu,
  /Sebelum menyentuh mushaf, tangan hendaklah bersih/iu,
  /Iqamah dibaca sebelum memulakan solat berjemaah/iu,
  /چيقڬو/u
];

function normalizeText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/([؟?!])\./g, '$1').trim();
}

function normalizeKey(value = '') {
  return normalizeText(value).toLocaleLowerCase('ms-MY');
}

function normalizeDifficulty(value = '') {
  return ({ easy: 'mudah', medium: 'sederhana', hard: 'sukar' }[normalizeKey(value)] || normalizeKey(value) || 'mudah');
}

function inferQuestionType(record = {}) {
  if (record.questionType) return record.questionType;
  const options = record.options || record.choices || record.answerOptions;
  if (Array.isArray(options) && options.length >= 2) return 'objective';
  const stem = normalizeText(record.q || record.question);
  if (Number(record.marks || 1) > 1 || /(?:Jelaskan|Berikan sebab|Mengapakah|Adakah).*(?:\?|jelaskan)/iu.test(stem)) return 'structured';
  return /_{2,}/u.test(stem) ? 'fill_blank' : 'short_answer';
}

function inferCognitiveLevel(record = {}, context = {}) {
  if (record.cognitiveLevel) return record.cognitiveLevel;
  const stem = normalizeText(record.q || record.question);
  if (/Adakah.+(?:tepat|beradab|adil|mencontohi).*(?:Jelaskan|Mengapa)|Nilai/iu.test(stem)) return 'menilai';
  if (/Betulkan|Bandingkan|bezakan|bukti|kesilapan|Mengapakah/iu.test(stem)) return 'menganalisis';
  if (/Jika|Apabila|Ketika|Sebelum|Selepas|situasi|tindakan|Tulisan Jawi bagi/iu.test(stem)) return 'mengaplikasi';
  if (/bermaksud|menunjukkan|mengajar|mendidik|mengandungi|menandakan|hikmah|fungsi/iu.test(stem)) return 'memahami';
  if (context.topicId === 'jawi_perkataan' && Number(context.index) >= 33) return 'mengaplikasi';
  return 'mengingat';
}

function learningOutcomeFor(context = {}, cognitiveLevel = '') {
  const objectives = context.learningObjectives || [];
  if (!objectives.length) return '';
  const band = {
    mengingat: 0,
    memahami: Math.min(1, objectives.length - 1),
    mengaplikasi: objectives.length - 1,
    menganalisis: objectives.length - 1,
    menilai: objectives.length - 1
  }[cognitiveLevel] ?? 0;
  return objectives[band];
}

export function normalizeIslamQuestionRecord(record = {}, context = {}) {
  const override = context.questionOverrides?.[record.id] || {};
  const answerChanged = Object.prototype.hasOwnProperty.call(override, 'answer')
    && normalizeKey(override.answer) !== normalizeKey(record.answer);
  const next = { ...record, ...override };
  const stem = normalizeText(next.q || next.question);
  next.q = stem;
  next.question = stem;
  next.answer = normalizeText(next.answer);
  next.hint = normalizeText(next.hint);
  next.explanation = normalizeText(next.explanation);

  const acceptedSource = Array.isArray(override.accepted)
    ? override.accepted
    : answerChanged
      ? []
      : Array.isArray(next.accepted)
        ? next.accepted
        : Array.isArray(next.acceptedAnswers)
          ? next.acceptedAnswers
          : [];
  next.accepted = [...new Map(
    [next.answer, ...acceptedSource]
      .map(normalizeText)
      .filter(Boolean)
      .map(value => [normalizeKey(value), value])
  ).values()];
  if (Array.isArray(next.acceptedAnswers)) next.acceptedAnswers = [...next.accepted];

  next.difficulty = normalizeDifficulty(next.difficulty);
  next.questionType = inferQuestionType(next);
  next.cognitiveLevel = inferCognitiveLevel(next, context);
  next.marks = Number(next.marks || (next.questionType === 'structured' ? 2 : 1));
  next.estimatedTime = Number(next.estimatedTime || (next.questionType === 'structured' ? 90 : next.difficulty === 'sukar' ? 60 : 45));
  next.learningOutcome = normalizeText(next.learningOutcome || learningOutcomeFor(context, next.cognitiveLevel));
  next.assessmentFocus = normalizeText(next.assessmentFocus || context.topicTitle || context.topicId);
  return next;
}

export function normalizeIslamSubject(subject = {}, config = {}) {
  return {
    ...subject,
    topics: Array.isArray(subject.topics)
      ? subject.topics.map(topic => {
          const enrichment = config.topicEnrichments?.[topic.id] || {};
          const enrichedTopic = { ...topic, ...enrichment };
          return {
            ...enrichedTopic,
            questions: Array.isArray(topic.questions)
              ? topic.questions.map((question, index) => normalizeIslamQuestionRecord(question, {
                  topicId: topic.id,
                  topicTitle: topic.title,
                  index,
                  learningObjectives: enrichedTopic.learningObjectives,
                  questionOverrides: config.questionOverrides
                }))
              : topic.questions
          };
        })
      : subject.topics
  };
}

export function validateIslamQuestionRecord(question = {}, context = {}) {
  const issues = [];
  const stem = normalizeText(question.q || question.question);
  const answer = normalizeText(question.answer);
  const accepted = Array.isArray(question.accepted) ? question.accepted.map(normalizeKey) : [];
  const blankCount = (stem.match(/_{2,}/g) || []).length;
  const combined = [stem, answer, question.hint, question.explanation].map(normalizeText).join(' ');

  if (!question.id || !stem || !answer) issues.push('missing_core_field');
  if (normalizeText(question.q) !== normalizeText(question.question)) issues.push('q_question_mismatch');
  if (blankCount > 1) issues.push('invalid_response_prompt');
  if (!accepted.includes(normalizeKey(answer))) issues.push('answer_not_accepted');
  if (!question.hint || !question.explanation) issues.push('missing_learning_support');
  if (!question.questionType || !question.cognitiveLevel || !question.learningOutcome) issues.push('missing_learning_metadata');
  if (!VALID_DIFFICULTIES.has(normalizeKey(question.difficulty))) issues.push('invalid_difficulty');
  if (!Number.isFinite(Number(question.marks)) || Number(question.marks) < 1) issues.push('invalid_marks');
  if (!Number.isFinite(Number(question.estimatedTime)) || Number(question.estimatedTime) < 1) issues.push('invalid_estimated_time');
  if (FACTUAL_RISK_PATTERNS.some(pattern => pattern.test(combined))) issues.push('factual_risk_pattern');
  if (MOJIBAKE.test(combined)) issues.push('mojibake');
  if (['jawi', 'jawi_perkataan'].includes(context.topicId) && !JAWI_OR_ARABIC.test(`${stem} ${answer} ${question.jawiText || ''}`)) issues.push('missing_jawi_target');
  if (/[؟?!]\./u.test(question.explanation || '')) issues.push('double_punctuation');
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

export default {
  normalizeIslamQuestionRecord,
  normalizeIslamSubject,
  validateIslamQuestionRecord
};
