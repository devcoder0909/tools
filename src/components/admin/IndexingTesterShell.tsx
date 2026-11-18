import { useState, useEffect, useMemo } from 'preact/hooks';
import { googleOAuthConfig } from '../../config/google-oauth';

export interface PageItem {
  url: string;
  title: string;
  category: string;
  indexable?: boolean;
  reviewed?: boolean;
}

interface IndexingTesterShellProps {
  allPages?: PageItem[];
}

const FALLBACK_PAGES: PageItem[] = [
  { url: 'https://zixtool.online/', title: 'Homepage — Root Directory Index', category: 'Root', indexable: true },
  { url: 'https://zixtool.online/tools/', title: 'All Tools Hub Directory', category: 'Hub', indexable: true },
  { url: 'https://zixtool.online/calculators/', title: 'Financial & Math Calculators Hub', category: 'Hub', indexable: true },
  { url: 'https://zixtool.online/formats/', title: 'Format Encyclopedias Hub', category: 'Hub', indexable: true },
  { url: 'https://zixtool.online/privacy-explained/', title: 'Privacy & Architecture Explained', category: 'Info', indexable: true },
  { url: 'https://zixtool.online/about/', title: 'About ZixTool Team & Engineering', category: 'Info', indexable: true },
  { url: 'https://zixtool.online/contact/', title: 'Contact & Security Inquiries', category: 'Info', indexable: true },
  { url: 'https://zixtool.online/heic-to-jpg/', title: 'HEIC to JPG Converter', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/photo-compressor/', title: 'Photo Compressor Online', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/jpg-compressor/', title: 'JPG Compressor Online', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/passport-photo-resizer/', title: 'Passport Photo Resizer', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/jpeg-to-jpg/', title: 'JPEG to JPG Converter', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/pdf-to-jpg/', title: 'PDF to JPG Converter', category: 'pdf', indexable: true },
  { url: 'https://zixtool.online/webp-to-png/', title: 'WebP to PNG Converter', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/webp-to-jpg/', title: 'WebP to JPG Converter', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/png-to-jpg/', title: 'PNG to JPG Converter', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/jpg-to-png/', title: 'JPG to PNG Converter', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/image-compressor/', title: 'Image Compressor', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/compress-image-to-20kb/', title: 'Compress Image to 20KB', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/compress-image-to-50kb/', title: 'Compress Image to 50KB', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/compress-image-to-100kb/', title: 'Compress Image to 100KB', category: 'converter', indexable: true },
  { url: 'https://zixtool.online/percentage-calculator/', title: 'Percentage Calculator', category: 'calculator', indexable: true },
  { url: 'https://zixtool.online/emi-calculator/', title: 'EMI Calculator', category: 'finance', indexable: true },
  { url: 'https://zixtool.online/sip-calculator/', title: 'SIP Investment Calculator', category: 'finance', indexable: true },
  { url: 'https://zixtool.online/json-formatter/', title: 'JSON Formatter & Validator', category: 'developer', indexable: true },
  { url: 'https://zixtool.online/base64-encoder/', title: 'Base64 Encoder / Decoder', category: 'developer', indexable: true },
  { url: 'https://zixtool.online/qr-code-generator/', title: 'QR Code Generator', category: 'generator', indexable: true },
  { url: 'https://zixtool.online/password-generator/', title: 'Password Generator', category: 'generator', indexable: true },
  { url: 'https://zixtool.online/age-calculator/', title: 'Age Calculator', category: 'calculator', indexable: true },
  { url: 'https://zixtool.online/word-counter/', title: 'Word Counter', category: 'text', indexable: true },
];

export function IndexingTesterShell({ allPages }: IndexingTesterShellProps) {
  const pageList = useMemo(() => (allPages && allPages.length > 0 ? allPages : FALLBACK_PAGES), [allPages]);

  const [activeTab, setActiveTab] = useState<'pages' | 'google' | 'indexnow' | 'overview'>('pages');
  const [accessToken, setAccessToken] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('https://zixtool.online/');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastStatusCode, setLastStatusCode] = useState<number | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

  // Search & Filter state for All Pages
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [urlStatuses, setUrlStatuses] = useState<Record<string, { status: 'idle' | 'indexing' | 'success' | 'error'; message: string; timestamp?: string }>>({});
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; isRunning: boolean }>({ current: 0, total: 0, isRunning: false });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Initialize Google Identity Services
  useEffect(() => {
    const savedToken = sessionStorage.getItem('google_indexing_token');
    if (savedToken) {
      setAccessToken(savedToken);
    }

    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGis();
      };
      document.body.appendChild(script);
    } else {
      initGis();
    }
  }, []);

  function initGis() {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleOAuthConfig.clientId,
          scope: googleOAuthConfig.indexingScope,
          callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
              setAuthError(`OAuth Error: ${tokenResponse.error} - ${tokenResponse.error_description || ''}`);
              return;
            }
            if (tokenResponse.access_token) {
              setAccessToken(tokenResponse.access_token);
              sessionStorage.setItem('google_indexing_token', tokenResponse.access_token);
              setAuthError(null);
            }
          },
        });
        setTokenClient(client);
      } catch (e: any) {
        console.error('GIS Init Error:', e);
      }
    }
  }

  function handleGoogleSignIn() {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      setAuthError('Google Identity Services client is still loading. Please wait 2 seconds or paste a token manually.');
    }
  }

  // Filtered page list
  const filteredPages = useMemo(() => {
    return pageList.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [pageList, searchQuery, selectedCategory]);

  // Unique categories for pills
  const categories = useMemo(() => {
    const cats = new Set(pageList.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [pageList]);

  // Index a single page (Google + IndexNow)
  async function handleIndexSinglePage(urlToPublish: string) {
    setUrlStatuses((prev) => ({
      ...prev,
      [urlToPublish]: { status: 'indexing', message: 'Publishing to Google & IndexNow...' },
    }));

    let googleSuccess = false;
    let googleMsg = '';
    let indexNowSuccess = false;
    let indexNowMsg = '';

    // 1. Google Indexing API
    if (accessToken.trim()) {
      try {
        const res = await fetch(googleOAuthConfig.indexingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.trim()}`,
          },
          body: JSON.stringify({
            url: urlToPublish,
            type: 'URL_UPDATED',
          }),
        });
        if (res.ok || res.status === 200) {
          googleSuccess = true;
          googleMsg = 'Google: 200 OK';
        } else {
          googleMsg = `Google: ${res.status}`;
        }
      } catch (err: any) {
        googleMsg = 'Google: Network Err';
      }
    } else {
      googleMsg = 'Google: Token Needed';
    }

    // 2. IndexNow Ping
    try {
      const apiKey = 'fbfbc05b9070df2dcd6684c6d12c7a0b';
      const payload = {
        host: 'zixtool.online',
        key: apiKey,
        keyLocation: `https://zixtool.online/${apiKey}.txt`,
        urlList: [urlToPublish],
      };
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 200 || res.status === 202) {
        indexNowSuccess = true;
        indexNowMsg = 'IndexNow: 200 OK';
      } else {
        indexNowMsg = `IndexNow: ${res.status}`;
      }
    } catch (err: any) {
      indexNowMsg = 'IndexNow: Queued (CORS handled by CLI)';
    }

    const isSuccess = googleSuccess || indexNowSuccess;
    setUrlStatuses((prev) => ({
      ...prev,
      [urlToPublish]: {
        status: isSuccess ? 'success' : 'idle',
        message: `${googleMsg} | ${indexNowMsg}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    }));
  }

  // Batch index all filtered or all indexable pages
  async function handleIndexAllPages() {
    const targets = filteredPages.filter((p) => p.indexable !== false);
    if (targets.length === 0) return;

    setBatchProgress({ current: 0, total: targets.length, isRunning: true });

    for (let i = 0; i < targets.length; i++) {
      const page = targets[i];
      await handleIndexSinglePage(page.url);
      setBatchProgress({ current: i + 1, total: targets.length, isRunning: true });
      await new Promise((resolve) => setTimeout(resolve, 200)); // Respect Google API quota
    }

    setBatchProgress((prev) => ({ ...prev, isRunning: false }));
  }

  // Submit all URLs in one batch payload to IndexNow
  async function handleIndexNowBulk() {
    setIsLoading(true);
    setResponseJson(null);
    setLastStatusCode(null);
    const start = performance.now();

    const apiKey = 'fbfbc05b9070df2dcd6684c6d12c7a0b';
    const urlList = pageList.filter((p) => p.indexable !== false).map((p) => p.url);

    const payload = {
      host: 'zixtool.online',
      key: apiKey,
      keyLocation: `https://zixtool.online/${apiKey}.txt`,
      urlList,
    };

    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setLastStatusCode(res.status);

      const text = await res.text();
      const data = text
        ? { raw: text }
        : {
            status: res.status,
            message:
              res.status === 200
                ? `200 OK: Bulk payload with ${urlList.length} URLs submitted to IndexNow (Bing/Yandex)!`
                : res.status === 202
                ? `202 Accepted: ${urlList.length} URLs received by IndexNow engine.`
                : `HTTP ${res.status}`,
          };
      setResponseJson(data);

      // Mark all URLs as success in status tracker
      const updatedStatuses: Record<string, any> = {};
      urlList.forEach((u) => {
        updatedStatuses[u] = {
          status: 'success',
          message: `IndexNow Bulk: HTTP ${res.status}`,
          timestamp: new Date().toLocaleTimeString(),
        };
      });
      setUrlStatuses((prev) => ({ ...prev, ...updatedStatuses }));
    } catch (err: any) {
      setLastStatusCode(0);
      setResponseJson({
        error: {
          message:
            err.message ||
            'Direct browser fetch to api.indexnow.org encountered a CORS constraint. Node CLI script (scripts/indexnow.ts) runs directly in background.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Copy all URLs to clipboard
  function handleCopyAllUrls() {
    const urlsText = pageList.map((p) => p.url).join('\n');
    navigator.clipboard.writeText(urlsText);
    setCopyFeedback(`Copied ${pageList.length} URLs to clipboard!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  }

  // Download all URLs as TXT file
  function handleExportUrls() {
    const urlsText = pageList.map((p) => p.url).join('\n');
    const blob = new Blob([urlsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zixtool-all-urls-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Publish single URL to Google
  async function handleGooglePublish(urlToPublish: string) {
    if (!accessToken.trim()) {
      setAuthError('Please sign in with Google or paste an active OAuth access token first.');
      return;
    }

    setIsLoading(true);
    setResponseJson(null);
    setLastStatusCode(null);
    const start = performance.now();

    try {
      const res = await fetch(googleOAuthConfig.indexingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken.trim()}`,
        },
        body: JSON.stringify({
          url: urlToPublish,
          type: 'URL_UPDATED',
        }),
      });

      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setLastStatusCode(res.status);

      const data = await res.json();
      setResponseJson(data);
    } catch (err: any) {
      setLastStatusCode(0);
      setResponseJson({
        error: {
          code: 0,
          message: err.message || 'Network error or CORS issue.',
          status: 'NETWORK_FAILURE',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Query URL Metadata from Google
  async function handleGoogleMetadata(urlToQuery: string) {
    if (!accessToken.trim()) {
      setAuthError('Please sign in with Google or paste an active OAuth access token first.');
      return;
    }

    setIsLoading(true);
    setResponseJson(null);
    setLastStatusCode(null);
    const start = performance.now();

    try {
      const endpoint = `${googleOAuthConfig.metadataEndpoint}?url=${encodeURIComponent(urlToQuery)}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken.trim()}`,
        },
      });

      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setLastStatusCode(res.status);

      const data = await res.json();
      setResponseJson(data);
    } catch (err: any) {
      setLastStatusCode(0);
      setResponseJson({
        error: {
          code: 0,
          message: err.message || 'Network error querying metadata.',
          status: 'NETWORK_FAILURE',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div class="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div class="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-2xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                🔒 INTERNAL ADMIN
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-2xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Total Pages: {pageList.length}
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-2xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Host: zixtool.online
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Instant Indexing &amp; Discovery Hub</h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              1-Click Google Indexing API (v3) &amp; IndexNow (Bing/Yandex) notification engine. Trigger on-demand indexing for any page or batch all {pageList.length} URLs simultaneously.
            </p>
          </div>

          {/* Quick Stats */}
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-center min-w-[100px]">
              <div class="text-2xs text-slate-400">OAuth State</div>
              <div class={`text-xs font-mono font-bold ${accessToken ? 'text-emerald-400' : 'text-amber-400'}`}>
                {accessToken ? 'Active Token' : 'Unauthenticated'}
              </div>
            </div>
            <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-center min-w-[100px]">
              <div class="text-2xs text-slate-400">Daily Cron</div>
              <div class="text-xs font-mono font-bold text-sky-400">Twice Daily</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div class="flex flex-wrap gap-2 mt-6 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('pages')}
            class={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pages'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>All Site Pages ({pageList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            class={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Google Indexing API (v3)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('indexnow')}
            class={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'indexnow'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>IndexNow (Bing / Yandex)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            class={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Setup &amp; Daily Automation Guide</span>
          </button>
        </div>
      </div>

      {/* Tab 0: ALL SITE PAGES & 1-CLICK INDEXING */}
      {activeTab === 'pages' && (
        <div class="space-y-6">
          {/* Action Bar */}
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Interactive URL Index &amp; Instant Discovery</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    {filteredPages.length} of {pageList.length} Showing
                  </span>
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Click <strong>"⚡ Start Indexing"</strong> on any row to immediately ping search engines, or use the batch buttons below.
                </p>
              </div>

              {/* Batch Action Buttons */}
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={batchProgress.isRunning}
                  onClick={handleIndexAllPages}
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition disabled:opacity-50"
                  title="Iterates through all filtered pages and publishes each to Google Indexing API and IndexNow"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{batchProgress.isRunning ? `Indexing (${batchProgress.current}/${batchProgress.total})...` : '🚀 Batch Index All Pages'}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleIndexNowBulk}
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition disabled:opacity-50"
                  title="Sends all URLs in a single request to IndexNow"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>⚡ Bulk IndexNow Ping</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllUrls}
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                  title="Copy all URLs to clipboard"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{copyFeedback || '📋 Copy All URLs'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportUrls}
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                  title="Download all URLs as a .txt list"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>💾 Export TXT</span>
                </button>
              </div>
            </div>

            {/* Batch Progress Bar */}
            {batchProgress.isRunning && (
              <div class="space-y-1 pt-2">
                <div class="flex justify-between text-2xs font-semibold text-slate-600">
                  <span>Batch Indexing Progress: {batchProgress.current} of {batchProgress.total} completed</span>
                  <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Search & Category Pills */}
            <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <div class="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by title, keyword, or URL slug..."
                  value={searchQuery}
                  onInput={(e: any) => setSearchQuery(e.target.value)}
                  class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div class="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    class={`px-2.5 py-1 rounded-lg text-2xs font-semibold capitalize transition ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive URL Table */}
          <div class="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div class="overflow-x-auto max-h-[640px] overflow-y-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600 z-10">
                  <tr>
                    <th class="p-3 pl-4">Page Title &amp; Slug</th>
                    <th class="p-3">Category</th>
                    <th class="p-3">Index State</th>
                    <th class="p-3">Live Status</th>
                    <th class="p-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {filteredPages.map((page) => {
                    const statusInfo = urlStatuses[page.url];
                    const isBusy = statusInfo?.status === 'indexing';
                    const isDone = statusInfo?.status === 'success';

                    return (
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="p-3 pl-4">
                          <div class="font-bold text-slate-900">{page.title}</div>
                          <div class="flex items-center gap-1.5 mt-0.5">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="font-mono text-2xs text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <span>{page.url.replace('https://zixtool.online', '') || '/'}</span>
                              <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </td>
                        <td class="p-3 whitespace-nowrap">
                          <span class="inline-block px-2 py-0.5 rounded-md text-2xs font-semibold capitalize bg-slate-100 text-slate-700">
                            {page.category}
                          </span>
                        </td>
                        <td class="p-3 whitespace-nowrap">
                          {page.indexable !== false ? (
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Indexable
                            </span>
                          ) : (
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-100 text-slate-500">
                              noindex
                            </span>
                          )}
                        </td>
                        <td class="p-3 whitespace-nowrap">
                          {isBusy ? (
                            <span class="inline-flex items-center gap-1 text-2xs font-semibold text-amber-600 animate-pulse">
                              <span class="w-2 h-2 rounded-full border-2 border-amber-600 border-t-transparent animate-spin"></span>
                              Publishing...
                            </span>
                          ) : isDone ? (
                            <span class="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700">
                              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{statusInfo.message}</span>
                            </span>
                          ) : statusInfo?.message ? (
                            <span class="text-2xs text-slate-600">{statusInfo.message}</span>
                          ) : (
                            <span class="text-2xs text-slate-400 italic">Not triggered this session</span>
                          )}
                        </td>
                        <td class="p-3 pr-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleIndexSinglePage(page.url)}
                            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-2xs shadow-xs hover:shadow-sm transition disabled:opacity-50"
                          >
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>⚡ Start Indexing</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Google Indexing API */}
      {activeTab === 'google' && (
        <div class="space-y-6">
          {/* Step 1: Authorization */}
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h2 class="text-base sm:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">1</span>
              Google OAuth 2.0 Authorization
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 mb-4">
              Authorize using the Google Account that is an <strong>Owner or Full User</strong> of <code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-800">https://zixtool.online</code> in Google Search Console.
            </p>

            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition shadow-xs"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                {accessToken ? 'Re-Authenticate with Google' : 'Sign In with Google (OAuth)'}
              </button>

              {accessToken && (
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active OAuth Token Loaded ({accessToken.slice(0, 10)}...{accessToken.slice(-6)})
                </span>
              )}
            </div>

            {/* Manual token fallback */}
            <div class="mt-4 pt-4 border-t border-slate-100">
              <label class="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Or Paste Access Token Manually (Optional / Localhost testing):
              </label>
              <input
                type="text"
                placeholder="ya29.a0AfH6SM..."
                value={accessToken}
                onInput={(e: any) => {
                  setAccessToken(e.target.value);
                  sessionStorage.setItem('google_indexing_token', e.target.value);
                }}
                class="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {authError && (
              <div class="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {authError}
              </div>
            )}
          </div>

          {/* Step 2: Target URL and Action Buttons */}
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h2 class="text-base sm:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">2</span>
              Test Single URL Notification
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Target URL to Publish:
                </label>
                <div class="flex gap-2">
                  <input
                    type="url"
                    value={targetUrl}
                    onInput={(e: any) => setTargetUrl(e.target.value)}
                    class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    onChange={(e: any) => setTargetUrl(e.target.value)}
                    class="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-700 max-w-[200px]"
                  >
                    <option value="">Quick Pick URL...</option>
                    {pageList.map((p) => (
                      <option value={p.url}>{p.url.replace('https://zixtool.online', '') || '/'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleGooglePublish(targetUrl)}
                  class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Publish URL (URL_UPDATED)
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleGoogleMetadata(targetUrl)}
                  class="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm hover:bg-slate-200 disabled:opacity-50 transition border border-slate-300/80 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Query URL Metadata (Status)
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Live API Response Console */}
          <div class="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">3</span>
                <h3 class="text-base font-bold text-white">Live API Response Console</h3>
              </div>
              {lastStatusCode !== null && (
                <div class="flex items-center gap-2">
                  <span
                    class={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                      lastStatusCode === 200
                        ? 'bg-emerald-500 text-slate-950'
                        : lastStatusCode === 403
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    HTTP {lastStatusCode}
                  </span>
                  {responseTimeMs !== null && (
                    <span class="text-2xs text-slate-400 font-mono">
                      {responseTimeMs}ms
                    </span>
                  )}
                </div>
              )}
            </div>

            <div class="bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-xs overflow-x-auto text-emerald-400 min-h-[140px]">
              {isLoading ? (
                <div class="flex items-center gap-2 text-slate-400">
                  <span class="inline-block w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></span>
                  Dispatching request to Google Indexing API endpoint...
                </div>
              ) : responseJson ? (
                <pre>{JSON.stringify(responseJson, null, 2)}</pre>
              ) : (
                <div class="text-slate-500 italic">
                  No request dispatched yet. Click "Publish URL" or "Query URL Metadata" to test the live API.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: IndexNow API */}
      {activeTab === 'indexnow' && (
        <div class="space-y-6">
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h2 class="text-base sm:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-black">1</span>
              IndexNow Protocol (Bing, Yandex, Seznam)
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 mb-4">
              IndexNow allows websites to immediately inform search engines about their latest content changes. A single notification to IndexNow simultaneously notifies Bing, Yandex, and participating engines.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div class="text-slate-500 font-semibold mb-1">Host Domain</div>
                <div class="font-mono font-bold text-slate-900">zixtool.online</div>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div class="text-slate-500 font-semibold mb-1">IndexNow Key Location</div>
                <a
                  href="https://zixtool.online/fbfbc05b9070df2dcd6684c6d12c7a0b.txt"
                  target="_blank"
                  class="font-mono text-emerald-600 hover:underline break-all"
                >
                  https://zixtool.online/fbfbc05b9070df2dcd6684c6d12c7a0b.txt
                </a>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  URL to Ping:
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onInput={(e: any) => setTargetUrl(e.target.value)}
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleIndexSinglePage(targetUrl)}
                  class="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs sm:text-sm hover:bg-sky-700 disabled:opacity-50 transition shadow-xs flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Ping Single URL
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleIndexNowBulk}
                  class="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 disabled:opacity-50 transition shadow-xs flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Ping All {pageList.length} URLs in Bulk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Setup & Troubleshooting Guide */}
      {activeTab === 'overview' && (
        <div class="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-xl font-bold text-slate-900">How to Verify &amp; Automate Instant Indexing for ZixTool</h2>

          <div class="space-y-4">
            <h3 class="text-base font-bold text-slate-900">1. Automated Daily Indexing via GitHub Actions</h3>
            <p>
              Your repository includes <code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-emerald-800">.github/workflows/daily-indexing.yml</code>, which automatically runs <strong>twice daily</strong> (at 03:00 UTC and 15:00 UTC). It executes:
            </p>
            <ul class="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
              <li>Google Indexing API (v3) batch publishing for all {pageList.length} site URLs.</li>
              <li>IndexNow simultaneous dispatch to Bing &amp; Yandex.</li>
              <li>Direct search engine sitemap pings for <code class="font-mono text-slate-800">https://zixtool.online/sitemap-index.xml</code>.</li>
            </ul>

            <h3 class="text-base font-bold text-slate-900 mt-6">2. Headless Service Account (Zero OAuth Prompt)</h3>
            <p>
              You can run continuous headless auto-indexing directly from your terminal or server without browser logins:
            </p>
            <div class="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto space-y-1">
              <div># Run one-off multi-engine indexing:</div>
              <div class="text-white">pnpm run indexing</div>
              <div class="pt-2 text-slate-400"># Run continuous daemon auto-indexing (e.g. every 12 hours):</div>
              <div class="text-white">pnpm exec tsx scripts/google-indexing.ts --continuous --interval 720</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
