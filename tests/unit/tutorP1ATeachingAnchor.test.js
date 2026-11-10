import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { sanitizeTutorPedagogicalState } from '../../src/ai/conversation/boundedConversationMemory.js';

const student = { id: 'synthetic-child', studentId: 'synthetic-child' };
const bmSubject = { id: 'bm', title: 'Bahasa Melayu' };
const rewardFields = ['score', 'mastery', 'xp', 'stars', 'coins', 'rewards', 'reward'];

function appendTurn(history, prompt, response) {
  return [...history,
    { role: 'user', text: prompt },
    {
      role: 'ai',
      text: response.text,
      source: response.source,
      intent: response.intent,
      dialogueClassification: response.dialogueClassification,
      pedagogicalState: response.pedagogicalState || null
    }
  ].slice(-12);
}

async function runTranscript(prompts, base = {}) {
  let history = [];
  const turns = [];
  for (const prompt of prompts) {
    const response = await getTutorResponse({
      student,
      subject: bmSubject,
      conversationKey: 'synthetic-account::synthetic-child::bm::general::session-a',
      ...base,
      prompt,
      history
    });
    turns.push({ prompt, response });
    history = appendTurn(history, prompt, response);
  }
  return { turns, history };
}

async function runAuditTranscript(base = {}) {
  return runTranscript([
    'Apa itu kata nama am?',
    'Saya tak faham.',
    'Tak paham. Cikgu bagi contoh lain.',
    'Pastu camna? Jangan bagi jawapan terus.',
    'Apa tu? X faham.'
  ], base);
}

function expectUngradedSafe(response) {
  expect(response).toMatchObject({
    expectedAnswer: '',
    correctAnswer: '',
    acceptedAnswers: [],
    learnerAnswer: '',
    isCorrect: null
  });
  for (const field of rewardFields) expect(response).not.toHaveProperty(field);
}

describe('P1-A scoped multi-turn teaching anchor', () => {
  it('continues the exact five-turn BM Chrome transcript without a synthetic topic note', async () => {
    const { turns } = await runAuditTranscript();
    const texts = turns.map(turn => turn.response.text);

    expect(texts[0]).toMatch(/kata nama am.*nama umum/iu);
    expect(turns[0].response.pedagogicalState?.teachingAnchor).toMatchObject({
      type: 'curriculum_concept',
      subjectId: 'bm',
      conceptId: 'common_noun'
    });

    expect(texts[1]).toMatch(/kata nama am|nama umum/iu);
    expect(texts[1]).toMatch(/contoh|orang|haiwan|tempat|benda/iu);
    expect(texts[2]).toMatch(/contoh/iu);
    expect(texts[2]).toMatch(/orang|haiwan|tempat|benda/iu);
    expect(texts[3]).toMatch(/tanpa memberi jawapan|petunjuk|langkah/iu);
    expect(texts[3]).toMatch(/nama|orang|haiwan|tempat|benda/iu);
    expect(texts[4]).toMatch(/kata nama am|nama umum|menamakan|kumpulannya/iu);
    expect(texts[4]).toMatch(/langkah|cari|tanya|pilih|tentukan/iu);

    expect(new Set(texts).size).toBe(5);
    expect(texts.slice(1).join(' ')).not.toMatch(/baca soalan ini|beritahu saya subjek|maklumat pembelajaran yang disahkan/iu);
    expect(texts.slice(1).join(' ')).not.toMatch(/pilih atau taip satu jawapan dahulu/iu);
    expect(turns.slice(1).map(turn => turn.response.pedagogicalState?.misunderstandingCount)).toEqual([1, 2, 2, 3]);
    expect(JSON.stringify(turns.map(turn => turn.response.pedagogicalState?.teachingAnchor))).not.toMatch(/synthetic-account|synthetic-child|session-a/iu);
    for (const { response } of turns) expectUngradedSafe(response);
  });

  it('does not reuse the prior teaching anchor across an account, child, or session boundary', async () => {
    const { history } = await runAuditTranscript();
    for (const conversationKey of [
      'other-account::synthetic-child::bm::general::session-a',
      'synthetic-account::other-child::bm::general::session-a',
      'synthetic-account::synthetic-child::bm::general::session-b'
    ]) {
      const response = await getTutorResponse({
        student,
        subject: bmSubject,
        conversationKey,
        history,
        prompt: 'Apa tu? X faham.'
      });

      expect(response.text).not.toMatch(/kata nama am|nama umum/iu);
      expect(response.pedagogicalState?.teachingAnchor || null).toBeNull();
      expectUngradedSafe(response);
    }
  });

  it('keeps the anchor on the active scope when the subject catalog infers a topic', async () => {
    const { turns } = await runAuditTranscript({
      subject: {
        ...bmSubject,
        topics: [{
          id: 'kata_nama_am',
          title: 'Kata Nama Am',
          note: 'Kata nama am ialah nama umum.'
        }]
      }
    });

    expect(turns[0].response.topic).toMatch(/kata nama am/iu);
    expect(turns[0].response.pedagogicalState?.teachingAnchor?.topicId).toBe('');
    expect(turns.slice(1).every(turn => turn.response.pedagogicalState?.teachingAnchor?.conceptId === 'common_noun')).toBe(true);
    expect(turns[1].response.text).toMatch(/kata nama am.*nama umum/iu);
  });

  it('does not reuse the prior teaching anchor after a subject scope change', async () => {
    const { history } = await runAuditTranscript();
    const response = await getTutorResponse({
      student,
      subject: { id: 'science', title: 'Sains' },
      conversationKey: 'synthetic-account::synthetic-child::science::general::session-b',
      history,
      prompt: 'Apa tu? X faham.'
    });

    expect(response.text).not.toMatch(/kata nama am|nama umum/iu);
    expect(response.pedagogicalState?.teachingAnchor || null).toBeNull();
    expectUngradedSafe(response);
  });

  it('does not reuse a general anchor for a different active question and protects its answer', async () => {
    const { history } = await runAuditTranscript();
    const response = await getTutorResponse({
      student,
      subject: bmSubject,
      topic: { id: 'kata_nama_tempat', title: 'Kata Nama Tempat' },
      question: {
        id: 'place-q2',
        q: 'Kami bermain bola di ___. Pilih kata nama tempat.',
        instruction: 'Pilih perkataan yang menamakan tempat.',
        options: ['taman', 'bermain'],
        answer: 'taman',
        acceptedAnswers: ['taman']
      },
      expectedAnswer: 'taman',
      acceptedAnswers: ['taman'],
      conversationKey: 'synthetic-account::synthetic-child::bm::kata_nama_tempat::place-q2::session-a',
      history,
      prompt: 'Dia tanya apa? Jangan beri jawapan terus.'
    });

    expect(response.text).toMatch(/kata nama tempat|perkataan.*tempat|petunjuk/iu);
    expect(response.text).not.toMatch(/kata nama am.*nama umum/iu);
    expect(response.text).not.toMatch(/\btaman\b/iu);
    expectUngradedSafe(response);
  });

  it('persists only the typed anchor allowlist and drops arbitrary or personal fields', () => {
    const state = sanitizeTutorPedagogicalState({
      supportStage: 'concept_introduction',
      teachingAnchor: {
        version: 1,
        type: 'curriculum_concept',
        scopeId: 'abc123',
        subjectId: 'bm',
        topicId: '',
        questionId: '',
        conceptId: 'common_noun',
        explanation: 'Nama penuh murid sintetik',
        transcript: ['Mesej yang tidak patut disimpan']
      }
    });

    expect(state.teachingAnchor).toEqual({
      version: 1,
      type: 'curriculum_concept',
      scopeId: 'abc123',
      subjectId: 'bm',
      topicId: '',
      questionId: '',
      conceptId: 'common_noun'
    });
    expect(JSON.stringify(state)).not.toMatch(/nama penuh|transcript|mesej yang tidak patut/iu);
  });

  it('understands a learner answer to its own conceptual check without grading the quiz', async () => {
    const { turns } = await runTranscript([
      'Apa itu kata nama am?',
      'Saya tak faham.',
      'haiwan',
      'Kenapa?',
      'Saya masih tak faham.'
    ]);

    expect(turns[1].response.text).toMatch(/kucing.*haiwan atau perbuatan/iu);
    expect(turns[2].response.text).toMatch(/betul|tepat/iu);
    expect(turns[2].response.text).toMatch(/kucing.*haiwan|kata nama am/iu);
    expect(turns[2].response.intent).toBe('understanding_confirmation');
    expect(turns[3].response.text).toMatch(/kucing|haiwan|kata nama am/iu);
    expect(turns[4].response.text).toMatch(/kata nama am|nama umum|orang|haiwan|tempat|benda/iu);
    expect(turns[4].response.pedagogicalState?.teachingAnchor?.conceptId).toBe('common_noun');
    for (const { response } of turns.slice(2)) expectUngradedSafe(response);
  });

  it('grounds a natural deictic meaning follow-up in the active teaching anchor', async () => {
    const { turns } = await runTranscript([
      'Apa itu kata nama am?',
      'Yang tadi maksudnya apa?'
    ]);

    expect(turns[1].response.intent).toBe('recovery_meaning');
    expect(turns[1].response.text).toMatch(/kata nama am|nama umum|orang|haiwan|tempat|benda/iu);
    expect(turns[1].response.text).not.toMatch(/belum pasti bahagian|nyatakan nama subjek/iu);
    expectUngradedSafe(turns[1].response);
  });

  it.each([
    'Apa itu kata kerja?',
    'Saya mahu belajar kata kerja'
  ])('does not resurrect a stale anchor after a same-session concept switch: %s', async switchPrompt => {
    const { turns } = await runTranscript([
      'Apa itu kata nama am?',
      switchPrompt,
      'Saya tak faham.'
    ]);

    expect(turns[1].response.text).toMatch(/kata kerja|kemahiran atau soalan/iu);
    expect(turns[2].response.text).not.toMatch(/kata nama am|nama umum|kucing.*haiwan/iu);
    expect(turns[2].response.pedagogicalState?.teachingAnchor || null).toBeNull();
    expectUngradedSafe(turns[2].response);
  });
});
