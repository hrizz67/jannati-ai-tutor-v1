import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';

const student = { id: 'synthetic-p26c-child-A', studentId: 'synthetic-p26c-child-A' };

const scenarios = [
  {
    id: 'bm-active-question-five-turns',
    context: {
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: { id: 'p26c-bm-q', q: 'Pilih kata nama tempat.', answer: 'taman', acceptedAnswers: ['taman'], options: ['taman', 'berlari'] },
      expectedAnswer: 'taman', acceptedAnswers: ['taman'],
      locale: 'ms-MY', conversationKey: 'synthetic::p26c::bm::q'
    },
    steps: [
      { prompt: 'Dia tanya apa?' },
      { prompt: 'Saya tak faham.' },
      { prompt: 'Beri petunjuk.' },
      { prompt: 'Saya dah faham.' },
      { prompt: 'Pastu camna?' }
    ]
  },
  {
    id: 'en-switch-to-approved-topic-five-turns',
    context: {
      student,
      subject: { id: 'english', title: 'English', topics: [
        { id: 'verbs', title: 'Verbs', note: 'Verbs show an action.' },
        { id: 'nouns', title: 'Nouns', note: 'Nouns name a person, animal, place, or thing.' }
      ] },
      topic: { id: 'verbs', title: 'Verbs' },
      question: { id: 'p26c-en-old', q: 'Choose the action word.', answer: 'jumping', acceptedAnswers: ['jumping'] },
      expectedAnswer: 'jumping', acceptedAnswers: ['jumping'],
      locale: 'en-MY', conversationKey: 'synthetic::p26c::en::old'
    },
    steps: [
      { prompt: 'I want to learn nouns and places' },
      { prompt: 'Can you explain nouns?', newScope: true },
      { prompt: "I don't understand", newScope: true },
      { prompt: 'What does that mean?', newScope: true },
      { prompt: 'I understand now', newScope: true }
    ]
  },
  {
    id: 'ar-study-plan-and-coaching-five-turns',
    context: {
      student,
      subject: { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'mufradat', title: 'مفردات' }] },
      topic: { id: 'mufradat', title: 'مفردات' },
      question: { id: 'p26c-ar-q', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] },
      expectedAnswer: 'مدرسة', acceptedAnswers: ['مدرسة'],
      locale: 'ar-MY', conversationKey: 'synthetic::p26c::ar::q'
    },
    steps: [
      { prompt: 'ماذا أتعلم اليوم؟' },
      { prompt: 'ابدأ بالشرح' },
      { prompt: 'لا أفهم' },
      { prompt: 'فهمت الآن' },
      { prompt: 'لماذا إجابتي خاطئة؟' }
    ]
  },
  {
    id: 'en-unknown-topic-and-recovery-five-turns',
    context: {
      student,
      subject: { id: 'english', title: 'English', topics: [{ id: 'nouns', title: 'Nouns', note: 'Nouns name things.' }] },
      topic: { id: 'nouns', title: 'Nouns' },
      question: { id: 'p26c-en-unknown-q', q: 'Choose the noun.', answer: 'teacher', acceptedAnswers: ['teacher'] },
      expectedAnswer: 'teacher', acceptedAnswers: ['teacher'],
      locale: 'en-MY', conversationKey: 'synthetic::p26c::en::unknown'
    },
    steps: [
      { prompt: 'I want to learn astronomy and galaxies' },
      { prompt: 'I want to learn', newScope: true },
      { prompt: 'Can we continue?', newScope: true },
      { prompt: 'I want to study nouns', newScope: true },
      { prompt: 'Show an example', newScope: true }
    ]
  }
];

function actualContext(scenario, step) {
  if (!step.newScope) return scenario.context;
  const isEnglish = scenario.context.subject.id === 'english';
  return {
    ...scenario.context,
    topic: isEnglish ? { id: 'nouns', title: 'Nouns', note: 'Nouns name a person, animal, place or thing.' } : scenario.context.topic,
    question: null,
    expectedAnswer: '',
    acceptedAnswers: [],
    conversationKey: scenario.context.conversationKey + '::new-topic'
  };
}

async function probe(scenario) {
  let history = [];
  const records = [];
  for (const [index, step] of scenario.steps.entries()) {
    const scope = actualContext(scenario, step);
    const response = await getTutorResponse({ ...scope, prompt: step.prompt, history });
    const priorAnswer = scenario.context.question?.answer || '';
    const report = {
      scenario: scenario.id,
      turn: index + 1,
      prompt: step.prompt,
      dialogueClassification: response.dialogueClassification,
      intent: response.studentTurn?.intent ?? response.intent,
      messageType: response.studentTurn?.messageType ?? null,
      topic: response.topic ?? '',
      questionId: response.questionId ?? '',
      nextStage: response.pedagogicalState?.supportStage ?? '',
      hasTeachingStage: Boolean(response.studentTurn?.hasTeachingStage),
      answerAttempt: response.studentTurn?.messageType === 'answer_attempt',
      needsClarification: Boolean(response.needsClarification),
      text: String(response.text || '').slice(0, 300)
    };
    records.push(report);
    if (response.isCorrect !== null && response.isCorrect !== undefined) {
      console.log('P26C_UNEXPECTED_GRADE=' + JSON.stringify({
        ...report, isCorrect: response.isCorrect,
        answerCandidate: response.studentTurn?.answerCandidate ?? '',
        expectedAnswerExposed: Boolean(response.expectedAnswer || response.correctAnswer),
        protectedAnswerExposed: Boolean(priorAnswer && String(response.text || '').includes(priorAnswer))
      }));
    }

    // These scripted utterances ask for teaching, not a quiz answer.
    // The user-facing public API must remain ungraded, local and answer-safe.
    expect(response.remoteAttempted).toBe(false);
    expect(response.generativeUsed).toBe(false);
    expect(response.isCorrect ?? null).toBeNull();
    expect(response.expectedAnswer ?? '').toBe('');
    expect(response.acceptedAnswers ?? []).toEqual([]);
    expect(response.correctAnswer ?? '').toBe('');
    expect(response.options ?? []).toEqual([]);
    for (const field of ['xp','coins','score','rewards']) expect(response).not.toHaveProperty(field);
    expect(String(response.text || '')).not.toContain(priorAnswer);
    if (step.newScope || (scenario.id.includes('en-') && index === 0)) {
      expect(response.questionId ?? '').toBe('');
      expect(response.questionText ?? '').toBe('');
    }
    history = buildBoundedDialogueContext([...history,
      { role: 'user', text: step.prompt },
      {
        role: 'ai', text: response.text, intent: response.intent,
        dialogueClassification: response.dialogueClassification,
        source: response.source,
        privacySignal: response.privacySignal,
        safetySignal: response.safetySignal,
        pedagogicalState: response.pedagogicalState ?? null
      }
    ]);
  }
  return records;
}

describe('P2.6-C current-main controlled five-turn cross-language audit', () => {
  it.each(scenarios)('captures real public responses and enforces safety for $id', async scenario => {
    const records = await probe(scenario);
    console.log('P26C_MULTITURN_AUDIT=' + JSON.stringify(records));
    expect(records).toHaveLength(5);
  });
});
