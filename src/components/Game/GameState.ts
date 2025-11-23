import { Item, Player } from "../../types";
import { PassiveEffect } from "../../types/passive";
import { ITEMS, ItemRarity } from "./Items";
import { WeaponLevel, WEAPONS } from "./Weapons";

type GameEventMap = {
  state: { isRunning: boolean; isPaused: boolean };
  reset: void;
  item: Item;
  levelUp: Array<LevelUpChoice>;
};

type Listener<K extends keyof GameEventMap> = (payload: GameEventMap[K]) => void;

type LevelUpChoice = WeaponLevel | PassiveChoice;

interface PassiveChoice {
  id: string;
  name: string;
  desc: string;
  kind: "passive";
  level: number;
  isUpgrade: boolean;
}

const DEFAULT_WEIGHTS: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 1,
  rare: 1,
  mythic: 1,
  legendary: 1,
};

export class GameState {
  private listeners: { [K in keyof GameEventMap]: Listener<K>[] } = {
    state: [],
    reset: [],
    item: [],
    levelUp: [],
  };

  private modalPaused = false;
  private isPaused = false;
  private isRunning = false;
  private speed = 1;
  private hudProgress = 0;
  private wave = 1;
  private readonly maxWave = 20;
  private xp = 0;
  private maxXp = 100;
  private activeWeapons: string[] = [];
  private weaponLevels = new Map<string, number>();
  private pendingChoices: LevelUpChoice[] | null = null;

  public player: Player;
  private random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.player = {
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,
      maxXp: this.maxXp,
      damageMult: 1,
      cdMult: 1,
      speedMult: 1,
      xpMult: 1,
      critChance: 0,
      critMult: 1,
      multiCast: 1,
      magnetRadius: 1,
      armor: 0,
      lifesteal: 0,
      luck: 0,
      curse: 0,
      gold: 0,
      interest: 0,
      hpRegen: 0,
      moveSpeed: 1,
      flatDmg: 0,
      rangeMult: 1,
      durationMult: 1,
      revives: 0,
      maxWeapons: 6,
      rerolls: 2,
      bans: 0,
      banList: [],
      activeSpells: [],
      passives: [],
      items: [],
      invuln: 0,
    };
  }

  on<K extends keyof GameEventMap>(event: K, listener: Listener<K>) {
    this.listeners[event].push(listener);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]) {
    this.listeners[event].forEach((listener) => listener(payload));
  }

  getHudState() {
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      level: this.player.level,
      wave: this.wave,
      maxWave: this.maxWave,
      progress: this.wave >= this.maxWave ? 1 : this.hudProgress,
      isRunning: this.isRunning,
      isPaused: this.modalPaused || this.isPaused,
      speed: this.speed,
      gold: this.player.gold,
      maxXp: this.maxXp,
      xp: this.xp,
    };
  }

  startGame() {
    this.isRunning = true;
    this.isPaused = false;
    this.emit("state", { isRunning: this.isRunning, isPaused: this.modalPaused || this.isPaused });
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    this.emit("state", { isRunning: this.isRunning, isPaused: this.modalPaused || this.isPaused });
  }

  setModalPause(value: boolean) {
    this.modalPaused = value;
    this.emit("state", { isRunning: this.isRunning, isPaused: this.modalPaused || this.isPaused });
  }

  setSpeed(value: number) {
    if (value <= 0) {
      this.speed = 1;
      return;
    }
    this.speed = Math.max(0.25, value);
  }

  tick(elapsedMs: number) {
    if (!this.isRunning || this.modalPaused || this.isPaused) return;

    const waveDuration = 20000 / this.speed;
    this.hudProgress += elapsedMs / waveDuration;

    if (this.wave >= this.maxWave) {
      this.hudProgress = 1;
      return;
    }

    while (this.hudProgress >= 1 && this.wave < this.maxWave) {
      this.wave += 1;
      this.player.gold += 5;
      this.hudProgress = this.wave >= this.maxWave ? 1 : this.hudProgress - 1;
    }
  }

  takeDamage(amount: number) {
    this.player.hp = Math.max(0, this.player.hp - Math.max(0, amount));
  }

  heal(amount: number) {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.max(0, amount));
  }

  addGold(amount: number) {
    this.player.gold += Math.max(0, amount);
  }

  applyPassive(effect: PassiveEffect) {
    if (typeof effect.hp === "number") this.heal(effect.hp);
    if (typeof effect.maxHp === "number") this.player.maxHp += effect.maxHp;
    if (typeof effect.speedMult === "number") this.player.speedMult *= effect.speedMult;
  }

  private pickWeightedItem(weights?: Partial<Record<ItemRarity, number>>): Item {
    const applied = weights ? (Object.keys(weights).length ? (weights as Record<ItemRarity, number>) : DEFAULT_WEIGHTS) : DEFAULT_WEIGHTS;
    const pool = ITEMS.filter((item) => (applied[item.rarity] ?? 0) > 0);
    const totalWeight = pool.reduce((sum, item) => sum + (applied[item.rarity] ?? 0), 0);
    const roll = this.random() * totalWeight;

    let cumulative = 0;
    for (const item of pool) {
      cumulative += applied[item.rarity] ?? 0;
      if (roll <= cumulative) return item;
    }
    return pool[pool.length - 1];
  }

  pickupItem(id?: string, weights?: Partial<Record<ItemRarity, number>>) {
    const item = id ? ITEMS.find((entry) => entry.id === id) : this.pickWeightedItem(weights);
    if (!item) return;
    if (!this.player.items.includes(item.id)) this.player.items.push(item.id);
    this.emit("item", item);
  }

  selectStarterWeapon(weaponId: string) {
    if (this.activeWeapons.includes(weaponId)) return;
    this.activeWeapons.push(weaponId);
    this.weaponLevels.set(weaponId, 1);
  }

  getActiveWeapons() {
    return [...this.activeWeapons];
  }

  collectXp(amount: number) {
    this.xp += Math.max(0, amount);
    while (this.xp >= this.maxXp) {
      this.xp -= this.maxXp;
      this.player.level += 1;
      this.maxXp = Math.ceil(this.maxXp * 1.1);
      this.offerLevelUp();
    }
  }

  private offerLevelUp() {
    const choices = this.generateLevelUpChoices();
    this.pendingChoices = choices;
    this.emit("levelUp", choices);
  }

  private generateLevelUpChoices(): LevelUpChoice[] {
    const weaponUpgrades = WEAPONS.slice(0, 2).map<WeaponLevel>((weapon) => {
      const current = this.weaponLevels.get(weapon.id) ?? 0;
      return {
        ...weapon,
        level: current + 1,
        kind: "weapon",
        isUpgrade: current > 0,
      };
    });

    const passiveChoice: PassiveChoice = {
      id: "p_01",
      name: "Systems Calibration",
      desc: "Minor boosts to integrity and speed.",
      level: 1,
      kind: "passive",
      isUpgrade: false,
    };

    const pool: LevelUpChoice[] = [...weaponUpgrades, passiveChoice];
    const selections: LevelUpChoice[] = [];
    const roll = this.random();
    const startIndex = Math.floor(roll * pool.length) % pool.length;
    for (let i = 0; i < 3; i++) {
      selections.push(pool[(startIndex + i) % pool.length]);
    }
    return selections;
  }

  chooseLevelUp(id: string, kind: "weapon" | "passive") {
    if (!this.pendingChoices) return;
    const choice = this.pendingChoices.find((entry) => entry.id === id && entry.kind === kind);
    if (!choice) return;

    if (choice.kind === "weapon") {
      const current = this.weaponLevels.get(choice.id) ?? 0;
      this.weaponLevels.set(choice.id, current + 1);
      if (!this.activeWeapons.includes(choice.id)) this.activeWeapons.push(choice.id);
    } else {
      if (!this.player.passives.includes(choice.id)) this.player.passives.push(choice.id);
    }

    this.pendingChoices = null;
  }

  rerollLevelUp() {
    if (this.player.rerolls <= 0) return;
    this.player.rerolls -= 1;
    this.offerLevelUp();
  }
}
