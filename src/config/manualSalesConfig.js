const plans = [
  {
    id: 'premium-30',
    label: '30 Hari',
    durationDays: 30,
    priceMYR: 10,
    enabled: true,
    description: 'Tempoh Premium untuk akaun keluarga selama 30 hari.'
  },
  {
    id: 'premium-90',
    label: '90 Hari',
    durationDays: 90,
    priceMYR: 25,
    enabled: true,
    badge: 'Pilihan keluarga',
    description: 'Tempoh Premium untuk akaun keluarga selama 90 hari.'
  },
  {
    id: 'premium-365',
    label: '365 Hari',
    durationDays: 365,
    priceMYR: 100,
    enabled: true,
    description: 'Tempoh Premium untuk akaun keluarga selama 365 hari.'
  }
].map(plan => Object.freeze(plan));

export const manualSalesConfig = Object.freeze({
  enabled: true,
  currency: 'MYR',
  paymentMode: 'manual',
  plans: Object.freeze(plans),
  whatsappNumber: '60134425202',
  paymentInstructions: Object.freeze([
    'Kaedah pembayaran: DuitNow / Bank Transfer',
    'Hubungi Admin melalui WhatsApp untuk mendapatkan maklumat pembayaran.',
    'Selepas membuat bayaran, simpan bukti atau rujukan transaksi.',
    'Tekan Saya Dah Bayar dan hantar bukti pembayaran kepada Admin untuk semakan.'
  ])
});

export default manualSalesConfig;
