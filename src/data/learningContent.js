const BM_SOURCE = {
  curriculumLabel: 'Rujukan kurikulum KPM',
  curriculumUrl: 'https://www.moe.gov.my/surat-siaran-kpm-bil-1-tahun-2025',
  textbookLabel: 'Portal Buku Teks KPM',
  textbookUrl: 'https://www.moe.gov.my/index.php/buku-teks'
};

const BM_CONTENT = {
  kata_nama_am: { keyPoints: ['Nama umum untuk orang, haiwan, benda atau tempat.', 'Biasanya tidak merujuk kepada satu nama khusus sahaja.'], example: 'buku, kucing, sekolah', review: 'Pilih perkataan yang menamakan benda atau haiwan secara umum.' },
  kata_nama_khas: { keyPoints: ['Nama khusus bagi orang, tempat, jenama atau tajuk.', 'Huruf pertama biasanya ditulis dengan huruf besar.'], example: 'Aina, Melaka, Jannati', review: 'Cari nama yang merujuk kepada satu orang atau tempat tertentu.' },
  kata_ganti_nama: { keyPoints: ['Perkataan yang menggantikan nama orang.', 'Gunakan mengikut orang yang bercakap atau orang yang dimaksudkan.'], example: 'saya, kamu, dia, mereka', review: 'Baca ayat dan pilih kata yang menggantikan nama orang dengan tepat.' },
  kata_kerja: { keyPoints: ['Kata yang menunjukkan perbuatan atau tindakan.', 'Tanya: apakah perbuatan yang berlaku dalam ayat?'], example: 'membaca, menyanyi, mengemas', review: 'Cari perkataan yang menunjukkan perbuatan.' },
  kata_adjektif: { keyPoints: ['Kata yang menerangkan sifat, warna, saiz atau keadaan.', 'Kata ini membantu kita menerangkan sesuatu dengan lebih jelas.'], example: 'merah, besar, rajin', review: 'Cari perkataan yang menerangkan sifat atau keadaan.' },
  kata_sendi: { keyPoints: ['Kata yang hadir di hadapan kata nama atau frasa nama.', 'Gunakan kata sendi yang sesuai dengan hubungan dalam ayat.'], example: 'di sekolah, ke rumah, dari pasar', review: 'Perhatikan tempat atau arah dalam ayat sebelum memilih jawapan.' },
  kata_hubung: { keyPoints: ['Kata yang menghubungkan perkataan, frasa atau ayat.', 'Pilih kata hubung berdasarkan hubungan maksud ayat.'], example: 'dan, tetapi, kerana', review: 'Baca kedua-dua bahagian ayat dan cari perkataan yang menghubungkannya.' },
  penjodoh_bilangan: { keyPoints: ['Kata yang digunakan bersama bilangan dan kata nama.', 'Pilih berdasarkan bentuk atau jenis benda.'], example: 'sebatang pensel, seekor kucing, sehelai baju', review: 'Lihat benda yang dikira dan tentukan penjodoh yang sesuai.' },
  pemahaman_penulisan: { keyPoints: ['Baca ayat dengan teliti sebelum menjawab.', 'Cari maklumat yang dinyatakan secara terus dalam ayat.'], example: 'Siapakah, apakah, di manakah', review: 'Gariskan kata kunci soalan dan cari jawapannya dalam ayat.' },
  ayat: { keyPoints: ['Ayat tanya digunakan untuk bertanya.', 'Ayat seruan menunjukkan perasaan, manakala ayat perintah memberikan arahan.'], example: 'Siapakah nama kamu? Tolong duduk.', review: 'Kenal pasti tujuan ayat: bertanya, berseru atau memberi arahan.' },
  tatabahasa: { keyPoints: ['Ayat perlu mempunyai susunan dan penggunaan kata yang betul.', 'Baca semula ayat untuk memastikan maksudnya jelas.'], example: 'Baju itu bersih selepas dicuci.', review: 'Pilih perkataan yang menjadikan ayat lengkap dan bermakna.' },
  bina_ayat: { keyPoints: ['Ayat lengkap mempunyai maksud yang jelas.', 'Gunakan kata kunci tanpa mengubah maksudnya.'], example: 'Ali rajin membaca buku.', review: 'Pastikan ayat bermula dengan huruf besar dan berakhir dengan tanda baca.' },
  simpulan_bahasa: { keyPoints: ['Simpulan bahasa mempunyai maksud tertentu.', 'Maksudnya tidak semestinya sama dengan makna setiap perkataan.'], example: 'ringan tulang = suka membantu', review: 'Fikirkan maksud keseluruhan ungkapan dalam situasi.' },
  uasa_kbat: { keyPoints: ['Gunakan pengetahuan bahasa dalam situasi harian.', 'Pilih tindakan atau jawapan yang paling sesuai dengan sebabnya.'], example: 'menjaga kebersihan kelas', review: 'Baca situasi, kenal pasti masalah dan pilih tindakan yang baik.' }
};

const BM_TEXTBOOK_GUIDANCE = {
  kata_nama_am: { focus: 'Kenal pasti nama umum bagi orang, haiwan, benda dan tempat.', activity: 'Kelaskan perkataan mengikut kumpulan orang, haiwan, benda atau tempat.', check: 'Boleh bezakan nama umum daripada nama khusus.' },
  kata_nama_khas: { focus: 'Perhatikan nama khusus dan penggunaan huruf besar pada awal perkataan.', activity: 'Cari nama orang, tempat dan jenama dalam ayat atau gambar.', check: 'Boleh jelaskan sebab sesuatu nama perlu ditulis dengan huruf besar.' },
  kata_ganti_nama: { focus: 'Lihat siapa yang bercakap dan siapa yang dimaksudkan dalam ayat.', activity: 'Gantikan nama orang dalam ayat dengan saya, kamu, dia atau mereka.', check: 'Boleh memilih kata ganti nama mengikut situasi.' },
  kata_kerja: { focus: 'Cari perkataan yang menunjukkan perbuatan atau tindakan.', activity: 'Padankan gambar dengan kata kerja dan bina ayat mudah.', check: 'Boleh mengenal pasti perbuatan dalam ayat.' },
  kata_adjektif: { focus: 'Perhatikan perkataan yang menerangkan sifat, warna, saiz atau keadaan.', activity: 'Pilih kata adjektif yang paling sesuai untuk gambar atau objek.', check: 'Boleh menggunakan kata adjektif untuk menerangkan sesuatu.' },
  kata_sendi: { focus: 'Perhatikan hubungan tempat, arah atau asal melalui kata sendi.', activity: 'Lengkapkan ayat dengan di, ke atau dari berdasarkan gambar.', check: 'Boleh memilih kata sendi yang sesuai dalam ayat.' },
  kata_hubung: { focus: 'Lihat bagaimana kata hubung menyambungkan dua bahagian ayat.', activity: 'Gabungkan dua ayat mudah menggunakan dan, tetapi atau kerana.', check: 'Boleh memilih kata hubung berdasarkan maksud ayat.' },
  penjodoh_bilangan: { focus: 'Padankan penjodoh bilangan dengan bentuk atau jenis benda.', activity: 'Kira objek dalam gambar dan pilih penjodoh bilangan yang tepat.', check: 'Boleh menggunakan penjodoh bilangan bersama kata nama.' },
  pemahaman_penulisan: { focus: 'Cari maklumat penting dan kata kunci dalam petikan.', activity: 'Jawab soalan berdasarkan maklumat yang terdapat dalam teks.', check: 'Boleh mencari jawapan tanpa meneka di luar petikan.' },
  ayat: { focus: 'Kenal pasti tujuan ayat melalui tanda baca dan maksudnya.', activity: 'Bezakan ayat tanya, ayat seruan dan ayat perintah.', check: 'Boleh memilih tanda baca dan jenis ayat yang betul.' },
  tatabahasa: { focus: 'Perhatikan susunan perkataan supaya ayat membawa maksud yang jelas.', activity: 'Susun perkataan bercampur menjadi ayat yang lengkap.', check: 'Boleh membina ayat yang gramatis dan bermakna.' },
  bina_ayat: { focus: 'Gunakan kata kunci untuk membina ayat lengkap.', activity: 'Bina ayat berdasarkan gambar, frasa atau perkataan yang diberi.', check: 'Boleh menulis ayat dengan huruf besar dan tanda baca.' },
  simpulan_bahasa: { focus: 'Fahami maksud keseluruhan simpulan bahasa dalam konteks.', activity: 'Padankan simpulan bahasa dengan maksud atau situasi yang sesuai.', check: 'Boleh menerangkan maksud simpulan bahasa dengan contoh.' },
  uasa_kbat: { focus: 'Gunakan pengetahuan bahasa untuk menyelesaikan situasi harian.', activity: 'Baca situasi, pilih jawapan terbaik dan berikan alasan.', check: 'Boleh menyokong jawapan dengan sebab yang munasabah.' }
};

export function getLearningContent(subjectId, topic) {
  const content = subjectId === 'bm' ? BM_CONTENT[topic?.id] : null;
  return {
    ...(content || {}),
    source: subjectId === 'bm' ? BM_SOURCE : null,
    textbook: subjectId === 'bm' ? (BM_TEXTBOOK_GUIDANCE[topic?.id] || { focus: 'Fahami fokus topik dalam bab yang berkaitan.', activity: 'Baca contoh dan lengkapkan aktiviti yang disediakan.', check: 'Semak kefahaman selepas selesai membaca.' }) : { focus: 'Ikuti fokus topik dalam bab yang berkaitan.', activity: 'Baca contoh dan lengkapkan aktiviti buku teks.', check: 'Semak kefahaman selepas selesai membaca.' },
    keyPoints: content?.keyPoints || [topic?.note || 'Fahami penerangan topik.', 'Baca contoh dan cuba latihan selepas memahami nota.'],
    example: content?.example || topic?.questions?.[0]?.answer || 'Lihat contoh dalam latihan topik.',
    review: content?.review || 'Baca semula nota dan cuba satu soalan latihan.'
  };
}
