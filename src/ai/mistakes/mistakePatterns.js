export const MISTAKE_TYPES = {
  UNKNOWN_MISTAKE: 'UNKNOWN_MISTAKE',
  // Mathematics
  BORROWING_MISTAKE: 'BORROWING_MISTAKE',
  CARRYING_MISTAKE: 'CARRYING_MISTAKE',
  DIGIT_ALIGNMENT_MISTAKE: 'DIGIT_ALIGNMENT_MISTAKE',
  PLACE_VALUE_CONFUSION: 'PLACE_VALUE_CONFUSION',
  MULTIPLICATION_TABLE_RECALL: 'MULTIPLICATION_TABLE_RECALL',
  DIVISION_MISUNDERSTANDING: 'DIVISION_MISUNDERSTANDING',
  OPERATION_CONFUSION: 'OPERATION_CONFUSION',
  MONEY_CALCULATION_MISTAKE: 'MONEY_CALCULATION_MISTAKE',
  TIME_CALCULATION_MISTAKE: 'TIME_CALCULATION_MISTAKE',
  MEASUREMENT_CONVERSION_MISTAKE: 'MEASUREMENT_CONVERSION_MISTAKE',
  // Bahasa Melayu
  WRONG_PENJODOH_BILANGAN: 'WRONG_PENJODOH_BILANGAN',
  WRONG_KATA_KERJA: 'WRONG_KATA_KERJA',
  WRONG_KATA_NAMA: 'WRONG_KATA_NAMA',
  WRONG_KATA_ADJEKTIF: 'WRONG_KATA_ADJEKTIF',
  WRONG_KATA_HUBUNG: 'WRONG_KATA_HUBUNG',
  WRONG_KATA_SENDI: 'WRONG_KATA_SENDI',
  SENTENCE_STRUCTURE_ISSUE: 'SENTENCE_STRUCTURE_ISSUE',
  GRAMMAR_ISSUE: 'GRAMMAR_ISSUE',
  READING_COMPREHENSION_ISSUE: 'READING_COMPREHENSION_ISSUE',
  // English
  SUBJECT_VERB_AGREEMENT: 'SUBJECT_VERB_AGREEMENT',
  PLURAL_CONFUSION: 'PLURAL_CONFUSION',
  VERB_TENSE_CONFUSION: 'VERB_TENSE_CONFUSION',
  PREPOSITION_MISTAKE: 'PREPOSITION_MISTAKE',
  ARTICLE_MISTAKE: 'ARTICLE_MISTAKE',
  VOCABULARY_CONFUSION: 'VOCABULARY_CONFUSION',
  READING_COMPREHENSION_MISTAKE: 'READING_COMPREHENSION_MISTAKE',
  // Science
  CONCEPT_MISCONCEPTION: 'CONCEPT_MISCONCEPTION',
  OBSERVATION_MISTAKE: 'OBSERVATION_MISTAKE',
  CLASSIFICATION_MISTAKE: 'CLASSIFICATION_MISTAKE',
  LIVING_NON_LIVING_CONFUSION: 'LIVING_NON_LIVING_CONFUSION',
  BODY_PARTS_MISUNDERSTANDING: 'BODY_PARTS_MISUNDERSTANDING',
  PLANT_MISCONCEPTION: 'PLANT_MISCONCEPTION',
  MATTER_MISCONCEPTION: 'MATTER_MISCONCEPTION',
  LIGHT_SOUND_MISCONCEPTION: 'LIGHT_SOUND_MISCONCEPTION',
  // Arabic
  ARABIC_VOCABULARY_CONFUSION: 'ARABIC_VOCABULARY_CONFUSION',
  LETTER_CONFUSION: 'LETTER_CONFUSION',
  PRONUNCIATION_CONFUSION: 'PRONUNCIATION_CONFUSION',
  READING_MISTAKE: 'READING_MISTAKE',
  WRITING_MISTAKE: 'WRITING_MISTAKE',
  GENDER_CONFUSION: 'GENDER_CONFUSION',
  NUMBER_CONFUSION: 'NUMBER_CONFUSION',
  // Islam
  JAWI_READING_ISSUE: 'JAWI_READING_ISSUE',
  HAFAZAN_RECALL_ISSUE: 'HAFAZAN_RECALL_ISSUE',
  IBADAH_SEQUENCE_ISSUE: 'IBADAH_SEQUENCE_ISSUE',
  AKHLAK_MISCONCEPTION: 'AKHLAK_MISCONCEPTION',
  SIRAH_CONFUSION: 'SIRAH_CONFUSION',
  // PJ / PK
  SAFETY_MISCONCEPTION: 'SAFETY_MISCONCEPTION',
  HEALTH_MISCONCEPTION: 'HEALTH_MISCONCEPTION',
  BODY_MOVEMENT_MISUNDERSTANDING: 'BODY_MOVEMENT_MISUNDERSTANDING',
  NUTRITION_MISUNDERSTANDING: 'NUTRITION_MISUNDERSTANDING'
};

function createRule(type, patterns = [], teacherSuggestion = '', recommendedPractice = '', difficultyLevel = 'medium') {
  return {
    type,
    patterns,
    teacherSuggestion,
    recommendedPractice,
    difficultyLevel
  };
}

export const GENERAL_PATTERNS = [
  createRule(MISTAKE_TYPES.UNKNOWN_MISTAKE, [], 'Baca semula soalan dengan perlahan.', 'Ulang latihan dengan bimbingan guru.', 'medium')
];

export const SUBJECT_RULES = {
  math: [
    createRule(MISTAKE_TYPES.BORROWING_MISTAKE, [/pinjam/i, /\bborrow/i, /kurang.*pinjam/i, /tolak.*pinjam/i], 'Tunjukkan langkah pinjam satu demi satu.', 'Latih operasi tolak dengan pinjaman.', 'medium'),
    createRule(MISTAKE_TYPES.CARRYING_MISTAKE, [/bawa/i, /\bcarry\b/i, /tambah.*bawa/i], 'Tunjukkan cara bawa nombor ke lajur seterusnya.', 'Latih operasi tambah dengan bawa.', 'medium'),
    createRule(MISTAKE_TYPES.DIGIT_ALIGNMENT_MISTAKE, [/nilai tempat/i, /susun digit/i, /lajur/i], 'Bantu murid menyusun digit mengikut nilai tempat.', 'Latih nombor dengan jadual nilai tempat.', 'medium'),
    createRule(MISTAKE_TYPES.PLACE_VALUE_CONFUSION, [/puluh/i, /ratus/i, /tempat nilai/i, /nilai tempat/i], 'Ulang semula konsep nilai tempat dengan contoh mudah.', 'Latih blok puluh dan saiz nombor.', 'medium'),
    createRule(MISTAKE_TYPES.MULTIPLICATION_TABLE_RECALL, [/darab/i, /jadual darab/i, /hafal/i, /pukal/i], 'Bantu murid mengingat fakta darab yang mudah.', 'Ulang fakta sifar hingga lima dahulu.', 'medium'),
    createRule(MISTAKE_TYPES.DIVISION_MISUNDERSTANDING, [/bahagi/i, /kongsi/i, /agih/i, /÷/], 'Tunjukkan maksud bahagi sebagai kongsi sama rata.', 'Latih pembahagian dengan objek nyata.', 'medium'),
    createRule(MISTAKE_TYPES.OPERATION_CONFUSION, [/tambah/i, /tolak/i, /darab/i, /bahagi/i, /operasi/i], 'Kenal pasti operasi yang betul sebelum mengira.', 'Latih kenal pasti operasi daripada ayat masalah.', 'medium'),
    createRule(MISTAKE_TYPES.MONEY_CALCULATION_MISTAKE, [/rm/i, /sen/i, /duit/i, /harga/i], 'Bimbing murid kira wang dengan unit yang betul.', 'Latih tambah dan tolak wang kecil dahulu.', 'medium'),
    createRule(MISTAKE_TYPES.TIME_CALCULATION_MISTAKE, [/masa/i, /jam/i, /minit/i, /pukul/i], 'Tunjukkan cara baca dan kira masa satu langkah pada satu masa.', 'Latih jam analog dan operasi minit.', 'medium'),
    createRule(MISTAKE_TYPES.MEASUREMENT_CONVERSION_MISTAKE, [/cm/i, /\bm\b/i, /kg/i, /\bg\b/i, /ml/i, /\bl\b/i, /ukuran/i], 'Bantu murid pilih unit ukuran yang sesuai.', 'Latih padankan alat ukur dengan unit.', 'medium')
  ],
  bm: [
    createRule(MISTAKE_TYPES.WRONG_PENJODOH_BILANGAN, [/penjodoh/i, /bilangan/i, /ekor|buah|batang|helai|orang/i], 'Padankan penjodoh bilangan dengan benda yang betul.', 'Latih kumpulan kata nama dan penjodoh bilangan.', 'medium'),
    createRule(MISTAKE_TYPES.WRONG_KATA_KERJA, [/kata kerja/i, /perbuatan/i, /melakukan/i], 'Cari kata yang menunjukkan perbuatan.', 'Latih kata kerja dalam ayat mudah.', 'medium'),
    createRule(MISTAKE_TYPES.WRONG_KATA_NAMA, [/kata nama/i, /nama orang/i, /nama tempat/i], 'Cari perkataan yang menamakan orang, tempat, haiwan atau benda.', 'Latih pengelasan kata nama.', 'medium'),
    createRule(MISTAKE_TYPES.WRONG_KATA_ADJEKTIF, [/kata adjektif/i, /sifat/i, /warna/i, /besar/i, /kecil/i], 'Cari perkataan yang menerangkan sifat.', 'Latih kata adjektif dalam ayat.', 'medium'),
    createRule(MISTAKE_TYPES.WRONG_KATA_HUBUNG, [/kata hubung/i, /dan/i, /atau/i, /tetapi/i], 'Cari kata yang menghubungkan ayat atau frasa.', 'Latih kata hubung yang biasa.', 'medium'),
    createRule(MISTAKE_TYPES.WRONG_KATA_SENDI, [/kata sendi/i, /di/i, /ke/i, /dari/i, /daripada/i], 'Cari kata sendi yang menunjukkan tempat atau arah.', 'Latih kata sendi nama dalam ayat.', 'medium'),
    createRule(MISTAKE_TYPES.SENTENCE_STRUCTURE_ISSUE, [/ayat/i, /susunan/i, /struktur/i], 'Bantu murid susun ayat dengan tertib yang betul.', 'Latih bina ayat mudah.', 'medium'),
    createRule(MISTAKE_TYPES.GRAMMAR_ISSUE, [/tatabahasa/i, /imbuhan/i, /ganti nama/i], 'Semak semula imbuhan dan susunan kata.', 'Latih tatabahasa asas.', 'medium'),
    createRule(MISTAKE_TYPES.READING_COMPREHENSION_ISSUE, [/baca/i, /petikan/i, /faham/i, /maksud/i], 'Baca petikan perlahan-lahan dan cari isi penting.', 'Latih soalan kefahaman.', 'medium')
  ],
  english: [
    createRule(MISTAKE_TYPES.SUBJECT_VERB_AGREEMENT, [/is\b/i, /are\b/i, /he\b/i, /she\b/i, /they\b/i], 'Check if the subject and verb match.', 'Practice singular and plural sentences.', 'medium'),
    createRule(MISTAKE_TYPES.PLURAL_CONFUSION, [/plural/i, /singular/i, /many/i, /one/i], 'Check whether the noun is singular or plural.', 'Practice singular and plural nouns.', 'medium'),
    createRule(MISTAKE_TYPES.VERB_TENSE_CONFUSION, [/past/i, /present/i, /future/i, /verb tense/i], 'Choose the verb tense that matches the sentence.', 'Practice regular verbs in simple sentences.', 'medium'),
    createRule(MISTAKE_TYPES.PREPOSITION_MISTAKE, [/preposition/i, /\bin\b/i, /\bon\b/i, /\bat\b/i, /\bto\b/i, /\bfrom\b/i], 'Check the preposition that fits the place or time.', 'Practice prepositions in simple contexts.', 'medium'),
    createRule(MISTAKE_TYPES.ARTICLE_MISTAKE, [/\ba\b/i, /\ban\b/i, /\bthe\b/i, /article/i], 'Choose the correct article.', 'Practice a, an and the.', 'medium'),
    createRule(MISTAKE_TYPES.VOCABULARY_CONFUSION, [/vocabulary/i, /word meaning/i, /meaning/i], 'Use the word that matches the picture or sentence.', 'Practice simple topic vocabulary.', 'medium'),
    createRule(MISTAKE_TYPES.READING_COMPREHENSION_MISTAKE, [/read/i, /comprehension/i, /passage/i, /question/i], 'Read the text again and find the key detail.', 'Practice short reading passages.', 'medium')
  ],
  sains: [
    createRule(MISTAKE_TYPES.CONCEPT_MISCONCEPTION, [/concept/i, /why/i, /because/i], 'Think about the science idea carefully.', 'Revisit the topic idea with examples.', 'medium'),
    createRule(MISTAKE_TYPES.OBSERVATION_MISTAKE, [/observe/i, /lihat/i, /pemerhatian/i], 'Look closely at the object or picture.', 'Practice observing and describing.', 'medium'),
    createRule(MISTAKE_TYPES.CLASSIFICATION_MISTAKE, [/classify/i, /group/i, /mengelaskan/i], 'Group items by the same feature.', 'Practice sorting by one feature.', 'medium'),
    createRule(MISTAKE_TYPES.LIVING_NON_LIVING_CONFUSION, [/living/i, /non-living/i, /hidup/i, /bukan hidup/i], 'Check whether it grows, breathes, or needs food.', 'Practice living and non-living things.', 'medium'),
    createRule(MISTAKE_TYPES.BODY_PARTS_MISUNDERSTANDING, [/body/i, /parts/i, /anggota badan/i], 'Match the body part with its function.', 'Practice naming body parts.', 'medium'),
    createRule(MISTAKE_TYPES.PLANT_MISCONCEPTION, [/plant/i, /tumbuhan/i, /daun/i, /akar/i], 'Think about the real part of the plant.', 'Practice plant parts and uses.', 'medium'),
    createRule(MISTAKE_TYPES.MATTER_MISCONCEPTION, [/matter/i, /bahan/i, /solid/i, /liquid/i, /gas/i], 'Check the material or state carefully.', 'Practice solids, liquids and gases.', 'medium'),
    createRule(MISTAKE_TYPES.LIGHT_SOUND_MISCONCEPTION, [/light/i, /cahaya/i, /sound/i, /bunyi/i], 'Remember how light or sound behaves.', 'Practice light and sound examples.', 'medium')
  ],
  arab: [
    createRule(MISTAKE_TYPES.ARABIC_VOCABULARY_CONFUSION, [/vocabulary/i, /kosa kata/i, /bahasa arab/i], 'Cuba semak makna perkataan Arab itu.', 'Practice matching Arabic words to pictures.', 'medium'),
    createRule(MISTAKE_TYPES.LETTER_CONFUSION, [/huruf/i, /letter/i, /alphabet/i], 'Bezakan huruf yang hampir sama.', 'Practice letter recognition.', 'medium'),
    createRule(MISTAKE_TYPES.PRONUNCIATION_CONFUSION, [/pronounce/i, /sebut/i, /bunyi/i], 'Sebutan perlu jelas dan perlahan.', 'Practice saying the word slowly.', 'medium'),
    createRule(MISTAKE_TYPES.READING_MISTAKE, [/read/i, /baca/i, /rqaa/i], 'Baca huruf demi huruf dengan teliti.', 'Practice reading short Arabic words.', 'medium'),
    createRule(MISTAKE_TYPES.WRITING_MISTAKE, [/write/i, /tulis/i, /writing/i], 'Tulisan perlu ikut bentuk huruf dengan betul.', 'Practice writing the letters carefully.', 'medium'),
    createRule(MISTAKE_TYPES.GENDER_CONFUSION, [/male/i, /female/i, /muzakkar/i, /muannath/i], 'Semak jantina perkataan itu.', 'Practice masculine and feminine words.', 'medium'),
    createRule(MISTAKE_TYPES.NUMBER_CONFUSION, [/number/i, /angka/i, /singular/i, /plural/i], 'Semak sama ada perkataan itu satu atau banyak.', 'Practice numbers in Arabic.', 'medium')
  ],
  islam: [
    createRule(MISTAKE_TYPES.JAWI_READING_ISSUE, [/jawi/i], 'Baca huruf Jawi satu demi satu.', 'Practice reading Jawi words.', 'medium'),
    createRule(MISTAKE_TYPES.HAFAZAN_RECALL_ISSUE, [/hafazan/i, /hafal/i, /doa/i, /surah/i], 'Ulang bacaan sedikit demi sedikit.', 'Practice memorising short recitations.', 'medium'),
    createRule(MISTAKE_TYPES.IBADAH_SEQUENCE_ISSUE, [/solat/i, /wuduk/i, /urutan/i, /langkah/i], 'Ikut urutan ibadah dengan tertib.', 'Practice the sequence step by step.', 'medium'),
    createRule(MISTAKE_TYPES.AKHLAK_MISCONCEPTION, [/akhlak/i, /adab/i, /sopan/i], 'Semak semula adab yang betul.', 'Practice good manners in daily life.', 'medium'),
    createRule(MISTAKE_TYPES.SIRAH_CONFUSION, [/sirah/i, /rasulullah/i, /saw/i], 'Bezakan peristiwa dan tokoh dengan teliti.', 'Practice simple sirah stories.', 'medium')
  ],
  pj: [
    createRule(MISTAKE_TYPES.SAFETY_MISCONCEPTION, [/safety/i, /keselamatan/i, /bahaya/i], 'Pilih tindakan yang paling selamat.', 'Practice safe movement choices.', 'medium'),
    createRule(MISTAKE_TYPES.BODY_MOVEMENT_MISUNDERSTANDING, [/movement/i, /pergerakan/i, /gerak/i], 'Tiru pergerakan asas dengan betul.', 'Practice basic body movements.', 'medium')
  ],
  pk: [
    createRule(MISTAKE_TYPES.HEALTH_MISCONCEPTION, [/health/i, /kesihatan/i, /sihat/i], 'Pilih amalan yang menjaga kesihatan.', 'Practice healthy habits.', 'medium'),
    createRule(MISTAKE_TYPES.NUTRITION_MISUNDERSTANDING, [/nutrition/i, /makanan/i, /pemakanan/i], 'Pilih makanan yang sesuai dan seimbang.', 'Practice healthy food choices.', 'medium'),
    createRule(MISTAKE_TYPES.SAFETY_MISCONCEPTION, [/safety/i, /keselamatan/i, /berbahaya/i], 'Utamakan keselamatan diri.', 'Practice personal safety.', 'medium')
  ]
};

export function getRulesForSubject(subjectId = '') {
  return SUBJECT_RULES[subjectId] || [];
}

export default {
  MISTAKE_TYPES,
  GENERAL_PATTERNS,
  SUBJECT_RULES,
  getRulesForSubject
};
