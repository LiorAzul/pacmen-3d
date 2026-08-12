// Game Kit HUD and onboarding.
const state = World.exports.pacState; // Fix reference

World.exports.pacScore = World.ui.score({ label: 'ניקוד', icon: '◉', position: 'top-left' });
World.exports.pacLives = World.ui.lives({ max: 3, icon: '💛', onEmpty: () => World.exports.finishCyberPac(false) });

const maxPellets = state ? Math.max(1, state.pelletsLeft || 1) : 100;
const progress = World.ui.progressBar({ max: maxPellets, label: 'כדורי נתונים' });
World.ui.keyHint([['WASD / חצים', 'תנועה'], ['VR Stick', 'תנועה']]);

let lastPellets = state ? state.pelletsLeft : 0;
World.tick(() => {
  if (state && state.pelletsLeft !== lastPellets) {
    lastPellets = state.pelletsLeft;
    if (progress.set) progress.set(Math.max(0, progress.max ? progress.max - state.pelletsLeft : 0));
  }
}, { rate: 'normal', priority: 'normal' });

// Create a physical 3D start button in the world
const startButton = new THREE.Group();
const btnBg = new THREE.Mesh(
  new THREE.BoxGeometry(3, 1, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x111122, emissive: 0xff0055, emissiveIntensity: 0.8, roughness: 0.2 })
);
startButton.add(btnBg);
// Position it right in front of where the avatar spawns
startButton.position.set(0, 1.5, 0); 
World.scene.add(startButton);

const textLabel = World.text3d('התחל מרדף', { position: new THREE.Vector3(0, 0, 0.12), scale: 2, color: 0xffffff });
startButton.add(textLabel.object);

const picker = World.gamekit.picker([btnBg], () => {
  picker.dispose();
  World.scene.remove(startButton);
  textLabel.dispose();
  
  World.ui.countdown({ from: 3, text: 'צא!' }).then(() => {
    if (state) {
      state.running = true;
      state.startTime = performance.now();
    }
    World.audio.sfx('go');
    World.input.lockPointer();
  });
}, { hoverGlow: true });

// Idle animation for the button
World.tick((dt) => {
  if (startButton.parent) {
    startButton.position.y = 1.5 + Math.sin(performance.now() * 0.003) * 0.1;
  }
}, { rate: 'slow', priority: 'decorative' });

World.addCleanup('ui.js', () => {
  World.scene.remove(startButton);
  textLabel.dispose();
  picker.dispose();
});