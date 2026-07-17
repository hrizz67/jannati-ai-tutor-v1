import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "english",
  "topicId": "nouns",
  "displayName": "Nouns",
  "learningObjectives": [
    "Identify nouns that name people, animals, places and things.",
    "Choose a noun that matches the sentence meaning.",
    "Recognise simple nouns in Year 2 sentences."
  ],
  "teacherExplanation": [
    "A noun is a naming word.",
    "It names a person, animal, place or thing.",
    "When we read a sentence, we can look for the word that tells us what someone or something is called.",
    "In Year 2, pupils should learn to spot simple nouns in familiar sentences."
  ],
  "simpleExplanation": "A noun is a word that names a person, animal, place or thing.",
  "examples": [
    "teacher",
    "cat",
    "school",
    "book",
    "girl",
    "field",
    "pencil",
    "library",
    "fish",
    "bag"
  ],
  "extraExamples": [
    "boy",
    "dog",
    "table",
    "park",
    "doctor",
    "apple",
    "chair",
    "kitchen"
  ],
  "tips": [
    "Look for a naming word in the sentence.",
    "Think: person, animal, place or thing.",
    "Read the whole sentence before choosing.",
    "Choose the word that names something real.",
    "Do not choose an action word by mistake."
  ],
  "memoryTips": [
    "Noun = naming word.",
    "Person, animal, place, thing.",
    "Ask: What is being named?",
    "Use the sentence to help you.",
    "Look for a clear name."
  ],
  "commonMistakes": [
    "Choosing a verb instead of a noun.",
    "Choosing an adjective instead of a noun.",
    "Missing the naming word in the sentence.",
    "Guessing without reading carefully.",
    "Confusing a thing with an action."
  ],
  "encouragement": {
    "correct": [
      "Good job! You found the noun.",
      "Well done! Your answer is correct.",
      "Nice work! You can spot nouns well.",
      "Great! You are reading carefully.",
      "Excellent! You understand nouns.",
      "Brilliant! You are improving quickly.",
      "Super! You chose the naming word.",
      "Fantastic! Keep it up.",
      "Well done! You are getting better.",
      "Great thinking! That is the right noun."
    ],
    "retry": [
      "Try again and look for the naming word.",
      "Read the sentence once more.",
      "Choose the word that names something.",
      "Think about a person, place, animal or thing.",
      "Do not rush. Read carefully.",
      "Look again at the whole sentence.",
      "Take your time and try once more.",
      "Find the word that tells you what it is.",
      "You are close. Read again.",
      "Check which word is a naming word."
    ],
    "excellent": [
      "Excellent! You know nouns very well.",
      "Amazing! Your noun choice is perfect.",
      "Outstanding! You are very confident.",
      "Brilliant! You understand the idea clearly.",
      "Superb! You are doing very well.",
      "Fantastic! You can identify nouns quickly.",
      "Wonderful! Keep learning like this.",
      "Great work! You are ready for more.",
      "Excellent thinking! That was spot on.",
      "Amazing effort! You did very well."
    ]
  },

  "problemSolvingSteps": [
    "Read the sentence.",
    "Look for the naming word.",
    "Check if the word names a person, animal, place or thing.",
    "Choose the word that names something.",
    "Say the noun aloud to check it sounds right."
  ],
  "wordMeaning": [
    "noun = naming word",
    "person, animal, place or thing"
  ],
  "exampleSentences": [
    "The cat is sleeping on the chair.",
    "My teacher reads a book.",
    "We play in the school field.",
    "The bag is on the table.",
    "The boy carries a pencil."
  ],
  "relatedTopics": [
    "verbs",
    "adjectives",
    "sentences",
    "reading"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Identify nouns in simple Year 2 English sentences.",
    "SP": "Pupils can choose words that name people, animals, places and things."
  },
  "keywords": [
    "person",
    "animal",
    "place",
    "thing",
    "naming word",
    "teacher",
    "school",
    "book",
    "cat",
    "library",
    "noun",
    "sentence"
  ],
  "questionPatterns": [
    "Which word is a noun?",
    "Choose the naming word.",
    "Find the noun in the sentence.",
    "Which word names a thing?",
    "Pick the correct noun.",
    "Look for the person, place or thing.",
    "Select the noun.",
    "Which one is a naming word?"
  ],
  "wrongAnswerPatterns": [
    "Choosing an action word.",
    "Choosing a describing word.",
    "Missing the naming word.",
    "Guessing without reading the sentence.",
    "Choosing a word that does not name anything.",
    "Mixing up nouns with verbs."
  ],
  "followUpQuestions": [
    "What is being named in the sentence?",
    "Can you find another noun?",
    "Is this word a person, place, animal or thing?",
    "Which word names something?",
    "Can you read the sentence again?",
    "What kind of word is this?",
    "Can you point to the naming word?",
    "Which word tells us the object or person?"
  ]
});

export default knowledge;
