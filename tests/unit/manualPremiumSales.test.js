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
const configSource = fs.readFileSync(new URL('../../src/config/manualSalesConfig.js', import.meta.url), 'utf8');
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

  it('renders the configured prices for every enabled plan without a fallback label', () => {
    const prices = manualSalesConfig.plans.map(plan => formatManualSalesPlanPrice(plan, manualSalesConfig.currency));
    expect(prices).toEqual(['RM\u00a010.00', 'RM\u00a025.00', 'RM\u00a0100.00']);
    expect(prices).not.toContain('Harga akan dimaklumkan');
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
    expect(summary).toContain('Jumlah: RM\u00a025.00');
    expect(summary).toContain('Rujukan transaksi: [SILA ISI]');
    expect(summary).toContain('disahkan oleh Admin');
  });

  it('encodes the owner WhatsApp number and selected real plan price', () => {
    const plan = manualSalesConfig.plans[2];
    const details = { accountEmail: accountUser.email, accountId: accountUser.id, plan, config: manualSalesConfig };
    const url = buildWhatsAppPaymentUrl(details);
    expect(url).toMatch(/^https:\/\/wa\.me\/60134425202\?text=/);
    expect(decodeURIComponent(url.split('?text=')[1])).toBe(buildWhatsAppPaymentMessage(details));
    expect(decodeURIComponent(url)).toContain('Pelan: 365 Hari');
    expect(decodeURIComponent(url)).toContain('Jumlah: RM 100.00');
  });

  it('renders every configured payment instruction and the WhatsApp contact action', () => {
    const markup = renderPage({ access_status: 'free' });
    for (const instruction of manualSalesConfig.paymentInstructions) expect(markup).toContain(instruction);
    expect(markup).toContain('https://wa.me/60134425202?text=');
    expect(markup).not.toContain('Harga akan dimaklumkan');
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
    expect(manualSalesConfig.paymentInstructions.join('\n')).not.toMatch(/(?:nombor akaun|nama pemegang|account number|account holder|\d{8,})/i);
    expect(configSource).not.toMatch(/(?:bankAccount|accountHolder|privateBank)/i);
  });

  it('does not create an automatic order state when contact details are copied or opened', () => {
    expect(componentSource).not.toMatch(/set.*(?:Paid|Payment|Entitlement|Access)/i);
    expect(componentSource).not.toContain('Menunggu semakan Admin');
    expect(componentSource).toContain('Mesej atau salinan maklumat bukan bukti bayaran');
    expect(serviceSource).not.toContain('window.location');
  });
});
