import * as THREE from "three";

import { HudState, GameState } from "./GameState";
import { WorldConfig } from "./WorldConfig";
import { XpOrbManager } from "./XpOrbManager";
import { LootChestManager, LootRarityWeights } from "./LootChestManager";

type EnemyKind = "grunt" | "miniboss" | "boss";

type DropProfile = {
  chance: number;
  rarityWeights: LootRarityWeights;
};

const DROP_PROFILES: Record<EnemyKind, DropProfile> = {
  grunt: {
    chance: 0.12,
    rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
  },
  miniboss: {
    chance: 0.55,
    rarityWeights: { uncommon: 0.45, rare: 0.35, mythic: 0.2 },
  },
  boss: {
    chance: 0.85,
    rarityWeights: { rare: 0.4, mythic: 0.35, legendary: 0.2, cursed: 0.05 },
  },
};

export type Enemy = {
  mesh: THREE.Group;
  speed: number;
  kind: EnemyKind;
  dropProfile: DropProfile;
  radius: number;
  maxHp: number;
  hp: number;
};

type SpawnEffect = {
  mesh: THREE.Mesh;
  remaining: number;
  duration: number;
};

export class EnemyManager {
  private enemies: Enemy[] = [];
  private spawnTimer = 0;
  private isRunning = false;
  private isPaused = false;
  private currentWave = 1;
  private speedMult = 1;
  private spawnEffects: SpawnEffect[] = [];

  constructor(
    private readonly worldGroup: THREE.Group,
    private readonly playerGroup: THREE.Group,
    private readonly config: WorldConfig,
    private readonly gameState: GameState,
    private readonly xpOrbs: XpOrbManager,
    private readonly chests: LootChestManager
  ) {
    this.gameState.on("hud", (hud) => this.syncHud(hud));
    this.gameState.on("state", ({ isRunning, isPaused }) => {
      this.isRunning = isRunning;
      this.isPaused = isPaused;
    });
  }

  reset(): void {
    this.enemies.forEach((enemy) => this.cleanupEnemy(enemy));
    this.enemies = [];
    this.spawnEffects.forEach((effect) => {
      this.worldGroup.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      (effect.mesh.material as THREE.Material).dispose();
    });
    this.spawnEffects = [];
    this.spawnTimer = 0;
  }

  private syncHud(hud: HudState): void {
    this.isRunning = hud.isRunning;
    this.isPaused = hud.isPaused;
    this.currentWave = hud.wave;
    this.speedMult = hud.speed;
    if (this.isRunning && !this.isPaused && this.enemies.length === 0) {
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    const laneOffsets = [
      -this.config.laneWidth / 2,
      0,
      this.config.laneWidth / 2,
    ];
    const lane = laneOffsets[Math.floor(Math.random() * laneOffsets.length)];
    const kind = this.pickEnemyKind();
    const mesh = this.createEnemyModel(kind);
    mesh.position.set(lane, 2.5, this.config.spawnZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.worldGroup.add(mesh);
    this.spawnEffects.push(
      this.createSpawnBurst(mesh.position, this.getWaveColor(kind))
    );

    const speed = 0.02 + this.currentWave * 0.0025;
    const radius = this.getEnemySize(kind) * 0.55;
    const maxHp =
      this.getEnemyBaseHealth(kind) * this.getWaveHealthMultiplier(this.currentWave);
    this.enemies.push({
      mesh,
      speed,
      kind,
      dropProfile: DROP_PROFILES[kind],
      radius,
      maxHp,
      hp: maxHp,
    });
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  applyDamage(enemy: Enemy, amount: number, multiplier = 1): boolean {
    if (!this.enemies.includes(enemy)) return false;
    const damage = Math.max(0, amount * multiplier);
    enemy.hp -= damage;
    if (enemy.hp > 0) return false;

    this.defeatEnemy(enemy);
    return true;
  }

  defeatEnemy(enemy: Enemy): void {
    const index = this.enemies.indexOf(enemy);
    if (index < 0) return;

    const dropPosition = enemy.mesh.position.clone();
    this.cleanupEnemy(enemy);
    this.enemies.splice(index, 1);

    const xpValue = 8 + Math.floor(this.currentWave * 1.5);
    this.xpOrbs.spawnOrb(dropPosition, xpValue);

    if (Math.random() <= enemy.dropProfile.chance) {
      this.chests.spawnChest(dropPosition, enemy.dropProfile.rarityWeights);
    }
  }

  private getWaveColor(kind: EnemyKind): number {
    const waveColors = [
      this.config.colors.common,
      this.config.colors.uncommon,
      this.config.colors.rare,
      this.config.colors.mythic,
      this.config.colors.legendary,
      this.config.colors.cursed,
    ];
    if (kind === "miniboss") return this.config.colors.rare;
    if (kind === "boss") return this.config.colors.legendary;
    const tier = Math.min(
      waveColors.length - 1,
      Math.floor((this.currentWave - 1) / 3)
    );
    return waveColors[tier];
  }

  private getEnemySize(kind: EnemyKind): number {
    if (kind === "boss") return 6;
    if (kind === "miniboss") return 4;
    return 3;
  }

  private getEnemyBaseHealth(kind: EnemyKind): number {
    if (kind === "boss") return 600;
    if (kind === "miniboss") return 250;
    return 120;
  }

  private getWaveHealthMultiplier(wave: number): number {
    const growthPerWave = 0.12;
    return 1 + Math.max(0, wave - 1) * growthPerWave;
  }

  private getContactDamage(kind: EnemyKind): number {
    if (kind === "boss") return 35;
    if (kind === "miniboss") return 18;
    return 10;
  }

  private pickEnemyKind(): EnemyKind {
    const bossWave = this.currentWave % 10 === 0;
    const bossChance = bossWave ? 0.2 : 0.05;
    if (Math.random() < bossChance) return "boss";

    const miniChance = Math.min(0.05 + this.currentWave * 0.01, 0.4);
    return Math.random() < miniChance ? "miniboss" : "grunt";
  }

  update(deltaMs: number): void {
    if (!this.isRunning || this.isPaused) return;

    this.spawnTimer -= deltaMs;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      const baseInterval = 1800;
      const interval = Math.max(
        500,
        baseInterval - (this.currentWave - 1) * 80
      );
      this.spawnTimer = interval;
    }

    const halfLane = this.config.laneWidth / 2;
    const playerPosition = this.playerGroup.position;
    let hitCooldownRemaining =
      (this.playerGroup.userData.hitCooldownRemaining as number | undefined) || 0;
    hitCooldownRemaining = Math.max(0, hitCooldownRemaining - deltaMs);

    const delta = deltaMs * this.speedMult;
    this.enemies.forEach((enemy) => {
      enemy.mesh.position.z += enemy.speed * delta;
      enemy.mesh.position.x = Math.min(
        Math.max(enemy.mesh.position.x, -halfLane),
        halfLane
      );
      enemy.mesh.position.z = Math.min(enemy.mesh.position.z, this.config.endZone);

      const spin = enemy.mesh.userData.spin as
        | { x: number; y: number; z: number }
        | undefined;
      if (spin) {
        enemy.mesh.rotation.x += spin.x * delta;
        enemy.mesh.rotation.y += spin.y * delta;
        enemy.mesh.rotation.z += spin.z * delta;
      }
    });

    this.spawnEffects = this.spawnEffects.filter((effect) => {
      effect.remaining -= delta;
      const progress = 1 - Math.max(effect.remaining, 0) / effect.duration;
      const scale = 1 + 1.4 * progress;
      effect.mesh.scale.setScalar(scale);
      const material = effect.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.65 * (1 - progress);
      material.needsUpdate = true;
      if (effect.remaining <= 0) {
        this.worldGroup.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        material.dispose();
        return false;
      }
      return true;
    });

    this.enemies = this.enemies.filter((enemy) => {
      const dx = enemy.mesh.position.x - playerPosition.x;
      const dz = enemy.mesh.position.z - playerPosition.z;
      const combinedRadius = enemy.radius + 2.6; // player radius approximation
      const collided = dx * dx + dz * dz <= combinedRadius * combinedRadius;

      if (collided) {
        if (hitCooldownRemaining <= 0) {
          this.gameState.takeDamage(this.getContactDamage(enemy.kind));
          hitCooldownRemaining = 550;
          this.cleanupEnemy(enemy);
          return false;
        }

        enemy.mesh.position.z = Math.max(
          enemy.mesh.position.z - 5,
          this.config.spawnZ
        );
      }

      if (enemy.mesh.position.z >= this.config.endZone) {
        this.cleanupEnemy(enemy);
        return false;
      }
      return true;
    });

    this.playerGroup.userData.hitCooldownRemaining = hitCooldownRemaining;
  }

  private cleanupEnemy(enemy: Enemy): void {
    this.worldGroup.remove(enemy.mesh);
    enemy.mesh.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose());
      } else if (mesh.material) {
        (mesh.material as THREE.Material).dispose();
      }
    });
  }

  private createEnemyModel(kind: EnemyKind): THREE.Group {
    const group = new THREE.Group();
    const baseColor = new THREE.Color(this.getWaveColor(kind));
    const shadowColor = baseColor.clone().multiplyScalar(0.35);
    const glowColor = baseColor.clone().lerp(new THREE.Color(0xffffff), 0.15);
    const size = this.getEnemySize(kind);

    if (kind === "grunt") {
      const body = new THREE.Mesh(
        new THREE.OctahedronGeometry(size * 0.9, 1),
        new THREE.MeshStandardMaterial({
          color: shadowColor,
          emissive: glowColor,
          emissiveIntensity: 1.1,
          metalness: 0.65,
          roughness: 0.25,
        })
      );
      const facets = new THREE.Mesh(
        new THREE.ConeGeometry(size * 0.3, size * 0.6, 12, 1, true),
        new THREE.MeshPhysicalMaterial({
          color: glowColor,
          emissive: baseColor,
          emissiveIntensity: 1.35,
          transmission: 0.35,
          opacity: 0.75,
          transparent: true,
          metalness: 0.4,
          roughness: 0.15,
        })
      );
      facets.rotation.x = Math.PI;
      facets.position.y = -size * 0.25;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(body.geometry),
        new THREE.LineBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.9,
        })
      );
      edges.scale.setScalar(1.03);
      group.add(body, facets, edges);
      group.userData.spin = { x: 0, y: 0.0009, z: 0 };
    } else if (kind === "miniboss") {
      const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(size * 0.45, size * 0.16, 140, 20),
        new THREE.MeshStandardMaterial({
          color: shadowColor,
          emissive: glowColor,
          emissiveIntensity: 1.45,
          metalness: 0.7,
          roughness: 0.2,
          envMapIntensity: 1.1,
        })
      );
      const plates = new THREE.Mesh(
        new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 0.55, 24, 1, true),
        new THREE.MeshPhysicalMaterial({
          color: glowColor,
          emissive: baseColor,
          emissiveIntensity: 1.6,
          clearcoat: 0.75,
          clearcoatRoughness: 0.15,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          metalness: 0.35,
          roughness: 0.3,
        })
      );
      plates.rotation.x = Math.PI / 2;
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(size * 0.75, size * 0.08, 24, 64),
        new THREE.MeshBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
        })
      );
      halo.rotation.x = Math.PI / 2;
      group.add(knot, plates, halo);
      group.userData.spin = { x: 0.00015, y: 0.0012, z: 0 };
    } else {
      const shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(size * 0.9, 2),
        new THREE.MeshPhysicalMaterial({
          color: shadowColor,
          emissive: baseColor,
          emissiveIntensity: 1.8,
          metalness: 0.8,
          roughness: 0.18,
          transmission: 0.12,
          thickness: 1.6,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
        })
      );
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(size * 0.4, 2),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x111111),
          emissive: glowColor,
          emissiveIntensity: 2,
          metalness: 0.9,
          roughness: 0.05,
        })
      );
      const rings = new THREE.Mesh(
        new THREE.TorusGeometry(size * 0.95, size * 0.12, 24, 96),
        new THREE.MeshBasicMaterial({
          color: glowColor,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
        })
      );
      rings.rotation.x = Math.PI / 2;
      const crest = new THREE.Mesh(
        new THREE.BoxGeometry(size * 0.2, size * 1.6, size * 0.2),
        new THREE.MeshStandardMaterial({
          color: glowColor,
          emissive: baseColor,
          emissiveIntensity: 1.4,
          metalness: 0.75,
          roughness: 0.2,
        })
      );
      crest.position.y = size * 0.3;
      group.add(shell, core, rings, crest);
      group.userData.spin = { x: 0.0002, y: 0.0015, z: 0.0002 };
    }

    return group;
  }

  private createSpawnBurst(position: THREE.Vector3, color: number): SpawnEffect {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 2.2, 28, 1),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, 0.05, position.z);
    this.worldGroup.add(ring);
    return { mesh: ring, remaining: 450, duration: 450 };
  }
}
