// On the first tap, go fullscreen and lock to landscape. Browsers only allow
// fullscreen and orientation-lock from a real user gesture, so this cannot run
// on page load — the first touch triggers it. If the user later drops out of
// fullscreen, the next tap re-enters and re-locks.
//
// Works fully on Android Chrome (the target). iOS Safari ignores both calls
// (unsupported); the try/catch keeps that harmless.
export function installFullscreenLock(): void {
  const enter = async (): Promise<void> => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      /* fullscreen not allowed on this device/browser — ignore */
    }
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      await orientation.lock?.('landscape');
    } catch {
      /* orientation lock not supported (e.g. iOS) — ignore */
    }
  };

  window.addEventListener('pointerdown', () => {
    if (!document.fullscreenElement) {
      void enter();
    }
  });
}
