import * as THREE from 'three';

export function createCursorMesh() {
  const cursorMesh = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.4, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide })
  );
  cursorMesh.rotation.x = -Math.PI / 2;
  cursorMesh.position.y = 0.2;
  return cursorMesh;
}

export function createAimLinePool() {
  const aimLineGroup = new THREE.Group();
  const aimLinePool = [];
  for (let i = 0; i < 50; i++) {
    const line = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
    );
    line.visible = false;
    aimLineGroup.add(line);
    aimLinePool.push(line);
  }
  return { aimLineGroup, aimLinePool };
}
