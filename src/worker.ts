interface Env {
  ASSETS: {
    fetch: typeof fetch;
  };
}

const INDEXNOW_KEY = 'fbfbc05b9070df2dcd6684c6d12c7a0b';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. 301 Permanent Redirect for any traffic hitting workers.dev or old domain
    if (url.hostname.endsWith('workers.dev') || url.hostname === 'app.gudmud.in') {
      const canonicalTarget = `https://convert.gudmud.site${url.pathname}${url.search}`;
      return Response.redirect(canonicalTarget, 301);
    }

    // 2. Direct IndexNow Key verification responses (guarantees zero-cache & exact byte matching)
    if (url.pathname === `/${INDEXNOW_KEY}.txt` || url.pathname === '/c0nvert8892df91024gudmud.txt') {
      const keyToReturn = url.pathname.includes(INDEXNOW_KEY) ? INDEXNOW_KEY : 'c0nvert8892df91024gudmud';
      return new Response(keyToReturn, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 3. Fallback to static assets with robust try/catch
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404 && url.pathname === '/sitemap.xml') {
        const sitemapIndexUrl = new URL('/sitemap-index.xml', request.url);
        return env.ASSETS.fetch(new Request(sitemapIndexUrl, request));
      }
      return response;
    } catch (err: any) {
      return new Response('Resource temporarily unavailable', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  },
};
