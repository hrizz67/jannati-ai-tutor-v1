// A narrowly authored Year 2 English noun lesson for an *active*, scoped quiz.
// The caller must verify the subject, current question, answer-attempt status,
// and teaching-anchor scope before it may use these responses.
const NOUN_EXPLANATION_PATTERN = /^(?:(?:can|could)\s+you\s+|please\s+)?(?:explain|teach\s+me(?:\s+about)?)\s+(?:the\s+)?(?:common\s+)?nouns?[.!?]*$|^what\s+(?:is\s+a|are)\s+(?:common\s+)?nouns?[.!?]*$/iu;
const NOUN_CLUE_PATTERN = /^(?:which|what)\s+(?:word|part|clue)\s+(?:should\s+i\s+look\s+at|do\s+i\s+look\s+for|is\s+important)[.!?]*$/iu;
const NOUN_SIMPLE_PATTERN = /^(?:(?:i\s+)?(?:don['’]?t\s+understand|do\s+not\s+understand)|what\s+does\s+(?:that|it)\s+mean)[.!?]*$/iu;
const NOUN_EXAMPLE_PATTERN = /^(?:(?:can|could)\s+you\s+)?(?:give\s+me|show\s+me)(?:\s+(?:one|a|another))?(?:\s+simple)?\s+examples?[.!?]*$/iu;
const NOUN_WHY_PATTERN = /^why\s+is\s+(?:that|it|this)\s+a\s+noun[.!?]*$/iu;
const NOUN_NEXT_PATTERN = /^(?:okay,?\s*)?(?:what\s+(?:do\s+i\s+do|should\s+i\s+do)\s+next|what(?:'s|\s+is)\s+next)[.!?]*$/iu;

export function resolveEnglishNounSupport({ prompt = '', subjectId = '', hasExerciseContext = false,
  questionId = '', newTopicRequest = false, isAnswerAttempt = false, anchorActive = false,
  } = {}) {
  if (subjectId !== 'english' || !hasExerciseContext || !questionId ||
      newTopicRequest || isAnswerAttempt) return null;

  const learnerText = String(prompt || '').trim();
  const explicitNoun = NOUN_EXPLANATION_PATTERN.test(learnerText);
  // The current broad Nouns topic is not permission to replace more
  // specific person/place/animal guidance. The learner must explicitly ask
  // for nouns first; only its authenticated question-scoped anchor may
  // continue that mini-lesson on later turns.
  if (!explicitNoun && !anchorActive) return null;

  if (explicitNoun) return {
    stage: 'noun_concept_explanation',
    candidates: [
      'A noun is a naming word. It names a person, animal, place, or thing. Read the sentence. What clue shows which kind of noun is needed?'
    ],
    quickReplies: ['I do not understand', 'Which clue should I look at?', 'Give me an example']
  };
  if (NOUN_SIMPLE_PATTERN.test(learnerText)) return {
    stage: 'noun_simple_explanation',
    candidates: [
      'A noun is a word that names someone or something: a person, an animal, a place, or a thing. Look for one clue in the question.'
    ],
    quickReplies: ['Which clue should I look at?', 'Give me an example']
  };
  if (NOUN_CLUE_PATTERN.test(learnerText)) return {
    stage: 'noun_clue',
    candidates: [
      'Look near the blank. Does the sentence need a person, animal, place, or thing? Find a naming word that fits the clue. You do not need to guess yet.'
    ],
    quickReplies: ['Give me an example', 'I will try']
  };
  if (NOUN_EXAMPLE_PATTERN.test(learnerText)) return {
    stage: 'noun_example',
    candidates: [
      'For example, a teacher is a noun because it names a person. Find a naming word in your question.',
      'For example, a pencil is a noun because it names a thing. Find a naming word in your question.',
      'For example, a park is a noun because it names a place. Find a naming word in your question.'
    ],
    quickReplies: ['Why is that a noun?', 'What should I do next?']
  };
  if (NOUN_WHY_PATTERN.test(learnerText)) return {
    stage: 'noun_reason',
    candidates: [
      'A noun names a person, animal, place, or thing. Ask what the word names, then check the clue.'
    ],
    quickReplies: ['What should I do next?', 'I will try']
  };
  if (NOUN_NEXT_PATTERN.test(learnerText)) return {
    stage: 'noun_next_step',
    candidates: [
      'Now read the sentence again. Find the clue, then choose a naming word that fits. Try it yourself.'
    ],
    quickReplies: ['I will try', 'Give me a clue']
  };
  return null;
}
