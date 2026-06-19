// The hub is a client-side game; render it as an SPA (no SSR), and prerender the
// shell so it can be served as static files / cached by the service worker.
export const ssr = false;
export const prerender = false;
export const trailingSlash = 'ignore';
