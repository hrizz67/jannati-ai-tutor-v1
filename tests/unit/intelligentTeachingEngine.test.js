import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  TEACHING_SIGNAL,
  TEACHING_STRATEGY,
  buildIntelligentTeachingTurn
} from '../../src/ai/pedagogy/intelligentTeachingEngine.js';
import { createBoundedTutorConversationMemory } from '../../src/ai/conversation/boundedConversationMemory.js';
import { classifyMisconception } from '../../src/ai/guidedLearning/learningExperience.js';

const teachingContent = {
  grounded: true,
  explanations: ['Kata nama ialah perkataan untuk orang, haiwan, tempat atau benda.'],
  examples: ['“Doktor” ialah kata nama bagi orang.', '“Sekolah” ialah kata nama bagi tempat.'],
  verifiedExamples: ['“Doktor” ialah kata nama bagi orang.', '“Sekolah” ialah kata nama bagi tempat.'],
  alternatives: ['Cari siapa atau apa yang dinamakan dalam ayat.'],
  steps: ['Cari perkataan yang menamakan orang, haiwan, tempat atau benda.'],
  checkQuestions: ['Perkataan manakah menamakan orang dalam ayat ini']
};

function buildArgs(overrides = {}) {
  return {
    studentTurn: { intent: 'misunderstanding', messageType: 'learning_request' },
    resolvedIntent: 'misunderstanding',
    history: [],
    subjectId: 'bm',
    topicId: 'kata-nama',
    topicLabel: 'Kata Nama',
    questionId: 'BM-KN-001',
    learnerAnswer: '',
    options: ['Ali', 'berlari', 'cantik'],
    expectedAnswer: 'Ali',
    acceptedAnswers: ['Ali'],
    isCorrect: false,
    guidedMisconception: null,
    teachingContent,
    locale: 'ms-MY',
    languagePresentation: { teachingLanguage: 'ms' },
    ...overrides
  };
}

function withPriorTurn(result) {
  return [{ role: 'ai', text: result.reply?.text || '', pedagogicalState: result.pedagogicalState }];
}

function questionCount(value = '') {
  return (String(value).match(/[?؟]/g) || []).length;
}

describe('intelligent teaching progression', () => {
  it('progresses from concept to an alternative strategy and then one small step', () => {
    const first = buildIntelligentTeachingTurn(buildArgs());
    const second = buildIntelligentTeachingTurn(buildArgs({ history: withPriorTurn(first) }));
    const third = buildIntelligentTeachingTurn(buildArgs({ history: [...withPriorTurn(first), ...withPriorTurn(second)] }));

    expect(first.pedagogicalState).toMatchObject({
      misunderstandingCount: 1,
      strategyUsed: TEACHING_STRATEGY.CONCEPT_AND_EXAMPLE,
      supportStage: 'concept_explanation'
    });
    expect(second.pedagogicalState).toMatchObject({
      misunderstandingCount: 2,
      strategyUsed: TEACHING_STRATEGY.ALTERNATIVE_CONNECTION,
      supportStage: 'alternative_strategy'
    });
    expect(third.pedagogicalState).toMatchObject({
      misunderstandingCount: 3,
      strategyUsed: TEACHING_STRATEGY.ONE_SMALL_STEP,
      supportStage: 'guided_small_step'
    });
    expect(new Set([first.reply.text, second.reply.text, third.reply.text]).size).toBe(3);
    expect(questionCount(first.reply.text)).toBe(1);
    expect(questionCount(second.reply.text)).toBe(1);
    expect(questionCount(third.reply.text)).toBe(1);
  });

  it('uses a distinct verified micro-example on turn four and a bounded adult recovery on turn five', () => {
    const turns = [];
    for (let index = 0; index < 5; index += 1) {
      turns.push(buildIntelligentTeachingTurn(buildArgs({
        history: turns.flatMap(withPriorTurn)
      })));
    }

    expect(turns[3].pedagogicalState).toMatchObject({
      misunderstandingCount: 4,
      strategyUsed: TEACHING_STRATEGY.VERIFIED_MICRO_EXAMPLE,
      supportStage: 'verified_micro_example'
    });
    expect(turns[3].reply.text).toContain('“Sekolah” ialah kata nama bagi tempat.');
    expect(turns[3].reply.text).not.toBe(turns[2].reply.text);
    expect(turns[4].pedagogicalState).toMatchObject({
      misunderstandingCount: 5,
      strategyUsed: TEACHING_STRATEGY.ADULT_SUPPORT,
      supportStage: 'adult_support'
    });
    expect(turns[4].reply.text).toMatch(/guru atau penjaga/i);
    expect(new Set(turns.map(item => item.reply.text)).size).toBe(5);
    for (const turn of turns) expect(questionCount(turn.reply.text)).toBeLessThanOrEqual(1);
  });

  it('moves directly to bounded adult support when no second verified example exists', () => {
    const priorState = {
      supportStage: 'guided_small_step',
      misunderstandingCount: 3,
      strategyUsed: TEACHING_STRATEGY.ONE_SMALL_STEP,
      currentConcept: 'bm::kata-nama::BM-KN-001',
      pendingFollowUp: 'Apakah petunjuk utama dalam soalan ini?',
      signal: TEACHING_SIGNAL.MISUNDERSTANDING,
      misconceptionType: ''
    };
    const result = buildIntelligentTeachingTurn(buildArgs({
      history: [{ role: 'ai', text: 'Langkah kecil.', pedagogicalState: priorState }],
      teachingContent: { ...teachingContent, examples: teachingContent.examples.slice(0, 1), verifiedExamples: teachingContent.verifiedExamples.slice(0, 1) }
    }));
    expect(result.pedagogicalState).toMatchObject({
      misunderstandingCount: 4,
      strategyUsed: TEACHING_STRATEGY.ADULT_SUPPORT
    });
    expect(result.reply.text).toMatch(/guru atau penjaga/i);
    expect(questionCount(result.reply.text)).toBe(1);
  });

  it('resets the bounded count when understanding is confirmed or a new topic is requested', () => {
    const prior = buildIntelligentTeachingTurn(buildArgs());
    const understood = buildIntelligentTeachingTurn(buildArgs({
      history: withPriorTurn(prior),
      resolvedIntent: 'understanding_confirmation',
      studentTurn: { intent: 'understanding_confirmation', messageType: 'learning_response' }
    }));
    const newTopic = buildIntelligentTeachingTurn(buildArgs({
      history: withPriorTurn(prior),
      resolvedIntent: 'how_question',
      studentTurn: { intent: 'how_question', messageType: 'new_topic_request', newTopicRequest: true },
      topicId: 'kata-kerja',
      questionId: 'BM-KK-001'
    }));

    expect(understood.reply).toBeNull();
    expect(understood.pedagogicalState).toMatchObject({
      signal: TEACHING_SIGNAL.RESOLVED,
      misunderstandingCount: 0,
      strategyUsed: TEACHING_STRATEGY.CHECK_COMPLETED
    });
    expect(newTopic.reply).toBeNull();
    expect(newTopic.pedagogicalState).toMatchObject({
      signal: TEACHING_SIGNAL.NEW_TOPIC,
      misunderstandingCount: 0,
      strategyUsed: TEACHING_STRATEGY.NEW_CONCEPT
    });
  });

  it('classifies a misconception only from a supported listed wrong option', () => {
    const supported = {
      type: 'verb_for_person',
      confidence: 0.8,
      supported: true,
      evidence: 'Learner selected the verb option.',
      evidenceSource: 'reviewed-question',
      evidenceAnswer: 'berlari',
      childSafeLabel: 'Kamu memilih perbuatan, bukan nama orang.'
    };
    const confirmed = buildIntelligentTeachingTurn(buildArgs({
      resolvedIntent: 'wrong_answer_coaching',
      studentTurn: { intent: 'wrong_answer_coaching', messageType: 'answer_attempt' },
      learnerAnswer: 'berlari',
      guidedMisconception: supported
    }));
    const unsupportedText = buildIntelligentTeachingTurn(buildArgs({
      resolvedIntent: 'wrong_answer_coaching',
      studentTurn: { intent: 'wrong_answer_coaching', messageType: 'answer_attempt' },
      learnerAnswer: 'saya kurang pasti',
      guidedMisconception: supported
    }));
    const lowConfidence = buildIntelligentTeachingTurn(buildArgs({
      resolvedIntent: 'wrong_answer_coaching',
      studentTurn: { intent: 'wrong_answer_coaching', messageType: 'answer_attempt' },
      learnerAnswer: 'berlari',
      guidedMisconception: { ...supported, confidence: 0.4 }
    }));

    expect(confirmed.misconception?.type).toBe('verb_for_person');
    expect(confirmed.pedagogicalState.misconceptionType).toBe('verb_for_person');
    expect(unsupportedText.misconception).toBeNull();
    expect(lowConfidence.misconception).toBeNull();
  });

  it.each([
    ['verb', 'berlari'],
    ['adjective', 'cantik'],
    ['common noun', 'murid']
  ])('does not diagnose a BM %s distractor without exact reviewed evidence', (_category, learnerAnswer) => {
    expect(classifyMisconception({
      subjectId: 'bm',
      instruction: 'Pilih kata nama orang.',
      options: ['Ali', 'berlari', 'cantik', 'murid'],
      expectedAnswer: 'Ali',
      learnerAnswer
    })).toMatchObject({ type: 'unclassified', confidence: 0, supported: false });
  });

  it('accepts an exact misconception category only from reviewed question evidence for that distractor', () => {
    const result = classifyMisconception({
      subjectId: 'bm',
      instruction: 'Pilih kata nama khas.',
      options: ['Aina', 'murid'],
      expectedAnswer: 'Aina',
      learnerAnswer: 'murid',
      question: {
        misconceptionEvidence: [{
          answer: 'murid',
          type: 'common_noun_vs_proper_noun',
          confidence: 0.9,
          verified: true,
          source: 'reviewed-question',
          evidence: 'The reviewed distractor is a common noun.',
          childSafeLabel: 'Kamu memilih nama umum, tetapi soalan meminta nama khusus.',
          suggestedPrompt: 'Adakah perkataan itu nama umum atau nama khusus?'
        }]
      }
    });
    expect(result).toMatchObject({
      type: 'common_noun_vs_proper_noun',
      supported: true,
      evidenceSource: 'reviewed-question',
      evidenceAnswer: 'murid'
    });
  });

  it('treats previous correctness separately from a new explicit comprehension request', () => {
    const misunderstood = buildIntelligentTeachingTurn(buildArgs({ isCorrect: true }));
    const anotherWay = buildIntelligentTeachingTurn(buildArgs({
      isCorrect: true,
      resolvedIntent: 'alternative_explanation',
      studentTurn: { intent: 'alternative_explanation', messageType: 'follow_up_question' }
    }));
    expect(misunderstood.pedagogicalState.signal).toBe(TEACHING_SIGNAL.MISUNDERSTANDING);
    expect(misunderstood.reply?.text).toBeTruthy();
    expect(anotherWay.pedagogicalState.signal).toBe(TEACHING_SIGNAL.MISUNDERSTANDING);
    expect(anotherWay.reply?.text).toBeTruthy();
  });

  it('leaves open-text and Arabic mistakes unclassified without deterministic evidence', () => {
    expect(classifyMisconception({
      subjectId: 'bm',
      instruction: 'Pilih nama orang.',
      options: ['Ali', 'meja'],
      expectedAnswer: 'Ali',
      learnerAnswer: 'Saya tidak pasti'
    })).toMatchObject({ type: 'unclassified', confidence: 0, supported: false });
    expect(classifyMisconception({
      subjectId: 'arab',
      instruction: 'Pilih perkataan yang betul.',
      options: ['كِتَابٌ', 'قَلَمٌ'],
      expectedAnswer: 'كِتَابٌ',
      learnerAnswer: 'قَلَمٌ'
    })).toMatchObject({ type: 'unclassified', confidence: 0, supported: false });
  });

  it('never exposes a protected answer through teaching text, examples or quick replies', () => {
    const result = buildIntelligentTeachingTurn(buildArgs({
      expectedAnswer: 'Mawar',
      acceptedAnswers: ['Bunga mawar'],
      options: ['Mawar', 'Batu', 'Meja'],
      teachingContent: {
        grounded: true,
        explanations: ['Jawapannya ialah Mawar.'],
        examples: ['Pilih bunga mawar kerana jawapannya Mawar.'],
        alternatives: ['Cari benda hidup dalam pilihan.'],
        steps: ['Cari pilihan yang merupakan tumbuhan.'],
        checkQuestions: ['Adakah jawapannya Mawar']
      }
    }));
    const exposed = JSON.stringify({ reply: result.reply, state: result.pedagogicalState }).toLocaleLowerCase('ms-MY');
    expect(exposed).not.toContain('mawar');
    expect(result.reply.text).toContain('Cari benda hidup');
    expect(questionCount(result.reply.text)).toBe(1);
  });

  it('uses a grounded safe fallback rather than inventing missing knowledge', () => {
    const result = buildIntelligentTeachingTurn(buildArgs({
      teachingContent: { grounded: false }
    }));
    expect(result.reply.grounded).toBe(true);
    expect(result.reply.text).toContain('belum mempunyai maklumat pembelajaran yang disahkan');
    expect(result.pedagogicalState.strategyUsed).toBe(TEACHING_STRATEGY.KNOWLEDGE_SAFE_FALLBACK);
  });

  it.each([
    ['BM', { locale: 'ms-MY', subjectId: 'bm' }, 'Tak mengapa'],
    ['English', { locale: 'en-MY', subjectId: 'english', languagePresentation: { teachingLanguage: 'en' } }, 'That is okay'],
    ['Arabic', { locale: 'ar-MY', subjectId: 'arabic' }, 'لا بأس']
  ])('keeps %s teaching concise and age appropriate', (_label, language, expectedCopy) => {
    const result = buildIntelligentTeachingTurn(buildArgs(language));
    expect(result.reply.text).toContain(expectedCopy);
    expect(result.reply.text.length).toBeLessThanOrEqual(700);
    expect(result.reply.quickReplies).toHaveLength(3);
  });

  it('leaves Mathematics to the existing dedicated engine', () => {
    expect(buildIntelligentTeachingTurn(buildArgs({ subjectId: 'math' }))).toBeNull();
  });

  it('adds no network, paid-AI or reward-mutation path', () => {
    const source = readFileSync(resolve('src/ai/pedagogy/intelligentTeachingEngine.js'), 'utf8');
    expect(source).not.toMatch(/fetch\s*\(|XMLHttpRequest|WebSocket|functions\.invoke|supabase/i);
    expect(source).not.toMatch(/\b(?:xp|coins?|rewards?)\b/i);
  });
});

describe('pedagogical state scope and privacy boundaries', () => {
  it.each([
    ['child', 'account-a::child-a::session-a::question-a', 'account-a::child-b::session-a::question-a'],
    ['account', 'account-a::child-a::session-a::question-a', 'account-b::child-a::session-a::question-a'],
    ['session', 'account-a::child-a::session-a::question-a', 'account-a::child-a::session-b::question-a'],
    ['question', 'account-a::child-a::session-a::question-a', 'account-a::child-a::session-a::question-b']
  ])('does not carry state across a %s transition', (_dimension, firstScope, secondScope) => {
    const first = buildIntelligentTeachingTurn(buildArgs());
    const memory = createBoundedTutorConversationMemory();
    memory.set(firstScope, withPriorTurn(first));
    expect(memory.get(secondScope)).toEqual([]);

    const next = buildIntelligentTeachingTurn(buildArgs({ history: memory.get(secondScope) }));
    expect(next.pedagogicalState.misunderstandingCount).toBe(1);
  });

  it('keeps only bounded non-PII state metadata', () => {
    const memory = createBoundedTutorConversationMemory();
    memory.set('account-a::child-a', [{
      role: 'ai',
      text: 'Mari belajar.',
      pedagogicalState: {
        supportStage: 'concept_explanation',
        misunderstandingCount: 99,
        strategyUsed: 'concept-and-example',
        currentConcept: 'bm::kata-nama::BM-KN-001',
        pendingFollowUp: 'Nama saya Ali bin Ahmad',
        signal: 'misunderstanding',
        misconceptionType: 'general'
      }
    }]);
    expect(memory.get('account-a::child-a')[0].pedagogicalState).toMatchObject({
      misunderstandingCount: 5,
      pendingFollowUp: ''
    });
  });
});
