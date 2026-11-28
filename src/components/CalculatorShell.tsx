import { useState, useMemo } from 'preact/hooks';
import { countDateRange } from '../utils/date-range';
import BirthYearCalculator from './BirthYearCalculator';

interface CalculatorShellProps {
  toolId: string;
  toolName: string;
}

export default function CalculatorShell({ toolId, toolName: _toolName }: CalculatorShellProps) {
  // Percentage Calculator State
  const [percMode, setPercMode] = useState<'calc' | 'isWhat' | 'change' | 'difference'>(
    toolId === 'percentage-difference-calculator' ? 'difference' : toolId === 'percentage-increase-calculator' ? 'change' : 'calc'
  );
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
  const [billAmount, setBillAmount] = useState<string>(toolId === 'haircut-tip-calculator' ? '45' : '65');
  const [tipRate, setTipRate] = useState<string>(toolId === 'haircut-tip-calculator' ? '20' : '18');
  const [splitCount, setSplitCount] = useState<string>('2');
  const [tipTaxPercent, setTipTaxPercent] = useState<string>('0');
  const [tipPreTax, setTipPreTax] = useState<boolean>(true);
  const [tipRounding, setTipRounding] = useState<'none' | 'round-total' | 'round-person'>('none');
  const [tipCopied, setTipCopied] = useState<boolean>(false);

  // Body Fat Calculator State
  const [bfGender, setBfGender] = useState<'male' | 'female'>('male');
  const [bfHeight, setBfHeight] = useState<string>('178');
  const [bfWeight, setBfWeight] = useState<string>('75');
  const [bfNeck, setBfNeck] = useState<string>('38');
  const [bfWaist, setBfWaist] = useState<string>('86');
  const [bfHip, setBfHip] = useState<string>('96');

  const bfResult = useMemo(() => {
    const h = parseFloat(bfHeight) || 178;
    const w = parseFloat(bfWeight) || 75;
    const neck = parseFloat(bfNeck) || 38;
    const waist = parseFloat(bfWaist) || 86;
    const hip = parseFloat(bfHip) || 96;

    let bf = 0;
    if (bfGender === 'male') {
      if (waist > neck && h > 0) {
        bf = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(h) + 36.76;
      }
    } else {
      if (waist + hip > neck && h > 0) {
        bf = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(h) - 78.387;
      }
    }
    bf = Math.max(2, Math.min(65, bf));
    const fatMass = (w * bf) / 100;
    const leanMass = Math.max(0, w - fatMass);

    let category = 'Fitness';
    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (bfGender === 'male') {
      if (bf < 6) { category = 'Essential Fat'; badgeColor = 'bg-amber-100 text-amber-800 border-amber-300'; }
      else if (bf < 14) { category = 'Athletes'; badgeColor = 'bg-blue-100 text-blue-800 border-blue-300'; }
      else if (bf < 18) { category = 'Fitness'; badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300'; }
      else if (bf < 25) { category = 'Acceptable / Average'; badgeColor = 'bg-slate-100 text-slate-800 border-slate-300'; }
      else { category = 'Above Average / Obesity Risk'; badgeColor = 'bg-rose-100 text-rose-800 border-rose-300'; }
    } else {
      if (bf < 14) { category = 'Essential Fat'; badgeColor = 'bg-amber-100 text-amber-800 border-amber-300'; }
      else if (bf < 21) { category = 'Athletes'; badgeColor = 'bg-blue-100 text-blue-800 border-blue-300'; }
      else if (bf < 25) { category = 'Fitness'; badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300'; }
      else if (bf < 32) { category = 'Acceptable / Average'; badgeColor = 'bg-slate-100 text-slate-800 border-slate-300'; }
      else { category = 'Above Average / Obesity Risk'; badgeColor = 'bg-rose-100 text-rose-800 border-rose-300'; }
    }

    return {
      bodyFatPercent: bf.toFixed(1),
      fatMass: fatMass.toFixed(1),
      leanMass: leanMass.toFixed(1),
      category,
      badgeColor,
    };
  }, [bfGender, bfHeight, bfWeight, bfNeck, bfWaist, bfHip]);

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

  // DPI / PPI Calculator State
  const [dpiMode, setDpiMode] = useState<'screen' | 'print'>('screen');
  const [dpiWidth, setDpiWidth] = useState<string>('3840');
  const [dpiHeight, setDpiHeight] = useState<string>('2160');
  const [dpiDiagonal, setDpiDiagonal] = useState<string>('27');

  const [printImageW, setPrintImageW] = useState<string>('3000');
  const [printImageH, setPrintImageH] = useState<string>('2000');
  const [printTargetDpi, setPrintTargetDpi] = useState<string>('300');

  const screenPresets = [
    { label: '27" 4K UHD', w: '3840', h: '2160', d: '27' },
    { label: '24" 1080p FHD', w: '1920', h: '1080', d: '24' },
    { label: '27" 1440p QHD', w: '2560', h: '1440', d: '27' },
    { label: '16" MacBook Pro', w: '3456', h: '2234', d: '16.2' },
    { label: 'iPhone 16 Pro', w: '2622', h: '1206', d: '6.3' },
    { label: '55" 4K TV', w: '3840', h: '2160', d: '55' },
  ];

  const printDpiPresets = ['72', '150', '300', '600'];

  const dpiResult = useMemo(() => {
    const w = parseFloat(dpiWidth) || 0;
    const h = parseFloat(dpiHeight) || 0;
    const d = parseFloat(dpiDiagonal) || 0;
    if (w <= 0 || h <= 0 || d <= 0) return null;

    const diagPx = Math.sqrt(w * w + h * h);
    const ppi = diagPx / d;
    const dotPitchMm = ppi > 0 ? 25.4 / ppi : 0;
    const totalPixels = w * h;
    const megapixels = totalPixels / 1000000;
    const div = gcd(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    const aspectRatio = `${Math.round(w) / div}:${Math.round(h) / div}`;
    const widthInches = ppi > 0 ? w / ppi : 0;
    const heightInches = ppi > 0 ? h / ppi : 0;
    const viewingDistInches = ppi > 0 ? 3438 / ppi : 0;

    return {
      ppi: ppi.toFixed(2),
      dotPitchMm: dotPitchMm.toFixed(4),
      dotPitchMicrons: (dotPitchMm * 1000).toFixed(1),
      megapixels: megapixels.toFixed(2),
      aspectRatio,
      dimensionsInches: `${widthInches.toFixed(2)}" × ${heightInches.toFixed(2)}"`,
      dimensionsCm: `${(widthInches * 2.54).toFixed(1)} cm × ${(heightInches * 2.54).toFixed(1)} cm`,
      viewingDistance: `${viewingDistInches.toFixed(1)}" (${(viewingDistInches * 2.54).toFixed(1)} cm)`,
    };
  }, [dpiWidth, dpiHeight, dpiDiagonal]);

  const printResult = useMemo(() => {
    const pw = parseFloat(printImageW) || 0;
    const ph = parseFloat(printImageH) || 0;
    const pdpi = parseFloat(printTargetDpi) || 1;
    if (pw <= 0 || ph <= 0 || pdpi <= 0) return null;

    const widthInches = pw / pdpi;
    const heightInches = ph / pdpi;
    const widthCm = widthInches * 2.54;
    const heightCm = heightInches * 2.54;
    const megapixels = (pw * ph) / 1000000;

    let quality = 'Standard (Draft / Preview)';
    let qualityColor = 'text-amber-700 bg-amber-50 border-amber-200';
    if (pdpi >= 300) {
      quality = 'Gallery & Fine Art Offset Quality (300+ DPI)';
      qualityColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (pdpi >= 200) {
      quality = 'High Quality Photo & Book Printing (200-299 DPI)';
      qualityColor = 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (pdpi >= 150) {
      quality = 'Standard Poster & Large Display Print (150-199 DPI)';
      qualityColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
    }

    return {
      widthInches: widthInches.toFixed(2),
      heightInches: heightInches.toFixed(2),
      widthCm: widthCm.toFixed(1),
      heightCm: heightCm.toFixed(1),
      megapixels: megapixels.toFixed(2),
      quality,
      qualityColor,
    };
  }, [printImageW, printImageH, printTargetDpi]);

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
    } else if (percMode === 'difference') {
      if (v1 < 0 || v2 < 0) return { main: 'Enter two nonnegative measurements', formula: '' };
      const scale = Math.max(v1, v2);
      if (scale === 0) return { main: 'Undefined because both values are zero', formula: '' };
      const difference = 200 * (Math.abs(v1 - v2) / scale) / (v1 / scale + v2 / scale);
      const main = difference.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%';
      return { main, formula: `|${v1} − ${v2}| ÷ ((${v1} + ${v2}) ÷ 2) × 100 ≈ ${main}` };
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
  const dateDiffResult = useMemo(() =>
    toolId === 'date-difference-calculator' ? countDateRange(startDate, endDate, includeEndDay) : null,
    [toolId, startDate, endDate, includeEndDay]);

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
    const count = Number(splitCount);
    const taxRate = Number(tipTaxPercent);
    if (!Number.isFinite(bill) || !Number.isFinite(rate) || !Number.isFinite(taxRate) ||
        bill < 0 || rate < 0 || taxRate < 0 || !Number.isSafeInteger(count) || count < 1) return null;

    const cents = (amount: number) => Math.round((amount + Number.EPSILON) * 100);
    const money = (amountInCents: number) => (amountInCents / 100).toFixed(2);
    const billCents = cents(bill);
    const taxCents = cents(billCents / 100 * taxRate / 100);
    const baseForTip = tipPreTax ? billCents : billCents + taxCents;
    let tipCents = cents(baseForTip / 100 * rate / 100);
    let totalCents = billCents + taxCents + tipCents;
    if (tipRounding === 'round-total') totalCents = Math.ceil(totalCents / 100) * 100;
    if (tipRounding === 'round-person') totalCents = Math.ceil(totalCents / count / 100) * 100 * count;
    if (!Number.isSafeInteger(totalCents)) return null;
    tipCents = totalCents - billCents - taxCents;

    const lowerShare = Math.floor(totalCents / count);
    const higherCount = totalCents % count;
    const lowerCount = count - higherCount;
    const group = (size: number, share: number) =>
      size + (size === 1 ? ' guest pays $' : ' guests pay $') + money(share);
    const allocation = higherCount ? group(lowerCount, lowerShare) + ' and ' + group(higherCount, lowerShare + 1) + '.' : '';
    const perPersonTip = tipCents / count / 100;
    const perPersonFoodAndTax = (billCents + taxCents) / count / 100;

    return {
      bill: money(billCents),
      taxAmount: money(taxCents),
      tip: money(tipCents),
      total: money(totalCents),
      allocation,
      perPersonTotal: money(lowerShare),
      perPersonTip: perPersonTip.toFixed(2),
      perPersonFoodAndTax: perPersonFoodAndTax.toFixed(2),
      effectiveTipPercent: baseForTip > 0 ? ((tipCents / baseForTip) * 100).toFixed(1) : rate.toFixed(1),
    };
  }, [billAmount, tipRate, splitCount, tipTaxPercent, tipPreTax, tipRounding]);

  const handleCopyTipSummary = () => {
    if (!tipResult) return;
    const count = parseInt(splitCount, 10) || 1;
    const summary = [
      `🧾 Restaurant Bill Split Summary:`,
      `• Food Subtotal: $${tipResult.bill}`,
      parseFloat(tipResult.taxAmount) > 0 ? `• Tax: $${tipResult.taxAmount}` : null,
      `• Gratuity (${tipRate}%): $${tipResult.tip}`,
      `• Grand Total: $${tipResult.total}`,
      tipResult.allocation || `• Split between ${count} guests: $${tipResult.perPersonTotal} each ($${tipResult.perPersonTip} tip/person)`,
      `Calculated via ZixTool (https://zixtool.online/tip-calculator/)`
    ].filter(Boolean).join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      setTipCopied(true);
      setTimeout(() => setTipCopied(false), 2200);
    }
  };

  return (
    <div class="calculator-shell bg-white border border-slate-200/90 rounded-2xl shadow-card p-5 sm:p-7 my-6 transition-all">
      {/* Percentage Calculator */}
      {(toolId === 'percentage-calculator' || toolId === 'reverse-percentage-calculator' || toolId === 'percentage-increase-calculator' || toolId === 'percentage-difference-calculator') && (
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
            <button type="button" aria-pressed={percMode === 'difference'} onClick={() => setPercMode('difference')}
              class={`px-4 py-2 text-xs font-semibold rounded-xl ${percMode === 'difference' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              Percentage difference
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

            {(percMode === 'change' || percMode === 'difference') && (
              <>
                <div class="space-y-1.5">
                  <label for="percentage-first" class="block text-xs font-bold text-slate-700">{percMode === 'difference' ? 'First measurement' : 'Initial Value (From)'}</label>
                  <input
                    id="percentage-first"
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
                  <label for="percentage-second" class="block text-xs font-bold text-slate-700">{percMode === 'difference' ? 'Second measurement' : 'Final Value (To)'}</label>
                  <input
                    id="percentage-second"
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
      {(toolId === 'age-calculator' || toolId === 'chronological-age-calculator') && (
        <div class="space-y-6">
          <a href="#age-by-year" class="text-sm font-semibold text-emerald-800 underline">Only know the birth year?</a>
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

          {ageResult && 'error' in ageResult && <p role="status">{ageResult.error}</p>}
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

      {(toolId === 'age-calculator' || toolId === 'chronological-age-calculator') && <BirthYearCalculator />}

      {/* Date Difference Calculator */}
      {toolId === 'date-difference-calculator' && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1" for="range-start">Start Date</label>
              <input
                type="date"
                id="range-start"
                value={startDate}
                onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1" for="range-end">End Date</label>
              <input
                type="date"
                id="range-end"
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
                {dateDiffResult.federalWorkdays !== null && (
                  <div class="col-span-2 bg-white/80 p-3 rounded-lg">
                    <div class="text-xs text-slate-500">US federal workdays (observed holidays excluded)</div>
                    <div class="font-bold text-slate-900">{dateDiffResult.federalWorkdays} days</div>
                  </div>
                )}
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
      {(toolId === 'tip-calculator' || toolId === 'restaurant-tip-calculator' || toolId === 'canadian-tip-calculator' || toolId === 'haircut-tip-calculator') && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Bill Subtotal ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={billAmount}
                onInput={(e) => setBillAmount((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-lg"
                placeholder="65.00"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Tip Percentage (%)</label>
              <div class="flex space-x-1 mb-2">
                {['10', '15', '18', '20', '25'].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTipRate(rate)}
                    class={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                      tipRate === rate ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <div class="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={tipRate}
                  onInput={(e) => setTipRate((e.target as HTMLInputElement).value)}
                  class="w-full px-4 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-sm"
                  placeholder="Custom %"
                />
                <span class="absolute right-3 top-1.5 text-xs text-slate-400 font-mono">%</span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Split Between (Guests)</label>
              <div class="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const cur = parseInt(splitCount, 10) || 1;
                    if (cur > 1) setSplitCount(String(cur - 1));
                  }}
                  class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition"
                  title="Decrease diners"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={splitCount}
                  onInput={(e) => setSplitCount((e.target as HTMLInputElement).value)}
                  class="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-lg text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    const cur = parseInt(splitCount, 10) || 1;
                    setSplitCount(String(cur + 1));
                  }}
                  class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition"
                  title="Increase diners"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Tipping Controls: Tax & Rounding */}
          <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-xs">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <label class="font-semibold text-slate-700">Optional Sales Tax (%):</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={tipTaxPercent}
                  onInput={(e) => setTipTaxPercent((e.target as HTMLInputElement).value)}
                  class="w-16 px-2 py-1 rounded border border-slate-300 focus:border-emerald-500 font-mono"
                  placeholder="0"
                />
              </div>
              {parseFloat(tipTaxPercent) > 0 && (
                <div class="flex items-center gap-2">
                  <span class="text-slate-600">Calculate tip on:</span>
                  <button
                    type="button"
                    onClick={() => setTipPreTax(true)}
                    class={`px-2.5 py-1 rounded font-medium transition ${
                      tipPreTax ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Pre-tax Subtotal (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipPreTax(false)}
                    class={`px-2.5 py-1 rounded font-medium transition ${
                      !tipPreTax ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Post-tax Total
                  </button>
                </div>
              )}
            </div>

            <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
              <span class="font-semibold text-slate-700">Rounding Options:</span>
              <button
                type="button"
                onClick={() => setTipRounding('none')}
                class={`px-2.5 py-1 rounded font-medium transition ${
                  tipRounding === 'none' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Exact Cents
              </button>
              <button
                type="button"
                onClick={() => setTipRounding('round-total')}
                class={`px-2.5 py-1 rounded font-medium transition ${
                  tipRounding === 'round-total' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Round Up Total Bill ($)
              </button>
              <button
                type="button"
                onClick={() => setTipRounding('round-person')}
                class={`px-2.5 py-1 rounded font-medium transition ${
                  tipRounding === 'round-person' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Round Up Per Person ($)
              </button>
            </div>
          </div>

          {tipResult && (
            <div class="p-6 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-5">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                  <span class="text-xs uppercase font-bold tracking-wider text-emerald-700">
                    Per Person Share ({splitCount} {parseInt(splitCount, 10) === 1 ? 'Guest' : 'Guests'})
                  </span>
                  {tipResult.allocation ? (
                    <div class="mt-1 text-xl font-bold text-emerald-950">{tipResult.allocation}</div>
                  ) : (
                    <div class="text-3xl sm:text-4xl font-extrabold text-emerald-950 mt-1">${tipResult.perPersonTotal}</div>
                  )}
                </div>
                <div class="sm:text-right text-xs text-slate-600 space-y-0.5">
                  <div>Food &amp; Tax: <strong>${tipResult.perPersonFoodAndTax}</strong> / person</div>
                  <div>Gratuity: <strong>${tipResult.perPersonTip}</strong> / person</div>
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-emerald-200/80/60 text-sm">
                <div class="bg-white/80 p-3 rounded-lg border border-emerald-100">
                  <div class="text-2xs text-slate-500 uppercase font-bold">Food Subtotal</div>
                  <div class="font-bold text-slate-900 mt-0.5">${tipResult.bill}</div>
                </div>
                {parseFloat(tipResult.taxAmount) > 0 && (
                  <div class="bg-white/80 p-3 rounded-lg border border-emerald-100">
                    <div class="text-2xs text-slate-500 uppercase font-bold">Sales Tax ({tipTaxPercent}%)</div>
                    <div class="font-bold text-slate-900 mt-0.5">${tipResult.taxAmount}</div>
                  </div>
                )}
                <div class="bg-white/80 p-3 rounded-lg border border-emerald-100">
                  <div class="text-2xs text-slate-500 uppercase font-bold">Total Gratuity ({tipRate}%)</div>
                  <div class="font-bold text-emerald-700 mt-0.5">${tipResult.tip}</div>
                </div>
                <div class="bg-white/80 p-3 rounded-lg border border-emerald-100">
                  <div class="text-2xs text-slate-500 uppercase font-bold">Grand Total (Bill + Tip)</div>
                  <div class="font-bold text-slate-900 mt-0.5">${tipResult.total}</div>
                </div>
              </div>

              <div class="pt-2 flex flex-wrap items-center justify-between gap-3">
                <span class="text-2xs text-emerald-800/80">
                  {tipRounding !== 'none'
                    ? `* Rounded up: effective gratuity rate ${tipResult.effectiveTipPercent}%`
                    : `* Exact calculation: 100% computed locally in browser memory`}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTipSummary}
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{tipCopied ? 'Copied Breakdown!' : 'Copy Split Summary'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body Fat Percentage Calculator */}
      {toolId === 'body-fat-percentage-calculator' && (
        <div class="space-y-6">
          <div class="flex items-center gap-4 border-b border-slate-200/80 pb-4">
            <span class="text-xs font-bold text-slate-700">Gender:</span>
            <div class="flex gap-2">
              <button
                type="button"
                onClick={() => setBfGender('male')}
                class={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                  bfGender === 'male' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setBfGender('female')}
                class={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                  bfGender === 'female' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Female
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                value={bfHeight}
                onInput={(e) => setBfHeight((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="300"
                value={bfWeight}
                onInput={(e) => setBfWeight((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Neck Circumference (cm)</label>
              <input
                type="number"
                min="20"
                max="80"
                value={bfNeck}
                onInput={(e) => setBfNeck((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Waist Circumference (cm)</label>
              <input
                type="number"
                min="40"
                max="180"
                value={bfWaist}
                onInput={(e) => setBfWaist((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base"
              />
              <span class="text-2xs text-slate-500 mt-1 block">Navel level (men) / narrowest waist (women)</span>
            </div>
            {bfGender === 'female' && (
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Hip Circumference (cm)</label>
                <input
                  type="number"
                  min="40"
                  max="180"
                  value={bfHip}
                  onInput={(e) => setBfHip((e.target as HTMLInputElement).value)}
                  class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base"
                />
                <span class="text-2xs text-slate-500 mt-1 block">Widest part of hips / buttocks</span>
              </div>
            )}
          </div>

          <div class="p-6 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-4">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Body Fat Percentage</span>
                <div class="text-3xl sm:text-4xl font-extrabold text-emerald-800 font-mono mt-1">
                  {bfResult.bodyFatPercent}%
                </div>
              </div>
              <span class={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${bfResult.badgeColor}`}>
                {bfResult.category}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div class="p-3 bg-white rounded-lg border border-emerald-100">
                <span class="text-2xs text-slate-500 uppercase font-bold">Fat Mass</span>
                <div class="font-bold text-slate-900 mt-0.5">{bfResult.fatMass} kg</div>
              </div>
              <div class="p-3 bg-white rounded-lg border border-emerald-100">
                <span class="text-2xs text-slate-500 uppercase font-bold">Lean Body Mass</span>
                <div class="font-bold text-slate-900 mt-0.5">{bfResult.leanMass} kg</div>
              </div>
              <div class="p-3 bg-white rounded-lg border border-emerald-100 col-span-2 sm:col-span-1">
                <span class="text-2xs text-slate-500 uppercase font-bold">Method</span>
                <div class="font-bold text-slate-900 mt-0.5">U.S. Navy / Army</div>
              </div>
            </div>
          </div>
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

      {/* DPI / PPI Calculator */}
      {toolId === 'dpi-calculator' && (
        <div class="space-y-6">
          {/* Mode Switcher Tabs */}
          <div class="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setDpiMode('screen')}
              class={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
                dpiMode === 'screen'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Screen PPI & Pixel Density
            </button>
            <button
              type="button"
              onClick={() => setDpiMode('print')}
              class={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
                dpiMode === 'print'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Print Dimensions & Resolution
            </button>
          </div>

          {dpiMode === 'screen' ? (
            <div class="space-y-6">
              {/* Presets */}
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Popular Device Presets
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {screenPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDpiWidth(preset.w);
                        setDpiHeight(preset.h);
                        setDpiDiagonal(preset.d);
                      }}
                      class="px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-transparent rounded-lg transition text-center truncate"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Horizontal Pixels (Width px)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dpiWidth}
                    onInput={(e) => setDpiWidth((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base font-bold"
                    placeholder="3840"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Vertical Pixels (Height px)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dpiHeight}
                    onInput={(e) => setDpiHeight((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base font-bold"
                    placeholder="2160"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Diagonal Screen Size (Inches)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={dpiDiagonal}
                    onInput={(e) => setDpiDiagonal((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base font-bold"
                    placeholder="27"
                  />
                </div>
              </div>

              {/* Result Summary */}
              {dpiResult && (
                <div class="space-y-4">
                  <div class="p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p class="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                        Pixel Density (PPI / DPI)
                      </p>
                      <div class="flex items-baseline gap-2">
                        <span class="text-3xl sm:text-4xl font-extrabold text-emerald-900 font-mono">
                          {dpiResult.ppi}
                        </span>
                        <span class="text-sm font-semibold text-emerald-700">Pixels Per Inch</span>
                      </div>
                    </div>
                    <div class="text-right sm:border-l sm:border-emerald-200/80 sm:pl-6 text-left sm:text-right">
                      <p class="text-xs font-semibold text-slate-600 mb-0.5">Pixel Pitch / Size</p>
                      <p class="text-base font-mono font-bold text-slate-900">
                        {dpiResult.dotPitchMm} mm ({dpiResult.dotPitchMicrons} µm)
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p class="text-xs font-semibold text-slate-500 mb-1">Total Resolution</p>
                      <p class="text-sm font-bold text-slate-900 font-mono">
                        {dpiWidth} × {dpiHeight}
                      </p>
                      <p class="text-2xs text-slate-400 mt-0.5">{dpiResult.megapixels} Megapixels</p>
                    </div>
                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p class="text-xs font-semibold text-slate-500 mb-1">Aspect Ratio</p>
                      <p class="text-sm font-bold text-emerald-700 font-mono">
                        {dpiResult.aspectRatio}
                      </p>
                      <p class="text-2xs text-slate-400 mt-0.5">Standard Display Ratio</p>
                    </div>
                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p class="text-xs font-semibold text-slate-500 mb-1">Display Dimensions</p>
                      <p class="text-sm font-bold text-slate-900 font-mono">
                        {dpiResult.dimensionsInches}
                      </p>
                      <p class="text-2xs text-slate-400 mt-0.5">{dpiResult.dimensionsCm}</p>
                    </div>
                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p class="text-xs font-semibold text-slate-500 mb-1">Retina Viewing Dist.</p>
                      <p class="text-sm font-bold text-slate-900 font-mono">
                        {dpiResult.viewingDistance}
                      </p>
                      <p class="text-2xs text-slate-400 mt-0.5">Where pixels become invisible</p>
                    </div>
                  </div>

                  {/* Math Formula Card */}
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
                    <p class="font-bold text-slate-800 mb-1 font-sans">Calculation Formula:</p>
                    <p>
                      Diagonal Px = √({dpiWidth}² + {dpiHeight}²) = {Math.round(Math.sqrt(Number(dpiWidth) ** 2 + Number(dpiHeight) ** 2))} px
                    </p>
                    <p>
                      PPI = {Math.round(Math.sqrt(Number(dpiWidth) ** 2 + Number(dpiHeight) ** 2))} ÷ {dpiDiagonal}" = <strong class="text-emerald-700">{dpiResult.ppi} PPI</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div class="space-y-6">
              {/* Presets */}
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Target Print Quality Presets
                </label>
                <div class="flex flex-wrap gap-2">
                  {printDpiPresets.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPrintTargetDpi(rate)}
                      class={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                        printTargetDpi === rate
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {rate} DPI {rate === '300' ? '(Standard Print)' : rate === '72' ? '(Web Screen)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Image Width (Pixels)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={printImageW}
                    onInput={(e) => setPrintImageW((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base font-bold"
                    placeholder="3000"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Image Height (Pixels)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={printImageH}
                    onInput={(e) => setPrintImageH((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base font-bold"
                    placeholder="2000"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Target Print Resolution (DPI)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={printTargetDpi}
                    onInput={(e) => setPrintTargetDpi((e.target as HTMLInputElement).value)}
                    class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base font-bold"
                    placeholder="300"
                  />
                </div>
              </div>

              {/* Result Summary */}
              {printResult && (
                <div class="space-y-4">
                  <div class="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                      <div>
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Maximum Physical Print Size at {printTargetDpi} DPI
                        </p>
                        <p class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                          {printResult.widthInches}" × {printResult.heightInches}"
                        </p>
                        <p class="text-sm font-semibold text-slate-600 mt-0.5">
                          {printResult.widthCm} cm × {printResult.heightCm} cm
                        </p>
                      </div>
                      <div class="self-start sm:self-auto">
                        <span class={`inline-block px-3 py-1.5 rounded-lg border text-xs font-bold ${printResult.qualityColor}`}>
                          {printResult.quality}
                        </span>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div class="p-3 bg-white rounded-lg border border-slate-200">
                        <p class="text-xs text-slate-500">Total Megapixels</p>
                        <p class="text-sm font-bold font-mono text-slate-900">{printResult.megapixels} MP</p>
                      </div>
                      <div class="p-3 bg-white rounded-lg border border-slate-200">
                        <p class="text-xs text-slate-500">Width Formula</p>
                        <p class="text-sm font-bold font-mono text-slate-900">{printImageW} ÷ {printTargetDpi} = {printResult.widthInches}"</p>
                      </div>
                      <div class="p-3 bg-white rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                        <p class="text-xs text-slate-500">Height Formula</p>
                        <p class="text-sm font-bold font-mono text-slate-900">{printImageH} ÷ {printTargetDpi} = {printResult.heightInches}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
