// Pellets, power cores and pursuing neon ghosts.
const entityRoot = new THREE.Group();
World.scene.add(entityRoot);
const entityState = World.exports.pacState;
const pelletMat = new THREE.MeshStandardMaterial({ color: 0xfff3a1, emissive: 0xffcc44, emissiveIntensity: 3.2, roughness: 0.3 });
const powerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x59ffff, emissiveIntensity: 4.5, roughness: 0.2 });
const pelletGeo = new THREE.SphereGeometry(0.14, 10, 7);
const positions = [];
for (let lane = -56; lane <= 56; lane += 8) {
  for (let d = -56; d <= 56; d += 4) {
    if (lane % 16 === 0 || Math.abs(lane) < 9) positions.push(new THREE.Vector3(lane, 0.42, d));
    if (d % 16 === 0 || Math.abs(d) < 9) positions.push(new THREE.Vector3(lane, 0.42, d));
  }
}
// Remove duplicates and keep a performant, broad city-wide trail.
const seen = new Set();
positions.forEach((p, i) => {
  const key = p.x + ':' + p.z;
  if (seen.has(key) || Math.abs(p.x) < 2 && p.z > 0 && p.z < 8) return;
  seen.add(key);
  const power = i % 83 === 0;
  const mesh = new THREE.Mesh(power ? new THREE.SphereGeometry(0.34, 14, 10) : pelletGeo, power ? powerMat : pelletMat);
  mesh.position.copy(p);
  mesh.userData.power = power;
  entityRoot.add(mesh);
  state.pellets.push(mesh);
});
state.pelletsLeft = state.pellets.length;

const ghostColors = [0xff247d, 0x24dfff, 0xff7424, 0xb94cff];
const starts = [[-20,-20],[20,-20],[-36,20],[36,20]];
const ghostGeo = new THREE.SphereGeometry(0.8, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.7);
ghostColors.forEach((color, i) => {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.1, roughness: 0.3, transparent: true, opacity: 0.94 });
  const shell = new THREE.Mesh(ghostGeo, mat);
  shell.castShadow = true;
  g.add(shell);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.65, 12), mat);
  skirt.position.y = -0.48;
  g.add(skirt);
  for (const side of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    e.position.set(side * 0.28, 0.2, -0.68);
    g.add(e);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshBasicMaterial({ color: 0x07102f }));
    pupil.position.set(side * 0.28, 0.2, -0.83);
    g.add(pupil);
  }
  g.position.set(starts[i][0], 1.15, starts[i][1]);
  g.userData.home = g.position.clone();
  g.userData.speed = 2.8 + i * 0.32;
  g.userData.phase = i * 1.7;
  entityRoot.add(g);
  state.ghosts.push(g);
  World.fx.trail(g, { color, length: 9 });
});

World.tick((dt) => {
  if (!state.running || state.ended) return;
  const now = performance.now();
  for (let i = state.pellets.length - 1; i >= 0; i--) {
    const p = state.pellets[i];
    p.rotation.y += dt * 2;
    if (World.overlapSphere(state.avatar.position, 0.72, p.position, p.userData.power ? 0.55 : 0.3)) {
      state.pellets.splice(i, 1); entityRoot.remove(p); p.geometry !== pelletGeo && p.geometry.dispose();
      state.pelletsLeft--;
      const value = p.userData.power ? 100 : 10;
      World.exports.addPacScore(value, p.position);
      World.audio.sfx(p.userData.power ? 'powerup' : 'coin');
      World.fx.burst(p.position, { color: p.userData.power ? 0x66ffff : 0xffdd55, count: p.userData.power ? 22 : 7, speed: 2 });
      if (p.userData.power) { state.poweredUntil = now + 9000; World.ui.toast('מצב כוח: הרוחות פגיעות!', { icon: '⚡' }); }
      if (state.pelletsLeft <= 0) World.exports.finishCyberPac(true);
    }
  }
  state.ghosts.forEach((g, i) => {
    const powered = now < state.poweredUntil;
    const toPac = state.avatar.position.clone().sub(g.position);
    const distance = toPac.length();
    const targetDir = distance > 0.01 ? toPac.normalize() : new THREE.Vector3();
    if (powered) targetDir.multiplyScalar(-1);
    targetDir.x += Math.sin(now * 0.001 + g.userData.phase) * 0.18;
    targetDir.z += Math.cos(now * 0.0013 + g.userData.phase) * 0.18;
    g.position.addScaledVector(targetDir.normalize(), g.userData.speed * dt * (powered ? 0.72 : 1));
    g.position.x = THREE.MathUtils.clamp(g.position.x, -60, 60);
    g.position.z = THREE.MathUtils.clamp(g.position.z, -60, 60);
    g.position.y = 1.15 + Math.sin(now * 0.004 + i) * 0.18;
    g.lookAt(state.avatar.position.x, g.position.y, state.avatar.position.z);
    g.children.forEach(c => { if (c.material?.emissive) c.material.opacity = powered ? 0.48 : 0.94; });
    if (distance < 1.35) {
      if (powered) {
        World.exports.addPacScore(250, g.position);
        World.audio.sfx('hit'); World.fx.burst(g.position, { color: ghostColors[i], count: 28, speed: 4 });
        g.position.copy(g.userData.home); g.position.y = 1.15;
      } else World.exports.hitPac();
    }
  });
}, { rate: 'frame', priority: 'critical' });
World.addCleanup('entities.js', () => World.scene.remove(entityRoot));