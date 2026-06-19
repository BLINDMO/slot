<script lang="ts">
  import { settings } from '$store/state';

  // iOS Safari has no beforeinstallprompt — the only install path is the manual
  // Share → "Add to Home Screen" flow, which most users never discover. Show a
  // one-time hint, and only when not already running standalone and on iOS.
  function isIos(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }
  function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    );
  }

  const show = $derived(!$settings.installPromptSeen && isIos() && !isStandalone());

  function dismiss() {
    settings.update((s) => ({ ...s, installPromptSeen: true }));
  }
</script>

{#if show}
  <div class="install">
    <div class="text">
      <strong>Install Slot Hub</strong>
      <span class="muted small">
        Tap the Share icon <span class="icon">􀈂</span> in Safari, then “Add to Home Screen” for a
        full-screen, offline-capable app.
      </span>
    </div>
    <button class="btn" onclick={dismiss}>Got it</button>
  </div>
{/if}

<style>
  .install {
    margin: 0 1rem 0.4rem;
    background: var(--panel);
    border: 1px solid var(--accent);
    border-radius: 14px;
    padding: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .small {
    font-size: 0.74rem;
    line-height: 1.35;
  }
  .icon {
    font-family: -apple-system, system-ui;
  }
  .btn {
    white-space: nowrap;
  }
</style>
