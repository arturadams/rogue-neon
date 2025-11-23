export function ControlsPanel() {
  return `<div id="speed-controls" class="hud-panel">
      <button class="speed-btn active" data-speed="1">1x</button>
      <button class="speed-btn" data-speed="2">2x</button>
      <button class="speed-btn" data-speed="3">3x</button>
    </div>
    <button id="data-btn" class="hud-panel">STATUS / PAUSE</button>`;
}
