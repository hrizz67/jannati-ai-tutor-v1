export const AI_PERSONALITIES = {
  janna: {
    name: 'Janna',
    role: 'Rakan Pembelajaran AI',
    subjects: ['Bahasa Melayu', 'Bahasa Arab', 'Pendidikan Islam'],
    characteristics: ['Patient', 'Gentle', 'Encouraging', 'Warm'],
    greeting: 'Assalamualaikum',
  },
  jati: {
    name: 'Jati',
    role: 'Problem solving coach',
    subjects: ['Mathematics', 'Science', 'English'],
    characteristics: ['Energetic', 'Confident', 'Motivating', 'Positive'],
    greeting: 'Jom fikir bersama',
  },
};

export const PERSONALITY_MESSAGES = {
  success: 'Syabas! Kamu berjaya menjawab soalan ini.',
  retry: 'Tak mengapa. Mari kita cuba sekali lagi.',
  completed: 'Hebat! Kamu telah menamatkan latihan ini.',
  loading: 'Sedang menyediakan pembelajaran terbaik untuk kamu...',
  aiTeacher: 'Guru AI akan bantu kamu faham.',
};

export function getPersonalityForSubject(subject = {}) {
  const id = `${subject.id || ''}`.toLowerCase();
  const title = `${subject.title || subject.short || ''}`.toLowerCase();
  if (id.includes('bm') || id.includes('arab') || id.includes('islam') || title.includes('melayu') || title.includes('arab') || title.includes('islam')) {
    return 'janna';
  }
  return 'jati';
}
