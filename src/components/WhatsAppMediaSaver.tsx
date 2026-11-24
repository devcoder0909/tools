import { useEffect, useRef, useState } from 'preact/hooks';

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/webm': 'webm',
};

const countryCodes = [
  { code: '1', name: '🇺🇸 United States (+1)' },
  { code: '91', name: '🇮🇳 India (+91)' },
  { code: '44', name: '🇬🇧 United Kingdom (+44)' },
  { code: '971', name: '🇦🇪 UAE (+971)' },
  { code: '92', name: '🇵🇰 Pakistan (+92)' },
  { code: '880', name: '🇧🇩 Bangladesh (+880)' },
  { code: '62', name: '🇮🇩 Indonesia (+62)' },
  { code: '63', name: '🇵🇭 Philippines (+63)' },
  { code: '234', name: '🇳🇬 Nigeria (+234)' },
  { code: '55', name: '🇧🇷 Brazil (+55)' },
  { code: '52', name: '🇲🇽 Mexico (+52)' },
  { code: '49', name: '🇩🇪 Germany (+49)' },
  { code: '33', name: '🇫🇷 France (+33)' },
  { code: '34', name: '🇪🇸 Spain (+34)' },
  { code: '39', name: '🇮🇹 Italy (+39)' },
  { code: '61', name: '🇦🇺 Australia (+61)' },
  { code: '27', name: '🇿🇦 South Africa (+27)' },
  { code: '966', name: '🇸🇦 Saudi Arabia (+966)' },
  { code: '20', name: '🇪🇬 Egypt (+20)' },
  { code: '90', name: '🇹🇷 Turkey (+90)' },
  { code: '81', name: '🇯🇵 Japan (+81)' },
  { code: '82', name: '🇰🇷 South Korea (+82)' },
  { code: '7', name: '🇷🇺 Russia (+7)' },
  { code: 'custom', name: '🌐 Other (type full code)' },
];

export default function WhatsAppMediaSaver() {
  const [mode, setMode] = useState('dp');
  const [selectedCountry, setSelectedCountry] = useState('91');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; video: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dimensions, setDimensions] = useState('');
  const [isOpenedWhatsApp, setIsOpenedWhatsApp] = useState(false);
  const viewer = useRef<HTMLDialogElement>(null);
  const pending = useRef<AbortController | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => pending.current?.abort(), []);

  // Compute clean phone with country code
  const rawDigits = phone.replace(/[^0-9]/g, '');
  let fullCleanNumber = '';
  if (selectedCountry === 'custom') {
    fullCleanNumber = rawDigits;
  } else {
    // If the user already typed their country code in the input, avoid duplicating
    if (rawDigits.startsWith(selectedCountry)) {
      fullCleanNumber = rawDigits;
    } else {
      fullCleanNumber = selectedCountry + rawDigits;
    }
  }

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

  async function pastePhoneNumber() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPhone(text.trim());
        setMessage('');
      }
    } catch {
      setMessage('Paste manually into the box.');
    }
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
      setMessage('No image found in clipboard. In WhatsApp, right-click the photo and select "Copy Image", then click here.');
    } catch {
      setMessage('Clipboard access was blocked. Press Ctrl + V on your keyboard to paste the image.');
    }
  }

  function handleOpenWhatsApp(event: Event) {
    if (!fullCleanNumber || fullCleanNumber.length < 7) {
      event.preventDefault();
      setMessage('Please enter a valid WhatsApp phone number with country code.');
      return;
    }
    setIsOpenedWhatsApp(true);
    setMessage('WhatsApp opened! Tap their name & photo, copy it, and paste here.');
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
      if (match) {
        setPhone(match);
        setSelectedCountry('custom');
      }
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

  return <div>
    <section class="my-6 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
      <div class="min-w-0 space-y-5 p-5 sm:p-7" onPaste={event => {
        const file = Array.from(event.clipboardData?.files || []).find(item => item.type.startsWith('image/'));
        if (!file) return;
        event.preventDefault();
        reset();
        setAddress('');
        if (picker.current) picker.current.value = '';
        preview(file);
      }}>
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <label class="block text-sm font-bold text-slate-800">Media to save:
            <select class="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium" value={mode} onChange={e => {
              reset(); setAddress(''); setMode(e.currentTarget.value); if (picker.current) picker.current.value = '';
            }}>
              <option value="dp">WhatsApp Profile Picture (DP)</option>
              <option value="status">Status Photo or Video</option>
            </select>
          </label>
        </div>

        {mode === 'dp' && <div class="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 p-4 sm:p-5 space-y-4">
          <div class="flex items-center justify-between">
            <label for="phone" class="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.42-.101.825z"/></svg>
              WhatsApp Phone Number
            </label>
            <span class="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">No Contact Save Needed</span>
          </div>

          <div class="flex flex-col sm:flex-row gap-2">
            <select
              aria-label="Country code"
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.currentTarget.value)}
              class="rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-medium sm:w-44"
            >
              {countryCodes.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <div class="relative flex-1 flex">
              <input
                id="phone"
                type="tel"
                aria-label="WhatsApp phone number"
                class="block w-full rounded-l-lg border border-slate-300 bg-white p-2.5 text-sm font-medium"
                placeholder="Enter phone number"
                value={phone}
                onInput={e => setPhone(e.currentTarget.value)}
              />
              <button
                type="button"
                onClick={pastePhoneNumber}
                title="Paste phone number"
                class="rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                📋 Paste
              </button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-2">
            <a
              href={fullCleanNumber ? `https://wa.me/${fullCleanNumber}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenWhatsApp}
              class={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white shadow transition ${fullCleanNumber ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'}`}
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              View Profile Picture
            </a>
            <a
              href={fullCleanNumber ? `https://wa.me/${fullCleanNumber}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenWhatsApp}
              class="hidden"
            >
              Open in WhatsApp ↗
            </a>
          </div>

          <div class="rounded-lg bg-white p-3.5 border border-emerald-200/60 text-xs text-slate-700 space-y-2 shadow-sm">
            <p class="font-bold text-emerald-900 flex items-center gap-1.5">
              <span>⚡</span> 3-Step Instant Download Guide:
            </p>
            <ol class="list-decimal list-inside space-y-1 text-slate-600">
              <li>Click <strong>View Profile Picture</strong> above to open WhatsApp directly.</li>
              <li>Tap their <strong>contact name</strong> &rarr; tap their <strong>profile photo</strong>.</li>
              <li><strong>PC:</strong> Right-click <em>Copy Image</em>. <strong>Mobile:</strong> Take a screenshot.</li>
            </ol>
            <button
              type="button"
              onClick={pasteFromClipboard}
              class="mt-1 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50/70 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
            >
              📋 Click here to Paste copied image (or press Ctrl + V)
            </button>
          </div>
        </div>}

        <label class="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold">Or choose a photo or screenshot from your device<input ref={picker} type="file" class="block mt-2 w-full text-sm" accept={'image/jpeg,image/png,image/webp,image/gif' + (mode === 'status' ? ',video/mp4,video/webm' : '')} onChange={e => {
          reset(); const file = e.currentTarget.files?.[0]; if (file) preview(file);
        }} /></label>

        <form onSubmit={loadLink} class="space-y-2">
          <label class="block text-xs font-semibold text-slate-700">Direct media link<input class="mt-1.5 block w-full rounded-lg border border-slate-300 p-2.5 text-xs" type="url" required value={address} placeholder="https://…" onInput={e => { reset(); setAddress(e.currentTarget.value); }} /></label>
          <button type="submit" disabled={busy} class="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs text-white font-medium hover:bg-slate-900 transition">{busy ? 'Loading…' : 'Load media'}</button>
        </form>

        <p role="status" class="text-xs font-semibold text-emerald-800">{message}</p>
      </div>

      <div class="min-w-0 bg-emerald-50 p-5 sm:p-7 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100">
        <h2 class="mb-3 text-lg font-bold text-slate-900">Media Preview &amp; Download</h2>
        {!result && <figure class="text-center">
          <img src="/images/whatsapp-media-preview.webp" width="780" height="520" alt="Example square profile photo and vertical status video" class="w-full rounded-xl shadow-sm border border-emerald-100" />
          <figcaption class="mt-3 text-xs text-slate-600">Enter a phone number above, paste an image (<kbd class="px-1 py-0.5 rounded bg-white border border-slate-200">Ctrl+V</kbd>), or select a file to preview and download in original HD quality.</figcaption>
        </figure>}
        {result && <div key={result.url} class="space-y-4 text-center">
          {result.video ? <video controls src={result.url} class="mx-auto max-h-72 max-w-full rounded-lg shadow-sm" /> : <>
            <img src={result.url} alt="Selected WhatsApp media" class="mx-auto max-h-72 max-w-full rounded-xl shadow-sm border border-emerald-200"
              onLoad={event => setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight} pixels`)}
              onError={() => { setDimensions(''); setMessage('The browser could not display this image. Try the original file.'); }} />
            {dimensions && <div class="flex flex-wrap items-center justify-center gap-3">
              <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">{dimensions}</span>
              <button type="button" onClick={() => viewer.current?.showModal()} class="min-h-10 rounded-lg border border-emerald-700 bg-white px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition">🔍 View original size</button>
            </div>}
            <dialog ref={viewer} aria-label="Original size photo" class="m-auto max-h-[90vh] max-w-[95vw] rounded-2xl p-4 backdrop:bg-black/60 shadow-2xl">
              <form method="dialog" class="mb-2 text-right"><button aria-label="Close preview" class="min-h-10 rounded-lg px-3 text-sm font-semibold hover:bg-slate-100">Close preview</button></form>
              <div class="max-h-[70vh] max-w-full overflow-auto text-center"><img src={result.url} alt="Photo at original size" class="max-w-none inline-block rounded-lg" /></div>
            </dialog>
          </>}
          <div>
            <a download={result.name} href={result.url} class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-bold px-6 py-3 shadow-md hover:bg-emerald-700 transition">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download {mode === 'dp' ? 'profile photo' : 'status'}
            </a>
          </div>
        </div>}
      </div>
    </section>

    {/* 3 Steps Feature Cards matching Toolzin structure */}
    <div class="my-10">
      <h2 class="text-center text-xl font-bold text-slate-900 sm:text-2xl">How WhatsApp DP Downloader Works</h2>
      <p class="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">Quickly view and download any WhatsApp profile picture without saving contacts or installing APKs.</p>
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-5 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-lg">1</div>
          <h3 class="mt-3 font-bold text-slate-900">Enter WhatsApp Number</h3>
          <p class="mt-1 text-xs text-slate-600">Choose country code and enter the phone number to open the chat without saving.</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-5 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-lg">2</div>
          <h3 class="mt-3 font-bold text-slate-900">View Profile Picture</h3>
          <p class="mt-1 text-xs text-slate-600">Click View Profile Picture to open their full-size photo in WhatsApp Web or app.</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-5 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-lg">3</div>
          <h3 class="mt-3 font-bold text-slate-900">Copy &amp; Download HD</h3>
          <p class="mt-1 text-xs text-slate-600">Right-click Copy Image (or screenshot), paste here, and download in original resolution.</p>
        </div>
      </div>
    </div>
  </div>;
}
