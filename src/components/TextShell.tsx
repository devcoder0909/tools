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
      ? '{"name":"ZixTool","type":"client-side","features":["privacy","speed","zero-upload"],"active":true}'
      : 'ZixTool processes all your documents, images, and calculations entirely inside your browser. No files are uploaded to any external server.'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonIndent, setJsonIndent] = useState<number>(2);

  // --- Diff Checker State ---
  const [diffOriginal, setDiffOriginal] = useState<string>(
    'ZixTool is a free online tool suite.\nAll processing is 100% client side.\nFast and private file operations.'
  );
  const [diffModified, setDiffModified] = useState<string>(
    'ZixTool is a free online tool suite.\nAll processing runs locally in browser RAM.\nFast and private file operations.\nDirect in-browser processing.'
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
    '## Markdown Preview\n\n**ZixTool** processes all your data **locally in your browser**.\n\n### Core Features\n\n- Zero server uploads\n- Instant client-side conversions\n- Fast in-memory processing\n\nVisit [ZixTool](https://zixtool.online) for fast utilities!'
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
    <div class="text-shell bg-white border border-slate-200/90 rounded-2xl shadow-card p-5 sm:p-7 my-6 transition-all">
      {/* Word & Character Counter */}
      {(toolId === 'word-counter' || toolId === 'character-counter') && (
        <div class="space-y-6">
          {/* SaaS KPI Metric Cards */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
              <span class="block text-2xl sm:text-3xl font-extrabold text-emerald-900 tracking-tight">{stats.words}</span>
              <span class="text-2xs font-bold text-emerald-700 uppercase tracking-wider mt-0.5">Words</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span class="block text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{stats.chars}</span>
              <span class="text-2xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Characters</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span class="block text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{stats.charsNoSpaces}</span>
              <span class="text-2xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">No Spaces</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span class="block text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{stats.sentences}</span>
              <span class="text-2xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Sentences</span>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Source Content</label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setText('')}
                  class="text-xs font-medium text-slate-400 hover:text-rose-600 transition cursor-pointer px-2 py-1 rounded-md"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-3 py-1 rounded-lg transition cursor-pointer"
                >
                  {copied ? '✓ Copied' : 'Copy Text'}
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              value={text}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
              placeholder="Paste or type your text here for instant live analysis..."
              class="w-full p-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans text-sm leading-relaxed text-slate-900 transition"
            />
          </div>

          <div class="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4 pt-3 border-t border-slate-100">
            <div class="flex items-center gap-4 flex-wrap">
              <span>Paragraphs: <strong class="text-slate-800">{stats.paragraphs}</strong></span>
              <span class="text-slate-300">•</span>
              <span>Reading: <strong class="text-slate-800">{stats.readingTime}</strong></span>
              <span class="text-slate-300">•</span>
              <span>Speaking: <strong class="text-slate-800">{stats.speakingTime}</strong></span>
            </div>
            <div class="text-slate-400 text-2xs font-mono">100% In-Browser Execution</div>
          </div>
        </div>
      )}

      {/* Case Converter */}
      {toolId === 'case-converter' && (
        <div class="space-y-6">
          <div class="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/80">
            {[
              { label: 'Sentence case', fn: toSentenceCase },
              { label: 'lower case', fn: toLowercase },
              { label: 'UPPER CASE', fn: toUppercase },
              { label: 'Title Case', fn: toTitleCase },
              { label: 'camelCase', fn: toCamelCase },
              { label: 'kebab-case', fn: toKebabCase },
              { label: 'snake_case', fn: toSnakeCase },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.fn}
                class="px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-lg border border-slate-200/60 shadow-2xs transition-all cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div>
            <textarea
              rows={8}
              value={text}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
              placeholder="Paste or type text to convert case..."
              class="w-full p-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans text-sm leading-relaxed text-slate-900 transition"
            />
          </div>

          <div class="flex justify-between items-center text-xs text-slate-500">
            <span>{stats.words} words • {stats.chars} characters</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setText('')}
                class="text-xs font-medium text-slate-400 hover:text-rose-600 transition cursor-pointer px-2 py-1"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-3.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                {copied ? '✓ Copied' : 'Copy Result'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Formatter */}
      {toolId === 'json-formatter' && (
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => formatJson(2)}
                class={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${jsonIndent === 2 ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                Beautify (2 Spaces)
              </button>
              <button
                type="button"
                onClick={() => formatJson(4)}
                class={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${jsonIndent === 4 ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                Beautify (4 Spaces)
              </button>
              <button
                type="button"
                onClick={() => formatJson(0)}
                class={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${jsonIndent === 0 ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                Minify (1 Line)
              </button>
              <button
                type="button"
                onClick={validateJson}
                class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Validate JSON
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setText('')}
                class="text-xs font-medium text-slate-400 hover:text-rose-600 cursor-pointer px-2 py-1"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-3.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                {copied ? '✓ Copied' : 'Copy JSON'}
              </button>
            </div>
          </div>

          {jsonError && (
            <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
              <span><strong>JSON Error:</strong> {jsonError}</span>
              <button onClick={() => setJsonError(null)} class="text-rose-500 hover:text-rose-800 font-bold ml-2">×</button>
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
              class="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-xs sm:text-sm leading-relaxed bg-slate-50/50 text-slate-900 transition"
            />
          </div>

          <div class="flex justify-between items-center text-xs text-slate-500">
            <span>Size: <strong class="text-slate-700">{(new Blob([text]).size / 1024).toFixed(2)} KB</strong></span>
            <span class="text-slate-400 text-2xs font-mono">RFC 8259 Standard Syntax</span>
          </div>
        </div>
      )}

      {/* Lorem Ipsum Generator */}
      {toolId === 'lorem-ipsum-generator' && (
        <div class="space-y-6 max-w-2xl mx-auto">
          {/* Controls */}
          <div class="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Generate:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={loremCount}
                onInput={(e) => setLoremCount(Math.max(1, Number((e.target as HTMLInputElement).value)))}
                class="w-16 px-2.5 py-1 text-xs font-bold font-mono border border-slate-200 rounded-lg text-center bg-white text-slate-900"
              />
              <select
                value={loremType}
                onChange={(e) => setLoremType((e.target as HTMLSelectElement).value as any)}
                class="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-800"
              >
                <option value="paragraphs">Paragraphs</option>
                <option value="sentences">Sentences</option>
                <option value="words">Words</option>
              </select>
            </div>

            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={startWithLorem}
                  onChange={(e) => setStartWithLorem((e.target as HTMLInputElement).checked)}
                  class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Start with "Lorem ipsum"
              </label>

              <button
                type="button"
                onClick={generateLorem}
                class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs active:scale-[0.99] cursor-pointer"
              >
                Regenerate
              </button>
            </div>
          </div>

          {/* Output Display */}
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Generated Text</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(loremOutput);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                class="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition cursor-pointer"
              >
                {copied ? '✓ Copied' : 'Copy Text'}
              </button>
            </div>

            <textarea
              rows={10}
              readOnly
              value={loremOutput}
              class="w-full p-4 rounded-xl border border-slate-200 bg-white font-serif text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      )}

      {/* Diff Checker */}
      {toolId === 'diff-checker' && (
        <div class="space-y-6">
          <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold">
            <div class="flex items-center gap-2.5">
              <span class="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-2.5 py-0.5 rounded-md font-semibold text-2xs">
                +{diffResult.addedCount} Added
              </span>
              <span class="inline-flex items-center gap-1 text-rose-700 bg-rose-100/70 border border-rose-200/60 px-2.5 py-0.5 rounded-md font-semibold text-2xs">
                -{diffResult.removedCount} Removed
              </span>
            </div>
            <div class="text-slate-400 text-2xs font-mono">
              In-Memory Diff Algorithm
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Original Text (Baseline)
              </label>
              <textarea
                rows={6}
                value={diffOriginal}
                onInput={(e) => setDiffOriginal((e.target as HTMLTextAreaElement).value)}
                placeholder="Paste original text here..."
                class="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-normal"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Modified Text (Updated)
              </label>
              <textarea
                rows={6}
                value={diffModified}
                onInput={(e) => setDiffModified((e.target as HTMLTextAreaElement).value)}
                placeholder="Paste modified text here..."
                class="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-normal"
              />
            </div>
          </div>

          <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div class="p-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
              Highlighted Line Differences
            </div>
            <div class="font-mono text-xs divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {diffResult.diff.map((line, idx) => (
                <div
                  key={idx}
                  class={`flex items-start px-3 py-1.5 ${line.type === 'added'
                    ? 'bg-emerald-50/70 text-emerald-900 font-medium'
                    : line.type === 'removed'
                      ? 'bg-rose-50/70 text-rose-900 line-through'
                      : 'bg-white text-slate-700'
                    }`}
                >
                  <span
                    class={`w-6 text-center select-none font-bold mr-2 ${line.type === 'added'
                      ? 'text-emerald-600'
                      : line.type === 'removed'
                        ? 'text-rose-500'
                        : 'text-slate-300'
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
              <div class="flex justify-between items-center mb-1.5">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Markdown Editor</label>
                <button
                  type="button"
                  onClick={() =>
                    setMdInput(
                      '# Live Heading\n\n- Free & Instant\n- Pure In-Browser Client\n\n**Bold Text** and *italic* styling.'
                    )
                  }
                  class="text-2xs text-slate-400 hover:text-emerald-600 cursor-pointer"
                >
                  Load Sample
                </button>
              </div>
              <textarea
                rows={12}
                value={mdInput}
                onInput={(e) => setMdInput((e.target as HTMLTextAreaElement).value)}
                placeholder="Type or paste markdown here..."
                class="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-normal"
              />
            </div>

            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Visual Preview</label>
                <span class="text-2xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">Instant Preview</span>
              </div>
              <div
                class="p-4 border border-slate-200 rounded-xl bg-slate-50/50 max-h-[300px] overflow-y-auto prose prose-sm leading-relaxed text-slate-800"
                dangerouslySetInnerHTML={{ __html: htmlOutput }}
              />
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Generated HTML Markup</label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(htmlOutput);
                  setMdCopied(true);
                  setTimeout(() => setMdCopied(false), 2000);
                }}
                class="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                {mdCopied ? '✓ Copied HTML!' : 'Copy HTML Code'}
              </button>
            </div>
            <textarea
              rows={5}
              readOnly
              value={htmlOutput}
              class="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
