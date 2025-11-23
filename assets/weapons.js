export const WEAPONS = [
    { id: "w_01", name: "VX-1 Auto-Pistol", type: "Kinetic", scaling: "Attack Speed", icon: "🔫", base: { dmg: 10, cd: 0.4, range: 200, speed: 2.0, count: 1 }, color: 0xffaa00, desc: "Rapid fire single target." },
    { id: "w_02", name: "Street Sweeper", type: "Kinetic", scaling: "Range", icon: "🕸️", base: { dmg: 8, cd: 1.2, range: 100, speed: 1.5, count: 5, spread: 0.5 }, color: 0xffaa00, desc: "Short range cone spread." },
    { id: "w_03", name: "Tungsten Nailgun", type: "Kinetic", scaling: "Duration", icon: "🔨", base: { dmg: 5, cd: 0.1, range: 150, speed: 2.5, count: 1, slow: 0.1 }, color: 0xaaaaaa, desc: "High ammo, applies slow." },
    { id: "w_04", name: "Heavy Bolter", type: "Kinetic", scaling: "Damage", icon: "🔩", base: { dmg: 35, cd: 1.0, range: 250, speed: 1.0, count: 1, knockback: 5 }, color: 0xff5500, desc: "Slow fire, high damage." },
    { id: "w_05", name: "Ripper Sawblade", type: "Kinetic", scaling: "Bounce", icon: "⚙️", base: { dmg: 15, cd: 1.5, range: 180, speed: 0.8, count: 1, pierce: 99 }, color: 0xdddddd, desc: "Bounces off walls." },
    { id: "w_06", name: "Smart-Lok Rifle", type: "Kinetic", scaling: "Tech", icon: "📡", base: { dmg: 12, cd: 0.6, range: 300, speed: 2.0, count: 1, homing: true }, color: 0x00ff00, desc: "Auto-locks onto targets." },

    { id: "w_07", name: "Neon Laser", type: "Energy", scaling: "Duration", icon: "🔦", base: { dmg: 5, cd: 0.1, range: 250, width: 0.5, beam: true }, color: 0x00ffff, desc: "Continuous beam." },
    { id: "w_08", name: "Tesla Arc-Caster", type: "Energy", scaling: "Chain", icon: "⚡", base: { dmg: 20, cd: 1.2, range: 150, chain: 2 }, color: 0xffff00, desc: "Zaps target and jumps." },
    { id: "w_09", name: "Plasma Lobber", type: "Energy", scaling: "Area", icon: "🧪", base: { dmg: 30, cd: 2.0, range: 120, area: 10, puddle: true }, color: 0x00ff00, desc: "Arcing shot leaves acid." },
    { id: "w_10", name: "Hard-Light Prism", type: "Energy", scaling: "Reflect", icon: "💎", base: { dmg: 10, cd: 5.0, duration: 10, deploy: "prism" }, color: 0xff00ff, desc: "Stationary prism shoots beams." },
    { id: "w_11", name: "Gamma Ray", type: "Energy", scaling: "Tech", icon: "☢️", base: { dmg: 8, cd: 0.2, range: 80, cone: true }, color: 0x00ff00, desc: "Short range radiation cone." },
    { id: "w_12", name: "Void Beam", type: "Energy", scaling: "Duration", icon: "🌌", base: { dmg: 50, cd: 3.0, range: 200, width: 2, beam: true, tick: true }, color: 0x8800ff, desc: "Dark beam ticks damage." },

    { id: "w_13", name: "Cluster Rocket", type: "Explosive", scaling: "Area", icon: "🚀", base: { dmg: 40, cd: 2.5, range: 200, speed: 1.2, explode: 10 }, color: 0xff5555, desc: "Rocket explodes on impact." },
    { id: "w_14", name: "Grav-Bomb", type: "Explosive", scaling: "Force", icon: "⚫", base: { dmg: 5, cd: 4.0, range: 150, explode: 15, pull: true }, color: 0x440044, desc: "Pulls enemies together." },
    { id: "w_15", name: "Mine Layer", type: "Explosive", scaling: "Duration", icon: "💣", base: { dmg: 60, cd: 2.0, deploy: "mine" }, color: 0xaa5500, desc: "Drops mines behind player." },
    { id: "w_16", name: "Flak Cannon", type: "Explosive", scaling: "Area", icon: "💥", base: { dmg: 15, cd: 1.5, range: 120, count: 4, spread: 0.8, explode: 5 }, color: 0xffaa55, desc: "Shotgun-style explosive." },
    { id: "w_17", name: "Napalm Thrower", type: "Explosive", scaling: "Elemental", icon: "🔥", base: { dmg: 4, cd: 0.05, range: 60, particles: true }, color: 0xffaa00, desc: "Stream of fire." },
    { id: "w_18", name: "Railgun Sniper", type: "Explosive", scaling: "Crit", icon: "🔫", base: { dmg: 150, cd: 4.0, range: 400, beam: true, pierce: 99, width: 0.2 }, color: 0xff0000, desc: "Infinite pierce line." },

    { id: "w_19", name: "Glitch Emitter", type: "Exotic", scaling: "Luck", icon: "👾", base: { dmg: 10, cd: 0.5, range: 150, random: true }, color: 0xff00ff, desc: "Randomizes enemy speed." },
    { id: "w_20", name: "Bit-Coin Blaster", type: "Exotic", scaling: "Gold", icon: "🪙", base: { dmg: 5, cd: 0.2, range: 150, gold_hit: true }, color: 0xffd700, desc: "Weak dmg, generates gold." },
    { id: "w_21", name: "Drone Carrier", type: "Exotic", scaling: "Summon", icon: "🛸", base: { dmg: 10, cd: 5.0, summon: "drone", count: 2 }, color: 0x00aaff, desc: "Spawns drones." },
    { id: "w_22", name: "Vampire Disc", type: "Exotic", scaling: "Lifesteal", icon: "💿", base: { dmg: 25, cd: 2.0, range: 200, boomerang: true }, color: 0xff0055, desc: "Thrown disc returns." },
    { id: "w_23", name: "Bass-Cannon", type: "Exotic", scaling: "Area", icon: "🔊", base: { dmg: 30, cd: 1.5, range: 100, cone: true, push: 10 }, color: 0xaa00ff, desc: "Visible sound waves." },
    { id: "w_24", name: "Null Pointer", type: "Exotic", scaling: "None", icon: "🚫", base: { dmg: 1, cd: 1.0, range: 200, delete_chance: 0.03 }, color: 0x000000, desc: "Chance to delete enemy." },
];
