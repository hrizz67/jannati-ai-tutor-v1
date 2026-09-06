# Premium Entitlement V1

## Audit ringkas sebelum perubahan

- Entitlement lama disimpan dalam `public.profiles.access_status` dan `access_expires_at`.
- `App.jsx`, utiliti akses dan Edge Function Tutor AI membuat keputusan berasingan; dua daripadanya membandingkan tarikh menggunakan jam peranti/runtime.
- React menyimpan keputusan akses semasa. Snapshot pembelajaran turut membawa medan akses lama untuk keserasian, tetapi tiada IndexedDB atau service-worker cache menjadi sumber akses.
- Akses dibaca selepas log masuk/muat semula dan dipoll setiap 60 saat. Pertukaran anak tidak sepatutnya mengubah langganan keluarga, tetapi sumber bercampur membenarkan paparan lapuk.
- RLS `profiles` hanya membenarkan pengguna membaca rekod sendiri dan menolak penulisan terus. Medan `profiles.is_admin` sedia ada boleh menjadi pemetaan admin server.
- Punca pendua ialah `profiles`, state React, salinan profil pembelajaran dan semakan Tutor AI.

## Reka bentuk kanonik

`public.premium_entitlements` ialah satu-satunya sumber kebenaran baharu. Akses dibenarkan hanya apabila status ialah `active`, `trial` atau `complimentary` dan `expires_at > now()` pada PostgreSQL. Semua masa disimpan sebagai `timestamptz` UTC; paparan menggunakan `Asia/Kuala_Lumpur`. Tarikh kalendar yang dipilih admin dinormal kepada 23:59:59.999 waktu Malaysia.

Medan akses dalam `profiles` dikekalkan sementara sebagai cermin keserasian untuk versi aplikasi lama. Kod aplikasi dan Tutor AI baharu tidak membuat keputusan daripada medan itu. Snapshot pembelajaran juga tidak boleh memberikan Premium kerana pemeriksaan akses memerlukan keputusan `server_verified` dan `server_access_allowed`.

## Sempadan keselamatan

- Pengguna berautentikasi boleh membaca entitlement sendiri sahaja.
- Admin boleh mencari akaun dan mengubah entitlement hanya melalui RPC `security definer` yang mengesahkan `profiles.is_admin` pada server.
- Tiada `insert`, `update` atau `delete` entitlement diberikan kepada peranan browser.
- Tiada service-role secret digunakan dalam frontend.
- Setiap mutasi menggunakan `request_id`, kunci transaksi per akaun dan rekod audit append-only.

## Aliran lengkap

Admin UI `#/admin/premium` → RPC admin → `premium_entitlements` + audit → RPC entitlement pengguna → refresh aplikasi pada log masuk, boot, fokus, visibility dan reconnect → pemeriksaan ciri Premium dan Tutor AI.

Jika Premium masih aktif, lanjutan bermula daripada tarikh tamat semasa. Jika telah tamat, lanjutan bermula daripada `now()` server. Ini mengekalkan baki hari pelanggan.
