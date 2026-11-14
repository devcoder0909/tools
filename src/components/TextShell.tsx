import { useState, useMemo } from 'preact/hooks';

interface TextShellProps {
  toolId: string;
  toolName: string;
}

export default function TextShell({ toolId, toolName: _toolName }: TextShellProps) {
  const [text, setText] = useState<string>(
    toolId === 'json-formatter'
      ? '{"name":"Best Converter","type":"client-side","features":["privacy","speed","zero-upload"],"active":true}'
      : 'Best Converter processes all your documents, images, and calculations entirely inside your browser. No files are uploaded to any external server.'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonIndent, setJsonIndent] = useState<number>(2);

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
    <div class="text-shell bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 my-6">
      {/* Word Counter */}
      {toolId === 'word-counter' && (
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
            <div class="text-green-700 font-medium">100% Client-Side • Text never leaves your browser</div>
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
            <span class="text-green-700 font-medium">100% Client-Side Validation & Formatting</span>
          </div>
        </div>
      )}
    </div>
  );
}
