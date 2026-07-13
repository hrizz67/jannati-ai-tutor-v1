import { createSpeechSession } from './speechEngine.js';

export function createSpeechActivitySession(options = {}) {
  return createSpeechSession(options);
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
  startSpeechActivitySession,
  stopSpeechActivitySession
};
