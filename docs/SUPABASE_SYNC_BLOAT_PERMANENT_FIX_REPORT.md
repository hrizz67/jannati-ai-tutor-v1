# Laporan Pembaikan Kekal Supabase Sync Bloat

## 1. Confirmed production root cause

Produksi menunjukkan database 569 MB. `learning_data_backups` mempunyai 618 row sekitar 281 MB dan `learning_sync_operations` mempunyai 618 row sekitar 275 MB. Daripada jumlah itu, 617 backup ialah `pre-write`, 617 operasi ialah `applied`, dan payload kanonik semasa sekitar 775 KiB pada revision 617. Cleanup manual kepada kira-kira 50 row sejarah dan `VACUUM FULL` menurunkan database kepada 96 MB, mengesahkan sejarah payload penuh tanpa had sebagai punca utama.

## 2. Why old architecture consumed ~556 MB

Setiap sync berubah menyimpan payload lama sepenuhnya dalam `learning_data_backups`, payload baharu sepenuhnya dalam `learning_sync_operations.submitted_payload`, dan payload baharu sebagai keadaan kanonik. Dua arkib penuh kekal bagi setiap sync menghasilkan kira-kira 556 MB pada data produksi yang telah dimampatkan/TOAST. Anggaran mentah 618 × 775 KiB × 2 ialah 935.45 MiB sebelum kesan pemampatan.

## 3. Old storage model

- `profiles.learning_data`: keadaan penuh semasa.
- `learning_data_backups`: satu payload penuh `pre-write` bagi setiap revision, tanpa retention.
- `learning_sync_operations`: satu lagi payload penuh bagi operasi `applied` atau `conflict`, tanpa retention.
- Metadata masa di client boleh menghasilkan payload baharu walaupun pembelajaran tidak berubah.

## 4. New storage model

- `profiles.learning_data` kekal sumber kebenaran penuh.
- `learning_data_backups` ialah sejarah pemulihan penuh yang dibatasi.
- `learning_sync_operations` ialah metadata idempotensi/audit ringan tanpa payload penuh.
- `learning_events`, `learning_states` dan `learner_profiles` tidak diubah.

## 5. Backup retention chosen

Sepuluh backup `pre-write` terkini dikekalkan bagi setiap akaun. Semua sebab bukan `pre-write`, termasuk `pre-v3-migration`, `manual-recovery` dan `migration-safety`, dikecualikan daripada pruning automatik. Pada payload 775 KiB, 10 backup menggunakan kira-kira 7.57 MiB sebelum overhead.

## 6. Operation retention chosen

Metadata operasi `applied` disimpan 30 hari untuk retry/replay realistik. Metadata `conflict` disimpan 90 hari untuk audit. Pruning berlaku apabila akaun melakukan sync; akaun tidak aktif tidak bertambah dan boleh dipangkas melalui fungsi maintenance yang sama.

## 7. Full-payload removal strategy

Carian repository mengesahkan `submitted_payload` tidak dibaca oleh frontend, merge, restore atau recovery. Kolum dibuat nullable untuk keserasian, row lama menerima SHA-256/saiz jika payload tersedia, kemudian nilai penuh ditetapkan `NULL`. Semua operasi baharu—berjaya, no-op dan konflik—menyimpan hash serta saiz sahaja.

## 8. Unchanged-write optimization

RPC memeriksa konflik revision dahulu, kemudian menggunakan kesamaan JSONB kanonik. Payload sama menghasilkan `ok: true` dan `unchanged: true` tanpa backup, update atau kenaikan revision. Client mengekalkan payload cloud apabila hanya metadata transport berubah, dan snapshot tidak lagi ditulis semula hanya kerana masa tangkapan/peranti berubah.

## 9. Sync-frequency issues found

Autosave utama sudah mempunyai debounce 700 ms, submission jawapan 500 ms, queue bersiri, polling read-only lima saat, Realtime pull, dan dirty IDs mengikut akaun/anak. Churn ditemui pada `jannati_cloud_sync_meta.updatedAt` serta `__childSnapshotCapturedAt`, yang boleh menjadikan state sama kelihatan berbeza. Kedua-duanya kini tidak memaksa write. Polling/focus kekal pull-only apabila tiada outbox.

## 10. Retry/idempotency behavior

`operation_id` kekal kunci primer. Row akaun dikunci sebelum semakan operasi dan revision. Retry transport menggunakan ID yang sama, maksimum tiga percubaan dengan backoff 300 ms kemudian 600 ms. Konflik yang memerlukan merge baharu menggunakan operasi logik baharu. Dirty state hanya dibersihkan selepas pengakuan server.

## 11. Conflict behavior

Peranti dengan `expected_revision` lama masih menerima konflik bersama payload dan revision kanonik server. Server tidak mengubah profil, tidak menaikkan revision dan tidak membuat backup penuh. Rekod konflik menyimpan metadata/hash/saiz sahaja selama 90 hari.

## 12. Migration files

- `supabase/migrations/20260909090000_learning_sync_storage_bloat_fix.sql`
- `supabase/schemas/public/functions/learning_data_v3.sql`
- `supabase/schemas/public/tables/learning_sync_operations.sql`

Migrasi mengekalkan signature RPC v3, menambah kolum secara serasi, mengekalkan kolum legacy dan tidak memindahkan `profiles.learning_data`.

## 13. Tests

Validator baharu memeriksa SQL secara statik, urutan transaksi, no-op, payload-free operations, retention, RLS/security markers, retry ID stabil dan simulasi 618 sync. Regresi learning sync, pengasingan anak dan access control turut digunakan. Keputusan akhir arahan penuh direkodkan dalam seksyen 17 dan 18.

## 14. Growth simulation results

Dengan payload 775 KiB dan 100 sync sehari:

| Senario | Model lama | Model baharu |
| --- | ---: | ---: |
| Pertumbuhan harian sejarah | 151.37 MiB | 0.10 MiB metadata (anggaran 1 KiB/operasi) |
| Pertumbuhan 30 hari | 4,541.02 MiB | 2.93 MiB metadata rolling |
| Backup penuh biasa retained | Tanpa had | 7.57 MiB |
| Sejarah selepas 618 sync | 935.45 MiB mentah | 8.17 MiB anggaran |

## 15. Estimated DB growth before vs after

Model lama berkembang linear dengan dua salinan penuh per sync. Model baharu mempunyai maksimum 10 salinan penuh biasa; hanya metadata kecil berkembang dalam tetingkap 30/90 hari. Saiz sebenar bergantung pada index, TOAST, dirty IDs dan snapshot khas, tetapi tidak lagi berkadar dua payload penuh bagi setiap sync.

## 16. Security impact

`auth.uid()` dan lock akaun dikekalkan. Fungsi kekal `SECURITY DEFINER` dengan `search_path=''`. Browser hanya menerima `EXECUTE` pada RPC; tiada grant write terus diberikan kepada jadual backup atau operasi. RLS/select milik akaun kekal. Collision ID operasi merentas akaun kini gagal dengan `operation_id_account_mismatch`.

## 17. npm run validate result

`npm run validate`: **PASS** pada 9 September 2026. Keputusan akhir ialah 0 error, 0 warning dan 14,816 info. Dalam gate yang sama, 153 ujian unit lulus bersama validator storan baharu, learning sync, multi-child isolation, access control, offline/device readiness dan suite projek berkaitan.

## 18. npm run build result

`npm run build`: **PASS** pada 9 September 2026. Vite membina 459 modul dan postbuild Production Bundle Budget lulus: entry 330.17 KiB/350 KiB, initial JavaScript 892.46 KiB/900 KiB, largest chunk 459.49 KiB/480 KiB dan Tutor chunk 21.28 KiB/25 KiB.

## 19. Production rollout steps

1. Eksport `profiles.id`, `learning_data`, `learning_revision`, `updated_at` dan ambil backup database.
2. Jalankan dry-run migrasi pada projek staging/linked dan semak ruang sementara serta lock.
3. Aplikasikan migrasi database sebelum atau serentak dengan frontend. Signature RPC tidak berubah, jadi client lama kekal serasi.
4. Sahkan `submitted_payload` bernilai `NULL`, backup biasa maksimum 10, dan revision/data kanonik tidak berubah akibat migrasi.
5. Deploy frontend dan uji desktop/mobile untuk satu serta dua anak, konflik serentak, offline/reconnect dan refresh.
6. Pantau ralat RPC, konflik, pending outbox dan saiz jadual sekurang-kurangnya 24 jam.
7. Pertimbangkan reclaim fizikal hanya selepas pemantauan; jangan jalankan `VACUUM FULL` semasa trafik biasa.

## 20. Rollback plan

Jangan rollback data kanonik. Jika fungsi baharu bermasalah, hentikan deploy client dan pulihkan definisi RPC terdahulu sementara kolum tambahan nullable dibiarkan—DDL tambahan tidak perlu dibuang. Backup database sebelum migrasi ialah laluan pemulihan terakhir. Mengembalikan penyimpanan payload penuh dalam operasi hanya langkah kecemasan sementara kerana ia menghidupkan semula bloat. Snapshot khas dan 10 backup terkini kekal tersedia.

## 21. Remaining risks

- Migrasi yang menetapkan payload sejarah kepada `NULL` menulis semula row dan boleh memerlukan ruang/WAL sementara; produksi telah dikurangkan kepada kira-kira 51 row, tetapi staging perlu mengukur persekitaran lain.
- `VACUUM FULL` mungkin diperlukan secara manual untuk memulangkan ruang fizikal, dengan maintenance window kerana lock eksklusif.
- Idempotensi operasi ialah jaminan dalam tetingkap retention 30 hari; replay luar biasa selepas itu masih dilindungi oleh conflict/no-op, tetapi tombstone ID kekal tidak disimpan tanpa had.
- Snapshot khas tidak dipangkas automatik dan perlu audit manusia.
- Anggaran metadata 1 KiB/row ialah anggaran; saiz sebenar perlu dipantau selepas rollout.

## Final status

`PASS_WITH_LIMITATIONS`: implementasi repository, dry-run Supabase linked, validator, suite penuh dan build semuanya lulus. Had yang masih tinggal ialah migrasi belum diaplikasikan ke staging/produksi dan ujian dua peranti sebenar selepas migrasi belum dijalankan. Tiada data produksi diubah oleh kerja ini.
