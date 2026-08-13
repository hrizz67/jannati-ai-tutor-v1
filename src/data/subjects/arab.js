import { normalizeArabSubject } from '../../utils/arabContentQuality.js';

const difficultyFor = (index) => {
  if (index <= 20) return "mudah";
  if (index <= 40) return "sederhana";
  return "sukar";
};

const makeQuestions = (topicCode, items) =>
  items.map((item, index) => ({
    id: `ARAB-${topicCode}-${String(index + 1).padStart(3, "0")}`,
    q: item.q,
    answer: item.answer,
    accepted: item.accepted || [item.answer],
    hint: item.hint,
    explanation: item.explanation,
    pronunciationGuide: String(item.pronunciationGuide || item.translationHint || item.explanation || item.hint || "").trim(),
    readingSteps: String(item.readingSteps || item.explanation || item.hint || "").trim(),
    translation: String(item.translation || item.explanation || item.hint || "").trim(),
    translationHint: String(item.translationHint || item.explanation || item.hint || "").trim(),
    difficulty: difficultyFor(index + 1),
    uasa: "UASA",
    dskp: "KSSR Arab",
    ...item,
  }));

const fill = (q, answer, hint, explanation, accepted) => ({
  q,
  answer,
  hint,
  explanation,
  accepted,
});

const makeHurufSupport = ({
  question,
  arabicText,
  letterName,
  pronunciationHint,
  meaningExplanation,
  writingGuidance,
  commonMistake,
  memoryTip,
  rumiReference = letterName,
}) => ({
  question,
  arabicText,
  letterName,
  rumiReference,
  pronunciationHint,
  meaningExplanation,
  writingGuidance,
  commonMistake,
  memoryTip,
});

const hijaiyahHintVariants = [
  "Lihat bentuk huruf dengan teliti.",
  "Perhatikan huruf Arab ini.",
  "Cuba ingat nama huruf ini.",
  "Sebut huruf ini dengan betul.",
];

const hijaiyahLetters = [
  ["ا", "alif"], ["ب", "ba"], ["ت", "ta"], ["ث", "tha"], ["ج", "jim"],
  ["ح", "ha"], ["خ", "kha"], ["د", "dal"], ["ذ", "zal"], ["ر", "ra"],
  ["ز", "zai"], ["س", "sin"], ["ش", "syin"], ["ص", "sad"], ["ض", "dad"],
  ["ط", "tho"], ["ظ", "zho"], ["ع", "ain"], ["غ", "ghain"], ["ف", "fa"],
  ["ق", "qaf"], ["ك", "kaf"], ["ل", "lam"], ["م", "mim"], ["ن", "nun"],
  ["ه", "ha"], ["و", "wau"], ["ي", "ya"],
];

const hurufHijaiyahRawQuestions = [
  ...hijaiyahLetters.map(([letter, name], index) => {
    const answer = letter === "ه" ? "ه" : name;
    const prompt = letter === "ه"
      ? "Huruf Arab bagi bunyi ha lembut ialah ________."
      : `Nama huruf Arab ${letter} ialah ________.`;
    const explanation = letter === "ه" ? "Huruf ه dibunyikan ha lembut." : `Ini huruf ${name}.`;
    const acceptedNames = {
      "ث": ["tha", "sa"],
      "ط": ["tho", "to", "ta"],
      "ظ": ["zho", "zo", "za"],
      "ع": ["ain", "‘ain"],
      "غ": ["ghain", "ghayn"]
    }[letter] || [answer];
    return fill(
      prompt,
      answer,
      hijaiyahHintVariants[index % hijaiyahHintVariants.length],
      explanation,
      acceptedNames
    );
  }),
  fill("Huruf hijaiyah pertama ialah ________.", "ا", "Ingat huruf alif.", "Huruf hijaiyah pertama ialah alif, ا."),
  fill("Huruf hijaiyah terakhir yang biasa dipelajari ialah ________.", "ي", "Ingat huruf ya.", "Huruf ya ditulis ي."),
  fill("Huruf yang mempunyai satu titik di bawah ialah ________.", "ب", "Ingat bentuk huruf ba.", "Huruf ba, ب, mempunyai satu titik di bawah.", ["ب"]),
  fill("Huruf yang mempunyai dua titik di atas ialah ________.", "ت", "Ingat bentuk huruf ta.", "Huruf ta, ت, mempunyai dua titik di atas.", ["ت"]),
  fill("Huruf yang mempunyai tiga titik di atas ialah ________.", "ث", "Ingat bentuk huruf tha.", "Huruf tha, ث, mempunyai tiga titik di atas.", ["ث"]),
  fill("Huruf berbentuk seperti ح tetapi mempunyai satu titik di bawah ialah ________.", "ج", "Bandingkan jim dengan ha.", "Huruf jim, ج, mempunyai satu titik di bawah.", ["ج"]),
  fill("Huruf berbentuk seperti ح tetapi mempunyai satu titik di atas ialah ________.", "خ", "Bandingkan kha dengan ha.", "Huruf kha, خ, mempunyai satu titik di atas.", ["خ"]),
  fill("Huruf berbentuk seperti د tetapi mempunyai satu titik di atas ialah ________.", "ذ", "Bandingkan zal dengan dal.", "Huruf zal, ذ, mempunyai satu titik di atas.", ["ذ"]),
  fill("Huruf berbentuk seperti ر tetapi mempunyai satu titik di atas ialah ________.", "ز", "Bandingkan zai dengan ra.", "Huruf zai, ز, mempunyai satu titik di atas.", ["ز"]),
  fill("Huruf berbentuk seperti س tetapi mempunyai tiga titik di atas ialah ________.", "ش", "Bandingkan syin dengan sin.", "Huruf syin, ش, mempunyai tiga titik di atas.", ["ش"]),
  fill("Huruf berbentuk seperti ص tetapi mempunyai satu titik di atas ialah ________.", "ض", "Bandingkan dad dengan sad.", "Huruf dad, ض, mempunyai satu titik di atas.", ["ض"]),
  fill("Huruf berbentuk seperti ط tetapi mempunyai satu titik di atas ialah ________.", "ظ", "Bandingkan zho dengan tho.", "Huruf zho, ظ, mempunyai satu titik di atas.", ["ظ"]),
  fill("Huruf berbentuk seperti ع tetapi mempunyai satu titik di atas ialah ________.", "غ", "Bandingkan ghain dengan ain.", "Huruf ghain, غ, mempunyai satu titik di atas.", ["غ"]),
  fill("Huruf yang hampir sama dengan ق tetapi mempunyai satu titik di atas ialah ________.", "ف", "Bandingkan fa dengan qaf.", "Huruf fa, ف, mempunyai satu titik di atas.", ["ف"]),
  fill("Huruf yang hampir sama dengan ف tetapi mempunyai dua titik di atas ialah ________.", "ق", "Bandingkan qaf dengan fa.", "Huruf qaf, ق, mempunyai dua titik di atas.", ["ق"]),
  fill("Huruf berbentuk seperti mangkuk dengan satu titik di atas ialah ________.", "ن", "Ingat bentuk huruf nun.", "Huruf nun, ن, mempunyai satu titik di atas.", ["ن"]),
  fill("Perkataan كِتَابٌ dibaca dari kanan ke ________.", "kiri", "Ikut arah tulisan Arab.", "Tulisan Arab dibaca dan ditulis dari kanan ke kiri."),
  fill("Tanda pada huruf بَ disebut ________.", "fathah", "Fathah menghasilkan bunyi a.", "Tanda َ di atas huruf ialah fathah."),
  fill("Tanda pada huruf بِ disebut ________.", "kasrah", "Kasrah menghasilkan bunyi i.", "Tanda ِ di bawah huruf ialah kasrah."),
  fill("Tanda pada huruf بُ disebut ________.", "dammah", "Dammah menghasilkan bunyi u.", "Tanda ُ di atas huruf ialah dammah."),
  fill("Huruf ا dibaca ________.", "alif", "Lihat bentuk huruf ا.", "ا ialah huruf alif.", ["alif"]),
  fill("Huruf م dibaca ________.", "mim", "Lihat bentuk huruf م.", "م ialah huruf mim.", ["mim"]),
];

const hurufHijaiyahSupport = [
  ...hijaiyahLetters.map(([letter, name]) => {
    const question = letter === "ه"
      ? "Huruf Arab bagi bunyi ha lembut (ه) ialah ________."
      : `Nama huruf Arab ${letter} ialah ________.`;
    const letterName = letter === "ه" ? "he" : name;
    const pronunciationHint = letter === "ه" ? "Sebut ha lembut dengan jelas." : `Sebut ${name} dengan jelas.`;
    const meaningExplanation = letter === "ه" ? "Huruf ه dibunyikan ha lembut." : `Huruf ${name} ditulis ${letter}.`;
    const commonMistake = letter === "ه"
      ? "Jangan tertukar ه dengan ح."
      : `Jangan tertukar huruf ${name} dengan huruf yang hampir sama.`;
    const memoryTip = letter === "ه"
      ? "Ingat ه sebagai bunyi ha lembut."
      : `Ingat ${name} sebagai huruf hijaiyah asas.`;
    return makeHurufSupport({
      question,
      arabicText: letter,
      letterName,
      pronunciationHint,
      meaningExplanation,
      writingGuidance: `Tulis huruf ${letter} dari kanan ke kiri dengan kemas.`,
      commonMistake,
      memoryTip
    });
  }),
  makeHurufSupport({
    question: "Huruf hijaiyah pertama ialah ________.",
    arabicText: "ا",
    letterName: "alif",
    pronunciationHint: "Sebut alif dengan jelas.",
    meaningExplanation: "Huruf hijaiyah pertama ialah alif, ا.",
    writingGuidance: "Tulis alif tegak dari kanan ke kiri.",
    commonMistake: "Jangan tertukar alif dengan huruf hamzah.",
    memoryTip: "Ingat alif sebagai huruf pertama dalam susunan hijaiyah."
  }),
  makeHurufSupport({
    question: "Huruf hijaiyah terakhir yang biasa dipelajari ialah ________.",
    arabicText: "ي",
    letterName: "ya",
    pronunciationHint: "Sebut ya dengan lembut.",
    meaningExplanation: "Huruf ya ditulis ي.",
    writingGuidance: "Tulis ya dengan dua titik di bawah.",
    commonMistake: "Jangan tertukar ya dengan nun atau ba.",
    memoryTip: "Ingat ya sebagai huruf penutup dalam susunan hijaiyah."
  }),
  makeHurufSupport({
    question: "Huruf ب mempunyai satu titik di ________.",
    arabicText: "ب",
    letterName: "ba",
    pronunciationHint: "Sebut ba dengan satu bunyi ringkas.",
    meaningExplanation: "Huruf ba mempunyai satu titik di bawah.",
    writingGuidance: "Tulis ba dengan titik di bawah huruf.",
    commonMistake: "Jangan tertukar ba dengan ta atau tha.",
    memoryTip: "Ingat ba kerana titiknya berada di bawah."
  }),
  makeHurufSupport({
    question: "Huruf ت mempunyai dua titik di ________.",
    arabicText: "ت",
    letterName: "ta",
    pronunciationHint: "Sebut ta dengan dua titik jelas.",
    meaningExplanation: "Huruf ta mempunyai dua titik di atas.",
    writingGuidance: "Tulis ta dengan dua titik di atas huruf.",
    commonMistake: "Jangan tertukar ta dengan ba atau tha.",
    memoryTip: "Ingat ta kerana ada dua titik di atas."
  }),
  makeHurufSupport({
    question: "Huruf ث mempunyai tiga titik di ________.",
    arabicText: "ث",
    letterName: "tha",
    pronunciationHint: "Sebut tha dengan lembut dan perlahan.",
    meaningExplanation: "Huruf ث mempunyai tiga titik di atas.",
    writingGuidance: "Tulis huruf ث dengan tiga titik di atas.",
    commonMistake: "Jangan tertukar ث dengan ت atau ب.",
    memoryTip: "Ingat ث kerana ada tiga titik di atas."
  }),
  makeHurufSupport({
    question: "Huruf ج mempunyai satu titik di ________.",
    arabicText: "ج",
    letterName: "jim",
    pronunciationHint: "Sebut jim dengan jelas.",
    meaningExplanation: "Huruf jim mempunyai satu titik di bawah.",
    writingGuidance: "Tulis jim dengan titik di bawah huruf.",
    commonMistake: "Jangan tertukar jim dengan ha atau kha.",
    memoryTip: "Ingat jim kerana titiknya di bawah."
  }),
  makeHurufSupport({
    question: "Huruf خ mempunyai satu titik di ________.",
    arabicText: "خ",
    letterName: "kha",
    pronunciationHint: "Sebut kha dengan hembusan lembut.",
    meaningExplanation: "Huruf kha mempunyai satu titik di atas.",
    writingGuidance: "Tulis kha dengan satu titik di atas.",
    commonMistake: "Jangan tertukar kha dengan ha atau jim.",
    memoryTip: "Ingat kha kerana ada titik di atas."
  }),
  makeHurufSupport({
    question: "Huruf ذ mempunyai satu titik di ________.",
    arabicText: "ذ",
    letterName: "zal",
    pronunciationHint: "Sebut zal dengan lembut.",
    meaningExplanation: "Huruf zal mempunyai satu titik di atas.",
    writingGuidance: "Tulis zal dengan satu titik di atas.",
    commonMistake: "Jangan tertukar zal dengan dal.",
    memoryTip: "Ingat zal kerana titiknya di atas."
  }),
  makeHurufSupport({
    question: "Huruf ز mempunyai satu titik di ________.",
    arabicText: "ز",
    letterName: "zai",
    pronunciationHint: "Sebut zai dengan jelas.",
    meaningExplanation: "Huruf zai mempunyai satu titik di atas.",
    writingGuidance: "Tulis zai dengan satu titik di atas.",
    commonMistake: "Jangan tertukar zai dengan ra atau dal.",
    memoryTip: "Ingat zai kerana titiknya di atas."
  }),
  makeHurufSupport({
    question: "Huruf ش mempunyai tiga titik di ________.",
    arabicText: "ش",
    letterName: "syin",
    pronunciationHint: "Sebut syin dengan bunyi yang jelas.",
    meaningExplanation: "Huruf syin mempunyai tiga titik di atas.",
    writingGuidance: "Tulis syin dengan tiga titik di atas.",
    commonMistake: "Jangan tertukar syin dengan sin.",
    memoryTip: "Ingat syin kerana ada tiga titik di atas."
  }),
  makeHurufSupport({
    question: "Huruf ض mempunyai satu titik di ________.",
    arabicText: "ض",
    letterName: "dad",
    pronunciationHint: "Sebut dad dengan kuat dan jelas.",
    meaningExplanation: "Huruf dad mempunyai satu titik di atas.",
    writingGuidance: "Tulis dad dengan satu titik di atas.",
    commonMistake: "Jangan tertukar dad dengan sad.",
    memoryTip: "Ingat dad kerana titiknya di atas."
  }),
  makeHurufSupport({
    question: "Huruf ظ mempunyai satu titik di ________.",
    arabicText: "ظ",
    letterName: "zho",
    pronunciationHint: "Sebut zho dengan perlahan.",
    meaningExplanation: "Huruf zho mempunyai satu titik di atas.",
    writingGuidance: "Tulis zho dengan satu titik di atas.",
    commonMistake: "Jangan tertukar zho dengan tho.",
    memoryTip: "Ingat zho kerana titiknya di atas."
  }),
  makeHurufSupport({
    question: "Huruf غ mempunyai satu titik di ________.",
    arabicText: "غ",
    letterName: "ghain",
    pronunciationHint: "Sebut ghain dari kerongkong dengan perlahan.",
    meaningExplanation: "Huruf ghain mempunyai satu titik di atas.",
    writingGuidance: "Tulis ghain dengan satu titik di atas.",
    commonMistake: "Jangan tertukar ghain dengan ain.",
    memoryTip: "Ingat ghain kerana ada titik di atas."
  }),
  makeHurufSupport({
    question: "Huruf ف mempunyai satu titik di ________.",
    arabicText: "ف",
    letterName: "fa",
    pronunciationHint: "Sebut fa dengan jelas.",
    meaningExplanation: "Huruf fa mempunyai satu titik di atas.",
    writingGuidance: "Tulis fa dengan satu titik di atas.",
    commonMistake: "Jangan tertukar fa dengan qaf.",
    memoryTip: "Ingat fa kerana titiknya di atas."
  }),
  makeHurufSupport({
    question: "Huruf ق mempunyai dua titik di ________.",
    arabicText: "ق",
    letterName: "qaf",
    pronunciationHint: "Sebut qaf dengan suara yang jelas.",
    meaningExplanation: "Huruf qaf mempunyai dua titik di atas.",
    writingGuidance: "Tulis qaf dengan dua titik di atas.",
    commonMistake: "Jangan tertukar qaf dengan fa.",
    memoryTip: "Ingat qaf kerana ada dua titik di atas."
  }),
  makeHurufSupport({
    question: "Huruf ن mempunyai satu titik di ________.",
    arabicText: "ن",
    letterName: "nun",
    pronunciationHint: "Sebut nun dengan lembut.",
    meaningExplanation: "Huruf nun mempunyai satu titik di atas.",
    writingGuidance: "Tulis nun dengan satu titik di atas.",
    commonMistake: "Jangan tertukar nun dengan ba atau ta.",
    memoryTip: "Ingat nun kerana titiknya di atas."
  }),
  makeHurufSupport({
    question: "Tulisan Arab ditulis dari kanan ke ________.",
    arabicText: "من اليمين إلى اليسار",
    letterName: "arah tulisan Arab",
    rumiReference: "kanan ke kiri",
    pronunciationHint: "Baca arah tulisan dengan betul.",
    meaningExplanation: "Tulisan Arab ditulis dari kanan ke kiri.",
    writingGuidance: "Tulis baris Arab dari kanan ke kiri.",
    commonMistake: "Jangan tulis Arab dari kiri ke kanan.",
    memoryTip: "Ingat: Arab bergerak dari kanan ke kiri."
  }),
  makeHurufSupport({
    question: "Baris atas dalam Arab disebut ________.",
    arabicText: "فَتْحَة",
    letterName: "fathah",
    pronunciationHint: "Sebut fathah sebagai bunyi a.",
    meaningExplanation: "Fathah ialah baris atas.",
    writingGuidance: "Letakkan tanda atas huruf dengan kemas.",
    commonMistake: "Jangan keliru antara fathah, kasrah dan dammah.",
    memoryTip: "Fathah di atas, bunyinya a."
  }),
  makeHurufSupport({
    question: "Baris bawah dalam Arab disebut ________.",
    arabicText: "كَسْرَة",
    letterName: "kasrah",
    pronunciationHint: "Sebut kasrah sebagai bunyi i.",
    meaningExplanation: "Kasrah ialah baris bawah.",
    writingGuidance: "Letakkan tanda bawah huruf dengan betul.",
    commonMistake: "Jangan tertukar kasrah dengan fathah.",
    memoryTip: "Kasrah di bawah, bunyinya i."
  }),
  makeHurufSupport({
    question: "Baris depan dalam Arab disebut ________.",
    arabicText: "ضَمَّة",
    letterName: "dammah",
    pronunciationHint: "Sebut dammah sebagai bunyi u.",
    meaningExplanation: "Dammah ialah baris depan.",
    writingGuidance: "Letakkan tanda depan huruf dengan kemas.",
    commonMistake: "Jangan tertukar dammah dengan fathah atau kasrah.",
    memoryTip: "Dammah di depan, bunyinya u."
  }),
  makeHurufSupport({
    question: "Huruf ا dibaca ________.",
    arabicText: "ا",
    letterName: "alif",
    pronunciationHint: "Sebut alif dengan jelas.",
    meaningExplanation: "ا ialah huruf alif.",
    writingGuidance: "Tulis alif tegak dari kanan ke kiri.",
    commonMistake: "Jangan tertukar alif dengan lam atau hamzah.",
    memoryTip: "Ingat alif sebagai huruf tegak pertama."
  }),
  makeHurufSupport({
    question: "Huruf م dibaca ________.",
    arabicText: "م",
    letterName: "mim",
    pronunciationHint: "Sebut mim dengan lembut.",
    meaningExplanation: "م ialah huruf mim.",
    writingGuidance: "Tulis mim dengan bentuk bulat yang kemas.",
    commonMistake: "Jangan tertukar mim dengan wau.",
    memoryTip: "Ingat mim kerana bentuknya bulat."
  }),
];

const hurufHijaiyahQuestions = hurufHijaiyahRawQuestions.map((item, index) => ({
  ...item,
  ...hurufHijaiyahSupport[index],
}));

const vocab = [
  ["كِتَابٌ", "buku"], ["قَلَمٌ", "pen"], ["حَقِيبَةٌ", "beg"], ["مِسْطَرَةٌ", "pembaris"], ["مِمْحَاةٌ", "pemadam"],
  ["مَدْرَسَةٌ", "sekolah"], ["فَصْلٌ", "kelas"], ["بَابٌ", "pintu"], ["نَافِذَةٌ", "tingkap"], ["كُرْسِيٌّ", "kerusi"],
  ["مَكْتَبٌ", "meja"], ["سَبُّورَةٌ", "papan tulis"], ["بَيْتٌ", "rumah"], ["مَسْجِدٌ", "masjid"], ["سُوقٌ", "pasar"],
  ["مَاءٌ", "air"], ["طَعَامٌ", "makanan"], ["خُبْزٌ", "roti"], ["أَرُزٌّ", "nasi"], ["حَلِيبٌ", "susu"],
  ["تُفَّاحٌ", "epal"], ["مَوْزٌ", "pisang"], ["عِنَبٌ", "anggur"], ["تَمْرٌ", "kurma"], ["عَصِيرٌ", "jus"],
  ["صَبَاحٌ", "pagi"], ["مَسَاءٌ", "petang"], ["لَيْلٌ", "malam"], ["يَوْمٌ", "hari"], ["أُسْبُوعٌ", "minggu"],
  ["كَبِيرٌ", "besar"], ["صَغِيرٌ", "kecil"], ["جَدِيدٌ", "baharu"], ["قَدِيمٌ", "lama"], ["جَمِيلٌ", "cantik"],
  ["نَظِيفٌ", "bersih"], ["قَرِيبٌ", "dekat"], ["بَعِيدٌ", "jauh"], ["سَرِيعٌ", "laju"], ["بَطِيءٌ", "perlahan"],
  ["طَالِبٌ", "murid lelaki"], ["طَالِبَةٌ", "murid perempuan"], ["مُعَلِّمٌ", "guru lelaki"], ["مُعَلِّمَةٌ", "guru perempuan"], ["صَدِيقٌ", "kawan lelaki"],
  ["صَدِيقَةٌ", "kawan perempuan"], ["هَذَا", "ini (maskulin)"], ["هَذِهِ", "ini (feminin)"], ["مَا", "apa"], ["مَنْ", "siapa"],
];

const mufradatQuestions = vocab.map(([arabic, meaning]) =>
  fill(`Perkataan Arab ${arabic} bermaksud ________.`, meaning, "Padankan perkataan Arab dengan maksudnya.", `${arabic} bermaksud ${meaning}.`, [meaning])
);

const numbers = [
  ["١", "وَاحِدٌ", "satu"], ["٢", "اِثْنَانِ", "dua"], ["٣", "ثَلَاثَةٌ", "tiga"], ["٤", "أَرْبَعَةٌ", "empat"], ["٥", "خَمْسَةٌ", "lima"],
  ["٦", "سِتَّةٌ", "enam"], ["٧", "سَبْعَةٌ", "tujuh"], ["٨", "ثَمَانِيَةٌ", "lapan"], ["٩", "تِسْعَةٌ", "sembilan"], ["١٠", "عَشَرَةٌ", "sepuluh"],
  ["١١", "أَحَدَ عَشَرَ", "sebelas"], ["١٢", "اِثْنَا عَشَرَ", "dua belas"], ["١٣", "ثَلَاثَةَ عَشَرَ", "tiga belas"], ["١٤", "أَرْبَعَةَ عَشَرَ", "empat belas"], ["١٥", "خَمْسَةَ عَشَرَ", "lima belas"],
  ["١٦", "سِتَّةَ عَشَرَ", "enam belas"], ["١٧", "سَبْعَةَ عَشَرَ", "tujuh belas"], ["١٨", "ثَمَانِيَةَ عَشَرَ", "lapan belas"], ["١٩", "تِسْعَةَ عَشَرَ", "sembilan belas"], ["٢٠", "عِشْرُونَ", "dua puluh"],
];

const nomborArabQuestions = [
  ...numbers.map(([digit, word, meaning]) =>
    fill(`Simbol ${digit} mewakili nombor ________ dalam Bahasa Melayu.`, meaning, "Kenal pasti nilai simbol nombor Arab.", `Simbol ${digit} mewakili ${meaning}; perkataan Arabnya ialah ${word}.`, [meaning])
  ),
  ...numbers.map(([digit, word, meaning]) =>
    fill(`Perkataan ${word} bermaksud ________.`, meaning, "Padankan nombor Arab dengan Bahasa Melayu.", `${word} bermaksud ${meaning}.`, [meaning])
  ),
  fill("Nombor selepas وَاحِدٌ ialah ________.", "اِثْنَانِ", "Kira satu, dua.", "Selepas satu ialah dua, اِثْنَانِ.", ["اِثْنَانِ", "dua"]),
  fill("Nombor selepas اِثْنَانِ ialah ________.", "ثَلَاثَةٌ", "Kira dua, tiga.", "Selepas dua ialah tiga, ثَلَاثَةٌ.", ["ثَلَاثَةٌ", "tiga"]),
  fill("Nombor selepas ثَلَاثَةٌ ialah ________.", "أَرْبَعَةٌ", "Kira tiga, empat.", "Selepas tiga ialah empat, أَرْبَعَةٌ.", ["أَرْبَعَةٌ", "empat"]),
  fill("Nombor sebelum خَمْسَةٌ ialah ________.", "أَرْبَعَةٌ", "Kira sebelum lima.", "Sebelum lima ialah empat, أَرْبَعَةٌ.", ["أَرْبَعَةٌ", "empat"]),
  fill("Nombor sebelum عَشَرَةٌ ialah ________.", "تِسْعَةٌ", "Kira sebelum sepuluh.", "Sebelum sepuluh ialah sembilan, تِسْعَةٌ.", ["تِسْعَةٌ", "sembilan"]),
  fill("Simbol Arab bagi nombor satu ialah ________.", "١", "Lihat simbol nombor Arab.", "Simbol satu ialah ١.", ["١", "satu"]),
  fill("Simbol Arab bagi nombor dua ialah ________.", "٢", "Lihat simbol nombor Arab.", "Simbol dua ialah ٢.", ["٢", "dua"]),
  fill("Simbol Arab bagi nombor tiga ialah ________.", "٣", "Lihat simbol nombor Arab.", "Simbol tiga ialah ٣.", ["٣", "tiga"]),
  fill("Simbol Arab bagi nombor lima ialah ________.", "٥", "Lihat simbol nombor Arab.", "Simbol lima ialah ٥.", ["٥", "lima"]),
  fill("Simbol Arab bagi nombor sepuluh ialah ________.", "١٠", "Lihat simbol nombor Arab.", "Simbol sepuluh ialah ١٠.", ["١٠", "sepuluh"]),
];

const colors = [
  ["أَحْمَرُ", "merah"], ["أَزْرَقُ", "biru"], ["أَصْفَرُ", "kuning"], ["أَخْضَرُ", "hijau"], ["أَبْيَضُ", "putih"],
  ["أَسْوَدُ", "hitam"], ["بُنِّيٌّ", "coklat"], ["بُرْتُقَالِيٌّ", "jingga"], ["وَرْدِيٌّ", "merah jambu"], ["رَمَادِيٌّ", "kelabu"],
  ["أَحْمَرُ", "merah"], ["أَزْرَقُ", "biru"], ["أَصْفَرُ", "kuning"], ["أَخْضَرُ", "hijau"], ["أَبْيَضُ", "putih"],
  ["أَسْوَدُ", "hitam"], ["بُنِّيٌّ", "coklat"], ["بُرْتُقَالِيٌّ", "jingga"], ["وَرْدِيٌّ", "merah jambu"], ["رَمَادِيٌّ", "kelabu"],
];

const warnaQuestions = [
  ...colors.map(([arabic, meaning], index) =>
    index < 10
      ? fill(`Warna ${arabic} bermaksud ________.`, meaning, "Padankan warna Arab dengan maksudnya.", `${arabic} bermaksud ${meaning}.`, [meaning, arabic])
      : fill(`Apakah maksud perkataan warna ${arabic} dalam Bahasa Melayu?`, meaning, "Lihat perkataan warna Arab dan pilih maksudnya.", `Perkataan warna ${arabic} bermaksud ${meaning}.`, [meaning, arabic])
  ),
  fill("Langit biasanya berwarna أَزْرَقُ, iaitu ________.", "biru", "Fikirkan warna langit.", "أَزْرَقُ bermaksud biru."),
  fill("Daun biasanya berwarna أَخْضَرُ, iaitu ________.", "hijau", "Fikirkan warna daun.", "أَخْضَرُ bermaksud hijau."),
  fill("Susu biasanya berwarna أَبْيَضُ, iaitu ________.", "putih", "Fikirkan warna susu.", "أَبْيَضُ bermaksud putih."),
  fill("Arang biasanya berwarna أَسْوَدُ, iaitu ________.", "hitam", "Fikirkan warna arang.", "أَسْوَدُ bermaksud hitam."),
  fill("Pisang masak biasanya berwarna أَصْفَرُ, iaitu ________.", "kuning", "Fikirkan warna pisang masak.", "أَصْفَرُ bermaksud kuning."),
  fill("Bahasa Arab untuk warna merah ialah ________.", "أَحْمَرُ", "Ingat warna merah.", "Merah dalam Arab ialah أَحْمَرُ.", ["أَحْمَرُ", "merah"]),
  fill("Bahasa Arab untuk warna biru ialah ________.", "أَزْرَقُ", "Ingat warna biru.", "Biru dalam Arab ialah أَزْرَقُ.", ["أَزْرَقُ", "biru"]),
  fill("Bahasa Arab untuk warna kuning ialah ________.", "أَصْفَرُ", "Ingat warna kuning.", "Kuning dalam Arab ialah أَصْفَرُ.", ["أَصْفَرُ", "kuning"]),
  fill("Bahasa Arab untuk warna hijau ialah ________.", "أَخْضَرُ", "Ingat warna hijau.", "Hijau dalam Arab ialah أَخْضَرُ.", ["أَخْضَرُ", "hijau"]),
  fill("Bahasa Arab untuk warna putih ialah ________.", "أَبْيَضُ", "Ingat warna putih.", "Putih dalam Arab ialah أَبْيَضُ.", ["أَبْيَضُ", "putih"]),
  fill("Bahasa Arab untuk warna hitam ialah ________.", "أَسْوَدُ", "Ingat warna hitam.", "Hitam dalam Arab ialah أَسْوَدُ.", ["أَسْوَدُ", "hitam"]),
  fill("Bahasa Arab untuk warna coklat ialah ________.", "بُنِّيٌّ", "Ingat warna coklat.", "Coklat dalam Arab ialah بُنِّيٌّ.", ["بُنِّيٌّ", "coklat"]),
  fill("Bahasa Arab untuk warna jingga ialah ________.", "بُرْتُقَالِيٌّ", "Ingat warna jingga.", "Jingga dalam Arab ialah بُرْتُقَالِيٌّ.", ["بُرْتُقَالِيٌّ", "jingga"]),
  fill("Bahasa Arab untuk warna merah jambu ialah ________.", "وَرْدِيٌّ", "Ingat warna merah jambu.", "Merah jambu dalam Arab ialah وَرْدِيٌّ.", ["وَرْدِيٌّ", "merah jambu"]),
  fill("Bahasa Arab untuk warna kelabu ialah ________.", "رَمَادِيٌّ", "Ingat warna kelabu.", "Kelabu dalam Arab ialah رَمَادِيٌّ.", ["رَمَادِيٌّ", "kelabu"]),
  fill("أَحْمَرُ ialah warna ________.", "merah", "Padankan warna.", "أَحْمَرُ bermaksud merah."),
  fill("أَسْوَدُ ialah warna ________.", "hitam", "Padankan warna.", "أَسْوَدُ bermaksud hitam."),
  fill("أَبْيَضُ ialah warna ________.", "putih", "Padankan warna.", "أَبْيَضُ bermaksud putih."),
  fill("أَخْضَرُ ialah warna ________.", "hijau", "Padankan warna.", "أَخْضَرُ bermaksud hijau."),
  fill("أَزْرَقُ ialah warna ________.", "biru", "Padankan warna.", "أَزْرَقُ bermaksud biru."),
  fill("Bunga mawar boleh berwarna وَرْدِيٌّ, iaitu ________.", "merah jambu", "Fikirkan warna mawar.", "وَرْدِيٌّ bermaksud merah jambu."),
  fill("Jalan raya boleh kelihatan رَمَادِيٌّ, iaitu ________.", "kelabu", "Fikirkan warna jalan.", "رَمَادِيٌّ bermaksud kelabu."),
  fill("Kayu boleh berwarna بُنِّيٌّ, iaitu ________.", "coklat", "Fikirkan warna kayu.", "بُنِّيٌّ bermaksud coklat."),
  fill("Oren boleh berwarna بُرْتُقَالِيٌّ, iaitu ________.", "jingga", "Fikirkan warna oren.", "بُرْتُقَالِيٌّ bermaksud jingga."),
  fill("أَصْفَرُ ialah warna ________.", "kuning", "Padankan warna.", "أَصْفَرُ bermaksud kuning."),
  fill("بُنِّيٌّ ialah warna ________.", "coklat", "Padankan warna.", "بُنِّيٌّ bermaksud coklat."),
  fill("بُرْتُقَالِيٌّ ialah warna ________.", "jingga", "Padankan warna.", "بُرْتُقَالِيٌّ bermaksud jingga."),
  fill("وَرْدِيٌّ ialah warna ________.", "merah jambu", "Padankan warna.", "وَرْدِيٌّ bermaksud merah jambu."),
  fill("رَمَادِيٌّ ialah warna ________.", "kelabu", "Padankan warna.", "رَمَادِيٌّ bermaksud kelabu."),
  fill("Warna putih dalam Arab ialah ________.", "أَبْيَضُ", "Ingat warna putih.", "Putih dalam Arab ialah أَبْيَضُ.", ["أَبْيَضُ", "putih"]),
];

const family = [
  ["أَبٌ", "ayah"], ["أُمٌّ", "ibu"], ["أَخٌ", "saudara lelaki"], ["أُخْتٌ", "saudara perempuan"], ["جَدٌّ", "datuk"],
  ["جَدَّةٌ", "nenek"], ["عَمٌّ", "bapa saudara"], ["عَمَّةٌ", "ibu saudara"], ["اِبْنٌ", "anak lelaki"], ["بِنْتٌ", "anak perempuan"],
  ["أَبِي", "ayah saya"], ["أُمِّي", "ibu saya"], ["أَخِي", "saudara lelaki saya"], ["أُخْتِي", "saudara perempuan saya"], ["جَدِّي", "datuk saya"],
  ["جَدَّتِي", "nenek saya"], ["أُسْرَةٌ", "keluarga"], ["وَالِدٌ", "bapa"], ["وَالِدَةٌ", "ibu"], ["طِفْلٌ", "kanak-kanak lelaki"],
  ["طِفْلَةٌ", "kanak-kanak perempuan"], ["زَوْجٌ", "suami"], ["زَوْجَةٌ", "isteri"], ["قَرِيبٌ", "kerabat lelaki"], ["قَرِيبَةٌ", "kerabat perempuan"],
];

const keluargaQuestions = [
  ...family.map(([arabic, meaning]) =>
    fill(`Perkataan ${arabic} bermaksud ________.`, meaning, "Padankan perkataan ahli keluarga.", `${arabic} bermaksud ${meaning}.`, [meaning, arabic])
  ),
  ...family.slice(0, 25).map(([arabic, meaning]) =>
    arabic === "وَالِدَةٌ"
      ? fill(`Perkataan ${arabic} merujuk kepada ________.`, meaning, "Baca perkataan Arab dan pilih maksud ahli keluarga.", `${arabic} bermaksud ${meaning}.`, [arabic, meaning])
      : fill(`Bahasa Arab bagi ${meaning} ialah ________.`, arabic, "Ingat kosa kata ahli keluarga.", `Bahasa Arab bagi ${meaning} ialah ${arabic}.`, [arabic, meaning])
  ),
];

const animals = [
  ["قِطٌّ", "kucing"], ["كَلْبٌ", "anjing"], ["أَرْنَبٌ", "arnab"], ["طَائِرٌ", "burung"], ["سَمَكٌ", "ikan"],
  ["دَجَاجَةٌ", "ayam"], ["بَقَرَةٌ", "lembu"], ["مَاعِزٌ", "kambing"], ["حِصَانٌ", "kuda"], ["فِيلٌ", "gajah"],
  ["أَسَدٌ", "singa"], ["نَمِرٌ", "harimau"], ["قِرْدٌ", "monyet"], ["بَطَّةٌ", "itik"], ["خَرُوفٌ", "biri-biri"],
  ["جَمَلٌ", "unta"], ["ثُعْبَانٌ", "ular"], ["فَأْرٌ", "tikus"], ["نَمْلَةٌ", "semut"], ["فَرَاشَةٌ", "rama-rama"],
  ["نَحْلَةٌ", "lebah"], ["ضِفْدَعٌ", "katak"], ["سُلَحْفَاةٌ", "kura-kura"], ["تِمْسَاحٌ", "buaya"], ["زَرَافَةٌ", "zirafah"],
];

const haiwanQuestions = [
  ...animals.map(([arabic, meaning]) =>
    fill(`${arabic} bermaksud ________.`, meaning, "Padankan nama haiwan.", `${arabic} bermaksud ${meaning}.`, [meaning, arabic])
  ),
  ...animals.map(([arabic, meaning]) =>
    fill(`Bahasa Arab bagi ${meaning} ialah ________.`, arabic, "Ingat nama haiwan dalam Arab.", `Bahasa Arab bagi ${meaning} ialah ${arabic}.`, [arabic, meaning])
  ),
];

const bodyParts = [
  ["رَأْسٌ", "kepala"], ["شَعْرٌ", "rambut"], ["وَجْهٌ", "muka"], ["عَيْنٌ", "mata"], ["أُذُنٌ", "telinga"],
  ["أَنْفٌ", "hidung"], ["فَمٌ", "mulut"], ["لِسَانٌ", "lidah"], ["سِنٌّ", "gigi"], ["يَدٌ", "tangan"],
  ["رِجْلٌ", "kaki"], ["إِصْبَعٌ", "jari"], ["بَطْنٌ", "perut"], ["ظَهْرٌ", "belakang"], ["قَلْبٌ", "jantung"],
  ["كَتِفٌ", "bahu"], ["رُكْبَةٌ", "lutut"], ["قَدَمٌ", "tapak kaki"], ["ذِرَاعٌ", "lengan"], ["جِسْمٌ", "badan"],
  ["رَأْسِي", "kepala saya"], ["عَيْنِي", "mata saya"], ["يَدِي", "tangan saya"], ["رِجْلِي", "kaki saya"], ["فَمِي", "mulut saya"],
];

const anggotaQuestions = [
  ...bodyParts.map(([arabic, meaning]) =>
    fill(`${arabic} bermaksud ________.`, meaning, "Padankan anggota badan.", `${arabic} bermaksud ${meaning}.`, [meaning, arabic])
  ),
  ...bodyParts.map(([arabic, meaning]) =>
    fill(`Bahasa Arab bagi ${meaning} ialah ________.`, arabic, "Ingat kosa kata anggota badan.", `Bahasa Arab bagi ${meaning} ialah ${arabic}.`, [arabic, meaning])
  ),
];

const simpleSentences = [
  ["هَذَا كِتَابٌ", "Ini buku"], ["هَذَا قَلَمٌ", "Ini pen"], ["هَذِهِ حَقِيبَةٌ", "Ini beg"], ["هَذَا بَابٌ", "Ini pintu"], ["هَذِهِ نَافِذَةٌ", "Ini tingkap"],
  ["أَنَا طَالِبٌ", "Saya murid lelaki"], ["أَنَا طَالِبَةٌ", "Saya murid perempuan"], ["أَنَا أَكْتُبُ", "Saya menulis"], ["أَنَا أَقْرَأُ", "Saya membaca"], ["أَنَا آكُلُ", "Saya makan"],
  ["أَنَا أَشْرَبُ", "Saya minum"], ["أَبِي فِي الْبَيْتِ", "Ayah saya di rumah"], ["أُمِّي فِي الْمَطْبَخِ", "Ibu saya di dapur"], ["الْقِطُّ صَغِيرٌ", "Kucing itu kecil"], ["الْبَيْتُ كَبِيرٌ", "Rumah itu besar"],
  ["الْكِتَابُ جَدِيدٌ", "Buku itu baharu"], ["الْفَصْلُ نَظِيفٌ", "Kelas itu bersih"], ["الْقَلَمُ أَزْرَقُ", "Pen itu biru"], ["الْحَقِيبَةُ حَمْرَاءُ", "Beg itu merah"], ["الْوَلَدُ يَكْتُبُ", "Budak lelaki menulis"],
  ["الْبِنْتُ تَقْرَأُ", "Budak perempuan membaca"], ["الْمُعَلِّمُ فِي الْفَصْلِ", "Guru lelaki di kelas"], ["الْمُعَلِّمَةُ فِي الْمَدْرَسَةِ", "Guru perempuan di sekolah"], ["الْمَاءُ بَارِدٌ", "Air itu sejuk"], ["الطَّعَامُ لَذِيذٌ", "Makanan itu sedap"],
];

const ayatMudahQuestions = [
  ...simpleSentences.map(([arabic, meaning]) =>
    fill(`Ayat ${arabic} bermaksud ________.`, meaning, "Baca ayat Arab dan pilih maksud.", `${arabic} bermaksud ${meaning}.`, [meaning])
  ),
  ...simpleSentences.map(([arabic, meaning]) =>
    fill(`Bahasa Arab bagi ayat "${meaning}" ialah ________.`, arabic, "Ingat susunan ayat Arab dan tulis dari kanan ke kiri.", `Ayat Arab yang betul ialah ${arabic}.`, [arabic])
  ),
];

const hiwarPairs = [
  ["السَّلَامُ عَلَيْكُمْ", "Salam sejahtera ke atas kamu"], ["وَعَلَيْكُمُ السَّلَامُ", "Dan salam sejahtera ke atas kamu"], ["مَا اسْمُكَ؟", "Apakah nama kamu?"], ["اِسْمِي أَحْمَدُ", "Nama saya Ahmad"], ["اِسْمِي فَاطِمَةُ", "Nama saya Fatimah"],
  ["كَيْفَ حَالُكَ؟", "Apa khabar kamu?"], ["أَنَا بِخَيْرٍ", "Saya sihat"], ["شُكْرًا", "Terima kasih"], ["عَفْوًا", "Sama-sama"], ["صَبَاحُ الْخَيْرِ", "Selamat pagi"],
  ["صَبَاحُ النُّورِ", "Selamat pagi juga"], ["مَسَاءُ الْخَيْرِ", "Selamat petang"], ["إِلَى اللِّقَاءِ", "Jumpa lagi"], ["أَيْنَ الْكِتَابُ؟", "Di manakah buku?"], ["الْكِتَابُ عَلَى الْمَكْتَبِ", "Buku di atas meja"],
  ["مَنْ هَذَا؟", "Siapakah ini?"], ["هَذَا أَبِي", "Ini ayah saya"], ["هَذِهِ أُمِّي", "Ini ibu saya"], ["مَاذَا تَفْعَلُ؟", "Apakah yang kamu buat?"], ["أَقْرَأُ كِتَابًا", "Saya membaca buku"],
  ["هَلْ أَنْتَ طَالِبٌ؟", "Adakah kamu murid lelaki?"], ["نَعَمْ", "Ya"], ["لَا", "Tidak"], ["تَفَضَّلْ", "Silakan"], ["أَنَا آسِفٌ", "Saya minta maaf"],
];

const hiwarQuestions = [
  ...hiwarPairs.map(([arabic, meaning]) =>
    fill(`Ungkapan ${arabic} bermaksud ________.`, meaning, "Padankan ungkapan dialog.", `${arabic} bermaksud ${meaning}.`, [meaning])
  ),
  ...hiwarPairs.map(([arabic, meaning]) =>
    fill(`Bahasa Arab bagi "${meaning}" ialah ________.`, arabic, "Ingat ungkapan yang sesuai dengan situasi dialog.", `Ungkapan Arab yang betul ialah ${arabic}.`, [arabic])
  ),
];

const comprehension = [
  ["هَذَا بَيْتٌ كَبِيرٌ", "Apakah benda dalam ayat ini?", "rumah", "بَيْتٌ bermaksud rumah."],
  ["هَذِهِ مَدْرَسَةٌ نَظِيفَةٌ", "Apakah tempat dalam ayat ini?", "sekolah", "مَدْرَسَةٌ bermaksud sekolah."],
  ["الْقِطُّ صَغِيرٌ", "Haiwan apakah dalam ayat ini?", "kucing", "قِطٌّ bermaksud kucing."],
  ["الْكَلْبُ كَبِيرٌ", "Haiwan apakah dalam ayat ini?", "anjing", "كَلْبٌ bermaksud anjing."],
  ["الْقَلَمُ أَزْرَقُ", "Apakah warna pensel?", "biru", "أَزْرَقُ bermaksud biru."],
  ["الْحَقِيبَةُ حَمْرَاءُ", "Apakah warna beg?", "merah", "حَمْرَاءُ bermaksud merah."],
  ["أَنَا أَكْتُبُ بِالْقَلَمِ", "Apakah alat yang digunakan untuk menulis?", "pen", "بِالْقَلَمِ bermaksud dengan pen."],
  ["أَقْرَأُ كِتَابًا", "Apakah yang dibaca?", "buku", "كِتَابًا bermaksud buku."],
  ["أَشْرَبُ مَاءً", "Apakah yang diminum?", "air", "مَاءً bermaksud air."],
  ["آكُلُ تُفَّاحًا", "Apakah buah yang dimakan?", "epal", "تُفَّاحًا bermaksud epal."],
  ["أَبِي فِي الْبَيْتِ", "Siapakah di rumah?", "ayah", "أَبِي bermaksud ayah saya."],
  ["أُمِّي فِي الْمَطْبَخِ", "Siapakah di dapur?", "ibu", "أُمِّي bermaksud ibu saya."],
  ["الْمُعَلِّمُ فِي الْفَصْلِ", "Siapakah di kelas?", "guru lelaki", "الْمُعَلِّمُ bermaksud guru lelaki."],
  ["الطَّالِبُ فِي الْمَدْرَسَةِ", "Siapakah di sekolah?", "murid lelaki", "الطَّالِبُ bermaksud murid lelaki."],
  ["الْبِنْتُ تَقْرَأُ", "Apakah yang dibuat oleh budak perempuan?", "membaca", "تَقْرَأُ bermaksud membaca."],
  ["الْوَلَدُ يَكْتُبُ", "Apakah yang dibuat oleh budak lelaki?", "menulis", "يَكْتُبُ bermaksud menulis."],
  ["الْبَابُ مَفْتُوحٌ", "Apakah keadaan pintu?", "terbuka", "مَفْتُوحٌ bermaksud terbuka."],
  ["الْكُرْسِيُّ جَدِيدٌ", "Apakah keadaan kerusi?", "baharu", "جَدِيدٌ bermaksud baharu."],
  ["الْفَصْلُ نَظِيفٌ", "Apakah keadaan kelas?", "bersih", "نَظِيفٌ bermaksud bersih."],
  ["الْمَسْجِدُ قَرِيبٌ", "Apakah keadaan masjid?", "dekat", "قَرِيبٌ bermaksud dekat."],
  ["الْبَيْتُ بَعِيدٌ", "Apakah keadaan rumah?", "jauh", "بَعِيدٌ bermaksud jauh."],
  ["عِنْدِي كِتَابٌ", "Apakah maksud ayat ini?", "Saya ada buku", "عِنْدِي كِتَابٌ bermaksud saya ada buku."],
  ["عِنْدِي قَلَمٌ", "Apakah maksud ayat ini?", "Saya ada pen", "عِنْدِي قَلَمٌ bermaksud saya ada pen."],
  ["فِي حَقِيبَتِي مِمْحَاةٌ", "Apakah benda yang ada di dalam beg?", "pemadam", "مِمْحَاةٌ bermaksud pemadam."],
  ["فِي فَصْلِي سَبُّورَةٌ", "Apakah benda yang ada di dalam kelas?", "papan tulis", "سَبُّورَةٌ bermaksud papan tulis."],
];

const comprehensionFollowUps = [
  ["هَذَا بَيْتٌ كَبِيرٌ", "Apakah perkataan Arab bagi rumah?", "بَيْتٌ", "بَيْتٌ bermaksud rumah."],
  ["هَذِهِ مَدْرَسَةٌ نَظِيفَةٌ", "Apakah perkataan Arab bagi sekolah?", "مَدْرَسَةٌ", "مَدْرَسَةٌ bermaksud sekolah."],
  ["الْقِطُّ صَغِيرٌ", "Apakah perkataan Arab bagi kucing?", "قِطٌّ", "قِطٌّ bermaksud kucing."],
  ["الْكَلْبُ كَبِيرٌ", "Apakah perkataan Arab bagi anjing?", "كَلْبٌ", "كَلْبٌ bermaksud anjing."],
  ["الْقَلَمُ أَزْرَقُ", "Apakah perkataan Arab bagi biru?", "أَزْرَقُ", "أَزْرَقُ bermaksud biru."],
  ["الْحَقِيبَةُ حَمْرَاءُ", "Apakah perkataan Arab bagi merah?", "حَمْرَاءُ", "حَمْرَاءُ bermaksud merah."],
  ["أَنَا أَكْتُبُ بِالْقَلَمِ", "Apakah frasa Arab yang bermaksud \"dengan pen\"?", "بِالْقَلَمِ", "بِالْقَلَمِ bermaksud dengan pen."],
  ["أَقْرَأُ كِتَابًا", "Apakah perkataan Arab bagi buku?", "كِتَابًا", "كِتَابًا bermaksud buku."],
  ["أَشْرَبُ مَاءً", "Apakah perkataan Arab bagi air?", "مَاءً", "مَاءً bermaksud air."],
  ["آكُلُ تُفَّاحًا", "Apakah perkataan Arab bagi epal?", "تُفَّاحًا", "تُفَّاحًا bermaksud epal."],
  ["أَبِي فِي الْبَيْتِ", "Apakah perkataan Arab bagi ayah saya?", "أَبِي", "أَبِي bermaksud ayah saya."],
  ["أُمِّي فِي الْمَطْبَخِ", "Apakah perkataan Arab bagi ibu saya?", "أُمِّي", "أُمِّي bermaksud ibu saya."],
  ["الْمُعَلِّمُ فِي الْفَصْلِ", "Apakah perkataan Arab bagi guru lelaki?", "الْمُعَلِّمُ", "الْمُعَلِّمُ bermaksud guru lelaki."],
  ["الطَّالِبُ فِي الْمَدْرَسَةِ", "Apakah perkataan Arab bagi murid lelaki?", "الطَّالِبُ", "الطَّالِبُ bermaksud murid lelaki."],
  ["الْبِنْتُ تَقْرَأُ", "Apakah perkataan Arab bagi membaca?", "تَقْرَأُ", "تَقْرَأُ bermaksud membaca."],
  ["الْوَلَدُ يَكْتُبُ", "Apakah perkataan Arab bagi menulis?", "يَكْتُبُ", "يَكْتُبُ bermaksud menulis."],
  ["الْبَابُ مَفْتُوحٌ", "Apakah perkataan Arab bagi terbuka?", "مَفْتُوحٌ", "مَفْتُوحٌ bermaksud terbuka."],
  ["الْكُرْسِيُّ جَدِيدٌ", "Apakah perkataan Arab bagi baharu?", "جَدِيدٌ", "جَدِيدٌ bermaksud baharu."],
  ["الْفَصْلُ نَظِيفٌ", "Apakah perkataan Arab bagi bersih?", "نَظِيفٌ", "نَظِيفٌ bermaksud bersih."],
  ["الْمَسْجِدُ قَرِيبٌ", "Apakah perkataan Arab bagi dekat?", "قَرِيبٌ", "قَرِيبٌ bermaksud dekat."],
  ["الْبَيْتُ بَعِيدٌ", "Apakah perkataan Arab bagi jauh?", "بَعِيدٌ", "بَعِيدٌ bermaksud jauh."],
  ["عِنْدِي كِتَابٌ", "Apakah perkataan Arab bagi buku?", "كِتَابٌ", "كِتَابٌ bermaksud buku."],
  ["عِنْدِي قَلَمٌ", "Apakah perkataan Arab bagi pen?", "قَلَمٌ", "قَلَمٌ bermaksud pen."],
  ["فِي حَقِيبَتِي مِمْحَاةٌ", "Apakah perkataan Arab bagi pemadam?", "مِمْحَاةٌ", "مِمْحَاةٌ bermaksud pemadam."],
  ["فِي فَصْلِي سَبُّورَةٌ", "Apakah perkataan Arab bagi papan tulis?", "سَبُّورَةٌ", "سَبُّورَةٌ bermaksud papan tulis."],
];

const kefahamanQuestions = [
  ...comprehension.map(([arabic, question, answer, explanation]) =>
    fill(`${arabic}. ${question} ________.`, answer, "Baca ayat Arab dan cari maklumat penting.", explanation)
  ),
  ...comprehensionFollowUps.map(([arabic, question, answer, explanation]) =>
    fill(
      `Baca ayat ${arabic}. ${question
        .replace(/^Apakah perkataan Arab (?:bagi|yang bermaksud\s+)["“]?(.+?)["”]?\?$/u, 'Salin perkataan Arab dalam ayat yang bermaksud "$1".')
        .replace(/^Apakah frasa Arab (?:bagi|yang bermaksud\s+)["“]?(.+?)["”]?\?$/u, 'Salin frasa Arab dalam ayat yang bermaksud "$1".')} ________.`,
      answer,
      "Cari dan salin perkataan atau frasa Arab yang menjadi bukti dalam ayat.",
      explanation
    )
  ),
];

const rawArabSubject = {
  id: "arab",
  title: "Bahasa Arab Tahun 2",
  short: "Arab",
  icon: "🇸🇦",
  color: "teal",
  topics: [
    {
      id: "huruf_hijaiyah",
      title: "Huruf Hijaiyah",
      note: "Kenal huruf hijaiyah, nama huruf dan tanda baris asas.",
      questions: makeQuestions("HURUF_HIJAIYAH", hurufHijaiyahQuestions),
    },
    {
      id: "mufradat",
      title: "Mufradat",
      note: "Kosa kata asas sekolah, rumah, makanan dan kata mudah.",
      questions: makeQuestions("MUFRADAT", mufradatQuestions),
    },
    {
      id: "nombor_arab",
      title: "Nombor Arab",
      note: "Nombor 1 hingga 20, simbol dan perkataan Arab.",
      questions: makeQuestions("NOMBOR_ARAB", nomborArabQuestions),
    },
    {
      id: "warna_arab",
      title: "Warna",
      note: "Warna asas dalam Bahasa Arab.",
      questions: makeQuestions("WARNA_ARAB", warnaQuestions),
    },
    {
      id: "keluarga",
      title: "Ahli Keluarga",
      note: "Kosa kata ahli keluarga dan sapaan mudah.",
      questions: makeQuestions("KELUARGA", keluargaQuestions),
    },
    {
      id: "haiwan_arab",
      title: "Haiwan",
      note: "Nama haiwan biasa dalam Bahasa Arab.",
      questions: makeQuestions("HAIWAN_ARAB", haiwanQuestions),
    },
    {
      id: "anggota_badan",
      title: "Anggota Badan",
      note: "Nama anggota badan dalam Bahasa Arab.",
      questions: makeQuestions("ANGGOTA_BADAN", anggotaQuestions),
    },
    {
      id: "ayat_mudah_arab",
      title: "Ayat Mudah",
      note: "Ayat ringkas tentang diri, sekolah, rumah dan benda.",
      questions: makeQuestions("AYAT_MUDAH_ARAB", ayatMudahQuestions),
    },
    {
      id: "hiwar",
      title: "Hiwar",
      note: "Dialog asas seperti salam, nama, khabar dan izin.",
      questions: makeQuestions("HIWAR", hiwarQuestions),
    },
    {
      id: "kefahaman_arab",
      title: "Kefahaman Arab",
      note: "Kefahaman ayat ringkas dan maklumat mudah.",
      questions: makeQuestions("KEFAHAMAN_ARAB", kefahamanQuestions),
    },
  ],
};

const ARAB_TOPIC_ENRICHMENTS = Object.freeze({
  huruf_hijaiyah: {
    note: "Murid mengenal, menyebut dan membezakan huruf hijaiyah serta tanda baris asas melalui bentuk, titik dan arah bacaan.",
    learningObjectives: [
      "Mengenal dan menyebut huruf hijaiyah dengan tepat.",
      "Membezakan huruf berdasarkan bentuk, bilangan titik dan kedudukan titik.",
      "Mengenal fathah, kasrah, dammah dan arah bacaan tulisan Arab."
    ]
  },
  mufradat: {
    note: "Murid membaca, menyebut dan memadankan kosa kata asas berkaitan sekolah, rumah, makanan, masa, sifat dan orang.",
    learningObjectives: [
      "Menyebut kosa kata asas dengan panduan Rumi yang sesuai.",
      "Memadankan perkataan Arab dengan maksud Bahasa Melayu yang tepat.",
      "Membezakan kata tunjuk maskulin هَذَا dan feminin هَذِهِ."
    ]
  },
  nombor_arab: {
    note: "Murid mengenal simbol, membaca perkataan dan menggunakan urutan nombor Arab ١ hingga ٢٠.",
    learningObjectives: [
      "Memadankan simbol nombor Arab dengan nilai Bahasa Melayu.",
      "Membaca perkataan nombor Arab satu hingga dua puluh.",
      "Melengkapkan urutan nombor sebelum dan selepas."
    ]
  },
  warna_arab: {
    note: "Murid menyebut, memahami dan menggunakan kosa kata warna asas Bahasa Arab dalam konteks mudah.",
    learningObjectives: [
      "Memadankan perkataan warna Arab dengan maksudnya.",
      "Menulis perkataan warna Arab berdasarkan warna yang diberi.",
      "Menggunakan petunjuk objek harian untuk mengenal warna."
    ]
  },
  keluarga: {
    note: "Murid membaca dan menggunakan kosa kata ahli keluarga dengan perbezaan jantina dan milikan yang jelas.",
    learningObjectives: [
      "Memadankan kosa kata ahli keluarga Arab dengan maksud Bahasa Melayu.",
      "Membezakan istilah lelaki, perempuan dan bentuk milikan saya.",
      "Menulis kosa kata keluarga dalam tulisan Arab."
    ]
  },
  haiwan_arab: {
    note: "Murid menyebut, memahami dan menulis nama haiwan biasa dalam Bahasa Arab.",
    learningObjectives: [
      "Mengenal nama haiwan melalui perkataan Arab.",
      "Memadankan nama haiwan Arab dan Bahasa Melayu.",
      "Menulis nama haiwan yang diberi dalam tulisan Arab."
    ]
  },
  anggota_badan: {
    note: "Murid menyebut, memahami dan menulis kosa kata anggota badan termasuk bentuk milikan saya.",
    learningObjectives: [
      "Memadankan perkataan anggota badan Arab dengan maksud tepat.",
      "Membezakan kosa kata kaki, tapak kaki dan jantung.",
      "Mengenal bentuk milikan seperti رَأْسِي dan يَدِي."
    ]
  },
  ayat_mudah_arab: {
    note: "Murid membaca, memahami dan membina semula ayat mudah tentang diri, keluarga, sekolah, rumah dan benda.",
    learningObjectives: [
      "Menterjemah ayat mudah Arab kepada Bahasa Melayu.",
      "Memadankan ayat Bahasa Melayu dengan ayat Arab tanpa petunjuk jawapan langsung.",
      "Membaca ayat mengikut susunan perkataan dari kanan ke kiri."
    ]
  },
  hiwar: {
    note: "Murid memahami dan menggunakan ungkapan dialog asas untuk salam, nama, khabar, pertanyaan dan respons sopan.",
    learningObjectives: [
      "Memadankan ungkapan hiwar dengan maksud yang tepat.",
      "Memilih ungkapan Arab yang sesuai bagi situasi perbualan.",
      "Menyebut soalan dan respons dengan intonasi yang jelas."
    ]
  },
  kefahaman_arab: {
    note: "Murid memahami ayat ringkas, mengenal maklumat tersurat dan mengekstrak perkataan Arab yang menjadi bukti jawapan.",
    learningObjectives: [
      "Mengenal orang, benda, tempat, warna, perbuatan dan keadaan dalam ayat.",
      "Menjawab soalan berdasarkan maklumat yang dinyatakan dalam ayat.",
      "Mengenal pasti perkataan atau frasa Arab yang menyokong jawapan."
    ]
  }
});

const ARAB_QUESTION_OVERRIDES = Object.freeze({
  "ARAB-MUFRADAT-002": { accepted: ["pen", "pensel"] },
  "ARAB-MUFRADAT-012": { accepted: ["papan tulis", "papan putih", "papan hitam"] },
  "ARAB-MUFRADAT-047": { accepted: ["ini (maskulin)", "ini", "ini untuk lelaki", "ini untuk kata nama maskulin"] },
  "ARAB-MUFRADAT-048": { accepted: ["ini (feminin)", "ini", "ini untuk perempuan", "ini untuk kata nama feminin"] },
  "ARAB-KELUARGA-003": { accepted: ["saudara lelaki", "abang", "adik lelaki"] },
  "ARAB-KELUARGA-004": { accepted: ["saudara perempuan", "kakak", "adik perempuan"] },
  "ARAB-KELUARGA-013": { accepted: ["saudara lelaki saya", "abang saya", "adik lelaki saya"] },
  "ARAB-KELUARGA-014": { accepted: ["saudara perempuan saya", "kakak saya", "adik perempuan saya"] },
  "ARAB-KELUARGA-024": { accepted: ["kerabat lelaki", "saudara-mara lelaki", "saudara lelaki"] },
  "ARAB-KELUARGA-025": { accepted: ["kerabat perempuan", "saudara-mara perempuan", "saudara perempuan"] },
  "ARAB-ANGGOTA_BADAN-015": { accepted: ["jantung", "hati"] },
  "ARAB-AYAT_MUDAH_ARAB-002": { accepted: ["Ini pen", "Ini pensel"] },
  "ARAB-AYAT_MUDAH_ARAB-018": { accepted: ["Pen itu biru", "Pensel itu biru"] },
  "ARAB-HIWAR-003": { accepted: ["Apakah nama kamu?", "Siapa nama kamu?"] },
  "ARAB-HIWAR-007": { accepted: ["Saya sihat", "Saya baik", "Saya dalam keadaan baik"] },
  "ARAB-KEFAHAMAN_ARAB-007": { accepted: ["pen", "pensel"] },
  "ARAB-KEFAHAMAN_ARAB-025": { accepted: ["papan tulis", "papan putih"] }
});

export const arabSubject = normalizeArabSubject(rawArabSubject, {
  topicEnrichments: ARAB_TOPIC_ENRICHMENTS,
  questionOverrides: ARAB_QUESTION_OVERRIDES
});

export default arabSubject;
