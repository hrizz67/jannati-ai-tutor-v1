import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "adjectives",
  "displayName": "Adjectives",
  "learningObjectives": [
    "Identify words that describe nouns.",
    "Choose an adjective that matches the noun.",
    "Use simple describing words in Year 2 sentences."
  ],
  "teacherExplanation": [
    "An adjective is a describing word.",
    "It tells us more about a noun.",
    "We can use adjectives to say what something looks like, feels like or is like.",
    "Year 2 pupils can use words like big, small, happy and red."
  ],
  "simpleExplanation": "An adjective is a word that describes a noun.",
  "examples": [
    "big",
    "small",
    "happy",
    "sad",
    "red",
    "tall",
    "short",
    "clean",
    "cold",
    "fast"
  ],
  "extraExamples": [
    "soft",
    "bright",
    "kind",
    "loud",
    "blue",
    "slow",
    "warm",
    "pretty"
  ],
  "tips": [
    "Find the word that tells us more about the noun.",
    "Ask: What is it like?",
    "Look for a describing word.",
    "Read the whole sentence carefully.",
    "Choose the word that describes the noun."
  ],
  "memoryTips": [
    "Adjective = describing word.",
    "Think: What is it like?",
    "Big, small, happy, red.",
    "The adjective gives more detail.",
    "Use the noun to help you."
  ],
  "commonMistakes": [
    "Choosing a noun.",
    "Choosing a verb.",
    "Missing the describing word.",
    "Guessing without reading carefully.",
    "Choosing a word that does not describe anything."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the adjective.",
      "Well done! Your answer is correct.",
      "Nice work! You can spot describing words.",
      "Great! You are reading carefully.",
      "Excellent! You understand adjectives.",
      "Brilliant! You are improving quickly.",
      "Super! You chose the describing word.",
      "Fantastic! Keep it up.",
      "Well done! You are getting better.",
      "Great thinking! That is the right adjective."
    ],
    "retry": [
      "Try again and look for the describing word.",
      "Read the sentence once more.",
      "Choose the word that tells us more about the noun.",
      "Think about what the noun is like.",
      "Do not rush. Read carefully.",
      "Look again at the whole sentence.",
      "Take your time and try once more.",
      "Find the word that describes the noun.",
      "You are close. Read again.",
      "Check which word gives more detail."
    ],
    "excellent": [
      "Excellent! You know adjectives very well.",
      "Amazing! Your adjective choice is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the idea clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can identify adjectives quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },

  "problemSolvingSteps": [
    "Read the sentence.",
    "Look for the describing word.",
    "Check if the word tells us how something looks or feels.",
    "Choose the word that describes the noun.",
    "Say the adjective aloud to check it fits."
  ],
  "wordMeaning": [
    "adjective = describing word",
    "tells us how something looks, feels or seems"
  ],
  "exampleSentences": [
    "The bag is big.",
    "The flower is red.",
    "The kitten is cute.",
    "The soup is hot.",
    "The sky is blue."
  ],
  "relatedTopics": [
    "nouns",
    "verbs",
    "sentences",
    "reading"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Identify adjectives in simple Year 2 English sentences.",
    "SP": "Pupils can choose words that describe nouns."
  },
  "keywords": [
    "describe",
    "big",
    "small",
    "happy",
    "sad",
    "red",
    "tall",
    "short",
    "adjective",
    "noun",
    "sentence",
    "detail"
  ],
  "questionPatterns": [
    "Which word is an adjective?",
    "Choose the describing word.",
    "Find the adjective in the sentence.",
    "Which word tells us more about the noun?",
    "Pick the correct adjective.",
    "Select the adjective.",
    "Which one describes the noun?",
    "Look for the describing word."
  ],
  "wrongAnswerPatterns": [
    "Choosing a noun.",
    "Choosing a verb.",
    "Missing the describing word.",
    "Guessing without reading carefully.",
    "Choosing a word that does not describe anything.",
    "Mixing up adjectives with verbs."
  ],
  "followUpQuestions": [
    "What does the word describe?",
    "Can you find another adjective?",
    "Which word tells us what the noun is like?",
    "Can you read the sentence again?",
    "What kind of word is this?",
    "Can you point to the describing word?",
    "Which word gives more detail?",
    "How does this word describe the noun?"
  ]
});

export default knowledge;
