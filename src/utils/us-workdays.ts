export const US_WORKDAY_YEARS = [2026, 2027] as const;

// OPM observed dates for employees with Monday–Friday schedules.
// https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/
const observedHolidays: Record<string, string> = {
  '2026-01-01': "New Year's Day",
  '2026-01-19': 'Martin Luther King Jr. Day',
  '2026-02-16': "Washington's Birthday",
  '2026-05-25': 'Memorial Day',
  '2026-06-19': 'Juneteenth',
  '2026-07-03': 'Independence Day (observed)',
  '2026-09-07': 'Labor Day',
  '2026-10-12': 'Columbus Day',
  '2026-11-11': 'Veterans Day',
  '2026-11-26': 'Thanksgiving Day',
  '2026-12-25': 'Christmas Day',
  '2027-01-01': "New Year's Day",
  '2027-01-18': 'Martin Luther King Jr. Day',
  '2027-02-15': "Washington's Birthday",
  '2027-05-31': 'Memorial Day',
  '2027-06-18': 'Juneteenth (observed)',
  '2027-07-05': 'Independence Day (observed)',
  '2027-09-06': 'Labor Day',
  '2027-10-11': 'Columbus Day',
  '2027-11-11': 'Veterans Day',
  '2027-11-25': 'Thanksgiving Day',
  '2027-12-24': 'Christmas Day (observed)',
  '2027-12-31': "New Year's Day 2028 (observed)",
};

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' });

export function getObservedHolidayDates() {
  return Object.keys(observedHolidays);
}

export function getUsWorkdayMonths(year: number) {
  if (!US_WORKDAY_YEARS.some(available => available === year)) {
    throw new RangeError('US workday schedules cover 2026 and 2027.');
  }
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const date = new Date(Date.UTC(year, monthIndex, 1));
    const monthName = monthFormatter.format(date);
    let weekdays = 0;
    const holidays: { date: string; name: string }[] = [];
    while (date.getUTCMonth() === monthIndex) {
      const day = date.getUTCDay();
      if (day > 0 && day < 6) {
        weekdays++;
        const isoDate = date.toISOString().slice(0, 10);
        const name = observedHolidays[isoDate];
        if (name) holidays.push({ date: isoDate, name });
      }
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return { month: monthIndex + 1, monthName, weekdays, holidays, workdays: weekdays - holidays.length };
  });
}
