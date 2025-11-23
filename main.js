import { buildUi } from './components/uiLayout.js';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CONFIG } from './configs/config.js';
import { RARITY_WEIGHTS } from './configs/rarities.js';
import { WEAPONS } from './assets/weapons.js';
import { SYNERGIES } from './assets/synergies.js';
import { PASSIVE_DB } from './assets/passives.js';
import { ITEMS } from './assets/items.js';
import { createEngineState, useGameEngine } from './hooks/useGameEngine.js';

buildUi();

const engineState = createEngineState();

// --- PLAYER STATE ---
const player = {
    hp: 100, maxHp: 100, level: 1, xp: 0, maxXp: 50,
    damageMult: 1, cdMult: 1, speedMult: 1, xpMult: 1, 
    critChance: 0.05, critMult: 2.0, 
    multiCast: 0, magnetRadius: 10,
    armor: 0, lifesteal: 0, luck: 1, curse: 1,
    gold: 0, interest: 0, hpRegen: 0, moveSpeed: 1.0, flatDmg: 0,
    rangeMult: 1.0, durationMult: 1.0, revives: 0,
    maxWeapons: 4,
    rerolls: 2, bans: 1, banList: [], 
    activeSpells: [], 
    passives: [], // store IDs
    items: [], // store IDs
    invuln: 0
};

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colors.bg);
scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.008);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 45, CONFIG.playerZ + 25);
camera.lookAt(0, 0, -30); 

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.strength = 1.2; bloomPass.radius = 0.4; bloomPass.threshold = 0.15;
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// --- ASSETS ---
// Use a static material but create new Geometries for dynamic scaling
const matGlass = new THREE.MeshPhysicalMaterial({ color: 0x101025, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.8, transmission: 0.2 });

// Optimization: Reusable box geometry for projectiles if possible, but scaling issues. 
// Using specific create function.
function createNeonMesh(geometry, color) {
    const m = new THREE.Mesh(geometry, matGlass);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.8 }));
    m.add(e);
    return m;
}

// OPTIMIZATION: Global geometry for basic projectiles to reduce allocation
const projGeo = new THREE.BoxGeometry(0.5, 0.5, 1);

// --- WORLD ---
const worldGroup = new THREE.Group();
scene.add(worldGroup);
const floor = new THREE.GridHelper(400, 40, 0x330033, 0x080815); floor.position.z = -50; worldGroup.add(floor);
const laneL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 300), new THREE.MeshBasicMaterial({color: CONFIG.colors.cyan}));
laneL.position.set(-CONFIG.laneWidth/2 - 1, 0, -50); worldGroup.add(laneL);
const laneR = laneL.clone(); laneR.position.set(CONFIG.laneWidth/2 + 1, 0, -50); worldGroup.add(laneR);

// --- PLAYER ---
const charGroup = new THREE.Group();
charGroup.position.set(0, 0, CONFIG.playerZ);
const body = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 4), new THREE.MeshBasicMaterial({color: CONFIG.colors.cyan, wireframe: true}));
body.position.y = 2.5; body.rotation.y = Math.PI/4; charGroup.add(body);
scene.add(charGroup);

// --- LOGIC ---
const entities = { enemies: [], projectiles: [], particles: [], orbs: [], drops: [] };
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let cursorWorldPos = new THREE.Vector3(0,0,0);
const keys = { w: false, a: false, s: false, d: false };

// CURSOR
const cursorMesh = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.4, 32), new THREE.MeshBasicMaterial({color: 0x00ffff, side: THREE.DoubleSide}));
cursorMesh.rotation.x = -Math.PI/2; cursorMesh.position.y = 0.2; scene.add(cursorMesh);

// AIM LINES
const aimLineGroup = new THREE.Group(); scene.add(aimLineGroup);
const aimLinePool = [];
for(let i=0; i<50; i++) {
    const l = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.15}));
    l.visible = false; aimLineGroup.add(l); aimLinePool.push(l);
}

const gameEngine = useGameEngine({
    state: engineState,
    config: CONFIG,
    player,
    scene,
    camera,
    composer,
    charGroup,
    keys,
    cursorWorldPos,
    cursorMesh,
    aimLinePool,
    raycaster,
    mouse,
    groundPlane,
    entities,
    createNeonMesh,
    removeEnemy,
    removeProjectile,
    helpers: {
        updateHUD,
        showFloatText,
        castSpell,
        takeDamage,
        damageEnemy,
        gainXpDrop,
        gainXp,
        spawnDrop,
        showItemModal,
        showEvolutionModal,
        getClosestEnemy,
        getClosestEnemyExcluding,
        createExplosion,
        spawnZone,
        fireProj,
        fireBeam,
        drawChainBolt,
        startChain,
        startChainRecursive
    }
});
gameEngine.animate();

function takeDamage(amt) {
    if(player.items.includes("i_28")) {
        entities.enemies.forEach(e => {
            createExplosion(e.mesh.position, 0xffaa00, 5);
            damageEnemy(e, 9999);
        });
        return;
    }

    let actual = Math.max(1, amt - player.armor);
    player.hp -= actual; updateHUD();
    document.body.style.backgroundColor = '#550000';
    setTimeout(() => document.body.style.backgroundColor = CONFIG.colors.bg.toString(16), 50);

    if(player.hp <= 0) {
         if(player.revives > 0) {
             player.revives--;
             player.hp = player.maxHp * 0.5;
             player.invuln = 120;
             showFloatText("REVIVED!", charGroup.position, 0x00ff00);
             updateHUD();
         } else {
             engineState.gameState = 'GAMEOVER';
             document.getElementById('gameover-modal').style.display = 'block';
             document.getElementById('final-wave').innerText = engineState.wave;
         }
    }
}

window.takeDamage = takeDamage;

// --- MODALS ---
function showItemModal(item) {
     engineState.gameState = 'PAUSED';
     const modal = document.getElementById('item-modal');
     let rInfo = RARITY_WEIGHTS.find(r => r.id === item.rarity.toLowerCase());
     if(!rInfo) rInfo = RARITY_WEIGHTS[0];
     document.getElementById('item-title').innerText = item.name;
     document.getElementById('item-title').style.color = rInfo.color === 0xffffff ? 'white' : '#' + new THREE.Color(rInfo.color).getHexString();
     document.getElementById('item-rarity').innerText = rInfo.name + " HARDWARE";
     document.getElementById('item-rarity').style.color = '#' + new THREE.Color(rInfo.color).getHexString();
     document.getElementById('item-desc').innerText = item.effect;
     document.getElementById('item-modal').style.borderColor = '#' + new THREE.Color(rInfo.color).getHexString();
     document.getElementById('item-icon-display').style.color = '#' + new THREE.Color(rInfo.color).getHexString();
     document.getElementById('item-icon-display').innerText = item.icon || '🎁';
     modal.userData = { item: item };
     modal.style.display = 'block';
}

function showEvolutionModal(weapon, synergyItem) {
    engineState.gameState = 'PAUSED';
    const modal = document.getElementById('levelup-modal');
    const container = document.getElementById('upgrade-cards');
    container.innerHTML = '';
    document.getElementById('levelup-title').innerText = "WEAPON EVOLUTION";

    // Synergy item has .choices array [ {path:'A', ...}, {path:'B', ...} ]
    synergyItem.choices.forEach(choice => {
        const card = document.createElement('div');
        card.className = 'upgrade-card evolution';
        card.innerHTML = `
            <div class="card-type" style="color:#ffaa00">PATH ${choice.path}</div>
            <div style="font-size:40px">🌟</div>
            <div class="card-title">${choice.name}</div>
            <div class="card-desc">${choice.description}</div>
            <div style="font-size:10px; color:#888; margin-top:5px;">MAX: ${choice.max_upgrade}</div>
        `;
        card.onclick = () => {
            evolveWeapon(weapon, choice);
            closeModal();
        };
        container.appendChild(card);
    });

    document.querySelector('.reroll-container').style.display = 'none'; // No reroll for evos
    modal.style.display = 'block';
}

// Ensure closeItemModal is global
window.closeItemModal = function() {
     const modal = document.getElementById('item-modal');
     const item = modal.userData.item;
     player.items.push(item.id);
     if(item.id === "i_01") player.moveSpeed += 0.1;
     if(item.id === "i_02") player.flatDmg += 10;
     if(item.id === "i_03") player.rangeMult += 0.15;
     renderInventory();
     updateHUD();
     modal.style.display = 'none';
     engineState.gameState = 'PLAYING';
};

function evolveWeapon(weapon, choice) {
    weapon.isEvo = true;
    weapon.path = choice.path;
    weapon.data.name = choice.name; // Rename to Evo name
    weapon.data.base.dmg *= 1.5;   // Base stat bump
    // Specific logic based on path can be handled in castSpell by checking weapon.path
    renderDock();
}

// --- COMBAT ---
function castSpell(spell) {
    const s = spell.data;
    const cfg = spell.data.base;
    let dmg = (cfg.dmg + player.flatDmg) * player.damageMult;
    let shots = (cfg.count || 1) + player.multiCast;

    // Path Logic
    if(spell.isEvo) {
        if(spell.path === 'A' && spell.id === 'w_01') shots *= 2; // Dual Wield
        if(spell.path === 'B' && spell.id === 'w_01') { dmg *= 3; shots = 1; } // Sniper
    }

    // Handling Behavioral Types
    if (s.type === 'Kinetic' || s.type === 'Energy' || s.type === 'Explosive' || s.type === 'Exotic') {
        // Check BASE properties
        if(cfg.cone) {
            // Cone / Wave (Bass Cannon)
             const dir = new THREE.Vector3().subVectors(cursorWorldPos, charGroup.position).normalize();

             // Visual Mesh for Cone (Sector)
             const mesh = createNeonMesh(new THREE.RingGeometry(0.5, 4, 6, 1, 0, Math.PI/3), s.color);
             mesh.position.copy(charGroup.position); mesh.position.y = 1;
             mesh.rotation.x = -Math.PI/2; 
             // Rotate towards dir on Y axis. RingGeometry starts at +X (0 rads).
             mesh.rotation.z = Math.atan2(dir.z, dir.x) - Math.PI/6; // Offset to center arc
             scene.add(mesh);

             entities.projectiles.push({
                mesh: mesh,
                velocity: dir, 
                speed: 0, 
                damage: dmg, 
                color: s.color, 
                age: 0, 
                type: 'cone', 
                range: cfg.range || 100, 
                spellRef: spell,
                width: 20 
            });
            return true;
        }
        else if(cfg.beam) {
            const dir = new THREE.Vector3().subVectors(cursorWorldPos, charGroup.position).normalize();
            fireBeam(charGroup.position, dir, cfg, spell, dmg);
            return true;
        }
        else if(cfg.chain) {
            let target = getClosestEnemy(cursorWorldPos, cfg.range);
            if (target) {
                startChain(target, dmg, cfg.chain, spell);
                return true;
            }
            return false; // No target
        }
        else if(cfg.deploy === 'prism' || cfg.deploy === 'mine') {
             const mesh = createNeonMesh(new THREE.BoxGeometry(1, 1, 1), s.color);
             mesh.position.copy(charGroup.position);
             scene.add(mesh);
             entities.projectiles.push({
                mesh, type: cfg.deploy, duration: cfg.duration || 10, age:0, spellRef: spell, damage: dmg, radius: 30
             });
             return true;
        }
        else if(cfg.summon === 'drone') {
            // Drones
            if(!spell.drones) spell.drones = [];
            if(spell.drones.length < (cfg.count || 1)) {
                const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1), new THREE.MeshBasicMaterial({color:s.color}));
                scene.add(mesh);
                const drone = { mesh, type: 'drone', spellRef: spell, damage: dmg, age: 0, target: null };
                entities.projectiles.push(drone);
                spell.drones.push(drone);
            }
            return true;
        }
        else {
            // Standard Projectile logic for everything else
            for(let i=0; i<shots; i++) {
                setTimeout(() => {
                    const dir = new THREE.Vector3().subVectors(cursorWorldPos, charGroup.position).normalize();
                    if(i > 0) dir.applyAxisAngle(new THREE.Vector3(0,1,0), (i % 2 === 0 ? 1 : -1) * 0.1 * Math.ceil(i/2));
                    fireProj(cfg, charGroup.position.clone().add(new THREE.Vector3(0,3,0)), dir, dmg, s.color);
                }, i * (80/engineState.gameSpeed));
            }
            return true;
        }
    }
    return false;
}

function spawnZone(pos, cfg, spell) {
    const mesh = createNeonMesh(new THREE.CylinderGeometry(cfg.area || 5, cfg.area || 5, 0.5, 16), spell.data.color);
    mesh.position.copy(pos); mesh.position.y = 0.5;
    scene.add(mesh);
    entities.projectiles.push({
        mesh, type: 'zone', zoneType: cfg.puddle ? 'void' : 'time', 
        radius: cfg.area || 5, damage: (cfg.dmg || 10) * 0.5, interval: 20, duration: 5, age: 0,
        spellRef: spell
    });
}

function fireProj(cfg, pos, dir, dmg, color) {
    let spd = cfg.speed * player.speedMult;
    let rng = (cfg.range || 200) * player.rangeMult;

    // Optimization: Use global Geometry? No, color differs. 
    // Reusing a single geometry for ALL projectiles of same type would be better, but for now standard.
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshBasicMaterial({color: color}));
    mesh.position.copy(pos);
    scene.add(mesh);

    entities.projectiles.push({
        mesh, velocity: dir.multiplyScalar(spd), speed: spd, damage: dmg, 
        color: color, age: 0, type: cfg.homing ? 'homing' : 'projectile', 
        range: rng, width: 0.5, pierce: cfg.pierce, 
        explode: cfg.explode, pull: cfg.pull, particles: cfg.particles,
        split: cfg.split, boomerang: cfg.boomerang, spellRef: { data: { base: cfg } } // partial ref
    });
}

function fireBeam(pos, dir, s, spell, dmg) {
    const range = (s.range || 200) * player.rangeMult;
    const geo = new THREE.CylinderGeometry(s.width||0.5, s.width||0.5, range, 8);
    geo.rotateX(-Math.PI/2);
    geo.translate(0, 0, range/2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: spell.data.color, transparent: true, opacity: 0.8}));
    mesh.position.copy(pos);
    mesh.lookAt(pos.clone().add(dir));
    scene.add(mesh);
    setTimeout(() => scene.remove(mesh), 150);

    // Raycast Logic
    // Simple line check against enemies
    let hits = 0;
    entities.enemies.forEach(e => {
        const toEnemy = e.mesh.position.clone().sub(pos);
        const projection = toEnemy.dot(dir);
        if(projection > 0 && projection < range) {
            const perpDist = toEnemy.sub(dir.clone().multiplyScalar(projection)).length();
            if(perpDist < (1 + (s.width||0.5) + e.radius)) {
                 damageEnemy(e, dmg);
                 hits++;
                 if(!s.pierce && hits > 0) return; // Stop if not piercing
            }
        }
    });
}

function drawChainBolt(p1, p2, color) {
    const pts = [p1, p2];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color: color}));
    scene.add(line);
    setTimeout(() => scene.remove(line), 100);
}

function startChain(target, dmg, bounces, spell) {
    damageEnemy(target, dmg);
    drawChainBolt(charGroup.position, target.mesh.position, spell.data.color);

    if(bounces > 0) {
        setTimeout(() => {
            let next = getClosestEnemyExcluding(target.mesh.position, 40, [target]);
            if(next) startChainRecursive(next, target.mesh.position, dmg * 0.8, bounces - 1, spell);
        }, 100);
    }
}

function startChainRecursive(target, fromPos, dmg, bounces, spell) {
     damageEnemy(target, dmg);
     drawChainBolt(fromPos, target.mesh.position, spell.data.color);
     if(bounces > 0) {
        setTimeout(() => {
            let next = getClosestEnemyExcluding(target.mesh.position, 40, [target]);
            if(next) startChainRecursive(next, target.mesh.position, dmg * 0.8, bounces - 1, spell);
        }, 100);
    }
}

function damageEnemy(e, amt) {
    // Armor Check (Player armor doesn't affect enemies, but good structure)

    // CRIT LOGIC
    let finalDmg = amt;
    let isCrit = Math.random() < player.critChance;
    if(isCrit) finalDmg *= player.critMult;
    finalDmg = Math.ceil(finalDmg);

    e.hp -= finalDmg;
    showFloatText(finalDmg + (isCrit?"!":""), e.mesh.position, isCrit ? 0xff0000 : 0xffffff, isCrit);

    // Visual Flash
    if(e.mesh.children.length > 0) {
        e.mesh.children[0].material.color.setHex(0xffffff); 
        setTimeout(() => { if(e.alive) e.mesh.children[0].material.color.setHex(e.color); }, 50);
    }

    // Lifesteal
    if(player.lifesteal > 0) {
        player.hp = Math.min(player.maxHp, player.hp + (finalDmg * player.lifesteal));
        updateHUD();
    }

    if (e.hp <= 0 && e.alive) {
        e.alive = false;
        createExplosion(e.mesh.position, e.color);
        gainXpDrop(e);
        removeEnemy(entities.enemies.indexOf(e));
    }
}

function gainXpDrop(e) {
    // BUFF: Increased XP vals
    const xpVal = (e.type === 'boss' ? 100 : e.type === 'tank' ? 10 : 2);
    const orbGeo = new THREE.OctahedronGeometry(0.5);
    const orb = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({color: CONFIG.colors.green}));
    orb.position.copy(e.mesh.position);
    scene.add(orb);
    entities.orbs.push({ mesh: orb, xp: xpVal * player.xpMult, type: 'xp', val: xpVal * player.xpMult });

    if (Math.random() < 0.02 * player.luck) { 
        spawnDrop(e.mesh.position);
    }
}

function spawnDrop(pos) {
    // FIX: Smart Synergy Drops
    // Only allow synergy items if we have the target weapon
    const pool = ITEMS.filter(i => {
        if(i.type === 'synergy') {
            return player.activeSpells.some(s => s.id === i.target);
        }
        return true; // generics always allowed
    });

    if(pool.length === 0) return; // Safety check

    const item = pool[Math.floor(Math.random() * pool.length)];
    const box = createNeonMesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), CONFIG.colors.legendary);
    box.position.copy(pos);
    scene.add(box);
    entities.drops.push({ mesh: box, item: item });
}

function gainXp(amt) {
    player.xp += amt;
    if(player.xp >= player.maxXp) {
        player.xp -= player.maxXp;
        player.level++;
        player.maxXp = Math.floor(player.maxXp * 1.4);
        showLevelUp();
    }
    updateHUD();
}

function addSpell(id) {
    const proto = WEAPONS.find(w => w.id === id);
    const spell = { id: id, level: 1, cdTimer: 0, data: JSON.parse(JSON.stringify(proto)) };
    player.activeSpells.push(spell);
    renderDock();
    updateHUD();
}

function addPassive(id, mult) {
     const db = PASSIVE_DB.find(p => p.id === id);
     if(db) {
         player.passives.push(id); // Track owned
         db.apply(player, mult);
         renderInventory();
         updateHUD();
     }
}

// --- LEVEL UP & META ---
function pickRarity() {
    const r = Math.random() * 100;
    let sum = 0;
    for(let rw of RARITY_WEIGHTS) {
        sum += rw.weight;
        if (r <= sum) return rw;
    }
    return RARITY_WEIGHTS[0];
}

window.doReroll = function() {
    if(player.rerolls > 0) {
        player.rerolls--;
        showLevelUp(); // Refresh options
    }
};

window.doBan = function(id, e) {
    e.stopPropagation(); // Prevent card click
    if(player.bans > 0) {
        player.bans--;
        player.banList.push(id);
        showLevelUp(); // Refresh excluding banned
    }
};

function showLevelUp() {
    engineState.gameState = 'PAUSED';
    const modal = document.getElementById('levelup-modal');
    const container = document.getElementById('upgrade-cards');
    container.innerHTML = '';
    document.getElementById('levelup-title').innerText = "SYSTEM UPGRADE";
    document.querySelector('.reroll-container').style.display = 'flex';

    const options = [];
    const canAddNew = player.activeSpells.length < player.maxWeapons;

    // Fill options with Upgrades or New Weapons/Passives
    while(options.length < 3) {
        const isSpell = Math.random() > 0.4;
        if(isSpell) {
             const existing = player.activeSpells[Math.floor(Math.random() * player.activeSpells.length)];

             // If we picked an existing weapon that can be upgraded
             if(existing && existing.level < 10) {
                 // CRITICAL FIX: Check if options ALREADY contains an upgrade for THIS weapon ID
                 if(!options.find(o => o.type === 'upgrade' && o.spell.id === existing.id)) {
                     options.push({type:'upgrade', spell: existing});
                 }
             } else if (canAddNew) {
                 const newWep = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
                 // Check if we already own it OR if it's already in the options list
                 if(!player.activeSpells.find(s => s.id === newWep.id) && !options.find(o => o.type === 'new' && o.spell.id === newWep.id)) {
                     options.push({type:'new', spell: newWep});
                 }
             }
        } else {
            const p = PASSIVE_DB[Math.floor(Math.random() * PASSIVE_DB.length)];
            // Check if passive is already in options
            if(!options.find(o => o.type === 'passive' && o.passive.id === p.id)) {
                options.push({type:'passive', passive: p});
            }
        }
        // Safety break if we can't find unique options easily (e.g. end game)
        if(options.length < 3 && Math.random() > 0.95) break; 
    }

    options.forEach(opt => {
        const card = document.createElement('div');

        if(opt.type === 'new') {
             card.className = `upgrade-card rarity-new`;
             // Use WEAPONS array icon
             card.innerHTML = `<div class="card-title">NEW: ${opt.spell.name}</div><div style="font-size:40px; margin:10px 0;">${opt.spell.icon}</div><div class="card-desc">${opt.spell.desc}</div>`;
             card.onclick = () => { addSpell(opt.spell.id); closeModal(); };
        } else if(opt.type === 'upgrade') {
             card.className = `upgrade-card rarity-rare`;
             card.innerHTML = `<div class="card-title">UPGRADE: ${opt.spell.data.name}</div><div style="font-size:40px; margin:10px 0;">${opt.spell.data.icon}</div><div class="card-desc">Lvl ${opt.spell.level + 1}</div>`;
             card.onclick = () => { opt.spell.level++; renderDock(); closeModal(); };
        } else {
             card.className = `upgrade-card rarity-common`;
             card.innerHTML = `<div class="card-title">${opt.passive.name}</div><div style="font-size:40px; margin:10px 0;">${opt.passive.icon}</div><div class="card-desc">${opt.passive.desc}</div>`;
             card.onclick = () => { addPassive(opt.passive.id, 1); closeModal(); };
        }
        container.appendChild(card);
    });
    modal.style.display = 'block';
}

// --- Standard Boilerplate Functions for Rendering/Helpers ---
window.closeModal = function() { document.getElementById('levelup-modal').style.display = 'none'; engineState.gameState = 'PLAYING'; }
window.renderInventory = function() { 
    const pList = document.getElementById('passive-list'); pList.innerHTML = '';
    const pCounts = {}; player.passives.forEach(id => pCounts[id] = (pCounts[id] || 0) + 1);
    Object.keys(pCounts).forEach(id => {
        const db = PASSIVE_DB.find(p => p.id === id);
        if(db) {
            const div = document.createElement('div'); div.className = 'inv-item rarity-common';
            div.innerHTML = `<span class="inv-icon">${db.icon}</span><span>${db.name}</span><span class="inv-count">x${pCounts[id]}</span>`;
            pList.appendChild(div);
        }
    });
}
function renderDock() {
    const dock = document.getElementById('spell-dock'); dock.innerHTML = '';
    for(let i=0; i<4; i++) {
        const s = player.activeSpells[i];
        const div = document.createElement('div');
        if(s) {
            div.className = s.isEvo ? 'spell-slot evo' : 'spell-slot active';
            if(s.isEvo) div.classList.add('synergy-active'); // Simple border for now
            div.innerHTML = `<div class="spell-icon">${s.data.icon}</div><div class="spell-lvl">${s.level}</div>`;
        } else { div.className = 'spell-slot locked'; div.innerText = "EMPTY"; }
        dock.appendChild(div);
    }
}
function updateHUD() {
     document.getElementById('hp-text').innerText = Math.ceil(player.hp) + "/" + Math.ceil(player.maxHp);
     document.getElementById('hp-bar').style.width = (player.hp/player.maxHp*100)+"%";
     document.getElementById('xp-bar').style.width = (player.xp/player.maxXp*100)+"%";
     document.getElementById('lvl-text').innerText = player.level;
     document.getElementById('gold-text').innerText = player.gold;
}

// --- 2D COLLISION & UTILS ---
function getClosestEnemy(pos, range=999) {
    let c = null, d = 999;
    entities.enemies.forEach(e => { const dist = e.mesh.position.distanceTo(pos); if(dist<d && e.alive) { d=dist; c=e; } });
    return c;
}
function getClosestEnemyExcluding(pos, range, excludeList) {
    let c=null,d=range;
    entities.enemies.forEach(e=>{
        if(excludeList.includes(e)) return;
        const dist=e.mesh.position.distanceTo(pos);
        if(dist<d && e.alive){d=dist;c=e;}
    });
    return c;
}
function createExplosion(pos, color, count=5) {
    for(let i=0; i<count; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3), new THREE.MeshBasicMaterial({color: color}));
        m.position.copy(pos); scene.add(m);
        entities.particles.push({ mesh: m, vel: new THREE.Vector3((Math.random()-0.5), 1, (Math.random()-0.5)).multiplyScalar(0.2), life: 1.0 });
    }
}
function showFloatText(txt, pos, color, isCrit) {
    const div = document.createElement('div'); div.className = isCrit ? 'floating-text dmg-crit' : 'floating-text dmg-norm';
    div.innerText = txt; div.style.color = '#'+new THREE.Color(color).getHexString();
    const v = pos.clone().project(camera);
    div.style.left = (v.x * .5 + .5) * window.innerWidth + 'px';
    div.style.top = (-v.y * .5 + .5) * window.innerHeight + 'px';
    document.body.appendChild(div); setTimeout(()=>div.remove(), 800);
}
function removeEnemy(i) { scene.remove(entities.enemies[i].mesh); entities.enemies.splice(i,1); }
function removeProjectile(i) { scene.remove(entities.projectiles[i].mesh); entities.projectiles.splice(i,1); }

// Input & Init
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => { mouse.x = (e.clientX/window.innerWidth)*2-1; mouse.y = -(e.clientY/window.innerHeight)*2+1; });
window.addEventListener('resize', () => { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight); });

window.setSpeed = function(speed) {
    engineState.gameSpeed = speed;
    document.querySelectorAll('.speed-btn').forEach(btn => {
        const val = Number(btn.textContent.replace('x', ''));
        btn.classList.toggle('active', val === speed);
    });
};

function showStarterSelection() {
    engineState.gameState = 'PAUSED';
    const modal = document.getElementById('starter-modal');
    const container = document.getElementById('starter-cards');
    container.innerHTML = '';
    document.getElementById('start-screen').style.display = 'none';

    const choices = [];
    while(choices.length < 3) {
        const w = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
        if(!choices.find(c => c.id === w.id)) choices.push(w);
    }

    choices.forEach(w => {
        const card = document.createElement('div');
        card.className = 'upgrade-card rarity-new';
        card.innerHTML = `<div class="card-title">${w.name}</div><div style="font-size:40px; margin:10px 0;">${w.icon}</div><div class="card-desc">${w.desc}</div>`;
        card.onclick = () => { 
            addSpell(w.id); 
            modal.style.display = 'none';
            document.getElementById('stats-panel').style.display = 'block';
            document.getElementById('spell-dock').style.display = 'flex';
            document.getElementById('inventory-panel').style.display = 'block';
            document.getElementById('data-btn').style.display = 'block';
            engineState.gameState = 'PLAYING';
        };
        container.appendChild(card);
    });
    modal.style.display = 'block';
}

window.startGame = function() {
    showStarterSelection();
};

// Database
window.openDatabase = function() {
    engineState.pausedStateCache = engineState.gameState; engineState.gameState = 'PAUSED';
    document.getElementById('database-modal').style.display = 'block';
    const db = document.getElementById('db-content'); db.innerHTML = '';
    // (Populate DB similar to previous code, omitted for brevity in final block but fully functional logic is implied)
    WEAPONS.forEach(w => db.innerHTML += `<div class="db-item"><div class="db-name" style="color:#${new THREE.Color(w.color).getHexString()}">${w.icon} ${w.name}</div><div class="db-desc">${w.desc}</div></div>`);
    PASSIVE_DB.forEach(p => db.innerHTML += `<div class="db-item"><div class="db-name">${p.icon} ${p.name}</div><div class="db-desc">${p.desc}</div></div>`);
    ITEMS.forEach(i => db.innerHTML += `<div class="db-item"><div class="db-name">🎁 ${i.name}</div><div class="db-desc">${i.effect}</div></div>`);
};
window.closeDatabase = function() {
    document.getElementById('database-modal').style.display = 'none';
    if(player.hp > 0) engineState.gameState = 'PLAYING';
};
window.openPauseMenu = function() {
     // Similar logic for Pause Menu
     window.openDatabase(); // Reuse for now or separate
};
