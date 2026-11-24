import { useState } from 'preact/hooks';

export default function BirthYearCalculator() {
  const [birthYear, setBirthYear] = useState('');
  const [targetYear, setTargetYear] = useState(() => String(new Date().getFullYear()));
  const years = [
    { label: 'Birth year', value: birthYear, set: setBirthYear },
    { label: 'Year to check', value: targetYear, set: setTargetYear },
  ];
  const complete = birthYear !== '' && targetYear !== '';
  const valid = years.every(({ value }) => /^\d{4}$/.test(value) && Number(value) > 0);
  const age = Number(targetYear) - Number(birthYear);
  let answer = '';
  if (complete) {
    if (!valid) answer = 'Enter both years as four digits, for example 1998 and 2026.';
    else if (age < 0) answer = 'The year to check is before the birth year.';
    else if (age === 0) answer = 'This is the birth year. From the date of birth through December 31, the age is 0 years.';
    else answer = `In ${targetYear}, someone born in ${birthYear} is ${age - 1} before their birthday and ${age} from their birthday onward.`;
  }
  return (
    <section id="age-by-year" aria-labelledby="age-by-year-heading" class="scroll-mt-20 rounded-xl border border-slate-200 p-4">
      <h2 id="age-by-year-heading" class="text-lg font-bold text-slate-900">Age by birth year</h2>
      <p class="mb-3 text-sm text-slate-600">Know only the year? Find the age someone turns in a past, present or future year.</p>
      <div class="grid grid-cols-2 gap-3">
        {years.map(({ label, value, set }) => (
          <label key={label} class="text-sm font-semibold text-slate-700">{label}
            <input type="text" inputMode="numeric" value={value}
              onInput={event => set(event.currentTarget.value)}
              class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base" />
          </label>
        ))}
      </div>
      <output aria-live="polite" class="block text-sm font-semibold text-emerald-800">{answer && <span class="mt-3 block">{answer}</span>}</output>
    </section>
  );
}
