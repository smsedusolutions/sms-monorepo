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

/**
 * Formats a 24-hour time string (e.g. "08:00", "16:00", "08:30") into compact 12-hour AM/PM format (e.g. "8 AM", "4 PM", "8:30 AM").
 */
export function format12HourCompact(timeStr: string): string {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours)) return timeStr;

  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const minStr = minutes > 0 ? `:${minutes < 10 ? '0' + minutes : minutes}` : '';
  return `${hours}${minStr} ${period}`;
}

/**
 * Formats start and end working hours into 12-hour format string (e.g. "8 AM - 4 PM").
 */
export function formatWorkingHoursRange(start?: string, end?: string): string {
  if (!start || !end) return 'N/A';
  return `${format12HourCompact(start)} - ${format12HourCompact(end)}`;
}

/**
 * Checks if current time is within school working hours.
 */
export function checkIsWithinWorkingHours(startStr = '08:00', endStr = '16:00'): { isWithin: boolean; formattedRange: string } {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTimeStr = (t: string, defaultH: number, defaultM: number) => {
    if (!t) return defaultH * 60 + defaultM;
    const match = t.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    // Fallback
    const parts = t.split(':');
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    if (isNaN(h)) h = defaultH;
    if (isNaN(m)) m = defaultM;
    return h * 60 + m;
  };

  const startMinutes = parseTimeStr(startStr, 8, 0);
  const endMinutes = parseTimeStr(endStr, 16, 0);

  const isWithin = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  const formattedRange = formatWorkingHoursRange(startStr, endStr);

  return { isWithin, formattedRange };
}

/**
 * Checks if a teacher object or status indicates that the teacher is checked in today.
 */
export function checkIsTeacherCheckedIn(attendanceStatus: any): boolean {
  if (!attendanceStatus) return false;
  if (typeof attendanceStatus === 'object' && 'checkedIn' in attendanceStatus) {
    return !!attendanceStatus.checkedIn;
  }
  const isPresent = 'status' in attendanceStatus && ['present', 'late', 'half_day'].includes(attendanceStatus.status);
  const hasCheckInTime = 'checkInTime' in attendanceStatus && !!attendanceStatus.checkInTime;
  return isPresent || hasCheckInTime;
}
