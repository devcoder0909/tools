import { useState, useRef } from 'preact/hooks';
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
}

export default function HomeConverterShell() {
  const [items, setItems] = useState<ProcessedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');
  const [quality, setQuality] = useState<number>(85);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: File[]) => {
    const newItems: ProcessedFile[] = incoming.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      originalSize: f.size,
      status: 'idle',
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

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      if (ext === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))),
          mime,
          quality / 100
        );
      });

      const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
      const outName = `${baseName}.${ext}`;
      const url = URL.createObjectURL(blob);

      return {
        ...item,
        status: 'done',
        resultBlob: blob,
        resultUrl: url,
        resultFileName: outName,
        newSize: blob.size,
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

  return (
    <div class="home-converter-shell bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 my-8 max-w-4xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div class="flex items-center space-x-2">
          <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Convert to:</label>
          <div class="flex space-x-1">
            {(['jpg', 'png', 'webp'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setTargetFormat(fmt)}
                class={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition ${
                  targetFormat === fmt
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {targetFormat !== 'png' && (
          <div class="flex items-center space-x-2 text-xs">
            <span class="text-gray-500 font-medium">Quality ({quality}%):</span>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onInput={(e) => setQuality(parseInt((e.target as HTMLInputElement).value, 10))}
              class="w-24 sm:w-32 accent-green-600 cursor-pointer"
            />
          </div>
        )}
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        class={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-green-600 bg-green-50' : 'border-gray-300 hover:border-green-500 bg-gray-50'
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
        <div class="space-y-3">
          <div class="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xl">
            ⚡
          </div>
          <p class="text-base font-semibold text-gray-800">
            Drop any image here to convert to <span class="text-green-600 font-bold uppercase">{targetFormat}</span>
          </p>
          <p class="text-xs text-gray-500">
            Supports HEIC, WebP, PNG, JPG, AVIF, TIFF, BMP • 100% In-Browser Privacy
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
          <span class="text-xs text-gray-600 font-medium">{items.length} file(s) selected</span>
          <div class="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setItems([])}
              class="text-xs text-gray-500 hover:text-red-600"
            >
              Clear
            </button>
            {items.some((i) => i.status === 'done') && (
              <button
                type="button"
                onClick={downloadZip}
                class="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 text-white hover:bg-gray-900"
              >
                Download All (ZIP)
              </button>
            )}
            <button
              type="button"
              disabled={isProcessing}
              onClick={runAll}
              class="px-5 py-2 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? 'Converting...' : `Convert All to ${targetFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div class="mt-6 border border-gray-200 rounded-xl overflow-hidden text-xs sm:text-sm">
          <table class="w-full text-left divide-y divide-gray-200">
            <thead class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-3">File</th>
                <th class="px-4 py-3">Size</th>
                <th class="px-4 py-3">Result</th>
                <th class="px-4 py-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id}>
                  <td class="px-4 py-3 font-medium text-gray-900 truncate max-w-[160px] sm:max-w-xs">
                    {item.file.name}
                  </td>
                  <td class="px-4 py-3 text-gray-500 font-mono text-xs">{formatBytes(item.originalSize)}</td>
                  <td class="px-4 py-3 font-mono text-xs">
                    {item.status === 'done' && item.newSize && (
                      <span class="text-green-700 font-bold">{formatBytes(item.newSize)}</span>
                    )}
                    {item.status === 'processing' && <span class="text-green-600">Processing...</span>}
                    {item.status === 'idle' && <span class="text-gray-400">Ready</span>}
                    {item.status === 'error' && <span class="text-red-500">{item.errorMessage}</span>}
                  </td>
                  <td class="px-4 py-3 text-right">
                    {item.status === 'done' && item.resultUrl && (
                      <a
                        href={item.resultUrl}
                        download={item.resultFileName}
                        class="inline-block px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded font-semibold text-xs border border-green-200"
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

