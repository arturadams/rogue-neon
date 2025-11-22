export function ControlsPanel() {
  return `
    <div id="controls-panel" class="hud-panel" style="top: 20px; right: 20px; display: flex; gap: 8px; align-items: center;">
      <button id="start-btn" class="speed-btn">START</button>
      <button id="pause-btn" class="speed-btn">PAUSE</button>
      <button id="database-btn" class="speed-btn">DATABASE</button>
    </div>
    <div id="speed-controls" class="hud-panel">
      <button class="speed-btn active" data-speed="1">1x</button>
      <button class="speed-btn" data-speed="1.5">1.5x</button>
      <button class="speed-btn" data-speed="2">2x</button>
    </div>
  `;
}
