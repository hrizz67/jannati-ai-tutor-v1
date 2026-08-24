import React from 'react';
import { createRoot } from 'react-dom/client';
import TutorAIModal from '/src/components/ai/TutorAIModal.jsx';
import AIExplainModal from '/src/components/ai/AIExplainModal.jsx';
import AITeacherModal from '/src/components/ai/AITeacherModal.jsx';

const params = new URLSearchParams(window.location.search);
const modal = params.get('modal') || 'explain';
const scrollTarget = params.get('scroll') || 'top';
const focusTarget = params.get('focus') || '';

const context = {
  questionId: 'STAGE7D-Q1',
  subjectId: 'math',
  topicId: 'wang',
  subjectTitle: 'Matematik',
  topicTitle: 'Wang',
  questionText: 'Aina membeli pensel berharga RM3 dan pemadam RM2. Berapakah jumlah wang yang perlu dibayar?',
  expectedAnswer: 'RM5'
};

const explainData = {
  generatedMode: 'explain',
  sourceQuestionId: context.questionId,
  sourceSubjectId: context.subjectId,
  sourceTopicId: context.topicId,
  shortText: 'Kita perlu campurkan harga pensel dan pemadam.',
  explanation: 'Tambah RM3 dengan RM2 untuk mencari jumlah harga semua barang.',
  examples: [
    'Jika satu buku RM4 dan satu pensel RM1, jumlahnya RM5.',
    'Jika dua item berharga RM2 dan RM3, kita tambah kedua-duanya.'
  ],
  extraExamples: [
    'RM6 + RM2 = RM8.',
    'RM1 + RM5 = RM6.'
  ],
  commonMistakes: [
    'Tersalah tolak harga barang.',
    'Lupa guna simbol RM.'
  ],
  memoryTips: [
    'Perkataan jumlah biasanya bermaksud tambah.',
    'Semak semua harga sebelum menjawab.'
  ],
  followUpQuestions: [
    'Jika Aina membeli satu lagi pemadam RM2, berapakah jumlah baharu?',
    'Apa jadi jika harga pensel ialah RM4?'
  ],
  sections: {
    summary: 'Jumlah bermaksud kita perlu tambah semua harga.',
    whyCorrect: 'RM3 + RM2 = RM5, jadi Aina perlu bayar RM5.',
    hint: 'Lihat semua harga, kemudian tambah satu demi satu.',
    steps: [
      'Kenal pasti harga pertama: RM3.',
      'Kenal pasti harga kedua: RM2.',
      'Tambah kedua-dua harga untuk dapatkan jumlah.'
    ],
    commonMistake: 'Jangan tolak harga kerana soalan meminta jumlah.',
    memoryTip: 'Jumlah = tambah.',
    coachMessage: 'Bagus! Sekarang kamu nampak cara kira langkah demi langkah.'
  },
  correctAnswer: 'RM5'
};

const teacherData = {
  generatedMode: 'teach',
  sourceQuestionId: context.questionId,
  sourceSubjectId: context.subjectId,
  sourceTopicId: context.topicId,
  shortText: 'Jom belajar cara menambah wang dengan tenang.',
  explanation: 'Apabila dua harga diberi, kita tambah untuk mencari jumlah.',
  examples: [
    'RM2 + RM3 = RM5',
    'RM5 + RM1 = RM6'
  ],
  extraExamples: [
    'RM4 + RM2 = RM6',
    'RM7 + RM1 = RM8'
  ],
  commonMistakes: [
    'Menjawab tanpa menyebut unit RM.',
    'Tersalah campur nilai pertama dan kedua.'
  ],
  followUpQuestions: [
    'Jika Aina membeli pemadam lagi satu, berapa jumlah baharu?'
  ],
  sections: {
    summary: 'Kita belajar tambah wang sedikit demi sedikit.',
    whyCorrect: 'Tambah harga pertama dan harga kedua supaya dapat jumlah semua barang.',
    hint: 'Gunakan jari atau garis nombor jika perlu.',
    steps: [
      'Baca harga setiap barang.',
      'Tulis ayat matematik: RM3 + RM2.',
      'Kira jumlahnya dengan teliti.'
    ],
    commonMistake: 'Jangan tertinggal simbol RM pada jawapan akhir.',
    memoryTip: 'Jumlah harga = semua harga ditambah.',
    practicePrompt: 'Cuba kira semula dengan suara perlahan: tiga ringgit tambah dua ringgit sama dengan lima ringgit.',
    coachMessage: 'Hebat! Janna akan bantu kamu ulang langkah sampai yakin.'
  }
};

const tutorProps = {
  open: true,
  profile: { name: 'Aina' },
  adaptiveProfile: { studentId: 'aina-1' },
  selectedSubject: { id: 'math', title: 'Matematik' },
  selectedTopic: { id: 'wang', title: 'Wang', learningObjective: 'Tambah jumlah wang mudah' },
  question: { id: context.questionId, q: context.questionText, answer: 'RM5', options: ['RM4', 'RM5', 'RM6', 'RM7'] },
  answer: 'RM4',
  feedback: { status: 'incorrect' },
  questionText: context.questionText,
  instruction: 'Pilih jumlah wang yang betul.',
  options: ['RM4', 'RM5', 'RM6', 'RM7'],
  expectedAnswer: 'RM5',
  acceptedAnswers: ['RM5', '5'],
  learnerAnswer: 'RM4',
  explanationMode: 'wrong_answer_coaching',
  currentLearningObjective: 'Tambah jumlah wang mudah',
  attemptCount: 1,
  hintsUsed: 1,
  learningObservation: {},
  predictionProfile: {},
  readiness: {},
  studyPlan: {},
  gamificationProfile: {},
  weakTopics: ['wang'],
  strongTopics: ['masa'],
  onTutup: () => {}
};

function StageHarness() {
  React.useEffect(() => {
    const body = document.querySelector('.ai-chat-body, .ai-explain-body, .ai-teacher-body');
    if (body) {
      if (scrollTarget === 'middle') body.scrollTop = body.scrollHeight / 2;
      if (scrollTarget === 'bottom') body.scrollTop = body.scrollHeight;
    }
    if (focusTarget === 'input') {
      document.querySelector('.ai-chat-input input')?.focus();
    }
  }, []);

  return (
    <div className="stage7d-backdrop">
      <div className="stage7d-card" aria-hidden="true">
        <h1>Stage 7D Modal Harness</h1>
        <p>Latar belakang ini memastikan overlay, safe-area, dan layering boleh diperiksa semasa tangkapan skrin.</p>
      </div>
      {modal === 'tutor' && <TutorAIModal {...tutorProps} />}
      {modal === 'teacher' && <AITeacherModal open data={teacherData} context={context} character="janna" onTutup={() => {}} onLatih={() => {}} />}
      {modal === 'explain' && <AIExplainModal open data={explainData} context={context} question={{ answer: 'RM5' }} character="jati" onTutup={() => {}} onTryAgain={() => {}} onTeach={() => {}} />}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<StageHarness />);
