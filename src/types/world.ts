import type * as THREE from "three";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";

export interface GameWorld {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  worldGroup: THREE.Group;
  charGroup: THREE.Group;
  teardown: () => void;
}

export interface WorldLifecycle {
  getWorld: () => GameWorld;
  resetWorld: () => GameWorld;
}
