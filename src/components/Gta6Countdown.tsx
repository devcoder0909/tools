import { useEffect, useState } from 'preact/hooks';

const releaseDate = '2026-11-19';
const launchDay = Date.parse(releaseDate);
const millisecondsPerDay = 86_400_000;
const announcement = 'https://www.rockstargames.com/newswire/article/39akk424a9oo53/grand-theft-auto-vi-now-available';

function localCalendarDaysSinceLaunch() {
  const today = new Date();
  const localDate = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((localDate - launchDay) / millisecondsPerDay);
}

export default function Gta6Countdown() {
  const [days, setDays] = useState<number | null>(null);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    const update = () => setDays(localCalendarDaysSinceLaunch());
    update();
    const timer = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  async function share() {
    try {
      await navigator.clipboard.writeText('GTA VI launched November 19, 2026 on PS5 and Xbox Series X|S. ' + window.location.href.split('#')[0]);
      setShareMessage('Release details copied.');
    } catch {
      setShareMessage('Use the address bar to copy the tracker link.');
    }
  }

  const calendar = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ZixTool//Release Tracker//EN',
    'BEGIN:VEVENT', 'UID:gta6-console-launch@zixtool.online', 'DTSTAMP:20261119T000000Z',
    'DTSTART;VALUE=DATE:' + releaseDate.replaceAll('-', ''), 'DTEND;VALUE=DATE:20261120',
    'SUMMARY:GTA VI console release', 'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');

  return (
    <section data-hydrated={days !== null ? 'true' : undefined} class="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 space-y-4">
      <h2 class="text-xl sm:text-2xl font-bold">When did GTA 6 come out?</h2>
      <p>Grand Theft Auto VI launched on PlayStation 5 and Xbox Series X|S on <time dateTime={releaseDate}>November 19, 2026</time>.</p>
      {days !== null && days >= 0 && <p class="text-xl"><strong>{days}</strong> calendar {days === 1 ? 'day' : 'days'} since launch in your time zone.</p>}
      <p>Rockstar's console release announcement gives no Windows PC date. <a href={announcement} class="text-emerald-300 underline">Read the launch announcement</a>.</p>
      <div class="flex flex-wrap gap-4">
        <a class="underline" download="gta-vi-console-release.ics" href={'data:text/calendar;charset=utf-8,' + encodeURIComponent(calendar)}>Save launch date to calendar</a>
        <button type="button" onClick={share} class="underline">Copy release details</button>
      </div>
      <p role="status">{shareMessage}</p>
    </section>
  );
}
