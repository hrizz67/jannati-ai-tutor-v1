import { describe, expect, it } from 'vitest';
import {
  FREE_DAILY_QUESTION_LIMIT,
  canRestartQuestionResume,
  canStartFreeQuestionSession,
  resolveQuestionResumeQuotaSubjectId
} from '../../src/services/accessControl.js';
import { clearResume, loadResume, saveResume } from '../../src/utils/resumeStorage.js';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function questionResume(mode = 'quiz', overrides = {}) {
  return {
    version: 1,
    mode,
    sessionId: `${mode}-session-1`,
    subjectId: 'math',
    topicId: `${mode}-topic-1`,
    questions: [{ id: `${mode}-question-1`, subjectId: 'math', q: '1 + 1?', answer: '2' }],
    currentIndex: 0,
    session: {
      mode,
      resumeSubjectId: 'math',
      quotaSubjectId: 'math',
      answers: []
    },
    updatedAt: '2026-09-26T00:00:00.000Z',
    ...overrides
  };
}

function attemptRestart(resume, {
  dailyQuestionCount = FREE_DAILY_QUESTION_LIMIT,
  isPremiumUser = false
} = {}) {
  const storage = new MemoryStorage();
  saveResume(resume, storage);
  const quotaSubjectId = resolveQuestionResumeQuotaSubjectId(resume);
  const allowed = canRestartQuestionResume({ dailyQuestionCount, isPremiumUser });
  if (allowed) clearResume(resume, storage);
  return {
    allowed,
    quotaSubjectId,
    storedResume: loadResume({
      mode: resume.mode,
      subjectId: resume.subjectId,
      topicId: resume.topicId
    }, storage)
  };
}

describe('Question resume restart quota preflight', () => {
  it('denies a Free quiz restart at 10/10 and preserves the loadable stored resume', () => {
    const resume = questionResume('quiz');
    const result = attemptRestart(resume);

    expect(result.allowed).toBe(false);
    expect(result.quotaSubjectId).toBe('math');
    expect(result.storedResume).toMatchObject({
      mode: 'quiz',
      sessionId: resume.sessionId,
      currentIndex: 0
    });
  });

  it('denies a Free interactive-practice restart at 10/10 without deleting progress', () => {
    const resume = questionResume('interactive-practice');
    const result = attemptRestart(resume);

    expect(result.allowed).toBe(false);
    expect(result.storedResume).toMatchObject({
      mode: 'interactive-practice',
      sessionId: resume.sessionId
    });
  });

  it('denies a Free adaptive-practice restart at 10/10 without deleting progress', () => {
    const resume = questionResume('adaptive-practice');
    const result = attemptRestart(resume);

    expect(result.allowed).toBe(false);
    expect(result.storedResume).toMatchObject({
      mode: 'adaptive-practice',
      sessionId: resume.sessionId
    });
  });

  it('allows a restart below quota to clear the old resume for fresh work', () => {
    const result = attemptRestart(questionResume('quiz'), { dailyQuestionCount: 9 });

    expect(result.allowed).toBe(true);
    expect(result.storedResume).toBeNull();
  });

  it('leaves Premium restarts unaffected at the Free limit', () => {
    const result = attemptRestart(questionResume('quiz'), { isPremiumUser: true });

    expect(result.allowed).toBe(true);
    expect(result.storedResume).toBeNull();
  });

  it('uses the real subject for adaptive and interactive restarts, never synthetic adaptive', () => {
    const adaptive = questionResume('adaptive-practice', {
      subjectId: 'adaptive',
      session: {
        resumeSubjectId: 'adaptive',
        quotaSubjectId: 'math',
        adaptivePracticeMetadata: { requestedSubjectId: 'math' }
      }
    });
    const interactive = questionResume('interactive-practice', {
      subjectId: 'adaptive',
      session: { resumeSubjectId: 'adaptive', quotaSubjectId: 'science' },
      questions: [{ id: 'science-1', subjectId: 'science', q: 'Sains?', answer: 'Ya' }]
    });

    expect(resolveQuestionResumeQuotaSubjectId(adaptive)).toBe('math');
    expect(resolveQuestionResumeQuotaSubjectId(interactive)).toBe('science');
  });

  it('continues a valid existing resume at 10/10 without treating it as fresh work', () => {
    const resume = questionResume('quiz');
    const storage = new MemoryStorage();
    saveResume(resume, storage);

    expect(canStartFreeQuestionSession({
      dailyQuestionCount: FREE_DAILY_QUESTION_LIMIT,
      restoreFromResume: true,
      resumeExistingSession: true
    })).toBe(true);
    expect(loadResume({ mode: 'quiz', subjectId: 'math', topicId: resume.topicId }, storage))
      .toMatchObject({ sessionId: resume.sessionId });
  });
});
