const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3'];

const PRIORITY_LABELS = {
  P0: 'Blocking',
  P1: 'High impact',
  P2: 'Improvement',
  P3: 'Cosmetic'
};

const ISSUE_BASE_IMPACT = {
  no_correct_answer: 100,
  answer_not_matching_options: 100,
  empty_question_text: 100,
  missing_instruction: 70,
  ambiguous_operation: 70,
  multiple_possible_answers: 70,
  translation_mismatch: 70,
  missing_arabic_text: 70,
  pronunciation_hint_missing: 70,
  repeated_answer_pattern: 40,
  same_answer_pattern_repeated: 40,
  template_repetition: 40,
  same_wording_template_too_frequent: 40,
  missing_examples: 40,
  weak_explanation: 40,
  wording_improvement: 10,
  sentence_variation: 10,
  formatting: 10
};

const ISSUE_PRIORITY = {
  no_correct_answer: 'P0',
  answer_not_matching_options: 'P0',
  empty_question_text: 'P0',
  missing_instruction: 'P1',
  ambiguous_operation: 'P1',
  multiple_possible_answers: 'P1',
  translation_mismatch: 'P1',
  missing_arabic_text: 'P1',
  pronunciation_hint_missing: 'P1',
  repeated_answer_pattern: 'P2',
  same_answer_pattern_repeated: 'P2',
  template_repetition: 'P2',
  same_wording_template_too_frequent: 'P2',
  missing_examples: 'P2',
  weak_explanation: 'P2',
  wording_improvement: 'P3',
  sentence_variation: 'P3',
  formatting: 'P3'
};

const SUBJECT_WEIGHTS = {
  arab: 20,
  math: 20
};

function normalizeIssueType(issueType = '') {
  return String(issueType || '').trim();
}

function normalizeSeverity(severity = '') {
  return String(severity || 'Low').trim() || 'Low';
}

function getPriorityForIssue(issueType = '', severity = '') {
  const normalized = normalizeIssueType(issueType);
  if (normalized in ISSUE_PRIORITY) return ISSUE_PRIORITY[normalized];
  if (normalizeSeverity(severity) === 'Critical') return 'P0';
  if (normalizeSeverity(severity) === 'High') return 'P1';
  if (normalizeSeverity(severity) === 'Medium') return 'P2';
  return 'P3';
}

function getBaseImpact(issueType = '', severity = '') {
  const normalized = normalizeIssueType(issueType);
  if (normalized in ISSUE_BASE_IMPACT) return ISSUE_BASE_IMPACT[normalized];
  if (normalizeSeverity(severity) === 'Critical') return 100;
  if (normalizeSeverity(severity) === 'High') return 70;
  if (normalizeSeverity(severity) === 'Medium') return 40;
  return 10;
}

function getSubjectWeight(subject = '') {
  const normalized = String(subject || '').trim().toLowerCase();
  return SUBJECT_WEIGHTS[normalized] || 0;
}

function getPriorityLabel(priority = '') {
  return PRIORITY_LABELS[String(priority || '').trim()] || 'Cosmetic';
}

function calculateImpactScore(item = {}) {
  let score = getBaseImpact(item.issueType, item.severity);
  const issueType = normalizeIssueType(item.issueType);
  const subject = String(item.subject || '').trim().toLowerCase();

  if (subject === 'arab' && /translation_mismatch|missing_arabic_text|pronunciation_hint_missing/.test(issueType)) {
    score += 20;
  }
  if (subject === 'math' && /ambiguous_operation|missing_unit/.test(issueType)) {
    score += 20;
  }
  if (/same_answer_pattern_repeated|repeated_answer_pattern/.test(issueType)) {
    score += 15;
  }
  if (/multiple_possible_answers/.test(issueType)) {
    score += 25;
  }
  if (/missing_instruction/.test(issueType)) {
    score += 20;
  }

  score += getSubjectWeight(subject);
  return Math.min(100, Math.max(0, Math.round(score)));
}

export {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  calculateImpactScore,
  getBaseImpact,
  getPriorityForIssue,
  getPriorityLabel,
  getSubjectWeight,
  normalizeIssueType,
  normalizeSeverity
};

export default {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  calculateImpactScore,
  getBaseImpact,
  getPriorityForIssue,
  getPriorityLabel,
  getSubjectWeight,
  normalizeIssueType,
  normalizeSeverity
};
