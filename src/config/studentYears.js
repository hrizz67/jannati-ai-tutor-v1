export const SUPPORTED_STUDENT_YEARS = Object.freeze(['Tahun 2']);
export const DEFAULT_STUDENT_YEAR = SUPPORTED_STUDENT_YEARS[0];

export function isSupportedStudentYear(year) {
  return SUPPORTED_STUDENT_YEARS.includes(String(year || '').trim());
}

export function normalizeSupportedStudentYear(year) {
  const value = String(year || '').trim();
  return isSupportedStudentYear(value) ? value : DEFAULT_STUDENT_YEAR;
}

export function getStudentYearSupportLabel(year) {
  const historicalYear = String(year || '').trim() || DEFAULT_STUDENT_YEAR;
  return isSupportedStudentYear(historicalYear)
    ? historicalYear
    : `${historicalYear} · kandungan ${DEFAULT_STUDENT_YEAR} sahaja`;
}
