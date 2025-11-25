import * as THREE from 'three';
import { CONFIG } from '../configs/config.js';
import { entities, player, cursorWorldPos, engineState } from '../state/GameState.js';

export class CombatSystem {
    constructor(world, weaponFX, metaSystem) {
        this.world = world;
        this.scene = world.scene;
        this.weaponFX = weaponFX;
        this.metaSystem = metaSystem; // Circular dependency resolved by passing instance
    }

    takeDamage(amt) {
        if(player.items.includes("i_28")) {
            entities.enemies.forEach(e => {
                this.createExplosion(e.mesh.position, 0xffaa00, 5);
                this.damageEnemy(e, 9999);
            });
            return;
        }
    
        let actual = Math.max(1, amt - player.armor);
        player.hp -= actual; 
        this.metaSystem.updateHUD();
        
        document.body.style.backgroundColor = '#550000';
        setTimeout(() => document.body.style.backgroundColor = CONFIG.colors.bg.toString(16), 50);
    
        if(player.hp <= 0) {
             if(player.revives > 0) {
                 player.revives--;
                 player.hp = player.maxHp * 0.5;
                 player.invuln = 120;
                 this.metaSystem.showFloatText("REVIVED!", this.world.charGroup.position, 0x00ff00);
                 this.metaSystem.updateHUD();
             } else {
                 engineState.gameState = 'GAMEOVER';
                 document.getElementById('gameover-modal').style.display = 'block';
                 document.getElementById('final-wave').innerText = engineState.wave;
             }
        }
    }

    damageEnemy(e, amt) {
        let finalDmg = amt;
        let isCrit = Math.random() < player.critChance;
        if(isCrit) finalDmg *= player.critMult;
        finalDmg = Math.ceil(finalDmg);
    
        e.hp -= finalDmg;
        this.metaSystem.showFloatText(finalDmg + (isCrit?"!":""), e.mesh.position, isCrit ? 0xff0000 : 0xffffff, isCrit);
    
        if(e.mesh.children.length > 0) {
            e.mesh.children[0].material.color.setHex(0xffffff); 
            setTimeout(() => { if(e.alive) e.mesh.children[0].material.color.setHex(e.color); }, 50);
        }
    
        if(player.lifesteal > 0) {
            player.hp = Math.min(player.maxHp, player.hp + (finalDmg * player.lifesteal));
            this.metaSystem.updateHUD();
        }
    
        if (e.hp <= 0 && e.alive) {
            e.alive = false;
            this.createExplosion(e.mesh.position, e.color);
            this.metaSystem.gainXpDrop(e);
            this.removeEnemy(entities.enemies.indexOf(e));
        }
    }

    removeEnemy(i) { 
        if(i > -1 && entities.enemies[i]) {
            this.scene.remove(entities.enemies[i].mesh); 
            entities.enemies.splice(i, 1); 
        }
    }

    removeProjectile(i) { 
        if(i > -1 && entities.projectiles[i]) {
            this.scene.remove(entities.projectiles[i].mesh); 
            entities.projectiles.splice(i, 1); 
        }
    }

    createExplosion(pos, color, count=5) {
        for(let i=0; i<count; i++) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3), new THREE.MeshBasicMaterial({color: color}));
            m.position.copy(pos); 
            this.scene.add(m);
            entities.particles.push({ mesh: m, vel: new THREE.Vector3((Math.random()-0.5), 1, (Math.random()-0.5)).multiplyScalar(0.2), life: 1.0 });
        }
    }

    castSpell(spell) {
        const s = spell.data;
        const cfg = spell.data.base;
        let dmg = (cfg.dmg + player.flatDmg) * player.damageMult;
        let shots = (cfg.count || 1) + player.multiCast;
    
        // Path Logic
        if(spell.isEvo) {
            if(spell.path === 'A' && spell.id === 'w_01') shots *= 2; 
            if(spell.path === 'B' && spell.id === 'w_01') { dmg *= 3; shots = 1; } 
        }
    
        // Handling Behavioral Types
        if (s.type === 'Kinetic' || s.type === 'Energy' || s.type === 'Explosive' || s.type === 'Exotic') {
            const dir = new THREE.Vector3().subVectors(cursorWorldPos, this.world.charGroup.position).normalize();
            const origin = this.world.charGroup.position.clone().add(new THREE.Vector3(0,3,0));
    
            if(cfg.cone) {
                 const mesh = this.world.createNeonMesh(new THREE.RingGeometry(0.5, 4, 6, 1, 0, Math.PI/3), s.color);
                 mesh.position.copy(this.world.charGroup.position); mesh.position.y = 1;
                 mesh.rotation.x = -Math.PI/2; 
                 mesh.rotation.z = Math.atan2(dir.z, dir.x) - Math.PI/6; 
                 this.scene.add(mesh);
    
                 entities.projectiles.push({
                    mesh: mesh,
                    velocity: dir, speed: 0, damage: dmg, color: s.color, age: 0, 
                    type: 'cone', range: cfg.range || 100, spellRef: spell, width: 20 
                });
                this.weaponFX.trigger(spell.data, origin, dir);
                return true;
            }
            else if(cfg.beam) {
                this.fireBeam(this.world.charGroup.position, dir, cfg, spell, dmg);
                this.weaponFX.trigger(spell.data, origin, dir);
                return true;
            }
            else if(cfg.chain) {
                let target = this.getClosestEnemy(cursorWorldPos, cfg.range);
                if (target) {
                    this.startChain(target, dmg, cfg.chain, spell);
                    this.weaponFX.trigger(spell.data, origin, dir, target.mesh.position);
                    return true;
                }
                return false; 
            }
            else if(cfg.deploy === 'prism' || cfg.deploy === 'mine') {
                 const mesh = this.world.createNeonMesh(new THREE.BoxGeometry(1, 1, 1), s.color);
                 mesh.position.copy(this.world.charGroup.position);
                 this.scene.add(mesh);
                 entities.projectiles.push({
                    mesh, type: cfg.deploy, duration: cfg.duration || 10, age:0, spellRef: spell, damage: dmg, radius: 30
                 });
                 return true;
            }
            else if(cfg.summon === 'drone') {
                if(!spell.drones) spell.drones = [];
                if(spell.drones.length < (cfg.count || 1)) {
                    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1), new THREE.MeshBasicMaterial({color:s.color}));
                    this.scene.add(mesh);
                    const drone = { mesh, type: 'drone', spellRef: spell, damage: dmg, age: 0, target: null };
                    entities.projectiles.push(drone);
                    spell.drones.push(drone);
                }
                return true;
            }
            else {
                for(let i=0; i<shots; i++) {
                    setTimeout(() => {
                        const shotDir = new THREE.Vector3().subVectors(cursorWorldPos, this.world.charGroup.position).normalize();
                        if(i > 0) shotDir.applyAxisAngle(new THREE.Vector3(0,1,0), (i % 2 === 0 ? 1 : -1) * 0.1 * Math.ceil(i/2));
                        
                        // Updated: Pass 'spell' as the last argument
                        this.fireProj(cfg, this.world.charGroup.position.clone().add(new THREE.Vector3(0,3,0)), shotDir, dmg, s.color, spell);
                        this.weaponFX.trigger(spell.data, this.world.charGroup.position.clone().add(new THREE.Vector3(0,3,0)), shotDir);
    
                    }, i * (80/engineState.gameSpeed));
                }
                return true;
            }
        }
        return false;
    }

    spawnZone(pos, cfg, spell) {
        const mesh = this.world.createNeonMesh(new THREE.CylinderGeometry(cfg.area || 5, cfg.area || 5, 0.5, 16), spell.data.color);
        mesh.position.copy(pos); mesh.position.y = 0.5;
        this.scene.add(mesh);
        entities.projectiles.push({
            mesh, type: 'zone', zoneType: cfg.puddle ? 'void' : 'time', 
            radius: cfg.area || 5, damage: (cfg.dmg || 10) * 0.5, interval: 20, duration: 5, age: 0,
            spellRef: spell
        });
    }

    // Updated: Accept spellObj argument
    fireProj(cfg, pos, dir, dmg, color, spellObj = null) {
        let spd = cfg.speed * player.speedMult;
        let rng = (cfg.range || 200) * player.rangeMult;
    
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: color, transparent:true, opacity:0}));
        mesh.position.copy(pos);
        this.scene.add(mesh);
    
        entities.projectiles.push({
            mesh, velocity: dir.multiplyScalar(spd), speed: spd, damage: dmg, 
            color: color, age: 0, type: cfg.homing ? 'homing' : 'projectile', 
            range: rng, width: 0.5, pierce: cfg.pierce, 
            explode: cfg.explode, pull: cfg.pull, particles: cfg.particles,
            // Updated: Use passed spellObj or fallback
            split: cfg.split, boomerang: cfg.boomerang, spellRef: spellObj || { data: { base: cfg } } 
        });
    }

    fireBeam(pos, dir, s, spell, dmg) {
        const range = (s.range || 200) * player.rangeMult;
        let hits = 0;
        entities.enemies.forEach(e => {
            const toEnemy = e.mesh.position.clone().sub(pos);
            const projection = toEnemy.dot(dir);
            if(projection > 0 && projection < range) {
                const perpDist = toEnemy.sub(dir.clone().multiplyScalar(projection)).length();
                if(perpDist < (1 + (s.width||0.5) + e.radius)) {
                     this.damageEnemy(e, dmg);
                     hits++;
                     if(!s.pierce && hits > 0) return; 
                }
            }
        });
    }

    startChain(target, dmg, bounces, spell) {
        this.damageEnemy(target, dmg);
        if(bounces > 0) {
            setTimeout(() => {
                let next = this.getClosestEnemyExcluding(target.mesh.position, 40, [target]);
                if(next) this.startChainRecursive(next, target.mesh.position, dmg * 0.8, bounces - 1, spell);
            }, 100);
        }
    }

    startChainRecursive(target, fromPos, dmg, bounces, spell) {
        this.damageEnemy(target, dmg);
        this.weaponFX.trigger(spell.data, fromPos, new THREE.Vector3().subVectors(target.mesh.position, fromPos).normalize(), target.mesh.position);
   
        if(bounces > 0) {
           setTimeout(() => {
               let next = this.getClosestEnemyExcluding(target.mesh.position, 40, [target]);
               if(next) this.startChainRecursive(next, target.mesh.position, dmg * 0.8, bounces - 1, spell);
           }, 100);
       }
    }

    drawChainBolt(p1, p2, color) {
        const pts = [p1, p2];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color: color}));
        this.scene.add(line);
        setTimeout(() => this.scene.remove(line), 100);
    }

    getClosestEnemy(pos, range=999) {
        let c = null, d = 999;
        entities.enemies.forEach(e => { const dist = e.mesh.position.distanceTo(pos); if(dist<d && e.alive) { d=dist; c=e; } });
        return c;
    }
    
    getClosestEnemyExcluding(pos, range, excludeList) {
        let c=null,d=range;
        entities.enemies.forEach(e=>{
            if(excludeList.includes(e)) return;
            const dist=e.mesh.position.distanceTo(pos);
            if(dist<d && e.alive){d=dist;c=e;}
        });
        return c;
    }
}