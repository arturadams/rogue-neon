import * as THREE from 'three';

/**
 * CORE VISUAL SYSTEMS
 * Handles all particles, projectiles, and beams for the game.
 */

class ParticleSystem {
    constructor(scene) {
        this.particles = [];
        this.scene = scene;
        this.boxGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    }

    emit(position, color, count, type = 'explode') {
        const mat = new THREE.MeshBasicMaterial({ color: color });
        
        for(let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.boxGeo, mat);
            mesh.position.copy(position);
            
            // Random velocity spread
            const speed = Math.random() * 0.5 + 0.1;
            const angle = Math.random() * Math.PI * 2;
            const rise = (Math.random() - 0.5) * 0.5;
            
            this.scene.add(mesh);
            
            this.particles.push({
                mesh: mesh,
                velocity: new THREE.Vector3(Math.cos(angle) * speed, rise, Math.sin(angle) * speed),
                life: 1.0,
                decay: Math.random() * 0.05 + 0.02,
                type: type
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay;
            p.mesh.position.add(p.velocity);
            p.mesh.scale.setScalar(p.life);
            p.mesh.rotation.x += 0.1;

            if (p.type === 'smoke') {
                p.velocity.y += 0.01;
                p.velocity.multiplyScalar(0.95);
            } else if (p.type === 'explode') {
                p.velocity.multiplyScalar(0.9);
            }

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose(); // Cleanup
                p.mesh.material.dispose(); // Cleanup
                this.particles.splice(i, 1);
            }
        }
    }
}

class ProjectileSystem {
    constructor(scene, particleSystem) {
        this.projectiles = [];
        this.scene = scene;
        this.particleSystem = particleSystem;
        
        // Geometries
        this.geoSphere = new THREE.SphereGeometry(1, 8, 8);
        this.geoBox = new THREE.BoxGeometry(0.4, 0.4, 1);
        this.geoDisc = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        this.geoNail = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
    }

    fire(origin, direction, config) {
        let geo = this.geoSphere;
        let scale = config.size || 0.2;
        let color = config.color || 0xffff00;

        if (config.style === 'rocket') geo = this.geoBox;
        if (config.style === 'disc') { geo = this.geoDisc; scale = 1.0; }
        if (config.style === 'nail') { geo = this.geoNail; scale = 1.0; }

        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2) });
        const mesh = new THREE.Mesh(geo, mat);
        
        mesh.position.copy(origin);
        mesh.lookAt(origin.clone().add(direction));
        mesh.scale.setScalar(scale);

        if(config.style === 'nail') mesh.rotateX(Math.PI / 2); // Orient cylinder correctly

        this.scene.add(mesh);

        this.projectiles.push({
            mesh: mesh,
            velocity: direction.clone().normalize().multiplyScalar(config.speed || 1.0),
            style: config.style || 'bullet',
            life: config.range ? (config.range / config.speed) : 2.0,
            color: color
        });
    }

    update(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= delta;
            p.mesh.position.add(p.velocity);

            // Special Effects
            if(p.style === 'rocket' && Math.random() > 0.5) {
                this.particleSystem.emit(p.mesh.position, 0x555555, 1, 'smoke');
            }
            if(p.style === 'disc') p.mesh.rotation.y += 10 * delta;

            // TODO: Add raycast for wall collision here if not handled by physics engine
            if (p.life <= 0) this.destroy(i);
        }
    }

    destroy(index) {
        const p = this.projectiles[index];
        const impactCount = p.style === 'rocket' ? 30 : 5;
        this.particleSystem.emit(p.mesh.position, p.color, impactCount, 'explode');
        
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.projectiles.splice(index, 1);
    }
}

class BeamSystem {
    constructor(scene) {
        this.beams = [];
        this.scene = scene;
    }

    fireRay(origin, direction, range, color, width=0.1) {
        const endPoint = origin.clone().add(direction.clone().normalize().multiplyScalar(range));
        const curve = new THREE.LineCurve3(origin, endPoint);
        const geometry = new THREE.TubeGeometry(curve, 1, width, 8, false);
        const material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color(color).multiplyScalar(5), 
            transparent: true, opacity: 1 
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.beams.push({ mesh, type: 'beam', age: 0, maxAge: 0.2 });
    }

    fireLightning(origin, targetPos, color) {
        // Simplified jagged line
        const points = [];
        const segments = 6;
        const dir = new THREE.Vector3().subVectors(targetPos, origin);
        
        points.push(origin);
        for(let i=1; i<segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3().copy(origin).add(dir.clone().multiplyScalar(t));
            point.add(new THREE.Vector3((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)));
            points.push(point);
        }
        points.push(targetPos);

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, segments, 0.05, 4, false);
        const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3) });
        
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.beams.push({ mesh, type: 'beam', age: 0, maxAge: 0.1 });
    }

    update(delta) {
        for (let i = this.beams.length - 1; i >= 0; i--) {
            const b = this.beams[i];
            b.age += delta;
            
            // Fade out
            b.mesh.material.opacity = 1 - (b.age / b.maxAge);
            b.mesh.scale.setScalar(1 - (b.age / b.maxAge));

            if (b.age >= b.maxAge) {
                this.scene.remove(b.mesh);
                b.mesh.geometry.dispose();
                b.mesh.material.dispose();
                this.beams.splice(i, 1);
            }
        }
    }
}

/**
 * MAIN EXPORT
 * Import this class in your Game/Scene
 */
export class WeaponFX {
    constructor(scene) {
        this.scene = scene;
        this.particles = new ParticleSystem(scene);
        this.projectiles = new ProjectileSystem(scene, this.particles);
        this.beams = new BeamSystem(scene);
    }

    update(delta) {
        this.particles.update();
        this.projectiles.update(delta);
        this.beams.update(delta);
    }

    /**
     * @param {Object} weapon - The full weapon object from your WEAPONS list
     * @param {THREE.Vector3} origin - Start position
     * @param {THREE.Vector3} direction - Normalized direction vector
     * @param {THREE.Vector3} [target] - Optional target position (for beams/lightning)
     */
    trigger(weapon, origin, direction, target = null) {
        // 1. Muzzle Flash (All weapons get this)
        this.particles.emit(origin.clone().add(direction), weapon.color, 3, 'explode');

        // 2. Determine Effect Type based on ID or Type
        switch (weapon.id) {
            // --- BEAMS ---
            case 'w_07': // Laser
            case 'w_18': // Railgun
            case 'w_12': // Void Beam
                this.beams.fireRay(origin, direction, weapon.base.range || 50, weapon.color, weapon.base.width || 0.1);
                break;

            // --- LIGHTNING/ARCS ---
            case 'w_08': // Tesla
                if(target) this.beams.fireLightning(origin, target, weapon.color);
                else {
                    // Fallback if no target: Zap into air
                    const dummy = origin.clone().add(direction.clone().multiplyScalar(15));
                    this.beams.fireLightning(origin, dummy, weapon.color);
                }
                break;

            // --- PROJECTILES ---
            default: 
                this.fireProjectile(weapon, origin, direction);
                break;
        }
    }

    fireProjectile(weapon, origin, direction) {
        let style = 'bullet';
        let speed = weapon.base.speed || 1.0;
        let size = 0.2;

        // Custom mapping based on your ID list
        if (weapon.id === 'w_13' || weapon.id === 'w_14') style = 'rocket'; // Rocket / Grav
        if (weapon.id === 'w_03') style = 'nail';
        if (weapon.id === 'w_05' || weapon.id === 'w_22') style = 'disc'; // Sawblade / Disc
        
        // Handle Shotguns (Multiple Projectiles)
        if (weapon.base.count && weapon.base.count > 1) {
            for(let i=0; i < weapon.base.count; i++) {
                const spreadDir = direction.clone();
                const spreadAmount = weapon.base.spread || 0.2;
                spreadDir.x += (Math.random() - 0.5) * spreadAmount;
                spreadDir.z += (Math.random() - 0.5) * spreadAmount;
                spreadDir.normalize();

                this.projectiles.fire(origin, spreadDir, {
                    style, speed, size, color: weapon.color, range: weapon.base.range
                });
            }
        } else {
            // Single Shot
            this.projectiles.fire(origin, direction, {
                style, speed, size, color: weapon.color, range: weapon.base.range
            });
        }
    }
}