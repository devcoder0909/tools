import { useEffect, useState } from 'preact/hooks';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export default function PdfExport({ word }: { word: boolean }) {
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [name, setName] = useState('');
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => () => { if (output) URL.revokeObjectURL(output); }, [output]);
  async function convert(file?: File) {
    setOutput(''); setText(''); setMessage('');
    if (!file) return;
    setBusy(true);
    let task: import('pdfjs-dist').PDFDocumentLoadingTask | undefined;
    try {
      setMessage('Reading PDF document…');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await task.promise;
      const pages: string[] = [];
      let empty = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        setMessage('Reading page ' + i + ' of ' + pdf.numPages);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const value = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('').trim();
        pages.push(value); if (!value) empty++;
        page.cleanup();
      }
      if (empty === pages.length) { setMessage('No selectable text found. For a scanned page, use Image to Text on a page image.'); return; }
      const plain = pages.join('\n\n');
      let blob: Blob;
      if (word) {
        setMessage('Generating Word document…');
        const { Document, Paragraph, Packer } = await import('docx');
        const doc = new Document({ sections: [{ children: pages.flatMap((value,i) => value.split('\n').map((line,j) => new Paragraph({text:line,pageBreakBefore:i>0 && j===0}))) }] });
        blob = await Packer.toBlob(doc);
      } else { blob = new Blob([plain], {type:'text/plain;charset=utf-8'}); }
      setText(plain); setName(file.name.replace(/\.pdf$/i,'') + (word ? '.docx' : '.txt')); setOutput(URL.createObjectURL(blob));
      setMessage('Ready. Read ' + pages.length + ' page(s).' + (empty ? ' Pages without selectable text: ' + empty + '.' : ''));
    } catch (error) {
      setMessage(error instanceof Error && error.name==='PasswordException' ? 'This PDF requires a password. Choose an unlocked copy.' : 'Could not read this PDF. Choose a valid, unlocked PDF and try again.');
    } finally { setBusy(false); await task?.destroy(); }
  }
  return <section data-hydrated={hydrated ? 'true' : undefined} class="my-6 space-y-4 rounded-2xl border bg-white p-6">
    <label class="block font-semibold">PDF document<input class="mt-2 block max-w-full" type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e=>{const f=e.currentTarget.files?.[0]; e.currentTarget.value='';void convert(f);}} /></label>
    <p role="status">{busy ? (message || 'Reading PDF document…') : message}</p>
    {output && <><label class="block">Extracted text preview<textarea class="w-full rounded-lg border p-3" readOnly rows={7} dir="auto" value={text}/></label>
      <a class="inline-block rounded bg-emerald-700 px-4 py-2 text-white" download={name} href={output}>Download {word?'Word document':'text file'}</a></>}
  </section>;
}

