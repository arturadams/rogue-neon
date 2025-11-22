import { Player, Weapon, Item } from "../../types";
import { player as basePlayer } from "./Player";
import { WEAPONS } from "./Weapons";
import { ITEMS } from "./Items";

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
  levelUp: Weapon[];
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

export class GameState {
  private player: Player;
  private wave = 1;
  private maxWave = 20;
  private progress = 0;
  private isRunning = false;
  private isPaused = false;
  private speed = 1;
  private starterChoices: Weapon[] = [];
  private levelChoices: Weapon[] = [];
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

  getLevelChoices(): Weapon[] {
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

    // Auto-gain a trickle of XP while running
    this.gainXp((deltaMs / 1000) * 5 * this.speed);
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

  pickupItem(itemId?: string): void {
    const item =
      (itemId && ITEMS.find((entry) => entry.id === itemId)) ||
      sampleArray(ITEMS, 1)[0];
    if (!item) return;
    this.player.items.push(item.id);
    this.emit("item", item);
    this.emit("hud", this.getHudState());
  }

  selectStarterWeapon(weaponId: string): void {
    if (this.player.activeSpells.includes(weaponId)) return;
    this.player.activeSpells.push(weaponId);
    this.emit("starter", this.starterChoices);
    this.emit("hud", this.getHudState());
  }

  chooseLevelUp(weaponId: string): void {
    if (!this.player.activeSpells.includes(weaponId)) {
      this.player.activeSpells.push(weaponId);
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
    const available = WEAPONS.filter((w) => !this.player.activeSpells.includes(w.id));
    const pool = available.length >= 3 ? available : WEAPONS;
    this.levelChoices = sampleArray(pool, 3);
    this.emit("levelUp", this.levelChoices);
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
