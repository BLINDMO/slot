<script lang="ts">
  // Purely decorative animated backdrop rendered behind the app: slow-drifting
  // neon blobs over deep space, with a faint star field. GPU transforms only.
</script>

<div class="aurora" aria-hidden="true">
  <span class="blob b1"></span>
  <span class="blob b2"></span>
  <span class="blob b3"></span>
  <div class="stars"></div>
  <div class="vignette"></div>
</div>

<style>
  .aurora {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background:
      radial-gradient(120% 90% at 50% -20%, #181232 0%, transparent 55%),
      #07060f;
  }
  .blob {
    position: absolute;
    width: 70vmax;
    height: 70vmax;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.5;
    mix-blend-mode: screen;
    will-change: transform;
  }
  .b1 {
    background: radial-gradient(circle, rgba(46, 230, 255, 0.55), transparent 62%);
    top: -25vmax;
    left: -20vmax;
    animation: drift1 22s ease-in-out infinite;
  }
  .b2 {
    background: radial-gradient(circle, rgba(139, 92, 246, 0.6), transparent 62%);
    bottom: -28vmax;
    right: -22vmax;
    animation: drift2 26s ease-in-out infinite;
  }
  .b3 {
    background: radial-gradient(circle, rgba(255, 61, 154, 0.42), transparent 62%);
    top: 30%;
    left: 30%;
    width: 55vmax;
    height: 55vmax;
    animation: drift3 30s ease-in-out infinite;
  }
  .stars {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(1.2px 1.2px at 20% 30%, rgba(255, 255, 255, 0.7), transparent),
      radial-gradient(1px 1px at 70% 20%, rgba(255, 255, 255, 0.5), transparent),
      radial-gradient(1.4px 1.4px at 40% 70%, rgba(255, 255, 255, 0.6), transparent),
      radial-gradient(1px 1px at 85% 60%, rgba(255, 255, 255, 0.45), transparent),
      radial-gradient(1px 1px at 60% 85%, rgba(255, 255, 255, 0.5), transparent),
      radial-gradient(1.2px 1.2px at 10% 80%, rgba(255, 255, 255, 0.5), transparent),
      radial-gradient(1px 1px at 90% 35%, rgba(255, 255, 255, 0.4), transparent);
    opacity: 0.5;
    animation: twinkle 5s ease-in-out infinite alternate;
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(130% 120% at 50% 40%, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
  }

  @keyframes drift1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(14vmax, 10vmax) scale(1.15); }
  }
  @keyframes drift2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-12vmax, -8vmax) scale(1.1); }
  }
  @keyframes drift3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-10vmax, 12vmax) scale(0.9); }
  }
  @keyframes twinkle {
    from { opacity: 0.3; }
    to { opacity: 0.6; }
  }
  @media (prefers-reduced-motion: reduce) {
    .blob, .stars { animation: none; }
  }
</style>
