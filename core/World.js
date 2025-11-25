import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CONFIG } from '../configs/config.js';

export class World {
    constructor() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.colors.bg);
        this.scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.008);

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 45, CONFIG.playerZ + 25);
        this.camera.lookAt(0, 0, -30);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        // Post Processing
        this.composer = new EffectComposer(this.renderer);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.strength = 1.2; bloomPass.radius = 0.4; bloomPass.threshold = 0.15;
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(bloomPass);
        this.composer.addPass(new OutputPass());

        // Groups
        this.worldGroup = new THREE.Group();
        this.scene.add(this.worldGroup);
        this.charGroup = new THREE.Group();
        this.charGroup.position.set(0, 0, CONFIG.playerZ);
        this.scene.add(this.charGroup);

        // Assets
        this.matGlass = new THREE.MeshPhysicalMaterial({ color: 0x101025, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.8, transmission: 0.2 });
        
        // Raycasting utils
        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        this.initEnvironment();
        this.initPlayer();
        this.initCursor();
        this.setupResize();
    }

    createNeonMesh(geometry, color) {
        const m = new THREE.Mesh(geometry, this.matGlass);
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.8 }));
        m.add(e);
        return m;
    }

    initEnvironment() {
        const floor = new THREE.GridHelper(400, 40, 0x330033, 0x080815); 
        floor.position.z = -50; 
        this.worldGroup.add(floor);
        
        const laneL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 300), new THREE.MeshBasicMaterial({color: CONFIG.colors.cyan}));
        laneL.position.set(-CONFIG.laneWidth/2 - 1, 0, -50); 
        this.worldGroup.add(laneL);
        
        const laneR = laneL.clone(); 
        laneR.position.set(CONFIG.laneWidth/2 + 1, 0, -50); 
        this.worldGroup.add(laneR);
    }

    initPlayer() {
        const body = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 4), new THREE.MeshBasicMaterial({color: CONFIG.colors.cyan, wireframe: true}));
        body.position.y = 2.5; 
        body.rotation.y = Math.PI/4; 
        this.charGroup.add(body);
    }

    initCursor() {
        this.cursorMesh = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.4, 32), new THREE.MeshBasicMaterial({color: 0x00ffff, side: THREE.DoubleSide}));
        this.cursorMesh.rotation.x = -Math.PI/2; 
        this.cursorMesh.position.y = 0.2; 
        this.scene.add(this.cursorMesh);

        this.aimLineGroup = new THREE.Group();
        this.scene.add(this.aimLineGroup);
        this.aimLinePool = [];
        for(let i=0; i<50; i++) {
            const l = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.15}));
            l.visible = false; 
            this.aimLineGroup.add(l); 
            this.aimLinePool.push(l);
        }
    }

    setupResize() {
        window.addEventListener('resize', () => { 
            this.camera.aspect = window.innerWidth/window.innerHeight; 
            this.camera.updateProjectionMatrix(); 
            this.renderer.setSize(window.innerWidth, window.innerHeight); 
            this.composer.setSize(window.innerWidth, window.innerHeight); 
        });
    }

    render() {
        this.composer.render();
    }
}