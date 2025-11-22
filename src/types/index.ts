export interface Weapon {
  id: string;
  name: string;
  type: string;
  scaling: string;
  icon: string;
  base: any;
  color: number;
  desc: string;
}

export interface Synergy {
  weapon_id: string;
  choices: Array<{ path: string; name: string; desc: string; max: string }>;
}

export interface Passive {
  id: string;
  name: string;
  icon: string;
  desc: string;
  apply: Function;
}

export interface Item {
  id: string;
  name: string;
  rarity: string;
  icon: string;
  effect: string;
}

export interface Player {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  maxXp: number;
  damageMult: number;
  cdMult: number;
  speedMult: number;
  xpMult: number;
  critChance: number;
  critMult: number;
  multiCast: number;
  magnetRadius: number;
  armor: number;
  lifesteal: number;
  luck: number;
  curse: number;
  gold: number;
  interest: number;
  hpRegen: number;
  moveSpeed: number;
  flatDmg: number;
  rangeMult: number;
  durationMult: number;
  revives: number;
  maxWeapons: number;
  rerolls: number;
  bans: number;
  banList: string[];
  activeSpells: string[];
  passives: string[];
  items: string[];
  invuln: number;
}
