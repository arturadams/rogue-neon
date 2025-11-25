export function registerInputHandlers({ camera, renderer, composer, keys, mouse }) {
  window.addEventListener('keydown', e => (keys[e.key.toLowerCase()] = true));
  window.addEventListener('keyup', e => (keys[e.key.toLowerCase()] = false));
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });
}
