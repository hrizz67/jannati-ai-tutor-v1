import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import manualSalesConfig from '../../src/config/manualSalesConfig.js';
import PublicInfoPage, { buildPublicSupportWhatsAppUrl } from '../../src/public/PublicInfoPage.jsx';
import { getSafePublicInfoReturnHash, resolvePublicInfoRoute } from '../../src/public/publicInfoRoutes.js';

const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const publicPageSource = fs.readFileSync(new URL('../../src/public/PublicInfoPage.jsx', import.meta.url), 'utf8');
const publicRouteSource = fs.readFileSync(new URL('../../src/public/publicInfoRoutes.js', import.meta.url), 'utf8');
const publicStyles = fs.readFileSync(new URL('../../src/public/public-info.css', import.meta.url), 'utf8');
const globalStyles = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');
const premiumPageSource = fs.readFileSync(new URL('../../src/premium/ManualPremiumSalesPage.jsx', import.meta.url), 'utf8');

function renderPage(route) {
  return renderToStaticMarkup(React.createElement(PublicInfoPage, { route, onBack: () => {} }));
}

const privacyMarkup = renderPage('privacy');
const termsMarkup = renderPage('terms');
const supportMarkup = renderPage('support');

describe('P1.15B2 exact public route containment', () => {
  it('resolves only the exact privacy route', () => {
    expect(resolvePublicInfoRoute('#/privacy')).toBe('privacy');
    expect(resolvePublicInfoRoute('#/privacy/extra')).toBe('');
  });

  it('resolves only the exact terms route', () => {
    expect(resolvePublicInfoRoute('#/terms')).toBe('terms');
    expect(resolvePublicInfoRoute('#/terms?next=1')).toBe('');
  });

  it('resolves only the exact support route', () => {
    expect(resolvePublicInfoRoute('#/support')).toBe('support');
    expect(resolvePublicInfoRoute('#/support/')).toBe('');
  });

  it('does not hijack unknown hashes', () => {
    expect(resolvePublicInfoRoute('#/unknown')).toBe('');
    expect(resolvePublicInfoRoute('#')).toBe('');
    expect(resolvePublicInfoRoute('')).toBe('');
  });

  it('leaves Premium and Admin routes unchanged', () => {
    expect(resolvePublicInfoRoute('#/premium')).toBe('');
    expect(resolvePublicInfoRoute('#/admin')).toBe('');
    expect(resolvePublicInfoRoute('#/admin/premium')).toBe('');
    expect(appSource).toContain("window.location.hash = '/premium'");
    expect(appSource).toContain("window.location.hash = '/admin'");
  });

  it('never interprets Supabase auth or recovery callback hashes as public pages', () => {
    expect(resolvePublicInfoRoute('#access_token=secret&refresh_token=secret&type=signup')).toBe('');
    expect(resolvePublicInfoRoute('#type=recovery&access_token=secret')).toBe('');
    expect(resolvePublicInfoRoute('#error=access_denied&error_code=otp_expired')).toBe('');
  });

  it('retains only safe app routes for the deterministic Kembali action', () => {
    expect(getSafePublicInfoReturnHash('#/premium')).toBe('#/premium');
    expect(getSafePublicInfoReturnHash('#/admin/premium')).toBe('#/admin/premium');
    expect(getSafePublicInfoReturnHash('#access_token=secret')).toBe('');
    expect(getSafePublicInfoReturnHash('#type=recovery&access_token=secret')).toBe('');
  });

  it('renders public pages before login, onboarding, or recovery branches without changing those branches', () => {
    expect(appSource.indexOf('if (publicInfoRoute)')).toBeLessThan(appSource.indexOf('if (authRecoveryStatus !== AUTH_RECOVERY_STATUS.IDLE)'));
    expect(appSource).toContain("const AuthRecoveryPanel = React.lazy(() => import('./components/auth/AuthRecoveryPanel.jsx'))");
    expect(appSource).toContain('onComplete={leaveRecovery}');
  });
});

describe('P1.15B2 public information content', () => {
  it('renders all three public titles and a clear Kembali action', () => {
    expect(privacyMarkup).toContain('<h1 id="public-info-title">Dasar Privasi</h1>');
    expect(termsMarkup).toContain('<h1 id="public-info-title">Terma Penggunaan</h1>');
    expect(supportMarkup).toContain('<h1 id="public-info-title">Bantuan</h1>');
    expect(privacyMarkup).toContain('>Kembali</button>');
  });

  it('states Guest Free device storage accurately without promising cloud backup', () => {
    expect(privacyMarkup).toContain('<strong>Guest Free:</strong>');
    expect(privacyMarkup).toContain('disimpan pada peranti semasa');
    expect(privacyMarkup).toContain('tidak semestinya disimpan dalam awan');
  });

  it('states account-backed cloud synchronization accurately', () => {
    expect(privacyMarkup).toContain('<strong>Penggunaan berasaskan akaun:</strong>');
    expect(privacyMarkup).toContain('perkhidmatan awan Jannati');
    expect(privacyMarkup).toContain('dipulihkan atau digunakan pada peranti yang disokong');
  });

  it('lists only relevant account, learner, progress, Premium, and manual-reference information', () => {
    for (const expected of ['alamat e-mel dan ID akaun', 'profil murid atau anak', 'kemajuan serta rekod pembelajaran', 'status Premium', 'pembayaran manual']) {
      expect(privacyMarkup).toContain(expected);
    }
    expect(privacyMarkup).not.toContain('kami tidak mengumpul data');
  });

  it('explains the approved operational purposes and data-minimization guidance', () => {
    expect(privacyMarkup).toContain('operasi log masuk dan akaun');
    expect(privacyMarkup).toContain('keselamatan dan kebolehpercayaan aplikasi');
    expect(privacyMarkup).toContain('hanya maklumat yang diperlukan untuk profil murid');
  });

  it('explains transient Quiz audio processing, adult consent and manual typing', () => {
    for (const expected of [
      'Rakaman suara kuiz',
      'teks yang boleh disemak dan diedit',
      'tidak menyimpan audio kuiz',
      'diproses secara sementara',
      'input menaip sentiasa tersedia',
      'ibu bapa atau penjaga mesti memberi kebenaran',
      'Rakaman tidak bermula secara automatik'
    ]) expect(privacyMarkup).toContain(expected);
  });

  it('makes account or data deletion a verified manual request without a fake action', () => {
    expect(privacyMarkup).toContain('Permintaan diproses secara manual selepas pengesahan akaun');
    expect(supportMarkup).toContain('Admin akan mengesahkan akaun sebelum memproses permintaan secara manual');
    expect(`${privacyMarkup}\n${supportMarkup}`).not.toMatch(/<button[^>]*>[^<]*(?:Padam|Delete)/i);
  });

  it('warns users never to send passwords or authentication tokens', () => {
    expect(privacyMarkup).toContain('Jangan hantar kata laluan atau pautan/token pengesahan kepada Admin');
    expect(supportMarkup).toContain('Jangan hantar kata laluan, pautan pengesahan atau token pengesahan kepada Admin');
    expect(`${privacyMarkup}\n${supportMarkup}`).not.toMatch(/hantar (?:kata laluan|token) (?:anda|kepada Admin untuk pengesahan)/i);
  });

  it('describes Tahun 2 educational-support scope without guaranteeing outcomes', () => {
    expect(termsMarkup).toContain('pembelajaran Tahun 2');
    expect(termsMarkup).toContain('alat sokongan pendidikan');
    expect(termsMarkup).toContain('tidak menjamin keputusan peperiksaan atau prestasi akademik');
  });

  it('reflects manual Premium activation and server-authoritative entitlement', () => {
    expect(termsMarkup).toContain('Premium hanya diaktifkan selepas Admin mengesahkan pembayaran manual');
    expect(termsMarkup).toContain('ditentukan oleh rekod akaun dan status pelayan yang sah');
  });

  it('sources current Premium durations from the existing config without duplicating prices', () => {
    for (const plan of manualSalesConfig.plans) expect(termsMarkup).toContain(`${plan.durationDays} hari`);
    expect(termsMarkup).not.toMatch(/RM(?:\s|&nbsp;|&#xA0;)*\d/i);
    expect(manualSalesConfig.plans.map(plan => plan.priceMYR)).toEqual([10, 25, 100]);
  });

  it('states the approved misuse boundary in understandable language', () => {
    expect(termsMarkup).toContain('memanipulasi status Premium');
    expect(termsMarkup).toContain('memintas kawalan akses');
    expect(termsMarkup).toContain('mengganggu akaun lain');
  });

  it('links Terms naturally to Privacy and Support', () => {
    expect(termsMarkup).toContain('href="#/privacy"');
    expect(termsMarkup).toContain('href="#/support"');
  });
});

describe('P1.15B2 support, payment, and security invariants', () => {
  it('uses the existing manual-sales WhatsApp number as its single source of truth', () => {
    const url = buildPublicSupportWhatsAppUrl(manualSalesConfig);
    expect(url).toContain(`https://wa.me/${manualSalesConfig.whatsappNumber}?text=`);
    expect(supportMarkup).toContain(`https://wa.me/${manualSalesConfig.whatsappNumber}?text=`);
    expect(publicPageSource).not.toContain(manualSalesConfig.whatsappNumber);
  });

  it('provides one generic support request channel without claiming an outcome', () => {
    expect(supportMarkup).toContain('Hubungi Admin melalui WhatsApp');
    expect(supportMarkup).toContain('tidak bermaksud pembayaran telah diterima');
    expect(supportMarkup).toContain('bayaran balik telah diluluskan');
    expect(supportMarkup).toContain('pemadaman telah selesai');
  });

  it('covers the approved account, e-mail, Premium, payment, deletion, and app-help topics', () => {
    for (const topic of ['masalah akaun atau log masuk', 'pengesahan e-mel', 'Premium', 'pembayaran manual', 'semakan bayaran balik', 'pemadaman akaun atau data', 'masalah penggunaan aplikasi']) {
      expect(supportMarkup).toContain(topic);
    }
  });

  it('states that manual Premium payments are not refunded automatically', () => {
    expect(supportMarkup).toContain('Bayaran Premium manual tidak dipulangkan secara automatik');
  });

  it('offers manual review for duplicate, wrong-amount, and system activation issues', () => {
    expect(supportMarkup).toContain('bayaran pendua');
    expect(supportMarkup).toContain('jumlah bayaran yang salah');
    expect(supportMarkup).toContain('Premium gagal diaktifkan kerana masalah sistem');
    expect(supportMarkup).toContain('Setiap kes disemak secara manual');
  });

  it('contains no guaranteed refund, approval, response, or deletion deadline', () => {
    const allMarkup = `${privacyMarkup}\n${termsMarkup}\n${supportMarkup}`;
    expect(allMarkup).not.toMatch(/bayaran balik (?:pasti|dijamin)|diluluskan dalam|dijawab dalam|dipadam dalam|tempoh \d+ hari/i);
    expect(allMarkup).not.toContain('No refunds under any circumstances');
  });

  it('preserves the canonical payment-verification-activation sequence', () => {
    expect(supportMarkup).toContain('pembayaran dibuat, Admin mengesahkan pembayaran sebenar, kemudian Premium diaktifkan');
    expect(premiumPageSource).toContain('Admin akan semak pembayaran');
    expect(premiumPageSource).toContain('Premium aktif selepas pembayaran disahkan');
  });

  it('adds no customer mutation, backend deletion, automatic refund, or database path', () => {
    const publicSources = `${publicPageSource}\n${publicRouteSource}`;
    for (const forbidden of ['.rpc(', '.from(', 'deleteUser(', 'removeUser(', 'refund(', 'localStorage', 'service_role']) {
      expect(publicSources).not.toContain(forbidden);
    }
  });

  it('contains no bank details, auth secrets, or private customer data', () => {
    const publicSources = `${publicPageSource}\n${publicRouteSource}`;
    expect(publicSources).not.toMatch(/(?:nombor akaun bank|nama pemegang akaun|service[_-]?role|refresh[_-]?token|access[_-]?token|bearer\s+[a-z0-9])/i);
    expect(publicSources).not.toContain('@example.com');
  });
});

describe('P1.15B2 lazy loading, footer, and mobile containment', () => {
  it('lazy-loads the public page and keeps long policy copy out of the App entry', () => {
    expect(appSource).toContain("const PublicInfoPage = React.lazy(() => import('./public/PublicInfoPage.jsx'))");
    expect(appSource).not.toMatch(/import PublicInfoPage from/);
    expect(appSource).not.toContain('Bayaran Premium manual tidak dipulangkan secara automatik');
    expect(appSource).not.toContain('Permintaan diproses secara manual selepas pengesahan akaun');
  });

  it('exposes all public links from the global footer while preserving brand metadata', () => {
    const footerStart = appSource.indexOf('function AppVersiFooter()');
    const footerEnd = appSource.indexOf('function StorageRecoveryNotice(', footerStart);
    const footerSource = appSource.slice(footerStart, footerEnd);
    for (const expected of ['href="#/privacy"', 'href="#/terms"', 'href="#/support"', 'Dasar Privasi', 'Terma Penggunaan', 'Bantuan', 'APP_VERSION', 'Hak Cipta']) {
      expect(footerSource).toContain(expected);
    }
    expect(footerSource).not.toContain('CLOSED BETA');
  });

  it('keeps the public page readable and touch-friendly at 390px', () => {
    expect(publicStyles).toContain('@media(max-width:480px)');
    expect(publicStyles).toContain('grid-template-columns:1fr');
    expect(publicStyles).toContain('min-height:44px');
    expect(publicStyles).toContain('width:100%');
    expect(publicStyles).not.toContain('overflow-x:scroll');
  });

  it('gives public page and footer links visible keyboard focus and wrapping', () => {
    expect(publicStyles).toContain(':focus-visible');
    expect(globalStyles).toContain('.app-footer-links a:focus-visible');
    expect(globalStyles).toMatch(/\.app-footer-links\s*\{[^}]*flex-wrap:\s*wrap/s);
  });

  it('preserves Guest Free, account-backed entitlement, and Premium restore plumbing', () => {
    expect(appSource).toContain('createSafeFreeEntitlement');
    expect(appSource).toContain('loadMyPremiumEntitlement');
    expect(appSource).toContain('applyAuthoritativeProfileAccess');
    expect(appSource).toContain('getGuestProfileSummary()');
  });

  it('keeps P1.15A internal containment active in normal production mode', () => {
    expect(appSource).toContain('isInternalUiSurfaceEnabled() && <BetaFeedbackButton');
    expect(appSource).toContain('isInternalUiSurfaceEnabled() && <details className="qde-debug-panel"');
  });
});
