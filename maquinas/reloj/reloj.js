/* Teardown · Reloj de péndulo con escape de áncora (Graham).
   One model drives everything: the pendulum ODE (with circular error, air damping and the escapement impulse)
   advances the escape wheel; the gear train, hands, weight and every panel read from that same state. */
(() => {
const {PI, sin, cos, abs, sqrt, min, max} = Math;
const TAU = 2 * PI, D = PI / 180, DIAL_ROT = (window.DIAL_ROT !== undefined ? window.DIAL_ROT : PI / 2);
const C = {ink: '#16181b', mute: '#8b8f95', faint: '#c9ccd0', line: '#e1e3e6', panel: 'rgba(248,248,249,.94)', acc: '#f05a23', blue: '#3d8fe0', bg: '#f1f1ef'};

/* ================= the model (real units: m, kg, s) ================= */
const P = {
  L: 0.994,          // pendulum effective length (pivot → bob centre)
  g: 9.81, planet: 'Tierra',
  Q: 3400,           // quality factor of the pendulum in air
  mW: 3.0,           // driving weight
  mB: 1.5,           // bob mass
  rDrum: 0.012,      // drum radius on the great wheel
  eta: 0.5,          // train efficiency (great wheel → pallets)
  thZ: 1.0 * D,      // impulse zone: ±1° around the centre (Graham deadbeat)
  thR: 1.6 * D,      // swing needed past centre to unlock the next tooth
  speed: 1
};
const TRAIN = {great: 96, cPin: 8, center: 64, tPin: 8, third: 60, ePin: 8, esc: 30};   // 96/8 · 64/8 · 60/8 → escape 1 rev/min
const RATIO_CE = (TRAIN.center / TRAIN.tPin) * (TRAIN.third / TRAIN.ePin);            // 60
const RATIO_GC = TRAIN.great / TRAIN.cPin;                                               // 12
const S = {th: 0, om: 0, t: 0, beats: 0, prog: 0, armed: true, side: 1, inZone: false, amp: 0, ampHalf: 0, lastCross: null, Tm: null, impulse: 0, stopped: false, hist: [], energyHist: [], beatsAt: [], kick: 0};
const Ein = () => P.eta * P.mW * P.g * TAU * P.rDrum / (60 * RATIO_CE * RATIO_GC);      // J delivered per beat
const w0 = () => sqrt(P.g / P.L);
const Tth = () => TAU * sqrt(P.L / P.g);
const Epend = () => 0.5 * P.mB * P.L * P.L * S.om * S.om + P.mB * P.g * P.L * (1 - cos(S.th));
const ampEq = () => sqrt(2 * Ein() * P.Q / (PI * P.mB * P.g * P.L));                    // energy in = energy lost per beat
function resetPendulum(a) { S.th = a; S.om = 0; S.amp = a; S.ampHalf = a; S.armed = true; S.stopped = false; S.lastCross = null; S.Tm = null; }
resetPendulum(ampEq());

function step(h) {
  const I = P.mB * P.L * P.L;
  let a = -(P.g / P.L) * sin(S.th) - (w0() / P.Q) * S.om;
  const z = abs(S.th) < P.thZ, dir = Math.sign(S.om) || 1;
  if (S.armed && z) { a += (Ein() / (2 * P.thZ)) / I * dir; S.impulse = 1; S.prog = min(1, max(0, (S.th * dir + P.thZ) / (2 * P.thZ))); }
  if (S.kick) { a += S.kick; }
  const thPrev = S.th;
  S.om += a * h; S.th += S.om * h; S.t += h;
  // leaving the impulse zone on the far side: the wheel drops onto the other pallet and locks (one beat = 6°)
  if (S.armed && abs(thPrev) < P.thZ && abs(S.th) >= P.thZ && Math.sign(S.th) === dir) { S.armed = false; S.beats++; S.prog = 0; S.side = dir; S.beatsAt.push(S.t); if (S.beatsAt.length > 40) S.beatsAt.shift(); }
  // swinging past the release angle on that side unlocks the next tooth for the return swing
  if (!S.armed && S.th * S.side > P.thR) S.armed = true;
  // amplitude per half swing and measured period (upward zero crossings)
  S.ampHalf = max(S.ampHalf, abs(S.th));
  if (Math.sign(thPrev) !== Math.sign(S.th) && thPrev !== 0) { S.amp = S.ampHalf; S.ampHalf = 0;
    if (S.th > 0) { if (S.lastCross !== null) S.Tm = S.t - S.lastCross; S.lastCross = S.t; } }
  S.stopped = S.amp < P.thR && !S.armed;
}
function advance(dt) {
  let left = dt * P.speed; const h = 0.002;
  S.impulse *= Math.exp(-dt * 6);
  while (left > 1e-9) { const k = min(h, left); step(k); left -= k; }
  S.kick = 0;
}

/* ================= renderer & light studio ================= */
const app = document.getElementById('app');
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(C.bg);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new THREE.RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 20);
scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dde2, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(-0.9, 2.6, 1.6); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, {left: -0.6, right: 0.6, top: 0.9, bottom: -0.9, near: 0.5, far: 5}); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.002;
key.target.position.set(0, 0.85, 0); scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xfff2e0, 0.6); rim.position.set(1.2, 1.6, -0.5); scene.add(rim);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({color: 0xe9e9e6, roughness: 0.95})); wall.position.set(0, 1, -0.125); wall.receiveShadow = true; scene.add(wall);

/* ---------- materials ---------- */
const MAT = {
  brass: () => new THREE.MeshStandardMaterial({color: 0xc9a24f, metalness: 1, roughness: 0.42, envMapIntensity: 0.55}),
  brassDark: () => new THREE.MeshStandardMaterial({color: 0xa88437, metalness: 1, roughness: 0.5, envMapIntensity: 0.5}),
  steel: () => new THREE.MeshStandardMaterial({color: 0xb8bdc4, metalness: 1, roughness: 0.32, envMapIntensity: 0.6}),
  blued: () => new THREE.MeshStandardMaterial({color: 0x1f2c4f, metalness: 0.8, roughness: 0.35}),
  ruby: () => new THREE.MeshStandardMaterial({color: 0x9e1430, metalness: 0.1, roughness: 0.15}),
  enamel: () => new THREE.MeshStandardMaterial({color: 0xf7f5ef, roughness: 0.35, map: dialTex()}),
  walnut: () => new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.55, map: woodTex()}),
  glass: () => new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.2, depthWrite: false}),
  cord: () => new THREE.MeshStandardMaterial({color: 0x3b3f45, roughness: 0.8}),
  ink: () => new THREE.MeshBasicMaterial({color: 0x16181b})
};
function woodTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#6b4127'; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 160; i++) { const x = Math.random() * 512, w = 1 + Math.random() * 3; g.strokeStyle = `rgba(${40 + Math.random() * 30},${20 + Math.random() * 15},10,${0.15 + Math.random() * 0.25})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= 1024; y += 32) g.lineTo(x + sin(y * 0.01 + i) * 6, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function dialTex() {
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), m = N / 2;
  g.fillStyle = '#f7f5ef'; g.fillRect(0, 0, N, N);
  const R = N / 2, rr = r => r / 0.085 * R;             // dial radius 0.085 m → texture
  g.strokeStyle = '#16181b'; g.fillStyle = '#16181b';
  g.lineWidth = 3; g.beginPath(); g.arc(m, m, rr(0.081), 0, TAU); g.stroke(); g.beginPath(); g.arc(m, m, rr(0.077), 0, TAU); g.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU - PI / 2, r1 = rr(0.077), r2 = rr(i % 5 ? 0.0745 : 0.072); g.lineWidth = i % 5 ? 2 : 4; g.beginPath(); g.moveTo(m + cos(a) * r1, m + sin(a) * r1); g.lineTo(m + cos(a) * r2, m + sin(a) * r2); g.stroke(); }
  const rom = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  g.font = `600 ${N * 0.052}px Georgia, 'Times New Roman', serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  rom.forEach((s, i) => { const a = i / 12 * TAU - PI / 2, r = rr(0.0635); g.save(); g.translate(m + cos(a) * r, m + sin(a) * r); g.rotate(a + PI / 2); g.fillText(s, 0, 0); g.restore(); });
  // seconds subdial around the escape arbor (37 mm above the centre)
  const sy = m - rr(0.0372), sx = m + rr(0.0022);
  g.lineWidth = 2; g.beginPath(); g.arc(sx, sy, rr(0.016), 0, TAU); g.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU - PI / 2, r1 = rr(0.016), r2 = rr(i % 5 ? 0.0148 : 0.0138); g.lineWidth = i % 5 ? 1.2 : 2.4; g.beginPath(); g.moveTo(sx + cos(a) * r1, sy + sin(a) * r1); g.lineTo(sx + cos(a) * r2, sy + sin(a) * r2); g.stroke(); }
  g.font = `600 ${N * 0.017}px Inter, sans-serif`; g.fillText('SEGUNDOS', sx, sy + rr(0.0215));
  g.font = `500 ${N * 0.02}px Georgia, serif`; g.fillText('UTM · MECÁNICA', m, m + rr(0.028));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.center.set(0.5, 0.5); t.rotation = DIAL_ROT; return t;
}

/* ---------- geometry helpers ---------- */
const parts = [];   // {mesh, tags}
function add(parent, mesh, tags) { mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); parts.push({mesh, tags: tags.split(' '), base: mesh.material.opacity, baseT: mesh.material.transparent}); return mesh; }
const ext = (shape, depth, bevel = 0.00025, seg = 24) => { const g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: seg}); g.translate(0, 0, -depth / 2); return g; };
function gearShape(N, rp, {add = 1, ded = 1.25, m = rp * 2 / N, hole = 0.0012, spokes = 0, rim = 0.16, hub = 0.22} = {}) {
  const s = new THREE.Shape(), ra = rp + add * m, rd = rp - ded * m, w = PI / N;
  for (let i = 0; i < N; i++) {
    const a = i * 2 * w;
    const P2 = (r, an) => [cos(an) * r, sin(an) * r];
    const pts = [P2(rd, a - w * 0.55), P2(rp, a - w * 0.42), P2(ra, a - w * 0.25), P2(ra, a + w * 0.25), P2(rp, a + w * 0.42), P2(rd, a + w * 0.55)];
    pts.forEach(([x, y], k) => (i === 0 && k === 0) ? s.moveTo(x, y) : s.lineTo(x, y));
    s.absarc(0, 0, rd, a + w * 0.55, a + 2 * w - w * 0.55, false);
  }
  s.holes.push(new THREE.Path().absarc(0, 0, hole, 0, TAU, true));
  if (spokes) {
    const ri = rd - rp * rim, rh = rp * hub, sw = 0.12 + 1.2 * m / rp;
    for (let k = 0; k < spokes; k++) { const a1 = k / spokes * TAU + sw, a2 = (k + 1) / spokes * TAU - sw; const p = new THREE.Path(); p.absarc(0, 0, ri, a1, a2, false); p.absarc(0, 0, rh, a2 - (sw * ri / rh - sw) * 0.0, a1, true); p.closePath(); s.holes.push(p); }
  }
  return s;
}
function escShape(N, ra, depth) {   // Graham escape wheel: thin pointed teeth leaning in the direction of travel
  const s = new THREE.Shape(), rd = ra - depth;
  for (let i = 0; i < N; i++) {
    const a = -i / N * TAU, step = TAU / N;
    const tip = [cos(a) * ra, sin(a) * ra], back = [cos(a - step * 0.12) * (ra - depth * 0.25), sin(a - step * 0.12) * (ra - depth * 0.25)], root = [cos(a - step * 0.2) * rd, sin(a - step * 0.2) * rd];
    const front = [cos(a + step * 0.08) * rd, sin(a + step * 0.08) * rd];
    if (i === 0) s.moveTo(front[0], front[1]); else s.lineTo(front[0], front[1]);
    s.lineTo(tip[0], tip[1]); s.lineTo(back[0], back[1]); s.lineTo(root[0], root[1]);
    s.absarc(0, 0, rd, a - step * 0.2, a - step + step * 0.08, true);
  }
  s.holes.push(new THREE.Path().absarc(0, 0, 0.0011, 0, TAU, true));
  const ri = rd - 0.0022, rh = 0.0045;
  for (let k = 0; k < 4; k++) { const a1 = k / 4 * TAU + 0.2, a2 = (k + 1) / 4 * TAU - 0.2; const p = new THREE.Path(); p.absarc(0, 0, ri, a1, a2, false); p.absarc(0, 0, rh, a2 - 0.25, a1 + 0.25, true); p.closePath(); s.holes.push(p); }
  return s;
}
const cylZ = (r, len, mat, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat); m.rotation.x = PI / 2; return m; };
function roundRect(w, h, r) { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; }

/* ================= the clock (world: metres; movement centre arbor at y = 1.30) ================= */
const clock = new THREE.Group(); clock.position.set(0, 1.30, 0); scene.add(clock);
const POS = {C: [0, 0], G: [0.0312 * cos(-115 * D), 0.0312 * sin(-115 * D)], T: [0.0216 * cos(60 * D), 0.0216 * sin(60 * D)]};
POS.E = [POS.T[0] + 0.0204 * cos(115 * D), POS.T[1] + 0.0204 * sin(115 * D)];
POS.A = [POS.E[0], POS.E[1] + 0.031];
const Z = {back: -0.02, front: 0.016, great: -0.012, center: -0.004, third: 0.004, esc: 0.0095, dial: 0.046, pend: 0.03, drum: -0.045};
const mod = 0.0006, rp = N => mod * N / 2;

// plates and pillars
const plateShape = roundRect(0.11, 0.155, 0.012);
[Z.back, Z.front].forEach((z, i) => { const p = add(clock, new THREE.Mesh(ext(plateShape, 0.0025), MAT.brass()), i ? 'plate front' : 'plate back'); p.position.set(0, 0.012, z); });
[[-0.046, -0.058], [0.046, -0.058], [-0.046, 0.082], [0.046, 0.082]].forEach(([x, y]) => { const pl = add(clock, cylZ(0.0028, Z.front - Z.back, MAT.brassDark(), 16), 'plate'); pl.position.set(x, y, (Z.front + Z.back) / 2); });

// arbors (each wheel group rotates about its arbor)
function arbor(pos, z0, z1, tags) { const g = new THREE.Group(); g.position.set(pos[0], pos[1], 0); clock.add(g); const a = add(g, cylZ(0.0009, z1 - z0, MAT.steel(), 12), tags); a.position.z = (z0 + z1) / 2; return g; }
const gGreat = arbor(POS.G, Z.drum - 0.02, Z.front + 0.002, 'train great');
const gCenter = arbor(POS.C, Z.back - 0.002, Z.dial + 0.004, 'train center');
const gThird = arbor(POS.T, Z.back - 0.002, Z.front + 0.002, 'train third');
const gEsc = arbor(POS.E, Z.back - 0.002, Z.dial + 0.004, 'esc train');
const gAnchor = arbor(POS.A, Z.back - 0.002, Z.pend + 0.004, 'esc anchor');

const wheel = (g, N, z, spokes, tags) => { const w = add(g, new THREE.Mesh(ext(gearShape(N, rp(N), {spokes}), 0.0014, 0.00015, 2), MAT.brass()), tags); w.position.z = z; return w; };
const pinion = (g, N, z, len, tags) => { const p = add(g, new THREE.Mesh(ext(gearShape(N, rp(N), {add: 1.1, ded: 1.4, hole: 0.0006}), len, 0.0001, 4), MAT.steel()), tags); p.position.z = z; return p; };
wheel(gGreat, TRAIN.great, Z.great, 4, 'train great');
pinion(gCenter, TRAIN.cPin, Z.great, 0.004, 'train center'); wheel(gCenter, TRAIN.center, Z.center, 4, 'train center');
pinion(gThird, TRAIN.tPin, Z.center, 0.004, 'train third'); wheel(gThird, TRAIN.third, Z.third, 4, 'train third');
pinion(gEsc, TRAIN.ePin, Z.third, 0.004, 'train esc');
// mesh phasing: offset each pinion half a leaf so teeth interleave
gCenter.rotation.z = 0;
const escWheel = add(gEsc, new THREE.Mesh(ext(escShape(TRAIN.esc, 0.022, 0.0028), 0.0011, 0.00012, 3), MAT.brass()), 'esc wheel'); escWheel.position.z = Z.esc;
// drum and cord on the great arbor (behind the back plate)
const drum = add(gGreat, cylZ(P.rDrum, 0.03, MAT.brassDark(), 32), 'weight drum'); drum.position.z = Z.drum;
for (let k = 0; k < 9; k++) { const turn = add(gGreat, new THREE.Mesh(new THREE.TorusGeometry(P.rDrum + 0.0007, 0.0007, 6, 32), MAT.cord()), 'weight drum'); turn.position.z = Z.drum - 0.012 + k * 0.0016; }

// anchor: arms + pallets reaching over 7½ teeth of the escape wheel
const anchor = new THREE.Group(); anchor.position.z = Z.esc; gAnchor.add(anchor);
const reach = 0.022, dy = POS.A[1] - POS.E[1];
const palletPt = sgn => new THREE.Vector2(sgn * reach * cos(45 * D), -dy + reach * sin(45 * D) + 0.0006);
const pallets = [];
[-1, 1].forEach(sgn => {
  const p = palletPt(sgn), len = p.length(), ang = Math.atan2(p.y, p.x);
  const arm = add(anchor, new THREE.Mesh(new THREE.BoxGeometry(len, 0.0026, 0.0016), MAT.steel()), 'esc anchor'); arm.position.set(p.x / 2, p.y / 2, 0); arm.rotation.z = ang;
  const pal = add(anchor, new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.0042, 0.002), MAT.ruby()), 'esc anchor'); pal.position.set(p.x, p.y - 0.0012, 0); pal.rotation.z = -sgn * 45 * D;
  pallets.push(pal);
});
add(anchor, cylZ(0.0032, 0.003, MAT.steel(), 24), 'esc anchor');
// crutch: from the anchor arbor (front) down to the pendulum rod
const crutch = add(gAnchor, new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.11, 0.0022), MAT.brassDark()), 'pend crutch'); crutch.position.set(0, -0.055, Z.pend - 0.006);

// pendulum (hung from the anchor axis): suspension, rod, lens bob, rating nut
const pend = new THREE.Group(); pend.position.set(POS.A[0], POS.A[1], Z.pend); clock.add(pend);
const spring = add(pend, new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.012, 0.0004), MAT.steel()), 'pend'); spring.position.y = -0.002;
const rod = add(pend, new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 1, 12), MAT.steel()), 'pend');
const bob = add(pend, new THREE.Mesh(new THREE.SphereGeometry(0.06, 48, 24), MAT.brass()), 'pend bob'); bob.scale.z = 0.32;
const nut = add(pend, new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.008, 12), MAT.brassDark()), 'pend');
function poseRod() { const ext_ = P.L + 0.06; rod.scale.y = ext_; rod.position.y = -ext_ / 2; bob.position.y = -P.L; nut.position.y = -P.L - 0.066; }
poseRod();

// weight on its cord, behind the pendulum plane
const wGroup = new THREE.Group(); clock.add(wGroup);
const cord = add(wGroup, new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 1, 6), MAT.cord()), 'weight');
const weight = add(wGroup, new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.17, 40), MAT.brass()), 'weight body');
const hook = add(wGroup, new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0012, 8, 20), MAT.steel()), 'weight');
const cordX = POS.G[0] - P.rDrum, W_TOP = 0.42;          // cord length at full wind (m)
function poseWeight(drop) { const L = W_TOP + drop; cord.scale.y = L; cord.position.set(cordX, POS.G[1] - L / 2, Z.drum); hook.position.set(cordX, POS.G[1] - L - 0.004, Z.drum); weight.position.set(cordX, POS.G[1] - L - 0.093, Z.drum); }

// dial and hands
const dial = add(clock, new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.002, 96), [MAT.brass(), MAT.enamel(), MAT.brass()]), 'dial'); dial.rotation.x = PI / 2; dial.position.z = Z.dial;
dial.geometry.attributes.uv && (() => { /* top cap uses the texture */ })();
const ring = add(clock, new THREE.Mesh(new THREE.TorusGeometry(0.0855, 0.0022, 12, 96), MAT.brass()), 'dial'); ring.position.z = Z.dial + 0.001;
function hand(len, w, tail, z, tags) { const s = new THREE.Shape(); s.moveTo(-w * 0.35, -tail); s.lineTo(w * 0.35, -tail); s.lineTo(w * 0.5, 0); s.lineTo(w * 0.22, len * 0.82); s.lineTo(0, len); s.lineTo(-w * 0.22, len * 0.82); s.lineTo(-w * 0.5, 0); s.closePath(); const m = add(clock, new THREE.Mesh(ext(s, 0.0008, 0.0001), MAT.blued()), tags); m.position.z = z; return m; }
const hHour = hand(0.045, 0.006, 0.01, Z.dial + 0.003, 'dial hands');
const hMin = hand(0.068, 0.004, 0.014, Z.dial + 0.0045, 'dial hands');
const hSec = hand(0.0145, 0.0016, 0.004, Z.dial + 0.003, 'dial hands'); hSec.position.x = POS.E[0]; hSec.position.y = POS.E[1];
const cap = add(clock, cylZ(0.0025, 0.002, MAT.brass(), 16), 'dial hands'); cap.position.z = Z.dial + 0.0058;

// regulator case: walnut back board, frame, glass door
const caseG = new THREE.Group(); scene.add(caseG);
const board = add(caseG, new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.34, 0.012), MAT.walnut()), 'case board'); board.position.set(0, 0.79, -0.106);
const frameBits = [[0.36, 0.035, 0, 1.475], [0.36, 0.05, 0, 0.11], [0.025, 1.39, -0.168, 0.79], [0.025, 1.39, 0.168, 0.79]];
frameBits.forEach(([w, h, x, y]) => { const f = add(caseG, new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.19), MAT.walnut()), 'case frame'); f.position.set(x, y, -0.015); });
const crest = add(caseG, new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.21), MAT.walnut()), 'case frame'); crest.position.set(0, 1.505, -0.012);
const glass = add(caseG, new THREE.Mesh(new THREE.BoxGeometry(0.31, 1.31, 0.003), MAT.glass()), 'case glass'); glass.position.set(0, 0.79, 0.078); glass.castShadow = false;
// beat scale behind the bob (degrees)
const scale = new THREE.Group(); scale.position.set(POS.A[0], 1.30 + POS.A[1] - 0.994 - 0.105, -0.098); scene.add(scale);
for (let d = -5; d <= 5; d++) { const tk = add(scale, new THREE.Mesh(new THREE.BoxGeometry(0.0012, d % 5 ? 0.01 : 0.018, 0.001), MAT.ink()), 'case scale'); const a = d * D; tk.position.set(sin(a) * 1.1 - sin(0) * 0, 0, 0); tk.position.x = (1.099) * Math.tan(a); }

/* ---------- impulse highlight (one accent: the part doing the work) ---------- */
const accent = new THREE.Color(C.acc);
function glow(mesh, k) { mesh.material.emissive = accent; mesh.material.emissiveIntensity = min(0.95, k); }

/* ================= camera: views, orbit, zoom ================= */
const VIEWS = {
  todo: {t: [0, 0.86, 0], yaw: -0.32, pitch: 0.08, d: 2.95},
  pend: {t: [0, 0.84, 0.02], yaw: 0.42, pitch: 0.04, d: 2.35},
  esc: {t: [POS.E[0], 1.30 + POS.E[1] + 0.012, 0.01], yaw: 0.32, pitch: 0.1, d: 0.17},
  train: {t: [0, 1.31, 0], yaw: -0.18, pitch: 0.1, d: 0.36},
  weight: {t: [-0.03, 1.0, -0.04], yaw: -0.85, pitch: 0.12, d: 1.3}
};
const cam = {t: new THREE.Vector3(0, 0.86, 0), yaw: -0.32, pitch: 0.08, d: 2.95};
let camFrom = null, camTo = null, camK = 1, camDur = 1.4;
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // state to state
function goView(name, dur = 1.4) { const v = VIEWS[name]; camFrom = {t: cam.t.clone(), yaw: cam.yaw, pitch: cam.pitch, d: cam.d}; camTo = {t: new THREE.Vector3(...v.t), yaw: v.yaw, pitch: v.pitch, d: v.d}; let dy = camTo.yaw - camFrom.yaw; while (dy > PI) dy -= TAU; while (dy < -PI) dy += TAU; camTo.yaw = camFrom.yaw + dy; camK = 0; camDur = dur; }
function placeCamera() {
  const cp = cos(cam.pitch); camera.position.set(cam.t.x + sin(cam.yaw) * cp * cam.d, cam.t.y + sin(cam.pitch) * cam.d, cam.t.z + cos(cam.yaw) * cp * cam.d); camera.lookAt(cam.t);
}

/* ================= focus, cutaways ================= */
let mode = 'todo';
const FOCUS = {todo: null, pend: ['pend', 'crutch', 'scale', 'bob'], esc: ['esc', 'anchor', 'wheel'], train: ['train', 'dial'], weight: ['weight', 'drum', 'great']};
const cut = {glass: true, dial: true, xray: false};
function applyLook() {
  const f = FOCUS[mode];
  parts.forEach(p => {
    const t = p.tags, m = p.mesh.material, mats = Array.isArray(m) ? m : [m];
    let op = 1, vis = true;
    if (t.includes('glass')) { vis = cut.glass && mode === 'todo'; op = 0.1; }
    if (t.includes('frame')) vis = mode === 'todo';
    if (t.includes('board')) vis = mode === 'todo' || mode === 'train';
    if (t.includes('dial')) vis = cut.dial && mode !== 'esc' && mode !== 'train' || (mode === 'train' && t.includes('hands'));
    if (t.includes('plate')) { op = cut.xray || mode === 'esc' || mode === 'train' || mode === 'weight' ? 0.16 : 1; if (mode === 'esc' && t.includes('front')) op = 0.08; }
    if (f && !t.includes('glass') && !t.includes('plate') && !t.includes('board') && !t.includes('frame') && !f.some(k => t.includes(k))) op = min(op, 0.14);
    p.mesh.visible = vis;
    mats.forEach(mm => { const tr = op < 1 || p.baseT; if (mm.transparent !== tr) { mm.transparent = tr; mm.needsUpdate = true; } mm.opacity = t.includes('glass') ? 0.1 : op; mm.depthWrite = op > 0.5 && !t.includes('glass'); });
    p.mesh.castShadow = op > 0.5 && !t.includes('glass');
  });
}

/* ================= console (fixed 1600×900 layout, scaled) ================= */
const ui = document.getElementById('ui');
function fitUI() { const s = min(innerWidth / 1600, innerHeight / 900); ui.style.transform = `translate(${(innerWidth - 1600 * s) / 2}px,${(innerHeight - 900 * s) / 2}px) scale(${s})`; return s; }
const $ = id => document.getElementById(id);
const fx = (v, d = 2) => (isFinite(v) ? v.toFixed(d) : '—');
const chartTh = $('chTh').getContext('2d'), chartE = $('chE').getContext('2d');
function setupChart(cv) { const r = devicePixelRatio > 1 ? 2 : 1; cv.width = cv.clientWidth * r; cv.height = cv.clientHeight * r; cv.getContext('2d').setTransform(r, 0, 0, r, 0, 0); }
setupChart($('chTh')); setupChart($('chE'));
function drawTh() {
  const cv = $('chTh'), g = chartTh, W = cv.clientWidth, H = cv.clientHeight; g.clearRect(0, 0, W, H);
  const span = 8, tNow = S.t, A = max(5 * D, S.amp * 1.25);
  g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  [P.thZ, -P.thZ].forEach(z => { const y = H / 2 - z / A * H * 0.45; g.strokeStyle = 'rgba(240,90,35,.35)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.setLineDash([]); });
  g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath();
  S.hist.forEach((p, i) => { const x = W - (tNow - p[0]) / span * W, y = H / 2 - p[1] / A * H * 0.45; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = C.acc; S.beatsAt.forEach(tb => { const x = W - (tNow - tb) / span * W; if (x > 0) g.fillRect(x - 1, H - 7, 2, 7); });
  g.fillStyle = C.mute; g.font = '600 8.6px Inter'; g.fillText(`±${fx(A / D, 1)}°`, 4, 10); g.fillText('ZONA DE IMPULSO', W - 92, H / 2 - P.thZ / A * H * 0.45 - 4);
}
function drawE() {
  const cv = $('chE'), g = chartE, W = cv.clientWidth, H = cv.clientHeight; g.clearRect(0, 0, W, H);
  const span = 8, tNow = S.t, Emax = max(1e-6, ...S.energyHist.map(p => p[3])) * 1.15;
  const line = (k, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); S.energyHist.forEach((p, i) => { const x = W - (tNow - p[0]) / span * W, y = H - 4 - p[k] / Emax * (H - 14); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
  line(1, C.blue, 1.4); line(2, C.acc, 1.4); line(3, C.ink, 1.6);
}
const HUD = {};
['time', 'rate', 'speedv', 'L', 'g', 'Tth', 'Tm', 'amp', 'circ', 'E', 'Ein', 'Eloss', 'Q', 'w_e', 'w_t', 'w_c', 'w_g', 'mW', 'drop', 'pow', 'days', 'state', 'ratio'].forEach(k => HUD[k] = $('h_' + k));
let startClock; { const d = new Date(); startClock = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(); }
let tick = 0;
function updateHUD() {
  const clockSec = startClock + S.beats, hh = Math.floor(clockSec / 3600) % 12 || 12, mm = Math.floor(clockSec / 60) % 60, ss = Math.floor(clockSec) % 60;
  HUD.time.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  const T = S.Tm || Tth(), rate = 86400 * (2 / T - 1);
  HUD.rate.textContent = S.stopped ? 'DETENIDO' : `${rate >= 0 ? '+' : '−'}${fx(abs(rate), abs(rate) < 100 ? 1 : 0)} s/día`;
  HUD.rate.style.color = S.stopped ? C.acc : abs(rate) < 5 ? C.ink : C.acc;
  HUD.L.textContent = fx(P.L * 1000, 1) + ' mm'; HUD.g.textContent = `${fx(P.g, 2)} m/s² · ${P.planet}`;
  HUD.Tth.textContent = fx(Tth(), 4) + ' s'; HUD.Tm.textContent = S.Tm ? fx(S.Tm, 4) + ' s' : '—';
  HUD.amp.textContent = fx(S.amp / D, 2) + '°';
  HUD.circ.textContent = `+${fx(86400 * (S.amp * S.amp / 16), 1)} s/día`;
  const E = Epend(); HUD.E.textContent = fx(E * 1000, 2) + ' mJ';
  HUD.Ein.textContent = fx(Ein() * 1e6, 1) + ' µJ'; HUD.Eloss.textContent = fx(PI * 0.5 * P.mB * P.g * P.L * S.amp * S.amp / P.Q * 1e6, 1) + ' µJ'; HUD.Q.textContent = fx(P.Q, 0);
  const wE = 1 / 60;   // escape wheel rev/min at nominal rate
  const k = S.Tm ? 2 / S.Tm : 1;
  HUD.w_e.textContent = fx(wE * 60 * k, 2) + ' rpm'; HUD.w_t.textContent = fx(60 * k / (TRAIN.third / TRAIN.ePin), 2) + ' rpm'; HUD.w_c.textContent = fx(k, 3) + ' rph'; HUD.w_g.textContent = fx(k / 12, 4) + ' rph';
  HUD.mW.textContent = fx(P.mW, 1) + ' kg';
  const vDrop = TAU * P.rDrum / (12 * 3600);   // m/s at nominal rate
  HUD.drop.textContent = fx(vDrop * 86400 * 1000, 0) + ' mm/día'; HUD.pow.textContent = fx(P.mW * P.g * vDrop * 1e6, 1) + ' µW'; HUD.days.textContent = fx(1.0 / (vDrop * 86400), 1) + ' días';
  HUD.speedv.textContent = '×' + P.speed;
  HUD.state.textContent = S.stopped ? 'SIN IMPULSO · EL RELOJ SE DETUVO' : S.armed ? (abs(S.th) < P.thZ ? 'IMPULSO' : 'LIBRE · RUEDA DESBLOQUEADA') : 'REPOSO · DIENTE BLOQUEADO';
  HUD.state.style.color = S.stopped || (S.armed && abs(S.th) < P.thZ) ? C.acc : C.mute;
}

/* ---------- callouts with leaders ---------- */
const svg = $('leaders'), calls = $('calls');
const CALLS = {
  todo: [['bob', 'Lenteja de latón · 1.5 kg', 'Marca el tiempo: T = 2π√(ℓ/g)', -1], ['weight', 'Pesa motriz · 3 kg', 'Entrega la energía', 1], ['dialc', 'Esfera', 'Minutos, horas y segundos', 1]],
  pend: [['bob', 'Lenteja · 1.5 kg', 'ℓ = 994 mm → T = 2.00 s', -1], ['nut', 'Tuerca de ajuste', 'Sube o baja la lenteja', 1], ['spring', 'Muelle de suspensión', 'Pivote sin fricción', 1]],
  esc: [['palL', 'Paleta de entrada', 'Recibe el diente, empuja al péndulo', -1], ['palR', 'Paleta de salida', 'Bloquea la rueda: «golpe muerto»', 1], ['escw', 'Rueda de escape · 30 dientes', '6° por golpe · 1 vuelta/min', 1]],
  train: [['great', 'Rueda motriz · 96 dientes', '1 vuelta cada 12 h', -1], ['center', 'Rueda central · 64', '1 vuelta/h (minutero)', 1], ['third', 'Tercera rueda · 60', '7.5 vueltas/h', 1], ['escT', 'Piñón de escape · 8', '60 vueltas/h (segundero)', -1]],
  weight: [['weightC', 'Pesa · 3 kg', 'Baja 151 mm por día', -1], ['drumC', 'Tambor · r = 12 mm', 'Torque = m g r = 0.35 N·m', 1]]
};
const anchorsW = () => {
  const v = (o, x = 0, y = 0, z = 0) => o.localToWorld(new THREE.Vector3(x, y, z));
  return {bob: v(bob), nut: v(nut), spring: v(spring), weight: v(weight, 0, 0.05), weightC: v(weight), dialc: v(dial, 0.06, 0, -0.02), palL: v(pallets[0]), palR: v(pallets[1]), escw: v(escWheel, 0.017, -0.012), great: v(gGreat, 0.024, -0.012, Z.great), center: v(gCenter, -0.016, -0.008, Z.center), third: v(gThird, 0.014, 0.008, Z.third), escT: v(gEsc, 0, 0, Z.third), drumC: v(drum)};
};
let callEls = [];
function buildCalls() {
  calls.innerHTML = ''; callEls = (CALLS[mode] || []).map(([k, b, s, side]) => { const d = document.createElement('div'); d.className = 'call'; d.innerHTML = `<b>${b}</b><span>${s}</span>`; calls.appendChild(d); return {k, d, side}; });
}
function updateCalls(s) {
  const A = anchorsW(), W = innerWidth, H = innerHeight, ox = (W - 1600 * s) / 2, oy = (H - 900 * s) / 2; let paths = '';
  callEls.forEach((c, i) => {
    const p = A[c.k].clone().project(camera); const x = ((p.x + 1) / 2 * W - ox) / s, y = ((1 - p.y) / 2 * H - oy) / s;
    const lx = c.side < 0 ? max(410, x - 190) : min(1190, x + 170), ly = min(760, max(120, y - 40 + i * 6));
    c.d.style.left = (c.side < 0 ? lx - c.d.offsetWidth - 8 : lx + 8) + 'px'; c.d.style.top = (ly - 14) + 'px';
    paths += `<path d="M${x},${y} L${lx},${ly}" /><circle cx="${x}" cy="${y}" r="2.6"/>`;
  });
  svg.innerHTML = paths;
}

/* ================= controls ================= */
function setMode(m, user) {
  mode = m; document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  goView(m); applyLook(); buildCalls(); if (user) userAct();
}
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode, true));
const cutBtns = {glass: $('c_glass'), dial: $('c_dial'), xray: $('c_xray')};
Object.entries(cutBtns).forEach(([k, b]) => b.onclick = () => { cut[k] = !cut[k]; b.classList.toggle('on', cut[k]); applyLook(); userAct(); });
const sL = $('s_L'), sQ = $('s_Q'), sM = $('s_M');
sL.oninput = () => { P.L = +sL.value / 1000; poseRod(); $('v_L').textContent = fx(P.L * 1000, 1) + ' mm'; userAct(); };
sQ.oninput = () => { P.Q = Math.round(Math.pow(10, +sQ.value)); $('v_Q').textContent = 'Q = ' + P.Q; userAct(); };
sM.oninput = () => { P.mW = +sM.value; $('v_M').textContent = fx(P.mW, 1) + ' kg'; weight.scale.y = 0.4 + P.mW / 5; userAct(); };
document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { P.g = +b.dataset.g; P.planet = b.textContent; document.querySelectorAll('[data-g]').forEach(x => x.classList.toggle('on', x === b)); userAct(); });
document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { P.speed = +b.dataset.sp; document.querySelectorAll('[data-sp]').forEach(x => x.classList.toggle('on', x === b)); userAct(); });
$('b_kick').onclick = () => { S.kick = 0; S.om += 0.06 * Math.sign(S.om || 1); S.armed = true; userAct(); };
$('b_stop').onclick = () => { resetPendulum(0); S.armed = false; S.stopped = true; userAct(); };
$('b_start').onclick = () => { resetPendulum(ampEq()); userAct(); };
function syncControls() { sL.value = P.L * 1000; $('v_L').textContent = fx(P.L * 1000, 1) + ' mm'; sQ.value = Math.log10(P.Q); $('v_Q').textContent = 'Q = ' + P.Q; sM.value = P.mW; $('v_M').textContent = fx(P.mW, 1) + ' kg'; weight.scale.y = 0.4 + P.mW / 5;
  document.querySelectorAll('[data-g]').forEach(x => x.classList.toggle('on', +x.dataset.g === P.g)); document.querySelectorAll('[data-sp]').forEach(x => x.classList.toggle('on', +x.dataset.sp === P.speed)); }

// orbit: drag to rotate, wheel/pinch to zoom
let drag = null, pinch = null;
canvas.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch}; canvas.setPointerCapture(e.pointerId); camK = 1; userAct(); });
canvas.addEventListener('pointermove', e => { if (!drag || pinch) return; cam.yaw = drag.yaw - (e.clientX - drag.x) * 0.006; cam.pitch = min(1.2, max(-0.5, drag.pitch + (e.clientY - drag.y) * 0.004)); });
canvas.addEventListener('pointerup', () => drag = null);
canvas.addEventListener('wheel', e => { e.preventDefault(); camK = 1; cam.d = min(4.5, max(0.08, cam.d * Math.exp(e.deltaY * 0.0012))); userAct(); }, {passive: false});
canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = {d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), cd: cam.d}; }, {passive: true});
canvas.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); cam.d = min(4.5, max(0.08, pinch.cd * pinch.d / d)); } }, {passive: true});
canvas.addEventListener('touchend', () => pinch = null);
addEventListener('keydown', e => { const m = {'1': 'todo', '2': 'pend', '3': 'esc', '4': 'train', '5': 'weight'}[e.key]; if (m) setMode(m, true); else userAct(); });

/* ================= auto tour (hands control over on any input; 25 s of quiet hands it back) ================= */
const cursor = $('cursor'), ripple = $('ripple'), chip = $('tourchip');
let touring = true, idle = 0, tourT = 0, tourI = -1, curPos = {x: 800, y: 600}, curFrom = null, curTo = null, curK = 1;
const TOUR = [
  {at: 0, act: () => setMode('todo')},
  {at: 5, click: '[data-mode=pend]', act: () => setMode('pend')},
  {at: 11, drag: '#s_L', to: 1020, act: v => { sL.value = v; sL.oninput(); }},
  {at: 17, drag: '#s_L', to: 994, act: v => { sL.value = v; sL.oninput(); }},
  {at: 20, click: '[data-mode=esc]', act: () => setMode('esc')},
  {at: 29, click: '[data-mode=train]', act: () => setMode('train')},
  {at: 36, click: '[data-sp="60"]', act: () => document.querySelector('[data-sp="60"]').click()},
  {at: 42, click: '[data-sp="1"]', act: () => document.querySelector('[data-sp="1"]').click()},
  {at: 44, click: '[data-mode=weight]', act: () => setMode('weight')},
  {at: 51, click: '[data-g="1.62"]', act: () => document.querySelector('[data-g="1.62"]').click()},
  {at: 57, click: '[data-g="9.81"]', act: () => document.querySelector('[data-g="9.81"]').click()},
  {at: 60, click: '[data-mode=todo]', act: () => setMode('todo')},
  {at: 66, loop: true}
];
const elCenter = sel => { const el = document.querySelector(sel), r = el.getBoundingClientRect(), u = ui.getBoundingClientRect(), s = fitUI(); return {x: (r.left + r.width / 2 - u.left) / s, y: (r.top + r.height / 2 - u.top) / s, el}; };
function moveCursor(to, dur = 0.9) { curFrom = {...curPos}; curTo = to; curK = 0; curDur = dur; }
let curDur = 0.9, pending = null;
function tourStep(dt) {
  tourT += dt;
  const nx = TOUR[tourI + 1];
  if (nx && tourT >= nx.at - 1.0 && !pending && (nx.click || nx.drag)) { const c = elCenter(nx.click || nx.drag); pending = nx; if (nx.drag) { const r = c.el; const f = (+r.value - +r.min) / (+r.max - +r.min); const rr = r.getBoundingClientRect(), s = fitUI(), u = ui.getBoundingClientRect(); moveCursor({x: (rr.left - u.left) / s + f * rr.width / s, y: c.y}); } else moveCursor(c); }
  if (nx && tourT >= nx.at) {
    tourI++; pending = null;
    if (nx.loop) { tourT = 0; tourI = -1; return; }
    if (nx.drag) { const r = document.querySelector(nx.drag), v0 = +r.value, rr = r.getBoundingClientRect(), s = fitUI(), u = ui.getBoundingClientRect(); const f1 = (nx.to - +r.min) / (+r.max - +r.min); moveCursor({x: (rr.left - u.left) / s + f1 * rr.width / s, y: curPos.y}, 1.6); dragAnim = {v0, v1: nx.to, k: 0, act: nx.act}; }
    else { if (nx.click) pulse(); nx.act && nx.act(); }
  }
}
let dragAnim = null;
function pulse() { ripple.style.left = curPos.x + 'px'; ripple.style.top = curPos.y + 'px'; ripple.classList.remove('go'); void ripple.offsetWidth; ripple.classList.add('go'); }
function userAct() { if (synthetic) return; idle = 0; if (touring) { touring = false; cursor.style.opacity = 0; chip.classList.remove('on'); chip.querySelector('span').textContent = 'TÚ TIENES EL CONTROL · TOUR EN 25 s'; } }
let synthetic = false;
chip.onclick = () => { touring = true; idle = 0; tourT = 0; tourI = -1; cursor.style.opacity = 1; chip.classList.add('on'); chip.querySelector('span').textContent = 'TOUR AUTOMÁTICO · TOCA PARA TOMAR EL CONTROL'; };

/* ================= frame loop ================= */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = min(0.05, (now - last) / 1000); last = now;
  advance(dt);
  // history for charts (sim time)
  S.hist.push([S.t, S.th]); while (S.hist.length && S.t - S.hist[0][0] > 8.2) S.hist.shift();
  const K = 0.5 * P.mB * P.L * P.L * S.om * S.om, U = P.mB * P.g * P.L * (1 - cos(S.th));
  S.energyHist.push([S.t, K, U, K + U]); while (S.energyHist.length && S.t - S.energyHist[0][0] > 8.2) S.energyHist.shift();
  if (S.hist.length > 900) { S.hist = S.hist.filter((_, i) => i % 2 === 0); S.energyHist = S.energyHist.filter((_, i) => i % 2 === 0); }
  // pose: one input (the pendulum state + beat count) drives every part
  pend.rotation.z = S.th; gAnchor.rotation.z = S.th;
  const aE = -(S.beats + (S.armed && abs(S.th) < P.thZ ? S.prog : 0)) * (TAU / 60);       // 6° per beat
  gEsc.rotation.z = aE; gThird.rotation.z = -aE / (TRAIN.third / TRAIN.ePin) + PI / TRAIN.third; gCenter.rotation.z = aE / RATIO_CE; gGreat.rotation.z = -aE / RATIO_CE / RATIO_GC + PI / TRAIN.great;
  const clockSec = startClock + S.beats + (S.armed && abs(S.th) < P.thZ ? S.prog : 0);
  hSec.rotation.z = -TAU * (clockSec % 60) / 60; hMin.rotation.z = -TAU * (clockSec % 3600) / 3600; hHour.rotation.z = -TAU * (clockSec % 43200) / 43200;
  poseWeight(P.rDrum * abs(gGreat.rotation.z - PI / TRAIN.great));
  // accent: the pallet giving impulse right now
  const imp = S.armed && abs(S.th) < P.thZ ? 1 : 0;
  glow(pallets[0], S.om > 0 ? imp * 0.9 : 0); glow(pallets[1], S.om < 0 ? imp * 0.9 : 0);
  glow(bob, mode === 'pend' ? 0.08 + 0.12 * abs(S.om) / (w0() * max(S.amp, 1e-3)) : 0);
  // camera
  if (camK < 1 && camTo) { camK = min(1, camK + dt / camDur); const k = ease(camK); cam.t.lerpVectors(camFrom.t, camTo.t, k); cam.yaw = camFrom.yaw + (camTo.yaw - camFrom.yaw) * k; cam.pitch = camFrom.pitch + (camTo.pitch - camFrom.pitch) * k; cam.d = camFrom.d + (camTo.d - camFrom.d) * k; }
  else if (touring) cam.yaw += dt * 0.025 * Math.sin(now / 9000);   // nothing dead-still
  placeCamera();
  // tour & idle
  if (touring) { synthetic = true; tourStep(dt); synthetic = false; }
  else { idle += dt; if (idle > 25) chip.onclick(); else chip.querySelector('span').textContent = `TÚ TIENES EL CONTROL · TOUR EN ${Math.ceil(25 - idle)} s`; }
  if (curK < 1) { curK = min(1, curK + dt / curDur); const k = 1 - Math.pow(1 - curK, 3); curPos = {x: curFrom.x + (curTo.x - curFrom.x) * k, y: curFrom.y + (curTo.y - curFrom.y) * k}; cursor.style.transform = `translate(${curPos.x}px,${curPos.y}px)`; }
  if (dragAnim) { dragAnim.k = min(1, dragAnim.k + dt / 1.6); const v = dragAnim.v0 + (dragAnim.v1 - dragAnim.v0) * ease(dragAnim.k); synthetic = true; dragAnim.act(v); synthetic = false; if (dragAnim.k >= 1) dragAnim = null; }
  renderer.render(scene, camera);
  const s = fitUI();
  tick++; if (tick % 2 === 0) { drawTh(); drawE(); } if (tick % 6 === 0) updateHUD();
  updateCalls(s);
}
function resize() { const W = innerWidth, H = innerHeight; renderer.setPixelRatio(min(devicePixelRatio || 1, 1.6)); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); fitUI(); }
addEventListener('resize', resize); resize();
syncControls(); setMode('todo'); updateHUD();
cam.t.set(...VIEWS.todo.t); cam.yaw = VIEWS.todo.yaw; cam.pitch = VIEWS.todo.pitch; cam.d = VIEWS.todo.d; camK = 1;
// warm the shaders before the first frame
renderer.compile(scene, camera);
requestAnimationFrame(frame);
window.CLOCK = {S, P, advance, setMode, cam, Tth, ampEq, Ein, snap() { if (camTo) { cam.t.copy(camTo.t); cam.yaw = camTo.yaw; cam.pitch = camTo.pitch; cam.d = camTo.d; } camK = 1; }};
})();
