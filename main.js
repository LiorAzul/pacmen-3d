// 3D Cyber-Pac core game.
const gameRoot = new THREE.Group();
World.scene.add(gameRoot);
const state = {
  running: false, ended: false, score: 0, lives: 3, pelletsLeft: 0,
  poweredUntil: 0, startTime: 0, avatar: null, velocity: new THREE.Vector3(), ghosts: [], pellets: []
};
World.exports.pacState = state;

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffd51c, emissive: 0xffa800, emissiveIntensity: 1.15, roughness: 0.28, metalness: 0.15 });
const avatar = new THREE.Group();
const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 20), bodyMat);
body.castShadow = true;
avatar.add(body);
const mouth = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.95, 3), new THREE.MeshBasicMaterial({ color: 0x080815 }));
mouth.rotation.z = -Math.PI / 2;
mouth.rotation.y = Math.PI / 2;
mouth.position.x = 0.55;
avatar.add(mouth);
const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }));
eye.position.set(0.38, 0.45, -0.35);
avatar.add(eye);
avatar.position.set(0, 0.85, 4);
gameRoot.add(avatar);
state.avatar = avatar;
World.fx.trail(avatar, { color: 0xffd51c, length: 14 });

function resetAvatar() {
  avatar.position.set(0, 0.85, 4);
  state.velocity.set(0, 0, 0);
}
function finish(win) {
  if (state.ended) return;
  state.ended = true;
  state.running = false;
  if (win) {
    World.audio.sfx('win');
    World.fx.flash(0x44ffff, 500);
    if (!World.state.cyberPacRewarded) { World.state.cyberPacRewarded = true; World.score.win({ idempotencyKey: 'cyber-pac-clear' }); }
  } else World.audio.sfx('lose');
  const elapsed = Math.max(1, Math.floor((performance.now() - state.startTime) / 1000));
  World.highscore('cyber-pac-open-world', state.score).then(r => {
    World.results.show({
      title: win ? 'העיר נוקתה!' : 'הרוחות השתלטו', score: state.score, best: r.best, isNew: r.isNew,
      stats: [{ label: 'זמן', value: elapsed + ' שנ׳' }, { label: 'כדורים שנותרו', value: state.pelletsLeft }],
      onReplay: () => location.reload(), onExit: () => World.input.unlockPointer()
    });
  });
}
World.exports.finishCyberPac = finish;
World.exports.hitPac = () => {
  if (!state.running || performance.now() < state.poweredUntil) return;
  state.lives--;
  World.exports.pacLives?.lose();
  World.audio.sfx('hit');
  World.fx.shake(0.65, 380);
  World.fx.flash(0xff0033, 250);
  resetAvatar();
  if (state.lives <= 0) finish(false);
};
World.exports.addPacScore = (amount, pos) => {
  state.score += amount;
  World.exports.pacScore?.set(state.score);
  World.fx.floatText('+' + amount, pos.clone().add(new THREE.Vector3(0, 1.2, 0)));
};

World.tick((dt) => {
  if (!state.running || state.ended) return;
  let x = 0, z = 0;
  if (World.input.keys.KeyW || World.input.keys.ArrowUp) z -= 1;
  if (World.input.keys.KeyS || World.input.keys.ArrowDown) z += 1;
  if (World.input.keys.KeyA || World.input.keys.ArrowLeft) x -= 1;
  if (World.input.keys.KeyD || World.input.keys.ArrowRight) x += 1;
  const vr = World.input.vr;
  if (vr?.isActive && vr.leftThumbstick) { x += vr.leftThumbstick.x || 0; z += vr.leftThumbstick.y || 0; }
  const desired = new THREE.Vector3(x, 0, z);
  if (desired.lengthSq() > 0.05) {
    desired.normalize().multiplyScalar(8.5);
    state.velocity.lerp(desired, Math.min(1, dt * 9));
    avatar.rotation.y = Math.atan2(state.velocity.x, state.velocity.z) - Math.PI / 2;
  } else state.velocity.multiplyScalar(Math.max(0, 1 - dt * 8));
  const next = avatar.position.clone().addScaledVector(state.velocity, dt);
  next.x = THREE.MathUtils.clamp(next.x, -61, 61);
  next.z = THREE.MathUtils.clamp(next.z, -61, 61);
  // Building blocks occupy 10x10 footprints; slide away from their cores.
  let blocked = false;
  for (let gx = -48; gx <= 48 && !blocked; gx += 16) for (let gz = -48; gz <= 48; gz += 16) {
    if (Math.abs(gx) < 10 || Math.abs(gz) < 10) continue;
    if (Math.abs(next.x - gx) < 5.8 && Math.abs(next.z - gz) < 5.8) { blocked = true; break; }
  }
  if (!blocked) avatar.position.copy(next); else state.velocity.multiplyScalar(-0.15);
  body.scale.y = 1 + Math.sin(performance.now() * 0.014) * 0.05;
  mouth.scale.setScalar(0.7 + Math.abs(Math.sin(performance.now() * 0.012)) * 0.45);
}, { rate: 'frame', priority: 'critical' });
World.addCleanup('main.js', () => World.scene.remove(gameRoot));