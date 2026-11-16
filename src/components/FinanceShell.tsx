import { useState, useMemo } from 'preact/hooks';

interface FinanceShellProps {
  toolId: string;
  toolName: string;
}

export default function FinanceShell({ toolId }: FinanceShellProps) {
  // --- EMI Calculator State ---
  const [loanAmount, setLoanAmount] = useState(1000000); // 10 Lakhs or $1M
  const [interestRate, setInterestRate] = useState(8.5); // 8.5%
  const [loanTenureYears, setLoanTenureYears] = useState(20); // 20 years

  const emiCalc = useMemo(() => {
    const P = loanAmount;
    const r = interestRate / 12 / 100;
    const n = loanTenureYears * 12;

    if (P <= 0 || r <= 0 || n <= 0) {
      return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0, schedule: [] };
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

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
      schedule,
    };
  }, [loanAmount, interestRate, loanTenureYears]);

  // --- SIP Calculator State ---
  const [sipMonthly, setSipMonthly] = useState(5000);
  const [sipRate, setSipRate] = useState(12); // 12% p.a.
  const [sipYears, setSipYears] = useState(10);

  const sipCalc = useMemo(() => {
    const P = sipMonthly;
    const i = sipRate / 12 / 100;
    const n = sipYears * 12;

    if (P <= 0 || i <= 0 || n <= 0) {
      return { invested: 0, returns: 0, total: 0 };
    }

    const totalValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const investedAmount = P * n;
    const estimatedReturns = totalValue - investedAmount;

    return {
      invested: Math.round(investedAmount),
      returns: Math.round(estimatedReturns),
      total: Math.round(totalValue),
    };
  }, [sipMonthly, sipRate, sipYears]);

  // --- BMI Calculator State ---
  const [bmiUnit, setBmiUnit] = useState<'metric' | 'imperial'>('metric');
  const [bmiWeightKg, setBmiWeightKg] = useState(70);
  const [bmiHeightCm, setBmiHeightCm] = useState(175);
  const [bmiWeightLbs, setBmiWeightLbs] = useState(154);
  const [bmiHeightFt, setBmiHeightFt] = useState(5);
  const [bmiHeightIn, setBmiHeightIn] = useState(9);

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
    let category = 'Normal';
    let color = 'text-green-600';
    let bgColor = 'bg-green-50 border-green-200';

    if (rounded < 18.5) {
      category = 'Underweight';
      color = 'text-blue-600';
      bgColor = 'bg-blue-50 border-blue-200';
    } else if (rounded >= 25 && rounded < 30) {
      category = 'Overweight';
      color = 'text-amber-600';
      bgColor = 'bg-amber-50 border-amber-200';
    } else if (rounded >= 30) {
      category = 'Obese';
      color = 'text-red-600';
      bgColor = 'bg-red-50 border-red-200';
    }

    return { bmi: rounded, category, color, bgColor };
  }, [bmiUnit, bmiWeightKg, bmiHeightCm, bmiWeightLbs, bmiHeightFt, bmiHeightIn]);

  // --- Currency Converter State ---
  const [currAmount, setCurrAmount] = useState(100);
  const [currFrom, setCurrFrom] = useState('USD');
  const [currTo, setCurrTo] = useState('EUR');

  // Baseline reference rates against USD (Last updated Nov 2026)
  const currencyRates: Record<string, { name: string; rate: number; symbol: string }> = {
    USD: { name: 'US Dollar', rate: 1.0, symbol: '$' },
    EUR: { name: 'Euro', rate: 0.95, symbol: '€' },
    GBP: { name: 'British Pound', rate: 0.79, symbol: '£' },
    INR: { name: 'Indian Rupee', rate: 84.4, symbol: '₹' },
    JPY: { name: 'Japanese Yen', rate: 154.2, symbol: '¥' },
    CAD: { name: 'Canadian Dollar', rate: 1.4, symbol: 'CA$' },
    AUD: { name: 'Australian Dollar', rate: 1.54, symbol: 'AU$' },
    CHF: { name: 'Swiss Franc', rate: 0.88, symbol: 'CHF' },
    CNY: { name: 'Chinese Yuan', rate: 7.23, symbol: '¥' },
    SGD: { name: 'Singapore Dollar', rate: 1.34, symbol: 'S$' },
    AED: { name: 'UAE Dirham', rate: 3.67, symbol: 'AED' },
  };

  const convertedCurrency = useMemo(() => {
    const fromRate = currencyRates[currFrom]?.rate || 1.0;
    const toRate = currencyRates[currTo]?.rate || 1.0;
    const inUsd = currAmount / fromRate;
    const result = inUsd * toRate;
    return Number(result.toFixed(2));
  }, [currAmount, currFrom, currTo]);

  // --- GST Calculator State ---
  const [gstAmount, setGstAmount] = useState<number>(5000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstType, setGstType] = useState<'exclusive' | 'inclusive'>('exclusive');

  const gstCalc = useMemo(() => {
    const rate = Number(gstRate) || 0;
    const amount = Number(gstAmount) || 0;

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

  // --- Compound Interest Calculator State ---
  const [ciPrincipal, setCiPrincipal] = useState<number>(10000);
  const [ciRate, setCiRate] = useState<number>(8);
  const [ciYears, setCiYears] = useState<number>(10);
  const [ciFrequency, setCiFrequency] = useState<number>(12); // monthly

  const ciCalc = useMemo(() => {
    const P = Number(ciPrincipal) || 0;
    const r = (Number(ciRate) || 0) / 100;
    const t = Number(ciYears) || 0;
    const n = Number(ciFrequency) || 1;

    if (P <= 0 || r <= 0 || t <= 0) {
      return { futureValue: P, totalInterest: 0, schedule: [] };
    }

    const futureValue = P * Math.pow(1 + r / n, n * t);
    const totalInterest = futureValue - P;

    const schedule: { year: number; interestEarned: number; balance: number }[] = [];
    for (let y = 1; y <= Math.min(t, 20); y++) {
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
      schedule,
    };
  }, [ciPrincipal, ciRate, ciYears, ciFrequency]);

  return (
    <div class="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-10">
      {/* 1. EMI / Loan / Mortgage Calculator */}
      {(toolId === 'emi-calculator' || toolId === 'loan-calculator' || toolId === 'mortgage-calculator') && (
        <div class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 space-y-5">
              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>{toolId === 'mortgage-calculator' ? 'Mortgage Property / Loan Amount' : 'Loan Principal Amount'}</span>
                  <span class="font-bold text-gray-900">{loanAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={loanAmount}
                  onInput={(e) => setLoanAmount(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Annual Interest Rate (%)</span>
                  <span class="font-bold text-gray-900">{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="25"
                  step="0.1"
                  value={interestRate}
                  onInput={(e) => setInterestRate(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Loan Term / Duration</span>
                  <span class="font-bold text-gray-900">{loanTenureYears} Years ({loanTenureYears * 12} Mos)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={loanTenureYears}
                  onInput={(e) => setLoanTenureYears(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span class="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                  {toolId === 'mortgage-calculator' ? 'Monthly Mortgage Payment' : 'Monthly Payment (EMI)'}
                </span>
                <p class="text-3xl font-extrabold text-green-700 my-2">
                  ${emiCalc.monthlyEmi.toLocaleString()}
                </p>
              </div>

              <div class="space-y-2 text-xs border-t border-gray-200 pt-3">
                <div class="flex justify-between text-gray-600">
                  <span>Principal Borrowed:</span>
                  <span class="font-bold text-gray-900">${loanAmount.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>Total Interest Paid:</span>
                  <span class="font-bold text-gray-900">${emiCalc.totalInterest.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1">
                  <span>Total Loan Repayment:</span>
                  <span>${emiCalc.totalPayment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* First 12 Months Amortization Table */}
          {emiCalc.schedule.length > 0 && (
            <div>
              <div class="text-sm font-bold text-gray-900 mb-3">Initial Monthly Amortization Schedule</div>
              <div class="overflow-x-auto border border-gray-200 rounded-xl">
                <table class="w-full text-left text-xs">
                  <thead class="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th class="p-2.5">Month</th>
                      <th class="p-2.5">Principal Paid</th>
                      <th class="p-2.5">Interest Paid</th>
                      <th class="p-2.5">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 font-mono">
                    {emiCalc.schedule.map((row) => (
                      <tr class="hover:bg-gray-50">
                        <td class="p-2.5 text-gray-600 font-sans">{row.month}</td>
                        <td class="p-2.5 text-green-700 font-semibold">{row.principal.toLocaleString()}</td>
                        <td class="p-2.5 text-gray-600">{row.interest.toLocaleString()}</td>
                        <td class="p-2.5 text-gray-900 font-semibold">{row.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. SIP Calculator */}
      {toolId === 'sip-calculator' && (
        <div class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 space-y-5">
              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Monthly Investment</span>
                  <span class="font-bold text-gray-900">{sipMonthly.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={sipMonthly}
                  onInput={(e) => setSipMonthly(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Expected Annual Return Rate (%)</span>
                  <span class="font-bold text-gray-900">{sipRate}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={sipRate}
                  onInput={(e) => setSipRate(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Investment Time Period</span>
                  <span class="font-bold text-gray-900">{sipYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="35"
                  value={sipYears}
                  onInput={(e) => setSipYears(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span class="text-xs uppercase font-semibold text-gray-500 tracking-wider">Total Maturity Value</span>
                <p class="text-3xl font-extrabold text-green-700 my-2">
                  {sipCalc.total.toLocaleString()}
                </p>
              </div>

              <div class="space-y-2 text-xs border-t border-gray-200 pt-3">
                <div class="flex justify-between text-gray-600">
                  <span>Invested Amount:</span>
                  <span class="font-bold text-gray-900">{sipCalc.invested.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-green-600">
                  <span>Est. Returns (Wealth Gain):</span>
                  <span class="font-bold">{sipCalc.returns.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BMI Calculator */}
      {toolId === 'bmi-calculator' && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div class="flex justify-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setBmiUnit('metric')}
              class={`px-4 py-1.5 text-xs font-semibold rounded-lg ${bmiUnit === 'metric' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Metric (kg, cm)
            </button>
            <button
              type="button"
              onClick={() => setBmiUnit('imperial')}
              class={`px-4 py-1.5 text-xs font-semibold rounded-lg ${bmiUnit === 'imperial' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Imperial (lbs, ft-in)
            </button>
          </div>

          {bmiUnit === 'metric' ? (
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={bmiWeightKg}
                  onInput={(e) => setBmiWeightKg(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={bmiHeightCm}
                  onInput={(e) => setBmiHeightCm(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          ) : (
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  value={bmiWeightLbs}
                  onInput={(e) => setBmiWeightLbs(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Feet (ft)</label>
                <input
                  type="number"
                  value={bmiHeightFt}
                  onInput={(e) => setBmiHeightFt(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Inches (in)</label>
                <input
                  type="number"
                  value={bmiHeightIn}
                  onInput={(e) => setBmiHeightIn(Number((e.target as HTMLInputElement).value))}
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <div class={`p-6 rounded-2xl border text-center ${bmiCalc.bgColor}`}>
            <span class="text-xs uppercase font-semibold text-gray-500">Your Body Mass Index</span>
            <p class="text-4xl font-extrabold text-gray-900 my-2">{bmiCalc.bmi}</p>
            <p class={`text-sm font-bold ${bmiCalc.color}`}>{bmiCalc.category}</p>
            <p class="text-xs text-gray-500 mt-2">Normal healthy BMI range: 18.5 – 24.9</p>
          </div>
        </div>
      )}

      {/* 4. Currency Converter */}
      {toolId === 'currency-converter' && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min="1"
                value={currAmount}
                onInput={(e) => setCurrAmount(Number((e.target as HTMLInputElement).value))}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">From Currency</label>
              <select
                value={currFrom}
                onChange={(e) => setCurrFrom((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                {Object.keys(currencyRates).map((cur) => (
                  <option value={cur}>{cur} - {currencyRates[cur].name}</option>
                ))}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">To Currency</label>
              <select
                value={currTo}
                onChange={(e) => setCurrTo((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                {Object.keys(currencyRates).map((cur) => (
                  <option value={cur}>{cur} - {currencyRates[cur].name}</option>
                ))}
              </select>
            </div>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
            <span class="text-xs uppercase font-semibold text-gray-500">Converted Amount</span>
            <p class="text-3xl sm:text-4xl font-extrabold text-green-700 my-2">
              {currencyRates[currTo]?.symbol} {convertedCurrency.toLocaleString()} {currTo}
            </p>
            <p class="text-xs text-gray-500">
              1 {currFrom} = {(currencyRates[currTo].rate / currencyRates[currFrom].rate).toFixed(4)} {currTo} • Reference benchmark
            </p>
          </div>
        </div>
      )}

      {/* 5. GST Calculator */}
      {toolId === 'gst-calculator' && (
        <div class="space-y-6 max-w-xl mx-auto">
          {/* Inclusive / Exclusive Toggle */}
          <div class="flex items-center justify-center gap-2 p-1 bg-gray-100 rounded-xl w-fit mx-auto border border-gray-200">
            <button
              type="button"
              onClick={() => setGstType('exclusive')}
              class={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                gstType === 'exclusive' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              GST Exclusive (Add GST)
            </button>
            <button
              type="button"
              onClick={() => setGstType('inclusive')}
              class={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                gstType === 'inclusive' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              GST Inclusive (Remove GST)
            </button>
          </div>

          {/* Amount and Rate Selection */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {gstType === 'exclusive' ? 'Net Initial Amount' : 'Gross Total Amount'}
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={gstAmount}
                onInput={(e) => setGstAmount(Number((e.target as HTMLInputElement).value))}
                class="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                GST Rate (%)
              </label>
              <div class="flex items-center gap-1">
                {[5, 12, 18, 28].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGstRate(rate)}
                    class={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
                      gstRate === rate
                        ? 'bg-green-600 text-white border-green-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <span class="text-xs uppercase font-semibold text-gray-500 block text-center">
              Total Payable Amount
            </span>
            <p class="text-3xl sm:text-4xl font-extrabold text-green-700 my-2 text-center font-mono">
              ₹{gstCalc.grossTotal.toLocaleString()}
            </p>

            <div class="divide-y divide-gray-200 border-t border-gray-200 mt-4 pt-2 text-xs">
              <div class="flex justify-between py-2 text-gray-600">
                <span>Net Pre-Tax Amount:</span>
                <span class="font-bold text-gray-900 font-mono">₹{gstCalc.netAmount.toLocaleString()}</span>
              </div>
              <div class="flex justify-between py-2 text-gray-600">
                <span>Total GST ({gstRate}%):</span>
                <span class="font-bold text-green-700 font-mono">+₹{gstCalc.totalGst.toLocaleString()}</span>
              </div>
              <div class="flex justify-between py-2 text-gray-500">
                <span>CGST ({gstRate / 2}%):</span>
                <span class="font-mono">₹{gstCalc.cgst.toLocaleString()}</span>
              </div>
              <div class="flex justify-between py-2 text-gray-500">
                <span>SGST / UTGST ({gstRate / 2}%):</span>
                <span class="font-mono">₹{gstCalc.sgst.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Compound Interest Calculator */}
      {toolId === 'compound-interest-calculator' && (
        <div class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 space-y-5">
              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Initial Principal Deposit ($)</span>
                  <span class="font-bold text-gray-900">${ciPrincipal.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="1000000"
                  step="500"
                  value={ciPrincipal}
                  onInput={(e) => setCiPrincipal(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Annual Nominal Interest Rate (%)</span>
                  <span class="font-bold text-gray-900">{ciRate}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="30"
                  step="0.1"
                  value={ciRate}
                  onInput={(e) => setCiRate(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Investment Tenure (Years)</span>
                  <span class="font-bold text-gray-900">{ciYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={ciYears}
                  onInput={(e) => setCiYears(Number((e.target as HTMLInputElement).value))}
                  class="w-full accent-green-600"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-2">Compounding Frequency</label>
                <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                      class={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        ciFrequency === item.freq
                          ? 'bg-green-600 text-white border-green-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span class="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                  Maturity Future Balance
                </span>
                <p class="text-3xl font-extrabold text-green-700 my-2">
                  ${ciCalc.futureValue.toLocaleString()}
                </p>
              </div>

              <div class="space-y-2 text-xs border-t border-gray-200 pt-3">
                <div class="flex justify-between text-gray-600">
                  <span>Initial Principal:</span>
                  <span class="font-bold text-gray-900">${ciPrincipal.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>Total Accrued Interest:</span>
                  <span class="font-bold text-green-700">+${ciCalc.totalInterest.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1">
                  <span>Total Return Multiplier:</span>
                  <span>{(ciPrincipal > 0 ? (ciCalc.futureValue / ciPrincipal).toFixed(2) : '1.00')}x</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          {ciCalc.schedule.length > 0 && (
            <div class="border-t border-gray-200 pt-6">
              <div class="text-sm font-bold text-gray-900 mb-3">Year-by-Year Compound Growth Schedule</div>
              <div class="overflow-x-auto max-h-64 border border-gray-200 rounded-xl">
                <table class="w-full text-xs text-left">
                  <thead class="bg-gray-100 text-gray-600 uppercase font-semibold sticky top-0">
                    <tr>
                      <th class="p-2.5">Year</th>
                      <th class="p-2.5">Interest Earned</th>
                      <th class="p-2.5">Year-End Balance</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {ciCalc.schedule.map((row) => (
                      <tr key={row.year} class="hover:bg-gray-50">
                        <td class="p-2.5 font-bold text-gray-900">Year {row.year}</td>
                        <td class="p-2.5 text-green-600 font-medium">+${row.interestEarned.toLocaleString()}</td>
                        <td class="p-2.5 font-bold text-gray-900">${row.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
