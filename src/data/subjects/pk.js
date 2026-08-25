import { attachInteractiveQuestionExamplesToSubject } from '../interactiveQuestionExamples.js';

const SUBJECT = "Pendidikan Kesihatan Tahun 2";
const DSKP = "KSSR Semakan Pendidikan Kesihatan Tahun 2";

const difficultyFor = (index) => {
  if (index < 20) return "mudah";
  if (index < 40) return "sederhana";
  return "sukar";
};

const COGNITIVE_SEQUENCE_BY_TOPIC = Object.freeze({
  KEBERSIHAN_DIRI: ["mengaplikasi", "memahami", "menganalisis", "mengaplikasi", "menilai"],
  PEMAKANAN_SIHAT: ["memahami", "mengaplikasi", "menganalisis", "mengaplikasi", "memahami"],
  KESELAMATAN_DIRI: ["mengaplikasi", "mengaplikasi", "mengaplikasi", "menganalisis", "menilai"],
  KESIHATAN_MENTAL_EMOSI: ["mengaplikasi", "memahami", "mengaplikasi", "menganalisis", "menganalisis"],
  KESELAMATAN_JALAN_RAYA: ["mengaplikasi", "menganalisis", "mengaplikasi", "mengaplikasi", "menilai"],
  PENCEGAHAN_PENYAKIT: ["mengaplikasi", "memahami", "mengaplikasi", "menganalisis", "menilai"],
  PERTOLONGAN_CEMAS_ASAS: ["mengaplikasi", "mengaplikasi", "menganalisis", "menganalisis", "memahami"],
  KESIHATAN_PERSEKITARAN: ["mengaplikasi", "menganalisis", "mengaplikasi", "menilai", "menganalisis"],
  GAYA_HIDUP_SIHAT: ["memahami", "memahami", "menganalisis", "mengaplikasi", "menganalisis"],
});

const cognitiveLevelFor = (topicCode, index) => {
  const sequence = COGNITIVE_SEQUENCE_BY_TOPIC[topicCode];
  if (sequence) return sequence[index % sequence.length];
  if (index < 10) return "mengingat";
  if (index < 20) return "memahami";
  if (index < 35) return "mengaplikasi";
  if (index < 45) return "menganalisis";
  return "menilai";
};

const optionSet = (answer, options) => {
  const unique = [answer, ...options.filter((item) => item !== answer)];
  return [...new Set(unique)].slice(0, 4).sort();
};

const ask = (question, answer, options, hint, explanation, extras = {}) => ({
  question,
  answer,
  options,
  hint,
  explanation,
  ...extras,
});

const contextualChoiceAsk = (question, answer, options, frame, hint, explanation, extras = {}) => {
  const render = (choice) => frame(choice);
  return ask(question, render(answer), options.map(render), hint, explanation, {
    accepted: [answer],
    ...extras,
  });
};

const makeQuestion = (topicCode, topicTitle, item, index) => {
  const question = item.question;
  return {
    id: `PK-${topicCode}-${String(index + 1).padStart(3, "0")}`,
    subject: SUBJECT,
    topic: topicTitle,
    difficulty: difficultyFor(index),
    question,
    q: question,
    options: optionSet(item.answer, item.options),
    answer: item.answer,
    accepted: [...new Set([item.answer, ...(item.accepted || [])])],
    questionType: item.questionType || "objective",
    cognitiveLevel: item.cognitiveLevel || cognitiveLevelFor(topicCode, index),
    hint: item.hint,
    explanation: item.explanation,
    uasa: "UASA",
    dskp: DSKP,
  };
};

const makeTopic = ({ id, code, title, note, items }) => ({
  id,
  title,
  note,
  questions: items.slice(0, 50).map((item, index) => makeQuestion(code, title, item, index)),
});

const nilai = ["berdisiplin", "bertanggungjawab", "berani berkata tidak", "prihatin", "bersopan", "jujur", "sabar"];
const orangDipercayai = ["guru", "ibu bapa", "penjaga", "ahli keluarga dewasa"];

const kebersihanPairs = [
  ["sebelum makan di kantin", "basuh tangan dengan sabun", "Tangan yang bersih membantu mengurangkan kuman dalam badan."],
  ["selepas keluar dari tandas", "basuh tangan dengan sabun", "Mencuci tangan selepas tandas membantu menjaga kesihatan diri."],
  ["sebelum tidur pada waktu malam", "gosok gigi", "Menggosok gigi sebelum tidur membantu menjaga gigi daripada berlubang."],
  ["selepas bangun pagi", "mandi dan pakai pakaian bersih", "Mandi dan memakai pakaian bersih membuat badan lebih segar."],
  ["kuku sudah panjang", "potong kuku", "Kuku pendek lebih bersih dan tidak mudah menyimpan kotoran."],
  ["rambut kusut sebelum ke sekolah", "sikat rambut", "Rambut yang kemas membantu murid menjaga kebersihan diri."],
  ["stoking berbau selepas bersukan", "tukar stoking bersih", "Stoking bersih membantu kaki tidak berbau dan lebih selesa."],
  ["batuk atau bersin", "tutup mulut dan hidung", "Menutup mulut dan hidung membantu mengurangkan penyebaran kuman."],
  ["muka berpeluh selepas bermain", "cuci muka", "Mencuci muka membersihkan peluh dan kotoran."],
  ["tuala sudah lembap dan berbau", "jemur tuala", "Tuala yang dijemur cepat kering dan kurang kuman."],
].flatMap(([situasi, answer, explanation]) => [
  contextualChoiceAsk(`Apakah amalan kebersihan yang betul ${situasi}?`, answer, [answer, "makan tanpa cuci tangan", "pakai baju kotor", "kongsi berus gigi"], (choice) => `Dalam situasi ${situasi}, amalan yang betul ialah "${choice}".`, "Pilih amalan yang menjaga kebersihan badan.", explanation),
  contextualChoiceAsk(`Mengapakah murid perlu ${answer} apabila ${situasi}?`, "mengelakkan kuman", ["mengelakkan kuman", "menambah kotoran", "melambatkan perjalanan ke kelas", "mengelakkan keperluan untuk mandi"], (choice) => `Amalan "${answer}" dalam situasi ${situasi} membantu ${choice}.`, "Kebersihan membantu badan sihat.", `${answer} membantu mengurangkan kuman dan menjaga kesihatan diri.`),
  contextualChoiceAsk(`Apakah akibat jika murid tidak menjaga kebersihan ${situasi}?`, "mudah sakit", ["mudah sakit", "semakin cergas", "gigi terus kuat", "baju menjadi wangi"], (choice) => `Kesan jika kebersihan tidak dijaga dalam situasi ${situasi} ialah ${choice}.`, "Kotoran dan kuman boleh memudaratkan badan.", "Tidak menjaga kebersihan boleh menyebabkan bau badan, sakit perut, sakit gigi atau jangkitan."),
  contextualChoiceAsk(`Siapakah yang boleh mengingatkan murid tentang kebersihan diri ${situasi}?`, "ibu bapa", ["ibu bapa", "orang tidak dikenali", "pemandu lori", "penjual mainan"], (choice) => `Orang yang boleh mengingatkan murid tentang kebersihan diri dalam situasi ${situasi} ialah ${choice}.`, "Pilih orang dewasa yang menjaga murid.", "Ibu bapa, penjaga dan guru boleh membimbing murid menjaga kebersihan diri."),
  contextualChoiceAsk(`Nilai apakah yang ditunjukkan apabila murid ${answer} apabila ${situasi}?`, "bertanggungjawab", nilai, (choice) => `Apabila murid melakukan amalan "${answer}" dalam situasi ${situasi}, nilai yang ditunjukkan ialah ${choice}.`, "Menjaga diri ialah tanggungjawab sendiri.", "Murid yang menjaga kebersihan menunjukkan sikap bertanggungjawab terhadap kesihatan diri."),
]);

const pemakananPairs = [
  ["sarapan sebelum ke sekolah", "memberi tenaga", "Sarapan membantu murid bertenaga dan boleh fokus semasa belajar."],
  ["makan sayur waktu tengah hari", "membantu penghadaman", "Sayur mengandungi serat yang baik untuk penghadaman."],
  ["makan buah sebagai snek", "pilihan snek sihat", "Buah lebih sihat daripada makanan terlalu manis."],
  ["minum air kosong selepas bermain", "menggantikan air badan", "Air kosong membantu tubuh kekal segar selepas berpeluh."],
  ["mengurangkan minuman bergas", "kurangkan gula", "Minuman bergas biasanya tinggi gula dan tidak elok diminum selalu."],
  ["makan nasi, ikan dan sayur", "makanan seimbang", "Makanan seimbang mengandungi tenaga, protein, vitamin dan mineral."],
  ["membasuh buah sebelum makan", "membuang kotoran", "Buah perlu dibasuh untuk mengurangkan kotoran dan kuman."],
  ["makan mengikut waktu", "mengelakkan terlalu lapar", "Makan mengikut waktu membantu tubuh mendapat tenaga yang cukup."],
  ["memilih makanan di kantin", "pilih makanan bersih", "Makanan yang bersih lebih selamat dimakan."],
  ["makan secara sederhana", "elak makan berlebihan", "Makan sederhana membantu badan kekal sihat dan selesa."],
].flatMap(([amalan, answer, explanation]) => [
  contextualChoiceAsk(`Apakah kebaikan ${amalan}?`, answer, [answer, "menyebabkan cepat letih", "membuat badan kotor", "mengurangkan tumpuan"], (choice) => `Kebaikan ${amalan} ialah ${choice}.`, "Fikirkan manfaat makanan kepada badan.", explanation),
  contextualChoiceAsk(`Apakah pilihan paling sihat berkaitan amalan ${amalan}?`, amalan.includes("air kosong") ? "air kosong" : amalan.includes("buah") ? "buah" : amalan.includes("sayur") ? "sayur" : "makanan seimbang", ["air kosong", "buah", "sayur", "makanan seimbang", "gula-gula", "minuman bergas"], (choice) => `Pilihan sihat berkaitan ${amalan} ialah ${choice}.`, "Pilih makanan atau minuman yang membantu badan sihat.", "Pilihan makanan sihat membantu murid membesar, belajar dan bermain dengan baik."),
  contextualChoiceAsk(`Mengapakah murid tidak digalakkan makan makanan terlalu manis setiap hari semasa ${amalan}?`, "boleh merosakkan gigi", ["boleh merosakkan gigi", "membuat kuku bersih", "membuat mata lebih besar", "menjadikan kasut kemas"], (choice) => `Jika diambil terlalu kerap semasa ${amalan}, makanan terlalu manis ${choice}.`, "Gula yang banyak tidak baik untuk gigi.", "Makanan terlalu manis boleh merosakkan gigi dan tidak baik jika diambil berlebihan."),
  contextualChoiceAsk(`Apakah tindakan betul jika makanan berbau pelik ketika ${amalan}?`, "jangan makan dan beritahu guru", ["jangan makan dan beritahu guru", "makan cepat-cepat", "kongsi dengan rakan", "simpan dalam beg"], (choice) => `Jika makanan berbau pelik ketika ${amalan}, tindakan murid ialah ${choice}.`, "Makanan rosak boleh menyebabkan sakit perut.", "Murid perlu menolak makanan yang rosak dan memberitahu orang dewasa."),
  contextualChoiceAsk(`Apakah maksud pemakanan sihat dalam situasi ${amalan}?`, "memilih makanan baik untuk tubuh", ["memilih makanan baik untuk tubuh", "makan jajan sahaja", "tidak minum air", "makan tanpa basuh tangan"], (choice) => `Dalam situasi ${amalan}, pemakanan sihat bermaksud ${choice}.`, "Pemakanan sihat membantu badan.", "Pemakanan sihat bermaksud memilih makanan bersih, seimbang dan sesuai untuk tubuh."),
]);

const keselamatanDiriPairs = [
  ["orang tidak dikenali menawarkan gula-gula", "tolak dan beritahu guru", "Murid tidak patut menerima pemberian daripada orang tidak dikenali."],
  ["rakan mengajak bermain di stor gelap", "jangan ikut", "Stor gelap bukan tempat bermain yang selamat."],
  ["ada orang menyentuh bahagian sulit", "berkata tidak dan beritahu orang dipercayai", "Murid berhak menjaga tubuh sendiri dan perlu mendapatkan bantuan."],
  ["terjumpa objek tajam di padang", "jangan sentuh dan panggil guru", "Objek tajam boleh mencederakan tangan atau kaki."],
  ["terpisah daripada keluarga di pasar raya", "minta bantuan kaunter maklumat", "Kaunter maklumat ialah tempat sesuai untuk mendapatkan bantuan."],
  ["rakan membuli di sekolah", "beritahu guru", "Buli perlu dilaporkan supaya semua murid selamat."],
  ["pintu pagar sekolah sudah ditutup", "tunggu guru atau pengawal", "Murid perlu berada dengan orang dewasa yang bertugas."],
  ["melihat wayar elektrik terdedah", "jauhi dan beritahu orang dewasa", "Wayar elektrik boleh menyebabkan renjatan."],
  ["menerima mesej pelik di telefon keluarga", "beritahu ibu bapa", "Murid perlu meminta bantuan orang dewasa untuk perkara dalam talian."],
  ["rakan mengajak keluar kawasan sekolah", "jangan ikut tanpa izin", "Murid mesti mendapat izin guru atau ibu bapa sebelum keluar."],
].flatMap(([situasi, answer, explanation]) => [
  contextualChoiceAsk(`Apakah tindakan paling selamat jika ${situasi}?`, answer, [answer, "ikut sahaja", "diam dan simpan rahsia", "sentuh benda itu"], (choice) => `Jika ${situasi}, tindakan paling selamat ialah "${choice}".`, "Utamakan keselamatan diri.", explanation),
  contextualChoiceAsk(`Siapakah orang yang boleh dipercayai apabila ${situasi}?`, "guru", orangDipercayai, (choice) => `Apabila ${situasi}, orang dipercayai yang boleh membantu murid ialah ${choice}.`, "Pilih orang dewasa yang menjaga keselamatan murid.", "Guru, ibu bapa dan penjaga ialah orang dipercayai yang boleh membantu murid."),
  contextualChoiceAsk(`Apakah ayat yang sesuai digunakan apabila murid berasa tidak selamat kerana ${situasi}?`, "Tidak, saya tidak mahu", ["Tidak, saya tidak mahu", "Saya ikut semua arahan awak", "Jangan beritahu sesiapa", "Saya akan pergi sendiri"], (choice) => `Apabila ${situasi}, murid boleh berkata, "${choice}."`, "Murid boleh berkata tidak dengan tegas.", "Berkata tidak dengan tegas membantu murid melindungi diri daripada situasi berbahaya."),
  contextualChoiceAsk(`Mengapakah murid perlu memberitahu orang dewasa apabila ${situasi}?`, "supaya mendapat bantuan", ["supaya mendapat bantuan", "supaya masalah disembunyikan", "supaya kawan takut", "supaya boleh ponteng"], (choice) => `Murid perlu memberitahu orang dewasa apabila ${situasi} ${choice}.`, "Orang dewasa boleh bertindak.", "Memberitahu orang dewasa membantu murid mendapat perlindungan dan nasihat yang betul."),
  contextualChoiceAsk(`Nilai apakah yang penting apabila menghadapi situasi ${situasi}?`, "berani berkata tidak", nilai, (choice) => `Nilai penting apabila menghadapi situasi ${situasi} ialah ${choice}.`, "Keselamatan diri memerlukan keberanian.", "Berani berkata tidak membantu murid menjaga tubuh, ruang diri dan keselamatan."),
]);

const emosiPairs = [
  ["kecewa kerana kalah permainan", "tarik nafas dan cuba lagi", "kecewa", "Menarik nafas membantu murid bertenang sebelum mencuba semula."],
  ["marah apabila mainan diambil rakan", "bercakap dengan baik", "marah", "Bercakap dengan baik membantu menyelesaikan masalah tanpa bergaduh."],
  ["takut membuat persembahan", "beritahu guru", "takut", "Guru boleh memberi sokongan dan galakan."],
  ["sedih kerana ditegur", "dengar nasihat dan baiki diri", "sedih", "Teguran yang baik membantu murid belajar menjadi lebih baik."],
  ["gembira mendapat pujian", "ucap terima kasih", "gembira", "Mengucapkan terima kasih menunjukkan adab yang baik."],
  ["risau sebelum ujian", "ulang kaji dan bertenang", "risau", "Ulang kaji dan bertenang membantu murid lebih yakin."],
  ["rakan kelihatan muram", "bertanya dengan sopan", "bimbang", "Bertanya dengan sopan menunjukkan sikap prihatin."],
  ["tidak dipilih dalam kumpulan", "minta bantuan guru", "kecewa", "Guru boleh membantu membahagikan kumpulan dengan adil."],
  ["terlalu seronok hingga menjerit", "kawal suara", "teruja", "Mengawal suara menjaga ketenteraman kelas."],
  ["buat salah kepada rakan", "minta maaf", "bersalah", "Meminta maaf membantu memulihkan hubungan dengan rakan."],
].flatMap(([situasi, answer, emotion, explanation]) => [
  contextualChoiceAsk(`Apakah cara yang baik untuk mengurus emosi apabila murid ${situasi}?`, answer, [answer, "menolak rakan", "menjerit kuat", "menyimpan marah"], (choice) => `Apabila murid ${situasi}, cara yang baik untuk mengurus emosi ialah "${choice}".`, "Pilih cara yang tenang dan sopan.", explanation),
  contextualChoiceAsk(`Apakah emosi yang mungkin dirasai apabila murid ${situasi}?`, emotion, ["marah", "takut", "sedih", "gembira", "risau", "kecewa", "bimbang", "teruja", "bersalah"], (choice) => `Emosi yang mungkin dirasai apabila murid ${situasi} ialah ${choice}.`, "Kenal pasti perasaan dalam situasi itu.", "Mengenal emosi sendiri membantu murid memilih tindakan yang baik."),
  contextualChoiceAsk(`Siapakah yang boleh membantu murid apabila ${situasi}?`, "guru", orangDipercayai, (choice) => `Apabila ${situasi}, orang yang boleh membantu murid ialah ${choice}.`, "Cari orang dewasa yang dipercayai.", "Guru dan ibu bapa boleh mendengar masalah murid serta memberi nasihat."),
  contextualChoiceAsk(`Mengapakah murid perlu bercakap dengan sopan apabila ${situasi}?`, "mengelakkan pergaduhan", ["mengelakkan pergaduhan", "menambah kemarahan", "membuat rakan menangis", "membuat kelas bising"], (choice) => `Bercakap dengan sopan apabila ${situasi} membantu ${choice}.`, "Kata-kata yang baik menenangkan keadaan.", "Bercakap dengan sopan membantu menjaga hubungan baik dengan rakan."),
  contextualChoiceAsk(`Apakah tanda emosi diurus dengan baik apabila ${situasi}?`, "murid menjadi lebih tenang", ["murid menjadi lebih tenang", "murid menolak meja", "murid mengejek rakan", "murid lari keluar kelas"], (choice) => `Tanda emosi diurus dengan baik apabila ${situasi} ialah ${choice}.`, "Emosi yang baik membuat badan dan fikiran tenang.", "Murid yang tenang boleh berfikir dan bertindak dengan lebih selamat."),
]);

const jalanRayaPairs = [
  ["melintas jalan di hadapan sekolah", "guna lintasan pejalan kaki", "kiri dan kanan", "Lintasan pejalan kaki membantu pemandu melihat murid dengan lebih jelas."],
  ["lampu isyarat pejalan kaki berwarna merah", "berhenti", "lampu isyarat dan keadaan jalan", "Merah bermaksud pejalan kaki perlu berhenti."],
  ["lampu isyarat pejalan kaki berwarna hijau", "melintas dengan berhati-hati", "kiri dan kanan", "Hijau membenarkan pejalan kaki melintas selepas melihat kiri dan kanan."],
  ["menaiki kereta ke sekolah", "pakai tali pinggang keledar", "tali pinggang keledar sudah dipasang", "Tali pinggang keledar membantu melindungi penumpang."],
  ["menaiki motosikal dengan ayah", "pakai topi keledar", "topi keledar dipasang dengan betul", "Topi keledar melindungi kepala jika berlaku kemalangan."],
  ["berjalan di tepi jalan", "guna laluan pejalan kaki", "kenderaan yang datang", "Laluan pejalan kaki lebih selamat daripada berjalan di tengah jalan."],
  ["turun dari bas sekolah", "tunggu bas bergerak sebelum melintas", "jalan sudah jelas", "Murid perlu pastikan jalan jelas sebelum melintas."],
  ["bola tergolek ke jalan raya", "minta bantuan orang dewasa", "kenderaan di jalan", "Murid tidak patut berlari mengejar bola ke jalan raya."],
  ["jalan raya sibuk", "pegang tangan orang dewasa", "kiri dan kanan", "Orang dewasa boleh membantu murid melintas dengan selamat."],
  ["berbasikal di kawasan rumah", "pakai topi keselamatan", "jalan dan kenderaan di hadapan", "Topi keselamatan membantu melindungi kepala semasa berbasikal."],
].flatMap(([situasi, answer, safetyCheck, explanation]) => [
  contextualChoiceAsk(`Apakah tindakan selamat apabila ${situasi}?`, answer, [answer, "berlari tanpa melihat", "bermain di jalan raya", "melintas sambil bergurau"], (choice) => `Apabila ${situasi}, tindakan yang selamat ialah "${choice}".`, "Fikirkan peraturan keselamatan jalan raya.", explanation),
  contextualChoiceAsk(`Mengapakah murid perlu berhati-hati apabila ${situasi}?`, "mengelakkan kemalangan", ["mengelakkan kemalangan", "cepat sampai", "boleh bermain", "membuat jalan sesak"], (choice) => `Murid perlu berhati-hati apabila ${situasi} untuk ${choice}.`, "Jalan raya mempunyai kenderaan.", "Berhati-hati di jalan raya dapat mengurangkan risiko kemalangan."),
  contextualChoiceAsk(`Apakah perkara yang perlu diperhatikan apabila ${situasi}?`, safetyCheck, [safetyCheck, "kasut sahaja", "awan", "beg sekolah"], (choice) => `Apabila ${situasi}, murid perlu melihat atau memastikan ${choice}.`, "Perhatikan peraturan, alat keselamatan dan arah kenderaan.", "Memerhatikan keadaan sekeliling dan alat keselamatan membantu murid mengelakkan bahaya."),
  contextualChoiceAsk(`Siapakah yang sesuai membantu murid Tahun 2 apabila ${situasi}?`, "orang dewasa", ["orang dewasa", "rakan sebaya sahaja", "orang tidak dikenali", "diri sendiri sahaja"], (choice) => `Apabila ${situasi}, pihak yang sesuai membantu murid Tahun 2 ialah ${choice}.`, "Murid kecil perlu bimbingan.", "Orang dewasa boleh membimbing murid mematuhi peraturan jalan raya."),
  contextualChoiceAsk(`Apakah nilai yang ditunjukkan apabila murid mematuhi peraturan ketika ${situasi}?`, "berdisiplin", nilai, (choice) => `Mematuhi peraturan ketika ${situasi} menunjukkan nilai ${choice}.`, "Peraturan memerlukan disiplin.", "Berdisiplin di jalan raya membantu menjaga keselamatan diri dan orang lain."),
]);

const penyakitPairs = [
  ["demam dan batuk", "berehat dan beritahu ibu bapa", "mendapat penjagaan yang sesuai", "Berehat dan memberitahu ibu bapa membantu murid mendapat penjagaan."],
  ["selesema di kelas", "tutup hidung ketika bersin", "mengurangkan penyebaran titisan kuman", "Menutup hidung mengurangkan penyebaran titisan kuman."],
  ["sebelum makan", "basuh tangan", "menyingkirkan kuman pada tangan", "Mencuci tangan sebelum makan membantu mencegah sakit perut."],
  ["nyamuk banyak di rumah", "buang air bertakung", "menghalang nyamuk daripada membiak", "Air bertakung boleh menjadi tempat pembiakan nyamuk."],
  ["rakan sakit mata", "elak berkongsi tuala", "mengurangkan risiko jangkitan", "Tidak berkongsi tuala membantu mengurangkan jangkitan."],
  ["luka kecil di lutut", "bersihkan luka", "mengurangkan risiko luka dijangkiti", "Luka yang dibersihkan kurang risiko dijangkiti kuman."],
  ["makanan terdedah kepada lalat", "jangan makan", "mengelakkan sakit akibat makanan tercemar", "Lalat boleh membawa kuman ke makanan."],
  ["kelas berhabuk", "bersihkan kelas", "mengurangkan habuk dan kuman", "Persekitaran bersih membantu mengurangkan habuk dan kuman."],
  ["selepas bermain di luar", "mandi atau cuci tangan dan kaki", "menanggalkan kotoran pada badan", "Membersihkan diri selepas bermain mengurangkan kotoran."],
  ["batuk berpanjangan", "berjumpa doktor", "mendapat pemeriksaan dan rawatan", "Doktor boleh memeriksa dan memberi rawatan yang sesuai."],
].flatMap(([situasi, answer, benefit, explanation]) => [
  contextualChoiceAsk(`Apakah tindakan menjaga kesihatan apabila ${situasi}?`, answer, [answer, "kongsi tuala", "biar makanan terbuka", "tidak cuci tangan"], (choice) => `Apabila ${situasi}, tindakan menjaga kesihatan ialah "${choice}".`, "Pilih tindakan yang mengurangkan risiko penyakit.", explanation),
  contextualChoiceAsk(`Mengapakah amalan ${answer} penting apabila ${situasi}?`, benefit, [benefit, "menambah kotoran", "membuat badan lemah", "menyebabkan kelas bising"], (choice) => `Amalan "${answer}" penting apabila ${situasi} kerana membantu ${choice}.`, "Fikirkan manfaat tindakan itu kepada kesihatan.", `${answer} membantu ${benefit}.`),
  contextualChoiceAsk(`Siapakah yang perlu diberitahu jika murid tidak sihat kerana ${situasi}?`, "ibu bapa", orangDipercayai, (choice) => `Jika murid tidak sihat kerana ${situasi}, murid perlu memberitahu ${choice}.`, "Orang dewasa boleh membantu.", "Ibu bapa, penjaga atau guru boleh membawa murid mendapatkan bantuan yang sesuai."),
  contextualChoiceAsk(`Apakah tanda murid mungkin tidak sihat dalam situasi ${situasi}?`, situasi.includes("luka") ? "luka sakit" : "badan tidak selesa", ["badan tidak selesa", "terlalu bertenaga", "kasut bersih", "rambut kemas"], (choice) => `Dalam situasi ${situasi}, tanda murid mungkin tidak sihat ialah ${choice}.`, "Penyakit membuat badan rasa tidak selesa.", "Murid perlu peka terhadap tanda badan tidak sihat supaya boleh mendapatkan bantuan."),
  contextualChoiceAsk(`Apakah sikap yang baik untuk mencegah penyakit berkaitan ${situasi}?`, "menjaga kebersihan", ["menjaga kebersihan", "berkongsi botol air", "membuang sampah merata-rata", "tidak mandi"], (choice) => `Sikap yang berkaitan dengan pencegahan penyakit apabila ${situasi} ialah ${choice}.`, "Kebersihan ialah kunci kesihatan.", "Menjaga kebersihan diri dan persekitaran membantu mencegah penyakit."),
]);

const pertolonganPairs = [
  ["lutut rakan luka kecil", "beritahu guru", "Guru boleh membantu membersihkan luka dan memberi rawatan awal."],
  ["hidung berdarah", "duduk dan tunduk sedikit", "Duduk dan tunduk sedikit membantu darah tidak mengalir ke tekak."],
  ["rakan terjatuh di padang", "jangan angkat sendiri", "Mengangkat rakan tanpa bantuan boleh memburukkan kecederaan."],
  ["tangan melecur ringan", "sejukkan dengan air mengalir", "Air mengalir boleh membantu mengurangkan rasa panas pada lecur ringan."],
  ["digigit serangga", "beritahu orang dewasa", "Orang dewasa boleh memeriksa gigitan dan memberi bantuan."],
  ["rakan pening selepas aktiviti", "bawa ke tempat teduh dan panggil guru", "Tempat teduh membantu rakan berehat sementara guru membantu."],
  ["terkena serpihan kecil", "jangan korek sendiri", "Mengorek sendiri boleh menyebabkan luka lebih teruk."],
  ["terseliuh semasa bermain", "hentikan aktiviti", "Berhenti bermain membantu mengelakkan kecederaan menjadi lebih teruk."],
  ["terkena air panas", "jauhkan dari punca panas", "Menjauhkan diri daripada punca panas mengelakkan kecederaan tambahan."],
  ["perlu menggunakan peti pertolongan cemas", "guna dengan bantuan guru", "Peti pertolongan cemas perlu digunakan dengan pengawasan orang dewasa."],
].flatMap(([situasi, answer, explanation]) => [
  contextualChoiceAsk(`Apakah tindakan awal yang betul apabila ${situasi}?`, answer, [answer, "ketawa", "sembunyikan kejadian", "terus bermain"], (choice) => `Apabila ${situasi}, tindakan awal yang betul ialah "${choice}".`, "Pertolongan cemas perlu selamat dan tenang.", explanation),
  contextualChoiceAsk(`Siapakah yang perlu dipanggil apabila ${situasi}?`, "guru", orangDipercayai, (choice) => `Apabila ${situasi}, murid perlu memanggil ${choice}.`, "Di sekolah, guru boleh membantu.", "Guru atau orang dewasa perlu dipanggil supaya bantuan diberi dengan betul."),
  contextualChoiceAsk(`Mengapakah murid tidak boleh panik apabila ${situasi}?`, "supaya boleh mendapatkan bantuan", ["supaya boleh mendapatkan bantuan", "supaya rakan takut", "supaya lambat bertindak", "supaya luka kotor"], (choice) => `Murid perlu bertenang apabila ${situasi} ${choice}.`, "Tenang membantu kita fikir dengan baik.", "Bertenang membantu murid memanggil bantuan dan mengikut arahan dengan selamat."),
  contextualChoiceAsk(`Apakah perkara yang tidak patut dibuat apabila ${situasi}?`, "sembunyikan kejadian", ["sembunyikan kejadian", "beritahu guru", "duduk dengan tenang", "minta bantuan"], (choice) => `Perkara yang tidak patut dilakukan apabila ${situasi} ialah ${choice}.`, "Kecederaan perlu diketahui orang dewasa.", "Menyembunyikan kejadian boleh melambatkan bantuan dan membahayakan murid."),
  contextualChoiceAsk(`Apakah tujuan pertolongan cemas dalam situasi ${situasi}?`, "memberi bantuan awal", ["memberi bantuan awal", "menggantikan doktor sepenuhnya", "membuat rakan malu", "meneruskan permainan"], (choice) => `Dalam situasi ${situasi}, tujuan pertolongan cemas ialah ${choice}.`, "Pertolongan cemas ialah bantuan pertama.", "Pertolongan cemas memberi bantuan awal sebelum rawatan lanjut jika diperlukan."),
]);

const persekitaranPairs = [
  ["sampah di bawah meja", "buang ke dalam tong sampah", "Membuang sampah di tong menjaga kelas bersih."],
  ["longkang sekolah tersumbat", "lapor kepada guru", "Longkang tersumbat boleh menyebabkan air bertakung dan nyamuk membiak."],
  ["bekas air kosong di halaman", "terbalikkan bekas", "Bekas air boleh menakung air dan menjadi tempat nyamuk."],
  ["kelas bersepah selepas aktiviti", "kemas bersama-sama", "Mengemas bersama menjadikan kelas selamat dan selesa."],
  ["tandas sekolah kotor", "gunakan dengan bersih dan lapor guru", "Tandas bersih mengurangkan bau dan kuman."],
  ["makanan tumpah di lantai", "lap dan bersihkan", "Lantai yang bersih mengelakkan semut dan tergelincir."],
  ["tingkap kelas berdebu", "lap dengan kain sesuai", "Mengurangkan habuk membantu pernafasan lebih selesa."],
  ["pokok bunga perlu dijaga", "siram dengan sederhana", "Menjaga tanaman menjadikan persekitaran lebih ceria."],
  ["tong sampah penuh", "beritahu pekerja atau guru", "Tong sampah penuh perlu diurus supaya tidak berbau."],
  ["alat permainan berselerak", "susun semula alat", "Alat tersusun mengelakkan murid tersadung."],
].flatMap(([situasi, answer, explanation]) => [
  contextualChoiceAsk(`Apakah tindakan menjaga kesihatan persekitaran apabila ${situasi}?`, answer, [answer, "biarkan sahaja", "tambah sampah", "sembunyikan kotoran"], (choice) => `Apabila ${situasi}, tindakan menjaga kesihatan persekitaran ialah "${choice}".`, "Persekitaran bersih membantu kesihatan.", explanation),
  contextualChoiceAsk(`Mengapakah murid perlu menjaga kebersihan persekitaran semasa ${situasi}?`, "mengelakkan kuman dan bahaya", ["mengelakkan kuman dan bahaya", "membuat kelas berbau", "menambah bilangan nyamuk", "membuat lantai licin"], (choice) => `Menjaga kebersihan persekitaran semasa ${situasi} membantu ${choice}.`, "Tempat bersih lebih selamat.", "Persekitaran bersih membantu mencegah penyakit dan kemalangan kecil."),
  contextualChoiceAsk(`Siapakah yang patut bekerjasama apabila ${situasi}?`, "semua murid", ["semua murid", "seorang murid sahaja", "orang tidak dikenali", "murid yang lewat sahaja"], (choice) => `Apabila ${situasi}, pihak yang patut bekerjasama ialah ${choice}.`, "Kebersihan sekolah ialah tanggungjawab bersama.", "Semua murid perlu bekerjasama menjaga kelas dan sekolah."),
  contextualChoiceAsk(`Apakah nilai yang diamalkan apabila murid ${answer} semasa ${situasi}?`, "bertanggungjawab", nilai, (choice) => `Apabila murid melakukan tindakan "${answer}" semasa ${situasi}, nilai yang diamalkan ialah ${choice}.`, "Menjaga tempat belajar ialah tanggungjawab.", "Bertanggungjawab terhadap persekitaran menjadikan sekolah lebih selesa."),
  contextualChoiceAsk(`Apakah kesan baik jika murid bertindak betul apabila ${situasi}?`, "tempat lebih bersih dan selamat", ["tempat lebih bersih dan selamat", "lebih banyak kuman", "lebih banyak lalat", "murid mudah jatuh"], (choice) => `Kesan apabila murid bertindak betul semasa ${situasi} ialah ${choice}.`, "Fikirkan kebaikan kepada semua.", "Tempat yang bersih dan selamat membantu murid belajar dengan selesa."),
]);

const gayaHidupPairs = [
  ["tidur awal pada malam persekolahan", "cukup rehat", "Tidur yang cukup membantu murid segar dan fokus di sekolah."],
  ["bermain di luar rumah pada waktu sesuai", "aktif bergerak", "Bergerak aktif membantu badan cergas."],
  ["mengurangkan masa skrin", "jaga mata dan masa", "Masa skrin yang terkawal memberi ruang untuk belajar, rehat dan bergerak."],
  ["minum air kosong setiap hari", "kekal hidrasi", "Air kosong membantu tubuh berfungsi dengan baik."],
  ["bersenam bersama keluarga", "gaya hidup aktif", "Aktiviti bersama keluarga menjadikan senaman lebih menyeronokkan."],
  ["makan makanan seimbang", "tubuh mendapat zat", "Zat makanan membantu tumbesaran murid."],
  ["menjaga kebersihan bilik tidur", "ruang rehat sihat", "Bilik yang bersih membantu tidur lebih selesa."],
  ["bermain dengan selamat", "elak kecederaan", "Keselamatan penting semasa bermain."],
  ["mengurus marah dengan tenang", "emosi lebih sihat", "Emosi yang diurus baik membantu hubungan dengan rakan."],
  ["membantu kerja ringan di rumah", "aktif dan bertanggungjawab", "Kerja ringan seperti mengemas boleh melatih tanggungjawab dan pergerakan."],
].flatMap(([amalan, answer, explanation]) => [
  contextualChoiceAsk(`Apakah kebaikan amalan ${amalan}?`, answer, [answer, "badan mudah letih", "lebih banyak kuman", "makan tidak teratur"], (choice) => `Kebaikan amalan ${amalan} ialah ${choice}.`, "Gaya hidup sihat baik untuk tubuh dan emosi.", explanation),
  contextualChoiceAsk(`Apakah contoh gaya hidup sihat berkaitan ${amalan}?`, amalan, [amalan, "tidur terlalu lewat", "makan jajan setiap masa", "tidak mahu bergerak"], (choice) => `Contoh gaya hidup sihat yang berkaitan dengan ${amalan} ialah ${choice}.`, "Pilih amalan yang baik untuk kesihatan.", `${amalan} ialah amalan sesuai untuk murid Tahun 2 membina gaya hidup sihat.`),
  contextualChoiceAsk(`Mengapakah murid perlu mengamalkan ${amalan}?`, "supaya badan dan minda sihat", ["supaya badan dan minda sihat", "supaya mudah sakit", "supaya lambat belajar", "supaya tidak berkawan"], (choice) => `Murid perlu meneruskan amalan ${amalan} ${choice}.`, "Kesihatan melibatkan badan dan perasaan.", "Amalan sihat membantu murid belajar, bermain dan bergaul dengan lebih baik."),
  contextualChoiceAsk(`Siapakah yang boleh menggalakkan murid melakukan ${amalan}?`, "keluarga", ["keluarga", "orang tidak dikenali", "pemandu lori", "penjual mainan"], (choice) => `Pihak yang boleh menggalakkan amalan ${amalan} ialah ${choice}.`, "Keluarga membimbing amalan harian.", "Keluarga boleh memberi galakan dan menjadi contoh gaya hidup sihat."),
  contextualChoiceAsk(`Apakah tanda murid mengamalkan gaya hidup sihat melalui ${amalan}?`, "lebih cergas dan ceria", ["lebih cergas dan ceria", "selalu mengantuk", "mudah marah", "tidak mahu mandi"], (choice) => `Tanda murid mengamalkan gaya hidup sihat melalui ${amalan} ialah ${choice}.`, "Amalan sihat memberi kesan baik.", "Murid yang sihat biasanya lebih cergas, ceria dan bersedia untuk belajar."),
]);

const uasaCampuran = [
  ...kebersihanPairs.slice(0, 5),
  ...pemakananPairs.slice(5, 10),
  ...keselamatanDiriPairs.slice(10, 15),
  ...emosiPairs.slice(15, 20),
  ...gayaHidupPairs.slice(40, 50),
  ...jalanRayaPairs.slice(20, 25),
  ...penyakitPairs.slice(25, 30),
  ...pertolonganPairs.slice(30, 35),
  ...persekitaranPairs.slice(35, 40),
].map((item, index) => ({
  ...item,
  question: `Soalan ulang kaji UASA: ${item.question}`,
  explanation: `${item.explanation} Jawapan ini sesuai untuk soalan situasi Pendidikan Kesihatan Tahun 2.`,
  cognitiveLevel: ["mengingat", "memahami", "mengaplikasi", "menganalisis", "menilai"][index % 5],
}));

export const pkSubject = attachInteractiveQuestionExamplesToSubject({
  id: "pk",
  title: SUBJECT,
  short: "PK",
  icon: "❤️",
  color: "red",
  topics: [
    makeTopic({ id: "kebersihan_diri", code: "KEBERSIHAN_DIRI", title: "Kebersihan Diri", note: "Penjagaan tubuh, pakaian dan amalan bersih", items: kebersihanPairs }),
    makeTopic({ id: "pemakanan_sihat", code: "PEMAKANAN_SIHAT", title: "Pemakanan Sihat", note: "Makanan seimbang dan pilihan minuman sihat", items: pemakananPairs }),
    makeTopic({ id: "keselamatan_diri", code: "KESELAMATAN_DIRI", title: "Keselamatan Diri", note: "Ruang diri, orang dipercayai dan tindakan selamat", items: keselamatanDiriPairs }),
    makeTopic({ id: "kesihatan_mental_emosi", code: "KESIHATAN_MENTAL_EMOSI", title: "Kesihatan Mental dan Emosi", note: "Kenal emosi dan urus perasaan secara baik", items: emosiPairs }),
    makeTopic({ id: "keselamatan_jalan_raya", code: "KESELAMATAN_JALAN_RAYA", title: "Keselamatan Jalan Raya", note: "Amalan selamat sebagai pejalan kaki dan penumpang", items: jalanRayaPairs }),
    makeTopic({ id: "pencegahan_penyakit", code: "PENCEGAHAN_PENYAKIT", title: "Pencegahan Penyakit", note: "Amalan mengurangkan kuman dan jangkitan", items: penyakitPairs }),
    makeTopic({ id: "pertolongan_cemas_asas", code: "PERTOLONGAN_CEMAS_ASAS", title: "Pertolongan Cemas Asas", note: "Tindakan awal yang selamat", items: pertolonganPairs }),
    makeTopic({ id: "kesihatan_persekitaran", code: "KESIHATAN_PERSEKITARAN", title: "Kesihatan Persekitaran", note: "Kelas, rumah dan sekolah yang bersih", items: persekitaranPairs }),
    makeTopic({ id: "gaya_hidup_sihat", code: "GAYA_HIDUP_SIHAT", title: "Gaya Hidup Sihat", note: "Rehat, aktiviti fizikal dan tabiat harian sihat", items: gayaHidupPairs }),
    makeTopic({ id: "uasa_kesihatan", code: "UASA_KESIHATAN", title: "Pentaksiran Sumatif Kesihatan", note: "Latihan campuran PBD Pendidikan Kesihatan", items: uasaCampuran }),
  ],
});

export default pkSubject;
