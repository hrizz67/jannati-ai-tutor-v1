import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "sentences",
  "displayName": "Sentences",
  "learningObjectives": [
    "Recognise a complete sentence.",
    "Use capital letters and full stops correctly.",
    "Choose words that form a correct simple sentence."
  ],
  "teacherExplanation": [
    "A sentence is a group of words that makes complete sense.",
    "A sentence begins with a capital letter and often ends with a full stop.",
    "Year 2 pupils should learn to spot complete and incomplete sentences.",
    "Good sentences help us share our ideas clearly."
  ],
  "simpleExplanation": "A sentence is a group of words that makes complete sense.",
  "examples": [
    "The boy is reading.",
    "My mother cooks dinner.",
    "We play in the field.",
    "A cat is sleeping.",
    "The teacher smiles.",
    "I have a new book.",
    "They are in the garden.",
    "The bird can fly.",
    "The dog is brown.",
    "We wash our hands."
  ],
  "extraExamples": [
    "A full stop ends a sentence.",
    "Capital letters begin a sentence.",
    "The sun is bright.",
    "She is happy.",
    "We are ready.",
    "He is at school.",
    "The apple is red.",
    "The children sing."
  ],
  "tips": [
    "Look for a complete idea.",
    "Check the capital letter.",
    "Check the full stop.",
    "Read the words in order.",
    "Choose the option that makes sense."
  ],
  "memoryTips": [
    "Sentence = complete sense.",
    "Capital letter at the start.",
    "Full stop at the end.",
    "Read the words in order.",
    "Complete idea means sentence."
  ],
  "commonMistakes": [
    "Choosing words that do not make sense.",
    "Forgetting the capital letter.",
    "Forgetting the full stop.",
    "Guessing without reading carefully.",
    "Mixing up a phrase and a sentence."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the sentence.",
      "Well done! Your answer is correct.",
      "Nice work! You know sentence rules well.",
      "Great! You are reading carefully.",
      "Excellent! You understand sentences.",
      "Brilliant! You are improving quickly.",
      "Super! You chose the right sentence.",
      "Fantastic! Keep it up.",
      "Well done! You are getting better.",
      "Great thinking! That is the correct sentence."
    ],
    "retry": [
      "Try again and read the words carefully.",
      "Look for the complete idea.",
      "Check the capital letter and full stop.",
      "Think about which words make sense together.",
      "Do not rush. Read carefully.",
      "Look again at the whole group of words.",
      "Take your time and try once more.",
      "Find the sentence that is complete.",
      "You are close. Read again.",
      "Check which option makes sense."
    ],
    "excellent": [
      "Excellent! You know sentences very well.",
      "Amazing! Your sentence choice is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the idea clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can identify sentences quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },
  "relatedTopics": [
    "nouns",
    "verbs",
    "adjectives",
    "reading"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Recognise complete simple sentences.",
    "SP": "Pupils can choose words that make a correct sentence."
  },
  "keywords": [
    "sentence",
    "capital letter",
    "full stop",
    "complete",
    "sense",
    "words",
    "begin",
    "end",
    "order",
    "idea",
    "grammar",
    "simple"
  ],
  "questionPatterns": [
    "Which is a complete sentence?",
    "Choose the correct sentence.",
    "Find the sentence with complete sense.",
    "Which option makes sense?",
    "Pick the sentence.",
    "Select the complete sentence.",
    "Which one begins with a capital letter?",
    "Look for the full sentence."
  ],
  "wrongAnswerPatterns": [
    "Choosing words that do not make sense.",
    "Forgetting punctuation.",
    "Missing the capital letter.",
    "Guessing without reading carefully.",
    "Choosing a phrase instead of a sentence.",
    "Mixing up sentence parts."
  ],
  "followUpQuestions": [
    "Is this a complete sentence?",
    "Can you find the capital letter?",
    "Where is the full stop?",
    "Can you read the words again?",
    "What makes this a sentence?",
    "Can you point to the complete idea?",
    "Which option makes sense best?",
    "How do you know it is a sentence?"
  ]
});

export default knowledge;
