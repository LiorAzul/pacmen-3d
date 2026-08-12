// Readable cyberpunk night lighting.
if (World.lighting?.applyPreset) World.lighting.applyPreset('cyberpunk');
if (World.lighting?.applyVisibilitySafety) World.lighting.applyVisibilitySafety({ preset: 'cyberpunk', exposure: 1.55 });
const lightRoot = new THREE.Group();
World.scene.add(lightRoot);
if (!World.lighting?.applyPreset) {
  const hemi = new THREE.HemisphereLight(0x4466ff, 0x19071d, 1.7);
  lightRoot.add(hemi);
  const key = new THREE.DirectionalLight(0xa7dfff, 2.8);
  key.position.set(18, 35, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  lightRoot.add(key);
}
const pink = new THREE.PointLight(0xff198f, 20, 30, 2);
pink.position.set(-10, 6, -10);
lightRoot.add(pink);
const blue = new THREE.PointLight(0x00ccff, 22, 34, 2);
blue.position.set(12, 7, -22);
lightRoot.add(blue);
World.addCleanup('lighting.js', () => World.scene.remove(lightRoot));