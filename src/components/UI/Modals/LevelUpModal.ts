export function LevelUpModal() {
  return `
        <div id="levelup-modal" class="modal">
            <h2 id="levelup-title">SYSTEM UPGRADE</h2>
            <div style="color: #888; font-size: 12px;">SELECT A PROTOCOL TO INSTALL</div>
            <div class="card-container" id="upgrade-cards"></div>
            <div class="reroll-container">
                <button class="reroll-btn" id="reroll-btn">REROLL (2)</button>
            </div>
        </div>
    `;
}
