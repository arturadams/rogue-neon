import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { GameState } from "./GameState";
import { GameWorld } from "../../types/world";

export function setupWorld(_gameState: GameState): GameWorld {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const composer = new EffectComposer(renderer);
  const worldGroup = new THREE.Group();
  const charGroup = new THREE.Group();
  scene.add(worldGroup);
  scene.add(charGroup);

  const teardown = () => {
    renderer.dispose();
    composer.passes = [];
    worldGroup.clear();
    charGroup.clear();
  };

  return { scene, camera, renderer, composer, worldGroup, charGroup, teardown };
}
