/* Teardown kit for the course: light studio, 3D force vectors, model-driven panels, notes / problem / reto,
   callouts, orbit camera, auto tour that hands control to the student (25 s of quiet hands it back). */
const TD = (() => {
const {PI, sin, cos, abs, sqrt, min, max} = Math, TAU = 2 * PI, D = PI / 180;
const COL = {ink: '#16181b', mute: '#8b8f95', line: '#e1e3e6', acc: '#f05a23', blue: '#3d8fe0', violet: '#7048e8', green: '#2f9e44', grey: '#5d6670', bg: '#f1f1ef'};
const $ = s => document.querySelector(s);
const el = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
const fx = (v, d = 2) => (typeof v === 'number' && isFinite(v) ? (abs(v) < 0.5 * Math.pow(10, -d) ? (0).toFixed(d) : v.toFixed(d)) : '—');

/* ---------------- renderer & light studio ---------------- */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(COL.bg);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new THREE.RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5;
const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.02, 400);
scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dde2, 0.75));
const key = new THREE.DirectionalLight(0xffffff, 2.0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xfff2e0, 0.55); rim.position.set(6, 6, -6); scene.add(rim);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({opacity: 0.16, polygonOffset: true, polygonOffsetFactor: -1}));
ground.rotation.x = -PI / 2; ground.receiveShadow = true; scene.add(ground);
const floorTint = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({color: 0xecebe8, roughness: 0.95})); floorTint.rotation.x = -PI / 2; floorTint.position.y = -0.002; floorTint.receiveShadow = true; scene.add(floorTint);
function lightFor(target, span) { key.position.set(target.x - span * 0.6, target.y + span * 1.4, target.z + span * 0.9); key.target.position.copy(target); const c = key.shadow.camera; c.left = c.bottom = -span * 1.3; c.right = c.top = span * 1.3; c.near = 0.1; c.far = span * 6; c.updateProjectionMatrix(); }

/* ---------------- materials & textures ---------------- */
const tcache = {};
function tex(name, w, h, draw, rep = [1, 1]) { if (!tcache[name]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; tcache[name] = t; } const t = tcache[name].clone(); t.repeat.set(...rep); t.needsUpdate = true; return t; }
const TEX = {
  wood: (g, w, h) => { g.fillStyle = '#b58a5c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { const y = Math.random() * h; g.strokeStyle = `rgba(90,55,25,${0.08 + Math.random() * 0.18})`; g.lineWidth = 1 + Math.random() * 2.5; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 24) g.lineTo(x, y + sin(x * 0.012 + i) * 4); g.stroke(); } for (let x = 0; x < w; x += w / 4) { g.fillStyle = 'rgba(60,35,15,.35)'; g.fillRect(x, 0, 2, h); } },
  walnut: (g, w, h) => { g.fillStyle = '#6b4127'; g.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { const x = Math.random() * w; g.strokeStyle = `rgba(35,18,8,${0.15 + Math.random() * 0.25})`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + sin(y * 0.01 + i) * 6, y); g.stroke(); } },
  ice: (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f4f9fc'); gr.addColorStop(1, '#e3eef6'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(150,175,195,${0.05 + Math.random() * 0.12})`; g.lineWidth = 0.6 + Math.random(); const x = Math.random() * w, y = Math.random() * h, a = Math.random() * TAU, L = 20 + Math.random() * 90; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + cos(a) * L * 0.6 + 10, y + sin(a) * L * 0.6, x + cos(a) * L, y + sin(a) * L); g.stroke(); } },
  concrete: (g, w, h) => { g.fillStyle = '#d9d8d4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '90,90,90'},${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } },
  cardboard: (g, w, h) => { g.fillStyle = '#c8a165'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(120,80,30,${Math.random() * 0.08})`; g.fillRect(0, Math.random() * h, w, 1 + Math.random() * 3); } g.fillStyle = 'rgba(180,150,90,.85)'; g.fillRect(w * 0.42, 0, w * 0.16, h); g.strokeStyle = 'rgba(60,40,15,.5)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = 'rgba(40,30,15,.55)'; g.font = `700 ${w * 0.09}px Inter,sans-serif`; g.fillText('↑ ↑', w * 0.08, h * 0.2); },
  canvasArt: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fb3d5'); gr.addColorStop(0.55, '#f6d7a7'); gr.addColorStop(0.56, '#6a8f4e'); gr.addColorStop(1, '#3f5f33'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(w * 0.72, h * 0.32, w * 0.07, 0, TAU); g.fill(); g.fillStyle = '#2f4a2a'; g.beginPath(); g.moveTo(0, h * 0.62); g.lineTo(w * 0.3, h * 0.4); g.lineTo(w * 0.55, h * 0.6); g.lineTo(w, h * 0.45); g.lineTo(w, h); g.lineTo(0, h); g.fill(); }
};
const MAT = {
  std: (color, rough = 0.5, metal = 0) => new THREE.MeshStandardMaterial({color, roughness: rough, metalness: metal}),
  metal: (color = 0xb8bdc4, rough = 0.35) => new THREE.MeshStandardMaterial({color, metalness: 1, roughness: rough, envMapIntensity: 0.6}),
  brass: () => new THREE.MeshStandardMaterial({color: 0xc9a24f, metalness: 1, roughness: 0.42, envMapIntensity: 0.55}),
  plastic: (color, rough = 0.38) => new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0}),
  rubber: () => new THREE.MeshStandardMaterial({color: 0x222326, roughness: 0.85}),
  tex: (name, rep, rough = 0.6, color = 0xffffff) => new THREE.MeshStandardMaterial({color, roughness: rough, map: tex(name, 512, 512, TEX[name], rep)}),
  glass: () => new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false}),
  cable: () => new THREE.MeshStandardMaterial({color: 0x2b2e33, roughness: 0.6, metalness: 0.3})
};
const mesh = (geo, mat, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; return m; };
const box = (w, h, d, mat, r = 0) => mesh(r && THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), mat);
const cyl = (r1, r2, h, mat, seg = 24) => mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
const sph = (r, mat, seg = 32) => mesh(new THREE.SphereGeometry(r, seg, seg / 2), mat);
function tubeBetween(a, b, r, mat) { const m = cyl(r, r, 1, mat, 10); const L = new THREE.Vector3(); m.userData.set = (p, q) => { L.subVectors(q, p); const len = max(1e-4, L.length()); m.position.copy(p).addScaledVector(L, 0.5); m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), L.normalize()); }; m.userData.set(a, b); return m; }

/* simple person (built facing +x): pose(lean, armL, armR, stride) */
function person(o = {}) {
  const g = new THREE.Group(), skin = MAT.plastic(o.skin || 0xe0b48f, 0.6), shirt = MAT.plastic(o.shirt || 0x1c7ed6, 0.7), pants = MAT.plastic(o.pants || 0x343a40, 0.75), s = o.scale || 1;
  const hip = new THREE.Group(); hip.position.y = 0.95 * s; g.add(hip);
  const torso = new THREE.Group(); hip.add(torso);
  const chest = mesh(new THREE.CapsuleGeometry(0.17 * s, 0.38 * s, 6, 14), shirt); chest.position.y = 0.3 * s; chest.scale.z = 0.72; torso.add(chest);
  const head = sph(0.11 * s, skin, 24); head.position.y = 0.72 * s; torso.add(head);
  const hair = sph(0.115 * s, MAT.plastic(o.hair || 0x3b2a1e, 0.8), 20); hair.position.set(-0.015 * s, 0.75 * s, 0); hair.scale.set(1, 0.75, 1); torso.add(hair);
  const limb = (len, r, mat) => { const p = new THREE.Group(), m = mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat); m.position.y = -len / 2; p.add(m); return p; };
  const armL = limb(0.52 * s, 0.045 * s, shirt), armR = limb(0.52 * s, 0.045 * s, shirt);
  armL.position.set(0, 0.55 * s, 0.2 * s); armR.position.set(0, 0.55 * s, -0.2 * s); torso.add(armL, armR);
  const legL = limb(0.82 * s, 0.065 * s, pants), legR = limb(0.82 * s, 0.065 * s, pants);
  legL.position.set(0, 0, 0.1 * s); legR.position.set(0, 0, -0.1 * s); hip.add(legL, legR);
  if (o.skates) [legL, legR].forEach(l => { const b = mesh(new THREE.BoxGeometry(0.28 * s, 0.06 * s, 0.09 * s), MAT.plastic(0xf8f9fa)); b.position.set(0.04 * s, -0.9 * s, 0); l.add(b); const bl = mesh(new THREE.BoxGeometry(0.3 * s, 0.03 * s, 0.01 * s), MAT.metal()); bl.position.set(0.04 * s, -0.95 * s, 0); l.add(bl); });
  const pose = ({lean = 0, armL: aL = 0, armR: aR = 0, stride = 0, crouch = 0} = {}) => { torso.rotation.z = -lean; armL.rotation.z = aL; armR.rotation.z = aR; legL.rotation.z = stride; legR.rotation.z = -stride; hip.position.y = (0.95 - crouch) * s; };
  return {group: g, pose, armL, armR, torso};
}

/* ---------------- 3D force vectors ---------------- */
const vecLayer = () => $('#vls');
function vector(color, name, opts = {}) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({color, roughness: 0.35, metalness: 0.1, emissive: color, emissiveIntensity: 0.18, transparent: !!opts.ghost, opacity: opts.ghost ? 0.45 : 1});
  const r = opts.r || 0.018, shaft = mesh(new THREE.CylinderGeometry(r, r, 1, 12), mat, false), head = mesh(new THREE.ConeGeometry(r * 2.6, r * 7, 16), mat, false);
  g.add(shaft, head); g.visible = false; g.renderOrder = 5;
  const lab = el(`<div class="vl" style="--c:${color}"></div>`); vecLayer().appendChild(lab);
  const v = {group: g, label: lab, color, name, tip: new THREE.Vector3(), shown: false, opts, text: ''};
  v.set = (origin, vec, scale, text) => {
    const L = vec.length() * scale; v.tip.copy(origin).addScaledVector(vec, scale);
    if (L < 1e-4) { g.visible = false; v.shown = false; return; }
    const hl = min(r * 7, L * 0.5), dir = vec.clone().normalize();
    g.position.copy(origin); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    shaft.scale.y = max(1e-4, L - hl); shaft.position.y = (L - hl) / 2; head.scale.setScalar(hl / (r * 7)); head.position.y = L - hl / 2;
    g.visible = true; v.shown = true; v.text = text !== undefined ? text : `${name}<small>${fx(vec.length(), 1)} N</small>`;
  };
  v.hide = () => { g.visible = false; v.shown = false; };
  return v;
}

/* ---------------- console ---------------- */
const ui = $('#ui');
function fitUI() { const s = min(innerWidth / 1600, innerHeight / 900); ui.style.transform = `translate(${(innerWidth - 1600 * s) / 2}px,${(innerHeight - 900 * s) / 2}px) scale(${s})`; return s; }
function project(p) { const s = fitUI(), W = innerWidth, H = innerHeight, q = p.clone().project(camera); return {x: ((q.x + 1) / 2 * W - (W - 1600 * s) / 2) / s, y: ((1 - q.y) / 2 * H - (H - 900 * s) / 2) / s, z: q.z}; }

/* ---------------- camera ---------------- */
const cam = {t: new THREE.Vector3(0, 1, 0), yaw: 0, pitch: 0.1, d: 5};
let camFrom = null, camTo = null, camK = 1, camDur = 1.3;
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
function goView(v, dur = 1.3) { camFrom = {t: cam.t.clone(), yaw: cam.yaw, pitch: cam.pitch, d: cam.d}; camTo = {t: new THREE.Vector3(...v.t), yaw: v.yaw, pitch: v.pitch, d: v.d}; let dy = camTo.yaw - camFrom.yaw; while (dy > PI) dy -= TAU; while (dy < -PI) dy += TAU; camTo.yaw = camFrom.yaw + dy; camK = dur ? 0 : 1; camDur = dur || 1; if (!dur) Object.assign(cam, {t: camTo.t.clone(), yaw: camTo.yaw, pitch: camTo.pitch, d: camTo.d}); }
function placeCamera(follow) { const t = cam.t.clone(); if (follow) t.add(follow); const cp = cos(cam.pitch); camera.position.set(t.x + sin(cam.yaw) * cp * cam.d, t.y + sin(cam.pitch) * cam.d, t.z + cos(cam.yaw) * cp * cam.d); camera.lookAt(t); lightFor(t, max(1.5, cam.d * 0.45)); }

/* ---------------- state ---------------- */
let CFG = null, M = null, cur = 0, running = true, timeScale = 1, overlays = {}, viewName = null, tick = 0;
let touring = true, idle = 0, synthetic = false;
const K = {clearChart: () => { hist = []; }, COL, D, fx, MAT, TEX, tex, mesh, box, cyl, sph, tubeBetween, person, vector, el, scene, camera, project,
  ov: k => !!overlays[k], get running() { return running; }, set running(v) { running = v; syncTime(); }, refresh: () => buildRight(true)};

/* ---------------- building the console for a machine ---------------- */
function buildConsole() {
  ui.innerHTML = `
  <svg id="leaders"></svg><div id="calls"></div><div id="vls"></div>
  <div class="title"><div class="k" id="kk"></div><h1><i></i><span id="tt"></span></h1><div class="s" id="ss"></div></div>
  <div class="tabs" id="tabs"></div>
  <a class="home" href="../../index.html">← Todas las simulaciones</a>
  <div class="tourchip on" id="tourchip"><i></i><span>TOUR AUTOMÁTICO · TOCA PARA TOMAR EL CONTROL</span></div>
  <div class="pn" id="pRead" style="left:36px;top:146px;width:300px;height:392px"></div>
  <div class="pn notes" id="pNotes" style="left:36px;top:548px;width:300px;height:248px"><div class="hd"><span class="cp">Notas</span><span class="cp mu" id="nTag"></span></div><div class="txt" id="notes" style="padding:0 12px 12px;overflow:auto;position:absolute;top:30px;bottom:0;left:0;right:0"></div></div>
  <div class="pn" id="pRight" style="left:1264px;top:146px;width:300px;height:650px"><div class="ptabs"><div class="pt on" data-p="exp">Experimenta</div><div class="pt" data-p="prob">Problema real</div><div class="pt" data-p="reto">Reto ★</div></div><div class="pbody" id="pbody"></div></div>
  <div class="pn" id="pBot" style="left:356px;top:812px;width:888px;height:58px;padding:8px 12px;display:flex;gap:18px;align-items:flex-start"></div>
  <div class="ring" id="ripple"></div>
  <svg class="cur" id="cursor" width="22" height="26" viewBox="0 0 22 26"><path d="M2 2 L2 21 L7 16.5 L10.5 24 L13.5 22.7 L10 15.3 L17 15.3 Z" fill="#fff" stroke="#16181b" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  $('#tabs').innerHTML = CFG.machines.map((m, i) => `<span class="tb ${i === cur ? 'on' : ''}" data-m="${i}">${m.tab}</span>`).join('');
  $('#tabs').querySelectorAll('[data-m]').forEach(b => b.onclick = () => { userAct(); load(+b.dataset.m); });
  $('#tourchip').onclick = startTour;
  ui.querySelectorAll('.pt').forEach(t => t.onclick = () => { if (!synthetic) userAct(); showTab(t.dataset.p); });
}
let rightTab = 'exp';
function showTab(p) { rightTab = p; ui.querySelectorAll('.pt').forEach(t => t.classList.toggle('on', t.dataset.p === p)); buildRight(); }
function buildRight(keep) {
  const b = $('#pbody'); if (!b) return;
  if (rightTab === 'exp') {
    b.innerHTML = '';
    (M.controls || []).forEach(c => {
      if (c.type === 'range') {
        const w = el(`<div class="sl" data-key="${c.key}"><label>${c.label}</label><output></output><input type="range" min="${c.min}" max="${c.max}" step="${c.step}"></div>`), inp = w.querySelector('input'), out = w.querySelector('output');
        const sync = () => { inp.value = M.P[c.key]; out.textContent = c.fmt ? c.fmt(M.P[c.key]) : M.P[c.key]; };
        inp.oninput = () => { M.P[c.key] = +inp.value; out.textContent = c.fmt ? c.fmt(M.P[c.key]) : M.P[c.key]; c.on && c.on(M.P[c.key]); userAct(); };
        w.sync = sync; sync(); b.appendChild(w);
      } else if (c.type === 'chips') {
        const w = el(`<div style="margin-top:9px"><div class="sl" style="margin:0"><label>${c.label}</label></div><div class="grp" style="margin-top:4px" data-key="${c.key}">${c.options.map(([l, v]) => `<span class="tb" data-v="${v}">${l}</span>`).join('')}</div></div>`);
        const sync = () => w.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', String(M.P[c.key]) === x.dataset.v));
        w.querySelectorAll('[data-v]').forEach(x => x.onclick = () => { const v = isNaN(+x.dataset.v) ? x.dataset.v : +x.dataset.v; M.P[c.key] = v; sync(); c.on && c.on(v); userAct(); });
        w.sync = sync; sync(); b.appendChild(w);
      } else if (c.type === 'buttons') {
        const w = el(`<div class="grp" style="margin-top:10px">${c.items.map(([l], i) => `<span class="tb ${i === 0 && c.primary ? 'acc' : ''}" data-i="${i}" data-key="${c.key || ''}${i}">${l}</span>`).join('')}</div>`);
        w.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { c.items[+x.dataset.i][1](); userAct(); syncControls(); });
        b.appendChild(w);
      } else if (c.type === 'note') b.appendChild(el(`<div class="txt mu" style="font-size:11px;margin-top:10px">${c.text}</div>`));
    });
  } else if (rightTab === 'prob') {
    const p = M.problem;
    b.innerHTML = `<div class="txt"><div class="cp" style="margin:6px 0 4px">${p.title}</div><p>${p.text}</p><p class="q">${p.q}</p></div>
      <div class="grp" style="margin-top:8px"><span class="tb acc" id="pLoad">Cargar en la simulación</span><span class="tb" id="pSol">Ver solución</span></div><div class="txt" id="pSteps" hidden><ol>${p.steps.map(s => `<li>${s}</li>`).join('')}</ol><div class="ans">${p.ans}</div></div>`;
    $('#pLoad').onclick = () => { userAct(); p.load(); syncControls(); };
    $('#pSol').onclick = () => { userAct(); $('#pSteps').hidden = !$('#pSteps').hidden; };
  } else {
    const r = M.reto;
    if (!r) { b.innerHTML = `<div class="txt mu" style="margin-top:10px">Este tema no tiene reto propio todavía: prueba el del Problema real cambiando los datos.</div>`; return; }
    b.innerHTML = `<div class="txt"><div class="cp" style="margin:6px 0 4px;color:var(--acc)">★ ${r.title}</div><p>${r.text}</p><p class="q">${r.q}</p></div>
      <div class="grp" style="margin-top:6px"><span class="tb on" id="rSee">1 · Ver la situación</span></div>
      <div style="display:flex;gap:6px;align-items:center;margin-top:8px"><input class="num" id="rIn" type="number" step="any"><span class="cp mu">${r.unit}</span><span class="tb" id="rChk">2 · Comprobar</span></div>
      <div class="fb" id="rFb"></div><div class="grp" style="margin-top:6px"><span class="tb acc" id="rRev">3 · Revelar con la simulación</span></div>
      <div class="txt" id="rSol" hidden><ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol><div class="ans">${r.ans}</div><div class="fb" id="rMeas" style="color:var(--ink)"></div></div>`;
    let watch = null;
    $('#rSee').onclick = () => { userAct(); r.setup(); syncControls(); running = true; syncTime(); clearTimeout(watch); watch = setTimeout(() => { running = false; syncTime(); $('#rFb').className = 'fb'; $('#rFb').textContent = 'Pausado en el momento clave. Resuélvelo y escribe tu respuesta.'; }, r.preview || 1200); };
    $('#rChk').onclick = () => { userAct(); const v = parseFloat($('#rIn').value); if (!isFinite(v)) return; const ok = abs(v - r.answer) <= max(r.tol * abs(r.answer), r.abs || 0); $('#rFb').className = 'fb ' + (ok ? 'ok' : 'no'); $('#rFb').textContent = ok ? '¡Correcto! Compruébalo con la simulación (paso 3).' : 'Todavía no. Pista: ' + r.hint; };
    $('#rRev').onclick = () => { userAct(); $('#rSol').hidden = false; $('#rMeas').textContent = 'Simulando…'; r.reveal && r.reveal(); running = true; syncTime(); const t0 = performance.now(); clearInterval(watch); watch = setInterval(() => { if (r.done() || performance.now() - t0 > 40000) { clearInterval(watch); running = false; syncTime(); $('#rMeas').textContent = 'La simulación mide: ' + r.measured(); } }, 40); };
  }
}
function syncControls() { if (rightTab === 'exp') $('#pbody').querySelectorAll('[data-key]').forEach(w => (w.sync || (w.parentElement && w.parentElement.sync)) && (w.sync ? w.sync() : w.parentElement.sync())); syncOverlays(); }
function buildBottom() {
  const views = Object.keys(M.views), ovs = M.overlays || [];
  $('#pBot').innerHTML = `
    <div><div class="cp mu" style="font-size:8.4px;margin-bottom:5px">Vista</div><div class="grp" style="flex-wrap:nowrap">${views.map(v => `<span class="tb" data-view="${v}">${M.views[v].label || v}</span>`).join('')}</div></div>
    <div><div class="cp mu" style="font-size:8.4px;margin-bottom:5px">Mostrar</div><div class="grp" style="flex-wrap:nowrap">${ovs.map(o => `<span class="tb" data-ov="${o.key}">${o.label}</span>`).join('')}</div></div>
    <div style="margin-left:auto"><div class="cp mu" style="font-size:8.4px;margin-bottom:5px">Tiempo</div><div class="grp" style="flex-wrap:nowrap"><span class="tb" id="bPlay"></span><span class="tb" id="bReset">Reiniciar</span><span class="tb" data-ts="0.25">×¼</span><span class="tb" data-ts="1">×1</span></div></div>`;
  $('#pBot').querySelectorAll('[data-view]').forEach(b => b.onclick = () => { userAct(); setView(b.dataset.view); });
  $('#pBot').querySelectorAll('[data-ov]').forEach(b => b.onclick = () => { userAct(); overlays[b.dataset.ov] = !overlays[b.dataset.ov]; syncOverlays(); M.onOverlay && M.onOverlay(); });
  $('#bPlay').onclick = () => { userAct(); running = !running; syncTime(); };
  $('#bReset').onclick = () => { userAct(); M.reset(); running = true; syncTime(); };
  $('#pBot').querySelectorAll('[data-ts]').forEach(b => b.onclick = () => { userAct(); timeScale = +b.dataset.ts; syncTime(); });
  syncTime(); syncOverlays();
}
function syncTime() { const b = $('#bPlay'); if (!b) return; b.textContent = running ? '❚❚ Pausa' : '▶ Seguir'; b.classList.toggle('acc', !running); $('#pBot').querySelectorAll('[data-ts]').forEach(x => x.classList.toggle('on', +x.dataset.ts === timeScale)); }
function syncOverlays() { $('#pBot') && $('#pBot').querySelectorAll('[data-ov]').forEach(b => b.classList.toggle('on', !!overlays[b.dataset.ov])); }
function setView(v, dur) { viewName = v; goView(M.views[v], dur); $('#pBot').querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v)); buildCalls(); }

/* readouts + chart */
let chartCv = null, hist = [];
function buildRead() {
  const R = M.readouts || [], ch = M.chart;
  $('#pRead').innerHTML = `<div class="hd"><span class="cp">${M.readTitle || 'Lecturas'}</span><span class="cp mu">${M.readTag || ''}</span></div><div class="rows">${R.map((r, i) => `<div class="r ${r.big ? 'big' : ''} ${r.acc ? 'acc' : ''}"><span>${r.label}</span><b id="ro${i}"></b></div>`).join('')}</div>` +
    (M.bars ? `<div class="cp mu" style="padding:10px 12px 2px;font-size:8.4px">${M.bars.title}</div>${M.bars.items.map((b, i) => `<div style="display:grid;grid-template-columns:78px 1fr 58px;gap:6px;align-items:center;padding:2px 12px;font-size:9px;font-weight:600;letter-spacing:.8px;text-transform:uppercase"><span class="mu">${b.label}</span><div style="height:10px;background:#eef0f2;position:relative"><i id="bar${i}" style="position:absolute;top:0;bottom:0;left:50%;background:${b.color}"></i><i style="position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#c9ccd0"></i></div><b id="barv${i}" style="text-align:right;font-size:10.5px;letter-spacing:0"></b></div>`).join('')}` : '') +
    (ch ? `<div class="cp mu" style="padding:10px 12px 0;font-size:8.4px">${ch.title}</div><div class="legend">${ch.series.map(s => `<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div><canvas class="ch" id="chart"></canvas>` : '');
  hist = [];
  if (ch) { chartCv = $('#chart'); const used = 46 + R.length * 27 + 40 + (M.bars ? 22 + M.bars.items.length * 14 : 0), h = max(60, 392 - used - 12); chartCv.style.height = h + 'px'; const r = 2; chartCv.width = 276 * r; chartCv.height = h * r; chartCv.getContext('2d').setTransform(r, 0, 0, r, 0, 0); } else chartCv = null;
}
function updateRead() { (M.readouts || []).forEach((r, i) => { const e = document.getElementById('ro' + i); if (e) { const v = r.get(); e.innerHTML = v; } });
  if (M.bars) { const mx = max(1e-9, M.bars.max ? M.bars.max() : max(...M.bars.items.map(b => abs(b.get())))); M.bars.items.forEach((b, i) => { const v = b.get(), e = document.getElementById('bar' + i), t = document.getElementById('barv' + i); if (!e) return; const f = max(-1, min(1, v / mx)) * 50; e.style.left = (f < 0 ? 50 + f : 50) + '%'; e.style.width = abs(f) + '%'; t.textContent = fx(v, b.dec !== undefined ? b.dec : 1) + (b.unit || ''); }); } }
function drawChart() {
  if (!chartCv || !M.chart) return; const ch = M.chart, g = chartCv.getContext('2d'), W = 276, H = chartCv.clientHeight; g.clearRect(0, 0, W, H);
  if (ch.xy) return drawXY(ch, g, W, H);
  if (!hist.length) return;
  const span = ch.span || 8, t1 = hist[hist.length - 1][0], t0 = ch.xFrom0 ? 0 : max(0, t1 - span), tx = ch.xFrom0 ? max(span, t1) : t0 + span;
  let lo = ch.min !== undefined ? ch.min : Infinity, hi = ch.max !== undefined ? ch.max : -Infinity;
  if (ch.min === undefined || ch.max === undefined) hist.forEach(p => p[1].forEach(v => { if (isFinite(v)) { if (ch.min === undefined) lo = min(lo, v); if (ch.max === undefined) hi = max(hi, v); } }));
  if (ch.min === undefined) lo = min(lo, 0); if (!(hi > lo)) hi = lo + 1; const pad = (hi - lo) * 0.08; if (ch.max === undefined) hi += pad;
  const X = t => (t - t0) / (tx - t0) * W, Y = v => H - 12 - (v - lo) / (hi - lo) * (H - 20);
  g.strokeStyle = COL.line; g.lineWidth = 1; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke();
  (ch.refs || []).forEach(rf => { const v = typeof rf.v === 'function' ? rf.v() : rf.v; g.strokeStyle = rf.color || COL.mute; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(0, Y(v)); g.lineTo(W, Y(v)); g.stroke(); g.setLineDash([]); g.fillStyle = rf.color || COL.mute; g.font = '600 8.4px Inter'; g.fillText(rf.label, 4, Y(v) - 3); });
  ch.series.forEach((s, k) => { g.strokeStyle = s.color; g.lineWidth = s.w || 1.6; g.beginPath(); let st = false; hist.forEach(p => { if (p[0] < t0) return; const v = p[1][k]; if (!isFinite(v)) return; const x = X(p[0]), y = Y(v); st ? g.lineTo(x, y) : g.moveTo(x, y); st = true; }); g.stroke(); });
  g.fillStyle = COL.mute; g.font = '600 8.4px Inter'; g.fillText(`${fx(hi, ch.dec !== undefined ? ch.dec : 1)} ${ch.unit || ''}`, W - 60, 9); g.fillText(ch.xLabel || 't (s)', W - 30, H - 2);
}

function drawXY(ch, g, W, H) {
  const xr = typeof ch.xr === 'function' ? ch.xr() : ch.xr, yr = typeof ch.yr === 'function' ? ch.yr() : ch.yr;
  const X = x => (x - xr[0]) / (xr[1] - xr[0]) * W, Y = v => H - 12 - (v - yr[0]) / (yr[1] - yr[0]) * (H - 20);
  g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
  g.strokeStyle = COL.line; g.lineWidth = 1; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.stroke();
  if (ch.curve) { const cs = ch.curveColors || [COL.mute]; const N = 160; cs.forEach((c, k) => { g.strokeStyle = c; g.lineWidth = 1.4; g.setLineDash(ch.curveDash ? [4, 3] : []); g.beginPath(); for (let i = 0; i <= N; i++) { const x = xr[0] + (xr[1] - xr[0]) * i / N, y = ch.curve(x)[k]; i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); } g.stroke(); g.setLineDash([]); }); }
  if (ch.fill) { const f = ch.fill(); if (f) { g.fillStyle = f.color || 'rgba(240,90,35,.22)'; g.beginPath(); const N = 80; g.moveTo(X(f.a), Y(0)); for (let i = 0; i <= N; i++) { const x = f.a + (f.b - f.a) * i / N; g.lineTo(X(x), Y(f.y(x))); } g.lineTo(X(f.b), Y(0)); g.closePath(); g.fill(); } }
  (ch.hlines || []).forEach(hl => { const v = hl.v(); if (!isFinite(v)) return; g.strokeStyle = hl.color; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(0, Y(v)); g.lineTo(W, Y(v)); g.stroke(); g.setLineDash([]); g.fillStyle = hl.color; g.font = '600 8.4px Inter'; g.fillText(hl.label, 4, Y(v) - 3); });
  ch.series.forEach((s, k) => { if (s.noTrace) return; g.strokeStyle = s.color; g.lineWidth = s.w || 1.8; g.beginPath(); let st = false; hist.forEach(p => { const v = p[1][k]; if (!isFinite(v)) return; st ? g.lineTo(X(p[0]), Y(v)) : g.moveTo(X(p[0]), Y(v)); st = true; }); g.stroke(); });
  if (ch.marker) { const m = ch.marker(); if (m) { g.fillStyle = COL.acc; g.beginPath(); g.arc(X(m[0]), Y(m[1]), 4.5, 0, TAU); g.fill(); } }
  g.restore(); g.fillStyle = COL.mute; g.font = '600 8.4px Inter'; g.fillText(`${fx(yr[1], ch.dec !== undefined ? ch.dec : 1)} ${ch.unit || ''}`, W - 64, 9); g.fillText(ch.xLabel || 'x', W - 40, H - 2);
}
/* callouts */
let callEls = [];
function buildCalls() { const c = $('#calls'); if (!c) return; c.innerHTML = ''; callEls = ((M.calls && M.calls[viewName]) || []).map(([fn, b, s, side]) => { const d = el(`<div class="call"><b>${b}</b><span>${s}</span></div>`); c.appendChild(d); return {fn, d, side}; }); }
function updateCalls() {
  let paths = '';
  callEls.forEach((c, i) => { const w = c.fn(); if (!w) { c.d.style.display = 'none'; return; } c.d.style.display = ''; const p = project(w); const lx = c.side < 0 ? max(400, p.x - 170) : min(1200, p.x + 160), ly = min(770, max(170, p.y - 50 + i * 14)); c.d.style.left = (c.side < 0 ? lx - c.d.offsetWidth - 8 : lx + 8) + 'px'; c.d.style.top = (ly - 14) + 'px'; paths += `<path d="M${p.x},${p.y} L${lx},${ly}"/><circle cx="${p.x}" cy="${p.y}" r="2.6"/>`; });
  const sv = $('#leaders'); if (sv) sv.innerHTML = paths;
}
function updateVecLabels() { (M.vectors || []).forEach(v => { if (!v.shown || !v.group.visible) { v.label.style.display = 'none'; return; } const p = project(v.tip); if (p.z > 1) { v.label.style.display = 'none'; return; } v.label.style.display = ''; v.label.style.left = p.x + 'px'; v.label.style.top = p.y + 'px'; v.label.innerHTML = v.text; }); }

/* ---------------- machine loading ---------------- */
function load(i) {
  if (M) { scene.remove(M.group); M.dispose && M.dispose(); }
  cur = i; const def = CFG.machines[i];
  buildConsole();
  M = def.build(K); M.vectors = M.vectors || []; M.vectors.forEach(v => M.group.add(v.group)); scene.add(M.group);
  overlays = {}; (M.overlays || []).forEach(o => overlays[o.key] = !!o.on);
  $('#kk').textContent = def.kicker; $('#tt').textContent = def.title; $('#ss').textContent = def.specs || '';
  $('#notes').innerHTML = def.notes || ''; $('#nTag').textContent = def.noteTag || '';
  floorTint.visible = M.floor !== false; ground.visible = M.floor !== false;
  rightTab = 'exp'; ui.querySelectorAll('.pt').forEach(t => t.classList.toggle('on', t.dataset.p === 'exp'));
  buildRead(); buildRight(); buildBottom(); running = true; timeScale = 1; syncTime();
  setView(M.defaultView || Object.keys(M.views)[0], 0); placeCamera();
  M.reset && M.reset();
  if (touring) startTour(true);
  try { history.replaceState(null, '', '#' + def.id); } catch (e) {}
}

/* ---------------- orbit, zoom ---------------- */
let drag = null, pinch = null;
canvas.addEventListener('pointerdown', e => { if (M && M.pick && M.pick(e, 'down')) { userAct(); return; } drag = {x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch}; canvas.setPointerCapture(e.pointerId); camK = 1; userAct(); });
canvas.addEventListener('pointermove', e => { if (M && M.pick && M.pick(e, 'move')) return; if (!drag || pinch) return; cam.yaw = drag.yaw - (e.clientX - drag.x) * 0.006; cam.pitch = min(1.45, max(-0.3, drag.pitch + (e.clientY - drag.y) * 0.004)); });
canvas.addEventListener('pointerup', e => { M && M.pick && M.pick(e, 'up'); drag = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); camK = 1; cam.d = min(200, max(0.3, cam.d * Math.exp(e.deltaY * 0.0012))); userAct(); }, {passive: false});
canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = {d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), cd: cam.d}; }, {passive: true});
canvas.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); cam.d = min(200, max(0.3, pinch.cd * pinch.d / d)); } }, {passive: true});
canvas.addEventListener('touchend', () => pinch = null);
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.key === ' ') { e.preventDefault(); running = !running; syncTime(); } userAct(); });

/* ---------------- auto tour ---------------- */
let tourT = 0, tourI = -1, curPos = {x: 800, y: 600}, curFrom = null, curTo = null, curK = 1, curDur = 0.9, pend = null, dragAnim = null;
const uiPoint = (elm, f) => { const r = elm.getBoundingClientRect(), u = ui.getBoundingClientRect(), s = fitUI(); return {x: (r.left - u.left) / s + (f !== undefined ? f * r.width / s : r.width / s / 2), y: (r.top - u.top + r.height / 2) / s}; };
function findTarget(st) {
  if (st.sel) return $(st.sel);
  if (st.view) return $(`[data-view="${st.view}"]`); if (st.ov) return $(`[data-ov="${st.ov}"]`); if (st.tab) return $(`.pt[data-p="${st.tab}"]`);
  if (st.key !== undefined) { const w = $(`#pbody [data-key="${st.key}"]`); if (!w) return null; return w.querySelector('input') || (st.val !== undefined && w.querySelector(`[data-v="${st.val}"]`)) || w; }
  if (st.sel) return $(st.sel); return null;
}
function moveCursor(to, dur = 0.9) { curFrom = {...curPos}; curTo = to; curK = 0; curDur = dur; }
function pulse() { const r = $('#ripple'); if (!r) return; r.style.left = curPos.x + 'px'; r.style.top = curPos.y + 'px'; r.classList.remove('go'); void r.offsetWidth; r.classList.add('go'); }
function tourStep(dt) {
  const T = M.tour || []; tourT += dt; const nx = T[tourI + 1];
  if (!nx) { if (tourT > (T.length ? T[T.length - 1].at + 8 : 10)) { const nxt = (cur + 1) % CFG.machines.length; load(nxt); } return; }
  if (!pend && tourT >= nx.at - 1.0) { pend = nx; if (nx.tab && rightTab !== nx.tab) showTab(nx.tab); const t = findTarget(nx); if (t) { if (t.tagName === 'INPUT') { const f = (+t.value - +t.min) / (+t.max - +t.min); moveCursor(uiPoint(t, f)); } else moveCursor(uiPoint(t)); } }
  if (tourT >= nx.at) {
    tourI++; pend = null; synthetic = true;
    const t = findTarget(nx);
    if (t && t.tagName === 'INPUT' && nx.to !== undefined) { const v0 = +t.value; const f1 = (nx.to - +t.min) / (+t.max - +t.min); moveCursor(uiPoint(t, f1), 1.4); dragAnim = {t, v0, v1: nx.to, k: 0}; }
    else { pulse(); if (nx.view) setView(nx.view); else if (nx.ov) { overlays[nx.ov] = nx.on !== undefined ? nx.on : !overlays[nx.ov]; syncOverlays(); M.onOverlay && M.onOverlay(); } else if (t && nx.click !== false && t.click) t.click(); nx.do && nx.do(); }
    synthetic = false;
  }
}
function startTour(keepMachine) { touring = true; idle = 0; tourT = 0; tourI = -1; pend = null; const c = $('#cursor'); if (c) c.style.opacity = 1; const ch = $('#tourchip'); if (ch) { ch.classList.add('on'); ch.querySelector('span').textContent = 'TOUR AUTOMÁTICO · TOCA PARA TOMAR EL CONTROL'; } }
function userAct() { if (synthetic) return; idle = 0; if (touring) { touring = false; dragAnim = null; const c = $('#cursor'); if (c) c.style.opacity = 0; const ch = $('#tourchip'); if (ch) ch.classList.remove('on'); } }

/* ---------------- loop ---------------- */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = min(0.05, (now - last) / 1000); last = now;
  if (!M) return;
  if (running) { const h = dt * timeScale; M.update(h); if (M.sample) { const s = M.sample(); if (s) { hist.push([s[0], s[1]]); const span = (M.chart && M.chart.span) || 8; if (!(M.chart && (M.chart.xFrom0 || M.chart.xy))) while (hist.length && hist[hist.length - 1][0] - hist[0][0] > span + 0.5) hist.shift(); if (hist.length > 1200) hist = hist.filter((_, i) => i % 2 === 0); } } }
  M.pose && M.pose();
  if (camK < 1 && camTo) { camK = min(1, camK + dt / camDur); const k = ease(camK); cam.t.lerpVectors(camFrom.t, camTo.t, k); cam.yaw = camFrom.yaw + (camTo.yaw - camFrom.yaw) * k; cam.pitch = camFrom.pitch + (camTo.pitch - camFrom.pitch) * k; cam.d = camFrom.d + (camTo.d - camFrom.d) * k; }
  else if (touring) cam.yaw += dt * 0.02 * sin(now / 9000);
  placeCamera(M.follow ? M.follow() : null);
  if (touring) tourStep(dt); else { idle += dt; const ch = $('#tourchip'); if (idle > 25) startTour(); else if (ch) ch.querySelector('span').textContent = `TÚ TIENES EL CONTROL · TOUR EN ${Math.ceil(25 - idle)} s`; }
  if (curK < 1) { curK = min(1, curK + dt / curDur); const k = 1 - Math.pow(1 - curK, 3); curPos = {x: curFrom.x + (curTo.x - curFrom.x) * k, y: curFrom.y + (curTo.y - curFrom.y) * k}; const c = $('#cursor'); if (c) c.style.transform = `translate(${curPos.x}px,${curPos.y}px)`; }
  if (dragAnim) { dragAnim.k = min(1, dragAnim.k + dt / 1.4); dragAnim.t.value = dragAnim.v0 + (dragAnim.v1 - dragAnim.v0) * ease(dragAnim.k); synthetic = true; dragAnim.t.oninput(); synthetic = false; if (dragAnim.k >= 1) dragAnim = null; }
  renderer.render(scene, camera);
  fitUI(); tick++;
  if (tick % 5 === 0) updateRead(); if (tick % 2 === 0) drawChart();
  updateCalls(); updateVecLabels();
}
function resize() { renderer.setPixelRatio(min(devicePixelRatio || 1, 1.6)); renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); fitUI(); }
addEventListener('resize', resize);

function start(cfg) {
  CFG = cfg; resize();
  const h = location.hash.slice(1), i = cfg.machines.findIndex(m => m.id === h);
  load(i >= 0 ? i : 0);
  requestAnimationFrame(frame);
}
return {start, K, load: i => load(i), get M() { return M; }, setView, snap() { if (camTo) Object.assign(cam, {t: camTo.t.clone(), yaw: camTo.yaw, pitch: camTo.pitch, d: camTo.d}); camK = 1; }, stopTour: () => { synthetic = false; userAct(); }, showTab, overlays: () => overlays, set: (k, v) => { overlays[k] = v; syncOverlays(); }};
})();
