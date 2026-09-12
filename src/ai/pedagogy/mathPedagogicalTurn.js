import { isAcceptedQuestionAnswer } from '../../utils/acceptedAnswers.js';
import { getAnswerRevealPolicy, selectAnswerSafeText } from '../policy/answerRevealPolicy.js';

const START_INTENTS = new Set([
  'hint',
  'question_help',
  'wrong_answer_coaching',
  'misunderstanding',
  'alternative_explanation'
]);

const CURRENT_STEP_SUPPORT_INTENTS = new Set([
  'hint',
  'question_help',
  'wrong_answer_coaching',
  'misunderstanding',
  'clarification_needed',
  'why_question',
  'how_question',
  'alternative_explanation',
  'example_request'
]);

const SMALL_NUMBER_WORDS = Object.freeze([
  'kosong', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'lapan', 'sembilan',
  'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas',
  'tujuh belas', 'lapan belas', 'sembilan belas'
]);

function clean(value = '') {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function comparable(value = '') {
  return clean(value)
    .toLocaleLowerCase('ms-MY')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function numberWord(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 99) return '';
  if (number < SMALL_NUMBER_WORDS.length) return SMALL_NUMBER_WORDS[number];
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  return `${SMALL_NUMBER_WORDS[tens]} puluh${ones ? ` ${SMALL_NUMBER_WORDS[ones]}` : ''}`;
}

function unique(values = []) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

const QUICK_ACTION_ROUTES = Object.freeze({
  'beri petunjuk': ['give_hint', 'hint'],
  'beri saya petunjuk': ['give_hint', 'hint'],
  'terangkan soalan ini': ['explain_current_question', 'question_help'],
  'beri contoh mudah': ['give_analogous_example', 'example_request'],
  'beri contoh lain': ['give_analogous_example', 'example_request'],
  'bimbing saya membandingkan': ['compare_example', 'question_help'],
  'saya mahu cuba': ['try_current_step', 'question_help'],
  'saya mahu cuba lagi': ['try_current_step', 'question_help'],
  'cuba lagi': ['try_current_step', 'question_help'],
  'terangkan langkah ini': ['explain_current_step', 'question_help'],
  'terangkan lebih mudah': ['explain_current_step', 'question_help'],
  'saya tak faham': ['dont_understand_current_step', 'question_help'],
  'kenapa langkah ini': ['why_current_step', 'question_help'],
  'kenal pasti nombor yang hendak ditambah': ['identify_operands', 'question_help'],
  'tambah sa dahulu kemudian puluh dan ratus': ['explain_place_value_method', 'question_help'],
  'semak jumlah akhir mengikut tempat nilai': ['check_final_by_place_value', 'question_help'],
  'ulang cara': ['restart_guided_method', 'question_help'],
  'kembali ke soalan': ['return_to_original_question', 'question_help']
});

function buildQuickActions(labels = [], context = {}) {
  return labels.map(label => {
    const route = QUICK_ACTION_ROUTES[comparable(label)] || ['continue_current_question', 'question_help'];
    return {
      actionId: route[0],
      label,
      intent: route[1],
      source: 'tutor_quick_action',
      conversationKey: context.conversationKey,
      questionId: context.parentQuestionId,
      subjectId: context.subjectId,
      topicId: context.topicId
    };
  });
}

function numberAnswers(value, unit = '') {
  const digit = String(value);
  const word = numberWord(value);
  return unique([
    digit,
    word,
    unit ? `${digit} ${unit}` : '',
    unit && word ? `${word} ${unit}` : ''
  ]);
}

function placeBreakdownAnswers(tens, ones) {
  const tensWord = numberWord(tens);
  const onesWord = numberWord(ones);
  return unique([
    `${tens} puluh dan ${ones} sa`,
    `${tens} puluh ${ones} sa`,
    `${tens} puluh dan ${ones} unit`,
    `${tens} puluh ${ones} unit`,
    `${tensWord} puluh dan ${onesWord} sa`,
    `${tensWord} puluh ${onesWord} sa`,
    `${tensWord} puluh dan ${onesWord} unit`
  ]);
}

function getQuestionText(question = {}, explicit = '') {
  return clean(
    explicit ||
    question?.q ||
    question?.question ||
    question?.stem ||
    question?.text ||
    question?.prompt ||
    ''
  );
}

function getParentQuestionId(question = {}, questionText = '') {
  return clean(question?.id || question?.questionId || questionText);
}

function strictNumericAnswer(expectedAnswer = '', acceptedAnswers = []) {
  return [expectedAnswer, ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : [])]
    .map(clean)
    .find(value => /^-?\d+$/.test(value)) || '';
}

function makeStep({ concept, intro = '', ask, expectedAnswers, retryHint, strongHint, simpleHelp, why }) {
  return {
    concept,
    intro: clean(intro),
    ask: clean(ask),
    expectedAnswers: unique(expectedAnswers),
    retryHint: clean(retryHint),
    strongHint: clean(strongHint),
    simpleHelp: clean(simpleHelp),
    why: clean(why)
  };
}

function buildAdditionPlan(left, right) {
  const leftTens = Math.floor(left / 10);
  const rightTens = Math.floor(right / 10);
  const leftOnes = left % 10;
  const rightOnes = right % 10;
  const onesTotal = leftOnes + rightOnes;
  const carry = Math.floor(onesTotal / 10);
  const onesDigit = onesTotal % 10;
  const tensTotal = leftTens + rightTens + carry;
  const steps = [makeStep({
    concept: 'addition_ones',
    intro: 'Jom buat satu langkah dahulu.',
    ask: `Berapa ${leftOnes} + ${rightOnes}?`,
    expectedAnswers: numberAnswers(onesTotal),
    retryHint: `Mulakan dengan ${rightOnes}, kemudian kira ke hadapan sebanyak ${leftOnes} langkah. Cuba lagi.`,
    strongHint: `${rightOnes} ditambah satu demi satu sebanyak ${leftOnes} kali membawa kita kepada ${onesTotal}. Cuba sebut jawapan langkah ini.`,
    simpleHelp: `Kita sedang menambah digit sa sahaja: ${leftOnes} sa dengan ${rightOnes} sa.`,
    why: 'Kita tambah digit sa dahulu kerana pengiraan mengikut nilai tempat bermula dari rumah sa.'
  })];

  if (carry) {
    steps.push(makeStep({
      concept: 'addition_regroup_ones',
      intro: `Betul! ${onesTotal} ialah ${carry} puluh dan ${onesDigit} sa.`,
      ask: 'Cuba sebut semula: berapa puluh dan berapa sa?',
      expectedAnswers: placeBreakdownAnswers(carry, onesDigit),
      retryHint: `Lihat dua digit dalam ${onesTotal}: digit pertama menunjukkan puluh dan digit kedua menunjukkan sa.`,
      strongHint: `${onesTotal} boleh dikumpulkan sebagai ${carry} puluh dan ${onesDigit} sa. Cuba sebut semula kedua-dua nilai tempat itu.`,
      simpleHelp: `Kumpulan sepuluh menjadi puluh. Baki yang kurang daripada sepuluh kekal sebagai sa.`,
      why: `Kita pecahkan ${onesTotal} mengikut nilai tempat supaya ${onesDigit} boleh ditulis di rumah sa dan ${carry} puluh boleh dibawa ke rumah puluh.`
    }));
  }

  steps.push(makeStep({
    concept: carry ? 'addition_tens_with_carry' : 'addition_tens',
    intro: carry
      ? `Bagus. Simpan ${onesDigit} di rumah sa dan bawa ${carry} puluh.`
      : `Betul. Tulis ${onesDigit} di rumah sa.`,
    ask: carry
      ? `Sekarang ${leftTens} puluh + ${rightTens} puluh + ${carry} puluh = berapa puluh?`
      : `Sekarang ${leftTens} puluh + ${rightTens} puluh = berapa puluh?`,
    expectedAnswers: numberAnswers(tensTotal, 'puluh'),
    retryHint: `Kira bilangan puluh satu demi satu${carry ? ', termasuk puluh yang dibawa' : ''}.`,
    strongHint: `${leftTens} + ${rightTens}${carry ? ` + ${carry}` : ''} = ${tensTotal}. Cuba nyatakan berapa puluh.`,
    simpleHelp: `Sekarang kita hanya mengira rumah puluh${carry ? ' dan memasukkan puluh yang dibawa' : ''}.`,
    why: `Digit puluh mewakili kumpulan sepuluh${carry ? ', jadi puluh yang dibawa mesti dikumpulkan bersama' : ''}.`
  }));

  return { kind: carry ? 'addition_with_regrouping' : 'addition', steps };
}

function placeValueSentence(value) {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor(value / 10) % 10;
  const ones = value % 10;
  const parts = [hundreds ? `${hundreds} ratus` : '', tens ? `${tens} puluh` : '', `${ones} sa`].filter(Boolean);
  return `${value} ada ${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} dan ${parts.at(-1)}` : parts[0]}`;
}

function buildHundredsAdditionPlan(left, right) {
  const leftOnes = left % 10;
  const rightOnes = right % 10;
  const leftTens = Math.floor(left / 10) % 10;
  const rightTens = Math.floor(right / 10) % 10;
  const leftHundreds = Math.floor(left / 100);
  const rightHundreds = Math.floor(right / 100);
  if (leftOnes + rightOnes >= 10 || leftTens + rightTens >= 10 || leftHundreds + rightHundreds >= 10) return null;
  const steps = [];
  if (leftOnes || rightOnes) {
    const onesTotal = leftOnes + rightOnes;
    steps.push(makeStep({
      concept: 'addition_hundreds_ones',
      intro: `${placeValueSentence(left)}. ${placeValueSentence(right)}. Kita gabungkan bahagian sa dahulu.`,
      ask: `${leftOnes} sa + ${rightOnes} sa = berapa sa?`,
      expectedAnswers: numberAnswers(onesTotal, 'sa'),
      retryHint: `Lihat digit sa: kira ${leftOnes} + ${rightOnes}.`,
      strongHint: `${leftOnes} + ${rightOnes} = ${onesTotal}. Cuba sebut bilangannya sebagai sa.`,
      simpleHelp: 'Digit paling kanan ialah rumah sa.',
      why: 'Kita gabungkan nilai pada rumah yang sama.'
    }));
  }
  const tensTotal = leftTens + rightTens;
  steps.push(makeStep({
    concept: 'addition_hundreds_tens',
    intro: `${placeValueSentence(left)}. ${placeValueSentence(right)}. Kita gabungkan bahagian puluh.`,
    ask: `${leftTens} puluh + ${rightTens} puluh = berapa puluh?`,
    expectedAnswers: numberAnswers(tensTotal, 'puluh'),
    retryHint: `Lihat digit puluh: kira ${leftTens} + ${rightTens}.`,
    strongHint: `${leftTens} + ${rightTens} = ${tensTotal}. Cuba sebut bilangannya sebagai puluh.`,
    simpleHelp: 'Digit di rumah puluh menunjukkan kumpulan sepuluh.',
    why: 'Puluh digabungkan dengan puluh supaya nilai tempat kekal betul.'
  }));
  return {
    kind: 'addition_place_value',
    steps,
    leftOnes,
    rightOnes,
    leftTens,
    rightTens,
    leftHundreds,
    rightHundreds
  };
}

function buildSubtractionPlan(left, right) {
  const leftTens = Math.floor(left / 10);
  const rightTens = Math.floor(right / 10);
  const leftOnes = left % 10;
  const rightOnes = right % 10;
  const needsBorrowing = leftOnes < rightOnes;
  const steps = [];

  if (needsBorrowing) {
    const regroupedOnes = leftOnes + 10;
    const remainingTens = leftTens - 1;
    const onesDifference = regroupedOnes - rightOnes;
    const tensDifference = remainingTens - rightTens;
    steps.push(makeStep({
      concept: 'subtraction_borrow_ten',
      intro: `${leftOnes} sa belum cukup untuk menolak ${rightOnes} sa. Kita pinjam 1 puluh.`,
      ask: '1 puluh bersamaan berapa sa?',
      expectedAnswers: unique([...numberAnswers(10), '10 sa', 'sepuluh sa']),
      retryHint: 'Satu kumpulan puluh mengandungi sepuluh unit sa.',
      strongHint: '1 puluh bersamaan 10 sa. Cuba sebut bilangan sa itu.',
      simpleHelp: 'Bayangkan satu ikatan yang mempunyai sepuluh batang. Apabila dibuka, kita mendapat sepuluh batang sa.',
      why: `Kita perlu meminjam kerana ${leftOnes} lebih kecil daripada ${rightOnes}, jadi penolakan di rumah sa belum boleh dibuat.`
    }));
    steps.push(makeStep({
      concept: 'subtraction_regrouped_ones',
      intro: `Betul. Sekarang ${leftOnes} sa menjadi ${regroupedOnes} sa.`,
      ask: `Berapa ${regroupedOnes} - ${rightOnes}?`,
      expectedAnswers: numberAnswers(onesDifference),
      retryHint: `Mulakan pada ${regroupedOnes}, kemudian undur ${rightOnes} langkah.`,
      strongHint: `Apabila ${rightOnes} dikeluarkan daripada ${regroupedOnes}, tinggal ${onesDifference}. Cuba jawab langkah ini.`,
      simpleHelp: `Kita sedang menolak di rumah sa selepas membuka satu kumpulan puluh.`,
      why: `Selepas satu puluh ditukar menjadi 10 sa, rumah sa mempunyai ${regroupedOnes} sa untuk ditolak.`
    }));
    steps.push(makeStep({
      concept: 'subtraction_remaining_tens',
      intro: 'Bagus. Kita sudah gunakan satu puluh untuk rumah sa.',
      ask: `Daripada ${leftTens} puluh, selepas meminjam 1 puluh, tinggal berapa puluh?`,
      expectedAnswers: numberAnswers(remainingTens, 'puluh'),
      retryHint: `Kira ${leftTens} - 1.`,
      strongHint: `${leftTens} puluh ditolak 1 puluh meninggalkan ${remainingTens} puluh. Cuba nyatakan bilangannya.`,
      simpleHelp: 'Apabila satu puluh dipindahkan ke rumah sa, bilangan di rumah puluh berkurang satu.',
      why: 'Puluh yang dipinjam tidak hilang; ia ditukar menjadi 10 sa, jadi rumah puluh mesti dikurangkan satu.'
    }));
    steps.push(makeStep({
      concept: 'subtraction_tens_after_borrowing',
      intro: `Betul. Sekarang ada ${remainingTens} puluh di atas.`,
      ask: `Berapa ${remainingTens} puluh - ${rightTens} puluh?`,
      expectedAnswers: numberAnswers(tensDifference, 'puluh'),
      retryHint: `Kira ${remainingTens} - ${rightTens}, kemudian sebut bilangannya sebagai puluh.`,
      strongHint: `${remainingTens} - ${rightTens} = ${tensDifference}. Cuba nyatakan berapa puluh.`,
      simpleHelp: 'Langkah terakhir ini hanya melibatkan rumah puluh.',
      why: 'Selepas rumah sa selesai, kita menolak kumpulan puluh yang masih tinggal.'
    }));
  } else {
    const onesDifference = leftOnes - rightOnes;
    const tensDifference = leftTens - rightTens;
    steps.push(makeStep({
      concept: 'subtraction_ones',
      intro: 'Jom buat satu langkah dahulu.',
      ask: `Berapa ${leftOnes} - ${rightOnes}?`,
      expectedAnswers: numberAnswers(onesDifference),
      retryHint: `Mulakan pada ${leftOnes}, kemudian undur ${rightOnes} langkah.`,
      strongHint: `${leftOnes} ditolak ${rightOnes} meninggalkan ${onesDifference}. Cuba jawab langkah ini.`,
      simpleHelp: `Kita sedang menolak digit sa sahaja: ${leftOnes} sa tolak ${rightOnes} sa.`,
      why: 'Kita selesaikan rumah sa dahulu supaya setiap nilai tempat dikira dengan teratur.'
    }));
    steps.push(makeStep({
      concept: 'subtraction_tens',
      intro: `Betul. Tulis ${onesDifference} di rumah sa.`,
      ask: `Sekarang ${leftTens} puluh - ${rightTens} puluh = berapa puluh?`,
      expectedAnswers: numberAnswers(tensDifference, 'puluh'),
      retryHint: `Kira ${leftTens} - ${rightTens}, kemudian sebut bilangannya sebagai puluh.`,
      strongHint: `${leftTens} - ${rightTens} = ${tensDifference}. Cuba nyatakan berapa puluh.`,
      simpleHelp: 'Sekarang kita hanya menolak kumpulan puluh.',
      why: 'Digit puluh mewakili kumpulan sepuluh, jadi kita menolak kumpulan puluh dengan kumpulan puluh.'
    }));
  }

  return { kind: needsBorrowing ? 'subtraction_with_regrouping' : 'subtraction', steps };
}

function buildPlaceValuePlan(questionText, expectedAnswer, acceptedAnswers) {
  const lower = comparable(questionText);
  if (!/(?:nilai tempat|puluh)/u.test(lower) || !/(?:sa|unit)/u.test(lower)) return null;
  const numbers = [...questionText.matchAll(/\b(\d{2})\b/g)].map(match => Number(match[1]));
  if (numbers.length !== 1) return null;
  const value = numbers[0];
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  const decomposition = placeBreakdownAnswers(tens, ones);
  const authoredAnswers = [expectedAnswer, ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : [])].map(comparable);
  if (!decomposition.some(answer => authoredAnswers.includes(comparable(answer)))) return null;
  return {
    kind: 'place_value',
    steps: [
      makeStep({
        concept: 'place_value_tens',
        intro: `Mari pecahkan ${value} mengikut nilai tempat.`,
        ask: `Digit ${tens} menunjukkan berapa puluh?`,
        expectedAnswers: numberAnswers(tens, 'puluh'),
        retryHint: `Digit pertama dalam nombor dua digit berada di rumah puluh.`,
        strongHint: `Dalam ${value}, digit ${tens} bermaksud ${tens} kumpulan puluh. Cuba nyatakan bilangannya.`,
        simpleHelp: 'Rumah puluh memberitahu berapa kumpulan sepuluh yang ada.',
        why: `Kedudukan digit ${tens} di sebelah kiri menjadikannya digit puluh.`
      }),
      makeStep({
        concept: 'place_value_ones',
        intro: 'Betul. Sekarang lihat digit di sebelah kanan.',
        ask: `Digit ${ones} menunjukkan berapa sa?`,
        expectedAnswers: numberAnswers(ones, 'sa'),
        retryHint: 'Digit paling kanan berada di rumah sa.',
        strongHint: `Dalam ${value}, digit ${ones} bermaksud ${ones} sa. Cuba nyatakan bilangannya.`,
        simpleHelp: 'Rumah sa menunjukkan unit yang belum membentuk satu kumpulan sepuluh.',
        why: `Kedudukan digit ${ones} di sebelah kanan menjadikannya digit sa.`
      })
    ]
  };
}

function parseSupportedBinaryOperation(questionText = '') {
  const source = clean(questionText);
  const symbolic = source.match(/(?:^|[^\d])(\d{1,3})\s*([+\-−–])\s*(\d{1,3})(?:[^\d]|$)/u);
  if (symbolic) {
    return {
      operation: symbolic[2] === '+' ? 'addition' : 'subtraction',
      left: Number(symbolic[1]),
      right: Number(symbolic[3]),
      operator: symbolic[2] === '+' ? '+' : '-'
    };
  }

  const text = comparable(source);
  const additionPatterns = [
    /^(\d{1,3}) tambah (\d{1,3})$/u,
    /^tambah (\d{1,3}) dengan (\d{1,3})$/u,
    /^(?:cari|berapakah) jumlah (\d{1,3}) dan (\d{1,3})$/u
  ];
  for (const pattern of additionPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        operation: 'addition',
        left: Number(match[1]),
        right: Number(match[2]),
        operator: '+'
      };
    }
  }
  return null;
}

const OPERATION_SYMBOLS = Object.freeze({
  addition: '+',
  subtraction: '-',
  multiplication: '×',
  division: '÷'
});

const SAFE_STRUCTURED_BINARY_SKILLS = new Set([
  'memahami_maksud_jumlah'
]);

function canonicalOperation(value = '') {
  const normalized = comparable(value);
  if (Object.hasOwn(OPERATION_SYMBOLS, normalized)) return normalized;
  if (normalized === 'tambah') return 'addition';
  if (normalized === 'tolak') return 'subtraction';
  if (normalized === 'darab') return 'multiplication';
  if (normalized === 'bahagi') return 'division';
  return '';
}

function finiteOperands(values) {
  if (!Array.isArray(values)) return [];
  const operands = values.map(Number);
  return operands.every(Number.isFinite) ? operands : [];
}

function finiteValues(values) {
  return (Array.isArray(values) ? values : []).map(Number).filter(Number.isFinite);
}

function normalizedCalculations(values) {
  return (Array.isArray(values) ? values : []).map(finiteOperands).filter(items => items.length);
}

function calculateBinary(operation, operands = []) {
  const [left, right] = operands;
  if (![left, right].every(Number.isFinite)) return null;
  if (operation === 'addition') return left + right;
  if (operation === 'subtraction') return left - right;
  if (operation === 'multiplication') return left * right;
  if (operation === 'division' && right !== 0) return left / right;
  return null;
}

function binaryCalculationShape(operation, operands = []) {
  if (operands.length !== 2) return 'unsupported_complex_task';
  const [left, right] = operands;
  if (operation === 'addition') {
    if (Math.max(left, right) >= 100) return 'binary_place_value';
    return left % 10 + right % 10 >= 10 ? 'binary_regrouping' : 'binary_compute';
  }
  if (operation === 'subtraction') {
    if (Math.max(left, right) >= 100) return 'binary_place_value';
    return left % 10 < right % 10 ? 'binary_borrowing' : 'binary_compute';
  }
  return ['multiplication', 'division'].includes(operation) ? 'binary_compute' : 'unsupported_complex_task';
}

function supportsDeterministicPlan(operation, operands = [], numericAnswer = null, pedagogyShape = '') {
  if (pedagogyShape === 'unsupported_complex_task' || operands.length !== 2) return false;
  const [left, right] = operands;
  if (operation === 'subtraction') {
    return [left, right, numericAnswer].every(value => value >= 10 && value <= 99);
  }
  if (operation !== 'addition') return false;
  if ([left, right, numericAnswer].every(value => value >= 10 && value <= 99)) return true;
  if (Math.max(left, right) < 100 || numericAnswer > 999) return false;
  return [1, 10, 100].every(place => Math.floor(left / place) % 10 + Math.floor(right / place) % 10 < 10);
}

function isBinaryPedagogyEligible(question = {}, context = {}) {
  if (context.operands.length !== 2) return false;
  if (context.calculations.length !== 1 || context.calculations[0].length !== 2) return false;
  if (question?.responseRules && Object.keys(question.responseRules).length) return false;
  const questionType = comparable(question?.questionType).replaceAll(' ', '_');
  if (!questionType) return context.source === 'text_parser' || context.source === 'authored_fields';
  if (questionType === 'short_answer') return true;
  return questionType === 'structured' && SAFE_STRUCTURED_BINARY_SKILLS.has(context.skill);
}

export function resolveMathQuestionContext(question = {}, questionText = '') {
  const metadata = question?.metadata && typeof question.metadata === 'object' ? question.metadata : {};
  const metadataOperation = canonicalOperation(metadata.operation);
  const authoredOperation = canonicalOperation(question?.operation || question?.operationType || question?.operator);
  const authoredOperands = finiteOperands(question?.operands);
  const metadataCalculations = normalizedCalculations(metadata.calculations);
  const parsed = !metadataOperation && !authoredOperation
    ? parseSupportedBinaryOperation(getQuestionText(question, questionText))
    : null;
  const operation = metadataOperation || authoredOperation || parsed?.operation || '';
  const operands = authoredOperands.length
    ? authoredOperands
    : metadataCalculations[0]?.length
      ? metadataCalculations[0]
      : parsed
        ? [parsed.left, parsed.right]
        : [];
  const source = metadataOperation
    ? 'structured_metadata'
    : authoredOperation && operands.length
      ? 'authored_fields'
      : parsed
        ? 'text_parser'
        : 'unsupported';
  const calculations = metadataCalculations.length
    ? metadataCalculations
    : operands.length
      ? [operands]
      : [];
  const calculationResults = finiteValues(metadata.calculationResults);
  const metadataNumericAnswer = Number(metadata.numericAnswer);
  const authoredNumericAnswer = Number(question?.numericAnswer);
  const calculatedAnswer = calculateBinary(operation, operands);
  const numericAnswer = Number.isFinite(metadataNumericAnswer)
    ? metadataNumericAnswer
    : calculationResults[0] ?? (Number.isFinite(authoredNumericAnswer) ? authoredNumericAnswer : calculatedAnswer);
  const skill = clean(metadata.skill || question?.skill);
  const calculationShape = binaryCalculationShape(operation, operands);
  const context = {
    operation,
    operands,
    calculations,
    calculationResults,
    numericAnswer,
    skill,
    questionType: clean(question?.questionType),
    responseRules: question?.responseRules || null,
    acceptedAnswers: Array.isArray(question?.acceptedAnswers)
      ? question.acceptedAnswers
      : Array.isArray(question?.accepted)
        ? question.accepted
        : [],
    source,
    confidence: source === 'structured_metadata' ? 'high' : source === 'unsupported' ? 'low' : 'medium',
    calculationShape
  };
  const pedagogyShape = isBinaryPedagogyEligible(question, context)
    ? calculationShape
    : 'unsupported_complex_task';
  return {
    ...context,
    pedagogyShape,
    deterministicSupported: supportsDeterministicPlan(operation, operands, numericAnswer, pedagogyShape)
  };
}

function buildPlan({ question = {}, questionText = '', expectedAnswer = '', acceptedAnswers = [], mathQuestionContext = null } = {}) {
  const resolvedQuestionText = getQuestionText(question, questionText);
  const canonical = mathQuestionContext || resolveMathQuestionContext(question, resolvedQuestionText);
  if (!canonical.operation) return buildPlaceValuePlan(resolvedQuestionText, expectedAnswer, acceptedAnswers);
  if (canonical.pedagogyShape === 'unsupported_complex_task') return null;
  if (!['addition', 'subtraction'].includes(canonical.operation)) return null;

  const [left, right] = canonical.operands;
  const operator = OPERATION_SYMBOLS[canonical.operation];
  const result = canonical.numericAnswer;
  const authoredAnswer = Number(strictNumericAnswer(expectedAnswer, acceptedAnswers));
  if (!Number.isInteger(result) || !Number.isFinite(authoredAnswer) || authoredAnswer !== result) return null;
  const basePlan = left >= 10 && left <= 99 && right >= 10 && right <= 99 && result >= 10 && result <= 99
    ? (operator === '+' ? buildAdditionPlan(left, right) : buildSubtractionPlan(left, right))
    : operator === '+' && Math.max(left, right) >= 100 && result <= 999
      ? buildHundredsAdditionPlan(left, right)
      : null;
  return basePlan ? { ...basePlan, left, right, operator: operator === '+' ? '+' : '-', result } : null;
}

function getProtectedMathAnswers(question = {}, canonical = {}, expectedAnswer = '', acceptedAnswers = []) {
  const questionText = getQuestionText(question);
  const hiddenCalculationResults = (Array.isArray(canonical.calculationResults) ? canonical.calculationResults : [])
    .map(String)
    .filter(value => selectAnswerSafeText([questionText], [value], ''));
  return unique([
    expectedAnswer,
    question?.answer,
    ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : []),
    ...(Array.isArray(question?.acceptedAnswers) ? question.acceptedAnswers : []),
    ...(Array.isArray(question?.accepted) ? question.accepted : []),
    Number.isFinite(canonical.numericAnswer) ? String(canonical.numericAnswer) : '',
    ...hiddenCalculationResults
  ]);
}

function getGroundedTaskKind(question = {}, canonical = {}) {
  const skill = comparable(canonical.skill).replaceAll(' ', '_');
  const questionType = comparable(canonical.questionType).replaceAll(' ', '_');
  if (skill.includes('pengumpulan_semula_sa_tolak')) return 'subtraction_regrouping_explanation';
  if (skill.includes('pengumpulan_semula_sa')) return 'addition_regrouping_explanation';
  if (skill.includes('kesilapan') || skill.includes('jawapan_salah')) return 'error_analysis';
  if (skill.includes('menilai_operasi')) return 'operation_evaluation';
  if (skill.startsWith('mencipta_') || question?.responseRules) return 'creation';
  if (questionType === 'ordering' || skill.includes('menyusun_')) return 'ordering';
  if (questionType === 'fill_blank' || skill.includes('hilang')) return 'missing_number';
  if (canonical.operands.length !== 2 || canonical.calculations.length !== 1) return 'multi_step';
  return 'authored_support';
}

function getGroundedTaskText(kind, canonical, safeHint, actionId = '', intent = '') {
  const [left, right] = canonical.operands;
  const wantsExplanation = actionId === 'explain_current_question' || (!actionId && intent === 'question_help');
  const wantsExample = actionId === 'give_analogous_example' || actionId === 'example_request' || intent === 'example_request';
  if (kind === 'addition_regrouping_explanation') {
    const leftOnes = left % 10;
    const rightOnes = right % 10;
    const onesTotal = leftOnes + rightOnes;
    if (wantsExplanation) {
      return `Soalan ini meminta kamu menerangkan sebab ${leftOnes} + ${rightOnes} perlu dikumpul semula, kemudian mencari jumlah ${left} + ${right}. ${safeHint} Fikirkan mengapa 10 sa boleh menjadi 1 puluh.`;
    }
    const lead = wantsExample ? 'Jom fokus pada idea pengumpulan semula dahulu.' : `${leftOnes} + ${rightOnes} = ${onesTotal} sa. Apabila sa menjadi 10 atau lebih, kita perlu kumpulkan semula.`;
    return `${lead} ${safeHint} Mengapa 10 sa itu perlu dijadikan 1 puluh?`;
  }
  if (kind === 'subtraction_regrouping_explanation') {
    const leftOnes = left % 10;
    const rightOnes = right % 10;
    const lead = wantsExplanation
      ? `Soalan ini meminta kamu menerangkan sebab 1 puluh perlu dikumpul semula, kemudian mencari baki ${left} - ${right}.`
      : `${leftOnes} sa belum cukup untuk menolak ${rightOnes} sa.`;
    return `${lead} ${safeHint} Fikirkan mengapa satu puluh perlu ditukar kepada 10 sa.`;
  }
  if (kind === 'error_analysis') {
    return `Soalan ini meminta kamu mencari lajur atau langkah yang tersilap dan membetulkannya, bukan hanya mengira jawapan. ${safeHint} Semak satu lajur pada satu masa dan terangkan sebabnya.`;
  }
  if (kind === 'operation_evaluation') {
    return `Soalan ini meminta kamu menilai sama ada operasi yang dipilih sesuai sebelum menyelesaikan masalah. ${safeHint} Tentukan dahulu sama ada kuantiti bertambah atau berkurang.`;
  }
  if (kind === 'creation') {
    return `Soalan ini meminta kamu membina jawapan sendiri mengikut syarat yang diberi. ${safeHint} Pastikan jawapan kamu menggunakan semua maklumat yang diwajibkan.`;
  }
  if (kind === 'ordering') {
    return `Soalan ini meminta kamu mencari beberapa hasil sebelum menyusunnya. ${safeHint} Catat setiap hasil, kemudian bandingkan nilainya.`;
  }
  if (kind === 'missing_number') {
    return `Soalan ini meminta kamu mencari nombor yang hilang. ${safeHint} Gunakan hubungan antara nombor yang diketahui untuk menyemaknya.`;
  }
  if (kind === 'multi_step') {
    return `Soalan ini mempunyai lebih daripada satu langkah. ${safeHint} Buat satu pengiraan pada satu masa dan kekalkan urutan asal.`;
  }
  return `Jom fokus pada kehendak soalan ini. ${safeHint} Gunakan petunjuk itu untuk memilih langkah pertama.`;
}

function materializeGroundedRegroupingStep(canonical, context) {
  const [left, right] = canonical.operands;
  const onesTotal = left % 10 + right % 10;
  const carriedTens = Math.floor(onesTotal / 10);
  if (!carriedTens) return null;
  const ask = `Berapa ${Math.floor(left / 10)} puluh + ${Math.floor(right / 10)} puluh + ${carriedTens} puluh?`;
  return Object.freeze({
    stepId: `${context.parentQuestionId}:grounded_regrouping:1`,
    type: 'year2_math_intermediate',
    flow: 'grounded_addition_regrouping_explanation',
    prompt: ask,
    expectedAnswers: Object.freeze(numberAnswers(Math.floor(left / 10) + Math.floor(right / 10) + carriedTens, 'puluh')),
    concept: 'grounded_regrouped_tens',
    parentQuestionId: context.parentQuestionId,
    subjectId: context.subjectId,
    topicId: context.topicId,
    conversationKey: context.conversationKey,
    supportStage: 'awaiting_student',
    state: 'awaiting_student',
    attempts: 0,
    stepIndex: 0,
    totalSteps: 1,
    createdAt: Date.now()
  });
}

function groundedContinuationText(kind, canonical) {
  const [left, right] = canonical.operands;
  if (kind === 'error_analysis') return 'Selepas menyemak lajur sa, perhatikan nilai yang dikumpul semula. Sekarang semak lajur puluh dan pastikan nilai itu diletakkan pada lajur yang betul.';
  if (kind === 'operation_evaluation') return 'Jika kuantiti menerima lebih banyak, fikirkan sama ada jumlahnya bertambah atau berkurang. Pilih operasi yang sepadan dan terangkan sebabnya sebelum mengira.';
  if (kind === 'subtraction_regrouping_explanation') return `Selepas 1 puluh ditukar kepada 10 sa, tentukan dahulu berapa sa yang tinggal apabila ${right % 10} sa ditolak. Kemudian jelaskan mengapa pertukaran itu diperlukan.`;
  if (canonical.operation === 'multiplication') return `Petunjuk tadi menunjukkan ${right} ditambah sebanyak ${left} kali. Tulis kumpulan yang sama itu, kemudian kira jumlahnya sendiri.`;
  if (canonical.operation === 'division') return `Gunakan fakta darab yang sepadan dengan ${left} dan ${right}. Cari kumpulan yang sama tanpa terus melihat jawapan akhir.`;
  return 'Gunakan petunjuk tadi untuk memilih langkah seterusnya. Terangkan langkah yang kamu akan buat sebelum mengira jawapan akhir.';
}

function handleGroundedPendingTurn({ canonical, context, pendingStep, prompt, studentTurn }) {
  if (
    !isPendingStepCurrent(pendingStep, context) ||
    pendingStep.flow !== 'grounded_addition_regrouping_explanation'
  ) return null;
  if (studentTurn.messageType === 'follow_up_question' && studentTurn.referencesPreviousTurn) {
    return {
      handled: true,
      mode: 'grounded_complex',
      state: 'grounded_awaiting_student',
      text: `Cuba jawab langkah ini dahulu. ${pendingStep.prompt}`,
      pendingStep,
      correct: false,
      originalAnswerCorrect: false,
      supportStage: pendingStep.supportStage,
      quickReplies: ['Saya mahu cuba', 'Terangkan langkah ini', 'Saya tak faham']
    };
  }
  const correct = isAcceptedQuestionAnswer(prompt, {
    answer: pendingStep.expectedAnswers[0],
    acceptedAnswers: pendingStep.expectedAnswers
  });
  const answerLike = correct || studentTurn.messageType === 'answer_attempt' || looksLikeStepAnswer(prompt);
  if (!answerLike) return null;
  if (correct) {
    const [left, right] = canonical.operands;
    return {
      handled: true,
      mode: 'grounded_complex',
      state: 'grounded_step_completed',
      text: `Bagus. Nilai yang dikumpul semula sudah digabungkan dengan bahagian puluh. Sekarang terangkan dengan ayat kamu sendiri mengapa ${left % 10} + ${right % 10} perlu dikumpul semula, kemudian jawab soalan asal.`,
      pendingStep: null,
      correct: true,
      originalAnswerCorrect: false,
      supportStage: 'completed',
      quickReplies: ['Saya mahu cuba', 'Terangkan soalan ini', 'Kembali ke soalan']
    };
  }
  const nextStep = Object.freeze({ ...pendingStep, attempts: pendingStep.attempts + 1, supportStage: 'guiding_question' });
  return {
    handled: true,
    mode: 'grounded_complex',
    state: 'grounded_retry',
    text: `Belum tepat. Gabungkan semua bahagian puluh, termasuk nilai yang dikumpul semula. ${pendingStep.prompt}`,
    pendingStep: nextStep,
    correct: false,
    originalAnswerCorrect: false,
    supportStage: nextStep.supportStage,
    quickReplies: ['Cuba lagi', 'Terangkan langkah ini', 'Saya tak faham']
  };
}

function buildGroundedComplexTurn({ question = {}, canonical = {}, expectedAnswer = '', acceptedAnswers = [], actionId = '', studentTurn = {}, pendingStep = null, prompt = '', context = {} } = {}) {
  if (!canonical.operation || !['structured_metadata', 'authored_fields'].includes(canonical.source)) return null;
  if (canonical.deterministicSupported) return null;
  const kind = getGroundedTaskKind(question, canonical);
  if (pendingStep) return handleGroundedPendingTurn({ canonical, context, pendingStep, prompt, studentTurn });
  const handlesSupportRequest = [
    'give_hint',
    'hint',
    'explain_current_question',
    'give_analogous_example',
    'example_request',
    'continue_current_question',
    'explain_current_step',
    'dont_understand_current_step',
    'why_current_step',
    'try_current_step'
  ].includes(actionId) || CURRENT_STEP_SUPPORT_INTENTS.has(studentTurn.intent);
  if (!handlesSupportRequest) return null;
  const protectedAnswers = getProtectedMathAnswers(question, canonical, expectedAnswer, acceptedAnswers);
  const safeHint = selectAnswerSafeText([question?.hint], protectedAnswers, '');
  if (!safeHint) return null;
  const continuation = studentTurn.messageType === 'follow_up_question' && studentTurn.referencesPreviousTurn;
  if (continuation && kind === 'addition_regrouping_explanation') {
    const nextStep = materializeGroundedRegroupingStep(canonical, context);
    if (!nextStep) return null;
    const onesTotal = canonical.operands[0] % 10 + canonical.operands[1] % 10;
    return {
      handled: true,
      mode: 'grounded_complex',
      state: 'grounded_addition_regrouping_continuation',
      text: `Selepas ${onesTotal} sa ditukar kepada ${Math.floor(onesTotal / 10)} puluh dan ${onesTotal % 10} sa, puluh itu digabungkan dengan bahagian puluh. Sekarang cuba: ${nextStep.prompt}`,
      pendingStep: nextStep,
      correct: false,
      originalAnswerCorrect: false,
      supportStage: 'guiding_question',
      quickReplies: ['Saya mahu cuba', 'Terangkan langkah ini', 'Saya tak faham']
    };
  }
  return {
    handled: true,
    mode: 'grounded_complex',
    state: `grounded_${kind}`,
    text: continuation
      ? groundedContinuationText(kind, canonical)
      : getGroundedTaskText(kind, canonical, safeHint, actionId, studentTurn.intent),
    pendingStep: null,
    correct: false,
    originalAnswerCorrect: false,
    supportStage: 'guiding_question',
    quickReplies: ['Terangkan soalan ini', 'Saya mahu cuba', 'Saya tak faham']
  };
}

function materializeStep(plan, index, context, attempts = 0) {
  const definition = plan?.steps?.[index];
  if (!definition) return null;
  return Object.freeze({
    stepId: `${context.parentQuestionId || 'question'}:${plan.kind}:${index + 1}`,
    type: 'year2_math_intermediate',
    flow: plan.kind,
    prompt: [definition.intro, definition.ask].filter(Boolean).join(' '),
    expectedAnswers: Object.freeze([...definition.expectedAnswers]),
    concept: definition.concept,
    parentQuestionId: context.parentQuestionId,
    subjectId: context.subjectId,
    topicId: context.topicId,
    conversationKey: context.conversationKey,
    supportStage: attempts > 1 ? 'strong_hint' : 'awaiting_student',
    state: 'awaiting_student',
    attempts,
    stepIndex: index,
    totalSteps: plan.steps.length,
    createdAt: Date.now()
  });
}

function isPendingStepCurrent(step, context) {
  return Boolean(
    step?.type === 'year2_math_intermediate' &&
    step.conversationKey === context.conversationKey &&
    step.parentQuestionId === context.parentQuestionId &&
    step.subjectId === context.subjectId &&
    step.topicId === context.topicId
  );
}

function mentionsDifferentOperation(prompt, flow = '') {
  const lower = comparable(prompt);
  if (/\b(?:darab|bahagi)\b/u.test(lower)) return true;
  if (/\btolak\b/u.test(lower) && !flow.startsWith('subtraction')) return true;
  if (/\btambah\b/u.test(lower) && !flow.startsWith('addition')) return true;
  return false;
}

function supportsCurrentStep(studentTurn = {}, prompt = '', flow = '') {
  if (!CURRENT_STEP_SUPPORT_INTENTS.has(studentTurn.intent)) return false;
  if (mentionsDifferentOperation(prompt, flow)) return false;
  if (['why_question', 'misunderstanding', 'clarification_needed', 'hint', 'question_help', 'wrong_answer_coaching'].includes(studentTurn.intent)) return true;
  return Boolean(
    studentTurn.referencesPreviousTurn ||
    /\b(?:ini|itu|tadi|langkah|soalan|yang tadi|cuba lagi)\b/iu.test(prompt) ||
    /^(?:macam\s*mana|bagaimana|kenapa|mengapa)[?？]?$/iu.test(clean(prompt))
  );
}

function looksLikeStepAnswer(prompt = '') {
  const text = comparable(prompt);
  if (!text) return false;
  if (/^-?\d+(?:\s+(?:puluh|sa|unit))?(?:\s+dan\s+\d+\s+(?:sa|unit))?$/u.test(text)) return true;
  return /\b(?:puluh|sa|unit|kosong|satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|sepuluh|sebelas|belas)\b/u.test(text)
    && text.split(' ').length <= 7;
}

function currentStepDefinition(plan, pendingStep) {
  return plan?.steps?.[Number(pendingStep?.stepIndex) || 0] || null;
}

function finishOriginalProblemText(plan = {}) {
  if (plan.kind === 'addition_place_value') {
    const hundreds = plan.leftHundreds + plan.rightHundreds;
    return `Bagus. Kamu sudah dapat bahagian puluh. Kita masih ada ${hundreds} ratus. Sekarang gabungkan nilai tempat itu dan jawab soalan asal sendiri. Kemudian kembali ke soalan dan masukkan jawapan kamu.`;
  }
  return 'Bagus! Kamu sudah lengkapkan semua langkah. Sekarang gabungkan nilai puluh dan sa untuk jawab soalan asal sendiri. Kemudian kembali ke soalan dan masukkan jawapan kamu.';
}

function isQuestionReturnAction(prompt = '') {
  return /^kembali\s+(?:ke|kepada)\s+soalan(?:\s+(?:asal|semasa))?[.!?？]*$/iu.test(clean(prompt));
}

function isRepeatMethodAction(prompt = '') {
  return /^ulang\s+(?:cara|langkah)(?:\s+tadi)?[.!?？]*$/iu.test(clean(prompt));
}

function buildOriginalSuccessText(plan = {}, expectedAnswer = '', acceptedAnswers = []) {
  const answer = strictNumericAnswer(expectedAnswer, acceptedAnswers);
  if (plan.kind === 'addition_place_value') {
    return `Betul! ${plan.left} ditambah ${plan.right} menjadi ${answer}. Sekarang kembali ke soalan dan masukkan jawapan sendiri.`;
  }
  if (!/^\d{2}$/.test(answer)) {
    return 'Betul! Kamu berjaya. Sekarang kembali ke soalan dan masukkan jawapan sendiri.';
  }
  const value = Number(answer);
  return `Betul! Kamu berjaya. ${Math.floor(value / 10)} puluh dan ${value % 10} sa menjadi ${answer}. Sekarang kembali ke soalan dan masukkan jawapan sendiri.`;
}

function isTutorActionCurrent(action, context) {
  return Boolean(
    action?.source === 'tutor_quick_action' &&
    action.conversationKey === context.conversationKey &&
    action.questionId === context.parentQuestionId &&
    action.subjectId === context.subjectId &&
    action.topicId === context.topicId
  );
}

function getAnalogousExample(plan = {}) {
  if (!plan.kind?.startsWith('addition')) return null;
  const planLeftTens = Number.isFinite(plan.leftTens) ? plan.leftTens : Math.floor((plan.left || 0) / 10);
  const leftTens = Math.max(1, Math.min(4, planLeftTens || 1));
  const rightTens = 1;
  return {
    left: leftTens * 10,
    right: rightTens * 10,
    leftTens,
    rightTens,
    totalTens: leftTens + rightTens
  };
}

function materializeAnalogousExample(plan, context) {
  const example = getAnalogousExample(plan);
  if (!example) return null;
  const total = (example.leftTens + example.rightTens) * 10;
  return Object.freeze({
    stepId: `${context.parentQuestionId}:${plan.kind}:example`,
    type: 'year2_math_intermediate',
    flow: `${plan.kind}_example`,
    prompt: `Jom cuba contoh lebih mudah dahulu: ${example.left} + ${example.right}. ${example.left} ialah ${example.leftTens} puluh dan ${example.right} ialah ${example.rightTens} puluh. Berapa puluh semuanya?`,
    expectedAnswers: Object.freeze(unique([...numberAnswers(example.totalTens, 'puluh'), String(total)])),
    concept: 'analogous_example_tens',
    parentQuestionId: context.parentQuestionId,
    subjectId: context.subjectId,
    topicId: context.topicId,
    conversationKey: context.conversationKey,
    supportStage: 'awaiting_student',
    state: 'awaiting_student',
    attempts: 0,
    stepIndex: -1,
    totalSteps: 1,
    example
  });
}

function startPlanTurn(plan, context, text = '') {
  const firstStep = materializeStep(plan, 0, context);
  return {
    handled: true,
    state: 'created',
    text: text || firstStep.prompt,
    pendingStep: firstStep,
    correct: false,
    originalAnswerCorrect: false,
    supportStage: 'guiding_question',
    quickReplies: plan.kind === 'addition_place_value'
      ? ['Kenal pasti nombor yang hendak ditambah.', 'Tambah sa dahulu, kemudian puluh dan ratus.', 'Semak jumlah akhir mengikut tempat nilai.']
      : ['Saya mahu cuba', 'Terangkan langkah ini', 'Saya tak faham']
  };
}

function compareExampleTurn(plan, context) {
  const example = getAnalogousExample(plan);
  if (!example) return null;
  const firstStep = materializeStep(plan, 0, context);
  return {
    ...startPlanTurn(plan, context),
    text: `Dalam ${example.left} + ${example.right}, kita gabungkan ${example.leftTens} puluh dengan ${example.rightTens} puluh. Dalam ${plan.left} + ${plan.right}, kita juga gabungkan bahagian puluh. ${plan.left} ada ${plan.leftTens} puluh dan ${plan.right} ada ${plan.rightTens} puluh. Sekarang cuba: ${firstStep.prompt.split('. ').at(-1)}`,
    quickReplies: ['Saya mahu cuba', 'Terangkan langkah ini', 'Kenapa langkah ini?']
  };
}

function placeValueActionTurn(actionId, plan, context, pendingStep = null) {
  if (!plan.operator || !['identify_operands', 'explain_place_value_method', 'check_final_by_place_value'].includes(actionId)) return null;
  const activeStep = isPendingStepCurrent(pendingStep, context) ? pendingStep : materializeStep(plan, 0, context);
  if (actionId === 'identify_operands') {
    return {
      ...startPlanTurn(plan, context),
      text: `Nombor yang hendak ditambah ialah ${plan.left} dan ${plan.right}. Sekarang cuba: ${activeStep.prompt.split('. ').at(-1)}`,
      pendingStep: activeStep
    };
  }
  const leftHundreds = Math.floor(plan.left / 100);
  const rightHundreds = Math.floor(plan.right / 100);
  const leftTens = Math.floor(plan.left / 10) % 10;
  const rightTens = Math.floor(plan.right / 10) % 10;
  const leftOnes = plan.left % 10;
  const rightOnes = plan.right % 10;
  if (actionId === 'explain_place_value_method') {
    return {
      ...startPlanTurn(plan, context),
      text: `Untuk ${plan.left} + ${plan.right}, rumah sa ialah ${leftOnes} + ${rightOnes}. Rumah puluh ialah ${leftTens} puluh + ${rightTens} puluh. Rumah ratus ialah ${leftHundreds} ratus + ${rightHundreds} ratus. Sekarang cuba: ${activeStep.prompt.split('. ').at(-1)}`,
      pendingStep: activeStep
    };
  }
  return {
    handled: true,
    state: 'checking_method',
    text: `Untuk menyemak ${plan.left} + ${plan.right}, bandingkan setiap rumah: sa ${leftOnes} + ${rightOnes}, puluh ${leftTens} + ${rightTens}, dan ratus ${leftHundreds} + ${rightHundreds}. Pastikan jawapan kamu mempunyai nilai tempat yang sama.`,
    pendingStep: isPendingStepCurrent(pendingStep, context) ? pendingStep : null,
    correct: false,
    originalAnswerCorrect: false,
    supportStage: 'guiding_question',
    quickReplies: ['Beri petunjuk', 'Ulang cara', 'Kembali ke soalan']
  };
}

function handleAnalogousExampleTurn({ plan, context, prompt, studentTurn, pendingStep, actionId }) {
  if (pendingStep?.concept !== 'analogous_example_tens') return null;
  const example = pendingStep.example || getAnalogousExample(plan);
  if (!example) return null;
  if (actionId || supportsCurrentStep(studentTurn, prompt, pendingStep.flow)) {
    const help = actionId === 'why_current_step'
      ? 'Kita menggunakan contoh yang lebih kecil supaya cara menggabungkan puluh lebih mudah dilihat.'
      : `Lihat kumpulan puluh sahaja: ${example.leftTens} puluh ditambah ${example.rightTens} puluh.`;
    return {
      handled: true,
      state: 'example_awaiting_student',
      text: `${help} Cuba lagi: Berapa puluh semuanya?`,
      pendingStep,
      correct: false,
      supportStage: 'guiding_question',
      quickReplies: ['Saya mahu cuba lagi', 'Bimbing saya membandingkan', 'Kenapa langkah ini?']
    };
  }
  const correct = isAcceptedQuestionAnswer(prompt, {
    answer: pendingStep.expectedAnswers[0],
    acceptedAnswers: pendingStep.expectedAnswers
  });
  const answerLike = correct || studentTurn.messageType === 'answer_attempt' || looksLikeStepAnswer(prompt);
  if (!answerLike) return null;
  if (correct) {
    return {
      handled: true,
      state: 'example_completed',
      text: `Bagus. Dalam contoh tadi kita gabungkan ${example.leftTens} puluh dengan ${example.rightTens} puluh. Sekarang bandingkan cara itu dengan soalan asal.`,
      pendingStep: null,
      correct: true,
      supportStage: 'completed',
      quickReplies: ['Bimbing saya membandingkan', 'Ulang cara', 'Kembali ke soalan']
    };
  }
  const attempts = Math.max(0, Number(pendingStep.attempts) || 0) + 1;
  const nextStep = Object.freeze({ ...pendingStep, attempts, supportStage: attempts > 1 ? 'strong_hint' : 'guiding_question' });
  return {
    handled: true,
    state: 'example_retry',
    text: `Belum tepat. Kira kumpulan puluh: ${example.leftTens} + ${example.rightTens}. Berapa puluh semuanya?`,
    pendingStep: nextStep,
    correct: false,
    supportStage: nextStep.supportStage,
    quickReplies: ['Cuba lagi', 'Bimbing saya membandingkan', 'Saya tak faham']
  };
}

export function handleYear2MathPedagogicalTurn({
  conversationKey = '',
  subjectId = '',
  topicId = '',
  question = {},
  questionText = '',
  expectedAnswer = '',
  acceptedAnswers = [],
  prompt = '',
  tutorAction = null,
  studentTurn = {},
  pendingStep = null,
  mathQuestionContext = null
} = {}) {
  const context = {
    conversationKey: clean(conversationKey),
    subjectId: clean(subjectId),
    topicId: clean(topicId),
    parentQuestionId: getParentQuestionId(question, getQuestionText(question, questionText))
  };
  if (!context.conversationKey || context.subjectId !== 'math' || !context.parentQuestionId) return null;
  const canonical = mathQuestionContext || resolveMathQuestionContext(question, questionText);
  const plan = buildPlan({ question, questionText, expectedAnswer, acceptedAnswers, mathQuestionContext: canonical });
  const hasTutorAction = Boolean(tutorAction);
  const actionId = isTutorActionCurrent(tutorAction, context) ? clean(tutorAction.actionId) : '';
  if (hasTutorAction && !actionId) return null;
  if (!plan?.steps?.length) {
    return buildGroundedComplexTurn({
      question,
      canonical,
      expectedAnswer,
      acceptedAnswers,
      actionId,
      studentTurn,
      pendingStep,
      prompt,
      context
    });
  }
  const pendingIsCurrent = isPendingStepCurrent(pendingStep, context);

  if (!pendingIsCurrent) {
    if (pendingStep) return null;
    if (actionId === 'return_to_original_question' || isQuestionReturnAction(prompt)) {
      return {
        handled: true,
        state: 'question_handoff',
        text: 'Kita masih pada soalan ini. Kembali ke soalan dan masukkan jawapan sendiri.',
        pendingStep: null,
        correct: false,
        originalAnswerCorrect: false,
        supportStage: 'completed',
        quickReplies: ['Kembali ke soalan', 'Ulang cara']
      };
    }

    if (actionId === 'give_analogous_example' || actionId === 'example_request') {
      const exampleStep = materializeAnalogousExample(plan, context);
      if (exampleStep) {
        return {
          handled: true,
          state: 'example_created',
          text: exampleStep.prompt,
          pendingStep: exampleStep,
          correct: false,
          originalAnswerCorrect: false,
          supportStage: 'guiding_question',
          quickReplies: ['Saya mahu cuba', 'Bimbing saya membandingkan', 'Saya tak faham']
        };
      }
    }

    if (actionId === 'compare_example') {
      const comparison = compareExampleTurn(plan, context);
      if (comparison) return comparison;
    }

    const placeValueAction = placeValueActionTurn(actionId, plan, context);
    if (placeValueAction) return placeValueAction;

    const repeatMethod = actionId === 'restart_guided_method' || isRepeatMethodAction(prompt);
    const canStart = repeatMethod || START_INTENTS.has(studentTurn.intent) || (
      studentTurn.intent === 'how_question' &&
      !mentionsDifferentOperation(prompt, plan.kind) &&
      /\b(?:soalan|ini|tadi|kira|tambah|tolak|langkah)\b/iu.test(prompt)
    );
    if (canStart) return startPlanTurn(plan, context);

    const originalCorrect = isAcceptedQuestionAnswer(prompt, { answer: expectedAnswer, acceptedAnswers });
    const answerLike = originalCorrect || studentTurn.messageType === 'answer_attempt' || looksLikeStepAnswer(prompt);
    if (!answerLike) return null;
    return originalCorrect
      ? {
          handled: true,
          state: 'original_correct',
          text: buildOriginalSuccessText(plan, expectedAnswer, acceptedAnswers),
          pendingStep: null,
          correct: true,
          originalAnswerCorrect: true,
          supportStage: 'completed',
          quickReplies: ['Kembali ke soalan', 'Ulang cara']
        }
      : {
          handled: true,
          state: 'original_retry',
          text: 'Belum tepat. Cuba semak semula nilai puluh dan sa.',
          pendingStep: null,
          correct: false,
          originalAnswerCorrect: false,
          supportStage: 'guiding_question',
          quickReplies: ['Beri petunjuk', 'Ulang cara', 'Kembali ke soalan']
        };
  }

  if (actionId === 'return_to_original_question') {
    return {
      handled: true,
      state: 'question_handoff',
      text: 'Kita masih pada soalan ini. Kembali ke soalan dan masukkan jawapan sendiri.',
      pendingStep,
      correct: false,
      originalAnswerCorrect: false,
      supportStage: 'completed',
      quickReplies: ['Kembali ke soalan', 'Ulang cara']
    };
  }
  if (actionId === 'restart_guided_method') return startPlanTurn(plan, context);
  if (actionId === 'give_analogous_example' || actionId === 'example_request') {
    const exampleStep = materializeAnalogousExample(plan, context);
    if (exampleStep) {
      return {
        handled: true,
        state: 'example_created',
        text: exampleStep.prompt,
        pendingStep: exampleStep,
        correct: false,
        supportStage: 'guiding_question',
        quickReplies: ['Saya mahu cuba', 'Bimbing saya membandingkan', 'Saya tak faham']
      };
    }
  }
  if (actionId === 'compare_example') {
    const comparison = compareExampleTurn(plan, context);
    if (comparison) return comparison;
  }
  const placeValueAction = placeValueActionTurn(actionId, plan, context, pendingStep);
  if (placeValueAction) return placeValueAction;
  const exampleTurn = handleAnalogousExampleTurn({ plan, context, prompt, studentTurn, pendingStep, actionId });
  if (exampleTurn) return exampleTurn;

  const definition = currentStepDefinition(plan, pendingStep);
  if (!definition || pendingStep.flow !== plan.kind || pendingStep.stepId !== `${context.parentQuestionId}:${plan.kind}:${pendingStep.stepIndex + 1}`) return null;

  if (supportsCurrentStep(studentTurn, prompt, plan.kind)) {
    const isWhy = studentTurn.intent === 'why_question' || actionId === 'why_current_step';
    const isHint = ['hint', 'wrong_answer_coaching'].includes(studentTurn.intent) || actionId === 'give_hint';
    const supportText = isWhy ? definition.why : isHint ? definition.retryHint : definition.simpleHelp;
    return {
      handled: true,
      state: 'awaiting_student',
      text: `${supportText} Cuba lagi: ${definition.ask}`,
      pendingStep,
      correct: false,
      supportStage: pendingStep.supportStage || 'guiding_question',
      quickReplies: ['Saya mahu cuba lagi', 'Terangkan lebih mudah', 'Kenapa langkah ini?']
    };
  }

  const pendingQuestion = {
    answer: definition.expectedAnswers[0],
    acceptedAnswers: definition.expectedAnswers
  };
  const correct = isAcceptedQuestionAnswer(prompt, pendingQuestion);
  const answerLike = correct || studentTurn.messageType === 'answer_attempt' || looksLikeStepAnswer(prompt);
  if (!answerLike) return null;

  if (!correct) {
    const attempts = Math.max(0, Number(pendingStep.attempts) || 0) + 1;
    const nextStep = Object.freeze({
      ...pendingStep,
      attempts,
      state: 'awaiting_student',
      supportStage: attempts >= 2 ? 'strong_hint' : 'guiding_question'
    });
    return {
      handled: true,
      state: 'retry_support',
      text: `Belum tepat, tetapi tidak mengapa. ${attempts >= 2 ? definition.strongHint : definition.retryHint} ${definition.ask}`,
      pendingStep: nextStep,
      correct: false,
      supportStage: nextStep.supportStage,
      quickReplies: ['Cuba lagi', 'Saya tak faham', 'Kenapa langkah ini?']
    };
  }

  const nextIndex = pendingStep.stepIndex + 1;
  const nextStep = materializeStep(plan, nextIndex, context);
  if (!nextStep) {
    return {
      handled: true,
      state: 'completed',
      text: finishOriginalProblemText(plan),
      pendingStep: null,
      correct: true,
      supportStage: 'completed',
      quickReplies: ['Kembali ke soalan', 'Ulang cara']
    };
  }

  return {
    handled: true,
    state: 'correct',
    text: nextStep.prompt,
    pendingStep: nextStep,
    correct: true,
    supportStage: 'guiding_question',
    quickReplies: ['Saya mahu cuba', 'Kenapa langkah ini?', 'Saya tak faham']
  };
}

export function buildYear2MathPedagogicalResponse({
  studentName = '',
  subjectTitle = '',
  topicTitle = '',
  instruction = '',
  options = [],
  locale = '',
  languagePresentation = null,
  attemptCount = 0,
  hintsUsed = 0,
  isOriginalCorrect = false,
  explanationMode = '',
  ...turnOptions
} = {}) {
  const mathQuestionContext = turnOptions.mathQuestionContext || resolveMathQuestionContext(turnOptions.question, turnOptions.questionText);
  const pedagogicalTurn = handleYear2MathPedagogicalTurn({ ...turnOptions, mathQuestionContext });
  if (!pedagogicalTurn?.handled) return null;
  const originalAnswerCorrect = Boolean(isOriginalCorrect || pedagogicalTurn.originalAnswerCorrect);
  const answerRevealPolicy = getAnswerRevealPolicy({
    isCorrect: originalAnswerCorrect,
    attemptCount,
    hintsUsed,
    explanationMode,
    explicitAnswerRequest: /tunjuk(?:kan)?\s+(?:jawapan|jawapan betul)|show answer|jawapan sebenar/i.test(turnOptions.prompt)
  });
  const protectedAnswers = getProtectedMathAnswers(
    turnOptions.question,
    mathQuestionContext,
    turnOptions.expectedAnswer,
    turnOptions.acceptedAnswers
  );
  const safeText = answerRevealPolicy?.canRevealAnswer
    ? pedagogicalTurn.text
    : selectAnswerSafeText(
        [pedagogicalTurn.text, pedagogicalTurn.pendingStep?.prompt],
        protectedAnswers,
        'Mari teruskan satu langkah kecil tanpa melihat jawapan akhir.'
      );
  const quickReplies = unique(pedagogicalTurn.quickReplies).slice(0, 3);
  const quickActions = buildQuickActions(quickReplies, {
    conversationKey: clean(turnOptions.conversationKey),
    parentQuestionId: getParentQuestionId(turnOptions.question, getQuestionText(turnOptions.question, turnOptions.questionText)),
    subjectId: clean(turnOptions.subjectId),
    topicId: clean(turnOptions.topicId)
  });
  const revealOriginalAnswer = Boolean(pedagogicalTurn.originalAnswerCorrect && answerRevealPolicy?.canRevealAnswer);
  return {
    text: safeText,
    shortText: safeText,
    intent: pedagogicalTurn.originalAnswerCorrect
      ? 'correct_answer_reinforcement'
      : pedagogicalTurn.state === 'original_retry'
        ? 'wrong_answer_coaching'
        : pedagogicalTurn.state === 'question_handoff'
          ? 'general'
          : 'pedagogical_step',
    studentIntent: turnOptions.studentTurn?.intent || '',
    confidence: 100,
    suggestions: quickReplies,
    suggestedActions: quickReplies,
    quickReplies,
    quickActions,
    source: pedagogicalTurn.mode === 'grounded_complex' ? 'grounded-math-question-support' : 'deterministic-math-pedagogy',
    fallbackUsed: false,
    error: null,
    studentName,
    subject: subjectTitle,
    topic: topicTitle,
    questionId: clean(turnOptions.question?.id || turnOptions.question?.questionId),
    questionText: getQuestionText(turnOptions.question, turnOptions.questionText),
    instruction: clean(instruction),
    options: Array.isArray(options) ? options : [],
    expectedAnswer: revealOriginalAnswer ? clean(turnOptions.expectedAnswer) : '',
    learnerAnswer: revealOriginalAnswer ? clean(turnOptions.prompt) : '',
    acceptedAnswers: revealOriginalAnswer && Array.isArray(turnOptions.acceptedAnswers) ? turnOptions.acceptedAnswers : [],
    correctAnswer: revealOriginalAnswer ? clean(turnOptions.expectedAnswer) : '',
    isCorrect: Boolean(pedagogicalTurn.originalAnswerCorrect),
    pedagogicalStepCorrect: Boolean(pedagogicalTurn.correct && !pedagogicalTurn.originalAnswerCorrect),
    supportStage: pedagogicalTurn.supportStage,
    answerRevealPolicy,
    locale,
    languagePresentation,
    pendingPedagogicalStep: pedagogicalTurn.pendingStep,
    pedagogicalStepState: pedagogicalTurn.state,
    studentTurn: turnOptions.studentTurn,
    conversationStage: 'pedagogical_step',
    referencesPreviousTurn: Boolean(turnOptions.studentTurn?.referencesPreviousTurn),
    needsClarification: false,
    grounded: true,
    needsGenerativeTutor: false,
    mathQuestionContext: {
      operation: mathQuestionContext.operation,
      operands: mathQuestionContext.operands,
      source: mathQuestionContext.source,
      confidence: mathQuestionContext.confidence,
      calculationShape: mathQuestionContext.calculationShape,
      pedagogyShape: mathQuestionContext.pedagogyShape,
      deterministicSupported: mathQuestionContext.deterministicSupported
    }
  };
}

export default {
  buildYear2MathPedagogicalResponse,
  handleYear2MathPedagogicalTurn
};
