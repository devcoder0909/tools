/** Compatibility entry point used by the existing post-deployment workflow. */
console.log('[Google] Tool pages are not eligible for the Google Indexing API.');
console.log('[Google] Submit https://zixtool.online/sitemap-index.xml in Search Console; use URL Inspection for selected updates.');
console.log('[Google] https://developers.google.com/search/apis/indexing-api/v3/quickstart');
const args = process.argv.slice(2);
if (args.some((arg) => ['--status', '--continuous', '--watch', '--url', '--interval'].includes(arg))) {
  console.error('Notification metadata is not indexing status. Repeated loops and single tool URL submissions are unsupported.');
  process.exitCode = 1;
} else {
  if (!args.includes('--dry-run')) process.argv.push('--submit');
  await import('./indexnow');
}
export {};
