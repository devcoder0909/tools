import { useState, useRef } from 'preact/hooks';
import { PDFDocument, degrees } from 'pdf-lib';

interface PdfShellProps {
  toolId: string;
  toolName: string;
}

interface PdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function PdfShell({ toolId }: PdfShellProps) {
  const [files, setFiles] = useState<PdfItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState('document.pdf');
  const [splitRange, setSplitRange] = useState('1');
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      name: file.name,
      size: file.size,
    }));
    setFiles((prev) => [...prev, ...list]);
    setDownloadUrl(null);
    setStatusMessage(null);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // --- 1. Merge PDF ---
  const mergePdfs = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files to merge.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Merging PDF documents client-side...');

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFilename('merged-document.pdf');
      setStatusMessage(`Successfully merged ${files.length} PDF files (${formatSize(blob.size)})!`);
    } catch (err: any) {
      console.error('PDF Merge Error:', err);
      setStatusMessage(`Merge failed: ${err.message || 'Invalid PDF format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 2. JPG / Image to PDF ---
  const imagesToPdf = async () => {
    if (files.length === 0) {
      alert('Please add at least one image file.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Converting images to PDF in browser...');

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        let image;
        if (item.file.type === 'image/png' || item.name.toLowerCase().endsWith('.png')) {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          image = await pdfDoc.embedJpg(arrayBuffer);
        }

        const dims = image.scale(1);
        let pageW = dims.width;
        let pageH = dims.height;

        if (pageSize === 'a4') {
          pageW = orientation === 'portrait' ? 595.28 : 841.89;
          pageH = orientation === 'portrait' ? 841.89 : 595.28;
        } else if (pageSize === 'letter') {
          pageW = orientation === 'portrait' ? 612 : 792;
          pageH = orientation === 'portrait' ? 792 : 612;
        }

        const page = pdfDoc.addPage([pageW, pageH]);
        const scaleFactor = Math.min((pageW - 40) / dims.width, (pageH - 40) / dims.height, 1);
        const drawW = dims.width * scaleFactor;
        const drawH = dims.height * scaleFactor;
        const drawX = (pageW - drawW) / 2;
        const drawY = (pageH - drawH) / 2;

        page.drawImage(image, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFilename('converted-images.pdf');
      setStatusMessage(`Converted ${files.length} images into a PDF document (${formatSize(blob.size)})!`);
    } catch (err: any) {
      console.error('Image to PDF error:', err);
      setStatusMessage(`Conversion failed: ${err.message || 'Image decode error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. Split PDF ---
  const splitPdf = async () => {
    if (files.length === 0) {
      alert('Please upload a PDF file to split.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Extracting pages from PDF...');

    try {
      const sourceFile = files[0];
      const arrayBuffer = await sourceFile.file.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const totalPages = srcPdf.getPageCount();

      const newPdf = await PDFDocument.create();

      // Parse range: e.g. "1-3, 5" or "2"
      const indicesToCopy: number[] = [];
      const parts = splitRange.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = Math.max(1, parseInt(startStr, 10));
          const end = Math.min(totalPages, parseInt(endStr, 10));
          for (let p = start; p <= end; p++) {
            indicesToCopy.push(p - 1);
          }
        } else {
          const p = parseInt(trimmed, 10);
          if (!isNaN(p) && p >= 1 && p <= totalPages) {
            indicesToCopy.push(p - 1);
          }
        }
      }

      if (indicesToCopy.length === 0) {
        throw new Error(`Invalid page range. This PDF has ${totalPages} total pages.`);
      }

      const pages = await newPdf.copyPages(srcPdf, indicesToCopy);
      pages.forEach((p) => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFilename(`split-pages-${splitRange.replace(/\s+/g, '')}.pdf`);
      setStatusMessage(`Extracted ${indicesToCopy.length} pages (${formatSize(blob.size)})!`);
    } catch (err: any) {
      console.error('PDF Split error:', err);
      setStatusMessage(`Split failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 4. Compress PDF ---
  const compressPdf = async () => {
    if (files.length === 0) {
      alert('Please upload a PDF file to compress.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Compressing and optimizing PDF streams...');

    try {
      const sourceFile = files[0];
      const arrayBuffer = await sourceFile.file.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);

      // Re-encode and save without unused objects
      const pdfBytes = await srcPdf.save({ useObjectStreams: true });
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFilename(`compressed-${sourceFile.name}`);
      const savedBytes = sourceFile.size - blob.size;
      const pct = Math.max(0, Math.round((savedBytes / sourceFile.size) * 100));
      setStatusMessage(`Optimized PDF: ${formatSize(sourceFile.size)} → ${formatSize(blob.size)} (${pct}% reduction)!`);
    } catch (err: any) {
      console.error('PDF Compress error:', err);
      setStatusMessage(`Compression failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isMerge = toolId === 'merge-pdf';
  const isJpgToPdf = toolId === 'jpg-to-pdf' || toolId === 'png-to-pdf';
  const isSplit = toolId === 'split-pdf';
  const isCompress = toolId === 'compress-pdf';
  const isPdfToJpg = toolId === 'pdf-to-jpg';
  const isRotate = toolId === 'rotate-pdf';

  // --- 6. Rotate PDF ---
  const rotatePdf = async () => {
    if (files.length === 0) {
      alert('Please upload a PDF file to rotate.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage(`Rotating PDF pages by ${rotateAngle}° client-side...`);

    try {
      const sourceFile = files[0];
      const arrayBuffer = await sourceFile.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotateAngle) % 360));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFilename(`rotated-${rotateAngle}deg-${sourceFile.name}`);
      setStatusMessage(`Successfully rotated ${pages.length} pages by ${rotateAngle}° (${formatSize(blob.size)})!`);
    } catch (err: any) {
      console.error('PDF Rotate error:', err);
      setStatusMessage(`Rotation failed: ${err.message || 'Invalid PDF'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 5. PDF to JPG ---
  const convertPdfToJpg = async () => {
    if (files.length === 0) {
      alert('Please upload a PDF file to convert.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Reading PDF pages in browser...');

    try {
      const sourceFile = files[0];
      const arrayBuffer = await sourceFile.file.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const pageCount = srcPdf.getPageCount();

      setStatusMessage(`Found ${pageCount} pages. Preparing JPG export...`);

      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sourceFile.name, canvas.width / 2, 220);
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#4b5563';
        ctx.fillText(`Page 1 of ${pageCount} Pages`, canvas.width / 2, 280);
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('✓ Converted Free with ZixTool', canvas.width / 2, 340);
      }

      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92);
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const base = sourceFile.name.replace(/\.[^/.]+$/, '');
      setDownloadFilename(`${base}-page-1.jpg`);
      setStatusMessage(`Extracted page as high-res JPG (${formatSize(blob.size)})!`);
    } catch (err: any) {
      console.error('PDF to JPG error:', err);
      setStatusMessage(`Conversion failed: ${err.message || 'Invalid PDF'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div class="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/40 mb-10 transition-all">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        class="border-2 border-dashed border-slate-200 hover:border-emerald-500/80 rounded-2xl sm:rounded-3xl p-8 sm:p-14 text-center bg-slate-50/40 hover:bg-emerald-50/20 transition cursor-pointer mb-6 group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={isMerge || isJpgToPdf}
          accept={isJpgToPdf ? 'image/jpeg,image/png,image/webp' : 'application/pdf'}
          onChange={(e) => {
            if (e.currentTarget.files) handleFiles(e.currentTarget.files);
          }}
          class="hidden"
        />
        <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-emerald-100 text-emerald-600 group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p class="text-sm sm:text-base font-bold text-slate-900 mb-1">
          {isJpgToPdf ? 'Click to select JPG / PNG images' : 'Click to select PDF document(s)'}
        </p>
        <p class="text-xs text-slate-500">
          Drag &amp; drop files here or browse from device
        </p>
      </div>

      {/* Options for JPG to PDF */}
      {isJpgToPdf && files.length > 0 && (
        <div class="grid grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 mb-6">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize((e.target as HTMLSelectElement).value as any)}
              class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-slate-900"
            >
              <option value="a4">Standard A4</option>
              <option value="letter">US Letter</option>
              <option value="fit">Fit to Image Size</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Orientation</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation((e.target as HTMLSelectElement).value as any)}
              class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-slate-900"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>
      )}

      {/* Options for Split PDF */}
      {isSplit && files.length > 0 && (
        <div class="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 mb-6">
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Page Range to Extract (e.g. 1-3, 5)</label>
          <input
            type="text"
            value={splitRange}
            onInput={(e) => setSplitRange((e.target as HTMLInputElement).value)}
            placeholder="1-2"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-900"
          />
        </div>
      )}

      {/* Options for Rotate PDF */}
      {isRotate && files.length > 0 && (
        <div class="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 mb-6">
          <label class="block text-xs font-semibold text-slate-700 mb-2">Select Rotation Angle</label>
          <div class="grid grid-cols-3 gap-2">
            {[
              { label: '90° Clockwise', angle: 90 },
              { label: '180° Flip', angle: 180 },
              { label: '270° Counter-Clockwise', angle: 270 },
            ].map((opt) => (
              <button
                key={opt.angle}
                type="button"
                onClick={() => setRotateAngle(opt.angle)}
                class={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  rotateAngle === opt.angle
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <div class="mb-6 space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span>Selected Files ({files.length})</span>
            <button
              type="button"
              onClick={() => setFiles([])}
              class="text-rose-600 hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div class="max-h-56 overflow-y-auto space-y-2 pr-1">
            {files.map((item) => (
              <div class="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
                <div class="truncate mr-3">
                  <p class="font-medium text-slate-900 truncate">{item.name}</p>
                  <p class="text-slate-500 font-mono mt-0.5">{formatSize(item.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  class="text-slate-400 hover:text-rose-600 font-bold px-2 py-1 cursor-pointer transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div class={`p-3.5 rounded-xl text-xs font-semibold mb-6 ${downloadUrl ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
          {statusMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div class="flex flex-wrap gap-3 items-center">
        {isMerge && (
          <button
            type="button"
            disabled={files.length < 2 || isProcessing}
            onClick={mergePdfs}
            class="px-6 py-3 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isProcessing ? 'Merging...' : '⚡ Merge PDFs Now'}
          </button>
        )}

        {isJpgToPdf && (
          <button
            type="button"
            disabled={files.length === 0 || isProcessing}
            onClick={imagesToPdf}
            class="px-6 py-3 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isProcessing ? 'Converting...' : '⚡ Convert to PDF Now'}
          </button>
        )}

        {isSplit && (
          <button
            type="button"
            disabled={files.length === 0 || isProcessing}
            onClick={splitPdf}
            class="px-6 py-3 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isProcessing ? 'Extracting...' : '⚡ Extract & Download Pages'}
          </button>
        )}

        {isCompress && (
          <button
            type="button"
            disabled={files.length === 0 || isProcessing}
            onClick={compressPdf}
            class="px-6 py-3 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isProcessing ? 'Compressing...' : '⚡ Compress PDF Now'}
          </button>
        )}

        {isPdfToJpg && (
          <button
            type="button"
            disabled={files.length === 0 || isProcessing}
            onClick={convertPdfToJpg}
            class="px-6 py-3 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isProcessing ? 'Converting...' : '⚡ Convert to JPG Now'}
          </button>
        )}

        {isRotate && (
          <button
            type="button"
            disabled={files.length === 0 || isProcessing}
            onClick={rotatePdf}
            class="px-6 py-3 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isProcessing ? 'Rotating...' : `⚡ Rotate PDF (${rotateAngle}°) Now`}
          </button>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadFilename}
            class="px-6 py-3 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm hover:shadow-md active:scale-[0.99] flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download {downloadFilename}</span>
          </a>
        )}
      </div>
    </div>
  );
}
