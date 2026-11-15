import { useState, useMemo, useEffect } from 'preact/hooks';
import type { CollegeRecord, CutoffRow, ProgramDefinition } from '../../../scripts/schema';

interface Props {
  colleges?: CollegeRecord[];
  programs?: ProgramDefinition[];
  initialCutoffs?: CutoffRow[];
}

export default function CutoffExplorerShell({ colleges, programs, initialCutoffs }: Props) {
  const [collegesList, setCollegesList] = useState<CollegeRecord[]>(colleges || []);
  const [programsList, setProgramsList] = useState<ProgramDefinition[]>(programs || []);
  const [cutoffsList, setCutoffsList] = useState<CutoffRow[]>(initialCutoffs || []);

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

  // Map lookups for fast retrieval
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

  // Filters state
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCollege, setSelectedCollege] = useState<string>('All');
  const [selectedProgram, setSelectedProgram] = useState<string>('All');
  const [selectedQuota, setSelectedQuota] = useState<string>('All');
  const [selectedSeatType, setSelectedSeatType] = useState<string>('OPEN');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'closingRank' | 'openingRank' | 'college'>('closingRank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sync state to/from URL hash for shareable links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const params = new URLSearchParams(hash);
      if (params.get('type')) setSelectedType(params.get('type')!);
      if (params.get('college')) setSelectedCollege(params.get('college')!);
      if (params.get('program')) setSelectedProgram(params.get('program')!);
      if (params.get('quota')) setSelectedQuota(params.get('quota')!);
      if (params.get('seatType')) setSelectedSeatType(params.get('seatType')!);
      if (params.get('gender')) setSelectedGender(params.get('gender')!);
    }
  }, []);

  const updateHash = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    if (value === 'All') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const newHash = params.toString();
    window.history.replaceState(null, '', newHash ? `#${newHash}` : window.location.pathname);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return cutoffsList.filter((row) => {
      const [slug, progCode, quota, seatType, gender] = row;
      const college = collegeMap.get(slug);

      if (selectedType !== 'All' && college?.type !== selectedType) return false;
      if (selectedCollege !== 'All' && slug !== selectedCollege) return false;
      if (selectedProgram !== 'All' && progCode !== selectedProgram) return false;
      if (selectedQuota !== 'All' && quota !== selectedQuota) return false;
      if (selectedSeatType !== 'All' && seatType !== selectedSeatType) return false;
      if (selectedGender !== 'All' && gender !== selectedGender) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const collegeName = college?.name.toLowerCase() || '';
        const progName = programMap.get(progCode)?.name.toLowerCase() || '';
        if (!collegeName.includes(q) && !progName.includes(q) && !slug.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const [, , , , , , openA, closeA] = a;
      const [, , , , , , openB, closeB] = b;
      let diff = 0;
      if (sortBy === 'closingRank') diff = closeA - closeB;
      else if (sortBy === 'openingRank') diff = openA - openB;
      else if (sortBy === 'college') {
        const nameA = collegeMap.get(a[0])?.name || '';
        const nameB = collegeMap.get(b[0])?.name || '';
        diff = nameA.localeCompare(nameB);
      }
      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [cutoffsList, selectedType, selectedCollege, selectedProgram, selectedQuota, selectedSeatType, selectedGender, searchQuery, sortBy, sortOrder, collegeMap, programMap]);

  return (
    <div class="space-y-6">
      {/**/}
      <div class="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Institute Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                setSelectedType(val);
                updateHash('type', val);
              }}
              class="w-full text-xs rounded-lg border-gray-300 bg-white py-2 px-2.5 font-medium text-gray-800 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="IIT">IITs (23)</option>
              <option value="NIT">NITs (32)</option>
              <option value="IIIT">IIITs (26)</option>
              <option value="GFTI">GFTIs (35)</option>
              <option value="University">Universities</option>
            </select>
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Institute
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                setSelectedCollege(val);
                updateHash('college', val);
              }}
              class="w-full text-xs rounded-lg border-gray-300 bg-white py-2 px-2.5 font-medium text-gray-800 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Institutes</option>
              {collegesList
                .filter((c) => selectedType === 'All' || c.type === selectedType)
                .map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.short_name || c.name}
                  </option>
                ))}
            </select>
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Branch / Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                setSelectedProgram(val);
                updateHash('program', val);
              }}
              class="w-full text-xs rounded-lg border-gray-300 bg-white py-2 px-2.5 font-medium text-gray-800 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Branches</option>
              {programsList.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Category
            </label>
            <select
              value={selectedSeatType}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                setSelectedSeatType(val);
                updateHash('seatType', val);
              }}
              class="w-full text-xs rounded-lg border-gray-300 bg-white py-2 px-2.5 font-medium text-gray-800 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="OPEN">OPEN (General)</option>
              <option value="EWS">GEN-EWS</option>
              <option value="OBC-NCL">OBC-NCL</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Quota
            </label>
            <select
              value={selectedQuota}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                setSelectedQuota(val);
                updateHash('quota', val);
              }}
              class="w-full text-xs rounded-lg border-gray-300 bg-white py-2 px-2.5 font-medium text-gray-800 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Quotas</option>
              <option value="AI">AI (All India)</option>
              <option value="OS">OS (Other State)</option>
              <option value="HS">HS (Home State)</option>
            </select>
          </div>

          {/**/}
          <div>
            <label class="block text-2xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Gender Pool
            </label>
            <select
              value={selectedGender}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                setSelectedGender(val);
                updateHash('gender', val);
              }}
              class="w-full text-xs rounded-lg border-gray-300 bg-white py-2 px-2.5 font-medium text-gray-800 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Gender Pools</option>
              <option value="Gender-Neutral">Gender-Neutral</option>
              <option value="Female-only">Female-only</option>
            </select>
          </div>
        </div>

        {/**/}
        <div class="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search college name or branch (e.g. Bombay, Electrical)..."
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              class="w-full text-xs rounded-lg border border-gray-300 bg-white py-2 px-3 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div class="text-xs text-gray-600 font-medium">
            Showing <strong class="text-indigo-700 font-bold">{filteredRows.length}</strong> matching JoSAA Round 5 cutoffs
          </div>
        </div>
      </div>

      {/**/}
      <div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-gray-100 text-gray-700 uppercase font-bold text-2xs border-b border-gray-200">
              <th scope="col" class="py-3 px-4 cursor-pointer hover:bg-gray-200" onClick={() => { setSortBy('college'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Institute {sortBy === 'college' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" class="py-3 px-4">Academic Program</th>
              <th scope="col" class="py-3 px-3 text-center">Quota</th>
              <th scope="col" class="py-3 px-3 text-center">Seat Type</th>
              <th scope="col" class="py-3 px-3 text-center">Gender</th>
              <th scope="col" class="py-3 px-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => { setSortBy('openingRank'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Opening {sortBy === 'openingRank' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" class="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 text-indigo-900" onClick={() => { setSortBy('closingRank'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Closing Rank {sortBy === 'closingRank' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th scope="col" class="py-3 px-3 text-center">Official</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} class="py-12 text-center text-sm text-gray-500">
                  No programs match the selected filters. Try broadening your branch or category selection.
                </td>
              </tr>
            ) : (
              filteredRows.slice(0, 100).map((row, idx) => {
                const [slug, progCode, quota, seatType, gender, round, openRank, closeRank] = row;
                const college = collegeMap.get(slug);
                const program = programMap.get(progCode);

                return (
                  <tr key={`${slug}-${progCode}-${quota}-${seatType}-${gender}-${idx}`} class="hover:bg-indigo-50/40 transition-colors">
                    <td class="py-3 px-4 font-semibold text-gray-900">
                      <a href={`/colleges/${slug}/`} class="hover:text-indigo-600 transition">
                        {college?.name || slug}
                      </a>
                      <div class="text-2xs text-gray-500 font-normal">
                        {college?.city}, {college?.state} • <span class="uppercase font-bold text-gray-700">{college?.type}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-gray-800 font-medium">
                      {program?.name || progCode}
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span class="inline-block px-1.5 py-0.5 rounded text-2xs font-bold bg-gray-100 text-gray-700">
                        {quota}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span class={`inline-block px-1.5 py-0.5 rounded text-2xs font-bold ${
                        seatType === 'OPEN' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {seatType}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-center text-gray-600 text-2xs">
                      {gender === 'Female-only' ? 'Female-Only' : 'Gender-Neutral'}
                    </td>
                    <td class="py-3 px-3 text-right font-mono text-gray-600 font-medium">
                      {openRank.toLocaleString()}
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-bold text-indigo-700 text-sm">
                      {closeRank.toLocaleString()}
                    </td>
                    <td class="py-3 px-3 text-center">
                      {college?.official_url ? (
                        <a
                          href={college.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-indigo-600 hover:text-indigo-800 text-2xs font-semibold underline"
                          title={`Visit official website of ${college.name}`}
                        >
                          Visit &rarr;
                        </a>
                      ) : (
                        <span class="text-gray-400 text-2xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredRows.length > 100 && (
        <p class="text-xs text-center text-gray-500 italic">
          Showing top 100 of {filteredRows.length} matching rows. Use specific college or branch filters above to narrow your query.
        </p>
      )}
    </div>
  );
}
