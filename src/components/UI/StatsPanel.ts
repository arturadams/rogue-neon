export function StatsPanel() {
  return `
        <div id="stats-panel" class="hud-panel" style="display:none;">
            <div class="stat-row">
                <div class="stat-meta">
                    <span class="stat-icon stat-icon-hp">⛨</span>
                    <div class="stat-copy">
                        <div class="stat-eyebrow">CORE STATUS</div>
                        <div class="stat-title">INTEGRITY</div>
                    </div>
                </div>
                <div class="stat-value" id="hp-text">100/100</div>
            </div>
            <div class="bar-container hp-track"><div id="hp-bar" class="bar-fill"></div></div>
            <div class="stat-row">
                <div class="stat-meta">
                    <span class="stat-icon stat-icon-xp">✦</span>
                    <div class="stat-copy">
                        <div class="stat-eyebrow">SYNC PROGRESSION</div>
                        <div class="stat-title">LEVEL</div>
                    </div>
                </div>
                <div class="level-chip">LVL <span id="lvl-text">1</span></div>
            </div>
            <div class="bar-container xp-track"><div id="xp-bar" class="bar-fill" style="width: 0%"></div></div>
            <div class="resource-row">
                <div class="resource-card wave-card">
                    <div class="resource-icon">〰</div>
                    <div class="resource-copy">
                        <div class="resource-label">WAVE</div>
                        <div class="resource-value"><span id="wave-text">1</span><span class="resource-divider">/</span><span id="max-wave-text">20</span></div>
                    </div>
                </div>
                <div class="resource-card gold-card">
                    <div class="resource-icon">◆</div>
                    <div class="resource-copy">
                        <div class="resource-label">GOLD</div>
                        <div class="resource-value" id="gold-text">0</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
