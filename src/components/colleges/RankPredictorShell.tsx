import { useState, useMemo, useEffect } from 'preact/hooks';
import type { CollegeRecord, CutoffRow, ProgramDefinition } from '../../../scripts/schema';

interface Props {
  colleges?: CollegeRecord[];
  programs?: ProgramDefinition[];
  cutoffs?: CutoffRow[];
  defaultExam?: 'JEE Main' | 'JEE Advanced';
  defaultRank?: string;
  defaultQuota?: string;
}

export default function RankPredictorShell({
  colleges,
  programs,
  cutoffs,
  defaultExam = 'JEE Main',
  defaultRank = '8500',
  defaultQuota = 'OS',
}: Props) {
  const [collegesList, setCollegesList] = useState<CollegeRecord[]>(colleges || []);
  const [programsList, setProgramsList] = useState<ProgramDefinition[]>(programs || []);
  const [cutoffsList, setCutoffsList] = useState<CutoffRow[]>(cutoffs || []);

  useEffect(() => {
    if (collegesList.length === 0) {
      fetch('/data/colleges.json').then((r) => r.json()).then(setCollegesList).catch(() => {});
    }
    if (programsList.length === 0) {
      fetch('/data/programs.json').then((r) => r.json()).then(setProgramsList).catch(() => {});
    }
    if (cutoffsList.length === 0) {
      fetch('/data/cutoffs/2024-all.json').then((r) => r.json()).then(setCutoffsList).catch(() => {});
    }
  }, []);

  const collegeMap = useMemo(() => {
    const map = new Map<string, CollegeRecord>();
    for (const c of collegesList) map.set(c.slug, c);
    return map;
  }, [collegesList]);

  const programMap = useMemo(() => {
    const map = new Map<string, ProgramDefinition>();
    for (const p of programsList) map.set(p.code, p);
    return map;
  }, [programsList]);

  // Input state
  const [exam, setExam] = useState<'JEE Main' | 'JEE Advanced'>(defaultExam);
  const [rankInput, setRankInput] = useState<string>(defaultRank);
  const [category, setCategory] = useState<string>('OPEN');
  const [quota, setQuota] = useState<string>(defaultQuota);
  const [gender, setGender] = useState<string>('Gender-Neutral');

  const userRank = parseInt(rankInput, 10);
  const isValidRank = !isNaN(userRank) && userRank > 0;

  // Prediction calculations grouped by band
  const { safeBands, moderateBands, reachBands } = useMemo(() => {
    if (!isValidRank) {
      return { safeBands: [], moderateBands: [], reachBands: [] };
    }

    const safe: { college: CollegeRecord; program: ProgramDefinition; quota: string; seatType: string; closingRank: number; margin: number }[] = [];
    const moderate: { college: CollegeRecord; program: ProgramDefinition; quota: string; seatType: string; closingRank: number; margin: number }[] = [];
    const reach: { college: CollegeRecord; program: ProgramDefinition; quota: string; seatType: string; closingRank: number; margin: number }[] = [];

    // Filter cutoffs based on exam type:
    // JEE Advanced applies to IITs
    // JEE Main applies to NITs, IIITs, GFTIs, Universities
    const relevantCutoffs = cutoffsList.filter((row) => {
      const [slug, , rowQuota, seatType, rowGender] = row;
      const inst = collegeMap.get(slug);
      if (!inst) return false;

      if (exam === 'JEE Advanced') {
        if (inst.type !== 'IIT') return false;
      } else {
        if (inst.type === 'IIT') return false;
      }

      if (seatType !== category) return false;
      if (quota !== 'All' && rowQuota !== quota && inst.type !== 'IIT') return false;
      if (gender !== 'All' && rowGender !== gender) return false;

      return true;
    });

    for (const row of relevantCutoffs) {
      const [slug, progCode, rowQuota, seatType, , , , closeRank] = row;
      const college = collegeMap.get(slug);
      const program = programMap.get(progCode);
      if (!college || !program) continue;

      const item = {
        college,
        program,
        quota: rowQuota,
        seatType,
        closingRank: closeRank,
        margin: Math.round(((closeRank - userRank) / closeRank) * 100),
      };

      // Safe: User rank is <= 85% of closing rank (>= 15% better than cutoff)
      if (userRank <= closeRank * 0.85) {
        safe.push(item);
      }
      // Moderate: User rank is between 85% and 100% of closing rank
      else if (userRank <= closeRank) {
        moderate.push(item);
      }
      // Reach: User rank is between 100% and 115% of closing rank
      else if (userRank <= closeRank * 1.15) {
        reach.push(item);
      }
    }

    // Sort by closing rank
    safe.sort((a, b) => a.closingRank - b.closingRank);
    moderate.sort((a, b) => a.closingRank - b.closingRank);
    reach.sort((a, b) => a.closingRank - b.closingRank);

    return { safeBands: safe, moderateBands: moderate, reachBands: reach };
  }, [cutoffsList, exam, userRank, isValidRank, category, quota, gender, collegeMap, programMap]);

  return (
    <div class="space-y-8">
      {/**/}
      <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-2xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              1. Target Exam
            </label>
            <select
              value={exam}
              onChange={(e) => setExam((e.target as HTMLSelectElement).value as any)}
              class="w-full text-sm font-semibold rounded-lg border-gray-300 bg-white py-2.5 px-3 text-gray-900 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="JEE Main">JEE Main (NITs, IIITs, GFTIs)</option>
              <option value="JEE Advanced">JEE Advanced (23 IITs)</option>
            </select>
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              2. Your All India Rank (AIR)
            </label>
            <input
              type="number"
              min="1"
              max="1500000"
              value={rankInput}
              onInput={(e) => setRankInput((e.target as HTMLInputElement).value)}
              placeholder="e.g. 5420"
              class="w-full text-sm font-bold font-mono rounded-lg border-gray-300 bg-white py-2.5 px-3 text-gray-900 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              3. Seat Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}
              class="w-full text-sm font-semibold rounded-lg border-gray-300 bg-white py-2.5 px-3 text-gray-900 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="OPEN">OPEN (General)</option>
              <option value="EWS">GEN-EWS</option>
              <option value="OBC-NCL">OBC-NCL</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              4. Seat Quota
            </label>
            <select
              value={quota}
              onChange={(e) => setQuota((e.target as HTMLSelectElement).value)}
              class="w-full text-sm font-semibold rounded-lg border-gray-300 bg-white py-2.5 px-3 text-gray-900 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="OS">OS (Other State)</option>
              <option value="HS">HS (Home State)</option>
              <option value="AI">AI (All India)</option>
            </select>
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              5. Gender Pool
            </label>
            <select
              value={gender}
              onChange={(e) => setGender((e.target as HTMLSelectElement).value)}
              class="w-full text-sm font-semibold rounded-lg border-gray-300 bg-white py-2.5 px-3 text-gray-900 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Gender-Neutral">Gender-Neutral</option>
              <option value="Female-only">Female-only</option>
            </select>
          </div>
        </div>

        {/**/}
        <div class="mt-5 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span class="text-gray-700"><strong>Safe Band:</strong> Rank is &gt;15% better than past cutoff.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></span>
            <span class="text-gray-700"><strong>Moderate Band:</strong> Rank is within 15% of past cutoff.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0"></span>
            <span class="text-gray-700"><strong>Reach Band:</strong> Rank is up to 15% beyond past cutoff.</span>
          </div>
        </div>
      </div>

      {/**/}
      <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 leading-relaxed">
        <strong>Important Advisory & Disclaimer:</strong> Predictions are computed strictly using official JoSAA 2024 Round 5 final closing ranks. Past year cutoffs reflect previous applicant choices and do NOT guarantee seat allotment. Annual changes in applicant numbers, seat matrix additions, and question paper difficulty alter cutoffs every year. Always fill higher-preference programs in your JoSAA choice list.
      </div>

      {/**/}
      <div class="space-y-8">
        {/**/}
        <section aria-labelledby="safe-heading">
          <div class="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
            <h2 id="safe-heading" class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">✓</span>
              Safe Colleges & Programs ({safeBands.length})
            </h2>
            <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              High Probability (Rank &gt;15% above cutoff)
            </span>
          </div>

          {safeBands.length === 0 ? (
            <p class="text-xs text-gray-500 p-4 border border-dashed border-gray-200 rounded-xl text-center">
              No programs in the safe band for Rank {userRank.toLocaleString()}. Check Moderate or Reach bands below.
            </p>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeBands.slice(0, 15).map((item, idx) => (
                <div key={idx} class="p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-500 transition shadow-2xs flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-2xs font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {item.college.type}
                      </span>
                      <span class="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        +{item.margin}% Margin
                      </span>
                    </div>
                    <h3 class="font-bold text-gray-900 text-sm mb-1">
                      <a href={`/colleges/${item.college.slug}/`} class="hover:text-indigo-600 transition">
                        {item.college.short_name || item.college.name}
                      </a>
                    </h3>
                    <p class="text-xs text-gray-600 font-medium mb-2">
                      {item.program.name}
                    </p>
                  </div>
                  <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>2024 Cutoff: <strong class="text-gray-900">{item.closingRank.toLocaleString()}</strong></span>
                    <a href={item.college.official_url} target="_blank" rel="noopener noreferrer" class="text-indigo-600 font-semibold hover:underline text-2xs">
                      Official Portal &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/**/}
        <section aria-labelledby="moderate-heading">
          <div class="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
            <h2 id="moderate-heading" class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">~</span>
              Moderate Colleges & Programs ({moderateBands.length})
            </h2>
            <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Competitive (Rank within 15% of cutoff)
            </span>
          </div>

          {moderateBands.length === 0 ? (
            <p class="text-xs text-gray-500 p-4 border border-dashed border-gray-200 rounded-xl text-center">
              No programs in the moderate band for Rank {userRank.toLocaleString()}.
            </p>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {moderateBands.slice(0, 15).map((item, idx) => (
                <div key={idx} class="p-4 rounded-xl border border-gray-200 bg-white hover:border-amber-500 transition shadow-2xs flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-2xs font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {item.college.type}
                      </span>
                      <span class="text-2xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        +{item.margin}% Margin
                      </span>
                    </div>
                    <h3 class="font-bold text-gray-900 text-sm mb-1">
                      <a href={`/colleges/${item.college.slug}/`} class="hover:text-indigo-600 transition">
                        {item.college.short_name || item.college.name}
                      </a>
                    </h3>
                    <p class="text-xs text-gray-600 font-medium mb-2">
                      {item.program.name}
                    </p>
                  </div>
                  <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>2024 Cutoff: <strong class="text-gray-900">{item.closingRank.toLocaleString()}</strong></span>
                    <a href={item.college.official_url} target="_blank" rel="noopener noreferrer" class="text-indigo-600 font-semibold hover:underline text-2xs">
                      Official Portal &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/**/}
        <section aria-labelledby="reach-heading">
          <div class="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
            <h2 id="reach-heading" class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">!</span>
              Reach Colleges & Programs ({reachBands.length})
            </h2>
            <span class="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Ambitious (Cutoff up to 15% better than rank)
            </span>
          </div>

          {reachBands.length === 0 ? (
            <p class="text-xs text-gray-500 p-4 border border-dashed border-gray-200 rounded-xl text-center">
              No programs in the reach band for Rank {userRank.toLocaleString()}.
            </p>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reachBands.slice(0, 15).map((item, idx) => (
                <div key={idx} class="p-4 rounded-xl border border-gray-200 bg-white hover:border-rose-500 transition shadow-2xs flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-2xs font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {item.college.type}
                      </span>
                      <span class="text-2xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {item.margin}% Gap
                      </span>
                    </div>
                    <h3 class="font-bold text-gray-900 text-sm mb-1">
                      <a href={`/colleges/${item.college.slug}/`} class="hover:text-indigo-600 transition">
                        {item.college.short_name || item.college.name}
                      </a>
                    </h3>
                    <p class="text-xs text-gray-600 font-medium mb-2">
                      {item.program.name}
                    </p>
                  </div>
                  <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>2024 Cutoff: <strong class="text-gray-900">{item.closingRank.toLocaleString()}</strong></span>
                    <a href={item.college.official_url} target="_blank" rel="noopener noreferrer" class="text-indigo-600 font-semibold hover:underline text-2xs">
                      Official Portal &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
