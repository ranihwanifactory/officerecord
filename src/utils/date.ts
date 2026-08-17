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
