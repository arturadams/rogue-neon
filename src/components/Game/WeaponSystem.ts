import * as THREE from "three";

import { GameState, HudState } from "./GameState";
import { WorldConfig } from "./WorldConfig";
import { WEAPONS } from "./Weapons";
import { Weapon } from "../../types";

type Projectile = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  followPlayer?: boolean;
};

type WeaponRuntime = {
  weapon: Weapon;
  cooldown: number;
};

const weaponMap = new Map<string, Weapon>(WEAPONS.map((w) => [w.id, w]));

export class WeaponSystem {
  private readonly activeWeapons = new Map<string, WeaponRuntime>();
  private readonly projectiles: Projectile[] = [];
  private readonly beams: Projectile[] = [];
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

  update(deltaMs: number): void {
    this.syncActiveWeapons();

    if (!this.isRunning || this.isPaused) return;

    const scaledDelta = deltaMs * this.speedMult;
    this.activeWeapons.forEach((runtime) => {
      runtime.cooldown -= scaledDelta;
      if (runtime.cooldown <= 0) {
        this.fireWeapon(runtime.weapon);
        runtime.cooldown = (runtime.weapon.base.cd || 1) * 1000;
      }
    });

    this.updateProjectiles(deltaMs);
    this.updateBeams(deltaMs);
  }

  private syncHud(hud: HudState): void {
    this.isRunning = hud.isRunning;
    this.isPaused = hud.isPaused;
    this.speedMult = hud.speed;
  }

  private syncActiveWeapons(): void {
    const activeIds = this.gameState.getActiveWeapons();

    // Remove weapons that are no longer active
    Array.from(this.activeWeapons.keys()).forEach((id) => {
      if (!activeIds.includes(id)) {
        this.activeWeapons.delete(id);
      }
    });

    // Add any newly activated weapons and fire immediately
    activeIds.forEach((id) => {
      if (!this.activeWeapons.has(id)) {
        const weapon = weaponMap.get(id);
        if (!weapon) return;
        this.activeWeapons.set(id, { weapon, cooldown: 0 });
      }
    });
  }

  private fireWeapon(weapon: Weapon): void {
    const count = weapon.base.count || 1;
    const spread = weapon.base.spread || 0;

    for (let i = 0; i < count; i += 1) {
      if (weapon.base.beam) {
        this.spawnBeam(weapon);
      } else {
        this.spawnProjectile(weapon, spread, i, count);
      }
    }
  }

  private spawnProjectile(
    weapon: Weapon,
    spread: number,
    index: number,
    total: number
  ): void {
    const geometry = new THREE.SphereGeometry(0.75, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: weapon.color,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const offsetX = spread
      ? (index - (total - 1) / 2) * spread * 2 + (Math.random() - 0.5) * spread
      : 0;
    mesh.position.set(
      this.charGroup.position.x + offsetX,
      2.5,
      this.charGroup.position.z
    );

    const speed = (weapon.base.speed || 1) * 0.08;
    const velocity = new THREE.Vector3(0, 0, -speed);
    const life = weapon.base.range
      ? weapon.base.range / Math.abs(velocity.z || 1)
      : 2000;

    this.worldGroup.add(mesh);
    this.projectiles.push({ mesh, velocity, life });
  }

  private spawnBeam(weapon: Weapon): void {
    const length = weapon.base.range || 150;
    const width = weapon.base.width || 0.5;
    const geometry = new THREE.BoxGeometry(width * 2, 0.5, length);
    const material = new THREE.MeshBasicMaterial({
      color: weapon.color,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      this.charGroup.position.x,
      2.5,
      this.charGroup.position.z - length / 2
    );

    this.worldGroup.add(mesh);
    this.beams.push({ mesh, velocity: new THREE.Vector3(), life: 150, followPlayer: true });
  }

  private updateProjectiles(deltaMs: number): void {
    const delta = deltaMs * this.speedMult;
    this.projectiles.slice().forEach((projectile) => {
      projectile.life -= delta;
      projectile.mesh.position.add(
        projectile.velocity.clone().multiplyScalar(delta)
      );

      if (
        projectile.life <= 0 ||
        projectile.mesh.position.z < this.config.spawnZ - 50
      ) {
        this.removeProjectile(projectile);
      }
    });
  }

  private updateBeams(deltaMs: number): void {
    const delta = deltaMs * this.speedMult;
    this.beams.slice().forEach((beam) => {
      beam.life -= delta;
      if (beam.followPlayer) {
        const length = (beam.mesh.geometry as THREE.BoxGeometry).parameters.depth;
        beam.mesh.position.set(
          this.charGroup.position.x,
          2.5,
          this.charGroup.position.z - length / 2
        );
      }

      if (beam.life <= 0) {
        this.removeBeam(beam);
      }
    });
  }

  private removeProjectile(projectile: Projectile): void {
    this.worldGroup.remove(projectile.mesh);
    projectile.mesh.geometry.dispose();
    const material = projectile.mesh.material as THREE.Material;
    material.dispose();

    const index = this.projectiles.indexOf(projectile);
    if (index >= 0) this.projectiles.splice(index, 1);
  }

  private removeBeam(beam: Projectile): void {
    this.worldGroup.remove(beam.mesh);
    beam.mesh.geometry.dispose();
    const material = beam.mesh.material as THREE.Material;
    material.dispose();

    const index = this.beams.indexOf(beam);
    if (index >= 0) this.beams.splice(index, 1);
  }
}
