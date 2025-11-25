import { createEngineState } from '../hooks/useGameEngine.js';
import * as THREE from 'three';

export const engineState = createEngineState();

export const player = {
    hp: 100, maxHp: 100, level: 1, xp: 0, maxXp: 50,
    damageMult: 1, cdMult: 1, speedMult: 1, xpMult: 1, 
    critChance: 0.05, critMult: 2.0, 
    multiCast: 0, magnetRadius: 6, // Increased to 6 (Balanced)
    armor: 0, lifesteal: 0, luck: 1, curse: 1,
    gold: 0, interest: 0, hpRegen: 0, moveSpeed: 1.0, flatDmg: 0,
    rangeMult: 1.0, durationMult: 1.0, revives: 0,
    maxWeapons: 4,
    maxPassives: 4,
    rerolls: 2, bans: 1, banList: [], 
    activeSpells: [], 
    passives: [], 
    items: [], 
    invuln: 0
};

export const entities = { 
    enemies: [], 
    projectiles: [], 
    particles: [], 
    orbs: [], 
    drops: [] 
};

// Input State
export const keys = { w: false, a: false, s: false, d: false };
export const mouse = new THREE.Vector2();
export const cursorWorldPos = new THREE.Vector3();

// Pools
export const IMPLEMENTED_WEAPON_IDS = [
    "w_01", "w_02", "w_03", "w_04", "w_05", "w_06", 
    "w_07", "w_08", "w_09", "w_10", "w_11", "w_12", 
    "w_13", "w_14", "w_15", "w_16", "w_17", "w_18", "w_19", "w_20", "w_21", "w_22", "w_23", "w_24"
];