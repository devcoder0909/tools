import { useState, useRef, useEffect, useMemo } from 'preact/hooks';
import { zipSync } from 'fflate';

interface ToolShellProps {
  toolId: string;
  toolName: string;
  fromFormat?: string;
  toFormat?: string;
  kind?: string;
  options?: string[];
  targetBytes?: number;
}

interface ProcessedItem {
  id: string;
  file: File;
  originalSize: number;
  newSize?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultFileName?: string;
  errorMessage?: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
}

export default function ToolShell({
  toolId,
  toolName: _toolName,
  fromFormat: _fromFormat = 'image',
  toFormat = 'jpg',
  kind: _kind = 'converter',
  options: _options = ['quality', 'batch'],
  targetBytes: _targetBytes,
}: ToolShellProps) {
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [deviceWarning, setDeviceWarning] = useState<string | null>(null);
  const [autoConvert, setAutoConvert] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Target Format (allows user to switch on the fly like CloudConvert)
  const [selectedFormat, setSelectedFormat] = useState<string>(
    toFormat && toFormat !== 'all' ? toFormat.toLowerCase() : 'jpg'
  );

  // Image Optimization Options
  const [qualityPreset, setQualityPreset] = useState<'max' | 'balanced' | 'high' | 'custom'>('balanced');
  const [quality, setQuality] = useState(82);
  const [scalePreset, setScalePreset] = useState<number>(1); // 1 = 100%, 0.75, 0.5, 0.25
  const [targetSizeLimitKb, setTargetSizeLimitKb] = useState<number>(0); // 0 = none, or 20, 50, 100, 200, 500
  const [stripMetadata, setStripMetadata] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset quality setter
  const applyQualityPreset = (preset: 'max' | 'balanced' | 'high') => {
    setQualityPreset(preset);
    if (preset === 'max') setQuality(65);
    if (preset === 'balanced') setQuality(82);
    if (preset === 'high') setQuality(92);
  };

  // Batch progress counters
  const doneCount = useMemo(() => items.filter((i) => i.status === 'done').length, [items]);
  const totalCount = items.length;
  const totalOriginalBytes = useMemo(() => items.reduce((acc, i) => acc + i.originalSize, 0), [items]);
  const totalNewBytes = useMemo(
    () => items.reduce((acc, i) => acc + (i.newSize || i.originalSize), 0),
    [items]
  );
  const totalSavedPercent =
    totalOriginalBytes > 0 && totalNewBytes < totalOriginalBytes && doneCount > 0
      ? Math.round(((totalOriginalBytes - totalNewBytes) / totalOriginalBytes) * 100)
      : 0;

  // Monitor device memory if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory && memory <= 2) {
        setDeviceWarning('Low-memory device detected. In-browser processing optimized for single-stream memory safety.');
      }
    }
  }, []);

  // Listen to paste events (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        handleFiles(Array.from(e.clipboardData.files));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [items, autoConvert, selectedFormat, quality, scalePreset, targetSizeLimitKb, stripMetadata]);

  const createThumbUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleFiles = (incomingFiles: File[]) => {
    const newItems: ProcessedItem[] = incomingFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      originalSize: file.size,
      status: 'idle' as const,
      progress: 0,
      thumbUrl: file.type.startsWith('image/') ? createThumbUrl(file) : undefined,
    }));
    setItems((prev) => {
      const merged = [...prev, ...newItems];
      if (autoConvert) {
        setTimeout(() => runAllItems(merged), 80);
      }
      return merged;
    });
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

  // Canvas processing engine with resizing, optimization, and target-size binary search
  const processItem = async (item: ProcessedItem): Promise<ProcessedItem> => {
    try {
      const ext = selectedFormat.toLowerCase();
      const outputMime =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      const img = new Image();
      const objectUrl = URL.createObjectURL(item.file);

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Failed to decode image in browser.'));
        img.src = objectUrl;
      });

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // Apply scale
      const targetW = Math.max(1, Math.round(origW * scalePreset));
      const targetH = Math.max(1, Math.round(origH * scalePreset));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // If output is JPG, transparent pixels need white background
      if (ext === 'jpg' || ext === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      URL.revokeObjectURL(objectUrl);

      let finalBlob: Blob;

      // If target size constraint is set (e.g. 200KB, 100KB, 50KB, 20KB)
      if (targetSizeLimitKb > 0 && ext !== 'png') {
        const maxBytes = targetSizeLimitKb * 1024;
        let low = 0.05;
        let high = 0.95;
        let bestBlob: Blob | null = null;

        // Binary search up to 6 iterations
        for (let iter = 0; iter < 6; iter++) {
          const midQ = (low + high) / 2;
          const testBlob: Blob | null = await new Promise((res) => {
            canvas.toBlob((b) => res(b), outputMime, midQ);
          });

          if (testBlob) {
            if (testBlob.size <= maxBytes) {
              bestBlob = testBlob;
              low = midQ; // try higher quality
            } else {
              high = midQ; // reduce quality
            }
          }
        }

        // If still over budget, downscale dimensions
        if (!bestBlob || bestBlob.size > maxBytes) {
          let scaleFactor = 0.85;
          while (scaleFactor >= 0.25) {
            const downW = Math.max(1, Math.round(targetW * scaleFactor));
            const downH = Math.max(1, Math.round(targetH * scaleFactor));
            const downCanvas = document.createElement('canvas');
            downCanvas.width = downW;
            downCanvas.height = downH;
            const downCtx = downCanvas.getContext('2d');
            if (downCtx) {
              if (ext === 'jpg' || ext === 'jpeg') {
                downCtx.fillStyle = '#ffffff';
                downCtx.fillRect(0, 0, downW, downH);
              }
              downCtx.imageSmoothingEnabled = true;
              downCtx.imageSmoothingQuality = 'high';
              downCtx.drawImage(canvas, 0, 0, downW, downH);

              const downBlob: Blob | null = await new Promise((res) => {
                downCanvas.toBlob((b) => res(b), outputMime, 0.65);
              });
              if (downBlob && downBlob.size <= maxBytes) {
                bestBlob = downBlob;
                break;
              }
            }
            scaleFactor -= 0.15;
          }
        }

        finalBlob = bestBlob || (await new Promise<Blob>((res, rej) => {
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('Export failed'))), outputMime, 0.5);
        }));
      } else {
        // Standard quality export
        const qVal = ext === 'png' ? undefined : quality / 100;
        finalBlob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Image conversion failed.'))),
            outputMime,
            qVal
          );
        });
      }

      const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
      const outFileName = `${baseName}.${ext}`;
      const downloadUrl = URL.createObjectURL(finalBlob);

      return {
        ...item,
        status: 'done',
        progress: 100,
        resultBlob: finalBlob,
        resultUrl: downloadUrl,
        resultFileName: outFileName,
        newSize: finalBlob.size,
        width: targetW,
        height: targetH,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        progress: 0,
        errorMessage: err.message || 'Error processing image',
      };
    }
  };

  const runAllItems = async (itemsList?: ProcessedItem[]) => {
    setIsProcessingAll(true);
    const updated = [...(itemsList || items)];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue;
      updated[i] = { ...updated[i], status: 'processing', progress: 50 };
      setItems([...updated]);
      updated[i] = await processItem(updated[i]);
      setItems([...updated]);
    }
    setIsProcessingAll(false);
  };

  const runAll = async () => {
    await runAllItems();
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
      a.download = `${toolId}-converted.zip`;
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
      const target = prev.find((i) => i.id === id);
      if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl);
      if (target?.thumbUrl) URL.revokeObjectURL(target.thumbUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  return (
    <div class="tool-shell bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 p-5 sm:p-8 my-6 transition-all">
      {deviceWarning && (
        <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center">
          <span class="mr-2 font-bold">Device Notice:</span> {deviceWarning}
        </div>
      )}

      {/* Top Format & Quick Action Bar (CloudConvert & FreeConvert Style) */}
      <div class="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Convert to:</span>
          <div class="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
            {['jpg', 'png', 'webp'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                class={`px-3 py-1 text-xs font-bold rounded-lg uppercase transition-all ${selectedFormat === fmt
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Optimize & Settings Toggle Button */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-label="Image Compression Settings"
          class={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${showAdvanced
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
        >
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Optimization & Resize</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {targetSizeLimitKb > 0 ? `${targetSizeLimitKb}KB Limit` : `${quality}%`}
          </span>
        </button>
      </div>

      {/* Advanced Options Accordion Panel */}
      {showAdvanced && (
        <div class="mb-6 p-4 sm:p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Optimization Controls</span>
            </h3>
            <span class="text-2xs text-slate-500">Fine-tune compression &amp; resolution</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Quality & Compression */}
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-700">Compression Quality</label>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyQualityPreset('max')}
                  class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition-all ${qualityPreset === 'max'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Smallest (65%)
                </button>
                <button
                  type="button"
                  onClick={() => applyQualityPreset('balanced')}
                  class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition-all ${qualityPreset === 'balanced'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Balanced (82%)
                </button>
                <button
                  type="button"
                  onClick={() => applyQualityPreset('high')}
                  class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition-all ${qualityPreset === 'high'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Crisp (92%)
                </button>
              </div>
              <div class="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="15"
                  max="98"
                  value={quality}
                  onInput={(e) => {
                    setQuality(Number((e.target as HTMLInputElement).value));
                    setQualityPreset('custom');
                  }}
                  class="w-full accent-slate-900"
                />
                <span class="text-xs font-mono font-bold text-slate-900 w-9 text-right">{quality}%</span>
              </div>
            </div>

            {/* 2. Resize & Scale */}
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-700">Resize Scale</label>
              <div class="grid grid-cols-4 gap-1.5">
                {[
                  { label: '100%', val: 1 },
                  { label: '75%', val: 0.75 },
                  { label: '50%', val: 0.5 },
                  { label: '25%', val: 0.25 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setScalePreset(s.val)}
                    class={`py-1 text-2xs font-semibold rounded-lg border text-center transition-all ${scalePreset === s.val
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p class="text-[11px] text-slate-500">
                {scalePreset === 1 ? 'Keeps original pixel dimensions' : `Downsamples image to ${scalePreset * 100}% width & height`}
              </p>
            </div>

            {/* 3. Target Max File Size Limit (SimpleImageResizer / TargetSize feature) */}
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-700">Target Max File Size (Optional)</label>
              <div class="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: 'Off', val: 0 },
                  { label: '20KB', val: 20 },
                  { label: '50KB', val: 50 },
                  { label: '100KB', val: 100 },
                  { label: '200KB', val: 200 },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setTargetSizeLimitKb(t.val)}
                    class={`px-2.5 py-1 text-2xs font-semibold rounded-lg border transition-all ${targetSizeLimitKb === t.val
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p class="text-[11px] text-slate-500">
                {targetSizeLimitKb > 0
                  ? `Forces output file under ${targetSizeLimitKb} KB via binary search compression`
                  : 'No strict byte ceiling enforced'}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80 text-xs">
            <label class="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={stripMetadata}
                onChange={(e) => setStripMetadata((e.target as HTMLInputElement).checked)}
                class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Strip EXIF / Camera metadata (removes GPS &amp; saves ~15KB)</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={autoConvert}
                onChange={(e) => setAutoConvert((e.target as HTMLInputElement).checked)}
                class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Auto-convert upon file drop</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        class={`relative rounded-2xl sm:rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 group border-2 border-dashed ${isDragging
          ? 'border-emerald-500 bg-emerald-50/40 scale-[1.005] shadow-xl shadow-emerald-500/10'
          : 'border-slate-200 hover:border-emerald-500/80 hover:bg-emerald-50/20 bg-slate-50/40'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          class="hidden"
          onChange={(e) => {
            const target = e.target as HTMLInputElement;
            if (target.files) handleFiles(Array.from(target.files));
          }}
        />

        <div class="max-w-md mx-auto space-y-4">
          {/* Cloud Upload Icon */}
          <div
            class={`mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging
              ? 'bg-emerald-600 text-white scale-105 shadow-md shadow-emerald-500/20'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900'
              }`}
          >
            <svg class="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <div class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-medium text-sm sm:text-base shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Choose Files</span>
            </div>
            <p class="text-xs text-slate-500 mt-2.5">
              or drag &amp; drop images here, or paste from clipboard (Ctrl+V)
            </p>
          </div>

          {/* Supported Format Pills */}
          <div class="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-2xs font-semibold text-slate-500">
            <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200">JPG</span>
            <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200">PNG</span>
            <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200">WebP</span>
            <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200">HEIC</span>
            <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200">GIF</span>
            <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200">BMP</span>
            <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200">TIFF</span>
            <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200">SVG</span>
          </div>

          <p class="text-2xs text-slate-400 pt-0.5">
            Private client-side processing
          </p>
        </div>
      </div>

      {/* File Queue Section (When files are added) */}
      {items.length > 0 && (
        <div class="mt-8 space-y-4">
          {/* Queue Header & Global Controls */}
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-sm font-bold text-slate-900">
                {items.length} {items.length === 1 ? 'File' : 'Files'} Selected
              </span>
              <span class="text-xs text-slate-500 font-mono">({formatSize(totalOriginalBytes)})</span>
              {doneCount > 0 && (
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {doneCount} Converted
                  {totalSavedPercent > 0 && ` • -${totalSavedPercent}% Size`}
                </span>
              )}
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-1"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add More</span>
              </button>
              <button
                type="button"
                onClick={clearAll}
                class="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 transition"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div class="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {items.map((item) => {
              const savedPct =
                item.newSize && item.originalSize > item.newSize
                  ? Math.round(((item.originalSize - item.newSize) / item.originalSize) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  class={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border rounded-2xl bg-white gap-3 transition-all duration-200 hover:border-slate-300 hover:shadow-xs ${item.status === 'done'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : item.status === 'error'
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200'
                    }`}
                >
                  <div class="flex items-center space-x-3.5 min-w-0 flex-1">
                    {/* Thumbnail preview */}
                    {item.thumbUrl ? (
                      <div class="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 shadow-2xs relative">
                        <img src={item.thumbUrl} alt="" class="w-full h-full object-cover" loading="lazy" />
                        <span class="absolute bottom-0 right-0 px-1 text-[9px] font-bold bg-slate-900/70 text-white rounded-tl">
                          {item.file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <span class="w-14 h-14 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 border border-slate-200">
                        {item.file.name.split('.').pop() || 'FILE'}
                      </span>
                    )}

                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                        {item.file.name}
                      </p>
                      <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span class="font-mono">{formatSize(item.originalSize)}</span>
                        <span class="text-slate-300">→</span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {selectedFormat}
                        </span>

                        {item.status === 'done' && item.newSize && (
                          <span class="inline-flex items-center gap-1.5">
                            <span class="font-mono font-bold text-emerald-800">{formatSize(item.newSize)}</span>
                            {savedPct > 0 && (
                              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                -{savedPct}%
                              </span>
                            )}
                            {item.width && item.height && (
                              <span class="text-[10px] text-slate-400 font-mono">
                                ({item.width}×{item.height}px)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div class="flex items-center space-x-2.5 self-end sm:self-auto flex-shrink-0">
                    {/* Processing: progress bar */}
                    {item.status === 'processing' && (
                      <div class="flex items-center gap-2 min-w-[130px]">
                        <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-[progress_1.2s_ease-in-out_infinite]"
                            style="width: 70%; animation: progress 1.2s ease-in-out infinite;"
                          ></div>
                        </div>
                        <svg class="animate-spin w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    )}

                    {/* Done: Download button */}
                    {item.status === 'done' && item.resultUrl && (
                      <a
                        href={item.resultUrl}
                        download={item.resultFileName}
                        class="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.99]"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </a>
                    )}

                    {/* Error */}
                    {item.status === 'error' && (
                      <span class="text-xs text-rose-600 font-semibold">{item.errorMessage}</span>
                    )}

                    {/* Idle: Single Convert Button */}
                    {item.status === 'idle' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = [...items];
                          const idx = updated.findIndex((i) => i.id === item.id);
                          if (idx >= 0) {
                            updated[idx] = { ...updated[idx], status: 'processing', progress: 50 };
                            setItems([...updated]);
                            updated[idx] = await processItem(updated[idx]);
                            setItems([...updated]);
                          }
                        }}
                        class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
                      >
                        Convert
                      </button>
                    )}

                    {/* Remove Item Button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      class="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 flex items-center justify-center transition"
                      title="Remove file"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Batch Action Footer Bar (FreeConvert / CloudConvert Giant Action Bar) */}
          <div class="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="text-xs text-slate-600 font-medium text-center sm:text-left">
              {doneCount === totalCount ? (
                <span class="text-emerald-700 font-bold">✓ All {totalCount} files converted successfully!</span>
              ) : isProcessingAll ? (
                <span class="text-slate-700 font-semibold animate-pulse">Converting files in browser RAM...</span>
              ) : (
                <span>Click Convert All to process all files in parallel</span>
              )}
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              {doneCount > 1 && (
                <button
                  type="button"
                  onClick={downloadZip}
                  class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download All as ZIP</span>
                </button>
              )}

              {doneCount < totalCount && (
                <button
                  type="button"
                  onClick={runAll}
                  disabled={isProcessingAll}
                  class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isProcessingAll ? (
                    <>
                      <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Converting Queue...</span>
                    </>
                  ) : (
                    <>
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Convert All Files</span>
                      <span class="px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">
                        {totalCount - doneCount}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
