import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "numbers",
  "displayName": "Numbers",
  "learningObjectives": [
    "Recognise number words from one to ten and beyond.",
    "Choose the number word that matches the sentence.",
    "Read simple number vocabulary in Year 2."
  ],
  "teacherExplanation": [
    "Number words tell us how many.",
    "They help us count people, animals and things.",
    "Year 2 pupils should know simple numbers and number words.",
    "We can use numbers in counting sentences and everyday language."
  ],
  "simpleExplanation": "Number words tell us how many.",
  "examples": [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten"
  ],
  "extraExamples": [
    "first",
    "second",
    "third",
    "eleven",
    "twelve",
    "twenty",
    "zero",
    "many"
  ],
  "tips": [
    "Count carefully.",
    "Read the number word slowly.",
    "Match the word with the quantity.",
    "Use the sentence to help you.",
    "Choose the number that fits best."
  ],
  "memoryTips": [
    "One to ten first.",
    "Count slowly.",
    "Number words show how many.",
    "Use fingers if needed.",
    "Read the amount carefully."
  ],
  "commonMistakes": [
    "Choosing the wrong number word.",
    "Mixing up similar numbers.",
    "Guessing without counting.",
    "Missing a number in the sentence.",
    "Choosing a word that does not show quantity."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the number word.",
      "Well done! Your answer is correct.",
      "Nice work! You know the numbers well.",
      "Great! You are reading carefully.",
      "Excellent! You understand number words.",
      "Brilliant! You are improving quickly.",
      "Super! You chose the right number.",
      "Fantastic! Keep it up.",
      "Well done! You are getting better.",
      "Great thinking! That is the correct number."
    ],
    "retry": [
      "Try again and count carefully.",
      "Read the sentence once more.",
      "Choose the number word that fits.",
      "Think about how many there are.",
      "Do not rush. Read carefully.",
      "Look again at the quantity.",
      "Take your time and try once more.",
      "Find the number word that matches.",
      "You are close. Read again.",
      "Check which number is correct."
    ],
    "excellent": [
      "Excellent! You know number words very well.",
      "Amazing! Your number choice is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the idea clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can identify numbers quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },
  "relatedTopics": [
    "sentences",
    "reading",
    "nouns",
    "food"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Recognise and use simple number words.",
    "SP": "Pupils can choose number words that match how many."
  },
  "keywords": [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "number",
    "count"
  ],
  "questionPatterns": [
    "Which word shows a number?",
    "Choose the correct number word.",
    "Find the number in the sentence.",
    "Which number word matches?",
    "Pick the right number.",
    "Select the number word.",
    "Which one shows how many?",
    "Look for the counting word."
  ],
  "wrongAnswerPatterns": [
    "Choosing a noun.",
    "Choosing a verb.",
    "Missing the number word.",
    "Guessing without counting carefully.",
    "Choosing a word that does not show how many.",
    "Mixing up number words."
  ],
  "followUpQuestions": [
    "How many are there?",
    "Can you find another number word?",
    "Which word shows how many?",
    "Can you read the sentence again?",
    "What kind of word is this?",
    "Can you point to the number word?",
    "Which number fits best?",
    "How do you know the number?"
  ]
});

export default knowledge;
