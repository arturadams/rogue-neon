import * as THREE from "three";

import { GameState, HudState } from "./GameState";
import { EnemyManager, Enemy } from "./EnemyManager";
import { WorldConfig } from "./WorldConfig";
import { WEAPONS } from "./Weapons";
import { Weapon } from "../../types";

type Projectile = {
  object: THREE.Object3D;
  velocity: THREE.Vector3;
  life: number;
  followPlayer?: boolean;
  direction?: THREE.Vector3;
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
  private aimTarget = new THREE.Vector3(0, 0, -50);

  constructor(
    private readonly worldGroup: THREE.Group,
    private readonly charGroup: THREE.Group,
    private readonly gameState: GameState,
    private readonly config: WorldConfig,
    private readonly enemyManager: EnemyManager
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

  updateAimTarget(target: THREE.Vector3): void {
    this.aimTarget.copy(target);
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
    const coreGeometry = new THREE.CapsuleGeometry(0.35, 1.5, 6, 12);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: weapon.color,
      emissive: new THREE.Color(weapon.color),
      emissiveIntensity: 2.5,
      roughness: 0.2,
      metalness: 0.35,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(coreGeometry, coreMaterial);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    const glowGeometry = new THREE.SphereGeometry(0.8, 10, 10);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: weapon.color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    const offsetX = spread
      ? (index - (total - 1) / 2) * spread * 2 + (Math.random() - 0.5) * spread
      : 0;
    mesh.position.set(
      this.charGroup.position.x + offsetX,
      2.5,
      this.charGroup.position.z
    );

    const direction = this.getAimDirection();
    const speed = (weapon.base.speed || 1) * 0.08;
    const velocity = direction.clone().multiplyScalar(speed);
    const life = weapon.base.range
      ? weapon.base.range / Math.max(velocity.length(), 0.001)
      : 2000;

    mesh.lookAt(mesh.position.clone().add(direction));

    this.worldGroup.add(mesh);
    this.projectiles.push({ object: mesh, velocity, life, direction });
  }

  private spawnBeam(weapon: Weapon): void {
    const length = weapon.base.range || 150;
    const width = weapon.base.width || 0.5;
    const geometry = new THREE.BoxGeometry(width * 2, 0.4, length);
    const material = new THREE.MeshPhongMaterial({
      color: weapon.color,
      emissive: new THREE.Color(weapon.color),
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const direction = this.getAimDirection();
    const beamCenter = new THREE.Vector3()
      .copy(this.charGroup.position)
      .add(direction.clone().multiplyScalar(length / 2));

    mesh.position.set(beamCenter.x, 2.5, beamCenter.z);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone());

    this.worldGroup.add(mesh);
    this.beams.push({
      object: mesh,
      velocity: new THREE.Vector3(),
      life: 150,
      followPlayer: true,
      direction,
    });
  }

  private updateProjectiles(deltaMs: number): void {
    const delta = deltaMs * this.speedMult;
    this.projectiles.slice().forEach((projectile) => {
      projectile.life -= delta;
      projectile.object.position.add(
        projectile.velocity.clone().multiplyScalar(delta)
      );

      const hitEnemy = this.findProjectileHit(projectile);
      if (hitEnemy) {
        this.enemyManager.defeatEnemy(hitEnemy);
        this.removeProjectile(projectile);
        return;
      }

      if (
        projectile.life <= 0 ||
        projectile.object.position.z < this.config.spawnZ - 50
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
        const length = ((beam.object as THREE.Mesh).geometry as THREE.BoxGeometry).parameters
          .depth;
        const direction = this.getAimDirection();
        beam.direction = direction;
        const beamCenter = new THREE.Vector3()
          .copy(this.charGroup.position)
          .add(direction.clone().multiplyScalar(length / 2));
        beam.object.position.set(beamCenter.x, 2.5, beamCenter.z);
        beam.object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
      }

      this.enemyManager
        .getEnemies()
        .slice()
        .filter((enemy) => this.isEnemyInBeam(enemy, beam))
        .forEach((enemy) => this.enemyManager.defeatEnemy(enemy));

      if (beam.life <= 0) {
        this.removeBeam(beam);
      }
    });
  }

  private findProjectileHit(projectile: Projectile): Enemy | undefined {
    return this.enemyManager
      .getEnemies()
      .find((enemy) => enemy.mesh.position.distanceTo(projectile.object.position) < 3.5);
  }

  private isEnemyInBeam(enemy: Enemy, beam: Projectile): boolean {
    if (!(beam.object instanceof THREE.Mesh)) return false;
    const geometry = beam.object.geometry as THREE.BoxGeometry;
    const { width, depth } = geometry.parameters;
    const halfDepth = depth / 2;
    const halfWidth = width;

    const direction = (beam.direction || this.getAimDirection()).clone().normalize();
    const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, beam.object.position);
    const along = toEnemy.dot(direction);
    const perpendicular = toEnemy
      .clone()
      .sub(direction.clone().multiplyScalar(along));
    const lateralDistance = Math.sqrt(perpendicular.x ** 2 + perpendicular.z ** 2);

    return (
      along <= halfDepth + 1 &&
      along >= -halfDepth - 1 &&
      lateralDistance <= halfWidth + 1.2
    );
  }

  private removeProjectile(projectile: Projectile): void {
    this.worldGroup.remove(projectile.object);
    this.disposeObject(projectile.object);

    const index = this.projectiles.indexOf(projectile);
    if (index >= 0) this.projectiles.splice(index, 1);
  }

  private removeBeam(beam: Projectile): void {
    this.worldGroup.remove(beam.object);
    this.disposeObject(beam.object);

    const index = this.beams.indexOf(beam);
    if (index >= 0) this.beams.splice(index, 1);
  }

  private getAimDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3(
      this.aimTarget.x - this.charGroup.position.x,
      0,
      this.aimTarget.z - this.charGroup.position.z
    );

    if (direction.lengthSq() < 0.0001) {
      direction.set(0, 0, -1);
    }

    return direction.normalize();
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else if (mesh.material) {
        (mesh.material as THREE.Material).dispose();
      }
    });
  }
}
