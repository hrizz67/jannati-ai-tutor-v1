// Year 2 Arabic vocabulary: only the *visible* active word-meaning question
// may authorize this bounded, local teaching scaffold. No generated examples
// and no inference from unrelated topic notes or prior quiz answers.
function normalizeArabic(value = '') {
  return String(value || '').normalize('NFKD')
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/gu, '');
}

const BEGIN_TEACHING = /^(?:(?:ابدأ|لنبدأ)\s+(?:بالشرح|بالتفسير)|اشرح\s+لي)[.!?؟]*$/u;
const MISUNDERSTANDING = /^(?:(?:لا|لم)\s+أفهم|ما\s+فهمت|أنا\s+محتار)[.!?؟]*$/u;
const HINT = /^(?:(?:أعطني|اعطني|اريد|أريد)\s+تلميحًا?|تلميحًا?)[.!?؟]*$/u;
const UNDERSTOOD = /^(?:(?:فهمت(?:\s+الآن)?|الآن\s+فهمت))[.!?؟]*$/u;
const WRONG_PREMISE = /^لماذا\s+(?:إجابتي|جوابي)\s+(?:خاطئة|خطأ|غلط)[.!?؟]*$/u;
const WORD_MEANING = /(?:\b(?:perkataan|kalimah)\s+arab\b[^.!?؟]{0,100}\b(?:bermaksud|maksud|makna)\b|(?:ما\s+معنى|معنى\s+الكلمة)|\b(?:arabic\s+word)\b[^.!?؟]{0,100}\bmeans\b)/iu;

export function resolveArabicWordMeaningSupport({ subjectId = '', questionId = '',
  questionText = '', instruction = '', prompt = '', hasExerciseContext = false,
  isAnswerAttempt = false, newTopicRequest = false, hasVerifiedAnswerFeedback = false
} = {}) {
  if (subjectId !== 'arab' || !questionId || !hasExerciseContext ||
      isAnswerAttempt || newTopicRequest ||
      !WORD_MEANING.test([questionText, instruction].filter(Boolean).join(' '))) return null;

  const text = normalizeArabic(prompt).trim();
  const hasBookInQuestion = /كتاب/u.test(normalizeArabic(questionText));
  if (/^(?:ماذا\s+أتعلم\s+اليوم|ما\s+الذي\s+أتعلمه\s+اليوم)[.!?؟]*$/u.test(text)) return {
    stage: 'word_meaning_plan',
    candidates: ['اليوم نتعلّم كيف نفهم معنى كلمة عربية في السؤال. نقرأ الكلمة أولًا، ثم نفكّر فيما تدلّ عليه.'],
    quickReplies: ['ابدأ بالشرح', 'أعطني تلميحًا', 'لا أفهم']
  };
  if (BEGIN_TEACHING.test(text)) return {
    stage: 'word_meaning_explanation',
    candidates: [
      'هذا السؤال يطلب معنى كلمة عربية. اقرأ الكلمة في السؤال ببطء. فكّر: هل تشير إلى إنسان، أم مكان، أم شيء؟ ثم اختر المعنى الذي يناسبها.'
    ],
    quickReplies: ['لا أفهم', 'أعطني تلميحًا', 'فهمت الآن']
  };
  if (MISUNDERSTANDING.test(text)) return {
    stage: 'word_meaning_reteaching',
    candidates: [
      'لا بأس. معنى الكلمة هو الشيء الذي تدلّ عليه. انظر إلى الكلمة العربية في السؤال، وفكّر أين سمعتها أو رأيتها من قبل.'
    ],
    quickReplies: ['أعطني تلميحًا', 'اشرح لي', 'فهمت الآن']
  };
  if (HINT.test(text)) return {
    stage: 'word_meaning_hint',
    candidates: hasBookInQuestion
      ? [
          'تلميح: الكلمة تشير إلى شيء له صفحات نقرأ فيها ونتعلّم منها. فكّر في معنى الكلمة من دون أن أخبرك بالإجابة.'
        ]
      : [
          'تلميح: اقرأ الكلمة العربية وحدّد ما تشير إليه، ثم ابحث عن المعنى المناسب في الخيارات.'
        ],
    quickReplies: ['اشرح لي', 'فهمت الآن', 'أعطني تلميحًا']
  };
  if (UNDERSTOOD.test(text)) return {
    stage: 'word_meaning_understood',
    candidates: ['أحسنت! الآن اقرأ الكلمة العربية مرة أخرى، ثم حاول اختيار معناها بنفسك.'],
    quickReplies: ['أعطني تلميحًا', 'اشرح لي', 'فهمت الآن']
  };
  if (WRONG_PREMISE.test(text) && !hasVerifiedAnswerFeedback) return {
    stage: 'word_meaning_unverified_grade',
    candidates: [
      'لم أتحقق من إجابتك بعد. إذا اخترت إجابة، أخبرني بما اخترته لنراجع معنى الكلمة معًا خطوة خطوة.'
    ],
    quickReplies: ['اشرح لي', 'أعطني تلميحًا', 'لا أفهم']
  };
  return null;
}
