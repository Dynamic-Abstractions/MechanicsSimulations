/* Misión Física · projector 3D stage (three.js r160). Reuses the studio kit from the simulations. */
const Stage = (() => {
  /* ---------- textures & materials ---------- */
  const texCache = {};
  function tex(key, w, h, paint, rep = [1, 1]) {
    if (!texCache[key]) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; texCache[key] = t; }
    const t = texCache[key].clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]); return t;
  }
  const noise = (c, w, h, n, col, a, sz = 2) => { c.fillStyle = col; for (let i = 0; i < n; i++) { c.globalAlpha = Math.random() * a; c.fillRect(Math.random() * w, Math.random() * h, sz, sz); } c.globalAlpha = 1; };
  const M = {
    chrome: () => new THREE.MeshStandardMaterial({color: 0xd7d9de, roughness: 0.18, metalness: 1}),
    metal: (c = 0x3a3b3f, r = 0.45) => new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: 0.85}),
    plastic: (c, r = 0.32) => new THREE.MeshPhysicalMaterial({color: c, roughness: r, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.15}),
    matte: (c, r = 0.8) => new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: 0}),
    rubber: () => new THREE.MeshStandardMaterial({color: 0x1a1a1c, roughness: 0.85}),
    glass: (c = 0x223344) => new THREE.MeshPhysicalMaterial({color: c, roughness: 0.05, metalness: 0.2, transmission: 0, clearcoat: 1, opacity: 0.85, transparent: true}),
    glow: (c, i = 2) => new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: i}),
    wood: (c = '#8b5a2b') => new THREE.MeshStandardMaterial({map: tex('wood' + c, 256, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.08})`; g.fillRect(0, y, w, 1 + Math.random() * 2); } }), roughness: 0.6}),
    cardboard: () => new THREE.MeshStandardMaterial({map: tex('card', 256, 256, (g, w, h) => { g.fillStyle = '#c8a165'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, '#7f5539', 0.25); g.fillStyle = 'rgba(230,220,190,.85)'; g.fillRect(w * 0.42, 0, w * 0.16, h); }), roughness: 0.85})
  };

  /* ---------- geometry helpers ---------- */
  const rbox = (w, h, d, r = 0.04) => new THREE.RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2.2, h / 2.2, d / 2.2));
  const mesh = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };
  const cyl = (r1, r2, h, mat, seg = 32) => mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
  const sph = (r, mat, seg = 32) => mesh(new THREE.SphereGeometry(r, seg, seg / 2), mat);
  function tube(points, r, mat, seg) { const c = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2); return mesh(new THREE.TubeGeometry(c, seg || points.length * 4, r, 10, false), mat); }
  function setTube(m, points, r, seg) { const c = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2); m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(c, seg || points.length * 4, r, 10, false); }
  function helix(a, b, R, coils, n = 20) {   // points of a coil spring between Vector3 a and b
    const d = new THREE.Vector3().subVectors(b, a), L = d.length(), u = d.clone().normalize();
    const v = Math.abs(u.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0), p = new THREE.Vector3().crossVectors(u, v).normalize(), q = new THREE.Vector3().crossVectors(u, p);
    const pts = [a.clone()], lead = Math.min(0.25 * L, 0.18);
    pts.push(a.clone().addScaledVector(u, lead * 0.6));
    const N = coils * n;
    for (let i = 0; i <= N; i++) { const t = i / N, ang = t * coils * 2 * Math.PI, rr = R * Math.min(1, Math.min(t, 1 - t) * 25); pts.push(a.clone().addScaledVector(u, lead + (L - 2 * lead) * t).addScaledVector(p, rr * Math.sin(ang)).addScaledVector(q, rr * Math.cos(ang))); }
    pts.push(b.clone().addScaledVector(u, -lead * 0.6), b.clone());
    return pts;
  }

  /* ---------- people & vehicles ---------- */
  function mannequin(o = {}) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const skin = M.matte(o.skin || 0xf1c27d, 0.6), shirt = M.matte(o.shirt || 0xe8590c, 0.7), pants = M.matte(o.pants || 0x364fc7, 0.75), hair = M.matte(o.hair || 0x5c3d2e, 0.9), shoe = M.matte(0x212529, 0.5);
    const torso = mesh(new THREE.CapsuleGeometry(0.115, 0.22, 6, 16), shirt); torso.position.y = 0.66; body.add(torso);
    const neck = cyl(0.04, 0.04, 0.06, skin); neck.position.y = 0.83; body.add(neck);
    const head = sph(0.088, skin); head.position.y = 0.92; body.add(head);
    const hr = sph(0.093, hair); hr.scale.set(1, 0.75, 1); hr.position.set(-0.012, 0.955, 0); body.add(hr);
    if (o.long) { const pony = mesh(new THREE.CapsuleGeometry(0.035, 0.14, 4, 8), hair); pony.position.set(-0.1, 0.86, 0); body.add(pony); }
    const limb = (len, r, mat) => { const p = new THREE.Group(), m = mesh(new THREE.CapsuleGeometry(r, len, 4, 12), mat); m.position.y = -len / 2 - r * 0.3; p.add(m); return p; };
    const armL = limb(0.3, 0.036, shirt), armR = limb(0.3, 0.036, shirt);
    [armL, armR].forEach((a, i) => { a.position.set(0, 0.79, i ? -0.15 : 0.15); const hand = sph(0.04, skin); hand.position.y = -0.37; a.add(hand); body.add(a); });
    const legL = limb(0.36, 0.05, pants), legR = limb(0.36, 0.05, pants);
    [legL, legR].forEach((l, i) => { l.position.set(0, 0.47, i ? -0.065 : 0.065); const sh = mesh(rbox(0.13, 0.05, 0.07, 0.02), shoe); sh.position.set(0.03, -0.44, 0); l.add(sh);
      if (o.skates) { const bl = mesh(new THREE.BoxGeometry(0.17, 0.012, 0.012), M.chrome()); bl.position.set(0.03, -0.475, 0); l.add(bl); }
      body.add(l); });
    const api = {group: g, body, armL, armR, legL, legR,
      pose(p = {}) {
        body.rotation.z = -(p.lean || 0);
        armL.rotation.z = p.armL !== undefined ? p.armL : 0.15; armR.rotation.z = p.armR !== undefined ? p.armR : (p.armL !== undefined ? p.armL : 0.15);
        const sp = p.stride || 0.12; legL.rotation.z = sp; legR.rotation.z = -sp;
        if (p.sit) { legL.rotation.z = legR.rotation.z = Math.PI / 2; body.position.y = -0.38; } else body.position.y = 0;
        return api;
      }};
    return api.pose();
  }
  function carModel(color = 0xe03131) {
    const g = new THREE.Group(), paint = M.plastic(color, 0.25);
    const bodyM = mesh(rbox(1, 0.24, 0.44, 0.08), paint); bodyM.position.y = 0.22; g.add(bodyM);
    const cab = mesh(rbox(0.56, 0.2, 0.4, 0.08), paint); cab.position.set(-0.04, 0.41, 0); g.add(cab);
    const win = mesh(rbox(0.5, 0.15, 0.405, 0.05), M.glass(0x1b2a3a)); win.position.set(-0.04, 0.42, 0); g.add(win);
    const hl = mesh(new THREE.BoxGeometry(0.02, 0.05, 0.1), M.glow(0xfff3bf, 1.5)); hl.position.set(0.5, 0.25, 0.13); g.add(hl); const hl2 = hl.clone(); hl2.position.z = -0.13; g.add(hl2);
    const tl = mesh(new THREE.BoxGeometry(0.02, 0.05, 0.1), M.glow(0xff3333, 1)); tl.position.set(-0.5, 0.25, 0.13); g.add(tl); const tl2 = tl.clone(); tl2.position.z = -0.13; g.add(tl2);
    const wheels = [];
    [[0.32, 0.2], [0.32, -0.2], [-0.32, 0.2], [-0.32, -0.2]].forEach(([x, z]) => { const w = new THREE.Group(); const t = cyl(0.1, 0.1, 0.07, M.rubber(), 28); t.rotation.x = Math.PI / 2; w.add(t); const rim = cyl(0.055, 0.055, 0.075, M.chrome(), 16); rim.rotation.x = Math.PI / 2; w.add(rim); const sp = mesh(new THREE.BoxGeometry(0.1, 0.015, 0.08), M.metal(0x495057)); w.add(sp); w.position.set(x, 0.1, z); g.add(w); wheels.push(w); });
    g.userData.wheels = wheels; return g;
  }

  /* ---------- environments ---------- */
  function paintSky(g, w, h, top, bot, clouds) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (clouds) for (let i = 0; i < 9; i++) { const x = Math.random() * w, y = h * (0.1 + Math.random() * 0.45), s = 30 + Math.random() * 50; g.fillStyle = 'rgba(255,255,255,.85)'; [[0, 0, 1], [0.9, -0.3, 1.2], [1.9, 0, 0.9], [1, 0.25, 1]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); g.fill(); }); } }
  const BACKS = {
    studio: (g, w, h) => { g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(w * 0.78, h * 0.05, 10, w * 0.78, h * 0.05, w * 0.6); gr.addColorStop(0, 'rgba(120,120,128,.55)'); gr.addColorStop(0.5, 'rgba(50,50,56,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); },
    sky: (g, w, h) => paintSky(g, w, h, '#4a90d9', '#cfe6fb', true),
    night: (g, w, h) => { paintSky(g, w, h, '#05081a', '#253563', false); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h * 0.85, 1.5, 1.5); } },
    space: (g, w, h) => { g.fillStyle = '#05060c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(200,220,255,${Math.random() * 0.8})`; g.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4); } const gr = g.createRadialGradient(w * .3, h * .3, 0, w * .3, h * .3, w * .5); gr.addColorStop(0, 'rgba(90,60,160,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); },
    city: (g, w, h) => { paintSky(g, w, h, '#5d8fd6', '#dbe7f7', true); for (let i = 0; i < 40; i++) { const bw = 40 + Math.random() * 70, bh = h * (0.12 + Math.random() * 0.3), x = Math.random() * w; g.fillStyle = ['#7f8a96', '#99a3ad', '#6c7680'][i % 3]; g.fillRect(x, h - bh, bw, bh); g.fillStyle = 'rgba(255,240,200,.55)'; for (let y = h - bh + 8; y < h - 10; y += 14) for (let xx = x + 6; xx < x + bw - 8; xx += 12) if (Math.random() > 0.3) g.fillRect(xx, y, 6, 7); } }
  };
  const FLOORS = {
    grass: g => { g.fillStyle = '#4c9a3e'; g.fillRect(0, 0, 512, 512); noise(g, 512, 512, 9000, '#2f6b27', 0.5, 3); noise(g, 512, 512, 5000, '#8fd37a', 0.35, 2); },
    asphalt: g => { g.fillStyle = '#3d4045'; g.fillRect(0, 0, 512, 512); noise(g, 512, 512, 12000, '#000', 0.35, 2); noise(g, 512, 512, 6000, '#888', 0.3, 2); },
    wood: g => { for (let y = 0; y < 512; y += 64) { g.fillStyle = ['#b07a4a', '#a56f40', '#bb8656', '#9e6a3c'][(y / 64) % 4]; g.fillRect(0, y, 512, 64); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(60,30,10,.07)'; g.fillRect(0, y + Math.random() * 64, 512, 1); } g.fillStyle = 'rgba(40,20,5,.35)'; g.fillRect(0, y, 512, 2); g.fillRect(((y / 64) % 2) * 256 + 120, y, 2, 64); } },
    tile: g => { g.fillStyle = '#d5d8dc'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#a9adb3'; g.lineWidth = 3; for (let i = 0; i <= 512; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); } },
    concrete: g => { g.fillStyle = '#9ea3a8'; g.fillRect(0, 0, 512, 512); noise(g, 512, 512, 15000, '#555', 0.25, 2); g.fillStyle = '#f1c40f'; g.fillRect(0, 230, 512, 14); },
    felt: g => { g.fillStyle = '#1f7a3a'; g.fillRect(0, 0, 512, 512); noise(g, 512, 512, 20000, '#0d4a20', 0.3, 2); },
    water: g => { g.fillStyle = '#1c6ea4'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; for (let i = 0; i < 70; i++) { const x = Math.random() * 512, y = Math.random() * 512; g.beginPath(); g.arc(x, y, 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } },
    carpet: g => { g.fillStyle = '#4c3a8f'; g.fillRect(0, 0, 512, 512); noise(g, 512, 512, 30000, '#000', 0.25, 2); noise(g, 512, 512, 10000, '#9f8cf0', 0.25, 2); },
    dashes: g => { g.clearRect(0, 0, 512, 512); g.fillStyle = '#f1f3f5'; g.fillRect(0, 240, 300, 32); },
    shelves: g => { g.fillStyle = '#e9ecef'; g.fillRect(0, 0, 512, 512); for (let r = 0; r < 4; r++) { g.fillStyle = '#868e96'; g.fillRect(0, r * 128 + 116, 512, 12); for (let x = 4; x < 508; x += 26 + Math.random() * 20) { g.fillStyle = ['#e03131', '#1c7ed6', '#f59f00', '#2f9e44', '#ae3ec9', '#f8f9fa'][Math.floor(Math.random() * 6)]; const hh = 50 + Math.random() * 55; g.fillRect(x, r * 128 + 116 - hh, 22, hh); } } },
    ice: g => { g.fillStyle = '#eaf6ff'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(160,200,230,.5)'; for (let i = 0; i < 60; i++) { g.beginPath(); const x = Math.random() * 512, y = Math.random() * 512; g.moveTo(x, y); g.lineTo(x + 40 + Math.random() * 80, y + Math.random() * 10 - 5); g.stroke(); } }
  };
  /* ================= stage: renderer, studio, labels ================= */
  const host = document.getElementById('stage');
  const canvas = document.createElement('canvas'); host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const env = new THREE.PMREMGenerator(renderer).fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = 0.45; scene.background = new THREE.Color(0x0b0b0e);
  scene.fog = new THREE.Fog(0x0b0b0e, 40, 110);
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 400);
  const labelLayer = document.createElement('div'); labelLayer.className = 'labels'; host.appendChild(labelLayer);

  // studio: reflective floor + dimming overlay + lights
  const mir = new THREE.Reflector(new THREE.PlaneGeometry(260, 260), {clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x666666});
  mir.rotation.x = -Math.PI / 2; mir.position.y = -0.004; scene.add(mir);
  const floor = mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({color: 0x111114, roughness: 0.55, metalness: 0.35, transparent: true, opacity: 0.86}), false);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  scene.add(new THREE.AmbientLight(0xffffff, 0.16));
  const key = new THREE.SpotLight(0xffffff, 620, 0, 0.55, 0.6, 1.4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.camera.near = 1; key.shadow.camera.far = 120;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 0.55); rim.position.set(-8, 6, -8); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.4); fill.position.set(2, 3, 12); scene.add(fill);

  function placeLights(target, span) {
    key.position.set(target.x + span * 0.55, target.y + span * 0.9 + 4, target.z + span * 0.75);
    key.target.position.copy(target); key.distance = 0; key.angle = 0.6;
    fill.position.set(target.x, target.y + 3, target.z + span * 1.4);
  }

  // HTML labels that follow 3D points
  let labels = [];
  function label(html, cls = '') { const el = document.createElement('div'); el.className = 'lbl ' + cls; el.innerHTML = html; labelLayer.appendChild(el); const L = {el, pos: new THREE.Vector3(), obj: null, off: new THREE.Vector3(), show: true, ax: -50}; labels.push(L); return L; }
  function clearLabels() { labels.forEach(l => l.el.remove()); labels = []; }
  const tmpV = new THREE.Vector3();
  function updateLabels() {
    const w = host.clientWidth, h = host.clientHeight;
    labels.forEach(L => {
      if (L.obj) L.obj.getWorldPosition(tmpV).add(L.off); else tmpV.copy(L.pos);
      tmpV.project(camera);
      const vis = L.show && tmpV.z < 1 && Math.abs(tmpV.x) < 1.2 && Math.abs(tmpV.y) < 1.2;
      L.el.style.display = vis ? '' : 'none';
      if (vis) L.el.style.transform = `translate(${(tmpV.x * 0.5 + 0.5) * w}px,${(-tmpV.y * 0.5 + 0.5) * h}px) translate(${L.ax}%,-50%)`;
    });
  }

  // a team flag planted at a world point
  function flag(color, text, at, height = 1.1) {
    const g = new THREE.Group();
    const pole = cyl(0.015, 0.015, height, M.chrome(), 8); pole.position.y = height / 2; g.add(pole);
    const cloth = mesh(new THREE.PlaneGeometry(0.32, 0.2), new THREE.MeshStandardMaterial({color, roughness: 0.6, side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.25})); cloth.position.set(0.17, height - 0.1, 0); g.add(cloth);
    const base = sph(0.05, M.glow(color, 1.2), 12); g.add(base);
    g.position.copy(at);
    const L = label(text, 'flag'); L.obj = cloth; L.off.set(0.17, 0.2, 0); L.el.style.setProperty('--c', '#' + new THREE.Color(color).getHexString());
    return g;
  }
  function arrow(dir, origin, len, color, head = 0.18) {
    const a = new THREE.ArrowHelper(dir.clone().normalize(), origin, len, color, head, head * 0.6);
    a.line.material = new THREE.LineBasicMaterial({color, linewidth: 2});
    const shaft = cyl(0.025, 0.025, Math.max(0.01, len - head), M.glow(color, 0.9), 10); shaft.position.y = (len - head) / 2; a.add(shaft); a.line.visible = false;
    a.cone.material = M.glow(color, 0.9);
    return a;
  }
  function ticks(group, from, to, step, fmtf, posf, cls = 'tick') {   // labels along an axis
    for (let v = from; v <= to + 1e-9; v += step) { const L = label(fmtf(v), cls); L.pos.copy(posf(v)); }
  }

  /* ================= scenes ================= */
  const S = {};

  /* ---- ramp: slide | spring | race | static ---- */
  S.ramp = (p) => {
    const th = p.theta * deg, c = Math.cos(th), s = Math.sin(th);
    const L = p.mode === 'slide' ? p.d + 1 : p.mode === 'static' ? 3.4 : 6.5;
    const g = new THREE.Group(), depth = p.mode === 'race' ? 1.5 : 1.2;
    const shape = new THREE.Shape(); shape.moveTo(0.2, 0); shape.lineTo(-L * c - 0.4, 0); shape.lineTo(-L * c - 0.4, L * s); shape.lineTo(-L * c, L * s); shape.lineTo(0.2, 0);
    const wedgeGeo = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: false}); wedgeGeo.translate(0, 0, -depth / 2);
    const wedge = mesh(wedgeGeo, p.mode === 'race' ? M.metal(0x495057, 0.35) : M.wood('#9c6b3c')); g.add(wedge);
    const u = new THREE.Vector3(-c, s, 0), n = new THREE.Vector3(s, c, 0);
    const P = (dist, h, z = 0) => new THREE.Vector3(-dist * c, dist * s, z).addScaledVector(n, h);   // dist from bottom along ramp
    const angleLbl = label(`${p.theta}°`, 'tick'); angleLbl.pos.set(-1.1, 0.25, depth / 2 + 0.05);
    const api = {group: g, cam: {pos: [-L * c * 0.45 + 1.5, L * s * 0.55 + 1.6, L * 1.15 + 3.5], target: [-L * c * 0.45, L * s * 0.35, 0]}, t: 0, done: false, live: ''};
    let box, v = 0, sPos, t = 0, running = false;

    if (p.mode === 'slide' || p.mode === 'static') {
      box = mesh(rbox(0.5, 0.42, 0.5, 0.05), M.cardboard()); box.rotation.z = -th; g.add(box);
      sPos = p.mode === 'slide' ? p.d : 1.7; box.position.copy(P(sPos, 0.21));
      if (p.mode === 'slide') { const stop = mesh(rbox(0.06, 0.3, 0.9, 0.02), M.metal(0xc92a2a)); stop.rotation.z = -th; stop.position.copy(P(sPos - 0.31, 0.15)); g.add(stop); api.stop = stop;
        const startL = label('5 m', 'tick'); startL.pos.copy(P(p.d / 2, -0.25, depth / 2 + 0.05)); }
      const a = G * (s - (p.mu || 0) * c);
      if (p.mode === 'static') {
        const o = P(sPos, 0.21, 0.32), W = arrow(new THREE.Vector3(0, -1, 0), o, 1.1, 0xffffff), N = arrow(n, o, 1.0, 0x4dabf7);
        let F = arrow(u.clone().negate(), o, 0.75, 0xff6b6b); g.add(W, N, F);
        const lw = label('A', 'arrowlbl'); lw.pos.copy(o.clone().add(new THREE.Vector3(0.15, -1.15, 0)));
        const ln = label('B', 'arrowlbl'); ln.pos.copy(o.clone().addScaledVector(n, 1.1));
        const lf = label('C', 'arrowlbl bad'); lf.pos.copy(o.clone().addScaledVector(u, -0.85));
        api.reveal = () => { g.remove(F); F = arrow(u, o, 0.75, 0x69db7c); g.add(F); lf.pos.copy(o.clone().addScaledVector(u, 0.95)); lf.el.className = 'lbl arrowlbl good'; lf.el.innerHTML = 'C ✓'; api.live = 'La fricción estática apunta rampa ARRIBA'; t = 0; running = true; };
        api.update = dt => { if (running) { t += dt; if (t > 1.2) { api.done = true; running = false; } } };
      } else {
        api.reveal = () => { running = true; t = 0; };
        api.update = dt => {
          if (api.stop) api.stop.position.lerp(running ? P(sPos - 0.31, -0.5) : P(p.d - 0.31, 0.15), 0.15);
          if (!running || api.done) return;
          t += dt; v = a * t; sPos = p.d - 0.5 * a * t * t;
          if (sPos <= 0) { sPos = 0; v = Math.sqrt(2 * a * p.d); api.done = true; running = false; }
          box.position.copy(P(sPos, 0.21)); api.live = `v = ${fmt(v, 'm/s')}`;
        };
        api.readout = () => `Llega a la base con v = ${fmt(Math.sqrt(2 * a * p.d), 'm/s')}`;
      }
    }
    if (p.mode === 'spring') {
      const stopB = mesh(rbox(0.12, 0.5, 0.8, 0.03), M.metal(0x343a40)); stopB.rotation.z = -th; stopB.position.copy(P(0.06, 0.25)); g.add(stopB);
      const nat = 0.75, s0 = nat - p.x;
      box = mesh(rbox(0.36, 0.3, 0.36, 0.05), M.plastic(0x1c7ed6)); box.rotation.z = -th; g.add(box);
      const springM = tube(helix(P(0.12, 0.15), P(s0, 0.15), 0.09, 9), 0.018, M.chrome(), 200); g.add(springM);
      let x = 0, vel = 0; sPos = s0 + 0.18; box.position.copy(P(sPos, 0.15));
      const startMark = mesh(new THREE.BoxGeometry(0.02, 0.01, 1.2), M.glow(0xffd43b, 1)); startMark.rotation.z = -th; startMark.position.copy(P(s0, 0.006)); g.add(startMark);
      ticks(g, 1, 6, 1, v => v + ' m', v => P(s0 + v, -0.22, depth / 2 + 0.05));
      for (let i = 1; i <= 6; i++) { const tk = mesh(new THREE.BoxGeometry(0.015, 0.006, depth), M.matte(0xffffff)); tk.rotation.z = -th; tk.position.copy(P(s0 + i, 0.004)); g.add(tk); }
      api.marksAt = vv => P(s0 + vv, 0, 0.25);
      api.reveal = () => { running = true; t = 0; x = 0; vel = 0; };
      api.update = dt => {
        if (!running || api.done) return;
        const n = 30, h = dt / n;
        for (let i = 0; i < n; i++) { const comp = Math.max(0, p.x - x), acc = (comp > 0 ? p.k * comp / p.m : 0) - G * s; vel += acc * h; x += vel * h; if (vel <= 0 && x > p.x) { api.done = true; running = false; break; } }
        sPos = s0 + x + 0.18; box.position.copy(P(sPos, 0.15));
        const end = s0 + Math.min(x, p.x); setTube(springM, helix(P(0.12, 0.15), P(end, 0.15), 0.09, 9), 0.018, 200);
        api.live = `d = ${fmt(x, 'm')}`;
      };
      api.readout = () => `Sube ${fmt(x, 'm')} sobre la rampa`;
    }
    if (p.mode === 'race') {
      const ball = sph(0.2, M.plastic(0x1a1a1a, 0.15)); g.add(ball);
      const holes = [0, 1, 2].map(i => { const h = sph(0.035, M.matte(0x666666), 10); const a = i * 0.5 - 0.5; h.position.set(Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0.08); ball.add(h); return h; });
      const hoop = new THREE.Group(); const rimM = mesh(new THREE.TorusGeometry(0.24, 0.025, 12, 48), M.chrome()); hoop.add(rimM); const tire = mesh(new THREE.TorusGeometry(0.255, 0.018, 10, 48), M.rubber()); hoop.add(tire);
      for (let k = 0; k < 12; k++) { const sp = cyl(0.004, 0.004, 0.48, M.chrome(), 4); sp.rotation.z = k * Math.PI / 12; hoop.add(sp); }
      g.add(hoop);
      const aS = G * s / 1.4, aH = G * s / 2, Lr = p.L, tEnd = Math.sqrt(2 * Lr / aS), sTop = L - 0.25;
      const place = q => { ball.position.copy(P(sTop - q.s, 0.2, 0.38)); ball.rotation.z = q.s / 0.2; hoop.position.copy(P(sTop - q.h, 0.27, -0.38)); hoop.rotation.z = q.h / 0.27; };
      place({s: 0, h: 0});
      for (let i = 0; i <= 6; i++) { const tk = mesh(new THREE.BoxGeometry(0.015, 0.006, depth), M.matte(0xffffff)); tk.rotation.z = -th; tk.position.copy(P(sTop - i, 0.004)); g.add(tk); }
      ticks(g, 0, 6, 1, v => v + ' m', v => P(sTop - v, -0.22, depth / 2 + 0.05));
      const lb = label('Bola', 'tag'); lb.obj = ball; lb.off.set(0, 0.45, 0); const lh = label('Rueda', 'tag'); lh.obj = hoop; lh.off.set(0, 0.5, 0);
      api.marksAt = vv => P(sTop - vv, 0, -0.38);
      api.reveal = () => { running = true; t = 0; };
      api.update = dt => { if (!running || api.done) return; t = Math.min(t + dt, tEnd); place({s: 0.5 * aS * t * t, h: 0.5 * aH * t * t}); api.live = `t = ${fmt(t, 's')}`; if (t >= tEnd) { api.done = true; running = false; } };
      api.readout = () => `La rueda va en ${fmt(0.5 * aH * tEnd * tEnd, 'm')} desde arriba`;
    }
    return api;
  };

  /* ---- curling on ice ---- */
  S.ice = (p) => {
    const g = new THREE.Group(), len = p.len;
    const rink = mesh(new THREE.BoxGeometry(len + 4, 0.06, 4), new THREE.MeshStandardMaterial({map: tex('ice_r', 512, 512, FLOORS.ice, [8, 1]), roughness: 0.12})); rink.position.set(len / 2, 0.03, 0); g.add(rink);
    [-2.05, 2.05].forEach(z => { const b = mesh(rbox(len + 4, 0.35, 0.1, 0.03), M.plastic(0xf8f9fa)); b.position.set(len / 2, 0.17, z); g.add(b); const st = mesh(new THREE.BoxGeometry(len + 4, 0.06, 0.11), M.plastic(0x1971c2)); st.position.set(len / 2, 0.3, z); g.add(st); });
    for (let x = 0; x <= len; x += 5) { const ln = mesh(new THREE.BoxGeometry(x === 0 ? 0.08 : 0.03, 0.005, 3.9), M.matte(x === 0 ? 0xe03131 : 0x4dabf7)); ln.position.set(x, 0.064, 0); g.add(ln); }
    ticks(g, 0, len, 5, v => v + ' m', v => new THREE.Vector3(v, 0.1, 2.3));
    const stone = new THREE.Group(); const body = cyl(0.29, 0.29, 0.2, M.metal(0x6c757d, 0.5), 40); body.position.y = 0.14; stone.add(body);
    const band = cyl(0.3, 0.3, 0.06, M.plastic(0xe03131), 40); band.position.y = 0.2; stone.add(band);
    const handle = mesh(rbox(0.32, 0.06, 0.08, 0.03), M.plastic(0xe03131)); handle.position.set(0.04, 0.3, 0); stone.add(handle);
    g.add(stone);
    const a = p.mu * G, D = p.v0 * p.v0 / (2 * a); let t = 0, x = 0, running = false, done = false;
    const pos = tt => { const ts = Math.min(tt, p.v0 / a); return p.v0 * ts - 0.5 * a * ts * ts; };
    const api = {group: g, cam: {pos: [len * 0.42, 6.5, 15], target: [len * 0.42, 0, 0]}, done: false, live: ''};
    api.intro = dt => { t = Math.min(t + dt, 0.6); x = pos(t); stone.position.x = x; stone.rotation.y -= dt * 0.8; return t >= 0.6; };
    api.reveal = () => { running = true; };
    api.update = dt => { if (!running || api.done) return; t += dt; x = pos(t); stone.position.x = x; stone.rotation.y -= dt * 0.8 * (1 - t / (p.v0 / a)); api.live = `x = ${fmt(x, 'm')}`; if (t >= p.v0 / a) { api.done = true; running = false; } };
    api.marksAt = vv => new THREE.Vector3(vv, 0.06, -0.9);
    api.readout = () => `Se detiene a ${fmt(D, 'm')}`;
    return api;
  };

  /* ---- road: power | crash ---- */
  S.road = (p) => {
    const g = new THREE.Group();
    const road = mesh(new THREE.PlaneGeometry(400, 6), new THREE.MeshStandardMaterial({map: tex('asph', 512, 512, FLOORS.asphalt, [80, 1.2]), roughness: 0.85}), false); road.rotation.x = -Math.PI / 2; road.position.set(60, 0.005, 0); g.add(road);
    for (let x = -60; x < 260; x += 6) { const d = mesh(new THREE.BoxGeometry(3, 0.004, 0.15), M.matte(0xf1f3f5)); d.position.set(x, 0.01, 0); g.add(d); }
    for (let x = -40; x < 260; x += 20) { const pole = cyl(0.06, 0.06, 4, M.metal(0x495057), 10); pole.position.set(x, 2, -3.6); g.add(pole); const lamp = mesh(rbox(0.6, 0.12, 0.25, 0.04), M.glow(0xfff3bf, 1.6)); lamp.position.set(x + 0.3, 4, -3.4); g.add(lamp); }
    for (let x = 0; x <= 200; x += 10) { const L = label(x + ' m', 'tick'); L.pos.set(x, 0.05, 3.3); }
    const api = {group: g, done: false, live: ''}; let t = 0, running = false;
    const SC = 4.2;   // car model ≈ 1 unit long → 4.2 m
    if (p.mode === 'power') {
      const car = carModel(0xe03131); car.scale.setScalar(SC); car.position.set(0, 0, 1.3); g.add(car);
      const light = new THREE.Group(); const post = cyl(0.08, 0.08, 3.4, M.metal(0x343a40), 10); post.position.y = 1.7; light.add(post);
      const head = mesh(rbox(0.45, 1.2, 0.45, 0.06), M.metal(0x212529)); head.position.y = 3.6; light.add(head);
      const lamps = [0xff2020, 0xffb400, 0x20ff60].map((c, i) => { const l = sph(0.13, M.glow(c, i === 0 ? 3 : 0.05), 16); l.position.set(0.24, 4.0 - i * 0.38, 0); light.add(l); return l; });
      light.position.set(3.2, 0, 3); g.add(light);
      const acc = p.v / p.t; let cx = 0;
      api.cam = {pos: [7, 6, 24], target: [7, 1, 0]};
      api.follow = () => cx;
      api.reveal = () => { lamps[0].material.emissiveIntensity = 0.05; lamps[2].material.emissiveIntensity = 3; running = true; t = 0; };
      api.update = dt => { if (!running || api.done) return; t = Math.min(t + dt, p.t); const x = 0.5 * acc * t * t, v = acc * t; car.position.x = x; cx = x; car.userData.wheels.forEach(w => w.rotation.z = -x / (0.1 * SC));
        const K = 0.5 * p.m * v * v; api.live = `t = ${fmt(t, 's')} · v = ${fmt(v, 'm/s')} · K = ${fmt(K / 1000, 'kJ')}`; if (t >= p.t) { api.done = true; running = false; } };
      api.readout = () => `K = 240 kJ en 8 s ⇒ P = ${fmt(0.5 * p.m * p.v * p.v / p.t / 1000, 'kW')}`;
    } else {
      const A = carModel(0xe03131), B = carModel(0x1c7ed6); [A, B].forEach(c => { c.scale.setScalar(SC); c.position.z = 1.3; g.add(c); });
      const vf = p.m1 * p.v1 / (p.m1 + p.m2); let xa = -16, xb = 0, phase = 0, after = 0;
      const gapX = -SC * 1.0 - 0.6; A.position.x = xa; B.position.x = xb;
      const la = label('1500 kg', 'tag'); la.obj = A; la.off.set(0, 2.3, 0); const lb = label('1000 kg', 'tag'); lb.obj = B; lb.off.set(0, 2.3, 0);
      api.cam = {pos: [-3, 6.5, 25], target: [-3, 1, 0]};
      let cx = -4; api.follow = () => cx;
      api.intro = dt => { xa = Math.min(xa + p.v1 * dt, gapX); A.position.x = xa; A.userData.wheels.forEach(w => w.rotation.z = -xa / (0.1 * SC)); return xa >= gapX; };
      api.reveal = () => { running = true; };
      api.update = dt => {
        if (!running || api.done) return;
        if (phase === 0) { xa += p.v1 * dt; if (xa >= xb - SC * 1.0) { xa = xb - SC * 1.0; phase = 1; } api.live = `v = ${fmt(p.v1, 'm/s')}`; }
        else { xa += vf * dt; xb += vf * dt; after += dt; api.live = `¡Trabados! v′ = ${fmt(vf, 'm/s')}`; if (after > 3) { api.done = true; running = false; } }
        A.position.x = xa; B.position.x = xb; cx = (xa + xb) / 2;
        A.userData.wheels.forEach(w => w.rotation.z = -xa / (0.1 * SC)); B.userData.wheels.forEach(w => w.rotation.z = -xb / (0.1 * SC));
      };
      api.readout = () => `Salen juntos a ${fmt(vf, 'm/s')}`;
    }
    return api;
  };

  /* ---- roller coaster (one lane per team on reveal) ---- */
  S.coaster = (p) => {
    const g = new THREE.Group(), H = p.hill;
    const y = x => x < -1 ? 6.5 : x <= 4 ? 6.5 * (1 + Math.cos(Math.PI * (x + 1) / 5)) / 2 : x <= 12 ? H * (1 - Math.cos(2 * Math.PI * (x - 4) / 8)) / 2 : 0;
    const dy = x => { const e = 1e-4; return (y(x + e) - y(x - e)) / (2 * e); };
    const startX = h => { let a = -1, b = 4; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (y(m) > h) a = m; else b = m; } return (a + b) / 2; };
    let lanes = [];
    function buildLane(z, color, h, name) {
      const lg = new THREE.Group(); lg.position.z = z;
      const pts = []; for (let x = -1; x <= 17; x += 0.15) pts.push(new THREE.Vector3(x, y(x) + 0.06, 0));
      [-0.18, 0.18].forEach(dz => { const r = tube(pts.map(q => q.clone().setZ(dz)), 0.03, M.chrome(), 260); lg.add(r); });
      for (let x = -0.5; x <= 16; x += 0.75) { const hh = y(x); if (hh > 0.15) { const s1 = cyl(0.03, 0.03, hh, M.metal(0x495057), 8); s1.position.set(x, hh / 2, 0); lg.add(s1); } const tie = mesh(new THREE.BoxGeometry(0.06, 0.03, 0.45), M.metal(0x343a40)); tie.position.set(x, y(x) + 0.03, 0); lg.add(tie); }
      const car = new THREE.Group(); const body = mesh(rbox(0.6, 0.3, 0.42, 0.08), M.plastic(color)); body.position.y = 0.25; car.add(body);
      [[0.2, 0.2], [0.2, -0.2], [-0.2, 0.2], [-0.2, -0.2]].forEach(([wx, wz]) => { const w = cyl(0.07, 0.07, 0.05, M.rubber(), 16); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.08, wz); car.add(w); });
      lg.add(car); g.add(lg);
      const x0 = startX(h), lane = {g: lg, car, h, x: x0, s: 0, v: 0, vTop: null, passed: false, name, color};
      const L = label(`${name}<br><b>${fmt(h, 'm')}</b>`, 'tag'); L.pos.set(-1, y(-1) + 0.75, z); L.ax = 0; lane.L = L; L.el.style.setProperty('--c', '#' + new THREE.Color(color).getHexString());
      placeCar(lane); lanes.push(lane); return lane;
    }
    function placeCar(l) { l.car.position.set(l.x, y(l.x) + 0.06, 0); l.car.rotation.z = Math.atan(dy(l.x)); }
    const hillL = label(`cima: ${fmt(H, 'm')}`, 'tick'); hillL.pos.set(8, H + 0.6, 0);
    buildLane(0, 0x868e96, 3.5, 'Ejemplo');
    const api = {group: g, cam: {pos: [7, 5.2, 19], target: [7, 2.2, 0]}, done: false, live: ''};
    let running = false, t = 0;
    api.lanes = list => {   // list: [{name,color,value}] + reference
      lanes.forEach(l => { g.remove(l.g); l.L.el.remove(); }); lanes = []; labels = labels.filter(L => document.body.contains(L.el));
      const n = list.length, gap = 1.0; list.forEach((it, i) => buildLane((i - (n - 1) / 2) * gap, it.color, it.value, it.name));
      api.cam = {pos: [7, 5.5 + n * 0.25, 19 + n * 0.9], target: [7, 2, 0]}; Stage.recam();
    };
    api.reveal = () => { running = true; t = 0; };
    api.update = dt => {
      if (!running || api.done) return; t += dt;
      lanes.forEach(l => { const n = 24, h = dt / n; for (let i = 0; i < n; i++) { const phi = Math.atan(dy(l.x)); l.v += -G * Math.sin(phi) * h; l.x += l.v * Math.cos(phi) * h; if (!l.passed && l.x >= 8) { l.passed = true; l.vTop = Math.abs(l.v); l.L.el.innerHTML = `${l.name}<br><b>${fmt(l.vTop, 'm/s')}</b> en la cima`; } }
        if (l.x > 16.5) { l.x = 16.5; l.v = 0; } placeCar(l);
        if (!l.passed && l.v < 0 && l.x < 8 && l.x > 4 && !l.failed) { l.failed = true; l.L.el.innerHTML = `${l.name}<br><b>no pasa</b>`; } });
      api.live = `t = ${fmt(t, 's')}`; if (t > 5.5) { api.done = true; running = false; }
    };
    api.readout = () => `Desde ${fmt(H + 16 / (2 * G), 'm')} cruza la cima a 4.00 m/s`;
    return api;
  };

  /* ---- air track: elastic (mark) | tune (lanes) ---- */
  S.track = (p) => {
    const g = new THREE.Group(); let lanes = [];
    const cartGeo = (m) => { const s = 0.28 * Math.cbrt(m); return {w: 0.9, h: Math.min(0.75, 0.27 + s * 0.45), d: 0.5}; };
    function buildLane(z, m2, x2, color2, name) {
      const lg = new THREE.Group(); lg.position.z = z;
      const beam = mesh(rbox(21, 0.14, 0.32, 0.02), M.metal(0xadb5bd, 0.3)); beam.position.set(10, 0.45, 0); lg.add(beam);
      [-0.3, 20.3].forEach(x => { const leg = cyl(0.04, 0.05, 0.45, M.metal(0x495057), 10); leg.position.set(x, 0.22, 0); lg.add(leg); });
      const mk = (m, col) => { const d = cartGeo(m), c = new THREE.Group(); const b = mesh(rbox(d.w, d.h, d.d, 0.04), M.plastic(col)); b.position.y = 0.52 + d.h / 2 + 0.02; c.add(b); const fin = mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), M.chrome()); fin.position.set(0, 0.52 + d.h + 0.08, 0); c.add(fin); return c; };
      const c1 = mk(p.m1, 0xe03131), c2 = mk(m2, color2 || 0xf1f3f5); lg.add(c1, c2); g.add(lg);
      const lane = {g: lg, c1, c2, x1: 2, x2, v1: p.v1, v2: 0, m2, hit: false, after: 0, name};
      c1.position.x = lane.x1; c2.position.x = lane.x2; lanes.push(lane);
      if (name) { const L = label(`${name} · <b>${fmt(m2, 'kg')}</b>`, 'tag'); L.pos.set(-0.3, 1.2, z); L.ax = 0; lane.L = L; L.el.style.setProperty('--c', '#' + new THREE.Color(color2).getHexString()); }
      return lane;
    }
    for (let x = 0; x <= 20; x += 2) { const L = label(x + ' m', 'tick'); L.pos.set(x, 0.25, 0.5); }
    if (p.mode === 'elastic') buildLane(0, p.m2, p.x2); else buildLane(0, 1.5, 8, 0xf1f3f5, 'Ejemplo');
    const api = {group: g, cam: {pos: [10, 3.6, 13], target: [10, 0.6, 0]}, done: false, live: ''};
    let running = false;
    api.intro = dt => { if (p.mode !== 'elastic') return true; const l = lanes[0]; l.x1 = Math.min(l.x1 + p.v1 * dt, 6); l.c1.position.x = l.x1; return l.x1 >= 6; };
    api.lanes = list => { lanes.forEach(l => { g.remove(l.g); l.L && l.L.el.remove(); }); lanes = []; const n = list.length; list.forEach((it, i) => buildLane((i - (n - 1) / 2) * 1.1, it.value, 8, it.color, it.name)); api.cam = {pos: [8, 9, 9], target: [8, 0.5, 0]}; Stage.recam(); };
    api.reveal = () => { running = true; };
    api.update = dt => {
      if (!running || api.done) return;
      let allDone = true;
      lanes.forEach(l => {
        const n = 10, h = dt / n;
        for (let i = 0; i < n; i++) {
          l.x1 += l.v1 * h; l.x2 += l.v2 * h;
          if (!l.hit && l.x2 - l.x1 <= 0.9) { l.hit = true; const m1 = p.m1, m2 = l.m2, u1 = l.v1; l.v1 = (m1 - m2) / (m1 + m2) * u1; l.v2 = 2 * m1 / (m1 + m2) * u1; l.x1 = l.x2 - 0.9;
            if (l.L) l.L.el.innerHTML = `${l.name} · ${fmt(l.m2, 'kg')} → rojo ${l.v1 < 0 ? 'rebota a' : 'sigue a'} <b>${fmt(Math.abs(l.v1), 'm/s')}</b>`; }
          if (l.hit) l.after += h;
          if (p.mode === 'elastic' && l.hit && l.after >= p.after) { l.x2 -= l.v2 * (l.after - p.after); l.after = p.after; break; }
        }
        l.x1 = Math.max(-0.5, Math.min(20.5, l.x1)); l.x2 = Math.min(20.5, l.x2);
        l.c1.position.x = l.x1; l.c2.position.x = l.x2;
        if (!(l.hit && l.after >= (p.mode === 'elastic' ? p.after : 2.5))) allDone = false;
      });
      const l0 = lanes[0];
      api.live = p.mode === 'elastic' ? (l0.hit ? `después del choque: ${fmt(l0.after, 's')}` : 'acercándose…') : '';
      if (allDone) { api.done = true; running = false; }
    };
    api.marksAt = vv => new THREE.Vector3(vv, 0.53, -0.45);
    api.readout = () => p.mode === 'elastic' ? `El carrito pesado está en ${fmt(lanes[0].x2, 'm')}` : 'Con 3 kg el rojo rebota a 2.00 m/s';
    return api;
  };

  /* ---- disk: turns | carousel | wheel ---- */
  S.disk = (p) => {
    const g = new THREE.Group(), rot = new THREE.Group(); g.add(rot);
    let R = 1.6, th = 0, w = p.w0, t = 0, running = false;
    const api = {group: g, done: false, live: ''};
    if (p.mode === 'turns') {
      const base = cyl(0.9, 1.1, 0.6, M.metal(0xe9ecef, 0.3), 48); base.position.y = 0.3; g.add(base);
      rot.position.y = 0.66;
      const plate = cyl(R, R, 0.08, M.metal(0x868e96, 0.25), 64); rot.add(plate);
      for (let k = 0; k < 6; k++) { const tube_ = cyl(0.11, 0.11, 0.5, M.glass(0x99c2ff), 20); const a = k * Math.PI / 3; tube_.position.set(Math.cos(a) * 1.15, 0.2, Math.sin(a) * 1.15); tube_.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); rot.add(tube_); }
      const mark = mesh(rbox(0.5, 0.06, 0.12, 0.02), M.glow(0xff3b3b, 1.2)); mark.position.set(R - 0.3, 0.06, 0); rot.add(mark);
      api.cam = {pos: [0, 4.2, 6], target: [0, 0.6, 0]};
      const cnt = label('', 'big'); cnt.pos.set(0, 2.2, 0);
      api.intro = dt => { t += dt; th += p.w0 * dt; rot.rotation.y = th; return t > 1.8; };
      api.reveal = () => { running = true; t = 0; th = 0; rot.rotation.y = 0; };
      api.update = dt => { if (!running || api.done) return; t = Math.min(t + dt, p.T); th = p.w0 * t + 0.5 * p.a * t * t; rot.rotation.y = th; cnt.el.innerHTML = `${(th / (2 * Math.PI)).toFixed(2)} vueltas`; api.live = `t = ${fmt(t, 's')} · ω = ${fmt(p.w0 + p.a * t, 'rad/s')}`; if (t >= p.T) { api.done = true; running = false; } };
      api.readout = () => `θ = 21 rad = ${(21 / (2 * Math.PI)).toFixed(2)} vueltas`;
    }
    if (p.mode === 'carousel') {
      R = 2.4; rot.position.y = 0.25;
      const plat = cyl(R, R, 0.16, M.plastic(0xf59f00, 0.4), 64); rot.add(plat);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; const bar = cyl(0.03, 0.03, 0.9, M.chrome(), 8); bar.position.set(Math.cos(a) * 1.4, 0.5, Math.sin(a) * 1.4); rot.add(bar); const seg = mesh(new THREE.BoxGeometry(0.04, 0.04, 1.2), M.chrome()); seg.position.set(Math.cos(a) * 1.4, 0.95, Math.sin(a) * 1.4); seg.rotation.y = -a; rot.add(seg); }
      const hub = cyl(0.25, 0.25, 1.2, M.metal(0xc92a2a), 24); hub.position.y = 0.6; rot.add(hub);
      const kid = mannequin({shirt: 0x37b24d, pants: 0x1864ab}); kid.pose({sit: true, armL: 0.9, armR: 0.9}); kid.group.scale.setScalar(1.25); kid.group.position.set(p.r, 0.08, 0); kid.group.rotation.y = Math.PI / 2; rot.add(kid.group);
      const anchor = new THREE.Object3D(); anchor.position.set(p.r, 0.9, 0); rot.add(anchor);
      let ac = null, at = null;
      api.cam = {pos: [0, 6.5, 7.5], target: [0, 0.4, 0]};
      api.intro = dt => { t += dt; th += p.w0 * dt; rot.rotation.y = th; return t > 1.8; };
      api.reveal = () => { running = true; t = 0; };
      api.update = dt => {
        if (!running || api.done) return; t = Math.min(t + dt, p.T); w = p.w0 + p.a * t; th += w * dt; rot.rotation.y = th;
        const pos = new THREE.Vector3(); anchor.getWorldPosition(pos);
        const toC = new THREE.Vector3(-pos.x, 0, -pos.z).normalize(), tan = new THREE.Vector3(-toC.z, 0, toC.x).negate();
        if (ac) g.remove(ac); if (at) g.remove(at);
        ac = arrow(toC, pos, Math.max(0.2, w * w * p.r * 0.2), 0x4dabf7); at = arrow(tan, pos, Math.max(0.2, p.a * p.r * 0.6), 0xff922b); g.add(ac, at);
        api.live = `ω = ${fmt(w, 'rad/s')} · a꜀ = ${fmt(w * w * p.r, 'm/s²')} · aₜ = ${fmt(p.a * p.r, 'm/s²')}`;
        if (t >= p.T) { api.done = true; running = false; }
      };
      api.readout = () => `|a| = √(8² + 1²) = ${fmt(Math.hypot(8, 1), 'm/s²')}`;
    }
    if (p.mode === 'wheel') {
      R = 2; rot.position.y = 0.2;
      const cols = [0xe03131, 0xf59f00, 0x2f9e44, 0x1c7ed6, 0x7048e8, 0xd6336c, 0x0ca678, 0xf76707];
      for (let k = 0; k < 8; k++) { const seg = mesh(new THREE.CylinderGeometry(R, R, 0.12, 24, 1, false, k * Math.PI / 4, Math.PI / 4), M.plastic(cols[k], 0.35)); rot.add(seg); }
      const hub = cyl(0.25, 0.25, 0.2, M.chrome(), 24); hub.position.y = 0.08; rot.add(hub);
      const mark = new THREE.Group(); const arrowM = mesh(new THREE.ConeGeometry(0.16, 0.5, 3), M.glow(0xff1a1a, 1.5)); arrowM.rotation.z = -Math.PI / 2; arrowM.position.set(R - 0.35, 0.12, 0); mark.add(arrowM); const strip = mesh(new THREE.BoxGeometry(R - 0.6, 0.02, 0.08), M.glow(0xffffff, 0.6)); strip.position.set((R - 0.6) / 2 + 0.25, 0.08, 0); mark.add(strip); rot.add(mark);
      const ring = mesh(new THREE.TorusGeometry(R + 0.35, 0.03, 8, 120), M.chrome()); ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; g.add(ring);
      for (let a = 0; a < 360; a += 10) { const r0 = a % 30 === 0 ? 0.28 : 0.14, tk = mesh(new THREE.BoxGeometry(r0, 0.02, 0.025), M.matte(0xffffff)); const ar = a * deg; tk.position.set(Math.cos(ar) * (R + 0.2 + r0 / 2), 0.2, -Math.sin(ar) * (R + 0.2 + r0 / 2)); tk.rotation.y = ar; g.add(tk); }
      for (let a = 0; a < 360; a += 30) { const L = label(a + '°', 'tick'); const ar = a * deg; L.pos.set(Math.cos(ar) * (R + 0.8), 0.2, -Math.sin(ar) * (R + 0.8)); }
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.5, R + 1.5, 1.4, 16)); pad.visible = false; pad.position.y = 0.7; g.add(pad);
      api.cam = {pos: [0, 9, 2.2], target: [0, 0, 0]};
      const tStop = p.w0 / -p.a, thEnd = p.w0 * p.w0 / (2 * -p.a);
      api.reveal = () => { running = true; t = 0; };
      api.update = dt => { if (!running || api.done) return; t = Math.min(t + dt, tStop); th = p.w0 * t + 0.5 * p.a * t * t; rot.rotation.y = th; api.live = `θ = ${fmt(th / deg % 360, '°')} · ω = ${fmt(p.w0 + p.a * t, 'rad/s')}`; if (t >= tStop) { api.done = true; running = false; } };
      api.marksAt = vv => { const ar = vv * deg; return new THREE.Vector3(Math.cos(ar) * (R + 0.35), 0.2, -Math.sin(ar) * (R + 0.35)); };
      api.readout = () => `θ = 8 rad = 458.4° ⇒ se detiene en ${fmt(thEnd / deg % 360, '°')}`;
    }
    return api;
  };

  /* ---- spinning skater ---- */
  S.skater = (p) => {
    const g = new THREE.Group();
    const iceD = mesh(new THREE.CylinderGeometry(3, 3, 0.04, 64), new THREE.MeshStandardMaterial({map: tex('ice_d', 512, 512, FLOORS.ice, [2, 2]), roughness: 0.1})); iceD.position.y = 0.02; g.add(iceD);
    const spin = new THREE.Group(); spin.position.y = 0.04; g.add(spin);
    const sk = mannequin({shirt: 0xd6336c, pants: 0x212529, long: true, skates: true}); sk.group.scale.setScalar(2); spin.add(sk.group);
    const wL = sph(0.1, M.metal(0x343a40, 0.3)), wR = sph(0.1, M.metal(0x343a40, 0.3)); spin.add(wL, wR);
    const Lsh = 0.3, La = 0.74, shY = 0.79 * 2;
    let r = p.r0, th = 0, t = 0, running = false;
    const I = rr => p.I0 + 2 * p.m * rr * rr, Lm = I(p.r0) * p.w0;
    const setArms = rr => { const phi = Math.asin(Math.max(0, Math.min(1, (rr - Lsh) / La))); sk.armL.rotation.x = -phi; sk.armR.rotation.x = phi; const hz = Lsh + La * Math.sin(phi), hy = shY - La * Math.cos(phi); wL.position.set(0, hy, hz); wR.position.set(0, hy, -hz); };
    setArms(r);
    const lw = label('', 'big'); lw.pos.set(0, 2.8, 0);
    const api = {group: g, cam: {pos: [0, 2.6, 7], target: [0, 1.2, 0]}, done: false, live: ''};
    api.intro = dt => { t += dt; th += p.w0 * dt; spin.rotation.y = th; return t > 1.8; };
    api.reveal = () => { running = true; t = 0; };
    api.update = dt => {
      if (!running || api.done) return; t += dt;
      const target = 0.5; r = t < 1 ? p.r0 : t < 2.2 ? p.r0 + (target - p.r0) * (t - 1) / 1.2 : target;
      setArms(r); const w = Lm / I(r); th += w * dt; spin.rotation.y = th;
      lw.el.innerHTML = `r = ${fmt(r, 'm')} · ω = ${fmt(w, 'rad/s')}`; api.live = `I = ${fmt(I(r), 'kg·m²')} · L = ${fmt(Lm, 'kg·m²/s')}`;
      if (t > 4.5) { api.done = true; running = false; }
    };
    api.readout = () => `Con r = 0.50 m: I = 2 kg·m² y ω = 5.00 rad/s`;
    return api;
  };

  /* ---- wrench and rusty bolt ---- */
  S.wrench = () => {
    const g = new THREE.Group(), sc = 4;
    const plate = mesh(rbox(3.4, 2.6, 0.2, 0.05), M.metal(0x5c3d2e, 0.8)); plate.position.set(0.9, 1.5, -0.25); g.add(plate);
    const bolt = cyl(0.16, 0.16, 0.18, M.metal(0x8d6e63, 0.7), 6); bolt.rotation.x = Math.PI / 2; bolt.position.set(0, 1.5, 0); g.add(bolt);
    const wr = new THREE.Group(); wr.position.set(0, 1.5, 0.12); g.add(wr);
    const handle = mesh(rbox(0.5 * sc, 0.16, 0.06, 0.03), M.chrome()); handle.position.x = 0.25 * sc; wr.add(handle);
    const headM = mesh(new THREE.TorusGeometry(0.2, 0.07, 10, 24, Math.PI * 1.6), M.chrome()); headM.rotation.z = Math.PI * 0.7; wr.add(headM);
    const F = [{id: 'A', F: 40, r: 0.30, ang: 90}, {id: 'B', F: 60, r: 0.20, ang: 150}, {id: 'C', F: 30, r: 0.45, ang: 90}, {id: 'D', F: 80, r: 0.30, ang: 0}];
    const z = 0.2, offs = {A: 0, B: 0, C: 0, D: 0.0};
    F.forEach(f => { const a = f.ang * deg, dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0), o = new THREE.Vector3(f.r * sc, 0, z); const ar = arrow(dir, o, 0.25 + f.F / 80, 0xffd43b); wr.add(ar); const L = label(f.id, 'arrowlbl'); L.obj = ar; L.off.copy(dir.clone().multiplyScalar(0.45 + f.F / 80)); f.L = L;
      const dot = sph(0.05, M.glow(0xffd43b, 1), 10); dot.position.copy(o); wr.add(dot); });
    for (let i = 1; i <= 5; i++) { const L = label((i / 10).toFixed(1) + ' m', 'tick'); L.pos.set(i / 10 * sc, 1.18, 0.2); }
    const api = {group: g, cam: {pos: [1, 1.6, 6.2], target: [1, 1.5, 0]}, done: false, live: ''};
    let t = 0, running = false;
    api.reveal = () => { running = true; F.forEach(f => { const tau = f.r * f.F * Math.sin(f.ang * deg); f.L.el.innerHTML = `${f.id}: ${fmt(Math.abs(tau) < 1e-6 ? 0 : tau, 'N·m')}`; if (f.id === 'C') f.L.el.className = 'lbl arrowlbl good'; }); };
    api.update = dt => { if (!running || api.done) return; t += dt; wr.rotation.z = Math.min(t, 1.5) * 0.25; if (t > 1.6) { api.done = true; running = false; } };
    api.readout = () => 'Mayor torca: C (13.5 N·m)';
    return api;
  };

  /* ---- mass on a spring: speed | where ---- */
  S.spring = (p) => {
    const g = new THREE.Group(), SC = 3.2, w = Math.sqrt(p.k / p.m);
    const X = x => x * SC;
    const base = mesh(rbox(5.2, 0.12, 1.2, 0.03), M.metal(0x495057, 0.4)); base.position.set(0, 0.06, 0); g.add(base);
    const wall = mesh(rbox(0.2, 1.3, 1.2, 0.03), M.metal(0x343a40)); wall.position.set(-2.5, 0.65, 0); g.add(wall);
    const block = mesh(rbox(0.6, 0.6, 0.6, 0.06), M.plastic(0x5c7cfa)); g.add(block);
    const spr = tube(helix(new THREE.Vector3(-2.4, 0.42, 0), new THREE.Vector3(-0.3, 0.42, 0), 0.14, 11), 0.025, M.chrome(), 260); g.add(spr);
    for (let v = -0.5; v <= 0.5001; v += 0.1) { const tk = mesh(new THREE.BoxGeometry(0.02, 0.01, Math.abs(v) < 1e-6 ? 1.2 : 0.4), M.matte(Math.abs(v) < 1e-6 ? 0xffd43b : 0xffffff)); tk.position.set(X(v), 0.125, 0.4); g.add(tk); const L = label((Math.abs(v) < 1e-6 ? 0 : v).toFixed(1), 'tick'); L.pos.set(X(v), 0.13, 0.85); }
    let x = p.A, t = 0, running = false, phase = 0, hold = 0;
    const place = () => { block.position.set(X(x), 0.42, 0); setTube(spr, helix(new THREE.Vector3(-2.4, 0.42, 0), new THREE.Vector3(X(x) - 0.3, 0.42, 0), 0.14, 11), 0.025, 260); };
    x = p.A; place();
    const api = {group: g, cam: {pos: [0, 2.4, 6.2], target: [0, 0.4, 0]}, done: false, live: ''};
    const flash = document.createElement('div'); flash.className = 'flash'; host.appendChild(flash);
    api.dispose = () => flash.remove();
    if (p.mode === 'speed') {
      const t1 = Math.acos(p.stopX / p.A) / w;
      api.reveal = () => { running = true; t = 0; };
      api.update = dt => { if (!running || api.done) return;
        if (phase === 0) { t = Math.min(t + dt * 0.6, t1); x = p.A * Math.cos(w * t); api.live = `x = ${fmt(x, 'm')} · v = ${fmt(p.A * w * Math.sin(w * t), 'm/s')}`; if (t >= t1) { phase = 1; api.done = true; } }
        place(); };
      api.after = dt => { if (phase >= 1) { hold += dt; if (hold > 2) { t += dt; x = p.A * Math.cos(w * t); place(); } } };
      api.readout = () => `En x = 0.30 m: v = ${fmt(p.A * w * Math.sin(w * t1), 'm/s')}`;
    } else {
      api.reveal = () => { running = true; t = 0; };
      api.update = dt => { if (!running || api.done) return; t = Math.min(t + dt * 0.25, p.T); x = p.A * Math.cos(w * t); place(); api.live = `t = ${fmt(t, 's')} (cámara lenta ×4)`; if (t >= p.T) { api.done = true; running = false; flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); } };
      api.marksAt = vv => new THREE.Vector3(X(vv), 0.12, -0.45);
      api.readout = () => `En la foto: x = ${fmt(p.A * Math.cos(w * p.T), 'm')}`;
    }
    return api;
  };

  /* ---- pendulums (one per team on reveal) ---- */
  S.pendulum = (p) => {
    const g = new THREE.Group(); let pends = [];
    const frame = new THREE.Group(); g.add(frame);
    function build(list) {
      frame.clear(); pends.forEach(q => q.L && q.L.el.remove()); pends = [];
      const n = list.length, span = Math.max(2, n * 0.9), top = 2.6;
      const beam = mesh(rbox(span + 0.6, 0.12, 0.2, 0.03), M.metal(0x495057)); beam.position.set(0, top, 0); frame.add(beam);
      [-1, 1].forEach(sd => { const post = cyl(0.05, 0.06, top, M.metal(0x343a40), 12); post.position.set(sd * (span / 2 + 0.25), top / 2, 0); frame.add(post); });
      list.forEach((it, i) => {
        const x = n === 1 ? 0 : -span / 2 + 0.45 + i * (span - 0.9) / (n - 1), piv = new THREE.Group(); piv.position.set(x, top - 0.06, 0); frame.add(piv);
        const Lv = Math.min(it.value, top - 0.25), rod = cyl(0.008, 0.008, Lv, M.chrome(), 6); rod.position.y = -Lv / 2; piv.add(rod);
        const bob = sph(0.09, it.ref ? M.chrome() : M.plastic(it.color, 0.25), 24); bob.position.y = -Lv; piv.add(bob);
        const q = {piv, len: it.value, T: 2 * Math.PI * Math.sqrt(it.value / p.g), name: it.name, color: it.color};
        const L = label(`${it.name}<br><b>${fmt(it.value, 'm')}</b>`, 'tag'); L.obj = bob; L.off.set(0, -0.3, 0); L.el.style.setProperty('--c', it.ref ? '#ffffff' : '#' + new THREE.Color(it.color).getHexString()); q.L = L;
        pends.push(q);
      });
      api.cam = {pos: [0, 1.6, 4.2 + span * 1.1], target: [0, 1.4, 0]};
    }
    const api = {group: g, done: false, live: ''};
    build([{name: 'Ejemplo', color: 0x868e96, value: 1.5}]);
    let t = 0, running = false;
    api.intro = dt => { t += dt; pends.forEach(q => q.piv.rotation.z = 0.2 * Math.cos(2 * Math.PI * t / q.T)); return t > 2.5; };
    api.lanes = list => { build(list); Stage.recam(); };
    api.reveal = () => { running = true; t = 0; pends.forEach(q => q.L.el.innerHTML = `${q.name}<br><b>T = ${fmt(q.T, 's')}</b>${Math.abs(q.T / p.T - 1) < 0.03 ? ' ✓' : ''}`); };
    api.update = dt => { if (!running) return; t += dt; pends.forEach(q => q.piv.rotation.z = 0.22 * Math.cos(2 * Math.PI * t / q.T)); api.live = `t = ${fmt(t, 's')} · en Marte (g = 3.71 m/s²)`; if (t > 6.2) api.done = true; };
    api.after = dt => { if (api.done) { t += dt; pends.forEach(q => q.piv.rotation.z = 0.22 * Math.cos(2 * Math.PI * t / q.T)); } };
    api.readout = () => `ℓ = ${fmt(p.g * p.T * p.T / (4 * Math.PI * Math.PI), 'm')} da T = 3.00 s en Marte`;
    return api;
  };

  /* ================= stage control ================= */
  let cur = null, phase = 'idle', introDone = null, camBase = {pos: new THREE.Vector3(0, 3, 10), target: new THREE.Vector3()}, camNow = {pos: new THREE.Vector3(0, 3, 10), target: new THREE.Vector3()}, clock = 0, marksG = null;
  function recam() {
    if (!cur) return; camBase.pos.fromArray(cur.cam.pos); camBase.target.fromArray(cur.cam.target);
    if (!cur.follow) {
      const box = new THREE.Box3().setFromObject(cur.group), ctr = box.getCenter(new THREE.Vector3());
      const dir = camBase.pos.clone().sub(camBase.target).normalize(), vf = camera.fov * deg / 2, hf = Math.atan(Math.tan(vf) * camera.aspect * (1 - shiftFr));
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir); if (right.lengthSq() < 1e-6) right.set(1, 0, 0); right.normalize();
      const up = new THREE.Vector3().crossVectors(dir, right).normalize();
      let dist = 3;
      for (let i = 0; i < 8; i++) { const c = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(ctr);
        dist = Math.max(dist, c.dot(dir) + Math.abs(c.dot(right)) / Math.tan(hf) * 1.15, c.dot(dir) + Math.abs(c.dot(up)) / Math.tan(vf) * 1.12); }
      camBase.target.copy(ctr); camBase.pos.copy(ctr).addScaledVector(dir, dist);
    }
    placeLights(camBase.target, camBase.pos.distanceTo(camBase.target));
  }
  let shiftFr = 0, shiftNow = 0;
  function shift(fr) { shiftFr = fr; recam(); }
  function show(ch) {
    if (cur) { scene.remove(cur.group); cur.dispose && cur.dispose(); }
    if (marksG) { scene.remove(marksG); marksG = null; }
    clearLabels();
    cur = S[ch.scene.type](ch.scene); scene.add(cur.group); recam();
    camNow.pos.copy(camBase.pos).add(new THREE.Vector3(2.5, 1.2, 3)); camNow.target.copy(camBase.target);
    phase = 'intro'; clock = 0; shiftFr = 0;
    return new Promise(res => { introDone = res; });
  }
  function reveal(opts = {}) {
    if (!cur) return;
    if (opts.lanes && cur.lanes) cur.lanes(opts.lanes);
    if (opts.marks && cur.marksAt) setMarks(opts.marks);
    cur.reveal && cur.reveal(); phase = 'reveal';
    return new Promise(res => { cur._onDone = res; });
  }
  function setMarks(list) {
    if (marksG) scene.remove(marksG);
    marksG = new THREE.Group(); scene.add(marksG);
    const placed = [];
    list.filter(m => m.value !== null && m.value !== undefined).sort((a, b) => a.value - b.value).forEach(m => {
      const at = cur.marksAt(m.value); let h = 1.0; placed.forEach(q => { if (q.at.distanceTo(at) < 1.2 && q.h >= h - 0.01) h = q.h + 0.55; });
      placed.push({at, h}); marksG.add(flag(m.color, `${m.name}<br><b>${fmt(m.value, m.unit || '')}</b>`, at, h));
    });
  }
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (loop.last || now)) / 1000); loop.last = now; clock += dt;
    if (cur) {
      if (phase === 'intro') { const ok = cur.intro ? cur.intro(dt) : clock > 1.2; if (ok && clock > 1.2) { phase = 'freeze'; introDone && introDone(); introDone = null; } }
      else if (phase === 'reveal') { cur.update && cur.update(dt); if (cur.done) { phase = 'after'; cur._onDone && cur._onDone(cur.readout ? cur.readout() : ''); } }
      else if (phase === 'after') { cur.after && cur.after(dt); }
      const f = cur.follow ? cur.follow() : 0;
      const tp = camBase.pos.clone().add(new THREE.Vector3(f + Math.sin(clock * 0.15) * 0.5, Math.sin(clock * 0.11) * 0.15, 0)), tt = camBase.target.clone().add(new THREE.Vector3(f, 0, 0));
      const kp = 1 - Math.exp(-dt * 2.2), kt = 1 - Math.exp(-dt * 3); camNow.pos.lerp(tp, kp); camNow.target.lerp(tt, kt);
      if (cur.follow) placeLights(tt, camBase.pos.distanceTo(camBase.target));
    }
    shiftNow += (shiftFr - shiftNow) * (1 - Math.exp(-dt * 3));
    const W = host.clientWidth, H = host.clientHeight; if (Math.abs(shiftNow) > 1e-3) camera.setViewOffset(W, H, W * shiftNow / 2, 0, W, H); else camera.clearViewOffset();
    camera.position.copy(camNow.pos); camera.lookAt(camNow.target);
    renderer.render(scene, camera); updateLabels();
  }
  function resize() { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize(); requestAnimationFrame(loop);
  return {show, reveal, setMarks, recam, shift, live: () => (cur && cur.live) || '', phase: () => phase, idle() { if (cur) { scene.remove(cur.group); cur.dispose && cur.dispose(); cur = null; } if (marksG) { scene.remove(marksG); marksG = null; } clearLabels(); phase = 'idle'; camBase.pos.set(0, 3, 12); camBase.target.set(0, 1, 0); }};

})();
