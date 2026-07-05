# Jannati AI Tutor  Brand Guideline

## Logo rasmi
Gunakan aset dalam folder `public/brand/logo/`.

- `logo-full.svg`  logo penuh untuk splash screen, bahan promosi dan halaman utama.
- `logo-horizontal.svg`  logo mendatar untuk header/sidebar.
- `logo-icon.svg`  ikon aplikasi, favicon dan PWA.
- `logo-monochrome.svg`  versi hitam putih untuk dokumen/cetakan.

## Warna rasmi
- Hijau utama: `#0F8A43`
- Hijau gelap: `#006B32`
- Hijau lembut: `#E8F8EE`
- Emas: `#F4B400`
- Navy gelap: `#0F172A`
- Kelabu: `#64748B`
- Putih: `#FFFFFF`

## Tipografi
- Tajuk: Poppins SemiBold / Bold
- Teks badan: Inter / Poppins Regular
- Butang: Poppins SemiBold

## Penggunaan logo
- Gunakan `BrandLogo` component, bukan `<img>` manual.
- Jangan ubah nisbah logo.
- Jangan tambah kesan warna lain.
- Pastikan logo jelas pada latar cerah dan gelap.
- Minimum clear space: sekurang-kurangnya tinggi huruf J di sekeliling logo.

## Contoh penggunaan React
```jsx
import BrandLogo from "./components/BrandLogo";

<BrandLogo variant="horizontal" size="md" />
<BrandLogo variant="icon" size="lg" />
<BrandLogo variant="full" size="xl" />
```

## Nota penting
SVG dalam pakej ini ialah SVG wrapper yang mengandungi imej PNG rasmi beresolusi tinggi. Untuk logo vektor tulen, logo perlu dilukis semula dalam Figma/Illustrator.

## Sistem maskot
Janna dan Jati ialah sebahagian daripada identiti rasmi Jannati AI Tutor.

- Janna digunakan sebagai rakan belajar untuk sambutan, motivasi, empty state dan kejayaan.
- Jati digunakan sebagai guru AI untuk penerangan, bantuan, hint dan modal pengajaran.
- Semua penggunaan maskot mesti melalui komponen `Mascot`.
- Mood rasmi: `happy`, `thinking`, `teaching`, `celebrating`, `encouraging`.
- Rujuk `docs/branding/MASCOT_GUIDELINE.md` untuk peranan, mesej contoh dan lokasi penggunaan.
