import { describe, expect, it } from 'vitest';
import { resolveTutorChatSubject } from '../../src/utils/tutorChatSubject.js';

const bm = { id: 'bm', title: 'Bahasa Melayu' };
const math = { id: 'math', title: 'Matematik' };
const english = { id: 'english', title: 'English' };
const adaptive = { id: 'adaptive', title: 'Adaptive' };

describe('P1-C Tutor subject ownership', () => {
  it('uses the current dashboard selection instead of a previous quiz subject', () => {
    expect(resolveTutorChatSubject({
      screen: 'dashboard', selectedSubjectId: 'math',
      selectedSubject: math, activeSubject: bm, allSubjects: [bm, math]
    })).toBe(math);
  });

  it('blocks a stale selectedSubject during an asynchronous subject switch', () => {
    expect(resolveTutorChatSubject({
      screen: 'dashboard', selectedSubjectId: 'math',
      selectedSubject: bm, activeSubject: bm, allSubjects: [bm]
    })).toBeNull();
    expect(resolveTutorChatSubject({
      screen: 'dashboard', selectedSubjectId: 'math',
      selectedSubject: bm, activeSubject: bm, allSubjects: [bm, math]
    })).toBe(math);
  });

  it('keeps the active exercise subject even when dashboard selection differs', () => {
    expect(resolveTutorChatSubject({
      screen: 'quiz', selectedSubjectId: 'math',
      selectedSubject: math, activeSubject: bm, allSubjects: [bm, math]
    })).toBe(bm);
  });

  it('preserves adaptive quiz subject ownership using the question subject', () => {
    expect(resolveTutorChatSubject({
      screen: 'quiz', selectedSubjectId: 'bm',
      selectedSubject: bm, activeSubject: adaptive,
      tutorSubjectId: 'english', allSubjects: [bm, math, english]
    })).toBe(english);
  });

  it('preserves contextual learning Tutor calls outside the dashboard', () => {
    expect(resolveTutorChatSubject({
      screen: 'learning', selectedSubjectId: 'math',
      selectedSubject: math, activeSubject: english, allSubjects: [bm, math, english]
    })).toBe(english);
  });

  it('does not invent a default subject from absent dashboard selection', () => {
    expect(resolveTutorChatSubject({
      screen: 'dashboard', selectedSubjectId: '',
      selectedSubject: bm, activeSubject: english, allSubjects: [bm, english]
    })).toBeNull();
  });
});
