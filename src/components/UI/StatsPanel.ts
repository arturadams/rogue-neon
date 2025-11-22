export function StatsPanel() {
  return `
        <div id="stats-panel" class="hud-panel" style="display:none;">
            <div class="stat-label"><span>INTEGRITY</span> <span id="hp-text">100/100</span></div>
            <div class="bar-container"><div id="hp-bar" class="bar-fill"></div></div>
            <div class="stat-label"><span>SYNC LEVEL <span id="lvl-text" style="color: #ffee00">1</span></span></div>
            <div class="bar-container"><div id="xp-bar" class="bar-fill" style="width: 0%"></div></div>
            <div style="font-size: 12px; color: #888;">WAVE: <span id="wave-text" style="color: white">1</span> / <span id="max-wave-text">20</span></div>
            <div style="font-size: 12px; color: #ffd700; margin-top:4px;">GOLD: <span id="gold-text">0</span></div>
        </div>
    `;
}
