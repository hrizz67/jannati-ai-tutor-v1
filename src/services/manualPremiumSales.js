import { formatAccessExpiry } from './accessControl.js';

const FALLBACK_PRICE_LABEL = 'Harga akan dimaklumkan';

function cleanText(value) {
  return String(value ?? '').trim();
}

export function getEnabledManualSalesPlans(config = {}) {
  return Array.isArray(config.plans)
    ? config.plans.filter(plan => plan?.enabled !== false && cleanText(plan?.id) && Number(plan?.durationDays) > 0)
    : [];
}

export function getConfiguredPlanPrice(plan = {}, currency = 'MYR') {
  const amount = Number(plan?.priceMYR);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return {
    amount,
    label: new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: cleanText(currency) || 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  };
}

export function formatManualSalesPlanPrice(plan = {}, currency = 'MYR') {
  return getConfiguredPlanPrice(plan, currency)?.label || FALLBACK_PRICE_LABEL;
}

export function shortenAccountId(accountId) {
  const value = cleanText(accountId);
  if (!value) return 'Belum log masuk';
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export function buildManualPaymentSummary({ accountEmail, accountId, plan, config = {} } = {}) {
  const price = getConfiguredPlanPrice(plan, config.currency);
  return [
    'Jannati Premium — Maklumat Pembayaran Manual',
    `E-mel akaun: ${cleanText(accountEmail) || 'Belum log masuk'}`,
    `ID akaun: ${cleanText(accountId) || 'Belum log masuk'}`,
    `Pelan: ${cleanText(plan?.label) || 'Belum dipilih'}`,
    `Tempoh: ${Number(plan?.durationDays) > 0 ? `${Number(plan.durationDays)} hari` : 'Belum dipilih'}`,
    `Jumlah: ${price?.label || FALLBACK_PRICE_LABEL}`,
    'Rujukan transaksi: [SILA ISI]',
    'Pembayaran perlu disahkan oleh Admin sebelum Premium diaktifkan.'
  ].join('\n');
}

export function buildWhatsAppPaymentMessage(details = {}) {
  const { accountEmail, accountId, plan, config = {} } = details;
  const price = getConfiguredPlanPrice(plan, config.currency);
  return [
    'Assalamualaikum, saya telah membuat pembayaran Jannati Premium.',
    '',
    `E-mel akaun: ${cleanText(accountEmail) || 'Belum log masuk'}`,
    `ID akaun: ${cleanText(accountId) || 'Belum log masuk'}`,
    `Pelan: ${cleanText(plan?.label) || 'Belum dipilih'}`,
    `Tempoh: ${Number(plan?.durationDays) > 0 ? `${Number(plan.durationDays)} hari` : 'Belum dipilih'}`,
    ...(price ? [`Jumlah: ${price.label}`] : []),
    'Rujukan transaksi: [SILA ISI]',
    '',
    'Mohon semak dan aktifkan Premium. Terima kasih.'
  ].join('\n');
}

export function buildWhatsAppPaymentUrl(details = {}) {
  const configuredNumber = cleanText(details?.config?.whatsappNumber).replace(/[^0-9]/g, '');
  if (!configuredNumber) return '';
  return `https://wa.me/${configuredNumber}?text=${encodeURIComponent(buildWhatsAppPaymentMessage(details))}`;
}

export function getManualSalesAccessPresentation(access = {}) {
  if (access?.isPremium === true && access?.server_verified === true && access?.server_access_allowed === true) {
    return {
      state: 'active',
      label: 'Premium aktif',
      expiryLabel: access?.is_permanent ? 'Akses Premium kekal' : formatAccessExpiry(access),
      daysRemaining: access?.is_permanent ? null : Math.max(0, Number(access?.days_remaining) || 0)
    };
  }
  if (access?.server_verified === true && access?.entitlement_status === 'pending') {
    return { state: 'pending', label: 'Menunggu semakan Admin', expiryLabel: '', daysRemaining: null };
  }
  if (access?.access_status === 'expired') {
    return { state: 'expired', label: 'Premium tamat', expiryLabel: formatAccessExpiry(access), daysRemaining: null };
  }
  return { state: 'free', label: 'Belum bayar', expiryLabel: '', daysRemaining: null };
}

export const MANUAL_SALES_PRICE_FALLBACK = FALLBACK_PRICE_LABEL;
