import * as THREE from 'three';
import { CONFIG } from '../configs/config.js';
import { RARITY_WEIGHTS } from '../configs/rarities.js';
import { WEAPONS } from '../assets/weapons.js';
import { PASSIVE_DB } from '../assets/passives.js';
import { ITEMS } from '../assets/items.js';
import { entities, player, engineState, IMPLEMENTED_WEAPON_IDS } from '../state/GameState.js';

export class MetaSystem {
    constructor(world) {
        this.world = world;
        this.scene = world.scene;
    }

    updateHUD() {
        document.getElementById('hp-text').innerText = Math.ceil(player.hp) + "/" + Math.ceil(player.maxHp);
        document.getElementById('hp-bar').style.width = (player.hp/player.maxHp*100)+"%";
        document.getElementById('xp-bar').style.width = (player.xp/player.maxXp*100)+"%";
        document.getElementById('lvl-text').innerText = player.level;
        document.getElementById('gold-text').innerText = player.gold;
    }

    showFloatText(txt, pos, color, isCrit) {
        const div = document.createElement('div'); 
        div.className = isCrit ? 'floating-text dmg-crit' : 'floating-text dmg-norm';
        div.innerText = txt; 
        div.style.color = '#'+new THREE.Color(color).getHexString();
        
        const v = pos.clone().project(this.world.camera);
        div.style.left = (v.x * .5 + .5) * window.innerWidth + 'px';
        div.style.top = (-v.y * .5 + .5) * window.innerHeight + 'px';
        document.body.appendChild(div); 
        setTimeout(()=>div.remove(), 800);
    }

    gainXpDrop(e) {
        const xpVal = (e.type === 'boss' ? 100 : e.type === 'tank' ? 10 : 2);
        const orbGeo = new THREE.OctahedronGeometry(0.5);
        const orb = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({color: CONFIG.colors.green}));
        orb.position.copy(e.mesh.position);
        this.scene.add(orb);
        entities.orbs.push({ mesh: orb, xp: xpVal * player.xpMult, type: 'xp', val: xpVal * player.xpMult });
    
        if (Math.random() < 0.02 * player.luck) { 
            this.spawnDrop(e.mesh.position);
        }
    }
    
    spawnDrop(pos) {
        const pool = ITEMS.filter(i => {
            if(i.type === 'synergy') {
                return player.activeSpells.some(s => s.id === i.target);
            }
            return true; 
        });
    
        if(pool.length === 0) return; 
    
        const item = pool[Math.floor(Math.random() * pool.length)];
        const box = this.world.createNeonMesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), CONFIG.colors.legendary);
        box.position.copy(pos);
        this.scene.add(box);
        entities.drops.push({ mesh: box, item: item });
    }
    
    gainXp(amt) {
        player.xp += amt;
        if(player.xp >= player.maxXp) {
            player.xp -= player.maxXp;
            player.level++;
            player.maxXp = Math.floor(player.maxXp * 1.4);
            this.showLevelUp();
        }
        this.updateHUD();
    }

    addSpell(id) {
        const proto = WEAPONS.find(w => w.id === id);
        const spell = { id: id, level: 1, cdTimer: 0, data: JSON.parse(JSON.stringify(proto)) };
        player.activeSpells.push(spell);
        this.renderDock();
        this.updateHUD();
    }
    
    addPassive(id, mult) {
         const db = PASSIVE_DB.find(p => p.id === id);
         if(db) {
             player.passives.push(id); 
             db.apply(player, mult);
             window.renderInventory(); // Global ref kept for UI Layout compat
             this.updateHUD();
         }
    }

    renderDock() {
        const dock = document.getElementById('spell-dock'); dock.innerHTML = '';
        for(let i=0; i<4; i++) {
            const s = player.activeSpells[i];
            const div = document.createElement('div');
            if(s) {
                div.className = s.isEvo ? 'spell-slot evo' : 'spell-slot active';
                if(s.isEvo) div.classList.add('synergy-active'); 
                div.innerHTML = `<div class="spell-icon">${s.data.icon}</div><div class="spell-lvl">${s.level}</div>`;
            } else { div.className = 'spell-slot locked'; div.innerText = "EMPTY"; }
            dock.appendChild(div);
        }
    }

    showLevelUp() {
        engineState.gameState = 'PAUSED';
        const modal = document.getElementById('levelup-modal');
        const container = document.getElementById('upgrade-cards');
        container.innerHTML = '';
        document.getElementById('levelup-title').innerText = "SYSTEM UPGRADE";
        document.querySelector('.reroll-container').style.display = 'flex';
    
        const validOptions = [];
    
        // A) New Weapons
        if(player.activeSpells.length < player.maxWeapons) {
            IMPLEMENTED_WEAPON_IDS.forEach(id => {
                if(!player.activeSpells.find(s => s.id === id) && !player.banList.includes(id)) {
                     const def = WEAPONS.find(w => w.id === id);
                     if(def) validOptions.push({ type: 'new_wep', def: def });
                }
            });
        }
    
        // B) Weapon Upgrades
        player.activeSpells.forEach(s => {
            if(s.level < 10) {
                validOptions.push({ type: 'upgrade_wep', spell: s });
            }
        });
    
        // C) Passives
        const uniquePassives = new Set(player.passives);
        const slotsFull = uniquePassives.size >= player.maxPassives;
    
        PASSIVE_DB.forEach(p => {
            if(player.banList.includes(p.id)) return;
            const owned = uniquePassives.has(p.id);
            if(owned) {
                validOptions.push({ type: 'passive', def: p, isNew: false });
            } 
            else if(!slotsFull) {
                validOptions.push({ type: 'passive', def: p, isNew: true });
            }
        });
    
        // Pick 3
        const choices = [];
        for (let i = validOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validOptions[i], validOptions[j]] = [validOptions[j], validOptions[i]];
        }
        for(let i=0; i<Math.min(3, validOptions.length); i++) {
            choices.push(validOptions[i]);
        }
    
        // Render
        choices.forEach(opt => {
            const card = document.createElement('div');
            
            if(opt.type === 'new_wep') {
                 card.className = `upgrade-card rarity-new`;
                 card.innerHTML = `<div class="card-title">NEW: ${opt.def.name}</div><div style="font-size:40px; margin:10px 0;">${opt.def.icon}</div><div class="card-desc">${opt.def.desc}</div>`;
                 card.onclick = () => { this.addSpell(opt.def.id); window.closeModal(); };
            } 
            else if(opt.type === 'upgrade_wep') {
                 card.className = `upgrade-card rarity-rare`;
                 card.innerHTML = `<div class="card-title">UPGRADE: ${opt.spell.data.name}</div><div style="font-size:40px; margin:10px 0;">${opt.spell.data.icon}</div><div class="card-desc">Lvl ${opt.spell.level + 1}</div>`;
                 card.onclick = () => { opt.spell.level++; this.renderDock(); window.closeModal(); };
            } 
            else if(opt.type === 'passive') {
                 const titlePrefix = opt.isNew ? "NEW: " : "UPGRADE: ";
                 card.className = opt.isNew ? `upgrade-card rarity-uncommon` : `upgrade-card rarity-common`;
                 card.innerHTML = `<div class="card-title">${titlePrefix}${opt.def.name}</div><div style="font-size:40px; margin:10px 0;">${opt.def.icon}</div><div class="card-desc">${opt.def.desc}</div>`;
                 card.onclick = () => { this.addPassive(opt.def.id, 1); window.closeModal(); };
            }
            
            const banBtn = document.createElement('div');
            banBtn.className = 'ban-btn';
            banBtn.innerText = 'X';
            banBtn.title = `Ban this item (${player.bans} left)`;
            banBtn.onclick = (e) => window.doBan(opt.type.includes('wep') ? (opt.def?.id || opt.spell.id) : opt.def.id, e);
            if(player.bans > 0) card.appendChild(banBtn);
    
            container.appendChild(card);
        });
        
        if(choices.length === 0) {
            container.innerHTML = '<div style="color:white; margin-top:50px;">ALL SYSTEMS MAXED OUT<br>LIMIT BREAK PENDING...</div>';
            setTimeout(window.closeModal, 2000); 
        }
    
        modal.style.display = 'block';
    }

    showStarterSelection() {
        engineState.gameState = 'PAUSED';
        const modal = document.getElementById('starter-modal');
        const container = document.getElementById('starter-cards');
        container.innerHTML = '';
        document.getElementById('start-screen').style.display = 'none';
    
        const pool = [...IMPLEMENTED_WEAPON_IDS];
        const choices = [];
        while(choices.length < 3 && pool.length > 0) {
            const idx = Math.floor(Math.random() * pool.length);
            const id = pool.splice(idx, 1)[0];
            const w = WEAPONS.find(we => we.id === id);
            if(w) choices.push(w);
        }
    
        choices.forEach(w => {
            const card = document.createElement('div');
            card.className = 'upgrade-card rarity-new';
            card.innerHTML = `<div class="card-title">${w.name}</div><div style="font-size:40px; margin:10px 0;">${w.icon}</div><div class="card-desc">${w.desc}</div>`;
            card.onclick = () => { 
                this.addSpell(w.id); 
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

    showItemModal(item) {
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

   showEvolutionModal(weapon, synergyItem) {
        engineState.gameState = 'PAUSED';
        const modal = document.getElementById('levelup-modal');
        const container = document.getElementById('upgrade-cards');
        container.innerHTML = '';
        document.getElementById('levelup-title').innerText = "WEAPON EVOLUTION";

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
                this.evolveWeapon(weapon, choice);
                window.closeModal();
            };
            container.appendChild(card);
        });

        document.querySelector('.reroll-container').style.display = 'none'; 
        modal.style.display = 'block';
    }

    evolveWeapon(weapon, choice) {
        weapon.isEvo = true;
        weapon.path = choice.path;
        weapon.data.name = choice.name; 
        weapon.data.base.dmg *= 1.5;   
        this.renderDock();
    }
}