import { describe, expect, it } from 'vitest';
import {
  buildInteractivePracticeSession,
  rehydrateInteractivePracticeQuestions
} from '../../src/ai/question/interactiveSessionComposer.js';
import { loadSubjectData } from '../../src/data/subjects/index.js';
import { isInteractiveQuestion } from '../../src/utils/interactiveQuestion.js';

function makeQuestion(id, kind = 'standard') {
  const question = {
    id,
    q: `Soalan ${id}`,
    question: `Soalan ${id}`,
    answer: 'betul',
    accepted: ['betul'],
    acceptedAnswers: ['betul'],
    difficulty: 'mudah',
    questionType: 'objective'
  };
  if (kind === 'derived') question.options = ['betul', 'salah'];
  if (kind === 'authored-choice') {
    question.interaction = {
      version: 1,
      type: 'choice',
      instruction: 'Pilih jawapan.',
      options: [
        { id: `${id}-yes`, label: 'Betul', value: 'betul' },
        { id: `${id}-no`, label: 'Salah', value: 'salah' }
      ]
    };
  }
  if (kind === 'authored-rich') {
    question.interaction = {
      version: 1,
      type: 'fillBlank',
      instruction: 'Lengkapkan ayat.',
      sentenceParts: ['Jawapan ', '.'],
      options: [
        { id: `${id}-yes`, label: 'Betul', value: 'betul' },
        { id: `${id}-no`, label: 'Salah', value: 'salah' }
      ]
    };
  }
  if (kind === 'non-renderable') {
    question.interactiveSuitability = { category: 'teacher_review', recommendedType: 'matching' };
    question.interaction = { version: 1, type: 'choice', instruction: '', options: [] };
  }
  return question;
}

function makeTopic(id, kinds) {
  return {
    id,
    title: `Topik ${id}`,
    questions: kinds.map((kind, index) => makeQuestion(`${id}-${kind}-${index + 1}`, kind))
  };
}

function makeBalancedSubject() {
  return {
    id: 'math',
    title: 'Matematik Tahun 2',
    short: 'Math',
    topics: [
      makeTopic('a', ['authored-rich', 'derived', 'standard', 'derived', 'standard', 'authored-choice']),
      makeTopic('b', ['authored-rich', 'derived', 'standard', 'derived', 'standard', 'authored-choice']),
      makeTopic('c', ['authored-rich', 'derived', 'standard', 'derived', 'standard', 'authored-choice'])
    ]
  };
}

function recentMemory(...ids) {
  return { questionHistory: ids.map(questionId => ({ questionId })) };
}

describe('interactive practice composition', () => {
  it('builds the normal ten-question 60/40 session and interleaves delivery', () => {
    const result = buildInteractivePracticeSession(makeBalancedSubject());
    expect(result.metadata).toMatchObject({
      requestedCount: 10,
      actualCount: 10,
      interactiveCount: 6,
      standardCount: 4,
      interactivePercent: 60,
      targetMinimum: 50,
      targetMaximum: 65,
      targetMet: true,
      fallbackUsed: false,
      fallbackReason: null
    });
    const sequence = result.questions.map(isInteractiveQuestion);
    expect(sequence.slice(0, 3).some(Boolean)).toBe(true);
    expect(sequence.slice(0, 6).every(Boolean)).toBe(false);
    expect(new Set(result.questions.map(question => question.id)).size).toBe(10);
    expect(result.metadata.topicsRepresented.length).toBeGreaterThan(1);
  });

  it.each([[10, 6], [9, 5], [8, 5], [7, 4], [6, 3], [5, 3], [4, 2]])(
    'selects %i questions with %i interactive questions',
    (count, interactiveCount) => {
      const result = buildInteractivePracticeSession(makeBalancedSubject(), { count });
      expect(result.metadata.actualCount).toBe(count);
      expect(result.metadata.interactiveCount).toBe(interactiveCount);
      expect(result.metadata.targetMet).toBe(true);
    }
  );

  it('prioritizes authored rich and other authored questions before derived choices', () => {
    const subject = {
      id: 'math', title: 'Math', short: 'Math', topics: [
        makeTopic('a', ['authored-rich', 'derived', 'derived', 'standard', 'standard']),
        makeTopic('b', ['authored-choice', 'derived', 'derived', 'standard', 'standard']),
        makeTopic('c', ['derived', 'derived', 'standard', 'standard'])
      ]
    };
    const result = buildInteractivePracticeSession(subject, { count: 10 });
    const selectedInteractive = result.questions.filter(isInteractiveQuestion);
    expect(selectedInteractive.slice(0, 2).map(question => question.id)).toEqual([
      'a-authored-rich-1',
      'b-authored-choice-1'
    ]);
    expect(result.metadata.authoredCount).toBe(2);
    expect(result.metadata.derivedCount).toBe(4);
  });

  it('does not count a teacher-review or invalid interaction as renderable', () => {
    const subject = {
      id: 'sains', title: 'Sains', short: 'Sains', topics: [
        makeTopic('a', ['authored-rich', 'derived', 'non-renderable', 'standard'])
      ]
    };
    const result = buildInteractivePracticeSession(subject, { count: 4 });
    expect(result.metadata.interactiveCount).toBe(2);
    expect(result.questions.find(question => question.id === 'a-non-renderable-3')).toBeDefined();
    expect(isInteractiveQuestion(result.questions.find(question => question.id === 'a-non-renderable-3'))).toBe(false);
  });

  it('avoids recent questions while enough unseen candidates exist', () => {
    const subject = makeBalancedSubject();
    const recentId = subject.topics[0].questions[0].id;
    const result = buildInteractivePracticeSession(subject, { count: 4, memory: recentMemory(recentId) });
    expect(result.questions.map(question => question.id)).not.toContain(recentId);
    expect(result.metadata.recentRepeatCount).toBe(0);
    expect(result.metadata.fallbackUsed).toBe(false);
  });

  it('reuses recent questions only when required and reports the fallback', () => {
    const subject = {
      id: 'math', title: 'Math', short: 'Math', topics: [
        makeTopic('a', ['authored-rich', 'authored-rich', 'standard', 'standard'])
      ]
    };
    const recentId = 'a-authored-rich-1';
    const result = buildInteractivePracticeSession(subject, { count: 4, memory: recentMemory(recentId) });
    expect(result.questions.map(question => question.id)).toContain(recentId);
    expect(result.metadata.recentRepeatCount).toBe(1);
    expect(result.metadata.fallbackUsed).toBe(true);
    expect(result.metadata.fallbackReason).toContain('recent-questions-reused');
  });

  it('is deterministic, preserves source values and never mutates source objects', () => {
    const subject = makeBalancedSubject();
    const before = JSON.stringify(subject);
    const first = buildInteractivePracticeSession(subject);
    const second = buildInteractivePracticeSession(subject);
    expect(first).toEqual(second);
    expect(JSON.stringify(subject)).toBe(before);
    const selected = first.questions[0];
    const source = subject.topics.flatMap(topic => topic.questions).find(question => question.id === selected.id);
    expect(selected.answer).toBe(source.answer);
    expect(selected.accepted).toBe(source.accepted);
    expect(selected.acceptedAnswers).toBe(source.acceptedAnswers);
    expect(selected.subjectId).toBe(subject.id);
    expect(selected.subjectTitle).toBe(subject.title);
    expect(selected.subjectShort).toBe(subject.short);
    expect(selected.topicTitle).toBe(`Topik ${selected.topicId}`);
  });

  it('deduplicates IDs and spreads a session across eligible topics', () => {
    const subject = makeBalancedSubject();
    subject.topics[1].questions.push({ ...subject.topics[0].questions[0] });
    const result = buildInteractivePracticeSession(subject, { count: 10 });
    expect(new Set(result.questions.map(question => question.id)).size).toBe(result.questions.length);
    expect(result.metadata.topicsRepresented).toEqual(['a', 'b', 'c']);
  });

  it('uses honest fallback metadata for undersized or imbalanced pools', () => {
    const undersized = {
      id: 'math', title: 'Math', short: 'Math', topics: [makeTopic('a', ['authored-rich', 'standard'])]
    };
    const undersizedResult = buildInteractivePracticeSession(undersized, { count: 10 });
    expect(undersizedResult.metadata).toMatchObject({ actualCount: 2, interactiveCount: 1, standardCount: 1, targetMet: true, fallbackUsed: true });
    expect(undersizedResult.metadata.fallbackReason).toContain('insufficient-total-questions');

    const allInteractive = {
      id: 'math', title: 'Math', short: 'Math', topics: [makeTopic('a', Array(10).fill('derived'))]
    };
    const allInteractiveResult = buildInteractivePracticeSession(allInteractive);
    expect(allInteractiveResult.metadata).toMatchObject({ actualCount: 10, interactiveCount: 10, standardCount: 0, targetMet: false, fallbackUsed: true });
    expect(allInteractiveResult.metadata.fallbackReason).toContain('insufficient-standard-questions');

    const interactiveShortage = {
      id: 'math', title: 'Math', short: 'Math', topics: [makeTopic('a', ['derived', 'derived', ...Array(8).fill('standard')])]
    };
    const shortageResult = buildInteractivePracticeSession(interactiveShortage);
    expect(shortageResult.metadata).toMatchObject({ actualCount: 10, interactiveCount: 2, standardCount: 8, targetMet: false, fallbackUsed: true });
    expect(shortageResult.metadata.fallbackReason).toContain('insufficient-interactive-questions');
  });

  it('filters candidate topics when eligibleTopicIds is supplied', () => {
    const result = buildInteractivePracticeSession(makeBalancedSubject(), { count: 6, eligibleTopicIds: ['b'] });
    expect(result.questions.every(question => question.topicId === 'b')).toBe(true);
    expect(result.metadata.topicsRepresented).toEqual(['b']);
  });

  it('reports an unrepresentable three-question target honestly', () => {
    const result = buildInteractivePracticeSession(makeBalancedSubject(), { count: 3 });
    expect(result.metadata).toMatchObject({ actualCount: 3, interactiveCount: 2, interactivePercent: 66.67, targetMet: false, fallbackUsed: true });
    expect(result.metadata.fallbackReason).toContain('interactive-target-not-met');
  });
});

describe('interactive practice rehydration', () => {
  it('restores the saved order from current questions across all real topics', () => {
    const subject = makeBalancedSubject();
    const saved = [
      { id: 'c-authored-rich-1', answer: 'jawapan lama', topicId: 'interactive_math' },
      { id: 'a-standard-3', answer: 'jawapan lama', topicId: 'interactive_math' },
      { id: 'b-derived-2', answer: 'jawapan lama', topicId: 'interactive_math' }
    ];
    const restored = rehydrateInteractivePracticeQuestions(subject, saved);
    expect(restored.map(question => question.id)).toEqual(saved.map(question => question.id));
    expect(restored.map(question => question.topicId)).toEqual(['c', 'a', 'b']);
    expect(restored.map(question => question.topicTitle)).toEqual(['Topik c', 'Topik a', 'Topik b']);
    expect(restored.every(question => question.subjectId === 'math')).toBe(true);
    expect(restored.every(question => question.answer === 'betul')).toBe(true);
  });
});

describe('current core subject smoke coverage', () => {
  it('composes current BM, Math, English, Science, Arabic and Islamic Education inventories', async () => {
    for (const subjectId of ['bm', 'math', 'english', 'sains', 'arab', 'islam']) {
      const subject = await loadSubjectData(subjectId);
      const allQuestions = subject.topics.flatMap(topic => topic.questions);
      const interactiveAvailable = allQuestions.filter(isInteractiveQuestion).length;
      const standardAvailable = allQuestions.length - interactiveAvailable;
      const authoredAvailable = allQuestions.filter(question => question.interaction && isInteractiveQuestion(question)).length;
      const result = buildInteractivePracticeSession(subject, { count: 10 });
      expect(result.metadata.actualCount).toBe(10);
      if (interactiveAvailable >= 6 && standardAvailable >= 4) {
        expect(result.metadata).toMatchObject({ interactiveCount: 6, standardCount: 4, targetMet: true });
      } else {
        expect(result.metadata.fallbackUsed).toBe(true);
        expect(result.metadata.fallbackReason).toBeTruthy();
      }
      if (authoredAvailable > 0 && result.metadata.interactiveCount > 0) {
        expect(result.metadata.authoredCount).toBeGreaterThan(0);
      }
      expect(result.metadata.topicsRepresented.length).toBeGreaterThan(1);
    }
  });
});
