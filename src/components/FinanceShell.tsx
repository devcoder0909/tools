import { useState, useMemo, useEffect } from 'preact/hooks';

interface FinanceShellProps {
  toolId: string;
  toolName: string;
}

export default function FinanceShell({ toolId }: FinanceShellProps) {
  // Global Currency State for Calculators (INR / USD)
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const currSym = currency === 'INR' ? '₹' : '$';
  const currLocale = currency === 'INR' ? 'en-IN' : 'en-US';

  const formatMoney = (val: number) => {
    return `${currSym}${Math.round(val).toLocaleString(currLocale)}`;
  };

  // --- 1. EMI / Loan / Mortgage Calculator State ---
  const [loanAmount, setLoanAmount] = useState<number>(1000000); // 10 Lakhs or $1M
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5%
  const [loanTenureYears, setLoanTenureYears] = useState<number>(20); // 20 years

  const emiCalc = useMemo(() => {
    const P = Math.max(0, loanAmount);
    const r = interestRate / 12 / 100;
    const n = Math.max(1, loanTenureYears * 12);

    if (P <= 0 || r <= 0 || n <= 0) {
      return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0, principalRatio: 100, interestRatio: 0, schedule: [] };
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = Math.max(0, totalPayment - P);
    const principalRatio = totalPayment > 0 ? (P / totalPayment) * 100 : 100;
    const interestRatio = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

    // First 12 months amortization schedule
    const schedule: { month: number; principal: number; interest: number; balance: number }[] = [];
    let balance = P;
    for (let m = 1; m <= Math.min(n, 24); m++) {
      const monthInterest = balance * r;
      const monthPrincipal = emi - monthInterest;
      balance = Math.max(0, balance - monthPrincipal);
      schedule.push({
        month: m,
        principal: Math.round(monthPrincipal),
        interest: Math.round(monthInterest),
        balance: Math.round(balance),
      });
    }

    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      principalRatio: Math.round(principalRatio * 10) / 10,
      interestRatio: Math.round(interestRatio * 10) / 10,
      schedule,
    };
  }, [loanAmount, interestRate, loanTenureYears]);

  // --- 2. SIP Calculator State ---
  // Default values matching real-world investing benchmarks (e.g. 42,000 / mo @ 12% for 10 Yrs)
  const [sipMonthly, setSipMonthly] = useState<number>(42000);
  const [sipRate, setSipRate] = useState<number>(12); // 12% p.a.
  const [sipYears, setSipYears] = useState<number>(10);

  const sipCalc = useMemo(() => {
    const P = Math.max(0, sipMonthly);
    const i = sipRate / 12 / 100;
    const n = Math.max(1, sipYears * 12);

    if (P <= 0 || i <= 0 || n <= 0) {
      return {
        invested: 0,
        returns: 0,
        total: 0,
        investedRatio: 100,
        returnsRatio: 0,
        multiplier: '1.00',
        milestones: [],
      };
    }

    // Future Value of Annuity Due: P * [((1 + i)^n - 1) / i] * (1 + i)
    const totalValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const investedAmount = P * n;
    const estimatedReturns = Math.max(0, totalValue - investedAmount);

    const investedRatio = totalValue > 0 ? (investedAmount / totalValue) * 100 : 100;
    const returnsRatio = totalValue > 0 ? (estimatedReturns / totalValue) * 100 : 0;
    const multiplier = investedAmount > 0 ? (totalValue / investedAmount).toFixed(2) : '1.00';

    // Accumulation milestone checkpoints (Years 1, 3, 5, 10, 15, 20, 25, 30...)
    const milestoneYears = [1, 3, 5, 10, 15, 20, 25, 30].filter((y) => y <= sipYears);
    if (!milestoneYears.includes(sipYears) && sipYears > 0) {
      milestoneYears.push(sipYears);
      milestoneYears.sort((a, b) => a - b);
    }

    const milestones = milestoneYears.map((yr) => {
      const months = yr * 12;
      const inv = P * months;
      const fv = P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
      const ret = fv - inv;
      return {
        year: yr,
        invested: Math.round(inv),
        returns: Math.round(ret),
        total: Math.round(fv),
      };
    });

    return {
      invested: Math.round(investedAmount),
      returns: Math.round(estimatedReturns),
      total: Math.round(totalValue),
      investedRatio: Math.round(investedRatio * 10) / 10,
      returnsRatio: Math.round(returnsRatio * 10) / 10,
      multiplier,
      milestones,
    };
  }, [sipMonthly, sipRate, sipYears]);

  // --- 3. Compound Interest Calculator State ---
  const [ciPrincipal, setCiPrincipal] = useState<number>(50000);
  const [ciRate, setCiRate] = useState<number>(10);
  const [ciYears, setCiYears] = useState<number>(10);
  const [ciFrequency, setCiFrequency] = useState<number>(12); // monthly

  const ciCalc = useMemo(() => {
    const P = Math.max(0, Number(ciPrincipal) || 0);
    const r = (Math.max(0, Number(ciRate) || 0)) / 100;
    const t = Math.max(0, Number(ciYears) || 0);
    const n = Math.max(1, Number(ciFrequency) || 1);

    if (P <= 0 || r <= 0 || t <= 0) {
      return { futureValue: P, totalInterest: 0, principalRatio: 100, interestRatio: 0, schedule: [] };
    }

    const futureValue = P * Math.pow(1 + r / n, n * t);
    const totalInterest = Math.max(0, futureValue - P);
    const principalRatio = futureValue > 0 ? (P / futureValue) * 100 : 100;
    const interestRatio = futureValue > 0 ? (totalInterest / futureValue) * 100 : 0;

    const schedule: { year: number; interestEarned: number; balance: number }[] = [];
    for (let y = 1; y <= Math.min(t, 25); y++) {
      const yearBalance = P * Math.pow(1 + r / n, n * y);
      const prevBalance = y === 1 ? P : P * Math.pow(1 + r / n, n * (y - 1));
      schedule.push({
        year: y,
        interestEarned: Math.round(yearBalance - prevBalance),
        balance: Math.round(yearBalance),
      });
    }

    return {
      futureValue: Math.round(futureValue),
      totalInterest: Math.round(totalInterest),
      principalRatio: Math.round(principalRatio * 10) / 10,
      interestRatio: Math.round(interestRatio * 10) / 10,
      schedule,
    };
  }, [ciPrincipal, ciRate, ciYears, ciFrequency]);

  // --- 4. GST Calculator State ---
  const [gstAmount, setGstAmount] = useState<number>(50000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstType, setGstType] = useState<'exclusive' | 'inclusive'>('exclusive');

  const gstCalc = useMemo(() => {
    const rate = Math.max(0, Number(gstRate) || 0);
    const amount = Math.max(0, Number(gstAmount) || 0);

    let netAmount = 0;
    let totalGst = 0;
    let grossTotal = 0;

    if (gstType === 'exclusive') {
      netAmount = amount;
      totalGst = (amount * rate) / 100;
      grossTotal = netAmount + totalGst;
    } else {
      grossTotal = amount;
      netAmount = amount / (1 + rate / 100);
      totalGst = grossTotal - netAmount;
    }

    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    return {
      netAmount: Math.round(netAmount * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      grossTotal: Math.round(grossTotal * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
    };
  }, [gstAmount, gstRate, gstType]);

  // --- 5. BMI Calculator State ---
  const [bmiUnit, setBmiUnit] = useState<'metric' | 'imperial'>('metric');
  const [bmiWeightKg, setBmiWeightKg] = useState<number>(70);
  const [bmiHeightCm, setBmiHeightCm] = useState<number>(175);
  const [bmiWeightLbs, setBmiWeightLbs] = useState<number>(154);
  const [bmiHeightFt, setBmiHeightFt] = useState<number>(5);
  const [bmiHeightIn, setBmiHeightIn] = useState<number>(9);

  const bmiCalc = useMemo(() => {
    let bmi = 0;
    if (bmiUnit === 'metric') {
      const hM = bmiHeightCm / 100;
      if (hM > 0) bmi = bmiWeightKg / (hM * hM);
    } else {
      const totalInches = bmiHeightFt * 12 + bmiHeightIn;
      if (totalInches > 0) bmi = (bmiWeightLbs / (totalInches * totalInches)) * 703;
    }

    const rounded = Number(bmi.toFixed(1));
    let category = 'Normal Weight';
    let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let badgeColor = 'bg-emerald-600 text-white';

    if (rounded < 18.5) {
      category = 'Underweight';
      color = 'text-sky-700 bg-sky-50 border-sky-200';
      badgeColor = 'bg-sky-600 text-white';
    } else if (rounded >= 25 && rounded < 30) {
      category = 'Overweight';
      color = 'text-amber-700 bg-amber-50 border-amber-200';
      badgeColor = 'bg-amber-600 text-white';
    } else if (rounded >= 30) {
      category = 'Obese Class';
      color = 'text-rose-700 bg-rose-50 border-rose-200';
      badgeColor = 'bg-rose-600 text-white';
    }

    return { bmi: rounded, category, color, badgeColor };
  }, [bmiUnit, bmiWeightKg, bmiHeightCm, bmiWeightLbs, bmiHeightFt, bmiHeightIn]);

  // --- 6. Currency Converter State & Dynamic Rate Engine ---
  const DEFAULT_CURRENCY_RATES: Record<string, { name: string; rate: number; symbol: string }> = {
    USD: { name: 'US Dollar', rate: 1.0, symbol: '$' },
    EUR: { name: 'Euro', rate: 0.95, symbol: '€' },
    GBP: { name: 'British Pound', rate: 0.79, symbol: '£' },
    INR: { name: 'Indian Rupee', rate: 84.4, symbol: '₹' },
    JPY: { name: 'Japanese Yen', rate: 154.2, symbol: '¥' },
    CAD: { name: 'Canadian Dollar', rate: 1.40, symbol: 'CA$' },
    AUD: { name: 'Australian Dollar', rate: 1.54, symbol: 'AU$' },
    CHF: { name: 'Swiss Franc', rate: 0.88, symbol: 'CHF' },
    CNY: { name: 'Chinese Yuan', rate: 7.23, symbol: '¥' },
    SGD: { name: 'Singapore Dollar', rate: 1.34, symbol: 'S$' },
    AED: { name: 'UAE Dirham', rate: 3.67, symbol: 'AED' },
    SAR: { name: 'Saudi Riyal', rate: 3.75, symbol: 'SAR' },
    NZD: { name: 'New Zealand Dollar', rate: 1.71, symbol: 'NZ$' },
    HKD: { name: 'Hong Kong Dollar', rate: 7.78, symbol: 'HK$' },
    KRW: { name: 'South Korean Won', rate: 1395.0, symbol: '₩' },
    BRL: { name: 'Brazilian Real', rate: 5.75, symbol: 'R$' },
    MXN: { name: 'Mexican Peso', rate: 20.3, symbol: 'Mex$' },
    SEK: { name: 'Swedish Krona', rate: 10.9, symbol: 'kr' },
    NOK: { name: 'Norwegian Krone', rate: 11.0, symbol: 'kr' },
    ZAR: { name: 'South African Rand', rate: 18.1, symbol: 'R' },
  };

  const [currAmount, setCurrAmount] = useState<number>(1000);
  const [currFrom, setCurrFrom] = useState<string>('USD');
  const [currTo, setCurrTo] = useState<string>('INR');
  const [currencyRates, setCurrencyRates] = useState<Record<string, { name: string; rate: number; symbol: string }>>(DEFAULT_CURRENCY_RATES);
  const [rateSourceStatus, setRateSourceStatus] = useState<'loading' | 'live' | 'fallback'>('loading');
  const [rateLastUpdated, setRateLastUpdated] = useState<string>('');

  useEffect(() => {
    if (toolId !== 'currency-converter') return;
    let isCancelled = false;

    async function loadRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error('Primary rate provider unreachable');
        const data = await res.json();
        if (data && data.rates && !isCancelled) {
          setCurrencyRates((prev) => {
            const updated = { ...prev };
            for (const key of Object.keys(updated)) {
              if (typeof data.rates[key] === 'number') {
                updated[key] = { ...updated[key], rate: data.rates[key] };
              }
            }
            return updated;
          });
          const updateDate = data.time_last_update_utc
            ? new Date(data.time_last_update_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          setRateLastUpdated(updateDate);
          setRateSourceStatus('live');
          return;
        }
      } catch {
        try {
          const res2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { signal: AbortSignal.timeout(5000) });
          if (!res2.ok) throw new Error('Secondary rate provider unreachable');
          const data2 = await res2.json();
          if (data2 && data2.rates && !isCancelled) {
            setCurrencyRates((prev) => {
              const updated = { ...prev };
              for (const key of Object.keys(updated)) {
                if (typeof data2.rates[key] === 'number') {
                  updated[key] = { ...updated[key], rate: data2.rates[key] };
                }
              }
              return updated;
            });
            const updateDate = data2.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            setRateLastUpdated(updateDate);
            setRateSourceStatus('live');
            return;
          }
        } catch {
          if (!isCancelled) {
            setRateSourceStatus('fallback');
            setRateLastUpdated('Benchmark Fallback');
          }
        }
      }
    }

    loadRates();
    return () => { isCancelled = true; };
  }, [toolId]);

  const handleSwapCurrencies = () => {
    const temp = currFrom;
    setCurrFrom(currTo);
    setCurrTo(temp);
  };

  const convertedCurrency = useMemo(() => {
    const fromRate = currencyRates[currFrom]?.rate || 1.0;
    const toRate = currencyRates[currTo]?.rate || 1.0;
    const inUsd = currAmount / fromRate;
    const result = inUsd * toRate;
    return Number(result.toFixed(2));
  }, [currAmount, currFrom, currTo, currencyRates]);

  const unitRate = useMemo(() => {
    const fromRate = currencyRates[currFrom]?.rate || 1.0;
    const toRate = currencyRates[currTo]?.rate || 1.0;
    return toRate / fromRate;
  }, [currFrom, currTo, currencyRates]);

  return (
    <div class="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-card mb-8 transition-all">
      {/* ======================================================== */}
      {/* 1. SIP CALCULATOR (GROWW / ZERODHA HIGH-CONVERTING STYLE) */}
      {/* ======================================================== */}
      {toolId === 'sip-calculator' && (
        <div class="space-y-8">
          {/* Header & Currency Switcher */}
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900">
                Systematic Investment Plan (SIP) Calculator
              </h2>
              <p class="text-xs text-slate-500">
                Calculate compounding wealth growth with dual numeric inputs &amp; synchronized sliders.
              </p>
            </div>
            <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                class={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  currency === 'INR' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                class={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  currency === 'USD' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct Inputs + Sliders + Quick Chips */}
            <div class="lg:col-span-7 space-y-6">
              {/* Field 1: Monthly Investment */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="sip-monthly-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Monthly Investment
                  </label>
                  {/* Direct Numeric Input Box */}
                  <div class="relative w-36 sm:w-44">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 select-none">
                      {currSym}
                    </span>
                    <input
                      id="sip-monthly-input"
                      type="number"
                      min="100"
                      max="10000000"
                      step="500"
                      value={sipMonthly}
                      onInput={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        setSipMonthly(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-7 pr-3 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={Math.min(100000, sipMonthly)}
                  onInput={(e) => setSipMonthly(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                {/* Quick Presets (Including ₹42,000 as requested) */}
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Presets:</span>
                  {(currency === 'INR'
                    ? [
                        { label: '₹5,000', val: 5000 },
                        { label: '₹10,000', val: 10000 },
                        { label: '₹25,000', val: 25000 },
                        { label: '₹42,000', val: 42000 },
                        { label: '₹50,000', val: 50000 },
                        { label: '₹1 Lakh', val: 100000 },
                      ]
                    : [
                        { label: '$250', val: 250 },
                        { label: '$500', val: 500 },
                        { label: '$1,000', val: 1000 },
                        { label: '$2,500', val: 2500 },
                        { label: '$5,000', val: 5000 },
                        { label: '$10,000', val: 10000 },
                      ]
                  ).map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setSipMonthly(p.val)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        sipMonthly === p.val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Expected Annual Return Rate (%) */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="sip-rate-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Expected Annual Return Rate (%)
                  </label>
                  {/* Direct Numeric Input Box */}
                  <div class="relative w-28 sm:w-32">
                    <input
                      id="sip-rate-input"
                      type="number"
                      min="1"
                      max="40"
                      step="0.1"
                      value={sipRate}
                      onInput={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        setSipRate(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-3 pr-7 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 select-none">
                      %
                    </span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={sipRate}
                  onInput={(e) => setSipRate(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                {/* Rate Presets */}
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Benchmarks:</span>
                  {[
                    { label: '8% (FD/Debt)', val: 8 },
                    { label: '10% (Hybrid)', val: 10 },
                    { label: '12% (Index/Large Cap)', val: 12 },
                    { label: '15% (Mid/Small Cap)', val: 15 },
                    { label: '18% (Aggressive)', val: 18 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setSipRate(p.val)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        sipRate === p.val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Investment Time Period (Years) */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="sip-years-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Investment Time Period
                  </label>
                  {/* Direct Numeric Input Box */}
                  <div class="relative w-28 sm:w-32">
                    <input
                      id="sip-years-input"
                      type="number"
                      min="1"
                      max="40"
                      step="1"
                      value={sipYears}
                      onInput={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                        setSipYears(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-3 pr-8 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs font-bold text-slate-500 uppercase select-none">
                      Yrs
                    </span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="1"
                  max="35"
                  step="1"
                  value={sipYears}
                  onInput={(e) => setSipYears(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                {/* Tenure Presets */}
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Horizons:</span>
                  {[3, 5, 10, 15, 20, 25, 30].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSipYears(yr)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        sipYears === yr
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {yr} Yrs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Visual Maturity Summary & Ratio Bar */}
            <div class="lg:col-span-5 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 border border-emerald-100 rounded-3xl p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <div class="flex items-center justify-between text-2xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                  <span>Total Maturity Value</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {sipCalc.multiplier}x Multiplier
                  </span>
                </div>
                <p class="text-3xl sm:text-4xl font-black text-emerald-950 font-mono tracking-tight my-1">
                  {formatMoney(sipCalc.total)}
                </p>
                <p class="text-xs text-slate-500 mb-6">
                  Calculated after {sipYears} years ({sipYears * 12} installments) at {sipRate}% annual compounding.
                </p>

                {/* Visual Ratio Progress Split Bar */}
                <div class="space-y-1.5 mb-6">
                  <div class="flex justify-between text-2xs font-semibold text-slate-600">
                    <span class="flex items-center gap-1">
                      <span class="w-2.5 h-2.5 rounded-xs bg-slate-700 inline-block"></span>
                      Invested ({sipCalc.investedRatio}%)
                    </span>
                    <span class="flex items-center gap-1 text-emerald-700">
                      <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                      Est. Returns ({sipCalc.returnsRatio}%)
                    </span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${sipCalc.investedRatio}%` }}
                      class="bg-slate-700 h-full transition-all duration-300"
                    ></div>
                    <div
                      style={{ width: `${sipCalc.returnsRatio}%` }}
                      class="bg-emerald-500 h-full transition-all duration-300"
                    ></div>
                  </div>
                </div>

                {/* Financial Breakdown Cards */}
                <div class="space-y-2.5 text-xs">
                  <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-slate-600">
                      <span class="w-2 h-2 rounded-full bg-slate-600"></span>
                      <span>Invested Amount:</span>
                    </div>
                    <span class="font-bold font-mono text-slate-900 text-sm">
                      {formatMoney(sipCalc.invested)}
                    </span>
                  </div>

                  <div class="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-emerald-800 font-medium">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Est. Wealth Gain:</span>
                    </div>
                    <span class="font-extrabold font-mono text-emerald-700 text-sm">
                      +{formatMoney(sipCalc.returns)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compounding Wisdom Insight */}
              <div class="mt-6 pt-4 border-t border-emerald-100/70 text-2xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>The Power of Compounding:</strong> At {sipRate}% CAGR, your wealth doubles approximately every {(72 / Math.max(0.1, sipRate)).toFixed(1)} years under the Rule of 72.</span>
              </div>
            </div>
          </div>

          {/* Accumulation Milestones Table */}
          {sipCalc.milestones.length > 0 && (
            <div class="border-t border-slate-200 pt-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Wealth Accumulation Timeline
                </h3>
                <span class="text-2xs text-slate-500">
                  {formatMoney(sipMonthly)} / month @ {sipRate}% p.a.
                </span>
              </div>
              <div class="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th class="p-3">Horizon</th>
                      <th class="p-3">Invested Principal</th>
                      <th class="p-3">Estimated Gains</th>
                      <th class="p-3">Total Corpus Value</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-mono">
                    {sipCalc.milestones.map((m) => (
                      <tr key={m.year} class="hover:bg-emerald-50/40 transition">
                        <td class="p-3 font-sans font-bold text-slate-900">
                          {m.year} {m.year === 1 ? 'Year' : 'Years'}
                        </td>
                        <td class="p-3 text-slate-600">{formatMoney(m.invested)}</td>
                        <td class="p-3 text-emerald-700 font-semibold">+{formatMoney(m.returns)}</td>
                        <td class="p-3 text-slate-900 font-bold">{formatMoney(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EMI / LOAN / MORTGAGE CALCULATOR                      */}
      {/* ======================================================== */}
      {(toolId === 'emi-calculator' || toolId === 'loan-calculator' || toolId === 'mortgage-calculator') && (
        <div class="space-y-8">
          {/* Header & Currency Switcher */}
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900">
                {toolId === 'mortgage-calculator'
                  ? 'Mortgage Payment & Amortization Calculator'
                  : 'Equated Monthly Installment (EMI) Calculator'}
              </h2>
              <p class="text-xs text-slate-500">
                Dual numeric inputs, synchronized sliders, and complete reducing balance amortization schedule.
              </p>
            </div>
            <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                class={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  currency === 'INR' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                class={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  currency === 'USD' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct Inputs + Sliders */}
            <div class="lg:col-span-7 space-y-6">
              {/* Field 1: Principal Loan Amount */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="emi-principal-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    {toolId === 'mortgage-calculator' ? 'Mortgage Loan Principal' : 'Loan Principal Amount'}
                  </label>
                  <div class="relative w-40 sm:w-48">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 select-none">
                      {currSym}
                    </span>
                    <input
                      id="emi-principal-input"
                      type="number"
                      min="1000"
                      max="100000000"
                      step="10000"
                      value={loanAmount}
                      onInput={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        setLoanAmount(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-7 pr-3 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <input
                  type="range"
                  min="50000"
                  max="10000000"
                  step="50000"
                  value={Math.min(10000000, loanAmount)}
                  onInput={(e) => setLoanAmount(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                {/* Loan Amount Presets */}
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Presets:</span>
                  {(currency === 'INR'
                    ? [
                        { label: '₹10 Lakh', val: 1000000 },
                        { label: '₹25 Lakh', val: 2500000 },
                        { label: '₹50 Lakh', val: 5000000 },
                        { label: '₹75 Lakh', val: 7500000 },
                        { label: '₹1 Crore', val: 10000000 },
                      ]
                    : [
                        { label: '$50K', val: 50000 },
                        { label: '$100K', val: 100000 },
                        { label: '$250K', val: 250000 },
                        { label: '$500K', val: 500000 },
                        { label: '$1M', val: 1000000 },
                      ]
                  ).map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setLoanAmount(p.val)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        loanAmount === p.val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Annual Interest Rate (%) */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="emi-rate-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Annual Interest Rate (%)
                  </label>
                  <div class="relative w-28 sm:w-32">
                    <input
                      id="emi-rate-input"
                      type="number"
                      min="0.5"
                      max="30"
                      step="0.05"
                      value={interestRate}
                      onInput={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        setInterestRate(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-3 pr-7 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 select-none">
                      %
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.1"
                  value={interestRate}
                  onInput={(e) => setInterestRate(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                {/* Interest Rate Presets */}
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Rates:</span>
                  {[6.5, 7.5, 8.5, 9.5, 10.5, 12.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setInterestRate(rate)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        interestRate === rate
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Loan Term / Tenure */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="emi-tenure-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Loan Duration / Tenure
                  </label>
                  <div class="relative w-28 sm:w-32">
                    <input
                      id="emi-tenure-input"
                      type="number"
                      min="1"
                      max="35"
                      step="1"
                      value={loanTenureYears}
                      onInput={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                        setLoanTenureYears(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-3 pr-8 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs font-bold text-slate-500 uppercase select-none">
                      Yrs
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={loanTenureYears}
                  onInput={(e) => setLoanTenureYears(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                {/* Tenure Presets */}
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Terms:</span>
                  {[5, 10, 15, 20, 25, 30].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setLoanTenureYears(yr)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        loanTenureYears === yr
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {yr} Yrs ({yr * 12} Mos)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Monthly Payment & Cost Breakdown */}
            <div class="lg:col-span-5 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <span class="text-2xs uppercase font-bold text-slate-500 tracking-wider block">
                  {toolId === 'mortgage-calculator' ? 'Monthly Mortgage Payment' : 'Monthly Payment (EMI)'}
                </span>
                <p class="text-3xl sm:text-4xl font-black text-emerald-800 font-mono tracking-tight my-1">
                  {formatMoney(emiCalc.monthlyEmi)} <span class="text-xs font-semibold text-slate-500">/ mo</span>
                </p>
                <p class="text-xs text-slate-500 mb-6">
                  Fixed monthly reducing balance installment for {loanTenureYears * 12} payment cycles.
                </p>

                {/* Split Progress Bar */}
                <div class="space-y-1.5 mb-6">
                  <div class="flex justify-between text-2xs font-semibold text-slate-600">
                    <span class="flex items-center gap-1 text-slate-700">
                      <span class="w-2.5 h-2.5 rounded-xs bg-slate-700 inline-block"></span>
                      Principal ({emiCalc.principalRatio}%)
                    </span>
                    <span class="flex items-center gap-1 text-amber-700">
                      <span class="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block"></span>
                      Total Interest ({emiCalc.interestRatio}%)
                    </span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${emiCalc.principalRatio}%` }}
                      class="bg-slate-700 h-full transition-all duration-300"
                    ></div>
                    <div
                      style={{ width: `${emiCalc.interestRatio}%` }}
                      class="bg-amber-500 h-full transition-all duration-300"
                    ></div>
                  </div>
                </div>

                {/* Breakdown Summary */}
                <div class="space-y-2 text-xs">
                  <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between">
                    <span class="text-slate-600">Principal Borrowed:</span>
                    <span class="font-bold font-mono text-slate-900">{formatMoney(loanAmount)}</span>
                  </div>
                  <div class="p-3 bg-white rounded-xl border border-amber-200 flex justify-between">
                    <span class="text-amber-800 font-medium">Total Interest Payable:</span>
                    <span class="font-bold font-mono text-amber-700">+{formatMoney(emiCalc.totalInterest)}</span>
                  </div>
                  <div class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex justify-between text-emerald-950 font-bold">
                    <span>Total Amount Repaid:</span>
                    <span class="font-mono">{formatMoney(emiCalc.totalPayment)}</span>
                  </div>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-slate-200 text-2xs text-slate-500 leading-relaxed flex items-start gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Prepayment Tip:</strong> Paying just 1 extra EMI per year can reduce a 20-year loan tenure by over 3 to 4 years and save thousands in total interest.</span>
              </div>
            </div>
          </div>

          {/* Amortization Table */}
          {emiCalc.schedule.length > 0 && (
            <div class="border-t border-slate-200 pt-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Initial Amortization Schedule (First 24 Months)
                </h3>
                <span class="text-2xs text-slate-500">Reducing Balance Compounding</span>
              </div>
              <div class="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs max-h-80">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th class="p-3">Payment #</th>
                      <th class="p-3">Principal Paid</th>
                      <th class="p-3">Interest Paid</th>
                      <th class="p-3">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-mono">
                    {emiCalc.schedule.map((row) => (
                      <tr key={row.month} class="hover:bg-slate-50 transition">
                        <td class="p-3 font-sans text-slate-600">Month {row.month}</td>
                        <td class="p-3 text-emerald-700 font-semibold">{formatMoney(row.principal)}</td>
                        <td class="p-3 text-amber-700">{formatMoney(row.interest)}</td>
                        <td class="p-3 text-slate-900 font-bold">{formatMoney(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. COMPOUND INTEREST CALCULATOR                           */}
      {/* ======================================================== */}
      {toolId === 'compound-interest-calculator' && (
        <div class="space-y-8">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900">
                Compound Interest Future Value Calculator
              </h2>
              <p class="text-xs text-slate-500">
                Direct numeric inputs, compounding frequency switchers, and annual growth schedules.
              </p>
            </div>
            <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                class={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  currency === 'INR' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                class={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  currency === 'USD' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-7 space-y-6">
              {/* Field 1: Initial Principal Deposit */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="ci-principal-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Initial Principal Deposit
                  </label>
                  <div class="relative w-36 sm:w-44">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 select-none">
                      {currSym}
                    </span>
                    <input
                      id="ci-principal-input"
                      type="number"
                      min="500"
                      max="100000000"
                      step="1000"
                      value={ciPrincipal}
                      onInput={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        setCiPrincipal(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-7 pr-3 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="5000"
                  value={Math.min(1000000, ciPrincipal)}
                  onInput={(e) => setCiPrincipal(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Presets:</span>
                  {(currency === 'INR'
                    ? [
                        { label: '₹10,000', val: 10000 },
                        { label: '₹25,000', val: 25000 },
                        { label: '₹50,000', val: 50000 },
                        { label: '₹1 Lakh', val: 100000 },
                        { label: '₹5 Lakh', val: 500000 },
                      ]
                    : [
                        { label: '$2,500', val: 2500 },
                        { label: '$5,000', val: 5000 },
                        { label: '$10,000', val: 10000 },
                        { label: '$25,000', val: 25000 },
                        { label: '$50,000', val: 50000 },
                      ]
                  ).map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setCiPrincipal(p.val)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        ciPrincipal === p.val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Annual Interest Rate */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="ci-rate-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Annual Interest Rate (%)
                  </label>
                  <div class="relative w-28 sm:w-32">
                    <input
                      id="ci-rate-input"
                      type="number"
                      min="0.5"
                      max="30"
                      step="0.1"
                      value={ciRate}
                      onInput={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        setCiRate(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-3 pr-7 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 select-none">
                      %
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={ciRate}
                  onInput={(e) => setCiRate(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Benchmarks:</span>
                  {[5, 7, 8, 10, 12, 15].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setCiRate(rate)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        ciRate === rate
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Investment Tenure (Years) */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <label for="ci-years-input" class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Investment Tenure (Years)
                  </label>
                  <div class="relative w-28 sm:w-32">
                    <input
                      id="ci-years-input"
                      type="number"
                      min="1"
                      max="40"
                      step="1"
                      value={ciYears}
                      onInput={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                        setCiYears(isNaN(val) ? 0 : val);
                      }}
                      class="w-full pl-3 pr-8 py-2 text-right text-sm sm:text-base font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs font-bold text-slate-500 uppercase select-none">
                      Yrs
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="35"
                  step="1"
                  value={ciYears}
                  onInput={(e) => setCiYears(Number((e.target as HTMLInputElement).value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-2xs font-bold uppercase text-slate-400 mr-1">Horizons:</span>
                  {[3, 5, 10, 15, 20, 25, 30].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setCiYears(yr)}
                      class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition ${
                        ciYears === yr
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {yr} Yrs
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 4: Compounding Frequency */}
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                <label class="text-xs sm:text-sm font-bold text-slate-800 block">
                  Compounding Frequency
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Annually', freq: 1 },
                    { label: 'Semi-Annual', freq: 2 },
                    { label: 'Quarterly', freq: 4 },
                    { label: 'Monthly', freq: 12 },
                    { label: 'Daily', freq: 365 },
                  ].map((item) => (
                    <button
                      key={item.freq}
                      type="button"
                      onClick={() => setCiFrequency(item.freq)}
                      class={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                        ciFrequency === item.freq
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Maturity Card */}
            <div class="lg:col-span-5 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50 border border-emerald-100 rounded-3xl p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <span class="text-2xs uppercase font-bold text-slate-500 tracking-wider block">
                  Future Maturity Balance
                </span>
                <p class="text-3xl sm:text-4xl font-black text-emerald-900 font-mono tracking-tight my-1">
                  {formatMoney(ciCalc.futureValue)}
                </p>
                <p class="text-xs text-slate-500 mb-6">
                  Initial deposit grew by {ciPrincipal > 0 ? (ciCalc.futureValue / ciPrincipal).toFixed(2) : '1.00'}x over {ciYears} years.
                </p>

                <div class="space-y-1.5 mb-6">
                  <div class="flex justify-between text-2xs font-semibold text-slate-600">
                    <span class="flex items-center gap-1 text-slate-700">
                      <span class="w-2.5 h-2.5 rounded-xs bg-slate-700 inline-block"></span>
                      Principal ({ciCalc.principalRatio}%)
                    </span>
                    <span class="flex items-center gap-1 text-emerald-700">
                      <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                      Accrued Interest ({ciCalc.interestRatio}%)
                    </span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${ciCalc.principalRatio}%` }}
                      class="bg-slate-700 h-full transition-all duration-300"
                    ></div>
                    <div
                      style={{ width: `${ciCalc.interestRatio}%` }}
                      class="bg-emerald-500 h-full transition-all duration-300"
                    ></div>
                  </div>
                </div>

                <div class="space-y-2 text-xs">
                  <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between">
                    <span class="text-slate-600">Initial Principal:</span>
                    <span class="font-bold font-mono text-slate-900">{formatMoney(ciPrincipal)}</span>
                  </div>
                  <div class="p-3 bg-white rounded-xl border border-emerald-200 flex justify-between">
                    <span class="text-emerald-800 font-medium">Total Interest Earned:</span>
                    <span class="font-bold font-mono text-emerald-700">+{formatMoney(ciCalc.totalInterest)}</span>
                  </div>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-emerald-100 text-2xs text-slate-500 leading-relaxed flex items-start gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Compounded interest pays interest on your interest, creating an exponential upward hockey-stick wealth curve.</span>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          {ciCalc.schedule.length > 0 && (
            <div class="border-t border-slate-200 pt-6">
              <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Year-by-Year Compound Growth Schedule
              </h3>
              <div class="overflow-x-auto max-h-72 border border-slate-200 rounded-2xl shadow-2xs">
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th class="p-3">Year</th>
                      <th class="p-3">Annual Interest Earned</th>
                      <th class="p-3">Cumulative Balance</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-mono">
                    {ciCalc.schedule.map((row) => (
                      <tr key={row.year} class="hover:bg-emerald-50/40 transition">
                        <td class="p-3 font-sans font-bold text-slate-900">Year {row.year}</td>
                        <td class="p-3 text-emerald-700 font-semibold">+{formatMoney(row.interestEarned)}</td>
                        <td class="p-3 text-slate-900 font-bold">{formatMoney(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. GST CALCULATOR                                        */}
      {/* ======================================================== */}
      {toolId === 'gst-calculator' && (
        <div class="space-y-6 max-w-2xl mx-auto">
          {/* Inclusive / Exclusive Toggle */}
          <div class="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit mx-auto border border-slate-200">
            <button
              type="button"
              onClick={() => setGstType('exclusive')}
              class={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                gstType === 'exclusive' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GST Exclusive (Add GST)
            </button>
            <button
              type="button"
              onClick={() => setGstType('inclusive')}
              class={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                gstType === 'inclusive' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GST Inclusive (Remove GST)
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="gst-amount-input" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {gstType === 'exclusive' ? 'Net Initial Amount (₹)' : 'Gross Total Amount (₹)'}
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">₹</span>
                <input
                  id="gst-amount-input"
                  type="number"
                  min="1"
                  step="any"
                  value={gstAmount}
                  onInput={(e) => setGstAmount(Number((e.target as HTMLInputElement).value))}
                  class="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Amount Presets */}
              <div class="flex flex-wrap gap-1 mt-2">
                {[1000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGstAmount(amt)}
                    class={`px-2 py-0.5 text-2xs font-semibold rounded-md border ${
                      gstAmount === amt
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                GST Tax Slab (%)
              </label>
              <div class="grid grid-cols-5 gap-1">
                {[0, 5, 12, 18, 28].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGstRate(rate)}
                    class={`py-2 text-xs font-bold rounded-xl border transition ${
                      gstRate === rate
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <p class="text-2xs text-slate-500 mt-2">
                Standard GST Slabs: 5% (essentials), 12% (processed foods), 18% (services/electronics), 28% (luxury).
              </p>
            </div>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center">
            <span class="text-xs uppercase font-bold text-slate-500">
              Total Payable Gross Amount
            </span>
            <p class="text-3xl sm:text-4xl font-black text-emerald-800 my-2 font-mono">
              ₹{gstCalc.grossTotal.toLocaleString('en-IN')}
            </p>

            <div class="divide-y divide-slate-200 border-t border-slate-200 mt-4 pt-2 text-xs text-left">
              <div class="flex justify-between py-2 text-slate-600">
                <span>Net Pre-Tax Base Amount:</span>
                <span class="font-bold text-slate-900 font-mono">₹{gstCalc.netAmount.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between py-2 text-slate-600">
                <span>Total GST Component ({gstRate}%):</span>
                <span class="font-bold text-emerald-700 font-mono">+₹{gstCalc.totalGst.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between py-2 text-slate-500">
                <span>CGST (Central Tax {gstRate / 2}%):</span>
                <span class="font-mono">₹{gstCalc.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between py-2 text-slate-500">
                <span>SGST / UTGST (State Tax {gstRate / 2}%):</span>
                <span class="font-mono">₹{gstCalc.sgst.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. BMI CALCULATOR                                        */}
      {/* ======================================================== */}
      {toolId === 'bmi-calculator' && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div class="flex justify-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setBmiUnit('metric')}
              class={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                bmiUnit === 'metric' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Metric (kg, cm)
            </button>
            <button
              type="button"
              onClick={() => setBmiUnit('imperial')}
              class={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                bmiUnit === 'imperial' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Imperial (lbs, ft-in)
            </button>
          </div>

          {bmiUnit === 'metric' ? (
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="bmi-weight-kg" class="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  id="bmi-weight-kg"
                  type="number"
                  min="20"
                  max="300"
                  value={bmiWeightKg}
                  onInput={(e) => setBmiWeightKg(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label for="bmi-height-cm" class="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                <input
                  id="bmi-height-cm"
                  type="number"
                  min="50"
                  max="250"
                  value={bmiHeightCm}
                  onInput={(e) => setBmiHeightCm(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label for="bmi-weight-lbs" class="block text-xs font-bold text-slate-700 mb-1">Weight (lbs)</label>
                <input
                  id="bmi-weight-lbs"
                  type="number"
                  min="40"
                  max="600"
                  value={bmiWeightLbs}
                  onInput={(e) => setBmiWeightLbs(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label for="bmi-height-ft" class="block text-xs font-bold text-slate-700 mb-1">Feet (ft)</label>
                <input
                  id="bmi-height-ft"
                  type="number"
                  min="2"
                  max="8"
                  value={bmiHeightFt}
                  onInput={(e) => setBmiHeightFt(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label for="bmi-height-in" class="block text-xs font-bold text-slate-700 mb-1">Inches (in)</label>
                <input
                  id="bmi-height-in"
                  type="number"
                  min="0"
                  max="11"
                  value={bmiHeightIn}
                  onInput={(e) => setBmiHeightIn(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          )}

          <div class={`p-6 rounded-3xl border text-center ${bmiCalc.color}`}>
            <span class="text-xs uppercase font-bold text-slate-500">Your Body Mass Index (BMI)</span>
            <p class="text-4xl sm:text-5xl font-black text-slate-900 my-2">{bmiCalc.bmi}</p>
            <div class="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 shadow-2xs">
              {bmiCalc.category}
            </div>
            <p class="text-xs text-slate-600">Standard WHO healthy adult range: 18.5 – 24.9 kg/m²</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. CURRENCY CONVERTER                                    */}
      {/* ======================================================== */}
      {toolId === 'currency-converter' && (
        <div class="space-y-6 max-w-2xl mx-auto">
          {/* Header & Live Rate Status Badge */}
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900">
                Foreign Exchange Currency Converter
              </h2>
              <p class="text-xs text-slate-500">
                Live interbank mid-market exchange rates without retail banking markup spreads.
              </p>
            </div>
            <div>
              {rateSourceStatus === 'live' ? (
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Rates ({rateLastUpdated})
                </span>
              ) : rateSourceStatus === 'loading' ? (
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  Connecting Forex Feed...
                </span>
              ) : (
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  Benchmark Rates (Offline Mode)
                </span>
              )}
            </div>
          </div>

          {/* Input Controls */}
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div class="sm:col-span-4">
              <label for="curr-amount-input" class="block text-xs font-bold text-slate-700 mb-1">
                Amount to Convert
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold text-slate-400">
                  {currencyRates[currFrom]?.symbol || '$'}
                </span>
                <input
                  id="curr-amount-input"
                  type="number"
                  min="0.01"
                  step="any"
                  value={currAmount}
                  onInput={(e) => setCurrAmount(Math.max(0, Number((e.target as HTMLInputElement).value)))}
                  class="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="1000"
                />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="curr-from-select" class="block text-xs font-bold text-slate-700 mb-1">
                From
              </label>
              <select
                id="curr-from-select"
                value={currFrom}
                onChange={(e) => setCurrFrom((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {Object.keys(currencyRates).map((cur) => (
                  <option key={cur} value={cur}>
                    {cur} - {currencyRates[cur].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div class="sm:col-span-2 flex justify-center pb-0.5">
              <button
                type="button"
                onClick={handleSwapCurrencies}
                title="Swap base and target currencies"
                class="w-full sm:w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 transition cursor-pointer shadow-2xs font-bold"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>

            <div class="sm:col-span-3">
              <label for="curr-to-select" class="block text-xs font-bold text-slate-700 mb-1">
                To
              </label>
              <select
                id="curr-to-select"
                value={currTo}
                onChange={(e) => setCurrTo((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {Object.keys(currencyRates).map((cur) => (
                  <option key={cur} value={cur}>
                    {cur} - {currencyRates[cur].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Amount Presets */}
          <div class="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span class="text-2xs font-semibold text-slate-400 mr-1">Quick Select:</span>
            {[50, 100, 500, 1000, 5000, 10000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setCurrAmount(amt)}
                class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition cursor-pointer ${
                  currAmount === amt
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {currencyRates[currFrom]?.symbol}{amt.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Prominent Conversion Result Card */}
          <div class="bg-gradient-to-br from-slate-50 via-emerald-50/25 to-slate-50 border border-emerald-100 rounded-3xl p-6 text-center shadow-2xs">
            <span class="text-2xs uppercase font-bold text-slate-500 tracking-wider">
              {currAmount.toLocaleString()} {currFrom} Equals
            </span>
            <p class="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-800 my-2 font-mono tracking-tight">
              {currencyRates[currTo]?.symbol} {convertedCurrency.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span class="text-lg font-bold text-emerald-700">{currTo}</span>
            </p>
            <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 font-medium mt-3 pt-3 border-t border-slate-200/60">
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400">Direct Rate:</span>
                <span class="font-mono font-bold text-slate-800">
                  1 {currFrom} = {unitRate.toFixed(4)} {currTo}
                </span>
              </div>
              <span class="text-slate-300">•</span>
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400">Inverse Rate:</span>
                <span class="font-mono font-bold text-slate-800">
                  1 {currTo} = {(1 / unitRate).toFixed(4)} {currFrom}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Conversion Reference Grid */}
          <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
              <span class="text-xs font-bold text-slate-800">
                Popular {currFrom} to {currTo} Conversion Values
              </span>
              <span class="text-2xs text-slate-500">Zero spread benchmark</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 text-xs">
              {[1, 10, 100, 1000].map((tier) => (
                <div key={tier} class="p-3 bg-white text-center">
                  <div class="font-bold text-slate-900">
                    {tier} {currFrom}
                  </div>
                  <div class="text-emerald-700 font-mono font-semibold text-2xs mt-0.5">
                    {currencyRates[currTo]?.symbol} {(tier * unitRate).toFixed(2)} {currTo}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimers & Trust Notice */}
          <div class="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-2xs text-slate-500 flex items-start gap-2 leading-relaxed">
            <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>
              <strong>Zero Server Storage &amp; Independent Benchmark:</strong> Calculations execute client-side in your browser RAM without tracking or logging personal transaction amounts. Mid-market rates serve as financial benchmarks; commercial banks and money transfer providers may apply additional retail margins.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
