import { createSpeechSession } from './speechEngine.js';

export function createSpeechActivitySession(options = {}) {
  return createSpeechSession(options);
}

export function createReadingSpeechSession(options = {}) {
  return createSpeechSession({
    continuous: true,
    interimResults: true,
    multiUtterance: true,
    silenceDelayMs: 1800,
    hardTimeoutMs: 15000,
    ...options
  });
}

export function startSpeechActivitySession(options = {}) {
  const session = createSpeechActivitySession(options);
  session.start();
  return session;
}

export function stopSpeechActivitySession(session) {
  session?.stop?.();
}

export function cancelSpeechActivitySession(session) {
  session?.cancel?.();
}

export default {
  cancelSpeechActivitySession,
  createSpeechActivitySession,
  createReadingSpeechSession,
  startSpeechActivitySession,
  stopSpeechActivitySession
};
