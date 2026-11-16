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
}

export default function ToolShell({
  toolId,
  toolName: _toolName,
  fromFormat: _fromFormat = 'image',
  toFormat = 'jpg',
  kind: _kind = 'converter',
  options = ['quality', 'batch'],
  targetBytes: _targetBytes,
}: ToolShellProps) {
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [quality, setQuality] = useState(85);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [deviceWarning, setDeviceWarning] = useState<string | null>(null);
  const [autoConvert, setAutoConvert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch progress counters
  const doneCount = useMemo(() => items.filter((i) => i.status === 'done').length, [items]);
  const totalCount = items.length;

  // Monitor device memory if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory && memory <= 2) {
        setDeviceWarning('Low-memory device detected. Processing in memory-safe single batches.');
      }
    }
  }, []);

  // Listen to paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        handleFiles(Array.from(e.clipboardData.files));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [items, autoConvert]);

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
      // Auto-convert if enabled
      if (autoConvert) {
        setTimeout(() => runAllItems(merged), 50);
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

  const processItem = async (item: ProcessedItem): Promise<ProcessedItem> => {
    try {
      const outputMime = toFormat === 'png' ? 'image/png' : toFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      const ext = toFormat.toLowerCase();

      const img = new Image();
      const objectUrl = URL.createObjectURL(item.file);

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Failed to decode image in browser'));
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas rendering context');

      if (ext === 'jpg' || ext === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Image conversion failed'));
          },
          outputMime,
          quality / 100
        );
      });

      const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
      const outFileName = `${baseName}.${ext}`;
      const downloadUrl = URL.createObjectURL(blob);

      return {
        ...item,
        status: 'done',
        progress: 100,
        resultBlob: blob,
        resultUrl: downloadUrl,
        resultFileName: outFileName,
        newSize: blob.size,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        progress: 0,
        errorMessage: err.message || 'Error processing file',
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

  return (
    <div class="tool-shell bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6 my-6">
      {deviceWarning && (
        <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center">
          <span class="mr-2 font-bold">Notice:</span> {deviceWarning}
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        class={`relative border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 group ${
          isDragging
            ? 'border-green-500 bg-green-50 scale-[1.01] shadow-lg shadow-green-100'
            : 'border-gray-300 hover:border-green-400 hover:bg-green-50/40 bg-gradient-to-b from-gray-50 to-white'
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
        <div class="space-y-4">
          {/* Upload icon */}
          <div class={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragging ? 'bg-green-500 text-white scale-110' : 'bg-green-100 text-green-600 group-hover:bg-green-200 group-hover:scale-105'
          }`}>
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p class="text-lg font-bold text-gray-800">
              {isDragging ? 'Drop your files here!' : (<>Drop files here or <span class="text-green-600 underline underline-offset-2 decoration-2 decoration-green-400">browse</span></>)}
            </p>
            <p class="text-sm text-gray-500 mt-1">
              Supports JPG, PNG, WebP, GIF, BMP, TIFF
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Batch upload
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Paste (Ctrl+V)
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              100% private
            </span>
          </div>
        </div>
      </div>

      {/* Options Panel */}
      {items.length > 0 && options.includes('quality') && (
        <div class="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center space-x-3 w-full sm:w-auto">
              <label htmlFor="quality-slider" class="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Quality: <span class="text-green-700 font-bold">{quality}%</span>
              </label>
              <input
                id="quality-slider"
                type="range"
                min="10"
                max="95"
                value={quality}
                onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value))}
                class="w-full sm:w-48 accent-green-600"
              />
            </div>

            {/* Auto-convert toggle */}
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <div class="relative">
                <input
                  type="checkbox"
                  checked={autoConvert}
                  onChange={(e) => setAutoConvert((e.target as HTMLInputElement).checked)}
                  class="sr-only peer"
                />
                <div class="w-9 h-5 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-colors"></div>
                <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span class="text-xs font-semibold text-gray-700">Auto-convert on drop</span>
            </label>
          </div>

          <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
            {/* Batch progress */}
            {totalCount > 0 && (
              <div class="text-xs text-gray-600 font-medium">
                {isProcessingAll ? (
                  <span class="text-green-700 font-semibold">{doneCount} of {totalCount} files converted</span>
                ) : doneCount > 0 ? (
                  <span class="text-green-700 font-semibold">✓ {doneCount} of {totalCount} converted</span>
                ) : (
                  <span>{totalCount} {totalCount === 1 ? 'file' : 'files'} ready</span>
                )}
              </div>
            )}
            <div class="flex items-center space-x-3">
              <button
                onClick={runAll}
                disabled={isProcessingAll}
                class="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessingAll ? (
                  <>
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Converting...
                  </>
                ) : (
                  'Convert All Files'
                )}
              </button>
              <button
                onClick={clearAll}
                class="px-3 py-2 text-xs text-gray-600 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File List & Progress */}
      {items.length > 0 && (
        <div class="mt-6 space-y-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold text-gray-800">Files ({items.length})</div>
            {items.some((i) => i.status === 'done') && (
              <button
                onClick={downloadZip}
                class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm transition-all"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download All as ZIP
              </button>
            )}
          </div>

          <div class="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {items.map((item) => {
              const savedPercent =
                item.newSize && item.originalSize > item.newSize
                  ? Math.round(((item.originalSize - item.newSize) / item.originalSize) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  class={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-xl bg-white gap-3 transition-all duration-300 ${
                    item.status === 'done' ? 'border-green-200 bg-green-50/30' : item.status === 'error' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                  }`}
                >
                  <div class="flex items-center space-x-3 min-w-0">
                    {/* Thumbnail preview */}
                    {item.thumbUrl ? (
                      <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        <img src={item.thumbUrl} alt="" class="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <span class="w-12 h-12 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {item.file.name.split('.').pop() || 'FILE'}
                      </span>
                    )}
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-800 truncate max-w-xs sm:max-w-md">
                        {item.file.name}
                      </p>
                      <div class="text-xs text-gray-500 mt-0.5">
                        {item.status === 'done' && item.newSize ? (
                          <span class="inline-flex items-center gap-1 flex-wrap">
                            <span class="font-mono">{formatSize(item.originalSize)}</span>
                            <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            <span class="font-mono font-bold text-gray-700">{formatSize(item.newSize)}</span>
                            {savedPercent > 0 && (
                              <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                Saved {savedPercent}%
                              </span>
                            )}
                          </span>
                        ) : (
                          <span class="font-mono">{formatSize(item.originalSize)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-3 self-end sm:self-auto flex-shrink-0">
                    {/* Processing: animated progress bar */}
                    {item.status === 'processing' && (
                      <div class="flex items-center gap-2 min-w-[120px]">
                        <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div class="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-[progress_1.5s_ease-in-out_infinite]"
                            style="width: 70%; animation: progress 1.5s ease-in-out infinite;"
                          ></div>
                        </div>
                        <svg class="animate-spin w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      </div>
                    )}

                    {/* Done: checkmark + download */}
                    {item.status === 'done' && item.resultUrl && (
                      <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 animate-[popIn_0.3s_ease-out]">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <a
                          href={item.resultUrl}
                          download={item.resultFileName}
                          class="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:shadow-md"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Download
                        </a>
                      </div>
                    )}

                    {/* Error */}
                    {item.status === 'error' && (
                      <div class="flex items-center gap-1.5 text-red-600">
                        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span class="text-xs font-medium">{item.errorMessage}</span>
                      </div>
                    )}

                    {/* Idle: convert button */}
                    {item.status === 'idle' && (
                      <button
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
                        class="px-4 py-2 bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-700 rounded-lg text-xs font-bold transition-all border border-gray-200 hover:border-green-300"
                      >
                        Convert
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Trust & Verification Footer Note */}
      <div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span class="flex items-center">
          <span class="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Processed locally on your device
        </span>
        <span class="hidden sm:inline">
          Verify anytime in browser Network tab
        </span>
      </div>
    </div>
  );
}
