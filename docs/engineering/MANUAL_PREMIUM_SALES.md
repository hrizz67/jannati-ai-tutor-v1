# Manual Premium Sales

P1.14.2A menyediakan aliran jualan Premium manual yang hanya memaparkan maklumat dan membuka saluran hubungan:

`Pembayaran pelanggan → semakan manual Admin → Konsol Admin → PAID → aktif/perbaharui → entitlement server dimuat semula`

## Sempadan keselamatan

- **NO PAYMENT GATEWAY**
- **NO AUTO ACTIVATION**
- **NO CUSTOMER-SIDE PAYMENT TRUST**
- Halaman pelanggan tidak memanggil RPC Admin, menulis rekod bayaran, atau mengubah entitlement.
- Mesej WhatsApp dan tindakan salin bukan bukti penyelesaian bayaran.
- Akses Premium kekal berdasarkan entitlement server untuk akaun keluarga, bukan profil anak atau localStorage.

## Konfigurasi pemilik

Semua tetapan jualan manual berada di `src/config/manualSalesConfig.js`:

- `plans[].priceMYR` untuk harga 30, 90 dan 365 hari;
- `whatsappNumber` untuk nombor WhatsApp dalam format negara tanpa simbol;
- `paymentInstructions` untuk arahan bayaran yang telah disahkan pemilik.

Nilai ini sengaja dibiarkan kosong sehingga pemilik menyediakan maklumat perniagaan sebenar. Harga kosong dipaparkan sebagai “Harga akan dimaklumkan”, maklumat bayaran kosong meminta pelanggan menghubungi Admin, dan CTA WhatsApp tidak dipaparkan apabila nombor belum dikonfigurasi.
