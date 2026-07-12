import jatiAvatar from '../assets/mascot/jati-optimized.png';

export const AI_PERSONALITIES = {
  janna: {
    name: 'Janna',
    role: 'Rakan Pembelajaran AI',
    subjects: ['Bahasa Melayu', 'Bahasa Arab', 'Pendidikan Islam'],
    characteristics: ['Sabar', 'Lembut', 'Menggalakkan', 'Mesra'],
    greeting: 'Assalamualaikum',
  },
  jati: {
    name: 'Jati',
    role: 'Jurulatih Penyelesaian Masalah',
    avatar: jatiAvatar,
    subjects: ['Matematik', 'Sains', 'Bahasa Inggeris'],
    characteristics: ['Bertenaga', 'Yakin', 'Memberi Semangat', 'Positif'],
    greeting: 'Jom fikir bersama',
  },
};

export const PERSONALITY_MESSAGES = {
  success: 'Syabas! Kamu berjaya menjawab soalan ini.',
  retry: 'Tak mengapa 😊 Mari kita cuba sekali lagi.',
  completed: 'Hebat! Kamu telah menamatkan latihan ini.',
  loading: 'Sedang menyediakan pembelajaran terbaik untuk kamu...',
  aiTeacher: 'Mari kita belajar bersama.',
};

export function getPersonalityForSubject(subject = {}) {
  const id = `${subject.id || ''}`.toLowerCase();
  const title = `${subject.title || subject.short || ''}`.toLowerCase();
  if (id.includes('bm') || id.includes('arab') || id.includes('islam') || title.includes('melayu') || title.includes('arab') || title.includes('islam')) {
    return 'janna';
  }
  return 'jati';
}
