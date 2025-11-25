export function createPickupSystem({ player, entities, charGroup, scene, state, helpers }) {
  const { gainXp, showEvolutionModal, showItemModal, showFloatText, updateHUD } = helpers;

  return function updatePickups() {
    for (let i = entities.orbs.length - 1; i >= 0; i--) {
      const orb = entities.orbs[i];
      const distance = charGroup.position.distanceTo(orb.mesh.position);
      const isMagnet = distance < player.magnetRadius;
      orb.mesh.position.lerp(charGroup.position, isMagnet ? 0.2 : 0.015);
      if (distance < 2) {
        if (orb.type === 'xp') gainXp(orb.val);
        else player.gold += orb.val;
        updateHUD();
        scene.remove(orb.mesh);
        entities.orbs.splice(i, 1);
      } else if (!isMagnet) orb.mesh.position.y = 1 + Math.sin(state.frame * 0.1 + i) * 0.5;
    }

    for (let i = entities.drops.length - 1; i >= 0; i--) {
      const drop = entities.drops[i];
      const distance = charGroup.position.distanceTo(drop.mesh.position);
      drop.mesh.position.lerp(charGroup.position, distance < player.magnetRadius ? 0.1 : 0.005);
      if (distance < 3) {
        if (drop.item.type === 'synergy') {
          const weapon = player.activeSpells.find(spell => spell.id === drop.item.weapon_id);
          if (weapon && weapon.level >= 5 && !weapon.isEvo) {
            showEvolutionModal(weapon, drop.item);
          } else {
            player.gold += 50;
            showFloatText('+50 GOLD', charGroup.position, 0xffd700);
          }
        } else {
          showItemModal(drop.item);
        }
        scene.remove(drop.mesh);
        entities.drops.splice(i, 1);
      }
      drop.mesh.rotation.y += 0.05;
    }
  };
}
