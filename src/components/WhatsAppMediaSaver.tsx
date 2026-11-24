import { useEffect, useRef, useState } from 'preact/hooks';

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/webm': 'webm',
};

export default function WhatsAppMediaSaver() {
  const [mode, setMode] = useState('dp');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; video: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dimensions, setDimensions] = useState('');
  const viewer = useRef<HTMLDialogElement>(null);
  const pending = useRef<AbortController | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => pending.current?.abort(), []);

  const cleanPhone = phone.replace(/[^0-9]/g, '');

  function reset() {
    pending.current?.abort();
    setResult(null);
    setDimensions('');
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

  async function pasteFromClipboard() {
    if (!navigator.clipboard?.read) {
      setMessage('Press Ctrl + V to paste your copied image.');
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          reset();
          preview(blob);
          return;
        }
      }
      setMessage('No image found in your clipboard. In WhatsApp, right-click the photo and select "Copy Image", then click here.');
    } catch {
      setMessage('Clipboard access was blocked. Press Ctrl + V on your keyboard to paste the image.');
    }
  }

  async function loadLink(event: Event) {
    event.preventDefault();
    reset();
    const controller = new AbortController();
    pending.current = controller;
    let url: URL;
    try { url = new URL(address.trim()); if (url.protocol !== 'https:' || url.username || url.password) throw Error(); }
    catch { setMessage('Enter a direct HTTPS link to the image or video.'); return; }
    if (['wa.me', 'chat.whatsapp.com', 'api.whatsapp.com'].includes(url.hostname)) {
      const match = url.pathname.replace(/[^0-9]/g, '');
      if (match) setPhone(match);
      setMessage('That is a WhatsApp chat or invite link. Choose the shared photo from your device or paste a direct image link.');
      return;
    }
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
    <div class="min-w-0 space-y-5 p-5 sm:p-7" onPaste={event => {
      const file = Array.from(event.clipboardData?.files || []).find(item => item.type.startsWith('image/'));
      if (!file) return;
      event.preventDefault();
      reset();
      setAddress('');
      if (picker.current) picker.current.value = '';
      preview(file);
    }}>
      <label class="block text-sm font-semibold">Media to save <select class="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3" value={mode} onChange={e => {
        reset(); setAddress(''); setMode(e.currentTarget.value); if (picker.current) picker.current.value = '';
      }}><option value="dp">Profile photo (DP)</option><option value="status">Status photo or video</option></select></label>

      {mode === 'dp' && <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-1">
          <span class="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Download via Phone Number
          </span>
          <span class="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">No contact save needed</span>
        </div>
        <p class="text-xs text-slate-700">Enter the phone number (with country code) to view their WhatsApp profile directly:</p>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            type="tel"
            aria-label="WhatsApp phone number"
            class="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
            placeholder="e.g. +1 555 123 4567 or 919876543210"
            value={phone}
            onInput={e => setPhone(e.currentTarget.value)}
          />
          <a
            href={cleanPhone ? `https://wa.me/${cleanPhone}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              if (!cleanPhone) {
                e.preventDefault();
                setMessage('Enter a phone number with country code first.');
              }
            }}
            class={`inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${cleanPhone ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-slate-400 cursor-not-allowed'}`}
          >
            Open in WhatsApp ↗
          </a>
        </div>
        <div class="rounded-lg bg-white/90 p-3 border border-emerald-100 text-xs text-slate-700 space-y-1.5">
          <p class="font-semibold text-emerald-900">How to get the photo:</p>
          <ol class="list-decimal list-inside space-y-1">
            <li>Click <strong>Open in WhatsApp</strong> &rarr; tap their <strong>name</strong> &rarr; tap their <strong>photo</strong>.</li>
            <li><strong>PC:</strong> Right-click &rarr; <em>Copy Image</em>. <strong>Phone:</strong> Take a screenshot.</li>
            <li>Click the button below or press <kbd class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">Ctrl + V</kbd> to inspect &amp; download!</li>
          </ol>
          <button
            type="button"
            onClick={pasteFromClipboard}
            class="mt-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
          >
            📋 Paste copied image from clipboard
          </button>
        </div>
      </div>}

      <form onSubmit={loadLink} class="space-y-2">
        <label class="block text-sm font-semibold">Direct media link<input class="mt-2 block w-full rounded-lg border border-slate-300 p-3 text-sm" type="url" required value={address} placeholder="https://…" onInput={e => { reset(); setAddress(e.currentTarget.value); }} /></label>
        <button type="submit" disabled={busy} class="rounded bg-emerald-700 px-4 py-2 text-sm text-white font-medium hover:bg-emerald-800 transition">{busy ? 'Loading…' : 'Load media'}</button>
      </form>

      <label class="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold">Or choose a photo or screenshot from your device<input ref={picker} type="file" class="block mt-2 w-full text-sm" accept={'image/jpeg,image/png,image/webp,image/gif' + (mode === 'status' ? ',video/mp4,video/webm' : '')} onChange={e => {
        reset(); const file = e.currentTarget.files?.[0]; if (file) preview(file);
      }} /></label>

      <p class="text-xs text-slate-600">{mode === 'dp' ? 'Choose a JPG, PNG, WebP or GIF, or press Ctrl+V anywhere on this page to paste your copied image.' : 'Choose an image, MP4 or WebM status clip.'}</p>
      <p role="status" class="text-sm font-medium text-slate-800">{message}</p>
    </div>

    <div class="min-w-0 bg-emerald-50 p-5 sm:p-7 flex flex-col justify-center">
      <h2 class="mb-3 text-lg font-bold">Media preview</h2>
      {!result && <figure><img src="/images/whatsapp-media-preview.webp" width="780" height="520" alt="Example square profile photo and vertical status video" class="w-full rounded-xl" />
        <figcaption class="mt-3 text-sm text-slate-700">Enter a number, paste an image (Ctrl+V), or select a file to preview and download.</figcaption></figure>}
      {result && <div key={result.url} class="space-y-3">{result.video ? <video controls src={result.url} class="mx-auto max-h-64 max-w-full rounded-lg" /> : <>
        <img src={result.url} alt="Selected WhatsApp media" class="mx-auto max-h-64 max-w-full rounded-lg"
          onLoad={event => setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight} pixels`)}
          onError={() => { setDimensions(''); setMessage('The browser could not display this image. Try the original file.'); }} />
        {dimensions && <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm font-medium text-slate-700">{dimensions}</span>
          <button type="button" onClick={() => viewer.current?.showModal()} class="min-h-11 rounded-lg border border-emerald-700 px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition">View original size</button>
        </div>}
        <dialog ref={viewer} aria-label="Original size photo" class="m-auto max-h-[90vh] max-w-[95vw] rounded-xl p-4 backdrop:bg-black/60">
          <form method="dialog" class="mb-2 text-right"><button class="min-h-11 rounded-lg px-3 font-semibold hover:bg-slate-100">Close preview</button></form>
          <div class="max-h-[70vh] max-w-full overflow-auto"><img src={result.url} alt="Photo at original size" class="max-w-none" /></div>
        </dialog>
      </>}
        <a download={result.name} href={result.url} class="inline-block rounded-lg bg-emerald-700 text-white font-semibold px-5 py-2.5 shadow hover:bg-emerald-800 transition">Download {mode === 'dp' ? 'profile photo' : 'status'}</a></div>}
    </div>
  </section>;
}
