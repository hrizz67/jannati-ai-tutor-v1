import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "verbs",
  "displayName": "Verbs",
  "learningObjectives": [
    "Identify verbs that show actions.",
    "Choose a verb that matches the sentence meaning.",
    "Recognise simple action words in Year 2 sentences."
  ],
  "teacherExplanation": [
    "A verb is an action word.",
    "It tells us what someone or something does.",
    "When we look at a sentence, we should search for the action.",
    "Year 2 pupils can use verbs like run, read, eat and jump."
  ],
  "simpleExplanation": "A verb is a word that shows an action.",
  "examples": [
    "run",
    "read",
    "eat",
    "jump",
    "write",
    "sleep",
    "sing",
    "walk",
    "draw",
    "play"
  ],
  "extraExamples": [
    "clap",
    "wash",
    "paint",
    "kick",
    "dance",
    "climb",
    "open",
    "close"
  ],
  "tips": [
    "Look for the action in the sentence.",
    "Ask yourself: What is happening?",
    "Choose a word that shows doing.",
    "Read the full sentence before answering.",
    "Do not choose a noun by mistake."
  ],
  "memoryTips": [
    "Verb = action word.",
    "Action tells us what happens.",
    "Run, read, eat, jump.",
    "Ask: What is the action?",
    "The action word is the verb."
  ],
  "commonMistakes": [
    "Choosing a noun instead of a verb.",
    "Choosing an adjective instead of a verb.",
    "Missing the action word.",
    "Guessing too quickly.",
    "Forgetting to read the whole sentence."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the verb.",
      "Well done! Your answer is correct.",
      "Nice work! You can spot actions well.",
      "Great! You are reading carefully.",
      "Excellent! You understand verbs.",
      "Brilliant! You are improving quickly.",
      "Super! You chose the action word.",
      "Fantastic! Keep it up.",
      "Well done! You are getting better.",
      "Great thinking! That is the right verb."
    ],
    "retry": [
      "Try again and look for the action word.",
      "Read the sentence once more.",
      "Choose the word that shows doing.",
      "Think about what is happening.",
      "Do not rush. Read carefully.",
      "Look again at the whole sentence.",
      "Take your time and try once more.",
      "Find the word that shows an action.",
      "You are close. Read again.",
      "Check which word tells the action."
    ],
    "excellent": [
      "Excellent! You know verbs very well.",
      "Amazing! Your verb choice is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the idea clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can identify verbs quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },
  "relatedTopics": [
    "nouns",
    "adjectives",
    "sentences",
    "reading"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Identify verbs in simple Year 2 English sentences.",
    "SP": "Pupils can choose words that show actions."
  },
  "keywords": [
    "action",
    "doing",
    "run",
    "read",
    "eat",
    "jump",
    "verb",
    "sentence",
    "happening",
    "play",
    "write",
    "walk"
  ],
  "questionPatterns": [
    "Which word is a verb?",
    "Choose the action word.",
    "Find the verb in the sentence.",
    "Which word shows an action?",
    "Pick the correct verb.",
    "Select the verb.",
    "Which one is a doing word?",
    "Look for the action."
  ],
  "wrongAnswerPatterns": [
    "Choosing a noun.",
    "Choosing a describing word.",
    "Missing the action word.",
    "Guessing without reading carefully.",
    "Choosing a word that is not doing anything.",
    "Mixing up verbs with nouns."
  ],
  "followUpQuestions": [
    "What action is happening?",
    "Can you find another verb?",
    "Which word shows doing?",
    "Can you read the sentence again?",
    "What kind of word is this?",
    "Can you point to the action word?",
    "Which word tells us what happens?",
    "What is the person or animal doing?"
  ]
});

export default knowledge;
