const APPROVAL_ID = 'P2.2-PR2-AUTHORED-EXAMPLES-2026-10-27';
const APPROVAL_SOURCE = 'authored-allowlist';

const freezeEntry = examples => Object.freeze({
  approvalId: APPROVAL_ID,
  source: APPROVAL_SOURCE,
  status: 'approved-for-adaptive-teaching',
  examples: Object.freeze(examples)
});

// This deliberately small allowlist is the auditable approval boundary for
// fourth-turn teaching examples. Loading a knowledge pack does not approve it.
export const APPROVED_TEACHING_EXAMPLES = Object.freeze({
  'bm::kata_nama': freezeEntry(['doktor', 'sekolah']),
  'bm::kata_nama_am': freezeEntry(['doktor', 'sekolah']),
  'english::nouns': freezeEntry(['doctor', 'school']),
  'arab::mufradat': freezeEntry([
    'Baca contoh كِتَابٌ satu demi satu.',
    'Dengar bunyi مَدْرَسَةٌ dengan teliti.'
  ])
});

function clean(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function keyFor(subjectId = '', topicId = '') {
  const subject = clean(subjectId).toLocaleLowerCase('en-US') === 'arabic'
    ? 'arab'
    : clean(subjectId).toLocaleLowerCase('en-US');
  return `${subject}::${clean(topicId).toLocaleLowerCase('en-US')}`;
}

export function selectApprovedTeachingExamples({ subjectId = '', topicId = '', candidates = [] } = {}) {
  const approval = APPROVED_TEACHING_EXAMPLES[keyFor(subjectId, topicId)];
  if (!approval || approval.status !== 'approved-for-adaptive-teaching') {
    return { examples: [], provenance: null };
  }

  const approved = new Set(approval.examples.map(clean));
  const seen = new Set();
  const examples = [];
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const value = clean(candidate);
    if (!value || !approved.has(value) || seen.has(value)) continue;
    seen.add(value);
    examples.push(value);
  }

  return {
    examples,
    provenance: examples.length
      ? {
          approvalId: approval.approvalId,
          source: approval.source,
          status: approval.status
        }
      : null
  };
}

export default {
  APPROVED_TEACHING_EXAMPLES,
  selectApprovedTeachingExamples
};
