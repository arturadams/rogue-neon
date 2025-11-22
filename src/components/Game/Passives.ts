import { PassiveEffect } from "../../types/passive";

export const PASSIVE_DB = [
  {
    id: "voltage_up",
    name: "Voltage Up",
    icon: "⚡",
    desc: "Global Damage",
    apply: (p: PassiveEffect, mult: number) => {
      p.damageMult = (p.damageMult ?? 0) + 0.15 * mult;
    },
  },
  {
    id: "overclock",
    name: "Overclock",
    icon: "⏩",
    desc: "Cooldown Reduction",
    apply: (p: PassiveEffect, mult: number) => {
      p.cdMult = (p.cdMult ?? 1) * (1 - 0.1 * Math.sqrt(mult));
    },
  },
  {
    id: "router_matrix",
    name: "Router",
    icon: "📡",
    desc: "Projectile Speed",
    apply: (p: PassiveEffect, mult: number) => {
      p.speedMult = (p.speedMult ?? 0) + 0.1 * mult;
    },
  },
  {
    id: "antivirus_core",
    name: "Antivirus",
    icon: "🛡️",
    desc: "Max HP",
    apply: (p: PassiveEffect, mult: number) => {
      p.maxHp = (p.maxHp ?? 0) + 30 * mult;
      p.hp = (p.hp ?? 0) + 30 * mult;
    },
  },
  {
    id: "data_magnet",
    name: "Data Magnet",
    icon: "🧲",
    desc: "Pickup Range",
    apply: (p: PassiveEffect, mult: number) => {
      p.magnetRadius = (p.magnetRadius ?? 0) + 5 * mult;
    },
  },
  {
    id: "critical_subroutine",
    name: "Crit Sub",
    icon: "🎯",
    desc: "Crit Chance",
    apply: (p: PassiveEffect, mult: number) => {
      p.critChance = (p.critChance ?? 0) + 0.05 * mult;
    },
  },
  {
    id: "backup_shields",
    name: "Backup Shield",
    icon: "🧱",
    desc: "Damage Reduction",
    apply: (p: PassiveEffect, mult: number) => {
      p.armor = (p.armor ?? 0) + 1 * mult;
    },
  },
  {
    id: "flux_converter",
    name: "Flux Convert",
    icon: "🩸",
    desc: "Lifesteal",
    apply: (p: PassiveEffect, mult: number) => {
      p.lifesteal = (p.lifesteal ?? 0) + 0.002 * mult;
    },
  },
  {
    id: "fortune_kernel",
    name: "Fortune Kernel",
    icon: "🎲",
    desc: "Luck",
    apply: (p: PassiveEffect, mult: number) => {
      p.luck = (p.luck ?? 0) + 1 * mult;
    },
  },
  {
    id: "system_hazard",
    name: "System Hazard",
    icon: "☠️",
    desc: "+Curse (XP/Spawns)",
    apply: (p: PassiveEffect, mult: number) => {
      p.curse = (p.curse ?? 0) + 0.1 * mult;
      p.xpMult = (p.xpMult ?? 0) + 0.15 * mult;
    },
  },
];
