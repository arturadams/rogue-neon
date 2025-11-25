import { CONFIG } from '../configs/config.js';

export function createPlayerState() {
  return {
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    maxXp: 50,
    damageMult: 1,
    cdMult: 1,
    speedMult: 1,
    xpMult: 1,
    critChance: 0.05,
    critMult: 2.0,
    multiCast: 0,
    magnetRadius: 10,
    armor: 0,
    lifesteal: 0,
    luck: 1,
    curse: 1,
    gold: 0,
    interest: 0,
    hpRegen: 0,
    moveSpeed: 1.0,
    flatDmg: 0,
    rangeMult: 1.0,
    durationMult: 1.0,
    revives: 0,
    maxWeapons: CONFIG.maxWeapons ?? 4,
    rerolls: CONFIG.rerolls ?? 2,
    bans: CONFIG.bans ?? 1,
    banList: [],
    activeSpells: [],
    passives: [],
    items: [],
    invuln: 0
  };
}
