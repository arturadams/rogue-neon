import { buildUi } from './components/uiLayout.js';
import * as THREE from 'three';
import { CONFIG } from './configs/config.js';
import { WEAPONS } from './assets/weapons.js';
import { PASSIVE_DB } from './assets/passives.js';
import { ITEMS } from './assets/items.js';

// --- NEW IMPORTS ---
import { useGameEngine } from './hooks/useGameEngine.js';
import { WeaponFX } from './systems/WeaponFX.js';
import { World } from './core/World.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { MetaSystem } from './systems/MetaSystem.js';

// Import centralized state
import { engineState, player, entities, keys, mouse, cursorWorldPos } from './state/GameState.js';

// 1. Build the HTML UI Layout
buildUi();

// 2. Initialize Core Systems (Dependency Injection)
const world = new World();
const weaponFX = new WeaponFX(world.scene);
const metaSystem = new MetaSystem(world);
const combatSystem = new CombatSystem(world, weaponFX, metaSystem);

// 3. Global API (GLUE CODE)
// These functions are called directly by the HTML UI (onclick events)

window.startGame = () => metaSystem.showStarterSelection();
window.takeDamage = (amt) => combatSystem.takeDamage(amt);

// Modal Management
window.closeModal = () => { 
    document.getElementById('levelup-modal').style.display = 'none'; 
    engineState.gameState = 'PLAYING'; 
};

window.closeItemModal = function() {
    const modal = document.getElementById('item-modal');
    const item = modal.userData.item;
    
    // Logic: Add item to player state
    player.items.push(item.id);
    
    // Logic: Apply immediate stat bonuses
    if(item.id === "i_01") player.moveSpeed += 0.1;
    if(item.id === "i_02") player.flatDmg += 10;
    if(item.id === "i_03") player.rangeMult += 0.15;
    
    // Logic: Update UI
    window.renderInventory();
    metaSystem.updateHUD();
    
    modal.style.display = 'none';
    engineState.gameState = 'PLAYING';
};

// Inventory Rendering (UI Glue)
window.renderInventory = function() { 
    const pList = document.getElementById('passive-list'); 
    pList.innerHTML = '';
    const pCounts = {}; 
    player.passives.forEach(id => pCounts[id] = (pCounts[id] || 0) + 1);
    
    Object.keys(pCounts).forEach(id => {
        const db = PASSIVE_DB.find(p => p.id === id);
        if(db) {
            const div = document.createElement('div'); 
            div.className = 'inv-item rarity-common';
            div.innerHTML = `<span class="inv-icon">${db.icon}</span><span>${db.name}</span><span class="inv-count">x${pCounts[id]}</span>`;
            pList.appendChild(div);
        }
    });
};

// Meta Actions
window.doReroll = function() {
    if(player.rerolls > 0) {
        player.rerolls--;
        metaSystem.showLevelUp(); 
    }
};

window.doBan = function(id, e) {
    e.stopPropagation(); 
    if(player.bans > 0) {
        player.bans--;
        player.banList.push(id);
        metaSystem.showLevelUp(); 
    }
};

window.setSpeed = function(speed) {
    engineState.gameSpeed = speed;
    document.querySelectorAll('.speed-btn').forEach(btn => {
        const val = Number(btn.textContent.replace('x', ''));
        btn.classList.toggle('active', val === speed);
    });
};

// Database UI
window.openDatabase = function() {
    engineState.pausedStateCache = engineState.gameState; 
    engineState.gameState = 'PAUSED';
    document.getElementById('database-modal').style.display = 'block';
    
    const db = document.getElementById('db-content'); 
    db.innerHTML = '';
    
    WEAPONS.forEach(w => db.innerHTML += `<div class="db-item"><div class="db-name" style="color:#${new THREE.Color(w.color).getHexString()}">${w.icon} ${w.name}</div><div class="db-desc">${w.desc}</div></div>`);
    PASSIVE_DB.forEach(p => db.innerHTML += `<div class="db-item"><div class="db-name">${p.icon} ${p.name}</div><div class="db-desc">${p.desc}</div></div>`);
    ITEMS.forEach(i => db.innerHTML += `<div class="db-item"><div class="db-name">🎁 ${i.name}</div><div class="db-desc">${i.effect}</div></div>`);
};

window.closeDatabase = function() {
    document.getElementById('database-modal').style.display = 'none';
    if(player.hp > 0) engineState.gameState = 'PLAYING';
};

window.openPauseMenu = function() {
     window.openDatabase();
};

// 4. Input Listeners
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => { 
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; 
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; 
});

// 5. Initialize Engine Hook
const gameEngine = useGameEngine({
    // State injection
    state: engineState,
    config: CONFIG,
    player,
    entities,
    keys,
    mouse,
    cursorWorldPos,

    // World injection
    scene: world.scene,
    camera: world.camera,
    composer: world.composer,
    charGroup: world.charGroup,
    cursorMesh: world.cursorMesh,
    aimLinePool: world.aimLinePool,
    raycaster: world.raycaster,
    groundPlane: world.groundPlane,
    createNeonMesh: world.createNeonMesh.bind(world),

    // System injection
    weaponFX, 
    removeEnemy: combatSystem.removeEnemy.bind(combatSystem),
    removeProjectile: combatSystem.removeProjectile.bind(combatSystem),

    // Helper function injection (Bridge between Hook and Systems)
    helpers: {
        updateHUD: metaSystem.updateHUD.bind(metaSystem),
        showFloatText: metaSystem.showFloatText.bind(metaSystem),
        castSpell: combatSystem.castSpell.bind(combatSystem),
        takeDamage: combatSystem.takeDamage.bind(combatSystem),
        damageEnemy: combatSystem.damageEnemy.bind(combatSystem),
        gainXpDrop: metaSystem.gainXpDrop.bind(metaSystem),
        gainXp: metaSystem.gainXp.bind(metaSystem),
        spawnDrop: metaSystem.spawnDrop.bind(metaSystem),
        showItemModal: metaSystem.showItemModal.bind(metaSystem),
        showEvolutionModal: metaSystem.showEvolutionModal.bind(metaSystem),
        getClosestEnemy: combatSystem.getClosestEnemy.bind(combatSystem),
        getClosestEnemyExcluding: combatSystem.getClosestEnemyExcluding.bind(combatSystem),
        createExplosion: combatSystem.createExplosion.bind(combatSystem),
        spawnZone: combatSystem.spawnZone.bind(combatSystem),
        fireProj: combatSystem.fireProj.bind(combatSystem),
        fireBeam: combatSystem.fireBeam.bind(combatSystem),
        drawChainBolt: combatSystem.drawChainBolt.bind(combatSystem),
        startChain: combatSystem.startChain.bind(combatSystem),
        startChainRecursive: combatSystem.startChainRecursive.bind(combatSystem)
    }
});

// 6. Start the Game Loop
gameEngine.animate();