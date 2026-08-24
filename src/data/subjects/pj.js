const SUBJECT = "Pendidikan Jasmani Tahun 2";
const DSKP = "KSSR Semakan Pendidikan Jasmani Tahun 2";

const difficultyFor = (index) => {
  if (index < 20) return "mudah";
  if (index < 40) return "sederhana";
  return "sukar";
};

const COGNITIVE_SEQUENCE_BY_TOPIC = Object.freeze({
  LOKOMOTOR: ["mengingat", "memahami", "mengaplikasi", "memahami", "mengaplikasi"],
  BUKAN_LOKOMOTOR: ["mengingat", "memahami", "mengaplikasi", "memahami", "mengaplikasi"],
  MANIPULASI_ALATAN: ["mengingat", "mengaplikasi", "mengaplikasi", "mengaplikasi", "menilai"],
  KOORDINASI: ["memahami", "memahami", "mengaplikasi", "menilai", "menganalisis"],
  KECERGASAN_FIZIKAL: ["memahami", "memahami", "menganalisis", "mengaplikasi", "mengaplikasi"],
  KESELAMATAN_AKTIVITI: ["mengaplikasi", "menganalisis", "mengaplikasi", "menilai", "mengaplikasi"],
  PERMAINAN_MUDAH: ["memahami", "menilai", "mengaplikasi", "menilai", "memahami"],
  REKREASI: ["memahami", "memahami", "menilai", "mengaplikasi", "mengaplikasi"],
  GAYA_HIDUP_AKTIF: ["memahami", "menganalisis", "mengaplikasi", "menganalisis", "mengaplikasi"],
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

const shuffleOptions = (answer, wrongOptions) => {
  const options = [answer, ...wrongOptions.filter((item) => item !== answer)].slice(0, 4);
  return options.sort();
};

const makeQuestion = (topicCode, topicTitle, item, index) => {
  const question = item.question;
  return {
    id: `PJ-${topicCode}-${String(index + 1).padStart(3, "0")}`,
    subject: SUBJECT,
    topic: topicTitle,
    difficulty: difficultyFor(index),
    question,
    q: question,
    options: shuffleOptions(item.answer, item.options),
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

const ask = (question, answer, options, hint, explanation, extras = {}) => ({
  question,
  answer,
  options,
  hint,
  explanation,
  ...extras,
});

const contextualAsk = (question, answer, accepted, wrongOptions, hint, explanation, extras = {}) =>
  ask(question, answer, [answer, ...wrongOptions], hint, explanation, {
    accepted: Array.isArray(accepted) ? accepted : [accepted],
    ...extras,
  });

const sentenceCase = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

const actionOptions = ["berjalan", "berlari", "melompat", "mencongklang", "mengilas", "membongkok", "menolak", "menarik"];
const safetyOptions = ["berhenti dan beritahu guru", "terus bermain", "tolak kawan", "berlari di lantai licin", "ambil alat tanpa izin"];
const fitnessOptions = ["daya tahan", "kekuatan", "kelenturan", "kelajuan", "imbangan", "koordinasi", "ketangkasan"];
const valuesOptions = ["bekerjasama", "ikut giliran", "jujur", "menghormati rakan", "berhati-hati", "berdisiplin", "aktif setiap hari"];

const pergerakanAsas = [
  ask("Apakah pergerakan yang sesuai apabila murid bergerak perlahan dari satu tempat ke tempat lain?", "berjalan", actionOptions, "Pilih pergerakan kaki yang tidak laju.", "Berjalan membantu murid bergerak dengan tenang dan selamat."),
  ask("Apakah pergerakan yang menggunakan kedua-dua kaki untuk menolak badan ke atas?", "melompat", actionOptions, "Badan akan naik seketika dari lantai.", "Melompat menggunakan kaki untuk menolak badan ke atas dan mendarat dengan terkawal."),
  ask("Murid bergerak laju ke garisan penamat. Apakah pergerakan itu?", "berlari", actionOptions, "Bandingkan dengan berjalan.", "Berlari membantu murid bergerak pantas tetapi perlu menjaga ruang dan keselamatan."),
  ask("Apakah pergerakan apabila badan dipusing sedikit ke kiri atau kanan?", "mengilas", actionOptions, "Pinggang dan bahu bergerak ke sisi.", "Mengilas ialah pergerakan bukan lokomotor yang memusingkan badan di tempat sendiri."),
  ask("Apakah pergerakan apabila murid menundukkan badan untuk mengambil bola di lantai?", "membongkok", actionOptions, "Badan direndahkan ke hadapan.", "Membongkok perlu dibuat dengan lutut sedikit dibengkokkan supaya badan lebih stabil."),
  ask("Apakah pergerakan apabila tangan menolak bola besar ke hadapan?", "menolak", actionOptions, "Objek bergerak menjauhi badan.", "Menolak ialah kemahiran asas menggunakan daya dari tangan atau badan."),
  ask("Apakah pergerakan apabila murid menarik tali ke arah badan?", "menarik", actionOptions, "Objek bergerak mendekati badan.", "Menarik memerlukan genggaman yang baik dan postur badan yang stabil."),
  ask("Apakah pergerakan apabila murid mendarat dengan lutut dibengkokkan selepas melompat?", "mendarat", ["mendarat", "menyepak", "menggolek", "menepuk"], "Fikirkan pergerakan selepas berada di udara.", "Mendarat dengan lutut dibengkokkan membantu menyerap hentakan dan mengurangkan risiko kecederaan."),
  ask("Apakah pergerakan apabila murid berguling di atas tilam gimnastik?", "mengguling", ["mengguling", "berlari", "menyambut", "menolak"], "Badan bergerak secara bulat di atas tilam.", "Mengguling perlu dibuat di kawasan beralas dan dengan pengawasan guru."),
  contextualAsk("Apakah pergerakan yang sesuai untuk melalui laluan sempit tanpa berlanggar?", "Berjalan dengan terkawal sesuai untuk melalui laluan sempit.", "berjalan", ["Berlari laju sesuai untuk melalui laluan sempit.", "Melompat ke arah rakan sesuai untuk melalui laluan sempit.", "Mencongklang tanpa melihat sesuai untuk melalui laluan sempit."], "Pilih pergerakan yang paling terkawal.", "Berjalan memberi kawalan badan yang lebih baik di ruang sempit."),
  ask("Semasa bergerak dalam barisan, apakah sikap yang paling baik?", "ikut giliran", valuesOptions, "Jangan memotong barisan rakan.", "Mengikut giliran menjadikan aktiviti lebih teratur dan selamat."),
  ask("Apakah bahagian badan yang paling banyak digunakan semasa melompat?", "kaki", ["kaki", "telinga", "hidung", "leher"], "Fikirkan bahagian yang menolak badan dari lantai.", "Kaki menghasilkan tolakan utama semasa melompat."),
  ask("Apakah tujuan membengkokkan lutut ketika mendarat?", "mengurangkan hentakan", ["mengurangkan hentakan", "melambatkan arahan", "membuat bunyi kuat", "menolak rakan"], "Lutut yang lembut membantu badan.", "Lutut yang dibengkokkan membantu menyerap hentakan dan menjaga sendi."),
  ask("Apakah pergerakan apabila murid bergerak ke sisi seperti ketam?", "mengengsot sisi", ["mengengsot sisi", "melompat jauh", "menendang bola", "menghayun tali"], "Badan bergerak ke kiri atau kanan.", "Mengengsot sisi melatih kawalan kaki dan ruang."),
  ask("Apakah pergerakan yang sesuai sebelum mula berlari?", "bersedia", ["bersedia", "menjerit", "menolak", "duduk membelakangi guru"], "Dengar arahan guru dahulu.", "Bersedia membantu murid memulakan pergerakan dengan selamat dan teratur."),
  ask("Apakah yang perlu dilihat semasa bergerak di kawasan permainan?", "ruang di hadapan", ["ruang di hadapan", "kasut rakan sahaja", "langit", "dinding belakang"], "Mata membantu kita mengelak halangan.", "Melihat ruang di hadapan membantu murid mengelakkan perlanggaran."),
  ask("Apakah pergerakan yang melibatkan tangan diayun semasa berjalan?", "ayunan tangan", ["ayunan tangan", "tepukan lutut", "putaran kepala", "tendangan sisi"], "Tangan bergerak seiring dengan kaki.", "Ayunan tangan membantu imbangan dan rentak semasa berjalan."),
  ask("Apakah pergerakan apabila murid melangkah dengan satu kaki ke hadapan?", "melangkah", ["melangkah", "mencubit", "melutut", "meniarap"], "Satu kaki bergerak dahulu.", "Melangkah ialah asas kepada berjalan, berlari dan banyak aktiviti permainan."),
  ask("Apakah kemahiran yang dilatih apabila murid bergerak mengikut rentak tepukan?", "kawalan pergerakan", ["kawalan pergerakan", "menjerit kuat", "berebut alat", "berdiri kaku"], "Murid perlu mengawal laju dan perlahan.", "Bergerak mengikut rentak melatih murid mengawal pergerakan badan."),
  ask("Apakah tindakan yang betul selepas guru meniup wisel berhenti?", "berhenti bergerak", ["berhenti bergerak", "lari lebih laju", "menolak rakan", "sembunyi alat"], "Wisel ialah arahan keselamatan.", "Berhenti apabila diarahkan membantu guru mengawal kelas dan mencegah kemalangan."),
  ask("Mengapakah murid perlu menjaga jarak semasa bergerak?", "mengelakkan perlanggaran", ["mengelakkan perlanggaran", "supaya boleh berebut", "supaya kasut kotor", "supaya lambat belajar"], "Jarak memberi ruang selamat.", "Jarak yang sesuai memberi ruang untuk bergerak tanpa melanggar rakan."),
  ask("Apakah pergerakan yang sesuai untuk memanaskan badan secara ringan?", "berjalan laju", ["berjalan laju", "duduk diam", "tidur", "menolak meja"], "Pilih pergerakan yang tidak terlalu berat.", "Berjalan laju boleh menaikkan suhu badan secara perlahan sebelum aktiviti utama."),
  ask("Pilih jawapan yang betul. Apakah maksud pergerakan asas?", "pergerakan mudah yang menjadi asas aktiviti", ["pergerakan mudah yang menjadi asas aktiviti", "aktiviti hanya untuk murid besar", "cara memakai kasut", "nama alat sukan"], "Asas bermaksud permulaan atau dasar.", "Pergerakan asas seperti berjalan, berlari dan melompat menjadi dasar kepada permainan dan sukan."),
  ask("Apakah yang perlu dibuat jika ruang di hadapan penuh dengan rakan?", "perlahan dan cari ruang kosong", ["perlahan dan cari ruang kosong", "rempuh rakan", "pejam mata", "campak kasut"], "Utamakan keselamatan.", "Memperlahankan pergerakan dan mencari ruang kosong dapat mengelakkan kemalangan."),
  ask("Apakah pergerakan yang paling sesuai untuk menuruni anak tangga di sekolah?", "berjalan berhati-hati", ["berjalan berhati-hati", "melompat dua anak tangga", "berlari laju", "menolak rakan"], "Tangga memerlukan kawalan.", "Berjalan berhati-hati di tangga mengurangkan risiko terjatuh."),
  ask("Semasa melompat setempat, apakah yang membantu badan seimbang?", "ayun tangan dengan terkawal", ["ayun tangan dengan terkawal", "pejam mata", "angkat kepala terlalu tinggi", "pusing tanpa melihat"], "Tangan boleh membantu imbangan.", "Ayunan tangan yang terkawal membantu murid mengekalkan imbangan ketika melompat."),
  ask("Apakah pergerakan apabila murid bergerak rendah dengan lutut dibengkokkan?", "mencangkung bergerak", ["mencangkung bergerak", "berdiri tegak", "menendang tinggi", "menepuk bahu"], "Badan berada rendah.", "Mencangkung bergerak melatih kekuatan kaki dan kawalan badan."),
  ask("Apakah yang perlu dibuat sebelum melakukan guling depan?", "guna tilam dan tunggu arahan guru", ["guna tilam dan tunggu arahan guru", "guling di simen", "tolak rakan dahulu", "buat tanpa melihat ruang"], "Guling perlu tempat yang sesuai.", "Tilam dan arahan guru membantu aktiviti guling dibuat dengan selamat."),
  ask("Apakah pergerakan yang sesuai untuk meniru haiwan arnab?", "melompat kecil", ["melompat kecil", "berjalan sisi", "mengilas perlahan", "membaling bola"], "Arnab bergerak dengan lompatan.", "Melompat kecil melatih koordinasi kaki dan imbangan."),
  ask("Apakah pergerakan yang sesuai untuk meniru pokok ditiup angin?", "mengayun badan", ["mengayun badan", "menendang bola", "berlari pecut", "menangkap pundi"], "Badan bergerak ke kiri dan kanan.", "Mengayun badan ialah pergerakan bukan lokomotor yang melatih kelenturan."),
  ask("Mengapakah guru menyuruh murid mula dengan pergerakan mudah dahulu?", "supaya badan bersedia", ["supaya badan bersedia", "supaya kelas lambat habis", "supaya murid mengantuk", "supaya alat hilang"], "Aktiviti mudah membantu tubuh.", "Pergerakan mudah menyediakan badan sebelum aktiviti yang lebih mencabar."),
  ask("Apakah contoh gabungan pergerakan asas?", "berlari kemudian melompat", ["berlari kemudian melompat", "duduk kemudian tidur", "makan kemudian minum", "membaca kemudian menulis"], "Gabungan melibatkan dua pergerakan.", "Berlari kemudian melompat menggabungkan lokomotor dan kawalan badan."),
  ask("Apakah yang perlu dikawal ketika bergerak laju?", "arah dan kelajuan", ["arah dan kelajuan", "warna baju", "nama kumpulan", "bunyi kasut"], "Bergerak laju tetap perlu terkawal.", "Arah dan kelajuan perlu dikawal supaya murid tidak melanggar rakan atau halangan."),
  ask("Apakah pergerakan apabila kaki dibuka dan ditutup sambil melompat?", "lompat bintang", ["lompat bintang", "guling sisi", "lari zigzag", "tarik tali"], "Bentuk badan seperti bintang.", "Lompat bintang melatih koordinasi tangan dan kaki."),
  ask("Apakah sikap yang baik apabila rakan belum mahir melompat?", "beri galakan", ["beri galakan", "ketawakan rakan", "tolak rakan", "ambil giliran rakan"], "Rakan belajar dengan sokongan.", "Memberi galakan membantu rakan lebih yakin dan menjadikan kelas lebih positif."),
  ask("Apakah kesan jika murid mendarat dengan kaki lurus dan keras?", "sendi boleh sakit", ["sendi boleh sakit", "boleh terbang lebih tinggi", "menjadi lebih rehat", "tidak perlu guru"], "Hentakan kuat tidak baik untuk badan.", "Mendarat dengan kaki terlalu lurus boleh memberi hentakan pada sendi dan menyebabkan sakit."),
  ask("Apakah pergerakan yang sesuai apabila arahan guru ialah 'bergerak bebas tetapi perlahan'?", "berjalan dalam ruang sendiri", ["berjalan dalam ruang sendiri", "berlari mengejar rakan", "melompat ke arah rakan", "menolak kon"], "Perlahan dan ruang sendiri ialah petunjuk.", "Berjalan dalam ruang sendiri menunjukkan murid boleh mengawal pergerakan dan ruang."),
  ask("Apakah tujuan menukar arah semasa aktiviti pergerakan?", "melatih kawalan badan", ["melatih kawalan badan", "mengelirukan guru", "membuang masa", "mengotorkan gelanggang"], "Menukar arah perlu kawalan.", "Menukar arah melatih murid mengawal badan, imbangan dan tumpuan."),
  ask("Apakah tanda murid bergerak dengan selamat?", "tidak melanggar rakan", ["tidak melanggar rakan", "menjerit sepanjang masa", "menutup mata", "berebut ruang"], "Selamat bermaksud tidak membahayakan diri dan orang lain.", "Tidak melanggar rakan menunjukkan murid menjaga ruang dan bergerak secara terkawal."),
  ask("Apakah pergerakan yang sesuai untuk melalui bawah tali rendah?", "membongkok", actionOptions, "Badan perlu direndahkan.", "Membongkok membantu murid melalui halangan rendah dengan selamat."),
  ask("Apakah yang berlaku jika murid tidak mendengar arahan semasa aktiviti pergerakan?", "aktiviti boleh menjadi tidak selamat", ["aktiviti boleh menjadi tidak selamat", "semua murid menang", "alatan menjadi ringan", "badan terus kuat"], "Arahan guru menjaga keselamatan.", "Tidak mendengar arahan boleh menyebabkan perlanggaran atau kecederaan."),
  ask("Dalam laluan zigzag, apakah kemahiran utama yang digunakan?", "menukar arah", ["menukar arah", "duduk diam", "menepuk tangan", "membaling tinggi"], "Zigzag ada banyak belokan.", "Laluan zigzag melatih murid menukar arah dengan kawalan badan."),
  ask("Apakah pergerakan terbaik untuk berhenti selepas berlari?", "perlahankan langkah", ["perlahankan langkah", "jatuhkan badan", "langgar dinding", "pejam mata"], "Berhenti secara mengejut kurang selamat.", "Memperlahankan langkah membantu badan berhenti dengan lebih selamat."),
  ask("Apakah contoh pergerakan bukan lokomotor?", "mengilas badan", ["mengilas badan", "berlari ke kon", "berjalan ke kantin", "melompat ke depan"], "Badan bergerak tetapi tidak berpindah tempat.", "Mengilas badan ialah bukan lokomotor kerana murid boleh melakukannya di tempat sendiri."),
  ask("Pilih jawapan yang betul. Apakah contoh pergerakan lokomotor?", "berlari ke hadapan", ["berlari ke hadapan", "mengilas di tempat", "membongkok di tempat", "menepuk tangan"], "Lokomotor berpindah tempat.", "Berlari ke hadapan ialah lokomotor kerana badan bergerak dari satu tempat ke tempat lain."),
  ask("Apakah yang perlu dilakukan jika kasut terbuka semasa aktiviti?", "berhenti dan ikat tali kasut", ["berhenti dan ikat tali kasut", "terus berlari", "sepak kasut", "pinjam kasut rakan"], "Kasut yang terbuka boleh menyebabkan jatuh.", "Berhenti dan mengikat tali kasut membantu mengelakkan tersadung."),
  ask("Apakah pergerakan yang menggunakan tangan untuk menolak lantai dalam aktiviti mudah?", "menyokong badan", ["menyokong badan", "menyepak lantai", "menutup telinga", "menarik rambut"], "Tangan menahan berat badan.", "Menyokong badan dengan tangan melatih kekuatan dan kawalan postur."),
  ask("Apakah sebab pergerakan perlu dibuat mengikut kemampuan diri?", "mengelakkan kecederaan", ["mengelakkan kecederaan", "supaya tidak perlu belajar", "supaya boleh menolak rakan", "supaya guru marah"], "Kemampuan setiap murid berbeza.", "Melakukan aktiviti mengikut kemampuan membantu murid belajar dengan selamat."),
  ask("Apakah pilihan terbaik jika murid penat ketika latihan pergerakan?", "beritahu guru dan berehat sekejap", ["beritahu guru dan berehat sekejap", "paksa diri berlari", "sembunyi di stor", "minum air kawan tanpa izin"], "Guru boleh membantu.", "Berehat apabila penat membantu tubuh pulih dan mengelakkan masalah kesihatan."),
  ask("Apakah yang menunjukkan murid menguasai pergerakan asas dengan baik?", "bergerak terkawal dan selamat", ["bergerak terkawal dan selamat", "bergerak sambil menolak", "bergerak tanpa mendengar", "bergerak di luar kawasan"], "Kawalan dan keselamatan penting dalam PJ.", "Murid yang bergerak terkawal dan selamat dapat melakukan aktiviti dengan lebih yakin."),
];

const lokomotor = [
  ["berjalan ke kon", "berjalan", "Berjalan memindahkan badan dari satu tempat ke tempat lain dengan kawalan."],
  ["berlari ke garisan penamat", "berlari", "Berlari ialah lokomotor kerana murid berpindah tempat dengan laju."],
  ["melompat ke dalam gelung", "melompat", "Melompat memindahkan badan dengan tolakan kaki dan pendaratan."],
  ["mencongklang seperti kuda kecil", "mencongklang", "Mencongklang melatih rentak kaki dan koordinasi."],
  ["melangkah besar melepasi garisan", "melangkah", "Melangkah membantu murid mengawal jarak dan arah."],
  ["berjalan sisi di atas garisan", "berjalan sisi", "Berjalan sisi melatih kawalan badan ketika bergerak ke kiri atau kanan."],
  ["berlari zigzag antara skital", "lari zigzag", "Lari zigzag melatih menukar arah dengan selamat."],
  ["melompat sebelah kaki dalam petak", "melompat sebelah kaki", "Lompatan sebelah kaki memerlukan kekuatan dan imbangan."],
  ["berjalan undur perlahan", "berjalan undur", "Berjalan undur perlu dilakukan perlahan sambil menjaga ruang."],
  ["berlari anak semasa memanaskan badan", "berlari anak", "Berlari anak sesuai untuk memanaskan badan secara ringan."],
].flatMap(([activity, answer, explanation], group) =>
  [
    ask(`Dalam aktiviti ${activity}, apakah pergerakan lokomotor utama?`, answer, actionOptions, "Lokomotor ialah pergerakan yang berpindah tempat.", explanation),
    contextualAsk(`Murid Tahun 2 melakukan ${activity}. Pergerakan ini sesuai dikelaskan sebagai ________.`, `${sentenceCase(activity)} ialah pergerakan lokomotor.`, "lokomotor", [`${sentenceCase(activity)} ialah pergerakan bukan lokomotor.`, `${sentenceCase(activity)} ialah waktu rehat.`, `${sentenceCase(activity)} ialah rawatan.`], "Badan bergerak dari satu tempat ke tempat lain.", `${sentenceCase(activity)} ialah aktiviti lokomotor kerana murid berpindah tempat.`),
    contextualAsk(`Apakah perkara penting semasa melakukan ${activity}?`, `Murid perlu menjaga ruang semasa ${activity}.`, "jaga ruang", [`Murid perlu memejamkan mata semasa ${activity}.`, `Murid perlu menolak rakan semasa ${activity}.`, `Murid perlu keluar dari kawasan semasa ${activity}.`], "Fikirkan keselamatan rakan.", `Menjaga ruang semasa ${activity} dapat mengelakkan perlanggaran.`),
    contextualAsk(`Apakah anggota badan yang paling banyak membantu semasa ${activity}?`, `Kaki paling banyak membantu semasa ${activity}.`, "kaki", [`Hidung paling banyak membantu semasa ${activity}.`, `Telinga paling banyak membantu semasa ${activity}.`, `Rambut paling banyak membantu semasa ${activity}.`], "Pergerakan lokomotor banyak menggunakan bahagian bawah badan.", `Kaki membantu murid bergerak dan mengawal imbangan semasa ${activity}.`),
    contextualAsk(`Jika guru meminta murid melakukan ${activity} secara selamat, apakah tindakan terbaik?`, `Murid perlu mendengar arahan guru sebelum ${activity}.`, "dengar arahan guru", [`Murid perlu bermula sebelum wisel untuk ${activity}.`, `Murid perlu berebut laluan semasa ${activity}.`, `Murid boleh berlari sambil menolak semasa ${activity}.`], "Arahan guru membantu kelas bergerak teratur.", `Mendengar arahan guru menjadikan ${activity} lebih teratur dan selamat.`),
  ].map((item, index) => ({
    ...item,
    hint: index === 1 && group > 5 ? "Perhatikan sama ada badan berpindah tempat." : item.hint,
  }))
);

const bukanLokomotorPairs = [
  ["membongkok untuk menyentuh hujung kaki", "membongkok", "Membongkok melatih kelenturan dan boleh dibuat di tempat sendiri."],
  ["mengilas badan ke kiri dan kanan", "mengilas", "Mengilas melibatkan putaran badan tanpa berpindah tempat."],
  ["mengayun tangan seperti bandul", "mengayun", "Mengayun melatih kawalan pergerakan tangan."],
  ["meregang tangan ke atas", "meregang", "Meregang membantu otot bersedia dan lebih lentur."],
  ["menolak dinding dengan kedua-dua tangan", "menolak", "Menolak melatih kekuatan tangan dan postur."],
  ["menarik tali tanpa bergerak dari tempat", "menarik", "Menarik memerlukan genggaman dan kedudukan badan stabil."],
  ["mencangkung dan berdiri semula", "mencangkung", "Mencangkung melatih kekuatan kaki dan kawalan badan."],
  ["mengimbang dengan satu kaki", "mengimbang", "Mengimbang melatih kestabilan badan."],
  ["memusing bahu secara perlahan", "memusing", "Memusing bahu membantu menyediakan sendi sebelum aktiviti."],
  ["menepuk tangan mengikut rentak", "menepuk", "Menepuk mengikut rentak melatih koordinasi dan tumpuan."],
].flatMap(([activity, answer, explanation]) => [
  ask(`Apakah pergerakan bukan lokomotor dalam aktiviti ${activity}?`, answer, ["membongkok", "mengilas", "mengayun", "meregang", "menolak", "menarik", "mencangkung", "mengimbang"], "Bukan lokomotor dibuat di tempat sendiri.", explanation),
  contextualAsk(`Mengapakah ${activity} dipanggil bukan lokomotor?`, `${sentenceCase(activity)} tidak memindahkan badan ke tempat lain.`, "tidak berpindah tempat", [`${sentenceCase(activity)} mesti dilakukan sambil berlari.`, `${sentenceCase(activity)} mesti menggunakan bola.`, `${sentenceCase(activity)} hanya boleh dibuat di kantin.`], "Badan bergerak tetapi tempat tidak berubah.", `${sentenceCase(activity)} ialah bukan lokomotor kerana murid bergerak di ruang sendiri tanpa berpindah jauh.`),
  contextualAsk(`Apakah sikap yang baik semasa murid melakukan ${activity}?`, `Murid perlu melakukan ${activity} dengan terkawal.`, "buat dengan terkawal", [`Murid perlu melakukan ${activity} terlalu laju.`, `Murid perlu menolak rakan semasa ${activity}.`, `Murid perlu mengabaikan arahan semasa ${activity}.`], "Pergerakan di tempat juga perlu selamat.", "Pergerakan yang terkawal mengurangkan risiko terseliuh atau terlanggar rakan."),
  contextualAsk(`Apakah manfaat aktiviti ${activity}?`, `${sentenceCase(activity)} membantu melatih kawalan badan.`, "melatih kawalan badan", [`${sentenceCase(activity)} menyebabkan kasut hilang.`, `${sentenceCase(activity)} menambah pergaduhan.`, `${sentenceCase(activity)} menyebabkan alat dibuang.`], "Fikirkan kebaikan kepada tubuh.", `${sentenceCase(activity)} membantu murid mengenal pergerakan badan dan mengawal postur.`),
  contextualAsk(`Sebelum melakukan ${activity}, apakah yang perlu murid pastikan?`, `Murid perlu memastikan ada ruang sendiri sebelum ${activity}.`, "ada ruang sendiri", [`Murid perlu berdiri terlalu dekat dengan rakan sebelum ${activity}.`, `Murid perlu memilih lantai yang penuh air sebelum ${activity}.`, `Murid perlu membiarkan alat berselerak sebelum ${activity}.`], "Ruang mengelakkan sentuhan dengan rakan.", "Ruang sendiri membantu murid bergerak dengan selamat walaupun tidak berpindah tempat."),
]);

const manipulasiAlatanPairs = [
  ["membaling bola ke sasaran", "membaling", "Membaling melatih koordinasi mata dan tangan."],
  ["menangkap bola lembut dengan dua tangan", "menangkap", "Menangkap dengan dua tangan lebih selamat untuk murid Tahun 2."],
  ["menendang bola ke kon", "menendang", "Menendang melatih koordinasi mata dan kaki."],
  ["menggolek bola kepada rakan", "menggolek", "Menggolek bola sesuai untuk latihan kawalan arah."],
  ["melantun bola perlahan", "melantun", "Melantun melatih kawalan tangan dan tumpuan."],
  ["memukul belon dengan tapak tangan", "memukul", "Memukul belon ringan sesuai untuk latihan asas."],
  ["menyambut pundi kacang", "menyambut", "Menyambut pundi kacang melatih tumpuan dan genggaman."],
  ["melambung bola kecil ke atas", "melambung", "Melambung melatih kawalan daya dan arah."],
  ["menghantar bola kepada rakan", "menghantar", "Menghantar bola melatih kerjasama dan ketepatan."],
  ["menyepak bola perlahan ke sasaran", "menyepak", "Menyepak perlahan membantu murid mengawal daya tendangan."],
].flatMap(([activity, answer, explanation]) => [
  ask(`Dalam aktiviti ${activity}, apakah kemahiran manipulasi alatan yang digunakan?`, answer, ["membaling", "menangkap", "menendang", "menggolek", "melantun", "memukul", "menyambut", "melambung"], "Manipulasi alatan bermaksud mengawal objek.", explanation),
  contextualAsk(`Apakah alat yang sesuai digunakan untuk ${activity}?`, `Alat yang sesuai untuk ${activity} ialah ${activity.includes("pundi") ? "pundi kacang" : activity.includes("belon") ? "belon" : "bola"}.`, activity.includes("pundi") ? "pundi kacang" : activity.includes("belon") ? "belon" : "bola", [`Batu ialah alat yang sesuai untuk ${activity}.`, `Kayu tajam ialah alat yang sesuai untuk ${activity}.`, `Botol kaca ialah alat yang sesuai untuk ${activity}.`], "Pilih alat yang selamat untuk murid kecil.", "Alat yang lembut dan sesuai saiz membantu murid berlatih dengan selamat."),
  contextualAsk(`Apakah bahagian badan yang perlu fokus semasa ${activity}?`, `Murid perlu menumpukan ${activity.includes("menendang") || activity.includes("menyepak") ? "mata dan kaki" : "mata dan tangan"} semasa ${activity}.`, activity.includes("menendang") || activity.includes("menyepak") ? "mata dan kaki" : "mata dan tangan", [`Murid perlu menumpukan telinga dan rambut semasa ${activity}.`, `Murid perlu menumpukan hidung dan siku semasa ${activity}.`, `Murid tidak perlu melihat alat semasa ${activity}.`], "Lihat objek dan gunakan anggota yang sesuai.", `${sentenceCase(activity)} memerlukan koordinasi supaya objek bergerak ke arah yang dikehendaki.`),
  contextualAsk(`Apakah tindakan selamat sebelum melakukan ${activity}?`, `Murid perlu memastikan kawasan lapang sebelum ${activity}.`, "pastikan kawasan lapang", [`Murid perlu berdiri terlalu dekat dengan rakan sebelum ${activity}.`, `Murid boleh membaling tanpa melihat sebelum ${activity}.`, `Murid perlu mengambil alat rakan tanpa izin sebelum ${activity}.`], "Lihat ruang sekeliling dahulu.", "Kawasan lapang mengurangkan risiko terkena rakan atau halangan."),
  contextualAsk(`Apakah nilai baik semasa berlatih ${activity} bersama rakan?`, `Murid perlu bekerjasama semasa berlatih ${activity} bersama rakan.`, "bekerjasama", [`Murid perlu berebut semasa berlatih ${activity}.`, `Murid perlu mengejek rakan semasa berlatih ${activity}.`, `Murid perlu mementingkan diri semasa berlatih ${activity}.`], "Aktiviti berpasangan memerlukan sikap baik.", "Bekerjasama membantu latihan berjalan lancar dan menyeronokkan."),
]);

const koordinasiPairs = [
  ["menangkap bola selepas dilambung", "koordinasi mata dan tangan"],
  ["menendang bola ke arah skital", "koordinasi mata dan kaki"],
  ["melompat masuk dan keluar gelung", "koordinasi kaki"],
  ["berlari zigzag sambil melihat kon", "koordinasi mata dan kaki"],
  ["melantun bola sambil berjalan perlahan", "koordinasi mata dan tangan"],
  ["menepuk tangan mengikut rentak", "koordinasi tangan"],
  ["melompat tali secara perlahan", "koordinasi tangan dan kaki"],
  ["mengimbang pundi kacang di atas tapak tangan", "koordinasi mata dan tangan"],
  ["menggolek bola tepat kepada rakan", "koordinasi mata dan tangan"],
  ["berjalan di atas garisan lurus", "imbangan dan koordinasi"],
].flatMap(([activity, answer]) => [
  contextualAsk(`Apakah koordinasi yang dilatih melalui aktiviti ${activity}?`, `${sentenceCase(activity)} melatih ${answer}.`, answer, [`${sentenceCase(activity)} hanya melatih pendengaran.`, `${sentenceCase(activity)} tidak memerlukan koordinasi badan.`, `${sentenceCase(activity)} hanya melatih suara.`], "Fikirkan anggota badan yang bekerja bersama.", `Aktiviti ${activity} memerlukan beberapa anggota badan bekerja bersama dengan tumpuan.`),
  contextualAsk(`Mengapakah murid perlu melihat sasaran semasa ${activity}?`, `Melihat sasaran semasa ${activity} menjadikan pergerakan lebih tepat.`, "supaya pergerakan lebih tepat", [`Melihat sasaran semasa ${activity} membolehkan murid menjerit.`, `Melihat sasaran semasa ${activity} menyebabkan alat hilang.`, `Melihat sasaran semasa ${activity} bertujuan menakutkan rakan.`], "Mata membantu arah pergerakan.", "Melihat sasaran membantu murid mengawal arah dan ketepatan pergerakan."),
  contextualAsk(`Apakah cara baik untuk meningkatkan koordinasi dalam aktiviti ${activity}?`, `Murid boleh meningkatkan koordinasi melalui latihan ${activity} secara berulang.`, "berlatih secara berulang", [`Murid boleh meningkatkan koordinasi dengan berhenti terus daripada ${activity}.`, `Murid boleh meningkatkan koordinasi dengan bergaduh semasa ${activity}.`, `Murid boleh meningkatkan koordinasi dengan memejamkan mata sepanjang ${activity}.`], "Kemahiran bertambah dengan latihan.", "Latihan berulang secara selamat membantu koordinasi menjadi lebih baik."),
  contextualAsk(`Apakah yang perlu dibuat jika murid gagal kali pertama semasa ${activity}?`, `Murid perlu mencuba ${activity} lagi dengan tenang.`, "cuba lagi dengan tenang", [`Murid perlu marah kepada rakan selepas gagal ${activity}.`, `Murid perlu mencampakkan alat selepas gagal ${activity}.`, `Murid perlu meninggalkan kelas selepas gagal ${activity}.`], "Kesilapan ialah sebahagian daripada belajar.", "Mencuba lagi dengan tenang membina keyakinan dan kemahiran."),
  contextualAsk(`Apakah tanda koordinasi murid semakin baik semasa ${activity}?`, `Pergerakan ${activity} yang lebih terkawal menunjukkan koordinasi semakin baik.`, "pergerakan lebih terkawal", [`Semakin banyak menolak rakan semasa ${activity} menunjukkan koordinasi semakin baik.`, `Tidak mendengar arahan semasa ${activity} menunjukkan koordinasi semakin baik.`, `Alat yang selalu terjatuh semasa ${activity} menunjukkan koordinasi semakin baik.`], "Kawalan ialah tanda kemajuan.", "Pergerakan yang terkawal menunjukkan anggota badan bekerja dengan lebih baik."),
]);

const kecergasanPairs = [
  ["berlari anak selama beberapa minit", "daya tahan"],
  ["menolak bola besar", "kekuatan"],
  ["meregang tangan dan kaki", "kelenturan"],
  ["lari pecut jarak dekat", "kelajuan"],
  ["berdiri sebelah kaki", "imbangan"],
  ["lompat bintang", "koordinasi"],
  ["lari ulang-alik pendek", "ketangkasan"],
  ["naik turun bangku rendah dengan selamat", "kekuatan kaki"],
  ["berjalan laju mengelilingi gelanggang", "daya tahan"],
  ["membongkok menyentuh hujung kaki", "kelenturan"],
].flatMap(([activity, answer]) => [
  ask(`Komponen kecergasan apakah yang dilatih melalui aktiviti ${activity}?`, answer, fitnessOptions.concat(["kekuatan kaki"]), "Fikirkan keupayaan tubuh yang digunakan.", `${activity} membantu membina ${answer} apabila dibuat dengan teknik yang betul.`),
  contextualAsk(`Mengapakah murid perlu memanaskan badan sebelum ${activity}?`, `Memanaskan badan sebelum ${activity} mengurangkan risiko kecederaan.`, "mengurangkan risiko kecederaan", [`Memanaskan badan sebelum ${activity} bertujuan mengotorkan kasut.`, `Memanaskan badan sebelum ${activity} membolehkan murid datang lambat.`, `Memanaskan badan sebelum ${activity} memastikan rakan kalah.`], "Pemanasan badan menyediakan otot.", "Memanaskan badan membantu menyediakan otot dan sendi sebelum aktiviti."),
  contextualAsk(`Apakah tanda murid perlu berehat semasa ${activity}?`, `Murid perlu berehat jika terlalu penat semasa ${activity}.`, "terlalu penat", [`Murid perlu berehat apabila masih bertenaga semasa ${activity}.`, `Murid perlu berehat apabila guru tersenyum semasa ${activity}.`, `Murid perlu berehat apabila skital tersusun semasa ${activity}.`], "Dengar keadaan badan sendiri.", "Berehat apabila terlalu penat membantu mengelakkan pening atau kecederaan."),
  contextualAsk(`Apakah minuman terbaik selepas melakukan ${activity}?`, `Air kosong ialah minuman terbaik selepas ${activity}.`, "air kosong", [`Minuman bergas ialah minuman terbaik selepas ${activity}.`, `Air terlalu manis ialah minuman terbaik selepas ${activity}.`, `Kopi ialah minuman terbaik selepas ${activity}.`], "Pilih minuman yang menyegarkan badan.", "Air kosong membantu menggantikan cecair badan selepas aktiviti fizikal."),
  contextualAsk(`Apakah tabiat baik untuk meningkatkan kecergasan selepas latihan ${activity}?`, `Murid perlu kekal aktif setiap hari untuk meningkatkan kecergasan bagi ${activity}.`, "aktif setiap hari", [`Murid perlu duduk sepanjang hari selepas latihan ${activity}.`, `Murid perlu mengelakkan semua pergerakan selepas latihan ${activity}.`, `Murid perlu tidur lewat setiap hari selepas latihan ${activity}.`], "Kecergasan dibina secara konsisten.", "Aktif setiap hari melalui permainan dan senaman ringan membantu tubuh lebih sihat."),
]);

const keselamatanPairs = [
  ["lantai gelanggang basah", "berhenti dan beritahu guru", "Lantai basah boleh menyebabkan murid tergelincir."],
  ["tali kasut terbuka", "berhenti dan ikat tali kasut", "Tali kasut terbuka boleh menyebabkan tersadung."],
  ["rakan terjatuh semasa bermain", "berhenti dan panggil guru", "Guru perlu membantu rakan yang cedera."],
  ["bola masuk ke longkang", "minta bantuan guru", "Murid tidak patut mengambil alat di tempat berbahaya."],
  ["cuaca terlalu panas", "minum air dan rehat di tempat teduh", "Rehat dan minum air membantu mengelakkan kepanasan."],
  ["alat sukan berselerak", "susun alat di tempat selamat", "Alat berselerak boleh menyebabkan murid tersadung."],
  ["murid belum faham arahan permainan", "tanya guru dahulu", "Bertanya membantu murid bermain dengan betul dan selamat."],
  ["rakan menolak semasa berbaris", "beritahu guru dengan sopan", "Menolak boleh menyebabkan kecederaan."],
  ["murid berasa pening", "berhenti dan maklumkan guru", "Pening semasa aktiviti perlu diberi perhatian segera."],
  ["gelanggang terlalu sesak", "tunggu giliran", "Menunggu giliran membantu mengelakkan perlanggaran."],
].flatMap(([situation, answer, explanation]) => [
  ask(`Apakah tindakan paling selamat jika ${situation}?`, answer, safetyOptions.concat(["berhenti dan ikat tali kasut", "minta bantuan guru", "minum air dan rehat di tempat teduh", "tunggu giliran"]), "Pilih tindakan yang menjaga diri dan rakan.", explanation),
  contextualAsk(`Mengapakah murid tidak boleh meneruskan aktiviti apabila ${situation}?`, `Meneruskan aktiviti apabila ${situation} boleh menyebabkan kecederaan.`, "boleh menyebabkan kecederaan", [`Meneruskan aktiviti apabila ${situation} menjamin markah penuh.`, `Meneruskan aktiviti apabila ${situation} mewujudkan permainan baharu.`, `Meneruskan aktiviti apabila ${situation} sentiasa menggembirakan guru.`], "Fikirkan risiko kepada tubuh.", `${sentenceCase(situation)} ialah keadaan yang perlu dikawal supaya murid tidak cedera.`),
  contextualAsk(`Siapakah orang yang patut dimaklumkan apabila ${situation}?`, `Murid perlu memaklumkan guru apabila ${situation}.`, "guru", [`Murid perlu memaklumkan penjaja apabila ${situation}.`, `Murid perlu memaklumkan pemandu bas apabila ${situation}.`, `Murid perlu memaklumkan orang tidak dikenali apabila ${situation}.`], "Di sekolah, guru menjaga aktiviti PJ.", "Guru boleh memberi arahan dan bantuan yang sesuai semasa aktiviti."),
  contextualAsk(`Apakah nilai yang ditunjukkan apabila murid bertindak selamat ketika ${situation}?`, `Murid menunjukkan sikap berhati-hati apabila menghadapi keadaan ${situation}.`, "berhati-hati", [`Murid menunjukkan sikap cuai apabila menghadapi keadaan ${situation}.`, `Murid menunjukkan sikap suka berebut apabila menghadapi keadaan ${situation}.`, `Murid menunjukkan sikap mementingkan diri apabila menghadapi keadaan ${situation}.`], "Keselamatan memerlukan sikap cermat.", "Berhati-hati menunjukkan murid menjaga keselamatan diri dan rakan."),
  contextualAsk(`Apakah peraturan umum semasa aktiviti PJ apabila ${situation}?`, `Murid perlu mendengar arahan guru apabila ${situation}.`, "dengar arahan guru", [`Murid perlu berlari tanpa arah apabila ${situation}.`, `Murid perlu menggunakan alat rosak apabila ${situation}.`, `Murid perlu menolak rakan apabila ${situation}.`], "Peraturan membantu semua murid selamat.", "Mendengar arahan guru memastikan aktiviti berjalan lancar dan selamat."),
]);

const permainanPairs = [
  ["bola beracun", "mengelak bola lembut"],
  ["lari berganti", "memberi baton kepada rakan"],
  ["baling sasaran", "membaling tepat ke sasaran"],
  ["lompat gelung", "melompat masuk gelung"],
  ["kejar-kejar terkawal", "berlari dalam kawasan yang ditetapkan"],
  ["bola sepak mini", "menendang bola kepada rakan"],
  ["bola jaring mini", "menghantar bola kepada rakan"],
  ["badminton asas", "memukul bulu tangkis perlahan"],
  ["golek bola", "menggolek bola ke arah sasaran"],
  ["ambil dan hantar", "bekerjasama menghantar alat"],
].flatMap(([game, skill]) => [
  ask(`Dalam permainan ${game}, apakah kemahiran utama yang digunakan?`, skill, [skill, "menolak rakan", "menjerit kepada lawan", "keluar kawasan"], "Fikirkan aksi utama permainan.", `Permainan ${game} melatih murid menggunakan kemahiran ${skill} secara menyeronokkan.`),
  contextualAsk(`Apakah sikap penting semasa bermain ${game}?`, `Murid perlu bermain ${game} secara jujur.`, "bermain secara jujur", [`Murid perlu menipu markah semasa bermain ${game}.`, `Murid perlu marah apabila kalah dalam ${game}.`, `Murid perlu mengambil giliran rakan semasa bermain ${game}.`], "Permainan perlu adil.", "Bermain secara jujur menjadikan permainan adil dan mendidik nilai murni."),
  contextualAsk(`Apakah yang perlu dibuat sebelum mula permainan ${game}?`, `Murid perlu mendengar peraturan sebelum bermain ${game}.`, "dengar peraturan", [`Murid perlu berlari dahulu sebelum mendengar peraturan ${game}.`, `Murid perlu menyembunyikan alat sebelum bermain ${game}.`, `Murid perlu menolak rakan sebelum bermain ${game}.`], "Peraturan membantu permainan selamat.", "Mendengar peraturan membantu murid faham cara bermain dan menjaga keselamatan."),
  contextualAsk(`Apakah tindakan baik jika pasukan kalah dalam ${game}?`, `Murid perlu menerima keputusan dengan baik jika kalah dalam ${game}.`, "terima keputusan dengan baik", [`Murid perlu menyalahkan rakan jika kalah dalam ${game}.`, `Murid perlu menangis dan menolak rakan jika kalah dalam ${game}.`, `Murid perlu membuang alat jika kalah dalam ${game}.`], "Kalah menang ialah adat permainan.", "Menerima keputusan dengan baik menunjukkan semangat kesukanan."),
  contextualAsk(`Apakah manfaat permainan mudah seperti ${game}?`, `${sentenceCase(game)} membantu melatih kerjasama dan kecergasan.`, "melatih kerjasama dan kecergasan", [`${sentenceCase(game)} membuat murid malas.`, `${sentenceCase(game)} mengurangkan bilangan kawan.`, `${sentenceCase(game)} hanya membuang masa rehat.`], "Permainan PJ ada kebaikan fizikal dan sosial.", "Permainan mudah membantu murid bergerak aktif, bekerjasama dan belajar peraturan."),
]);

const rekreasiPairs = [
  ["berjalan santai di taman sekolah", "rekreasi aktif"],
  ["senamrobik ringan bersama guru", "aktiviti berirama"],
  ["mencari skital warna dalam kumpulan", "aktiviti berkumpulan"],
  ["bermain gelung secara bergilir", "rekreasi selamat"],
  ["berjalan di laluan alam sekitar sekolah", "aktiviti luar kelas"],
  ["permainan tradisional mudah", "rekreasi budaya"],
  ["aktiviti stesen kecergasan mini", "rekreasi berstesen"],
  ["bermain tali secara bergilir", "aktiviti koordinasi"],
  ["melukis laluan dengan kon dan berjalan ikut laluan", "aktiviti orientasi mudah"],
  ["senaman keluarga pada hujung minggu", "gaya hidup aktif"],
].flatMap(([activity, answer]) => [
  ask(`Aktiviti seperti ${activity} sesuai dikelaskan sebagai apa?`, answer, ["rekreasi aktif", "aktiviti berirama", "aktiviti berkumpulan", "rekreasi selamat", "aktiviti luar kelas", "rekreasi budaya", "gaya hidup aktif"], "Rekreasi ialah aktiviti masa lapang yang sihat.", `${activity} membantu murid bergerak aktif sambil menikmati aktiviti yang menyeronokkan.`),
  contextualAsk(`Apakah tujuan aktiviti rekreasi seperti ${activity}?`, `${sentenceCase(activity)} membantu menyihatkan badan.`, "menyihatkan badan", [`${sentenceCase(activity)} bertujuan mencari gaduh.`, `${sentenceCase(activity)} membantu murid mengelak semua pergerakan.`, `${sentenceCase(activity)} hanya membazir masa.`], "Rekreasi aktif memberi manfaat kepada tubuh.", "Aktiviti rekreasi yang selamat membantu badan sihat dan emosi lebih gembira."),
  contextualAsk(`Apakah sikap baik semasa menyertai ${activity}?`, `Murid perlu mengikut giliran semasa ${activity}.`, "ikut giliran", [`Murid perlu berebut semasa ${activity}.`, `Murid perlu memotong giliran rakan semasa ${activity}.`, `Murid perlu mengejek rakan semasa ${activity}.`], "Aktiviti berkumpulan perlu teratur.", "Mengikut giliran memberi peluang kepada semua murid untuk mencuba."),
  contextualAsk(`Apakah yang perlu dibawa selepas aktiviti luar seperti ${activity}?`, `Murid perlu membawa botol air untuk diminum selepas ${activity}.`, "botol air", [`Murid perlu membawa mainan tajam selepas ${activity}.`, `Murid perlu membawa telefon guru selepas ${activity}.`, `Murid perlu membawa batu besar selepas ${activity}.`], "Aktiviti luar membuat badan berpeluh.", "Botol air membantu murid minum air kosong dan kekal bertenaga."),
  contextualAsk(`Apakah tempat yang sesuai untuk aktiviti seperti ${activity}?`, `Kawasan lapang dan selamat sesuai untuk ${activity}.`, "kawasan lapang dan selamat", [`Tepi jalan raya sesuai untuk ${activity}.`, `Lantai licin sesuai untuk ${activity}.`, `Stor gelap sesuai untuk ${activity}.`], "Pilih tempat yang kurang risiko.", "Kawasan lapang dan selamat membolehkan murid bergerak tanpa bahaya."),
]);

const gayaHidupPairs = [
  { habit: "bermain di padang pada waktu petang", category: "aktif bergerak", benefit: ["Bermain di padang membantu meningkatkan kecergasan.", "meningkatkan kecergasan"], support: ["Murid perlu minum air kosong selepas bermain di padang.", "minum air kosong"], balance: ["Murid perlu berehat selepas bermain di padang.", "berehat selepas bermain"], school: ["Murid boleh menyertai aktiviti PJ di padang sekolah.", "menyertai aktiviti PJ"] },
  { habit: "membantu menyapu halaman rumah", category: "aktiviti fizikal harian", benefit: ["Menyapu halaman menjadikan kerja rumah satu aktiviti fizikal.", "kerja rumah menjadi aktiviti fizikal"], support: ["Murid perlu mencuci tangan selepas menyapu halaman.", "mencuci tangan"], balance: ["Murid perlu berhenti seketika jika penat semasa menyapu halaman.", "berehat jika penat"], school: ["Murid boleh membantu menyusun alatan PJ selepas kelas.", "menyusun alatan PJ"] },
  { habit: "naik tangga dengan selamat", category: "menggunakan tenaga badan", benefit: ["Naik tangga dengan selamat membantu menguatkan kaki.", "menguatkan kaki"], support: ["Murid perlu memegang susur tangan semasa naik tangga.", "memegang susur tangan"], balance: ["Murid perlu berjalan dan tidak berebut semasa naik tangga.", "berjalan dan tidak berebut"], school: ["Murid perlu menggunakan tangga sekolah secara tertib.", "menggunakan tangga secara tertib"] },
  { habit: "berjalan kaki bersama keluarga", category: "rekreasi keluarga", benefit: ["Berjalan kaki bersama keluarga membantu meningkatkan daya tahan.", "meningkatkan daya tahan"], support: ["Murid perlu memakai kasut yang sesuai semasa berjalan kaki.", "memakai kasut yang sesuai"], balance: ["Keluarga perlu memilih laluan yang selamat dan berehat jika penat.", "pilih laluan selamat dan berehat"], school: ["Murid boleh berjalan antara stesen aktiviti PJ dengan teratur.", "berjalan antara stesen PJ"] },
  { habit: "mengurangkan masa menonton skrin", category: "lebih banyak bergerak", benefit: ["Mengurangkan masa skrin memberi lebih banyak masa untuk bergerak aktif.", "lebih banyak masa untuk bergerak"], support: ["Murid boleh menggantikan masa skrin dengan permainan luar yang selamat.", "bermain di luar dengan selamat"], balance: ["Murid perlu membahagikan masa untuk belajar, berehat dan bergerak aktif.", "bahagikan masa dengan seimbang"], school: ["Murid boleh bergerak aktif secara selamat pada waktu rehat.", "bergerak aktif waktu rehat"] },
  { habit: "minum air kosong selepas bermain", category: "menjaga hidrasi", benefit: ["Minum air kosong selepas bermain membantu menggantikan cecair badan.", "menggantikan cecair badan"], support: ["Murid perlu membawa botol air sendiri ketika melakukan aktiviti.", "membawa botol air"], balance: ["Murid perlu minum air sedikit demi sedikit mengikut keperluan.", "minum mengikut keperluan"], school: ["Murid boleh mengisi semula botol air di tempat yang dibenarkan.", "mengisi semula botol air"] },
  { habit: "tidur awal selepas hari aktif", category: "rehat yang cukup", benefit: ["Tidur awal membantu badan pulih selepas hari yang aktif.", "membantu badan pulih"], support: ["Murid perlu mempunyai waktu tidur yang tetap setiap malam.", "waktu tidur yang tetap"], balance: ["Murid perlu aktif pada waktu siang dan mendapat tidur yang cukup.", "aktif siang dan cukup tidur"], school: ["Tidur yang cukup membantu murid bertenaga semasa kelas PJ.", "bertenaga semasa kelas PJ"] },
  { habit: "makan buah selepas aktiviti", category: "pilihan makanan sihat", benefit: ["Makan buah membekalkan vitamin dan serat kepada badan.", "membekalkan vitamin dan serat"], support: ["Murid perlu memilih buah segar sebagai snek yang sihat.", "memilih buah segar"], balance: ["Murid perlu makan buah bersama makanan daripada kumpulan lain.", "makan pelbagai kumpulan makanan"], school: ["Murid boleh membawa potongan buah sebagai bekal sekolah.", "membawa buah sebagai bekal"] },
  { habit: "mengemas alat permainan selepas digunakan", category: "tanggungjawab", benefit: ["Mengemas alat permainan melatih tanggungjawab sambil menggerakkan badan.", "melatih tanggungjawab"], support: ["Murid perlu mengangkat dan menyimpan alat satu demi satu dengan selamat.", "menyimpan alat dengan selamat"], balance: ["Murid perlu berkongsi tugas mengemas alat bersama rakan.", "berkongsi tugas"], school: ["Murid perlu memulangkan alatan PJ ke tempat simpanan selepas kelas.", "memulangkan alatan PJ"] },
  { habit: "bermain secara selamat dengan jiran", category: "hubungan sosial sihat", benefit: ["Bermain dengan jiran membantu murid aktif dan membina persahabatan.", "aktif dan membina persahabatan"], support: ["Murid perlu bersetuju tentang peraturan dan kawasan permainan.", "setuju peraturan dan kawasan"], balance: ["Murid perlu berhenti untuk berehat dan minum air apabila penat.", "rehat dan minum air"], school: ["Murid perlu bekerjasama dengan rakan dalam permainan mudah di sekolah.", "bekerjasama dalam permainan"] },
].flatMap(({ habit, category, benefit, support, balance, school }) => [
  ask(`Amalan ${habit} menunjukkan gaya hidup apa?`, category, ["aktif bergerak", "aktiviti fizikal harian", "rekreasi keluarga", "lebih banyak bergerak", "menjaga hidrasi", "rehat yang cukup", "pilihan makanan sihat", "tanggungjawab", "hubungan sosial sihat"], "Gaya hidup aktif berlaku di sekolah dan di rumah.", `${sentenceCase(habit)} ialah contoh amalan sihat yang sesuai untuk murid Tahun 2.`),
  contextualAsk(`Apakah manfaat utama amalan ${habit}?`, benefit[0], benefit[1], [`${sentenceCase(habit)} menyebabkan badan tidak sihat.`, `${sentenceCase(habit)} menyebabkan murid cepat marah.`, `${sentenceCase(habit)} menghalang murid daripada belajar.`], "Fikirkan kesan baik amalan itu kepada tubuh atau emosi.", `${benefit[0]} Amalan yang konsisten menyokong gaya hidup sihat.`),
  contextualAsk(`Apakah tindakan yang menyokong amalan ${habit}?`, support[0], support[1], [`Murid perlu mengabaikan keselamatan ketika ${habit}.`, `Murid perlu berebut dengan rakan ketika ${habit}.`, `Murid perlu melakukan ${habit} tanpa mengikut kemampuan.`], "Pilih tindakan yang selamat dan sesuai dengan amalan tersebut.", `${support[0]} Tindakan ini membantu amalan dilakukan dengan lebih selamat.`),
  contextualAsk(`Bagaimanakah amalan ${habit} boleh dilakukan secara seimbang?`, balance[0], balance[1], [`Murid perlu melakukan ${habit} tanpa henti.`, `Murid perlu tidur terlalu lewat selepas ${habit}.`, `Murid perlu mengabaikan keadaan badan semasa ${habit}.`], "Seimbang bermaksud menjaga masa, rehat dan kemampuan diri.", `${balance[0]} Keseimbangan membantu murid kekal sihat.`),
  contextualAsk(`Apakah amalan di sekolah yang paling berkaitan dengan ${habit}?`, school[0], school[1], [`Murid perlu duduk sepanjang waktu rehat.`, `Murid perlu menolak rakan semasa aktiviti.`, `Murid perlu mengelakkan semua pergerakan di sekolah.`], "Hubungkan amalan di rumah dengan rutin sihat di sekolah.", `${school[0]} Amalan di rumah dan sekolah boleh saling menyokong.`),
]);

const sukanSekolahPairs = [
  ["bola sepak", "menendang bola"],
  ["bola jaring", "menghantar dan menangkap bola"],
  ["badminton", "memukul bulu tangkis"],
  ["olahraga lari pecut", "berlari pantas"],
  ["lompat jauh asas", "melompat ke hadapan"],
  ["senamrobik", "bergerak mengikut rentak"],
  ["gimnastik asas", "mengimbang dan mengguling"],
  ["hoki mini", "menolak bola dengan kayu hoki plastik"],
  ["bola baling mini", "membaling dan menangkap bola"],
  ["permainan tradisional", "bergerak aktif bersama rakan"],
].flatMap(([sport, skill]) => [
  ask(`Apakah kemahiran asas dalam aktiviti ${sport}?`, skill, [skill, "menolak rakan", "duduk diam", "menyorok alat"], "Fikirkan pergerakan utama sukan itu.", `${sport} menggunakan kemahiran ${skill} yang boleh dipelajari secara asas di sekolah.`),
  ask(`Apakah pakaian yang sesuai untuk aktiviti ${sport} di sekolah?`, "pakaian sukan", ["pakaian sukan", "selipar", "baju hujan", "kasut bertumit"], "Pakaian perlu memudahkan pergerakan.", "Pakaian sukan dan kasut yang sesuai membantu murid bergerak dengan selamat."),
  ask(`Apakah yang perlu dilakukan jika tidak faham peraturan ${sport}?`, "bertanya kepada guru", ["bertanya kepada guru", "buat peraturan sendiri", "marah rakan", "keluar gelanggang"], "Guru boleh menerangkan semula.", "Bertanya kepada guru membantu murid bermain dengan betul dan yakin."),
  ask(`Apakah nilai murni yang diamalkan dalam ${sport}?`, "semangat kesukanan", ["semangat kesukanan", "suka mengejek", "menipu", "mementingkan diri"], "Sukan mengajar nilai baik.", "Semangat kesukanan bermaksud bermain dengan adil, menghormati rakan dan menerima keputusan."),
  ask(`Mengapakah aktiviti ${sport} perlu dibuat mengikut tahap murid Tahun 2?`, "supaya selamat dan sesuai", ["supaya selamat dan sesuai", "supaya terlalu susah", "supaya murid takut", "supaya alat rosak"], "Aktiviti perlu ikut umur dan kemampuan.", "Aktiviti yang sesuai tahap murid membantu pembelajaran berlaku dengan selamat."),
]);

const uasaCampuran = [
  ...pergerakanAsas.slice(0, 5),
  ...lokomotor.slice(5, 10),
  ...bukanLokomotorPairs.slice(10, 15),
  ...manipulasiAlatanPairs.slice(15, 20),
  ...koordinasiPairs.slice(20, 25),
  ...kecergasanPairs.slice(25, 30),
  ...keselamatanPairs.slice(30, 35),
  ...permainanPairs.slice(35, 40),
  ...rekreasiPairs.slice(40, 45),
  ...gayaHidupPairs.slice(45, 50),
].map((item, index) => ({
  ...item,
  question: `Soalan ulang kaji UASA: ${item.question}`,
  explanation: `${item.explanation} Ini membantu murid menjawab soalan situasi PJ dengan lebih yakin.`,
}));

export const pjSubject = {
  id: "pj",
  title: SUBJECT,
  short: "PJ",
  icon: "🏃",
  color: "orange",
  topics: [
    makeTopic({ id: "pergerakan_asas", code: "PERGERAKAN_ASAS", title: "Pergerakan Asas", note: "Kemahiran gerak asas Tahun 2", items: pergerakanAsas }),
    makeTopic({ id: "lokomotor", code: "LOKOMOTOR", title: "Lokomotor", note: "Bergerak dari satu tempat ke tempat lain", items: lokomotor }),
    makeTopic({ id: "bukan_lokomotor", code: "BUKAN_LOKOMOTOR", title: "Bukan Lokomotor", note: "Kawalan badan di tempat sendiri", items: bukanLokomotorPairs }),
    makeTopic({ id: "manipulasi_alatan", code: "MANIPULASI_ALATAN", title: "Manipulasi Alatan", note: "Mengawal bola, gelung dan alatan ringan", items: manipulasiAlatanPairs }),
    makeTopic({ id: "koordinasi", code: "KOORDINASI", title: "Koordinasi", note: "Koordinasi mata, tangan dan kaki", items: koordinasiPairs }),
    makeTopic({ id: "kecergasan_fizikal", code: "KECERGASAN_FIZIKAL", title: "Kecergasan Fizikal", note: "Daya tahan, kekuatan dan kelenturan", items: kecergasanPairs }),
    makeTopic({ id: "keselamatan_aktiviti", code: "KESELAMATAN_AKTIVITI", title: "Keselamatan Semasa Aktiviti", note: "Amalan selamat semasa PJ", items: keselamatanPairs }),
    makeTopic({ id: "permainan_mudah", code: "PERMAINAN_MUDAH", title: "Permainan Mudah", note: "Permainan kecil dan semangat kesukanan", items: permainanPairs }),
    makeTopic({ id: "rekreasi", code: "REKREASI", title: "Rekreasi", note: "Aktiviti masa lapang yang aktif dan selamat", items: rekreasiPairs }),
    makeTopic({ id: "gaya_hidup_aktif", code: "GAYA_HIDUP_AKTIF", title: "Gaya Hidup Aktif", note: "Amalan sihat di sekolah dan di rumah", items: gayaHidupPairs.concat(sukanSekolahPairs, uasaCampuran) }),
  ],
};

export default pjSubject;
