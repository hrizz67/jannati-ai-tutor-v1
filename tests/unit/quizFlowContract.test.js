import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const app = fs.readFileSync('src/App.jsx', 'utf8');

function sourceBetween(startMarker, endMarker) {
  const start = app.indexOf(startMarker);
  const end = app.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return app.slice(start, end);
}

describe('Quiz rendered and controller contracts', () => {
  it('routes Enter and Next through explicit checked-answer guards', () => {
    const quiz = sourceBetween('function Quiz(', '\nfunction UasaSimulator(');
    const nextQuestion = sourceBetween('  function nextQuestion()', '\n  function finishTopic()');

    expect(quiz).toContain('answerChecked ? onNextQuestion() : onCheckAnswer()');
    expect(quiz).toContain('{answerChecked && <div className="actions">');
    expect(nextQuestion).toContain('if (!isQuizAnswerChecked(feedback)) return;');
  });

  it('removes the retry path and disables hints after a correct answer', () => {
    const quiz = sourceBetween('function Quiz(', '\nfunction UasaSimulator(');
    const retry = sourceBetween('  function tryAgainQuestion()', '\n  function showQuestionHint()');
    const hint = sourceBetween('  function showQuestionHint()', '\n  function nextQuestion()');

    expect(quiz).toContain('{canRetryQuizAnswer(feedback) &&');
    expect(quiz).toContain("disabled={feedback?.status === 'correct'}");
    expect(retry).toContain("feedback?.status === 'correct'");
    expect(retry).toContain("getBestCreditedQuizOutcome(sessionRef.current?.answers, question.id) === 'correct'");
    expect(hint).toContain("feedback?.status === 'correct'");
    expect(hint).toContain("getBestCreditedQuizOutcome(sessionRef.current?.answers, question.id) === 'correct'");
  });

  it('restores checked state safely and keeps per-attempt adaptive numbering', () => {
    const startTopic = sourceBetween('  function startTopic(', '\n  async function startResume(');
    const checkAnswer = sourceBetween('  function checkAnswer()', '\n  function createCoachSnapshot(');

    expect(startTopic).toContain('reconcileQuizSessionCredits(');
    expect(startTopic).toContain('setAnswer(String(restoredQuestionState?.answer || \'\'));');
    expect(startTopic).toContain('setFeedback(restoredQuestionState?.feedback || null);');
    expect(checkAnswer).toContain('const attemptNumber = (liveSession.answers || []).filter');
    expect(checkAnswer).toMatch(/recordQuestionResult\([\s\S]*?attemptNumber,/);
    expect(checkAnswer).toContain('appendCreditedQuizAttempt(liveSession, attempt, {');
  });

  it('reopens valid resumes before fresh quota gates and guards new submissions by real subject', () => {
    const startTopic = sourceBetween('  function startTopic(', '\n  async function startResume(');
    const startResume = sourceBetween('  async function startResume(', '\n  async function restartResume(');
    const startInteractivePracticeResume = sourceBetween('  async function startInteractivePracticeResume(', '\n  function startTopic(');
    const startAdaptivePractice = sourceBetween('  async function startAdaptivePractice(', '\n  function currentQuestion(');
    const checkAnswer = sourceBetween('  function checkAnswer()', '\n  function createCoachSnapshot(');

    expect(startTopic.indexOf('const matchingResume')).toBeLessThan(startTopic.indexOf('const subjectDailyQuestionCount'));
    expect(startTopic).toContain('canStartFreeQuestionSession({');
    expect(startTopic).toContain('restoreFromResume: options.restoreFromResume');
    expect(startTopic).toContain('resumeExistingSession: options.resumeExistingSession');
    expect(startResume).toContain('resumeExistingSession: true');
    expect(startInteractivePracticeResume).toContain('...(restart ? {} : { resumeExistingSession: true })');
    expect(startInteractivePracticeResume).toContain('quotaSubjectId,');
    expect(startInteractivePracticeResume).toContain('resumeSubjectId,');
    expect(startAdaptivePractice.indexOf('const practiceResume')).toBeLessThan(startAdaptivePractice.indexOf('const subjectDailyQuestionCount'));
    expect(startAdaptivePractice).toContain('capQuestionCountToRemainingQuota(questionCount, subjectDailyQuestionCount)');
    expect(checkAnswer).toMatch(/resolveQuestionQuotaSubjectId\(\s*question,/);
    expect(checkAnswer).toContain('canSubmitFreeQuestion({');
    expect(checkAnswer).toContain('subjectId: quotaSubjectId || null');
  });

  it('clears a completed adaptive resume with the same canonical real subject used by autosave', () => {
    const autoSave = sourceBetween('  function autoSave(', '\n  function changeQuizAnswer(');
    const finishTopic = sourceBetween('  function finishTopic()', '\n  function completeDailyChallenge()');

    expect(autoSave).toContain('resolveSessionResumeSubjectId(');
    expect(finishTopic).toContain('resolveSessionResumeSubjectId(');
    expect(finishTopic).toMatch(/clearResumeData\(setResume, \{[\s\S]*?subjectId: resumeSubjectId \|\| activeSubject\.id,[\s\S]*?topicId: activeTopic\.id/);
  });

  it('preflights fresh question restarts before clearing the existing resume', () => {
    const restartResume = sourceBetween('  async function restartResume()', '\n  async function startAdaptiveLesson(');
    const preflightIndex = restartResume.indexOf('canRestartQuestionResume({');
    const clearIndex = restartResume.indexOf('clearResumeData(setResume, targetResume, learningIdentity);');

    expect(restartResume).toContain('resolveQuestionResumeQuotaSubjectId(targetResume)');
    expect(restartResume).toContain('getSubjectDailyQuestionCount(quotaSubjectId)');
    expect(restartResume).toContain("openAccessNotice('daily-limit', 'Latihan harian');");
    expect(restartResume).toMatch(/if \(!canRestart\) \{[\s\S]*?openAccessNotice\([\s\S]*?return;/);
    expect(preflightIndex).toBeGreaterThanOrEqual(0);
    expect(preflightIndex).toBeLessThan(clearIndex);
    expect(restartResume).not.toContain('resumeExistingSession: true');
  });
});
