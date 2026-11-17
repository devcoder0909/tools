import { useState, useRef } from 'preact/hooks';

interface Props {
  toolId?: string;
  toolName?: string;
}

export default function BackgroundRemoverShell({ toolName: _toolName = 'Background Remover' }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('image');
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'custom'>('transparent');
  const [customColor, setCustomColor] = useState<string>('#3b82f6');
  const [tolerance, setTolerance] = useState<number>(35);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputStats, setOutputStats] = useState<{ width: number; height: number; sizeKb: number } | null>(null);

  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setImageName(cleanName);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      const img = new Image();
      img.onload = () => {
        originalImgRef.current = img;
        processImage(img, tolerance, bgMode, customColor);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const processImage = (
    img: HTMLImageElement,
    tol: number,
    mode: 'transparent' | 'white' | 'custom',
    colorHex: string
  ) => {
    setIsProcessing(true);
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Sample background colors from four corners
    const corners = [
      0, // Top-left
      (img.width - 1) * 4, // Top-right
      ((img.height - 1) * img.width) * 4, // Bottom-left
      ((img.height - 1) * img.width + (img.width - 1)) * 4, // Bottom-right
    ];

    let bgR = 0, bgG = 0, bgB = 0;
    for (const c of corners) {
      bgR += data[c];
      bgG += data[c + 1];
      bgB += data[c + 2];
    }
    bgR = Math.round(bgR / corners.length);
    bgG = Math.round(bgG / corners.length);
    bgB = Math.round(bgB / corners.length);

    // Parse custom replacement color if needed
    let repR = 255, repG = 255, repB = 255;
    if (mode === 'custom') {
      const match = colorHex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (match) {
        repR = parseInt(match[1], 16);
        repG = parseInt(match[2], 16);
        repB = parseInt(match[3], 16);
      }
    }

    const tolDist = (tol / 100) * 441.67; // Max Euclidean distance in RGB is sqrt(255^2*3) = 441.67
    const softTol = tolDist * 0.4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist <= tolDist) {
        if (mode === 'transparent') {
          if (dist <= tolDist - softTol) {
            data[i + 3] = 0; // Completely transparent
          } else {
            // Feather edge
            const alphaFactor = (dist - (tolDist - softTol)) / Math.max(1, softTol);
            data[i + 3] = Math.round(data[i + 3] * alphaFactor);
          }
        } else {
          // Replace with white or custom solid background
          data[i] = repR;
          data[i + 1] = repG;
          data[i + 2] = repB;
          data[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setOutputStats({
          width: img.width,
          height: img.height,
          sizeKb: Math.round(blob.size / 1024),
        });
      }
      setIsProcessing(false);
    }, 'image/png');
  };

  const reprocess = (newTol: number, newMode: 'transparent' | 'white' | 'custom', newColor: string) => {
    if (originalImgRef.current) {
      processImage(originalImgRef.current, newTol, newMode, newColor);
    }
  };

  return (
    <div class="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
      {!imageSrc ? (
        <label class="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-10 sm:p-14 block text-center bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer group">
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={(e) => {
              if (e.currentTarget.files?.[0]) handleFileUpload(e.currentTarget.files[0]);
            }}
            class="hidden"
          />
          <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-200 text-emerald-600 group-hover:scale-105 transition-transform">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="text-base font-bold text-slate-900 mb-1 block group-hover:text-emerald-700">
            Upload an image to remove background
          </span>
          <p class="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Drag &amp; drop or click to browse. Supports JPG, PNG, and WebP.
          </p>
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-2xs font-semibold">
            <span>🔒 100% In-Device Memory</span>
            <span>•</span>
            <span>Zero Cloud Uploads</span>
          </div>
        </label>
      ) : (
        <div class="space-y-6">
          {/* Controls Bar */}
          <div class="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Background Style
                </span>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBgMode('transparent');
                      reprocess(tolerance, 'transparent', customColor);
                    }}
                    class={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition ${
                      bgMode === 'transparent'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Transparent PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgMode('white');
                      reprocess(tolerance, 'white', customColor);
                    }}
                    class={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition ${
                      bgMode === 'white'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    White Background
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgMode('custom');
                      reprocess(tolerance, 'custom', customColor);
                    }}
                    class={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition ${
                      bgMode === 'custom'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Custom Color
                  </button>
                  {bgMode === 'custom' && (
                    <input
                      type="color"
                      value={customColor}
                      onInput={(e: any) => {
                        const val = e.target.value;
                        setCustomColor(val);
                        reprocess(tolerance, 'custom', val);
                      }}
                      class="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                    />
                  )}
                </div>
              </div>

              {outputStats && (
                <div class="text-right text-xs text-slate-500 font-mono">
                  <div>Dimensions: <strong class="text-slate-800">{outputStats.width} × {outputStats.height} px</strong></div>
                  <div>Output Size: <strong class="text-emerald-700">{outputStats.sizeKb} KB</strong></div>
                </div>
              )}
            </div>

            {/* Tolerance / Sensitivity Slider */}
            <div>
              <div class="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Color Detection Sensitivity (Tolerance)</span>
                <span class="font-mono text-emerald-700">{tolerance}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={tolerance}
                onInput={(e: any) => {
                  const val = Number(e.target.value);
                  setTolerance(val);
                  reprocess(val, bgMode, customColor);
                }}
                class="w-full accent-emerald-600 cursor-pointer"
              />
              <div class="flex justify-between text-2xs text-slate-400 mt-1">
                <span>Preserve finer edges (5%)</span>
                <span>Aggressive background removal (80%)</span>
              </div>
            </div>
          </div>

          {/* Interactive Canvas Output with Checkerboard Background */}
          <div class="flex flex-col items-center justify-center p-6 bg-slate-100/70 rounded-2xl border border-slate-200 relative overflow-hidden min-h-[300px]">
            {isProcessing && (
              <div class="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                <div class="text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  Processing in browser memory...
                </div>
              </div>
            )}

            {/* Checkerboard pattern for transparency visualization */}
            <div
              class="rounded-xl overflow-hidden shadow-sm border border-slate-300 max-w-full"
              style={{
                backgroundImage:
                  bgMode === 'transparent'
                    ? 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)'
                    : 'none',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                backgroundColor: bgMode === 'white' ? '#ffffff' : bgMode === 'custom' ? customColor : '#ffffff',
              }}
            >
              <canvas ref={previewCanvasRef} class="max-w-full max-h-[420px] block" />
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setImageSrc(null);
                setDownloadUrl(null);
                setOutputStats(null);
              }}
              class="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              Select Another Image
            </button>

            <a
              href={downloadUrl || ''}
              download={`${imageName}-no-bg.png`}
              class="w-full sm:w-auto px-8 py-3 text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition text-center flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Transparent PNG
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
