import { Player, Weapon, Item, Passive } from "../../types";
import { player as basePlayer } from "./Player";
import { WEAPONS } from "./Weapons";
import { ITEMS } from "./Items";
import { PASSIVE_DB } from "./Passives";

export interface HudState {
  hp: number;
  maxHp: number;
  xp: number;
  maxXp: number;
  level: number;
  gold: number;
  wave: number;
  maxWave: number;
  progress: number;
  rerolls: number;
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
}

type GameEventMap = {
  hud: HudState;
  starter: Weapon[];
  levelUp: LevelChoice[];
  item: Item;
  state: { isRunning: boolean; isPaused: boolean };
  speed: number;
};

type GameEventKey = keyof GameEventMap;
type Listener<K extends GameEventKey> = (payload: GameEventMap[K]) => void;

function sampleArray<T>(source: T[], count: number): T[] {
  const clone = [...source];
  const picks: T[] = [];
  while (picks.length < count && clone.length > 0) {
    const idx = Math.floor(Math.random() * clone.length);
    picks.push(clone.splice(idx, 1)[0]);
  }
  return picks;
}

export type LevelChoice = {
  id: string;
  kind: "weapon" | "passive";
  name: string;
  type: string;
  icon: string;
  desc: string;
  level: number;
  isUpgrade: boolean;
};

export class GameState {
  private player: Player;
  private wave = 1;
  private maxWave = 20;
  private progress = 0;
  private isRunning = false;
  private isPaused = false;
  private speed = 1;
  private starterChoices: Weapon[] = [];
  private levelChoices: LevelChoice[] = [];
  private weaponLevels = new Map<string, number>();
  private passiveLevels = new Map<string, number>();
  private readonly maxWeaponSlots = basePlayer.maxWeapons;
  private readonly maxPassiveSlots = 4;
  private listeners: Partial<{ [K in GameEventKey]: Set<Listener<K>> }> = {};

  constructor() {
    this.player = { ...basePlayer };
    this.rollStarterChoices();
    this.emit("hud", this.getHudState());
  }

  on<K extends GameEventKey>(event: K, listener: Listener<K>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]?.add(listener as Listener<GameEventKey>);
  }

  off<K extends GameEventKey>(event: K, listener: Listener<K>): void {
    this.listeners[event]?.delete(listener as Listener<GameEventKey>);
  }

  private emit<K extends GameEventKey>(event: K, payload: GameEventMap[K]): void {
    this.listeners[event]?.forEach((listener) => listener(payload as any));
  }

  getHudState(): HudState {
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      xp: this.player.xp,
      maxXp: this.player.maxXp,
      level: this.player.level,
      gold: this.player.gold,
      wave: this.wave,
      maxWave: this.maxWave,
      progress: this.progress,
      rerolls: this.player.rerolls,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      speed: this.speed,
    };
  }

  getStarterChoices(): Weapon[] {
    return this.starterChoices;
  }

  getLevelChoices(): LevelChoice[] {
    return this.levelChoices;
  }

  hasActiveWeapon(): boolean {
    return this.player.activeSpells.length > 0;
  }

  getActiveWeapons(): string[] {
    return [...this.player.activeSpells];
  }

  startGame(): void {
    this.isRunning = true;
    this.isPaused = false;
    this.emit("state", { isRunning: this.isRunning, isPaused: this.isPaused });
    this.emit("hud", this.getHudState());
  }

  togglePause(): void {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    this.emit("state", { isRunning: this.isRunning, isPaused: this.isPaused });
  }

  setSpeed(multiplier: number): void {
    this.speed = multiplier;
    this.emit("speed", this.speed);
    this.emit("hud", this.getHudState());
  }

  tick(deltaMs: number): void {
    if (!this.isRunning || this.isPaused) return;

    // Progress wave timer
    const waveDuration = 20000; // 20 seconds per wave for demo
    this.progress += (deltaMs * this.speed) / waveDuration;
    if (this.progress >= 1) {
      this.progress = 0;
      if (this.wave < this.maxWave) {
        this.wave += 1;
        this.player.gold += 5;
      }
    }

    this.emit("hud", this.getHudState());
  }

  takeDamage(amount: number): void {
    this.player.hp = Math.max(0, this.player.hp - amount);
    this.emit("hud", this.getHudState());
  }

  heal(amount: number): void {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
    this.emit("hud", this.getHudState());
  }

  addGold(amount: number): void {
    this.player.gold += amount;
    this.emit("hud", this.getHudState());
  }

  pickupItem(
    itemId?: string,
    rarityWeights?: Partial<Record<Item["rarity"], number>>
  ): void {
    const item =
      (itemId && ITEMS.find((entry) => entry.id === itemId)) ||
      this.rollItemFromWeights(rarityWeights) ||
      sampleArray(ITEMS, 1)[0];
    if (!item) return;
    this.player.items.push(item.id);
    this.emit("item", item);
    this.emit("hud", this.getHudState());
  }

  private rollItemFromWeights(
    rarityWeights?: Partial<Record<Item["rarity"], number>>
  ): Item | undefined {
    if (!rarityWeights) return undefined;
    const entries = Object.entries(rarityWeights).filter(([rarity, weight]) => {
      const weightValue = weight ?? 0;
      return weightValue > 0 && ITEMS.some((item) => item.rarity === rarity);
    });
    if (!entries.length) return undefined;

    const totalWeight = entries.reduce((sum, [, weight]) => sum + (weight ?? 0), 0);
    let roll = Math.random() * totalWeight;

    for (const [rarity, weight] of entries) {
      roll -= weight ?? 0;
      if (roll <= 0) {
        const options = ITEMS.filter((item) => item.rarity === rarity);
        return sampleArray(options, 1)[0];
      }
    }
    return undefined;
  }

  selectStarterWeapon(weaponId: string): void {
    if (this.player.activeSpells.includes(weaponId)) return;
    this.player.activeSpells.push(weaponId);
    this.weaponLevels.set(weaponId, 1);
    this.emit("starter", this.starterChoices);
    this.emit("hud", this.getHudState());
  }

  chooseLevelUp(choiceId: string, kind: LevelChoice["kind"]): void {
    if (kind === "weapon") {
      if (!this.player.activeSpells.includes(choiceId)) {
        if (this.player.activeSpells.length >= this.maxWeaponSlots) return;
        this.player.activeSpells.push(choiceId);
        this.weaponLevels.set(choiceId, 1);
      } else {
        const newLevel = (this.weaponLevels.get(choiceId) ?? 1) + 1;
        this.weaponLevels.set(choiceId, newLevel);
      }
    } else {
      if (!this.player.passives.includes(choiceId)) {
        if (this.player.passives.length >= this.maxPassiveSlots) return;
        this.player.passives.push(choiceId);
        this.passiveLevels.set(choiceId, 1);
      } else {
        const newLevel = (this.passiveLevels.get(choiceId) ?? 1) + 1;
        this.passiveLevels.set(choiceId, newLevel);
      }
    }
    this.levelChoices = [];
    this.emit("levelUp", this.levelChoices);
    this.emit("hud", this.getHudState());
  }

  rerollLevelUp(): Weapon[] {
    if (this.player.rerolls <= 0) return this.levelChoices;
    this.player.rerolls -= 1;
    this.rollLevelChoices();
    this.emit("hud", this.getHudState());
    return this.levelChoices;
  }

  private rollStarterChoices(): void {
    this.starterChoices = sampleArray(WEAPONS, 3);
    this.emit("starter", this.starterChoices);
  }

  private rollLevelChoices(): void {
    const pool = this.buildLevelChoicePool();
    this.levelChoices = sampleArray(pool, 3);
    this.emit("levelUp", this.levelChoices);
  }

  private buildLevelChoicePool(): LevelChoice[] {
    const pool: LevelChoice[] = [];
    const weaponSlotsFull = this.player.activeSpells.length >= this.maxWeaponSlots;
    const passiveSlotsFull = this.player.passives.length >= this.maxPassiveSlots;

    this.player.activeSpells.forEach((id) => {
      const weapon = WEAPONS.find((w) => w.id === id);
      if (!weapon) return;
      pool.push(this.createWeaponChoice(weapon, true));
    });

    if (!weaponSlotsFull) {
      WEAPONS.filter((w) => !this.player.activeSpells.includes(w.id)).forEach((weapon) => {
        pool.push(this.createWeaponChoice(weapon, false));
      });
    }

    this.player.passives.forEach((id) => {
      const passive = PASSIVE_DB.find((p) => p.id === id);
      if (!passive) return;
      pool.push(this.createPassiveChoice(passive, true));
    });

    if (!passiveSlotsFull) {
      PASSIVE_DB.filter((p) => !this.player.passives.includes(p.id)).forEach((passive) => {
        pool.push(this.createPassiveChoice(passive, false));
      });
    }

    return pool;
  }

  private createWeaponChoice(weapon: Weapon, isUpgrade: boolean): LevelChoice {
    const currentLevel = this.weaponLevels.get(weapon.id) ?? 0;
    return {
      id: weapon.id,
      kind: "weapon",
      name: weapon.name,
      type: isUpgrade ? `Weapon Lv ${currentLevel + 1}` : `Weapon Lv 1`,
      icon: weapon.icon,
      desc: weapon.desc,
      level: isUpgrade ? currentLevel + 1 : 1,
      isUpgrade,
    };
  }

  private createPassiveChoice(passive: Passive, isUpgrade: boolean): LevelChoice {
    const currentLevel = this.passiveLevels.get(passive.id) ?? 0;
    return {
      id: passive.id,
      kind: "passive",
      name: passive.name,
      type: isUpgrade ? `Passive Lv ${currentLevel + 1}` : `Passive Lv 1`,
      icon: passive.icon,
      desc: passive.desc,
      level: isUpgrade ? currentLevel + 1 : 1,
      isUpgrade,
    };
  }

  collectXp(amount: number): void {
    this.gainXp(amount);
    this.emit("hud", this.getHudState());
  }

  getMagnetRadius(): number {
    return this.player.magnetRadius;
  }

  private gainXp(amount: number): void {
    this.player.xp += amount * this.player.xpMult;
    while (this.player.xp >= this.player.maxXp) {
      this.player.xp -= this.player.maxXp;
      this.player.level += 1;
      this.player.maxXp = Math.round(this.player.maxXp * 1.2);
      this.rollLevelChoices();
    }
  }
}
