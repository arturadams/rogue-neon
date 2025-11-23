import { GameState } from "../Game/GameState";

function setText(id: string, value: string | number) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function setWidth(id: string, percentage: number) {
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) el.style.width = `${Math.min(100, Math.max(0, percentage * 100))}%`;
}

export class UIController {
  constructor(private gameState: GameState) {}

  initialize() {
    this.bindControls();
    this.gameState.on("state", () => this.render());
    this.gameState.on("item", () => this.render());
    this.gameState.on("levelUp", () => this.render());
    this.render();
  }

  private bindControls() {
    const speedButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".speed-btn"));
    speedButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const speed = Number(btn.dataset.speed ?? btn.textContent?.replace("x", ""));
        if (!Number.isFinite(speed)) return;
        speedButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.gameState.setSpeed(speed);
      });
    });

    const pauseBtn = document.getElementById("data-btn");
    pauseBtn?.addEventListener("click", () => this.gameState.togglePause());
  }

  render() {
    const hud = this.gameState.getHudState();
    setText("hp-text", `${hud.hp}/${hud.maxHp}`);
    setText("lvl-text", hud.level);
    setText("wave-text", hud.wave);
    setText("max-wave-text", hud.maxWave);
    setText("gold-text", hud.gold);
    setWidth("hp-bar", hud.hp / hud.maxHp);
    setWidth("xp-bar", hud.xp / hud.maxXp);
    const progress = document.getElementById("progress-fill");
    if (progress instanceof HTMLElement) {
      progress.style.width = `${hud.progress * 100}%`;
      progress.classList.toggle("paused", hud.isPaused);
    }
  }
}
