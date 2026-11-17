import { useState, useRef, useEffect, useMemo } from 'preact/hooks';
import { zipSync } from 'fflate';

interface ProcessedFile {
  id: string;
  file: File;
  originalSize: number;
  newSize?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  resultBlob?: Blob;
  resultUrl?: string;
  resultFileName?: string;
  errorMessage?: string;
  thumbUrl?: string;
}

export default function HomeConverterShell() {
  const [items, setItems] = useState<ProcessedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');
  const [quality, setQuality] = useState<number>(82);
  const [scale, setScale] = useState<number>(1);
  const [targetKb, setTargetKb] = useState<number>(0);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch counters
  const doneCount = useMemo(() => items.filter((i) => i.status === 'done').length, [items]);
  const totalOriginalBytes = useMemo(() => items.reduce((acc, i) => acc + i.originalSize, 0), [items]);
  const totalNewBytes = useMemo(
    () => items.reduce((acc, i) => acc + (i.newSize || i.originalSize), 0),
    [items]
  );
  const savedPercentTotal =
    totalOriginalBytes > 0 && totalNewBytes < totalOriginalBytes && doneCount > 0
      ? Math.round(((totalOriginalBytes - totalNewBytes) / totalOriginalBytes) * 100)
      : 0;

  // Listen to paste events (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        handleFiles(Array.from(e.clipboardData.files));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [items, targetFormat, quality, scale, targetKb]);

  const createThumb = (file: File) => {
    return file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
  };

  const handleFiles = (incoming: File[]) => {
    const newItems: ProcessedFile[] = incoming.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      originalSize: f.size,
      status: 'idle',
      thumbUrl: createThumb(f),
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const processFile = async (item: ProcessedFile): Promise<ProcessedFile> => {
    try {
      const mime = targetFormat === 'png' ? 'image/png' : targetFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      const ext = targetFormat;

      const img = new Image();
      const objectUrl = URL.createObjectURL(item.file);
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = objectUrl;
      });

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const targetW = Math.max(1, Math.round(origW * scale));
      const targetH = Math.max(1, Math.round(origH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (ext === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      URL.revokeObjectURL(objectUrl);

      let finalBlob: Blob;

      if (targetKb > 0 && ext !== 'png') {
        const maxBytes = targetKb * 1024;
        let low = 0.05;
        let high = 0.95;
        let bestBlob: Blob | null = null;
        for (let iter = 0; iter < 5; iter++) {
          const midQ = (low + high) / 2;
          const testBlob: Blob | null = await new Promise((res) => {
            canvas.toBlob((b) => res(b), mime, midQ);
          });
          if (testBlob) {
            if (testBlob.size <= maxBytes) {
              bestBlob = testBlob;
              low = midQ;
            } else {
              high = midQ;
            }
          }
        }
        finalBlob = bestBlob || (await new Promise<Blob>((res, rej) => {
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('Export failed'))), mime, 0.5);
        }));
      } else {
        const qVal = ext === 'png' ? undefined : quality / 100;
        finalBlob = await new Promise((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))), mime, qVal);
        });
      }

      const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
      const outName = `${baseName}.${ext}`;
      const url = URL.createObjectURL(finalBlob);

      return {
        ...item,
        status: 'done',
        resultBlob: finalBlob,
        resultUrl: url,
        resultFileName: outName,
        newSize: finalBlob.size,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        errorMessage: err.message || 'Conversion failed',
      };
    }
  };

  const runAll = async () => {
    setIsProcessing(true);
    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue;
      updated[i] = { ...updated[i], status: 'processing' };
      setItems([...updated]);
      updated[i] = await processFile(updated[i]);
      setItems([...updated]);
    }
    setIsProcessing(false);
  };

  const downloadZip = () => {
    const done = items.filter((i) => i.status === 'done' && i.resultBlob && i.resultFileName);
    if (done.length === 0) return;
    const zipData: Record<string, Uint8Array> = {};
    Promise.all(
      done.map(async (item) => {
        const buf = await item.resultBlob!.arrayBuffer();
        zipData[item.resultFileName!] = new Uint8Array(buf);
      })
    ).then(() => {
      const zipped = zipSync(zipData);
      const blob = new Blob([zipped as any], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-${targetFormat}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const clearAll = () => {
    items.forEach((item) => {
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
    });
    setItems([]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const t = prev.find((i) => i.id === id);
      if (t?.resultUrl) URL.revokeObjectURL(t.resultUrl);
      if (t?.thumbUrl) URL.revokeObjectURL(t.thumbUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  return (
    <div class="home-converter-shell bg-white border border-gray-200 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-8 my-6 sm:my-8 max-w-4xl mx-auto transition-all">
      {/* Format & Optimization Controls Bar */}
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Convert to:</label>
          <div class="inline-flex rounded-xl p-1 bg-gray-100 border border-gray-200">
            {(['jpg', 'png', 'webp'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setTargetFormat(fmt)}
                class={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all ${targetFormat === fmt
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          aria-expanded={showOptions}
          aria-label="Image Compression Settings"
          class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${showOptions
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {targetKb > 0 ? `${targetKb}KB Target` : `Quality ${quality}%`}
          </span>
        </button>
      </div>

      {/* Advanced Options Bar */}
      {showOptions && (
        <div class="mb-6 p-4 bg-gradient-to-br from-emerald-50/50 to-gray-50 border border-emerald-200 rounded-2xl space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block font-bold text-gray-700 mb-1">Quality ({quality}%)</label>
              <input
                type="range"
                min="20"
                max="98"
                value={quality}
                onInput={(e) => setQuality(parseInt((e.target as HTMLInputElement).value, 10))}
                class="w-full accent-emerald-600"
              />
            </div>
            <div>
              <label class="block font-bold text-gray-700 mb-1">Resize Scale</label>
              <div class="grid grid-cols-4 gap-1">
                {[
                  { label: '100%', val: 1 },
                  { label: '75%', val: 0.75 },
                  { label: '50%', val: 0.5 },
                  { label: '25%', val: 0.25 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setScale(s.val)}
                    class={`py-1 text-2xs font-semibold rounded-lg border text-center transition ${scale === s.val
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label class="block font-bold text-gray-700 mb-1">Target Max Size</label>
              <div class="flex items-center gap-1 flex-wrap">
                {[
                  { label: 'Off', val: 0 },
                  { label: '50KB', val: 50 },
                  { label: '100KB', val: 100 },
                  { label: '200KB', val: 200 },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setTargetKb(t.val)}
                    class={`px-2 py-1 text-2xs font-semibold rounded-lg border transition ${targetKb === t.val
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        class={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${isDragging
            ? 'border-emerald-600 bg-emerald-50 scale-[1.01] shadow-lg shadow-emerald-100/50'
            : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-gray-50/40'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif,.webp,.avif,.jfif,.bmp,.tiff"
          class="hidden"
          onChange={(e) => {
            const target = e.target as HTMLInputElement;
            if (target.files) handleFiles(Array.from(target.files));
          }}
        />

        <div class="max-w-md mx-auto space-y-3.5">
          <div
            class={`mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${isDragging
                ? 'bg-emerald-600 text-white scale-105'
                : 'bg-emerald-100/80 text-emerald-700 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white'
              }`}
          >
            <svg class="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <div class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base shadow-xs transition">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Choose Files</span>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Drop photos here or paste from clipboard (Ctrl+V)
            </p>
          </div>
          <p class="text-2xs text-gray-400 pt-0.5">
            Files processed locally in browser memory
          </p>
        </div>
      </div>

      {/* Files List */}
      {items.length > 0 && (
        <div class="mt-8 space-y-3">
          <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl">
            <div class="text-xs sm:text-sm font-bold text-gray-900">
              {items.length} {items.length === 1 ? 'file' : 'files'} ({formatBytes(totalOriginalBytes)})
              {savedPercentTotal > 0 && (
                <span class="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Saved {savedPercentTotal}%
                </span>
              )}
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                class="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                + Add More
              </button>
              <button
                type="button"
                onClick={clearAll}
                class="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-gray-300 rounded-xl hover:bg-red-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {items.map((item) => {
              const savedPct =
                item.newSize && item.originalSize > item.newSize
                  ? Math.round(((item.originalSize - item.newSize) / item.originalSize) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  class={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-2xl bg-white gap-3 transition ${item.status === 'done'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : item.status === 'error'
                        ? 'border-red-200 bg-red-50/20'
                        : 'border-gray-200'
                    }`}
                >
                  <div class="flex items-center space-x-3 min-w-0 flex-1">
                    {item.thumbUrl ? (
                      <div class="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        <img src={item.thumbUrl} alt="" class="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <span class="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {item.file.name.split('.').pop() || 'IMG'}
                      </span>
                    )}

                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-gray-800 truncate max-w-xs sm:max-w-md">
                        {item.file.name}
                      </p>
                      <div class="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <span class="font-mono">{formatBytes(item.originalSize)}</span>
                        <span>→</span>
                        <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-gray-100 uppercase">
                          {targetFormat}
                        </span>
                        {item.status === 'done' && item.newSize && (
                          <span class="font-mono font-bold text-emerald-800 ml-1">
                            {formatBytes(item.newSize)}
                            {savedPct > 0 && ` (-${savedPct}%)`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                    {item.status === 'processing' && (
                      <span class="text-xs font-semibold text-emerald-700 animate-pulse">Processing...</span>
                    )}
                    {item.status === 'done' && item.resultUrl && (
                      <a
                        href={item.resultUrl}
                        download={item.resultFileName}
                        class="inline-flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </a>
                    )}
                    {item.status === 'error' && (
                      <span class="text-xs text-red-600 font-semibold">{item.errorMessage}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      class="w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 flex items-center justify-center transition"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div class="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span class="text-xs text-gray-500">
              {doneCount > 0 ? `${doneCount} of ${items.length} files converted` : `${items.length} files queued`}
            </span>
            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              {doneCount > 1 && (
                <button
                  type="button"
                  onClick={downloadZip}
                  class="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition"
                >
                  Download All (ZIP)
                </button>
              )}
              {doneCount < items.length && (
                <button
                  type="button"
                  onClick={runAll}
                  disabled={isProcessing}
                  class="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md transition disabled:opacity-50"
                >
                  {isProcessing ? 'Converting...' : `Convert All Files (${items.length - doneCount})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
