export class SharedNativeOwnerSpeechRecognition {
  static instances = [];
  static ownerState = 'idle';
  static ownerInstance = null;
  static releaseDelayMs = 500;

  static reset({ releaseDelayMs = 500 } = {}) {
    SharedNativeOwnerSpeechRecognition.instances = [];
    SharedNativeOwnerSpeechRecognition.ownerState = 'idle';
    SharedNativeOwnerSpeechRecognition.ownerInstance = null;
    SharedNativeOwnerSpeechRecognition.releaseDelayMs = releaseDelayMs;
  }

  constructor() {
    this.lang = '';
    this.interimResults = false;
    this.continuous = false;
    this.maxAlternatives = 0;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    this.hasCapture = false;
    this.stalledDuringRelease = false;
    SharedNativeOwnerSpeechRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.onstart?.();
    if (SharedNativeOwnerSpeechRecognition.ownerState === 'idle') {
      SharedNativeOwnerSpeechRecognition.ownerState = 'active';
      SharedNativeOwnerSpeechRecognition.ownerInstance = this;
      this.hasCapture = true;
      this.onaudiostart?.();
      return;
    }
    if (SharedNativeOwnerSpeechRecognition.ownerState === 'releasing') {
      this.stalledDuringRelease = true;
    }
  }

  stop() {
    this.stopCalls += 1;
    if (SharedNativeOwnerSpeechRecognition.ownerInstance !== this) return;
    SharedNativeOwnerSpeechRecognition.ownerState = 'idle';
    SharedNativeOwnerSpeechRecognition.ownerInstance = null;
    this.onaudioend?.();
    this.onend?.();
  }

  abort() {
    this.abortCalls += 1;
    SharedNativeOwnerSpeechRecognition.ownerState = 'releasing';
    const releasingInstance = this;
    setTimeout(() => {
      if (
        SharedNativeOwnerSpeechRecognition.ownerState === 'releasing'
        && SharedNativeOwnerSpeechRecognition.ownerInstance === releasingInstance
      ) {
        SharedNativeOwnerSpeechRecognition.ownerState = 'idle';
        SharedNativeOwnerSpeechRecognition.ownerInstance = null;
      } else if (SharedNativeOwnerSpeechRecognition.ownerState === 'releasing') {
        SharedNativeOwnerSpeechRecognition.ownerState = 'idle';
      }
      releasingInstance.onaudioend?.();
      releasingInstance.onend?.();
    }, SharedNativeOwnerSpeechRecognition.releaseDelayMs);
  }

  emitSoundStart() {
    if (!this.hasCapture || SharedNativeOwnerSpeechRecognition.ownerInstance !== this) return;
    this.onsoundstart?.();
  }

  emitSpeechStart() {
    if (!this.hasCapture || SharedNativeOwnerSpeechRecognition.ownerInstance !== this) return;
    this.onspeechstart?.();
  }

  emitResult(transcript, { isFinal = true, confidence = 0.9 } = {}) {
    if (!this.hasCapture || SharedNativeOwnerSpeechRecognition.ownerInstance !== this) return;
    const result = [{ transcript, confidence }];
    result.isFinal = isFinal;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }

  emitEnd() {
    if (SharedNativeOwnerSpeechRecognition.ownerInstance === this) {
      this.onspeechend?.();
      this.onsoundend?.();
      this.onaudioend?.();
      SharedNativeOwnerSpeechRecognition.ownerState = 'idle';
      SharedNativeOwnerSpeechRecognition.ownerInstance = null;
    }
    this.onend?.();
  }
}

export function createMemorySessionStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}
