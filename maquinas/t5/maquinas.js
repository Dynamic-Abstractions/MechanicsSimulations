/* Tema 5 · Dinámica de la rotación — seven teardown machines. */
(() => {
const {PI, sin, cos, abs, sqrt, min, max, atan2, hypot} = Math, D = PI / 180, TAU = 2 * PI, g0 = 9.8;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const F = {W: '#16181b', T: '#3d8fe0', N: '#7048e8', f: '#2f9e44', S: '#f05a23', v: '#0ca678', tau: '#f05a23', L: '#7048e8', w: '#3d8fe0', Kt: '#3d8fe0', Kr: '#f05a23', U: '#16181b'};
const legend = items => `<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin:8px 0 2px;font-size:10.5px;font-weight:600">${items.map(([c, t]) => `<span><i style="display:inline-block;width:12px;height:3px;background:${c};vertical-align:middle;margin-right:4px"></i>${t}</span>`).join('')}</div>`;
const N1 = (v, d = 1) => TD.K.fx(v, d);
const KICK = n => `Teardown · Tema 5 · Dinámica de la rotación · ${n}`;
function wedge(K, L, th, depth, mat) { const c = cos(th), s = sin(th), sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-L * c, 0); sh.lineTo(-L * c, L * s); sh.lineTo(0, 0); const geo = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled: false}); geo.translate(0, 0, -depth / 2); return K.mesh(geo, mat); }

/* ======================= 5.1 · Energía cinética de rotación: la carrera ======================= */
const carrera = {id: 'energia-rotacion', tab: '5.1 K de rotación', kicker: KICK('5.1'), title: 'Energía cinética de rotación · la carrera en la rampa', specs: 'Rampa de 6 m · caja, bola de boliche, rollo de cinta y rueda de bicicleta', noteTag: 'K = ½Mv² + ½Iω²',
  notes: `<div class="eq">K = ½ M v_cm² + ½ I ω² · v_cm = ω R al rodar</div><p>Un cuerpo que rueda reparte su energía entre traslación y rotación. Con I = c M R², la energía potencial m g h se reparte y <b>a = g sin θ / (1 + c)</b>: cuanto mayor es c, más energía «se va» a girar y más lento baja.</p>
    <ul><li>La caja (desliza sin fricción) gana siempre: no gasta energía en girar.</li><li>El orden no depende de la masa ni del radio, solo de c.</li><li>Las barras muestran el reparto de energía del objeto seleccionado.</li></ul>${legend([[F.Kt, 'K traslación'], [F.Kr, 'K rotación'], [F.U, 'U = m g h']])}`,
  build(K) {
    const g = new THREE.Group(), P = {th: 15, sel: 1}, L = 6, depth = 2.2;
    const OBJ = [{n: 'Caja', c: 0, R: 0.2, col: 0xc8a165}, {n: 'Bola de boliche', c: 0.4, R: 0.11, col: 0x16181b}, {n: 'Rollo de cinta', c: 0.5, R: 0.13, col: 0x868e96}, {n: 'Rueda de bicicleta', c: 1, R: 0.33, col: 0xadb5bd}];
    let wd = null; const wg = new THREE.Group(); g.add(wg);
    const meshes = OBJ.map((o, i) => { let m; if (i === 0) m = K.box(0.35, 0.3, 0.35, K.MAT.tex('cardboard', [1, 1], 0.8), 0.01); else if (i === 1) { m = K.sph(o.R, K.MAT.plastic(0x16181b, 0.15), 24); } else if (i === 2) { m = new THREE.Group(); const t = K.mesh(new THREE.TorusGeometry(o.R * 0.75, o.R * 0.25, 12, 32), K.MAT.plastic(0x868e96, 0.5)); m.add(t); const s = K.mesh(new THREE.CylinderGeometry(o.R * 0.5, o.R * 0.5, 0.1, 24, 1, true), K.MAT.std(0xc8a165, 0.8)); s.rotation.x = PI / 2; m.add(s); } else { m = new THREE.Group(); m.add(K.mesh(new THREE.TorusGeometry(o.R, 0.022, 10, 48), K.MAT.rubber())); m.add(K.mesh(new THREE.TorusGeometry(o.R - 0.025, 0.012, 8, 48), K.MAT.metal())); for (let k = 0; k < 16; k++) { const sp = K.cyl(0.003, 0.003, (o.R - 0.03) * 2, K.MAT.metal(), 4); sp.rotation.z = k * PI / 16; m.add(sp); } } g.add(m); return m; });
    const S = {t: 0, q: [0, 0, 0, 0], v: [0, 0, 0, 0], fin: [null, null, null, null], go: false, hold: 1};
    const th = () => P.th * D;
    function rebuild() { if (wd) wg.remove(wd); wd = wedge(K, L + 0.6, th(), depth, K.MAT.tex('wood', [1.5, 1], 0.6)); wd.position.x = (L + 0.6) * cos(th()) / 2; wg.add(wd); P.bk = P.th; }
    const lanes = [-0.8, -0.27, 0.27, 0.8];
    const pos = (q, h, i) => { const c = cos(th()), s = sin(th()), sTop = L + 0.3; const d = sTop - q; return V3((L + 0.6) * c / 2 - d * c + s * h, d * s + c * h, lanes[i]); };
    const acc = i => g0 * sin(th()) / (1 + OBJ[i].c);
    const M = {group: g, P,
      defaultView: 'tres', views: {lado: {label: 'Lado', t: [0, 0.9, 0], yaw: 0, pitch: 0.06, d: 11}, tres: {label: '3/4', t: [0, 0.8, 0], yaw: -0.55, pitch: 0.3, d: 11}, meta: {label: 'Meta', t: [2.6, 0.3, 0], yaw: 1.1, pitch: 0.15, d: 4.5}},
      overlays: [],
      readouts: OBJ.map((o, i) => ({label: `${o.n} · c = ${o.c}`, get: () => S.fin[i] !== null ? N1(S.fin[i], 2) + ' s ✓' : `${N1(S.q[i], 2)} m`, big: i === P.sel})).concat([{label: 'Tiempo', get: () => N1(S.t, 2) + ' s', acc: 1}]),
      bars: {title: 'Reparto de energía del objeto seleccionado (J por kg)', max: () => g0 * L * sin(th()), items: [{label: 'U (altura)', color: F.U, get: () => g0 * (L - S.q[P.sel]) * sin(th())}, {label: 'K trasl.', color: F.Kt, get: () => 0.5 * S.v[P.sel] ** 2}, {label: 'K rot.', color: F.Kr, get: () => 0.5 * OBJ[P.sel].c * S.v[P.sel] ** 2}]},
      controls: [{type: 'range', key: 'th', label: 'Ángulo de la rampa', min: 5, max: 35, step: 0.5, fmt: v => v + '°', on: () => M.reset()}, {type: 'chips', key: 'sel', label: 'Ver energía de', options: OBJ.map((o, i) => [o.n.split(' ')[0] + (i === 1 ? ' boliche' : i === 2 ? ' cinta' : i === 3 ? ' bici' : ''), i])}, {type: 'buttons', key: 'b', primary: 1, items: [['¡Arrancan!', () => { M.reset(); S.hold = 0; }]]}],
      calls: {tres: [[() => pos(0.2, 0.4, 3), 'Rueda de bicicleta', 'Toda su masa en la orilla: c = 1', 1], [() => pos(0.2, 0.25, 1), 'Bola de boliche', 'Esfera sólida: c = ⅖', -1]], lado: [], meta: []},
      reset() { S.t = 0; S.q = [0, 0, 0, 0]; S.v = [0, 0, 0, 0]; S.fin = [null, null, null, null]; S.hold = 1; S.stopOn = null; },
      update(dt) { if (P.bk !== P.th) rebuild(); if (S.hold > 0) { S.hold -= dt; return; }
        if (S.stopOn !== null) { const tf = sqrt(2 * L / acc(S.stopOn)); dt = min(dt, tf - S.t); if (dt <= 1e-9) { K.running = false; return; } }
        S.t += dt; OBJ.forEach((o, i) => { if (S.fin[i] !== null) return; S.q[i] = 0.5 * acc(i) * S.t * S.t; S.v[i] = acc(i) * S.t; if (S.q[i] >= L - 1e-9) { S.q[i] = L; S.fin[i] = sqrt(2 * L / acc(i)); } }); },
      pose() { OBJ.forEach((o, i) => { const h = i === 0 ? 0.15 : o.R; meshes[i].position.copy(pos(S.q[i], h, i)); if (i === 0) meshes[i].rotation.z = -th(); else meshes[i].rotation.z = S.q[i] / o.R; }); },
      problem: {title: 'Carrera en la rampa de una bodega', text: 'Por una rampa de 6 m inclinada 15° se sueltan desde el reposo: una bola de boliche (esfera), un rollo de cinta grueso (disco), una rueda de bicicleta (aro) y una caja que desliza sin fricción.', q: '¿En qué orden llegan y cuánto tarda cada uno?',
        steps: ['Al rodar sin deslizar: a = g sin θ / (1 + c), con I = c M R². g sin 15° ≈ 2.54 m/s².', 't = √(2L / a) = √(12 (1 + c) / 2.54).', 'Caja (c = 0): 2.18 s · esfera (⅖): 2.57 s · disco (½): 2.66 s · aro (1): 3.08 s.', 'No dependen de la masa ni del radio: solo de cómo está distribuida la masa.'], ans: 'Caja → bola de boliche → rollo → rueda de bicicleta.', load() { P.th = 15; M.reset(); S.hold = 0; }},
      reto: {title: '¿Cuánta ventaja le saca?', text: 'En la rampa de 6 m inclinada 20°, la bola de boliche (esfera sólida) y la rueda de bicicleta (aro) salen juntas desde el reposo.', q: '¿Cuántos metros le falta recorrer a la rueda cuando la bola llega abajo?', unit: 'm', answer: 6 - 6 * 1.4 / 2, tol: 0.02,
        hint: 'a igual tiempo, las distancias están en la razón de sus aceleraciones: a ∝ 1/(1 + c).', steps: ['a_esfera = g sin θ / 1.4 ; a_aro = g sin θ / 2.', 'Mismo t ⇒ s_aro / s_esfera = 1.4 / 2 = 0.7 ⇒ s_aro = 0.7 × 6 = 4.2 m.', 'Le faltan 6 − 4.2 m. ¡No depende del ángulo!'], ans: '1.8 m',
        setup() { P.th = 20; M.reset(); }, preview: 400, reveal() { M.reset(); S.hold = 0; S.stopOn = 1; }, done: () => S.fin[1] !== null, measured: () => { S.stopOn = null; return `a la rueda le faltan ${N1(L - S.q[3], 2)} m`; }},
      tour: [{at: 0.5, view: 'tres'}, {at: 2, sel: '[data-key="b0"]'}, {at: 9, view: 'meta'}, {at: 13, view: 'lado'}, {at: 15, sel: '[data-key="sel"] [data-v="3"]'}, {at: 16, sel: '[data-key="b0"]'}, {at: 25, sel: '[data-key="sel"] [data-v="1"]'}]
    };
    rebuild();
    return M;
  }
};

/* ======================= 5.2 · Inercia de rotación: la pértiga del equilibrista ======================= */
const pertiga = {id: 'inercia', tab: '5.2 Inercia', kicker: KICK('5.2'), title: 'Inercia de rotación · la pértiga del equilibrista', specs: 'Barra de 2 m (0.5 kg) con dos pesas de 2 kg · torca de desequilibrio', noteTag: 'I = Σ mᵢ rᵢ²',
  notes: `<div class="eq">I = Σ mᵢ rᵢ² · τ = I α · K = ½ I ω²</div><p>La inercia de rotación depende de la masa <b>y de cómo está distribuida</b> respecto al eje. Es el análogo rotacional de la masa (F = m a ↔ τ = I α).</p>
    <ul><li>Como depende de r², alejar las pesas al doble cuadruplica su contribución.</li><li>Con las pesas en los extremos, el mismo desequilibrio hace girar la pértiga mucho más lento: hay tiempo de corregir.</li></ul>${legend([[F.tau, 'Torca τ'], [F.w, 'ω'], [F.T, 'Fuerzas del desequilibrio']])}`,
  build(K) {
    const g = new THREE.Group(), P = {r: 0.9, tau: 4, T: 3};
    const post = K.cyl(0.04, 0.05, 1.2, K.MAT.metal(0x495057), 12); post.position.y = 0.6; g.add(post);
    const rot = new THREE.Group(); rot.position.y = 1.25; g.add(rot);
    const bar = K.cyl(0.015, 0.015, 2, K.MAT.metal(0xc9a24f, 0.4), 12); bar.rotation.z = PI / 2; rot.add(bar);
    const hub = K.cyl(0.05, 0.05, 0.06, K.MAT.metal(), 16); rot.add(hub);
    const wts = [1, -1].map(s => { const w = K.cyl(0.07, 0.07, 0.09, K.MAT.std(0x343a40, 0.35, 0.6), 24); w.rotation.z = PI / 2; rot.add(w); return w; });
    const vt = K.vector(F.tau, 'τ'), vw = K.vector(F.w, 'ω'), vf1 = K.vector(F.T, 'F'), vf2 = K.vector(F.T, 'F');
    const S = {th: 0, w: 0, t: 0, stopT: 0};
    const I = () => (1 / 12) * 0.5 * 4 + 2 * 2 * P.r * P.r;
    const tauNow = () => S.t < P.T ? P.tau : 0;
    const M = {group: g, P, vectors: [vt, vw, vf1, vf2],
      views: {tres: {label: '3/4', t: [0, 1.15, 0], yaw: -0.5, pitch: 0.45, d: 4.5}, arriba: {label: 'Arriba', t: [0, 1.25, 0], yaw: 0, pitch: 1.5, d: 4}},
      overlays: [{key: 'v', label: 'Vectores', on: true}],
      readouts: [{label: 'I = I_barra + 2 m r²', get: () => N1(I(), 2) + ' kg·m²', big: 1}, {label: 'Torca τ', get: () => N1(tauNow(), 1) + ' N·m'}, {label: 'α = τ / I', get: () => N1(tauNow() / I(), 2) + ' rad/s²'}, {label: 'ω', get: () => N1(S.w, 2) + ' rad/s', acc: 1, big: 1}, {label: 'K = ½ I ω²', get: () => N1(0.5 * I() * S.w * S.w, 1) + ' J'}, {label: 'Tiempo', get: () => N1(S.t, 2) + ' s'}],
      chart: {title: 'Rapidez angular ω(t)', series: [{label: 'ω', color: F.w}], unit: 'rad/s', span: 8, xFrom0: true},
      sample: () => [S.t, [S.w]],
      controls: [{type: 'range', key: 'r', label: 'Distancia de las pesas al eje', min: 0.1, max: 0.95, step: 0.01, fmt: v => v.toFixed(2) + ' m', on: () => M.reset()}, {type: 'range', key: 'tau', label: 'Torca de desequilibrio', min: 0, max: 10, step: 0.1, fmt: v => v.toFixed(1) + ' N·m'}, {type: 'range', key: 'T', label: 'Duración de la torca', min: 0.5, max: 6, step: 0.1, fmt: v => v.toFixed(1) + ' s'}, {type: 'buttons', key: 'b', primary: 1, items: [['Reiniciar (ω = 0)', () => M.reset()], ['Pesas en los extremos', () => { P.r = 0.9; M.reset(); }], ['Pesas al centro', () => { P.r = 0.3; M.reset(); }]]}],
      calls: {tres: [[() => rot.localToWorld(V3(P.r, 0, 0)), 'Pesa de 2 kg', 'Aporta m r²', 1]], arriba: []},
      reset() { S.th = 0; S.w = 0; S.t = 0; S.stopT = 0; K.clearChart(); },
      update(dt) { if (S.stopT) { dt = min(dt, S.stopT - S.t); if (dt <= 1e-9) { K.running = false; return; } } const n = 20, h = dt / n; for (let i = 0; i < n; i++) { S.w += tauNow() / I() * h; S.th += S.w * h; S.t += h; } },
      pose() { rot.rotation.y = S.th; wts[0].position.x = P.r; wts[1].position.x = -P.r;
        if (K.ov('v')) { tauNow() > 0 ? vt.set(V3(0, 1.32, 0), V3(0, tauNow(), 0), 0.08, `τ<small>${N1(tauNow(), 1)} N·m</small>`) : vt.hide(); abs(S.w) > 0.02 ? vw.set(V3(0.06, 1.32, 0.06), V3(0, S.w, 0), 0.05, `ω<small>${N1(S.w, 2)}</small>`) : vw.hide();
          if (tauNow() > 0) { const Fm = tauNow() / 2 / 0.95; const e1 = rot.localToWorld(V3(0.95, 0, 0)), e2 = rot.localToWorld(V3(-0.95, 0, 0)); const t1 = V3(-sin(S.th), 0, -cos(S.th)); vf1.set(e1, t1.clone().multiplyScalar(Fm), 0.15); vf2.set(e2, t1.clone().multiplyScalar(-Fm), 0.15); } else { vf1.hide(); vf2.hide(); } } else [vt, vw, vf1, vf2].forEach(v => v.hide()); },
      problem: {title: 'La pértiga del equilibrista', text: 'Un equilibrista usa una pértiga: barra de 2 m (0.5 kg) con dos masas de 2 kg. Se compara tenerlas en los extremos (r = 0.9 m) contra cerca del centro (r = 0.3 m), si una torca de 4 N·m actúa 3 s.', q: '¿Cuál es I en cada caso y qué ω alcanza la pértiga? ¿Por qué ayudan las pesas en los extremos?',
        steps: ['I = (1/12)(0.5)(2²) + 2 × 2 × r².', 'r = 0.9 m: I ≈ 0.17 + 3.24 = 3.41 kg·m². r = 0.3 m: I ≈ 0.17 + 0.36 = 0.53 kg·m².', 'ω = (τ / I) t = 12 / I: ≈ 3.5 rad/s contra ≈ 22.8 rad/s.', 'Mayor I ⇒ el mismo desequilibrio produce un giro mucho más lento.'], ans: 'I ≈ 3.41 contra 0.53 kg·m²; ω ≈ 3.5 contra 22.8 rad/s.', load() { P.r = 0.9; P.tau = 4; P.T = 3; M.reset(); }},
      reto: {title: 'Pesas a 60 cm', text: 'La misma pértiga (barra de 0.5 kg y 2 m, pesas de 2 kg) con las pesas a 0.6 m del eje. Una torca de 4 N·m actúa durante 3 s desde el reposo.', q: '¿Qué ω alcanza la pértiga?', unit: 'rad/s', answer: 12 / ((1 / 12) * 0.5 * 4 + 4 * 0.36), tol: 0.02,
        hint: 'calcula I = I_barra + 2 m r²; luego ω = (τ / I) t.', steps: ['I = 0.167 + 4 × 0.36 = 1.607 kg·m².', 'α = 4 / 1.607 ≈ 2.49 rad/s².', 'ω = 2.49 × 3 ≈ 7.47 rad/s.'], ans: 'ω ≈ 7.47 rad/s',
        setup() { P.r = 0.6; P.tau = 4; P.T = 3; M.reset(); S.t = 99; }, preview: 300, reveal() { M.reset(); S.stopT = 3; }, done: () => S.t >= 3 - 1e-9, measured: () => { S.stopT = 0; return `ω(3 s) = ${N1(S.w, 2)} rad/s`; }},
      tour: [{at: 0.5, view: 'tres'}, {at: 6, sel: '[data-key="b2"]'}, {at: 14, view: 'arriba'}, {at: 16, sel: '[data-key="b1"]'}]
    };
    return M;
  }
};

/* ======================= 5.3 · Inercia de cuerpos sólidos: volante y ejes paralelos ======================= */
const solidos = {id: 'cuerpos-solidos', tab: '5.3 Cuerpos sólidos', kicker: KICK('5.3'), title: 'Inercia de cuerpos sólidos · el volante y los ejes paralelos', specs: 'Cuerpos de 10 kg · torca del motor de arranque · eje desplazable d', noteTag: 'I = I_cm + M d²',
  notes: `<p>Para un cuerpo continuo, I = ∫ r² dm. Con eje por el centro de masa:</p><div class="eq">aro: M R² · disco: ½ M R² · esfera: ⅖ M R² · esfera hueca: ⅔ M R² · varilla: (1/12) M L²</div>
    <p>Si el eje está a una distancia d del CM (y paralelo): <b>I = I_cm + M d²</b> (teorema de Steiner).</p><ul><li>Misma masa, misma torca: el aro acelera la mitad que el disco.</li><li>Mueve el eje fuera del centro: I crece con d² y el giro es más lento.</li></ul>${legend([[F.tau, 'Torca τ'], [F.w, 'ω']])}`,
  build(K) {
    const g = new THREE.Group(), P = {shape: 'disco', M: 10, R: 0.5, d: 0, tau: 5};
    const SH = {disco: ['Disco', 0.5], aro: ['Aro', 1], esfera: ['Esfera sólida', 0.4], hueca: ['Esfera hueca', 2 / 3], varilla: ['Varilla (L = 2R)', 1 / 3]};
    const axis = K.cyl(0.02, 0.02, 1.6, K.MAT.metal(0x495057), 10); axis.position.y = 0.8; g.add(axis);
    const motor = K.box(0.4, 0.3, 0.4, K.MAT.std(0x343a40, 0.5), 0.04); motor.position.y = 0.15; g.add(motor);
    const rot = new THREE.Group(); rot.position.y = 1.0; g.add(rot);
    let body = null;
    function build() { if (body) rot.remove(body); const R = P.R; if (P.shape === 'disco') body = K.cyl(R, R, 0.08, K.MAT.metal(0x868e96, 0.35), 64); else if (P.shape === 'aro') { body = K.mesh(new THREE.TorusGeometry(R, 0.04, 16, 64), K.MAT.metal(0x868e96, 0.35)); body.rotation.x = PI / 2; } else if (P.shape === 'esfera') body = K.sph(R, K.MAT.metal(0x868e96, 0.35), 40); else if (P.shape === 'hueca') body = K.sph(R, new THREE.MeshStandardMaterial({color: 0x868e96, metalness: 1, roughness: 0.3, transparent: true, opacity: 0.55}), 40); else { body = K.box(2 * R, 0.06, 0.06, K.MAT.metal(0x868e96, 0.35), 0.02); }
      const mk = K.box(0.06, 0.1, 0.06, new THREE.MeshStandardMaterial({color: 0xf05a23, emissive: 0xf05a23, emissiveIntensity: 0.4})); mk.position.set(P.shape === 'varilla' ? R : R * 0.92, P.shape === 'esfera' || P.shape === 'hueca' ? 0 : 0.06, 0); const grp = new THREE.Group(); grp.add(body, mk); body = grp; body.position.x = -P.d; rot.add(body); P.bk = P.shape + P.R + P.d; }
    const Icm = () => SH[P.shape][1] * P.M * P.R * P.R * (P.shape === 'varilla' ? 4 / 4 : 1) * (P.shape === 'varilla' ? 1 / 1 : 1);
    const Ivar = () => P.shape === 'varilla' ? (1 / 12) * P.M * (2 * P.R) ** 2 : Icm();
    const I = () => Ivar() + P.M * P.d * P.d;
    const vt = K.vector(F.tau, 'τ'), vw = K.vector(F.w, 'ω');
    const S = {th: 0, w: 0, t: 0, stopT: 0};
    const M = {group: g, P, vectors: [vt, vw],
      views: {tres: {label: '3/4', t: [0, 0.9, 0], yaw: -0.5, pitch: 0.38, d: 4.4}, arriba: {label: 'Arriba', t: [0, 1, 0], yaw: 0, pitch: 1.45, d: 3.8}},
      overlays: [{key: 'v', label: 'Vectores', on: true}],
      readouts: [{label: 'Cuerpo', get: () => SH[P.shape][0]}, {label: 'I del CM', get: () => N1(Ivar(), 3) + ' kg·m²'}, {label: 'M d²', get: () => N1(P.M * P.d * P.d, 3) + ' kg·m²'}, {label: 'I = I_cm + M d²', get: () => N1(I(), 3) + ' kg·m²', big: 1}, {label: 'α = τ / I', get: () => N1(P.tau / I(), 2) + ' rad/s²', acc: 1, big: 1}, {label: 'ω', get: () => N1(S.w, 2) + ' rad/s'}],
      chart: {title: 'ω(t) con torca constante', series: [{label: 'ω', color: F.w}], unit: 'rad/s', span: 8, xFrom0: true},
      sample: () => [S.t, [S.w]],
      controls: [{type: 'chips', key: 'shape', label: 'Cuerpo', options: [['Disco', 'disco'], ['Aro', 'aro'], ['Esfera', 'esfera'], ['Esfera hueca', 'hueca'], ['Varilla', 'varilla']], on: () => M.reset()}, {type: 'range', key: 'R', label: 'Radio R', min: 0.2, max: 0.6, step: 0.01, fmt: v => v.toFixed(2) + ' m', on: () => M.reset()}, {type: 'range', key: 'd', label: 'Distancia del eje al CM d', min: 0, max: 0.6, step: 0.01, fmt: v => v.toFixed(2) + ' m', on: () => M.reset()}, {type: 'range', key: 'tau', label: 'Torca', min: 0, max: 10, step: 0.1, fmt: v => v.toFixed(1) + ' N·m'}, {type: 'buttons', key: 'b', primary: 1, items: [['Arrancar (ω = 0)', () => M.reset()]]}],
      calls: {tres: [[() => V3(0, 1.6, 0), 'Eje del motor', 'Aplica la torca', 1]], arriba: []},
      reset() { S.th = 0; S.w = 0; S.t = 0; S.stopT = 0; K.clearChart(); build(); },
      update(dt) { if (S.stopT) { dt = min(dt, S.stopT - S.t); if (dt <= 1e-9) { K.running = false; return; } } S.w = min(40, S.w + P.tau / I() * dt); S.th += S.w * dt; S.t += dt; },
      pose() { rot.rotation.y = S.th; if (K.ov('v')) { P.tau > 0 ? vt.set(V3(0, 1.62, 0), V3(0, P.tau, 0), 0.06, `τ<small>${N1(P.tau, 1)} N·m</small>`) : vt.hide(); S.w > 0.02 ? vw.set(V3(0.05, 1.62, 0.05), V3(0, S.w, 0), 0.02, `ω<small>${N1(S.w, 1)}</small>`) : vw.hide(); } else { vt.hide(); vw.hide(); } },
      problem: {title: 'Volante de inercia de un motor', text: 'Un motor tiene un volante de inercia: un disco macizo de 10 kg y 0.5 m de radio. El motor de arranque le aplica una torca de 5 N·m.', q: '¿Cuál es su momento de inercia y su aceleración angular? ¿Y si la misma masa estuviera en un aro?',
        steps: ['Disco: I = ½ M R² = ½ × 10 × 0.25 = 1.25 kg·m².', 'α = τ / I = 5 / 1.25 = 4 rad/s².', 'Aro: I = M R² = 2.5 kg·m² ⇒ α = 2 rad/s². Los volantes llevan la masa en la orilla: guardan más energía a la misma velocidad.'], ans: 'Disco: I = 1.25 kg·m², α = 4 rad/s². Aro: I = 2.5 kg·m², α = 2 rad/s².', load() { Object.assign(P, {shape: 'disco', M: 10, R: 0.5, d: 0, tau: 5}); M.reset(); }},
      reto: {title: 'La varilla que gira por un extremo', text: 'Una varilla de 10 kg y 1 m de largo gira alrededor de un eje perpendicular que pasa por uno de sus extremos. Se le aplica una torca de 5 N·m.', q: '¿Cuál es su aceleración angular?', unit: 'rad/s²', answer: 5 / ((1 / 12) * 10 + 10 * 0.25), tol: 0.02,
        hint: 'I_cm = (1/12) M L²; el eje está a d = L/2 del centro: usa ejes paralelos.', steps: ['I_cm = (1/12)(10)(1²) = 0.833 kg·m².', 'I = 0.833 + 10 × 0.5² = 3.33 kg·m² (= ⅓ M L²).', 'α = 5 / 3.33 = 1.5 rad/s².'], ans: 'α = 1.5 rad/s²',
        setup() { Object.assign(P, {shape: 'varilla', M: 10, R: 0.5, d: 0, tau: 5}); M.reset(); }, preview: 800, reveal() { P.d = 0.5; M.reset(); S.stopT = 2; TD.K.refresh(); }, done: () => S.t >= 2 - 1e-9, measured: () => { S.stopT = 0; return `α = ω/t = ${N1(S.w / S.t, 3)} rad/s²`; }},
      tour: [{at: 0.5, view: 'tres'}, {at: 6, sel: '[data-key="shape"] [data-v="aro"]'}, {at: 12, sel: '[data-key="shape"] [data-v="esfera"]'}, {at: 18, key: 'd', to: 0.4}, {at: 24, key: 'd', to: 0}, {at: 25, sel: '[data-key="shape"] [data-v="disco"]'}]
    };
    build();
    return M;
  }
};

/* ======================= 5.4 · Torca sobre una partícula: la puerta ======================= */
const puerta = {id: 'torca', tab: '5.4 Torca', kicker: KICK('5.4'), title: 'Torca · abrir la puerta de emergencia', specs: 'Puerta de 1.8 m y 25 kg · el cierre automático hace 20 N·m', noteTag: 'τ = r × F',
  notes: `<div class="eq">τ = r × F · τ = r F sin φ = r⊥ F</div><p>r⊥ es el <b>brazo de palanca</b>: la distancia de la bisagra a la línea de acción de F. Una fuerza que apunta hacia la bisagra no hace girar nada.</p>
    <ul><li>Empuja en la manija (lejos de la bisagra): necesitas poca fuerza.</li><li>Empuja cerca de la bisagra: la misma torca requiere mucha más fuerza.</li><li>Empuja inclinado: solo cuenta F sin φ.</li></ul>${legend([[F.T, 'Fuerza F'], [F.tau, 'Torca de F'], [F.N, 'Torca del cierre'], ['#868e96', 'Brazo de palanca r⊥']])}`,
  build(K) {
    const g = new THREE.Group(), P = {F: 15, r: 1.6, phi: 90};
    const Wd = 1.8, Md = 25, Id = Md * Wd * Wd / 3, tauC = 20;
    const floor = K.mesh(new THREE.PlaneGeometry(8, 6), K.MAT.std(0xdee2e6, 0.8), false); floor.rotation.x = -PI / 2; floor.position.y = 0.005; g.add(floor);
    const wall = K.box(0.15, 2.4, 3, K.MAT.std(0xf1f3f5, 0.9)); wall.position.set(-0.08, 1.2, -1.6); g.add(wall); const wall2 = K.box(0.15, 2.4, 3, K.MAT.std(0xf1f3f5, 0.9)); wall2.position.set(-0.08, 1.2, Wd + 1.5); g.add(wall2);
    const hinge = new THREE.Group(); g.add(hinge);
    const door = K.box(0.05, 2.1, Wd, K.MAT.std(0x495057, 0.5, 0.3), 0.01); door.position.set(0, 1.05, Wd / 2); hinge.add(door);
    const bar = K.box(0.06, 0.06, 1.0, K.MAT.metal(0xc92a2a, 0.3), 0.02); bar.position.set(0.07, 1.05, Wd - 0.6); hinge.add(bar);
    const pin = K.cyl(0.03, 0.03, 2.2, K.MAT.metal(), 12); pin.position.y = 1.1; g.add(pin);
    const handle = K.sph(0.05, new THREE.MeshStandardMaterial({color: 0xf05a23, emissive: 0xf05a23, emissiveIntensity: 0.3}), 16); hinge.add(handle);
    const closer = K.box(0.3, 0.08, 0.08, K.MAT.std(0x868e96, 0.4), 0.02); closer.position.set(0.1, 2.05, 0.3); hinge.add(closer);
    const vF = K.vector(F.T, 'F'), vt = K.vector(F.tau, 'τ_F'), vc = K.vector(F.N, 'τ cierre'), vr = K.vector('#868e96', 'r⊥', {ghost: 1, r: 0.01});
    const S = {th: 0, w: 0, t: 0, pushing: false};
    const tauF = () => P.r * P.F * sin(P.phi * D);
    const M = {group: g, P, vectors: [vF, vt, vc, vr],
      defaultView: 'tres', views: {arriba: {label: 'Arriba', t: [0.5, 1, 0.9], yaw: 0, pitch: 1.45, d: 6.5}, tres: {label: '3/4', t: [0.3, 1.1, 0.9], yaw: 1.25, pitch: 0.3, d: 6.5}},
      overlays: [{key: 'v', label: 'Vectores', on: true}],
      readouts: [{label: 'Fuerza F', get: () => N1(P.F, 1) + ' N'}, {label: 'Distancia r', get: () => N1(P.r, 2) + ' m'}, {label: 'Ángulo φ', get: () => P.phi + '°'}, {label: 'r⊥ = r sin φ', get: () => N1(P.r * sin(P.phi * D), 2) + ' m'}, {label: 'τ de F = r F sin φ', get: () => N1(tauF(), 1) + ' N·m', big: 1, acc: 1}, {label: 'τ del cierre', get: () => '−20.0 N·m'}, {label: 'Puerta', get: () => S.th > 0.01 ? `abriendo · ${N1(S.th / D, 0)}°` : tauF() > tauC ? 'abre' : 'no abre'}],
      controls: [{type: 'range', key: 'F', label: 'Fuerza', min: 0, max: 80, step: 0.5, fmt: v => v.toFixed(1) + ' N'}, {type: 'range', key: 'r', label: 'Distancia a la bisagra', min: 0.1, max: 1.75, step: 0.01, fmt: v => v.toFixed(2) + ' m'}, {type: 'range', key: 'phi', label: 'Ángulo φ entre r y F', min: 0, max: 180, step: 1, fmt: v => v + '°'}, {type: 'buttons', key: 'b', primary: 1, items: [['Empujar 2 s', () => { S.pushing = true; S.pt = 2; }], ['Cerrar la puerta', () => M.reset()]]}],
      calls: {tres: [[() => hinge.localToWorld(V3(0, 2.1, 0)), 'Bisagra', 'Eje de giro', -1], [() => hinge.localToWorld(V3(0.1, 2.05, 0.3)), 'Cierre automático', 'Torca de 20 N·m', 1]], arriba: []},
      reset() { S.th = 0; S.w = 0; S.t = 0; S.pushing = false; },
      update(dt) { S.t += dt; const n = 20, h = dt / n; for (let i = 0; i < n; i++) { let tau = S.pushing ? tauF() : 0; if (S.pushing) { S.pt -= h; if (S.pt <= 0) S.pushing = false; } const net = tau - (S.th > 1e-4 || tau > tauC ? tauC : tau); S.w += net / Id * h; S.th += S.w * h; if (S.th < 0) { S.th = 0; S.w = 0; } if (S.th > 1.6) { S.th = 1.6; S.w = 0; } } },
      pose() { hinge.rotation.y = S.th; handle.position.set(0.06, 1.05, P.r);
        const at = hinge.localToWorld(V3(0.06, 1.05, P.r)), rv = V3(sin(S.th), 0, cos(S.th)), perp = V3(cos(S.th), 0, -sin(S.th)).negate(), a = P.phi * D;
        const Fdir = rv.clone().multiplyScalar(cos(a)).add(perp.clone().multiplyScalar(-sin(a)));
        if (K.ov('v')) { P.F > 0 ? vF.set(at.clone().addScaledVector(Fdir, -P.F * 0.025).add(V3(0, 0.1, 0)), Fdir.clone().multiplyScalar(P.F), 0.025) : vF.hide(); abs(tauF()) > 0.1 ? vt.set(V3(0, 2.25, 0), V3(0, tauF(), 0), 0.025, `τ_F<small>${N1(tauF(), 1)} N·m</small>`) : vt.hide(); vc.set(V3(0.1, 2.25, 0.1), V3(0, -tauC, 0), 0.025, `τ cierre<small>20 N·m</small>`);
          const r_perp = P.r * sin(a); abs(r_perp) > 0.02 ? vr.set(V3(0, 1.15, 0), Fdir.clone().cross(V3(0, 1, 0)).normalize().multiplyScalar(-Math.sign(sin(a))), r_perp, `r⊥<small>${N1(r_perp, 2)} m</small>`) : vr.hide(); } else [vF, vt, vc, vr].forEach(v => v.hide()); },
      problem: {title: 'Puerta de emergencia con cierre automático', text: 'El brazo de cierre de una puerta ejerce una torca de 20 N·m que la mantiene cerrada. La manija está a 1.6 m de la bisagra.', q: '¿Qué fuerza perpendicular mínima hay que hacer en la manija? ¿Y si empujas a 0.4 m de la bisagra?',
        steps: ['Para abrir: τ = r F sin 90° ≥ 20 N·m.', 'En la manija: F = 20 / 1.6 = 12.5 N.', 'A 0.4 m: F = 20 / 0.4 = 50 N, ¡cuatro veces más!', 'Si empujas inclinado (φ ≠ 90°), necesitas aún más: solo cuenta F sin φ.'], ans: '12.5 N en la manija; 50 N a 0.4 m de la bisagra.', load() { P.F = 12.6; P.r = 1.6; P.phi = 90; M.reset(); S.pushing = true; S.pt = 2; }},
      reto: {title: 'Empujar inclinado', text: 'Empujas la misma puerta (cierre de 20 N·m) en la manija, a 1.6 m de la bisagra, pero tu fuerza forma 60° con la puerta.', q: '¿Qué fuerza mínima necesitas para empezar a abrirla?', unit: 'N', answer: 20 / (1.6 * sin(60 * D)), tol: 0.02,
        hint: 'solo cuenta la componente perpendicular: τ = r F sin φ ≥ 20 N·m.', steps: ['r F sin 60° = 20.', 'F = 20 / (1.6 × 0.866).'], ans: 'F ≈ 14.4 N',
        setup() { P.F = 12.5; P.r = 1.6; P.phi = 60; M.reset(); }, preview: 400, reveal() { P.F = 14.5; M.reset(); S.pushing = true; S.pt = 2; TD.K.refresh(); }, done: () => S.t > 2.5, measured: () => `con 14.5 N a 60°: τ = ${N1(tauF(), 2)} N·m > 20 N·m ⇒ ${S.th > 1e-4 ? 'la puerta empieza a abrir' : 'no abre'}`},
      tour: [{at: 0.5, view: 'tres'}, {at: 3, sel: '[data-key="b0"]'}, {at: 8, sel: '[data-key="b1"]'}, {at: 9, key: 'r', to: 0.4}, {at: 12, sel: '[data-key="b0"]'}, {at: 16, view: 'arriba'}, {at: 17, key: 'F', to: 55}, {at: 20, sel: '[data-key="b0"]'}, {at: 25, sel: '[data-key="b1"]'}, {at: 26, key: 'r', to: 1.6}, {at: 27, key: 'F', to: 15}]
    };
    return M;
  }
};

/* ======================= 5.5 · Sistemas de partículas: el sube y baja ======================= */
const subebaja = {id: 'sistemas', tab: '5.5 Sistemas', kicker: KICK('5.5'), title: 'Torca neta y equilibrio · el sube y baja', specs: 'Tabla de 4 m · Diego 20 kg · su hermana 15 kg', noteTag: 'Σ τ = 0',
  notes: `<div class="eq">Σ τ_ext = I α · equilibrio: Σ τ = 0 ⇔ Σ mᵢ g xᵢ = 0</div><p>Para un sistema se suman las torcas de todas las fuerzas externas; las internas se cancelan por pares. El sube y baja queda en equilibrio cuando el <b>centro de masa</b> de las cargas está sobre el pivote.</p>
    <ul><li>Cada peso hace una torca m g x; los del lado izquierdo giran en un sentido y los del derecho en el otro.</li><li>El más ligero se compensa sentándose más lejos.</li></ul>${legend([[F.W, 'Pesos'], [F.tau, 'Torca neta']])}`,
  build(K) {
    const g = new THREE.Group(), P = {m1: 20, x1: 1.5, m2: 15, x2: 1.2};
    const ground = K.mesh(new THREE.PlaneGeometry(10, 6), K.MAT.std(0x9bbf73, 0.95), false); ground.rotation.x = -PI / 2; ground.position.y = 0.004; g.add(ground);
    const piv = K.mesh(new THREE.ConeGeometry(0.25, 0.5, 4), K.MAT.std(0xe03131, 0.5)); piv.position.y = 0.25; piv.rotation.y = PI / 4; g.add(piv);
    const board = new THREE.Group(); board.position.y = 0.52; g.add(board);
    board.add(K.box(4.2, 0.08, 0.35, K.MAT.tex('wood', [2, 0.3], 0.6), 0.02));
    const kids = [K.person({shirt: 0x1c7ed6, pants: 0x343a40, scale: 0.68}), K.person({shirt: 0xd6336c, pants: 0x212529, hair: 0x5c3317, scale: 0.6})];
    kids.forEach(k => board.add(k.group));
    for (let x = -2; x <= 2; x += 0.5) { const tk = K.box(0.02, 0.005, 0.36, K.MAT.std(0x16181b)); tk.position.set(x, 0.045, 0); board.add(tk); }
    const vW = [K.vector(F.W, 'm₁g'), K.vector(F.W, 'm₂g')], vt = K.vector(F.tau, 'Σ τ');
    const S = {a: 0, w: 0, t: 0};
    const net = () => P.m2 * g0 * P.x2 - P.m1 * g0 * P.x1;   // + = counterclockwise (right side down? kid 2 on right)
    const amax = 0.2;
    const M = {group: g, P, vectors: [...vW, vt],
      views: {lado: {label: 'Lado', t: [0, 0.8, 0], yaw: 0, pitch: 0.05, d: 7}, tres: {label: '3/4', t: [0, 0.7, 0], yaw: -0.5, pitch: 0.25, d: 7}},
      overlays: [{key: 'v', label: 'Fuerzas y torca', on: true}],
      readouts: [{label: 'τ de Diego (izq.)', get: () => N1(P.m1 * g0 * P.x1, 1) + ' N·m'}, {label: 'τ de la hermana (der.)', get: () => N1(P.m2 * g0 * P.x2, 1) + ' N·m'}, {label: 'Σ τ', get: () => N1(net(), 1) + ' N·m', big: 1, acc: 1}, {label: 'Estado', get: () => abs(net()) < 2 ? 'equilibrio ✓' : net() > 0 ? 'baja la hermana' : 'baja Diego'}, {label: 'CM de las cargas', get: () => N1((P.m2 * P.x2 - P.m1 * P.x1) / (P.m1 + P.m2), 3) + ' m'}],
      controls: [{type: 'range', key: 'm1', label: 'Masa de Diego (izquierda)', min: 10, max: 60, step: 1, fmt: v => v + ' kg'}, {type: 'range', key: 'x1', label: 'Distancia de Diego al pivote', min: 0.3, max: 2, step: 0.01, fmt: v => v.toFixed(2) + ' m'}, {type: 'range', key: 'm2', label: 'Masa de la hermana (derecha)', min: 10, max: 60, step: 1, fmt: v => v + ' kg'}, {type: 'range', key: 'x2', label: 'Distancia de la hermana', min: 0.3, max: 2, step: 0.01, fmt: v => v.toFixed(2) + ' m'}],
      calls: {tres: [[() => V3(0, 0.5, 0), 'Pivote', 'Las torcas se miden desde aquí', 1]], lado: []},
      reset() { S.a = 0; S.w = 0; S.t = 0; },
      update(dt) { S.t += dt; const I = P.m1 * P.x1 ** 2 + P.m2 * P.x2 ** 2 + 20; const tq = abs(net()) < 2 ? 0 : net() * cos(S.a); S.w += (-tq / I - 2 * S.w) * dt; S.a += S.w * dt; if (abs(net()) < 2) { S.a *= (1 - min(1, dt * 2)); } if (S.a > amax) { S.a = amax; S.w = 0; } if (S.a < -amax) { S.a = -amax; S.w = 0; } },
      pose() { board.rotation.z = S.a; kids[0].group.position.set(-P.x1, 0.04, 0); kids[0].group.rotation.y = 0; kids[0].pose({armL: -0.6, armR: -0.6, crouch: 0.35}); kids[1].group.position.set(P.x2, 0.04, 0); kids[1].group.rotation.y = PI; kids[1].pose({armL: -0.6, armR: -0.6, crouch: 0.3});
        if (K.ov('v')) { const p1 = board.localToWorld(V3(-P.x1, 0.1, 0.3)), p2 = board.localToWorld(V3(P.x2, 0.1, 0.3)); vW[0].set(p1, V3(0, -P.m1 * g0, 0), 0.004, `m₁g<small>${N1(P.m1 * g0, 0)} N</small>`); vW[1].set(p2, V3(0, -P.m2 * g0, 0), 0.004, `m₂g<small>${N1(P.m2 * g0, 0)} N</small>`); abs(net()) > 2 ? vt.set(V3(0, 0.55, 0.3), V3(0, 0, -net()), 0.01, `Σ τ<small>${N1(net(), 0)} N·m</small>`) : vt.hide(); } else [...vW, vt].forEach(v => v.hide()); },
      problem: {title: 'Sube y baja en el parque', text: 'Diego, de 20 kg, se sienta a 1.5 m del pivote de un sube y baja. Su hermana pesa 15 kg.', q: '¿A qué distancia del pivote debe sentarse ella para que el sube y baja quede en equilibrio?',
        steps: ['Equilibrio de rotación: Σ τ = 0 ⇒ m₁ g x₁ = m₂ g x₂.', 'x₂ = m₁ x₁ / m₂ = 20 × 1.5 / 15.', 'Mueve a la hermana hasta que Σ τ = 0.'], ans: 'x₂ = 2.0 m del pivote, del lado opuesto.', load() { P.m1 = 20; P.x1 = 1.5; P.m2 = 15; P.x2 = 1.2; M.reset(); }},
      reto: {title: 'Hermanos de otra edad', text: 'Ahora Diego pesa 30 kg y su hermano pequeño 25 kg. El pequeño se sienta a 1.2 m del pivote.', q: '¿A qué distancia debe sentarse Diego para equilibrar?', unit: 'm', answer: 25 * 1.2 / 30, tol: 0.02,
        hint: 'm₁ x₁ = m₂ x₂.', steps: ['30 x₁ = 25 × 1.2 = 30.', 'x₁ = 1.0 m.'], ans: 'x₁ = 1.0 m',
        setup() { P.m1 = 30; P.x1 = 1.6; P.m2 = 25; P.x2 = 1.2; M.reset(); }, preview: 1500, reveal() { P.x1 = 1.0; TD.K.refresh(); this.t0 = S.t; }, done() { return S.t - this.t0 > 1; }, measured: () => `con x₁ = 1.00 m: Σ τ = ${N1(net(), 2)} N·m`},
      tour: [{at: 0.5, view: 'tres'}, {at: 4, key: 'x2', to: 2.0}, {at: 10, view: 'lado'}, {at: 12, key: 'm2', to: 25}, {at: 17, key: 'm2', to: 15}, {at: 20, key: 'x2', to: 1.2}]
    };
    return M;
  }
};

/* ======================= 5.6 · Ímpetu angular: agarrarse del poste ======================= */
const poste = {id: 'impetu-angular', tab: '5.6 Ímpetu angular', kicker: KICK('5.6'), title: 'Ímpetu angular · el patinador que se agarra del poste', specs: 'Patinador de 60 kg a 1.5 m/s · pasa a b = 1.5 m del poste', noteTag: 'L = r × p',
  notes: `<div class="eq">L = r × p · L = r⊥ p = m v b · dL/dt = τ</div><p>¡Una partícula en línea recta también tiene ímpetu angular respecto a un punto! Si no hay fuerza, L se mantiene constante aunque r y el ángulo cambien.</p>
    <p>Al agarrar el poste, la fuerza del brazo apunta al poste: su torca es cero y L se conserva. Después, L = I ω con I = m r².</p><ul><li>Las áreas barridas en tiempos iguales son iguales (como en las órbitas de los planetas).</li></ul>${legend([[F.L, 'L (sobre el eje del poste)'], [F.v, 'Velocidad'], ['#868e96', 'Vector de posición r']])}`,
  build(K) {
    const g = new THREE.Group(), P = {m: 60, v: 1.5, b: 1.5};
    const ice = K.mesh(new THREE.BoxGeometry(14, 0.04, 8), K.MAT.tex('ice', [3, 2], 0.12)); ice.position.y = 0.02; g.add(ice);
    const post = K.cyl(0.06, 0.06, 2, K.MAT.metal(0xc92a2a, 0.4), 16); post.position.y = 1.0; g.add(post);
    const sk = K.person({shirt: 0x1c7ed6, pants: 0x212529, skates: 1}); g.add(sk.group);
    const arm = K.tubeBetween(V3(), V3(1, 0, 0), 0.03, K.MAT.plastic(0x1c7ed6, 0.7)); g.add(arm);
    const vL = K.vector(F.L, 'L', {r: 0.03}), vv = K.vector(F.v, 'v'), vr = K.vector('#868e96', 'r', {ghost: 1, r: 0.012});
    const fans = []; const fanMat = new THREE.MeshBasicMaterial({color: 0xf05a23, transparent: true, opacity: 0.18, side: THREE.DoubleSide});
    const S = {x: -5, z: 1.5, t: 0, grabbed: false, ang: 0, lastFan: 0, fanFrom: null};
    const L = () => P.m * P.v * P.b;
    const M = {group: g, P, vectors: [vL, vv, vr],
      views: {arriba: {label: 'Arriba', t: [-1, 0.5, 0], yaw: 0, pitch: 1.4, d: 15}, tres: {label: '3/4', t: [-1, 0.8, 0], yaw: -0.5, pitch: 0.4, d: 14}},
      overlays: [{key: 'v', label: 'Vectores', on: true}, {key: 'area', label: 'Áreas barridas', on: true}],
      readouts: [{label: 'Distancia al poste r', get: () => N1(hypot(S.x, S.z), 2) + ' m'}, {label: 'Brazo de palanca b', get: () => N1(P.b, 2) + ' m'}, {label: 'L = m v b', get: () => N1(L(), 1) + ' kg·m²/s', big: 1, acc: 1}, {label: 'Estado', get: () => S.grabbed ? 'girando agarrado' : 'línea recta, sin fuerza'}, {label: 'I = m b² (después)', get: () => N1(P.m * P.b * P.b, 1) + ' kg·m²'}, {label: 'ω = L / I', get: () => S.grabbed ? N1(L() / (P.m * P.b * P.b), 2) + ' rad/s' : '—'}],
      controls: [{type: 'range', key: 'm', label: 'Masa del patinador', min: 20, max: 100, step: 1, fmt: v => v + ' kg', on: () => M.reset()}, {type: 'range', key: 'v', label: 'Rapidez', min: 0.5, max: 4, step: 0.1, fmt: v => v.toFixed(1) + ' m/s', on: () => M.reset()}, {type: 'range', key: 'b', label: 'Distancia de paso b', min: 0.6, max: 2.5, step: 0.05, fmt: v => v.toFixed(2) + ' m', on: () => M.reset()}, {type: 'buttons', key: 'c', primary: 1, items: [['Pasar junto al poste', () => M.reset()]]}],
      calls: {tres: [[() => V3(0, 2, 0), 'Poste', 'Su fuerza no hace torca', 1]], arriba: []},
      reset() { S.x = -5; S.z = P.b; S.t = 0; S.grabbed = false; S.ang = PI / 2; fans.forEach(f => g.remove(f)); fans.length = 0; S.lastFan = 0; S.fanFrom = V3(S.x, 0.05, S.z); },
      update(dt) { S.t += dt; if (!S.grabbed) { S.x += P.v * dt; if (S.x >= 0) { S.x = 0; S.grabbed = true; S.ang = PI / 2; } } else { const w = P.v / P.b; S.ang -= w * dt; S.x = P.b * cos(S.ang); S.z = P.b * sin(S.ang); }
        if (K.ov('area') && S.t - S.lastFan >= 0.8) { const to = V3(S.x, 0.05, S.z); const geo = new THREE.BufferGeometry().setFromPoints([V3(0, 0.05, 0), S.fanFrom.clone(), to.clone()]); geo.setIndex([0, 1, 2]); const f = K.mesh(geo, fanMat, false); g.add(f); fans.push(f); if (fans.length > 14) g.remove(fans.shift()); S.fanFrom = to; S.lastFan = S.t; } },
      pose() { sk.group.position.set(S.x, 0.04, S.z); const vel = S.grabbed ? V3(-sin(S.ang), 0, cos(S.ang)).multiplyScalar(-P.v) : V3(P.v, 0, 0); sk.group.rotation.y = atan2(-vel.z, vel.x); sk.pose({armL: S.grabbed ? -1.5 : 0.2, armR: 0.2, stride: S.grabbed ? 0 : sin(S.t * 3) * 0.25});
        arm.visible = S.grabbed; if (S.grabbed) arm.userData.set(V3(S.x, 1.35, S.z), V3(0, 1.35, 0));
        fans.forEach(f => f.visible = K.ov('area'));
        if (K.ov('v')) { vL.set(V3(0, 2.05, 0), V3(0, -L(), 0), 0.012, `L<small>${N1(L(), 1)} kg·m²/s</small>`); vv.set(V3(S.x, 1.0, S.z), vel, 0.6, `v<small>${N1(P.v, 1)}</small>`); vr.set(V3(0, 0.08, 0), V3(S.x, 0, S.z), 1, `r<small>${N1(hypot(S.x, S.z), 2)} m</small>`); } else [vL, vv, vr].forEach(v => v.hide()); },
      problem: {title: 'Jugador que se agarra de un poste', text: 'Un patinador de 60 kg se desliza en línea recta a 1.5 m/s y pasa a 1.5 m de un poste. Al pasar, lo agarra con el brazo extendido (1.5 m) y empieza a girar a su alrededor.', q: '¿Cuánto vale su ímpetu angular respecto al poste antes de agarrarlo? ¿Con qué ω gira después?',
        steps: ['En línea recta: L = m v b = 60 × 1.5 × 1.5 = 135 kg·m²/s (constante, aunque r cambie).', 'La fuerza del brazo apunta al poste: torca cero, así que L se conserva al agarrarlo.', 'Después: L = I ω con I = m r² = 60 × 1.5² = 135 kg·m² ⇒ ω = 1 rad/s.'], ans: 'L = 135 kg·m²/s antes y después; gira a ω = 1 rad/s.', load() { P.m = 60; P.v = 1.5; P.b = 1.5; M.reset(); }},
      reto: {title: 'Más rápido y más cerca', text: 'Ahora el patinador va a 3 m/s y pasa a 1.2 m del poste antes de agarrarlo con el brazo a esa misma distancia.', q: '¿Con qué rapidez angular gira después?', unit: 'rad/s', answer: 3 / 1.2, tol: 0.02,
        hint: 'L = m v b se conserva y luego L = m b² ω: la masa se cancela.', steps: ['m v b = m b² ω ⇒ ω = v / b.', 'ω = 3 / 1.2.'], ans: 'ω = 2.5 rad/s',
        setup() { P.m = 60; P.v = 3; P.b = 1.2; M.reset(); }, preview: 1000, reveal() {}, done: () => S.grabbed && S.t > 2.5, measured: () => `ω = ${N1(L() / (P.m * P.b * P.b), 2)} rad/s (L = ${N1(L(), 0)} kg·m²/s)`},
      tour: [{at: 0.5, view: 'tres'}, {at: 9, view: 'arriba'}, {at: 11, key: 'b', to: 0.9}, {at: 13, sel: '[data-key="c0"]'}, {at: 24, key: 'b', to: 1.5}]
    };
    return M;
  }
};

/* ======================= 5.7 · Conservación de L: la patinadora ======================= */
const patinadora = {id: 'conservacion-l', tab: '5.7 Conservación de L', kicker: KICK('5.7'), title: 'Conservación del ímpetu angular · la patinadora artística', specs: 'Cuerpo I₀ = 1 kg·m² · dos pesas de 2 kg · brazos de 1 m a 0.2 m', noteTag: 'I ω = cte',
  notes: `<div class="eq">Σ τ_ext = 0 ⇒ I_i ω_i = I_f ω_f</div><p>Si la torca externa neta es cero, L no cambia. Si cambia la distribución de masa (cambia I), ω cambia para compensar.</p>
    <p>La energía K = L² / 2I sí cambia: al recoger los brazos K aumenta, y esa energía viene del <b>trabajo de los músculos</b>.</p>${legend([[F.L, 'L'], [F.w, 'ω']])}`,
  build(K) {
    const g = new THREE.Group(), P = {r: 1, w0: 2};
    const ice = K.mesh(new THREE.CylinderGeometry(3, 3, 0.04, 64), K.MAT.tex('ice', [2, 2], 0.12)); ice.position.y = 0.02; g.add(ice);
    const spin = new THREE.Group(); spin.position.y = 0.04; g.add(spin);
    const sk = K.person({shirt: 0xd6336c, pants: 0x212529, skates: 1, scale: 1.1}); spin.add(sk.group);
    const wL = K.sph(0.08, K.MAT.std(0x343a40, 0.3, 0.6)), wR = K.sph(0.08, K.MAT.std(0x343a40, 0.3, 0.6)); spin.add(wL, wR);
    const vL = K.vector(F.L, 'L', {r: 0.03}), vw = K.vector(F.w, 'ω', {r: 0.02});
    const S = {th: 0, r: 1, t: 0, target: 1};
    const I = r => 1 + 4 * r * r, Lm = () => I(P.rInit || 1) * P.w0;
    const shY = 1.55 * 1.1 / 1.0 * 0.95, Lsh = 0.22, La = 0.57 * 1.1;
    const M = {group: g, P, vectors: [vL, vw],
      views: {tres: {label: '3/4', t: [0, 1.05, 0], yaw: -0.4, pitch: 0.22, d: 6.5}, arriba: {label: 'Arriba', t: [0, 1.4, 0], yaw: 0, pitch: 1.45, d: 5.5}},
      overlays: [{key: 'v', label: 'Vectores', on: true}],
      readouts: [{label: 'Radio de las pesas', get: () => N1(S.r, 2) + ' m'}, {label: 'I = 1 + 4 r²', get: () => N1(I(S.r), 2) + ' kg·m²'}, {label: 'ω = L / I', get: () => N1(Lm() / I(S.r), 2) + ' rad/s', big: 1, acc: 1}, {label: 'L', get: () => N1(Lm(), 1) + ' kg·m²/s'}, {label: 'K = L² / 2I', get: () => N1(Lm() ** 2 / (2 * I(S.r)), 1) + ' J', big: 1}],
      chart: {title: 'ω e I mientras cambia r', series: [{label: 'ω', color: F.w}, {label: 'I', color: F.L}], unit: '', span: 10},
      sample: () => [S.t, [Lm() / I(S.r), I(S.r)]],
      controls: [{type: 'range', key: 'r', label: 'Radio de los brazos', min: 0.2, max: 1, step: 0.01, fmt: v => v.toFixed(2) + ' m', on: v => { S.target = v; }}, {type: 'range', key: 'w0', label: 'ω con brazos a 1 m', min: 0.5, max: 4, step: 0.1, fmt: v => v.toFixed(1) + ' rad/s'}, {type: 'buttons', key: 'b', primary: 1, items: [['Recoger brazos', () => { P.r = 0.2; S.target = 0.2; }], ['Extender brazos', () => { P.r = 1; S.target = 1; }]]}],
      calls: {tres: [[() => wL.getWorldPosition(V3()), 'Pesa de 2 kg', 'Aporta 2 · m r² a I', 1]], arriba: []},
      reset() { S.th = 0; S.r = P.r; S.target = P.r; S.t = 0; },
      update(dt) { S.t += dt; const k = 1 - Math.exp(-dt * 3); S.r += (S.target - S.r) * k; S.th += Lm() / I(S.r) * dt; },
      pose() { spin.rotation.y = S.th; const phi = Math.asin(max(0, min(1, (S.r - Lsh) / La))); sk.armL.rotation.x = -phi; sk.armR.rotation.x = phi; const hz = Lsh + La * sin(phi), hy = 1.5 - La * cos(phi); wL.position.set(0, hy, hz); wR.position.set(0, hy, -hz);
        if (K.ov('v')) { vL.set(V3(0, 2.1, 0), V3(0, Lm(), 0), 0.06, `L<small>${N1(Lm(), 1)}</small>`); vw.set(V3(0.08, 2.1, 0.08), V3(0, Lm() / I(S.r), 0), 0.08, `ω<small>${N1(Lm() / I(S.r), 2)}</small>`); } else { vL.hide(); vw.hide(); } },
      problem: {title: 'Giro de una patinadora artística', text: 'Una patinadora gira a 2 rad/s con los brazos extendidos (pesas de 2 kg a 1 m del eje; su cuerpo tiene I₀ = 1 kg·m²). Luego recoge los brazos hasta 0.2 m.', q: '¿Con qué rapidez angular gira al final? ¿Cuánto cambia su energía cinética?',
        steps: ['Iᵢ = 1 + 2 × 2 × 1² = 5 kg·m²; L = Iᵢ ωᵢ = 10 kg·m²/s.', 'I_f = 1 + 4 × 0.2² = 1.16 kg·m² ⇒ ω_f = 10 / 1.16 ≈ 8.6 rad/s.', 'K = L² / 2I: de 10 J a ≈ 43 J. La diferencia es el trabajo de sus músculos.'], ans: 'ω_f ≈ 8.6 rad/s; K pasa de 10 J a ≈ 43 J.', load() { P.w0 = 2; P.r = 1; M.reset(); setTimeout(() => { P.r = 0.2; S.target = 0.2; TD.K.refresh(); }, 1500); }},
      reto: {title: 'Girar a 5 rad/s', text: 'La patinadora gira a 2 rad/s con las pesas (2 kg cada una) a 1 m del eje; su cuerpo tiene I₀ = 1 kg·m².', q: '¿A qué distancia del eje debe llevar las pesas para girar a 5 rad/s?', unit: 'm', answer: 0.5, tol: 0.02,
        hint: 'L = I ω se conserva; despeja el I necesario y luego r de I = I₀ + 2 m r².', steps: ['L = (1 + 4 × 1²) × 2 = 10 kg·m²/s.', 'I necesario = L / ω = 10 / 5 = 2 kg·m² = 1 + 4 r².', 'r² = 0.25 ⇒ r = 0.5 m.'], ans: 'r = 0.50 m',
        setup() { P.w0 = 2; P.r = 1; M.reset(); }, preview: 1000, reveal() { P.r = 0.5; S.target = 0.5; TD.K.refresh(); this.t0 = S.t; }, done() { return abs(S.r - 0.5) < 0.002; }, measured: () => `con r = ${N1(S.r, 2)} m: ω = ${N1(Lm() / I(S.r), 2)} rad/s`},
      tour: [{at: 0.5, view: 'tres'}, {at: 4, sel: '[data-key="b0"]'}, {at: 10, view: 'arriba'}, {at: 13, sel: '[data-key="b1"]'}, {at: 19, view: 'tres'}]
    };
    return M;
  }
};

TD.start({machines: [carrera, pertiga, solidos, puerta, subebaja, poste, patinadora]});
})();
