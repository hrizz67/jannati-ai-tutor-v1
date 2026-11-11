import { fetchTutorKnowledgeData } from './coach/knowledge/tutorKnowledgeAdapter.js';
import { rankStrongTopics, rankWeakTopics } from './adaptive/weakTopicEngine.js';
import { buildRecommendation } from './recommendationEngine.js';
import {
  clampPercent,
  formatSubjectName,
  formatTopicName,
  getHumanReadableTopic,
  getStudentDisplayName
} from '../utils/displayFormatter.js';
import {
  detectLearningCategory,
  getLearningExamples,
  getLearningMemoryTip,
  sanitizeChildFacingText
} from './learningCopy.js';
import {
  buildGuidedLearning,
  limitTutorText,
  sanitizeTutorText
} from './guidedLearning/index.js';
import { understandStudentTurn } from './conversation/studentTurnEngine.js';
import { getAcceptedAnswers, isAcceptedQuestionAnswer } from '../utils/acceptedAnswers.js';
import { getAnswerRevealPolicy, selectAnswerSafeText } from './policy/answerRevealPolicy.js';
import { getSubjectLanguagePresentation } from './voice/voiceConfig.js';
import { selectApprovedTeachingExamples } from './pedagogy/approvedTeachingExamples.js';
import { resolveTutorQuickReplyAction } from './conversation/tutorQuickReplyActions.js';
import {
  attachTeachingAnchorState,
  buildTeachingAnchorReply,
  getTeachingAnchorContext,
  getTeachingAnchorNoAnswerLead,
  resolveTeachingAnchorTurn
} from './conversation/teachingAnchor.js';

const DEFAULT_FALLBACK = 'Saya akan bantu soalan semasa.';
const ARABIC_NOUN = 'الاسم كلمة تدل على شخص أو حيوان أو مكان أو شيء.';

function buildTutorExplanation({ subjectId, topicId, knowledge, context }) {
  const asTextList = value => Array.isArray(value)
    ? value.filter(Boolean).map(String)
    : value === null || value === undefined || value === '' ? [] : [String(value)];
  const explanations = asTextList(knowledge.teacherExplanation);
  const simpleExplanation = String(knowledge.simpleExplanation || knowledge.explanation || '');
  const questionText = String(context.questionText || '').trim();
  const expectedAnswer = String(context.expectedAnswer || '').trim();
  const pronoun = subjectId === 'bm' && /kata[_ ]ganti[_ ]nama/.test(`${subjectId} ${topicId}`.toLowerCase())
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
  }[pronoun];
  const contextualPronoun = pronounReason
    ? `Kata ganti nama diri yang betul ialah “${pronoun.charAt(0).toUpperCase()}${pronoun.slice(1)}” kerana ${pronounReason.replace(/^“[^”]+”\s+digunakan apabila /, '').replace(/^“[^”]+”\s+digunakan untuk /, '').replace(/^“[^”]+”\s+digunakan dengan sopan untuk /, '').replace(/^“[^”]+”\s+digunakan apabila /, '')}`
    : '';
  const subjectFocus = subjectId === 'math' && questionText
    ? ` Soalan semasa menggunakan nombor dan operasi ini: ${questionText}${expectedAnswer ? ` Jawapan perlu disemak dengan ${expectedAnswer}.` : ''}`
    : subjectId === 'sains' && questionText
      ? ` Perhatikan konsep sains dalam soalan semasa: ${questionText}`
      : subjectId === 'arab' && questionText
        ? ` استخدم العربية في هذا السؤال: ${questionText}`
        : subjectId === 'english' && questionText
          ? ` Use English from this question: ${questionText}`
          : '';
  const explanation = contextualPronoun || simpleExplanation || explanations[0] || '';
  return {
    explanation: `${explanation}${subjectFocus}`.trim(),
    simpleExplanation: `${contextualPronoun || simpleExplanation || explanations[0] || ''}${subjectFocus}`.trim()
  };
}

async function buildTutorKnowledgeResponse({ subjectId, topicId, question, result, userAnswer, context, studentId, studentProfile }) {
  const knowledge = await fetchTutorKnowledgeData({
    subjectId,
    topicId,
    question,
    result,
    userAnswer,
    studentId,
    studentProfile
  });
  if (!knowledge) return null;
  return {
    knowledge,
    explanation: buildTutorExplanation({ subjectId, topicId, knowledge, context }),
    ready: true
  };
}

const CATEGORY_COMMON_MISTAKES = {
  person: ['Memilih nama tempat.', 'Memilih perkataan yang bukan nama orang.'],
  place: ['Memilih nama orang.', 'Memilih kata kerja atau sifat.'],
  animal: ['Memilih benda atau tempat.', 'Memilih perkataan yang bukan haiwan.'],
  object: ['Memilih nama orang.', 'Memilih kata kerja.'],
  verb: ['Memilih kata nama.', 'Memilih kata adjektif.'],
  adjective: ['Memilih nama benda.', 'Memilih perbuatan.'],
  penjodoh: ['Memilih kata nama biasa.', 'Menggunakan penjodoh yang tidak sesuai.'],
  simpulan: ['Membaca setiap perkataan secara literal.', 'Memilih frasa yang tiada maksud khas.'],
  conjunction: ['Memilih kata sendi nama.', 'Memilih kata nama.'],
  sendi: ['Memilih kata kerja.', 'Memilih kata hubung.'],
  generic: ['Semak semula soalan.', 'Bandingkan jawapan dengan soalan.']
};

const INTENT_STEPS = {
  hint: ['Cari kata kunci penting dalam soalan.', 'Bandingkan pilihan jawapan dengan kata kunci.'],
  question_help: ['Baca soalan perlahan-lahan.', 'Cari kata kunci penting.', 'Semak jawapan dengan ayat penuh.'],
  wrong_answer_coaching: ['Semak semula jawapan yang kamu pilih.', 'Cari petunjuk dalam ayat.', 'Bandingkan dengan maksud soalan.'],
  correct_answer_reinforcement: ['Ulang sebab jawapan itu betul.', 'Cuba soalan yang sedikit lebih mencabar.'],
  learning_recommendation: ['Pilih satu topik berdasarkan kemajuan.', 'Fahami satu idea.', 'Cuba beberapa soalan ringkas.'],
  weak_topic: ['Lihat topik yang paling lemah dahulu.', 'Ulang satu langkah pada satu masa.'],
  revision_plan: ['Ikut topik keutamaan hari ini.', 'Buat ulang kaji ringkas dahulu.'],
  uasa_summary: ['Semak skor dan topik yang perlu dikuatkan.', 'Rancang ulang kaji sebelum simulasi seterusnya.'],
  knowledge_question: ['Kenal pasti maksud konsep.', 'Lihat satu contoh mudah.', 'Terangkan semula dengan ayat sendiri.'],
  comparison_question: ['Kenal pasti maksud kedua-dua konsep.', 'Cari satu perbezaan utama.', 'Uji perbezaan itu dengan contoh.'],
  why_question: ['Kenal pasti sebab utama.', 'Hubungkan sebab dengan petunjuk dalam soalan.', 'Semak kefahaman dengan satu contoh.'],
  how_question: ['Kenal pasti apa yang hendak dicari.', 'Buat satu langkah pada satu masa.', 'Semak semula hasil setiap langkah.'],
  misunderstanding: ['Kembali kepada idea paling asas.', 'Gunakan contoh yang lebih mudah.', 'Cuba terangkan semula dengan ayat sendiri.'],
  alternative_explanation: ['Lihat konsep melalui contoh lain.', 'Bandingkan contoh dengan soalan semasa.', 'Cuba langkah pertama sendiri.'],
  understanding_confirmation: ['Terangkan semula idea utama.', 'Cuba satu soalan ringkas untuk mengukuhkan kefahaman.'],
  clarification_needed: ['Pilih bahagian yang hendak dipelajari.', 'Nyatakan sama ada kamu mahu maksud, langkah atau contoh.'],
  tutor_identity: ['Pilih perkara yang hendak dipelajari.', 'Terangkan apa yang kamu sudah tahu.'],
  learner_state: ['Pilih satu langkah kecil.', 'Belajar mengikut kemampuan kamu hari ini.'],
  general: ['Beritahu perkara yang kamu mahu faham.', 'Pilih sama ada mahu penerangan, contoh atau latihan.']
};

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return normalizeText(value[0], fallback);
  if (typeof value === 'object') {
    if (typeof value.text === 'string' || typeof value.text === 'number') return normalizeText(value.text, fallback);
    if (typeof value.label === 'string' || typeof value.label === 'number') return normalizeText(value.label, fallback);
    if (typeof value.value === 'string' || typeof value.value === 'number') return normalizeText(value.value, fallback);
    return fallback;
  }
  const text = sanitizeChildFacingText(String(value).trim());
  return text || fallback;
}

function normalizeList(value) {
  if (value === null || value === undefined || value === '') return [];
  const items = Array.isArray(value) ? value : [value];
  const result = [];
  const seen = new Set();
  for (const item of items.flat(Infinity)) {
    const text = normalizeText(item, '');
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function normalizeForDialogue(value = '') {
  return normalizeText(value, '')
    .toLocaleLowerCase('ms-MY')
    .replace(/[.!?,:;\"'“”‘’]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickFreshDialogue(candidates = [], history = []) {
  const previous = new Set(
    (Array.isArray(history) ? history : [])
      .filter(item => item?.role === 'ai')
      .map(item => normalizeForDialogue(item.text))
      .filter(Boolean)
  );
  const fresh = candidates.find(item => {
    const value = normalizeForDialogue(item);
    return value && !previous.has(value);
  });
  return normalizeText(fresh || candidates.find(Boolean) || '', '');
}

function getQuestionText(question = {}, explicit = '') {
  const text = normalizeText(
    explicit ||
    question?.q ||
    question?.question ||
    question?.stem ||
    question?.text ||
    question?.prompt ||
    ''
  );
  return text
    .replace(/\s*\((?:set|set bina ayat|set uasa|set adaptive)[^)]*\)/gi, '')
    .replace(/\s*\[(?:set|adaptive)[^\]]*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getInstruction(question = {}, explicit = '') {
  return normalizeText(
    explicit ||
    question?.instruction ||
    question?.direction ||
    question?.prompt ||
    question?.task ||
    ''
  );
}

function getOptions(question = {}, explicit = []) {
  if (Array.isArray(explicit) && explicit.length) return normalizeList(explicit);
  return normalizeList(question?.options || question?.choices || question?.answers || []);
}

function getExpectedAnswer(question = {}, explicit = '') {
  return normalizeText(
    explicit ||
    question?.answer ||
    question?.correctAnswer ||
    question?.expectedAnswer ||
    ''
  );
}

function getLearnerAnswer(explicit = '', question = {}) {
  return normalizeText(explicit || question?.learnerAnswer || question?.studentAnswer || question?.answerAttempt || '', '');
}

function extractPromptAnswer(prompt = '') {
  const text = normalizeText(prompt, '');
  if (!text || /petunjuk|terangkan|jelaskan|kenapa|bantuan|contoh|topik|cadangan|uasa/i.test(text)) return '';
  const directNumber = text.match(/^-?\d+(?:[.,]\d+)?$/)?.[0];
  if (directNumber) return directNumber.replace(',', '.');
  const labelled = text.match(/^(?:jawapan(?:\s+saya)?|saya\s+jawab)\s*(?:ialah|adalah|=|:)?\s*(.+)$/i)?.[1];
  return normalizeText(labelled?.replace(/[.!?]+$/g, ''), '');
}

function getSubjectContext(subject = {}, subjectId = '') {
  const resolvedId = normalizeText(subject?.id || subjectId, '');
  return {
    id: resolvedId,
    title: normalizeText(resolvedId === 'english' ? formatSubjectName(resolvedId) : (subject?.title || subject?.name || formatSubjectName(resolvedId)), resolvedId),
    short: normalizeText(subject?.short || subject?.code || resolvedId.toUpperCase(), resolvedId.toUpperCase()),
    topics: Array.isArray(subject?.topics) ? subject.topics : []
  };
}

function getTopicContext(topic = {}, topicId = '') {
  const resolvedId = String(topic?.id || topicId || '').trim();
  return {
    id: resolvedId,
    title: normalizeText(topic?.title || topic?.name || formatTopicName(resolvedId), resolvedId),
    note: normalizeText(topic?.note || topic?.description || '', ''),
    objective: normalizeText(
      topic?.objective ||
      topic?.learningObjective ||
      topic?.currentLearningObjective ||
      '',
      ''
    ),
    questions: Array.isArray(topic?.questions) ? topic.questions : []
  };
}

function resolveTopicLabel({ subject = null, topic = null, question = null, metadata = null } = {}) {
  const label = getHumanReadableTopic({ subject, topic, question, metadata });
  return normalizeText(label, 'topik semasa');
}

function isSpecificTopicLabel(value = '') {
  const label = normalizeForDialogue(value);
  return Boolean(label && label !== 'topik semasa' && label !== 'latihan ai' && label !== 'latihan adaptif');
}

function resolveLearningFocus({ subject = null, topic = null, weakTopics = [] } = {}) {
  const subjectId = normalizeText(subject?.id, '');
  const subjectTopics = Array.isArray(subject?.topics) ? subject.topics : [];
  const scopedWeakTopic = (Array.isArray(weakTopics) ? weakTopics : []).find(item => (
    item?.topicId && (!subjectId || !item?.subjectId || item.subjectId === subjectId)
  ));
  const matchedWeakTopic = scopedWeakTopic
    ? subjectTopics.find(item => item?.id === scopedWeakTopic.topicId) || {
        id: scopedWeakTopic.topicId,
        title: scopedWeakTopic.topicTitle || scopedWeakTopic.title || ''
      }
    : null;
  const activeTopic = topic?.id && isSpecificTopicLabel(topic?.title || formatTopicName(topic.id)) ? topic : null;
  const firstSubjectTopic = subjectTopics.find(item => (
    item?.id && isSpecificTopicLabel(item?.title || item?.name || formatTopicName(item.id))
  ));
  const selectedTopic = matchedWeakTopic || activeTopic || firstSubjectTopic || null;
  const label = selectedTopic
    ? normalizeText(getHumanReadableTopic({
        subject,
        topic: selectedTopic,
        metadata: {
          topicId: selectedTopic.id || '',
          displayName: selectedTopic.title || selectedTopic.name || ''
        }
      }), '')
    : '';

  return {
    label: isSpecificTopicLabel(label) ? label : '',
    basedOnProgress: Boolean(matchedWeakTopic),
    subjectLabel: normalizeText(subject?.title || formatSubjectName(subjectId), 'pelajaran kamu')
  };
}

function buildLearningRecommendationReply({ studentName = '', subject = null, topic = null, weakTopics = [], studyPlan = null } = {}) {
  const focus = resolveLearningFocus({ subject, topic, weakTopics });
  const nameLead = studentName && studentName !== 'Murid' ? `${studentName}, ` : '';
  const focusCount = Math.max(2, Math.min(5, Number(studyPlan?.focusCount) || 3));
  const shortPlan = `Pelan kita: fahami satu idea, lihat satu contoh, kemudian cuba ${focusCount} soalan ringkas.`;

  if (focus.label) {
    const opening = focus.basedOnProgress
      ? (nameLead
          ? `${nameLead}berdasarkan kemajuan kamu, topik yang paling perlu dikuatkan dalam ${focus.subjectLabel} ialah ${focus.label}.`
          : `Berdasarkan kemajuan kamu, topik yang paling perlu dikuatkan dalam ${focus.subjectLabel} ialah ${focus.label}.`)
      : (nameLead
          ? `${nameLead}saya belum mempunyai cukup rekod latihan untuk menentukan topik yang paling perlu diperkukuh dengan tepat. Hari ini saya cadangkan kita mula dengan ${focus.label} dalam ${focus.subjectLabel}.`
          : `Saya belum mempunyai cukup rekod latihan untuk menentukan topik yang paling perlu diperkukuh dengan tepat. Hari ini saya cadangkan kita mula dengan ${focus.label} dalam ${focus.subjectLabel}.`);
    return {
      text: `${opening} ${shortPlan} Kamu mahu saya mula dengan penerangan atau latihan?`,
      quickReplies: [
        `Boleh ajar saya ${focus.label}?`,
        `Apa itu ${focus.label}?`,
        'Lihat perkara yang perlu saya latih'
      ],
      grounded: true
    };
  }

  return {
    text: nameLead
      ? `${nameLead}hari ini kita boleh mula dengan ${focus.subjectLabel}. Saya boleh memilih satu topik asas, menerangkannya dengan contoh, kemudian memberi latihan ringkas. Kamu mahu saya pilih topik atau kamu mahu pilih sendiri?`
      : `Hari ini kita boleh mula dengan ${focus.subjectLabel}. Saya boleh memilih satu topik asas, menerangkannya dengan contoh, kemudian memberi latihan ringkas. Kamu mahu saya pilih topik atau kamu mahu pilih sendiri?`,
    quickReplies: ['Pilih topik untuk saya', 'Mulakan latihan ringkas', 'Lihat perkara yang perlu saya latih'],
    grounded: Boolean(subject?.id)
  };
}

function inferIntent({ intent = '', prompt = '', isCorrect, question = {} } = {}) {
  const direct = String(intent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (direct) return direct;

  const text = String(prompt ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (/topik\s+lemah|weak_topic|lemah/.test(text)) return 'weak_topic';
  if (/ulang\s*kaji|revision_plan|cadangan ulang kaji|cadangan/.test(text)) return 'revision_plan';
  if (/uasa|summary/.test(text)) return 'uasa_summary';
  if (/beri\s+saya\s+petunjuk|petunjuk|hint/.test(text)) return 'hint';
  if (/kenapa\s+jawapan\s+saya\s+salah|wrong_answer_coaching|salah/.test(text)) return 'wrong_answer_coaching';
  if (/terangkan|jelaskan|soalan ini|question help/.test(text)) return 'question_help';
  if (/beri\s+contoh\s+mudah|contoh\s+mudah|example/.test(text)) return 'example_request';
  if (/betul|correct/.test(text)) return 'correct_answer_reinforcement';
  if (typeof isCorrect === 'boolean') return isCorrect ? 'correct_answer_reinforcement' : 'wrong_answer_coaching';
  if (getQuestionText(question)) return 'question_help';
  return 'general';
}

function buildStandaloneTutorAnswer(prompt = '', subject = {}, hasExerciseContext = false) {
  const text = String(prompt || '').toLocaleLowerCase('ms-MY');
  const subjectId = String(subject?.id || '').toLowerCase();
  if (/taman/.test(text) && /bermain/.test(text)) {
    return '“Taman” ialah kata nama tempat (lokasi). “Bermain” ialah kata kerja (perbuatan).';
  }
  if (subjectId === 'english' && /common\s+noun|noun/.test(text)) {
    return 'A common noun is a general name for a person, animal, place, or thing.';
  }
  const arabicPlain = text.normalize('NFKD').replace(/[\u064b-\u065f\u0670]/gu, '');
  if (subjectId === 'arab' && !hasExerciseContext && /ما\s+معنى\s+كتاب(?:\s|[؟?]|$)/u.test(arabicPlain)) {
    return 'كِتَابٌ شيءٌ له صفحات نقرأ فيها ونتعلّم منها.';
  }
  if (subjectId === 'arab' && /(?:ما\s+معنى\s+الاسم|الاسم|اسم)/u.test(text)) {
    return ARABIC_NOUN;
  }
  if (/(?:apa\s+beza|perbezaan|bezakan|bandingkan).*(?:kata nama am).*(?:kata nama khas)|(?:kata nama am).*(?:dan|dengan|berbanding).*(?:kata nama khas)/.test(text)) {
    return 'Kata nama am ialah nama umum, seperti guru, bandar dan kucing. Kata nama khas pula ialah nama khusus, seperti Cikgu Aina, Melaka dan Si Comel. Perbezaan utamanya ialah kata nama khas merujuk sesuatu yang tertentu dan biasanya bermula dengan huruf besar.';
  }
  if (/(?:apa\s+beza|perbezaan|bezakan|bandingkan).*\btambah\b.*\btolak\b|\btambah\b.*(?:dan|dengan|berbanding).*\btolak\b/.test(text)) {
    return 'Tambah menggabungkan beberapa nilai untuk mendapatkan jumlah keseluruhan. Tolak pula mengeluarkan atau membandingkan nilai untuk mencari baki atau beza.';
  }
  if (/(?:apa\s+beza|perbezaan|bezakan|bandingkan).*\bdarab\b.*\bbahagi\b|\bdarab\b.*(?:dan|dengan|berbanding).*\bbahagi\b/.test(text)) {
    return 'Darab membina jumlah daripada kumpulan yang sama banyak. Bahagi pula memisahkan jumlah kepada kumpulan yang sama banyak atau mencari bilangan dalam setiap kumpulan.';
  }
  if (/kata nama am/.test(text)) return 'Kata nama am ialah nama umum bagi orang, haiwan, benda atau tempat. Contohnya guru, kucing, buku dan sekolah.';
  if (/kata nama khas/.test(text)) return 'Kata nama khas ialah nama khusus bagi orang, tempat atau benda. Biasanya huruf pertama ditulis dengan huruf besar.';
  if (/kata kerja/.test(text)) return 'Kata kerja ialah perkataan yang menunjukkan perbuatan atau keadaan. Contohnya makan, berlari, tidur dan duduk.';
  if (/kata adjektif|kata sifat/.test(text)) return 'Kata adjektif menerangkan sifat atau keadaan orang, haiwan, benda atau tempat. Contohnya cantik, tinggi, rajin dan sejuk.';
  if (/\bbahagi\b|pembahagian/.test(text)) return 'Bahagi bermaksud memisahkan sesuatu sama rata kepada beberapa kumpulan. Contohnya, 12 ÷ 3 bermaksud 12 objek dibahagi kepada 3 kumpulan, jadi setiap kumpulan mendapat 4 objek.';
  if (/tambah|penambahan/.test(text)) return 'Tambah bermaksud menggabungkan dua atau lebih nilai untuk mendapatkan jumlah keseluruhan. Contohnya, 3 + 2 = 5.';
  if (/tolak|penolakan/.test(text)) return 'Tolak bermaksud mencari baki atau beza selepas sebahagian nilai dikeluarkan. Contohnya, 7 − 3 = 4.';
  if (/darab|pendaraban/.test(text)) return 'Darab ialah penambahan berulang bagi kumpulan yang sama banyak. Contohnya, 3 × 4 bermaksud tambah 4 sebanyak 3 kali: 4 + 4 + 4 = 12.';
  return '';
}

function clearUngradedMetadata(response) {
  const empty = { options: [], expectedAnswer: '', learnerAnswer: '', learnerAnswerText: '', acceptedAnswers: [], correctAnswer: '', isCorrect: null, praise: '', tutorMode: '' };
  Object.assign(response, empty, { pedagogicalStepCorrect: null, mathQuestionContext: null });
  if (response.contextUsed) Object.assign(response.contextUsed, empty);
  if (response.sections) Object.assign(response.sections, empty);
  if (response.learningExperience) response.learningExperience = { ...response.learningExperience, mode: '', praise: '' };
  if (response.pendingPedagogicalStep) response.pendingPedagogicalStep = { ...response.pendingPedagogicalStep, expectedAnswers: [] };
  return response;
}

function rankRelevantSubjectTopic(prompt = '', subject = {}) {
  const promptText = normalizeForDialogue(prompt).replace(/_/g, ' ');
  if (!promptText || !Array.isArray(subject?.topics) || !subject.topics.length) return null;
  const ignored = new Set(['apa', 'apakah', 'itu', 'ialah', 'adalah', 'kenapa', 'mengapa', 'bagaimana', 'macam', 'mana', 'boleh', 'ajar', 'saya', 'tentang', 'dan', 'atau', 'yang', 'the', 'what', 'why', 'how']);
  const promptTokens = promptText.split(/\s+/).filter(token => token.length >= 3 && !ignored.has(token));
  let bestTopic = null;
  let bestScore = 0;

  for (const candidate of subject.topics) {
    const title = normalizeForDialogue(candidate?.title || candidate?.name || candidate?.id || '').replace(/_/g, ' ');
    const searchable = normalizeForDialogue([
      candidate?.id,
      candidate?.title,
      candidate?.name,
      candidate?.note,
      candidate?.description,
      ...(Array.isArray(candidate?.learningObjectives) ? candidate.learningObjectives : [])
    ].filter(Boolean).join(' ')).replace(/_/g, ' ');
    if (!searchable) continue;
    let score = title && promptText.includes(title) ? 8 : 0;
    for (const token of promptTokens) {
      if (title.split(/\s+/).includes(token)) score += 3;
      else if (searchable.includes(token)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTopic = candidate;
    }
  }

  return bestScore > 0 ? { topic: getTopicContext(bestTopic, bestTopic?.id), score: bestScore } : null;
}

function findRelevantSubjectTopic(prompt = '', subject = {}) {
  return rankRelevantSubjectTopic(prompt, subject)?.topic || null;
}

function findRelevantLearningContext(prompt = '', availableSubjects = [], preferredSubject = {}) {
  const candidates = [preferredSubject, ...(Array.isArray(availableSubjects) ? availableSubjects : [])];
  const seen = new Set();
  let best = null;
  for (const candidate of candidates) {
    const subject = getSubjectContext(candidate, candidate?.id);
    const identity = subject.id || subject.title;
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    const ranked = rankRelevantSubjectTopic(prompt, subject);
    if (!ranked) continue;
    const preferredBonus = subject.id && subject.id === preferredSubject?.id ? 0.1 : 0;
    const score = ranked.score + preferredBonus;
    if (!best || score > best.score) best = { subject, topic: ranked.topic, score };
  }
  return best;
}

function buildSuggestionList(intent, context = {}) {
  if (context.subject?.id === 'math' && /\+|tambah|jumlah/i.test(context.questionText || '')) {
    return [
      'Kenal pasti nombor yang hendak ditambah.',
      'Tambah sa dahulu, kemudian puluh dan ratus.',
      'Semak jumlah akhir mengikut tempat nilai.'
    ];
  }
  switch (intent) {
    case 'learning_recommendation':
      return [
        'Pilih topik untuk saya.',
        'Mulakan sesi belajar ringkas.',
        'Lihat perkara yang perlu saya latih.'
      ];
    case 'weak_topic':
      return [
        'Latih topik ini sekali lagi.',
        'Cuba 10 soalan ulang kaji.',
        'Minta penjelasan langkah demi langkah.'
      ];
    case 'revision_plan':
      return [
        'Ikut cadangan ulang kaji hari ini.',
        'Mulakan dengan topik yang paling perlu diperkukuh.',
        'Tamatkan dengan satu sesi latihan ringkas.'
      ];
    case 'uasa_summary':
      return [
        'Fokus pada topik yang belum stabil.',
        'Buat Pentaksiran Sumatif selepas ulang kaji.',
        'Semak sejarah UASA untuk lihat perkembangan.'
      ];
    case 'hint':
      return [
        'Cari kata kunci penting dalam soalan.',
        'Baca pilihan jawapan satu demi satu.',
        'Bandingkan dengan jawapan yang kamu fikirkan.'
      ];
    case 'wrong_answer_coaching':
      return [
        'Semak semula langkah yang kamu pilih.',
        'Lihat sama ada soalan meminta maksud atau contoh.',
        'Baca petunjuk dahulu, kemudian cuba lagi.'
      ];
    case 'correct_answer_reinforcement':
      return [
        'Teruskan ke soalan seterusnya.',
        'Cuba soalan yang sedikit lebih mencabar.',
        'Bina keyakinan dengan satu latihan lagi.'
      ];
    case 'question_help':
      if (context.subject?.id === 'math' && /\+|tambah|jumlah/i.test(context.questionText || '')) {
        return [
          'Kenal pasti nombor yang hendak ditambah.',
          'Tambah sa dahulu, kemudian puluh dan ratus.',
          'Semak jumlah akhir mengikut tempat nilai.'
        ];
      }
      return [
        'Cari kata kunci.'
      ];
    case 'example_request':
      return [
        'Baca contoh mudah dulu.',
        'Cari persamaan dengan soalan semasa.',
        'Cuba jawab dengan gaya yang sama.'
      ];
    default:
      return context.questionText ? ['Baca soalan perlahan-lahan.', 'Cari kata kunci penting.', 'Semak jawapan dengan maksud soalan.'] : [];
  }
}

function getCategoryRule(question = {}, topic = {}) {
  const category = detectLearningCategory(question, topic);
  const commonMistakes = CATEGORY_COMMON_MISTAKES[category] || CATEGORY_COMMON_MISTAKES.generic;
  const example = getLearningExamples(question, topic)[0] || '';
  const memoryTip = getLearningMemoryTip(question, topic);
  return {
    category,
    commonMistakes,
    example,
    memoryTip
  };
}

const LEARNER_CHOICE_CATEGORY_WORDS = Object.freeze({
  person: new Set(['ali', 'aiman', 'siti', 'farah', 'murid', 'guru', 'doktor']),
  place: new Set(['padang', 'sekolah', 'hospital', 'kedai', 'pasar', 'taman', 'kelas']),
  animal: new Set(['kucing', 'ayam', 'gajah', 'burung', 'ikan']),
  object: new Set(['baju', 'buku', 'kasut', 'kerusi', 'meja', 'pensel', 'seluar', 'topi']),
  verb: new Set(['berjalan', 'berlari', 'bermain', 'makan', 'membaca', 'menulis', 'tidur']),
  adjective: new Set(['baik', 'besar', 'cantik', 'gembira', 'kecil', 'rajin', 'tinggi'])
});

const LEARNER_CHOICE_CATEGORY_LABELS = Object.freeze({
  person: 'kata nama orang',
  place: 'kata nama tempat',
  animal: 'kata nama haiwan',
  object: 'kata nama benda',
  verb: 'kata kerja',
  adjective: 'kata adjektif'
});

function inferLearnerChoiceCategory(value = '') {
  const choice = normalizeForDialogue(value);
  if (!choice || choice.split(' ').length !== 1) return '';
  return Object.entries(LEARNER_CHOICE_CATEGORY_WORDS)
    .find(([, words]) => words.has(choice))?.[0] || '';
}

function buildObservedCategoryCorrection(targetCategory = '', learnerAnswer = '') {
  if (!learnerAnswer) return '';
  const targetLabel = LEARNER_CHOICE_CATEGORY_LABELS[targetCategory] || '';
  const observedCategory = inferLearnerChoiceCategory(learnerAnswer);
  const observedLabel = LEARNER_CHOICE_CATEGORY_LABELS[observedCategory] || '';
  if (targetLabel && observedLabel && observedCategory !== targetCategory) {
    return `Kamu memilih ${observedLabel}, tetapi soalan meminta ${targetLabel}.`;
  }
  if (targetLabel) return `Jawapan itu belum menunjukkan ${targetLabel} yang diminta.`;
  return 'Semak semula kategori perkataan yang diminta oleh soalan.';
}

function buildQuestionSpecificFallback({ questionText = '', instruction = '', expectedAnswer = '', acceptedAnswers = [], options = [], learnerAnswer = '', category = 'generic' } = {}) {
  const stem = questionText || 'soalan ini';
  const accepted = acceptedAnswers.length ? acceptedAnswers.join(' atau ') : expectedAnswer;
  const optionText = options.length ? ` Pilihan yang diberi ialah ${options.join(', ')}.` : '';
  if (/wah|lukisan|tanda seru|ayat seruan/i.test(`${stem} ${instruction}`)) {
    return 'Perkataan “Wah” dan tanda seru menunjukkan rasa kagum. Contoh ayat seruan: “Wah, cantiknya lukisan kamu!”';
  }
  if (accepted) return `Untuk ${stem}, cari petunjuk dalam arahan${instruction ? ` “${instruction}”` : ''}. Jawapan yang diterima ialah ${accepted}.${optionText}`;
  if (learnerAnswer) return `Semak jawapan “${learnerAnswer}” dengan ayat penuh dalam ${stem}.${optionText}`;
  if (category !== 'generic') return `Baca ${stem} perlahan-lahan dan cari perkataan yang menunjukkan topik ini.${optionText}`;
  return `Baca ${stem} perlahan-lahan. Jika maklumat belum cukup, semak arahan dan pilihan jawapan dahulu.${optionText}`;
}

function extractBinaAyatTokens(text = '') {
  const source = normalizeText(text, '');
  const word = source.match(/kata\s+[“"']([^”"']+)[”"']/i)?.[1] || '';
  const name = source.match(/nama\s+[“"']([^”"']+)[”"']/i)?.[1] || '';
  return { word: normalizeText(word, ''), name: normalizeText(name, '') };
}

function buildCrossSubjectGuidance({ subjectId = '', topicId = '', topicTitle = '', questionText = '', instruction = '', category = 'generic' } = {}) {
  const subject = String(subjectId).toLowerCase();
  const topic = `${topicId} ${topicTitle}`.toLowerCase();
  const stem = normalizeText(questionText, 'soalan ini');
  const clueMatch = stem.match(/(?:([^\s.,!?؟]+)\s+)?_+\s*([^.!?؟]*)/u);
  const blankClue = (clueMatch?.[1] || clueMatch?.[2] || '').trim();
  if (subject === 'bm') {
    if (category === 'person') return { hint: 'Cari perkataan yang menamakan orang.', steps: ['Kenal pasti bahawa soalan meminta kata nama orang.', 'Singkirkan perkataan yang menunjukkan tempat, benda, sifat atau perbuatan.', 'Semak pilihan dengan ayat semasa.'], example: 'Gunakan kategori orang yang diminta dalam soalan semasa.' };
    if (category === 'place') return { hint: 'Cari perkataan yang menamakan tempat.', steps: ['Kenal pasti bahawa soalan meminta kata nama tempat.', 'Singkirkan perkataan yang menunjukkan orang, benda, sifat atau perbuatan.', 'Semak pilihan dengan ayat semasa.'], example: 'Gunakan kategori tempat yang diminta dalam soalan semasa.' };
    if (category === 'animal') return { hint: 'Cari perkataan yang menamakan haiwan.', steps: ['Kenal pasti bahawa soalan meminta kata nama haiwan.', 'Singkirkan perkataan daripada kategori lain.', 'Semak pilihan dengan ayat semasa.'], example: 'Gunakan kategori haiwan yang diminta dalam soalan semasa.' };
    if (category === 'object') {
      const wornObject = /pakai|dipakai|pakaian/i.test(`${stem} ${instruction}`);
      return {
        hint: wornObject ? 'Cari kata nama benda yang dipakai seperti yang diterangkan dalam soalan.' : 'Cari perkataan yang menamakan benda.',
        steps: wornObject
          ? ['Kenal pasti bahawa soalan meminta benda yang dipakai.', 'Singkirkan nama orang, tempat dan perbuatan.', 'Semak kegunaan benda itu dengan ayat semasa.']
          : ['Kenal pasti bahawa soalan meminta kata nama benda.', 'Singkirkan nama orang, tempat, sifat dan perbuatan.', 'Semak pilihan dengan ayat semasa.'],
        example: wornObject ? 'Gunakan kategori benda yang dipakai, tanpa meneka jawapan.' : 'Gunakan kategori benda yang diminta dalam soalan semasa.'
      };
    }
    if (category === 'verb') return { hint: 'Cari kata kerja yang menunjukkan perbuatan.', steps: ['Kenal pasti perbuatan yang berlaku dalam ayat.', 'Singkirkan nama orang, tempat dan benda.', 'Semak kata kerja itu dengan subjek ayat.'], example: 'Gunakan perbuatan yang disebut dalam soalan semasa.' };
    if (category === 'adjective') return { hint: 'Cari kata adjektif yang menerangkan sifat atau keadaan.', steps: ['Kenal pasti sifat atau keadaan yang diterangkan.', 'Singkirkan nama dan perbuatan.', 'Semak kata adjektif itu dengan ayat semasa.'], example: 'Gunakan sifat atau keadaan daripada soalan semasa.' };
    if (/kata_nama_am|kata nama am/.test(topic)) return { hint: 'Bezakan nama umum dengan nama khas dalam ayat.', steps: ['Cari perkataan yang menamakan orang, haiwan, benda atau tempat.', 'Tentukan sama ada nama itu umum atau khusus.', 'Semak pilihan dengan maksud ayat.'], example: 'Gunakan nama benda atau tempat daripada ayat semasa.' };
    if (/kata_nama_khas|kata nama khas/.test(topic)) return { hint: 'Cari nama khusus dan semak penggunaan huruf besar.', steps: ['Kenal pasti nama orang, tempat atau benda tertentu.', 'Bezakan nama khusus daripada nama umum.', 'Semak huruf besar pada nama khas.'], example: 'Gunakan nama khusus yang terdapat dalam ayat.' };
    if (/kata_ganti_nama|kata ganti nama/.test(topic)) return { hint: 'Lihat siapa yang bercakap atau dirujuk sebelum memilih kata ganti nama.', steps: ['Kenal pasti orang dalam ayat.', 'Pilih kata ganti nama yang sepadan.', 'Baca semula ayat supaya maksudnya jelas.'], example: 'Gunakan kata ganti nama daripada ayat semasa.' };
    if (/kata_kerja|kata kerja/.test(topic)) return { hint: 'Cari perkataan yang menunjukkan perbuatan dalam ayat.', steps: ['Baca ayat dengan teliti.', 'Kenal pasti perbuatan yang dilakukan.', 'Padankan kata kerja dengan subjek.'], example: 'Gunakan perbuatan yang disebut dalam ayat.' };
    if (/simpulan/.test(topic)) return { hint: 'Cari maksud kiasan simpulan bahasa, bukan makna setiap perkataan secara literal.', steps: ['Kenal pasti simpulan bahasa.', 'Fikirkan maksud kiasannya.', 'Padankan dengan situasi dalam soalan.'], example: 'Gunakan situasi daripada soalan semasa.' };
    return { hint: `Fokus pada kemahiran ${topicTitle || 'Bahasa Melayu'} yang diminta dalam soalan.`, steps: ['Baca arahan dan ayat dengan teliti.', 'Kenal pasti unsur Bahasa Melayu yang diuji.', 'Semak jawapan dengan maksud ayat.'], example: 'Gunakan perkataan dan ayat daripada soalan semasa.' };
  }
  if (subject === 'math') {
    const numbers = [...stem.matchAll(/\b\d+(?:\.\d+)?\b/g)].map(match => match[0]).slice(0, 3);
    if (/nombor\s+sebelum|sebelum\s+\d|nombor\s+terdahulu/i.test(stem)) {
      return {
        hint: 'Nombor sebelum ialah nombor yang datang tepat satu langkah lebih awal.',
        steps: [
          `Kenal pasti nombor rujukan: ${numbers[0] || 'nombor yang diberi'}.`,
          'Undur satu langkah dengan menolak 1.',
          'Semak bahawa jawapan kamu datang tepat sebelum nombor rujukan.'
        ],
        example: 'Untuk mencari nombor sebelum, gunakan nombor rujukan − 1.'
      };
    }
    if (/nombor\s+selepas|selepas\s+\d|nombor\s+berikutnya/i.test(stem)) {
      return {
        hint: 'Nombor selepas ialah nombor yang datang tepat satu langkah kemudian.',
        steps: [
          `Kenal pasti nombor rujukan: ${numbers[0] || 'nombor yang diberi'}.`,
          'Maju satu langkah dengan menambah 1.',
          'Semak bahawa jawapan kamu datang tepat selepas nombor rujukan.'
        ],
        example: 'Untuk mencari nombor selepas, gunakan nombor rujukan + 1.'
      };
    }
    if (/\+|tambah|jumlah/i.test(`${topic} ${stem}`)) {
      return {
        hint: 'Gabungkan nilai mengikut tempat nilai: ratus, puluh dan sa.',
        steps: [
          `Kenal pasti nombor yang hendak ditambah: ${numbers.join(' dan ') || 'nombor yang diberi'}.`,
          'Tambah sa dahulu, kemudian puluh dan ratus.',
          'Semak jumlah akhir supaya tiada tempat nilai tertinggal.'
        ],
        example: 'Susun nombor mengikut tempat nilai sebelum menambah.'
      };
    }
    const operation = /darab|×|x\s*\d|kali/i.test(`${topic} ${stem}`) ? 'darab' : /tolak|baki|beza/i.test(`${topic} ${stem}`) ? 'tolak' : /tambah|jumlah|lagi/i.test(`${topic} ${stem}`) ? 'tambah' : /bahagi/i.test(`${topic} ${stem}`) ? 'bahagi' : 'operasi';
    return { hint: `Kenal pasti operasi ${operation}${numbers.length ? ` dan susun nombor ${numbers.join(' dan ')}` : ''}.`, steps: [`Tulis nombor penting daripada soalan: ${numbers.join(', ') || 'nombor yang diberi'}.`, `Gunakan operasi ${operation} satu langkah pada satu masa.`, 'Semak unit dan anggaran jawapan.'], example: 'Gunakan nombor dalam soalan semasa, bukan contoh lain.' };
  }
  if (subject === 'english') {
    const form = /^(?:person|place)$/.test(category) ? `${category} noun` : topic.includes('verb') ? 'verb' : topic.includes('noun') ? 'noun' : topic.includes('adjective') ? 'adjective' : 'language form';
    return {
      hint: `Find the ${form} clue.`,
      steps: [blankClue ? `Use “${blankClue}” as a clue for a ${form}.` : `Find the ${form} clue.`]
    };
  }
  if (subject === 'sains') return { hint: `Fokus pada ciri atau proses untuk topik ${topicTitle || 'Sains'} dalam soalan ini.`, steps: ['Kenal pasti benda hidup atau bahan yang disebut.', 'Perhatikan ciri, fungsi atau perubahan yang diminta.', 'Padankan bukti dengan konsep Sains yang tepat.'], example: 'Gunakan pemerhatian daripada soalan semasa.' };
  if (subject === 'islam') return { hint: `Cari kata kunci yang menunjukkan konsep ${topicTitle || 'Pendidikan Islam'} dan pilih amalan atau fakta yang tepat.`, steps: ['Baca istilah penting dalam soalan.', 'Hubungkan istilah itu dengan pelajaran topik semasa.', 'Semak jawapan supaya tepat dan beradab.'], example: 'Gunakan contoh daripada topik semasa.' };
  if (subject === 'arab') {
    const form = category === 'place' ? 'اسم مكان' : category === 'person' ? 'اسم شخص' : 'الكلمة المطلوبة';
    return { hint: `ابحث عن ${form}.`, steps: [blankClue ? `«${blankClue}» دليل على ${form}.` : `حدّد ${form} في السؤال.`] };
  }
  if (subject === 'pj' || subject === 'pk') return { hint: `Fokus pada tindakan, pergerakan atau amalan selamat untuk topik ${topicTitle || 'kesihatan'} dalam soalan ini.`, steps: ['Kenal pasti aktiviti atau situasi.', 'Pilih tindakan yang selamat dan sesuai.', 'Semak kesannya kepada pergerakan atau kesihatan.'], example: 'Gunakan situasi yang diberikan dalam soalan.' };
  return null;
}

function isGenericTutorContent(value = '') {
  const text = normalizeText(value, '').toLowerCase();
  return !text || /jawapan yang tepat|cari kata kunci(?: penting)? dan baca ayat penuh|cari perkataan petunjuk dan baca ayat pendek|baca kata kunci|padang$|^ali$/.test(text);
}

function buildContextualSections({
  intent,
  questionText,
  instruction,
  options,
  subject,
  topic,
  topicLabel,
  question,
  answer,
  learnerAnswer,
  isCorrect,
  attemptCount,
  hintsUsed,
  coachResponse,
  studyPlan,
  readiness,
  adaptiveRecommendation,
  profile,
  explanationMode,
  currentLearningObjective,
  weakTopics = [],
  strongTopics = [],
  guided = null,
  history = []
}) {
  const categoryRule = getCategoryRule(question, topic);
  const isEnglishSubject = subject?.id === 'english';
  const subjectLabel = subject?.id === 'english' ? 'Bahasa Inggeris' : (subject?.title || formatSubjectName(subject?.id));
  const resolvedQuestion = questionText || getQuestionText(question);
  const resolvedInstruction = instruction || getInstruction(question);
  const resolvedOptions = options.length ? options : getOptions(question);
  const expectedAnswer = getExpectedAnswer(question);
  const isBinaAyat = subject?.id === 'bm' && /bina\s+ayat|bina_ayat/i.test(`${topic?.id || ''} ${topic?.title || ''} ${resolvedQuestion}`);
  const binaTokens = isBinaAyat ? extractBinaAyatTokens(`${resolvedInstruction} ${resolvedQuestion}`) : { word: '', name: '' };
  const binaFocus = isBinaAyat && (binaTokens.name || binaTokens.word)
    ? `Bina satu ayat lengkap menggunakan ${binaTokens.name ? `nama “${binaTokens.name}”` : 'nama yang diberi'} dan ${binaTokens.word ? `kata kerja “${binaTokens.word}”` : 'kata yang diberi'}.`
    : '';
  const binaHint = binaFocus
    ? `Cuba mulakan dengan: ${binaTokens.name || 'Nama'} ${binaTokens.word || 'kata kerja'}...`
    : '';
  const binaSteps = binaFocus
    ? [
        `Mulakan ayat dengan nama “${binaTokens.name || 'nama yang diberi'}”.`,
        `Gunakan kata “${binaTokens.word || 'yang diberi'}”.`,
        'Tambahkan maklumat supaya ayat lengkap.',
        'Akhiri ayat dengan tanda noktah.'
      ]
    : [];
  const subjectGuidance = buildCrossSubjectGuidance({ subjectId: subject?.id, topicId: topic?.id, topicTitle: topic?.title, questionText: resolvedQuestion, instruction: resolvedInstruction, category: categoryRule.category });
  const acceptedAnswers = getAcceptedAnswers(question);
  const learner = getLearnerAnswer(learnerAnswer, question);
  const answerRevealPolicy = guided?.answerRevealPolicy || getAnswerRevealPolicy({
    isCorrect,
    attemptCount,
    hintsUsed,
    explanationMode,
    explicitAnswerRequest: explanationMode === 'show_answer'
  });
  const revealAnswer = answerRevealPolicy.canRevealAnswer;
  const protectedAnswers = [expectedAnswer, ...acceptedAnswers].filter(Boolean);
  const answerSafeText = (candidates, fallback) => revealAnswer
    ? normalizeText((Array.isArray(candidates) ? candidates : [candidates]).find(Boolean) || fallback)
    : selectAnswerSafeText(candidates, protectedAnswers, fallback);
  const explanationText = normalizeText(
    coachResponse?.explanation?.explanation ||
    coachResponse?.explanation ||
    coachResponse?.simpleExplanation ||
    question?.explanation ||
    ''
  );
  const simpleExplanationText = normalizeText(
    coachResponse?.explanation?.simpleExplanation ||
    coachResponse?.simpleExplanation ||
    explanationText ||
    question?.simpleExplanation ||
    ''
  );
  const hintText = answerSafeText([
    binaHint,
    subjectGuidance?.hint,
    guided?.hint,
    coachResponse?.hint?.hint,
    coachResponse?.hint,
    question?.hint,
    buildQuestionSpecificFallback({
      questionText: resolvedQuestion,
      instruction: resolvedInstruction,
      expectedAnswer: revealAnswer ? expectedAnswer : '',
      acceptedAnswers: revealAnswer ? acceptedAnswers : [],
      options: resolvedOptions,
      learnerAnswer: learner,
      category: categoryRule.category
    })
  ], 'Baca soalan perlahan-lahan dan cari satu kata kunci penting.');
  const praiseText = normalizeText(
    guided?.praise ||
    coachResponse?.praise?.praise ||
    coachResponse?.praise ||
    'Bagus! Teruskan usaha kamu.'
  );
  const coachKnowledge = coachResponse?.knowledge || {};
  const steps = normalizeList(
    binaSteps.length ? binaSteps :
    (subjectGuidance ? subjectGuidance.steps :
    coachResponse?.steps ||
    coachKnowledge?.steps ||
    coachKnowledge?.learningSteps ||
    INTENT_STEPS[intent] ||
    INTENT_STEPS.general)
  );
  const commonMistake = answerSafeText([
    isBinaAyat && !isCorrect
      ? `${binaTokens.name ? `Nama “${binaTokens.name}” sudah ada. ` : ''}${binaTokens.word ? `Kata “${binaTokens.word}” sudah ada. ` : ''}Tambah objek, tempat atau tujuan, kemudian semak huruf besar dan tanda noktah.` :
      (learner ? (
        buildObservedCategoryCorrection(categoryRule.category, learner) ||
        coachKnowledge?.commonMistakes?.[0] ||
        coachResponse?.commonMistakes?.[0] ||
        (categoryRule.category !== 'generic' ? categoryRule.commonMistakes?.[0] : '')
      ) : ''),
    buildQuestionSpecificFallback({ questionText: resolvedQuestion, instruction: resolvedInstruction, options: resolvedOptions, learnerAnswer: learner, category: categoryRule.category })
  ], 'Semak semula perkara utama yang diminta oleh soalan.');
  const example = normalizeText(
    subjectGuidance?.example ||
    coachKnowledge?.examples?.[0] ||
    coachResponse?.examples?.[0] ||
    (categoryRule.example && categoryRule.category !== 'generic' ? categoryRule.example : buildQuestionSpecificFallback({ questionText: resolvedQuestion, instruction: resolvedInstruction, expectedAnswer, acceptedAnswers, options: resolvedOptions, learnerAnswer: learner, category: categoryRule.category }))
  );
  const memoryTip = normalizeText(
    coachKnowledge?.memoryTips?.[0] ||
    coachResponse?.memoryTips?.[0] ||
    categoryRule.category !== 'generic' ? categoryRule.memoryTip : buildQuestionSpecificFallback({ questionText: resolvedQuestion, instruction: resolvedInstruction, expectedAnswer, acceptedAnswers, options: resolvedOptions, learnerAnswer: learner, category: categoryRule.category })
  );
  const answerSafeList = candidates => normalizeList(candidates)
    .map(candidate => selectAnswerSafeText([candidate], protectedAnswers, ''))
    .filter(Boolean);
  const knowledgeExampleCandidates = answerSafeList([
    coachKnowledge?.examples,
    coachKnowledge?.extraExamples,
    coachKnowledge?.workedExamples
  ]);
  const reviewedExampleSelection = coachResponse?.ready && coachKnowledge?.source === 'knowledge'
    ? selectApprovedTeachingExamples({
        subjectId: subject?.id,
        topicId: topic?.id,
      candidates: knowledgeExampleCandidates,
      category: resolvedQuestion ? categoryRule.category : ''
      })
    : { examples: [], provenance: null };
  const verifiedExamples = answerSafeList(reviewedExampleSelection.examples);
  const isBmCommonNoun = subject?.id === 'bm' && /kata_nama_am|kata nama am/iu.test(`${topic?.id} ${topic?.title}`);
  const topicPedagogy = isBmCommonNoun && !resolvedQuestion
    ? {
        explanations: [topic?.note],
        alternatives: [topic?.note],
        steps: [
          'Pilih satu perkataan dan tanya apa yang dinamakan.',
          'Jika perkataan menamakan orang, haiwan, benda atau tempat, itu kata nama.'
        ]
      }
    : subject?.id === 'arab' && topic?.id === 'mufradat' && !resolvedQuestion
      ? {
          explanations: [ARABIC_NOUN],
          alternatives: ['الاسم يسمّي إنسانًا أو حيوانًا أو مكانًا أو شيئًا.'],
          steps: ['اقرأ من اليمين ثم افهم المعنى.'],
          checks: ['هل هي شخص أم مكان أم شيء؟']
        }
    : null;
  const activeTeaching = resolvedQuestion && subjectGuidance;
  const pedagogicalContent = {
    grounded: Boolean(
      coachResponse?.ready ||
      question?.explanation ||
      question?.simpleExplanation ||
      topic?.note ||
      subjectGuidance
    ),
    explanations: answerSafeList(topicPedagogy?.explanations || (activeTeaching
      ? [subjectGuidance.hint, simpleExplanationText, explanationText, currentLearningObjective]
      : [simpleExplanationText, explanationText, topic?.note, currentLearningObjective])),
    examples: verifiedExamples,
    verifiedExamples,
    verifiedExampleProvenance: reviewedExampleSelection.provenance,
    alternatives: answerSafeList(topicPedagogy?.alternatives || (activeTeaching || isEnglishSubject
      ? subjectGuidance.steps
      : [commonMistake, memoryTip, coachKnowledge?.memoryTips, coachResponse?.memoryTips])),
    steps: answerSafeList(topicPedagogy?.steps || steps),
    checkQuestions: answerSafeList(isBmCommonNoun ? ['Orang, haiwan, tempat atau benda?'] : topicPedagogy?.checks || [
      coachKnowledge?.followUpQuestions,
      coachResponse?.followUpQuestions,
      guided?.guidingQuestion
    ])
  };
  const learningObjective = normalizeText(currentLearningObjective || topic?.objective || topic?.learningObjective || topic?.currentLearningObjective || '', '');
  const weakTopic = Array.isArray(weakTopics) && weakTopics.length
    ? weakTopics[0]
    : Array.isArray(profile?.weakTopics)
      ? profile.weakTopics[0] || null
      : null;
  const strongTopic = Array.isArray(strongTopics) && strongTopics.length
    ? strongTopics[0]
    : Array.isArray(profile?.strongTopics)
      ? profile.strongTopics[0] || null
      : null;
  const weakTopicLabel = weakTopic
    ? normalizeText(
        getHumanReadableTopic({
          subject: { id: weakTopic.subjectId || subject?.id || '' },
          topic: { id: weakTopic.topicId || '' },
          metadata: {
            topicId: weakTopic.topicId || '',
            displayName: weakTopic.topicTitle || weakTopic.title || ''
          }
        }) || formatTopicName(weakTopic.topicId || ''),
        ''
      )
    : '';
  const strongTopicLabel = strongTopic
    ? normalizeText(
        getHumanReadableTopic({
          subject: { id: strongTopic.subjectId || subject?.id || '' },
          topic: { id: strongTopic.topicId || '' },
          metadata: {
            topicId: strongTopic.topicId || '',
            displayName: strongTopic.topicTitle || strongTopic.title || ''
          }
        }) || formatTopicName(strongTopic.topicId || ''),
        ''
      )
    : '';
  const recommendationReason = normalizeText(
    adaptiveRecommendation?.reason ||
    studyPlan?.notes ||
    readiness?.message ||
    ''
  );
  const isHintIntent = intent === 'hint';
  const safeHintLead = sanitizeChildFacingText(
    hintText || 'Cari kata kunci penting dalam soalan.'
  );

  const instructionCore = resolvedInstruction.replace(/[.!?]+$/g, '').trim();
  const friendlyInstruction = instructionCore
    ? instructionCore.charAt(0).toLocaleLowerCase('ms-MY') + instructionCore.slice(1)
    : '';
  const friendlyQuestionSummary = binaFocus
    ? binaFocus
    : friendlyInstruction
    ? `Soalan ini meminta kamu ${friendlyInstruction}.`
    : topicLabel && topicLabel !== 'topik semasa'
      ? `Mari kita faham soalan tentang ${topicLabel}.`
      : 'Mari kita faham soalan ini bersama-sama.';

  const summary = sanitizeChildFacingText(
    isHintIntent
      ? [
          friendlyInstruction ? `Cuba ikut arahan: ${friendlyInstruction}.` : '',
          topicLabel && topicLabel !== 'topik semasa' ? `Fokus pada ${topicLabel}.` : ''
        ].filter(Boolean).join(' ')
      : intent === 'weak_topic'
        ? [
            weakTopicLabel ? `${weakTopicLabel} perlu latihan tambahan.` : 'Ada topik yang masih perlu latihan tambahan.',
            resolvedInstruction ? `Arahan: ${resolvedInstruction}.` : '',
            subjectLabel ? `Subjek: ${subjectLabel}.` : ''
          ].filter(Boolean).join(' ')
        : intent === 'learning_recommendation'
          ? 'Saya akan mencadangkan satu fokus pembelajaran yang sesuai untuk hari ini.'
        : intent === 'revision_plan'
          ? [
              'Cadangan ulang kaji hari ini memfokuskan latihan yang perlu dikuatkan.',
              recommendationReason ? `Sebab: ${recommendationReason}.` : '',
              strongTopicLabel ? `Topik yang sudah kuat: ${strongTopicLabel}.` : ''
            ].filter(Boolean).join(' ')
          : intent === 'uasa_summary'
            ? [
                'Ringkasan UASA menunjukkan kemajuan dan topik yang perlu diperkemas.',
                recommendationReason ? `Butiran: ${recommendationReason}.` : '',
                weakTopicLabel ? `Fokus seterusnya: ${weakTopicLabel}.` : ''
              ].filter(Boolean).join(' ')
            : [
                friendlyQuestionSummary,
                resolvedQuestion ? `Lihat ayat ini: ${resolvedQuestion}.` : ''
              ].filter(Boolean).join(' ')
  ) || (
    isHintIntent
      ? `Mari kita lihat petunjuk untuk ${topicLabel || 'topik semasa'}.`
      : `Mari kita lihat topik ${topicLabel || 'topik semasa'}.`
  );

  const whyCorrect = sanitizeChildFacingText(
    !revealAnswer && guided?.stage !== 'correct_first_try' && guided?.stage !== 'correct_after_support'
      ? (guided?.guidingQuestion || guided?.misconception?.childSafeLabel || hintText)
      : isHintIntent
      ? 'Fokus pada petunjuk ini.'
      : explanationText ||
        simpleExplanationText ||
        (revealAnswer && expectedAnswer ? `Berdasarkan soalan “${resolvedQuestion}”, jawapan yang diterima ialah ${acceptedAnswers.length ? acceptedAnswers.join(' atau ') : expectedAnswer}.` : buildQuestionSpecificFallback({ questionText: resolvedQuestion, instruction: resolvedInstruction, expectedAnswer, acceptedAnswers, options: resolvedOptions, learnerAnswer: learner, category: categoryRule.category }))
  );

  const hint = sanitizeChildFacingText(
    subject?.id === 'english' && intent === 'wrong_answer_coaching' && !revealAnswer
      ? 'Lihat subjek dalam ayat. Untuk he atau she, kata kerja biasanya menerima -s.'
      : safeHintLead
  );

  const coachMessage = sanitizeTutorText(
    isCorrect
      ? praiseText
      : intent === 'wrong_answer_coaching'
        ? `Jawapan kamu belum tepat. ${guided?.misconception?.childSafeLabel || 'Cuba semak semula bersama.'}`
        : intent === 'hint'
          ? 'Cuba guna petunjuk ini untuk mencari jawapan.'
          : intent === 'weak_topic'
            ? 'Mari kukuhkan topik ini sedikit demi sedikit.'
            : intent === 'revision_plan'
              ? 'Ikut cadangan ulang kaji ini untuk kemajuan yang lebih baik.'
              : intent === 'uasa_summary'
                ? 'Semak ringkasan ini untuk lihat perkembangan kamu.'
                : 'Saya akan bantu langkah demi langkah.'
  );

  const learnerLabel = learner ? `Kamu jawab “${learner}”.` : '';
  const firstStep = steps[0] || 'baca soalan dan cari maklumat penting';
  const dialogueCandidates = intent === 'hint'
    ? revealAnswer && expectedAnswer
      ? [
          `Selepas tiga cubaan, kita semak bersama. Jawapannya ialah ${expectedAnswer}. ${simpleExplanationText || 'Jawapan itu menepati kehendak soalan.'}`
        ]
      : answerRevealPolicy.stage === 'strong_hint'
        ? [
            `Petunjuk lebih jelas: ${safeHintLead} ${guided?.guidingQuestion || `Mulakan dengan ${firstStep}.`}`
          ]
        : [
            `${safeHintLead} Cuba fikir dahulu sebelum memilih jawapan.`
          ]
    : intent === 'wrong_answer_coaching'
      ? [
          `${learnerLabel} Belum tepat, tetapi kita boleh baiki bersama. ${commonMistake || 'Semak semula maksud soalan.'}`
        ]
      : intent === 'correct_answer_reinforcement'
        ? [
            `${coachMessage} ${revealAnswer && expectedAnswer ? `Jawapan kamu, ${expectedAnswer}, tepat kerana ${simpleExplanationText || 'sepadan dengan kehendak soalan'}.` : 'Boleh terangkan kepada saya bagaimana kamu mendapat jawapan itu?'}`
          ]
        : intent === 'question_help'
          ? [
              `${friendlyQuestionSummary} Mula dengan langkah kecil: ${firstStep}.`
            ]
          : [
              `${friendlyQuestionSummary} Saya bantu satu langkah pada satu masa.`
            ];
  const englishDialogueCandidates = intent === 'hint'
    ? revealAnswer && expectedAnswer
      ? [
          `After three attempts, let us check it together. The answer is ${expectedAnswer}. It matches what the question asks for.`
        ]
      : answerRevealPolicy.stage === 'strong_hint'
        ? [
            `Here is a stronger clue: ${safeHintLead} ${guided?.guidingQuestion || `Start with this step: ${firstStep}.`}`
          ]
        : [
            `${safeHintLead} Think before choosing an answer.`
          ]
    : intent === 'wrong_answer_coaching'
      ? [
          `${learner ? `You answered “${learner}”. ` : ''}That is not correct yet, but we can improve it together. ${commonMistake}`
        ]
      : intent === 'correct_answer_reinforcement'
        ? [
            `${coachMessage} ${revealAnswer && expectedAnswer ? `Your answer, ${expectedAnswer}, matches the question.` : 'Can you tell me how you found it?'}`
          ]
        : intent === 'question_help'
          ? [
              `Let us break this question into a smaller step. Start by doing this: ${firstStep}.`
            ]
          : [
              'Let us understand this question together, one step at a time.'
            ];
  const shortText = sanitizeTutorText(pickFreshDialogue(isEnglishSubject ? englishDialogueCandidates : dialogueCandidates, history));

  const text = sanitizeTutorText([
    summary,
    isHintIntent ? hint : '',
    !isHintIntent && intent === 'wrong_answer_coaching' ? commonMistake || whyCorrect : (!isHintIntent ? whyCorrect : ''),
    steps[0] ? `Langkah pertama: ${steps[0].replace(/[.!?؟]+$/u, '')}.` : '',
    !isHintIntent && revealAnswer && example ? `Contoh mudah: ${example}.` : '',
    !isHintIntent && revealAnswer && memoryTip ? `Tip ingatan: ${memoryTip}.` : '',
    revealAnswer && expectedAnswer ? `Jawapan betul: ${expectedAnswer}.` : '',
    coachMessage,
    !isHintIntent && guided?.nextAction ? `Seterusnya: ${guided.nextAction}.` : ''
  ].filter(Boolean).join(' ')) || DEFAULT_FALLBACK;

  const sections = {
    summary,
    whyCorrect,
    hint,
    steps: revealAnswer ? steps : steps.slice(0, answerRevealPolicy.stage === 'strong_hint' ? 2 : 1),
    commonMistake,
    example: revealAnswer ? example : '',
    memoryTip: revealAnswer ? memoryTip : '',
    correctAnswer: revealAnswer ? expectedAnswer : '',
    acceptedAnswers: revealAnswer ? acceptedAnswers : [],
    coachMessage,
    learningObjective,
    questionText: resolvedQuestion,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    subject: subjectLabel,
    topic: topicLabel,
    pedagogicalContent
  };

  const contextUsed = {
    hasQuestion: Boolean(resolvedQuestion),
    hasInstruction: Boolean(resolvedInstruction),
    optionCount: resolvedOptions.length,
    questionText: resolvedQuestion,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    subject: subjectLabel,
    topic: topicLabel,
    expectedAnswer: revealAnswer ? expectedAnswer : '',
    acceptedAnswers: revealAnswer ? acceptedAnswers : [],
    learnerAnswer: learner,
    isCorrect,
    attemptCount: Number(attemptCount) || 0,
    hintsUsed: Number(hintsUsed) || 0,
    explanationMode: normalizeText(explanationMode, ''),
    currentLearningObjective: learningObjective,
    subjectId: subject?.id || '',
    topicId: topic?.id || '',
    intent,
    hasCoachData: Boolean(coachResponse?.ready),
    tutorMode: guided?.mode || '',
    supportStage: guided?.stage || '',
    misconceptionType: guided?.misconception?.supported === true ? guided.misconception.type : ''
  };

  return {
    text,
    shortText,
    sections,
    contextUsed,
    guided
  };
}

function buildConversationalTeachingReply({
  studentTurn = null,
  standaloneAnswer = '',
  contextBundle = null,
  studentName = '',
  subject = null,
  topic = null,
  questionText = '',
  weakTopics = [],
  studyPlan = null,
  getLocalizedTeachingReplies
} = {}) {
  if (!studentTurn) return null;
  const sections = contextBundle?.sections || {};
  const contextTopicId = normalizeText(contextBundle?.contextUsed?.topicId || '', '');
  const isCurrentContextTopic = Boolean(topic?.id && (!contextTopicId || topic.id === contextTopicId));
  const steps = isCurrentContextTopic ? normalizeList(sections.steps).slice(0, 3) : [];
  const topicLabel = normalizeText(topic?.title || (isCurrentContextTopic ? sections.topic : ''), 'topik ini');
  const topicNote = normalizeText(topic?.note || '', '');
  const explanation = normalizeText(topicNote || (isCurrentContextTopic ? sections.whyCorrect || sections.learningObjective : ''), '');
  const example = normalizeText(isCurrentContextTopic ? sections.example || '' : '', '');
  const learningAnchor = standaloneAnswer || topicNote || explanation;
  const dialogueLanguage = subject?.id === 'arab' ? 'ar' : subject?.id === 'english' ? 'en' : 'ms';
  const commonReplies = getLocalizedTeachingReplies(dialogueLanguage);
  const sentence = (value, prefix = '') => {
    const safeValue = normalizeText(value, '').replace(/[.!?؟]+$/u, '');
    return safeValue ? `${prefix}${safeValue}.` : '';
  };
  const withReplies = (text, quickReplies = commonReplies, grounded = true) => ({
    text: sanitizeTutorText(text),
    quickReplies: normalizeList(quickReplies).slice(0, 3),
    grounded
  });

  switch (studentTurn.intent) {
    case 'learning_recommendation': {
      const recommendation = buildLearningRecommendationReply({ studentName, subject, topic, weakTopics, studyPlan });
      return withReplies(recommendation.text, recommendation.quickReplies, recommendation.grounded);
    }
    case 'general':
      if (dialogueLanguage === 'en') return withReplies(
        studentTurn.messageType === 'social'
          ? 'Hello! I can explain a Year 2 topic, give an example, or guide you through a question. What shall we learn?'
          : 'I am listening. Which topic would you like to continue?',
        commonReplies, Boolean(subject?.id)
      );
      if (dialogueLanguage === 'ar') return withReplies(
        studentTurn.messageType === 'social'
          ? 'مرحبًا! أستطيع شرح درس، أو إعطاء مثال، أو مساعدتك في سؤال. ماذا تريد أن نتعلّم؟'
          : 'أنا أستمع إليك. أي درس تريد أن نتابع؟',
        commonReplies, Boolean(subject?.id)
      );
      if (studentTurn.messageType === 'social') {
        return withReplies(
          `${studentName && studentName !== 'Murid' ? `Hai ${studentName}. ` : 'Hai. '}Saya boleh mencadangkan pelajaran hari ini, menerangkan sesuatu topik, atau membimbing kamu menjawab soalan. Kamu mahu mula dengan yang mana?`,
          ['Apa patut saya belajar hari ini?', 'Saya mahu belajar satu topik', 'Bantu soalan saya'],
          Boolean(subject?.id)
        );
      }
      return withReplies(
        `${studentName && studentName !== 'Murid' ? `${studentName}, ` : ''}baik, saya dengar. Topik?`,
        ['Terangkan satu topik', 'Cadangkan apa untuk belajar', 'Bantu latihan saya'],
        false
      );
    case 'tutor_identity':
      if (dialogueLanguage === 'en') return withReplies('I am Janna, your learning tutor. I can explain a topic and guide you one step at a time.', commonReplies, true);
      if (dialogueLanguage === 'ar') return withReplies('أنا جنّة، معلّمتك المساعدة. أشرح الدرس وأرشدك خطوة خطوة.', commonReplies, true);
      return withReplies(
        `Saya Janna, Tutor AI kamu. Saya boleh berbual tentang pembelajaran, menerangkan topik Tahun 2, memberi contoh dan membimbing latihan langkah demi langkah. Apa yang kamu mahu belajar sekarang?`,
        studentTurn.quickReplies,
        true
      );
    case 'learner_state': {
      const stateReply = studentTurn.learnerState === 'tired'
        ? 'Terima kasih kerana beritahu saya. Kalau kamu penat, kita boleh buat satu langkah kecil sahaja atau berehat dahulu.'
        : studentTurn.learnerState === 'bored'
          ? 'Saya faham. Jom tukar cara belajar supaya lebih menarik—kita boleh guna contoh ringkas atau cabaran pendek.'
          : studentTurn.learnerState === 'worried'
            ? 'Tak mengapa, kamu tidak perlu jawab semuanya sekali gus. Kita buat perlahan-lahan dan saya akan bimbing satu langkah pada satu masa.'
            : 'Bagus, semangat itu membantu. Jom gunakan tenaga itu untuk satu sesi belajar yang ringkas dan jelas.';
      return withReplies(stateReply, studentTurn.quickReplies, true);
    }
    case 'clarification_needed':
      if (dialogueLanguage === 'en') return withReplies('Would you like the meaning, an example, or the first step?', commonReplies, false);
      if (dialogueLanguage === 'ar') return withReplies('هل تريد المعنى، أم مثالًا، أم الخطوة الأولى؟', commonReplies, false);
      return withReplies(
        studentTurn.clarifyingQuestion || 'Bahagian mana yang kamu mahu saya terangkan: maksud, langkah, atau contoh?',
        studentTurn.quickReplies,
        false
      );
    case 'guided_without_answer':
      return withReplies(
        getTeachingAnchorNoAnswerLead(dialogueLanguage),
        dialogueLanguage === 'ms' ? [] : commonReplies,
        true
      );
    case 'question_help':
      if (dialogueLanguage === 'en') return withReplies('First, check the instruction. Then find the important clue in the sentence.', ['The first step'], true);
      if (dialogueLanguage === 'ar') return withReplies('ابدأ بتعليمات السؤال، ثم ابحث عن الدليل المهم في الجملة.', ['الخطوة الأولى'], true);
      return withReplies(/\bdi\s+_+|kata nama tempat/iu.test(questionText)
        ? 'Lihat perkataan “di” sebelum tempat kosong. Petunjuk itu menunjukkan ayat memerlukan nama tempat.'
        : `Lihat arahan dahulu, kemudian cari petunjuk penting dalam ${questionText ? 'ayat' : 'soalan'}.`, [], true);
    case 'understanding_confirmation':
      if (dialogueLanguage === 'en') return withReplies('Good. Can you explain the idea in your own words?', commonReplies, true);
      if (dialogueLanguage === 'ar') return withReplies('جيد. هل تستطيع شرح الفكرة بكلماتك؟', commonReplies, true);
      return withReplies(
        'Bagus. Cuba terangkan idea utama dengan ayat kamu sendiri.',
        studentTurn.quickReplies
      );
    case 'comparison_question':
      if (dialogueLanguage === 'en' && !standaloneAnswer) return withReplies('Which two ideas would you like to compare?', commonReplies, false);
      if (dialogueLanguage === 'ar' && !standaloneAnswer) return withReplies('ما الشيئان اللذان تريد المقارنة بينهما؟', commonReplies, false);
      return withReplies(
        standaloneAnswer || `Saya boleh bantu membandingkan konsep dalam ${topicLabel}. Nyatakan dua perkara yang kamu mahu bezakan.`,
        standaloneAnswer ? commonReplies : ['Bandingkan maksud', 'Bandingkan contoh', 'Bandingkan cara guna'],
        Boolean(standaloneAnswer)
      );
    case 'knowledge_question':
      if (!learningAnchor) {
        if (dialogueLanguage === 'en') return withReplies('Which Year 2 topic do you mean? Tell me the subject or lesson.', commonReplies, false);
        if (dialogueLanguage === 'ar') return withReplies('أي درس تقصد؟ اذكر المادة أو موضوع الدرس.', commonReplies, false);
        return withReplies(
          'Saya belum pasti konsep yang kamu maksud dalam pelajaran semasa. Nyatakan nama subjek atau topik supaya saya boleh mengajar dengan tepat.',
          ['Nyatakan subjek', 'Nyatakan nama topik', 'Kembali kepada soalan semasa'],
          false
        );
      }
      return withReplies(
        [
          learningAnchor || `Soalan kamu berkaitan ${topicLabel}.`,
          !standaloneAnswer ? sentence(example, 'Contoh mudah: ') : '',
          dialogueLanguage === 'en'
            ? 'Is this clear, or would you like one more example?'
            : dialogueLanguage === 'ar'
              ? 'هل الفكرة واضحة، أم تريد مثالًا آخر؟'
              : 'Bahagian ini sudah jelas, atau kamu mahu saya tunjukkan satu contoh lagi?'
        ].filter(Boolean).join(' '),
        commonReplies,
        Boolean(learningAnchor)
      );
    case 'why_question':
      if (dialogueLanguage !== 'ms') {
        return withReplies(`${learningAnchor || questionText} ${dialogueLanguage === 'en' ? 'Which clue shows why?' : 'ما السبب؟'}`, [], Boolean(learningAnchor || questionText));
      }
      return withReplies(
        `${learningAnchor || 'Sebabnya ada pada petunjuk soalan.'} Apakah petunjuknya?`,
        commonReplies,
        Boolean(learningAnchor || questionText)
      );
    case 'how_question':
      if (!learningAnchor && !steps.length) {
        if (dialogueLanguage === 'en') return withReplies('I can guide you one step at a time. Which question or skill should we start with?', commonReplies, false);
        if (dialogueLanguage === 'ar') return withReplies('أستطيع مساعدتك خطوة خطوة. بأي سؤال أو مهارة نبدأ؟', commonReplies, false);
        return withReplies(
          'Saya boleh bimbing langkah demi langkah. Apakah kemahiran atau soalan yang kamu mahu pelajari?',
          ['Terangkan soalan semasa', 'Beri contoh mudah', 'Nyatakan nama topik'],
          false
        );
      }
      return withReplies(
        [
          learningAnchor || (dialogueLanguage === 'en' ? `Let us learn about ${topicLabel}.` : dialogueLanguage === 'ar' ? 'لنبدأ خطوة خطوة.' : `Mari belajar cara membuat ${topicLabel}.`),
          ...(standaloneAnswer ? [] : steps.map((step, index) => sentence(step, dialogueLanguage === 'en' ? `Step ${index + 1}: ` : dialogueLanguage === 'ar' ? `الخطوة ${index + 1}: ` : `Langkah ${index + 1}: `))),
          dialogueLanguage === 'en' ? 'Try the first step. What did you find?' : dialogueLanguage === 'ar' ? 'جرّب الخطوة الأولى. ماذا وجدت؟' : 'Cuba buat langkah pertama dahulu. Apa yang kamu dapat?'
        ].filter(Boolean).join(' '),
        dialogueLanguage === 'ms' ? ['Bimbing langkah pertama', 'Beri contoh mudah', 'Saya mahu cuba sendiri'] : commonReplies
      );
    default:
      return null;
  }
}

export async function getTutorResponse(options = {}) {
  const {
    student = null,
    profile = null,
    subject = null,
    subjectId = '',
    topic = null,
    topicId = '',
    question = null,
    questionText = '',
    instruction = '',
    options: questionOptions = [],
    expectedAnswer = '',
    acceptedAnswers: explicitAcceptedAnswers = [],
    learnerAnswer = '',
    studentAnswer = '',
    correctAnswer = '',
    explanationMode = '',
    currentLearningObjective = '',
    isCorrect = null,
    attemptCount = 0,
    hintsUsed = 0,
    weakTopics = [],
    strongTopics = [],
    uasaSummary = null,
    adaptiveRecommendation = null,
    prompt = '',
    intent = '',
    locale = '',
    history = [],
    conversationKey = '',
    pendingPedagogicalStep = null,
    tutorAction = null,
    adaptiveProfile = null,
    studyPlan = null,
    readiness = null,
    learningObservation = null,
    predictionProfile = null,
    gamificationProfile = null,
    availableSubjects = []
  } = options;

  const studentProfile = student || profile || adaptiveProfile || {};
  const activeStudentId = normalizeText(
    studentProfile?.childId || studentProfile?.studentId || studentProfile?.id,
    ''
  );
  const subjectContext = getSubjectContext(subject || {}, subjectId);
  const languagePresentation = getSubjectLanguagePresentation(subjectContext);
  const resolvedLocale = locale || languagePresentation.contentLocale;
  const topicContext = getTopicContext(topic || {}, topicId);
  const resolvedQuestion = question || {};
  const studentName = getStudentDisplayName(studentProfile, 'Murid');
  const resolvedQuestionText = getQuestionText(resolvedQuestion, questionText);
  const resolvedInstruction = getInstruction(resolvedQuestion, instruction);
  const resolvedOptions = getOptions(resolvedQuestion, questionOptions);
  const acceptedAnswers = getAcceptedAnswers({
    ...resolvedQuestion,
    acceptedAnswers: [
      ...getAcceptedAnswers(resolvedQuestion),
      ...(Array.isArray(explicitAcceptedAnswers) ? explicitAcceptedAnswers : [])
    ]
  });
  const expected = getExpectedAnswer(resolvedQuestion, expectedAnswer || correctAnswer);
  const pendingExpectedAnswers = Array.isArray(pendingPedagogicalStep?.expectedAnswers)
    ? pendingPedagogicalStep.expectedAnswers
    : [];
  const hasExerciseContext = Boolean(resolvedQuestionText || expected);
  const questionIdentity = normalizeText(resolvedQuestion?.id || '', '');
  const anchorContext = getTeachingAnchorContext({
    history, conversationKey, subjectId: subjectContext.id,
    topicId: topicContext.id, questionId: questionIdentity, prompt
  });
  const activeConcept = anchorContext.currentConcept ||
    (subjectContext.id && topicContext.id && (questionIdentity || !hasExerciseContext)
      ? [subjectContext.id, topicContext.id, questionIdentity || 'general'].join('::')
      : '');
  const studentTurn = understandStudentTurn({
    prompt,
    intent,
    history,
    expectedAnswer: pendingExpectedAnswers[0] || expected,
    acceptedAnswers: pendingExpectedAnswers.length ? pendingExpectedAnswers : acceptedAnswers,
    hasExerciseContext,
    hasLearningContext: Boolean(resolvedQuestionText || resolvedInstruction || topicContext.id || subjectContext.id),
    // Never resume a previous question when its identity is ambiguous.
    activeConcept,
    teachingCheckResult: anchorContext.teachingCheckResult
  });
  let resolvedIntent = studentTurn.intent || inferIntent({ intent, prompt, isCorrect, question: resolvedQuestion });
  const promptAnswer = studentTurn.answerCandidate || extractPromptAnswer(prompt);
  const gradedTurn = studentTurn.messageType === 'answer_attempt' && !!promptAnswer;
  const mathPedagogy = subjectContext.id === 'math' && conversationKey
    ? await import('./pedagogy/mathPedagogicalTurn.js')
    : null;
  const mathQuestionContext = mathPedagogy?.resolveMathQuestionContext(resolvedQuestion, resolvedQuestionText) || null;
  const pedagogicalResponse = mathPedagogy
    ? mathPedagogy.buildYear2MathPedagogicalResponse({
        conversationKey,
        subjectId: subjectContext.id,
        topicId: topicContext.id,
        question: resolvedQuestion,
        questionText: resolvedQuestionText,
        expectedAnswer: expected,
        acceptedAnswers,
        prompt,
        tutorAction,
        studentTurn,
        pendingStep: pendingPedagogicalStep,
        studentName,
        subjectTitle: subjectContext.title,
        topicTitle: topicContext.title,
        instruction: resolvedInstruction,
        options: resolvedOptions,
        locale: resolvedLocale,
        languagePresentation,
        attemptCount: gradedTurn ? attemptCount : Math.min(+attemptCount, 2),
        hintsUsed,
        isOriginalCorrect: gradedTurn && isCorrect === true,
        explanationMode,
        mathQuestionContext
      })
    : null;
  if (pedagogicalResponse) return gradedTurn ? pedagogicalResponse : clearUngradedMetadata(pedagogicalResponse);
  const relevantLearningContext = ['knowledge_question', 'comparison_question', 'why_question', 'how_question']
    .includes(resolvedIntent)
      ? findRelevantLearningContext(prompt, availableSubjects, subjectContext)
      : null;
  const relevantSubjectTopic = relevantLearningContext?.topic || null;
  const conversationalSubject = relevantLearningContext?.subject || subjectContext;
  const usesCurrentConversationContext = !studentTurn.newTopicRequest && (studentTurn.referencesPreviousTurn || resolvedIntent === 'example_request');
  const conversationalTopic = relevantSubjectTopic || (usesCurrentConversationContext ? topicContext : null);
  const switchedTopic = Boolean(studentTurn.newTopicRequest && relevantLearningContext);
  const microCheck = studentTurn.messageType === 'learning_response';
  const priorAnswer = getLearnerAnswer(learnerAnswer || studentAnswer, resolvedQuestion);
  const answerSafeHelp = !promptAnswer && !(resolvedIntent === 'wrong_answer_coaching' && isCorrect === false && priorAnswer);
  const tutorAttempts = Math.min(+attemptCount, promptAnswer ? Infinity : 2) * !microCheck * (resolvedIntent !== 'guided_without_answer') || 0;
  const tutorHints = +hintsUsed * !microCheck * (resolvedIntent !== 'guided_without_answer') || 0;
  const feedbackQuestion = microCheck
    ? { ...resolvedQuestion, learnerAnswer: '', studentAnswer: '', answerAttempt: '' }
    : resolvedQuestion;
  const answerText = microCheck || answerSafeHelp ? '' : getLearnerAnswer(promptAnswer || priorAnswer, resolvedQuestion);
  const answerCheckQuestion = {
    ...resolvedQuestion,
    answer: expected || resolvedQuestion.answer,
    acceptedAnswers: expected
      ? [...new Set([expected, ...acceptedAnswers])]
      : acceptedAnswers
  };
  const resolvedCorrect = microCheck || answerSafeHelp ? null : promptAnswer
    ? isAcceptedQuestionAnswer(answerText, answerCheckQuestion)
    : typeof isCorrect === 'boolean'
      ? isCorrect
      : answerText
        ? isAcceptedQuestionAnswer(answerText, answerCheckQuestion)
        : null;
  if (promptAnswer && (!intent || intent === 'general' || intent === 'auto')) {
    resolvedIntent = resolvedCorrect ? 'correct_answer_reinforcement' : 'wrong_answer_coaching';
  }
  const hasQuestionContext = Boolean(resolvedQuestionText || resolvedInstruction || topicContext.id || subjectContext.id);

  let coachResponse = null;
  let source = 'fallback';

  if (hasQuestionContext && (subjectContext.id || topicContext.id)) {
    try {
      coachResponse = await buildTutorKnowledgeResponse({
        subjectId: subjectContext.id,
        topicId: topicContext.id,
        question: feedbackQuestion,
        result: {
          correct: resolvedCorrect,
          status: typeof resolvedCorrect === 'boolean'
            ? (resolvedCorrect ? 'correct' : 'wrong')
            : undefined,
          explanation: ''
        },
        userAnswer: answerText,
        studentId: activeStudentId,
        studentProfile: activeStudentId && activeStudentId !== 'default' ? studentProfile : null,
        context: {
          studentName,
          subject: subjectContext,
          topic: topicContext,
          prompt: normalizeText(prompt, ''),
          intent: resolvedIntent,
          locale: resolvedLocale,
          historyCount: Array.isArray(history) ? history.length : 0,
          attemptCount: tutorAttempts,
          hintsUsed: tutorHints,
          level: Number(studentProfile.level || adaptiveProfile?.level || 0),
          xp: Number(studentProfile.xp || adaptiveProfile?.xp || 0),
          streak: Number(studentProfile.streak || adaptiveProfile?.streak || 0),
          learningObservation,
          predictionProfile,
          gamificationProfile,
          questionText: resolvedQuestionText,
          instruction: resolvedInstruction,
          options: resolvedOptions,
           expectedAnswer: expected,
           acceptedAnswers,
          learnerAnswer: answerText,
          explanationMode,
          currentLearningObjective
        }
      });
      if (coachResponse?.ready) {
        source = 'coach-v3';
      } else {
        coachResponse = null;
        source = 'fallback';
      }
    } catch (error) {
      coachResponse = null;
      source = 'fallback';
    }
  }
  const fallbackUsed = source !== 'coach-v3';

  const weakList = Array.isArray(weakTopics) && weakTopics.length ? weakTopics : rankWeakTopics(studentProfile || {}, {
    subjectId: subjectContext.id || undefined,
    limit: 5,
    includeLowConfidence: true
  });
  const strongList = Array.isArray(strongTopics) && strongTopics.length ? strongTopics : rankStrongTopics(studentProfile || {}, {
    subjectId: subjectContext.id || undefined,
    limit: 5
  });

  const guided = buildGuidedLearning({
    subjectId: subjectContext.id,
    topicId: topicContext.id,
    intent: resolvedIntent,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    expectedAnswer: expected,
    acceptedAnswers,
    learnerAnswer: answerText,
    isCorrect: resolvedCorrect,
    attemptCount: tutorAttempts,
    hintsUsed: tutorHints,
    question: feedbackQuestion,
    completionState: resolvedIntent === 'uasa_summary' || resolvedIntent === 'revision_plan',
    explicitAnswerRequest: /tunjuk(?:kan)?\s+(?:jawapan|jawapan betul)|show answer|jawapan sebenar/i.test(prompt)
  });

  if (microCheck) Object.assign(guided, {
    stage: 'learning_response', misconception: null, praise: '', nextAction: ''
  });

  const resolvedTopicLabel = resolveTopicLabel({
    subject: subjectContext,
    topic: topicContext,
    question: resolvedQuestion,
    metadata: {
      displayName: topicContext.title,
      title: topicContext.title,
      topicId: topicContext.id
    }
  });
  const fallbackTopicLabel = resolvedTopicLabel || 'topik semasa';
  const contextBundle = buildContextualSections({
    intent: resolvedIntent,
    questionText: resolvedQuestionText,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    subject: subjectContext,
    topic: topicContext,
    topicLabel: fallbackTopicLabel,
    question: feedbackQuestion,
    answer: expected,
    learnerAnswer: answerText,
    isCorrect: resolvedCorrect,
    attemptCount: tutorAttempts,
    hintsUsed: tutorHints,
    coachResponse,
    studyPlan,
    readiness,
    adaptiveRecommendation,
    profile: studentProfile,
    explanationMode,
    currentLearningObjective,
    weakTopics: weakList,
    strongTopics: strongList,
    guided,
    history
  });
  if (switchedTopic) {
    const switched = { subject: conversationalSubject.title, topic: conversationalTopic?.title || '', subjectId: conversationalSubject.id, topicId: conversationalTopic?.id || '' };
    contextBundle.contextUsed = { ...switched, hasQuestion: false };
    contextBundle.sections = { ...switched, pedagogicalContent: { grounded: true } };
  }
  const protectedTutorAnswers = [...pendingExpectedAnswers, expected, ...acceptedAnswers];
  const standaloneAnswer = selectAnswerSafeText(
    ['general', 'knowledge_question', 'comparison_question', 'why_question', 'how_question'].includes(resolvedIntent)
      ? buildStandaloneTutorAnswer(prompt, conversationalSubject, hasExerciseContext)
      : '',
    protectedTutorAnswers
  );
  const { directTeachingAnchor, teachingAnchor } = resolveTeachingAnchorTurn({
    scope: anchorContext.scope,
    priorTeachingAnchor: anchorContext.teachingAnchor,
    prompt,
    subjectId: subjectContext.id,
    standaloneAnswer,
    newTopicRequest: studentTurn.newTopicRequest
  });
  const resolvedStudentTurn = { ...studentTurn, intent: resolvedIntent };
  const teachingEngine = await import('./pedagogy/intelligentTeachingEngine.js');
  const conversationalReply = buildTeachingAnchorReply(teachingAnchor, resolvedStudentTurn, protectedTutorAnswers) || buildConversationalTeachingReply({
    studentTurn: resolvedStudentTurn,
    standaloneAnswer,
    contextBundle,
    studentName,
    subject: conversationalSubject,
    topic: conversationalTopic,
    questionText: resolvedQuestionText,
    weakTopics: weakList,
    studyPlan,
    getLocalizedTeachingReplies: teachingEngine.getLocalizedTeachingReplies
  });
  const falsePremiseReply = resolvedIntent === 'wrong_answer_coaching' && !promptAnswer && isCorrect === true
    ? {
        text: subjectContext.id === 'english'
          ? 'Your answer is correct.'
          : subjectContext.id === 'arab'
            ? 'إجابتك صحيحة.'
            : 'Jawapan kamu betul.',
        quickReplies: [],
        grounded: true
      }
    : null;
  const correctReason = selectAnswerSafeText([topicContext.note, resolvedInstruction], [expected, ...acceptedAnswers], '✓');
  const correctExplanationReply = resolvedIntent === 'correct_answer_reinforcement' && !promptAnswer && isCorrect === true ? {
    text: `${subjectContext.id === 'english' ? 'Your answer is correct. The clue is: ' : subjectContext.id === 'arab' ? 'إجابتك صحيحة. الدليل هو: ' : 'Jawapan kamu betul. Petunjuknya: '}${correctReason}`,
    quickReplies: [], grounded: true
  } : null;
  const intelligentTeaching = falsePremiseReply || correctExplanationReply ? null : teachingEngine.buildIntelligentTeachingTurn({
    studentTurn: { ...studentTurn, intent: resolvedIntent },
    resolvedIntent,
    history,
    subjectId: subjectContext.id,
    topicId: topicContext.id,
    topicLabel: fallbackTopicLabel,
    questionId: normalizeText(resolvedQuestion?.id || '', ''),
    learnerAnswer: answerText,
    options: resolvedOptions,
    expectedAnswer: expected,
    acceptedAnswers,
    isCorrect: resolvedCorrect,
    answerAttempted: Boolean(promptAnswer),
    guidedMisconception: guided.misconception,
    teachingContent: contextBundle.sections.pedagogicalContent,
    teachingAnchor,
    locale: resolvedLocale,
    languagePresentation
  });
  const effectiveConversationalReply = falsePremiseReply || correctExplanationReply || intelligentTeaching?.reply || conversationalReply;

  const suggestions = effectiveConversationalReply?.quickReplies?.length
    ? effectiveConversationalReply.quickReplies
    : standaloneAnswer ? [] : buildSuggestionList(resolvedIntent, {
    subject: subjectContext,
    topic: topicContext,
    question: resolvedQuestion,
    questionText: resolvedQuestionText
  });
  const quickActions = suggestions.map(suggestion => resolveTutorQuickReplyAction(suggestion, {
    hasExerciseContext: switchedTopic ? false : hasQuestionContext,
    conversationKey: switchedTopic ? '' : conversationKey,
    questionId: switchedTopic ? '' : normalizeText(resolvedQuestion?.id || '', ''),
    subjectId: conversationalSubject.id,
    topicId: conversationalTopic?.id || ''
  })).filter(Boolean);

  const recommendation = buildRecommendation(studentProfile || {}, subjectContext || {});
  const usesConversationReply = Boolean(effectiveConversationalReply?.text);
  const usesGroundedConversationReply = Boolean(usesConversationReply && effectiveConversationalReply.grounded);
  const responseSource = resolvedIntent === 'learning_recommendation' && usesGroundedConversationReply
    ? 'adaptive-teacher'
    : intelligentTeaching?.reply
      ? 'intelligent-teaching-engine'
    : usesConversationReply
      ? 'conversation-engine'
      : source;
  const responseFallbackUsed = usesConversationReply ? false : fallbackUsed;
  const confidence = responseFallbackUsed
    ? 45
    : hasQuestionContext
      ? 92
      : resolvedIntent === 'general'
        ? 82
        : 88;

  const fallbackText = sanitizeChildFacingText(
    hasQuestionContext
      ? `Mari kita lihat soalan ini bersama-sama.`
      : `Saya akan bantu berdasarkan ${fallbackTopicLabel}.`
  );
  const revealGradedAnswer = gradedTurn && guided.answerRevealPolicy.canRevealAnswer;
  if (switchedTopic) Object.assign(studentTurn, {
    lastStudentTurn: '', lastTutorTurn: '', hasHistory: false, pendingCheck: false, hasTeachingStage: false
  });
  const response = {
    text: effectiveConversationalReply?.text || standaloneAnswer || contextBundle.text || fallbackText || DEFAULT_FALLBACK,
    shortText: effectiveConversationalReply?.text || standaloneAnswer || contextBundle.shortText || fallbackText || DEFAULT_FALLBACK,
    intent: resolvedIntent,
    confidence: clampPercent(confidence),
    suggestions,
    suggestedActions: suggestions,
    quickActions,
    source: responseSource,
    fallbackUsed: Boolean(responseFallbackUsed),
    error: null,
    studentName,
    subject: conversationalSubject.title,
    topic: conversationalTopic?.title || fallbackTopicLabel,
    questionId: switchedTopic ? '' : normalizeText(resolvedQuestion?.id || '', ''),
    questionText: switchedTopic ? '' : resolvedQuestionText,
    instruction: switchedTopic ? '' : resolvedInstruction,
    options: gradedTurn ? resolvedOptions : [],
    expectedAnswer: revealGradedAnswer ? expected : '',
    learnerAnswer: gradedTurn ? answerText : '',
    acceptedAnswers: revealGradedAnswer ? acceptedAnswers : [],
    correctAnswer: revealGradedAnswer ? expected : '',
    isCorrect: gradedTurn ? resolvedCorrect : null,
    contextUsed: contextBundle.contextUsed,
    sections: contextBundle.sections,
    recommendationKey: switchedTopic ? null : recommendation?.recommendedTopicId || null,
    weakTopics: switchedTopic ? [] : weakList,
    strongTopics: switchedTopic ? [] : strongList,
    uasaSummary: switchedTopic ? null : uasaSummary,
    adaptiveRecommendation: switchedTopic ? null : adaptiveRecommendation,
    explanationMode: switchedTopic ? '' : explanationMode,
    currentLearningObjective: switchedTopic ? '' : currentLearningObjective,
    learnerAnswerText: gradedTurn ? answerText : '',
    tutorMode: switchedTopic ? '' : guided.mode,
    supportStage: intelligentTeaching?.pedagogicalState?.supportStage || guided.stage,
    answerRevealPolicy: switchedTopic ? getAnswerRevealPolicy({}) : guided.answerRevealPolicy,
    locale: resolvedLocale,
    languagePresentation: switchedTopic ? getSubjectLanguagePresentation(conversationalSubject) : languagePresentation,
    misconception: intelligentTeaching?.misconception || (guided.misconception?.supported === true ? guided.misconception : null),
    pedagogicalState: switchedTopic ? null : attachTeachingAnchorState(
      intelligentTeaching?.pedagogicalState || conversationalReply?.pedagogicalState,
      directTeachingAnchor,
      teachingAnchor
    ),
    guidingQuestion: switchedTopic ? '' : guided.guidingQuestion,
    quickReplies: effectiveConversationalReply?.quickReplies?.length
      ? effectiveConversationalReply.quickReplies
      : guided.quickReplies?.length ? guided.quickReplies : suggestions,
    nextAction: switchedTopic ? '' : guided.nextAction,
    praise: gradedTurn ? guided.praise : '',
    learningExperience: switchedTopic ? null : guided,
    studentTurn,
    conversationStage: studentTurn.messageType,
    referencesPreviousTurn: Boolean(studentTurn.referencesPreviousTurn),
    needsClarification: Boolean(studentTurn.needsClarification),
    grounded: effectiveConversationalReply ? Boolean(effectiveConversationalReply.grounded) : Boolean(contextBundle?.contextUsed?.hasCoachData),
    needsGenerativeTutor: Boolean(effectiveConversationalReply && !effectiveConversationalReply.grounded),
    mathQuestionContext: switchedTopic ? null : mathQuestionContext
  };
  return gradedTurn ? response : clearUngradedMetadata(response);
}

export default {
  getTutorResponse
};
