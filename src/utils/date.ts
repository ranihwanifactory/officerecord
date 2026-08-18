/**
 * Date utility helpers for reliable local timezone calculations.
 * Avoids UTC day-shift bugs caused by .toISOString().
 */

/**
 * Returns the date in 'YYYY-MM-DD' format based on local browser timezone.
 */
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns 'YYYY-MM' format for month filtering.
 */
export function getYearMonthString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parses 'YYYY-MM-DD' into a local Date object.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
}

/**
 * Masks the last 6 digits of a Korean Resident Registration Number (RRN / 주민등록번호).
 * e.g., "700402-1476611" -> "700402-1******"
 */
export function maskResidentId(id?: string): string {
  if (!id) return '';
  const clean = id.trim();
  if (!clean) return '';

  // Already masked
  if (clean.endsWith('******')) {
    return clean;
  }

  // Format with hyphen
  if (clean.includes('-')) {
    const parts = clean.split('-');
    const front = parts[0].trim();
    const back = parts[1]?.trim() || '';
    if (back.length > 0) {
      const genderDigit = back.charAt(0);
      return `${front}-${genderDigit}******`;
    }
    return clean;
  }

  // Continuous numeric string (13 digits or at least 7 digits)
  const digitsOnly = clean.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 7) {
    const front = digitsOnly.substring(0, 6);
    const back = digitsOnly.substring(6);
    const genderDigit = back.charAt(0);
    return `${front}-${genderDigit}******`;
  }

  return clean;
}

/**
 * Calculates the next day's date string.
 * Supports 'YYYY-MM-DD', 'YYYY-M-D', 'MM월 DD일', 'M월 D일', etc.
 */
export function getNextDateString(currentDateStr?: string, fallbackDateStr: string = ''): string {
  const base = (currentDateStr || fallbackDateStr || getTodayDateString()).trim();
  if (!base) return getTodayDateString();

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = base.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const dateObj = new Date(y, m, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }

  // Pattern 2: MM월 DD일 or M월 D일
  const mdMatch = base.match(/^(\d{1,2})월\s*(\d{1,2})일$/);
  if (mdMatch) {
    const currentYear = new Date().getFullYear();
    const m = parseInt(mdMatch[1], 10) - 1;
    const d = parseInt(mdMatch[2], 10);
    const dateObj = new Date(currentYear, m, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    return `${nm}월 ${nd}일`;
  }

  // Pattern 3: General local date parsing
  const parsed = parseLocalDate(base);
  if (!isNaN(parsed.getTime())) {
    parsed.setDate(parsed.getDate() + 1);
    const ny = parsed.getFullYear();
    const nm = String(parsed.getMonth() + 1).padStart(2, '0');
    const nd = String(parsed.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }

  return base;
}
