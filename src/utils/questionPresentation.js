const INSTRUCTION_PREFIX_PATTERN = /\b(?:baca|perhatikan|kenal pasti|tentukan|lengkapkan|pilih|tukarkan|nyatakan|isi|berdasarkan|situasi|dialog|petikan|soalan|aplikasi|analisis|penilaian|kbat)\b/i;

function splitSentences(value = '') {
  return String(value || '')
    .match(/.*?[.!?](?:["'\u2019\u201D)]?)(?=\s|$)|.+$/gu)
    ?.map(part => part.trim())
    .filter(Boolean) || [];
}

export function splitQuestionPresentationLines(text = '') {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!value) return [];

  const labelMatch = value.match(/^(\s*[^:]{1,48}):\s*(.+)$/);
  if (labelMatch && INSTRUCTION_PREFIX_PATTERN.test(labelMatch[1]) && !/\d$/.test(labelMatch[1].trim())) {
    const contentLines = splitSentences(labelMatch[2]);
    return [`${labelMatch[1].trim()}:`, ...(contentLines.length ? contentLines : [labelMatch[2].trim()])];
  }

  const sentenceLines = splitSentences(value);
  if (value.length >= 64 && sentenceLines.length > 1) return sentenceLines;
  return [value];
}

export default { splitQuestionPresentationLines };
