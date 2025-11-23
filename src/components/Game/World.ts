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
import { XpOrbManager } from "./XpOrbManager";
import { LootChestManager } from "./LootChestManager";

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

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const aimTarget = new THREE.Vector3(0, 0, CONFIG.playerZ - 30);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const cleanupFns: (() => void)[] = [];

  const trackGeometry = (geometry: THREE.BufferGeometry) => geometries.add(geometry);
  const trackMaterial = (material: THREE.Material | THREE.Material[]) => {
    if (Array.isArray(material)) {
      material.forEach((mat) => materials.add(mat));
      return;
    }

    materials.add(material);
  };

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
  trackGeometry(floor.geometry as THREE.BufferGeometry);
  trackMaterial(floor.material as THREE.Material | THREE.Material[]);
  const laneL = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1, 300),
    new THREE.MeshBasicMaterial({ color: CONFIG.colors.cyan })
  );
  laneL.position.set(-CONFIG.laneWidth / 2 - 1, 0, -50);
  worldGroup.add(laneL);
  trackGeometry(laneL.geometry as THREE.BufferGeometry);
  trackMaterial(laneL.material as THREE.Material | THREE.Material[]);
  const laneR = laneL.clone();
  laneR.position.set(CONFIG.laneWidth / 2 + 1, 0, -50);
  worldGroup.add(laneR);
  trackGeometry(laneR.geometry as THREE.BufferGeometry);
  trackMaterial(laneR.material as THREE.Material | THREE.Material[]);

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
  trackGeometry(body.geometry as THREE.BufferGeometry);
  trackMaterial(body.material as THREE.Material | THREE.Material[]);
  scene.add(charGroup);

  const aimLineMaterial = new THREE.LineBasicMaterial({
    color: CONFIG.colors.cyan,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
  });
  const aimLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const aimLine = new THREE.Line(aimLineGeometry, aimLineMaterial);
  worldGroup.add(aimLine);
  trackGeometry(aimLineGeometry);
  trackMaterial(aimLineMaterial);

  const targetGeometry = new THREE.RingGeometry(0.6, 1.1, 32);
  const targetMaterial = new THREE.MeshBasicMaterial({
    color: CONFIG.colors.cyan,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
  targetMesh.rotation.x = -Math.PI / 2;
  targetMesh.position.set(aimTarget.x, 0.05, aimTarget.z);
  worldGroup.add(targetMesh);
  trackGeometry(targetGeometry);
  trackMaterial(targetMaterial);

  const xpManager = new XpOrbManager(worldGroup, charGroup, gameState, CONFIG);
  const chestManager = new LootChestManager(
    worldGroup,
    charGroup,
    gameState,
    CONFIG
  );
  const enemyManager = new EnemyManager(
    worldGroup,
    charGroup,
    CONFIG,
    gameState,
    xpManager,
    chestManager
  );
  const weaponSystem = new WeaponSystem(
    worldGroup,
    charGroup,
    gameState,
    CONFIG,
    enemyManager
  );

  const gameCanvas = document.getElementById("game-canvas");
  const updateAimFromPointer = (event: MouseEvent) => {
    if (!gameCanvas || inputLocked) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      const clampedX = Math.min(Math.max(hit.x, -CONFIG.laneWidth * 1.5), CONFIG.laneWidth * 1.5);
      const clampedZ = Math.min(Math.max(hit.z, -CONFIG.endZone - 40), CONFIG.endZone + 40);
      aimTarget.set(clampedX, 0, clampedZ);
    }
  };
  gameCanvas?.addEventListener("mousemove", updateAimFromPointer);
  cleanupFns.push(() => gameCanvas?.removeEventListener("mousemove", updateAimFromPointer));

  // --- PLAYER CONTROLS ---
  const keys = { w: false, a: false, s: false, d: false };
  let curseOverlayEnabled = false;
  let isRunning = false;
  let isPaused = false;
  let isGameOver = false;
  let inputLocked = false;
  let lastCollisionFeedback = 0;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (inputLocked) return;
    if (e.key === "w") keys.w = true;
    if (e.key === "a") keys.a = true;
    if (e.key === "s") keys.s = true;
    if (e.key === "d") keys.d = true;
    if (e.key.toLowerCase() === "c") {
      curseOverlayEnabled = !curseOverlayEnabled;
      updateVignetteCurse(curseOverlayEnabled);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  cleanupFns.push(() => window.removeEventListener("keydown", handleKeyDown));
  const handleKeyUp = (e: KeyboardEvent) => {
    if (inputLocked) return;
    if (e.key === "w") keys.w = false;
    if (e.key === "a") keys.a = false;
    if (e.key === "s") keys.s = false;
    if (e.key === "d") keys.d = false;
  };
  window.addEventListener("keyup", handleKeyUp);
  cleanupFns.push(() => window.removeEventListener("keyup", handleKeyUp));

  const handleClick = () => {
    if (inputLocked) return;
    spawnFloatingText(
      `${Math.floor(Math.random() * 20) + 5}`,
      charGroup.position,
      CONFIG.colors.cyan,
      Math.random() > 0.7
    );
  };
  window.addEventListener("click", handleClick);
  cleanupFns.push(() => window.removeEventListener("click", handleClick));

  const handleStateChange = (state: { isRunning: boolean; isPaused: boolean }) => {
    isRunning = state.isRunning;
    isPaused = state.isPaused;
  };
  gameState.on("state", handleStateChange);
  cleanupFns.push(() => gameState.off("state", handleStateChange));

  const handleGameOver = () => {
    isRunning = false;
    isPaused = true;
    isGameOver = true;
    inputLocked = true;
  };
  gameState.on("gameOver", handleGameOver);
  cleanupFns.push(() => gameState.off("gameOver", handleGameOver));

  // --- ENTITY MANAGEMENT ---
  // Example: Move player with WASD
  function updatePlayer() {
    if (!isRunning || isPaused || isGameOver) return;

    let speed = 0.5;
    if (keys.w) charGroup.position.z -= speed;
    if (keys.s) charGroup.position.z += speed;
    if (keys.a) charGroup.position.x -= speed;
    if (keys.d) charGroup.position.x += speed;

    const halfLane = CONFIG.laneWidth / 2;
    const clampedX = Math.min(Math.max(charGroup.position.x, -halfLane), halfLane);
    const clampedZ = Math.min(
      Math.max(charGroup.position.z, -CONFIG.endZone),
      CONFIG.endZone
    );
    const collided = clampedX !== charGroup.position.x || clampedZ !== charGroup.position.z;

    charGroup.position.x = clampedX;
    charGroup.position.z = clampedZ;

    const now = performance.now();
    if (collided && now - lastCollisionFeedback > 200) {
      lastCollisionFeedback = now;
      spawnFloatingText("CLANG", charGroup.position, CONFIG.colors.red, false, 400);
    }
  }

  function updateAimHelpers(now: number, delta: number) {
    weaponSystem.updateAimTarget(aimTarget);
    aimLine.geometry.setFromPoints([
      new THREE.Vector3(charGroup.position.x, 2.5, charGroup.position.z),
      new THREE.Vector3(aimTarget.x, 0.1, aimTarget.z),
    ]);

    targetMesh.position.set(aimTarget.x, 0.05, aimTarget.z);
    const pulse = 1 + Math.sin(now * 0.008) * 0.08;
    targetMesh.scale.setScalar(pulse);
    targetMesh.rotation.z += delta * 0.002;
  }

  // --- ANIMATION LOOP ---
  let lastTime = performance.now();
  let animationFrameId: number | null = null;
  let isDisposed = false;
  function animate(now: number) {
    if (isDisposed) return;
    const delta = now - lastTime;
    lastTime = now;

    animationFrameId = requestAnimationFrame(animate);
    gameState.tick(delta);
    updatePlayer();
    enemyManager.update(delta);
    updateAimHelpers(now, delta);
    weaponSystem.update(delta);
    xpManager.update(delta);
    chestManager.update(delta);
    updateFloatingText(delta);
    updateScanline(now);
    updateVignetteCurse(curseOverlayEnabled);
    composer.render();
  }
  animate(lastTime);

  const teardown = () => {
    if (isDisposed) return;
    isDisposed = true;

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    enemyManager.reset();
    weaponSystem.reset();
    xpManager.reset();
    chestManager.reset();

    cleanupFns.forEach((fn) => fn());

    renderer.domElement.remove();
    composer.dispose();
    renderer.dispose();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  };

  // Return objects for further use
  return { scene, camera, renderer, composer, worldGroup, charGroup, teardown };
}
