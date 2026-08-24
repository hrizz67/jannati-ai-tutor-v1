export const TUTOR_GATEWAY_LIMITS = Object.freeze({
  message: 700,
  historyItems: 6,
  historyText: 500,
  contextText: 900,
  optionText: 160,
  options: 6,
  responseText: 1400,
  quickReplyText: 90,
  quickReplies: 3
});

const PERSONAL_DATA_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  /\b(?:\+?6?01\d[-\s]?\d{3,4}[-\s]?\d{4}|\d{6}[-\s]?\d{2}[-\s]?\d{4})\b/u,
  /\b(?:nama\s+penuh|nama\s+saya|alamat\s+saya|sekolah\s+saya|nombor\s+telefon|no\.?\s*telefon|kad\s+pengenalan|kata\s+laluan|password|otp|pin\s+saya)\b/iu,
  /\b(?:my\s+full\s+name|my\s+address|my\s+school|phone\s+number|identity\s+card|passport\s+number|my\s+password)\b/iu
];

const HIGH_RISK_PATTERNS = Object.freeze({
  self_harm: /\b(?:bunuh\s+diri|cedera(?:kan)?\s+diri|tak\s+nak\s+hidup|mahu\s+mati|nak\s+mati|suicid(?:e|al)|self[-\s]?harm|kill\s+myself)\b/iu,
  exploitation: /\b(?:seks|bogel|telanjang|porn|lucah|sexual|nude|sentuh\s+bahagian\s+sulit)\b/iu,
  dangerous: /\b(?:buat\s+bom|buat\s+senjata|racun\s+orang|bunuh\s+orang|make\s+a\s+bomb|make\s+a\s+weapon|poison\s+someone)\b/iu
});

export function cleanTutorGatewayText(value = '', maxLength = TUTOR_GATEWAY_LIMITS.contextText) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, Math.max(0, Number(maxLength) || 0));
}

export function containsPotentialPersonalData(value = '') {
  const text = cleanTutorGatewayText(value, 4000);
  return Boolean(text && PERSONAL_DATA_PATTERNS.some(pattern => pattern.test(text)));
}

export function detectTutorSafetyRisk(value = '') {
  const text = cleanTutorGatewayText(value, 4000);
  return Object.entries(HIGH_RISK_PATTERNS).find(([, pattern]) => pattern.test(text))?.[0] || '';
}

export function buildTutorSafetyResponse(risk = '') {
  if (risk === 'self_harm') {
    return {
      text: 'Saya sangat risau tentang keselamatan kamu. Beritahu ibu bapa, penjaga, guru atau orang dewasa yang dipercayai sekarang. Jika kamu dalam bahaya segera, hubungi perkhidmatan kecemasan tempatan bersama orang dewasa.',
      quickReplies: ['Saya akan beritahu orang dewasa', 'Panggil ibu atau ayah', 'Beritahu guru sekarang'],
      needsAdultHelp: true
    };
  }
  return {
    text: 'Saya tidak boleh membantu dengan perkara itu. Sila berhenti dan beritahu ibu bapa, penjaga atau guru yang dipercayai supaya mereka boleh membantu kamu dengan selamat.',
    quickReplies: ['Beritahu ibu atau ayah', 'Beritahu guru', 'Kembali kepada pelajaran'],
    needsAdultHelp: true
  };
}

function sanitizeHistory(value = []) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-TUTOR_GATEWAY_LIMITS.historyItems)
    .map(item => ({
      role: item?.role === 'ai' || item?.role === 'assistant' ? 'assistant' : 'user',
      text: cleanTutorGatewayText(item?.text, TUTOR_GATEWAY_LIMITS.historyText)
    }))
    .filter(item => item.text);
}

export function sanitizeTutorGatewayPayload(value = {}) {
  const message = cleanTutorGatewayText(value?.message, TUTOR_GATEWAY_LIMITS.message);
  if (!message) return null;
  const context = value?.context && typeof value.context === 'object' ? value.context : {};
  const history = sanitizeHistory(value?.history);
  if (history.at(-1)?.role === 'user' && history.at(-1)?.text.toLocaleLowerCase() === message.toLocaleLowerCase()) history.pop();
  const payload = {
    message,
    intent: cleanTutorGatewayText(value?.intent, 60) || 'knowledge_question',
    locale: cleanTutorGatewayText(value?.locale, 20) || 'ms-MY',
    yearLevel: 'Tahun 2',
    context: {
      subjectId: cleanTutorGatewayText(context.subjectId, 60),
      subjectTitle: cleanTutorGatewayText(context.subjectTitle, 120),
      topicId: cleanTutorGatewayText(context.topicId, 80),
      topicTitle: cleanTutorGatewayText(context.topicTitle, 160),
      topicNote: cleanTutorGatewayText(context.topicNote, TUTOR_GATEWAY_LIMITS.contextText),
      questionText: cleanTutorGatewayText(context.questionText, TUTOR_GATEWAY_LIMITS.contextText),
      instruction: cleanTutorGatewayText(context.instruction, 500),
      options: (Array.isArray(context.options) ? context.options : [])
        .slice(0, TUTOR_GATEWAY_LIMITS.options)
        .map(item => cleanTutorGatewayText(item, TUTOR_GATEWAY_LIMITS.optionText))
        .filter(Boolean),
      supportStage: cleanTutorGatewayText(context.supportStage, 60),
      localGuidance: cleanTutorGatewayText(context.localGuidance, TUTOR_GATEWAY_LIMITS.contextText)
    },
    history
  };
  const combinedUserText = [payload.message, ...history.filter(item => item.role === 'user').map(item => item.text)].join(' ');
  if (containsPotentialPersonalData(combinedUserText)) return null;
  return payload;
}

export function sanitizeTutorModelOutput(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const text = cleanTutorGatewayText(value.text, TUTOR_GATEWAY_LIMITS.responseText)
    .replace(/https?:\/\/\S+/giu, '')
    .trim();
  if (!text || containsPotentialPersonalData(text) || detectTutorSafetyRisk(text)) return null;
  return {
    text,
    quickReplies: (Array.isArray(value.quickReplies) ? value.quickReplies : [])
      .slice(0, TUTOR_GATEWAY_LIMITS.quickReplies)
      .map(item => cleanTutorGatewayText(item, TUTOR_GATEWAY_LIMITS.quickReplyText))
      .filter(Boolean),
    intent: cleanTutorGatewayText(value.intent, 60) || 'knowledge_question',
    confidence: Math.max(0, Math.min(100, Number(value.confidence) || 0)),
    canAnswerSafely: value.canAnswerSafely === true,
    needsAdultHelp: value.needsAdultHelp === true
  };
}

export function extractOpenAIOutputText(response = {}) {
  for (const item of Array.isArray(response?.output) ? response.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === 'refusal') return '';
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

export function buildOpenAITutorRequest(payload, model, safetyIdentifier = '') {
  const request = {
    model,
    store: false,
    max_output_tokens: 650,
    instructions: [
      'Anda ialah Guru AI Tahun 2 untuk murid berumur sekitar 7 hingga 8 tahun di Malaysia.',
      'Jawab dalam bahasa yang mudah, mesra, tepat dan sesuai umur. Mengajar dahulu, bukan sekadar memberi jawapan.',
      'Gunakan konteks kurikulum jika relevan. Jika maklumat tidak cukup, nyatakan dengan jujur dan tanya satu soalan penjelasan.',
      'Jangan minta atau ulang nama penuh, alamat, sekolah, nombor telefon, kata laluan atau maklumat peribadi.',
      'Jangan dedahkan jawapan latihan jika supportStage menunjukkan petunjuk atau bimbingan awal.',
      'Akhiri dengan satu soalan semakan kefahaman atau balasan pantas yang membantu komunikasi dua hala.',
      'Jangan berikan pautan web, iklan atau arahan yang tidak berkaitan dengan pembelajaran Tahun 2.'
    ].join(' '),
    input: [{ role: 'user', content: JSON.stringify(payload) }],
    text: {
      format: {
        type: 'json_schema',
        name: 'jannati_tutor_response',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            quickReplies: { type: 'array', items: { type: 'string' } },
            intent: { type: 'string' },
            confidence: { type: 'number' },
            canAnswerSafely: { type: 'boolean' },
            needsAdultHelp: { type: 'boolean' }
          },
          required: ['text', 'quickReplies', 'intent', 'confidence', 'canAnswerSafely', 'needsAdultHelp'],
          additionalProperties: false
        }
      }
    }
  };
  const safeIdentifier = cleanTutorGatewayText(safetyIdentifier, 80);
  if (safeIdentifier) request.safety_identifier = safeIdentifier;
  return request;
}
