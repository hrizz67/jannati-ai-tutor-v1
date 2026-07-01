const SUBJECT = "Pendidikan Jasmani Tahun 2";
const DSKP = "KSSR Semakan Pendidikan Jasmani Tahun 2";

const difficultyFor = (index) => {
  if (index < 20) return "mudah";
  if (index < 40) return "sederhana";
  return "sukar";
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
    accepted: [item.answer],
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

const ask = (question, answer, options, hint, explanation) => ({
  question,
  answer,
  options,
  hint,
  explanation,
});

const actionOptions = ["berjalan", "berlari", "melompat", "mencongklang", "mengilas", "membongkok", "menolak", "menarik"];
const safetyOptions = ["berhenti dan beritahu guru", "terus bermain", "tolak kawan", "berlari di lantai licin", "ambil alat tanpa izin"];
const fitnessOptions = ["daya tahan", "kekuatan", "kelenturan", "kelajuan", "imbangan", "koordinasi", "ketangkasan"];
const valuesOptions = ["bekerjasama", "ikut giliran", "jujur", "menghormati rakan", "berhati-hati", "berdisiplin", "aktif setiap hari"];

const pergerakanAsas = [
  ask("Apakah pergerakan yang sesuai apabila murid bergerak perlahan dari satu tempat ke tempat lain?", "berjalan", actionOptions, "Fikirkan pergerakan kaki yang tidak laju.", "Berjalan ialah pergerakan asas yang mudah dan selamat untuk bergerak perlahan."),
  ask("Apakah pergerakan yang menggunakan kedua-dua kaki untuk menolak badan ke atas?", "melompat", actionOptions, "Badan naik dari lantai seketika.", "Melompat menggunakan kaki untuk menolak badan ke atas dan mendarat dengan terkawal."),
  ask("Murid bergerak laju ke garisan penamat. Apakah pergerakan itu?", "berlari", actionOptions, "Pergerakan ini lebih laju daripada berjalan.", "Berlari membantu murid bergerak pantas tetapi perlu menjaga ruang dan keselamatan."),
  ask("Apakah pergerakan apabila badan dipusing sedikit ke kiri atau kanan?", "mengilas", actionOptions, "Pinggang dan bahu bergerak ke sisi.", "Mengilas ialah pergerakan bukan lokomotor yang melibatkan putaran badan."),
  ask("Apakah pergerakan apabila murid menundukkan badan untuk mengambil bola di lantai?", "membongkok", actionOptions, "Badan direndahkan ke hadapan.", "Membongkok perlu dibuat dengan lutut sedikit dibengkokkan supaya badan lebih stabil."),
  ask("Apakah pergerakan apabila tangan menolak bola besar ke hadapan?", "menolak", actionOptions, "Objek bergerak menjauhi badan.", "Menolak ialah kemahiran asas menggunakan daya dari tangan atau badan."),
  ask("Apakah pergerakan apabila murid menarik tali ke arah badan?", "menarik", actionOptions, "Objek bergerak mendekati badan.", "Menarik memerlukan genggaman yang baik dan postur badan yang stabil."),
  ask("Apakah pergerakan apabila murid mendarat dengan lutut dibengkokkan selepas melompat?", "mendarat", ["mendarat", "menyepak", "menggolek", "menepuk"], "Fikirkan pergerakan selepas berada di udara.", "Mendarat dengan lutut dibengkokkan membantu menyerap hentakan dan mengurangkan risiko kecederaan."),
  ask("Apakah pergerakan apabila murid berguling di atas tilam gimnastik?", "mengguling", ["mengguling", "berlari", "menyambut", "menolak"], "Badan bergerak secara bulat di atas tilam.", "Mengguling perlu dibuat di kawasan beralas dan dengan pengawasan guru."),
  ask("Apakah pergerakan yang sesuai untuk melalui laluan sempit tanpa berlanggar?", "berjalan", actionOptions, "Pilih pergerakan yang paling terkawal.", "Berjalan memberi kawalan badan yang lebih baik di ruang sempit."),
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
  ask("Apakah maksud pergerakan asas?", "pergerakan mudah yang menjadi asas aktiviti", ["pergerakan mudah yang menjadi asas aktiviti", "aktiviti hanya untuk murid besar", "cara memakai kasut", "nama alat sukan"], "Asas bermaksud permulaan atau dasar.", "Pergerakan asas seperti berjalan, berlari dan melompat menjadi dasar kepada permainan dan sukan."),
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
  ask("Apakah contoh pergerakan lokomotor?", "berlari ke hadapan", ["berlari ke hadapan", "mengilas di tempat", "membongkok di tempat", "menepuk tangan"], "Lokomotor berpindah tempat.", "Berlari ke hadapan ialah lokomotor kerana badan bergerak dari satu tempat ke tempat lain."),
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
    ask(`Murid Tahun 2 melakukan ${activity}. Pergerakan ini sesuai dikelaskan sebagai ________.`, "lokomotor", ["lokomotor", "bukan lokomotor", "rehat", "rawatan"], "Badan bergerak dari satu tempat ke tempat lain.", `${activity} ialah aktiviti lokomotor kerana murid berpindah tempat.`),
    ask(`Apakah perkara penting semasa melakukan ${activity}?`, "jaga ruang", ["jaga ruang", "pejam mata", "tolak rakan", "lari keluar kawasan"], "Fikirkan keselamatan rakan.", `Menjaga ruang semasa ${activity} dapat mengelakkan perlanggaran.`),
    ask(`Apakah anggota badan yang paling banyak membantu semasa ${activity}?`, "kaki", ["kaki", "hidung", "telinga", "rambut"], "Pergerakan lokomotor banyak menggunakan bahagian bawah badan.", `Kaki membantu murid bergerak dan mengawal imbangan semasa ${activity}.`),
    ask(`Jika guru meminta murid melakukan ${activity} secara selamat, apakah tindakan terbaik?`, "dengar arahan guru", ["dengar arahan guru", "mula sebelum wisel", "berebut laluan", "berlari sambil menolak"], "Arahan guru membantu kelas bergerak teratur.", `Mendengar arahan guru menjadikan ${activity} lebih teratur dan selamat.`),
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
  ask(`Mengapakah ${activity} dipanggil bukan lokomotor?`, "tidak berpindah tempat", ["tidak berpindah tempat", "mesti berlari", "mesti menggunakan bola", "dibuat di kantin"], "Badan bergerak tetapi tempat tidak berubah.", `${activity} ialah bukan lokomotor kerana murid bergerak di ruang sendiri tanpa berpindah jauh.`),
  ask(`Apakah sikap yang baik semasa murid melakukan ${activity}?`, "buat dengan terkawal", ["buat dengan terkawal", "buat terlalu laju", "tolak rakan", "ketawa kuat"], "Pergerakan di tempat juga perlu selamat.", `Pergerakan yang terkawal mengurangkan risiko terseliuh atau terlanggar rakan.`),
  ask(`Apakah manfaat aktiviti ${activity}?`, "melatih kawalan badan", ["melatih kawalan badan", "menghilangkan kasut", "menambah gaduh", "membuang alat"], "Fikirkan kebaikan kepada tubuh.", `${activity} membantu murid mengenal pergerakan badan dan mengawal postur.`),
  ask(`Sebelum melakukan ${activity}, apakah yang perlu murid pastikan?`, "ada ruang sendiri", ["ada ruang sendiri", "rakan terlalu dekat", "lantai penuh air", "alat berselerak"], "Ruang mengelakkan sentuhan dengan rakan.", "Ruang sendiri membantu murid bergerak dengan selamat walaupun tidak berpindah tempat."),
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
  ask(`Apakah alat yang sesuai digunakan untuk ${activity}?`, activity.includes("pundi") ? "pundi kacang" : activity.includes("belon") ? "belon" : "bola", ["bola", "pundi kacang", "belon", "batu"], "Pilih alat yang selamat untuk murid kecil.", "Alat yang lembut dan sesuai saiz membantu murid berlatih dengan selamat."),
  ask(`Apakah bahagian badan yang perlu fokus semasa ${activity}?`, activity.includes("menendang") || activity.includes("menyepak") ? "mata dan kaki" : "mata dan tangan", ["mata dan tangan", "mata dan kaki", "telinga dan rambut", "hidung dan siku"], "Lihat objek dan gunakan anggota yang sesuai.", `${activity} memerlukan koordinasi supaya objek bergerak ke arah yang dikehendaki.`),
  ask(`Apakah tindakan selamat sebelum melakukan ${activity}?`, "pastikan kawasan lapang", ["pastikan kawasan lapang", "berdiri terlalu dekat", "baling tanpa melihat", "ambil alat rakan"], "Lihat ruang sekeliling dahulu.", "Kawasan lapang mengurangkan risiko terkena rakan atau halangan."),
  ask(`Apakah nilai baik semasa berlatih ${activity} bersama rakan?`, "bekerjasama", valuesOptions, "Aktiviti berpasangan memerlukan sikap baik.", "Bekerjasama membantu latihan berjalan lancar dan menyeronokkan."),
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
  ask(`Apakah koordinasi yang dilatih melalui aktiviti ${activity}?`, answer, ["koordinasi mata dan tangan", "koordinasi mata dan kaki", "koordinasi tangan dan kaki", "imbangan dan koordinasi"], "Fikirkan anggota badan yang bekerja bersama.", `Aktiviti ${activity} memerlukan beberapa anggota badan bekerja bersama dengan tumpuan.`),
  ask(`Mengapakah murid perlu melihat sasaran semasa ${activity}?`, "supaya pergerakan lebih tepat", ["supaya pergerakan lebih tepat", "supaya boleh menjerit", "supaya alat hilang", "supaya rakan takut"], "Mata membantu arah pergerakan.", "Melihat sasaran membantu murid mengawal arah dan ketepatan pergerakan."),
  ask(`Apakah cara baik untuk meningkatkan koordinasi dalam aktiviti ${activity}?`, "berlatih secara berulang", ["berlatih secara berulang", "berhenti terus", "buat sambil bergaduh", "pejam mata sepanjang masa"], "Kemahiran bertambah dengan latihan.", "Latihan berulang secara selamat membantu koordinasi menjadi lebih baik."),
  ask(`Apakah yang perlu dibuat jika murid gagal kali pertama semasa ${activity}?`, "cuba lagi dengan tenang", ["cuba lagi dengan tenang", "marah kepada rakan", "campak alat", "tinggalkan kelas"], "Kesilapan ialah sebahagian daripada belajar.", "Mencuba lagi dengan tenang membina keyakinan dan kemahiran."),
  ask(`Apakah tanda koordinasi murid semakin baik semasa ${activity}?`, "pergerakan lebih terkawal", ["pergerakan lebih terkawal", "semakin banyak menolak", "semakin tidak dengar arahan", "alat selalu terjatuh"], "Kawalan ialah tanda kemajuan.", "Pergerakan yang terkawal menunjukkan anggota badan bekerja dengan lebih baik."),
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
  ask(`Mengapakah murid perlu memanaskan badan sebelum ${activity}?`, "mengurangkan risiko kecederaan", ["mengurangkan risiko kecederaan", "supaya kasut kotor", "supaya boleh lambat", "supaya rakan kalah"], "Pemanasan badan menyediakan otot.", "Memanaskan badan membantu menyediakan otot dan sendi sebelum aktiviti."),
  ask(`Apakah tanda murid perlu berehat semasa ${activity}?`, "terlalu penat", ["terlalu penat", "masih bertenaga", "guru tersenyum", "skital tersusun"], "Dengar keadaan badan sendiri.", "Berehat apabila terlalu penat membantu mengelakkan pening atau kecederaan."),
  ask(`Apakah minuman terbaik selepas melakukan ${activity}?`, "air kosong", ["air kosong", "minuman bergas", "air terlalu manis", "kopi"], "Pilih minuman yang menyegarkan badan.", "Air kosong membantu menggantikan cecair badan selepas aktiviti fizikal."),
  ask(`Apakah tabiat baik untuk meningkatkan kecergasan selepas latihan ${activity}?`, "aktif setiap hari", valuesOptions, "Kecergasan dibina secara konsisten.", "Aktif setiap hari melalui permainan dan senaman ringan membantu tubuh lebih sihat."),
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
  ask(`Mengapakah murid tidak boleh meneruskan aktiviti apabila ${situation}?`, "boleh menyebabkan kecederaan", ["boleh menyebabkan kecederaan", "boleh mendapat markah penuh", "boleh menjadi permainan baru", "boleh membuat guru gembira"], "Fikirkan risiko kepada tubuh.", `${situation} ialah keadaan yang perlu dikawal supaya murid tidak cedera.`),
  ask(`Siapakah orang yang patut dimaklumkan apabila ${situation}?`, "guru", ["guru", "penjaja", "pemandu bas", "orang tidak dikenali"], "Di sekolah, guru menjaga aktiviti PJ.", "Guru boleh memberi arahan dan bantuan yang sesuai semasa aktiviti."),
  ask(`Apakah nilai yang ditunjukkan apabila murid bertindak selamat ketika ${situation}?`, "berhati-hati", valuesOptions, "Keselamatan memerlukan sikap cermat.", "Berhati-hati menunjukkan murid menjaga keselamatan diri dan rakan."),
  ask(`Apakah peraturan umum semasa aktiviti PJ apabila ${situation}?`, "dengar arahan guru", ["dengar arahan guru", "berlari tanpa arah", "guna alat rosak", "tolak rakan"], "Peraturan membantu semua murid selamat.", "Mendengar arahan guru memastikan aktiviti berjalan lancar dan selamat."),
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
  ask(`Apakah sikap penting semasa bermain ${game}?`, "bermain secara jujur", ["bermain secara jujur", "menipu markah", "marah apabila kalah", "ambil giliran rakan"], "Permainan perlu adil.", "Bermain secara jujur menjadikan permainan adil dan mendidik nilai murni."),
  ask(`Apakah yang perlu dibuat sebelum mula permainan ${game}?`, "dengar peraturan", ["dengar peraturan", "lari dahulu", "sembunyi alat", "tolak rakan"], "Peraturan membantu permainan selamat.", "Mendengar peraturan membantu murid faham cara bermain dan menjaga keselamatan."),
  ask(`Apakah tindakan baik jika pasukan kalah dalam ${game}?`, "terima keputusan dengan baik", ["terima keputusan dengan baik", "menyalahkan rakan", "menangis dan menolak", "buang alat"], "Kalah menang ialah adat permainan.", "Menerima keputusan dengan baik menunjukkan semangat kesukanan."),
  ask(`Apakah manfaat permainan mudah seperti ${game}?`, "melatih kerjasama dan kecergasan", ["melatih kerjasama dan kecergasan", "membuat murid malas", "mengurangkan kawan", "membuang masa rehat"], "Permainan PJ ada kebaikan fizikal dan sosial.", "Permainan mudah membantu murid bergerak aktif, bekerjasama dan belajar peraturan."),
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
  ask(`Aktiviti ${activity} sesuai dikelaskan sebagai apa?`, answer, ["rekreasi aktif", "aktiviti berirama", "aktiviti berkumpulan", "rekreasi selamat", "aktiviti luar kelas", "rekreasi budaya", "gaya hidup aktif"], "Rekreasi ialah aktiviti masa lapang yang sihat.", `${activity} membantu murid bergerak aktif sambil menikmati aktiviti yang menyeronokkan.`),
  ask(`Apakah tujuan aktiviti rekreasi seperti ${activity}?`, "menyihatkan badan", ["menyihatkan badan", "mencari gaduh", "mengelak semua pergerakan", "membazir masa"], "Rekreasi aktif memberi manfaat kepada tubuh.", "Aktiviti rekreasi yang selamat membantu badan sihat dan emosi lebih gembira."),
  ask(`Apakah sikap baik semasa menyertai ${activity}?`, "ikut giliran", valuesOptions, "Aktiviti berkumpulan perlu teratur.", "Mengikut giliran memberi peluang kepada semua murid untuk mencuba."),
  ask(`Apakah yang perlu dibawa selepas aktiviti luar seperti ${activity}?`, "botol air", ["botol air", "mainan tajam", "telefon guru", "batu besar"], "Aktiviti luar membuat badan berpeluh.", "Botol air membantu murid minum air kosong dan kekal bertenaga."),
  ask(`Apakah tempat yang sesuai untuk aktiviti ${activity}?`, "kawasan lapang dan selamat", ["kawasan lapang dan selamat", "tepi jalan raya", "lantai licin", "stor gelap"], "Pilih tempat yang kurang risiko.", "Kawasan lapang dan selamat membolehkan murid bergerak tanpa bahaya."),
]);

const gayaHidupPairs = [
  ["bermain di padang pada waktu petang", "aktif bergerak"],
  ["membantu menyapu halaman rumah", "aktiviti fizikal harian"],
  ["naik tangga dengan selamat", "menggunakan tenaga badan"],
  ["berjalan kaki bersama keluarga", "rekreasi keluarga"],
  ["mengurangkan masa menonton skrin", "lebih banyak bergerak"],
  ["minum air kosong selepas bermain", "menjaga hidrasi"],
  ["tidur awal selepas hari aktif", "rehat yang cukup"],
  ["makan buah selepas aktiviti", "pilihan makanan sihat"],
  ["mengemas alat permainan selepas digunakan", "tanggungjawab"],
  ["bermain secara selamat dengan jiran", "hubungan sosial sihat"],
].flatMap(([habit, answer]) => [
  ask(`Amalan ${habit} menunjukkan gaya hidup apa?`, answer, ["aktif bergerak", "aktiviti fizikal harian", "rekreasi keluarga", "lebih banyak bergerak", "menjaga hidrasi", "rehat yang cukup", "pilihan makanan sihat", "tanggungjawab"], "Gaya hidup aktif berlaku di sekolah dan di rumah.", `${habit} ialah contoh amalan sihat yang sesuai untuk murid Tahun 2.`),
  ask(`Mengapakah murid digalakkan ${habit}?`, "untuk badan sihat", ["untuk badan sihat", "supaya tidak perlu mandi", "supaya cepat marah", "supaya lewat tidur"], "Aktiviti sihat baik untuk tubuh.", "Amalan sihat membantu tubuh cergas, kuat dan bersedia untuk belajar."),
  ask(`Apakah pilihan yang lebih sihat selepas amalan ${habit}?`, "minum air kosong", ["minum air kosong", "minum air bergas", "makan gula-gula sahaja", "tidak minum langsung"], "Badan perlukan air.", "Air kosong membantu menggantikan air yang hilang melalui peluh."),
  ask(`Apakah yang perlu diseimbangkan dengan amalan aktif seperti ${habit}?`, "rehat yang cukup", ["rehat yang cukup", "bermain tanpa henti", "tidur terlalu lewat", "makan berlebihan"], "Tubuh juga perlu pulih.", "Rehat yang cukup membantu badan pulih selepas bergerak aktif."),
  ask(`Apakah contoh gaya hidup aktif di sekolah yang sepadan dengan amalan ${habit}?`, "menyertai aktiviti PJ", ["menyertai aktiviti PJ", "duduk sepanjang rehat", "menolak rakan", "tidak mahu bergerak"], "PJ membantu murid bergerak.", "Menyertai aktiviti PJ memberi peluang kepada murid membina kecergasan dan kemahiran."),
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
