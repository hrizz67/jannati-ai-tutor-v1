import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "food",
  "displayName": "Food",
  "learningObjectives": [
    "Recognise common food words.",
    "Choose a food word that matches the sentence.",
    "Use simple food vocabulary in Year 2."
  ],
  "teacherExplanation": [
    "Food words name things we eat or drink.",
    "We can read the sentence and look for the food being mentioned.",
    "Year 2 pupils should know simple food words from daily life.",
    "Food words are also nouns because they name things."
  ],
  "simpleExplanation": "Food words name things we eat or drink.",
  "examples": [
    "rice",
    "bread",
    "milk",
    "apple",
    "cake",
    "water",
    "egg",
    "banana",
    "fish",
    "noodles"
  ],
  "extraExamples": [
    "sandwich",
    "soup",
    "juice",
    "carrot",
    "orange",
    "cookies",
    "tea",
    "yoghurt"
  ],
  "tips": [
    "Think of the food in the sentence.",
    "Read the clue carefully.",
    "Choose a common food word.",
    "Use the picture if there is one.",
    "Pick the food that fits best."
  ],
  "memoryTips": [
    "Food words name what we eat.",
    "Rice, bread, milk, apple.",
    "Look for the food clue.",
    "Use the sentence meaning.",
    "Food names are nouns."
  ],
  "commonMistakes": [
    "Choosing a non-food word.",
    "Mixing up similar food words.",
    "Guessing without reading carefully.",
    "Missing the food clue.",
    "Choosing a verb instead of food."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the food word.",
      "Well done! Your answer is correct.",
      "Nice work! You know the food words well.",
      "Great! You are reading carefully.",
      "Excellent! You understand food words.",
      "Brilliant! You are improving quickly.",
      "Super! You chose the right food.",
      "Fantastic! Keep it up.",
      "Well done! You are getting better.",
      "Great thinking! That is the correct food."
    ],
    "retry": [
      "Try again and look for the food clue.",
      "Read the sentence once more.",
      "Choose the food word that fits.",
      "Think about which food is shown.",
      "Do not rush. Read carefully.",
      "Look again at the whole sentence.",
      "Take your time and try once more.",
      "Find the food word that matches.",
      "You are close. Read again.",
      "Check which food is correct."
    ],
    "excellent": [
      "Excellent! You know food words very well.",
      "Amazing! Your food choice is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the idea clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can identify food words quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },
  "relatedTopics": [
    "nouns",
    "reading",
    "sentences",
    "animals"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Recognise common food words.",
    "SP": "Pupils can choose food words that match the sentence."
  },
  "keywords": [
    "food",
    "rice",
    "bread",
    "milk",
    "apple",
    "cake",
    "water",
    "egg",
    "banana",
    "noodles",
    "noun",
    "eat"
  ],
  "questionPatterns": [
    "Which word is a food?",
    "Choose the correct food word.",
    "Find the food in the sentence.",
    "Which food matches the clue?",
    "Pick the right food.",
    "Select the food word.",
    "Which one names food?",
    "Look for the food word."
  ],
  "wrongAnswerPatterns": [
    "Choosing a non-food word.",
    "Choosing a verb.",
    "Missing the food clue.",
    "Guessing without reading carefully.",
    "Choosing a word that is not food.",
    "Mixing up food names."
  ],
  "followUpQuestions": [
    "Which food is being talked about?",
    "Can you find another food word?",
    "Which word names the food?",
    "Can you read the sentence again?",
    "What kind of word is this?",
    "Can you point to the food word?",
    "Which food fits best?",
    "How do you know the food?"
  ]
});

export default knowledge;
