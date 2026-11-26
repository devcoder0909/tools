import { useState } from 'preact/hooks';
import { calculateTimeCard, formatDecimalHours, formatHoursMinutes, type ShiftInput } from '../utils/time-card';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const inputClass = 'mt-1 block min-w-0 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-base text-slate-900';

export default function TimeCardCalculator() {
  const [rows, setRows] = useState<ShiftInput[]>(() =>
    days.map(() => ({ start: '', end: '', breakMinutes: '', nextDay: false }))
  );
  const card = calculateTimeCard(rows);
  const update = (index: number, patch: Partial<ShiftInput>) => {
    setRows(current => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  };

  return (
    <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="time-card-heading">
      <h2 id="time-card-heading" class="text-xl font-bold text-slate-900">Weekly time card</h2>
      <p class="mt-1 text-sm text-slate-600">Enter each shift on the day it starts. Leave days off blank and enter unpaid breaks in minutes.</p>
      <div class="mt-4 space-y-4">
        {rows.map((row, i) => {
          const day = days[i];
          const result = card.shifts[i];
          const errorId = result.status === 'invalid' ? 'shift-error-' + i : undefined;
          return (
            <fieldset key={day} class="min-w-0 rounded-lg border border-slate-200 px-3 pb-3">
              <legend class="px-1 text-sm font-bold text-slate-900">{day}</legend>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label class="min-w-0 text-sm font-medium">Clock in
                  <input class={inputClass} type="time" aria-label={day + ' clock in'} aria-describedby={errorId}
                    value={row.start} onInput={e => update(i, { start: e.currentTarget.value })} />
                </label>
                <label class="min-w-0 text-sm font-medium">Clock out
                  <input class={inputClass} type="time" aria-label={day + ' clock out'} aria-describedby={errorId}
                    value={row.end} onInput={e => update(i, { end: e.currentTarget.value })} />
                </label>
                <label class="min-w-0 text-sm font-medium">Unpaid break (min)
                  <input class={inputClass} type="text" inputMode="numeric" aria-label={day + ' unpaid break in minutes'} aria-describedby={errorId}
                    placeholder="0" value={row.breakMinutes} onInput={e => update(i, { breakMinutes: e.currentTarget.value })} />
                </label>
              </div>
              <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <label class="inline-flex items-center gap-2 py-1"><input type="checkbox" checked={row.nextDay} aria-label={day + ' ends next day'}
                  onChange={e => update(i, { nextDay: e.currentTarget.checked })} />Ends next day</label>
                {result.status === 'valid' && <output class="font-semibold text-emerald-800">{formatHoursMinutes(result.minutes)} worked</output>}
              </div>
              {result.status === 'invalid' && <p id={errorId} class="mt-1 text-sm text-red-800">{result.message}</p>}
            </fieldset>
          );
        })}
      </div>
      <div aria-live="polite" aria-atomic="true" class="mt-4 rounded-lg bg-emerald-50 p-4">
        <h3 class="font-bold text-emerald-950">{card.invalidCount ? 'Subtotal of complete shifts' : 'Weekly total'}</h3>
        <p class="text-lg text-emerald-950"><strong>{formatHoursMinutes(card.totalMinutes)}</strong> (hours:minutes) · {formatDecimalHours(card.totalMinutes)} decimal hours</p>
        {card.invalidCount > 0 && <p class="mt-1 text-sm text-slate-700">Check the marked shifts to complete your weekly total.</p>}
      </div>
    </section>
  );
}
