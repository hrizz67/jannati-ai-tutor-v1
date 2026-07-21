import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrandLogo from '../BrandLogo';
import JannaAvatar from '../JannaAvatar';
import { formatSubjectName, formatTopicName, getHumanReadableTopic, getStudentDisplayName } from '../../utils/displayFormatter';
import { getTutorResponse } from '../../utils/tutorResponseService.js';
import { sanitizeChildFacingText } from '../../utils/childText.js';

const FALLBACK_MESSAGE = 'Saya akan bantu berdasarkan soalan yang sedang kamu jawab.';
const TIMEOUT_MESSAGE = 'Saya belum dapat menyediakan jawapan sekarang. Cuba sekali lagi.';
const FALLBACK_STATE_MESSAGE = 'Menggunakan jawapan sandaran yang selamat.';
const INITIAL_GREETING = 'Hai! Saya boleh beri petunjuk, terangkan soalan, atau bantu semak jawapan kamu.';
const RESPONSE_TIMEOUT_MS = 4500;

function withTimeout(promise, timeoutMs = RESPONSE_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      const error = new Error('Tutor response timed out');
      error.code = 'TUTOR_RESPONSE_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => window.clearTimeout(timeoutId));
}

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return normalizeText(value[0], fallback);
  const text = sanitizeChildFacingText(String(value).replace(/\s+/g, ' ').trim());
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(Boolean)
    .map(item => normalizeText(item, ''))
    .filter(Boolean);
}

function hasMeaningfulText(value) {
  const text = normalizeText(value, '');
  return Boolean(text && text !== 'undefined' && text !== 'null');
}

function buildQuestionContext(question, answer, feedback, selectedTopic, selectedSubject, overrides = {}) {
  const questionText = normalizeText(
    overrides.questionText ||
    question?.q ||
    question?.question ||
    question?.stem ||
    question?.text ||
    '',
    ''
  );
  const instruction = normalizeText(
    overrides.instruction ||
    question?.instruction ||
    question?.direction ||
    question?.prompt ||
    '',
    ''
  );
  const options = normalizeList(Array.isArray(overrides.options) && overrides.options.length ? overrides.options : question?.options || question?.choices || []);
  const expectedAnswer = normalizeText(
    overrides.expectedAnswer ||
    question?.answer ||
    question?.correctAnswer ||
    '',
    ''
  );
  const learnerAnswer = normalizeText(overrides.learnerAnswer || answer || '', '');
  const isCorrect = typeof feedback?.status === 'string'
    ? feedback.status === 'correct'
    : Boolean(feedback?.correct || feedback?.isCorrect);
  const explanationMode = normalizeText(
    overrides.explanationMode ||
    feedback?.status ||
    (isCorrect ? 'correct_answer_reinforcement' : ''),
    ''
  );
  const currentLearningObjective = normalizeText(
    overrides.currentLearningObjective ||
    selectedTopic?.learningObjective ||
    selectedTopic?.objective ||
    question?.learningObjective ||
    question?.objective ||
    '',
    ''
  );
  const topicLabel = getHumanReadableTopic({
    subject: selectedSubject,
    topic: selectedTopic,
    question,
    metadata: {
      topicId: selectedTopic?.id || '',
      displayName: selectedTopic?.title || selectedTopic?.name || ''
    }
  });
  return {
    questionText,
    instruction,
    options,
    expectedAnswer,
    learnerAnswer,
    isCorrect,
    explanationMode,
    currentLearningObjective,
    topicLabel: normalizeText(topicLabel, 'topik semasa')
  };
}

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll([
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(','))].filter(element => {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

function MessageBubble({ role = 'ai', text = '', suggestions = [], loading = false }) {
  const safeText = normalizeText(text, '');
  return (
    <article className={`chat-bubble ${role}${loading ? ' chat-bubble-loading' : ''}`}>
      <p className="chat-bubble-text">{safeText}</p>
      {loading && (
        <div className="chat-typing" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {role === 'ai' && suggestions.length > 0 && (
        <ul className="chat-suggestions" aria-label="Cadangan tindakan">
          {suggestions.slice(0, 3).map((item, index) => (
            <li key={`${safeText.slice(0, 12)}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function TutorAIModal({
  open,
  profile,
  adaptiveProfile,
  selectedSubject,
  selectedTopic,
  question,
  answer,
  feedback,
  questionText,
  instruction,
  options,
  expectedAnswer,
  learnerAnswer,
  explanationMode,
  currentLearningObjective,
  attemptCount = 0,
  hintsUsed = 0,
  learningObservation,
  predictionProfile,
  readiness,
  studyPlan,
  gamificationProfile,
  weakTopics = [],
  strongTopics = [],
  onTutup
}) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const openerRef = useRef(null);
  const requestIdRef = useRef(0);
  const onTutupRef = useRef(onTutup);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const studentProfile = adaptiveProfile || profile || {};
  const studentName = getStudentDisplayName(studentProfile, '');
  const activeSubject = selectedSubject || null;
  const activeTopic = selectedTopic || null;
  const currentQuestion = question || null;
  const questionContext = buildQuestionContext(
    currentQuestion,
    hasMeaningfulText(learnerAnswer) ? learnerAnswer : answer,
    feedback,
    activeTopic,
    activeSubject,
    {
      questionText,
      instruction,
      options,
      expectedAnswer,
      learnerAnswer,
      explanationMode,
      currentLearningObjective
    }
  );
  const normalizedQuestionText = normalizeText(questionText || questionContext.questionText, '');
  const normalizedInstruction = normalizeText(instruction || questionContext.instruction, '');
  const normalizedOptions = normalizeList(Array.isArray(options) && options.length ? options : questionContext.options);
  const normalizedExpectedAnswer = normalizeText(expectedAnswer || questionContext.expectedAnswer || currentQuestion?.answer || currentQuestion?.correctAnswer || '', '');
  const normalizedLearnerAnswer = normalizeText(learnerAnswer || answer || '', '');
  const normalizedExplanationMode = normalizeText(explanationMode || questionContext.explanationMode, '');
  const normalizedLearningObjective = normalizeText(currentLearningObjective || questionContext.currentLearningObjective, '');
  const isCorrect = questionContext.isCorrect;
  const subjectLabel = activeSubject?.title || formatSubjectName(activeSubject?.id);
  const topicLabel = questionContext.topicLabel || activeTopic?.title || formatTopicName(activeTopic?.id);

  onTutupRef.current = onTutup;

  const sessionKey = useMemo(() => [
    studentProfile?.studentId || studentProfile?.name || '',
    activeSubject?.id || '',
    activeTopic?.id || '',
    currentQuestion?.id || ''
  ].join('::'), [studentProfile?.studentId, studentProfile?.name, activeSubject?.id, activeTopic?.id, currentQuestion?.id]);

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => closeButtonRef.current?.focus?.(), 0);
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onTutupRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = getFocusableElements(modalRef.current);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const started = ++requestIdRef.current;
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) console.time('TutorAI:open');
    setMessages([{ role: 'ai', text: INITIAL_GREETING, suggestions: [] }]);
    setLoading(false);
    setStatus('idle');
    setError('');
    return () => {
      if (requestIdRef.current === started) requestIdRef.current += 1;
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) console.timeEnd('TutorAI:open');
    };
  }, [open, sessionKey]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!open || !(typeof import.meta !== 'undefined' && import.meta.env?.DEV)) return;
    const missing = [];
    if (!normalizedQuestionText) missing.push('questionText');
    if (!normalizedInstruction) missing.push('instruction');
    if (!normalizedExpectedAnswer) missing.push('expectedAnswer');
    if (!normalizedLearningObjective) missing.push('currentLearningObjective');
    if (!activeSubject?.id) missing.push('subject');
    if (!activeTopic?.id) missing.push('topic');
    if (missing.length) {
      console.warn('[TutorAIModal] missing exercise context', {
        missing,
        subjectId: activeSubject?.id || '',
        topicId: activeTopic?.id || ''
      });
    }
  }, [open, normalizedQuestionText, normalizedInstruction, normalizedExpectedAnswer, normalizedLearningObjective, activeSubject?.id, activeTopic?.id]);

  async function sendMessage(rawText = input, intent = 'general') {
    const text = normalizeText(rawText, '');
    if (!text || loading) return;
    const started = ++requestIdRef.current;
    const nextHistory = [...messages, { role: 'user', text }];
    setMessages(nextHistory);
    setLoading(true);
    setStatus('loading');
    setError('');
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) console.time('TutorAI:response');
      const response = await withTimeout(getTutorResponse({
        student: studentProfile,
        subject: activeSubject,
        topic: activeTopic,
        question: currentQuestion,
        questionText: normalizedQuestionText,
        instruction: normalizedInstruction,
        options: normalizedOptions,
        expectedAnswer: normalizedExpectedAnswer,
        learnerAnswer: normalizedLearnerAnswer,
        studentAnswer: normalizedLearnerAnswer,
        correctAnswer: normalizedExpectedAnswer,
        explanationMode: normalizedExplanationMode,
        currentLearningObjective: normalizedLearningObjective,
        isCorrect,
        attemptCount,
        hintsUsed,
        weakTopics,
        strongTopics,
        prompt: text,
        intent,
        locale: 'ms-MY',
        history: nextHistory,
        adaptiveProfile,
        studyPlan,
        readiness,
        learningObservation,
        predictionProfile,
        gamificationProfile
      }));
      if (requestIdRef.current !== started) return;
      setMessages(prev => [...prev, {
        role: 'ai',
        text: normalizeText(response?.shortText || response?.text, FALLBACK_MESSAGE),
        suggestions: normalizeList(response?.suggestedActions || response?.suggestions)
      }]);
      setStatus(response?.fallbackUsed ? 'fallback' : 'success');
      setError(response?.fallbackUsed ? FALLBACK_MESSAGE : '');
      setInput('');
    } catch (err) {
      if (requestIdRef.current !== started) return;
      const message = err?.code === 'TUTOR_RESPONSE_TIMEOUT' ? TIMEOUT_MESSAGE : FALLBACK_MESSAGE;
      setMessages(prev => [...prev, { role: 'ai', text: message, suggestions: [] }]);
      setStatus('error');
      setError(message);
    } finally {
      if (requestIdRef.current === started) {
        setLoading(false);
      }
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) console.timeEnd('TutorAI:response');
    }
  }

  function handlePromptClick(prompt, intent) {
    void sendMessage(prompt, intent);
  }

  if (!open) return null;

  const exercisePrompts = [
    { label: 'Beri saya petunjuk', intent: 'hint' },
    { label: 'Terangkan soalan ini', intent: 'question_help' },
    { label: 'Kenapa jawapan saya salah?', intent: 'wrong_answer_coaching', hidden: !attemptCount },
    { label: 'Beri contoh mudah', intent: 'example_request' }
  ].filter(item => !item.hidden);
  const analyticsPrompts = [
    { label: 'Apa topik lemah saya?', intent: 'weak_topic' },
    { label: 'Apa cadangan ulang kaji?', intent: 'revision_plan' },
    { label: 'Bagaimana UASA saya?', intent: 'uasa_summary' }
  ];

  const statusLabel = status === 'loading'
    ? 'Tutor AI sedang menaip...'
    : status === 'error'
      ? error || FALLBACK_MESSAGE
      : status === 'fallback'
        ? (typeof import.meta !== 'undefined' && import.meta.env?.DEV ? FALLBACK_STATE_MESSAGE : FALLBACK_MESSAGE)
        : 'Tutor AI sedia membantu.';

  return (
    <div
      className="ai-chat-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutor-ai-title"
      aria-describedby="tutor-ai-body"
    >
      <section ref={modalRef} className="ai-chat">
        <header className="ai-chat-head">
          <div className="ai-chat-brand">
            <JannaAvatar size={72} className="ai-chat-avatar" />
            <div className="ai-chat-brand-copy">
              <small className="eyebrow">JANNA</small>
              <strong>Rakan Pembelajaran AI</strong>
              <span>{studentName ? `Hai ${studentName}.` : 'Syabas! Teruskan usaha kamu.'}</span>
            </div>
          </div>
          <strong className="ai-chat-title" id="tutor-ai-title">Tutor AI</strong>
          <button ref={closeButtonRef} type="button" className="secondary" onClick={onTutup} aria-label="Tutup">Tutup</button>
        </header>

        <p className={`chat-status chat-status-${status}`} aria-live="polite">
          {statusLabel}
          {activeSubject?.id ? ` • ${subjectLabel}` : ''}
          {activeTopic?.id ? ` • ${topicLabel}` : ''}
        </p>

        <div className="ai-chat-body" id="tutor-ai-body" ref={bodyRef}>
          {messages.map((message, index) => (
            <MessageBubble
              key={`${message.role || 'ai'}-${index}`}
              role={message.role || 'ai'}
              text={message.text}
              suggestions={message.suggestions || []}
            />
          ))}
          {loading && <MessageBubble role="ai" text="Tutor AI sedang berfikir..." loading />}
          {error && !loading && <MessageBubble role="ai" text={error} />}
        </div>

        <div className="quick-prompts" aria-label="Prompt pantas Tutor AI">
          {exercisePrompts.map(prompt => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => handlePromptClick(prompt.label, prompt.intent)}
              disabled={loading}
            >
              {prompt.label}
            </button>
          ))}
        </div>

        <details className="quick-prompts-analytics">
          <summary>Lihat kemajuan saya</summary>
          <div className="quick-prompts" aria-label="Prompt kemajuan Tutor AI">
            {analyticsPrompts.map(prompt => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => handlePromptClick(prompt.label, prompt.intent)}
                disabled={loading}
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </details>

        <div className="ai-chat-input">
          <input
            ref={inputRef}
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Tanya Guru AI..."
            aria-label="Tanya Guru AI"
            autoFocus
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={loading || !normalizeText(input, '')}
          >
            Hantar
          </button>
        </div>
      </section>
    </div>
  );
}
