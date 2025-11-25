import * as THREE from 'three';

const matGlass = new THREE.MeshPhysicalMaterial({
  color: 0x101025,
  metalness: 0.9,
  roughness: 0.1,
  transparent: true,
  opacity: 0.8,
  transmission: 0.2
});

export function createNeonMesh(geometry, color) {
  const mesh = new THREE.Mesh(geometry, matGlass);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 })
  );
  mesh.add(edges);
  return mesh;
}

export function createProjectileGeometry() {
  return new THREE.BoxGeometry(0.5, 0.5, 1);
}
