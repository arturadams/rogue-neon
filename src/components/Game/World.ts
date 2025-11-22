import * as THREE from "three";
// @ts-ignore
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// @ts-ignore
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
// @ts-ignore
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
// @ts-ignore
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { initScanline, updateScanline } from "../Effects/Scanline";
import {
  initVignetteCurse,
  updateVignetteCurse,
} from "../Effects/VignetteCurse";
import {
  initFloatingText,
  spawnFloatingText,
  updateFloatingText,
} from "../Effects/FloatingText";
import { GameState } from "./GameState";
import { EnemyManager } from "./EnemyManager";
import { WORLD_CONFIG, WorldConfig } from "./WorldConfig";
import { WeaponSystem } from "./WeaponSystem";

export function setupWorld(gameState: GameState) {
  // --- CONFIG ---
  const CONFIG: WorldConfig = WORLD_CONFIG;

  // --- SCENE SETUP ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.colors.bg);
  scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.008);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 45, CONFIG.playerZ + 25);
  camera.lookAt(0, 0, -30);

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById("game-canvas")?.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.strength = 1.2;
  bloomPass.radius = 0.4;
  bloomPass.threshold = 0.15;
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // --- FX OVERLAYS & TEXT ---
  initScanline();
  initVignetteCurse();
  initFloatingText(camera);

  // --- WORLD ---
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);
  const floor = new THREE.GridHelper(400, 40, 0x330033, 0x080815);
  floor.position.z = -50;
  worldGroup.add(floor);
  const laneL = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1, 300),
    new THREE.MeshBasicMaterial({ color: CONFIG.colors.cyan })
  );
  laneL.position.set(-CONFIG.laneWidth / 2 - 1, 0, -50);
  worldGroup.add(laneL);
  const laneR = laneL.clone();
  laneR.position.set(CONFIG.laneWidth / 2 + 1, 0, -50);
  worldGroup.add(laneR);

  // --- PLAYER ---
  const charGroup = new THREE.Group();
  charGroup.position.set(0, 0, CONFIG.playerZ);
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(2, 5, 4),
    new THREE.MeshBasicMaterial({ color: CONFIG.colors.cyan, wireframe: true })
  );
  body.position.y = 2.5;
  body.rotation.y = Math.PI / 4;
  charGroup.add(body);
  scene.add(charGroup);

  const enemyManager = new EnemyManager(worldGroup, CONFIG, gameState);
  const weaponSystem = new WeaponSystem(worldGroup, charGroup, gameState, CONFIG);

  // --- PLAYER CONTROLS ---
  const keys = { w: false, a: false, s: false, d: false };
  let curseOverlayEnabled = false;
  window.addEventListener("keydown", (e) => {
    if (e.key === "w") keys.w = true;
    if (e.key === "a") keys.a = true;
    if (e.key === "s") keys.s = true;
    if (e.key === "d") keys.d = true;
    if (e.key.toLowerCase() === "c") {
      curseOverlayEnabled = !curseOverlayEnabled;
      updateVignetteCurse(curseOverlayEnabled);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "w") keys.w = false;
    if (e.key === "a") keys.a = false;
    if (e.key === "s") keys.s = false;
    if (e.key === "d") keys.d = false;
  });

  window.addEventListener("click", () => {
    spawnFloatingText(
      `${Math.floor(Math.random() * 20) + 5}`,
      charGroup.position,
      CONFIG.colors.cyan,
      Math.random() > 0.7
    );
  });

  // --- ENTITY MANAGEMENT ---
  // Example: Move player with WASD
  function updatePlayer() {
    let speed = 0.5;
    if (keys.w) charGroup.position.z -= speed;
    if (keys.s) charGroup.position.z += speed;
    if (keys.a) charGroup.position.x -= speed;
    if (keys.d) charGroup.position.x += speed;
  }

  // --- ANIMATION LOOP ---
  let lastTime = performance.now();
  function animate(now: number) {
    const delta = now - lastTime;
    lastTime = now;

    requestAnimationFrame(animate);
    gameState.tick(delta);
    updatePlayer();
    enemyManager.update(delta);
    weaponSystem.update(delta);
    updateFloatingText(delta);
    updateScanline(now);
    updateVignetteCurse(curseOverlayEnabled);
    composer.render();
  }
  animate(lastTime);

  // Return objects for further use
  return { scene, camera, renderer, composer, worldGroup, charGroup };
}
