export function ProgressBar() {
  return `<div id="progress-container">
      <div id="progress-fill"></div>
      <div class="boss-marker" style="left: 25%"></div>
      <div class="boss-marker" style="left: 50%"></div>
      <div class="boss-marker" style="left: 75%"></div>
      <div class="boss-marker" style="left: 100%; width: 8px; background: #ff0000;"></div>
      <div id="progress-label">SYSTEM INTEGRITY PROTOCOL</div>
    </div>`;
}
