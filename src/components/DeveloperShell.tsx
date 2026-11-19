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
  const [b64Input, setB64Input] = useState('Hello World! Client-side Base64 encoder and decoder.');
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

  // --- URL Encoder / Decoder State ---
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');
  const [urlInput, setUrlInput] = useState('https://zixtool.online/search?query=file converter & tags=tools,online');
  const [urlOutput, setUrlOutput] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    try {
      if (urlMode === 'encode') {
        setUrlOutput(encodeURIComponent(urlInput));
      } else {
        setUrlOutput(decodeURIComponent(urlInput));
      }
    } catch {
      setUrlOutput('Error parsing URL string');
    }
  }, [urlInput, urlMode]);

  // --- UUID Generator State ---
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidUppercase, setUuidUppercase] = useState<boolean>(false);
  const [uuidHyphens, setUuidHyphens] = useState<boolean>(true);
  const [uuidList, setUuidList] = useState<string[]>([]);
  const [uuidCopied, setUuidCopied] = useState(false);

  const generateUuids = () => {
    const list: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      let id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
      if (!uuidHyphens) id = id.replace(/-/g, '');
      if (uuidUppercase) id = id.toUpperCase();
      list.push(id);
    }
    setUuidList(list);
  };

  useEffect(() => {
    if (toolId === 'uuid-generator') generateUuids();
  }, [toolId, uuidCount, uuidUppercase, uuidHyphens]);

  // --- Hash Generator State ---
  const [hashInput, setHashInput] = useState('The quick brown fox jumps over the lazy dog');
  const [hashes, setHashes] = useState<{ sha256: string; sha512: string; sha1: string; sha384: string; md5: string }>({
    sha256: '',
    sha512: '',
    sha1: '',
    sha384: '',
    md5: '',
  });

  const simpleMd5 = (str: string): string => {
    function md5cycle(x: any, k: any) {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);

      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);

      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);

      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);

      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }
    function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function add32(a: number, b: number) {
      return (a + b) & 0xffffffff;
    }
    function md51(s: string) {
      const n = s.length;
      const state = [1732584193, -271733879, -1732584194, 271733878];
      let i = 0;
      const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 64; i <= n; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      let j = 0;
      for (j = 0; j < s.length; j++) tail[j >> 2] |= s.charCodeAt(j) << ((j % 4) << 3);
      tail[j >> 2] |= 0x80 << ((j % 4) << 3);
      if (j > 55) {
        md5cycle(state, tail);
        for (let k = 0; k < 16; k++) tail[k] = 0;
      }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state;
    }
    function md5blk(s: string) {
      const md5blks: number[] = [];
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }
    function rhex(n: number) {
      let s = '', j = 0;
      for (; j <= 3; j++) s += ((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16);
      return s;
    }
    const x = md51(str);
    return rhex(x[0]) + rhex(x[1]) + rhex(x[2]) + rhex(x[3]);
  };

  useEffect(() => {
    if (toolId !== 'hash-generator') return;
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);

    const calcHash = async (algo: string): Promise<string> => {
      try {
        const buf = await crypto.subtle.digest(algo, data);
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } catch {
        return '';
      }
    };

    Promise.all([
      calcHash('SHA-256'),
      calcHash('SHA-512'),
      calcHash('SHA-1'),
      calcHash('SHA-384'),
    ]).then(([sha256, sha512, sha1, sha384]) => {
      setHashes({
        sha256,
        sha512,
        sha1,
        sha384,
        md5: simpleMd5(hashInput),
      });
    });
  }, [hashInput, toolId]);

  // --- JSON to CSV State ---
  const [jsonCsvInput, setJsonCsvInput] = useState(
    JSON.stringify([
      { id: 1, name: 'Alice Smith', email: 'alice@example.com', role: 'Engineer', active: true },
      { id: 2, name: 'Bob Jones', email: 'bob@example.com', role: 'Product Manager', active: false },
      { id: 3, name: 'Charlie Ray', email: 'charlie@example.com', role: 'Designer', active: true }
    ], null, 2)
  );
  const [jsonCsvDelimiter, setJsonCsvDelimiter] = useState<',' | ';' | '\t'>(',');
  const [jsonCsvOutput, setJsonCsvOutput] = useState('');
  const [jsonCsvError, setJsonCsvError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setJsonCsvError(null);
      const parsed = JSON.parse(jsonCsvInput.trim());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) {
        setJsonCsvOutput('');
        return;
      }
      const keys = Array.from(new Set(arr.flatMap((obj) => Object.keys(obj))));
      const escapeVal = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
        if (s.includes(jsonCsvDelimiter) || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const header = keys.map(escapeVal).join(jsonCsvDelimiter);
      const rows = arr.map((item) => keys.map((k) => escapeVal(item[k])).join(jsonCsvDelimiter));
      setJsonCsvOutput([header, ...rows].join('\n'));
    } catch (err: any) {
      setJsonCsvError(err.message || 'Invalid JSON data');
    }
  }, [jsonCsvInput, jsonCsvDelimiter]);

  // --- CSV to JSON State ---
  const [csvJsonInput, setCsvJsonInput] = useState(
    'id,name,role,salary\n1,Alice,Developer,95000\n2,Bob,Designer,82000\n3,Carol,Manager,110000'
  );
  const [csvJsonOutput, setCsvJsonOutput] = useState('');
  const [csvAutoType, setCsvAutoType] = useState(true);

  useEffect(() => {
    try {
      const lines = csvJsonInput.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        setCsvJsonOutput('[]');
        return;
      }
      const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
      const result = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map((p) => p.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          let val: any = parts[idx] !== undefined ? parts[idx] : '';
          if (csvAutoType) {
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (val !== '' && !isNaN(Number(val))) val = Number(val);
          }
          obj[h] = val;
        });
        result.push(obj);
      }
      setCsvJsonOutput(JSON.stringify(result, null, 2));
    } catch {
      setCsvJsonOutput('Error parsing CSV');
    }
  }, [csvJsonInput, csvAutoType]);

  return (
    <div class="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-card mb-8 transition-all">
      {/* 1. JWT Decoder */}
      {toolId === 'jwt-decoder' && (
        <div class="space-y-6">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Encoded JWT String</label>
            <textarea
              rows={3}
              value={jwtInput}
              onInput={(e) => setJwtInput((e.target as HTMLTextAreaElement).value)}
              placeholder="Paste eyJhbGciOi..."
              class="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {decodedJwt?.valid ? (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Header (Algorithm & Token Type)</span>
                <pre class="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-mono text-purple-800 overflow-x-auto">
                  {JSON.stringify(decodedJwt.header, null, 2)}
                </pre>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Payload (Claims)</span>
                  {decodedJwt.expDate && (
                    <span class={`text-2xs font-bold px-2 py-0.5 rounded ${decodedJwt.isExpired ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {decodedJwt.isExpired ? 'Expired' : 'Active'}
                    </span>
                  )}
                </div>
                <pre class="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-mono text-blue-900 overflow-x-auto">
                  {JSON.stringify(decodedJwt.payload, null, 2)}
                </pre>
                {decodedJwt.expDate && (
                  <p class="text-xs text-slate-500 mt-2">Expiration: <strong>{decodedJwt.expDate}</strong></p>
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
          <div class="flex flex-wrap gap-2 justify-center border-b border-slate-200 pb-3">
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
                class={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize ${unitCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Value</label>
              <input
                type="number"
                value={unitVal}
                onInput={(e) => setUnitVal(Number((e.target as HTMLInputElement).value))}
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">From</label>
              <select
                value={unitFrom}
                onChange={(e) => setUnitFrom((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
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
              <label class="block text-xs font-medium text-slate-700 mb-1">To</label>
              <select
                value={unitTo}
                onChange={(e) => setUnitTo((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
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

          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <span class="text-xs uppercase font-semibold text-slate-500">Converted Value</span>
            <p class="text-3xl sm:text-4xl font-extrabold text-emerald-700 my-2 font-mono">
              {convertedUnit} {unitTo}
            </p>
            <p class="text-xs text-slate-500">
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
            class="h-36 sm:h-44 rounded-2xl flex flex-col items-center justify-center p-6 shadow-sm border border-slate-200 transition-colors"
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
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Color Palette & Eyedropper
              </label>
              <div class="flex items-center gap-3">
                <input
                  type="color"
                  value={colorValues.hex}
                  onInput={(e) => setHexColor((e.target as HTMLInputElement).value)}
                  class="w-14 h-12 rounded-lg cursor-pointer border border-slate-300 bg-white p-1"
                />
                <input
                  type="text"
                  value={hexColor}
                  onInput={(e) => setHexColor((e.target as HTMLInputElement).value)}
                  placeholder="#16a34a"
                  class="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Quick Palettes */}
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
              <div key={label} class="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span class="text-2xs font-bold text-slate-500 uppercase">{label}</span>
                  <p class="font-mono text-xs font-bold text-slate-800 truncate">{val}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(val);
                    setCopiedColor(val);
                    setTimeout(() => setCopiedColor(null), 1800);
                  }}
                  class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 rounded-lg transition"
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
          <div class="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-xl w-fit mx-auto border border-slate-200">
            <button
              type="button"
              onClick={() => setB64Mode('encode')}
              class={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                b64Mode === 'encode' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Text &rarr; Base64 (Encode)
            </button>
            <button
              type="button"
              onClick={() => setB64Mode('decode')}
              class={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                b64Mode === 'decode' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Base64 &rarr; Text (Decode)
            </button>
          </div>

          {/* Input Box */}
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {b64Mode === 'encode' ? 'Source Text to Encode:' : 'Base64 String to Decode:'}
            </label>
            <textarea
              rows={4}
              value={b64Input}
              onInput={(e) => setB64Input((e.target as HTMLTextAreaElement).value)}
              placeholder={b64Mode === 'encode' ? 'Type or paste plain text here...' : 'Paste Base64 encoded string here...'}
              class="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Output Box */}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {b64Mode === 'encode' ? 'Base64 Encoded Output:' : 'Decoded Plain Text:'}
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(b64Output);
                  setB64Copied(true);
                  setTimeout(() => setB64Copied(false), 1800);
                }}
                class="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition"
              >
                {b64Copied ? '✓ Copied to Clipboard' : 'Copy Output'}
              </button>
            </div>
            <textarea
              rows={4}
              readOnly
              value={b64Output}
              class="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
            />
          </div>
        </div>
      )}

      {/* 3. My IP & Network Info */}
      {toolId === 'my-ip-address' && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <span class="text-xs uppercase font-semibold text-slate-500">Your Browser Client Diagnostic</span>
            <h2 class="text-2xl font-extrabold text-slate-900 my-2">Client Device & Network Profile</h2>
            <p class="text-xs text-slate-500">Detected safely via browser navigator parameters.</p>
          </div>

          <div class="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div class="flex justify-between p-3 bg-white">
              <span class="font-medium text-slate-600">Screen Resolution</span>
              <span class="font-bold text-slate-900">{clientInfo.screenRes}</span>
            </div>
            <div class="flex justify-between p-3 bg-slate-50">
              <span class="font-medium text-slate-600">Color Depth</span>
              <span class="font-bold text-slate-900">{clientInfo.colorDepth}</span>
            </div>
            <div class="flex justify-between p-3 bg-white">
              <span class="font-medium text-slate-600">Browser Language</span>
              <span class="font-bold text-slate-900">{clientInfo.language}</span>
            </div>
            <div class="flex justify-between p-3 bg-slate-50">
              <span class="font-medium text-slate-600">System Timezone</span>
              <span class="font-bold text-slate-900">{clientInfo.timeZone}</span>
            </div>
            <div class="flex justify-between p-3 bg-white">
              <span class="font-medium text-slate-600">Cookies Enabled</span>
              <span class="font-bold text-emerald-600">{clientInfo.cookiesEnabled}</span>
            </div>
            <div class="p-3 bg-slate-50">
              <span class="font-medium text-slate-600 block mb-1">User Agent</span>
              <span class="font-mono text-3xs text-slate-800 break-all">{clientInfo.userAgent}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. URL Encoder / Decoder */}
      {toolId === 'url-encoder-decoder' && (
        <div class="space-y-6">
          <div class="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setUrlMode('encode')}
              class={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                urlMode === 'encode'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Encode URL
            </button>
            <button
              type="button"
              onClick={() => setUrlMode('decode')}
              class={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                urlMode === 'decode'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Decode URL
            </button>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              {urlMode === 'encode' ? 'Raw URL or String to Encode' : 'Percent-Encoded URL to Decode'}
            </label>
            <textarea
              rows={4}
              value={urlInput}
              onInput={(e) => setUrlInput((e.target as HTMLTextAreaElement).value)}
              class="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-semibold text-slate-700">Result Output</label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(urlOutput);
                  setUrlCopied(true);
                  setTimeout(() => setUrlCopied(false), 2000);
                }}
                class="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                {urlCopied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <textarea
              rows={4}
              readOnly
              value={urlOutput}
              class="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
            />
          </div>
        </div>
      )}

      {/* 5. UUID Generator */}
      {toolId === 'uuid-generator' && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Quantity ({uuidCount})</label>
              <input
                type="range"
                min="1"
                max="50"
                value={uuidCount}
                onInput={(e) => setUuidCount(Number((e.target as HTMLInputElement).value))}
                class="w-full accent-emerald-600"
              />
            </div>
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="uuidHyphens"
                checked={uuidHyphens}
                onChange={(e) => setUuidHyphens((e.target as HTMLInputElement).checked)}
                class="rounded text-emerald-600"
              />
              <label for="uuidHyphens" class="text-xs font-semibold text-slate-700 cursor-pointer">
                Include Hyphens
              </label>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="uuidUpper"
                checked={uuidUppercase}
                onChange={(e) => setUuidUppercase((e.target as HTMLInputElement).checked)}
                class="rounded text-emerald-600"
              />
              <label for="uuidUpper" class="text-xs font-semibold text-slate-700 cursor-pointer">
                Uppercase Output
              </label>
            </div>
          </div>

          <div class="flex justify-between items-center">
            <button
              type="button"
              onClick={generateUuids}
              class="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              Generate New Batch
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(uuidList.join('\n'));
                setUuidCopied(true);
                setTimeout(() => setUuidCopied(false), 2000);
              }}
              class="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              {uuidCopied ? '✓ Copied All!' : 'Copy All to Clipboard'}
            </button>
          </div>

          <div class="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {uuidList.map((id, idx) => (
              <div key={idx} class="flex items-center justify-between p-3 bg-white hover:bg-slate-50 text-xs font-mono">
                <span class="text-slate-900 select-all">{id}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(id)}
                  class="text-slate-400 hover:text-emerald-600 text-3xs uppercase font-bold"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Hash Generator */}
      {toolId === 'hash-generator' && (
        <div class="space-y-6">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Input Text String</label>
            <textarea
              rows={3}
              value={hashInput}
              onInput={(e) => setHashInput((e.target as HTMLTextAreaElement).value)}
              placeholder="Enter text to hash..."
              class="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div class="space-y-3">
            {[
              { name: 'SHA-256', val: hashes.sha256, bits: 256 },
              { name: 'SHA-512', val: hashes.sha512, bits: 512 },
              { name: 'MD5', val: hashes.md5, bits: 128 },
              { name: 'SHA-1', val: hashes.sha1, bits: 160 },
              { name: 'SHA-384', val: hashes.sha384, bits: 384 },
            ].map((item) => (
              <div key={item.name} class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div class="flex items-center justify-between mb-1 text-2xs font-bold text-slate-500 uppercase">
                  <span>{item.name} ({item.bits} bits)</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(item.val)}
                    class="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Copy Hash
                  </button>
                </div>
                <div class="font-mono text-xs text-slate-900 break-all select-all bg-white p-2 rounded-lg border border-slate-200">
                  {item.val || 'Computing...'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. JSON to CSV */}
      {toolId === 'json-to-csv' && (
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-slate-700">Delimiter:</label>
              {[
                { label: 'Comma (,)', val: ',' as const },
                { label: 'Semicolon (;)', val: ';' as const },
                { label: 'Tab (\\t)', val: '\t' as const },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setJsonCsvDelimiter(d.val)}
                  class={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    jsonCsvDelimiter === d.val
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {jsonCsvError && (
              <span class="text-2xs font-bold text-red-600">{jsonCsvError}</span>
            )}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">JSON Input (Array of Objects)</label>
              <textarea
                rows={10}
                value={jsonCsvInput}
                onInput={(e) => setJsonCsvInput((e.target as HTMLTextAreaElement).value)}
                class="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-semibold text-slate-700">CSV Output</label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(jsonCsvOutput)}
                    class="text-2xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([jsonCsvOutput], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'export.csv';
                      a.click();
                    }}
                    class="text-2xs font-bold text-slate-900 hover:underline cursor-pointer"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
              <textarea
                rows={10}
                readOnly
                value={jsonCsvOutput}
                class="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* 8. CSV to JSON */}
      {toolId === 'csv-to-json' && (
        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              id="csvAutoType"
              checked={csvAutoType}
              onChange={(e) => setCsvAutoType((e.target as HTMLInputElement).checked)}
              class="rounded text-emerald-600"
            />
            <label for="csvAutoType" class="text-xs font-semibold text-slate-700 cursor-pointer">
              Auto-parse Numbers & Booleans
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">CSV Input Data</label>
              <textarea
                rows={10}
                value={csvJsonInput}
                onInput={(e) => setCsvJsonInput((e.target as HTMLTextAreaElement).value)}
                class="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-semibold text-slate-700">JSON Output</label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(csvJsonOutput)}
                    class="text-2xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([csvJsonOutput], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'data.json';
                      a.click();
                    }}
                    class="text-2xs font-bold text-slate-900 hover:underline cursor-pointer"
                  >
                    Download JSON
                  </button>
                </div>
              </div>
              <textarea
                rows={10}
                readOnly
                value={csvJsonOutput}
                class="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
