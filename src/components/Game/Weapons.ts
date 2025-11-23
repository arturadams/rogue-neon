import { Weapon } from "../../types";

export interface WeaponLevel extends Weapon {
  level: number;
  kind: "weapon";
  isUpgrade: boolean;
}

export const WEAPONS: Weapon[] = [
  {
    id: "w_01",
    name: "Neon Blade",
    type: "melee",
    scaling: "power",
    icon: "🗡️",
    base: {},
    color: 0x00ffff,
    desc: "A humming energy blade tuned for close quarters.",
  },
  {
    id: "w_02",
    name: "Pulse Rifle",
    type: "ranged",
    scaling: "tech",
    icon: "🔫",
    base: {},
    color: 0xff00ff,
    desc: "Accelerates neon bolts to shred clustered foes.",
  },
];
