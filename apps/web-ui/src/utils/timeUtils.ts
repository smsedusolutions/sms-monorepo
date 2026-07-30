import type { TimeFormat } from '../stores/timeSettingsStore';

/**
 * Formats a single time string (e.g. "14:30" or "09:15") or range (e.g. "09:15 - 10:00")
 * according to the active TimeFormat preference ('12h' | '24h').
 */
export function formatSingleTime(timeStr: string, timeFormat: TimeFormat): string {
  if (!timeStr) return '';
  
  // Clean string
  const clean = timeStr.trim();
  
  // Match "HH:MM" or "HH:MM:SS"
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/i);
  if (!match) {
    // Try parsing as ISO date or Date string
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      return formatHourMinute(hours, minutes, timeFormat);
    }
    return timeStr;
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3]?.toUpperCase();

  if (ampm) {
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }

  return formatHourMinute(hours, parseInt(minutes, 10), timeFormat);
}

function formatHourMinute(hours: number, minutes: number, timeFormat: TimeFormat): string {
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  
  if (timeFormat === '24h') {
    const hrStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hrStr}:${minStr}`;
  }

  // 12-hour format with AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;

  return `${h12}:${minStr} ${period}`;
}

/**
 * Formats time string or range (e.g. "09:15 - 10:00") into 12h/24h format.
 */
export function formatTimeDisplay(timeRangeOrSingle: string, timeFormat: TimeFormat): string {
  if (!timeRangeOrSingle) return '';

  if (timeRangeOrSingle.includes(' - ')) {
    const parts = timeRangeOrSingle.split(' - ');
    return `${formatSingleTime(parts[0], timeFormat)} - ${formatSingleTime(parts[1], timeFormat)}`;
  }

  return formatSingleTime(timeRangeOrSingle, timeFormat);
}
