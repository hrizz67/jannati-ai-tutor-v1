# Pelan Remediasi Bahasa Melayu Jannati AI Tutor

## Ringkasan semasa

- DBP: 93%
- Naturalness: 89%
- Readability: 88%
- Overall BM Quality: 91/100

## Sasaran

- DBP: 99% atau lebih
- Naturalness: 98% atau lebih
- Readability: 99% atau lebih

## Keutamaan pembaikan

### Keutamaan tinggi

1. Kurangkan pembukaan soalan yang terlalu kerap berulang.
2. Haluskan hint supaya lebih semula jadi dan lebih membimbing.
3. Pendekkan arahan yang terlalu panjang untuk murid Tahun 2.

### Keutamaan sederhana

4. Seragamkan istilah seperti `jawapan yang betul`, `semak jawapan`, dan `cuba lagi`.
5. Kurangkan ayat yang berbunyi terlalu formal atau terlalu seperti AI.
6. Haluskan penjelasan supaya lebih mengajar konsep, bukan sekadar memberi definisi.

### Keutamaan rendah

7. Tambah variasi nada galakan dan ayat sokongan ibu bapa.
8. Kemas kini sedikit frasa yang masih kedengaran terlalu generik.

## Statistik stem semasa

Corak pembukaan yang paling kerap ditemui dalam BM:

- `Apakah`
- `Pilih kata`
- `Nyatakan`
- `Lengkapkan ayat`
- `Isi tempat kosong`
- `Cari kata`
- `Baca ayat`
- `KBAT`
- `UASA`
- `Petikan pendek`

### Cadangan pengagihan stem

Sasaran minimum ialah sekurang-kurangnya 25 corak pembukaan berbeza. Cadangan corak:

- Yang manakah...
- Pilih jawapan...
- Perhatikan ayat...
- Baca ayat berikut...
- Kenal pasti...
- Cari...
- Susunkan...
- Padankan...
- Lengkapkan...
- Isi...
- Tentukan...
- Antara berikut...
- Mari kita lihat...
- Perkataan yang betul ialah...
- Dalam ayat ini...
- Berdasarkan petikan...
- Di bawah ini...
- Lihat gambar dan pilih...
- Baca petikan pendek...
- Pilih kata yang sesuai...
- Ayat manakah...
- Apakah perkataan...
- Fikirkan jawapan yang tepat...
- Lengkapkan ayat ini...
- Pilih frasa yang sesuai...

## Cadangan penambahbaikan bahasa

### Soalan

- Tukar beberapa pembukaan yang berulang kepada corak soalan yang lebih pelbagai.
- Pastikan ayat kekal pendek dan jelas untuk murid Tahun 2.

### Hint

- Guna petunjuk ringkas yang menumpukan satu kata kunci sahaja.
- Elakkan hint yang terlalu umum atau terlalu teknikal.

### Explanation

- Ringkaskan penjelasan kepada satu atau dua ayat.
- Sebut sebab jawapan betul dengan bahasa guru.

### AI copy

- Kekalkan bahasa Melayu yang mesra dan hangat.
- Elakkan ayat yang berbunyi seperti laporan sistem.

## Ringkasan validator

- Validator cadangan: `node scripts/validate/bmStyleValidator.mjs`
- Fokus pengesanan:
  - stem berulang
  - ayat terlalu panjang
  - hint berulang
  - penjelasan berulang
  - wording robotik
  - wording terlalu formal
  - frasa terlarang

## Anggaran usaha

| Aktiviti | Usaha |
|---|---:|
| Gaya stem BM | Sederhana |
| Hint | Sederhana |
| Explanation | Sederhana |
| AI copy | Sederhana |
| Semakan akhir | Kecil |

## Keputusan semasa

Kandungan BM sudah kuat, tetapi masih terlalu bergantung pada beberapa pola pembukaan. Jika corak ayat dipelbagaikan dan beberapa ayat diperhalus, sasaran DBP, naturalness dan readability boleh meningkat dengan ketara.

