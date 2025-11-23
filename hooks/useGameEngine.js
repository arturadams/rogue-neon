import * as THREE from 'three';

export function createEngineState(initial = {}) {
  return {
    gameState: initial.gameState ?? 'MENU',
    wave: initial.wave ?? 1,
    frame: initial.frame ?? 0,
    gameSpeed: initial.gameSpeed ?? 1,
    pausedStateCache: initial.pausedStateCache ?? 'MENU'
  };
}

export function useGameEngine({
  state,
  config,
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
  helpers
}) {
  const {
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
  } = helpers;

  function updateAimGuide() {
    cursorMesh.position.x = cursorWorldPos.x;
    cursorMesh.position.z = cursorWorldPos.z;
    cursorMesh.rotation.z += 0.05;
    aimLinePool.forEach(l => (l.visible = false));
    let poolIdx = 0;
    const start = charGroup.position.clone().add(new THREE.Vector3(0, 3, 0));

    player.activeSpells.forEach(s => {
      const cfg = s.data.base;
      if (!cfg) return;
      let shots = (cfg.count || 1) + player.multiCast;
      if (s.path === 'A' && s.data.id === 'w_01') shots *= 2;

      const range = (cfg.range || 50) * player.rangeMult;
      for (let i = 0; i < shots; i++) {
        if (poolIdx >= aimLinePool.length) break;
        const dir = new THREE.Vector3().subVectors(cursorWorldPos, charGroup.position).normalize();
        if (i > 0) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), (i % 2 === 0 ? 1 : -1) * 0.1 * Math.ceil(i / 2));
        const end = start.clone().add(dir.multiplyScalar(range));
        const pts = [start, end];
        aimLinePool[poolIdx].geometry.setFromPoints(pts);
        aimLinePool[poolIdx].material.color.setHex(s.data.color);
        aimLinePool[poolIdx].visible = true;
        poolIdx++;
      }
    });
  }

  function updatePickups() {
    for (let i = entities.orbs.length - 1; i >= 0; i--) {
      const orb = entities.orbs[i];
      const d = charGroup.position.distanceTo(orb.mesh.position);
      const isMagnet = d < player.magnetRadius;
      orb.mesh.position.lerp(charGroup.position, isMagnet ? 0.2 : 0.015);
      if (d < 2) {
        if (orb.type === 'xp') gainXp(orb.val);
        else player.gold += orb.val;
        updateHUD();
        scene.remove(orb.mesh);
        entities.orbs.splice(i, 1);
      } else if (!isMagnet) orb.mesh.position.y = 1 + Math.sin(state.frame * 0.1 + i) * 0.5;
    }

    for (let i = entities.drops.length - 1; i >= 0; i--) {
      const drop = entities.drops[i];
      const d = charGroup.position.distanceTo(drop.mesh.position);
      drop.mesh.position.lerp(charGroup.position, d < player.magnetRadius ? 0.1 : 0.005);
      if (d < 3) {
        if (drop.item.type === 'synergy') {
          const w = player.activeSpells.find(s => s.id === drop.item.weapon_id);
          if (w && w.level >= 5 && !w.isEvo) {
            showEvolutionModal(w, drop.item);
          } else {
            player.gold += 50;
            showFloatText('+50 GOLD', charGroup.position, 0xffd700);
          }
        } else {
          showItemModal(drop.item);
        }
        scene.remove(drop.mesh);
        entities.drops.splice(i, 1);
      }
      drop.mesh.rotation.y += 0.05;
    }
  }

  function spawnEnemy() {
    const isBossWave = state.wave % 5 === 0;
    let hp = 8 + state.wave * 3 * player.curse;
    let speed = 0.15 + state.wave * 0.01;
    let type = 'normal';
    let color = config.colors.red;
    let scale = 1.5;

    if (state.wave <= 3) {
      hp = 10;
      speed = 0.2;
    }

    const r = Math.random();
    if (r > 0.95 && state.wave > 3) {
      type = 'tank';
      hp *= 4;
      speed *= 0.5;
      color = config.colors.orange;
      scale = 3;
    } else if (r > 0.85 && state.wave > 3) {
      type = 'fast';
      hp *= 0.5;
      speed *= 1.5;
      color = config.colors.pink;
      scale = 1.2;
    }

    if (isBossWave && Math.random() > 0.95) {
      type = 'boss';
      hp *= 20;
      scale = 5;
      speed *= 0.4;
      color = config.colors.mythic;
    }

    const geo = type === 'tank' ? new THREE.BoxGeometry(1, 1, 1) : new THREE.OctahedronGeometry(1);
    const mesh = createNeonMesh(geo, color);
    mesh.scale.set(scale, scale, scale);
    mesh.position.set((Math.random() - 0.5) * (config.laneWidth - 4), scale, config.spawnZ);
    scene.add(mesh);
    const radius = scale * 0.9;
    entities.enemies.push({
      mesh,
      hp,
      maxHp: hp,
      speed,
      alive: true,
      type,
      color,
      baseSpeed: speed,
      radius: radius
    });
  }

  function updateEntities() {
    for (let i = entities.enemies.length - 1; i >= 0; i--) {
      const e = entities.enemies[i];
      e.speedMod = 1;
      if (player.items.includes('i_19')) e.speedMod *= 0.9;

      e.mesh.position.z += e.baseSpeed * e.speedMod;
      e.mesh.rotation.x += 0.05;

      if (player.invuln <= 0) {
        const distToPlayer = charGroup.position.distanceTo(e.mesh.position);
        if (distToPlayer < 2 + e.radius) {
          takeDamage(10);
          if (player.items.includes('i_13')) damageEnemy(e, 50);
          if (player.items.includes('i_14')) damageEnemy(e, 10);
          player.invuln = 60;
          createExplosion(charGroup.position, 0xff0000, 5);
        }
      }
      if (e.mesh.position.z > config.endZone) {
        if (e.type === 'boss' || e.type === 'tank') takeDamage(20);
        removeEnemy(i);
      }
    }

    for (let i = entities.projectiles.length - 1; i >= 0; i--) {
      const p = entities.projectiles[i];
      p.age++;

      const staticTypes = ['void', 'wall', 'orbit', 'zone', 'decoy', 'cone', 'drone', 'chain'];
      const isKinetic = !staticTypes.includes(p.type);

      if (isKinetic) {
        if (p.age > p.range / p.speed) {
          removeProjectile(i);
          continue;
        }
        if (p.velocity) p.mesh.position.add(p.velocity);
      } else if (p.type === 'zone' || p.type === 'void' || p.type === 'wall' || p.type === 'decoy') {
        if (p.age > p.duration * 60) {
          if (p.spellRef && p.spellRef.id && p.spellRef.id.includes('collapse')) createExplosion(p.mesh.position, 0x8800ff, 10);
          removeProjectile(i);
          continue;
        }
      }

      if (p.type === 'homing') {
        if (!p.target || !p.target.alive) p.target = getClosestEnemy(p.mesh.position);
        if (p.target) {
          const dir = new THREE.Vector3().subVectors(p.target.mesh.position, p.mesh.position).normalize();
          p.velocity.lerp(dir.multiplyScalar(p.speed), 0.15);
        }
      } else if (p.type === 'zone') {
        if (p.age % p.interval === 0) {
          for (const e of entities.enemies) {
            if (p.mesh.position.distanceTo(e.mesh.position) < p.radius + e.radius) {
              if (p.zoneType === 'void') {
                damageEnemy(e, p.damage);
                if (p.spellRef && p.spellRef.id.includes('event')) e.mesh.position.lerp(p.mesh.position, 0.2);
                else e.mesh.position.lerp(p.mesh.position, 0.05);
              } else if (p.zoneType === 'time') {
                e.speedMod = p.spellRef.data.slow || 0.4;
                if (p.spellRef && p.spellRef.id.includes('burn')) damageEnemy(e, 2);
              }
            }
          }
        }
        p.mesh.rotation.y += 0.1;
        continue;
      } else if (p.type === 'orbit') {
        p.angle += p.speed;
        p.mesh.position.x = charGroup.position.x + Math.cos(p.angle) * p.radius;
        p.mesh.position.z = charGroup.position.z + Math.sin(p.angle) * p.radius;
        for (const e of entities.enemies) {
          if (p.mesh.position.distanceTo(e.mesh.position) < 2 + e.radius) {
            if (!e.lastOrbitHit || state.frame - e.lastOrbitHit > 30) {
              damageEnemy(e, p.damage);
              e.lastOrbitHit = state.frame;
              createExplosion(e.mesh.position, 0xffffff, 3);
            }
          }
        }
        continue;
      } else if (p.type === 'wall') {
        for (const e of entities.enemies) {
          if (Math.abs(e.mesh.position.z - p.mesh.position.z) < 2 && Math.abs(e.mesh.position.x - p.mesh.position.x) < p.width / 2) {
            e.mesh.position.z = p.mesh.position.z - 2;
            if (state.frame % 20 === 0) damageEnemy(e, 1);
          }
        }
        continue;
      } else if (p.type === 'decoy') {
        for (const e of entities.enemies) {
          if (p.mesh.position.distanceTo(e.mesh.position) < 30) {
            e.mesh.lookAt(p.mesh.position);
            e.mesh.position.lerp(p.mesh.position, 0.02);
          }
        }
        continue;
      } else if (p.type === 'cone') {
        if (p.age % 5 === 0) {
          p.mesh.scale.setScalar(1 + (p.age / 10) * 2);
          p.mesh.material.opacity = 1 - p.age / 10;

          for (const e of entities.enemies) {
            const toEnemy = e.mesh.position.clone().sub(charGroup.position);
            const dist = toEnemy.length();
            if (dist < p.range) {
              const angle = p.velocity.clone().normalize().angleTo(toEnemy.normalize());
              if (angle < 0.6) {
                damageEnemy(e, p.damage);
                e.mesh.position.add(toEnemy.normalize().multiplyScalar(2));
              }
            }
          }
        }
        if (p.age > 10) removeProjectile(i);
        continue;
      }

      let hit = false;
      for (const e of entities.enemies) {
        if (p.type === 'chain') {
          continue;
        } else if (p.type === 'drone') {
          if (p.target && p.target.alive) {
            const dir = new THREE.Vector3().subVectors(p.target.mesh.position, p.mesh.position).normalize();
            p.mesh.position.add(dir.multiplyScalar(0.2));
            if (p.mesh.position.distanceTo(p.target.mesh.position) < 2) {
              damageEnemy(p.target, p.damage);
              createExplosion(p.mesh.position, p.spellRef.data.color, 2);
              p.target = null;
            }
          } else {
            const t = getClosestEnemy(p.mesh.position, 80);
            if (t) p.target = t;
          }
          continue;
        }

        const dist = p.mesh.position.distanceTo(e.mesh.position);
        if (dist < 1.2 + e.radius) {
          if (p.type === 'beam') {
            damageEnemy(e, p.damage);
          } else if (p.type === 'zone') {
            if (p.zoneType === 'blizzard') damageEnemy(e, p.damage * 0.02);
          } else if (p.type === 'wave') {
            if (!p.hitList.includes(e)) {
              damageEnemy(e, p.damage);
              e.mesh.position.z -= p.push;
              p.hitList.push(e);
            }
          } else {
            damageEnemy(e, p.damage);
            if (p.legendaryExplode) createExplosion(e.mesh.position, 0xffaa00, 10);
            createExplosion(p.mesh.position, p.color, 3);

            if (p.tags && p.tags.includes('split')) {
              fireProj({ ...p.spellRef.data, speed: p.speed, range: 50, damage: p.damage * 0.5, type: 'projectile' }, p.mesh.position, p.velocity.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5).normalize(), p.damage * 0.5);
              fireProj({ ...p.spellRef.data, speed: p.speed, range: 50, damage: p.damage * 0.5, type: 'projectile' }, p.mesh.position, p.velocity.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.5).normalize(), p.damage * 0.5);
            }

            if (p.spellRef && p.spellRef.id.includes('neon_bolt') && player.items.includes('item_mirror_chip') && !p.ricocheted) {
              const next = getClosestEnemyExcluding(p.mesh.position, 50, [e]);
              if (next) {
                p.velocity = new THREE.Vector3().subVectors(next.mesh.position, p.mesh.position).normalize().multiplyScalar(p.speed);
                p.ricocheted = true;
                continue;
              }
            }

            if (p.spellRef && p.spellRef.data.base.puddle) {
              spawnZone(p.mesh.position, p.spellRef.data.base, p.spellRef);
            }

            if (!p.pierce) {
              hit = true;
              break;
            }
          }
        }
      }
      if (hit) removeProjectile(i);
    }

    for (let i = entities.particles.length - 1; i >= 0; i--) {
      const p = entities.particles[i];
      p.mesh.position.add(p.vel);
      p.life -= 0.05;
      p.mesh.scale.setScalar(p.life);
      if (p.life <= 0) {
        scene.remove(p.mesh);
        entities.particles.splice(i, 1);
      }
    }
  }

  function gameTick() {
    state.frame++;
    const dt = 1 / 60;
    let moveSpeed = 0.4 * player.moveSpeed;
    if (player.items.includes('i_37')) moveSpeed = 0;

    if (keys.w) charGroup.position.z -= moveSpeed;
    if (keys.s) charGroup.position.z += moveSpeed;
    if (keys.a) charGroup.position.x -= moveSpeed;
    if (keys.d) charGroup.position.x += moveSpeed;
    charGroup.position.x = Math.max(-config.laneWidth / 2, Math.min(config.laneWidth / 2, charGroup.position.x));
    charGroup.position.z = Math.max(-60, Math.min(config.endZone - 2, charGroup.position.z));

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(groundPlane, cursorWorldPos);
    charGroup.lookAt(cursorWorldPos.x, charGroup.position.y, cursorWorldPos.z);

    if (player.invuln > 0) player.invuln--;
    if (player.invuln > 0 && state.frame % 4 === 0) charGroup.visible = !charGroup.visible;
    else charGroup.visible = true;

    if (player.hpRegen > 0 && state.frame % 60 === 0) {
      player.hp = Math.min(player.maxHp, player.hp + player.hpRegen);
      updateHUD();
    }

    updatePickups();

    let spawnRate = Math.max(10, 60 - state.wave * 2 * player.curse);
    if (state.wave <= 3) spawnRate = 40;
    if (state.frame % Math.floor(spawnRate) === 0) spawnEnemy();

    if (state.frame % 1200 === 0 && state.wave < config.maxWaves) {
      state.wave++;
      if (player.items.includes('i_07')) player.gold += player.interest;
      updateHUD();
      if (state.wave % 5 === 0) showFloatText('MINIBOSS INCOMING', new THREE.Vector3(0, 5, 0), 0xff0000);
      else showFloatText('WAVE ' + state.wave, charGroup.position, 0xffaa00);
    }

    const waveProg = (state.frame % 1200) / 1200;
    const totalProg = (state.wave / config.maxWaves) * 100 + waveProg * (100 / config.maxWaves);
    document.getElementById('progress-fill').style.width = Math.min(100, totalProg) + '%';

    player.activeSpells.forEach(spell => {
      if (spell.cdTimer > 0) spell.cdTimer -= dt;
      else if (castSpell(spell)) spell.cdTimer = spell.data.base.cd * player.cdMult;
    });

    updateEntities();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (state.gameState === 'PLAYING') {
      for (let i = 0; i < state.gameSpeed; i++) gameTick();
      updateAimGuide();
    }
    composer.render();
  }

  return { animate, gameTick, updateAimGuide };
}
