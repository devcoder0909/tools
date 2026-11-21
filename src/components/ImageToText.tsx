import { useState } from 'preact/hooks';
import workerPath from 'tesseract.js/dist/worker.min.js?url';
import corePath from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';

export default function ImageToText() {
  const [file, setFile] = useState<File>();
  const [lang, setLang] = useState('eng');
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  async function extract() {
    if (!file || busy) return;
    setBusy(true); setText(''); setMessage('Loading recognition engine and language…');
    let worker: import('tesseract.js').Worker | undefined;
    try {
      const { createWorker, OEM } = await import('tesseract.js');
      worker = await createWorker(lang, OEM.LSTM_ONLY, { workerPath, corePath, workerBlobURL: false, langPath: '/ocr/fast', logger: event => {
        if (event.status === 'recognizing text') setMessage('Reading image: ' + Math.round(event.progress * 100) + '%');
      }, errorHandler: () => {} });
      const result = (await worker.recognize(file)).data.text.trim();
      setText(result); setMessage(result ? 'Review the extracted text below.' : 'No text found. Try a sharper crop and check the language.');
    } catch { setMessage('Could not read this image. Try a smaller JPG, PNG or WebP and check your connection.'); }
    finally { try { await worker?.terminate(); } finally { setBusy(false); } }
  }
  return <section class="my-6 space-y-4 rounded-2xl border bg-white p-6">
    <label class="block font-semibold">Image file<input class="block mt-2 max-w-full" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{setFile(e.currentTarget.files?.[0]);setText('');setMessage('');}} /></label>
    <label class="block font-semibold">Text language <select class="rounded-lg border p-2" disabled={busy} value={lang} onChange={e=>{setLang(e.currentTarget.value);setText('');setMessage('');}}>
      <option value="eng">English</option><option value="spa">Español</option><option value="por">Português</option><option value="hin">हिन्दी</option><option value="ara">العربية</option>
    </select></label>
    <button class="rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-50" disabled={!file || busy} onClick={extract}>Extract text</button>
    <p role="status">{message}</p>
    {text !== '' && <label class="block">Extracted text<textarea aria-label="Extracted text" dir="auto" class="mt-2 w-full rounded-lg border p-3" rows={8} value={text} onInput={e=>setText(e.currentTarget.value)} /></label>}
    {text && <button class="rounded-lg border px-4 py-2" onClick={async()=>{try { await navigator.clipboard.writeText(text);setMessage('Text copied.'); } catch {setMessage('Select the extracted text and use your device’s Copy command.');}}}>Copy text</button>}
  </section>;
}
