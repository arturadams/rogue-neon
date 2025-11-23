import { CONFIG } from './config.js';

export const RARITY_WEIGHTS = [
    { id: 'common', weight: 50, mult: 1.0, color: CONFIG.colors.common, name: "Common" },
    { id: 'uncommon', weight: 25, mult: 1.3, color: CONFIG.colors.uncommon, name: "Uncommon" },
    { id: 'rare', weight: 12, mult: 1.7, color: CONFIG.colors.rare, name: "Rare" },
    { id: 'mythic', weight: 6, mult: 2.5, color: CONFIG.colors.mythic, name: "Mythic" },
    { id: 'legendary', weight: 4, mult: 4.0, color: CONFIG.colors.legendary, name: "Legendary" },
    { id: 'cursed', weight: 3, mult: 5.0, color: CONFIG.colors.cursed, name: "Cursed" },
];
