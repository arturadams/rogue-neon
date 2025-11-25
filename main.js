import { buildUi } from './components/uiLayout.js';
import * as THREE from 'three';
import { CONFIG } from './configs/config.js';
import { WEAPONS } from './assets/weapons.js';
import { PASSIVE_DB } from './assets/passives.js';
import { ITEMS } from './assets/items.js';

import { useGameEngine } from './hooks/useGameEngine.js';
import { WeaponFX } from './systems/WeaponFX.js';
import { World } from './core/World.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { MetaSystem } from './systems/MetaSystem.js';

import { engineState, player, entities, keys, mouse, cursorWorldPos } from './state/GameState.js';

buildUi();

const world = new World();
const weaponFX = new WeaponFX(world.scene);
const metaSystem = new MetaSystem(world);
const combatSystem = new CombatSystem(world, weaponFX, metaSystem);

window.startGame = () => metaSystem.showStarterSelection();
window.takeDamage = (amt) => combatSystem.takeDamage(amt);

window.closeModal = () => { 
    document.getElementById('levelup-modal').style.display = 'none'; 
    engineState.gameState = 'PLAYING'; 
};

window.closeItemModal = function() {
    const modal = document.getElementById('item-modal');
    const item = modal.userData.item;
    player.items.push(item.id);
    if(item.id === "i_01") player.moveSpeed += 0.1;
    if(item.id === "i_02") player.flatDmg += 10;
    if(item.id === "i_03") player.rangeMult += 0.15;
    window.renderInventory();
    metaSystem.updateHUD();
    modal.style.display = 'none';
    engineState.gameState = 'PLAYING';
};

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

window.openDatabase = function() {
    if(document.getElementById('database-modal').style.display === 'block') {
        window.closeDatabase();
        return;
    }

    engineState.pausedStateCache = engineState.gameState; 
    engineState.gameState = 'PAUSED';
    document.getElementById('database-modal').style.display = 'block';
    
    const db = document.getElementById('db-content'); 
    
    // 1. Generate static HTML content FIRST
    let htmlContent = '';
    WEAPONS.forEach(w => htmlContent += `<div class="db-item"><div class="db-name" style="color:#${new THREE.Color(w.color).getHexString()}">${w.icon} ${w.name}</div><div class="db-desc">${w.desc}</div></div>`);
    PASSIVE_DB.forEach(p => htmlContent += `<div class="db-item"><div class="db-name">${p.icon} ${p.name}</div><div class="db-desc">${p.desc}</div></div>`);
    ITEMS.forEach(i => htmlContent += `<div class="db-item"><div class="db-name">🎁 ${i.name}</div><div class="db-desc">${i.effect}</div></div>`);
    
    // 2. Set innerHTML (this is safe now as we haven't attached listeners yet)
    db.innerHTML = htmlContent;

    // 3. Create and Prepend the Restart Button (PRESERVING LISTENERS)
    const restartBtn = document.createElement('div');
    restartBtn.className = 'restart-btn'; 
    restartBtn.title = "Hold to force restart";
    restartBtn.style.pointerEvents = "auto"; 
    restartBtn.innerHTML = `
        <span class="restart-label">HOLD TO REBOOT SYSTEM</span>
        <div class="restart-progress-bar"></div>
    `;
    
    // Logic
    let holdTimer = null;
    const HOLD_TIME = 1500;

    const resetHold = () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
        restartBtn.classList.remove('holding');
    };

    restartBtn.addEventListener('mousedown', (e) => {
        if(e.button !== 0) return; 
        restartBtn.classList.add('holding');

        holdTimer = setTimeout(() => {
            restartBtn.classList.add('success');
            restartBtn.querySelector('.restart-label').innerText = "SYSTEM PURGE...";
            // Force reload
            setTimeout(() => window.location.reload(), 100);
        }, HOLD_TIME);
    });

    restartBtn.addEventListener('mouseup', resetHold);
    restartBtn.addEventListener('mouseleave', resetHold);
    
    // Insert at the very top
    db.insertBefore(restartBtn, db.firstChild);
};

window.closeDatabase = function() {
    document.getElementById('database-modal').style.display = 'none';
    if(player.hp > 0 && engineState.pausedStateCache === 'PLAYING') {
        engineState.gameState = 'PLAYING';
    }
};

window.openPauseMenu = function() {
     window.openDatabase();
};

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if(e.key === 'Escape') {
        if(engineState.gameState === 'PLAYING') window.openPauseMenu();
        else if(document.getElementById('database-modal').style.display === 'block') window.closeDatabase();
    }
    if(e.key === ' ' || e.key === 'Space') {
        if(engineState.gameState === 'GAMEOVER') window.location.reload();
    }
});

window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => { 
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; 
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; 
});

const gameEngine = useGameEngine({
    state: engineState,
    config: CONFIG,
    player,
    scene: world.scene,
    camera: world.camera,
    composer: world.composer,
    charGroup: world.charGroup,
    keys,
    cursorWorldPos,
    cursorMesh: world.cursorMesh,
    aimLinePool: world.aimLinePool,
    raycaster: world.raycaster,
    mouse,
    groundPlane: world.groundPlane,
    entities,
    createNeonMesh: world.createNeonMesh.bind(world),
    removeEnemy: combatSystem.removeEnemy.bind(combatSystem),
    removeProjectile: combatSystem.removeProjectile.bind(combatSystem),
    weaponFX, 
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

gameEngine.animate();