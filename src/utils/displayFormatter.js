const SUBJECT_LABELS = {
  bm: 'Bahasa Melayu',
  'bahasa melayu': 'Bahasa Melayu',
  'bm bertutur 2': 'Bertutur Bahasa Melayu Tahun 2',
  bm_bertutur_2: 'Bertutur Bahasa Melayu Tahun 2',
  math: 'Matematik',
  matematik: 'Matematik',
  english: 'Bahasa Inggeris',
  'bahasa inggeris': 'Bahasa Inggeris',
  'english year 2': 'Bahasa Inggeris Tahun 2',
  sains: 'Sains',
  science: 'Sains',
  islam: 'Pendidikan Islam',
  'pendidikan islam': 'Pendidikan Islam',
  arab: 'Bahasa Arab',
  'bahasa arab': 'Bahasa Arab',
  pj: 'Pendidikan Jasmani dan Kesihatan',
  pjk: 'Pendidikan Jasmani dan Kesihatan',
  'pendidikan jasmani dan kesihatan': 'Pendidikan Jasmani dan Kesihatan'
};

const TOPIC_LABELS = {
  asas: 'Asas',
  nombor_asas: 'Asas Nombor',
  bacaan_asas: 'Bacaan Asas',
  kata_nama_am: 'Kata Nama Am',
  kata_nama_khas: 'Kata Nama Khas',
  kata_ganti_nama: 'Kata Ganti Nama',
  kata_kerja: 'Kata Kerja',
  kata_adjektif: 'Kata Adjektif',
  kata_sendi: 'Kata Sendi Nama',
  kata_sendi_nama: 'Kata Sendi Nama',
  kata_hubung: 'Kata Hubung',
  penjodoh_bilangan: 'Penjodoh Bilangan',
  simpulan_bahasa: 'Simpulan Bahasa',
  ayat: 'Ayat',
  uasa_kbat: 'Pentaksiran Sumatif & KBAT',
  simple_sentences: 'Ayat Mudah',
  reading_comprehension: 'Kefahaman Bacaan',
  reading: 'Bacaan',
  bm_intro: 'Pengenalan Bahasa Melayu',
  'bm intro': 'Pengenalan Bahasa Melayu',
  nouns: 'Kata Nama',
  verbs: 'Kata Kerja',
  adjectives: 'Kata Adjektif',
  prepositions: 'Kata Sendi Nama',
  nombor_hingga_1000: 'Nombor Hingga 1000'
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
  urgent: 'Mendesak',
  normal: 'Sederhana'
};

const RECOMMENDATION_LABELS = {
  review: 'Ulang Kaji',
  normal_practice: 'Teruskan Latihan',
  increase_difficulty: 'Tahap Seterusnya'
};

const MODE_LABELS = {
  uasa: 'Pentaksiran Sumatif',
  review: 'Ulang Kaji',
  adaptive: 'Latihan Adaptif',
  'adaptive-practice': 'Latihan Adaptif',
  'adaptive-lesson': 'Laluan Belajar',
  quiz: 'Latihan',
  reading: 'Bacaan',
  listening: 'Mendengar',
  speaking: 'Bertutur',
  writing: 'Menulis'
};

const YEAR_LABELS = {
  'year 2': 'Tahun 2',
  'tahun 2': 'Tahun 2'
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

function normalizeDisplayKey(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
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
  const raw = normalizeName(subjectId);
  if (/^adaptive(?:\s+practice)?$/i.test(raw) || /^adaptive\s+adaptive/i.test(raw)) return 'Latihan AI';
  if (raw === '-') return '-';
  const key = normalizeKey(raw);
  const displayKey = normalizeDisplayKey(raw);
  if (SUBJECT_LABELS[key]) return SUBJECT_LABELS[key];
  if (SUBJECT_LABELS[displayKey]) return SUBJECT_LABELS[displayKey];
  if (/^english(?:\s+year\s+2)?$/i.test(displayKey)) return displayKey.includes('year 2') ? 'Bahasa Inggeris Tahun 2' : 'Bahasa Inggeris';
  if (/^math(?:\s+year\s+2)?$/i.test(displayKey)) return displayKey.includes('year 2') ? 'Matematik Tahun 2' : 'Matematik';
  if (/^sains(?:\s+tahun\s+2)?$/i.test(displayKey) || /^science(?:\s+year\s+2)?$/i.test(displayKey)) return displayKey.includes('year 2') ? 'Sains Tahun 2' : 'Sains';
  if (/^arab(?:\s+year\s+2)?$/i.test(displayKey)) return displayKey.includes('year 2') ? 'Bahasa Arab Tahun 2' : 'Bahasa Arab';
  if (/^islam(?:\s+year\s+2)?$/i.test(displayKey)) return displayKey.includes('year 2') ? 'Pendidikan Islam Tahun 2' : 'Pendidikan Islam';
  if (/^pjk?(?:\s+year\s+2)?$/i.test(displayKey)) return displayKey.includes('year 2') ? 'Pendidikan Jasmani dan Kesihatan Tahun 2' : 'Pendidikan Jasmani dan Kesihatan';
  return toTitleCase(displayKey || key || raw);
}

const PLACEHOLDER_STUDENT_NAMES = new Set(['murid', 'demo murid', 'anak', 'student']);

export function isPlaceholderStudentName(value) {
  return PLACEHOLDER_STUDENT_NAMES.has(normalizeName(value).toLowerCase());
}

export function getStudentDisplayName(profile = null, fallback = 'Murid') {
  const profiles = Array.isArray(profile) ? profile : [profile];
  const candidates = profiles.flatMap(item => [
    item?.name,
    item?.display_name,
    item?.studentName,
    item?.user?.user_metadata?.display_name
  ]);
  const meaningful = candidates
    .map(normalizeName)
    .find(name => name && !isPlaceholderStudentName(name));
  return meaningful || normalizeName(fallback) || 'Murid';
}

export function formatTopicName(topicId, options = {}) {
  const raw = normalizeName(topicId);
  if (/adaptive/i.test(raw) && (looksInternalIdentifier(raw) || /\d{5,}/.test(raw))) return 'Latihan Adaptif';
  if (/^adaptive(?:\s+adaptive)?(?:\s+practice)?(?:\s+\d+)?(?:\s+[a-z0-9]+)?$/i.test(raw)) return 'Latihan Adaptif';
  if (raw === '-') return '-';
  const key = normalizeKey(raw);
  const displayKey = normalizeDisplayKey(raw);
  const subjectKey = normalizeDisplayKey(options.subjectId || options.subject || '');
  if ((key === 'bm_intro' || displayKey === 'bm intro') && /bertutur/.test(subjectKey)) return 'Pengenalan Bertutur';
  if ((key === 'intro' || displayKey === 'intro') && /bertutur/.test(subjectKey)) return 'Pengenalan Bertutur';
  if (TOPIC_LABELS[key]) return TOPIC_LABELS[key];
  if (TOPIC_LABELS[displayKey]) return TOPIC_LABELS[displayKey];
  if (key === 'nouns') return 'Kata Nama';
  if (key === 'math') return 'Matematik';
  return toTitleCase(displayKey || key || raw);
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
  const numeric = Number(priority);
  if (Number.isFinite(numeric)) {
    if (numeric >= 70) return 'Tinggi';
    if (numeric >= 40) return 'Sederhana';
    return 'Rendah';
  }
  const key = normalizeKey(priority);
  if (PRIORITY_LABELS[key]) return PRIORITY_LABELS[key];
  return toTitleCase(key || priority);
}

export function formatRecommendationKey(value) {
  const key = normalizeKey(value);
  if (RECOMMENDATION_LABELS[key]) return RECOMMENDATION_LABELS[key];
  return toTitleCase(key || value);
}

export function formatModeName(value) {
  if (normalizeName(value) === '-') return '-';
  const key = normalizeKey(value);
  const displayKey = normalizeDisplayKey(value);
  if (MODE_LABELS[key]) return MODE_LABELS[key];
  if (displayKey.includes('adaptive')) return 'Latihan Adaptif';
  if (displayKey.includes('review')) return 'Ulang Kaji';
  if (displayKey.includes('uasa')) return 'Pentaksiran Sumatif';
  return toTitleCase(displayKey || key || value);
}

export function formatModeLabel(value) {
  return formatModeName(value);
}

export function formatDurationLabel(value) {
  const minutes = Math.max(0, Math.min(60, Number(value) || 0));
  if (minutes >= 60) return '1 jam';
  return `${minutes} minit`;
}

export function formatDuration(value, options = {}) {
  const unit = options.unit === 'seconds' ? 'seconds' : 'minutes';
  const raw = Number(value);
  const totalSeconds = unit === 'seconds' ? raw : raw * 60;
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return options.emptyLabel || 'Belum ada masa belajar direkodkan';
  }
  if (totalSeconds < 60) return 'Kurang daripada 1 minit';
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} minit`;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (!remainingMinutes) return `${hours} jam`;
  return `${hours} jam ${remainingMinutes} minit`;
}

export function formatPlannerBoolean(label, value) {
  return `${label}: ${value ? 'Ya' : 'Tidak'}`;
}

export function formatFallbackState(value) {
  return `Mod pengganti: ${value ? 'Aktif' : 'Tidak Aktif'}`;
}

export function formatStreakLabel(value) {
  const count = Math.max(0, Number(value) || 0);
  return `Streak: ${count} hari`;
}

export function formatSubjectYearLabel(subjectId, yearLabel = 'Tahun 2') {
  const normalizedYear = YEAR_LABELS[normalizeDisplayKey(yearLabel)] || yearLabel;
  const subjectLabel = formatSubjectName(subjectId);
  if (!normalizedYear) return subjectLabel;
  if (subjectLabel.toLowerCase().includes(String(normalizedYear).toLowerCase())) return subjectLabel;
  return `${subjectLabel} ${normalizedYear}`.trim();
}

export function isCrossSubjectTarget(currentSubjectId, targetSubjectId) {
  const current = normalizeKey(currentSubjectId);
  const target = normalizeKey(targetSubjectId);
  return Boolean(current && target && current !== target);
}

export function formatPlannerSummaryLabel(label, value) {
  if (/masa/i.test(label)) return formatDurationLabel(value);
  return `${value}`;
}

export function formatSubjectList(subjects = []) {
  const unique = [...new Set((Array.isArray(subjects) ? subjects : []).map(item => formatSubjectName(item)).filter(Boolean))];
  return unique.join(', ');
}

export function formatReviewQueueMeta(item = {}) {
  const priorityText = `Keutamaan ${formatPriority(item.priority)}`;
  if (item.isOverdue) {
    const overdueDays = Math.max(1, Number(item.overdueDays) || 1);
    return `Lewat ${overdueDays} hari · ${priorityText}`;
  }
  const relative = formatFriendlyDate(item.nextReviewAt || item.date || item.nextReview || '');
  return `${relative} · ${priorityText}`;
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

export function formatStudyMinutes(value, options = {}) {
  return formatDuration(value, { unit: 'minutes', ...options });
}

export function formatDisplayLabel(value) {
  return toTitleCase(value);
}

export function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function formatFriendlyDate(value, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tarikh tidak diketahui';
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const target = new Date(date); target.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86400000);
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Esok';
  if (days === -1) return 'Semalam';
  if (days > 1 && days <= 30) return `${days} hari lagi`;
  if (days < -1 && days >= -30) return `Lewat ${Math.abs(days)} hari`;
  return new Intl.DateTimeFormat('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatResumeTitle(resume = {}) {
  return formatModeName(resume?.metadata?.displayTitle || resume?.mode || 'quiz');
}

export function formatRecommendationCta(input = {}) {
  if (input.resume && input.resume.completed === false) return 'Sambung Latihan';
  if (input.isIncompleteSession) return 'Sambung Latihan';

  const subjectLabel = formatSubjectName(input.subjectId || input.targetSubjectId || '');
  if (input.isCrossSubject && subjectLabel) {
    return `Mula ${subjectLabel}`;
  }

  const normalizedReason = normalizeDisplayKey(input.reasonKey || input.reason || '');
  const normalizedRecommendation = normalizeDisplayKey(input.recommendationKey || '');
  const isNewTopic = Boolean(
    input.isNewTopic
    || normalizedReason === 'new topic'
    || normalizedReason === 'new-topic'
    || /cuba topik baharu|topik baharu/.test(normalizedReason)
  );
  const isReview = Boolean(
    input.isReview
    || normalizedRecommendation === 'review'
    || normalizedReason === 'weak topic'
    || normalizedReason === 'weak-topic'
    || /ulang|review|topik lemah|perlu latihan/.test(normalizedReason)
  );

  if (isNewTopic) return 'Mula Latihan';
  if (isReview) return 'Latih Semula';
  return input.defaultLabel || 'Mula Latihan';
}

export function formatScopeLabel(value) {
  const text = normalizeName(value);
  if (!text) return 'Keseluruhan';
  const match = text.match(/^Subjek dipilih:\s*(.+)$/i);
  if (match) return `Subjek dipilih: ${formatSubjectName(match[1])}`;
  if (/^keseluruhan$/i.test(text)) return 'Keseluruhan';
  return text
    .replace(/English Year 2/gi, 'Bahasa Inggeris Tahun 2')
    .replace(/BM Bertutur 2/gi, 'Bertutur Bahasa Melayu Tahun 2')
    .replace(/Bm Intro/gi, 'Pengenalan Bertutur');
}
