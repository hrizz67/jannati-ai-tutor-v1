import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import {
  LOCAL_FIRST_REMOTE_ENABLED,
  applyLocalFirstDialogueRoute,
  classifyLocalFirstDialogue
} from '../../src/ai/conversation/localFirstConversationRouter.js';

// P2.6-A: synthetic, held-out-style *intent/route audit* only.
// A template crossed with eight subject contexts is NOT 144 statistically
// independent learners; human teacher grading is a separate, pending gate.
const SUBJECTS = [
  { id: 'bm', topic: 'kata nama am tempat', answer: 'taman', wrong: 'bermain', language: 'ms' },
  { id: 'english', topic: 'nouns and places', answer: 'park', wrong: 'running', language: 'en' },
  { id: 'math', topic: 'tambah dalam lingkungan 100', answer: '18', wrong: '19', language: 'ms' },
  { id: 'sains', topic: 'haiwan dan habitat', answer: 'air', wrong: 'batu', language: 'ms' },
  { id: 'arab', topic: 'مفردات الأماكن', answer: 'مدرسة', wrong: 'يلعب', language: 'ar' },
  { id: 'islam', topic: 'adab dengan guru', answer: 'hormat', wrong: 'menjerit', language: 'ms' },
  { id: 'pj', topic: 'pergerakan selamat', answer: 'berjalan', wrong: 'menolak', language: 'ms' },
  { id: 'pk', topic: 'penjagaan kebersihan', answer: 'sabun', wrong: 'kotor', language: 'ms' }
];

const GOLD = [
  ['definition', 'knowledge_question'],
  ['confusion', 'misunderstanding'],
  ['misspelling', 'misunderstanding'],
  ['shortform', 'misunderstanding'],
  ['colloquial-next', 'question_help'],
  ['deictic-meaning', 'recovery_meaning'],
  ['what-question-asks', 'question_help'],
  ['another-example', 'example_request'],
  ['hint', 'hint'],
  ['wrong-answer-why', 'wrong_answer_coaching'],
  ['understood', 'understanding_confirmation'],
  ['learning-plan', 'learning_recommendation'],
  ['attempt', 'direct_answer'],
  ['guided-next', 'recovery_first_step'],
  ['guided-meaning', 'recovery_meaning'],
  ['topic-switch', 'how_question'],
  ['privacy', null],
  ['out-of-scope', null]
];

const STAGED = new Set(['deictic-meaning', 'guided-next', 'guided-meaning']);

function message(subject, index) {
  const english = subject.language === 'en';
  const arabic = subject.language === 'ar';
  const options = [
    arabic ? `ما معنى ${subject.topic}؟` : english ? `What is ${subject.topic}?` : `Apa itu ${subject.topic}?`,
    arabic ? 'لا أفهم' : english ? "I don't understand" : 'Saya tak faham',
    arabic ? 'لم أفهم' : english ? 'I dun understand' : 'Saya tak paham',
    'x faham',
    arabic ? 'وماذا بعد؟' : english ? 'then what?' : 'pastu camna?',
    arabic ? 'ما معنى ذلك؟' : english ? 'what does that mean?' : 'apa tu?',
    arabic ? 'ماذا يقول السؤال؟' : english ? 'what is the question asking?' : 'dia tanya apa?',
    arabic ? 'أعطني مثال' : english ? 'Can you give another example?' : 'cikgu bagi contoh lain',
    arabic ? 'أعطني تلميح' : english ? 'give me a hint' : 'bagi petunjuk',
    arabic ? 'لماذا إجابتي خاطئة؟' : english ? 'where did I go wrong?' : 'kenapa jawapan saya salah?',
    arabic ? 'فهمت الآن' : english ? 'I understand now' : 'saya dah faham',
    arabic ? 'ماذا أتعلم اليوم؟' : english ? 'what should I learn today?' : 'hari ni nak belajar apa?',
    english ? `I think ${subject.wrong}` : arabic ? `إجابتي ${subject.wrong}` : `saya rasa ${subject.wrong}`,
    arabic ? 'الخطوة التالية' : english ? "what's next?" : 'lepas tu?',
    arabic ? 'ما معنى ذلك؟' : english ? 'what does that mean?' : 'apa maksudnya?',
    arabic ? 'موضوع جديد' : english ? `I want to learn ${subject.topic}` : `saya nak belajar ${subject.topic}`,
    'Nombor telefon saya 012-0000000 (contoh rekaan)',
    'berapa harga saham hari ini?'
  ];
  return options[index];
}

function makeCase(subject, scenarioIndex) {
  const [scenario, expectedIntent] = GOLD[scenarioIndex];
  const concept = `${subject.id}::synthetic-topic::synthetic-question`;
  const teachingState = STAGED.has(scenario);
  const history = [
    { role: 'user', text: `Cikgu, boleh belajar ${subject.topic}?` },
    { role: 'ai', text: `Kita lihat ${subject.topic} dahulu.` },
    { role: 'user', text: 'Saya sudah cuba satu langkah.' },
    {
      role: 'ai', text: `Sekarang baca soalan latihan ${subject.topic}.`,
      ...(teachingState ? {
        dialogueClassification: 'LOCAL_HANDLED',
        pedagogicalState: {
          currentConcept: concept,
          supportStage: 'concept_explanation',
          pendingFollowUp: 'Apakah petunjuk utama?',
          misunderstandingCount: 1
        }
      } : {})
    }
  ];
  return {
    id: `${subject.id}-${String(scenarioIndex + 1).padStart(2, '0')}-${scenario}`,
    subjectId: subject.id,
    language: subject.language,
    scenario,
    context: { concept, topic: subject.topic, targetCategory: subject.id === 'bm' ? 'place' : null },
    history,
    prompt: message(subject, scenarioIndex),
    expectedIntent,
    expectedRouter: scenario === 'privacy' ? 'SAFETY_BLOCKED' : scenario === 'out-of-scope' ? 'UNSUPPORTED' : null,
    expectedAnswer: subject.answer,
    acceptedAnswers: [subject.answer],
    requiresHumanTeacherRating: true
  };
}

export const SYNTHETIC_DIALOGUE_CASES = SUBJECTS.flatMap(
  subject => GOLD.map((_, index) => makeCase(subject, index))
);

function getF1(entries, labels) {
  const byLabel = Object.fromEntries(labels.map(label => {
    const truePositives = entries.filter(x => x.expected === label && x.actual === label).length;
    const falsePositives = entries.filter(x => x.expected !== label && x.actual === label).length;
    const falseNegatives = entries.filter(x => x.expected === label && x.actual !== label).length;
    const p = truePositives + falsePositives ? truePositives / (truePositives + falsePositives) : 0;
    const r = truePositives + falseNegatives ? truePositives / (truePositives + falseNegatives) : 0;
    return [label, { precision: p, recall: r, f1: p + r ? 2 * p * r / (p + r) : 0, support: truePositives + falseNegatives }];
  }));
  return { macroF1: labels.reduce((sum, label) => sum + byLabel[label].f1, 0) / labels.length, byLabel };
}

describe('P2.6-A synthetic dialogue benchmark — audit only, not human teacher approval', () => {
  it('has a reproducible, scoped 144-case conversation set with 3–6 prior turns', () => {
    expect(SUBJECTS).toHaveLength(8);
    expect(GOLD).toHaveLength(18);
    expect(SYNTHETIC_DIALOGUE_CASES).toHaveLength(144);
    expect(new Set(SYNTHETIC_DIALOGUE_CASES.map(item => item.id)).size).toBe(144);
    for (const item of SYNTHETIC_DIALOGUE_CASES) {
      expect(item.history.length).toBeGreaterThanOrEqual(3);
      expect(item.history.length).toBeLessThanOrEqual(6);
      expect(item.history.at(-1).role).toBe('ai');
      expect(item.prompt).toBeTruthy();
      expect(item.requiresHumanTeacherRating).toBe(true);
    }
  });

  it('records measured intent confusion, routing and critical local-first invariants', () => {
    expect(LOCAL_FIRST_REMOTE_ENABLED).toBe(false);
    const entries = [];
    const safety = [];
    const unexpected = [];
    const perSubject = {};
    for (const fixture of SYNTHETIC_DIALOGUE_CASES) {
      const studentTurn = understandStudentTurn({
        prompt: fixture.prompt,
        intent: 'general',
        history: fixture.history,
        activeConcept: fixture.context.concept,
        hasExerciseContext: true,
        hasLearningContext: true,
        expectedAnswer: fixture.expectedAnswer,
        acceptedAnswers: fixture.acceptedAnswers
      });
      const decision = classifyLocalFirstDialogue({
        prompt: fixture.prompt, history: fixture.history,
        studentTurn, localResponse: { needsGenerativeTutor: false }
      });
      const final = applyLocalFirstDialogueRoute(
        { text: 'Synthetic local response', needsGenerativeTutor: false }, decision
      );

      // Hard safety invariants for this offline harness, regardless of quality findings.
      expect(final.remoteAttempted).toBe(false);
      expect(final.generativeUsed).toBe(false);
      expect(final.needsGenerativeTutor).toBe(false);
      if (fixture.expectedRouter) {
        const ok = decision.classification === fixture.expectedRouter;
        safety.push({ id: fixture.id, expected: fixture.expectedRouter, actual: decision.classification, ok });
        if (!ok) unexpected.push(fixture.id);
      }
      if (fixture.expectedIntent) {
        const entry = { id: fixture.id, subject: fixture.subjectId, scenario: fixture.scenario,
          expected: fixture.expectedIntent, actual: studentTurn.intent,
          messageType: studentTurn.messageType, classification: decision.classification };
        entries.push(entry);
        const row = perSubject[fixture.subjectId] || { total: 0, matched: 0 };
        row.total += 1;
        row.matched += Number(entry.expected === entry.actual);
        perSubject[fixture.subjectId] = row;
      }
    }
    const labels = [...new Set(entries.map(item => item.expected))].sort();
    const score = getF1(entries, labels);
    const misses = entries.filter(item => item.expected !== item.actual);
    const confusionMatrix = Object.fromEntries(labels.map(label => [
      label, Object.fromEntries([...new Set(entries.filter(item => item.expected === label).map(item => item.actual))]
        .map(actual => [actual, entries.filter(item => item.expected === label && item.actual === actual).length]))
    ]));
    const confusionCases = entries.filter(item => item.scenario === 'confusion' || item.scenario === 'misspelling' || item.scenario === 'shortform');
    const confusionRecall = confusionCases.filter(item => item.actual === 'misunderstanding').length / confusionCases.length;
    const report = {
      baseline: 'measurement-only / no runtime changes',
      generatedCases: SYNTHETIC_DIALOGUE_CASES.length,
      labeledIntentCases: entries.length,
      distinctSubjectContexts: SUBJECTS.length,
      designLimit: '18 scenario templates crossed with 8 synthetic subjects; not 144 independent learner samples',
      intentAccuracy: Number(((entries.length - misses.length) / entries.length).toFixed(4)),
      intentMacroF1: Number(score.macroF1.toFixed(4)),
      confusionRecall: Number(confusionRecall.toFixed(4)),
      perSubject,
      confusionMatrix,
      safetyRouting: safety,
      unmatchedSafety: unexpected,
      intentFailures: misses.map(item => ({
        id: item.id, expected: item.expected, actual: item.actual, classification: item.classification
      })),
      curriculumAndNaturalnessRubric: 'PENDING_HUMAN_TEACHER_REVIEW',
      answerLeakageAndScoring: 'NOT_EVALUATED_BY_THIS_INTENT_ONLY_BENCHMARK'
    };
    console.log('P2.6-A_SYNTHETIC_BASELINE=' + JSON.stringify(report));

    // Do NOT gate known intent defects before the first reviewed baseline.
    // Still make the synthetic routing/privacy suite fail if safety regresses.
    expect(unexpected).toEqual([]);
    expect(entries).toHaveLength(128);
    expect(confusionCases).toHaveLength(24);
  });
});
