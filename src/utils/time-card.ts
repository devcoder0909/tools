export interface ShiftInput {
  start: string;
  end: string;
  breakMinutes: string;
  nextDay: boolean;
}

type ShiftResult =
  | { status: 'empty' }
  | { status: 'invalid'; message: string }
  | { status: 'valid'; minutes: number };

function clockMinutes(time: string) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function calculateShift(shift: ShiftInput): ShiftResult {
  const pause = shift.breakMinutes.trim();
  if (!shift.start && !shift.end && (!pause || pause === '0') && !shift.nextDay) return { status: 'empty' };
  const start = clockMinutes(shift.start);
  const end = clockMinutes(shift.end);
  if (start === null || end === null) return { status: 'invalid', message: 'Enter both clock times.' };
  const span = end - start + (shift.nextDay ? 1440 : 0);
  if (span <= 0) return { status: 'invalid', message: 'Check the end time or select next day.' };
  if (span > 1440) return { status: 'invalid', message: 'Split a shift longer than 24 hours into two rows.' };
  const deduction = Number(pause);
  if ((pause && !/^\d+$/.test(pause)) || deduction > span) {
    return { status: 'invalid', message: 'Use whole break minutes within the shift duration.' };
  }
  return { status: 'valid', minutes: span - deduction };
}

export function calculateTimeCard(inputs: ShiftInput[]) {
  const shifts = inputs.map(calculateShift);
  let totalMinutes = 0, validCount = 0, invalidCount = 0;
  for (const shift of shifts) {
    if (shift.status === 'valid') {
      totalMinutes += shift.minutes;
      validCount++;
    } else if (shift.status === 'invalid') invalidCount++;
  }
  return { shifts, totalMinutes, validCount, invalidCount };
}

export function formatHoursMinutes(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

export function formatDecimalHours(minutes: number) {
  return (minutes / 60).toFixed(2);
}
