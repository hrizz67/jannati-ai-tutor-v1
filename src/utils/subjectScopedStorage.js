export function subjectScopedKey(subjectId = 'unknown', year = 'Tahun 2', section = 'state') {
  const safe = value => String(value || 'unknown').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
  return `jannati:${safe(year)}:${safe(subjectId)}:${safe(section)}`;
}

export function readSubjectScoped(subjectId, year, section, fallback = null) {
  try {
    const raw = localStorage.getItem(subjectScopedKey(subjectId, year, section));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeSubjectScoped(subjectId, year, section, value) {
  try {
    localStorage.setItem(subjectScopedKey(subjectId, year, section), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearSubjectScoped(subjectId, year, section) {
  try { localStorage.removeItem(subjectScopedKey(subjectId, year, section)); } catch { /* storage unavailable */ }
}

export default { subjectScopedKey, readSubjectScoped, writeSubjectScoped, clearSubjectScoped };
