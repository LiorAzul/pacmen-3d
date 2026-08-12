// Cyberpunk open-world maze environment
const envRoot = new THREE.Group();
envRoot.name = 'Neon Grid City';
World.scene.add(envRoot);
World.scene.background = new THREE.Color(0x030414);
World.scene.fog = new THREE.FogExp2(0x05051a, 0.018);

const asphalt = World.materials?.get ? World.materials.get('wet_asphalt', { color: 0x080b18 }) : new THREE.MeshStandardMaterial({ color: 0x080b18, roughness: 0.34, metalness: 0.48 });
const concrete = World.materials?.get ? World.materials.get('concrete', { color: 0x17152b }) : new THREE.MeshStandardMaterial({ color: 0x17152b, roughness: 0.72 });
const cyan = new THREE.MeshStandardMaterial({ color: 0x082d38, emissive: 0x00d9ff, emissiveIntensity: 2.6, metalness: 0.55, roughness: 0.22 });
const magenta = new THREE.MeshStandardMaterial({ color: 0x36082e, emissive: 0xff168f, emissiveIntensity: 2.4, metalness: 0.5, roughness: 0.25 });
const yellow = new THREE.MeshStandardMaterial({ color: 0x4d3b02, emissive: 0xffd629, emissiveIntensity: 2.5 });

const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), asphalt);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
envRoot.add(ground);

// Large navigable avenue grid, open at intersections.
const blockCenters = [];
for (let x = -48; x <= 48; x += 16) for (let z = -48; z <= 48; z += 16) {
  if (Math.abs(x) < 10 || Math.abs(z) < 10) continue;
  blockCenters.push([x, z]);
}
const buildingGeo = new THREE.BoxGeometry(10, 1, 10);
const buildingMats = [concrete, new THREE.MeshStandardMaterial({ color: 0x10162c, metalness: 0.55, roughness: 0.42 }), new THREE.MeshStandardMaterial({ color: 0x241126, metalness: 0.4, roughness: 0.5 })];
blockCenters.forEach((p, i) => {
  const h = 7 + ((i * 7) % 17);
  const tower = new THREE.Mesh(buildingGeo, buildingMats[i % buildingMats.length]);
  tower.position.set(p[0], h / 2, p[1]);
  tower.scale.y = h;
  tower.castShadow = i < 12;
  tower.receiveShadow = true;
  envRoot.add(tower);
  for (let y = 2.5; y < h; y += 3.2) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(10.12, 0.13, 10.12), (i + Math.floor(y)) % 2 ? cyan : magenta);
    strip.position.set(p[0], y, p[1]);
    envRoot.add(strip);
  }
});

// Glowing road lanes guide exploration.
for (let n = -48; n <= 48; n += 16) {
  const laneX = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 140), n % 32 === 0 ? cyan : magenta);
  laneX.position.set(n + 6.6, 0.035, 0);
  envRoot.add(laneX);
  const laneZ = new THREE.Mesh(new THREE.BoxGeometry(140, 0.025, 0.12), n % 32 === 0 ? magenta : cyan);
  laneZ.position.set(0, 0.036, n + 6.6);
  envRoot.add(laneZ);
}

// Hero holographic Pac emblem visible from spawn.
const hero = new THREE.Group();
hero.position.set(0, 9, -24);
const disc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48, 0.35, Math.PI * 1.72), yellow);
disc.rotation.y = Math.PI;
hero.add(disc);
const halo = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.1, 10, 64), cyan);
hero.add(halo);
envRoot.add(hero);

// Perimeter pylons and distant skyline silhouettes.
const pylonGeo = new THREE.CylinderGeometry(0.18, 0.3, 4, 6);
for (let i = 0; i < 40; i++) {
  const a = i / 40 * Math.PI * 2;
  const r = 61;
  const p = new THREE.Mesh(pylonGeo, i % 2 ? cyan : magenta);
  p.position.set(Math.cos(a) * r, 2, Math.sin(a) * r);
  envRoot.add(p);
}

// Atmospheric data motes.
const moteCount = Math.floor(650 * (World.quality?.particlesScale || 1));
const motePos = new Float32Array(moteCount * 3);
for (let i = 0; i < moteCount; i++) {
  motePos[i * 3] = (Math.random() - 0.5) * 130;
  motePos[i * 3 + 1] = 1 + Math.random() * 28;
  motePos[i * 3 + 2] = (Math.random() - 0.5) * 130;
}
const moteGeo = new THREE.BufferGeometry();
moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0x55ddff, size: 0.09, transparent: true, opacity: 0.65, depthWrite: false }));
envRoot.add(motes);
World.tick((dt) => { hero.rotation.y += dt * 0.22; halo.rotation.z -= dt * 0.35; motes.rotation.y += dt * 0.008; }, { rate: 'slow', priority: 'decorative' });
World.exports.cityRoot = envRoot;
World.addCleanup('environment.js', () => {
  World.scene.remove(envRoot);
  envRoot.traverse(o => { if (o.geometry) o.geometry.dispose(); });
});