function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getMotivation(profile = {}, memory = null, context = {}) {
  const persona = `${context.persona || 'janna'}`.toLowerCase();
  const mastery = toNumber(context.mastery, 0);
  const readiness = `${context.readiness || 'needs_support'}`.toLowerCase();
  const streak = toNumber(context.streak, 0);
  const topicStrength = toNumber(context.topicStrength, 0);

  if (persona === 'jati') {
    if (readiness === 'ready' && mastery >= 80) {
      return 'Kekalkan disiplin ini. Kemajuan akan terus bertambah dengan langkah konsisten.';
    }
    if (topicStrength >= 70) {
      return 'Fokus pada satu topik pada satu masa supaya penguasaan lebih mantap.';
    }
    return 'Kita akan bina keyakinan melalui latihan yang tersusun dan jelas.';
  }

  if (streak >= 7) {
    return 'Kebiasaan baik kamu sangat kuat. Teruskan belajar setiap hari!';
  }
  if (mastery >= 80 || topicStrength >= 75) {
    return 'Hebat! Kamu sedang berada pada laluan yang sangat baik.';
  }
  if (readiness === 'ready') {
    return 'Jom teruskan momentum ini dengan latihan seterusnya.';
  }
  return 'Sikit demi sedikit, kamu pasti berjaya. Janna percaya pada kamu!';
}

export default {
  getMotivation
};
