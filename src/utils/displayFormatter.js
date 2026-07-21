const SUBJECT_LABELS = {
  bm: 'Bahasa Melayu',
  math: 'Matematik',
  english: 'Bahasa Inggeris',
  sains: 'Sains',
  science: 'Sains',
  islam: 'Pendidikan Islam',
  arab: 'Bahasa Arab',
  pj: 'Pendidikan Jasmani dan Kesihatan',
  pjk: 'Pendidikan Jasmani dan Kesihatan'
};

const TOPIC_LABELS = {
  kata_nama_am: 'Kata Nama Am',
  kata_nama_khas: 'Kata Nama Khas',
  kata_ganti_nama: 'Kata Ganti Nama',
  kata_kerja: 'Kata Kerja',
  kata_adjektif: 'Kata Adjektif',
  kata_sendi: 'Kata Sendi Nama',
  kata_hubung: 'Kata Hubung',
  penjodoh_bilangan: 'Penjodoh Bilangan',
  simpulan_bahasa: 'Simpulan Bahasa',
  ayat: 'Ayat'
};

const STATUS_LABELS = {
  NOT_STARTED: 'Belum Dimulakan',
  IN_PROGRESS: 'Sedang Dipelajari',
  MASTERED: 'Dikuasai',
  LEARNING: 'Sedang Dipelajari',
  NEEDS_PRACTICE: 'Perlu Latihan',
  insufficient_data: 'Belum Cukup Data',
  no_data: 'Belum Cukup Data',
  developing: 'Sedang Berkembang',
  advanced: 'Lanjutan',
  starter: 'Permulaan',
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
  needs_support: 'Perlu Sokongan',
  need_support: 'Perlu Sokongan',
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
  mastered: 'Dikuasai',
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

function normalizeName(value) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower === 'undefined' || lower === 'null') return '';
  return text;
}

function looksInternalIdentifier(value) {
  const text = normalizeName(String(value || ''));
  if (!text) return false;
  if (/^[a-f0-9]{8,}(-[a-f0-9]{4,}){2,}$/i.test(text)) return true;
  if (/^[a-z]+_[a-z0-9]+(?:_[a-z0-9]+)*(?:_\d+)?(?:_[a-z0-9]+)?$/i.test(text)) return true;
  if (/adaptive|uuid|storage|session|engine|react|key|cache|lesson|practice|generated/i.test(text)) return true;
  return /\d{5,}/.test(text);
}

function toReadableSlugLabel(value) {
  return toTitleCase(String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, match => match.toUpperCase()));
}

export function formatSubjectName(subjectId) {
  const key = normalizeKey(subjectId);
  if (SUBJECT_LABELS[key]) return SUBJECT_LABELS[key];
  return toTitleCase(key || subjectId);
}

export function getStudentDisplayName(profile = null, fallback = 'Murid') {
  const name = profile && typeof profile === 'object' ? normalizeName(profile.name) : '';
  return name || normalizeName(fallback) || 'Murid';
}

export function formatTopicName(topicId) {
  const key = normalizeKey(topicId);
  if (TOPIC_LABELS[key]) return TOPIC_LABELS[key];
  return toTitleCase(key || topicId);
}

export function getHumanReadableTopic({ subject = null, topic = null, question = null, metadata = null } = {}) {
  const subjectId = normalizeKey(subject?.id || subject?.subjectId || subject);
  const topicId = normalizeName(topic?.id || topic?.topicId || topic?.slug || topic?.key || topic?.name || topic?.title || metadata?.topicId || metadata?.topic || question?.topicId || question?.topic || question?.subjectTopic || '');
  const rawCandidates = [
    metadata?.displayName,
    metadata?.title,
    topic?.displayName,
    topic?.title,
    topic?.name,
    question?.topicTitle,
    question?.topicName,
    question?.topicLabel
  ].map(normalizeName).filter(Boolean);

  for (const candidate of rawCandidates) {
    if (!looksInternalIdentifier(candidate)) return candidate;
  }

  const candidate = topicId || normalizeName(metadata?.subjectTopic || metadata?.topicName || '', '');
  if (!candidate) return 'topik semasa';

  const lower = candidate.toLowerCase();
  if (/adaptive/.test(lower)) return 'Latihan Adaptif';

  if (subjectId === 'english') {
    if (/nouns?/.test(lower) && /common/.test(lower)) return 'Common Nouns';
    if (/nouns?/.test(lower) && /proper/.test(lower)) return 'Proper Nouns';
    if (/reading/.test(lower) && /comprehension/.test(lower)) return 'Reading Comprehension';
    if (/simple/.test(lower) && /sentence/.test(lower)) return 'Simple Sentences';
    if (/preposition/.test(lower)) return 'Prepositions';
    if (/verb/.test(lower)) return 'Verbs';
    if (/adjective/.test(lower)) return 'Adjectives';
  }

  if (subjectId === 'bm') {
    if (/kata[_\s-]?nama[_\s-]?khas/.test(lower)) return 'Kata Nama Khas';
    if (/kata[_\s-]?nama[_\s-]?am/.test(lower)) return 'Kata Nama Am';
    if (/kata[_\s-]?kerja/.test(lower)) return 'Kata Kerja';
    if (/kata[_\s-]?adjektif/.test(lower)) return 'Kata Adjektif';
    if (/kata[_\s-]?sendi/.test(lower)) return 'Kata Sendi Nama';
    if (/kata[_\s-]?hubung/.test(lower)) return 'Kata Hubung';
    if (/penjodoh[_\s-]?bilangan/.test(lower)) return 'Penjodoh Bilangan';
    if (/tatabahasa/.test(lower)) return 'Tatabahasa';
    if (/pemahaman/.test(lower) && /penulisan/.test(lower)) return 'Pemahaman dan Penulisan';
  }

  const readable = toReadableSlugLabel(candidate.replace(new RegExp(`^${subjectId}[_-]?`, 'i'), ''));
  return looksInternalIdentifier(candidate) ? (readable || 'topik semasa') : candidate;
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

export function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}
