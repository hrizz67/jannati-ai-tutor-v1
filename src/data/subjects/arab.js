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
    difficulty: difficultyFor(index + 1),
    uasa: "UASA",
    dskp: "KSSR Arab",
  }));

const fill = (q, answer, hint, explanation, accepted) => ({
  q,
  answer,
  hint,
  explanation,
  accepted,
});

const hijaiyahLetters = [
  ["ا", "alif"], ["ب", "ba"], ["ت", "ta"], ["ث", "sa"], ["ج", "jim"],
  ["ح", "ha"], ["خ", "kha"], ["د", "dal"], ["ذ", "zal"], ["ر", "ra"],
  ["ز", "zai"], ["س", "sin"], ["ش", "syin"], ["ص", "sad"], ["ض", "dad"],
  ["ط", "tho"], ["ظ", "zho"], ["ع", "ain"], ["غ", "ghain"], ["ف", "fa"],
  ["ق", "qaf"], ["ك", "kaf"], ["ل", "lam"], ["م", "mim"], ["ن", "nun"],
  ["ه", "ha"], ["و", "wau"], ["ي", "ya"],
];

const hurufHijaiyahQuestions = [
  ...hijaiyahLetters.map(([letter, name]) =>
    fill(`Nama huruf Arab ${letter} ialah ________.`, name, "Perhatikan bentuk huruf.", `Huruf ${letter} dinamakan ${name}.`, [name, letter])
  ),
  fill("Huruf hijaiyah pertama ialah ________.", "ا", "Ingat huruf alif.", "Huruf hijaiyah pertama ialah alif, ا.", ["ا", "alif"]),
  fill("Huruf hijaiyah terakhir yang biasa dipelajari ialah ________.", "ي", "Ingat huruf ya.", "Huruf ya ditulis ي.", ["ي", "ya"]),
  fill("Huruf ب mempunyai satu titik di ________.", "bawah", "Lihat titik huruf ba.", "Huruf ba mempunyai satu titik di bawah."),
  fill("Huruf ت mempunyai dua titik di ________.", "atas", "Lihat titik huruf ta.", "Huruf ta mempunyai dua titik di atas."),
  fill("Huruf ث mempunyai tiga titik di ________.", "atas", "Lihat titik huruf sa.", "Huruf ث mempunyai tiga titik di atas."),
  fill("Huruf ج mempunyai satu titik di ________.", "bawah", "Lihat titik huruf jim.", "Huruf jim mempunyai satu titik di bawah."),
  fill("Huruf خ mempunyai satu titik di ________.", "atas", "Lihat titik huruf kha.", "Huruf kha mempunyai satu titik di atas."),
  fill("Huruf ذ mempunyai satu titik di ________.", "atas", "Lihat titik huruf zal.", "Huruf zal mempunyai satu titik di atas."),
  fill("Huruf ز mempunyai satu titik di ________.", "atas", "Lihat titik huruf zai.", "Huruf zai mempunyai satu titik di atas."),
  fill("Huruf ش mempunyai tiga titik di ________.", "atas", "Lihat titik huruf syin.", "Huruf syin mempunyai tiga titik di atas."),
  fill("Huruf ض mempunyai satu titik di ________.", "atas", "Lihat titik huruf dad.", "Huruf dad mempunyai satu titik di atas."),
  fill("Huruf ظ mempunyai satu titik di ________.", "atas", "Lihat titik huruf zho.", "Huruf zho mempunyai satu titik di atas."),
  fill("Huruf غ mempunyai satu titik di ________.", "atas", "Lihat titik huruf ghain.", "Huruf ghain mempunyai satu titik di atas."),
  fill("Huruf ف mempunyai satu titik di ________.", "atas", "Lihat titik huruf fa.", "Huruf fa mempunyai satu titik di atas."),
  fill("Huruf ق mempunyai dua titik di ________.", "atas", "Lihat titik huruf qaf.", "Huruf qaf mempunyai dua titik di atas."),
  fill("Huruf ن mempunyai satu titik di ________.", "atas", "Lihat titik huruf nun.", "Huruf nun mempunyai satu titik di atas."),
  fill("Tulisan Arab ditulis dari kanan ke ________.", "kiri", "Ingat arah tulisan Arab.", "Tulisan Arab ditulis dari kanan ke kiri."),
  fill("Baris atas dalam Arab disebut ________.", "fathah", "Fathah menghasilkan bunyi a.", "Fathah ialah baris atas."),
  fill("Baris bawah dalam Arab disebut ________.", "kasrah", "Kasrah menghasilkan bunyi i.", "Kasrah ialah baris bawah."),
  fill("Baris depan dalam Arab disebut ________.", "dammah", "Dammah menghasilkan bunyi u.", "Dammah ialah baris depan."),
  fill("Huruf ا dibaca ________.", "alif", "Lihat bentuk huruf ا.", "ا ialah huruf alif."),
  fill("Huruf م dibaca ________.", "mim", "Lihat bentuk huruf م.", "م ialah huruf mim."),
];

const vocab = [
  ["كِتَابٌ", "buku"], ["قَلَمٌ", "pensel"], ["حَقِيبَةٌ", "beg"], ["مِسْطَرَةٌ", "pembaris"], ["مِمْحَاةٌ", "pemadam"],
  ["مَدْرَسَةٌ", "sekolah"], ["فَصْلٌ", "kelas"], ["بَابٌ", "pintu"], ["نَافِذَةٌ", "tingkap"], ["كُرْسِيٌّ", "kerusi"],
  ["مَكْتَبٌ", "meja"], ["سَبُّورَةٌ", "papan putih"], ["بَيْتٌ", "rumah"], ["مَسْجِدٌ", "masjid"], ["سُوقٌ", "pasar"],
  ["مَاءٌ", "air"], ["طَعَامٌ", "makanan"], ["خُبْزٌ", "roti"], ["أَرُزٌّ", "nasi"], ["حَلِيبٌ", "susu"],
  ["تُفَّاحٌ", "epal"], ["مَوْزٌ", "pisang"], ["عِنَبٌ", "anggur"], ["تَمْرٌ", "kurma"], ["عَصِيرٌ", "jus"],
  ["صَبَاحٌ", "pagi"], ["مَسَاءٌ", "petang"], ["لَيْلٌ", "malam"], ["يَوْمٌ", "hari"], ["أُسْبُوعٌ", "minggu"],
  ["كَبِيرٌ", "besar"], ["صَغِيرٌ", "kecil"], ["جَدِيدٌ", "baharu"], ["قَدِيمٌ", "lama"], ["جَمِيلٌ", "cantik"],
  ["نَظِيفٌ", "bersih"], ["قَرِيبٌ", "dekat"], ["بَعِيدٌ", "jauh"], ["سَرِيعٌ", "laju"], ["بَطِيءٌ", "perlahan"],
  ["طَالِبٌ", "murid lelaki"], ["طَالِبَةٌ", "murid perempuan"], ["مُعَلِّمٌ", "guru lelaki"], ["مُعَلِّمَةٌ", "guru perempuan"], ["صَدِيقٌ", "kawan lelaki"],
  ["صَدِيقَةٌ", "kawan perempuan"], ["هَذَا", "ini lelaki"], ["هَذِهِ", "ini perempuan"], ["مَا", "apa"], ["مَنْ", "siapa"],
];

const mufradatQuestions = vocab.map(([arabic, meaning]) =>
  fill(`Perkataan Arab ${arabic} bermaksud ________.`, meaning, "Padankan perkataan Arab dengan maksudnya.", `${arabic} bermaksud ${meaning}.`, [meaning, arabic])
);

const numbers = [
  ["١", "وَاحِدٌ", "satu"], ["٢", "اِثْنَانِ", "dua"], ["٣", "ثَلَاثَةٌ", "tiga"], ["٤", "أَرْبَعَةٌ", "empat"], ["٥", "خَمْسَةٌ", "lima"],
  ["٦", "سِتَّةٌ", "enam"], ["٧", "سَبْعَةٌ", "tujuh"], ["٨", "ثَمَانِيَةٌ", "lapan"], ["٩", "تِسْعَةٌ", "sembilan"], ["١٠", "عَشَرَةٌ", "sepuluh"],
  ["١١", "أَحَدَ عَشَرَ", "sebelas"], ["١٢", "اِثْنَا عَشَرَ", "dua belas"], ["١٣", "ثَلَاثَةَ عَشَرَ", "tiga belas"], ["١٤", "أَرْبَعَةَ عَشَرَ", "empat belas"], ["١٥", "خَمْسَةَ عَشَرَ", "lima belas"],
  ["١٦", "سِتَّةَ عَشَرَ", "enam belas"], ["١٧", "سَبْعَةَ عَشَرَ", "tujuh belas"], ["١٨", "ثَمَانِيَةَ عَشَرَ", "lapan belas"], ["١٩", "تِسْعَةَ عَشَرَ", "sembilan belas"], ["٢٠", "عِشْرُونَ", "dua puluh"],
];

const nomborArabQuestions = [
  ...numbers.map(([digit, word, meaning]) =>
    fill(`Nombor Arab ${digit} dibaca ________.`, meaning, "Lihat simbol nombor Arab.", `${digit} dibaca ${meaning}, iaitu ${word}.`, [meaning, word, digit])
  ),
  ...numbers.map(([digit, word, meaning]) =>
    fill(`Perkataan ${word} bermaksud ________.`, meaning, "Padankan nombor Arab dengan Bahasa Melayu.", `${word} bermaksud ${meaning}.`, [meaning, digit, word])
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
  ["أَبٌ", "ayah"], ["أُمٌّ", "ibu"], ["أَخٌ", "abang"], ["أُخْتٌ", "kakak"], ["جَدٌّ", "datuk"],
  ["جَدَّةٌ", "nenek"], ["عَمٌّ", "bapa saudara"], ["عَمَّةٌ", "ibu saudara"], ["اِبْنٌ", "anak lelaki"], ["بِنْتٌ", "anak perempuan"],
  ["أَبِي", "ayah saya"], ["أُمِّي", "ibu saya"], ["أَخِي", "abang saya"], ["أُخْتِي", "kakak saya"], ["جَدِّي", "datuk saya"],
  ["جَدَّتِي", "nenek saya"], ["أُسْرَةٌ", "keluarga"], ["وَالِدٌ", "bapa"], ["وَالِدَةٌ", "ibu"], ["طِفْلٌ", "kanak-kanak lelaki"],
  ["طِفْلَةٌ", "kanak-kanak perempuan"], ["زَوْجٌ", "suami"], ["زَوْجَةٌ", "isteri"], ["قَرِيبٌ", "saudara lelaki"], ["قَرِيبَةٌ", "saudara perempuan"],
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
  ["رِجْلٌ", "kaki"], ["إِصْبَعٌ", "jari"], ["بَطْنٌ", "perut"], ["ظَهْرٌ", "belakang"], ["قَلْبٌ", "hati"],
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
  ["هَذَا كِتَابٌ", "Ini buku"], ["هَذَا قَلَمٌ", "Ini pensel"], ["هَذِهِ حَقِيبَةٌ", "Ini beg"], ["هَذَا بَابٌ", "Ini pintu"], ["هَذِهِ نَافِذَةٌ", "Ini tingkap"],
  ["أَنَا طَالِبٌ", "Saya murid lelaki"], ["أَنَا طَالِبَةٌ", "Saya murid perempuan"], ["أَنَا أَكْتُبُ", "Saya menulis"], ["أَنَا أَقْرَأُ", "Saya membaca"], ["أَنَا آكُلُ", "Saya makan"],
  ["أَنَا أَشْرَبُ", "Saya minum"], ["أَبِي فِي الْبَيْتِ", "Ayah saya di rumah"], ["أُمِّي فِي الْمَطْبَخِ", "Ibu saya di dapur"], ["الْقِطُّ صَغِيرٌ", "Kucing itu kecil"], ["الْبَيْتُ كَبِيرٌ", "Rumah itu besar"],
  ["الْكِتَابُ جَدِيدٌ", "Buku itu baharu"], ["الْفَصْلُ نَظِيفٌ", "Kelas itu bersih"], ["الْقَلَمُ أَزْرَقُ", "Pensel itu biru"], ["الْحَقِيبَةُ حَمْرَاءُ", "Beg itu merah"], ["الْوَلَدُ يَكْتُبُ", "Budak lelaki menulis"],
  ["الْبِنْتُ تَقْرَأُ", "Budak perempuan membaca"], ["الْمُعَلِّمُ فِي الْفَصْلِ", "Guru lelaki di kelas"], ["الْمُعَلِّمَةُ فِي الْمَدْرَسَةِ", "Guru perempuan di sekolah"], ["الْمَاءُ بَارِدٌ", "Air itu sejuk"], ["الطَّعَامُ لَذِيذٌ", "Makanan itu sedap"],
];

const ayatMudahQuestions = [
  ...simpleSentences.map(([arabic, meaning]) =>
    fill(`Ayat ${arabic} bermaksud ________.`, meaning, "Baca ayat Arab dan pilih maksud.", `${arabic} bermaksud ${meaning}.`, [meaning, arabic])
  ),
  ...simpleSentences.map(([arabic, meaning]) =>
    fill(`Bahasa Arab bagi ayat "${meaning}" ialah ________.`, arabic, "Padankan ayat Melayu dengan Arab.", `Ayat Arab yang betul ialah ${arabic}.`, [arabic, meaning])
  ),
];

const hiwarPairs = [
  ["السَّلَامُ عَلَيْكُمْ", "Salam sejahtera ke atas kamu"], ["وَعَلَيْكُمُ السَّلَامُ", "Dan salam sejahtera ke atas kamu"], ["مَا اسْمُكَ؟", "Siapa nama kamu?"], ["اِسْمِي أَحْمَدُ", "Nama saya Ahmad"], ["اِسْمِي فَاطِمَةُ", "Nama saya Fatimah"],
  ["كَيْفَ حَالُكَ؟", "Apa khabar kamu?"], ["أَنَا بِخَيْرٍ", "Saya baik"], ["شُكْرًا", "Terima kasih"], ["عَفْوًا", "Sama-sama"], ["صَبَاحُ الْخَيْرِ", "Selamat pagi"],
  ["صَبَاحُ النُّورِ", "Selamat pagi juga"], ["مَسَاءُ الْخَيْرِ", "Selamat petang"], ["إِلَى اللِّقَاءِ", "Jumpa lagi"], ["أَيْنَ الْكِتَابُ؟", "Di manakah buku?"], ["الْكِتَابُ عَلَى الْمَكْتَبِ", "Buku di atas meja"],
  ["مَنْ هَذَا؟", "Siapakah ini?"], ["هَذَا أَبِي", "Ini ayah saya"], ["هَذِهِ أُمِّي", "Ini ibu saya"], ["مَاذَا تَفْعَلُ؟", "Apakah yang kamu buat?"], ["أَقْرَأُ كِتَابًا", "Saya membaca buku"],
  ["هَلْ أَنْتَ طَالِبٌ؟", "Adakah kamu murid lelaki?"], ["نَعَمْ", "Ya"], ["لَا", "Tidak"], ["تَفَضَّلْ", "Silakan"], ["أَنَا آسِفٌ", "Saya minta maaf"],
];

const hiwarQuestions = [
  ...hiwarPairs.map(([arabic, meaning]) =>
    fill(`Ungkapan ${arabic} bermaksud ________.`, meaning, "Padankan ungkapan dialog.", `${arabic} bermaksud ${meaning}.`, [meaning, arabic])
  ),
  ...hiwarPairs.map(([arabic, meaning]) =>
    fill(`Bahasa Arab bagi "${meaning}" ialah ________.`, arabic, "Pilih ungkapan Arab yang sesuai.", `Ungkapan Arab yang betul ialah ${arabic}.`, [arabic, meaning])
  ),
];

const comprehension = [
  ["هَذَا بَيْتٌ كَبِيرٌ", "Apakah benda dalam ayat ini?", "rumah", "بَيْتٌ bermaksud rumah."],
  ["هَذِهِ مَدْرَسَةٌ نَظِيفَةٌ", "Apakah tempat dalam ayat ini?", "sekolah", "مَدْرَسَةٌ bermaksud sekolah."],
  ["الْقِطُّ صَغِيرٌ", "Haiwan apakah dalam ayat ini?", "kucing", "قِطٌّ bermaksud kucing."],
  ["الْكَلْبُ كَبِيرٌ", "Haiwan apakah dalam ayat ini?", "anjing", "كَلْبٌ bermaksud anjing."],
  ["الْقَلَمُ أَزْرَقُ", "Apakah warna pensel?", "biru", "أَزْرَقُ bermaksud biru."],
  ["الْحَقِيبَةُ حَمْرَاءُ", "Apakah warna beg?", "merah", "حَمْرَاءُ bermaksud merah."],
  ["أَنَا أَكْتُبُ بِالْقَلَمِ", "Apakah yang digunakan untuk menulis?", "pensel", "قَلَمٌ bermaksud pensel."],
  ["أَقْرَأُ كِتَابًا", "Apakah yang dibaca?", "buku", "كِتَابٌ bermaksud buku."],
  ["أَشْرَبُ مَاءً", "Apakah yang diminum?", "air", "مَاءٌ bermaksud air."],
  ["آكُلُ تُفَّاحًا", "Apakah buah yang dimakan?", "epal", "تُفَّاحٌ bermaksud epal."],
  ["أَبِي فِي الْبَيْتِ", "Siapakah di rumah?", "ayah", "أَبِي bermaksud ayah saya."],
  ["أُمِّي فِي الْمَطْبَخِ", "Siapakah di dapur?", "ibu", "أُمِّي bermaksud ibu saya."],
  ["الْمُعَلِّمُ فِي الْفَصْلِ", "Siapakah di kelas?", "guru lelaki", "مُعَلِّمٌ bermaksud guru lelaki."],
  ["الطَّالِبُ فِي الْمَدْرَسَةِ", "Siapakah di sekolah?", "murid lelaki", "طَالِبٌ bermaksud murid lelaki."],
  ["الْبِنْتُ تَقْرَأُ", "Apakah yang dibuat oleh budak perempuan?", "membaca", "تَقْرَأُ bermaksud membaca."],
  ["الْوَلَدُ يَكْتُبُ", "Apakah yang dibuat oleh budak lelaki?", "menulis", "يَكْتُبُ bermaksud menulis."],
  ["الْبَابُ مَفْتُوحٌ", "Apakah keadaan pintu?", "terbuka", "مَفْتُوحٌ bermaksud terbuka."],
  ["الْكُرْسِيُّ جَدِيدٌ", "Apakah keadaan kerusi?", "baharu", "جَدِيدٌ bermaksud baharu."],
  ["الْفَصْلُ نَظِيفٌ", "Apakah keadaan kelas?", "bersih", "نَظِيفٌ bermaksud bersih."],
  ["الْمَسْجِدُ قَرِيبٌ", "Apakah keadaan masjid?", "dekat", "قَرِيبٌ bermaksud dekat."],
  ["الْبَيْتُ بَعِيدٌ", "Apakah keadaan rumah?", "jauh", "بَعِيدٌ bermaksud jauh."],
  ["عِنْدِي كِتَابٌ", "Apakah yang saya ada?", "buku", "كِتَابٌ bermaksud buku."],
  ["عِنْدِي قَلَمٌ", "Apakah yang saya ada?", "pensel", "قَلَمٌ bermaksud pensel."],
  ["فِي حَقِيبَتِي مِمْحَاةٌ", "Apakah di dalam beg saya?", "pemadam", "مِمْحَاةٌ bermaksud pemadam."],
  ["فِي فَصْلِي سَبُّورَةٌ", "Apakah di dalam kelas saya?", "papan putih", "سَبُّورَةٌ bermaksud papan putih."],
];

const kefahamanQuestions = [
  ...comprehension.map(([arabic, question, answer, explanation]) =>
    fill(`${arabic}. ${question} ________.`, answer, "Baca ayat Arab dan cari maklumat penting.", explanation)
  ),
  ...comprehension.map(([arabic, question, answer, explanation]) =>
    fill(`Dalam ayat ${arabic}, jawapan bagi soalan "${question}" ialah ________.`, answer, "Cari perkataan utama dalam ayat.", explanation)
  ),
];

export const arabSubject = {
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

export default arabSubject;
