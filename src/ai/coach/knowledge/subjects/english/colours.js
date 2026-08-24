import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "colours",
  "displayName": "Colours",
  "learningObjectives": [
    "Recognise common colour words.",
    "Choose the colour word that matches the object.",
    "Use simple colour vocabulary in sentences."
  ],
  "teacherExplanation": [
    "Colour words tell us the colour of something.",
    "They help us describe objects clearly.",
    "Year 2 pupils should learn common colours such as red, blue and yellow.",
    "We can use colour words with nouns to make simple sentences."
  ],
  "simpleExplanation": "Colour words tell us the colour of something.",
  "examples": [
    "red",
    "blue",
    "yellow",
    "green",
    "black",
    "white",
    "pink",
    "orange",
    "brown",
    "purple"
  ],
  "extraExamples": [
    "grey",
    "gold",
    "silver",
    "light blue",
    "dark green",
    "bright red",
    "pale yellow",
    "deep blue"
  ],
  "tips": [
    "Look at the object and think of its colour.",
    "Choose a common colour word.",
    "Read the sentence carefully.",
    "Use the picture if there is one.",
    "Pick the colour that matches best."
  ],
  "memoryTips": [
    "Colour words help describe.",
    "Red, blue, yellow, green.",
    "Think of the object first.",
    "Use the picture if needed.",
    "The colour must fit the sentence."
  ],
  "commonMistakes": [
    "Choosing the wrong colour word.",
    "Mixing up similar colours.",
    "Choosing a noun instead of a colour.",
    "Guessing without looking at the object.",
    "Using a colour that does not fit."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the colour word.",
      "Well done! Your answer is correct.",
      "Nice work! You know the colours well.",
      "Great! You are reading carefully.",
      "Excellent! You understand colours.",
      "Brilliant! You are improving quickly.",
      "Super! You chose the right colour.",
      "Fantastic! Keep it up.",
      "Well done! You are getting better.",
      "Great thinking! That is the correct colour."
    ],
    "retry": [
      "Try again and look at the object carefully.",
      "Read the sentence once more.",
      "Choose the colour that matches best.",
      "Think about what colour it is.",
      "Do not rush. Read carefully.",
      "Look again at the picture or sentence.",
      "Take your time and try once more.",
      "Find the colour word that fits.",
      "You are close. Read again.",
      "Check which colour is shown."
    ],
    "excellent": [
      "Excellent! You know colour words very well.",
      "Amazing! Your colour choice is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the idea clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can identify colours quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },
  "relatedTopics": [
    "adjectives",
    "nouns",
    "sentences",
    "reading"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Recognise and use common colour words.",
    "SP": "Pupils can choose colour words that match an object."
  },
  "keywords": [
    "red",
    "blue",
    "yellow",
    "green",
    "black",
    "white",
    "pink",
    "orange",
    "brown",
    "purple",
    "colour",
    "object"
  ],
  "questionPatterns": [
    "Which word is a colour?",
    "Choose the correct colour word.",
    "Find the colour in the sentence.",
    "Which colour matches the object?",
    "Pick the right colour.",
    "Select the colour word.",
    "Which one names a colour?",
    "Look for the colour word."
  ],
  "wrongAnswerPatterns": [
    "Choosing a noun.",
    "Choosing a verb.",
    "Missing the colour word.",
    "Guessing without looking carefully.",
    "Choosing a word that is not a colour.",
    "Mixing up colour words."
  ],
  "followUpQuestions": [
    "What colour is the object?",
    "Can you find another colour word?",
    "Which word names the colour?",
    "Can you read the sentence again?",
    "What kind of word is this?",
    "Can you point to the colour word?",
    "Which colour fits best?",
    "How do you know the colour?"
  ]
});

export default knowledge;
