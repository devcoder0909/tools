import { useState, useMemo } from 'preact/hooks';

interface CalculatorShellProps {
  toolId: string;
  toolName: string;
}

export default function CalculatorShell({ toolId, toolName: _toolName }: CalculatorShellProps) {
  // Percentage Calculator State
  const [percMode, setPercMode] = useState<'calc' | 'isWhat' | 'change'>('calc');
  const [pVal1, setPVal1] = useState<string>('15');
  const [pVal2, setPVal2] = useState<string>('250');

  // Age Calculator State
  const todayIso = new Date().toISOString().split('T')[0];
  const [birthDate, setBirthDate] = useState<string>('1998-05-15');
  const [targetDate, setTargetDate] = useState<string>(todayIso);

  // Date Difference Calculator State
  const [startDate, setStartDate] = useState<string>(todayIso);
  const nextMonthIso = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const [endDate, setEndDate] = useState<string>(nextMonthIso);
  const [includeEndDay, setIncludeEndDay] = useState<boolean>(true);

  // Discount Calculator State
  const [origPrice, setOrigPrice] = useState<string>('80');
  const [discountPercent, setDiscountPercent] = useState<string>('20');
  const [salesTaxPercent, setSalesTaxPercent] = useState<string>('0');

  // Tip Calculator State
  const [billAmount, setBillAmount] = useState<string>('65');
  const [tipRate, setTipRate] = useState<string>('18');
  const [splitCount, setSplitCount] = useState<string>('2');

  // GPA Calculator State
  const [courses, setCourses] = useState([
    { id: 'c1', name: 'Course 1', grade: 'A', credits: 3 },
    { id: 'c2', name: 'Course 2', grade: 'A-', credits: 4 },
    { id: 'c3', name: 'Course 3', grade: 'B+', credits: 3 },
    { id: 'c4', name: 'Course 4', grade: 'A', credits: 3 },
  ]);

  const gradePointsMap: Record<string, number> = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0,
  };

  const gpaResult = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    for (const c of courses) {
      const cr = Number(c.credits) || 0;
      const gp = gradePointsMap[c.grade] ?? 4.0;
      totalPoints += gp * cr;
      totalCredits += cr;
    }
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    let standing = 'Good Academic Standing';
    if (gpa >= 3.9) standing = 'Summa Cum Laude (Highest Honors)';
    else if (gpa >= 3.7) standing = 'Magna Cum Laude (High Honors)';
    else if (gpa >= 3.5) standing = 'Cum Laude (Dean\'s List)';
    else if (gpa < 2.0 && totalCredits > 0) standing = 'Academic Probation Warning';

    return {
      gpa: gpa.toFixed(2),
      totalCredits,
      totalPoints: totalPoints.toFixed(1),
      standing,
    };
  }, [courses]);

  // Aspect Ratio Calculator State
  const [arWidth, setArWidth] = useState<number>(1920);
  const [arHeight, setArHeight] = useState<number>(1080);
  const [arNewWidth, setArNewWidth] = useState<number>(1280);
  const [arNewHeight, setArNewHeight] = useState<number>(720);

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const arRatio = useMemo(() => {
    const w = Math.round(arWidth) || 1;
    const h = Math.round(arHeight) || 1;
    const d = gcd(w, h);
    return `${w / d}:${h / d}`;
  }, [arWidth, arHeight]);

  // Scientific Calculator State
  const [calcExpr, setCalcExpr] = useState<string>('0');
  const [calcPrev, setCalcPrev] = useState<string>('');
  const [isRad, setIsRad] = useState<boolean>(true);

  const handleCalcBtn = (val: string) => {
    if (val === 'C' || val === 'AC') {
      setCalcExpr('0');
      setCalcPrev('');
    } else if (val === 'DEL') {
      setCalcExpr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === '=') {
      try {
        // Safe evaluation of standard math expressions
        let expr = calcExpr
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/sin\(/g, isRad ? 'Math.sin(' : 'Math.sin((Math.PI/180)*')
          .replace(/cos\(/g, isRad ? 'Math.cos(' : 'Math.cos((Math.PI/180)*')
          .replace(/tan\(/g, isRad ? 'Math.tan(' : 'Math.tan((Math.PI/180)*')
          .replace(/sqrt\(/g, 'Math.sqrt(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/\^/g, '**');

        // Only allow safe characters: digits, operators, Math functions, parens, decimal
        if (!/^[0-9+\-*/().,Math.PIEsincoztasqrtlog10 ]+$/.test(expr)) {
          throw new Error('Invalid input');
        }
        // eslint-disable-next-line no-new-func
        const res = Function(`'use strict'; return (${expr})`)();
        const rounded = Number(res.toFixed(8)).toString();
        setCalcPrev(`${calcExpr} =`);
        setCalcExpr(rounded);
      } catch {
        setCalcExpr('Error');
      }
    } else {
      setCalcExpr((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
    }
  };

  // 1. Percentage Calculations
  const percentageResult = useMemo(() => {
    const v1 = parseFloat(pVal1);
    const v2 = parseFloat(pVal2);
    if (isNaN(v1) || isNaN(v2)) return null;

    if (percMode === 'calc') {
      const res = (v1 / 100) * v2;
      return {
        main: res.toLocaleString(undefined, { maximumFractionDigits: 4 }),
        formula: `${v1}% × ${v2} = (${v1} ÷ 100) × ${v2} = ${res.toLocaleString(undefined, { maximumFractionDigits: 4 })}`,
      };
    } else if (percMode === 'isWhat') {
      if (v2 === 0) return { main: 'Cannot divide by zero', formula: '' };
      const res = (v1 / v2) * 100;
      return {
        main: `${res.toLocaleString(undefined, { maximumFractionDigits: 4 })}%`,
        formula: `(${v1} ÷ ${v2}) × 100 = ${res.toLocaleString(undefined, { maximumFractionDigits: 4 })}%`,
      };
    } else {
      if (v1 === 0) return { main: 'Cannot compute change from zero', formula: '' };
      const diff = v2 - v1;
      const res = (diff / v1) * 100;
      const direction = res >= 0 ? 'increase' : 'decrease';
      return {
        main: `${Math.abs(res).toLocaleString(undefined, { maximumFractionDigits: 2 })}% ${direction}`,
        formula: `((${v2} − ${v1}) ÷ ${v1}) × 100 = ${res.toLocaleString(undefined, { maximumFractionDigits: 4 })}%`,
      };
    }
  }, [percMode, pVal1, pVal2]);

  // 2. Age Calculations
  const ageResult = useMemo(() => {
    if (!birthDate || !targetDate) return null;
    const start = new Date(birthDate + 'T00:00:00');
    const end = new Date(targetDate + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { error: 'Target date must be on or after birth date' };
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalDays = Math.floor((end.getTime() - start.getTime()) / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;

    // Next birthday calculation
    const thisYearBirthday = new Date(end.getFullYear(), start.getMonth(), start.getDate());
    if (thisYearBirthday < end) {
      thisYearBirthday.setFullYear(end.getFullYear() + 1);
    }
    const daysToBirthday = Math.ceil((thisYearBirthday.getTime() - end.getTime()) / 86400000);

    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalHours,
      daysToBirthday,
    };
  }, [birthDate, targetDate]);

  // 3. Date Difference Calculations
  const dateDiffResult = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate + 'T00:00:00');
    const e = new Date(endDate + 'T00:00:00');
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

    const earlier = s <= e ? s : e;
    const later = s <= e ? e : s;

    let diffDays = Math.round((later.getTime() - earlier.getTime()) / 86400000);
    if (includeEndDay) diffDays += 1;

    const weeks = Math.floor(diffDays / 7);
    const remDays = diffDays % 7;

    // Count weekdays vs weekend days
    let weekdays = 0;
    let weekends = 0;
    const curr = new Date(earlier);
    const countLimit = includeEndDay ? diffDays : diffDays;
    for (let i = 0; i < countLimit; i++) {
      const dayOfWeek = curr.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) weekends++;
      else weekdays++;
      curr.setDate(curr.getDate() + 1);
    }

    return {
      totalDays: diffDays,
      weeks,
      remDays,
      weekdays,
      weekends,
      isNegative: s > e,
    };
  }, [startDate, endDate, includeEndDay]);

  // 4. Discount Calculations
  const discountResult = useMemo(() => {
    const p = parseFloat(origPrice);
    const d = parseFloat(discountPercent);
    const t = parseFloat(salesTaxPercent || '0');
    if (isNaN(p) || isNaN(d) || p < 0 || d < 0) return null;

    const savings = (p * d) / 100;
    const discountedPrice = Math.max(0, p - savings);
    const taxAmount = (discountedPrice * (isNaN(t) ? 0 : t)) / 100;
    const finalPrice = discountedPrice + taxAmount;

    return {
      savings: savings.toFixed(2),
      discountedPrice: discountedPrice.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
    };
  }, [origPrice, discountPercent, salesTaxPercent]);

  // 5. Tip Calculations
  const tipResult = useMemo(() => {
    const bill = parseFloat(billAmount);
    const rate = parseFloat(tipRate);
    const count = parseInt(splitCount, 10) || 1;
    if (isNaN(bill) || isNaN(rate) || bill < 0 || rate < 0 || count < 1) return null;

    const tip = (bill * rate) / 100;
    const total = bill + tip;
    const perPersonTotal = total / count;
    const perPersonTip = tip / count;

    return {
      tip: tip.toFixed(2),
      total: total.toFixed(2),
      perPersonTotal: perPersonTotal.toFixed(2),
      perPersonTip: perPersonTip.toFixed(2),
    };
  }, [billAmount, tipRate, splitCount]);

  return (
    <div class="calculator-shell bg-white border border-slate-200/90 rounded-2xl shadow-card p-5 sm:p-7 my-6 transition-all">
      {/* Percentage Calculator */}
      {toolId === 'percentage-calculator' && (
        <div class="space-y-6">
          <div class="flex flex-wrap gap-2 border-b border-slate-200/80 pb-4">
            <button
              type="button"
              onClick={() => setPercMode('calc')}
              class={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                percMode === 'calc'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              What is X% of Y?
            </button>
            <button
              type="button"
              onClick={() => setPercMode('isWhat')}
              class={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                percMode === 'isWhat'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              X is what % of Y?
            </button>
            <button
              type="button"
              onClick={() => setPercMode('change')}
              class={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                percMode === 'change'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              % Change from X to Y
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {percMode === 'calc' && (
              <>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-700">Percentage (%)</label>
                  <input
                    type="number"
                    value={pVal1}
                    onInput={(e) => setPVal1((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-base sm:text-lg font-bold"
                    placeholder="e.g. 15"
                  />
                  <div class="flex flex-wrap gap-1 pt-1">
                    {['5', '10', '15', '20', '25', '30', '50', '75'].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPVal1(pct)}
                        class={`px-2 py-0.5 text-2xs font-semibold rounded-md border transition ${
                          pVal1 === pct
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-700">Of Number (Base Value)</label>
                  <input
                    type="number"
                    value={pVal2}
                    onInput={(e) => setPVal2((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-base sm:text-lg font-bold"
                    placeholder="e.g. 250"
                  />
                  <div class="flex flex-wrap gap-1 pt-1">
                    {['50', '100', '250', '500', '1000', '5000'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPVal2(num)}
                        class={`px-2 py-0.5 text-2xs font-semibold rounded-md border transition ${
                          pVal2 === num
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {percMode === 'isWhat' && (
              <>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-700">Number X (Numerator)</label>
                  <input
                    type="number"
                    value={pVal1}
                    onInput={(e) => setPVal1((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-base sm:text-lg font-bold"
                    placeholder="e.g. 35"
                  />
                  <div class="flex flex-wrap gap-1 pt-1">
                    {['10', '25', '35', '50', '75', '100'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPVal1(num)}
                        class={`px-2 py-0.5 text-2xs font-semibold rounded-md border transition ${
                          pVal1 === num
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-700">Is what % of Number Y (Denominator)</label>
                  <input
                    type="number"
                    value={pVal2}
                    onInput={(e) => setPVal2((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-base sm:text-lg font-bold"
                    placeholder="e.g. 140"
                  />
                  <div class="flex flex-wrap gap-1 pt-1">
                    {['50', '100', '140', '200', '500', '1000'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPVal2(num)}
                        class={`px-2 py-0.5 text-2xs font-semibold rounded-md border transition ${
                          pVal2 === num
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {percMode === 'change' && (
              <>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-700">Initial Value (From)</label>
                  <input
                    type="number"
                    value={pVal1}
                    onInput={(e) => setPVal1((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-base sm:text-lg font-bold"
                    placeholder="e.g. 100"
                  />
                  <div class="flex flex-wrap gap-1 pt-1">
                    {['50', '100', '200', '500'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPVal1(num)}
                        class={`px-2 py-0.5 text-2xs font-semibold rounded-md border transition ${
                          pVal1 === num
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-700">Final Value (To)</label>
                  <input
                    type="number"
                    value={pVal2}
                    onInput={(e) => setPVal2((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-base sm:text-lg font-bold"
                    placeholder="e.g. 125"
                  />
                  <div class="flex flex-wrap gap-1 pt-1">
                    {['75', '125', '150', '250', '500'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPVal2(num)}
                        class={`px-2 py-0.5 text-2xs font-semibold rounded-md border transition ${
                          pVal2 === num
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {percentageResult && (
            <div class="mt-6 p-5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span class="text-xs uppercase font-bold tracking-wider text-emerald-700">Calculation Result</span>
              <div class="text-3xl sm:text-4xl font-extrabold text-emerald-950 mt-1 mb-2">
                {percentageResult.main}
              </div>
              {percentageResult.formula && (
                <div class="text-xs font-mono text-emerald-800 bg-white/70 px-3 py-1.5 rounded inline-block">
                  Formula: {percentageResult.formula}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Age Calculator */}
      {toolId === 'age-calculator' && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Age as of Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {ageResult && !('error' in ageResult) && (
            <div class="p-6 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-4">
              <div>
                <span class="text-xs uppercase font-bold tracking-wider text-emerald-700">Exact Chronological Age</span>
                <div class="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1">
                  {ageResult.years} years, {ageResult.months} months, {ageResult.days} days
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-emerald-200/80/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Total Weeks</div>
                  <div class="font-bold text-slate-900">{ageResult.totalWeeks.toLocaleString()}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Total Days</div>
                  <div class="font-bold text-slate-900">{ageResult.totalDays.toLocaleString()}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Total Hours</div>
                  <div class="font-bold text-slate-900">{ageResult.totalHours.toLocaleString()}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Next Birthday</div>
                  <div class="font-bold text-emerald-700">In {ageResult.daysToBirthday} days</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date Difference Calculator */}
      {toolId === 'date-difference-calculator' && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <label class="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEndDay}
              onChange={(e) => setIncludeEndDay((e.target as HTMLInputElement).checked)}
              class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <span>Include end day in count (adds 1 calendar day)</span>
          </label>

          {dateDiffResult && (
            <div class="p-6 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-4">
              <div>
                <span class="text-xs uppercase font-bold tracking-wider text-emerald-700">Elapsed Calendar Time</span>
                <div class="text-3xl sm:text-4xl font-extrabold text-emerald-950 mt-1">
                  {dateDiffResult.totalDays.toLocaleString()} Days
                </div>
                <div class="text-sm text-emerald-800 mt-1">
                  Equivalent to {dateDiffResult.weeks} weeks and {dateDiffResult.remDays} days
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-200/80/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Workdays (Mon–Fri)</div>
                  <div class="font-bold text-slate-900">{dateDiffResult.weekdays} days</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Weekend Days (Sat–Sun)</div>
                  <div class="font-bold text-slate-900">{dateDiffResult.weekends} days</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Discount Calculator */}
      {toolId === 'discount-calculator' && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Original Price ($)</label>
              <input
                type="number"
                value={origPrice}
                onInput={(e) => setOrigPrice((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-lg"
                placeholder="100"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Discount (%)</label>
              <input
                type="number"
                value={discountPercent}
                onInput={(e) => setDiscountPercent((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-lg"
                placeholder="20"
              />
              <div class="flex flex-wrap gap-1 mt-1.5">
                {['10', '15', '20', '25', '30', '50'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    class={`px-2 py-0.5 text-2xs font-semibold rounded-md border transition ${
                      discountPercent === d
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Sales Tax (%) [Optional]</label>
              <input
                type="number"
                value={salesTaxPercent}
                onInput={(e) => setSalesTaxPercent((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-lg"
                placeholder="0"
              />
            </div>
          </div>

          {discountResult && (
            <div class="p-6 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-4">
              <div>
                <span class="text-xs uppercase font-bold tracking-wider text-emerald-700">Final Discounted Price</span>
                <div class="text-3xl sm:text-4xl font-extrabold text-emerald-950 mt-1">
                  ${discountResult.finalPrice}
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-emerald-200/80/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Total Savings</div>
                  <div class="font-bold text-emerald-700">${discountResult.savings}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Price Before Tax</div>
                  <div class="font-bold text-slate-900">${discountResult.discountedPrice}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Estimated Sales Tax</div>
                  <div class="font-bold text-slate-900">${discountResult.taxAmount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tip Calculator */}
      {toolId === 'tip-calculator' && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Bill Amount ($)</label>
              <input
                type="number"
                value={billAmount}
                onInput={(e) => setBillAmount((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-lg"
                placeholder="50"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Tip Percentage (%)</label>
              <div class="flex space-x-1 mb-2">
                {['10', '15', '18', '20'].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTipRate(rate)}
                    class={`flex-1 py-1 text-xs font-medium rounded ${
                      tipRate === rate ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={tipRate}
                onInput={(e) => setTipRate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Number of People (Split)</label>
              <input
                type="number"
                min="1"
                value={splitCount}
                onInput={(e) => setSplitCount((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-lg"
              />
            </div>
          </div>

          {tipResult && (
            <div class="p-6 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-4">
              <div class="flex justify-between items-end">
                <div>
                  <span class="text-xs uppercase font-bold tracking-wider text-emerald-700">Per Person Share</span>
                  <div class="text-3xl sm:text-4xl font-extrabold text-emerald-950 mt-1">
                    ${tipResult.perPersonTotal}
                  </div>
                </div>
                <div class="text-right text-xs text-slate-500">
                  Includes ${tipResult.perPersonTip} tip / person
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-200/80/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Total Tip Amount</div>
                  <div class="font-bold text-slate-900">${tipResult.tip}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-slate-500">Total Bill (with Tip)</div>
                  <div class="font-bold text-slate-900">${tipResult.total}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Scientific & Standard Calculator */}
      {(toolId === 'scientific-calculator' || toolId === 'online-calculator') && (
        <div class="max-w-md mx-auto space-y-4">
          <div class="bg-slate-900 text-white rounded-2xl p-5 shadow-inner">
            <div class="text-right text-xs font-mono text-slate-400 min-h-[1.25rem] truncate">{calcPrev}</div>
            <div class="text-right text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white overflow-x-auto whitespace-nowrap mt-1">
              {calcExpr}
            </div>
          </div>

          <div class="flex justify-between items-center px-1">
            <button
              type="button"
              onClick={() => setIsRad(!isRad)}
              class="px-2.5 py-1 text-2xs font-bold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              {isRad ? 'RAD' : 'DEG'}
            </button>
            <span class="text-2xs text-slate-400 font-medium">Standard & Scientific Mode</span>
          </div>

          <div class="grid grid-cols-5 gap-2">
            {[
              'sin(', 'cos(', 'tan(', 'ln(', 'C',
              'sqrt(', '(', ')', '^', '÷',
              'π', '7', '8', '9', '×',
              'e', '4', '5', '6', '-',
              'DEL', '1', '2', '3', '+',
              '+/-', '0', '.', '=', '%',
            ].map((btn) => (
              <button
                type="button"
                onClick={() => handleCalcBtn(btn)}
                class={`py-3 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-2xs ${
                  btn === '='
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 col-span-1 text-base'
                    : btn === 'C' || btn === 'DEL'
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : ['÷', '×', '-', '+'].includes(btn)
                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 text-sm sm:text-base'
                    : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'].includes(btn)
                    ? 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 text-base'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GPA Calculator */}
      {toolId === 'gpa-calculator' && (
        <div class="space-y-6 max-w-2xl mx-auto">
          {/* GPA Score Card */}
          <div class="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-200/80 rounded-2xl p-6 text-center">
            <span class="text-xs uppercase font-bold text-emerald-700 tracking-wider">
              Cumulative Grade Point Average (GPA)
            </span>
            <p class="text-4xl sm:text-5xl font-extrabold text-emerald-800 my-2 font-mono">
              {gpaResult.gpa} <span class="text-xl text-slate-400">/ 4.0</span>
            </p>
            <p class="text-xs font-semibold text-emerald-700">{gpaResult.standing}</p>
            <div class="flex justify-center gap-6 mt-4 pt-3 border-t border-emerald-200/80/60 text-xs text-slate-600">
              <span>Total Credits: <strong>{gpaResult.totalCredits}</strong></span>
              <span>Total Grade Points: <strong>{gpaResult.totalPoints}</strong></span>
            </div>
          </div>

          {/* Courses Table */}
          <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th class="p-3">Course Name</th>
                  <th class="p-3">Grade</th>
                  <th class="p-3">Credits</th>
                  <th class="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {courses.map((c, idx) => (
                  <tr key={c.id}>
                    <td class="p-3">
                      <input
                        type="text"
                        value={c.name}
                        onInput={(e) => {
                          const updated = [...courses];
                          updated[idx].name = (e.target as HTMLInputElement).value;
                          setCourses(updated);
                        }}
                        class="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td class="p-3">
                      <select
                        value={c.grade}
                        onChange={(e) => {
                          const updated = [...courses];
                          updated[idx].grade = (e.target as HTMLSelectElement).value;
                          setCourses(updated);
                        }}
                        class="px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                      >
                        {Object.keys(gradePointsMap).map((g) => (
                          <option value={g}>{g} ({gradePointsMap[g].toFixed(1)})</option>
                        ))}
                      </select>
                    </td>
                    <td class="p-3">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={c.credits}
                        onInput={(e) => {
                          const updated = [...courses];
                          updated[idx].credits = Number((e.target as HTMLInputElement).value);
                          setCourses(updated);
                        }}
                        class="w-16 px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                      />
                    </td>
                    <td class="p-3 text-right">
                      {courses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCourses(courses.filter((_, i) => i !== idx))}
                          class="text-red-500 hover:text-red-700 font-bold text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => setCourses([...courses, { id: `c-${Date.now()}`, name: `Course ${courses.length + 1}`, grade: 'A', credits: 3 }])}
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            + Add Another Course
          </button>
        </div>
      )}

      {/* Aspect Ratio Calculator */}
      {toolId === 'aspect-ratio-calculator' && (
        <div class="space-y-6 max-w-2xl mx-auto">
          {/* Quick Presets */}
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold text-slate-700 uppercase">Popular Ratios:</span>
            {[
              { label: '16:9 (HD Video)', w: 1920, h: 1080 },
              { label: '4:3 (Standard)', w: 1024, h: 768 },
              { label: '1:1 (Square)', w: 1080, h: 1080 },
              { label: '9:16 (Reels / TikTok)', w: 1080, h: 1920 },
              { label: '21:9 (Ultrawide)', w: 2560, h: 1080 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setArWidth(p.w);
                  setArHeight(p.h);
                  setArNewWidth(p.w);
                  setArNewHeight(p.h);
                }}
                class="px-2.5 py-1 text-xs bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg border border-slate-200 transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Original Dimensions */}
            <div class="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Original Resolution
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={arWidth}
                  onInput={(e) => {
                    const w = Number((e.target as HTMLInputElement).value);
                    setArWidth(w);
                    if (w > 0 && arHeight > 0) {
                      setArNewHeight(Math.round((arNewWidth * arHeight) / w));
                    }
                  }}
                  class="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg font-bold"
                  placeholder="Width"
                />
                <span class="text-slate-400 font-bold">×</span>
                <input
                  type="number"
                  min="1"
                  value={arHeight}
                  onInput={(e) => {
                    const h = Number((e.target as HTMLInputElement).value);
                    setArHeight(h);
                    if (arWidth > 0 && h > 0) {
                      setArNewHeight(Math.round((arNewWidth * h) / arWidth));
                    }
                  }}
                  class="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg font-bold"
                  placeholder="Height"
                />
              </div>
              <p class="text-xs text-slate-500">Calculated Aspect Ratio: <strong class="text-emerald-700 font-mono">{arRatio}</strong></p>
            </div>

            {/* Resize Calculation */}
            <div class="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Scaled Target Resolution
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={arNewWidth}
                  onInput={(e) => {
                    const nw = Number((e.target as HTMLInputElement).value);
                    setArNewWidth(nw);
                    if (arWidth > 0 && arHeight > 0 && nw > 0) {
                      setArNewHeight(Math.round((nw * arHeight) / arWidth));
                    }
                  }}
                  class="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg font-bold text-emerald-700"
                  placeholder="New Width"
                />
                <span class="text-slate-400 font-bold">×</span>
                <input
                  type="number"
                  min="1"
                  value={arNewHeight}
                  onInput={(e) => {
                    const nh = Number((e.target as HTMLInputElement).value);
                    setArNewHeight(nh);
                    if (arWidth > 0 && arHeight > 0 && nh > 0) {
                      setArNewWidth(Math.round((nh * arWidth) / arHeight));
                    }
                  }}
                  class="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg font-bold text-emerald-700"
                  placeholder="New Height"
                />
              </div>
              <p class="text-xs text-slate-500">Changing either value auto-calculates the other</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
