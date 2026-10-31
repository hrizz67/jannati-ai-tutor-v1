import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { getSubjectTextProps } from '../../src/components/SubjectLanguageText.jsx';

const student = { id: 'synthetic-child', studentId: 'synthetic-child' };
const rewardFields = ['score', 'xp', 'coins', 'rewards', 'reward'];

async function runDialogue(base, prompts) {
  let history = [];
  const turns = [];
  for (const prompt of prompts) {
    const response = await getTutorResponse({ ...base, prompt, history });
    turns.push({ prompt, response });
    history = [...history,
      { role: 'user', text: prompt },
      {
        role: 'ai',
        text: response.text,
        intent: response.intent,
        source: response.source,
        dialogueClassification: response.dialogueClassification,
        privacySignal: response.privacySignal,
        safetySignal: response.safetySignal,
        pedagogicalState: response.pedagogicalState || null
      }
    ].slice(-12);
  }
  return turns;
}

function expectHelpInvariants(response, protectedAnswer = '') {
  expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
  expect(response.remoteAttempted).toBe(false);
  expect(response.generativeUsed).toBe(false);
  expect(response.expectedAnswer).toBe('');
  expect(response.acceptedAnswers).toEqual([]);
  expect(response.correctAnswer).toBe('');
  if (protectedAnswer) expect(response.text.toLocaleLowerCase('ms-MY')).not.toContain(protectedAnswer.toLocaleLowerCase('ms-MY'));
  for (const field of rewardFields) expect(response).not.toHaveProperty(field);
}

describe('P1 post-release Tutor natural dialogue remediation', () => {
  it('teaches a coherent five-turn BM exchange with progressively simpler support', async () => {
    const turns = await runDialogue({
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am', note: 'Kata nama am ialah nama umum bagi orang, haiwan, benda dan tempat.' },
      conversationKey: 'synthetic::bm::kata_nama_am::general',
      locale: 'ms-MY'
    }, ['Apa itu kata nama am?', 'Saya tak faham.', 'tak paham', 'x faham', 'pastu camna?']);

    expect(turns[0].response.text).toMatch(/kata nama am.*nama umum/iu);
    expect(turns.slice(1, 4).map(turn => turn.response.pedagogicalState?.misunderstandingCount)).toEqual([1, 2, 3]);
    expect(turns.slice(1, 4).map(turn => turn.response.pedagogicalState?.supportStage)).toEqual([
      'concept_explanation', 'alternative_strategy', 'guided_small_step'
    ]);
    expect(turns[4].response.studentTurn).toMatchObject({ intent: 'recovery_first_step', referencesPreviousTurn: true });
    expect(turns[4].response.text).toMatch(/langkah|cari|kenal pasti/iu);
    expect(turns.slice(1).map(turn => turn.response.text).join(' ')).not.toMatch(/soalan meminta kata nama tempat|mana satu kata nama khas/iu);
    for (const { response } of turns) expectHelpInvariants(response);
  });

  it('keeps a complete five-turn English exchange in English and grounded to common nouns', async () => {
    const turns = await runDialogue({
      student,
      subject: { id: 'english', title: 'English' },
      topic: { id: 'nouns', title: 'Nouns', note: 'A common noun is a general name for a person, animal, place, or thing.' },
      conversationKey: 'synthetic::english::nouns::general',
      locale: 'en-MY'
    }, ['What is a common noun?', "I don't understand.", 'What does that mean?', 'Can you give another example?', "Don't give me the answer directly."]);

    expect(turns[0].response.text).toMatch(/common noun.*general name/iu);
    expect(turns[2].response.studentTurn.intent).toBe('recovery_meaning');
    expect(turns[3].response.text).toMatch(/easy example.*(?:doctor|school)/iu);
    expect(turns[4].response.text).toMatch(/guide|clue|step/iu);
    for (const { response } of turns) {
      expectHelpInvariants(response);
      expect(response.text).not.toMatch(/\b(?:saya|kamu|soalan|contoh|bahagian|belum|tiada|baca|petunjuk)\b/iu);
    }
  });

  it('keeps a complete five-turn Arabic exchange in Arabic and renders it RTL', async () => {
    const turns = await runDialogue({
      student,
      subject: { id: 'arab', title: 'Bahasa Arab' },
      topic: { id: 'mufradat', title: 'Mufradat', note: 'Kosa kata asas sekolah, rumah, makanan dan kata mudah.' },
      conversationKey: 'synthetic::arab::mufradat::general',
      locale: 'ar-MY'
    }, ['ما معنى الاسم؟', 'لا أفهم.', 'ماذا يعني هذا؟', 'أعطني مثالًا آخر.', 'لا تعطيني الجواب مباشرة.']);

    expect(turns[0].response.text).toMatch(/الاسم.*(?:شخص|حيوان|مكان|شيء)/u);
    expect(turns[2].response.studentTurn.intent).toBe('recovery_meaning');
    expect(turns[3].response.text).toMatch(/مثال.*(?:كِتَاب|مَدْرَسَة)/u);
    expect(turns[4].response.text).toMatch(/(?:أرشد|خطوة|تلميح)/u);
    for (const { response } of turns) {
      expectHelpInvariants(response);
      expect(response.text).toMatch(/[\p{Script=Arabic}]/u);
      expect(response.text).not.toMatch(/\b(?:saya|kamu|soalan|contoh|baca|dengar|boleh|mufradat|the|answer)\b/iu);
      expect(getSubjectTextProps(response.text, 'arab', { teaching: true })).toEqual({ lang: 'ar', dir: 'rtl' });
    }
  });

  it.each(['Saya tak faham', 'tak paham', 'x faham', 'apa tu', 'pastu camna?'])(
    'answers informal BM follow-up with scoped teaching content: %s',
    async prompt => {
      const concept = 'bm::kata_nama_am::informal-1';
      const response = await getTutorResponse({
        student,
        subject: { id: 'bm', title: 'Bahasa Melayu' },
        topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
        question: { id: 'informal-1', q: 'Pilih kata nama tempat.', answer: 'taman', acceptedAnswers: ['taman'], options: ['taman', 'bermain'] },
        expectedAnswer: 'taman',
        acceptedAnswers: ['taman'],
        conversationKey: 'synthetic::bm::informal-1',
        history: [
          { role: 'user', text: 'Saya belum pasti cara memilihnya.' },
          {
            role: 'ai', text: 'Kata nama tempat menamakan sesuatu lokasi.', dialogueClassification: 'LOCAL_HANDLED',
            pedagogicalState: { currentConcept: concept, supportStage: 'concept_explanation', misunderstandingCount: 1 }
          }
        ],
        prompt
      });

      expectHelpInvariants(response, 'taman');
      expect(response.text).toMatch(/tempat|lokasi|kata nama|langkah|perkataan/iu);
      expect(response.text).not.toMatch(/beritahu subjek|topik atau soalan/iu);
    }
  );

  it('grounds the active question, corrects a false wrong-answer premise, and never reveals the protected answer', async () => {
    const question = {
      id: 'place-1',
      q: 'Kami bermain bola di ___. Pilih kata nama tempat.',
      instruction: 'Pilih perkataan yang menamakan tempat.',
      options: ['taman', 'bermain'],
      answer: 'taman',
      acceptedAnswers: ['taman'],
      explanation: 'Taman ialah kata nama tempat.'
    };
    const base = {
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question,
      expectedAnswer: question.answer,
      acceptedAnswers: question.acceptedAnswers,
      learnerAnswer: question.answer,
      isCorrect: true,
      attemptCount: 1,
      explanationMode: 'correct',
      conversationKey: 'synthetic::bm::place-1'
    };

    const asks = await getTutorResponse({ ...base, prompt: 'Dia tanya apa?' });
    const premise = await getTutorResponse({ ...base, prompt: 'Kenapa jawapan saya salah?' });
    expect(asks.text).toMatch(/kata nama tempat|perkataan.*tempat/iu);
    expect(premise.text).toMatch(/sebenarnya.*betul|ditanda betul/iu);
    expect(premise.text).not.toMatch(/belum tepat|jawapan.*salah/iu);
    expectHelpInvariants(asks, question.answer);
    expectHelpInvariants(premise, question.answer);
    expect(asks.isCorrect).toBeNull();
    expect(premise.isCorrect).toBeNull();
  });

  it('distinguishes taman as a place noun from bermain as a verb', async () => {
    const response = await getTutorResponse({
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      conversationKey: 'synthetic::bm::classification',
      prompt: 'Adakah taman kata nama tempat atau bermain kata nama tempat?'
    });

    expect(response.text).toMatch(/taman.*kata nama tempat/iu);
    expect(response.text).toMatch(/bermain.*kata kerja/iu);
    expectHelpInvariants(response);
  });

  it('asks for safe clarification when context is absent or stale instead of inventing details', async () => {
    const response = await getTutorResponse({
      student,
      history: [{ role: 'ai', text: 'Kita belajar topik lama.', pedagogicalState: { currentConcept: 'old::topic::q1', supportStage: 'concept_explanation' } }],
      prompt: 'Apa tu?'
    });

    expect(response.dialogueClassification).toBe('NEEDS_CLARIFICATION');
    expect(response.text).toMatch(/soalan yang mana|subjek.*topik/iu);
    expect(response.text).not.toMatch(/kata nama|ayat tanya|matematik/iu);
    for (const field of rewardFields) expect(response).not.toHaveProperty(field);
  });

  it.each([
    ['BM held-out', 'Saya masih keliru, boleh kecilkan langkah?', { id: 'bm', title: 'Bahasa Melayu' }, 'kata_nama_am', 'ms-MY', /kata nama|nama umum|perkataan/iu],
    ['English held-out', 'This part is confusing me.', { id: 'english', title: 'English' }, 'nouns', 'en-MY', /noun|name|word/iu],
    ['Arabic held-out', 'ما فهمت الفكرة بعد.', { id: 'arab', title: 'Bahasa Arab' }, 'mufradat', 'ar-MY', /(?:الاسم|الكلمة|المعنى)/u]
  ])('handles a held-out Year 2 confusion phrase: %s', async (_label, prompt, subject, topicId, locale, educationalContent) => {
    const response = await getTutorResponse({
      student,
      subject,
      topic: { id: topicId, title: topicId },
      conversationKey: `synthetic::${subject.id}::${topicId}::general`,
      locale,
      prompt
    });

    expect(response.studentTurn.intent).toBe('misunderstanding');
    expect(response.text).toMatch(educationalContent);
    expectHelpInvariants(response);
  });

  it('honours an exact BM example follow-up without revealing the active answer', async () => {
    const response = await getTutorResponse({
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: { id: 'example-1', q: 'Pilih kata nama tempat.', options: ['taman', 'bermain'], answer: 'taman', acceptedAnswers: ['taman'] },
      expectedAnswer: 'taman',
      acceptedAnswers: ['taman'],
      conversationKey: 'synthetic::bm::example-1',
      prompt: 'Cikgu bagi contoh lain.'
    });

    expect(response.studentTurn.intent).toBe('example_request');
    expect(response.text).toMatch(/contoh mudah.*(?:doktor|sekolah)/iu);
    expectHelpInvariants(response, 'taman');
  });

  it('keeps an accepted answer authoritative even when it resembles informal confusion', async () => {
    const response = await getTutorResponse({
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'dialog', title: 'Dialog' },
      question: { id: 'adversarial-answer', q: 'Salin frasa yang diberi.', answer: 'x faham', acceptedAnswers: ['x faham'] },
      expectedAnswer: 'x faham',
      acceptedAnswers: ['x faham'],
      conversationKey: 'synthetic::bm::adversarial-answer',
      prompt: 'x faham'
    });

    expect(response.studentTurn).toMatchObject({ intent: 'direct_answer', answerCandidate: 'x faham' });
    expect(response.isCorrect).toBe(true);
    for (const field of rewardFields) expect(response).not.toHaveProperty(field);
  });

  it('lets privacy and scope gates override dialogue phrases without remote access', async () => {
    const base = {
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      conversationKey: 'synthetic::bm::safety'
    };
    const privacy = await getTutorResponse({ ...base, prompt: 'Jangan bagi jawapan terus. Nombor telefon saya 0123456789.' });
    const unsupported = await getTutorResponse({ ...base, prompt: 'Boleh ajar saya hack akaun?' });

    expect(privacy.dialogueClassification).toBe('SAFETY_BLOCKED');
    expect(privacy.source).toBe('child-privacy');
    expect(privacy.text).not.toContain('0123456789');
    expect(unsupported.dialogueClassification).toBe('UNSUPPORTED');
    for (const response of [privacy, unsupported]) {
      expect(response.remoteAttempted).toBe(false);
      expect(response.generativeUsed).toBe(false);
      for (const field of rewardFields) expect(response).not.toHaveProperty(field);
    }
  });

  it('keeps an unsupported request in the Arabic locale fail-closed and in Arabic', async () => {
    const response = await getTutorResponse({
      student,
      subject: { id: 'arab', title: 'Bahasa Arab' },
      topic: { id: 'mufradat', title: 'Mufradat' },
      conversationKey: 'synthetic::arab::unsupported',
      locale: 'ar-MY',
      prompt: 'Boleh ajar saya hack akaun?'
    });

    expect(response.dialogueClassification).toBe('UNSUPPORTED');
    expect(response.text).toMatch(/[\p{Script=Arabic}]/u);
    expect(response.text).not.toMatch(/\b(?:saya|kamu|pelajaran|subjek|topik)\b/iu);
    expect(response.remoteAttempted).toBe(false);
    expect(response.generativeUsed).toBe(false);
  });

  it('does not reactivate a standalone teaching state after a topic switch', async () => {
    const response = await getTutorResponse({
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_kerja', title: 'Kata Kerja' },
      conversationKey: 'synthetic::bm::kata_kerja::general',
      history: [
        { role: 'user', text: 'Saya tak faham kata nama am.' },
        {
          role: 'ai', text: 'Kata nama am ialah nama umum.', dialogueClassification: 'LOCAL_HANDLED',
          pedagogicalState: { currentConcept: 'bm::kata_nama_am::general', supportStage: 'concept_explanation', misunderstandingCount: 1 }
        }
      ],
      prompt: 'Pastu camna?'
    });

    expect(response.studentTurn.hasTeachingStage).toBe(false);
    expect(response.studentTurn.intent).not.toBe('recovery_first_step');
    expect(response.text).not.toMatch(/kata nama am ialah nama umum/iu);
    expect(response.remoteAttempted).toBe(false);
  });
});
