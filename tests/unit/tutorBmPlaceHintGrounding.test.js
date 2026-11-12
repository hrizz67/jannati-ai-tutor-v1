import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const student = { id: 'synthetic-p26c-bm-hint', studentId: 'synthetic-p26c-bm-hint' };
const subject = { id: 'bm', title: 'Bahasa Melayu' };
const topic = { id: 'kata_nama_am', title: 'Kata Nama Am' };

function context(questionText, conversationKey) {
  return {
    student, subject, topic,
    question: {
      id: 'p26c-bm-grounded-q', q: questionText,
      answer: 'taman', acceptedAnswers: ['taman'], options: ['taman', 'berlari']
    },
    expectedAnswer: 'taman', acceptedAnswers: ['taman'],
    locale: 'ms-MY', conversationKey
  };
}

function assertLocalSafeTeaching(response) {
  expect(response.studentTurn?.intent).toBe('question_help');
  expect(response.studentTurn?.messageType).not.toBe('answer_attempt');
  expect(response.isCorrect ?? null).toBeNull();
  expect(response.expectedAnswer ?? '').toBe('');
  expect(response.correctAnswer ?? '').toBe('');
  expect(response.acceptedAnswers ?? []).toEqual([]);
  expect(response.remoteAttempted).toBe(false);
  expect(response.generativeUsed).toBe(false);
  expect(String(response.text || '')).not.toContain('taman');
  for (const field of ['xp', 'score', 'coins', 'rewards']) {
    expect(response).not.toHaveProperty(field);
  }
}

describe('P2.6-C BM location-hint grounding without invented question clues', () => {
  it('does not invent di or a blank when the question only asks for a place noun', async () => {
    const result = await getTutorResponse({
      ...context('Pilih kata nama tempat.', 'synthetic::p26c::bm::no-di'),
      prompt: 'Dia tanya apa?'
    });
    assertLocalSafeTeaching(result);
    expect(result.text).toContain('Soalan meminta kata nama tempat');
    expect(result.text).not.toContain('Lihat perkataan “di”');
    expect(result.text).not.toContain('sebelum tempat kosong');
  });

  it('may use the di clue only when di and a blank are visible in the stem', async () => {
    const result = await getTutorResponse({
      ...context('Kami bermain bola di ___ . Pilih kata nama tempat.', 'synthetic::p26c::bm::with-di'),
      prompt: 'Dia tanya apa?'
    });
    assertLocalSafeTeaching(result);
    expect(result.text).toContain('Lihat perkataan “di” sebelum tempat kosong');
  });

  it('keeps the normal general help fallback for a question without a place clue', async () => {
    const result = await getTutorResponse({
      ...context('Baca soalan ini dengan teliti.', 'synthetic::p26c::bm::generic'),
      prompt: 'Dia tanya apa?'
    });
    assertLocalSafeTeaching(result);
    expect(result.text).toContain('Lihat arahan dahulu');
    expect(result.text).not.toContain('Lihat perkataan “di”');
  });
});
