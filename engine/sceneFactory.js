import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createSceneContext(config) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.colors.bg);
  scene.fog = new THREE.FogExp2(config.colors.bg, 0.008);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 45, config.playerZ + 25);
  camera.lookAt(0, 0, -30);

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const composer = new EffectComposer(renderer);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.strength = 1.2;
  bloomPass.radius = 0.4;
  bloomPass.threshold = 0.15;
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  return { scene, camera, renderer, composer, bloomPass };
}

export function buildWorld(scene, config) {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);
  const floor = new THREE.GridHelper(400, 40, 0x330033, 0x080815);
  floor.position.z = -50;
  worldGroup.add(floor);
  const laneL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 300), new THREE.MeshBasicMaterial({ color: config.colors.cyan }));
  laneL.position.set(-config.laneWidth / 2 - 1, 0, -50);
  worldGroup.add(laneL);
  const laneR = laneL.clone();
  laneR.position.set(config.laneWidth / 2 + 1, 0, -50);
  worldGroup.add(laneR);
  return worldGroup;
}

export function buildCharacter(scene, config) {
  const charGroup = new THREE.Group();
  charGroup.position.set(0, 0, config.playerZ);
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(2, 5, 4),
    new THREE.MeshBasicMaterial({ color: config.colors.cyan, wireframe: true })
  );
  body.position.y = 2.5;
  body.rotation.y = Math.PI / 4;
  charGroup.add(body);
  scene.add(charGroup);
  return charGroup;
}
