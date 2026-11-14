import { useState, useMemo } from 'preact/hooks';

interface DeveloperShellProps {
  toolId: string;
  toolName: string;
}

export default function DeveloperShell({ toolId }: DeveloperShellProps) {
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
  const [unitCategory, setUnitCategory] = useState<'length' | 'weight' | 'temperature' | 'digital'>('length');
  const [unitVal, setUnitVal] = useState(1);
  const [unitFrom, setUnitFrom] = useState('m');
  const [unitTo, setUnitTo] = useState('ft');

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

      {/* 2. Unit Converter */}
      {toolId === 'unit-converter' && (
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
