import { describe, expect, it } from 'vitest';
import { detectLearningCategory } from '../../src/ai/learningCopy.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';

const actualChromeQuestion = Object.freeze({
  id: 'p26h1-chrome-benda',
  subjectId: 'bm',
  q: 'Baca ayat berikut: Siti membaca buku di ruang tamu. Apakah kata nama am bagi benda dalam ayat itu?',
  instruction: 'Baca ayat, kemudian jawab.',
  options: ['Siti', 'buku', 'ruang tamu', 'membaca'],
  answer: 'buku',
  acceptedAnswers: ['buku'],
  explanation: 'Buku ialah kata nama benda.'
});

const base = {
  student: { id: 'synthetic-p26h1', studentId: 'synthetic-p26h1' },
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: {
    id: 'kata_nama_am',
    title: 'Kata Nama Am',
    // Deliberately stale/irrelevant category text: it must NOT own the question.
    note: 'Contoh kata nama tempat ialah padang, sekolah dan taman.'
  },
  question: actualChromeQuestion,
  expectedAnswer: actualChromeQuestion.answer,
  acceptedAnswers: actualChromeQuestion.acceptedAnswers,
  conversationKey: 'synthetic-p26h1::bm::kata_nama_am::p26h1-chrome-benda'
};

const blockedCategory = /kata\s+nama\s+tempat|menamakan\s+tempat|nama\s+tempat|cari\s+.*\btempat\b|\bاسم\s+شخص\b|\bhijaiyah\b/iu;
const protectedAnswerDisclosure = /(?:jawapan(?:nya)?\s+(?:ialah|adalah|:)|jawapan\s+betul\s*:)\s*[“"']?buku\b/iu;

function expectSafeGroundedObject(response) {
  expect(response.questionId).toBe(actualChromeQuestion.id);
  expect(response.text).toMatch(/benda|objek/iu);
  expect(response.text).not.toMatch(blockedCategory);
  expect(response.text).not.toMatch(protectedAnswerDisclosure);
  expect(response.expectedAnswer).toBe('');
  expect(response.correctAnswer).toBe('');
  expect(response.acceptedAnswers).toEqual([]);
  expect(response.remoteAttempted).toBe(false);
  expect(response.generativeUsed).toBe(false);
  expect(response.isCorrect).toBeNull();
  for (const property of ['score', 'xp', 'coins', 'rewards']) {
    expect(response).not.toHaveProperty(property);
  }
}

describe('P2.6-H1 real Chrome active-question noun-category ownership', () => {
  it('treats the category explicitly requested by the active question as authoritative', () => {
    expect(detectLearningCategory(actualChromeQuestion, base.topic)).toBe('object');
    expect(detectLearningCategory({
      ...actualChromeQuestion,
      q: 'Di ruang tamu ada Ali dan buku. Apakah kata nama am untuk orang dalam ayat?',
      answer: 'Ali'
    }, base.topic)).toBe('person');
    expect(detectLearningCategory({
      ...actualChromeQuestion,
      q: 'Buku itu dibaca di sekolah. Apakah kata nama am bagi tempat dalam ayat?',
      answer: 'sekolah'
    }, base.topic)).toBe('place');
    expect(detectLearningCategory({
      ...actualChromeQuestion,
      q: 'Di zoo ada buku dan kucing. Apakah kata nama am bagi haiwan?',
      answer: 'kucing'
    }, base.topic)).toBe('animal');
  });

  it.each([
    'Dia tanya apa?',
    'Saya tak faham.',
    'Beri petunjuk.',
    'Bahagian mana dalam ayat ni saya kena tengok?',
    'Tak tau la.',
    'Boleh cakap senang sikit?',
    'Cikgu, saya pening.',
    'Sambung balik.'
  ])('maintains benda-category guidance for active Chrome question: %s', async prompt => {
    const response = await getTutorResponse({ ...base, prompt, history: [] });
    expectSafeGroundedObject(response);
  });

  it('never adopts a child\'s false place-category premise as the target of the active object question', async () => {
    const response = await getTutorResponse({
      ...base,
      prompt: 'Macam mana saya nak tahu itu nama tempat?'
    });
    expect(response.questionId).toBe(actualChromeQuestion.id);
    expect(response.expectedAnswer).toBe('');
    expect(response.isCorrect).toBeNull();
    expect(response.text).not.toMatch(/soalan\s+(?:ini\s+)?meminta\s+(?:kata\s+nama\s+)?tempat|cari\s+.*\btempat\b/iu);
  });

  it('does not jump into an unrelated Arabic Hijaiyah lesson on an informal BM confusion turn', async () => {
    const response = await getTutorResponse({ ...base, prompt: 'Hah?' });
    expect(response.text).not.toMatch(/hijaiyah|huruf\s+arab|\bا\s*ب\s*ت\b/iu);
    expect(response.questionId).toBe(actualChromeQuestion.id);
    expect(response.remoteAttempted).toBe(false);
  });

  it('preserves the active object category across the seven-turn browser sequence', async () => {
    let history = [];
    for (const prompt of [
      'Dia tanya apa?', 'Saya tak faham.', 'Beri petunjuk.',
      'Bahagian mana dalam ayat ni saya kena tengok?',
      'Macam mana saya nak tahu itu nama tempat?',
      'Saya dah faham.', 'Pastu camna?'
    ]) {
      const response = await getTutorResponse({ ...base, prompt, history });
      expect(response.questionId).toBe(actualChromeQuestion.id);
      expect(response.text).not.toMatch(/cari\s+perkataan\s+yang\s+menamakan\s+tempat|soalan\s+meminta\s+kata\s+nama\s+tempat/iu);
      expect(response.expectedAnswer).toBe('');
      expect(response.isCorrect).toBeNull();
      history = buildBoundedDialogueContext([
        ...history,
        { role: 'user', text: prompt },
        {
          role: 'ai', text: response.text, source: response.source,
          dialogueClassification: response.dialogueClassification,
          privacySignal: response.privacySignal,
          safetySignal: response.safetySignal,
          pedagogicalState: response.pedagogicalState
        }
      ]);
    }
  });

  it('does not reuse the object category after the question identity changes to place', async () => {
    const next = {
      ...actualChromeQuestion,
      id: 'p26h1-place-new-scope',
      q: 'Kami bermain bola di ___. Pilih kata nama tempat.',
      instruction: 'Pilih kata nama tempat.',
      answer: 'padang',
      acceptedAnswers: ['padang'],
      options: ['padang', 'buku', 'bermain']
    };
    const response = await getTutorResponse({
      ...base,
      question: next,
      expectedAnswer: 'padang',
      acceptedAnswers: ['padang'],
      conversationKey: 'synthetic-p26h1::bm::kata_nama_am::p26h1-place-new-scope',
      prompt: 'Dia tanya apa?',
      history: []
    });
    expect(response.questionId).toBe(next.id);
    expect(response.text).toMatch(/tempat/iu);
    expect(response.text).not.toMatch(/cari\s+(?:kata\s+nama\s+)?benda/iu);
  });
});
