const SUBJECT = "Pendidikan Kesihatan Tahun 2";
const DSKP = "KSSR Semakan Pendidikan Kesihatan Tahun 2";

const difficultyFor = (index) => {
  if (index < 20) return "mudah";
  if (index < 40) return "sederhana";
  return "sukar";
};

const optionSet = (answer, options) => {
  const unique = [answer, ...options.filter((item) => item !== answer)];
  return [...new Set(unique)].slice(0, 4).sort();
};

const ask = (question, answer, options, hint, explanation) => ({
  question,
  answer,
  options,
  hint,
  explanation,
});

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

const nilai = ["berdisiplin", "bertanggungjawab", "berani berkata tidak", "prihatin", "bersopan", "jujur", "sabar"];
const orangDipercayai = ["guru", "ibu bapa", "penjaga", "ahli keluarga dewasa"];

const kebersihanPairs = [
  ["sebelum makan di kantin", "basuh tangan dengan sabun", "Tangan yang bersih mengurangkan kuman masuk ke dalam badan."],
  ["selepas keluar dari tandas", "basuh tangan dengan sabun", "Mencuci tangan selepas tandas membantu mencegah penyakit."],
  ["sebelum tidur pada waktu malam", "gosok gigi", "Gosok gigi sebelum tidur membantu mencegah gigi berlubang."],
  ["selepas bangun pagi", "mandi dan pakai pakaian bersih", "Mandi dan pakaian bersih membuat badan segar dan selesa."],
  ["kuku sudah panjang", "potong kuku", "Kuku pendek lebih bersih dan tidak mudah menyimpan kotoran."],
  ["rambut kusut sebelum ke sekolah", "sikat rambut", "Rambut yang kemas membantu murid menjaga kebersihan diri."],
  ["stoking berbau selepas bersukan", "tukar stoking bersih", "Stoking bersih membantu kaki tidak berbau dan lebih selesa."],
  ["batuk atau bersin", "tutup mulut dan hidung", "Menutup mulut dan hidung membantu mengurangkan penyebaran kuman."],
  ["muka berpeluh selepas bermain", "cuci muka", "Mencuci muka membersihkan peluh dan kotoran."],
  ["tuala sudah lembap dan berbau", "jemur tuala", "Tuala yang dijemur cepat kering dan kurang kuman."],
].flatMap(([situasi, answer, explanation]) => [
  ask(`Apakah amalan kebersihan yang betul ${situasi}?`, answer, [answer, "makan tanpa cuci tangan", "pakai baju kotor", "kongsi berus gigi"], "Pilih amalan yang menjaga kebersihan badan.", explanation),
  ask(`Mengapakah murid perlu ${answer} ${situasi}?`, "mengelakkan kuman", ["mengelakkan kuman", "menambah kotoran", "supaya lambat ke kelas", "supaya tidak perlu mandi"], "Kebersihan membantu badan sihat.", `${answer} membantu mengurangkan kuman dan menjaga kesihatan diri.`),
  ask(`Apakah akibat jika murid tidak menjaga kebersihan ${situasi}?`, "mudah sakit", ["mudah sakit", "semakin cergas", "gigi terus kuat", "baju menjadi wangi"], "Kotoran dan kuman boleh memudaratkan badan.", "Tidak menjaga kebersihan boleh menyebabkan bau badan, sakit perut, sakit gigi atau jangkitan."),
  ask(`Siapakah yang boleh mengingatkan murid tentang kebersihan diri ${situasi}?`, "ibu bapa", ["ibu bapa", "orang tidak dikenali", "pemandu lori", "penjual mainan"], "Pilih orang dewasa yang menjaga murid.", "Ibu bapa, penjaga dan guru boleh membimbing murid menjaga kebersihan diri."),
  ask(`Nilai apakah yang ditunjukkan apabila murid ${answer} ${situasi}?`, "bertanggungjawab", nilai, "Menjaga diri ialah tanggungjawab sendiri.", "Murid yang menjaga kebersihan menunjukkan sikap bertanggungjawab terhadap kesihatan diri."),
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
  ask(`Apakah kebaikan ${amalan}?`, answer, [answer, "menyebabkan cepat letih", "membuat badan kotor", "mengurangkan tumpuan"], "Fikirkan manfaat makanan kepada badan.", explanation),
  ask(`Apakah pilihan paling sihat berkaitan amalan ${amalan}?`, amalan.includes("air kosong") ? "air kosong" : amalan.includes("buah") ? "buah" : amalan.includes("sayur") ? "sayur" : "makanan seimbang", ["air kosong", "buah", "sayur", "makanan seimbang", "gula-gula", "minuman bergas"], "Pilih makanan atau minuman yang membantu badan sihat.", "Pilihan makanan sihat membantu murid membesar, belajar dan bermain dengan baik."),
  ask(`Mengapakah murid tidak digalakkan makan makanan terlalu manis setiap hari semasa ${amalan}?`, "boleh merosakkan gigi", ["boleh merosakkan gigi", "membuat kuku bersih", "membuat mata lebih besar", "menjadikan kasut kemas"], "Gula yang banyak tidak baik untuk gigi.", "Makanan terlalu manis boleh merosakkan gigi dan tidak baik jika diambil berlebihan."),
  ask(`Apakah tindakan betul jika makanan berbau pelik ketika ${amalan}?`, "jangan makan dan beritahu guru", ["jangan makan dan beritahu guru", "makan cepat-cepat", "kongsi dengan rakan", "simpan dalam beg"], "Makanan rosak boleh menyebabkan sakit perut.", "Murid perlu menolak makanan yang rosak dan memberitahu orang dewasa."),
  ask(`Apakah maksud pemakanan sihat dalam situasi ${amalan}?`, "memilih makanan baik untuk tubuh", ["memilih makanan baik untuk tubuh", "makan jajan sahaja", "tidak minum air", "makan tanpa basuh tangan"], "Pemakanan sihat membantu badan.", "Pemakanan sihat bermaksud memilih makanan bersih, seimbang dan sesuai untuk tubuh."),
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
  ask(`Apakah tindakan paling selamat jika ${situasi}?`, answer, [answer, "ikut sahaja", "diam dan simpan rahsia", "sentuh benda itu"], "Utamakan keselamatan diri.", explanation),
  ask(`Siapakah orang yang boleh dipercayai apabila ${situasi}?`, "guru", orangDipercayai, "Pilih orang dewasa yang menjaga keselamatan murid.", "Guru, ibu bapa dan penjaga ialah orang dipercayai yang boleh membantu murid."),
  ask(`Apakah ayat yang sesuai digunakan apabila murid berasa tidak selamat kerana ${situasi}?`, "Tidak, saya tidak mahu", ["Tidak, saya tidak mahu", "Saya ikut semua arahan awak", "Jangan beritahu sesiapa", "Saya akan pergi sendiri"], "Murid boleh berkata tidak dengan tegas.", "Berkata tidak dengan tegas membantu murid melindungi diri daripada situasi berbahaya."),
  ask(`Mengapakah murid perlu memberitahu orang dewasa apabila ${situasi}?`, "supaya mendapat bantuan", ["supaya mendapat bantuan", "supaya masalah disembunyikan", "supaya kawan takut", "supaya boleh ponteng"], "Orang dewasa boleh bertindak.", "Memberitahu orang dewasa membantu murid mendapat perlindungan dan nasihat yang betul."),
  ask(`Nilai apakah yang penting apabila menghadapi situasi ${situasi}?`, "berani berkata tidak", nilai, "Keselamatan diri memerlukan keberanian.", "Berani berkata tidak membantu murid menjaga tubuh, ruang diri dan keselamatan."),
]);

const emosiPairs = [
  ["kecewa kerana kalah permainan", "tarik nafas dan cuba lagi", "Menarik nafas membantu murid bertenang sebelum mencuba semula."],
  ["marah apabila mainan diambil rakan", "bercakap dengan baik", "Bercakap dengan baik membantu menyelesaikan masalah tanpa bergaduh."],
  ["takut membuat persembahan", "beritahu guru", "Guru boleh memberi sokongan dan galakan."],
  ["sedih kerana ditegur", "dengar nasihat dan baiki diri", "Teguran yang baik membantu murid belajar menjadi lebih baik."],
  ["gembira mendapat pujian", "ucap terima kasih", "Mengucapkan terima kasih menunjukkan adab yang baik."],
  ["risau sebelum ujian", "ulang kaji dan bertenang", "Ulang kaji dan bertenang membantu murid lebih yakin."],
  ["rakan kelihatan muram", "bertanya dengan sopan", "Bertanya dengan sopan menunjukkan sikap prihatin."],
  ["tidak dipilih dalam kumpulan", "minta bantuan guru", "Guru boleh membantu membahagikan kumpulan dengan adil."],
  ["terlalu seronok hingga menjerit", "kawal suara", "Mengawal suara menjaga ketenteraman kelas."],
  ["buat salah kepada rakan", "minta maaf", "Meminta maaf membantu memulihkan hubungan dengan rakan."],
].flatMap(([situasi, answer, explanation]) => [
  ask(`Apakah cara yang baik untuk mengurus emosi apabila murid ${situasi}?`, answer, [answer, "menolak rakan", "menjerit kuat", "menyimpan marah"], "Pilih cara yang tenang dan sopan.", explanation),
  ask(`Apakah emosi yang mungkin dirasai apabila murid ${situasi}?`, situasi.includes("marah") ? "marah" : situasi.includes("takut") ? "takut" : situasi.includes("sedih") ? "sedih" : situasi.includes("gembira") ? "gembira" : situasi.includes("risau") ? "risau" : "kecewa", ["marah", "takut", "sedih", "gembira", "risau", "kecewa"], "Kenal pasti perasaan dalam situasi itu.", "Mengenal emosi sendiri membantu murid memilih tindakan yang baik."),
  ask(`Siapakah yang boleh membantu murid apabila ${situasi}?`, "guru", orangDipercayai, "Cari orang dewasa yang dipercayai.", "Guru dan ibu bapa boleh mendengar masalah murid serta memberi nasihat."),
  ask(`Mengapakah murid perlu bercakap dengan sopan apabila ${situasi}?`, "mengelakkan pergaduhan", ["mengelakkan pergaduhan", "menambah marah", "supaya rakan menangis", "supaya kelas bising"], "Kata-kata yang baik menenangkan keadaan.", "Bercakap dengan sopan membantu menjaga hubungan baik dengan rakan."),
  ask(`Apakah tanda emosi diurus dengan baik apabila ${situasi}?`, "murid menjadi lebih tenang", ["murid menjadi lebih tenang", "murid menolak meja", "murid mengejek rakan", "murid lari keluar kelas"], "Emosi yang baik membuat badan dan fikiran tenang.", "Murid yang tenang boleh berfikir dan bertindak dengan lebih selamat."),
]);

const jalanRayaPairs = [
  ["melintas jalan di hadapan sekolah", "guna lintasan pejalan kaki", "Lintasan pejalan kaki membantu pemandu melihat murid dengan lebih jelas."],
  ["lampu isyarat pejalan kaki berwarna merah", "berhenti", "Merah bermaksud pejalan kaki perlu berhenti."],
  ["lampu isyarat pejalan kaki berwarna hijau", "melintas dengan berhati-hati", "Hijau membenarkan pejalan kaki melintas selepas melihat kiri dan kanan."],
  ["menaiki kereta ke sekolah", "pakai tali pinggang keledar", "Tali pinggang keledar membantu melindungi penumpang."],
  ["menaiki motosikal dengan ayah", "pakai topi keledar", "Topi keledar melindungi kepala jika berlaku kemalangan."],
  ["berjalan di tepi jalan", "guna laluan pejalan kaki", "Laluan pejalan kaki lebih selamat daripada berjalan di tengah jalan."],
  ["turun dari bas sekolah", "tunggu bas bergerak sebelum melintas", "Murid perlu pastikan jalan jelas sebelum melintas."],
  ["bola tergolek ke jalan raya", "minta bantuan orang dewasa", "Murid tidak patut berlari mengejar bola ke jalan raya."],
  ["jalan raya sibuk", "pegang tangan orang dewasa", "Orang dewasa boleh membantu murid melintas dengan selamat."],
  ["berbasikal di kawasan rumah", "pakai topi keselamatan", "Topi keselamatan membantu melindungi kepala semasa berbasikal."],
].flatMap(([situasi, answer, explanation]) => [
  ask(`Apakah tindakan selamat apabila ${situasi}?`, answer, [answer, "berlari tanpa melihat", "bermain di jalan raya", "melintas sambil bergurau"], "Fikirkan peraturan keselamatan jalan raya.", explanation),
  ask(`Mengapakah murid perlu berhati-hati apabila ${situasi}?`, "mengelakkan kemalangan", ["mengelakkan kemalangan", "supaya cepat sampai", "supaya boleh bermain", "supaya jalan sesak"], "Jalan raya mempunyai kenderaan.", "Berhati-hati di jalan raya dapat mengurangkan risiko kemalangan."),
  ask(`Apakah yang perlu dilihat sebelum melintas dalam situasi ${situasi}?`, "kiri dan kanan", ["kiri dan kanan", "kasut sahaja", "awan", "beg sekolah"], "Lihat arah kenderaan datang.", "Melihat kiri dan kanan membantu murid memastikan jalan selamat untuk dilintas."),
  ask(`Siapakah yang sesuai membantu murid Tahun 2 apabila ${situasi}?`, "orang dewasa", ["orang dewasa", "rakan sebaya sahaja", "orang tidak dikenali", "diri sendiri sahaja"], "Murid kecil perlu bimbingan.", "Orang dewasa boleh membimbing murid mematuhi peraturan jalan raya."),
  ask(`Apakah nilai yang ditunjukkan apabila murid mematuhi peraturan ketika ${situasi}?`, "berdisiplin", nilai, "Peraturan memerlukan disiplin.", "Berdisiplin di jalan raya membantu menjaga keselamatan diri dan orang lain."),
]);

const penyakitPairs = [
  ["demam dan batuk", "berehat dan beritahu ibu bapa", "Berehat dan memberitahu ibu bapa membantu murid mendapat penjagaan."],
  ["selesema di kelas", "tutup hidung ketika bersin", "Menutup hidung mengurangkan penyebaran titisan kuman."],
  ["sebelum makan", "basuh tangan", "Mencuci tangan sebelum makan membantu mencegah sakit perut."],
  ["nyamuk banyak di rumah", "buang air bertakung", "Air bertakung boleh menjadi tempat pembiakan nyamuk."],
  ["rakan sakit mata", "elak berkongsi tuala", "Tidak berkongsi tuala membantu mengurangkan jangkitan."],
  ["luka kecil di lutut", "bersihkan luka", "Luka yang dibersihkan kurang risiko dijangkiti kuman."],
  ["makanan terdedah kepada lalat", "jangan makan", "Lalat boleh membawa kuman ke makanan."],
  ["kelas berhabuk", "bersihkan kelas", "Persekitaran bersih membantu mengurangkan habuk dan kuman."],
  ["selepas bermain di luar", "mandi atau cuci tangan dan kaki", "Membersihkan diri selepas bermain mengurangkan kotoran."],
  ["batuk berpanjangan", "berjumpa doktor", "Doktor boleh memeriksa dan memberi rawatan yang sesuai."],
].flatMap(([situasi, answer, explanation]) => [
  ask(`Apakah cara mencegah penyakit apabila ${situasi}?`, answer, [answer, "kongsi tuala", "biar makanan terbuka", "tidak cuci tangan"], "Pilih tindakan yang mengurangkan kuman.", explanation),
  ask(`Mengapakah amalan ${answer} penting apabila ${situasi}?`, "mengurangkan kuman", ["mengurangkan kuman", "menambah kotoran", "membuat badan lemah", "menyebabkan kelas bising"], "Kuman boleh menyebabkan penyakit.", `${answer} membantu mengurangkan risiko penyakit dan menjaga kesihatan.`),
  ask(`Siapakah yang perlu diberitahu jika murid tidak sihat kerana ${situasi}?`, "ibu bapa", orangDipercayai, "Orang dewasa boleh membantu.", "Ibu bapa, penjaga atau guru boleh membawa murid mendapatkan bantuan yang sesuai."),
  ask(`Apakah tanda murid mungkin tidak sihat dalam situasi ${situasi}?`, situasi.includes("luka") ? "luka sakit" : "badan tidak selesa", ["badan tidak selesa", "terlalu bertenaga", "kasut bersih", "rambut kemas"], "Penyakit membuat badan rasa tidak selesa.", "Murid perlu peka terhadap tanda badan tidak sihat supaya boleh mendapatkan bantuan."),
  ask(`Apakah sikap yang baik untuk mencegah penyakit berkaitan ${situasi}?`, "menjaga kebersihan", ["menjaga kebersihan", "berkongsi botol air", "membuang sampah merata-rata", "tidak mandi"], "Kebersihan ialah kunci kesihatan.", "Menjaga kebersihan diri dan persekitaran membantu mencegah penyakit."),
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
  ["melihat peti pertolongan cemas", "guna dengan bantuan guru", "Peti pertolongan cemas perlu digunakan dengan pengawasan orang dewasa."],
].flatMap(([situasi, answer, explanation]) => [
  ask(`Apakah tindakan awal yang betul apabila ${situasi}?`, answer, [answer, "ketawa", "sembunyikan kejadian", "terus bermain"], "Pertolongan cemas perlu selamat dan tenang.", explanation),
  ask(`Siapakah yang perlu dipanggil apabila ${situasi}?`, "guru", orangDipercayai, "Di sekolah, guru boleh membantu.", "Guru atau orang dewasa perlu dipanggil supaya bantuan diberi dengan betul."),
  ask(`Mengapakah murid tidak boleh panik apabila ${situasi}?`, "supaya boleh mendapatkan bantuan", ["supaya boleh mendapatkan bantuan", "supaya rakan takut", "supaya lambat bertindak", "supaya luka kotor"], "Tenang membantu kita fikir dengan baik.", "Bertenang membantu murid memanggil bantuan dan mengikut arahan dengan selamat."),
  ask(`Apakah perkara yang tidak patut dibuat apabila ${situasi}?`, "sembunyikan kejadian", ["sembunyikan kejadian", "beritahu guru", "duduk dengan tenang", "minta bantuan"], "Kecederaan perlu diketahui orang dewasa.", "Menyembunyikan kejadian boleh melambatkan bantuan dan membahayakan murid."),
  ask(`Apakah tujuan pertolongan cemas dalam situasi ${situasi}?`, "memberi bantuan awal", ["memberi bantuan awal", "menggantikan doktor sepenuhnya", "membuat rakan malu", "meneruskan permainan"], "Pertolongan cemas ialah bantuan pertama.", "Pertolongan cemas memberi bantuan awal sebelum rawatan lanjut jika diperlukan."),
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
  ask(`Apakah tindakan menjaga kesihatan persekitaran apabila ${situasi}?`, answer, [answer, "biarkan sahaja", "tambah sampah", "sembunyikan kotoran"], "Persekitaran bersih membantu kesihatan.", explanation),
  ask(`Mengapakah murid perlu menjaga kebersihan persekitaran semasa ${situasi}?`, "mengelakkan kuman dan bahaya", ["mengelakkan kuman dan bahaya", "supaya kelas berbau", "supaya nyamuk banyak", "supaya lantai licin"], "Tempat bersih lebih selamat.", "Persekitaran bersih membantu mencegah penyakit dan kemalangan kecil."),
  ask(`Siapakah yang patut bekerjasama apabila ${situasi}?`, "semua murid", ["semua murid", "seorang murid sahaja", "orang tidak dikenali", "murid yang lewat sahaja"], "Kebersihan sekolah ialah tanggungjawab bersama.", "Semua murid perlu bekerjasama menjaga kelas dan sekolah."),
  ask(`Apakah nilai yang diamalkan apabila murid ${answer} semasa ${situasi}?`, "bertanggungjawab", nilai, "Menjaga tempat belajar ialah tanggungjawab.", "Bertanggungjawab terhadap persekitaran menjadikan sekolah lebih selesa."),
  ask(`Apakah kesan baik jika murid bertindak betul apabila ${situasi}?`, "tempat lebih bersih dan selamat", ["tempat lebih bersih dan selamat", "lebih banyak kuman", "lebih banyak lalat", "murid mudah jatuh"], "Fikirkan kebaikan kepada semua.", "Tempat yang bersih dan selamat membantu murid belajar dengan selesa."),
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
  ask(`Apakah kebaikan amalan ${amalan}?`, answer, [answer, "badan mudah letih", "lebih banyak kuman", "makan tidak teratur"], "Gaya hidup sihat baik untuk tubuh dan emosi.", explanation),
  ask(`Apakah contoh gaya hidup sihat berkaitan ${amalan}?`, amalan, [amalan, "tidur terlalu lewat", "makan jajan setiap masa", "tidak mahu bergerak"], "Pilih amalan yang baik untuk kesihatan.", `${amalan} ialah amalan sesuai untuk murid Tahun 2 membina gaya hidup sihat.`),
  ask(`Mengapakah murid perlu mengamalkan ${amalan}?`, "supaya badan dan minda sihat", ["supaya badan dan minda sihat", "supaya mudah sakit", "supaya lambat belajar", "supaya tidak berkawan"], "Kesihatan melibatkan badan dan perasaan.", "Amalan sihat membantu murid belajar, bermain dan bergaul dengan lebih baik."),
  ask(`Siapakah yang boleh menggalakkan murid melakukan ${amalan}?`, "keluarga", ["keluarga", "orang tidak dikenali", "pemandu lori", "penjual mainan"], "Keluarga membimbing amalan harian.", "Keluarga boleh memberi galakan dan menjadi contoh gaya hidup sihat."),
  ask(`Apakah tanda murid mengamalkan gaya hidup sihat melalui ${amalan}?`, "lebih cergas dan ceria", ["lebih cergas dan ceria", "selalu mengantuk", "mudah marah", "tidak mahu mandi"], "Amalan sihat memberi kesan baik.", "Murid yang sihat biasanya lebih cergas, ceria dan bersedia untuk belajar."),
]);

const uasaCampuran = [
  ...kebersihanPairs.slice(0, 5),
  ...pemakananPairs.slice(5, 10),
  ...keselamatanDiriPairs.slice(10, 15),
  ...emosiPairs.slice(15, 20),
  ...jalanRayaPairs.slice(20, 25),
  ...penyakitPairs.slice(25, 30),
  ...pertolonganPairs.slice(30, 35),
  ...persekitaranPairs.slice(35, 40),
  ...gayaHidupPairs.slice(40, 50),
].map((item) => ({
  ...item,
  question: `Soalan ulang kaji UASA: ${item.question}`,
  explanation: `${item.explanation} Jawapan ini sesuai untuk soalan situasi Pendidikan Kesihatan Tahun 2.`,
}));

export const pkSubject = {
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
    makeTopic({ id: "uasa_kesihatan", code: "UASA_KESIHATAN", title: "UASA Kesihatan", note: "Latihan campuran Pendidikan Kesihatan", items: uasaCampuran }),
  ],
};

export default pkSubject;
