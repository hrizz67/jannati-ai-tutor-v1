import { createNativeSpeechProbeController } from './nativeSpeechProbe.js';

const STORAGE_KEY = 'jannati_speech_diagnostics_v1';
const PANEL_ID = 'jannati-speech-diagnostic-panel';
const MAX_EVENTS = 300;
const VALID_MODES = new Set(['current', 'single-interim', 'single-final', 'legacy-simple', 'native-probe']);
function readBundledReference() {
  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__) : 'local';
  const buildRevision = typeof __APP_BUILD_REVISION__ !== 'undefined' ? String(__APP_BUILD_REVISION__) : 'local';
  return {
    referenceType: 'bundled-runtime',
    appVersion,
    buildRevision
  };
}

const BUNDLED_REFERENCE = Object.freeze(readBundledReference());

let memoryEnvelope = null;
let currentSessionId = '';
let sessionSequence = 0;
let initialized = false;
let panelRender = null;
let nativeProbeController = null;
const subscribers = new Set();

function getWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function getDocument() {
  return typeof document !== 'undefined' ? document : null;
}

function getNavigator() {
  return typeof navigator !== 'undefined' ? navigator : null;
}

function getSearchParams() {
  try {
    return new URLSearchParams(getWindow()?.location?.search || '');
  } catch {
    return new URLSearchParams();
  }
}

function safeString(value, maximum = 160) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function safeInteger(value, fallback = null) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function safeBoolean(value) {
  return typeof value === 'boolean' ? value : null;
}

function nowMs() {
  return Date.now();
}

function createId(prefix) {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return prefix + '-' + cryptoApi.randomUUID();
  }
  return prefix + '-' + nowMs().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function getStorage() {
  try {
    return getWindow()?.sessionStorage || null;
  } catch {
    return null;
  }
}

function readRuntimeInfo() {
  const browserNavigator = getNavigator();
  const controller = browserNavigator?.serviceWorker?.controller || null;
  const standalone = Boolean(
    getWindow()?.matchMedia?.('(display-mode: standalone)')?.matches
    || browserNavigator?.standalone === true
  );
  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__) : 'local';
  const buildRevision = typeof __APP_BUILD_REVISION__ !== 'undefined' ? String(__APP_BUILD_REVISION__) : 'local';
  return {
    appVersion,
    buildRevision,
    serviceWorkerScriptUrl: safeString(controller?.scriptURL || '', 400),
    serviceWorkerControllerState: safeString(controller?.state || (controller ? 'controlling' : 'none'), 40),
    displayMode: standalone ? 'standalone' : 'browser',
    documentVisibility: safeString(getDocument()?.visibilityState || 'unknown', 24)
  };
}

function createEnvelope() {
  return {
    schemaVersion: 1,
    traceId: createId('trace'),
    startedAtMs: nowMs(),
    events: []
  };
}

function normalizeStoredEvent(event) {
  if (!event || typeof event !== 'object') return null;
  return {
    schemaVersion: 1,
    traceId: safeString(event.traceId, 80),
    relativeMs: Math.max(0, Number(event.relativeMs) || 0),
    isoTime: safeString(event.isoTime, 40),
    activity: safeString(event.activity, 40),
    questionIndex: safeInteger(event.questionIndex),
    contextKey: safeString(event.contextKey, 160),
    sessionId: safeString(event.sessionId, 100),
    attempt: Math.max(0, safeInteger(event.attempt, 0)),
    event: safeString(event.event, 80),
    reason: safeString(event.reason, 160),
    requestedContinuous: safeBoolean(event.requestedContinuous),
    appliedContinuous: safeBoolean(event.appliedContinuous),
    requestedInterim: safeBoolean(event.requestedInterim),
    appliedInterim: safeBoolean(event.appliedInterim),
    multiUtterance: safeBoolean(event.multiUtterance),
    language: safeString(event.language, 40),
    recognitionState: safeString(event.recognitionState, 60),
    documentVisibility: safeString(event.documentVisibility, 24),
    displayMode: safeString(event.displayMode, 24),
    appVersion: safeString(event.appVersion, 40),
    buildRevision: safeString(event.buildRevision, 120),
    serviceWorkerScriptUrl: safeString(event.serviceWorkerScriptUrl, 400),
    serviceWorkerControllerState: safeString(event.serviceWorkerControllerState, 40),
    speechMode: safeString(event.speechMode, 40),
    resultIndex: safeInteger(event.resultIndex),
    resultsLength: safeInteger(event.resultsLength),
    finalResultCount: safeInteger(event.finalResultCount),
    interimResultCount: safeInteger(event.interimResultCount),
    alternativeCount: safeInteger(event.alternativeCount),
    nonEmptyTranscriptCount: safeInteger(event.nonEmptyTranscriptCount),
    totalCharacterCount: safeInteger(event.totalCharacterCount),
    nativeEndAcknowledged: safeBoolean(event.nativeEndAcknowledged),
    retryBeforeOldOnend: safeBoolean(event.retryBeforeOldOnend),
    probeId: safeString(event.probeId, 100),
    probeElapsedMs: Math.max(0, safeInteger(event.probeElapsedMs, 0)),
    errorCode: safeString(event.errorCode, 80)
  };
}

function loadEnvelope() {
  if (memoryEnvelope) return memoryEnvelope;
  const storage = getStorage();
  if (storage) {
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      if (parsed && parsed.schemaVersion === 1 && Array.isArray(parsed.events)) {
        memoryEnvelope = {
          schemaVersion: 1,
          traceId: safeString(parsed.traceId, 80) || createId('trace'),
          startedAtMs: Number(parsed.startedAtMs) || nowMs(),
          events: parsed.events.map(normalizeStoredEvent).filter(Boolean).slice(-MAX_EVENTS)
        };
        return memoryEnvelope;
      }
    } catch {
      // Ignore corrupt or unavailable session storage.
    }
  }
  memoryEnvelope = createEnvelope();
  return memoryEnvelope;
}

function persistEnvelope() {
  const storage = getStorage();
  if (!storage || !memoryEnvelope) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(memoryEnvelope));
  } catch {
    // In-memory diagnostics remain available when session storage is full or blocked.
  }
}

function notify() {
  subscribers.forEach(listener => {
    try {
      listener();
    } catch {
      // Diagnostic observers must never affect learner behavior.
    }
  });
  try {
    panelRender?.();
  } catch {
    // The panel is best-effort only.
  }
}

function getNativeProbeController() {
  if (!nativeProbeController) {
    nativeProbeController = createNativeSpeechProbeController({
      getWindow,
      isEnabled: () => (
        isSpeechDiagnosticsEnabled()
        && getSpeechDiagnosticMode() === 'native-probe'
      ),
      trace: traceSpeechDiagnostic,
      onStateChange: notify
    });
  }
  return nativeProbeController;
}

export function startNativeSpeechProbe() {
  return getNativeProbeController().start();
}

export function stopNativeSpeechProbe() {
  return getNativeProbeController().stop();
}

export function abortNativeSpeechProbe() {
  return getNativeProbeController().abort();
}

export function getNativeSpeechProbeState() {
  return getNativeProbeController().getState();
}

export function isSpeechDiagnosticsEnabled() {
  return getSearchParams().get('speechDiag') === '1';
}

export function getSpeechDiagnosticMode() {
  if (!isSpeechDiagnosticsEnabled()) return 'current';
  const requested = safeString(getSearchParams().get('speechMode') || 'current', 40);
  return VALID_MODES.has(requested) ? requested : 'current';
}

export function resolveSpeechDiagnosticCaptureMode({
  continuous = false,
  interimResults = false,
  multiUtterance = false,
  userAgent,
  maxTouchPoints
} = {}) {
  const browserNavigator = getNavigator();
  const resolvedUserAgent = typeof userAgent === 'string'
    ? userAgent
    : String(browserNavigator?.userAgent || '');
  const resolvedTouchPoints = Number.isFinite(Number(maxTouchPoints))
    ? Number(maxTouchPoints)
    : Number(browserNavigator?.maxTouchPoints) || 0;
  const isIOS = /iP(hone|ad|od)/i.test(resolvedUserAgent)
    || (/Macintosh/i.test(resolvedUserAgent) && resolvedTouchPoints > 1);
  const isAndroid = /Android/i.test(resolvedUserAgent);
  const mobile = isIOS || isAndroid;
  const requestedContinuous = Boolean(continuous);
  const requestedInterim = Boolean(interimResults);
  const currentContinuous = multiUtterance ? true : requestedContinuous;
  const currentInterim = multiUtterance ? true : requestedInterim;
  const enabled = isSpeechDiagnosticsEnabled();
  const speechMode = getSpeechDiagnosticMode();
  let appliedContinuous = currentContinuous;
  let appliedInterim = currentInterim;

  if (enabled && mobile && speechMode === 'single-interim') {
    appliedContinuous = false;
    appliedInterim = true;
  } else if (enabled && mobile && speechMode === 'single-final') {
    appliedContinuous = false;
    appliedInterim = false;
  }

  return {
    enabled,
    speechMode,
    mobile,
    platform: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop',
    requestedContinuous,
    appliedContinuous,
    requestedInterim,
    appliedInterim,
    multiUtterance: Boolean(multiUtterance)
  };
}

export function createSpeechResultMetadata(event) {
  const results = event?.results ? Array.from(event.results) : [];
  let finalResultCount = 0;
  let interimResultCount = 0;
  let alternativeCount = 0;
  let nonEmptyTranscriptCount = 0;
  let totalCharacterCount = 0;

  results.forEach(result => {
    if (!result) return;
    if (result.isFinal) finalResultCount += 1;
    else interimResultCount += 1;
    Array.from(result).forEach(alternative => {
      alternativeCount += 1;
      const transcript = typeof alternative?.transcript === 'string' ? alternative.transcript.trim() : '';
      if (!transcript) return;
      nonEmptyTranscriptCount += 1;
      totalCharacterCount += transcript.length;
    });
  });

  return {
    resultIndex: safeInteger(event?.resultIndex, 0),
    resultsLength: results.length,
    finalResultCount,
    interimResultCount,
    alternativeCount,
    nonEmptyTranscriptCount,
    totalCharacterCount
  };
}

export function traceSpeechDiagnostic(event, details = {}) {
  if (!isSpeechDiagnosticsEnabled()) return null;
  const envelope = loadEnvelope();
  const runtime = readRuntimeInfo();
  const entry = normalizeStoredEvent({
    schemaVersion: 1,
    traceId: envelope.traceId,
    relativeMs: Math.max(0, nowMs() - envelope.startedAtMs),
    isoTime: new Date().toISOString(),
    activity: details.activity || '',
    questionIndex: details.questionIndex,
    contextKey: details.contextKey || '',
    sessionId: details.sessionId || currentSessionId,
    attempt: details.attempt || 0,
    event,
    reason: details.reason || '',
    requestedContinuous: details.requestedContinuous,
    appliedContinuous: details.appliedContinuous,
    requestedInterim: details.requestedInterim,
    appliedInterim: details.appliedInterim,
    multiUtterance: details.multiUtterance,
    language: details.language || '',
    recognitionState: details.recognitionState || '',
    documentVisibility: runtime.documentVisibility,
    displayMode: runtime.displayMode,
    appVersion: runtime.appVersion,
    buildRevision: runtime.buildRevision,
    serviceWorkerScriptUrl: runtime.serviceWorkerScriptUrl,
    serviceWorkerControllerState: runtime.serviceWorkerControllerState,
    speechMode: details.speechMode || getSpeechDiagnosticMode(),
    resultIndex: details.resultIndex,
    resultsLength: details.resultsLength,
    finalResultCount: details.finalResultCount,
    interimResultCount: details.interimResultCount,
    alternativeCount: details.alternativeCount,
    nonEmptyTranscriptCount: details.nonEmptyTranscriptCount,
    totalCharacterCount: details.totalCharacterCount,
    nativeEndAcknowledged: details.nativeEndAcknowledged,
    retryBeforeOldOnend: details.retryBeforeOldOnend,
    probeId: details.probeId,
    probeElapsedMs: details.probeElapsedMs,
    errorCode: details.errorCode
  });
  if (!entry) return null;
  if (entry.sessionId) currentSessionId = entry.sessionId;
  envelope.events.push(entry);
  if (envelope.events.length > MAX_EVENTS) {
    envelope.events.splice(0, envelope.events.length - MAX_EVENTS);
  }
  persistEnvelope();
  notify();
  return { ...entry };
}

export function createSpeechDiagnosticSession(details = {}) {
  if (!isSpeechDiagnosticsEnabled()) return '';
  initializeSpeechDiagnostics();
  sessionSequence += 1;
  const sessionId = 'speech-' + nowMs().toString(36) + '-' + sessionSequence.toString(36);
  currentSessionId = sessionId;
  traceSpeechDiagnostic('session-create', { ...details, sessionId, attempt: 0 });
  return sessionId;
}

export function getSpeechDiagnosticSnapshot() {
  const runtime = readRuntimeInfo();
  const envelope = loadEnvelope();
  return {
    schemaVersion: 1,
    traceId: envelope.traceId,
    generatedAt: new Date().toISOString(),
    privacy: {
      remoteUpload: false,
      transcriptIncluded: false,
      audioIncluded: false,
      learnerIdentityIncluded: false,
      storage: 'bounded sessionStorage and memory only',
      maximumEvents: MAX_EVENTS
    },
    baseline: { ...BUNDLED_REFERENCE },
    runtime: {
      ...runtime,
      versionMatchesBaseline: runtime.appVersion === BUNDLED_REFERENCE.appVersion,
      buildMatchesBaseline: runtime.buildRevision === BUNDLED_REFERENCE.buildRevision
    },
    diagnostic: {
      enabled: isSpeechDiagnosticsEnabled(),
      speechMode: getSpeechDiagnosticMode(),
      currentSessionId,
      nativeProbe: getNativeSpeechProbeState()
    },
    events: envelope.events.map(event => ({ ...event }))
  };
}

export function clearSpeechDiagnosticTrace() {
  memoryEnvelope = createEnvelope();
  currentSessionId = '';
  persistEnvelope();
  notify();
}

export function subscribeSpeechDiagnostics(listener) {
  if (typeof listener !== 'function') return () => {};
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function downloadSnapshot(snapshot) {
  const browserWindow = getWindow();
  const browserDocument = getDocument();
  if (!browserWindow || !browserDocument || typeof Blob === 'undefined') return;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = browserWindow.URL?.createObjectURL?.(blob);
  if (!url) return;
  const link = browserDocument.createElement('a');
  link.href = url;
  link.download = 'jannati-speech-diagnostic-' + safeString(snapshot.traceId, 80) + '.json';
  link.click();
  browserWindow.setTimeout(() => browserWindow.URL?.revokeObjectURL?.(url), 0);
}

async function copySnapshot(snapshot) {
  const payload = JSON.stringify(snapshot, null, 2);
  const browserNavigator = getNavigator();
  if (typeof browserNavigator?.clipboard?.writeText === 'function') {
    await browserNavigator.clipboard.writeText(payload);
    return true;
  }
  const browserDocument = getDocument();
  if (!browserDocument) return false;
  const field = browserDocument.createElement('textarea');
  field.value = payload;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  browserDocument.body.appendChild(field);
  field.select();
  const copied = Boolean(browserDocument.execCommand?.('copy'));
  field.remove();
  return copied;
}

function mountPanel() {
  const browserDocument = getDocument();
  const browserWindow = getWindow();
  if (!browserDocument?.body || !browserWindow || browserDocument.getElementById(PANEL_ID)) return;

  const panel = browserDocument.createElement('details');
  panel.id = PANEL_ID;
  panel.open = true;
  Object.assign(panel.style, {
    position: 'fixed',
    right: '8px',
    bottom: '8px',
    width: 'min(92vw, 430px)',
    maxHeight: '70vh',
    overflow: 'auto',
    zIndex: '2147483647',
    padding: '10px',
    border: '2px solid #0f8a43',
    borderRadius: '10px',
    background: '#fff',
    color: '#10251a',
    boxShadow: '0 8px 24px rgba(0,0,0,.28)',
    font: '12px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace'
  });

  const summary = browserDocument.createElement('summary');
  summary.textContent = 'Speech diagnostic';
  summary.style.fontWeight = '700';

  const status = browserDocument.createElement('pre');
  status.style.whiteSpace = 'pre-wrap';
  status.style.margin = '8px 0';

  const controls = browserDocument.createElement('div');
  Object.assign(controls.style, { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' });

  const selector = browserDocument.createElement('select');
  ['current', 'single-interim', 'single-final', 'legacy-simple', 'native-probe'].forEach(mode => {
    const option = browserDocument.createElement('option');
    option.value = mode;
    option.textContent = mode;
    selector.appendChild(option);
  });
  selector.value = getSpeechDiagnosticMode();
  selector.addEventListener('change', () => {
    const url = new URL(browserWindow.location.href);
    url.searchParams.set('speechDiag', '1');
    url.searchParams.set('speechMode', selector.value);
    browserWindow.location.assign(url.toString());
  });

  const copyButton = browserDocument.createElement('button');
  copyButton.type = 'button';
  copyButton.textContent = 'Copy JSON';
  copyButton.addEventListener('click', async () => {
    const copied = await copySnapshot(getSpeechDiagnosticSnapshot());
    copyButton.textContent = copied ? 'Copied' : 'Copy failed';
    browserWindow.setTimeout(() => { copyButton.textContent = 'Copy JSON'; }, 1200);
  });

  const exportButton = browserDocument.createElement('button');
  exportButton.type = 'button';
  exportButton.textContent = 'Export JSON';
  exportButton.addEventListener('click', () => downloadSnapshot(getSpeechDiagnosticSnapshot()));

  const clearButton = browserDocument.createElement('button');
  clearButton.type = 'button';
  clearButton.textContent = 'Clear trace';
  clearButton.addEventListener('click', clearSpeechDiagnosticTrace);

  [selector, copyButton, exportButton, clearButton].forEach(control => {
    control.style.font = 'inherit';
    controls.appendChild(control);
  });

  let nativeProbeStatus = null;
  let startProbeButton = null;
  let stopProbeButton = null;
  let abortProbeButton = null;
  let nativeProbeControls = null;
  if (getSpeechDiagnosticMode() === 'native-probe') {
    nativeProbeControls = browserDocument.createElement('section');
    Object.assign(nativeProbeControls.style, {
      margin: '8px 0',
      padding: '8px',
      border: '1px solid #0f8a43',
      borderRadius: '8px',
      background: '#f2fff7'
    });

    const nativeProbeHeading = browserDocument.createElement('strong');
    nativeProbeHeading.textContent = 'Native Web Speech probe';

    const nativeProbeHelp = browserDocument.createElement('p');
    nativeProbeHelp.textContent = 'Direct metadata-only recognizer. No TTS, scoring, retry or transcript display.';
    nativeProbeHelp.style.margin = '6px 0';

    nativeProbeStatus = browserDocument.createElement('div');
    nativeProbeStatus.setAttribute('role', 'status');
    nativeProbeStatus.style.marginBottom = '6px';

    const nativeProbeButtons = browserDocument.createElement('div');
    Object.assign(nativeProbeButtons.style, { display: 'flex', flexWrap: 'wrap', gap: '6px' });

    startProbeButton = browserDocument.createElement('button');
    startProbeButton.type = 'button';
    startProbeButton.textContent = 'Start Native Probe';
    startProbeButton.addEventListener('click', startNativeSpeechProbe);

    stopProbeButton = browserDocument.createElement('button');
    stopProbeButton.type = 'button';
    stopProbeButton.textContent = 'Stop Probe';
    stopProbeButton.addEventListener('click', stopNativeSpeechProbe);

    abortProbeButton = browserDocument.createElement('button');
    abortProbeButton.type = 'button';
    abortProbeButton.textContent = 'Abort Probe';
    abortProbeButton.addEventListener('click', abortNativeSpeechProbe);

    [startProbeButton, stopProbeButton, abortProbeButton].forEach(control => {
      control.style.font = 'inherit';
      nativeProbeButtons.appendChild(control);
    });
    nativeProbeControls.append(
      nativeProbeHeading,
      nativeProbeHelp,
      nativeProbeStatus,
      nativeProbeButtons
    );
  }

  const events = browserDocument.createElement('ol');
  Object.assign(events.style, { margin: '0', paddingLeft: '22px' });

  panel.append(summary, status, controls);
  if (nativeProbeControls) panel.appendChild(nativeProbeControls);
  panel.appendChild(events);
  browserDocument.body.appendChild(panel);

  panelRender = () => {
    const snapshot = getSpeechDiagnosticSnapshot();
    const runtime = snapshot.runtime;
    const probeState = snapshot.diagnostic.nativeProbe;
    status.textContent = [
      'mode: ' + snapshot.diagnostic.speechMode,
      'runtime: v' + runtime.appVersion,
      'reference: bundled v' + snapshot.baseline.appVersion,
      'build: ' + runtime.buildRevision,
      'reference build: ' + snapshot.baseline.buildRevision,
      'session: ' + (snapshot.diagnostic.currentSessionId || 'none'),
      'display: ' + runtime.displayMode + ' / visibility: ' + runtime.documentVisibility,
      'service worker: ' + (runtime.serviceWorkerScriptUrl || 'none') + ' (' + runtime.serviceWorkerControllerState + ')',
      'privacy: metadata only; no transcript/audio/identity; no upload'
    ].join('\n');
    if (nativeProbeStatus) {
      nativeProbeStatus.textContent = 'Probe status: ' + probeState.status
        + ' / outcome: ' + probeState.outcome
        + ' / elapsed: ' + probeState.elapsedMs + 'ms';
      startProbeButton.disabled = probeState.active;
      stopProbeButton.disabled = !probeState.active;
      abortProbeButton.disabled = !probeState.active;
    }
    events.replaceChildren();
    snapshot.events.slice(-24).reverse().forEach(entry => {
      const item = browserDocument.createElement('li');
      const reason = entry.reason ? ' / ' + entry.reason : '';
      item.textContent = '+' + entry.relativeMs + 'ms a' + entry.attempt + ' ' + entry.event + reason;
      events.appendChild(item);
    });
  };
  panelRender();
}

export function initializeSpeechDiagnostics() {
  if (!isSpeechDiagnosticsEnabled()) return false;
  loadEnvelope();
  const browserDocument = getDocument();
  const browserWindow = getWindow();
  if (!browserDocument || !browserWindow) return true;

  if (!initialized) {
    initialized = true;
    browserDocument.addEventListener('visibilitychange', () => {
      traceSpeechDiagnostic('visibility-change', {
        sessionId: currentSessionId,
        reason: browserDocument.visibilityState || 'unknown',
        recognitionState: 'document'
      });
    });
    browserWindow.addEventListener('pagehide', event => {
      traceSpeechDiagnostic('component-unmount', {
        sessionId: currentSessionId,
        reason: event?.persisted ? 'pagehide-bfcache' : 'pagehide',
        recognitionState: 'page'
      });
    });
  }

  if (browserDocument.readyState === 'loading') {
    browserDocument.addEventListener('DOMContentLoaded', mountPanel, { once: true });
  } else {
    queueMicrotask(mountPanel);
  }

  browserWindow.__JANNATI_SPEECH_DIAGNOSTICS__ = Object.freeze({
    snapshot: getSpeechDiagnosticSnapshot,
    clear: clearSpeechDiagnosticTrace,
    enabled: true
  });
  return true;
}

export const SPEECH_DIAGNOSTIC_BASELINE = BUNDLED_REFERENCE;
export const SPEECH_DIAGNOSTIC_REFERENCE = BUNDLED_REFERENCE;
export const SPEECH_DIAGNOSTIC_MAX_EVENTS = MAX_EVENTS;

export default {
  clearSpeechDiagnosticTrace,
  abortNativeSpeechProbe,
  createSpeechDiagnosticSession,
  createSpeechResultMetadata,
  getSpeechDiagnosticMode,
  getSpeechDiagnosticSnapshot,
  getNativeSpeechProbeState,
  initializeSpeechDiagnostics,
  isSpeechDiagnosticsEnabled,
  resolveSpeechDiagnosticCaptureMode,
  startNativeSpeechProbe,
  stopNativeSpeechProbe,
  subscribeSpeechDiagnostics,
  traceSpeechDiagnostic
};
