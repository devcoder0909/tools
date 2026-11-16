import { useState, useRef, useEffect } from 'preact/hooks';
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

  // Binary search engine for target size optimization
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
      URL.revokeObjectURL(objectUrl);

      let currentW = origW;
      let currentH = origH;
      let bestBlob: Blob | null = null;
      let bestQuality = 85;
      let iterations = 0;

      // Pass 1: Binary search on quality (0.05 to 0.95, up to 10 iterations)
      let lowQ = 0.05;
      let highQ = 0.95;

      const renderCanvas = async (w: number, h: number, q: number): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not initialize canvas rendering context');

        if (ext === 'jpg' || ext === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);

        return new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error('Canvas toBlob failed'));
            },
            mimeType,
            q
          );
        });
      };

      while (lowQ <= highQ && iterations < 10) {
        iterations++;
        const midQ = (lowQ + highQ) / 2;
        const blob = await renderCanvas(currentW, currentH, midQ);

        if (blob.size <= maxBytes) {
          bestBlob = blob;
          bestQuality = Math.round(midQ * 100);
          // Try higher quality to see if we can get better fidelity under maxBytes
          lowQ = midQ + 0.05;
        } else {
          // File is too large, reduce quality
          highQ = midQ - 0.05;
        }
      }

      // Pass 2: If even at lowest quality (0.05) file is larger than target, apply 10% dimension downscaling down to 200px
      if (!bestBlob || bestBlob.size > maxBytes) {
        let scale = 0.9;
        while (currentW * scale >= 200 && currentH * scale >= 200) {
          currentW = Math.round(currentW * scale);
          currentH = Math.round(currentH * scale);
          const scaledBlob = await renderCanvas(currentW, currentH, 0.65);
          if (scaledBlob.size <= maxBytes) {
            bestBlob = scaledBlob;
            bestQuality = 65;
            break;
          }
        }
      }

      // If still over budget, take the lowest size we could reach
      if (!bestBlob) {
        bestBlob = await renderCanvas(Math.max(200, Math.round(currentW * 0.5)), Math.max(200, Math.round(currentH * 0.5)), 0.05);
        bestQuality = 5;
      }

      const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
      const outFileName = `${baseName}-${targetKb}kb.${ext}`;
      const downloadUrl = URL.createObjectURL(bestBlob);

      return {
        ...item,
        status: 'done',
        progress: 100,
        resultBlob: bestBlob,
        resultUrl: downloadUrl,
        resultFileName: outFileName,
        newSize: bestBlob.size,
        qualityUsed: bestQuality,
        width: currentW,
        height: currentH,
        originalWidth: origW,
        originalHeight: origH,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        progress: 0,
        errorMessage: err.message || 'Error compressing image',
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
    });
    setItems([]);
  };

  return (
    <div class="target-size-shell bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6 my-6">
      {/* Target Size Controls */}
      <div class="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Target Size:</label>
          <div class="flex items-center space-x-1 flex-wrap gap-1">
            {[20, 50, 100, 200, 500, 1024].map((kb) => (
              <button
                key={kb}
                type="button"
                onClick={() => setTargetKb(kb)}
                class={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  targetKb === kb
                    ? 'bg-green-600 text-white shadow-xs'
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
                class="w-16 px-2 py-1 text-xs font-mono border border-gray-300 rounded-l-lg bg-white text-gray-900 focus:ring-1 focus:ring-green-500"
              />
              <span class="px-2 py-1 text-xs bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 font-semibold">
                KB
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Format:</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat((e.target as HTMLSelectElement).value as any)}
            class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-green-500"
          >
            <option value="jpg">JPG (Universal compatibility)</option>
            <option value="webp">WebP (Modern high efficiency)</option>
          </select>
        </div>
      </div>

      {pngNotice && (
        <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start justify-between">
          <span>
            <strong>PNG Notice:</strong> Standard PNG format uses lossless compression which cannot be dialed down to an exact byte budget without posterization. Files will be converted to high-efficiency {outputFormat.toUpperCase()} to satisfy the {targetKb}KB target.
          </span>
          <button onClick={() => setPngNotice(false)} class="text-amber-600 hover:text-amber-900 ml-2 font-bold">×</button>
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
          accept="image/*,.heic,.heif"
          class="hidden"
          onChange={(e) => {
            const target = e.target as HTMLInputElement;
            if (target.files) handleFiles(Array.from(target.files));
          }}
        />
        <div class="space-y-3">
          <div class="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xl">
            ↓
          </div>
          <p class="text-base font-semibold text-gray-800">
            Drag & drop images to compress to <span class="text-green-600 font-bold">&le; {targetKb}KB</span>
          </p>
          <p class="text-xs text-gray-500">
            Click to browse files • Paste from clipboard (Ctrl+V) • 100% private in-browser
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {items.length > 0 && (
        <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div class="text-xs text-gray-600 font-medium">
            {items.length} {items.length === 1 ? 'file' : 'files'} selected
          </div>
          <div class="flex items-center space-x-3">
            <button
              type="button"
              onClick={clearAll}
              class="px-4 py-2 text-xs font-medium text-gray-600 hover:text-red-600 transition"
            >
              Clear All
            </button>
            {items.some((i) => i.status === 'done') && (
              <button
                type="button"
                onClick={downloadZip}
                class="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-900 text-white transition shadow-xs"
              >
                Download All as ZIP
              </button>
            )}
            <button
              type="button"
              disabled={isProcessingAll}
              onClick={runAll}
              class="px-6 py-2.5 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white transition shadow-sm disabled:opacity-50"
            >
              {isProcessingAll ? 'Compressing...' : `Compress All to ≤ ${targetKb}KB`}
            </button>
          </div>
        </div>
      )}

      {/* Results Table */}
      {items.length > 0 && (
        <div class="mt-6 border border-gray-200 rounded-xl overflow-hidden text-sm">
          <table class="w-full text-left divide-y divide-gray-200">
            <thead class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-3">File Name</th>
                <th class="px-4 py-3">Original Size</th>
                <th class="px-4 py-3">Result Size</th>
                <th class="px-4 py-3 hidden sm:table-cell">Quality</th>
                <th class="px-4 py-3 hidden sm:table-cell">Dimensions</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id} class="hover:bg-gray-50/80 transition">
                  <td class="px-4 py-3 font-medium text-gray-900 truncate max-w-[160px] sm:max-w-xs">
                    {item.file.name}
                  </td>
                  <td class="px-4 py-3 text-gray-500 font-mono text-xs">
                    {formatSize(item.originalSize)}
                  </td>
                  <td class="px-4 py-3 font-mono text-xs">
                    {item.status === 'done' && item.newSize && (
                      <span
                        class={`inline-flex items-center px-2 py-0.5 rounded font-bold ${
                          item.newSize <= targetKb * 1024
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {formatSize(item.newSize)}
                      </span>
                    )}
                    {item.status === 'processing' && <span class="text-green-600">Processing...</span>}
                    {item.status === 'idle' && <span class="text-gray-400">Ready</span>}
                    {item.status === 'error' && <span class="text-red-500 text-xs">{item.errorMessage}</span>}
                  </td>
                  <td class="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {item.qualityUsed ? `${item.qualityUsed}%` : '—'}
                  </td>
                  <td class="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {item.width && item.height ? `${item.width} × ${item.height}` : '—'}
                  </td>
                  <td class="px-4 py-3 text-right">
                    {item.status === 'done' && item.resultUrl && (
                      <a
                        href={item.resultUrl}
                        download={item.resultFileName}
                        class="inline-block px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded font-semibold text-xs transition"
                      >
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
