function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getEmotion(profile = {}, memory = null, context = {}) {
  const persona = `${context.persona || 'janna'}`.toLowerCase();
  const mastery = toNumber(context.mastery, 0);
  const readiness = `${context.readiness || 'needs_support'}`.toLowerCase();
  const streak = toNumber(context.streak, 0);
  const topicStrength = toNumber(context.topicStrength, 0);

  if (persona === 'jati') {
    if (readiness === 'ready' && mastery >= 80) {
      return {
        label: 'fokus',
        tone: 'tenang-tegas',
        message: 'Kita sudah bersedia untuk cabaran yang lebih tinggi.'
      };
    }
    if (topicStrength >= 75 || mastery >= 60) {
      return {
        label: 'yakin',
        tone: 'analitikal',
        message: 'Asas sudah ada. Mari kita kukuhkan satu demi satu.'
      };
    }
    return {
      label: 'sokongan',
      tone: 'sabar-tersusun',
      message: 'Kita bergerak perlahan supaya setiap langkah jelas.'
    };
  }

  if (streak >= 7 || mastery >= 85) {
    return {
      label: 'bangga',
      tone: 'ceria-menggalakkan',
      message: 'Janna sangat bangga dengan kemajuan kamu.'
    };
  }
  if (readiness === 'ready') {
    return {
      label: 'bersemangat',
      tone: 'ceria',
      message: 'Jom teruskan momentum yang baik ini.'
    };
  }
  return {
    label: 'mesra',
    tone: 'lembut-menggalakkan',
    message: 'Janna ada di sini untuk membantu kamu.'
  };
}

export default {
  getEmotion
};
