import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "animals",
  "displayName": "Animals",
  "learningObjectives": [
    "Recognise common animal words.",
    "Choose an animal word that matches the sentence.",
    "Use simple animal vocabulary in Year 2."
  ],
  "teacherExplanation": [
    "Animal words name living things like cat, dog and fish.",
    "We can read the sentence and look for the animal being talked about.",
    "Year 2 pupils should know common animal names.",
    "Animal words are nouns because they name living things."
  ],
  "simpleExplanation": "Animal words name living things.",
  "examples": [
    "cat",
    "dog",
    "fish",
    "bird",
    "rabbit",
    "cow",
    "duck",
    "horse",
    "lion",
    "monkey"
  ],
  "extraExamples": [
    "tiger",
    "goat",
    "snake",
    "frog",
    "elephant",
    "bear",
    "sheep",
    "chicken"
  ],
  "tips": [
    "Think of the animal in the sentence.",
    "Read the clue carefully.",
    "Choose a common animal word.",
    "Use the picture if there is one.",
    "Pick the animal that fits best."
  ],
  "memoryTips": [
    "Animals are living things.",
    "Cat, dog, fish, bird.",
    "Look for the animal clue.",
    "Use the sentence meaning.",
    "Animal names are nouns."
  ],
  "commonMistakes": [
    "Choosing a non-animal word.",
    "Mixing up similar animals.",
    "Guessing without reading carefully.",
    "Missing the animal clue.",
    "Choosing a verb instead of an animal."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the animal word.",
      "Well done! Your answer is correct.",
      "Nice work! You know the animals well.",
      "Great! You are reading carefully.",
      "Excellent! You understand animal words.",
      "Brilliant! You are improving quickly.",
      "Super! You chose the right animal.",
      "Fantastic! Keep it up.",
      "Well done! You are getting better.",
      "Great thinking! That is the correct animal."
    ],
    "retry": [
      "Try again and look for the animal clue.",
      "Read the sentence once more.",
      "Choose the animal word that fits.",
      "Think about which animal is shown.",
      "Do not rush. Read carefully.",
      "Look again at the whole sentence.",
      "Take your time and try once more.",
      "Find the animal word that matches.",
      "You are close. Read again.",
      "Check which animal is correct."
    ],
    "excellent": [
      "Excellent! You know animal words very well.",
      "Amazing! Your animal choice is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the idea clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can identify animals quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },
  "relatedTopics": [
    "nouns",
    "verbs",
    "reading",
    "food"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Recognise common animal words.",
    "SP": "Pupils can choose animal words that match the sentence."
  },
  "keywords": [
    "animal",
    "cat",
    "dog",
    "fish",
    "bird",
    "rabbit",
    "cow",
    "duck",
    "horse",
    "lion",
    "noun",
    "living thing"
  ],
  "questionPatterns": [
    "Which word is an animal?",
    "Choose the correct animal word.",
    "Find the animal in the sentence.",
    "Which animal matches the clue?",
    "Pick the right animal.",
    "Select the animal word.",
    "Which one names an animal?",
    "Look for the animal word."
  ],
  "wrongAnswerPatterns": [
    "Choosing a non-animal word.",
    "Choosing a verb.",
    "Missing the animal clue.",
    "Guessing without reading carefully.",
    "Choosing a word that is not an animal.",
    "Mixing up animal names."
  ],
  "followUpQuestions": [
    "Which animal is being talked about?",
    "Can you find another animal word?",
    "Which word names the animal?",
    "Can you read the sentence again?",
    "What kind of word is this?",
    "Can you point to the animal word?",
    "Which animal fits best?",
    "How do you know the animal?"
  ]
});

export default knowledge;
