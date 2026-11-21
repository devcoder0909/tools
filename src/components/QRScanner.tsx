import { useState } from 'preact/hooks';

export default function QRScanner() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [value, setValue] = useState('');
  const [link, setLink] = useState('');
  async function scan(file?: File) {
    setValue(''); setLink(''); setMessage('');
    if (!file) return;
    setBusy(true);
    const src = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = src;
      await image.decode();
      const scale = Math.min(1, 2000 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw Error();
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { default: jsQR } = await import('jsqr');
      const code = jsQR(pixels.data, pixels.width, pixels.height);
      if (!code) { setMessage('No QR code found. Crop around one code and keep its surrounding margin.'); return; }
      setValue(code.data);
      try {
        const url = new URL(code.data);
        if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) setLink(url.href);
      } catch { /* Plain text and other payloads are displayed for copying. */ }
      setMessage('QR code decoded.');
    } catch { setMessage('Could not read this image. Try a PNG, JPEG or WebP screenshot.'); }
    finally { URL.revokeObjectURL(src); setBusy(false); }
  }
  return <section class="my-6 rounded-2xl border bg-white p-6 space-y-4">
    <label class="block font-semibold">QR code image<input type="file" accept="image/png,image/jpeg,image/webp" class="mt-2 block max-w-full" disabled={busy} onChange={e => { const file=e.currentTarget.files?.[0]; e.currentTarget.value=''; void scan(file); }} /></label>
    <p role="status">{busy ? 'Reading image…' : message}</p>
    {value && <div class="space-y-3"><label class="block font-semibold">Decoded content<textarea readOnly dir="auto" class="mt-2 block w-full rounded-lg border p-3 font-mono" rows={3} value={value} /></label>
      <button class="rounded-lg bg-emerald-700 px-4 py-2 text-white" onClick={async()=>{try{await navigator.clipboard.writeText(value);setMessage('Copied.');}catch{setMessage('Select the decoded text and use your device’s Copy command.');}}}>Copy text</button>
      {link && <a href={link} target="_blank" rel="noopener noreferrer nofollow" class="ml-3 underline text-emerald-800">Open {new URL(link).hostname}</a>}
    </div>}
  </section>;
}
