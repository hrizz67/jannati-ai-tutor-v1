function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getAchievementMessage(profile = {}, memory = null, context = {}) {
  const persona = `${context.persona || 'janna'}`.toLowerCase();
  const streak = toNumber(context.streak, 0);
  const mastery = toNumber(context.mastery, 0);
  const topicStrength = toNumber(context.topicStrength, 0);
  const readiness = `${context.readiness || 'needs_support'}`.toLowerCase();

  if (streak >= 10) {
    return persona === 'jati'
      ? 'Konsistensi kamu sangat baik. Itu tanda disiplin yang kukuh.'
      : 'Luar biasa! Kamu sangat konsisten belajar setiap hari.';
  }

  if (mastery >= 90 || topicStrength >= 85) {
    return persona === 'jati'
      ? 'Penguasaan topik ini sudah sangat kukuh. Teruskan cabaran seterusnya.'
      : 'Hebat! Topik ini sudah dikuasai dengan sangat baik.';
  }

  if (readiness === 'ready') {
    return persona === 'jati'
      ? 'Persediaan kamu baik. Kita boleh naik ke tahap seterusnya.'
      : 'Syabas! Kamu sudah bersedia untuk langkah berikutnya.';
  }

  return persona === 'jati'
    ? 'Setiap cubaan menambah keyakinan. Itu perkembangan yang penting.'
    : 'Sedikit demi sedikit, kamu sedang membina kejayaan.';
}

export default {
  getAchievementMessage
};
