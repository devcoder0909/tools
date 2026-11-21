# Canonical host redirect fix

In the Cloudflare dashboard, select **zixtool.online**, then **Rules → Redirect Rules → Create rule → Single Redirect**.

Name: `Canonical HTTPS apex`

Select **Custom filter expression**, then paste:

```text
(http.host eq "www.zixtool.online") or (http.host eq "zixtool.online" and not ssl)
```

For the URL redirect, choose **Dynamic** and paste this target expression:

```text
concat("https://zixtool.online", http.request.uri.path)
```

Set status to **301**, enable **Preserve query string**, and put this rule first among Single Redirect rules. Save and deploy. This redirects both HTTP apex requests and www requests to HTTPS apex while retaining paths and query strings. It excludes canonical HTTPS requests to avoid a loop.

Under **DNS → Records**, confirm that the existing `www` record is **Proxied** (orange cloud). Do not add a duplicate DNS record. Single Redirects run at Cloudflare's edge before contacting the origin, so the redirect can resolve an origin-related www 522 without moving the website. If the record is absent, create a proxied CNAME named `www` targeting `zixtool.online`. Keep the working apex hosting record unchanged.

Verify these requests with redirects disabled:

| Request | Expected |
| --- | --- |
| `http://zixtool.online/merge-pdf/?source=test` | 301 to `https://zixtool.online/merge-pdf/?source=test` |
| `https://www.zixtool.online/merge-pdf/?source=test` | Same 301 destination |
| `http://www.zixtool.online/merge-pdf/?source=test` | Same 301 destination |
| `https://zixtool.online/merge-pdf/?source=test` | 200, no redirect |

The repository's Workers configuration now sets `assets.run_worker_first: true` so its existing redirect handler runs before static assets. This affects Workers deployments and causes requests to invoke the Worker. The Pages deployment workflow does not use this Worker handler: the dashboard rule is the production fix for both hosting paths. No Cloudflare dashboard changes have been applied by the coding agent.

References: [Cloudflare Single Redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/), [Worker routing before static assets](https://developers.cloudflare.com/workers/static-assets/binding/).
