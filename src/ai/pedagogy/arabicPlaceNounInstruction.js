// A strictly bounded recognizer for visible Year 2 Arabic *place-noun*
// instructions. This is not a general-purpose Arabic intent or answer parser.
// The whole instruction must match a positive, authored teaching pattern.
const POSITIVE_PLACE_INSTRUCTION = /^(?:(?:اختر|حدد|عين)\s+اسم\s+(?:ال)?مكان|ضع\s+دائره\s+حول\s+اسم\s+(?:ال)?مكان|(?:اختر|حدد)\s+الكلمه\s+التي\s+تدل\s+على\s+مكان|اي\s+كلمه\s+تدل\s+على\s+مكان)$/u;

export function isArabicPlaceNounInstruction(value = '') {
  if (typeof value !== 'string' || !value || value.length > 200) return false;
  const normalized = value.normalize('NFKD')
    .replace(/[\u064b-\u065f\u0670\u0640]/gu, '')
    .normalize('NFKC')
    .replace(/ة/gu, 'ه')
    .replace(/\s+/gu, ' ')
    .replace(/[.!?؟]+$/u, '')
    .trim();
  return POSITIVE_PLACE_INSTRUCTION.test(normalized);
}
