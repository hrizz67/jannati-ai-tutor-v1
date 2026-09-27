import { isIOSWebKitBrowser } from './speechCapability.js';
import { createSpeechSession } from './speechEngine.js';

export function createSpeechActivitySession(options = {}) {
  return createSpeechSession(options);
}

export function createReadingSpeechSession(options = {}) {
  const recoverIOSWebKitStartup = isIOSWebKitBrowser();
  return createSpeechSession({
    continuous: true,
    interimResults: true,
    multiUtterance: true,
    silenceDelayMs: 1800,
    hardTimeoutMs: 15000,
    startTimeoutMs: recoverIOSWebKitStartup ? 6000 : 9000,
    startRetryLimit: recoverIOSWebKitStartup ? 1 : 0,
    startRetryDelayMs: 300,
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
