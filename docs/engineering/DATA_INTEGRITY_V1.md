# Data Integrity V1

Dokumen ini menetapkan syarat keselamatan untuk semua data pembelajaran Jannati. Data pembelajaran tidak boleh hilang, bercampur antara akaun, berpindah kepada profil anak lain, atau digantikan oleh peranti lama.

## Invariant wajib

1. Setiap data dimiliki oleh tepat satu `account_id` dan satu `child_id`.
2. Free/guest ialah ruang berasingan dan tidak pernah digabungkan secara automatik ke akaun berdaftar.
3. Pemilihan profil aktif ialah tetapan peranti; ia bukan bukti pembelajaran dan tidak boleh menandakan dua profil sebagai berubah.
4. Peranti hanya boleh menulis berdasarkan revision server yang telah dibacanya.
5. Konflik revision mesti dibaca, digabungkan tanpa membuang bukti, kemudian dicuba semula.
6. Setiap operasi mempunyai `operation_id`; pengulangan operasi yang sama tidak boleh menggandakan perubahan.
7. Perubahan yang belum diakui server kekal pending mengikut akaun dan anak walaupun browser ditutup atau logout dibatalkan.
8. Snapshot daripada akaun atau anak yang tidak sepadan mesti ditolak sebelum storan aktif dikosongkan.
9. Pemadaman profil ialah arkib server dengan revision dan laluan undo. Hard delete pada client tidak dibenarkan.
10. Sebelum setiap penggantian snapshot server, salinan revision sebelumnya mesti disimpan.

## Sumber kebenaran

- Supabase ialah sumber kebenaran untuk akaun berdaftar.
- Peranti menyimpan cache dan outbox pemulihan, bukan autoriti global.
- `profiles.learning_data` dikekalkan sebagai jambatan snapshot v3 dan salinan pemulihan.
- `learning_events`, `learner_profiles`, dan `learning_states` ialah asas model ternormalisasi; peralihan boleh dibuat berperingkat tanpa memadam blob lama.
- `activeChildId` hanya menentukan paparan pada peranti semasa.

## Protokol sync v3

1. Client memanggil `get_learning_data_v3` dan menerima `payload` bersama `revision`.
2. Client menggabungkan hanya profil anak yang benar-benar dirty.
3. Client memanggil `save_learning_data_v3` dengan `expected_revision`, `operation_id`, `device_id`, dan senarai anak dirty.
4. RPC mengunci row akaun. Revision tidak sepadan menghasilkan konflik tanpa menulis.
5. Client menggabungkan payload konflik dan mencuba semula dengan revision terkini.
6. Revision lama disalin ke `learning_data_backups` sebelum write diterima.
7. Endpoint lama `save_learning_data(jsonb)` ditarik balik daripada role browser.

## Pelan rollout produksi

Rollout mesti diselaraskan; jangan deploy client v3 tanpa migration dan jangan tarik balik endpoint lama tanpa memastikan build v3 tersedia.

1. Ambil backup pangkalan data dan eksport `profiles.id`, `learning_data`, `learning_revision`, serta `updated_at`.
2. Jalankan migration dry-run pada projek staging.
3. Uji dua sesi serentak: desktop dan mobile menulis anak yang sama serta anak berlainan.
4. Sahkan RLS: akaun A tidak boleh membaca backup, operasi, profil, state, atau event akaun B.
5. Aplikasi migration `20260823090000_learning_data_integrity_v3.sql` pada produksi.
6. Deploy build client v3 selepas migration berjaya.
7. Sahkan UI menunjukkan revision cloud terkini dan bukan butang force-push.
8. Pantau konflik, ralat RPC, pending outbox, dan pertumbuhan backup sekurang-kurangnya 24 jam.
9. Jangan bersihkan blob lama, tombstone, atau backup dalam release yang sama.

## Gate sebelum fungsi delete dibuka semula

- `learner_profiles` telah dibackfill dan dipetakan secara unik kepada akaun.
- `archive_learner_profile_v1` diuji dengan revision konflik.
- UI mempunyai arkib, undo, dan penerangan bahawa data pembelajaran tidak dipadam.
- Ujian membuktikan arkib satu anak tidak mengubah snapshot anak lain.
- Backup server boleh dipulihkan oleh proses pentadbir yang diaudit.

## Ujian minimum setiap release

- Dua peranti bermula pada revision sama; satu mesti konflik dan kedua-dua sejarah kekal.
- Operasi sama dihantar dua kali; revision hanya bertambah sekali.
- Mutasi baharu pada anak sama semasa request berjalan kekal pending.
- Login Free ke Premium tidak memindahkan profil Free.
- Logout dengan pending gagal secara selamat atau meminta pengesahan.
- Snapshot dengan `account_id` atau `child_id` salah ditolak.
- Client v3 pada database v2 kekal read-only dan tidak memanggil legacy write.
- Delete client kekal disabled sehingga arkib server dan undo lulus gate.
