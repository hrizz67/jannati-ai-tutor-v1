# Polisi Retention Sync Pembelajaran

Polisi ini melindungi data murid tanpa mengulangi payload penuh pada setiap sync. Nilai pusat yang dilaksanakan oleh `prune_learning_sync_history_v1` ialah 10 backup biasa, 30 hari metadata operasi berjaya, dan 90 hari metadata konflik.

## Sumber kebenaran dan tier pemulihan

| Tier | Storan | Retention | Tujuan |
| --- | --- | --- | --- |
| 1 | `profiles.learning_data` | Satu keadaan kanonik semasa | Sumber kebenaran untuk bacaan dan sync semua peranti |
| 2 | `learning_data_backups` dengan `reason='pre-write'` | 10 revision penuh terkini bagi setiap akaun | Pulih daripada write rosak atau perubahan terkini yang tidak dikehendaki |
| 3 | `learning_data_backups` dengan sebab khas | Dikekalkan sehingga semakan manual | Snapshot `pre-v3-migration`, `manual-recovery`, `migration-safety`, dan sebab bukan `pre-write` lain |

Sepuluh revision terkini memberi beberapa titik pemulihan jangka pendek tanpa menjadikan backup sebagai arkib tanpa had. Dengan payload 775 KiB, bahagian backup biasa dianggarkan 7.57 MiB bagi setiap akaun, di bawah sasaran 20 MiB. Snapshot khas menambah penggunaan dan perlu diaudit secara manual.

## Retention setiap jadual

### `profiles.learning_data`

- Retention: keadaan penuh kanonik semasa sahaja.
- `learning_revision` meningkat tepat sekali bagi payload berubah yang diterima.
- Payload JSONB yang sama tidak mengubah row atau revision.

### `learning_data_backups`

- Retention biasa: 10 row `pre-write` terbaru bagi setiap akaun.
- Sebab khas tidak menyertai ranking pemadaman.
- Pruning berlaku pada server selepas backup, write kanonik dan rekod operasi berjaya berada dalam transaksi yang sama.

### `learning_sync_operations`

- Retention operasi `applied`: 30 hari.
- Retention operasi `conflict`: 90 hari untuk siasatan konflik.
- Row baharu hanya menyimpan ID operasi, akaun, peranti, revision, status, anak dirty, SHA-256, saiz payload, flag no-op dan masa.
- `submitted_payload` dikekalkan sebagai kolum nullable untuk keserasian migrasi, tetapi RPC v3 menyimpan `NULL` bagi operasi berjaya, no-op dan konflik.
- Jaminan idempotensi merangkumi retry/replay realistik dalam tetingkap retention. Retry rangkaian segera menggunakan `operation_id` yang sama dan exponential backoff terhad.

### `learning_events`

- Polisi produk sedia ada kekal. Event granular tidak diubah oleh pembaikan ini.
- Payload event kekal mempunyai had 1 MiB pada RPC sedia ada.

### `learning_states` dan `learner_profiles`

- Struktur ternormalisasi dan polisi sedia ada kekal.
- Tiada pemindahan sumber kebenaran dilakukan dalam migrasi ini.

## Diagnostik kesihatan pangkalan data

Saiz database:

```sql
select pg_size_pretty(pg_database_size(current_database()));
```

Jadual terbesar:

```sql
select
  schemaname,
  relname,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_catalog.pg_statio_user_tables
order by pg_total_relation_size(relid) desc;
```

Bilangan backup mengikut akaun dan sebab:

```sql
select account_id, reason, count(*)
from public.learning_data_backups
group by account_id, reason
order by account_id, reason;
```

Bilangan operasi dan payload legacy:

```sql
select
  account_id,
  status,
  count(*) as operation_count,
  count(*) filter (where submitted_payload is not null) as rows_with_full_payload,
  pg_size_pretty(coalesce(sum(pg_column_size(submitted_payload))
    filter (where submitted_payload is not null), 0)::bigint) as retained_full_payload_size,
  pg_size_pretty(coalesce(sum(payload_size_bytes), 0)) as total_input_size_observed
from public.learning_sync_operations
group by account_id, status
order by account_id, status;
```

Julat sihat bagi satu akaun aktif:

- `pre-write`: 0 hingga 10 row; snapshot khas boleh menambah bilangan.
- `submitted_payload is not null`: 0 selepas migrasi.
- Operasi `applied`: hanya 30 hari terkini; pada 100 sync sehari kira-kira 3,000 row metadata.
- Operasi `conflict`: hanya 90 hari terkini dan lazimnya jauh lebih rendah daripada `applied`.
- Backup penuh biasa pada payload 775 KiB: kira-kira 7.57 MiB, tidak termasuk overhead dan snapshot khas.

## Vacuum dan reclaim ruang

Autovacuum atau `VACUUM (ANALYZE)` biasa boleh mengitar semula ruang dalam jadual tanpa memulangkannya serta-merta kepada sistem fail. `VACUUM FULL` tidak dijalankan oleh migrasi atau scheduler kerana ia mengambil lock eksklusif dan menulis semula jadual.

Gunakan `VACUUM FULL` hanya secara manual selepas mengesahkan ruang fizikal benar-benar perlu dipulangkan, backup tersedia, maintenance window diluluskan, dan impak lock diterima. Pantau saiz dahulu; dead space yang boleh digunakan semula bukan semestinya masalah.

## Semakan berkala

- Semak pertumbuhan jadual mingguan semasa beta dan bulanan selepas stabil.
- Siasat jika backup biasa melebihi 10, mana-mana `submitted_payload` baharu tidak `NULL`, atau revision meningkat tanpa perubahan pembelajaran.
- Jangan padam snapshot khas secara automatik. Rekodkan sebab, pemilik dan kelulusan bagi cleanup manual.
