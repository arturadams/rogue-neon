export function GameOverModal() {
  return `
        <div id="gameover-modal" class="modal">
            <h2 id="go-title" style="color: #ff0055">SYSTEM FAILURE</h2>
            <p style="color: white; font-size: 24px;">WAVES SURVIVED: <span id="final-wave" style="color: #00ffff">0</span></p>
            <p style="color: white; font-size: 18px;">LEVEL ATTAINED: <span id="final-level" style="color: #00ffff">1</span></p>
            <p style="color: white; font-size: 18px;">CREDITS COLLECTED: <span id="final-gold" style="color: #00ffff">0</span></p>
            <button id="reboot-btn" class="btn">REBOOT</button>
        </div>
    `;
}
