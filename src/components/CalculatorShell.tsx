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
    <div class="calculator-shell bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 my-6">
      {/* Percentage Calculator */}
      {toolId === 'percentage-calculator' && (
        <div class="space-y-6">
          <div class="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
            <button
              type="button"
              onClick={() => setPercMode('calc')}
              class={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                percMode === 'calc'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              What is X% of Y?
            </button>
            <button
              type="button"
              onClick={() => setPercMode('isWhat')}
              class={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                percMode === 'isWhat'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              X is what % of Y?
            </button>
            <button
              type="button"
              onClick={() => setPercMode('change')}
              class={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                percMode === 'change'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              % Change from X to Y
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {percMode === 'calc' && (
              <>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Percentage (%)</label>
                  <input
                    type="number"
                    value={pVal1}
                    onInput={(e) => setPVal1((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg"
                    placeholder="e.g. 15"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Of Number</label>
                  <input
                    type="number"
                    value={pVal2}
                    onInput={(e) => setPVal2((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg"
                    placeholder="e.g. 250"
                  />
                </div>
              </>
            )}

            {percMode === 'isWhat' && (
              <>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Number X</label>
                  <input
                    type="number"
                    value={pVal1}
                    onInput={(e) => setPVal1((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg"
                    placeholder="e.g. 35"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Is what % of Number Y</label>
                  <input
                    type="number"
                    value={pVal2}
                    onInput={(e) => setPVal2((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg"
                    placeholder="e.g. 140"
                  />
                </div>
              </>
            )}

            {percMode === 'change' && (
              <>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Initial Value (From)</label>
                  <input
                    type="number"
                    value={pVal1}
                    onInput={(e) => setPVal1((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg"
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Final Value (To)</label>
                  <input
                    type="number"
                    value={pVal2}
                    onInput={(e) => setPVal2((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg"
                    placeholder="e.g. 125"
                  />
                </div>
              </>
            )}
          </div>

          {percentageResult && (
            <div class="mt-6 p-5 bg-green-50 border border-green-200 rounded-xl">
              <span class="text-xs uppercase font-bold tracking-wider text-green-700">Calculation Result</span>
              <div class="text-3xl sm:text-4xl font-extrabold text-green-900 mt-1 mb-2">
                {percentageResult.main}
              </div>
              {percentageResult.formula && (
                <div class="text-xs font-mono text-green-800 bg-white/70 px-3 py-1.5 rounded inline-block">
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
              <label class="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Age as of Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
              />
            </div>
          </div>

          {ageResult && !('error' in ageResult) && (
            <div class="p-6 bg-green-50 border border-green-200 rounded-xl space-y-4">
              <div>
                <span class="text-xs uppercase font-bold tracking-wider text-green-700">Exact Chronological Age</span>
                <div class="text-2xl sm:text-3xl font-extrabold text-green-900 mt-1">
                  {ageResult.years} years, {ageResult.months} months, {ageResult.days} days
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-green-200/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Total Weeks</div>
                  <div class="font-bold text-gray-900">{ageResult.totalWeeks.toLocaleString()}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Total Days</div>
                  <div class="font-bold text-gray-900">{ageResult.totalDays.toLocaleString()}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Total Hours</div>
                  <div class="font-bold text-gray-900">{ageResult.totalHours.toLocaleString()}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Next Birthday</div>
                  <div class="font-bold text-green-700">In {ageResult.daysToBirthday} days</div>
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
              <label class="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>
          </div>

          <label class="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEndDay}
              onChange={(e) => setIncludeEndDay((e.target as HTMLInputElement).checked)}
              class="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <span>Include end day in count (adds 1 calendar day)</span>
          </label>

          {dateDiffResult && (
            <div class="p-6 bg-green-50 border border-green-200 rounded-xl space-y-4">
              <div>
                <span class="text-xs uppercase font-bold tracking-wider text-green-700">Elapsed Calendar Time</span>
                <div class="text-3xl sm:text-4xl font-extrabold text-green-900 mt-1">
                  {dateDiffResult.totalDays.toLocaleString()} Days
                </div>
                <div class="text-sm text-green-800 mt-1">
                  Equivalent to {dateDiffResult.weeks} weeks and {dateDiffResult.remDays} days
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-4 border-t border-green-200/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Workdays (Mon–Fri)</div>
                  <div class="font-bold text-gray-900">{dateDiffResult.weekdays} days</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Weekend Days (Sat–Sun)</div>
                  <div class="font-bold text-gray-900">{dateDiffResult.weekends} days</div>
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
              <label class="block text-xs font-semibold text-gray-700 mb-1">Original Price ($)</label>
              <input
                type="number"
                value={origPrice}
                onInput={(e) => setOrigPrice((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-mono text-lg"
                placeholder="100"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Discount (%)</label>
              <input
                type="number"
                value={discountPercent}
                onInput={(e) => setDiscountPercent((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-mono text-lg"
                placeholder="20"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Sales Tax (%) [Optional]</label>
              <input
                type="number"
                value={salesTaxPercent}
                onInput={(e) => setSalesTaxPercent((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-mono text-lg"
                placeholder="0"
              />
            </div>
          </div>

          {discountResult && (
            <div class="p-6 bg-green-50 border border-green-200 rounded-xl space-y-4">
              <div>
                <span class="text-xs uppercase font-bold tracking-wider text-green-700">Final Discounted Price</span>
                <div class="text-3xl sm:text-4xl font-extrabold text-green-900 mt-1">
                  ${discountResult.finalPrice}
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-green-200/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Total Savings</div>
                  <div class="font-bold text-emerald-700">${discountResult.savings}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Price Before Tax</div>
                  <div class="font-bold text-gray-900">${discountResult.discountedPrice}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Estimated Sales Tax</div>
                  <div class="font-bold text-gray-900">${discountResult.taxAmount}</div>
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
              <label class="block text-xs font-semibold text-gray-700 mb-1">Bill Amount ($)</label>
              <input
                type="number"
                value={billAmount}
                onInput={(e) => setBillAmount((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-mono text-lg"
                placeholder="50"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Tip Percentage (%)</label>
              <div class="flex space-x-1 mb-2">
                {['10', '15', '18', '20'].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTipRate(rate)}
                    class={`flex-1 py-1 text-xs font-medium rounded ${
                      tipRate === rate ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                class="w-full px-4 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-mono text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Number of People (Split)</label>
              <input
                type="number"
                min="1"
                value={splitCount}
                onInput={(e) => setSplitCount((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-mono text-lg"
              />
            </div>
          </div>

          {tipResult && (
            <div class="p-6 bg-green-50 border border-green-200 rounded-xl space-y-4">
              <div class="flex justify-between items-end">
                <div>
                  <span class="text-xs uppercase font-bold tracking-wider text-green-700">Per Person Share</span>
                  <div class="text-3xl sm:text-4xl font-extrabold text-green-900 mt-1">
                    ${tipResult.perPersonTotal}
                  </div>
                </div>
                <div class="text-right text-xs text-gray-500">
                  Includes ${tipResult.perPersonTip} tip / person
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-4 border-t border-green-200/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Total Tip Amount</div>
                  <div class="font-bold text-gray-900">${tipResult.tip}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">Total Bill (with Tip)</div>
                  <div class="font-bold text-gray-900">${tipResult.total}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Scientific & Standard Calculator */}
      {(toolId === 'scientific-calculator' || toolId === 'online-calculator') && (
        <div class="max-w-md mx-auto space-y-4">
          <div class="bg-gray-900 text-white rounded-2xl p-5 shadow-inner">
            <div class="text-right text-xs font-mono text-gray-400 min-h-[1.25rem] truncate">{calcPrev}</div>
            <div class="text-right text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white overflow-x-auto whitespace-nowrap mt-1">
              {calcExpr}
            </div>
          </div>

          <div class="flex justify-between items-center px-1">
            <button
              type="button"
              onClick={() => setIsRad(!isRad)}
              class="px-2.5 py-1 text-2xs font-bold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {isRad ? 'RAD' : 'DEG'}
            </button>
            <span class="text-2xs text-gray-400 font-medium">Standard & Scientific Mode</span>
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
                    ? 'bg-green-600 text-white hover:bg-green-700 col-span-1 text-base'
                    : btn === 'C' || btn === 'DEL'
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : ['÷', '×', '-', '+'].includes(btn)
                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 text-sm sm:text-base'
                    : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'].includes(btn)
                    ? 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 text-base'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
