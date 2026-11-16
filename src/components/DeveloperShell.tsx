import { useState, useMemo, useEffect } from 'preact/hooks';

interface DeveloperShellProps {
  toolId: string;
  toolName: string;
}

export default function DeveloperShell({ toolId }: DeveloperShellProps) {
  // --- Color Picker State ---
  const [hexColor, setHexColor] = useState('#16a34a');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colorValues = useMemo(() => {
    let hex = hexColor.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h = Math.round(h * 60);
    }
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    const rgbStr = `rgb(${r}, ${g}, ${b})`;
    const hslStr = `hsl(${h}, ${sPct}%, ${lPct}%)`;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.5 ? '#111827' : '#ffffff';

    return { hex, r, g, b, h, sPct, lPct, rgbStr, hslStr, textColor };
  }, [hexColor]);

  // --- Base64 Encoder / Decoder State ---
  const [b64Mode, setB64Mode] = useState<'encode' | 'decode'>('encode');
  const [b64Input, setB64Input] = useState('Hello World! Best Converter processes data 100% in browser.');
  const [b64Output, setB64Output] = useState('');
  const [b64Copied, setB64Copied] = useState(false);

  useEffect(() => {
    try {
      if (b64Mode === 'encode') {
        const bytes = new TextEncoder().encode(b64Input);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        setB64Output(btoa(binary));
      } else {
        const binary = atob(b64Input.trim());
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        setB64Output(new TextDecoder().decode(bytes));
      }
    } catch {
      setB64Output(b64Mode === 'encode' ? 'Error encoding' : 'Invalid Base64 input string');
    }
  }, [b64Input, b64Mode]);
  // --- JWT Decoder State ---
  const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIERvZSIsImFkbWluIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTkyOTM5ODQwMH0.4PclnEI8y7i_v7nZ2f5b8vX5d8m8c7k2w9a0z';
  const [jwtInput, setJwtInput] = useState(sampleJwt);

  const decodedJwt = useMemo(() => {
    try {
      const parts = jwtInput.trim().split('.');
      if (parts.length < 2) return null;

      const base64UrlDecode = (str: string) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        return decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      };

      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));

      let expDate = null;
      let isExpired = false;
      if (payload.exp) {
        expDate = new Date(payload.exp * 1000).toUTCString();
        isExpired = Date.now() > payload.exp * 1000;
      }

      return { header, payload, expDate, isExpired, valid: true };
    } catch {
      return { valid: false };
    }
  }, [jwtInput]);

  // --- Unit Converter State ---
  const isTempTool = toolId === 'celsius-to-fahrenheit';
  const [unitCategory, setUnitCategory] = useState<'length' | 'weight' | 'temperature' | 'digital'>(isTempTool ? 'temperature' : 'length');
  const [unitVal, setUnitVal] = useState(isTempTool ? 25 : 1);
  const [unitFrom, setUnitFrom] = useState(isTempTool ? 'C' : 'm');
  const [unitTo, setUnitTo] = useState(isTempTool ? 'F' : 'ft');

  const unitConversions: Record<string, Record<string, number>> = {
    length: {
      m: 1,
      km: 1000,
      cm: 0.01,
      mm: 0.001,
      in: 0.0254,
      ft: 0.3048,
      yd: 0.9144,
      mi: 1609.344,
    },
    weight: {
      kg: 1,
      g: 0.001,
      mg: 0.000001,
      lb: 0.453592,
      oz: 0.0283495,
      ton: 1000,
    },
    digital: {
      B: 1,
      KB: 1024,
      MB: 1048576,
      GB: 1073741824,
      TB: 1099511627776,
    },
  };

  const convertedUnit = useMemo(() => {
    if (unitCategory === 'temperature') {
      let c = unitVal;
      if (unitFrom === 'F') c = (unitVal - 32) * (5 / 9);
      if (unitFrom === 'K') c = unitVal - 273.15;

      let res = c;
      if (unitTo === 'F') res = c * (9 / 5) + 32;
      if (unitTo === 'K') res = c + 273.15;
      return Number(res.toFixed(4));
    }

    const table = unitConversions[unitCategory];
    if (!table) return 0;
    const fromBase = table[unitFrom] || 1;
    const toBase = table[unitTo] || 1;
    const baseValue = unitVal * fromBase;
    const result = baseValue / toBase;
    return Number(result.toFixed(6));
  }, [unitCategory, unitVal, unitFrom, unitTo]);

  // --- My IP State ---
  const [clientInfo] = useState(() => {
    if (typeof window === 'undefined') return {};
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenRes: `${window.screen.width} x ${window.screen.height}`,
      colorDepth: `${window.screen.colorDepth}-bit`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled ? 'Yes' : 'No',
    };
  });

  return (
    <div class="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-10">
      {/* 1. JWT Decoder */}
      {toolId === 'jwt-decoder' && (
        <div class="space-y-6">
          <div class="p-3 bg-green-50 border border-green-200 rounded-xl text-green-900 text-xs">
            <strong>Client-Side Guarantee:</strong> Your JSON Web Tokens are decoded entirely in your browser using JavaScript. No tokens or payload secrets are ever logged or transmitted across the network.
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Encoded JWT String</label>
            <textarea
              rows={3}
              value={jwtInput}
              onInput={(e) => setJwtInput((e.target as HTMLTextAreaElement).value)}
              placeholder="Paste eyJhbGciOi..."
              class="w-full font-mono text-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {decodedJwt?.valid ? (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Header (Algorithm & Token Type)</span>
                <pre class="bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs font-mono text-purple-800 overflow-x-auto">
                  {JSON.stringify(decodedJwt.header, null, 2)}
                </pre>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Payload (Claims)</span>
                  {decodedJwt.expDate && (
                    <span class={`text-2xs font-bold px-2 py-0.5 rounded ${decodedJwt.isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {decodedJwt.isExpired ? 'Expired' : 'Active'}
                    </span>
                  )}
                </div>
                <pre class="bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs font-mono text-blue-900 overflow-x-auto">
                  {JSON.stringify(decodedJwt.payload, null, 2)}
                </pre>
                {decodedJwt.expDate && (
                  <p class="text-xs text-gray-500 mt-2">Expiration: <strong>{decodedJwt.expDate}</strong></p>
                )}
              </div>
            </div>
          ) : (
            <div class="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
              Invalid JWT format. Ensure the token has three base64url segments separated by dots.
            </div>
          )}
        </div>
      )}

      {/* 2. Unit & Temperature Converter */}
      {(toolId === 'unit-converter' || toolId === 'celsius-to-fahrenheit') && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div class="flex flex-wrap gap-2 justify-center border-b border-gray-200 pb-3">
            {(['length', 'weight', 'temperature', 'digital'] as const).map((cat) => (
              <button
                type="button"
                onClick={() => {
                  setUnitCategory(cat);
                  if (cat === 'length') { setUnitFrom('m'); setUnitTo('ft'); }
                  if (cat === 'weight') { setUnitFrom('kg'); setUnitTo('lb'); }
                  if (cat === 'temperature') { setUnitFrom('C'); setUnitTo('F'); }
                  if (cat === 'digital') { setUnitFrom('MB'); setUnitTo('GB'); }
                }}
                class={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize ${unitCategory === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Value</label>
              <input
                type="number"
                value={unitVal}
                onInput={(e) => setUnitVal(Number((e.target as HTMLInputElement).value))}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">From</label>
              <select
                value={unitFrom}
                onChange={(e) => setUnitFrom((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                {unitCategory === 'temperature' ? (
                  <>
                    <option value="C">Celsius (°C)</option>
                    <option value="F">Fahrenheit (°F)</option>
                    <option value="K">Kelvin (K)</option>
                  </>
                ) : (
                  Object.keys(unitConversions[unitCategory] || {}).map((u) => (
                    <option value={u}>{u}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">To</label>
              <select
                value={unitTo}
                onChange={(e) => setUnitTo((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                {unitCategory === 'temperature' ? (
                  <>
                    <option value="C">Celsius (°C)</option>
                    <option value="F">Fahrenheit (°F)</option>
                    <option value="K">Kelvin (K)</option>
                  </>
                ) : (
                  Object.keys(unitConversions[unitCategory] || {}).map((u) => (
                    <option value={u}>{u}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
            <span class="text-xs uppercase font-semibold text-gray-500">Converted Value</span>
            <p class="text-3xl sm:text-4xl font-extrabold text-green-700 my-2 font-mono">
              {convertedUnit} {unitTo}
            </p>
            <p class="text-xs text-gray-500">
              {unitVal} {unitFrom} = {convertedUnit} {unitTo}
            </p>
          </div>
        </div>
      )}

      {/* Color Picker Tool */}
      {toolId === 'color-picker' && (
        <div class="space-y-6 max-w-2xl mx-auto">
          {/* Main Color Preview Box */}
          <div
            class="h-36 sm:h-44 rounded-2xl flex flex-col items-center justify-center p-6 shadow-sm border border-gray-200 transition-colors"
            style={{ backgroundColor: colorValues.hex }}
          >
            <span
              class="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider"
              style={{ color: colorValues.textColor }}
            >
              {colorValues.hex.toUpperCase()}
            </span>
            <span class="text-xs font-mono mt-1 opacity-90" style={{ color: colorValues.textColor }}>
              {colorValues.rgbStr} • {colorValues.hslStr}
            </span>
          </div>

          {/* Color Input Controls */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Color Palette & Eyedropper
              </label>
              <div class="flex items-center gap-3">
                <input
                  type="color"
                  value={colorValues.hex}
                  onInput={(e) => setHexColor((e.target as HTMLInputElement).value)}
                  class="w-14 h-12 rounded-lg cursor-pointer border border-gray-300 bg-white p-1"
                />
                <input
                  type="text"
                  value={hexColor}
                  onInput={(e) => setHexColor((e.target as HTMLInputElement).value)}
                  placeholder="#16a34a"
                  class="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Quick Palettes */}
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Popular Color Swatches
              </label>
              <div class="flex flex-wrap gap-2">
                {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#111827'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHexColor(c)}
                    class="w-7 h-7 rounded-md border border-black/10 shadow-2xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Color Values & Copy Cards */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'HEX', val: colorValues.hex.toUpperCase() },
              { label: 'RGB', val: colorValues.rgbStr },
              { label: 'HSL', val: colorValues.hslStr },
            ].map(({ label, val }) => (
              <div key={label} class="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <span class="text-2xs font-bold text-gray-500 uppercase">{label}</span>
                  <p class="font-mono text-xs font-bold text-gray-800 truncate">{val}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(val);
                    setCopiedColor(val);
                    setTimeout(() => setCopiedColor(null), 1800);
                  }}
                  class="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-700 rounded-lg transition"
                >
                  {copiedColor === val ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Base64 Encoder / Decoder Tool */}
      {toolId === 'base64-encoder' && (
        <div class="space-y-6 max-w-2xl mx-auto">
          {/* Mode Switcher */}
          <div class="flex items-center justify-center gap-2 p-1 bg-gray-100 rounded-xl w-fit mx-auto border border-gray-200">
            <button
              type="button"
              onClick={() => setB64Mode('encode')}
              class={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                b64Mode === 'encode' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Text &rarr; Base64 (Encode)
            </button>
            <button
              type="button"
              onClick={() => setB64Mode('decode')}
              class={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                b64Mode === 'decode' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Base64 &rarr; Text (Decode)
            </button>
          </div>

          {/* Input Box */}
          <div class="space-y-2">
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              {b64Mode === 'encode' ? 'Source Text to Encode:' : 'Base64 String to Decode:'}
            </label>
            <textarea
              rows={4}
              value={b64Input}
              onInput={(e) => setB64Input((e.target as HTMLTextAreaElement).value)}
              placeholder={b64Mode === 'encode' ? 'Type or paste plain text here...' : 'Paste Base64 encoded string here...'}
              class="w-full p-3 text-xs font-mono border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Output Box */}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                {b64Mode === 'encode' ? 'Base64 Encoded Output:' : 'Decoded Plain Text:'}
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(b64Output);
                  setB64Copied(true);
                  setTimeout(() => setB64Copied(false), 1800);
                }}
                class="px-3 py-1 text-xs font-semibold rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition"
              >
                {b64Copied ? '✓ Copied to Clipboard' : 'Copy Output'}
              </button>
            </div>
            <textarea
              rows={4}
              readOnly
              value={b64Output}
              class="w-full p-3 text-xs font-mono border border-gray-200 rounded-xl bg-gray-50 text-gray-800"
            />
          </div>
        </div>
      )}

      {/* 3. My IP & Network Info */}
      {toolId === 'my-ip-address' && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
            <span class="text-xs uppercase font-semibold text-gray-500">Your Browser Client Diagnostic</span>
            <h2 class="text-2xl font-extrabold text-gray-900 my-2">Client Device & Network Profile</h2>
            <p class="text-xs text-gray-500">Detected safely via browser navigator parameters.</p>
          </div>

          <div class="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden text-xs">
            <div class="flex justify-between p-3 bg-white">
              <span class="font-medium text-gray-600">Screen Resolution</span>
              <span class="font-bold text-gray-900">{clientInfo.screenRes}</span>
            </div>
            <div class="flex justify-between p-3 bg-gray-50">
              <span class="font-medium text-gray-600">Color Depth</span>
              <span class="font-bold text-gray-900">{clientInfo.colorDepth}</span>
            </div>
            <div class="flex justify-between p-3 bg-white">
              <span class="font-medium text-gray-600">Browser Language</span>
              <span class="font-bold text-gray-900">{clientInfo.language}</span>
            </div>
            <div class="flex justify-between p-3 bg-gray-50">
              <span class="font-medium text-gray-600">System Timezone</span>
              <span class="font-bold text-gray-900">{clientInfo.timeZone}</span>
            </div>
            <div class="flex justify-between p-3 bg-white">
              <span class="font-medium text-gray-600">Cookies Enabled</span>
              <span class="font-bold text-green-600">{clientInfo.cookiesEnabled}</span>
            </div>
            <div class="p-3 bg-gray-50">
              <span class="font-medium text-gray-600 block mb-1">User Agent</span>
              <span class="font-mono text-3xs text-gray-800 break-all">{clientInfo.userAgent}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
