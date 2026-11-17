import { useState, useRef, useEffect, useMemo } from 'preact/hooks';
import { zipSync } from 'fflate';

interface TargetSizeShellProps {
  toolId: string;
  toolName: string;
  defaultTargetKb?: number;
}

interface TargetProcessedItem {
  id: string;
  file: File;
  originalSize: number;
  newSize?: number;
  qualityUsed?: number;
  width?: number;
  height?: number;
  originalWidth?: number;
  originalHeight?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultFileName?: string;
  errorMessage?: string;
  thumbUrl?: string;
}

export default function TargetSizeShell({
  toolId,
  toolName: _toolName,
  defaultTargetKb = 200,
}: TargetSizeShellProps) {
  const [targetKb, setTargetKb] = useState<number>(defaultTargetKb);
  const [outputFormat, setOutputFormat] = useState<'jpg' | 'webp'>('jpg');
  const [items, setItems] = useState<TargetProcessedItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [pngNotice, setPngNotice] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse preset target from toolId if present
  useEffect(() => {
    const match = toolId.match(/compress-image-to-(\d+)(kb|mb)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      setTargetKb(unit === 'mb' ? val * 1024 : val);
    }
  }, [toolId]);

  const createThumbUrl = (file: File) => {
    return file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
  };

  const handleFiles = (incomingFiles: File[]) => {
    let hasPng = false;
    const newItems: TargetProcessedItem[] = incomingFiles.map((file, idx) => {
      if (file.type === 'image/png') hasPng = true;
      return {
        id: `${Date.now()}-${idx}-${file.name}`,
        file,
        originalSize: file.size,
        status: 'idle',
        progress: 0,
        thumbUrl: createThumbUrl(file),
      };
    });
    if (hasPng) setPngNotice(true);
    setItems((prev) => [...prev, ...newItems]);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Binary search engine for exact target byte size
  const compressToTarget = async (
    item: TargetProcessedItem,
    maxBytes: number,
    mimeType: string,
    ext: string
  ): Promise<TargetProcessedItem> => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(item.file);

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Failed to load image in browser'));
        img.src = objectUrl;
      });

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      canvas.width = origW;
      canvas.height = origH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (ext === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, origW, origH);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      // Phase 1: Quality Binary Search (10 iterations)
      let lowQ = 0.05;
      let highQ = 0.95;
      let bestBlob: Blob | null = null;
      let bestQ = 0.8;

      for (let i = 0; i < 10; i++) {
        const midQ = (lowQ + highQ) / 2;
        const blob: Blob | null = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), mimeType, midQ);
        });

        if (!blob) break;

        if (blob.size <= maxBytes) {
          bestBlob = blob;
          bestQ = midQ;
          lowQ = midQ;
        } else {
          highQ = midQ;
        }
      }

      let finalWidth = origW;
      let finalHeight = origH;

      // Phase 2: Dimension Downscaling if still over budget
      if (!bestBlob || bestBlob.size > maxBytes) {
        let scale = 0.9;
        const minScale = 0.15;

        while (scale >= minScale) {
          const scaledW = Math.max(1, Math.round(origW * scale));
          const scaledH = Math.max(1, Math.round(origH * scale));

          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = scaledW;
          scaledCanvas.height = scaledH;
          const sCtx = scaledCanvas.getContext('2d');
          if (!sCtx) break;

          sCtx.imageSmoothingEnabled = true;
          sCtx.imageSmoothingQuality = 'high';

          if (ext === 'jpg') {
            sCtx.fillStyle = '#ffffff';
            sCtx.fillRect(0, 0, scaledW, scaledH);
          }
          sCtx.drawImage(canvas, 0, 0, scaledW, scaledH);

          const candidateBlob: Blob | null = await new Promise((resolve) => {
            scaledCanvas.toBlob((b) => resolve(b), mimeType, 0.7);
          });

          if (candidateBlob && candidateBlob.size <= maxBytes) {
            bestBlob = candidateBlob;
            finalWidth = scaledW;
            finalHeight = scaledH;
            bestQ = 0.7;
            break;
          }
          scale -= 0.1;
        }
      }

      if (!bestBlob) {
        bestBlob = await new Promise((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), mimeType, 0.1);
        });
      }

      const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
      const resultFileName = `${baseName}-${targetKb}kb.${ext}`;
      const resultUrl = URL.createObjectURL(bestBlob!);

      return {
        ...item,
        status: 'done',
        progress: 100,
        resultBlob: bestBlob!,
        resultUrl,
        resultFileName,
        newSize: bestBlob!.size,
        qualityUsed: Math.round(bestQ * 100),
        width: finalWidth,
        height: finalHeight,
        originalWidth: origW,
        originalHeight: origH,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        progress: 0,
        errorMessage: err.message || 'Compression failed',
      };
    }
  };

  const runAll = async () => {
    setIsProcessingAll(true);
    const maxBytes = targetKb * 1024;
    const mime = outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const ext = outputFormat;

    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue;
      updated[i] = { ...updated[i], status: 'processing', progress: 50 };
      setItems([...updated]);
      updated[i] = await compressToTarget(updated[i], maxBytes, mime, ext);
      setItems([...updated]);
    }
    setIsProcessingAll(false);
  };

  const downloadZip = () => {
    const doneItems = items.filter((i) => i.status === 'done' && i.resultBlob && i.resultFileName);
    if (doneItems.length === 0) return;

    const zipData: Record<string, Uint8Array> = {};
    const promises = doneItems.map(async (item) => {
      const buffer = await item.resultBlob!.arrayBuffer();
      zipData[item.resultFileName!] = new Uint8Array(buffer);
    });

    Promise.all(promises).then(() => {
      const zipped = zipSync(zipData);
      const blob = new Blob([zipped as any], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed-${targetKb}kb.zip`;
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

  const doneCount = useMemo(() => items.filter((i) => i.status === 'done').length, [items]);

  return (
    <div class="target-size-shell bg-white border border-gray-200 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-8 my-6 transition-all">
      {/* Target Size Controls Bar */}
      <div class="mb-6 p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 to-gray-50 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-3 flex-wrap gap-2">
          <label class="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1">
            <span>🎯</span> Target Size:
          </label>
          <div class="flex items-center space-x-1 flex-wrap gap-1">
            {[20, 50, 100, 200, 500, 1024].map((kb) => (
              <button
                key={kb}
                type="button"
                onClick={() => setTargetKb(kb)}
                class={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  targetKb === kb
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {kb >= 1024 ? `${kb / 1024}MB` : `${kb}KB`}
              </button>
            ))}
            <div class="flex items-center ml-2">
              <input
                type="number"
                min="5"
                max="10240"
                value={targetKb}
                onChange={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value, 10);
                  if (val > 0) setTargetKb(val);
                }}
                class="w-16 px-2.5 py-1.5 text-xs font-mono font-bold border border-gray-300 rounded-l-xl bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500"
              />
              <span class="px-2.5 py-1.5 text-xs bg-gray-100 border border-l-0 border-gray-300 rounded-r-xl text-gray-600 font-bold">
                KB
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Format:</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat((e.target as HTMLSelectElement).value as any)}
            class="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          >
            <option value="jpg">JPG (Universal format)</option>
            <option value="webp">WebP (High efficiency)</option>
          </select>
        </div>
      </div>

      {pngNotice && (
        <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start justify-between">
          <span>
            <strong>PNG Notice:</strong> Standard PNG format uses lossless compression which cannot be dialed down to an exact byte budget without posterization. Files will be converted to high-efficiency {outputFormat.toUpperCase()} to satisfy the {targetKb}KB target.
          </span>
          <button onClick={() => setPngNotice(false)} class="text-amber-600 hover:text-amber-900 ml-2 font-bold text-sm">×</button>
        </div>
      )}

      {/* Hero Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        class={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 scale-[1.01] shadow-lg shadow-emerald-100/50'
            : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-gray-50/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif,.webp"
          class="hidden"
          onChange={(e) => {
            const target = e.target as HTMLInputElement;
            if (target.files) handleFiles(Array.from(target.files));
          }}
        />
        <div class="max-w-md mx-auto space-y-3.5">
          <div
            class={`mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isDragging
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
              <span>Choose Images</span>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Drag &amp; drop photos or paste from clipboard (Ctrl+V)
            </p>
          </div>

          <p class="text-2xs text-gray-400 pt-0.5">
            Automatic compression to &le; {targetKb} KB per photo • 100% in-browser RAM
          </p>
        </div>
      </div>

      {/* Files List & Results */}
      {items.length > 0 && (
        <div class="mt-8 space-y-3">
          <div class="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
            <div class="text-xs sm:text-sm font-bold text-gray-900">
              {items.length} {items.length === 1 ? 'image' : 'images'} selected
              {doneCount > 0 && <span class="text-emerald-700 ml-2 font-bold">({doneCount} compressed)</span>}
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

          <div class="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {items.map((item) => {
              const savedPct =
                item.newSize && item.originalSize > item.newSize
                  ? Math.round(((item.originalSize - item.newSize) / item.originalSize) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  class={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-2xl bg-white gap-3 transition ${
                    item.status === 'done'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : item.status === 'error'
                      ? 'border-red-200 bg-red-50/20'
                      : 'border-gray-200'
                  }`}
                >
                  <div class="flex items-center space-x-3.5 min-w-0 flex-1">
                    {item.thumbUrl ? (
                      <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 shadow-2xs">
                        <img src={item.thumbUrl} alt="" class="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <span class="w-14 h-14 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 border border-gray-200">
                        IMG
                      </span>
                    )}

                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                        {item.file.name}
                      </p>
                      <div class="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                        <span class="font-mono">{formatSize(item.originalSize)}</span>
                        <span>→</span>
                        {item.status === 'done' && item.newSize ? (
                          <span class="inline-flex items-center gap-1.5">
                            <span class="font-mono font-bold text-emerald-800">{formatSize(item.newSize)}</span>
                            {savedPct > 0 && (
                              <span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                -{savedPct}%
                              </span>
                            )}
                            {item.qualityUsed && (
                              <span class="text-[10px] text-gray-400 font-mono">
                                ({item.qualityUsed}% Q, {item.width}×{item.height}px)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span class="text-xs text-gray-400">Target &le; {targetKb}KB</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                    {item.status === 'processing' && (
                      <span class="text-xs font-semibold text-emerald-700 animate-pulse">Compressing...</span>
                    )}
                    {item.status === 'done' && item.resultUrl && (
                      <a
                        href={item.resultUrl}
                        download={item.resultFileName}
                        class="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
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

          {/* Bottom Action Footer */}
          <div class="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span class="text-xs text-gray-500">
              {doneCount > 0 ? `${doneCount} of ${items.length} compressed` : `${items.length} images ready`}
            </span>
            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              {doneCount > 1 && (
                <button
                  type="button"
                  onClick={downloadZip}
                  class="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition"
                >
                  Download All as ZIP
                </button>
              )}
              {doneCount < items.length && (
                <button
                  type="button"
                  onClick={runAll}
                  disabled={isProcessingAll}
                  class="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md transition disabled:opacity-50"
                >
                  {isProcessingAll ? 'Compressing...' : `Compress All to ≤ ${targetKb}KB`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
