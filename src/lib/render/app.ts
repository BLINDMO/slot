import { Application } from 'pixi.js';

/**
 * A single, shared PixiJS Application reused across every game screen.
 *
 * iOS Safari hard-limits the number of live WebGL contexts; creating a fresh
 * Application each time the player opens a game (and not always tearing the old
 * one down in time) exhausts that limit and crashes the page after a few
 * switches. Borrowing one long-lived context and just swapping what's on its
 * stage avoids the problem entirely.
 */
let appPromise: Promise<Application> | null = null;

export function getSharedApp(): Promise<Application> {
  if (!appPromise) {
    const app = new Application();
    appPromise = app
      .init({
        width: 360,
        height: 360,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2),
        autoDensity: true,
        // Helps Safari reclaim memory between screens.
        powerPreference: 'high-performance'
      })
      .then(() => app);
  }
  return appPromise;
}
