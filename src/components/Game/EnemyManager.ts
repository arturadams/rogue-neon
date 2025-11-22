import * as THREE from "three";

import { HudState, GameState } from "./GameState";
import { WorldConfig } from "./WorldConfig";

export type Enemy = {
  mesh: THREE.Mesh;
  speed: number;
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
    private readonly gameState: GameState
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
    const geometry = new THREE.DodecahedronGeometry(3, 0);
    const material = new THREE.MeshStandardMaterial({
      color: this.getWaveColor(),
      emissive: new THREE.Color(this.getWaveColor()),
      emissiveIntensity: 0.4,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(lane, 2.5, this.config.spawnZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.worldGroup.add(mesh);

    const speed = 0.02 + this.currentWave * 0.0025;
    this.enemies.push({ mesh, speed });
  }

  private getWaveColor(): number {
    const waveColors = [
      this.config.colors.common,
      this.config.colors.uncommon,
      this.config.colors.rare,
      this.config.colors.mythic,
      this.config.colors.legendary,
      this.config.colors.cursed,
    ];
    const tier = Math.min(
      waveColors.length - 1,
      Math.floor((this.currentWave - 1) / 3)
    );
    return waveColors[tier];
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
