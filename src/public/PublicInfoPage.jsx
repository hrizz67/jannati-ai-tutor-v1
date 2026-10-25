import React from 'react';
import manualSalesConfig from '../config/manualSalesConfig.js';
import { PUBLIC_INFO_ROUTES } from './publicInfoRoutes.js';
import './public-info.css';

const ROUTE_LABELS = Object.freeze({
  privacy: 'Dasar Privasi',
  terms: 'Terma Penggunaan',
  support: 'Bantuan'
});

export function buildPublicSupportWhatsAppUrl(config = manualSalesConfig) {
  const number = String(config?.whatsappNumber || '').replace(/[^0-9]/g, '');
  if (!number) return '';
  const message = 'Assalamualaikum Admin Jannati. Saya ingin mendapatkan bantuan tentang akaun atau penggunaan aplikasi.';
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function PublicInfoNavigation({ currentRoute }) {
  return <nav className="public-info-navigation" aria-label="Maklumat awam">
    {PUBLIC_INFO_ROUTES.map(route => <a key={route} href={`#/${route}`} aria-current={currentRoute === route ? 'page' : undefined}>{ROUTE_LABELS[route]}</a>)}
  </nav>;
}

function PrivacyContent() {
  return <>
    <section>
      <h2>Maklumat yang digunakan</h2>
      <p>Jannati AI Tutor menggunakan hanya maklumat yang diperlukan untuk menyediakan fungsi akaun, pembelajaran, penyelarasan, Premium dan bantuan.</p>
      <p>Bagi pengguna akaun, maklumat berkaitan boleh merangkumi:</p>
      <ul>
        <li>alamat e-mel dan ID akaun;</li>
        <li>maklumat profil murid atau anak yang digunakan dalam aplikasi;</li>
        <li>kemajuan serta rekod pembelajaran berkaitan;</li>
        <li>status Premium; dan</li>
        <li>rekod rujukan berkaitan pengaktifan atau pembayaran manual yang diperlukan.</li>
      </ul>
      <p>Sila berikan hanya maklumat yang diperlukan untuk profil murid.</p>
    </section>

    <section>
      <h2>Penyimpanan dan penyelarasan</h2>
      <p><strong>Guest Free:</strong> Sesetengah data profil dan pembelajaran disimpan pada peranti semasa. Data Guest Free tidak semestinya disimpan dalam awan.</p>
      <p><strong>Penggunaan berasaskan akaun:</strong> Data akaun dan pembelajaran yang berkaitan boleh diselaraskan menggunakan perkhidmatan awan Jannati supaya dapat dipulihkan atau digunakan pada peranti yang disokong.</p>
    </section>

    <section>
      <h2>Rakaman suara kuiz</h2>
      <p>Untuk pengguna akaun pada peranti yang disokong, jawapan suara pendek boleh dihantar kepada Cloudflare Workers AI bagi menghasilkan teks yang boleh disemak dan diedit sebelum jawapan dinilai.</p>
      <p>Jannati tidak menyimpan audio kuiz dalam pangkalan data atau storan pembelajaran. Audio diproses secara sementara untuk transkripsi, tidak dimasukkan ke rekod persetujuan dan input menaip sentiasa tersedia.</p>
      <p>Bagi murid kanak-kanak, ibu bapa atau penjaga mesti memberi kebenaran melalui Kawasan Ibu Bapa sebelum rakaman boleh dihantar. Persetujuan boleh ditarik balik pada bila-bila masa. Rakaman tidak bermula secara automatik.</p>
    </section>

    <section>
      <h2>Tujuan penggunaan</h2>
      <p>Maklumat digunakan untuk operasi log masuk dan akaun, memulihkan atau menyelaraskan kemajuan pembelajaran, menyediakan akses Free atau Premium, pentadbiran Premium secara manual, bantuan, keselamatan dan kebolehpercayaan aplikasi.</p>
    </section>

    <section id="padam-data">
      <h2>Padam akaun atau data</h2>
      <p>Untuk meminta pemadaman akaun atau data akaun, hubungi Admin melalui WhatsApp. Sediakan e-mel akaun atau ID akaun supaya permintaan boleh disahkan. Permintaan diproses secara manual selepas pengesahan akaun.</p>
      <p className="public-info-security-note"><strong>Keselamatan:</strong> Jangan hantar kata laluan atau pautan/token pengesahan kepada Admin.</p>
      <a href="#/support">Buka halaman Bantuan</a>
    </section>
  </>;
}

function TermsContent() {
  const enabledDurations = manualSalesConfig.plans.filter(plan => plan.enabled);
  return <>
    <section>
      <h2>Tujuan perkhidmatan</h2>
      <p>Jannati AI Tutor kini ditujukan untuk pembelajaran Tahun 2 dan berfungsi sebagai alat sokongan pendidikan.</p>
      <p>Kandungan pembelajaran, penerangan, latihan dan bantuan AI tidak menjamin keputusan peperiksaan atau prestasi akademik.</p>
    </section>

    <section>
      <h2>Akses Free dan Premium</h2>
      <p>Akaun Free dan Premium mempunyai akses atau ciri yang berbeza. Premium hanya diaktifkan selepas Admin mengesahkan pembayaran manual.</p>
      <p>Tempoh Premium semasa ialah:</p>
      <ul>{enabledDurations.map(plan => <li key={plan.id}>{plan.durationDays} hari</li>)}</ul>
      <p>Hak Premium ditentukan oleh rekod akaun dan status pelayan yang sah.</p>
    </section>

    <section>
      <h2>Penggunaan yang wajar</h2>
      <p>Pengguna tidak boleh menyalahgunakan perkhidmatan, cuba mendapatkan akses tanpa kebenaran, memanipulasi status Premium, memintas kawalan akses atau mengganggu akaun lain.</p>
    </section>

    <section>
      <h2>Bayaran dan bantuan</h2>
      <p>Soalan berkaitan pembayaran atau bayaran balik dikendalikan melalui semakan bantuan secara manual.</p>
      <p>Lihat <a href="#/privacy">Dasar Privasi</a> dan <a href="#/support">Bantuan</a> untuk maklumat lanjut.</p>
    </section>
  </>;
}

function SupportContent() {
  const whatsAppUrl = buildPublicSupportWhatsAppUrl();
  return <>
    <section>
      <h2>Hubungi Admin</h2>
      <p>Gunakan saluran bantuan untuk masalah akaun atau log masuk, pengesahan e-mel, Premium, pembayaran manual, semakan bayaran balik, permintaan pemadaman akaun atau data, dan masalah penggunaan aplikasi.</p>
      {whatsAppUrl
        ? <a className="public-info-primary-action" href={whatsAppUrl} target="_blank" rel="noreferrer">Hubungi Admin melalui WhatsApp</a>
        : <p role="status">Saluran WhatsApp belum tersedia.</p>}
      <p>Menghantar permintaan tidak bermaksud pembayaran telah diterima, Premium telah diaktifkan, bayaran balik telah diluluskan atau pemadaman telah selesai.</p>
    </section>

    <section id="padam-akaun">
      <h2>Padam akaun atau data</h2>
      <p>Hantar permintaan melalui WhatsApp dan kenal pasti akaun menggunakan e-mel akaun atau ID akaun. Admin akan mengesahkan akaun sebelum memproses permintaan secara manual.</p>
      <p className="public-info-security-note"><strong>Keselamatan:</strong> Jangan hantar kata laluan, pautan pengesahan atau token pengesahan kepada Admin.</p>
    </section>

    <section id="bayaran-balik">
      <h2>Bayaran dan bayaran balik</h2>
      <p>Bayaran Premium manual tidak dipulangkan secara automatik.</p>
      <p>Jika berlaku bayaran pendua, jumlah bayaran yang salah, atau Premium gagal diaktifkan kerana masalah sistem, hubungi Admin. Setiap kes disemak secara manual dan keputusan dibuat selepas semakan.</p>
      <p>Aliran Premium kekal: pembayaran dibuat, Admin mengesahkan pembayaran sebenar, kemudian Premium diaktifkan.</p>
    </section>
  </>;
}

export default function PublicInfoPage({ route, onBack }) {
  const title = ROUTE_LABELS[route] || ROUTE_LABELS.support;
  return <main className="public-info-page">
    <article className="public-info-shell" aria-labelledby="public-info-title">
      <header className="public-info-header">
        <div><p className="eyebrow">Jannati AI Tutor</p><h1 id="public-info-title">{title}</h1></div>
        <button type="button" className="secondary" onClick={onBack}>Kembali</button>
      </header>
      <PublicInfoNavigation currentRoute={route} />
      <div className="public-info-content">
        {route === 'privacy' ? <PrivacyContent /> : route === 'terms' ? <TermsContent /> : <SupportContent />}
      </div>
    </article>
  </main>;
}
