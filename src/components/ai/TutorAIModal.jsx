import React, { useEffect, useMemo, useRef, useState } from 'react';
import JannaAvatar from '../JannaAvatar';
import VoiceButton from '../VoiceButton.jsx';
import { formatSubjectName, formatTopicName, getHumanReadableTopic, getStudentDisplayName } from '../../utils/displayFormatter';
import { getTutorResponse } from '../../utils/tutorResponseService.js';
import { sanitizeChildFacingText } from '../../utils/childText.js';
import { getAcceptedAnswers } from '../../utils/acceptedAnswers.js';
import { renderModalPortal, useModalRuntime } from './modalRuntime.js';

const FALLBACK_MESSAGE = 'Saya belum memahami soalan itu dengan tepat. Cuba tanya semula dengan ayat lain.';
const TIMEOUT_MESSAGE = 'Saya belum dapat menyediakan jawapan sekarang. Cuba sekali lagi.';
const FALLBACK_STATE_MESSAGE = 'Menggunakan jawapan sandaran yang selamat.';
const RESPONSE_TIMEOUT_MS = 4500;

function buildNaturalGreeting({ studentName = '', subjectLabel = '', topicLabel = '', questionText = '' } = {}) {
  const name = studentName ? `Hai ${studentName}` : 'Hai';
  const subject = subjectLabel || 'pelajaran ini';
  if (questionText) return `${name}. Saya sudah lihat soalan ${subject} kamu. Kita fikir bersama — kamu mahu petunjuk, penerangan atau contoh?`;
  if (topicLabel && topicLabel !== 'topik semasa') return `${name}. Hari ini kita fokus pada ${topicLabel}. Apa yang kamu mahu faham dahulu?`;
  return `${name}. Saya sedia mengajar dan membimbing kamu, bukan sekadar memberi jawapan. Apa yang ingin kamu faham?`;
}

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

function normalizeForDuplicate(value) {
  return normalizeText(value, '').toLocaleLowerCase('ms-MY').replace(/[.!?\s]+$/g, '').trim();
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
    acceptedAnswers: getAcceptedAnswers({ ...question, acceptedAnswers: overrides.acceptedAnswers }),
    learnerAnswer,
    isCorrect,
    explanationMode,
    currentLearningObjective,
    topicLabel: normalizeText(topicLabel, 'topik semasa')
  };
}

function MessageBubble({ role = 'ai', text = '', suggestions = [], loading = false, tone = '', voiceLang = 'ms-MY', source = '', onSuggestion = null }) {
  const safeText = normalizeText(text, '');
  return (
    <article className={`chat-bubble ${role}${loading ? ' chat-bubble-loading' : ''}${tone ? ` guided-feedback-${tone}` : ''}`}>
      <p className="chat-bubble-text">{safeText}</p>
      {role === 'ai' && source === 'generative-gateway' && (
        <small className="tutor-ai-source-label">Jawapan AI generatif · semak bersama guru</small>
      )}
      {role === 'ai' && !loading && safeText && <VoiceButton text={safeText} lang={voiceLang} label="Dengar" title="Dengar penerangan Tutor AI" className="voice-inline tutor-ai-voice" />}
      {loading && (
        <div className="chat-typing" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {role === 'ai' && suggestions.length > 0 && (
        <ul className="chat-suggestions" aria-label="Balasan pantas">
          {suggestions.slice(0, 3).map((item, index) => (
            <li key={`${safeText.slice(0, 12)}-${index}`}>
              <button type="button" onClick={() => onSuggestion?.(item)}>{item}</button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function TutorAIModal({
  open,
  conversationKey = '',
  initialMessages = [],
  onMessagesChange = null,
  profile,
  adaptiveProfile,
  selectedSubject,
  selectedTopic,
  availableSubjects = [],
  question,
  answer,
  feedback,
  questionText,
  instruction,
  options,
  expectedAnswer,
  acceptedAnswers = [],
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
  const requestIdRef = useRef(0);
  const [messages, setMessages] = useState(() => Array.isArray(initialMessages) ? initialMessages : []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [activeToolPanel, setActiveToolPanel] = useState('');

  const studentProfile = adaptiveProfile || profile || {};
  const studentName = getStudentDisplayName([profile, adaptiveProfile], '');
  const tutorStudentProfile = studentName ? { ...studentProfile, name: studentName } : studentProfile;
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
      acceptedAnswers,
      learnerAnswer,
      explanationMode,
      currentLearningObjective
    }
  );
  const normalizedQuestionText = normalizeText(questionText || questionContext.questionText, '');
  const normalizedInstruction = normalizeText(instruction || questionContext.instruction, '');
  const normalizedOptions = normalizeList(Array.isArray(options) && options.length ? options : questionContext.options);
  const normalizedExpectedAnswer = normalizeText(expectedAnswer || questionContext.expectedAnswer || currentQuestion?.answer || currentQuestion?.correctAnswer || '', '');
  const normalizedAcceptedAnswers = getAcceptedAnswers({ ...currentQuestion, acceptedAnswers });
  const normalizedLearnerAnswer = normalizeText(learnerAnswer || answer || '', '');
  const normalizedExplanationMode = normalizeText(explanationMode || questionContext.explanationMode, '');
  const normalizedLearningObjective = normalizeText(currentLearningObjective || questionContext.currentLearningObjective, '');
  const isCorrect = questionContext.isCorrect;
  const revealExpectedAnswer = isCorrect || normalizedExplanationMode === 'correct_answer_reinforcement' || normalizedExplanationMode === 'show_answer' || Number(attemptCount) >= 3;
  const hasExerciseContext = Boolean(normalizedQuestionText || normalizedInstruction || normalizedExpectedAnswer || normalizedOptions.length);
  const hasVisibleQuestionContext = Boolean(normalizedInstruction || normalizedQuestionText || (normalizedExpectedAnswer && revealExpectedAnswer));
  const subjectLabel = activeSubject?.title || formatSubjectName(activeSubject?.id);
  const topicLabel = questionContext.topicLabel || activeTopic?.title || formatTopicName(activeTopic?.id);
  const voiceLang = activeSubject?.id === 'english' ? 'en-US' : activeSubject?.id === 'arab' ? 'ar-SA' : 'ms-MY';

  const sessionKey = useMemo(
    () => normalizeText(conversationKey || studentProfile?.studentId || studentProfile?.name || 'learner', 'learner'),
    [conversationKey, studentProfile?.studentId, studentProfile?.name]
  );

  useModalRuntime({
    open,
    modalRef,
    initialFocusRef: closeButtonRef,
    onClose: onTutup
  });

  useEffect(() => {
    setMessages(Array.isArray(initialMessages) ? initialMessages : []);
    setInput('');
    setLoading(false);
    setStatus('idle');
    setError('');
    setActiveToolPanel('');
  }, [sessionKey]);

  useEffect(() => {
    onMessagesChange?.(sessionKey, messages);
  }, [messages, sessionKey, onMessagesChange]);

  useEffect(() => {
    if (!open) return undefined;
    const started = ++requestIdRef.current;
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) console.time('TutorAI:open');
    setMessages(current => current.length ? current : [{
      role: 'ai',
      text: buildNaturalGreeting({
        studentName,
        subjectLabel,
        topicLabel,
        questionText: normalizedQuestionText
      }),
      suggestions: []
    }]);
    setLoading(false);
    setStatus('idle');
    setError('');
    setActiveToolPanel('');
    return () => {
      if (requestIdRef.current === started) requestIdRef.current += 1;
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) console.timeEnd('TutorAI:open');
    };
  }, [open, sessionKey]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [messages, loading, activeToolPanel]);

  useEffect(() => {
    if (messages.length > 1 && !loading) bodyRef.current?.focus?.({ preventScroll: true });
  }, [messages.length, loading]);

  useEffect(() => {
    if (!open || !(typeof import.meta !== 'undefined' && import.meta.env?.DEV)) return;
    if (!hasExerciseContext) return;
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
        student: tutorStudentProfile,
        subject: activeSubject,
        topic: activeTopic,
        availableSubjects,
        question: currentQuestion,
        questionText: normalizedQuestionText,
        instruction: normalizedInstruction,
        options: normalizedOptions,
        expectedAnswer: normalizedExpectedAnswer,
        learnerAnswer: normalizedLearnerAnswer,
        studentAnswer: normalizedLearnerAnswer,
        correctAnswer: normalizedExpectedAnswer,
        acceptedAnswers: normalizedAcceptedAnswers,
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
        history: messages,
        adaptiveProfile,
        studyPlan,
        readiness,
        learningObservation,
        predictionProfile,
        gamificationProfile
      }));
      if (requestIdRef.current !== started) return;
      setMessages(prev => {
        const nextText = normalizeText(response?.shortText || response?.text, FALLBACK_MESSAGE);
        if (normalizeForDuplicate(prev.at(-1)?.text) === normalizeForDuplicate(nextText)) return prev;
        return [...prev, {
        role: 'ai',
        text: nextText,
        tone: response?.supportStage === 'guiding_question' ? 'pulse' : response?.supportStage === 'strong_hint' ? 'hint' : response?.isCorrect ? 'correct' : '',
        source: response?.source || '',
        suggestions: normalizeList(
          response?.quickReplies?.length
            ? response.quickReplies
            : (response?.suggestedActions || response?.suggestions)
        )
        }];
      });
      setStatus(response?.fallbackUsed ? 'fallback' : 'success');
      setError(response?.fallbackUsed ? FALLBACK_MESSAGE : '');
      setInput('');
    } catch (err) {
      if (requestIdRef.current !== started) return;
      const message = err?.code === 'TUTOR_RESPONSE_TIMEOUT' ? TIMEOUT_MESSAGE : FALLBACK_MESSAGE;
      setMessages(prev => normalizeForDuplicate(prev.at(-1)?.text) === normalizeForDuplicate(message)
        ? prev
        : [...prev, { role: 'ai', text: message, suggestions: [] }]);
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
    setActiveToolPanel('');
    void sendMessage(prompt, intent);
  }

  function toggleToolPanel(panel) {
    setActiveToolPanel(current => current === panel ? '' : panel);
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
  const activeToolPrompts = activeToolPanel === 'question' ? exercisePrompts : activeToolPanel === 'progress' ? analyticsPrompts : [];
  const activeToolLabel = activeToolPanel === 'question' ? 'Pilihan bantuan soalan' : 'Pilihan kemajuan pembelajaran';

  const statusLabel = status === 'loading'
    ? 'Tutor AI sedang menaip...'
    : status === 'error'
      ? error || FALLBACK_MESSAGE
      : status === 'fallback'
        ? (typeof import.meta !== 'undefined' && import.meta.env?.DEV ? FALLBACK_STATE_MESSAGE : FALLBACK_MESSAGE)
        : 'Tutor AI sedia membantu.';
  const showStatus = status === 'loading' || status === 'error' || status === 'fallback';

  const modalNode = (
    <div className="ai-chat-overlay" data-modal-open="true">
      <section
        ref={modalRef}
        className="ai-chat ai-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutor-ai-title"
        aria-describedby="tutor-ai-description"
        tabIndex={-1}
      >
        <header className="ai-chat-head">
          <div className="ai-chat-brand">
            <JannaAvatar size={72} className="ai-chat-avatar" />
            <div className="ai-chat-brand-copy">
              <small className="eyebrow">JANNA</small>
              <strong>Guru Pembelajaran AI</strong>
              <span>{studentName ? `Hai ${studentName}.` : 'Syabas! Teruskan usaha kamu.'}</span>
            </div>
          </div>
          <strong className="ai-chat-title" id="tutor-ai-title">Tutor AI</strong>
          <button ref={closeButtonRef} type="button" className="secondary" onClick={onTutup} aria-label="Tutup">Tutup</button>
          <p className="ai-modal-context-line" id="tutor-ai-description">
            {subjectLabel || 'Semua subjek'}
            {topicLabel ? ` · ${topicLabel}` : ''}
          </p>
        </header>

        {showStatus && (
          <div className={`chat-status chat-status-${status}`} aria-live="polite">
            {statusLabel}
          </div>
        )}
        <p className="tutor-ai-disclosure">
          Tutor AI membantu pembelajaran dan boleh tersilap. Jangan kongsi maklumat peribadi; semak perkara penting bersama guru atau penjaga.
        </p>

        <div className="ai-chat-body" id="tutor-ai-body" ref={bodyRef} tabIndex="-1">
          {hasVisibleQuestionContext && (
            <section className="ai-chat-context-card" aria-label="Konteks soalan semasa">
              <div className="ai-chat-context-grid">
                {normalizedInstruction && (
                  <div>
                    <span className="ai-chat-context-label">Arahan</span>
                    <p>{normalizedInstruction}</p>
                  </div>
                )}
                {normalizedQuestionText && (
                  <div>
                    <span className="ai-chat-context-label">Soalan</span>
                    <p>{normalizedQuestionText}</p>
                  </div>
                )}
                {normalizedExpectedAnswer && revealExpectedAnswer && (
                  <div>
                    <span className="ai-chat-context-label">Jawapan dijangka</span>
                    <p>{normalizedExpectedAnswer}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={`${message.role || 'ai'}-${index}`}
              role={message.role || 'ai'}
              text={message.text}
              suggestions={message.suggestions || []}
              tone={message.tone || ''}
              voiceLang={voiceLang}
              source={message.source || ''}
              onSuggestion={suggestion => void sendMessage(suggestion, 'general')}
            />
          ))}
          {loading && <MessageBubble role="ai" text="Tutor AI sedang berfikir..." loading voiceLang={voiceLang} />}

          <nav className="tutor-ai-tools" aria-label="Alat pembelajaran Tutor AI">
            <button
              type="button"
              className="tutor-ai-tool-button"
              onClick={() => handlePromptClick('Hari ini saya patut belajar apa?', 'learning_recommendation')}
              disabled={loading}
            >
              Cadangan belajar
            </button>
            {hasExerciseContext && (
              <button
                type="button"
                className={`tutor-ai-tool-button${activeToolPanel === 'question' ? ' is-active' : ''}`}
                onClick={() => toggleToolPanel('question')}
                aria-expanded={activeToolPanel === 'question'}
                disabled={loading}
              >
                Bantuan untuk soalan ini
              </button>
            )}
            <button
              type="button"
              className={`tutor-ai-tool-button${activeToolPanel === 'progress' ? ' is-active' : ''}`}
              onClick={() => toggleToolPanel('progress')}
              aria-expanded={activeToolPanel === 'progress'}
              disabled={loading}
            >
              Lihat kemajuan saya
            </button>
          </nav>

          {activeToolPrompts.length > 0 && (
            <section className="tutor-ai-tool-panel" aria-label={activeToolLabel}>
              <div className="quick-prompts">
                {activeToolPrompts.map(prompt => (
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
            </section>
          )}
        </div>

        <div className="ai-chat-input ai-modal-footer" data-modal-footer="true">
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
            placeholder="Tanya Janna..."
            aria-label="Tanya Tutor AI"
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

  return renderModalPortal(modalNode);
}
