const SUBJECT_LABELS = {
  bm: 'Bahasa Melayu',
  math: 'Matematik',
  english: 'Bahasa Inggeris',
  sains: 'Sains',
  islam: 'Pendidikan Islam',
  arab: 'Bahasa Arab',
  pj: 'Pendidikan Jasmani dan Kesihatan'
};

const STATUS_LABELS = {
  NOT_STARTED: 'Belum Dimulakan',
  IN_PROGRESS: 'Sedang Dipelajari',
  MASTERED: 'Telah Dikuasai',
  LEARNING: 'Sedang Dipelajari',
  NEEDS_PRACTICE: 'Perlu Latihan',
  insufficient_data: 'Belum Cukup Data',
  no_data: 'Belum Cukup Data',
  developing: 'Sedang Berkembang',
  needs_attention: 'Perlu Diberi Perhatian',
  excellent: 'Cemerlang',
  good: 'Baik',
  strong: 'Dikuasai',
  weak: 'Perlu Diperbaiki',
  critical: 'Kritikal',
  stable: 'Stabil',
  improving: 'Semakin Baik',
  declining: 'Menurun',
  ready: 'Sedia',
  locked: 'Dikunci',
  clear: 'Bersih',
  active: 'Aktif',
  inactive: 'Tidak Aktif',
  complete: 'Selesai',
  completed: 'Selesai',
  pending: 'Menunggu',
  not_started: 'Belum Dimulakan',
  in_progress: 'Sedang Dipelajari',
  learning: 'Sedang Dipelajari',
  mastered: 'Telah Dikuasai',
  practice: 'Perlu Latihan',
  revision: 'Ulang Kaji',
  review: 'Ulang Kaji',
  today: 'Hari Ini'
};

const TREND_LABELS = {
  insufficient_data: 'Belum Cukup Data',
  improving: 'Semakin Baik',
  stable: 'Stabil',
  declining: 'Menurun'
};

const CALENDAR_LABELS = {
  study: 'Belajar',
  revision: 'Ulang Kaji',
  missed: 'Terlepas',
  today: 'Hari Ini',
  future: 'Akan Datang'
};

const DIFFICULTY_LABELS = {
  mudah: 'Mudah',
  sederhana: 'Sederhana',
  sukar: 'Sukar',
  easy: 'Mudah',
  medium: 'Sederhana',
  hard: 'Sukar'
};

const ATTENTION_LABELS = {
  high: 'Tinggi',
  medium: 'Sederhana',
  low: 'Rendah',
  none: 'Tiada'
};

const PRIORITY_LABELS = {
  critical: 'Kritikal',
  high: 'Tinggi',
  medium: 'Sederhana',
  low: 'Rendah',
  urgent: 'Mendesak'
};

function toTitleCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

export function formatSubjectName(subjectId) {
  const key = normalizeKey(subjectId);
  if (SUBJECT_LABELS[key]) return SUBJECT_LABELS[key];
  return toTitleCase(key || subjectId);
}

export function formatTopicName(topicId) {
  const key = normalizeKey(topicId);
  return toTitleCase(key || topicId);
}

export function formatStatus(status) {
  const key = normalizeKey(status);
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  return toTitleCase(key || status);
}

export function formatTrend(direction) {
  const key = normalizeKey(direction);
  if (TREND_LABELS[key]) return TREND_LABELS[key];
  return toTitleCase(key || direction);
}

export function formatCalendarStatus(status) {
  const key = normalizeKey(status);
  if (CALENDAR_LABELS[key]) return CALENDAR_LABELS[key];
  return toTitleCase(key || status);
}

export function formatDifficulty(level) {
  const key = normalizeKey(level);
  if (DIFFICULTY_LABELS[key]) return DIFFICULTY_LABELS[key];
  return toTitleCase(key || level);
}

export function formatAttentionLevel(level) {
  const key = normalizeKey(level);
  if (ATTENTION_LABELS[key]) return ATTENTION_LABELS[key];
  return toTitleCase(key || level);
}

export function formatPriority(priority) {
  if (typeof priority === 'number' && Number.isFinite(priority)) {
    return `Keutamaan ${priority}`;
  }
  const key = normalizeKey(priority);
  if (PRIORITY_LABELS[key]) return PRIORITY_LABELS[key];
  return toTitleCase(key || priority);
}

export function formatDataConfidence(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number' && Number.isFinite(value)) return `${Math.round(value)}%`;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return `${Math.round(numeric)}%`;
  const key = normalizeKey(value);
  if (key === 'high') return 'Tinggi';
  if (key === 'medium') return 'Sederhana';
  if (key === 'low') return 'Rendah';
  return toTitleCase(key || value);
}

export function formatActivityStatus(percent) {
  const value = Number(percent);
  if (!Number.isFinite(value)) return 'Aktif';
  if (value >= 100) return 'Selesai';
  if (value >= 70) return 'Betul';
  if (value >= 50) return 'Cuba Lagi';
  return 'Perlu Latihan';
}

export function formatStudyMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return '0s';
  if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))}s`;
  if (minutes < 60) {
    const whole = Math.floor(minutes);
    const remainingSeconds = Math.round((minutes - whole) * 60);
    return remainingSeconds ? `${whole}m ${remainingSeconds}s` : `${whole}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes ? `${hours}j ${remainingMinutes}m` : `${hours}j`;
}

export function formatDisplayLabel(value) {
  return toTitleCase(value);
}
