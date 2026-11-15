import { useState, useRef, useEffect } from 'preact/hooks';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [items]);

  const handleFiles = (incomingFiles: File[]) => {
    const newItems: ProcessedItem[] = incomingFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      originalSize: file.size,
      status: 'idle',
      progress: 0,
    }));
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

  const processItem = async (item: ProcessedItem): Promise<ProcessedItem> => {
    try {
      // In M0/M1 this interacts with canvas/workers
      // Basic client-side conversion canvas fallback
      const outputMime = toFormat === 'png' ? 'image/png' : toFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      const ext = toFormat.toLowerCase();

      // Read image
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

      // Fill white background for JPG targets if transparent
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

  const runAll = async () => {
    setIsProcessingAll(true);
    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue;
      updated[i] = { ...updated[i], status: 'processing', progress: 50 };
      setItems([...updated]);
      updated[i] = await processItem(updated[i]);
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
      a.download = `${toolId}-converted.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const clearAll = () => {
    items.forEach((item) => {
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
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
        class={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-green-600 bg-green-50'
            : 'border-gray-300 hover:border-green-500 bg-gray-50'
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
        <div class="space-y-3">
          <div class="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xl">
            ↑
          </div>
          <p class="text-base font-semibold text-gray-800">
            Drag and drop your files here, or <span class="text-green-600 underline">browse</span>
          </p>
          <p class="text-xs text-gray-500">
            Paste from clipboard (Ctrl+V) • Files never leave your browser
          </p>
        </div>
      </div>

      {/* Options Panel */}
      {items.length > 0 && options.includes('quality') && (
        <div class="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-3 w-full sm:w-auto">
            <label htmlFor="quality-slider" class="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Quality: {quality}%
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
          <div class="flex items-center space-x-3">
            <button
              onClick={runAll}
              disabled={isProcessingAll}
              class="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isProcessingAll ? 'Converting...' : 'Convert All Files'}
            </button>
            <button
              onClick={clearAll}
              class="px-3 py-2 text-xs text-gray-600 hover:text-red-600 transition-colors"
            >
              Clear
            </button>
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
                class="text-xs font-semibold text-green-700 hover:underline"
              >
                Download All as ZIP
              </button>
            )}
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto">
            {items.map((item) => {
              const savedPercent =
                item.newSize && item.originalSize > item.newSize
                  ? Math.round(((item.originalSize - item.newSize) / item.originalSize) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  class="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-lg bg-white gap-2"
                >
                  <div class="flex items-center space-x-3 min-w-0">
                    <span class="w-8 h-8 rounded bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                      {item.file.name.split('.').pop() || 'FILE'}
                    </span>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-800 truncate max-w-xs sm:max-w-md">
                        {item.file.name}
                      </p>
                      <p class="text-xs text-gray-500">
                        {formatSize(item.originalSize)}
                        {item.newSize && (
                          <span>
                            {' '}&rarr; <strong class="text-gray-700">{formatSize(item.newSize)}</strong>
                            {savedPercent > 0 && (
                              <span class="text-green-600 font-semibold ml-1">
                                (-{savedPercent}%)
                              </span>
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-3 self-end sm:self-auto">
                    {item.status === 'processing' && (
                      <span class="text-xs text-green-700 font-medium animate-pulse">
                        Converting...
                      </span>
                    )}

                    {item.status === 'done' && item.resultUrl && (
                      <a
                        href={item.resultUrl}
                        download={item.resultFileName}
                        class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                      >
                        Download
                      </a>
                    )}

                    {item.status === 'error' && (
                      <span class="text-xs text-red-600 font-medium">
                        {item.errorMessage}
                      </span>
                    )}

                    {item.status === 'idle' && (
                      <button
                        onClick={async () => {
                          const updated = [...items];
                          const idx = updated.findIndex((i) => i.id === item.id);
                          if (idx >= 0) {
                            updated[idx].status = 'processing';
                            setItems([...updated]);
                            updated[idx] = await processItem(updated[idx]);
                            setItems([...updated]);
                          }
                        }}
                        class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-semibold"
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

      {/* Trust & Verification Footer Note */}
      <div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span class="flex items-center">
          <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          Processed locally on your device
        </span>
        <span class="hidden sm:inline">
          Verify anytime in browser Network tab
        </span>
      </div>
    </div>
  );
}
