function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getTimeGreeting(timeOfDay = 'morning') {
  switch (timeOfDay) {
    case 'afternoon':
      return 'Selamat tengah hari';
    case 'evening':
      return 'Selamat petang';
    case 'night':
      return 'Selamat malam';
    default:
      return 'Selamat pagi';
  }
}

export function getGreeting(profile = {}, memory = null, context = {}) {
  const persona = `${context.persona || 'janna'}`.toLowerCase();
  const timeOfDay = `${context.timeOfDay || 'morning'}`.toLowerCase();
  const streak = toNumber(context.streak, 0);
  const mastery = toNumber(context.mastery, 0);
  const readiness = `${context.readiness || 'needs_support'}`.toLowerCase();
  const baseGreeting = getTimeGreeting(timeOfDay);

  if (persona === 'jati') {
    const suffix =
      readiness === 'ready'
        ? 'Mari kita analisis cabaran seterusnya.'
        : mastery >= 70
          ? 'Mari kita semak langkah demi langkah.'
          : 'Kita akan bergerak perlahan-lahan dan jelas.';
    return `${baseGreeting}. ${suffix}`;
  }

  const suffix =
    streak >= 7
      ? 'Syabas! Kamu sangat konsisten.'
      : mastery >= 80
        ? 'Hebat! Kamu semakin mantap.'
        : readiness === 'ready'
          ? 'Teruskan usaha yang baik.'
          : 'Jom belajar bersama-sama.';

  return `${baseGreeting}. ${suffix}`;
}

export function getFarewell(profile = {}, memory = null, context = {}) {
  const persona = `${context.persona || 'janna'}`.toLowerCase();
  const mastery = toNumber(context.mastery, 0);
  const streak = toNumber(context.streak, 0);

  if (persona === 'jati') {
    return mastery >= 80
      ? 'Selesai untuk sekarang. Teruskan langkah yang konsisten.'
      : 'Bagus. Kita sambung dengan langkah seterusnya nanti.';
  }

  return streak >= 7
    ? 'Jumpa lagi nanti. Teruskan usaha baik kamu!'
    : mastery >= 80
      ? 'Jumpa lagi. Kamu sedang berada pada laluan yang cemerlang!'
      : 'Jumpa lagi nanti. Janna sentiasa bersama kamu.';
}

export default {
  getGreeting,
  getFarewell
};
