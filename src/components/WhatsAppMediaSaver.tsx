import { useEffect, useRef, useState } from 'preact/hooks';

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/webm': 'webm',
};

export default function WhatsAppMediaSaver() {
  const [mode, setMode] = useState('dp');
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; video: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => pending.current?.abort(), []);

  function reset() {
    pending.current?.abort();
    setResult(null);
    setMessage('');
    setBusy(false);
  }

  function preview(blob: Blob) {
    const type = blob.type.split(';')[0].toLowerCase();
    const video = type.startsWith('video/');
    if (!extensions[type] || !blob.size || (video && mode === 'dp')) {
      setMessage('Choose a JPG, PNG, WebP or GIF image' + (mode === 'status' ? ', or an MP4 or WebM video.' : '.'));
      return;
    }
    setResult({ url: URL.createObjectURL(blob), name: 'whatsapp-' + mode + '.' + extensions[type], video });
    setMessage('Ready to download.');
  }

  async function loadLink(event: Event) {
    event.preventDefault();
    reset();
    const controller = new AbortController();
    pending.current = controller;
    let url: URL;
    try { url = new URL(address.trim()); if (url.protocol !== 'https:' || url.username || url.password) throw Error(); }
    catch { setMessage('Enter a direct HTTPS link to the image or video.'); return; }
    setBusy(true);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw Error();
      const blob = await response.blob();
      if (!controller.signal.aborted) preview(blob);
    } catch {
      if (!controller.signal.aborted) setMessage('Could not read that media link. Check that it opens the file directly, or choose a local copy.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }

  return <section class="my-6 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
    <div class="min-w-0 space-y-5 p-5 sm:p-7">
    <label class="block text-sm font-semibold">Media to save <select class="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3" value={mode} onChange={e => {
      reset(); setAddress(''); setMode(e.currentTarget.value); if (picker.current) picker.current.value = '';
    }}><option value="dp">Profile photo (DP)</option><option value="status">Status photo or video</option></select></label>
    <form onSubmit={loadLink} class="space-y-2">
      <label class="block text-sm font-semibold">Direct media link<input class="mt-2 block w-full rounded-lg border border-slate-300 p-3" type="url" required value={address} placeholder="https://…" onInput={e => { reset(); setAddress(e.currentTarget.value); }} /></label>
      <button type="submit" disabled={busy} class="rounded bg-emerald-700 px-4 py-2 text-white">{busy ? 'Loading…' : 'Load media'}</button>
    </form>
    <label class="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold">Or choose a file on your device<input ref={picker} type="file" class="block mt-2 w-full text-sm" accept={'image/jpeg,image/png,image/webp,image/gif' + (mode === 'status' ? ',video/mp4,video/webm' : '')} onChange={e => {
      reset(); const file = e.currentTarget.files?.[0]; if (file) preview(file);
    }} /></label>
    <p class="text-xs text-slate-600">{mode === 'dp' ? 'Choose a JPG, PNG, WebP or GIF profile photo.' : 'Choose an image, MP4 or WebM status clip.'}</p>
    <p role="status" class="text-sm font-medium">{message}</p>
    </div>
    <div class="min-w-0 bg-emerald-50 p-5 sm:p-7 flex flex-col justify-center">
    <h2 class="mb-3 text-lg font-bold">Media preview</h2>
    {!result && <figure><img src="/images/whatsapp-media-preview.webp" width="780" height="520" alt="Example square profile photo and vertical status video" class="w-full rounded-xl" />
      <figcaption class="mt-3 text-sm text-slate-700">Load your media to preview and download it here.</figcaption></figure>}
    {result && <div class="space-y-3">{result.video ? <video controls src={result.url} class="mx-auto max-h-64 max-w-full rounded-lg" /> : <img src={result.url} alt="Selected WhatsApp media" class="mx-auto max-h-64 max-w-full rounded-lg" />}
      <a download={result.name} href={result.url} class="inline-block rounded bg-emerald-700 text-white px-4 py-2">Download {mode === 'dp' ? 'profile photo' : 'status'}</a></div>}
    </div>
  </section>;
}
