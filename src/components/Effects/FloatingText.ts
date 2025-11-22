import * as THREE from "three";

type FloatingTextInstance = {
  element: HTMLDivElement;
  position: THREE.Vector3;
  remaining: number;
};

let camera: THREE.Camera | null = null;
let container: HTMLElement | null = null;
const activeTexts: FloatingTextInstance[] = [];

/**
 * Initialize floating text handling. Call this once after the camera is available.
 */
export function initFloatingText(threeCamera: THREE.Camera): void {
  camera = threeCamera;
  const uiLayer = document.getElementById("ui-layer");
  container = (uiLayer as HTMLElement) || document.body;
}

/**
 * Create a floating damage text at the given world position. The element will be
 * animated via CSS and removed automatically once its lifetime elapses.
 */
export function spawnFloatingText(
  text: string,
  worldPosition: THREE.Vector3,
  color: THREE.ColorRepresentation,
  isCritical = false,
  lifetimeMs = 800
): void {
  if (!camera) return;

  const element = document.createElement("div");
  element.className = isCritical ? "floating-text dmg-crit" : "floating-text dmg-norm";
  element.innerText = text;
  element.style.color = `#${new THREE.Color(color).getHexString()}`;
  (container ?? document.body).appendChild(element);

  activeTexts.push({
    element,
    position: worldPosition.clone(),
    remaining: lifetimeMs,
  });

  // Position immediately so the element doesn't pop in at the top-left corner.
  updateFloatingText(0);
}

/**
 * Update positions and cleanup for active floating texts. Call this from the main
 * loop with the delta time between frames.
 */
export function updateFloatingText(deltaMs: number): void {
  if (!camera) return;

  for (let i = activeTexts.length - 1; i >= 0; i -= 1) {
    const text = activeTexts[i];
    text.remaining -= deltaMs;

    const screenPos = text.position.clone().project(camera);
    const left = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const top = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    text.element.style.left = `${left}px`;
    text.element.style.top = `${top}px`;

    if (text.remaining <= 0) {
      text.element.remove();
      activeTexts.splice(i, 1);
    }
  }
}
