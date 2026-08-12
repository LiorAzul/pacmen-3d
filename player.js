// Third-person chase camera for the game-owned Pac character.
const pacCameraState = World.exports.pacState;
const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
World.tick((dt) => {
  if (!pacCameraState?.avatar) return;
  const pac = pacCameraState.avatar;
  cameraDesired.set(pac.position.x + 7.5, pac.position.y + 8.5, pac.position.z + 10.5);
  World.camera.position.lerp(cameraDesired, Math.min(1, dt * 4.5));
  cameraTarget.set(pac.position.x, pac.position.y + 0.35, pac.position.z - 2.5);
  World.camera.lookAt(cameraTarget);
}, { rate: 'frame', priority: 'critical' });