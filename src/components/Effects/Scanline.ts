let scanlineEl: HTMLElement | null = null;

/**
 * Initializes the scanline overlay element from the DOM. If the expected element is
 * missing (for example in tests), it will be created and appended to the document
 * body so the effect can still run.
 */
export function initScanline(): void {
  scanlineEl = document.getElementById("scanline");
  if (!scanlineEl) {
    scanlineEl = document.createElement("div");
    scanlineEl.id = "scanline";
    document.body.prepend(scanlineEl);
  }
}

/**
 * Lightly animates the scanline overlay opacity to mimic the subtle flicker from the
 * original static overlay. Call this from the main game loop with the current time
 * (e.g. performance.now()).
 */
export function updateScanline(timeMs: number): void {
  if (!scanlineEl) return;

  const flicker = 0.3 + Math.sin(timeMs * 0.002) * 0.05;
  scanlineEl.style.opacity = flicker.toFixed(3);
}
