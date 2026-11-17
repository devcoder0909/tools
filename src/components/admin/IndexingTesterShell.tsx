import { useState, useEffect } from 'preact/hooks';
import { googleOAuthConfig } from '../../config/google-oauth';

interface NotificationResponse {
  url?: string;
  type?: string;
  notifyTime?: string;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

interface MetadataResponse {
  url?: string;
  latestUpdate?: {
    url?: string;
    type?: string;
    notifyTime?: string;
  };
  latestRemove?: {
    url?: string;
    type?: string;
    notifyTime?: string;
  };
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

const DEFAULT_URLS = [
  'https://convert.gudmud.site/',
  'https://convert.gudmud.site/heic-to-jpg/',
  'https://convert.gudmud.site/photo-compressor/',
  'https://convert.gudmud.site/jpg-compressor/',
  'https://convert.gudmud.site/passport-photo-resizer/',
  'https://convert.gudmud.site/jpeg-to-jpg/',
  'https://convert.gudmud.site/pdf-to-jpg/',
  'https://convert.gudmud.site/webp-to-png/',
  'https://convert.gudmud.site/webp-to-jpg/',
  'https://convert.gudmud.site/png-to-jpg/',
  'https://convert.gudmud.site/jpg-to-png/',
  'https://convert.gudmud.site/image-compressor/',
  'https://convert.gudmud.site/compress-image-to-20kb/',
  'https://convert.gudmud.site/compress-image-to-50kb/',
  'https://convert.gudmud.site/compress-image-to-100kb/',
  'https://convert.gudmud.site/percentage-calculator/',
  'https://convert.gudmud.site/emi-calculator/',
  'https://convert.gudmud.site/sip-calculator/',
  'https://convert.gudmud.site/json-formatter/',
  'https://convert.gudmud.site/base64-encoder/',
  'https://convert.gudmud.site/qr-code-generator/',
  'https://convert.gudmud.site/password-generator/',
  'https://convert.gudmud.site/age-calculator/',
  'https://convert.gudmud.site/word-counter/',
];

export function IndexingTesterShell() {
  const [activeTab, setActiveTab] = useState<'google' | 'indexnow' | 'overview'>('google');
  const [accessToken, setAccessToken] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('https://convert.gudmud.site/json-formatter/');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastStatusCode, setLastStatusCode] = useState<number | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<{ url: string; status: number; text: string }[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

  // Initialize Google Identity Services
  useEffect(() => {
    // Check if token already in sessionStorage
    const savedToken = sessionStorage.getItem('google_indexing_token');
    if (savedToken) {
      setAccessToken(savedToken);
    }

    // Load GIS script if not present
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

  // Publish URL to Google Indexing API
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
          message: err.message || 'Network error or CORS issue. If testing on localhost, Google API blocks localhost origin unless added to GCP Authorized Origins.',
          status: 'NETWORK_FAILURE',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Query URL Metadata from Google Indexing API
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

  // Batch Publish Top URLs to Google
  async function handleBatchPublish() {
    if (!accessToken.trim()) {
      setAuthError('Please sign in with Google or paste an active OAuth access token first.');
      return;
    }

    setIsLoading(true);
    setBatchResults([]);
    const results: { url: string; status: number; text: string }[] = [];

    for (const u of DEFAULT_URLS) {
      try {
        const res = await fetch(googleOAuthConfig.indexingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.trim()}`,
          },
          body: JSON.stringify({
            url: u,
            type: 'URL_UPDATED',
          }),
        });

        const status = res.status;
        const text = status === 200 ? 'SUCCESS (200 OK)' : `FAILED (${status})`;
        results.push({ url: u, status, text });
        setBatchResults([...results]);
      } catch (err: any) {
        results.push({ url: u, status: 0, text: `ERROR: ${err.message}` });
        setBatchResults([...results]);
      }
    }
    setIsLoading(false);
  }

  // Test IndexNow API (Bing / Yandex)
  async function handleIndexNowPublish() {
    setIsLoading(true);
    setResponseJson(null);
    setLastStatusCode(null);
    const start = performance.now();

    const apiKey = 'fbfbc05b9070df2dcd6684c6d12c7a0b';
    const payload = {
      host: 'convert.gudmud.site',
      key: apiKey,
      keyLocation: `https://convert.gudmud.site/${apiKey}.txt`,
      urlList: [targetUrl],
    };

    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      const end = performance.now();
      setResponseTimeMs(Math.round(end - start));
      setLastStatusCode(res.status);

      let text = await res.text();
      let data = text ? { raw: text } : { status: res.status, message: res.status === 200 ? '200 OK: URL submitted successfully to IndexNow' : res.status === 202 ? '202 Accepted: URL received by IndexNow engine' : `HTTP ${res.status}` };
      setResponseJson(data);
    } catch (err: any) {
      setLastStatusCode(0);
      setResponseJson({
        error: {
          message: err.message || 'Direct browser fetch to api.indexnow.org encountered a CORS constraint. IndexNow can also be triggered via our Node CLI script (scripts/indexnow.ts) which runs directly with status 200.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div class="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div class="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                🔒 INTERNAL ONLY
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Robots: noindex, nofollow
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                GCP: {googleOAuthConfig.projectId}
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Instant Indexing API Live Tester</h1>
            <p class="text-sm text-slate-400 mt-1">
              Verify Google Indexing API (v3) and IndexNow (Bing/Yandex) notifications in real time.
            </p>
          </div>

          {/* Quick Stats */}
          <div class="flex items-center gap-3">
            <div class="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-center min-w-[110px]">
              <div class="text-xs text-slate-400">OAuth Client</div>
              <div class="text-xs font-mono font-bold text-emerald-400">Web App</div>
            </div>
            <div class="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-center min-w-[110px]">
              <div class="text-xs text-slate-400">IndexNow Key</div>
              <div class="text-xs font-mono font-bold text-sky-400">Verified</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div class="flex gap-2 mt-6 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab('google')}
            class={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'google'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Google Indexing API (v3)
          </button>
          <button
            onClick={() => setActiveTab('indexnow')}
            class={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'indexnow'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            IndexNow (Bing / Yandex)
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            class={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Setup &amp; Troubleshooting Guide
          </button>
        </div>
      </div>

      {/* Tab 1: Google Indexing API */}
      {activeTab === 'google' && (
        <div class="space-y-6">
          {/* Step 1: Authorization */}
          <div class="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <h2 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">1</span>
              Google OAuth 2.0 Authorization
            </h2>
            <p class="text-xs sm:text-sm text-gray-600 mb-4">
              Authorize using the Google Account that is an <strong>Owner or Full User</strong> of <code class="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-gray-800">https://convert.gudmud.site</code> in Google Search Console.
            </p>

            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition shadow-sm"
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
            <div class="mt-4 pt-4 border-t border-gray-100">
              <label class="block text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1">
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
                class="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {authError && (
              <div class="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {authError}
              </div>
            )}

            {/* Help box for OAuth 403 Access Denied */}
            <div class="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div class="flex items-center gap-2 font-bold text-amber-800">
                <svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Resolving "Error 403: access_denied (App has not completed verification)"
              </div>
              <p>
                Because this GCP OAuth Client is currently in <strong>Testing Mode</strong>, Google only permits authorized test accounts to sign in.
              </p>
              <ol class="list-decimal pl-5 space-y-1 text-amber-800">
                <li>
                  Open <a href="https://console.cloud.google.com/apis/credentials/consent?project=precise-space-365809" target="_blank" rel="noopener" class="font-bold underline text-amber-900 hover:text-black">Google Cloud Console &gt; OAuth consent screen</a> for project <code class="px-1 py-0.5 rounded bg-amber-100 font-mono">precise-space-365809</code>.
                </li>
                <li>
                  Under <strong>Test users</strong> (Audience section), click <strong>+ ADD USERS</strong>.
                </li>
                <li>
                  Add <code class="px-1.5 py-0.5 rounded bg-amber-100 font-mono font-bold text-amber-950">tusharpujhari79@gmail.com</code> and click <strong>SAVE</strong>.
                </li>
                <li>
                  Return here and click <strong>Sign In with Google</strong> — Google will authenticate you immediately!
                </li>
              </ol>
            </div>

            {/* Service Account Ownership Info */}
            <div class="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Headless Service Account Integration (Zero OAuth Prompt)
                </span>
                <span class="text-2xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Search Console Verified
                </span>
              </div>
              <p class="text-slate-400">
                You already added these Service Accounts as <strong>Owner</strong> in Google Search Console:
              </p>
              <ul class="font-mono text-2xs space-y-1 text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <li class="flex items-center justify-between">
                  <span>converter@precise-space-365809.iam.gserviceaccount.com</span>
                  <span class="text-emerald-400 font-bold">Owner ✓</span>
                </li>
                <li class="flex items-center justify-between">
                  <span>converter-594@precise-space-365809.iam.gserviceaccount.com</span>
                  <span class="text-emerald-400 font-bold">Owner ✓</span>
                </li>
              </ul>
              <p class="text-slate-400 text-2xs pt-1">
                To run automated indexing without browser logins, download the JSON key from GCP IAM &gt; Service Accounts, save it as <code class="text-emerald-300 font-mono">service-account.json</code> in this project, and run: <code class="text-emerald-300 font-mono">pnpm run indexing</code> (or <code class="text-emerald-300 font-mono">pnpm run indexing:auto</code> for continuous indexing).
              </p>
            </div>
          </div>

          {/* Step 2: Target URL and Action Buttons */}
          <div class="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <h2 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">2</span>
              Test URL Notification
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">
                  Target URL to Publish:
                </label>
                <div class="flex gap-2">
                  <input
                    type="url"
                    value={targetUrl}
                    onInput={(e: any) => setTargetUrl(e.target.value)}
                    class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    onChange={(e: any) => setTargetUrl(e.target.value)}
                    class="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-gray-50 text-gray-700"
                  >
                    <option value="">Quick Pick URL...</option>
                    {DEFAULT_URLS.map((u) => (
                      <option value={u}>{u.replace('https://convert.gudmud.site', '')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleGooglePublish(targetUrl)}
                  class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
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

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleBatchPublish}
                  class="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs sm:text-sm hover:bg-indigo-100 disabled:opacity-50 transition border border-indigo-200 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Batch Publish Top 12 Pages
                </button>
              </div>
            </div>
          </div>

          {/* Batch Progress List */}
          {batchResults.length > 0 && (
            <div class="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
              <h3 class="text-sm font-bold text-gray-900 mb-3">Batch Submission Progress ({batchResults.length}/{DEFAULT_URLS.length})</h3>
              <div class="space-y-1.5 max-h-60 overflow-y-auto">
                {batchResults.map((item) => (
                  <div class="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <span class="font-mono text-gray-700 truncate max-w-md">{item.url}</span>
                    <span class={`font-bold px-2 py-0.5 rounded text-2xs ${item.status === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Live API Response Console */}
          <div class="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-lg">
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

            {/* Smart Status Interpretation */}
            {lastStatusCode === 200 && (
              <div class="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300">
                <strong>✓ SUCCESS:</strong> Google Indexing API successfully processed the notification! Googlebot has been notified to crawl and update this URL.
              </div>
            )}

            {lastStatusCode === 403 && (
              <div class="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <strong>⚠️ 403 Permission Denied:</strong>
                <div>1. Ensure the <strong>Indexing API</strong> is enabled in your Google Cloud Project (<code class="text-amber-300 font-mono">{googleOAuthConfig.projectId}</code>).</div>
                <div>2. Ensure the signed-in Google account is an <strong>Owner</strong> of <code class="text-amber-300 font-mono">https://convert.gudmud.site</code> in Google Search Console.</div>
              </div>
            )}

            {lastStatusCode === 401 && (
              <div class="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300">
                <strong>⚠️ 401 Unauthorized:</strong> Your OAuth token has expired or is invalid. Click "Sign In with Google" above to refresh your token.
              </div>
            )}

            <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 font-mono text-xs overflow-x-auto text-emerald-400 min-h-[140px]">
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
          <div class="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <h2 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-black">1</span>
              IndexNow Protocol (Bing, Yandex, Seznam)
            </h2>
            <p class="text-xs sm:text-sm text-gray-600 mb-4">
              IndexNow allows websites to immediately inform search engines about their latest content changes. A single notification to IndexNow simultaneously notifies Bing, Yandex, and participating search engines.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                <div class="text-gray-500 font-semibold mb-1">Host Domain</div>
                <div class="font-mono font-bold text-gray-900">convert.gudmud.site</div>
              </div>
              <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                <div class="text-gray-500 font-semibold mb-1">IndexNow Key Location</div>
                <a
                  href="https://convert.gudmud.site/fbfbc05b9070df2dcd6684c6d12c7a0b.txt"
                  target="_blank"
                  class="font-mono text-emerald-600 hover:underline break-all"
                >
                  https://convert.gudmud.site/fbfbc05b9070df2dcd6684c6d12c7a0b.txt
                </a>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">
                  URL to Ping:
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onInput={(e: any) => setTargetUrl(e.target.value)}
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleIndexNowPublish}
                class="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs sm:text-sm hover:bg-sky-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ping IndexNow (api.indexnow.org)
              </button>
            </div>
          </div>

          {/* Response Console */}
          <div class="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-white">IndexNow Response</h3>
              {lastStatusCode !== null && (
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-sky-500 text-slate-950">
                  HTTP {lastStatusCode} {lastStatusCode === 200 ? 'OK' : lastStatusCode === 202 ? 'Accepted' : ''}
                </span>
              )}
            </div>

            <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 font-mono text-xs text-sky-400">
              {isLoading ? (
                <div class="text-slate-400 animate-pulse">Pinging IndexNow endpoint...</div>
              ) : responseJson ? (
                <pre>{JSON.stringify(responseJson, null, 2)}</pre>
              ) : (
                <div class="text-slate-500 italic">No request dispatched yet. Click "Ping IndexNow".</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Setup & Troubleshooting Guide */}
      {activeTab === 'overview' && (
        <div class="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-6 text-sm text-gray-700 leading-relaxed">
          <h2 class="text-xl font-bold text-gray-900">How to Verify &amp; Configure Google Instant Indexing</h2>

          <div class="space-y-4">
            <h3 class="text-base font-bold text-gray-900">1. Required Google Cloud Setup:</h3>
            <ol class="list-decimal pl-5 space-y-2">
              <li>Open the <a href="https://console.cloud.google.com/apis/library/indexing.googleapis.com?project=precise-space-365809" target="_blank" class="text-emerald-600 font-bold hover:underline">Google Cloud Console Indexing API Library</a> for project <code class="px-1.5 py-0.5 rounded bg-gray-100 font-mono">precise-space-365809</code>.</li>
              <li>Click <strong>Enable</strong> if not already enabled.</li>
              <li>Under <strong>APIs &amp; Services &gt; Credentials</strong>, your Web Client ID (<code class="px-1.5 py-0.5 rounded bg-gray-100 font-mono">{googleOAuthConfig.clientId.slice(0, 25)}...</code>) is configured with Authorized JavaScript Origin: <code class="px-1.5 py-0.5 rounded bg-gray-100 font-mono">https://convert.gudmud.site</code>.</li>
            </ol>

            <h3 class="text-base font-bold text-gray-900 mt-6">2. Required Google Search Console Setup:</h3>
            <ol class="list-decimal pl-5 space-y-2">
              <li>Go to <a href="https://search.google.com/search-console" target="_blank" class="text-emerald-600 font-bold hover:underline">Google Search Console</a>.</li>
              <li>Ensure the property for <code class="px-1.5 py-0.5 rounded bg-gray-100 font-mono">https://convert.gudmud.site/</code> is verified.</li>
              <li>Under <strong>Settings &gt; Users and permissions</strong>, ensure your Google email account has <strong>Owner</strong> permissions.</li>
            </ol>

            <h3 class="text-base font-bold text-gray-900 mt-6">3. Command-Line Execution (CLI):</h3>
            <p>You can also dispatch IndexNow or Google Indexing notifications from your terminal or CI/CD pipelines:</p>
            <div class="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
              pnpm exec tsx scripts/indexnow.ts
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
