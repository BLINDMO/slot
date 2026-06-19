import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
  loadBalance,
  saveBalance,
  loadSettings,
  saveSettings,
  bumpSessions,
  type Settings
} from './db';

export const balance = writable<number>(0);
export const settings = writable<Settings>({
  soundOn: true,
  adminPin: null,
  installPromptSeen: false
});
/** Current bet in credits. */
export const bet = writable<number>(10);
export const BET_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500];

let initialized = false;

/** Hydrate stores from IndexedDB. Safe to call repeatedly. */
export async function initState(): Promise<void> {
  if (!browser || initialized) return;
  initialized = true;
  balance.set(await loadBalance());
  settings.set(await loadSettings());
  await bumpSessions();

  // Persist balance changes back to disk.
  balance.subscribe((b) => {
    if (initialized) void saveBalance(b);
  });
  settings.subscribe((s) => {
    if (initialized) void saveSettings(s);
  });
}
