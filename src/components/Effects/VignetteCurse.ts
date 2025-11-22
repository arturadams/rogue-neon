let vignetteEl: HTMLElement | null = null;
let active = false;

/**
 * Prepare the vignette overlay that signals curse-related states. If the element is
 * missing from the DOM scaffold, it is created to avoid runtime errors.
 */
export function initVignetteCurse(): void {
  vignetteEl = document.getElementById("vignette-curse");
  if (!vignetteEl) {
    vignetteEl = document.createElement("div");
    vignetteEl.id = "vignette-curse";
    document.body.prepend(vignetteEl);
  }
  updateVignetteCurse(false);
}

/**
 * Toggle the vignette overlay on or off.
 */
export function setVignetteCurseActive(enabled: boolean): void {
  active = enabled;
  updateVignetteCurse(active);
}

/**
 * Update hook for the main loop. If a curse level is provided, the overlay is enabled
 * when the level is greater than zero. Otherwise, the last explicit toggle state is
 * used.
 */
export function updateVignetteCurse(curseLevel?: number | boolean): void {
  if (!vignetteEl) return;

  const shouldShow = typeof curseLevel === "number" ? curseLevel > 0 : !!curseLevel;
  active = shouldShow;
  vignetteEl.style.display = shouldShow ? "block" : "none";
}

/**
 * Query whether the vignette is currently active.
 */
export function isVignetteCurseActive(): boolean {
  return active;
}
