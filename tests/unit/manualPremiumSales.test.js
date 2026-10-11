import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import manualSalesConfig from '../../src/config/manualSalesConfig.js';
import ManualPremiumSalesPage from '../../src/premium/ManualPremiumSalesPage.jsx';
import {
  buildManualPaymentSummary,
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  formatManualSalesPlanPrice,
  getEnabledManualSalesPlans,
  getManualSalesAccessPresentation,
  shortenAccountId
} from '../../src/services/manualPremiumSales.js';

const componentSource = fs.readFileSync(new URL('../../src/premium/ManualPremiumSalesPage.jsx', import.meta.url), 'utf8');
const serviceSource = fs.readFileSync(new URL('../../src/services/manualPremiumSales.js', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const dashboardSource = fs.readFileSync(new URL('../../src/dashboard/HomeDashboard.jsx', import.meta.url), 'utf8');
const stylesSource = fs.readFileSync(new URL('../../src/premium/manual-premium-sales.css', import.meta.url), 'utf8');

const accountUser = {
  id: '12345678-1234-1234-1234-123456789abc',
  email: 'parent@example.com'
};

function renderPage(accessProfile = {}) {
  return renderToStaticMarkup(React.createElement(ManualPremiumSalesPage, {
    accountUser,
    accessProfile,
    onBack: () => {},
    onLogin: () => {}
  }));
}

describe('P1.14.2A manual Premium sales UX', () => {
  it('offers only the configured 30, 90 and 365-day manual plans', () => {
    const plans = getEnabledManualSalesPlans(manualSalesConfig);
    expect(manualSalesConfig.paymentMode).toBe('manual');
    expect(plans.map(plan => plan.durationDays)).toEqual([30, 90, 365]);
    expect(plans.map(plan => plan.id)).toEqual(['premium-30', 'premium-90', 'premium-365']);
  });

  it('never renders RM0 when a price is not configured', () => {
    for (const plan of manualSalesConfig.plans) {
      expect(formatManualSalesPlanPrice(plan, manualSalesConfig.currency)).toBe('Harga akan dimaklumkan');
      expect(formatManualSalesPlanPrice(plan, manualSalesConfig.currency)).not.toMatch(/RM\s*0/);
    }
  });

  it('uses a short account ID for display while retaining the exact account ID for copying', () => {
    expect(shortenAccountId(accountUser.id)).toBe('12345678…9abc');
    const summary = buildManualPaymentSummary({ accountEmail: accountUser.email, accountId: accountUser.id, plan: manualSalesConfig.plans[0], config: manualSalesConfig });
    expect(summary).toContain(`ID akaun: ${accountUser.id}`);
  });

  it('builds a complete copy summary with a transaction-reference reminder', () => {
    const summary = buildManualPaymentSummary({ accountEmail: accountUser.email, accountId: accountUser.id, plan: manualSalesConfig.plans[1], config: manualSalesConfig });
    expect(summary).toContain('E-mel akaun: parent@example.com');
    expect(summary).toContain('Pelan: 90 Hari');
    expect(summary).toContain('Tempoh: 90 hari');
    expect(summary).toContain('Jumlah: Harga akan dimaklumkan');
    expect(summary).toContain('Rujukan transaksi: [SILA ISI]');
    expect(summary).toContain('disahkan oleh Admin');
  });

  it('encodes the configured WhatsApp number and pre-filled payment message', () => {
    const config = { ...manualSalesConfig, whatsappNumber: '+60 12-345 6789' };
    const plan = { ...manualSalesConfig.plans[0], priceMYR: 25 };
    const details = { accountEmail: accountUser.email, accountId: accountUser.id, plan, config };
    const url = buildWhatsAppPaymentUrl(details);
    expect(url).toMatch(/^https:\/\/wa\.me\/60123456789\?text=/);
    expect(decodeURIComponent(url.split('?text=')[1])).toBe(buildWhatsAppPaymentMessage(details));
    expect(decodeURIComponent(url)).toContain('Jumlah: RM 25.00');
  });

  it('returns no contact URL when WhatsApp is not configured', () => {
    expect(buildWhatsAppPaymentUrl({ accountEmail: accountUser.email, accountId: accountUser.id, plan: manualSalesConfig.plans[0], config: manualSalesConfig })).toBe('');
    const markup = renderPage({ access_status: 'free' });
    expect(markup).toContain('WhatsApp belum dikonfigurasi');
    expect(markup).not.toContain('wa.me');
  });

  it('renders account identity safely and escapes customer-controlled text', () => {
    const markup = renderToStaticMarkup(React.createElement(ManualPremiumSalesPage, {
      accountUser: { ...accountUser, email: '<script>alert(1)</script>@example.com' },
      accessProfile: { access_status: 'free' },
      onBack: () => {},
      onLogin: () => {}
    }));
    expect(markup).toContain('&lt;script&gt;alert(1)&lt;/script&gt;@example.com');
    expect(markup).not.toContain('<script>alert(1)</script>');
    expect(markup).toContain('12345678…9abc');
    expect(markup).toContain('aria-label="Salin ID akaun"');
  });

  it('shows only server-authoritative active Premium details', () => {
    const access = {
      isPremium: true,
      server_verified: true,
      server_access_allowed: true,
      access_status: 'premium',
      access_expires_at: '2026-12-01T00:00:00.000Z',
      days_remaining: 51
    };
    expect(getManualSalesAccessPresentation(access)).toMatchObject({ state: 'active', label: 'Premium aktif', daysRemaining: 51 });
    const markup = renderPage(access);
    expect(markup).toContain('Perbaharui Premium');
    expect(markup).toContain('51 hari berbaki berdasarkan status server');
  });

  it('fails closed for unverified claims and distinguishes expired Premium', () => {
    expect(getManualSalesAccessPresentation({ isPremium: true, access_status: 'premium', server_verified: false })).toMatchObject({ state: 'free', label: 'Belum bayar' });
    expect(getManualSalesAccessPresentation({ access_status: 'expired', access_expires_at: '2026-09-01T00:00:00.000Z' })).toMatchObject({ state: 'expired', label: 'Premium tamat' });
    expect(renderPage({ access_status: 'expired', access_expires_at: '2026-09-01T00:00:00.000Z' })).toContain('Premium tamat');
  });

  it('provides accessible plan selection and mobile-safe contact controls', () => {
    const markup = renderPage({ access_status: 'free' });
    expect(markup).toContain('role="radiogroup"');
    expect(markup.match(/type="radio"/g)).toHaveLength(3);
    expect(markup).toContain('aria-label="Salin e-mel akaun"');
    expect(stylesSource).toContain('@media(max-width:768px)');
    expect(stylesSource).toContain('@media(max-width:420px)');
    expect(stylesSource).toContain('grid-template-columns:1fr');
  });

  it('routes both Free Premium gates and the account dashboard to the upgrade page', () => {
    expect(appSource).toContain("window.location.hash = '/premium'");
    expect(appSource).toContain('onUpgrade={openManualPremiumSales}');
    expect(appSource).toContain('onOpenPremium={openManualPremiumSales}');
    expect(dashboardSource).toContain("isPremiumAccount ? 'Perbaharui Premium' : 'Naik Taraf Premium'");
  });

  it('keeps the customer page informational and free of Admin or database mutation paths', () => {
    const customerSources = `${componentSource}\n${serviceSource}`;
    for (const forbidden of [
      'admin_apply_subscription_change',
      'managePremiumEntitlement',
      '.rpc(',
      '.from(',
      'localStorage',
      'service_role',
      'access_status:',
      'payment_status:'
    ]) expect(customerSources).not.toContain(forbidden);
  });

  it('does not create an automatic order state when contact details are copied or opened', () => {
    expect(componentSource).not.toMatch(/set.*(?:Paid|Payment|Entitlement|Access)/i);
    expect(componentSource).not.toContain('Menunggu semakan Admin');
    expect(componentSource).toContain('Mesej atau salinan maklumat bukan bukti bayaran');
    expect(serviceSource).not.toContain('window.location');
  });
});
