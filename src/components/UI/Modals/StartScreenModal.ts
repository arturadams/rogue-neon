export function StartScreenModal() {
  return `
        <div id="start-screen" class="modal start-screen">
            <div class="start-backdrop"></div>
            <div class="start-grid"></div>
            <div class="start-glow"></div>
            <div class="start-frame">
                <div class="start-header">
                    <div class="start-pill">NEON PROTOCOL</div>
                    <h1 class="game-title"><span>ROGUE</span> NEON</h1>
                    <p class="game-tagline">Survive the synthwave onslaught.</p>
                </div>
                <div class="start-body">
                    <div class="start-accent start-accent-left"></div>
                    <div class="start-copy">
                        <p class="start-subtitle">Arcade roguelite. Procedural arenas. Endless waves.</p>
                        <div class="start-badges">
                            <span class="start-badge">SYNTHWAVE</span>
                            <span class="start-badge">BULLET HELL</span>
                            <span class="start-badge">DATABASE</span>
                        </div>
                    </div>
                    <div class="start-accent start-accent-right"></div>
                </div>
                <div class="menu-actions">
                    <button id="start-game-btn" class="btn neon-btn">START RUN</button>
                    <button id="menu-database-btn" class="btn neon-btn ghost-btn">DATABASE</button>
                </div>
            </div>
        </div>
    `;
}
