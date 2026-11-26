import { getObservedHolidayDates, US_WORKDAY_YEARS } from './us-workdays';

const dayMs = 86_400_000;

function calendarDate(value: string) {
  const match = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function countDateRange(startValue: string, endValue: string, includeEnd: boolean) {
  const start = calendarDate(startValue);
  const end = calendarDate(endValue);
  if (!start || !end) return null;
  const [first, last] = start <= end ? [start, end] : [end, start];
  const totalDays = (last.getTime() - first.getTime()) / dayMs + Number(includeEnd);
  const weeks = Math.floor(totalDays / 7);
  const remDays = totalDays % 7;
  let weekdays = weeks * 5;
  for (let offset = 0; offset < remDays; offset++) {
    const day = (first.getUTCDay() + offset) % 7;
    if (day > 0 && day < 6) weekdays++;
  }
  let federalWorkdays: number | null = null;
  if (first.getUTCFullYear() >= US_WORKDAY_YEARS[0] && last.getUTCFullYear() <= US_WORKDAY_YEARS[US_WORKDAY_YEARS.length - 1]) {
    const firstDate = first.toISOString().slice(0, 10);
    const lastDate = last.toISOString().slice(0, 10);
    const holidays = getObservedHolidayDates().filter(date =>
      date >= firstDate && (includeEnd ? date <= lastDate : date < lastDate));
    federalWorkdays = weekdays - holidays.length;
  }
  return { totalDays, weeks, remDays, weekdays, weekends: totalDays - weekdays, federalWorkdays };
}
