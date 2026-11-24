// Uploaded product images are stored as relative paths (/media/products/*.webp) and
// served by commercial-service behind the gateway. next.config.ts rewrites /media/* to
// the gateway, so a RELATIVE /media/... path is same-origin from the browser's view —
// which is what next/image needs (an absolute gateway URL would be an un-whitelisted
// remote host). External (http/https) and local static assets are returned unchanged.
export function mediaUrl(url: string): string {
  if (!url) return url;
  // /media/... is already same-origin via the rewrite — return as-is.
  return url;
}
