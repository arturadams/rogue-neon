import { Item } from "../../types";

export const ITEMS: Item[] = [
  {
    id: "i_01",
    name: "Data Cache",
    rarity: "common",
    icon: "💾",
    effect: "Restores a small amount of integrity over time.",
  },
  {
    id: "i_02",
    name: "Neon Battery",
    rarity: "uncommon",
    icon: "🔋",
    effect: "Powers up your systems for a brief surge.",
  },
  {
    id: "i_rare_01",
    name: "Quantum Drive",
    rarity: "rare",
    icon: "⚡",
    effect: "Greatly increases your chance to find high tier loot.",
  },
];

export type ItemRarity = Item["rarity"];
