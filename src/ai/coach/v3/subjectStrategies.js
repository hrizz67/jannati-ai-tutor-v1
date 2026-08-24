const SUBJECT_STRATEGIES = {
  math: {
    label: 'Mathematics',
    explanationLead: 'Bagus! Mari kita kira langkah demi langkah.',
    hintLead: 'Cari nombor, unit, dan operasi yang betul.',
    praiseLead: 'Hebat! Kamu semakin cekap mengira.',
    tipLead: 'Semak jawapan dengan kira semula.',
    preferredFields: ['workedExamples', 'problemSolvingSteps', 'examples', 'extraExamples']
  },
  bm: {
    label: 'Bahasa Melayu',
    explanationLead: 'Bagus! Mari bina ayat yang lebih kemas.',
    hintLead: 'Baca ayat dengan teliti dan cari kata kunci.',
    praiseLead: 'Hebat! Kamu semakin mahir berbahasa.',
    tipLead: 'Perhatikan tatabahasa dan makna ayat.',
    preferredFields: ['examples', 'extraExamples', 'tips', 'memoryTips']
  },
  english: {
    label: 'English',
    explanationLead: "Great! Let's practise the sentence together.",
    hintLead: 'Look for the clue word in the sentence.',
    praiseLead: 'Excellent! You are getting better at English.',
    tipLead: 'Check grammar, spelling, and meaning.',
    preferredFields: ['wordMeaning', 'exampleSentences', 'examples', 'extraExamples']
  },
  sains: {
    label: 'Science',
    explanationLead: 'Hebat! Mari fikir seperti seorang saintis.',
    hintLead: 'Perhati fakta dan hubungan sebab-akibat.',
    praiseLead: 'Cemerlang! Kamu membuat pemerhatian yang baik.',
    tipLead: 'Gunakan bukti daripada pemerhatian.',
    preferredFields: ['scientificFacts', 'whyQuestions', 'predictionQuestions', 'comparisonQuestions', 'realLifeApplications', 'investigationIdeas']
  },
  arab: {
    label: 'Arabic',
    explanationLead: 'Bagus! Mari sebut huruf dengan betul.',
    hintLead: 'Perhatikan tulisan Arab dan bunyinya.',
    praiseLead: 'Hebat! Sebutan kamu semakin baik.',
    tipLead: 'Baca dari kanan ke kiri dengan tenang.',
    preferredFields: ['pronunciationGuide', 'readingSteps', 'letterBreakdown', 'listeningTips', 'readingPractice', 'speakingPractice', 'writingPractice']
  },
  islam: {
    label: 'Pendidikan Islam',
    explanationLead: 'Alhamdulillah, mari kita fahami pengajaran ini.',
    hintLead: 'Fikirkan adab dan makna yang betul.',
    praiseLead: 'Masya-Allah, kamu sangat tekun belajar.',
    tipLead: 'Hubungkan jawapan dengan akhlak dan amalan baik.',
    preferredFields: ['dailyPractice', 'adabApplications', 'realLifeExamples', 'examples', 'extraExamples']
  },
  pj: {
    label: 'Pendidikan Jasmani',
    explanationLead: 'Bagus! Ingat keselamatan semasa bergerak.',
    hintLead: 'Fikirkan pergerakan yang selamat dan terkawal.',
    praiseLead: 'Hebat! Kawalan badan kamu semakin baik.',
    tipLead: 'Utamakan ruang, imbangan, dan arahan guru.',
    preferredFields: ['movementSteps', 'warmUpIdeas', 'fitnessActivities', 'gameApplications', 'dailyMovementIdeas', 'examples']
  },
  pk: {
    label: 'Pendidikan Kesihatan',
    explanationLead: 'Bagus! Amalkan gaya hidup sihat.',
    hintLead: 'Pilih tindakan yang paling sihat dan selamat.',
    praiseLead: 'Hebat! Kamu memahami penjagaan diri dengan baik.',
    tipLead: 'Fikir tentang kebersihan, pemakanan, dan keselamatan.',
    preferredFields: ['healthyHabits', 'dailyPractice', 'hygieneSteps', 'nutritionTips', 'realLifeScenarios', 'bodyCare', 'examples']
  }
};

export function getSubjectStrategy(subjectId = 'default') {
  return SUBJECT_STRATEGIES[subjectId] || {
    label: 'General',
    explanationLead: 'Bagus! Mari kita semak bersama.',
    hintLead: 'Baca soalan dengan teliti.',
    praiseLead: 'Hebat! Teruskan usaha kamu.',
    tipLead: 'Semak maklumat penting dahulu.',
    preferredFields: ['examples', 'extraExamples']
  };
}

export function getSubjectStrategyFields(subjectId = 'default') {
  return getSubjectStrategy(subjectId).preferredFields || ['examples', 'extraExamples'];
}

export default {
  getSubjectStrategy,
  getSubjectStrategyFields
};
