import { useState, useMemo, useEffect } from 'preact/hooks';

interface TextShellProps {
  toolId: string;
  toolName: string;
}

export default function TextShell({ toolId, toolName: _toolName }: TextShellProps) {
  // Lorem Ipsum Generator State
  const [loremType, setLoremType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [loremCount, setLoremCount] = useState<number>(3);
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [loremOutput, setLoremOutput] = useState<string>('');

  const latinWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip',
    'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
    'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
  ];

  const generateLorem = () => {
    const getRandomWord = () => latinWords[Math.floor(Math.random() * latinWords.length)];
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    if (loremType === 'words') {
      const words: string[] = [];
      if (startWithLorem && loremCount >= 2) {
        words.push('Lorem', 'ipsum');
        while (words.length < loremCount) words.push(getRandomWord());
      } else {
        for (let i = 0; i < loremCount; i++) {
          words.push(i === 0 ? capitalize(getRandomWord()) : getRandomWord());
        }
      }
      setLoremOutput(words.join(' '));
      return;
    }

    const generateSentence = (forceLorem = false) => {
      const len = 8 + Math.floor(Math.random() * 8);
      const w: string[] = [];
      if (forceLorem) {
        w.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet,', 'consectetur', 'adipiscing', 'elit');
      } else {
        for (let i = 0; i < len; i++) {
          w.push(i === 0 ? capitalize(getRandomWord()) : getRandomWord());
        }
      }
      return w.join(' ') + '.';
    };

    if (loremType === 'sentences') {
      const sentences: string[] = [];
      for (let i = 0; i < loremCount; i++) {
        sentences.push(generateSentence(i === 0 && startWithLorem));
      }
      setLoremOutput(sentences.join(' '));
      return;
    }

    // Paragraphs
    const paras: string[] = [];
    for (let p = 0; p < loremCount; p++) {
      const sentenceCount = 4 + Math.floor(Math.random() * 3);
      const s: string[] = [];
      for (let i = 0; i < sentenceCount; i++) {
        s.push(generateSentence(p === 0 && i === 0 && startWithLorem));
      }
      paras.push(s.join(' '));
    }
    setLoremOutput(paras.join('\n\n'));
  };

  useEffect(() => {
    if (toolId === 'lorem-ipsum-generator') {
      generateLorem();
    }
  }, [toolId, loremType, loremCount, startWithLorem]);
  const [text, setText] = useState<string>(
    toolId === 'json-formatter'
      ? '{"name":"Gudmud Convert","type":"client-side","features":["privacy","speed","zero-upload"],"active":true}'
      : 'Gudmud Convert processes all your documents, images, and calculations entirely inside your browser. No files are uploaded to any external server.'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonIndent, setJsonIndent] = useState<number>(2);

  // --- Diff Checker State ---
  const [diffOriginal, setDiffOriginal] = useState<string>(
    'Gudmud Convert is a free online tool suite.\nAll processing is 100% client side.\nFast and private file operations.'
  );
  const [diffModified, setDiffModified] = useState<string>(
    'Gudmud Convert is a free online tool suite.\nAll processing runs locally in browser RAM.\nFast and private file operations.\nDirect in-browser processing.'
  );

  const diffResult = useMemo(() => {
    const origLines = diffOriginal.split('\n');
    const modLines = diffModified.split('\n');

    const m = origLines.length;
    const n = modLines.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (origLines[i] === modLines[j]) {
          dp[i + 1][j + 1] = dp[i][j] + 1;
        } else {
          dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    let i = m;
    let j = n;
    const diff: { type: 'equal' | 'removed' | 'added'; text: string; origLine?: number; modLine?: number }[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
        diff.unshift({ type: 'equal', text: origLines[i - 1], origLine: i, modLine: j });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', text: modLines[j - 1], modLine: j });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        diff.unshift({ type: 'removed', text: origLines[i - 1], origLine: i });
        i--;
      }
    }

    const addedCount = diff.filter((d) => d.type === 'added').length;
    const removedCount = diff.filter((d) => d.type === 'removed').length;

    return { diff, addedCount, removedCount };
  }, [diffOriginal, diffModified]);

  // --- Markdown to HTML State ---
  const [mdInput, setMdInput] = useState<string>(
    '## Markdown Preview\n\n**BestConverter** processes all your data **locally in your browser**.\n\n### Core Features\n\n- Zero server uploads\n- Instant client-side conversions\n- Fast in-memory processing\n\nVisit [BestConverter](https://zixtool.online) for fast utilities!'
  );
  const [mdCopied, setMdCopied] = useState<boolean>(false);

  const htmlOutput = useMemo(() => {
    let raw = mdInput;
    raw = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    raw = raw.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    raw = raw.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    raw = raw.replace(/^# (.*$)/gim, '<h2>$1</h2>');
    raw = raw.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    raw = raw.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    raw = raw.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    raw = raw.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    raw = raw.replace(/`([^`]+)`/gim, '<code>$1</code>');
    raw = raw.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    raw = raw.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    raw = raw.replace(/<\/ul>\s*<ul>/gim, '');
    raw = raw.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    const paras = raw.split(/\n\n+/);
    return paras
      .map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        if (/^<(h[1-6]|ul|ol|blockquote|pre)/i.test(trimmed)) return trimmed;
        return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
      })
      .filter(Boolean)
      .join('\n');
  }, [mdInput]);

  // Word Counter calculations
  const stats = useMemo(() => {
    const raw = text.trim();
    if (!raw) {
      return {
        words: 0,
        chars: 0,
        charsNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: '0 min',
        speakingTime: '0 min',
      };
    }
    const wordsArr = raw.split(/\s+/).filter(Boolean);
    const words = wordsArr.length;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s+/g, '').length;
    const sentences = (text.match(/[^.!?]+[.!?]+(\s|$)/g) || []).length || (words > 0 ? 1 : 0);
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;
    const readMin = Math.ceil(words / 200);
    const speakMin = Math.ceil(words / 130);

    return {
      words,
      chars,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingTime: `${readMin} min${readMin > 1 ? 's' : ''}`,
      speakingTime: `${speakMin} min${speakMin > 1 ? 's' : ''}`,
    };
  }, [text]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Case Conversion handlers
  const toUppercase = () => setText((prev) => prev.toUpperCase());
  const toLowercase = () => setText((prev) => prev.toLowerCase());
  const toTitleCase = () => {
    setText((prev) =>
      prev.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
    );
  };
  const toSentenceCase = () => {
    setText((prev) =>
      prev.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
    );
  };
  const toCamelCase = () => {
    setText((prev) =>
      prev
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^[A-Z]/, (c) => c.toLowerCase())
    );
  };
  const toKebabCase = () => {
    setText((prev) =>
      prev
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    );
  };
  const toSnakeCase = () => {
    setText((prev) =>
      prev
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    );
  };

  // JSON Formatter handlers
  const formatJson = (spaces: number) => {
    setJsonIndent(spaces);
    try {
      const parsed = JSON.parse(text);
      if (spaces === 0) {
        setText(JSON.stringify(parsed));
      } else {
        setText(JSON.stringify(parsed, null, spaces));
      }
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(text);
      setJsonError(null);
      alert('Valid JSON syntax!');
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  return (
    <div class="text-shell bg-white border border-gray-200 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-8 my-6">
      {/* Word & Character Counter */}
      {(toolId === 'word-counter' || toolId === 'character-counter') && (
        <div class="space-y-6">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-3 rounded-xl bg-green-50 border border-green-200">
              <span class="block text-2xl sm:text-3xl font-extrabold text-green-900">{stats.words}</span>
              <span class="text-xs font-semibold text-green-700 uppercase">Words</span>
            </div>
            <div class="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span class="block text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.chars}</span>
              <span class="text-xs font-semibold text-gray-500 uppercase">Characters</span>
            </div>
            <div class="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span class="block text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.charsNoSpaces}</span>
              <span class="text-xs font-semibold text-gray-500 uppercase">Without Spaces</span>
            </div>
            <div class="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span class="block text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.sentences}</span>
              <span class="text-xs font-semibold text-gray-500 uppercase">Sentences</span>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Your Text</label>
              <div class="space-x-2">
                <button
                  type="button"
                  onClick={() => setText('')}
                  class="text-xs text-gray-500 hover:text-red-600 transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  class="text-xs font-semibold text-green-600 hover:text-green-700 transition"
                >
                  {copied ? '✓ Copied!' : 'Copy Text'}
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              value={text}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
              placeholder="Paste or type your text here for instant live analysis..."
              class="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-sans text-sm leading-relaxed"
            />
          </div>

          <div class="flex flex-wrap items-center justify-between text-xs text-gray-500 gap-4 pt-2 border-t border-gray-100">
            <div>
              <span>Paragraphs: <strong class="text-gray-800">{stats.paragraphs}</strong></span>
              <span class="mx-2">•</span>
              <span>Estimated Reading: <strong class="text-gray-800">{stats.readingTime}</strong></span>
              <span class="mx-2">•</span>
              <span>Speaking: <strong class="text-gray-800">{stats.speakingTime}</strong></span>
            </div>
            <div class="text-gray-400 text-xs">Local in-browser processing</div>
          </div>
        </div>
      )}

      {/* Case Converter */}
      {toolId === 'case-converter' && (
        <div class="space-y-6">
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toSentenceCase}
              class="px-3.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
            >
              Sentence case
            </button>
            <button
              type="button"
              onClick={toLowercase}
              class="px-3.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
            >
              lower case
            </button>
            <button
              type="button"
              onClick={toUppercase}
              class="px-3.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
            >
              UPPER CASE
            </button>
            <button
              type="button"
              onClick={toTitleCase}
              class="px-3.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
            >
              Title Case
            </button>
            <button
              type="button"
              onClick={toCamelCase}
              class="px-3.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
            >
              camelCase
            </button>
            <button
              type="button"
              onClick={toKebabCase}
              class="px-3.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
            >
              kebab-case
            </button>
            <button
              type="button"
              onClick={toSnakeCase}
              class="px-3.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
            >
              snake_case
            </button>
          </div>

          <div>
            <textarea
              rows={8}
              value={text}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
              placeholder="Paste or type text to convert case..."
              class="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 font-sans text-sm leading-relaxed"
            />
          </div>

          <div class="flex justify-between items-center text-xs text-gray-500">
            <span>{stats.words} words • {stats.chars} characters</span>
            <div class="space-x-3">
              <button
                type="button"
                onClick={() => setText('')}
                class="hover:text-red-600 transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                class="font-semibold text-green-600 hover:text-green-700 transition"
              >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Formatter */}
      {toolId === 'json-formatter' && (
        <div class="space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <div class="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => formatJson(2)}
                class={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  jsonIndent === 2 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Beautify (2 Spaces)
              </button>
              <button
                type="button"
                onClick={() => formatJson(4)}
                class={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  jsonIndent === 4 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Beautify (4 Spaces)
              </button>
              <button
                type="button"
                onClick={() => formatJson(0)}
                class={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  jsonIndent === 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Minify (1 Line)
              </button>
              <button
                type="button"
                onClick={validateJson}
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                Validate
              </button>
            </div>
            <div class="space-x-2">
              <button
                type="button"
                onClick={() => setText('')}
                class="text-xs text-gray-500 hover:text-red-600"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                class="text-xs font-semibold text-green-600 hover:text-green-700"
              >
                {copied ? '✓ Copied!' : 'Copy JSON'}
              </button>
            </div>
          </div>

          {jsonError && (
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
              <span><strong>JSON Error:</strong> {jsonError}</span>
              <button onClick={() => setJsonError(null)} class="text-red-500 hover:text-red-800">×</button>
            </div>
          )}

          <div>
            <textarea
              rows={12}
              value={text}
              onInput={(e) => {
                setText((e.target as HTMLTextAreaElement).value);
                setJsonError(null);
              }}
              placeholder="Paste raw JSON here..."
              class="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 font-mono text-xs sm:text-sm leading-normal bg-gray-50"
            />
          </div>

          <div class="flex justify-between items-center text-xs text-gray-500">
            <span>Size: {(new Blob([text]).size / 1024).toFixed(2)} KB</span>
            <span class="text-gray-400 text-xs">RFC 8259 syntax validation</span>
          </div>
        </div>
      )}

      {/* Lorem Ipsum Generator */}
      {toolId === 'lorem-ipsum-generator' && (
        <div class="space-y-6 max-w-2xl mx-auto">
          {/* Controls */}
          <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Generate:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={loremCount}
                onInput={(e) => setLoremCount(Math.max(1, Number((e.target as HTMLInputElement).value)))}
                class="w-16 px-2 py-1 text-xs font-bold font-mono border border-gray-300 rounded-lg text-center"
              />
              <select
                value={loremType}
                onChange={(e) => setLoremType((e.target as HTMLSelectElement).value as any)}
                class="px-3 py-1 text-xs font-semibold border border-gray-300 rounded-lg bg-white"
              >
                <option value="paragraphs">Paragraphs</option>
                <option value="sentences">Sentences</option>
                <option value="words">Words</option>
              </select>
            </div>

            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={startWithLorem}
                  onChange={(e) => setStartWithLorem((e.target as HTMLInputElement).checked)}
                  class="rounded text-green-600 focus:ring-green-500"
                />
                Start with "Lorem ipsum"
              </label>

              <button
                type="button"
                onClick={generateLorem}
                class="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Regenerate
              </button>
            </div>
          </div>

          {/* Output Display */}
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Generated Text</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(loremOutput);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                class="px-3 py-1 text-xs font-semibold rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition"
              >
                {copied ? '✓ Copied to Clipboard' : 'Copy Text'}
              </button>
            </div>

            <textarea
              rows={10}
              readOnly
              value={loremOutput}
              class="w-full p-4 rounded-xl border border-gray-300 bg-white font-serif text-sm leading-relaxed text-gray-800 focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}

      {/* Diff Checker */}
      {toolId === 'diff-checker' && (
        <div class="space-y-6">
          <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full font-bold">
                +{diffResult.addedCount} Added
              </span>
              <span class="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full font-bold">
                -{diffResult.removedCount} Removed
              </span>
            </div>
            <div class="text-gray-400 text-2xs">
              Inline comparison
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Original Text (Baseline)
              </label>
              <textarea
                rows={6}
                value={diffOriginal}
                onInput={(e) => setDiffOriginal((e.target as HTMLTextAreaElement).value)}
                placeholder="Paste original text here..."
                class="w-full p-3 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Modified Text (Updated)
              </label>
              <textarea
                rows={6}
                value={diffModified}
                onInput={(e) => setDiffModified((e.target as HTMLTextAreaElement).value)}
                placeholder="Paste modified text here..."
                class="w-full p-3 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="p-2.5 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-700">
              Highlighted Line Differences
            </div>
            <div class="font-mono text-xs divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {diffResult.diff.map((line, idx) => (
                <div
                  key={idx}
                  class={`flex items-start px-3 py-1.5 ${
                    line.type === 'added'
                      ? 'bg-green-50 text-green-900 font-medium'
                      : line.type === 'removed'
                      ? 'bg-red-50 text-red-900 line-through'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  <span
                    class={`w-6 text-center select-none font-bold mr-2 ${
                      line.type === 'added'
                        ? 'text-green-600'
                        : line.type === 'removed'
                        ? 'text-red-500'
                        : 'text-gray-300'
                    }`}
                  >
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  <span class="break-all whitespace-pre-wrap">{line.text || ' '}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Markdown to HTML Converter */}
      {toolId === 'markdown-to-html' && (
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Markdown Editor</label>
                <button
                  type="button"
                  onClick={() =>
                    setMdInput(
                      '# Live Heading\n\n- Free & Instant\n- Pure In-Browser Client\n\n**Bold Text** and *italic* styling.'
                    )
                  }
                  class="text-2xs text-gray-500 hover:text-green-600 cursor-pointer"
                >
                  Load Sample
                </button>
              </div>
              <textarea
                rows={12}
                value={mdInput}
                onInput={(e) => setMdInput((e.target as HTMLTextAreaElement).value)}
                placeholder="Type or paste markdown here..."
                class="w-full p-3 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Live Visual Preview</label>
                <span class="text-2xs font-semibold text-green-700">Instant Real-Time</span>
              </div>
              <div
                class="p-4 border border-gray-200 rounded-xl bg-gray-50 max-h-[300px] overflow-y-auto prose prose-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: htmlOutput }}
              />
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Generated HTML Markup</label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(htmlOutput);
                  setMdCopied(true);
                  setTimeout(() => setMdCopied(false), 2000);
                }}
                class="text-xs font-bold text-green-700 hover:underline cursor-pointer"
              >
                {mdCopied ? '✓ Copied HTML!' : 'Copy HTML Code'}
              </button>
            </div>
            <textarea
              rows={5}
              readOnly
              value={htmlOutput}
              class="w-full p-3 font-mono text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
