import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrandLogo from '../BrandLogo';
import JannaAvatar from '../JannaAvatar';
import { getTutorResponse } from '../../ai/index.js';
import { clampPercent, formatSubjectName, formatTopicName, getStudentDisplayName } from '../../utils/displayFormatter';

const FALLBACK_MESSAGE = 'Saya belum dapat memproses soalan itu sekarang. Cuba tanya dengan ayat yang lebih ringkas.';

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return normalizeText(value[0], fallback);
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(Boolean)
    .map(item => normalizeText(item, ''))
    .filter(Boolean);
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
  const questionText = normalizeText(currentQuestion?.q || currentQuestion?.question || '', '');
  const currentAnswer = normalizeText(answer, '');
  const correctAnswer = normalizeText(currentQuestion?.answer || currentQuestion?.correctAnswer || '', '');
  const isCorrect = typeof feedback?.status === 'string'
    ? feedback.status === 'correct'
    : Boolean(feedback?.correct || feedback?.isCorrect);
  const subjectLabel = activeSubject?.title || formatSubjectName(activeSubject?.id);
  const topicLabel = activeTopic?.title || formatTopicName(activeTopic?.id);

  const sessionKey = useMemo(() => [
    studentProfile?.studentId || studentProfile?.name || '',
    activeSubject?.id || '',
    activeTopic?.id || '',
    currentQuestion?.id || ''
  ].join('::'), [studentProfile?.studentId, studentProfile?.name, activeSubject?.id, activeTopic?.id, currentQuestion?.id]);

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    const timer = window.setTimeout(() => closeButtonRef.current?.focus?.(), 0);
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onTutup?.();
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
      openerRef.current?.focus?.();
    };
  }, [open, onTutup]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const started = ++requestIdRef.current;

    setMessages([]);
    setLoading(true);
    setStatus('loading');
    setError('');

    const bootstrap = async () => {
      try {
        const response = await getTutorResponse({
          student: studentProfile,
          subject: activeSubject,
          topic: activeTopic,
          question: currentQuestion,
          studentAnswer: currentAnswer,
          correctAnswer,
          isCorrect,
          attemptCount,
          hintsUsed,
          weakTopics,
          strongTopics,
          prompt: 'halo',
          intent: 'general',
          locale: 'ms-MY',
          history: [],
          adaptiveProfile,
          studyPlan,
          readiness,
          learningObservation,
          predictionProfile,
          gamificationProfile
        });
        if (cancelled || requestIdRef.current !== started) return;
        const greeting = normalizeText(response?.text, `Hai ${studentName}, saya sedia membantu.`);
        setMessages([{ role: 'ai', text: greeting, suggestions: normalizeList(response?.suggestions) }]);
        setStatus(response?.fallbackUsed ? 'fallback' : 'success');
        setError(response?.fallbackUsed ? FALLBACK_MESSAGE : '');
      } catch (err) {
        if (cancelled || requestIdRef.current !== started) return;
        setMessages([{ role: 'ai', text: FALLBACK_MESSAGE, suggestions: [] }]);
        setStatus('error');
        setError(FALLBACK_MESSAGE);
      } finally {
        if (!cancelled && requestIdRef.current === started) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    sessionKey,
    studentProfile,
    activeSubject,
    activeTopic,
    currentQuestion,
    currentAnswer,
    correctAnswer,
    isCorrect,
    weakTopics,
    strongTopics,
    adaptiveProfile,
    studyPlan,
    readiness,
    learningObservation,
    predictionProfile,
    gamificationProfile,
    studentName
  ]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [messages, loading]);

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
      const response = await getTutorResponse({
        student: studentProfile,
        subject: activeSubject,
        topic: activeTopic,
        question: currentQuestion,
        studentAnswer: currentAnswer,
        correctAnswer,
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
      });
      if (requestIdRef.current !== started) return;
      setMessages(prev => [...prev, {
        role: 'ai',
        text: normalizeText(response?.text, FALLBACK_MESSAGE),
        suggestions: normalizeList(response?.suggestions)
      }]);
      setStatus(response?.fallbackUsed ? 'fallback' : 'success');
      setError(response?.fallbackUsed ? FALLBACK_MESSAGE : '');
      setInput('');
    } catch (err) {
      if (requestIdRef.current !== started) return;
      setMessages(prev => [...prev, { role: 'ai', text: FALLBACK_MESSAGE, suggestions: [] }]);
      setStatus('error');
      setError(FALLBACK_MESSAGE);
    } finally {
      if (requestIdRef.current === started) {
        setLoading(false);
      }
    }
  }

  function handlePromptClick(prompt, intent) {
    void sendMessage(prompt, intent);
  }

  if (!open) return null;

  const quickPrompts = [
    { label: 'Apa topik lemah saya?', intent: 'weak_topic' },
    { label: 'Apa cadangan ulang kaji?', intent: 'revision_plan' },
    { label: 'Bagaimana UASA saya?', intent: 'uasa_summary' }
  ];

  const statusLabel = status === 'loading'
    ? 'Tutor AI sedang menaip...'
    : status === 'error'
      ? error || FALLBACK_MESSAGE
      : status === 'fallback'
        ? 'Menggunakan jawapan sandaran yang selamat.'
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
          {quickPrompts.map(prompt => (
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
