import { SUBJECT_LANGUAGE_MAP } from './voiceConfig.js';

const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u;
const LATIN_LETTER_PATTERN = /[A-Za-z\u00c0-\u024f]/u;

export function normalizeVoiceLanguage(value = '') {
  const normalized = String(value || '').trim().toLowerCase().replaceAll('_', '-');
  if (!normalized) return '';
  if (normalized === 'bm' || normalized === 'malay' || normalized.includes('bahasa melayu') || normalized.startsWith('ms')) return 'ms';
  if (normalized === 'bi' || normalized === 'english' || normalized.startsWith('en')) return 'en';
  if (normalized === 'arab' || normalized === 'arabic' || normalized.includes('bahasa arab') || normalized.startsWith('ar')) return 'ar';
  return '';
}

export function detectArabicScript(text = '') {
  return ARABIC_SCRIPT_PATTERN.test(String(text || ''));
}

export function detectLatinScript(text = '') {
  return LATIN_LETTER_PATTERN.test(String(text || ''));
}

function languageFromSubject(value) {
  if (value && typeof value === 'object') {
    return languageFromSubject(value.id || value.subjectId || value.slug || value.title);
  }
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (SUBJECT_LANGUAGE_MAP[normalized]) return SUBJECT_LANGUAGE_MAP[normalized];
  if (normalized.includes('english')) return 'en';
  if (normalized.includes('bahasa arab') || normalized === 'arab') return 'ar';
  if (normalized.includes('bahasa melayu')) return 'ms';
  return '';
}

function firstExplicitLanguage(options = {}) {
  const contexts = [
    options,
    options.context,
    options.metadata,
    options.content,
    options.lesson,
    options.question
  ].filter(Boolean);

  for (const context of contexts) {
    const language = normalizeVoiceLanguage(context.language || context.lang || context.sourceLanguage || context.speechLang);
    if (language) return language;
  }

  for (const context of contexts) {
    const language = languageFromSubject(context.subjectId || context.subject);
    if (language) return language;
  }
  return '';
}

export function resolveVoiceLanguage(text = '', options = {}) {
  const explicitLanguage = firstExplicitLanguage(options);
  if (explicitLanguage) return explicitLanguage;
  if (detectArabicScript(text) && !detectLatinScript(text)) return 'ar';
  return 'ms';
}

function characterLanguage(character, baseLanguage) {
  if (ARABIC_SCRIPT_PATTERN.test(character)) return 'ar';
  if (LATIN_LETTER_PATTERN.test(character)) return baseLanguage;
  return '';
}

export function segmentMixedLanguageText(text = '', baseLanguage = 'ms') {
  const value = String(text || '');
  if (!value) return [];
  const normalizedBase = normalizeVoiceLanguage(baseLanguage) || 'ms';
  const segments = [];
  let activeLanguage = normalizedBase;
  let buffer = '';

  for (const character of value) {
    const detectedLanguage = characterLanguage(character, normalizedBase);
    if (detectedLanguage && detectedLanguage !== activeLanguage) {
      if (buffer) segments.push({ text: buffer, language: activeLanguage });
      buffer = character;
      activeLanguage = detectedLanguage;
    } else {
      buffer += character;
    }
  }
  if (buffer) segments.push({ text: buffer, language: activeLanguage });

  return segments.filter(segment => segment.text.trim());
}

export default {
  normalizeVoiceLanguage,
  detectArabicScript,
  detectLatinScript,
  resolveVoiceLanguage,
  segmentMixedLanguageText
};
