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

/**
 * Returns total days in given year and month (1-based month, 1..12).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns next year and month for 1-based month.
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month >= 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Returns previous year and month for 1-based month.
 */
export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month <= 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Formats YYYY-MM-DD into "YYYY년 MM월 DD일"
 */
export function formatDateKorean(dStr?: string): string {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
  }
  return dStr;
}

/**
 * Formats YYYY-MM-DD into "M/D" (e.g., "8/31")
 */
export function formatShortDate(dStr?: string): string {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
  }
  return dStr;
}

/**
 * Returns an array of date strings 'YYYY-MM-DD' from start to end (inclusive).
 * Safe limit up to 90 days.
 */
export function getDateRangeList(startDateStr: string, endDateStr: string): string[] {
  if (!startDateStr || !endDateStr) return [];
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [startDateStr];
  }

  const results: string[] = [];
  const curr = new Date(start);
  let count = 0;
  while (curr <= end && count < 90) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    results.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
    count++;
  }
  return results;
}

/**
 * Calculates Monday to Sunday range for the week containing baseDate.
 */
export function getMondayToSundayWeek(baseDateStr: string): { startDate: string; endDate: string } {
  const d = parseLocalDate(baseDateStr || getTodayDateString());
  // getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startDate: getTodayDateString(monday),
    endDate: getTodayDateString(sunday),
  };
}

/**
 * Formats a list of YYYY-MM-DD strings into a readable summary.
 * e.g., ['2026-08-30', '2026-08-31', '2026-09-01'] -> "8/30~9/1 (3일)"
 */
export function formatWorkDatesSummary(dates: string[]): string {
  if (!dates || dates.length === 0) return '';
  const sorted = [...dates].sort();
  if (sorted.length === 1) {
    return `${formatShortDate(sorted[0])} (1일)`;
  }
  return `${formatShortDate(sorted[0])}~${formatShortDate(sorted[sorted.length - 1])} (총 ${sorted.length}일)`;
}
