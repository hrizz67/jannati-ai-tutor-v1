import { buildCoachResponse } from './coach/v3/coachController.js';
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
import { getAcceptedAnswers, isAcceptedQuestionAnswer } from '../utils/acceptedAnswers.js';

const DEFAULT_FALLBACK = 'Saya akan bantu berdasarkan soalan yang sedang kamu jawab.';

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
  generic: ['Menjawab terlalu cepat.', 'Tidak semak ayat penuh.']
};

const INTENT_STEPS = {
  hint: ['Cari kata kunci penting dalam soalan.', 'Bandingkan pilihan jawapan dengan kata kunci.'],
  question_help: ['Baca soalan perlahan-lahan.', 'Cari kata kunci penting.', 'Semak jawapan dengan ayat penuh.'],
  wrong_answer_coaching: ['Semak semula jawapan yang kamu pilih.', 'Cari petunjuk dalam ayat.', 'Bandingkan dengan maksud soalan.'],
  correct_answer_reinforcement: ['Ulang sebab jawapan itu betul.', 'Cuba soalan yang sedikit lebih mencabar.'],
  weak_topic: ['Lihat topik yang paling lemah dahulu.', 'Ulang satu langkah pada satu masa.'],
  revision_plan: ['Ikut topik keutamaan hari ini.', 'Buat ulang kaji ringkas dahulu.'],
  uasa_summary: ['Semak skor dan topik yang perlu dikuatkan.', 'Rancang ulang kaji sebelum simulasi seterusnya.'],
  example_request: ['Baca contoh mudah.', 'Bandingkan dengan soalan yang sedang kamu jawab.'],
  general: ['Baca soalan perlahan-lahan.', 'Cari kata kunci penting.']
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
  const resolvedId = normalizeText(topic?.id || topicId, '');
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

function buildStandaloneTutorAnswer(prompt = '', subject = {}) {
  const text = String(prompt || '').toLocaleLowerCase('ms-MY');
  if (/kata nama am/.test(text)) return 'Kata nama am ialah nama umum bagi orang, haiwan, benda atau tempat. Contohnya guru, kucing, buku dan sekolah.';
  if (/kata nama khas/.test(text)) return 'Kata nama khas ialah nama khusus bagi orang, tempat atau benda. Biasanya huruf pertama ditulis dengan huruf besar.';
  if (/bahagi|hasil bahagi/.test(text) && subject?.id === 'math') return 'Bahagi bermaksud membahagi sesuatu sama rata kepada beberapa kumpulan. Semak jumlah dan bilangan kumpulan sebelum mengira.';
  if (/tambah|penambahan/.test(text) && subject?.id === 'math') return 'Tambah bermaksud menggabungkan dua atau lebih jumlah untuk mendapatkan jumlah keseluruhan.';
  if (/tolak|penolakan/.test(text) && subject?.id === 'math') return 'Tolak bermaksud mencari beza atau baki selepas sebahagian jumlah dikeluarkan.';
  if (/darab|pendaraban/.test(text) && subject?.id === 'math') return 'Darab ialah penambahan berulang bagi kumpulan yang sama banyak.';
  return '';
}

function buildSuggestionList(intent, context = {}) {
  const generic = ['Cuba tanya dengan soalan yang lebih khusus.', 'Klik petunjuk jika perlukan bantuan.', 'Semak jawapan dan cuba lagi.'];
  if (context.subject?.id === 'math' && /\+|tambah|jumlah/i.test(context.questionText || '')) {
    return [
      'Kenal pasti nombor yang hendak ditambah.',
      'Tambah sa dahulu, kemudian puluh dan ratus.',
      'Semak jumlah akhir mengikut tempat nilai.'
    ];
  }
  switch (intent) {
    case 'weak_topic':
      return [
        'Latih topik lemah ini sekali lagi.',
        'Cuba 10 soalan ulang kaji.',
        'Minta penjelasan langkah demi langkah.'
      ];
    case 'revision_plan':
      return [
        'Ikut cadangan ulang kaji hari ini.',
        'Mulakan dengan topik paling lemah.',
        'Tamatkan dengan satu sesi latihan ringkas.'
      ];
    case 'uasa_summary':
      return [
        'Fokus pada topik yang belum stabil.',
        'Buat Simulator UASA selepas ulang kaji.',
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
        'Fokus pada kata kunci soalan ini.',
        'Bandingkan soalan dengan jawapan kamu.',
        'Gunakan penjelasan mudah untuk faham maksudnya.'
      ];
    case 'example_request':
      return [
        'Baca contoh mudah dulu.',
        'Cari persamaan dengan soalan semasa.',
        'Cuba jawab dengan gaya yang sama.'
      ];
    default:
      return context.questionText ? ['Baca soalan perlahan-lahan.', 'Cari kata kunci penting.', 'Semak jawapan dengan maksud soalan.'] : generic;
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

function buildCrossSubjectGuidance({ subjectId = '', topicId = '', topicTitle = '', questionText = '', instruction = '', expectedAnswer = '' } = {}) {
  const subject = String(subjectId).toLowerCase();
  const topic = `${topicId} ${topicTitle}`.toLowerCase();
  const stem = normalizeText(questionText, 'soalan ini');
  if (subject === 'bm') {
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
  if (subject === 'english') return { hint: `Fokus pada perkataan petunjuk dalam ayat dan bentuk ${topic.includes('verb') ? 'kata kerja' : topic.includes('noun') ? 'kata nama' : topic.includes('adjective') ? 'kata sifat' : 'tatabahasa'} yang diminta.`, steps: ['Baca ayat dan cari subjek.', 'Kenal pasti bentuk perkataan yang diperlukan.', 'Semak susunan ayat dan tanda baca.'], example: 'Gunakan perkataan daripada ayat semasa.' };
  if (subject === 'sains') return { hint: `Fokus pada ciri atau proses untuk topik ${topicTitle || 'Sains'} dalam soalan ini.`, steps: ['Kenal pasti benda hidup atau bahan yang disebut.', 'Perhatikan ciri, fungsi atau perubahan yang diminta.', 'Padankan bukti dengan konsep Sains yang tepat.'], example: 'Gunakan pemerhatian daripada soalan semasa.' };
  if (subject === 'islam') return { hint: `Cari kata kunci yang menunjukkan konsep ${topicTitle || 'Pendidikan Islam'} dan pilih amalan atau fakta yang tepat.`, steps: ['Baca istilah penting dalam soalan.', 'Hubungkan istilah itu dengan pelajaran topik semasa.', 'Semak jawapan supaya tepat dan beradab.'], example: 'Gunakan contoh daripada topik semasa.' };
  if (subject === 'arab') return { hint: `Baca perkataan Arab dari kanan ke kiri dan cari makna atau bentuk yang diminta dalam soalan.`, steps: ['Kenal pasti perkataan Arab yang diberi.', 'Padankan makna atau sebutan berdasarkan topik semasa.', 'Semak huruf dan baris jika ditunjukkan.'], example: 'Rujuk perkataan Arab dalam soalan semasa.' };
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
  const subjectGuidance = buildCrossSubjectGuidance({ subjectId: subject?.id, topicId: topic?.id, topicTitle: topic?.title, questionText: resolvedQuestion, instruction: resolvedInstruction, expectedAnswer });
  const acceptedAnswers = getAcceptedAnswers(question);
  const learner = getLearnerAnswer(learnerAnswer, question);
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
  const hintText = normalizeText(
    binaHint ||
    subjectGuidance?.hint ||
    guided?.hint ||
    coachResponse?.hint?.hint ||
    coachResponse?.hint ||
    question?.hint ||
    buildQuestionSpecificFallback({ questionText: resolvedQuestion, instruction: resolvedInstruction, expectedAnswer, acceptedAnswers, options: resolvedOptions, learnerAnswer: learner, category: categoryRule.category })
  );
  const praiseText = normalizeText(
    guided?.praise ||
    coachResponse?.praise?.praise ||
    coachResponse?.praise ||
    'Bagus! Teruskan usaha kamu.'
  );
  const learningTipText = normalizeText(
    binaFocus ||
    coachResponse?.learningTip ||
    coachResponse?.tips?.spotlight ||
    buildQuestionSpecificFallback({ questionText: resolvedQuestion, instruction: resolvedInstruction, expectedAnswer, acceptedAnswers, options: resolvedOptions, learnerAnswer: learner, category: categoryRule.category })
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
  const commonMistake = normalizeText(
    isBinaAyat && !isCorrect
      ? `${binaTokens.name ? `Nama “${binaTokens.name}” sudah ada. ` : ''}${binaTokens.word ? `Kata “${binaTokens.word}” sudah ada. ` : ''}Tambah objek, tempat atau tujuan, kemudian semak huruf besar dan tanda noktah.` :
    coachKnowledge?.commonMistakes?.[0] ||
    coachResponse?.commonMistakes?.[0] ||
    categoryRule.category !== 'generic' ? categoryRule.commonMistakes?.[0] : buildQuestionSpecificFallback({ questionText: resolvedQuestion, instruction: resolvedInstruction, expectedAnswer, acceptedAnswers, options: resolvedOptions, learnerAnswer: learner, category: categoryRule.category })
  );
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

  const revealAnswer =
    Boolean(isCorrect) ||
    explanationMode === 'correct_answer_reinforcement' ||
    explanationMode === 'show_answer' ||
    (intent === 'wrong_answer_coaching' && Number(attemptCount) >= 3) ||
    Boolean(guided?.revealAnswer && intent !== 'hint');

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
            weakTopicLabel ? `Topik lemah kamu ialah ${weakTopicLabel}.` : 'Topik lemah kamu memerlukan latihan lagi.',
            resolvedInstruction ? `Arahan: ${resolvedInstruction}.` : '',
            subjectLabel ? `Subjek: ${subjectLabel}.` : ''
          ].filter(Boolean).join(' ')
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
            ? 'Mari fokus pada topik lemah ini sedikit demi sedikit.'
            : intent === 'revision_plan'
              ? 'Ikut cadangan ulang kaji ini untuk kemajuan yang lebih baik.'
              : intent === 'uasa_summary'
                ? 'Semak ringkasan ini untuk lihat perkembangan kamu.'
                : 'Saya akan bantu langkah demi langkah.'
  );

  const learnerLabel = learner ? `Kamu jawab “${learner}”.` : '';
  const firstStep = steps[0] || 'baca soalan dan cari maklumat penting';
  const dialogueCandidates = intent === 'hint'
    ? [
        `${safeHintLead} Cuba fikir dahulu sebelum memilih jawapan.`,
        `Mari guna satu petunjuk: ${safeHintLead} Selepas itu, pilih jawapan yang paling sesuai.`,
        `Baik, kita tambah bantuan sedikit. ${safeHintLead} Apakah jawapan yang kamu dapat?`
      ]
    : intent === 'wrong_answer_coaching'
      ? [
          `${learnerLabel} Belum tepat, tetapi kita boleh baiki bersama. ${commonMistake || 'Semak semula maksud soalan.'}`,
          `${learnerLabel} Saya nampak cara kamu berfikir. Sekarang semak satu perkara: ${guided?.guidingQuestion || firstStep}`,
          `Tak mengapa, kita cuba cara lain. ${commonMistake || safeHintLead} Cuba jawab sekali lagi.`
        ]
      : intent === 'correct_answer_reinforcement'
        ? [
            `${coachMessage} ${revealAnswer && expectedAnswer ? `Jawapan kamu, ${expectedAnswer}, tepat kerana ${simpleExplanationText || 'sepadan dengan kehendak soalan'}.` : 'Boleh terangkan kepada saya bagaimana kamu mendapat jawapan itu?'}`,
            `Ya, betul. ${simpleExplanationText || 'Kamu sudah menggunakan petunjuk yang tepat.'} Sekarang cuba gunakan cara yang sama pada soalan seterusnya.`,
            `Bagus, kamu sudah faham bahagian ini. ${revealAnswer && expectedAnswer ? `Jawapannya ialah ${expectedAnswer}.` : ''} Mari naik satu langkah.`
          ]
        : intent === 'question_help'
          ? [
              `${friendlyQuestionSummary} Mula dengan langkah kecil: ${firstStep}.`,
              `Baik, kita pecahkan soalan ini. ${learnerLabel} Sekarang cari ${safeHintLead.toLocaleLowerCase('ms-MY')}`,
              `Saya faham kamu perlukan penjelasan. Lihat dahulu ${resolvedInstruction || 'apa yang diminta oleh soalan'}; kemudian kita semak jawapan bersama.`
            ]
          : [
              `${friendlyQuestionSummary} Saya bantu satu langkah pada satu masa.`,
              `Mari kita lihat bahagian yang paling penting dahulu: ${firstStep}.`,
              `Baik, kita belajar melalui soalan ini. Cuba beritahu saya bahagian yang paling mengelirukan.`
            ];
  const shortText = sanitizeTutorText(pickFreshDialogue(dialogueCandidates, history));

  const text = sanitizeTutorText([
    summary,
    isHintIntent ? hint : '',
    !isHintIntent && intent === 'wrong_answer_coaching' ? commonMistake || whyCorrect : (!isHintIntent ? whyCorrect : ''),
    steps[0] ? `Langkah pertama: ${steps[0]}.` : '',
    !isHintIntent && example ? `Contoh mudah: ${example}.` : '',
    !isHintIntent && memoryTip ? `Tip ingatan: ${memoryTip}.` : '',
    !isHintIntent && revealAnswer && expectedAnswer ? `Jawapan betul: ${expectedAnswer}.` : '',
    coachMessage,
    !isHintIntent && guided?.nextAction ? `Seterusnya: ${guided.nextAction}.` : ''
  ].filter(Boolean).join(' ')) || DEFAULT_FALLBACK;

  const sections = {
    summary,
    whyCorrect,
    hint,
    steps,
    commonMistake,
    example,
    memoryTip,
    correctAnswer: revealAnswer ? expectedAnswer : '',
    acceptedAnswers,
    coachMessage,
    learningObjective,
    questionText: resolvedQuestion,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    subject: subjectLabel,
    topic: topicLabel
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
    expectedAnswer,
    acceptedAnswers,
    learnerAnswer: learner,
    isCorrect: Boolean(isCorrect),
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
    misconceptionType: guided?.misconception?.type || ''
  };

  return {
    text,
    shortText,
    sections,
    contextUsed,
    guided
  };
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
    locale = 'ms-MY',
    history = [],
    adaptiveProfile = null,
    studyPlan = null,
    readiness = null,
    learningObservation = null,
    predictionProfile = null,
    gamificationProfile = null
  } = options;

  const studentProfile = student || profile || adaptiveProfile || {};
  const subjectContext = getSubjectContext(subject || {}, subjectId);
  const topicContext = getTopicContext(topic || {}, topicId);
  const resolvedQuestion = question || {};
  const studentName = getStudentDisplayName(studentProfile, 'Murid');
  let resolvedIntent = inferIntent({ intent, prompt, isCorrect, question: resolvedQuestion });
  const resolvedQuestionText = getQuestionText(resolvedQuestion, questionText);
  const resolvedInstruction = getInstruction(resolvedQuestion, instruction);
  const resolvedOptions = getOptions(resolvedQuestion, questionOptions);
  const promptAnswer = extractPromptAnswer(prompt);
  const answerText = getLearnerAnswer(promptAnswer || learnerAnswer || studentAnswer, resolvedQuestion);
  const acceptedAnswers = getAcceptedAnswers(resolvedQuestion);
  const expected = getExpectedAnswer(resolvedQuestion, expectedAnswer || correctAnswer);
  const answerCheckQuestion = {
    ...resolvedQuestion,
    answer: expected || resolvedQuestion.answer,
    acceptedAnswers: expected
      ? [...new Set([expected, ...acceptedAnswers])]
      : acceptedAnswers
  };
  const resolvedCorrect = promptAnswer
    ? isAcceptedQuestionAnswer(answerText, answerCheckQuestion)
    : typeof isCorrect === 'boolean'
      ? isCorrect
      : isAcceptedQuestionAnswer(answerText, answerCheckQuestion);
  if (promptAnswer && (!intent || intent === 'general')) {
    resolvedIntent = resolvedCorrect ? 'correct_answer_reinforcement' : 'wrong_answer_coaching';
  }
  const hasQuestionContext = Boolean(resolvedQuestionText || resolvedInstruction || topicContext.id || subjectContext.id);

  let coachResponse = null;
  let source = 'fallback';

  if (hasQuestionContext && (subjectContext.id || topicContext.id)) {
    try {
      coachResponse = await buildCoachResponse({
        subjectId: subjectContext.id,
        topicId: topicContext.id,
        question: resolvedQuestion,
        result: {
          correct: resolvedCorrect,
          status: typeof isCorrect === 'boolean'
            ? (isCorrect ? 'correct' : 'wrong')
            : undefined,
          explanation: ''
        },
        userAnswer: answerText,
        context: {
          studentName,
          subject: subjectContext,
          topic: topicContext,
          prompt: normalizeText(prompt, ''),
          intent: resolvedIntent,
          locale,
          historyCount: Array.isArray(history) ? history.length : 0,
          attemptCount: Number(attemptCount) || 0,
          hintsUsed: Number(hintsUsed) || 0,
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
    attemptCount: Number(attemptCount) || 0,
    hintsUsed: Number(hintsUsed) || 0,
    question: resolvedQuestion,
    completionState: resolvedIntent === 'uasa_summary' || resolvedIntent === 'revision_plan',
    explicitAnswerRequest: /tunjuk(?:kan)?\s+(?:jawapan|jawapan betul)|show answer|jawapan sebenar/i.test(prompt)
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
    question: resolvedQuestion,
    answer: expected,
    learnerAnswer: answerText,
    isCorrect: resolvedCorrect,
    attemptCount: Number(attemptCount) || 0,
    hintsUsed: Number(hintsUsed) || 0,
    coachResponse,
    studyPlan,
    readiness,
    adaptiveRecommendation,
    profile: studentProfile,
    explanationMode,
    currentLearningObjective,
    weakTopics,
    strongTopics,
    guided,
    history
  });
  const standaloneAnswer = resolvedIntent === 'general'
    ? buildStandaloneTutorAnswer(prompt, subjectContext)
    : '';

  const suggestions = standaloneAnswer ? [] : buildSuggestionList(resolvedIntent, {
    subject: subjectContext,
    topic: topicContext,
    question: resolvedQuestion,
    questionText: resolvedQuestionText
  });

  const recommendation = buildRecommendation(studentProfile || {}, subjectContext || {});
  const confidence = fallbackUsed
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

  return {
    text: standaloneAnswer || contextBundle.text || fallbackText || DEFAULT_FALLBACK,
    shortText: standaloneAnswer || contextBundle.shortText || fallbackText || DEFAULT_FALLBACK,
    intent: resolvedIntent,
    confidence: clampPercent(confidence),
    suggestions,
    suggestedActions: suggestions,
    source,
    fallbackUsed: Boolean(fallbackUsed),
    error: null,
    studentName,
    subject: subjectContext.title,
    topic: fallbackTopicLabel,
    questionId: normalizeText(resolvedQuestion?.id || '', ''),
    questionText: resolvedQuestionText,
    instruction: resolvedInstruction,
    options: resolvedOptions,
    expectedAnswer: expected,
    learnerAnswer: answerText,
    acceptedAnswers,
    correctAnswer: expected,
    isCorrect: resolvedCorrect,
    contextUsed: contextBundle.contextUsed,
    sections: contextBundle.sections,
    recommendationKey: recommendation?.recommendedTopicId || null,
    weakTopics: weakList,
    strongTopics: strongList,
    uasaSummary,
    adaptiveRecommendation,
    explanationMode,
    currentLearningObjective,
    learnerAnswerText: answerText,
    tutorMode: guided.mode,
    supportStage: guided.stage,
    misconception: guided.misconception,
    guidingQuestion: guided.guidingQuestion,
    quickReplies: guided.quickReplies,
    nextAction: guided.nextAction,
    praise: guided.praise,
    learningExperience: guided
  };
}

export default {
  getTutorResponse
};
