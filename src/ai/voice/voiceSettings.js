import { LANGUAGE_CONFIG } from './voiceConfig.js';

export const VOICE_DEFAULTS = {
  lang: LANGUAGE_CONFIG.ms.locale,
  rate: LANGUAGE_CONFIG.ms.rate,
  pitch: LANGUAGE_CONFIG.ms.pitch,
  volume: LANGUAGE_CONFIG.ms.volume
};

export default VOICE_DEFAULTS;
