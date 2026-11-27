import { useState } from 'preact/hooks';
import { requiredFinalGrade, requiredFinalPoints } from '../utils/final-grade';

const fields = [
  { key: 'current', label: 'Current grade (%)', hint: 'Your course average before the final exam.' },
  { key: 'target', label: 'Desired course grade (%)', hint: 'The overall percentage you want to earn.' },
  { key: 'weight', label: 'Final exam weight (%)', hint: 'The share of the course grade assigned to this exam.' },
] as const;

export default function FinalGradeCalculator() {
  const [values, setValues] = useState({ current: '', target: '', weight: '' });
  const [pointsMode, setPointsMode] = useState(false);
  const [points, setPoints] = useState({ earned: '', possible: '', exam: '' });
  const errors = fields.map(({ key }) => {
    const raw = values[key].trim();
    if (!raw) return '';
    const number = Number(raw);
    if (!/^(?:\d+|\d*\.\d{1,2})$/.test(raw) || number > 100 || (key === 'weight' && number <= 0)) {
      return key === 'weight' ? 'Use a weight above 0 and up to 100, with at most two decimal places.' : 'Use 0 to 100, with at most two decimal places.';
    }
    return '';
  });
  const ready = fields.every(({ key }, index) => values[key].trim() !== '' && !errors[index]);
  const required = ready ? requiredFinalGrade(Number(values.current), Number(values.target), Number(values.weight)) : null;
  const pointsValid = Object.values(points).every(v => /^\d+$/.test(v) && Number(v) <= 1000000)
    && Number(points.possible) > 0 && Number(points.exam) > 0 && Number(points.earned) <= Number(points.possible);
  const minimum = pointsValid && values.target && !errors[1]
    ? requiredFinalPoints(Number(points.earned), Number(points.possible), Number(points.exam), Number(values.target)) : null;

  return (
    <section aria-labelledby="final-grade-heading" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 id="final-grade-heading" class="text-xl font-bold text-slate-900">What do I need on my final?</h2>
      <label class="mt-4 block">Course grading method
        <select class="ml-2 rounded border p-2" value={pointsMode ? 'points' : 'weight'} onChange={e => setPointsMode(e.currentTarget.value === 'points')}>
          <option value="weight">Weighted final</option><option value="points">Total points</option>
        </select>
      </label>
      <div class="mt-4 grid gap-4 sm:grid-cols-3">
        {pointsMode && (['earned', 'possible', 'exam'] as const).map((key, index) => <label key={key}>
          {['Points earned before final', 'Points possible before final', 'Final exam points possible'][index]}
          <input type="text" inputMode="numeric" class="my-1 w-full rounded-lg border px-3 py-2" value={points[key]}
            onInput={e => setPoints({ ...points, [key]: e.currentTarget.value })} />
        </label>)}
        {fields.map(({ key, label, hint }, index) => (!pointsMode || key === 'target') && (
          <div key={key} class="min-w-0">
            <label for={'final-' + key} class="block text-sm font-semibold">{label}</label>
            <input id={'final-' + key} type="text" inputMode="decimal" value={values[key]}
              aria-describedby={'final-hint-' + key + (errors[index] ? ' final-error-' + key : '')}
              aria-invalid={Boolean(errors[index])}
              onInput={event => setValues({ ...values, [key]: event.currentTarget.value })}
              class="my-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-emerald-600" />
            <p id={'final-hint-' + key} class="text-sm text-slate-600">{hint}</p>
            {errors[index] && <p id={'final-error-' + key} class="mt-1 text-sm text-red-800">{errors[index]}</p>}
          </div>
        ))}
      </div>
      <div aria-live="polite" aria-atomic="true" class="mt-5 rounded-lg bg-emerald-50 p-4">
        <h3 class="font-semibold text-emerald-950">Minimum final exam score</h3>
        {pointsMode ? <p>{minimum === null
          ? 'Enter your target and whole points up to 1,000,000. Earned points must be within the possible points, and both possible totals must be positive.'
          : minimum > Number(points.exam) ? `You need ${minimum} points, more than the ${points.exam} available.`
          : `You need ${Math.max(0, minimum)} of ${points.exam} points on the final.`}</p> :
          required === null ? <p>Enter all three percentages to see the score you need.</p> :
          required <= 0 ? <p><strong>0.00%</strong> — your current average already secures your target under these weights.</p> :
          required > 100 ? <p>Reaching your target would require more than 100% on the final.</p> :
          <p><strong class="text-2xl text-emerald-950">{required.toFixed(2)}%</strong> or higher on the final.</p>}
      </div>
    </section>
  );
}
