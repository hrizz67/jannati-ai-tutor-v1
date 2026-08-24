import { detectLearningCategory, getLearningExamples, getMathLearningGuidance, guardDistinctSections, sanitizeAiText, sanitizeChildFacingText } from './learningCopy.js';
import { getStudentProfileSummary, getTopicProgress } from './profile/index.js';
import { getMistakeContext } from './mistakes/index.js';

const CATEGORY_RULES = {
  person: {
    explanation: 'Jawapan ini betul kerana ia ialah nama orang yang sesuai dengan soalan.',
    hint: 'Cari nama orang yang sepadan dengan ayat.',
    commonMistakes: ['Memilih nama tempat.', 'Memilih perkataan yang bukan nama orang.']
  },
  place: {
    explanation: 'Jawapan ini betul kerana ia ialah nama tempat yang sesuai.',
    hint: 'Cari kata yang menamakan tempat.',
    commonMistakes: ['Memilih nama orang.', 'Memilih kata kerja atau sifat.']
  },
  animal: {
    explanation: 'Jawapan ini betul kerana ia menamakan haiwan yang tepat.',
    hint: 'Cari nama haiwan yang sesuai dengan ayat.',
    commonMistakes: ['Memilih benda atau tempat.', 'Memilih perkataan yang bukan haiwan.']
  },
  object: {
    explanation: 'Jawapan ini betul kerana ia ialah nama benda.',
    hint: 'Cari nama benda yang sepadan dengan ayat.',
    commonMistakes: ['Memilih nama orang.', 'Memilih kata kerja.']
  },
  verb: {
    explanation: 'Jawapan ini betul kerana ia menunjukkan perbuatan.',
    hint: 'Cari perkataan yang menunjukkan aksi.',
    commonMistakes: ['Memilih kata nama.', 'Memilih kata adjektif.']
  },
  adjective: {
    explanation: 'Jawapan ini betul kerana ia menerangkan sifat atau keadaan.',
    hint: 'Cari perkataan yang menerangkan rupa, saiz atau perasaan.',
    commonMistakes: ['Memilih nama benda.', 'Memilih perbuatan.']
  },
  penjodoh: {
    explanation: 'Jawapan ini betul kerana ia ialah penjodoh bilangan yang sesuai.',
    hint: 'Cari pasangan bilangan yang tepat untuk benda itu.',
    commonMistakes: ['Memilih kata nama biasa.', 'Menggunakan penjodoh yang tidak sesuai.']
  },
  simpulan: {
    explanation: 'Jawapan ini betul kerana ia ialah simpulan bahasa yang membawa maksud khas.',
    hint: 'Cari maksud yang paling sesuai dengan situasi ayat.',
    commonMistakes: ['Membaca setiap perkataan secara literal.', 'Memilih frasa yang tiada maksud khas.']
  },
  conjunction: {
    explanation: 'Jawapan ini betul kerana ia menghubungkan dua bahagian ayat dengan tepat.',
    hint: 'Cari kata hubung yang sesuai dengan maksud ayat.',
    commonMistakes: ['Memilih kata sendi nama.', 'Memilih kata nama.']
  },
  sendi: {
    explanation: 'Jawapan ini betul kerana ia ialah kata sendi nama yang sesuai.',
    hint: 'Cari kata sendi nama yang menunjukkan tempat atau arah.',
    commonMistakes: ['Memilih kata kerja.', 'Memilih kata hubung.']
  },
  properNoun: {
    explanation: 'Jawapan ini ialah kata nama khas yang merujuk kepada nama tertentu.',
    hint: 'Cari nama tertentu dan semak penggunaan huruf besar.',
    commonMistakes: ['Memilih kata nama am.', 'Menulis kata nama khas dengan huruf kecil.']
  },
  generic: {
    explanation: 'Jawapan ini betul kerana ia melengkapkan maksud soalan dengan tepat.',
    hint: 'Baca soalan sekali lagi dan cari kata kunci penting.',
    commonMistakes: ['Menjawab terlalu cepat.', 'Tidak semak ayat penuh.']
  }
};

function buildBaseExamples(question, topic) {
  const examples = getLearningExamples(question, topic);
  return examples.length ? examples : ['Baca ayat sekali lagi.', 'Cari kata kunci penting.', 'Bandingkan dengan jawapan.'];
}

export function explainAnswer({ question = {}, topic = {}, result = {}, userAnswer = '', questionText = '', instruction = '', currentLearningObjective = '', attemptCount = 0, explanationMode = '' } = {}) {
  topic = topic || {};
  const category = detectLearningCategory(question, topic);
  const rule = CATEGORY_RULES[category] || CATEGORY_RULES.generic;
  const correctAnswer = sanitizeAiText(question.answer || 'jawapan yang betul');
  const stem = sanitizeAiText(questionText || question.q || question.question || question.stem || 'soalan ini');
  const contextualGeneric = `Dalam soalan ini, teliti "${stem}" dan padankan jawapan dengan arahan yang diberi.`;
  const subjectId = String(question.subjectId || topic.subjectId || '').toLowerCase();
  const mathGuidance = subjectId === 'math' ? getMathLearningGuidance(question, topic) : null;
  const isNumberOrder = subjectId === 'math' && /nombor\s+(?:selepas|sebelum)/i.test(stem);
  const mathOperation = subjectId === 'math' && (/tambah|jumlah|lagi/i.test(stem) ? 'tambah' : /tolak|baki|beza/i.test(stem) ? 'tolak' : /darab|kali|×/i.test(stem) ? 'darab' : /bahagi/i.test(stem) ? 'bahagi' : '');
  const isBmPronoun = subjectId === 'bm' && /kata ganti nama|menyiapkan kerja kelas|meja belajar/i.test(`${stem} ${topic.id || ''} ${topic.title || ''}`);
  const pronounMatch = String(question.answer || '').match(/\b(saya|kami|kita|awak|kamu|dia|beliau|mereka|anda)\b/i)
    || stem.match(/\b(saya|kami|kita|awak|kamu|dia|beliau|mereka|anda)\b/i);
  const pronounAnswer = isBmPronoun ? (pronounMatch?.[1] || 'saya').toLowerCase() : '';
  const pronounLabel = pronounAnswer ? `${pronounAnswer.charAt(0).toUpperCase()}${pronounAnswer.slice(1)}` : 'Saya';
  const pronounWhy = {
    saya: '“Saya” digunakan apabila seorang penutur bercakap tentang diri sendiri.',
    kami: '“Kami” digunakan apabila Amir dan Faris bercakap tentang diri mereka tanpa memasukkan orang yang mendengar.',
    kita: '“Kita” digunakan apabila penutur bercakap tentang diri sendiri bersama orang yang mendengar.',
    dia: '“Dia” digunakan untuk seorang yang sedang dibicarakan.',
    beliau: '“Beliau” digunakan dengan sopan untuk seorang yang dihormati.',
    mereka: '“Mereka” digunakan untuk beberapa orang yang sedang dibicarakan.'
  }[pronounAnswer] || `Kata ganti nama “${pronounLabel}” dipilih berdasarkan siapa yang bercakap atau dirujuk.`;
  const isBmCommonNoun = subjectId === 'bm' && /kata nama am|kata_nama_am/i.test(`${stem} ${topic.id || ''} ${topic.title || ''}`);
  const isBmIntensifier = subjectId === 'bm' && /kata penguat|kata_penguat|penguat/i.test(`${stem} ${topic.id || ''} ${topic.title || ''} ${question.explanation || ''}`);
  const intensifierAnswer = sanitizeAiText(question.answer || 'sangat');
  const intensifierSentence = stem.replace(/_{2,}/, intensifierAnswer);
  const intensifierAdjective = intensifierSentence.match(new RegExp(`\\b${intensifierAnswer}\\s+([\\p{L}]+)`, 'iu'))?.[1] || 'bersih';
  const isBmLightTulang = subjectId === 'bm' && /ringan\s+tulang/i.test(`${stem} ${topic.id || ''} ${topic.title || ''}`);
  const bmFamily = subjectId === 'bm' ? getBmFamily(topic, stem) : '';
  const bmFamilyContent = BM_FAMILY_CONTENT[bmFamily];
  const bmMemoryTip = bmFamilyContent?.memory || '';
  const commonNounAnswer = sanitizeAiText(question.answer || (stem.match(/\b(buku|meja|sekolah|kucing|guru|taman)\b/i)?.[1] || 'perkataan itu'));
  const numberMatch = stem.match(/nombor\s+(selepas|sebelum)\s+(\d+)/i);
  const numberValue = numberMatch ? Number(numberMatch[2]) : null;
  const numberAnswer = numberMatch ? numberValue + (numberMatch[1].toLowerCase() === 'selepas' ? 1 : -1) : null;
  const explanation = sanitizeAiText(
    isNumberOrder
      ? `${numberValue} ${numberMatch[1].toLowerCase() === 'selepas' ? '+' : '-'} 1 = ${numberAnswer}. Nombor ${numberMatch[1].toLowerCase()} ${numberValue} ialah ${numberAnswer}.`
      : mathOperation
        ? `Kenal pasti operasi ${mathOperation} dan susun nombor dalam soalan sebelum mengira.`
      : isBmPronoun
        ? `Gunakan “${pronounLabel}” berdasarkan siapa yang bercakap atau dirujuk dalam ayat.`
      : isBmCommonNoun
          ? 'Kata nama am ialah nama umum bagi orang, haiwan, benda atau tempat.'
        : isBmIntensifier
          ? `Dalam ayat “${intensifierSentence}”, “${intensifierAnswer}” ialah kata penguat yang menerangkan kata adjektif “${intensifierAdjective}”.`
        : isBmLightTulang
          ? '“Ringan tulang” bermaksud rajin bekerja atau suka membantu orang lain.'
        : bmFamilyContent?.simple || question.explanation || (category === 'generic' ? contextualGeneric : rule.explanation)
  );
  const hint = sanitizeAiText(
    isNumberOrder
      ? (numberMatch[1].toLowerCase() === 'selepas' ? 'Tambah 1 pada nombor itu.' : 'Tolak 1 daripada nombor itu.')
      : mathOperation
        ? `Gunakan operasi ${mathOperation} satu langkah pada satu masa.`
      : isBmPronoun
        ? `Fikirkan sebab kata ganti nama “${pronounLabel}” digunakan dalam ayat.`
        : isBmCommonNoun
          ? 'Fikirkan sama ada perkataan itu nama umum atau nama khas.'
        : isBmLightTulang
          ? 'Cari maksud yang menunjukkan sikap rajin bekerja atau suka membantu.'
        : bmFamilyContent?.hint || question.hint || rule.hint
  );
  const examples = buildBaseExamples(question, topic).map(item => sanitizeAiText(item));
  const focus = isNumberOrder
    ? 'Mengenal nombor yang datang selepas sesuatu nombor.'
    : mathOperation
      ? `Menyelesaikan soalan ${mathOperation} dengan langkah yang betul.`
    : isBmPronoun
      ? `Memilih kata ganti nama diri yang sesuai, iaitu “${pronounLabel}”.`
    : isBmCommonNoun
        ? 'Mengenal pasti kata nama am.'
      : isBmIntensifier
        ? 'Menggunakan kata penguat untuk menguatkan maksud kata adjektif.'
      : mathGuidance
        ? mathGuidance.focus
      : bmFamilyContent?.focus || sanitizeChildFacingText(currentLearningObjective || topic.learningObjective || topic.objective || 'Fahami kemahiran dalam soalan semasa.');
  const simpleExplanation = isNumberOrder
    ? 'Nombor selepas diperoleh dengan menambah 1.'
    : mathOperation
      ? `Soalan ini menggunakan operasi ${mathOperation}.`
    : isBmPronoun
      ? `“${pronounLabel}” dipilih berdasarkan orang yang bercakap atau dirujuk.`
      : isBmCommonNoun
        ? 'Kata nama am ialah nama umum bagi orang, haiwan, benda atau tempat.'
      : isBmIntensifier
        ? `“${intensifierAnswer}” menguatkan maksud kata adjektif “${intensifierAdjective}”.`
      : isBmLightTulang
        ? '“Ringan tulang” bermaksud rajin bekerja atau suka membantu orang lain.'
      : bmFamilyContent?.simple || explanation;
  const whyCorrect = isNumberOrder
    ? `${numberValue} + 1 = ${numberAnswer}, jadi ${numberAnswer} datang selepas ${numberValue}.`
    : mathOperation
      ? `Operasi ${mathOperation} dipilih kerana arahan soalan meminta kamu menggabungkan atau membandingkan kuantiti.`
    : isBmPronoun
      ? pronounWhy
      : isBmCommonNoun
        ? `“${commonNounAnswer}” ialah nama umum bagi sejenis benda, bukan nama khas.`
      : isBmIntensifier
        ? `“${intensifierAnswer}” tepat kerana menunjukkan keadaan “${intensifierAdjective}” pada tahap yang tinggi.`
      : isBmLightTulang
        ? 'Maksud ini tepat kerana orang yang ringan tulang rajin bekerja dan suka membantu orang lain.'
      : bmFamilyContent?.why || explanation;
  const steps = isNumberOrder
    ? [`Lihat nombor ${numberValue}.`, 'Tambah 1.', `Jawapannya ialah ${numberAnswer}.`]
    : mathOperation
      ? ['Kenal pasti nombor yang diberi.', `Pilih operasi ${mathOperation}.`, 'Kira dan semak unit jawapan.']
    : isBmPronoun
      ? ['Lihat siapa yang bercakap atau dirujuk.', `Padankan situasi dengan kata ganti nama “${pronounLabel}”.`, `Lengkapkan ayat dengan “${pronounLabel}”.`]
      : isBmCommonNoun
        ? ['Kenal pasti perkataan yang diberi.', 'Tentukan kategorinya.', `“${commonNounAnswer}” ialah benda, jadi ia kata nama am.`]
      : isBmIntensifier
        ? ['Baca ayat lengkap selepas mengisi tempat kosong.', `Kenal pasti kata adjektif “${intensifierAdjective}”.`, `Gunakan kata penguat “${intensifierAnswer}” untuk menguatkan sifat itu.`]
      : isBmLightTulang
        ? ['Kenal pasti simpulan bahasa.', 'Cari maksud kiasannya.', 'Padankan dengan sikap rajin bekerja atau suka membantu.']
      : mathGuidance
        ? mathGuidance.steps
      : buildContextualSteps({ subjectId, category, bmFamilyContent });
  const example = isNumberOrder ? 'Nombor selepas 25 ialah 26.' : isBmPronoun ? `${pronounLabel} membaca buku.` : isBmCommonNoun ? 'Sekolah ialah kata nama am bagi tempat.' : isBmIntensifier ? 'Bilik itu sangat kemas.' : isBmLightTulang ? 'Contohnya, kakak selalu membantu ibu mengemas rumah.' : mathGuidance ? mathGuidance.examples[0] : (bmFamilyContent?.example || examples[0] || '');
  const commonMistakes = (isNumberOrder
    ? ['Menambah atau menolak dengan arah yang salah.', 'Tidak menyemak urutan nombor.']
    : isBmPronoun
      ? ['Jangan pilih kata ganti nama yang tidak sepadan dengan situasi.', 'Tidak melihat siapa yang sedang bercakap atau dirujuk.']
      : isBmCommonNoun
        ? ['Jangan keliru dengan kata nama khas seperti “Sekolah Kebangsaan Seri Murni”.', 'Nama khas merujuk kepada nama tertentu.']
      : isBmIntensifier
        ? ['Jangan keliru antara kata penguat dengan kata adjektif.', 'Pastikan kata penguat hadir untuk menguatkan sifat atau keadaan.']
      : isBmLightTulang
        ? ['Jangan faham maksudnya secara literal.', 'Padankan dengan sikap rajin bekerja atau suka membantu.']
      : mathGuidance
        ? mathGuidance.commonMistakes
      : bmFamilyContent?.mistake ? [bmFamilyContent.mistake] : rule.commonMistakes || []).map(item => sanitizeAiText(item));
  const summary = sanitizeChildFacingText([
    questionText || question.q || question.question ? `Soalan: ${questionText || question.q || question.question}.` : '',
    instruction ? `Arahan: ${instruction}.` : '',
    ''
  ].filter(Boolean).join(' ')) || 'Mari kita semak soalan ini bersama-sama.';
  const studentProfile = getStudentProfileSummary('default');
  const topicProgress = getTopicProgress(studentProfile.studentId || 'default', question.subjectId || topic.subjectId || '', question.topicId || topic.id || '', studentProfile);
  const topicStatus = topicProgress?.status || 'new';
  const mistakeContext = getMistakeContext(studentProfile, question.subjectId || topic.subjectId || '', question.topicId || topic.id || '');
  const wasCorrect = result.status === 'correct';
  const wasAlmost = result.status === 'almost';
  const encouragementBase = wasCorrect
    ? (topicStatus === 'mastered'
    ? 'Hebat! Kamu sudah kuasai topik ini.'
    : topicStatus === 'good'
        ? 'Bagus! Kamu semakin yakin.'
        : 'Hebat! Teruskan usaha kamu.')
      : wasAlmost
        ? 'Sedikit lagi. Kamu hampir berjaya.'
      : mistakeContext.repeatedMistakes > 1
        ? 'Tak mengapa. Kita fokus pada kesilapan yang sama sedikit demi sedikit.'
        : topicStatus === 'weak'
        ? 'Tak mengapa. Kita ulang perlahan-lahan.'
        : 'Tak mengapa. Kita cuba sekali lagi.';

  const revealAnswer = Boolean(
    wasCorrect ||
    wasAlmost ||
    explanationMode === 'correct_answer_reinforcement' ||
    Number(attemptCount) >= 3
  );

  const response = {
    category,
    explanation,
    simpleExplanation,
    focus,
    whyCorrect,
    hint,
    examples,
    commonMistakes,
    memoryTip: sanitizeAiText(question.memoryTip || (isNumberOrder ? 'Nombor selepas tambah 1; nombor sebelum tolak 1.' : isBmPronoun ? pronounWhy : isBmCommonNoun ? 'Nama umum = kata nama am. Nama khusus = kata nama khas.' : mathGuidance?.memoryTip || bmMemoryTip)),
    encouragement: isBmPronoun
      ? (wasCorrect ? 'Bagus. Kamu sudah memilih kata ganti nama yang betul.' : 'Cuba lihat siapa yang bercakap atau dirujuk dalam ayat.')
      : isBmCommonNoun
        ? (wasCorrect ? 'Bagus. Kamu sudah dapat mengenal kata nama am.' : 'Cuba cari nama umum dalam ayat ini.')
      : encouragementBase,
    answerLine: revealAnswer ? `Jawapan: ${correctAnswer}` : '',
    correctAnswer: revealAnswer ? correctAnswer : '',
    shortText: sanitizeChildFacingText(`${focus} ${wasCorrect ? whyCorrect : hint}`),
    showCorrectAnswer: revealAnswer,
    sections: {
      summary: focus,
      focus,
      simpleExplanation,
      whyCorrect,
      hint,
      steps,
      commonMistake: commonMistakes[0] || '',
      example,
      memoryTip: sanitizeAiText(question.memoryTip || (isNumberOrder ? 'Nombor selepas tambah 1; nombor sebelum tolak 1.' : isBmPronoun ? pronounWhy : isBmCommonNoun ? 'Nama umum = kata nama am. Nama khusus = kata nama khas.' : mathGuidance?.memoryTip || bmMemoryTip)),
      correctAnswer: revealAnswer ? correctAnswer : '',
      coachMessage: sanitizeChildFacingText(isBmPronoun
        ? (wasCorrect ? 'Bagus. Kamu sudah memilih kata ganti nama yang betul.' : 'Cuba lihat siapa yang bercakap atau dirujuk dalam ayat.')
        : isBmCommonNoun
          ? (wasCorrect ? 'Bagus. Kamu sudah dapat mengenal kata nama am.' : 'Cuba cari nama umum dalam ayat ini.')
        : encouragementBase),
      learningObjective: sanitizeChildFacingText(currentLearningObjective || question.learningObjective || topic.learningObjective || topic.objective || '')
    },
    learningProfile: {
      studentId: studentProfile.studentId || 'default',
      topicStatus,
      accuracy: studentProfile.summary?.accuracy || 0,
      weakTopics: studentProfile.weakTopics || [],
      strongTopics: studentProfile.strongTopics || [],
      mistakeContext
    }
  };
  response.sections = guardDistinctSections(response.sections, stem, {
    summary: focus,
    focus,
    simpleExplanation,
    whyCorrect,
    hint,
    steps,
    example,
    commonMistake: commonMistakes[0] || '',
    memoryTip: response.memoryTip,
    coachMessage: response.encouragement
  });
  return response;
}

function getBmFamily(topic = {}, stem = '') {
  const text = `${topic.id || ''} ${topic.title || ''} ${stem}`.toLowerCase();
  if (/kata nama am|kata_nama_am/.test(text)) return 'commonNoun';
  if (/kata nama khas|kata_nama_khas/.test(text)) return 'properNoun';
  if (/kata ganti nama|kata_ganti_nama/.test(text)) return 'pronoun';
  if (/kata kerja|kata_kerja/.test(text)) return 'verb';
  if (/kata adjektif|kata_adjektif/.test(text)) return 'adjective';
  if (/penjodoh bilangan|penjodoh_bilangan/.test(text)) return 'classifier';
  if (/imbuhan|imbuhan_asas/.test(text)) return 'affix';
  if (/ayat majmuk|ayat_majmuk/.test(text)) return 'compoundSentence';
  if (/ayat tunggal|ayat_tunggal/.test(text)) return 'simpleSentence';
  if (/bina ayat|bina_ayat/.test(text)) return 'sentenceBuilding';
  if (/ejaan|ejaan/.test(text)) return 'spelling';
  if (/tanda baca|tanda_baca/.test(text)) return 'punctuation';
  if (/kefahaman|pemahaman|pemahaman_penulisan/.test(text)) return 'comprehension';
  return '';
}

const BM_FAMILY_CONTENT = {
  properNoun: {
    focus: 'Mengenal pasti kata nama khas.', simple: 'Kata nama khas ialah nama khusus bagi orang, tempat atau benda.', why: 'Nama itu merujuk kepada orang atau tempat tertentu.', hint: 'Cari nama yang khusus, bukan nama umum.', steps: ['Kenal pasti perkataan yang diberi.', 'Tentukan sama ada namanya khusus.', 'Gunakan huruf besar pada kata nama khas.'], example: 'Ali ialah kata nama khas bagi orang.', mistake: 'Jangan tulis kata nama khas dengan huruf kecil.', memory: 'Nama khusus = kata nama khas.'
  },
  verb: {
    focus: 'Mengenal pasti kata kerja.', simple: 'Kata kerja menunjukkan perbuatan.', why: 'Perkataan itu menerangkan perbuatan yang dilakukan.', hint: 'Cari perkataan yang menunjukkan aksi.', steps: ['Baca ayat dengan teliti.', 'Cari perbuatan dalam ayat.', 'Pilih kata kerja yang sesuai.'], example: 'Murid membaca buku.', mistake: 'Jangan pilih nama benda sebagai kata kerja.', memory: 'Kata kerja = perbuatan.'
  },
  adjective: {
    focus: 'Mengenal pasti kata adjektif.', simple: 'Kata adjektif menerangkan sifat atau keadaan.', why: 'Perkataan itu menerangkan sifat sesuatu benda atau orang.', hint: 'Cari perkataan yang menerangkan sifat.', steps: ['Baca ayat dengan teliti.', 'Cari perkataan yang menerangkan sifat.', 'Padankan dengan maksud ayat.'], example: 'Bunga itu cantik.', mistake: 'Jangan keliru antara sifat dan perbuatan.', memory: 'Kata adjektif = sifat atau keadaan.'
  },
  classifier: {
    focus: 'Memilih penjodoh bilangan yang sesuai.', simple: 'Penjodoh bilangan digunakan bersama bilangan dan benda.', why: 'Penjodoh itu sesuai dengan jenis benda yang dihitung.', hint: 'Lihat benda yang hendak dihitung.', steps: ['Kenal pasti benda dalam ayat.', 'Pilih penjodoh yang sesuai.', 'Semak semula pasangan itu.'], example: 'Sekuntum bunga ada di atas meja.', mistake: 'Jangan gunakan penjodoh yang tidak sesuai.', memory: 'Padankan penjodoh dengan benda.'
  },
  affix: {
    focus: 'Mengenal pasti imbuhan asas.', simple: 'Imbuhan ialah huruf atau suku kata yang ditambah pada kata dasar.', why: 'Imbuhan mengubah bentuk atau maksud kata dasar.', hint: 'Cari bahagian yang ditambah pada kata dasar.', steps: ['Cari kata dasar.', 'Lihat bahagian yang ditambah.', 'Baca maksud perkataan baharu.'], example: 'Berlari mempunyai awalan ber-.', mistake: 'Jangan anggap semua huruf awal sebagai imbuhan.', memory: 'Kata dasar + imbuhan = perkataan baharu.'
  },
  simpleSentence: {
    focus: 'Membina ayat tunggal.', simple: 'Ayat tunggal mempunyai satu maksud utama.', why: 'Ayat itu menyampaikan satu perbuatan atau keadaan yang jelas.', hint: 'Gunakan satu subjek dan satu cerita utama.', steps: ['Pilih siapa atau apa yang hendak diceritakan.', 'Pilih perbuatan yang sesuai.', 'Susun ayat dengan lengkap.'], example: 'Ali membaca buku.', mistake: 'Jangan gabungkan dua cerita dalam satu ayat tunggal.', memory: 'Satu ayat tunggal = satu maksud utama.'
  },
  compoundSentence: {
    focus: 'Membina ayat majmuk mudah.', simple: 'Ayat majmuk menggabungkan dua ayat dengan kata hubung.', why: 'Dua bahagian ayat disambungkan dengan maksud yang lengkap.', hint: 'Cari kata hubung yang sesuai.', steps: ['Bina dua ayat pendek.', 'Pilih kata hubung.', 'Gabungkan ayat dengan kemas.'], example: 'Ali membaca buku dan Siti menulis.', mistake: 'Jangan gunakan kata hubung yang tidak sesuai.', memory: 'Dua ayat + kata hubung = ayat majmuk.'
  },
  sentenceBuilding: {
    focus: 'Membina ayat yang lengkap.', simple: 'Ayat yang baik mempunyai maksud yang jelas dan susunan yang betul.', why: 'Perkataan disusun supaya pembaca memahami maksudnya.', hint: 'Susun perkataan mengikut urutan yang betul.', steps: ['Kenal pasti perkataan penting.', 'Susun subjek dan perbuatan.', 'Baca semula ayat.'], example: 'Murid menulis di dalam buku.', mistake: 'Jangan tinggalkan perkataan penting dalam ayat.', memory: 'Susun, baca, semak.'
  },
  spelling: {
    focus: 'Menyemak ejaan perkataan.', simple: 'Ejaan yang betul membantu pembaca memahami perkataan.', why: 'Perkataan itu menggunakan susunan huruf yang betul.', hint: 'Bunyikan perkataan dan lihat setiap huruf.', steps: ['Sebut perkataan perlahan-lahan.', 'Semak setiap huruf.', 'Tulis semula dengan betul.'], example: 'Buku dieja b-u-k-u.', mistake: 'Jangan tertinggal atau menambah huruf.', memory: 'Sebut, lihat, tulis.'
  },
  punctuation: {
    focus: 'Menggunakan tanda baca yang betul.', simple: 'Tanda baca membantu kita membaca ayat dengan jelas.', why: 'Tanda itu menunjukkan cara ayat dibaca.', hint: 'Lihat jenis ayat dan hujung ayat.', steps: ['Baca ayat dengan teliti.', 'Kenal pasti jenis ayat.', 'Letakkan tanda baca yang sesuai.'], example: 'Apakah nama kamu?', mistake: 'Jangan gunakan noktah untuk ayat soalan.', memory: 'Soalan guna tanda soal.'
  },
  comprehension: {
    focus: 'Memahami maklumat dalam petikan.', simple: 'Kefahaman bermaksud mencari maklumat penting dalam petikan.', why: 'Jawapan diambil daripada maksud dan maklumat dalam petikan.', hint: 'Cari ayat yang berkaitan dengan soalan.', steps: ['Baca petikan perlahan-lahan.', 'Cari kata kunci.', 'Padankan jawapan dengan petikan.'], example: 'Petikan menyebut bahawa Ali membaca buku.', mistake: 'Jangan jawab berdasarkan tekaan sahaja.', memory: 'Baca, cari, padan.'
  }
};

const CATEGORY_STEPS = {
  person: ['Baca ayat dan cari nama orang.', 'Semak nama itu merujuk kepada siapa.', 'Pilih nama orang yang paling sesuai dengan arahan.'],
  place: ['Baca ayat dan cari tempat yang disebut.', 'Semak tempat itu sesuai dengan maksud soalan.', 'Pilih kata nama tempat yang tepat.'],
  animal: ['Baca ayat dan kenal pasti haiwan yang disebut.', 'Cari ciri atau maklumat yang berkaitan.', 'Pilih nama haiwan yang paling sesuai.'],
  object: ['Baca ayat dan cari benda yang disebut.', 'Semak kegunaan atau ciri benda itu.', 'Pilih kata nama benda yang tepat.'],
  verb: ['Baca ayat dengan teliti.', 'Cari perkataan yang menunjukkan perbuatan.', 'Semak sama ada perbuatan itu sesuai dengan ayat.'],
  adjective: ['Baca ayat dan cari perkataan yang menerangkan.', 'Tentukan sifat atau keadaan yang dinyatakan.', 'Pilih kata adjektif yang paling sesuai.'],
  penjodoh: ['Kenal pasti benda dan bilangannya.', 'Pilih penjodoh bilangan yang sesuai.', 'Baca semula frasa untuk menyemak padanan.'],
  simpulan: ['Baca ayat dan kenal pasti situasinya.', 'Cari maksud simpulan bahasa, bukan maksud setiap perkataan.', 'Padankan maksud dengan situasi yang diberikan.'],
  conjunction: ['Baca kedua-dua bahagian ayat.', 'Kenal pasti hubungan antara bahagian ayat.', 'Pilih kata hubung yang paling sesuai.'],
  sendi: ['Baca ayat dan cari hubungan tempat atau arah.', 'Pilih kata sendi nama yang sesuai.', 'Baca semula ayat untuk menyemak maksudnya.'],
  properNoun: ['Kenal pasti perkataan yang diberi.', 'Tentukan sama ada namanya khusus.', 'Semak huruf besar pada kata nama khas.'],
  name: ['Baca ayat dan kenal pasti perkataan yang menamakan sesuatu.', 'Tentukan sama ada perkataan itu merujuk kepada orang, haiwan, benda atau tempat.', 'Pilih jawapan yang paling sesuai dengan arahan.'],
  generic: ['Baca soalan perlahan-lahan.', 'Cari kata kunci yang penting.', 'Semak jawapan dengan maksud soalan.']
};

function buildContextualSteps({ subjectId = '', category = '', bmFamilyContent = null } = {}) {
  if (bmFamilyContent?.steps?.length) return bmFamilyContent.steps;
  if (subjectId === 'math') return ['Kenal pasti nombor atau maklumat yang diberi.', 'Pilih operasi atau kaedah yang sesuai.', 'Kira dan semak jawapan.'];
  if (subjectId === 'english') return ['Read the sentence carefully.', 'Identify the word or form the question asks for.', 'Check the answer in the complete sentence.'];
  if (subjectId === 'sains') return ['Kenal pasti benda atau proses dalam soalan.', 'Cari ciri atau sebab yang berkaitan.', 'Padankan jawapan dengan konsep Sains.'];
  if (subjectId === 'arab') return ['Baca perkataan atau arahan dengan teliti.', 'Kenal pasti makna atau bentuk yang diminta.', 'Semak huruf dan jawapan sebelum memilih.'];
  if (subjectId === 'islam') return ['Kenal pasti amalan atau istilah dalam soalan.', 'Hubungkan dengan pelajaran yang berkaitan.', 'Semak jawapan supaya tepat dan beradab.'];
  if (subjectId === 'pj' || subjectId === 'pk') return ['Kenal pasti situasi atau aktiviti.', 'Pilih tindakan yang selamat dan sesuai.', 'Semak kesannya kepada kesihatan atau pergerakan.'];
  return CATEGORY_STEPS[category] || CATEGORY_STEPS.generic;
}
