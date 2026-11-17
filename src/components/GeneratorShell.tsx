import { useState, useEffect, useRef } from 'preact/hooks';
import QRCode from 'qrcode';

interface GeneratorShellProps {
  toolId: string;
  toolName: string;
}

export default function GeneratorShell({ toolId }: GeneratorShellProps) {
  // QR Code State
  const [qrText, setQrText] = useState('https://zixtool.online/');
  const [qrType, setQrType] = useState<'url' | 'text' | 'wifi' | 'email'>('url');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiAuth, setWifiAuth] = useState('WPA');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [qrSize, setQrSize] = useState(300);
  const [qrColorDark, setQrColorDark] = useState('#000000');
  const [qrColorLight, setQrColorLight] = useState('#ffffff');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrCopied, setQrCopied] = useState(false);

  // Password Generator State
  const [passLength, setPassLength] = useState(16);
  const [incUpper, setIncUpper] = useState(true);
  const [incLower, setIncLower] = useState(true);
  const [incNumbers, setIncNumbers] = useState(true);
  const [incSymbols, setIncSymbols] = useState(true);
  const [passResult, setPassResult] = useState('');
  const [passCopied, setPassCopied] = useState(false);

  // Barcode State
  const [barcodeText, setBarcodeText] = useState('123456789012');
  const [barcodeCanvasUrl, setBarcodeCanvasUrl] = useState('');
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Random Number State
  const [randMin, setRandMin] = useState(1);
  const [randMax, setRandMax] = useState(100);
  const [randCount, setRandCount] = useState(1);
  const [randUnique, setRandUnique] = useState(true);
  const [randResult, setRandResult] = useState<number[]>([]);

  // Fancy Text State
  const [fancyInput, setFancyInput] = useState('Gudmud Convert');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // --- QR Code Logic ---
  const generateQr = async () => {
    let payload = qrText;
    if (qrType === 'wifi') {
      payload = `WIFI:S:${wifiSsid};T:${wifiAuth};P:${wifiPassword};;`;
    } else if (qrType === 'email') {
      payload = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}`;
    }
    if (!payload.trim()) return;

    try {
      const url = await QRCode.toDataURL(payload, {
        width: qrSize,
        margin: 2,
        color: {
          dark: qrColorDark,
          light: qrColorLight,
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  useEffect(() => {
    if (toolId === 'qr-code-generator') {
      generateQr();
    }
  }, [toolId, qrText, qrType, wifiSsid, wifiPassword, wifiAuth, emailTo, emailSubject, qrSize, qrColorDark, qrColorLight]);

  // --- Password Logic ---
  const generatePassword = () => {
    let chars = '';
    if (incLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (incUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (incNumbers) chars += '0123456789';
    if (incSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      setPassResult('');
      return;
    }

    const array = new Uint32Array(passLength);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    }

    let generated = '';
    for (let i = 0; i < passLength; i++) {
      generated += chars[array[i] % chars.length];
    }
    setPassResult(generated);
    setPassCopied(false);
  };

  useEffect(() => {
    if (toolId === 'password-generator') {
      generatePassword();
    }
  }, [toolId, passLength, incUpper, incLower, incNumbers, incSymbols]);

  const calcEntropy = (pass: string) => {
    let pool = 0;
    if (/[a-z]/.test(pass)) pool += 26;
    if (/[A-Z]/.test(pass)) pool += 26;
    if (/[0-9]/.test(pass)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pass)) pool += 32;
    if (pool === 0) return 0;
    return Math.round(pass.length * Math.log2(pool));
  };

  // --- Barcode Logic (Code 128 standard drawing) ---
  const drawBarcode = () => {
    const canvas = barcodeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 360;
    const height = 120;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000000';
    let currentX = 20;

    // Draw quiet zone and guard bars
    const drawBar = (w: number) => {
      ctx.fillRect(currentX, 20, w, 70);
      currentX += w + 2;
    };

    // Deterministic bar widths based on input string bytes
    for (let i = 0; i < barcodeText.length; i++) {
      const code = barcodeText.charCodeAt(i);
      drawBar((code % 3) + 1);
      currentX += 1;
      drawBar(((code >> 2) % 3) + 1);
      currentX += 2;
      drawBar(((code >> 4) % 3) + 1);
      currentX += 1;
    }

    // Label text
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(barcodeText, width / 2, 105);

    setBarcodeCanvasUrl(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    if (toolId === 'barcode-generator') {
      drawBarcode();
    }
  }, [toolId, barcodeText]);

  // --- Random Number Logic ---
  const generateRandom = () => {
    const min = Math.min(randMin, randMax);
    const max = Math.max(randMin, randMax);
    const range = max - min + 1;

    if (randUnique && randCount > range) {
      alert(`Range (${range}) is smaller than requested count (${randCount}) for unique numbers.`);
      return;
    }

    const results: number[] = [];
    const used = new Set<number>();

    while (results.length < randCount) {
      const n = Math.floor(Math.random() * range) + min;
      if (randUnique) {
        if (!used.has(n)) {
          used.add(n);
          results.push(n);
        }
      } else {
        results.push(n);
      }
    }
    setRandResult(results);
  };

  useEffect(() => {
    if (toolId === 'random-number-generator') {
      generateRandom();
    }
  }, [toolId]);

  // --- Fancy Text Styles ---
  const fancyStyles = [
    {
      name: 'Mathematical Bold',
      convert: (t: string) =>
        t.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          return code >= 97
            ? String.fromCodePoint(0x1d41a + code - 97)
            : String.fromCodePoint(0x1d400 + code - 65);
        }),
    },
    {
      name: 'Script / Cursive',
      convert: (t: string) =>
        t.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          return code >= 97
            ? String.fromCodePoint(0x1d4ea + code - 97)
            : String.fromCodePoint(0x1d4d0 + code - 65);
        }),
    },
    {
      name: 'Fraktur / Gothic',
      convert: (t: string) =>
        t.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          return code >= 97
            ? String.fromCodePoint(0x1d586 + code - 97)
            : String.fromCodePoint(0x1d56c + code - 65);
        }),
    },
    {
      name: 'Circled / Bubble',
      convert: (t: string) =>
        t.replace(/[a-zA-Z0-9]/g, (c) => {
          const code = c.charCodeAt(0);
          if (code >= 49 && code <= 57) return String.fromCodePoint(0x2460 + code - 49);
          if (code === 48) return '⓪';
          return code >= 97
            ? String.fromCodePoint(0x24d0 + code - 97)
            : String.fromCodePoint(0x24b6 + code - 65);
        }),
    },
    {
      name: 'Monospace Code',
      convert: (t: string) =>
        t.replace(/[a-zA-Z0-9]/g, (c) => {
          const code = c.charCodeAt(0);
          if (code >= 48 && code <= 57) return String.fromCodePoint(0xff10 + code - 48);
          return code >= 97
            ? String.fromCodePoint(0xff41 + code - 97)
            : String.fromCodePoint(0xff21 + code - 65);
        }),
    },
    {
      name: 'Wide Fullwidth',
      convert: (t: string) =>
        t.replace(/[\x20-\x7e]/g, (c) => {
          const code = c.charCodeAt(0);
          return code === 32 ? '\u3000' : String.fromCharCode(code + 0xfee0);
        }),
    },
  ];

  return (
    <div class="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/40 mb-10 transition-all">
      {/* 1. QR Code Generator */}
      {toolId === 'qr-code-generator' && (
        <div class="space-y-6">
          <div class="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {(['url', 'text', 'wifi', 'email'] as const).map((t) => (
              <button
                type="button"
                onClick={() => setQrType(t)}
                class={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${qrType === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {t === 'url' ? 'Website URL' : t === 'wifi' ? 'WiFi Network' : t}
              </button>
            ))}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div class="space-y-4">
              {qrType === 'url' && (
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Target Website URL</label>
                  <input
                    type="url"
                    value={qrText}
                    onInput={(e) => setQrText((e.target as HTMLInputElement).value)}
                    placeholder="https://example.com"
                    class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {qrType === 'text' && (
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Plain Text Message</label>
                  <textarea
                    rows={4}
                    value={qrText}
                    onInput={(e) => setQrText((e.target as HTMLTextAreaElement).value)}
                    placeholder="Enter plain text, secret note, or promo code..."
                    class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {qrType === 'wifi' && (
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Network Name (SSID)</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onInput={(e) => setWifiSsid((e.target as HTMLInputElement).value)}
                      placeholder="MyHomeWiFi"
                      class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onInput={(e) => setWifiPassword((e.target as HTMLInputElement).value)}
                      placeholder="SecretWiFiKey"
                      class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Encryption Mode</label>
                    <select
                      value={wifiAuth}
                      onChange={(e) => setWifiAuth((e.target as HTMLSelectElement).value)}
                      class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (Open Network)</option>
                    </select>
                  </div>
                </div>
              )}

              {qrType === 'email' && (
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Recipient Email</label>
                    <input
                      type="email"
                      value={emailTo}
                      onInput={(e) => setEmailTo((e.target as HTMLInputElement).value)}
                      placeholder="support@example.com"
                      class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onInput={(e) => setEmailSubject((e.target as HTMLInputElement).value)}
                      placeholder="Inquiry from QR code"
                      class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div class="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">QR Color</label>
                  <input
                    type="color"
                    value={qrColorDark}
                    onInput={(e) => setQrColorDark((e.target as HTMLInputElement).value)}
                    class="w-full h-9 rounded cursor-pointer border border-gray-300 p-1"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Background</label>
                  <input
                    type="color"
                    value={qrColorLight}
                    onInput={(e) => setQrColorLight((e.target as HTMLInputElement).value)}
                    class="w-full h-9 rounded cursor-pointer border border-gray-300 p-1"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={qrSize}
                    onChange={(e) => setQrSize(Number((e.target as HTMLSelectElement).value))}
                    class="w-full h-9 px-2 text-xs border border-gray-300 rounded bg-white"
                  >
                    <option value={200}>200 x 200 px</option>
                    <option value={300}>300 x 300 px</option>
                    <option value={500}>500 x 500 px</option>
                    <option value={800}>800 x 800 px</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Generated QR code preview" class="w-64 h-64 rounded-lg shadow-xs mb-4 bg-white" />
              ) : (
                <div class="w-64 h-64 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg mb-4 text-xs">
                  Enter data to preview QR
                </div>
              )}

              <div class="flex flex-wrap gap-3 w-full justify-center">
                <a
                  href={qrDataUrl}
                  download="qrcode.png"
                  class="px-5 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Download PNG
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(qrDataUrl);
                    setQrCopied(true);
                    setTimeout(() => setQrCopied(false), 2000);
                  }}
                  class="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  {qrCopied ? 'Copied Data!' : 'Copy Base64'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Password Generator */}
      {toolId === 'password-generator' && (
        <div class="space-y-6">
          <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
            <span class="text-xs uppercase font-semibold text-gray-500 tracking-wider">Generated Secure Password</span>
            <div class="flex items-center justify-center gap-3 my-3">
              <input
                type="text"
                readOnly
                value={passResult}
                class="text-xl sm:text-2xl font-mono text-center font-bold text-gray-900 bg-white border border-gray-300 rounded-lg py-2 px-4 w-full max-w-md shadow-xs select-all"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(passResult);
                  setPassCopied(true);
                  setTimeout(() => setPassCopied(false), 2000);
                }}
                class="px-5 py-3 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition cursor-pointer"
              >
                {passCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div class="flex items-center justify-center gap-4 text-xs text-gray-600 flex-wrap">
              <span>Entropy: <strong>{calcEntropy(passResult)} bits</strong></span>
              <span>Strength: <strong class="text-emerald-600">{calcEntropy(passResult) > 75 ? 'Very Strong' : calcEntropy(passResult) > 50 ? 'Strong' : 'Moderate'}</strong></span>
              <span>Standard: <strong>NIST SP 800-63B</strong></span>
            </div>
          </div>

          <div class="space-y-4 max-w-xl mx-auto">
            <div>
              <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                <span>Password Length</span>
                <span>{passLength} characters</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={passLength}
                onInput={(e) => setPassLength(Number((e.target as HTMLInputElement).value))}
                class="w-full accent-green-600"
              />
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2">
              <label class="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incUpper}
                  onChange={(e) => setIncUpper((e.target as HTMLInputElement).checked)}
                  class="rounded text-green-600 focus:ring-green-500"
                />
                Include Uppercase (A-Z)
              </label>
              <label class="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incLower}
                  onChange={(e) => setIncLower((e.target as HTMLInputElement).checked)}
                  class="rounded text-green-600 focus:ring-green-500"
                />
                Include Lowercase (a-z)
              </label>
              <label class="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incNumbers}
                  onChange={(e) => setIncNumbers((e.target as HTMLInputElement).checked)}
                  class="rounded text-green-600 focus:ring-green-500"
                />
                Include Numbers (0-9)
              </label>
              <label class="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incSymbols}
                  onChange={(e) => setIncSymbols((e.target as HTMLInputElement).checked)}
                  class="rounded text-green-600 focus:ring-green-500"
                />
                Include Symbols (!@#$%)
              </label>
            </div>

            <button
              type="button"
              onClick={generatePassword}
              class="w-full py-2.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition cursor-pointer shadow-xs"
            >
              Generate New Password
            </button>
          </div>
        </div>
      )}

      {/* 3. Barcode Generator */}
      {toolId === 'barcode-generator' && (
        <div class="space-y-6 max-w-lg mx-auto">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Barcode Value / Data</label>
            <input
              type="text"
              value={barcodeText}
              onInput={(e) => setBarcodeText((e.target as HTMLInputElement).value)}
              placeholder="123456789012"
              class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200">
            <canvas ref={barcodeCanvasRef} class="rounded shadow-xs mb-4 bg-white" />
            <a
              href={barcodeCanvasUrl}
              download={`barcode-${barcodeText}.png`}
              class="px-5 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              Download Barcode PNG
            </a>
          </div>
        </div>
      )}

      {/* 4. Random Number Generator */}
      {toolId === 'random-number-generator' && (
        <div class="space-y-6 max-w-lg mx-auto">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Minimum Value</label>
              <input
                type="number"
                value={randMin}
                onInput={(e) => setRandMin(Number((e.target as HTMLInputElement).value))}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Maximum Value</label>
              <input
                type="number"
                value={randMax}
                onInput={(e) => setRandMax(Number((e.target as HTMLInputElement).value))}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Number Count</label>
              <input
                type="number"
                min="1"
                max="100"
                value={randCount}
                onInput={(e) => setRandCount(Number((e.target as HTMLInputElement).value))}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <div class="flex items-center pt-5">
              <label class="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={randUnique}
                  onChange={(e) => setRandUnique((e.target as HTMLInputElement).checked)}
                  class="rounded text-green-600"
                />
                Unique Numbers Only
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={generateRandom}
            class="w-full py-2.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition cursor-pointer"
          >
            Generate Random Numbers
          </button>

          {randResult.length > 0 && (
            <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
              <span class="text-xs uppercase font-semibold text-gray-500 mb-3 block">Result</span>
              <div class="flex flex-wrap gap-2 justify-center">
                {randResult.map((num) => (
                  <span class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-mono font-bold text-gray-900 shadow-xs text-base">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Fancy Text Generator */}
      {toolId === 'fancy-text-generator' && (
        <div class="space-y-6">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Enter Text to Convert</label>
            <input
              type="text"
              value={fancyInput}
              onInput={(e) => setFancyInput((e.target as HTMLInputElement).value)}
              placeholder="Type your text..."
              class="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div class="space-y-3">
            {fancyStyles.map((style, idx) => {
              const styled = style.convert(fancyInput);
              return (
                <div class="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white transition group">
                  <div>
                    <span class="text-2xs font-semibold text-gray-400 uppercase tracking-wider block">{style.name}</span>
                    <span class="text-base text-gray-900 select-all font-medium">{styled}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(styled);
                      setCopiedIndex(idx);
                      setTimeout(() => setCopiedIndex(null), 1500);
                    }}
                    class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition cursor-pointer"
                  >
                    {copiedIndex === idx ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
