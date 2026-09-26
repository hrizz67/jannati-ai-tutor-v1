import { describe, expect, it } from 'vitest';
import { resolveSessionResumeSubjectId } from '../../src/services/accessControl.js';
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

function adaptiveResume() {
  return {
    version: 1,
    mode: 'adaptive-practice',
    sessionId: 'adaptive-session-1',
    subjectId: 'math',
    topicId: 'adaptive_math_1',
    questions: [{ id: 'MATH-001', subjectId: 'math', q: '1 + 1?', answer: '2' }],
    currentIndex: 0,
    session: {
      mode: 'adaptive-practice',
      adaptiveSessionId: 'adaptive-session-1',
      resumeSubjectId: 'math',
      quotaSubjectId: 'math',
      xp: 10,
      coins: 2,
      answers: [{ questionId: 'MATH-001', status: 'correct' }]
    },
    updatedAt: '2026-09-26T00:00:00.000Z'
  };
}

describe('Adaptive-practice completion resume integrity', () => {
  it('removes the real-subject slot so a completed session cannot be loaded for another finish', () => {
    const storage = new MemoryStorage();
    const resume = adaptiveResume();
    saveResume(resume, storage);

    const resumeSubjectId = resolveSessionResumeSubjectId(
      resume.session,
      resume.questions[resume.currentIndex],
      'adaptive'
    );
    clearResume({ mode: resume.mode, subjectId: resumeSubjectId, topicId: resume.topicId }, storage);

    expect(resumeSubjectId).toBe('math');
    expect(loadResume({ mode: resume.mode, subjectId: 'math', topicId: resume.topicId }, storage)).toBeNull();
  });

  it('never resolves the synthetic adaptive subject when a persisted real subject exists', () => {
    const resume = adaptiveResume();
    expect(resolveSessionResumeSubjectId(resume.session, resume.questions[0], 'adaptive')).toBe('math');
  });
});
