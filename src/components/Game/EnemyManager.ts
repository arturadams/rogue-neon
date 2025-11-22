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
  mesh: THREE.Mesh;
  speed: number;
  kind: EnemyKind;
  dropProfile: DropProfile;
};

export class EnemyManager {
  private enemies: Enemy[] = [];
  private spawnTimer = 0;
  private isRunning = false;
  private isPaused = false;
  private currentWave = 1;
  private speedMult = 1;

  constructor(
    private readonly worldGroup: THREE.Group,
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
    const geometry = new THREE.DodecahedronGeometry(this.getEnemySize(kind), 0);
    const material = new THREE.MeshStandardMaterial({
      color: this.getWaveColor(kind),
      emissive: new THREE.Color(this.getWaveColor(kind)),
      emissiveIntensity: 0.4,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(lane, 2.5, this.config.spawnZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.worldGroup.add(mesh);

    const speed = 0.02 + this.currentWave * 0.0025;
    this.enemies.push({
      mesh,
      speed,
      kind,
      dropProfile: DROP_PROFILES[kind],
    });
  }

  getEnemies(): Enemy[] {
    return this.enemies;
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

    const delta = deltaMs * this.speedMult;
    this.enemies.forEach((enemy) => {
      enemy.mesh.position.z += enemy.speed * delta;
    });

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.mesh.position.z > this.config.endZone) {
        this.cleanupEnemy(enemy);
        return false;
      }
      return true;
    });
  }

  private cleanupEnemy(enemy: Enemy): void {
    this.worldGroup.remove(enemy.mesh);
    enemy.mesh.geometry.dispose();
    const material = enemy.mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(material)) {
      material.forEach((mat) => mat.dispose());
    } else {
      material.dispose();
    }
  }
}
