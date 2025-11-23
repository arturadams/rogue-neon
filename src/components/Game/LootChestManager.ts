import * as THREE from "three";

import { GameState, HudState } from "./GameState";
import { WorldConfig } from "./WorldConfig";

export type LootRarityWeights = Partial<Record<
  "common" | "uncommon" | "rare" | "mythic" | "legendary" | "cursed",
  number
>>;

type LootChest = {
  mesh: THREE.Mesh;
  rarityWeights: LootRarityWeights;
  spin: number;
  bob: number;
};

export class LootChestManager {
  private readonly chests: LootChest[] = [];
  private isRunning = false;
  private isPaused = false;
  private speedMult = 1;
  private readonly pullVector = new THREE.Vector3();

  constructor(
    private readonly worldGroup: THREE.Group,
    private readonly charGroup: THREE.Group,
    private readonly gameState: GameState,
    private readonly config: WorldConfig
  ) {
    this.gameState.on("hud", (hud) => this.syncHud(hud));
    this.gameState.on("state", ({ isRunning, isPaused }) => {
      this.isRunning = isRunning;
      this.isPaused = isPaused;
    });
    this.gameState.on("speed", (speed) => (this.speedMult = speed));
  }

  reset(): void {
    this.chests.slice().forEach((chest) => this.cleanupChest(chest));
    this.isRunning = false;
    this.isPaused = false;
  }

  spawnChest(position: THREE.Vector3, rarityWeights: LootRarityWeights): void {
    const geometry = new THREE.BoxGeometry(4, 3, 4);
    const accentColor = this.getAccentColor(rarityWeights);
    const material = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: new THREE.Color(accentColor),
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(position);
    mesh.position.y = 2;

    this.worldGroup.add(mesh);

    this.chests.push({
      mesh,
      rarityWeights,
      spin: 0.008 + Math.random() * 0.004,
      bob: Math.random() * Math.PI * 2,
    });
  }

  update(deltaMs: number): void {
    if (!this.isRunning || this.isPaused) return;

    const delta = deltaMs * this.speedMult;
    this.chests.slice().forEach((chest) => {
      chest.mesh.rotation.y += chest.spin * this.speedMult;
      chest.bob += 0.002 * this.speedMult * delta;
      chest.mesh.position.y = 2 + Math.sin(chest.bob) * 0.4;

      const distanceToPlayer = chest.mesh.position.distanceTo(
        this.charGroup.position
      );
      const magnetRadius = Math.max(4, this.gameState.getMagnetRadius());

      if (distanceToPlayer > magnetRadius) {
        this.pullVector
          .subVectors(this.charGroup.position, chest.mesh.position)
          .normalize()
          .multiplyScalar(0.02 * delta);
        chest.mesh.position.add(this.pullVector);
      }

      if (distanceToPlayer <= magnetRadius) {
        this.openChest(chest);
      }
    });
  }

  private openChest(chest: LootChest): void {
    this.gameState.pickupItem(undefined, chest.rarityWeights);
    this.cleanupChest(chest);
  }

  private cleanupChest(chest: LootChest): void {
    this.worldGroup.remove(chest.mesh);
    chest.mesh.geometry.dispose();
    const material = chest.mesh.material as THREE.Material;
    material.dispose();

    const index = this.chests.indexOf(chest);
    if (index >= 0) this.chests.splice(index, 1);
  }

  private getAccentColor(rarityWeights: LootRarityWeights): number {
    const sorted = Object.entries(rarityWeights)
      .filter(([, weight]) => (weight ?? 0) > 0)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
    const topRarity = sorted[0]?.[0];

    switch (topRarity) {
      case "uncommon":
        return this.config.colors.uncommon;
      case "rare":
        return this.config.colors.rare;
      case "mythic":
        return this.config.colors.mythic;
      case "legendary":
        return this.config.colors.legendary;
      case "cursed":
        return this.config.colors.cursed;
      default:
        return this.config.colors.common;
    }
  }

  private syncHud(hud: HudState): void {
    this.isRunning = hud.isRunning;
    this.isPaused = hud.isPaused;
    this.speedMult = hud.speed;
  }
}
