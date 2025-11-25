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
        this.planeGeo = new THREE.PlaneGeometry(0.5, 0.5);
    }

    emit(position, color, count, type = 'explode') {
        const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1.0, side: THREE.DoubleSide });
        
        for(let i = 0; i < count; i++) {
            const geo = (type === 'fire') ? this.planeGeo : this.boxGeo;
            const mesh = new THREE.Mesh(geo, mat.clone());
            mesh.position.copy(position);
            
            // Random velocity spread
            const speed = Math.random() * 0.5 + 0.1;
            const angle = Math.random() * Math.PI * 2;
            const rise = (Math.random() - 0.5) * 0.5;
            
            this.scene.add(mesh);
            
            const vel = new THREE.Vector3(Math.cos(angle) * speed, rise, Math.sin(angle) * speed);
            if(type === 'fire') {
                vel.y = Math.random() * 0.2 + 0.1; // Fire floats up faster
                mesh.rotation.z = Math.random() * Math.PI;
                mesh.material.opacity = 0.8; // Start visible
            }

            this.particles.push({
                mesh: mesh,
                velocity: vel,
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
            
            if(p.type === 'fire') {
                p.mesh.scale.setScalar(p.life * 1.5);
                // Simple rotation for fire, avoid complex lookAt for now to ensure visibility
                p.mesh.rotation.z += 0.1; 
                p.mesh.rotation.x = -Math.PI / 2; // Face up (top down view)
                p.mesh.material.opacity = p.life;
            } else {
                p.mesh.scale.setScalar(p.life);
                p.mesh.rotation.x += 0.1;
            }

            if (p.type === 'smoke') {
                p.velocity.y += 0.01;
                p.velocity.multiplyScalar(0.95);
            } else if (p.type === 'explode') {
                p.velocity.multiplyScalar(0.9);
            }

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose(); 
                p.mesh.material.dispose(); 
                this.particles.splice(i, 1);
            }
        }
    }
}

// Specialized System for the Gravity Bomb visual (Singularity)
class GravSystem {
    constructor(scene) {
        this.scene = scene;
        this.singularities = [];
        // Shared Geometry/Material for the black hole core
        this.geo = new THREE.SphereGeometry(1, 16, 16);
        this.mat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    }

    spawn(position, duration, range) {
        const mesh = new THREE.Mesh(this.geo, this.mat);
        mesh.position.copy(position);
        this.scene.add(mesh);
        this.singularities.push({
            mesh, 
            life: 0, 
            maxLife: duration || 2.0, 
            range: range || 10
        });
    }

    update(delta) {
        for (let i = this.singularities.length - 1; i >= 0; i--) {
            const s = this.singularities[i];
            s.life += delta;
            
            // Wobbly expansion/contraction
            let scale = 0;
            if(s.life < 0.2) scale = (s.life / 0.2) * 3.0; 
            else if(s.life < s.maxLife - 0.2) scale = 3.0 + Math.sin(s.life * 10)*0.1; 
            else scale = Math.max(0, (s.maxLife - s.life)/0.2 * 3.0);

            s.mesh.scale.setScalar(scale);
            s.mesh.rotation.y += delta * 2;
            s.mesh.rotation.z += delta;

            if (s.life >= s.maxLife) {
                this.scene.remove(s.mesh);
                this.singularities.splice(i, 1);
            }
        }
    }
}

class ProjectileSystem {
    constructor(scene, particleSystem, gravSystem) {
        this.projectiles = [];
        this.scene = scene;
        this.particleSystem = particleSystem;
        this.gravSystem = gravSystem;
        
        // Geometries
        this.geoSphere = new THREE.SphereGeometry(1, 8, 8);
        this.geoBox = new THREE.BoxGeometry(0.4, 0.4, 1);
        this.geoDisc = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        this.geoNail = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
        this.geoCoin = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
        this.geoCube = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.geoRing = new THREE.TorusGeometry(0.5, 0.1, 8, 16); // For Null Pointer
    }

    fire(origin, direction, config) {
        let geo = this.geoSphere;
        let scale = config.size || 0.2;
        let color = config.color || 0xffff00;
        let matType = THREE.MeshBasicMaterial;
        let wireframe = false;

        // Style selection from config.style (which is now passed correctly)
        if (config.style === 'rocket') geo = this.geoBox;
        if (config.style === 'disc') { geo = this.geoDisc; scale = 1.0; }
        if (config.style === 'nail') { geo = this.geoNail; scale = 1.0; }
        if (config.style === 'coin') { geo = this.geoCoin; scale = 1.0; color = 0xffd700; }
        if (config.style === 'glitch') { geo = this.geoCube; scale = 1.0; wireframe = true; }
        if (config.style === 'grav') { geo = this.geoSphere; color = 0x000000; scale = 0.8; }
        if (config.style === 'null') { geo = this.geoRing; color = 0x000000; scale = 0.5; }

        const mat = new matType({ 
            color: new THREE.Color(color).multiplyScalar(2), 
            wireframe: wireframe 
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        
        mesh.position.copy(origin);
        mesh.lookAt(origin.clone().add(direction));
        mesh.scale.setScalar(scale);

        if(config.style === 'nail') mesh.rotateX(Math.PI / 2); 
        if(config.style === 'coin') mesh.rotateX(Math.PI / 2); 
        if(config.style === 'null') mesh.rotateX(Math.PI / 2); 

        this.scene.add(mesh);

        this.projectiles.push({
            mesh: mesh,
            velocity: direction.clone().normalize().multiplyScalar(config.speed || 1.0),
            style: config.style || 'bullet',
            life: config.range ? (config.range / config.speed) : 2.0,
            color: color,
            explodeProps: config.explodeProps 
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
            if(p.style === 'coin') p.mesh.rotation.z += 10 * delta;
            if(p.style === 'null') p.mesh.rotation.z -= 15 * delta; 
            
            if(p.style === 'glitch') {
                p.mesh.scale.setScalar(Math.random() * 1.5 + 0.5);
                p.mesh.material.color.setHSL(Math.random(), 1.0, 0.5);
            }

            if (p.life <= 0) this.destroy(i);
        }
    }

    destroy(index) {
        const p = this.projectiles[index];
        
        // Specific Impact FX
        if(p.style === 'rocket') {
            this.particleSystem.emit(p.mesh.position, 0xff5500, 20, 'explode');
        } else if(p.style === 'grav') {
            this.particleSystem.emit(p.mesh.position, 0xaa00aa, 15, 'explode'); 
            this.gravSystem.spawn(p.mesh.position, 1.5, 12);
        } else if (p.style === 'coin') {
            // No particles for coin
        } else if (p.style === 'null') {
             this.particleSystem.emit(p.mesh.position, 0x000000, 5, 'explode'); 
        } else {
            this.particleSystem.emit(p.mesh.position, p.color, 5, 'explode');
        }
        
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

export class WeaponFX {
    constructor(scene) {
        this.scene = scene;
        this.particles = new ParticleSystem(scene);
        this.gravSystem = new GravSystem(scene);
        this.projectiles = new ProjectileSystem(scene, this.particles, this.gravSystem);
        this.beams = new BeamSystem(scene);
    }

    update(delta) {
        this.particles.update();
        this.gravSystem.update(delta);
        this.projectiles.update(delta);
        this.beams.update(delta);
    }

    trigger(weapon, origin, direction, target = null) {
        if (weapon.id === 'w_17') {
            this.particles.emit(origin, 0xff5500, 5, 'fire');
            return;
        }

        this.particles.emit(origin.clone().add(direction), weapon.color, 3, 'explode');

        switch (weapon.id) {
            case 'w_07': 
            case 'w_18': 
            case 'w_12': 
                this.beams.fireRay(origin, direction, weapon.base.range || 50, weapon.color, weapon.base.width || 0.1);
                break;

            case 'w_08': 
            case 'w_21': 
            case 'w_24': 
                if(target) this.beams.fireLightning(origin, target, weapon.color);
                else {
                    const dummy = origin.clone().add(direction.clone().multiplyScalar(15));
                    this.beams.fireLightning(origin, dummy, weapon.color);
                }
                break;

            default: 
                this.fireProjectile(weapon, origin, direction);
                break;
        }
    }

    fireProjectile(weapon, origin, direction) {
        let style = 'bullet';
        let speed = weapon.base.speed || 1.0;
        let size = 0.2;

        if (weapon.id === 'w_13') style = 'rocket'; 
        if (weapon.id === 'w_14') style = 'grav';
        if (weapon.id === 'w_03') style = 'nail';
        if (weapon.id === 'w_05' || weapon.id === 'w_22') style = 'disc';
        if (weapon.id === 'w_19') style = 'glitch';
        if (weapon.id === 'w_20') style = 'coin';
        if (weapon.id === 'w_24') style = 'null';
        
        // Passing the CORRECT style to the ProjectileSystem
        if (weapon.base.count && weapon.base.count > 1) {
            for(let i=0; i < weapon.base.count; i++) {
                const spreadDir = direction.clone();
                const spreadAmount = weapon.base.spread || 0.2;
                spreadDir.x += (Math.random() - 0.5) * spreadAmount;
                spreadDir.z += (Math.random() - 0.5) * spreadAmount;
                spreadDir.normalize();

                this.projectiles.fire(origin, spreadDir, {
                    style: style, // Use local var
                    speed, size, color: weapon.color, range: weapon.base.range, explodeProps: weapon.base
                });
            }
        } else {
            this.projectiles.fire(origin, direction, {
                style: style, // Use local var
                speed, size, color: weapon.color, range: weapon.base.range, explodeProps: weapon.base
            });
        }
    }
}