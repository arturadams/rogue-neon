import { GameState, HudState } from "../Game/GameState";
import { Weapon, Item } from "../../types";
import { WEAPONS } from "../Game/Weapons";
import { ITEMS } from "../Game/Items";

interface UIElements {
  statsPanel: HTMLElement | null;
  spellDock: HTMLElement | null;
  inventoryPanel: HTMLElement | null;
  startScreen: HTMLElement | null;
  startScreenStart: HTMLButtonElement | null;
  startScreenDatabase: HTMLButtonElement | null;
  startBtn: HTMLButtonElement | null;
  pauseBtn: HTMLButtonElement | null;
  databaseBtn: HTMLButtonElement | null;
  databaseModal: HTMLElement | null;
  databaseClose: HTMLButtonElement | null;
  databaseContent: HTMLElement | null;
  starterModal: HTMLElement | null;
  starterCards: HTMLElement | null;
  levelUpModal: HTMLElement | null;
  upgradeCards: HTMLElement | null;
  rerollBtn: HTMLButtonElement | null;
  itemModal: HTMLElement | null;
  itemTitle: HTMLElement | null;
  itemRarity: HTMLElement | null;
  itemDesc: HTMLElement | null;
  itemIcon: HTMLElement | null;
  itemIntegrate: HTMLButtonElement | null;
  hpText: HTMLElement | null;
  hpBar: HTMLElement | null;
  xpBar: HTMLElement | null;
  lvlText: HTMLElement | null;
  waveText: HTMLElement | null;
  maxWaveText: HTMLElement | null;
  goldText: HTMLElement | null;
  progressFill: HTMLElement | null;
  speedButtons: NodeListOf<HTMLButtonElement> | null;
}

function createCardMarkup(choice: Weapon): string {
  return `
    <div class="upgrade-card" data-id="${choice.id}">
      <div class="spell-icon">${choice.icon}</div>
      <div style="font-weight: bold;">${choice.name}</div>
      <div style="font-size: 12px; color: #888;">${choice.type} / ${choice.scaling}</div>
      <div style="font-size: 12px;">${choice.desc}</div>
    </div>
  `;
}

export class UIController {
  private ui: UIElements = {
    statsPanel: null,
    spellDock: null,
    inventoryPanel: null,
    startScreen: null,
    startScreenStart: null,
    startScreenDatabase: null,
    startBtn: null,
    pauseBtn: null,
    databaseBtn: null,
    databaseModal: null,
    databaseClose: null,
    databaseContent: null,
    starterModal: null,
    starterCards: null,
    levelUpModal: null,
    upgradeCards: null,
    rerollBtn: null,
    itemModal: null,
    itemTitle: null,
    itemRarity: null,
    itemDesc: null,
    itemIcon: null,
    itemIntegrate: null,
    hpText: null,
    hpBar: null,
    xpBar: null,
    lvlText: null,
    waveText: null,
    maxWaveText: null,
    goldText: null,
    progressFill: null,
    speedButtons: null,
  };

  constructor(private gameState: GameState) {}

  initialize(): void {
    this.cacheElements();
    this.bindControls();
    this.bindGameEvents();
    this.renderStarterChoices(this.gameState.getStarterChoices());
    this.renderLevelUpChoices(this.gameState.getLevelChoices());
    this.populateDatabase();
    this.updateHUD(this.gameState.getHudState());
    this.showStartScreen();
  }

  private cacheElements(): void {
    this.ui = {
      statsPanel: document.getElementById("stats-panel"),
      spellDock: document.getElementById("spell-dock"),
      inventoryPanel: document.getElementById("inventory-panel"),
      startScreen: document.getElementById("start-screen"),
      startScreenStart: document.getElementById(
        "start-game-btn"
      ) as HTMLButtonElement | null,
      startScreenDatabase: document.getElementById(
        "menu-database-btn"
      ) as HTMLButtonElement | null,
      startBtn: document.getElementById("start-btn") as HTMLButtonElement | null,
      pauseBtn: document.getElementById("pause-btn") as HTMLButtonElement | null,
      databaseBtn: document.getElementById("database-btn") as HTMLButtonElement | null,
      databaseModal: document.getElementById("database-modal"),
      databaseClose: document
        .querySelector("#database-modal button") as HTMLButtonElement | null,
      databaseContent: document.getElementById("db-content"),
      starterModal: document.getElementById("starter-modal"),
      starterCards: document.getElementById("starter-cards"),
      levelUpModal: document.getElementById("levelup-modal"),
      upgradeCards: document.getElementById("upgrade-cards"),
      rerollBtn: document.getElementById("reroll-btn") as HTMLButtonElement | null,
      itemModal: document.getElementById("item-modal"),
      itemTitle: document.getElementById("item-title"),
      itemRarity: document.getElementById("item-rarity"),
      itemDesc: document.getElementById("item-desc"),
      itemIcon: document.getElementById("item-icon-display"),
      itemIntegrate: document.querySelector("#item-modal .btn") as HTMLButtonElement | null,
      hpText: document.getElementById("hp-text"),
      hpBar: document.getElementById("hp-bar"),
      xpBar: document.getElementById("xp-bar"),
      lvlText: document.getElementById("lvl-text"),
      waveText: document.getElementById("wave-text"),
      maxWaveText: document.getElementById("max-wave-text"),
      goldText: document.getElementById("gold-text"),
      progressFill: document.getElementById("progress-fill"),
      speedButtons: document.querySelectorAll<HTMLButtonElement>("#speed-controls .speed-btn"),
    };
  }

  private bindControls(): void {
    this.ui.startBtn?.addEventListener("click", () => {
      if (!this.gameState.hasActiveWeapon()) {
        this.showStartScreen();
        return;
      }
      this.showHudPanels();
      if (this.gameState.getHudState().isPaused) {
        this.gameState.togglePause();
      } else {
        this.gameState.startGame();
      }
      this.hideStarterModal();
    });

    this.ui.startScreenStart?.addEventListener("click", () => {
      this.hideStartScreen();
      this.showStarterModal();
    });

    this.ui.startScreenDatabase?.addEventListener("click", () => {
      this.openDatabase();
    });

    this.ui.pauseBtn?.addEventListener("click", () => {
      this.gameState.togglePause();
    });

    this.ui.databaseBtn?.addEventListener("click", () => {
      this.openDatabase();
    });

    this.ui.databaseClose?.addEventListener("click", () => {
      this.closeDatabase();
    });

    this.ui.rerollBtn?.addEventListener("click", () => {
      this.gameState.rerollLevelUp();
    });

    this.ui.itemIntegrate?.addEventListener("click", () => {
      this.hideItemModal();
    });

    this.ui.speedButtons?.forEach((btn) => {
      btn.addEventListener("click", () => {
        const speed = Number(btn.dataset.speed ?? "1");
        this.gameState.setSpeed(speed);
        this.markSpeedActive(speed);
      });
    });
  }

  private bindGameEvents(): void {
    this.gameState.on("hud", (hud) => this.updateHUD(hud));
    this.gameState.on("starter", (choices) => this.renderStarterChoices(choices));
    this.gameState.on("levelUp", (choices) => this.renderLevelUpChoices(choices));
    this.gameState.on("item", (item) => this.showItemModal(item));
    this.gameState.on("state", (state) => this.updateRunButtons(state.isPaused));
    this.gameState.on("speed", (speed) => this.markSpeedActive(speed));
  }

  private showHudPanels(): void {
    if (this.ui.statsPanel) this.ui.statsPanel.style.display = "block";
    if (this.ui.spellDock) this.ui.spellDock.style.display = "flex";
    if (this.ui.inventoryPanel) this.ui.inventoryPanel.style.display = "block";
  }

  private updateRunButtons(isPaused: boolean): void {
    if (this.ui.startBtn) {
      this.ui.startBtn.textContent = isPaused ? "RESUME" : "START";
    }
    if (this.ui.pauseBtn) {
      this.ui.pauseBtn.textContent = isPaused ? "UNPAUSE" : "PAUSE";
    }
  }

  private renderStarterChoices(choices: Weapon[]): void {
    if (!this.ui.starterCards) return;
    this.ui.starterCards.innerHTML = choices.map((choice) => createCardMarkup(choice)).join("");
    this.ui.starterCards.querySelectorAll<HTMLElement>(".upgrade-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        if (!id) return;
        this.gameState.selectStarterWeapon(id);
        this.showHudPanels();
        this.hideStartScreen();
        this.hideStarterModal();
        this.gameState.startGame();
      });
    });
  }

  private renderLevelUpChoices(choices: Weapon[]): void {
    if (!this.ui.upgradeCards || !this.ui.levelUpModal) return;
    if (!choices.length) {
      this.ui.levelUpModal.style.display = "none";
      return;
    }

    this.ui.upgradeCards.innerHTML = choices.map((choice) => createCardMarkup(choice)).join("");
    this.ui.levelUpModal.style.display = "block";
    this.ui.upgradeCards.querySelectorAll<HTMLElement>(".upgrade-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        if (!id) return;
        this.gameState.chooseLevelUp(id);
        this.ui.levelUpModal!.style.display = "none";
      });
    });

    if (this.ui.rerollBtn) {
      this.ui.rerollBtn.textContent = `REROLL (${this.gameState.getHudState().rerolls})`;
      this.ui.rerollBtn.disabled = this.gameState.getHudState().rerolls <= 0;
    }
  }

  private showItemModal(item: Item): void {
    if (!this.ui.itemModal) return;
    if (this.ui.itemTitle) this.ui.itemTitle.textContent = item.name;
    if (this.ui.itemDesc) this.ui.itemDesc.textContent = item.effect;
    if (this.ui.itemIcon) this.ui.itemIcon.textContent = item.icon;
    if (this.ui.itemRarity)
      this.ui.itemRarity.textContent = item.rarity.toUpperCase();
    this.ui.itemModal.style.display = "block";
  }

  private hideItemModal(): void {
    if (this.ui.itemModal) this.ui.itemModal.style.display = "none";
  }

  private showStartScreen(): void {
    if (this.ui.startScreen) this.ui.startScreen.style.display = "block";
  }

  private hideStartScreen(): void {
    if (this.ui.startScreen) this.ui.startScreen.style.display = "none";
  }

  private showStarterModal(): void {
    if (this.ui.starterModal) this.ui.starterModal.style.display = "block";
  }

  private hideStarterModal(): void {
    if (this.ui.starterModal) this.ui.starterModal.style.display = "none";
  }

  private openDatabase(): void {
    if (this.ui.databaseModal) this.ui.databaseModal.style.display = "block";
  }

  private closeDatabase(): void {
    if (this.ui.databaseModal) this.ui.databaseModal.style.display = "none";
  }

  private populateDatabase(): void {
    if (!this.ui.databaseContent) return;
    const weaponSection = `
      <div class="db-section">WEAPONS</div>
      ${WEAPONS.map(
        (weapon) => `
          <div class="db-item">
            <div class="db-name">${weapon.name}</div>
            <div class="db-desc">${weapon.desc}</div>
          </div>
        `
      ).join("")}
    `;

    const itemSection = `
      <div class="db-section">ITEMS</div>
      ${ITEMS.slice(0, 9)
        .map(
          (item) => `
          <div class="db-item">
            <div class="db-name">${item.icon} ${item.name}</div>
            <div class="db-desc">${item.effect}</div>
          </div>
        `
        )
        .join("")}
    `;

    this.ui.databaseContent.innerHTML = weaponSection + itemSection;
  }

  updateHUD(hud: HudState): void {
    const hpPercent = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
    const xpPercent = Math.max(0, Math.min(100, (hud.xp / hud.maxXp) * 100));

    if (this.ui.hpText) this.ui.hpText.textContent = `${hud.hp.toFixed(0)}/${hud.maxHp}`;
    if (this.ui.hpBar) (this.ui.hpBar as HTMLElement).style.width = `${hpPercent}%`;
    if (this.ui.xpBar) (this.ui.xpBar as HTMLElement).style.width = `${xpPercent}%`;
    if (this.ui.lvlText) this.ui.lvlText.textContent = `${hud.level}`;
    if (this.ui.goldText) this.ui.goldText.textContent = `${hud.gold}`;
    if (this.ui.waveText) this.ui.waveText.textContent = `${hud.wave}`;
    if (this.ui.maxWaveText) this.ui.maxWaveText.textContent = `${hud.maxWave}`;
    if (this.ui.progressFill)
      (this.ui.progressFill as HTMLElement).style.width = `${Math.min(100, hud.progress * 100)}%`;

    if (this.ui.rerollBtn) {
      this.ui.rerollBtn.textContent = `REROLL (${hud.rerolls})`;
      this.ui.rerollBtn.disabled = hud.rerolls <= 0;
    }

    this.showHudPanels();
  }

  private markSpeedActive(speed: number): void {
    this.ui.speedButtons?.forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.speed ?? "1") === speed);
    });
  }
}
