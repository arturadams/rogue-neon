export const PASSIVE_DB = [
    { id: "voltage_up", name: "Voltage Up", icon: "⚡", desc: "Global Damage", apply: (p, mult) => p.damageMult += (0.15 * mult) },
    { id: "overclock", name: "Overclock", icon: "⏩", desc: "Cooldown Reduction", apply: (p, mult) => p.cdMult *= (1 - (0.1 * Math.sqrt(mult))) },
    { id: "router_matrix", name: "Router", icon: "📡", desc: "Projectile Speed", apply: (p, mult) => p.speedMult += (0.1 * mult) },
    { id: "antivirus_core", name: "Antivirus", icon: "🛡️", desc: "Max HP", apply: (p, mult) => { p.maxHp += 30 * mult; p.hp += 30 * mult; } },
    { id: "data_magnet", name: "Data Magnet", icon: "🧲", desc: "Pickup Range", apply: (p, mult) => p.magnetRadius += (5 * mult) },
    { id: "critical_subroutine", name: "Crit Sub", icon: "🎯", desc: "Crit Chance", apply: (p, mult) => { p.critChance += (0.05 * mult); } },
    { id: "backup_shields", name: "Backup Shield", icon: "🧱", desc: "Damage Reduction", apply: (p, mult) => p.armor += 1 * mult },
    { id: "flux_converter", name: "Flux Convert", icon: "🩸", desc: "Lifesteal", apply: (p, mult) => p.lifesteal += 0.002 * mult },
    { id: "fortune_kernel", name: "Fortune Kernel", icon: "🎲", desc: "Luck", apply: (p, mult) => p.luck += 1 * mult },
    { id: "system_hazard", name: "System Hazard", icon: "☠️", desc: "+Curse (XP/Spawns)", apply: (p, mult) => { p.curse += 0.1 * mult; p.xpMult += 0.15 * mult; } },
];
