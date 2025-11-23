import * as THREE from "three";

import { GameState, HudState } from "./GameState";
import { WorldConfig } from "./WorldConfig";

type XpOrb = {
  mesh: THREE.Mesh;
  value: number;
  velocity: THREE.Vector3;
};

export class XpOrbManager {
  private readonly orbs: XpOrb[] = [];
  private isRunning = false;
  private isPaused = false;
  private speedMult = 1;

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
    this.orbs.slice().forEach((orb) => this.cleanupOrb(orb));
    this.isRunning = false;
    this.isPaused = false;
  }

  spawnOrb(position: THREE.Vector3, value: number): void {
    const geometry = new THREE.SphereGeometry(1.1, 10, 10);
    const material = new THREE.MeshStandardMaterial({
      color: this.config.colors.yellow,
      emissive: new THREE.Color(this.config.colors.yellow),
      emissiveIntensity: 0.9,
      roughness: 0.4,
      metalness: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y = 2.25;
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;

    this.worldGroup.add(mesh);

    const drift = 0.01 + Math.random() * 0.015;
    this.orbs.push({ mesh, value, velocity: new THREE.Vector3(0, 0, drift) });
  }

  update(deltaMs: number): void {
    if (!this.isRunning || this.isPaused) return;

    const delta = deltaMs * this.speedMult;
    this.orbs.slice().forEach((orb) => {
      orb.mesh.rotation.y += 0.01 * this.speedMult;
      orb.mesh.rotation.x += 0.005 * this.speedMult;
      orb.mesh.position.addScaledVector(orb.velocity, delta);

      const distanceToPlayer = orb.mesh.position.distanceTo(this.charGroup.position);
      if (distanceToPlayer <= this.getPickupRadius()) {
        this.collectOrb(orb);
        return;
      }

      if (orb.mesh.position.z > this.config.endZone + 20) {
        this.cleanupOrb(orb);
      }
    });
  }

  private getPickupRadius(): number {
    return Math.max(3, this.gameState.getMagnetRadius());
  }

  private collectOrb(orb: XpOrb): void {
    this.gameState.collectXp(orb.value);
    this.cleanupOrb(orb);
  }

  private cleanupOrb(orb: XpOrb): void {
    this.worldGroup.remove(orb.mesh);
    orb.mesh.geometry.dispose();
    const material = orb.mesh.material as THREE.Material;
    material.dispose();

    const index = this.orbs.indexOf(orb);
    if (index >= 0) this.orbs.splice(index, 1);
  }

  private syncHud(hud: HudState): void {
    this.isRunning = hud.isRunning;
    this.isPaused = hud.isPaused;
    this.speedMult = hud.speed;
  }
}

