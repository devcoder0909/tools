import { useState, useEffect } from 'preact/hooks';

export default function Gta6SpecsCalculator() {
  const [hydrated, setHydrated] = useState(false);
  const [resolution, setResolution] = useState('1440p');
  const [targetFps, setTargetFps] = useState('60');
  const [vram, setVram] = useState('12');
  const [cpuCores, setCpuCores] = useState('8');
  const [ram, setRam] = useState('32');
  const [driveType, setDriveType] = useState('nvme-gen4');
  const [freeSpace, setFreeSpace] = useState('300');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const numVram = Number(vram);
  const numCores = Number(cpuCores);
  const numRam = Number(ram);
  const numFree = Number(freeSpace) || 0;

  // Recommended partition breakdown based on current-gen console 212-223 GB base installs
  const baseInstallGb = 215;
  const shaderCacheGb = 15;
  const pagefileReserveGb = 16;
  const patchReserveGb = 25;
  const totalRecommendedStorage = baseInstallGb + shaderCacheGb + pagefileReserveGb + patchReserveGb; // 271 GB
  const storageSurplus = numFree - totalRecommendedStorage;

  // Bottleneck & Compatibility Evaluation
  let score = 100;
  const warnings: string[] = [];
  const strengths: string[] = [];

  // 1. Resolution & VRAM Check
  if (resolution === '4k') {
    if (numVram < 12) {
      score -= 30;
      warnings.push("4K scenario: VRAM falls below the model's lower threshold.");
    } else if (numVram < 16) {
      score -= 12;
      warnings.push("4K scenario: the selected VRAM falls between the model's two thresholds.");
    } else {
      strengths.push("VRAM meets the upper threshold for the 4K scenario.");
    }
  } else if (resolution === '1440p' || resolution === '21:9') {
    if (numVram < 8) {
      score -= 25;
      warnings.push("The selected resolution exceeds the model's budget for this VRAM tier.");
    } else if (numVram === 8) {
      score -= 10;
      warnings.push("At 8 GB, the model applies a memory penalty for the selected resolution.");
    } else {
      strengths.push("VRAM meets the upper threshold for this resolution.");
    }
  } else {
    // 1080p
    if (numVram < 6) {
      score -= 20;
      warnings.push("At 1080p, this model applies a penalty below 6 GB of VRAM.");
    } else {
      strengths.push("VRAM meets the threshold for the 1080p scenario.");
    }
  }

  // 2. Target FPS & CPU Check
  if (targetFps === '120') {
    if (numCores < 8) {
      score -= 25;
      warnings.push("The 120 FPS scenario assigns a penalty below eight CPU cores.");
    } else {
      strengths.push("CPU core count meets the threshold for the 120 FPS scenario.");
    }
  } else if (targetFps === '60') {
    if (numCores < 6) {
      score -= 20;
      warnings.push("The 60 FPS scenario assigns a penalty below six CPU cores.");
    } else {
      strengths.push("CPU core count meets the threshold for the 60 FPS scenario.");
    }
  }

  // 3. System RAM Check
  if (numRam < 16) {
    score -= 30;
    warnings.push("The model applies a memory penalty below 16 GB of system RAM.");
  } else if (numRam === 16) {
    if (resolution === '4k' || resolution === '21:9') {
      score -= 8;
      warnings.push("At this resolution, the model assigns a smaller memory margin to 16 GB of RAM.");
    } else {
      strengths.push("System memory meets this scenario threshold.");
    }
  } else {
    strengths.push("System memory meets the upper model tier.");
  }

  // 4. Storage Type & Speed Check
  if (driveType === 'hdd') {
    score -= 35;
    warnings.push("The model assigns its largest storage penalty to mechanical drives.");
  } else if (driveType === 'sata-ssd') {
    score -= 12;
    warnings.push("The model rates SATA SSD storage between an HDD and an NVMe SSD.");
  } else {
    strengths.push("The model assigns no drive-type penalty to NVMe storage.");
  }

  // 5. Storage Space Check
  if (numFree < totalRecommendedStorage) {
    score -= 15;
    warnings.push(`Storage capacity warning: ${numFree} GB is below the recommended ${totalRecommendedStorage} GB threshold (${Math.abs(storageSurplus)} GB deficit for shader caches & patches).`);
  } else {
    strengths.push(`Sufficient storage capacity: ${numFree} GB available (${storageSurplus} GB surplus above the 271 GB recommended partition).`);
  }

  // Clamp score
  const finalScore = Math.max(10, Math.min(100, score));

  let tierRating = 'Moderate match to model';
  let badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  if (finalScore >= 88) {
    tierRating = 'High match to model';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (finalScore >= 72) {
    tierRating = 'Good match to model';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (finalScore < 50) {
    tierRating = 'Low match to model';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
  }

  const copySummary = async () => {
    const text = `GTA 6 hardware planning estimate:
Target: ${resolution.toUpperCase()} @ ${targetFps} FPS
Score: ${finalScore}/100 (${tierRating})
Hardware: VRAM: ${vram}GB | CPU Cores: ${cpuCores} | RAM: ${ram}GB | Drive: ${driveType.toUpperCase()}
Storage Status: ${numFree} GB free (Recommended: ${totalRecommendedStorage} GB | Diff: ${storageSurplus >= 0 ? '+' : ''}${storageSurplus} GB)
Calculated via ZixTool (https://zixtool.online/gta-6-pc-specs-calculator/)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <section data-hydrated={hydrated ? 'true' : undefined} class="my-6 space-y-6 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
      <div class="border-b border-slate-100 pb-4">
        <span class="text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">Client-Side Hardware Evaluation</span>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-2">Compare your hardware with a GTA 6 FPS target</h2>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">This planning model scores the hardware you enter against a chosen target. It does not run the game or measure FPS.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Target Resolution */}
        <label class="block">
          <span class="text-xs font-semibold text-slate-700">Target Resolution</span>
          <select
            class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={resolution}
            onChange={(e) => setResolution(e.currentTarget.value)}
          >
            <option value="1080p">1080p Full HD (1920x1080)</option>
            <option value="1440p">1440p QHD (2560x1440)</option>
            <option value="21:9">21:9 Ultrawide (3440x1440)</option>
            <option value="4k">4K UHD (3840x2160)</option>
          </select>
        </label>

        {/* Target Frame Rate */}
        <label class="block">
          <span class="text-xs font-semibold text-slate-700">Target Frame Rate</span>
          <select
            class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={targetFps}
            onChange={(e) => setTargetFps(e.currentTarget.value)}
          >
            <option value="30">30 FPS (Console Standard)</option>
            <option value="60">60 FPS (PC Standard)</option>
            <option value="120">120 FPS (High Refresh Rate)</option>
          </select>
        </label>

        {/* GPU VRAM */}
        <label class="block">
          <span class="text-xs font-semibold text-slate-700">GPU Video Memory (VRAM)</span>
          <select
            class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={vram}
            onChange={(e) => setVram(e.currentTarget.value)}
          >
            <option value="4">4 GB (Legacy)</option>
            <option value="6">6 GB (Entry Level)</option>
            <option value="8">8 GB (Mid-Range Baseline)</option>
            <option value="12">12 GB (High-End Baseline)</option>
            <option value="16">16 GB (Enthusiast)</option>
            <option value="24">24 GB (Extreme Ultra)</option>
          </select>
        </label>

        {/* CPU Cores */}
        <label class="block">
          <span class="text-xs font-semibold text-slate-700">Processor Cores</span>
          <select
            class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={cpuCores}
            onChange={(e) => setCpuCores(e.currentTarget.value)}
          >
            <option value="4">4 Cores / 8 Threads</option>
            <option value="6">6 Cores / 12 Threads</option>
            <option value="8">8 Cores / 16 Threads</option>
            <option value="12">12+ Cores (Multi-threaded)</option>
          </select>
        </label>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
        {/* System RAM */}
        <label class="block">
          <span class="text-xs font-semibold text-slate-700">System Memory (RAM)</span>
          <select
            class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={ram}
            onChange={(e) => setRam(e.currentTarget.value)}
          >
            <option value="8">8 GB RAM</option>
            <option value="16">16 GB RAM</option>
            <option value="32">32 GB RAM</option>
            <option value="64">64 GB RAM</option>
          </select>
        </label>

        {/* Storage Drive Type */}
        <label class="block">
          <span class="text-xs font-semibold text-slate-700">Primary Storage Drive</span>
          <select
            class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={driveType}
            onChange={(e) => setDriveType(e.currentTarget.value)}
          >
            <option value="hdd">Mechanical Hard Drive (HDD ~150 MB/s)</option>
            <option value="sata-ssd">SATA 2.5" SSD (~500 MB/s)</option>
            <option value="nvme-gen3">NVMe PCIe Gen 3 SSD (~3,500 MB/s)</option>
            <option value="nvme-gen4">NVMe PCIe Gen 4/5 SSD (5,000+ MB/s)</option>
          </select>
        </label>

        {/* Free Storage Space in GB */}
        <label class="block">
          <span class="text-xs font-semibold text-slate-700">Available Free Space (GB)</span>
          <input
            type="number"
            min="10"
            max="4000"
            step="10"
            value={freeSpace}
            onInput={(e) => setFreeSpace(e.currentTarget.value)}
            class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>
      </div>

      {/* Compatibility Assessment Box */}
      <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                {tierRating}
              </span>
              <span class="text-xs text-slate-500 font-mono">Model score: {finalScore}/100</span>
            </div>
            <p class="text-xs text-slate-600 mt-1.5">
              Targeting: <strong class="text-slate-900">{resolution.toUpperCase()}</strong> at <strong class="text-slate-900">{targetFps} FPS</strong> with <strong class="text-slate-900">{vram}GB VRAM</strong> and <strong class="text-slate-900">{ram}GB RAM</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={copySummary}
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            {copied ? 'Copied to Clipboard!' : 'Copy Compatibility Report'}
          </button>
        </div>

        {/* Storage Partition Meter */}
        <div class="pt-3 border-t border-slate-200/80">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-semibold text-slate-700">Dedicated Storage Volume Allocation:</span>
            <span class={storageSurplus >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
              {numFree} GB Free / {totalRecommendedStorage} GB Recommended ({storageSurplus >= 0 ? `+${storageSurplus} GB Surplus` : `${Math.abs(storageSurplus)} GB Shortage`})
            </span>
          </div>
          <div class="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden flex">
            <div style={{ width: `${Math.min(100, Math.round((baseInstallGb / totalRecommendedStorage) * 100))}%` }} class="bg-emerald-600" title="Base Game Package (215 GB)" />
            <div style={{ width: `${Math.round((shaderCacheGb / totalRecommendedStorage) * 100)}%` }} class="bg-blue-500" title="Shader Cache (15 GB)" />
            <div style={{ width: `${Math.round((pagefileReserveGb / totalRecommendedStorage) * 100)}%` }} class="bg-amber-500" title="Virtual Memory Swap (16 GB)" />
            <div style={{ width: `${Math.round((patchReserveGb / totalRecommendedStorage) * 100)}%` }} class="bg-indigo-500" title="Day 1 Patch Buffer (25 GB)" />
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-slate-500 mt-1.5">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Base Game: 215 GB</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Shaders: 15 GB</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Pagefile: 16 GB</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Patch Buffer: 25 GB</span>
          </div>
        </div>

        {/* Warnings or Strengths List */}
        <div class="space-y-2 pt-2 border-t border-slate-200/80">
          {warnings.length > 0 && (
            <div class="space-y-1.5">
              <span class="text-xs font-bold text-amber-800 flex items-center gap-1">
                <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Potential Bottlenecks & Optimization Tips:
              </span>
              <ul class="list-disc pl-5 text-xs text-slate-600 space-y-1">
                {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </div>
          )}

          {strengths.length > 0 && (
            <div class="space-y-1.5 pt-1">
              <span class="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Hardware Strengths Detected:
              </span>
              <ul class="list-disc pl-5 text-xs text-slate-600 space-y-1">
                {strengths.map((s, idx) => <li key={idx}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Related Tool Links */}
      <div class="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
        <span class="font-semibold text-slate-700 py-1">Quick Tools for Gamers:</span>
        <a href="/video-compressor/" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition">Compress 4K Gameplay Clips</a>
        <a href="/aspect-ratio-calculator/" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition">Calculate 21:9 Ultrawide Resolution</a>
        <a href="/online-calculator/" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition">GB & Budget Calculator</a>
        <a href="/diff-checker/" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition">Compare Graphics .INI Settings</a>
      </div>
    </section>
  );
}
