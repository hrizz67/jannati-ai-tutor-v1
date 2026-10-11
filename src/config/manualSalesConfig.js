const plans = [
  {
    id: 'premium-30',
    label: '30 Hari',
    durationDays: 30,
    priceMYR: null,
    enabled: true,
    description: 'Tempoh Premium untuk akaun keluarga selama 30 hari.'
  },
  {
    id: 'premium-90',
    label: '90 Hari',
    durationDays: 90,
    priceMYR: null,
    enabled: true,
    badge: 'Pilihan keluarga',
    description: 'Tempoh Premium untuk akaun keluarga selama 90 hari.'
  },
  {
    id: 'premium-365',
    label: '365 Hari',
    durationDays: 365,
    priceMYR: null,
    enabled: true,
    description: 'Tempoh Premium untuk akaun keluarga selama 365 hari.'
  }
].map(plan => Object.freeze(plan));

export const manualSalesConfig = Object.freeze({
  enabled: true,
  currency: 'MYR',
  paymentMode: 'manual',
  plans: Object.freeze(plans),
  whatsappNumber: '',
  paymentInstructions: Object.freeze([])
});

export default manualSalesConfig;
