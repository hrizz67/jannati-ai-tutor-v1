import { shouldRecoverMobileSpeechStartup } from './speechCapability.js';
import { getSpeechDiagnosticMode } from './speechDiagnostics.js';
import { createSpeechSession } from './speechEngine.js';

const LEGACY_SIMPLE_MODE = 'legacy-simple';
const COMMUNICATION_ACTIVITIES = new Set(['reading', 'speaking']);

export function createSpeechActivitySession(options = {}) {
  return createSpeechSession(options);
}

export function createReadingSpeechSession(options = {}) {
  const recoverMobileStartup = shouldRecoverMobileSpeechStartup();
  const activity = typeof options?.activity === 'string' && options.activity
    ? options.activity
    : 'reading';
  const legacySimple = getSpeechDiagnosticMode() === LEGACY_SIMPLE_MODE
    && COMMUNICATION_ACTIVITIES.has(activity);
  const sessionOptions = {
    continuous: true,
    interimResults: true,
    multiUtterance: true,
    silenceDelayMs: 1800,
    hardTimeoutMs: 15000,
    startTimeoutMs: recoverMobileStartup ? 6000 : 9000,
    startRetryLimit: recoverMobileStartup ? 1 : 0,
    startRetryDelayMs: 300,
    postStartRetryLimit: recoverMobileStartup ? 1 : 0,
    postStartRetryDelayMs: 300,
    ...options
  };

  if (legacySimple) {
    Object.assign(sessionOptions, {
      continuous: false,
      interimResults: false,
      multiUtterance: false,
      silenceDelayMs: 9000,
      hardTimeoutMs: 9000,
      startTimeoutMs: 9000,
      startRetryLimit: 0,
      startRetryDelayMs: 0,
      postStartRetryLimit: 0,
      postStartRetryDelayMs: 0
    });
  }

  return createSpeechSession(sessionOptions);
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
