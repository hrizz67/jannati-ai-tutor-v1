function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildAchievementNarrative(profile = {}, memory = {}, observation = {}, context = {}) {
  const streak = toNumber(profile.streak, 0);
  const missionDone = Boolean(context.missionCompleted);
  const sessionCompleted = Boolean(context.sessionCompleted);
  const sessionScore = toNumber(context.sessionScore, 0);
  const strongest = observation.strongestTopic?.title || observation.summary?.strongestTopic;

  if (sessionCompleted && sessionScore >= 80 && strongest) {
    return `Tahniah! Kamu telah menguasai ${strongest}.`;
  }

  if (missionDone) {
    return 'Syabas! Misi hari ini selesai dengan baik.';
  }

  if (streak >= 3) {
    return 'Hebat! Kamu belajar beberapa hari berturut-turut.';
  }

  if (sessionCompleted) {
    return 'Syabas! Kamu sudah berusaha dengan baik.';
  }

  return '';
}

export default {
  buildAchievementNarrative
};
