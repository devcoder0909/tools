import { useState, useEffect } from 'preact/hooks';

export default function Gta6Countdown() {
  const [hydrated, setHydrated] = useState(false);
  const [targetMode, setTargetMode] = useState<'fall2025' | 'holiday2025' | 'pc2026'>('fall2025');
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [userTz, setUserTz] = useState('UTC');

  useEffect(() => {
    setHydrated(true);
    try {
      setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    } catch {
      setUserTz('UTC');
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Key Milestones & Target Dates
  const announcementDate = new Date('2023-12-04T14:00:00Z').getTime(); // Trailer 1
  const targets = {
    fall2025: {
      name: 'Fall 2025 (Official Window)',
      date: new Date('2025-10-28T00:00:00Z').getTime(),
      platforms: 'PlayStation 5 & Xbox Series X/S',
      confidence: 'Confirmed by Take-Two Interactive',
      label: 'Target: Late October 2025'
    },
    holiday2025: {
      name: 'Holiday 2025 (Secondary Window)',
      date: new Date('2025-11-20T00:00:00Z').getTime(),
      platforms: 'PlayStation 5 & Xbox Series X/S',
      confidence: 'Expected Pre-Thanksgiving Launch',
      label: 'Target: Mid-November 2025'
    },
    pc2026: {
      name: 'PC Edition (Estimated)',
      date: new Date('2026-10-27T00:00:00Z').getTime(),
      platforms: 'Windows PC (Steam / Epic / Rockstar Store)',
      confidence: 'Estimated based on GTA V & RDR2 PC cadence',
      label: 'Target: Late October 2026'
    }
  };

  const currentTarget = targets[targetMode];
  const diff = Math.max(0, currentTarget.date - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const totalSeconds = Math.floor(diff / 1000);

  // Calculate percentage of journey completed since first trailer
  const totalSpan = currentTarget.date - announcementDate;
  const elapsed = Math.max(0, now - announcementDate);
  const progressPct = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100)).toFixed(1);

  // Generate .ics calendar download client-side
  const downloadCalendarEvent = () => {
    const startIso = new Date(currentTarget.date).toISOString().replace(/-|:|\.\d+/g, '');
    const endIso = new Date(currentTarget.date + 86400000).toISOString().replace(/-|:|\.\d+/g, '');

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ZixTool//GTA 6 Release Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:gta6-launch-${targetMode}@zixtool.online`,
      `DTSTAMP:${startIso}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      'SUMMARY:Grand Theft Auto VI Release Day!',
      `DESCRIPTION:Grand Theft Auto VI release countdown target (${currentTarget.name}). Track live updates at https://zixtool.online/gta-6-release-countdown/`,
      'LOCATION:Worldwide',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GTA-6-Release-Reminder-${targetMode}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyStats = () => {
    const text = `GTA 6 Countdown (${currentTarget.name}): ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds remaining! Track live at https://zixtool.online/gta-6-release-countdown/`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      data-hydrated={hydrated ? 'true' : undefined}
      class="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden"
    >
      {/* Decorative Neon Vice City Gradients */}
      <div class="absolute -top-32 -right-32 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Target Selector */}
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30 mb-2">
            <span class="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
            Live Rockstar Games Release Tracker
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
            Grand Theft Auto VI Countdown
          </h2>
          <p class="text-xs sm:text-sm text-slate-400">
            {currentTarget.label} · Timezone: <span class="text-slate-300 font-mono">{userTz}</span>
          </p>
        </div>

        {/* Target Window Buttons */}
        <div class="flex flex-wrap gap-2">
          {(['fall2025', 'holiday2025', 'pc2026'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTargetMode(mode)}
              class={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                targetMode === mode
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25 ring-1 ring-fuchsia-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {mode === 'fall2025' ? 'Fall 2025 (Official)' : mode === 'holiday2025' ? 'Holiday 2025' : 'PC 2026'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Countdown Flip Cards */}
      <div class="relative z-10 my-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
        {/* Days */}
        <div class="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-inner relative group hover:border-fuchsia-500/50 transition">
          <div class="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 font-mono tracking-tight">
            {days}
          </div>
          <div class="text-xs sm:text-sm uppercase tracking-wider font-bold text-fuchsia-400 mt-2">
            Days
          </div>
        </div>

        {/* Hours */}
        <div class="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-inner relative group hover:border-fuchsia-500/50 transition">
          <div class="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 font-mono tracking-tight">
            {String(hours).padStart(2, '0')}
          </div>
          <div class="text-xs sm:text-sm uppercase tracking-wider font-bold text-pink-400 mt-2">
            Hours
          </div>
        </div>

        {/* Minutes */}
        <div class="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-inner relative group hover:border-cyan-500/50 transition">
          <div class="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 font-mono tracking-tight">
            {String(minutes).padStart(2, '0')}
          </div>
          <div class="text-xs sm:text-sm uppercase tracking-wider font-bold text-cyan-400 mt-2">
            Minutes
          </div>
        </div>

        {/* Seconds */}
        <div class="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-inner relative group hover:border-emerald-500/50 transition">
          <div class="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 font-mono tracking-tight">
            {String(seconds).padStart(2, '0')}
          </div>
          <div class="text-xs sm:text-sm uppercase tracking-wider font-bold text-emerald-400 mt-2">
            Seconds
          </div>
        </div>
      </div>

      {/* Journey Progress Bar */}
      <div class="relative z-10 bg-slate-800/50 p-4 sm:p-5 rounded-xl border border-slate-800 mb-6">
        <div class="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
          <span>Announcement (Dec 4, 2023)</span>
          <span class="text-fuchsia-400 font-mono">{progressPct}% Elapsed</span>
          <span>{currentTarget.name}</span>
        </div>
        <div class="w-full bg-slate-700/60 rounded-full h-3 overflow-hidden p-0.5">
          <div
            class="bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500 h-full rounded-full transition-all duration-1000 shadow-md shadow-fuchsia-500/50"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Aggregate Time Metrics */}
      <div class="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 text-center py-3 px-4 rounded-xl bg-slate-800/30 border border-slate-800 mb-6 text-xs text-slate-400">
        <div>
          Total Hours: <span class="font-bold text-white font-mono">{totalHours.toLocaleString()}</span>
        </div>
        <div>
          Total Minutes: <span class="font-bold text-white font-mono">{totalMinutes.toLocaleString()}</span>
        </div>
        <div>
          Total Seconds: <span class="font-bold text-white font-mono">{totalSeconds.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div class="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <div class="flex flex-wrap gap-2">
          <button
            onClick={downloadCalendarEvent}
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar (.ics)
          </button>

          <button
            onClick={copyStats}
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Copied to Clipboard!' : 'Share Countdown'}
          </button>
        </div>

        <div class="text-xs text-slate-400">
          Platforms: <span class="text-slate-200 font-semibold">{currentTarget.platforms}</span>
        </div>
      </div>

      {/* Official Verified Download & Pre-Load Hub */}
      <div class="relative z-10 mt-6 pt-6 border-t border-slate-800/80">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Official Download &amp; Digital Storefronts
          </h3>
          <a
            href="/guides/gta-6-official-download-and-pre-load-guide/"
            class="text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4 transition"
          >
            Read Safe Download Guide &rarr;
          </a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
            <div class="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
              <span>🎮</span> PlayStation 5 Store
            </div>
            <p class="text-slate-300 text-[11px] leading-relaxed">
              Verified digital pre-load activates 48 hours prior to unlock. Requires ~215 GB storage.
            </p>
          </div>
          <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
            <div class="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <span>🟩</span> Xbox Series X/S Store
            </div>
            <p class="text-slate-300 text-[11px] leading-relaxed">
              Xbox Mobile app remote pre-install supported. Smart Delivery asset optimization.
            </p>
          </div>
          <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
            <div class="font-bold text-orange-400 mb-1 flex items-center gap-1.5">
              <span>🖥️</span> Windows PC (2026)
            </div>
            <p class="text-slate-300 text-[11px] leading-relaxed">
              Rockstar Games Launcher / Steam. Beware fake APK/EXE malware scam sites.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
