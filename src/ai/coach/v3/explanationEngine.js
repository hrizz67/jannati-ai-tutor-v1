import { getSubjectStrategy } from './subjectStrategies.js';

function toTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === null || value === undefined || value === '') return [];
  return [String(value)];
}

export function buildExplanation({ subjectId, topicId, knowledgePack = null, context = {} } = {}) {
  const strategy = getSubjectStrategy(subjectId);
  const source = knowledgePack || {};
  const explanations = toTextList(source.teacherExplanation);
  const simpleExplanation = String(source.simpleExplanation || source.explanation || '');
  const examples = [
    ...toTextList(source.examples),
    ...toTextList(source.extraExamples)
  ];
  const responseFocus = context.correct
    ? strategy.explanationLead
    : strategy.hintLead;

  const questionText = String(context.questionText || '').trim();
  const expectedAnswer = String(context.expectedAnswer || '').trim();
  const topicKey = `${subjectId} ${topicId}`.toLowerCase();
  const pronounAnswer = subjectId === 'bm' && /kata[_ ]ganti[_ ]nama/.test(topicKey)
    ? (expectedAnswer.match(/\b(saya|kami|kita|awak|kamu|dia|beliau|mereka|anda|aku)\b/i)?.[1] || '').toLowerCase()
    : '';
  const pronounReason = {
    saya: '“Saya” digunakan apabila seorang penutur bercakap tentang diri sendiri.',
    kami: '“Kami” digunakan apabila Amir dan Faris bercakap tentang diri mereka tanpa memasukkan pendengar.',
    kita: '“Kita” digunakan apabila penutur bercakap tentang diri sendiri bersama pendengar.',
    kamu: '“Kamu” digunakan apabila penutur bercakap terus kepada seorang pendengar.',
    awak: '“Awak” digunakan apabila penutur bercakap terus kepada seorang pendengar.',
    dia: '“Dia” digunakan untuk seorang yang sedang dibicarakan.',
    beliau: '“Beliau” digunakan dengan sopan untuk seorang yang dihormati.',
    mereka: '“Mereka” digunakan untuk beberapa orang yang sedang dibicarakan.',
    anda: '“Anda” digunakan apabila penutur bercakap kepada seorang secara sopan.',
    aku: '“Aku” digunakan apabila seorang penutur bercakap tentang diri sendiri dalam situasi tidak rasmi.'
  }[pronounAnswer];
  const subjectFocus = subjectId === 'math' && questionText
    ? ` Soalan semasa menggunakan nombor dan operasi ini: ${questionText}${expectedAnswer ? ` Jawapan perlu disemak dengan ${expectedAnswer}.` : ''}`
    : subjectId === 'sains' && questionText
      ? ` Perhatikan konsep sains dalam soalan semasa: ${questionText}`
      : subjectId === 'arab' && questionText
        ? ` Kekalkan tulisan dan bunyi Arab daripada soalan ini: ${questionText}`
        : subjectId === 'english' && questionText
          ? ` Gunakan perkataan atau ayat Inggeris dalam soalan ini: ${questionText}`
          : '';
  const contextualPronounExplanation = pronounReason
    ? `Kata ganti nama diri yang betul ialah “${pronounAnswer.charAt(0).toUpperCase()}${pronounAnswer.slice(1)}” kerana ${pronounReason.replace(/^“[^”]+”\s+digunakan apabila /, '').replace(/^“[^”]+”\s+digunakan untuk /, '').replace(/^“[^”]+”\s+digunakan dengan sopan untuk /, '').replace(/^“[^”]+”\s+digunakan apabila /, '')}`
    : '';
  const explanation = contextualPronounExplanation || simpleExplanation || explanations[0] || responseFocus;
  const contextualExplanation = `${explanation}${subjectFocus}`.trim();
  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    subjectLabel: strategy.label,
    explanation: contextualExplanation,
    simpleExplanation: `${contextualPronounExplanation || simpleExplanation || explanations[0] || responseFocus}${subjectFocus}`.trim(),
    whyCorrect: contextualPronounExplanation || '',
    examples: examples.slice(0, 5),
    learningStep: subjectId === 'math' && questionText
      ? `Tulis semula ${questionText} dan kira satu langkah pada satu masa.`
      : context.correct
        ? 'Ulang konsep utama dan semak ketepatan jawapan.'
        : 'Pecahkan soalan kepada bahagian kecil dan semak petunjuk.',
    subjectVoice: responseFocus
  };
}

export default {
  buildExplanation
};
