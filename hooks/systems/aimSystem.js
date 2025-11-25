import * as THREE from 'three';

export function createAimSystem({ player, cursorWorldPos, cursorMesh, aimLinePool, charGroup }) {
  return function updateAimGuide() {
    cursorMesh.position.x = cursorWorldPos.x;
    cursorMesh.position.z = cursorWorldPos.z;
    cursorMesh.rotation.z += 0.05;
    aimLinePool.forEach(line => (line.visible = false));
    let poolIdx = 0;
    const start = charGroup.position.clone().add(new THREE.Vector3(0, 3, 0));

    player.activeSpells.forEach(spell => {
      const cfg = spell.data.base;
      if (!cfg) return;
      let shots = (cfg.count || 1) + player.multiCast;
      if (spell.path === 'A' && spell.data.id === 'w_01') shots *= 2;

      const range = (cfg.range || 50) * player.rangeMult;
      for (let i = 0; i < shots; i++) {
        if (poolIdx >= aimLinePool.length) break;
        const dir = new THREE.Vector3().subVectors(cursorWorldPos, charGroup.position).normalize();
        if (i > 0)
          dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), (i % 2 === 0 ? 1 : -1) * 0.1 * Math.ceil(i / 2));
        const end = start.clone().add(dir.multiplyScalar(range));
        const pts = [start, end];
        aimLinePool[poolIdx].geometry.setFromPoints(pts);
        aimLinePool[poolIdx].material.color.setHex(spell.data.color);
        aimLinePool[poolIdx].visible = true;
        poolIdx++;
      }
    });
  };
}
