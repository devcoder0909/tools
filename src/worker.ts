interface Env {
  ASSETS: {
    fetch: typeof fetch;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 301 Permanent Redirect for any traffic hitting workers.dev or old domain
    if (url.hostname.endsWith('workers.dev') || url.hostname === 'app.gudmud.in') {
      const canonicalTarget = `https://convert.gudmud.site${url.pathname}${url.search}`;
      return Response.redirect(canonicalTarget, 301);
    }

    return env.ASSETS.fetch(request);
  },
};

