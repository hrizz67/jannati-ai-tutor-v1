import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "reading",
  "displayName": "Reading",
  "learningObjectives": [
    "Read short texts and find simple facts.",
    "Answer questions using information from the text.",
    "Understand key ideas in short Year 2 passages."
  ],
  "teacherExplanation": [
    "Reading means looking at words and understanding the meaning.",
    "We can read a short text and find important facts.",
    "Year 2 pupils should answer questions by using the text.",
    "Good reading helps us understand people, places and actions."
  ],
  "simpleExplanation": "Reading means understanding the words in a text.",
  "examples": [
    "The boy has a red ball.",
    "Mina reads a story book.",
    "The cat is under the table.",
    "We eat lunch at school.",
    "The park is near the shop.",
    "Sam washes his hands.",
    "The birds can fly.",
    "A girl is drawing a flower.",
    "The cake is sweet.",
    "They play in the garden."
  ],
  "extraExamples": [
    "Read the sentence carefully.",
    "Find the main idea.",
    "Look for the detail.",
    "Use the text to answer.",
    "Read again if needed.",
    "Find who, what or where.",
    "Choose the best answer.",
    "Check the meaning of the words."
  ],
  "tips": [
    "Read the text slowly.",
    "Look for important details.",
    "Find the answer in the passage.",
    "Read the question carefully.",
    "Use the text clues."
  ],
  "memoryTips": [
    "Read, think, answer.",
    "The text helps.",
    "Look for key details.",
    "Read again if needed.",
    "Use the words in the passage."
  ],
  "commonMistakes": [
    "Answering without reading the text.",
    "Choosing a detail not in the passage.",
    "Missing the question clue.",
    "Reading too quickly.",
    "Guessing instead of checking the text."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the answer in the text.",
      "Well done! Your answer is correct.",
      "Nice work! You read carefully.",
      "Great! You understand the text well.",
      "Excellent! Your reading is improving.",
      "Brilliant! You found the detail quickly.",
      "Super! Keep reading like this.",
      "Fantastic! You chose the best answer.",
      "Well done! You are getting better.",
      "Great thinking! That is correct."
    ],
    "retry": [
      "Try again and look in the text.",
      "Read the passage once more.",
      "Find the clue in the words.",
      "Think about the question carefully.",
      "Do not rush. Read slowly.",
      "Look again for the detail.",
      "Take your time and try once more.",
      "Use the text to help you.",
      "You are close. Read again.",
      "Check the passage one more time."
    ],
    "excellent": [
      "Excellent! You read very well.",
      "Amazing! Your answer is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the text clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can find answers quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },

  "problemSolvingSteps": [
    "Read the short text slowly.",
    "Look for the important word or idea.",
    "Check the question carefully.",
    "Choose the answer that matches the text.",
    "Read again if you need to confirm the detail."
  ],
  "wordMeaning": [
    "reading = understanding written words",
    "reading helps us learn new ideas"
  ],
  "exampleSentences": [
    "Read the sentence and answer the question.",
    "Look at the short paragraph.",
    "Find the main idea in the text.",
    "Choose the detail that matches the passage.",
    "Read carefully before answering."
  ],
  "relatedTopics": [
    "sentences",
    "nouns",
    "verbs",
    "adjectives"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Read short texts and answer simple questions.",
    "SP": "Pupils can find answers from short passages."
  },
  "keywords": [
    "read",
    "text",
    "passage",
    "detail",
    "question",
    "answer",
    "clue",
    "fact",
    "story",
    "meaning",
    "sentence",
    "information"
  ],
  "questionPatterns": [
    "What does the text say?",
    "Choose the correct answer from the passage.",
    "Find the detail in the text.",
    "Which answer matches the story?",
    "Read and answer.",
    "Pick the correct fact.",
    "What is the main idea?",
    "Look for the clue in the text."
  ],
  "wrongAnswerPatterns": [
    "Answering without reading.",
    "Choosing a detail not in the text.",
    "Missing the clue.",
    "Reading too quickly.",
    "Guessing instead of checking.",
    "Mixing up the facts."
  ],
  "followUpQuestions": [
    "What clue did you use?",
    "Can you find the answer in the text?",
    "Which word helped you?",
    "Can you read the passage again?",
    "What is the main idea?",
    "Can you point to the detail?",
    "Which answer fits best?",
    "How do you know from the text?"
  ]
});

export default knowledge;
