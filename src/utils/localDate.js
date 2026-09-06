export const PRODUCT_TIME_ZONE = 'Asia/Kuala_Lumpur';
const PRODUCT_TIME_ZONE_OFFSET = '+08:00';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validDateKey(value) {
  const text = String(value || '').trim();
  if (!DATE_KEY_PATTERN.test(text)) return '';
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : '';
}

export function getLocalDateKey(value = new Date(), timeZone = PRODUCT_TIME_ZONE) {
  if (value === null || value === '') return '';
  const storedDateKey = validDateKey(value);
  if (storedDateKey) return storedDateKey;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return '';
  }
}

export function addLocalDateKeyDays(value, days = 0) {
  const dateKey = getLocalDateKey(value);
  if (!dateKey) return '';
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Math.trunc(Number(days) || 0));
  return date.toISOString().slice(0, 10);
}

export function getCalendarDayDifference(start, end) {
  const startKey = getLocalDateKey(start);
  const endKey = getLocalDateKey(end);
  if (!startKey || !endKey) return 0;
  return Math.round((Date.parse(`${endKey}T00:00:00Z`) - Date.parse(`${startKey}T00:00:00Z`)) / 86400000);
}

export function getLocalDayBounds(value = new Date()) {
  const dateKey = getLocalDateKey(value);
  if (!dateKey) return null;
  return {
    dateKey,
    start: new Date(`${dateKey}T00:00:00${PRODUCT_TIME_ZONE_OFFSET}`),
    end: new Date(`${dateKey}T23:59:59.999${PRODUCT_TIME_ZONE_OFFSET}`)
  };
}
