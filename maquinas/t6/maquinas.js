/* Tema 6 · Oscilaciones — four teardown machines. */
(() => {
const {PI, sin, cos, abs, sqrt, min, max, atan2, hypot, exp} = Math, D = PI / 180, TAU = 2 * PI;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const F = {W: '#16181b', T: '#3d8fe0', N: '#7048e8', f: '#2f9e44', S: '#f05a23', v: '#0ca678', K: '#3d8fe0', U: '#f05a23', x: '#7048e8', a: '#f59f00'};
const legend = items => `<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin:8px 0 2px;font-size:10.5px;font-weight:600">${items.map(([c, t]) => `<span><i style="display:inline-block;width:12px;height:3px;background:${c};vertical-align:middle;margin-right:4px"></i>${t}</span>`).join('')}</div>`;
const N1 = (v, d = 1) => TD.K.fx(v, d);
const KICK = n => `Teardown · Tema 6 · Oscilaciones · ${n}`;
function helixPts(a, b, R, coils, n = 160) { const d = b.clone().sub(a), L = d.length(), u = d.clone().normalize(), p = Math.abs(u.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0), e1 = p.clone().cross(u).normalize(), e2 = u.clone().cross(e1); const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, ang = t * coils * TAU; pts.push(a.clone().addScaledVector(u, t * L).addScaledVector(e1, cos(ang) * R).addScaledVector(e2, sin(ang) * R)); } return pts; }
function springMesh(K, a, b, R, coils, r, mat) { const m = K.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts(a, b, R, coils)), 240, r, 6, false), mat); m.userData.set = (p, q) => { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts(p, q, R, coils)), 240, r, 6, false); }; return m; }

/* ======================= 6.1 · Sistemas oscilatorios: resorte, péndulo y circuito LC ======================= */
const sistemas = {id: 'sistemas-oscilatorios', tab: '6.1 Sistemas', kicker: KICK('6.1'), title: '¿Qué tienen en común? · resorte, péndulo y circuito LC', specs: 'Tres osciladores con la misma ecuación: d²x/dt² = −ω² x', noteTag: 'x ↔ θ ↔ q',
  notes: `<p>Todos tienen una posición de equilibrio, una «fuerza» restauradora que crece con el desplazamiento, e <b>inercia</b> que los hace pasarse del equilibrio.</p><div class="eq">d²x/dt² = −ω² x · ω = √(k/m) ↔ √(g/ℓ) ↔ 1/√(LC)</div>
    <ul><li>En el circuito, la carga del capacitor hace el papel de x y la corriente el de v.</li><li>La energía pasa del campo eléctrico (capacitor) al magnético (bobina), como de potencial a cinética.</li><li>Con amortiguamiento (fricción, aire, resistencia R) los tres decaen igual.</li></ul>${legend([[F.x, 'resorte x'], [F.T, 'péndulo θ'], [F.S, 'carga q']])}`,
  build(K) {
    const g = new THREE.Group(), P = {b: 0, Luh: 250, Cpf: 100};
    // spring-mass
    const base = K.box(1.6, 0.06, 0.5, K.MAT.std(0xdee2e6, 0.6), 0.02); base.position.set(-2.4, 0.03, 0); g.add(base);
    const wall = K.box(0.08, 0.5, 0.5, K.MAT.std(0x495057, 0.5)); wall.position.set(-3.2, 0.25, 0); g.add(wall);
    const blk = K.box(0.3, 0.3, 0.3, K.MAT.plastic(0x7048e8, 0.35), 0.04); g.add(blk);
    const spr = springMesh(K, V3(-3.16, 0.2, 0), V3(-2.55, 0.2, 0), 0.07, 9, 0.012, K.MAT.metal()); g.add(spr);
    // pendulum
    const frame = K.box(0.06, 1.6, 0.06, K.MAT.std(0x495057, 0.5)); frame.position.set(0, 0.8, -0.2); g.add(frame); const top = K.box(0.6, 0.06, 0.06, K.MAT.std(0x495057, 0.5)); top.position.set(0, 1.6, -0.1); g.add(top);
    const piv = new THREE.Group(); piv.position.set(0, 1.58, 0); g.add(piv); const rod = K.cyl(0.006, 0.006, 1.2, K.MAT.metal(), 6); rod.position.y = -0.6; piv.add(rod); const bob = K.sph(0.09, K.MAT.plastic(0x3d8fe0, 0.3), 24); bob.position.y = -1.2; piv.add(bob);
    // LC circuit
    const board = K.box(1.5, 0.04, 1.0, K.MAT.std(0x2f6b3a, 0.7), 0.02); board.position.set(2.4, 0.02, 0); g.add(board);
    const plateMat = [new THREE.MeshStandardMaterial({color: 0xadb5bd, metalness: 0.8, roughness: 0.3, emissive: 0xe03131, emissiveIntensity: 0}), new THREE.MeshStandardMaterial({color: 0xadb5bd, metalness: 0.8, roughness: 0.3, emissive: 0x1c7ed6, emissiveIntensity: 0})];
    const p1 = K.box(0.04, 0.4, 0.4, plateMat[0], 0.01); p1.position.set(1.95, 0.25, 0); g.add(p1); const p2 = K.box(0.04, 0.4, 0.4, plateMat[1], 0.01); p2.position.set(2.1, 0.25, 0); g.add(p2);
    const coilMat = new THREE.MeshStandardMaterial({color: 0xc9a24f, metalness: 1, roughness: 0.35, emissive: 0xffd43b, emissiveIntensity: 0});
    const coil = K.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts(V3(2.55, 0.15, 0), V3(3.05, 0.15, 0), 0.1, 12)), 300, 0.01, 6, false), coilMat); g.add(coil);
    const wires = [[V3(1.95, 0.05, 0), V3(1.95, 0.05, 0.4)], [V3(1.95, 0.05, 0.4), V3(3.1, 0.05, 0.4)], [V3(3.1, 0.05, 0.4), V3(3.1, 0.05, 0)], [V3(2.1, 0.05, 0), V3(2.55, 0.05, 0)]]; wires.forEach(([a, b]) => g.add(K.tubeBetween(a, b, 0.008, K.MAT.std(0xc92a2a, 0.5))));
    const vI = K.vector(F.v, 'i');
    const S = {u: 1, du: 0, t: 0};   // shared normalized state (x/A = θ/θ₀ = q/Q)
    const w = TAU / 2;   // one oscillation every 2 s for all three (slowed for the LC circuit)
    const fLC = () => 1 / (TAU * sqrt(P.Luh * 1e-6 * P.Cpf * 1e-12));
    const M = {group: g, P, vectors: [vI],
      views: {frente: {label: 'Frente', t: [0, 0.7, 0], yaw: 0, pitch: 0.12, d: 12.5}, tres: {label: '3/4', t: [0, 0.6, 0], yaw: -0.4, pitch: 0.3, d: 12.5}},
      overlays: [{key: 'i', label: 'Corriente', on: true}],
      readouts: [{label: 'Desplazamiento x / A', get: () => N1(S.u, 2)}, {label: 'Ángulo θ / θ₀', get: () => N1(S.u, 2)}, {label: 'Carga q / Q', get: () => N1(S.u, 2)}, {label: 'Frecuencia real del LC', get: () => N1(fLC() / 1000, 0) + ' kHz', big: 1, acc: 1}, {label: 'Amortiguamiento', get: () => N1(P.b, 2)}],
      chart: {title: 'Los tres osciladores: misma curva', series: [{label: 'x', color: F.x, w: 3}, {label: 'θ', color: F.T, w: 1.8}, {label: 'q', color: F.S, w: 1}], unit: '', span: 8, min: -1.1, max: 1.1},
      sample: () => [S.t, [S.u, S.u, S.u]],
      controls: [{type: 'range', key: 'b', label: 'Amortiguamiento (fricción, aire, R)', min: 0, max: 1.5, step: 0.01, fmt: v => v.toFixed(2)}, {type: 'range', key: 'Luh', label: 'Bobina L', min: 50, max: 1000, step: 5, fmt: v => v + ' µH'}, {type: 'range', key: 'Cpf', label: 'Capacitor C', min: 20, max: 500, step: 5, fmt: v => v + ' pF'}, {type: 'buttons', key: 'b', primary: 1, items: [['Perturbar los tres', () => M.reset()]]}, {type: 'note', text: 'El circuito real oscila a cientos de kHz: aquí lo vemos en cámara lenta, al mismo ritmo que el resorte y el péndulo.'}],
      calls: {frente: [[() => blk.position, 'Masa y resorte', 'x ↔ desplazamiento', -1], [() => bob.getWorldPosition(V3()), 'Péndulo', 'θ ↔ ángulo', 1], [() => V3(2.02, 0.45, 0), 'Capacitor', 'q ↔ carga', 1]], tres: []},
      reset() { S.u = 1; S.du = 0; S.t = 0; },
      update(dt) { const n = 20, h = dt / n; for (let i = 0; i < n; i++) { const a = -w * w * S.u - P.b * S.du; S.du += a * h; S.u += S.du * h; } S.t += dt; },
      pose() { blk.position.set(-2.4 + 0.35 * S.u, 0.21, 0); spr.userData.set(V3(-3.16, 0.2, 0), V3(-2.55 + 0.35 * S.u, 0.2, 0)); piv.rotation.z = 0.35 * S.u;
        plateMat[0].emissive.setHex(S.u >= 0 ? 0xe03131 : 0x1c7ed6); plateMat[1].emissive.setHex(S.u >= 0 ? 0x1c7ed6 : 0xe03131); plateMat.forEach(m => m.emissiveIntensity = 0.9 * S.u * S.u); coilMat.emissiveIntensity = 0.9 * (S.du / w) ** 2;
        K.ov('i') && abs(S.du) > 0.05 ? vI.set(V3(2.5, 0.12, 0.4), V3(S.du, 0, 0), 0.12, 'i') : vI.hide(); },
      problem: {title: 'Sintonizar una estación de radio AM', text: 'El sintonizador de un radio AM es un circuito LC con una bobina de L = 250 µH y un capacitor de C = 100 pF. Oscila exactamente como la masa y el resorte.', q: '¿A qué frecuencia oscila? ¿Qué pasaría con la frecuencia si se aumenta C?',
        steps: ['Analogía: m ↔ L y k ↔ 1/C, así que ω = 1/√(LC).', 'f = 1 / (2π √(250×10⁻⁶ × 100×10⁻¹²)) = 1 / (2π × 1.58×10⁻⁷ s).', 'Aumentar C es como un resorte más blando: la frecuencia baja (f ∝ 1/√C). Así se gira la perilla del radio.'], ans: 'f ≈ 1.0 MHz (1007 kHz), en la banda de AM. Si C aumenta, f disminuye.', load() { P.Luh = 250; P.Cpf = 100; P.b = 0; M.reset(); }},
      reto: {title: 'Girar la perilla', text: 'En el mismo radio (L = 250 µH, C = 100 pF, f ≈ 1007 kHz), giras la perilla hasta cuadruplicar la capacitancia.', q: '¿A qué frecuencia queda sintonizado, en kHz?', unit: 'kHz', answer: 1 / (TAU * sqrt(250e-6 * 400e-12)) / 1000, tol: 0.02,
        hint: 'f ∝ 1/√C: si C se multiplica por 4, f se divide entre…', steps: ['f ∝ 1/√C ⇒ f′ = f / √4 = f / 2.', 'f′ ≈ 1007 / 2.'], ans: 'f ≈ 503 kHz',
        setup() { P.Luh = 250; P.Cpf = 100; M.reset(); }, preview: 800, reveal() { P.Cpf = 400; TD.K.refresh(); }, done: () => true, measured: () => `con C = 400 pF: f = ${N1(fLC() / 1000, 0)} kHz`},
      tour: [{at: 0.5, view: 'frente'}, {at: 10, key: 'b', to: 0.6}, {at: 18, sel: '[data-key="b0"]'}, {at: 22, key: 'b', to: 0}, {at: 24, view: 'tres'}, {at: 27, key: 'Cpf', to: 400}, {at: 31, key: 'Cpf', to: 100}]
    };
    return M;
  }
};

/* ======================= 6.2 · Oscilador armónico simple: la suspensión ======================= */
const suspension = {id: 'oscilador', tab: '6.2 Oscilador armónico', kicker: KICK('6.2'), title: 'Oscilador armónico simple · la suspensión de un auto', specs: 'Modelo escalado de una rueda: k = 100 N/m, m = 1 kg (misma razón k/m que 30 000 N/m y 300 kg)', noteTag: 'ω = √(k/m)',
  notes: `<div class="eq">m a = −k x ⇒ x(t) = A cos(ω t + φ) · ω = √(k/m) · T = 2π √(m/k)</div><p>El periodo <b>no depende de la amplitud</b>. La energía se intercambia entre cinética y potencial elástica:</p><div class="eq">E = ½ m v² + ½ k x² = ½ k A²</div>
    <ul><li>Sin amortiguador, el auto rebotaría 1.6 veces por segundo sin parar.</li><li>El amortiguador agrega una fuerza −b v que disipa la energía.</li><li>Más masa ⇒ oscila más lento; resorte más duro ⇒ más rápido.</li></ul>${legend([[F.T, 'Fuerza del resorte'], [F.f, 'Fuerza del amortiguador'], [F.v, 'Velocidad'], [F.K, 'K'], [F.U, 'U elástica']])}`,
  build(K) {
    const g = new THREE.Group(), P = {k: 100, m: 1, b: 0, A: 0.25};
    const road = K.box(4, 0.06, 1.2, K.MAT.std(0x3b3d42, 0.9)); road.position.y = 0.03; g.add(road);
    const wheel = K.cyl(0.32, 0.32, 0.24, K.MAT.rubber(), 32); wheel.rotation.x = PI / 2; wheel.position.y = 0.38; g.add(wheel); const hub = K.cyl(0.16, 0.16, 0.25, K.MAT.metal(), 20); hub.rotation.x = PI / 2; hub.position.y = 0.38; g.add(hub);
    const axleY = 0.38, eqY = 1.3;
    const body = new THREE.Group(); g.add(body); const shell = K.box(1.6, 0.5, 1.0, K.MAT.plastic(0xe03131, 0.25), 0.15); body.add(shell); const fender = K.mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 24, PI), K.MAT.plastic(0xc92a2a, 0.3)); fender.position.set(0, -0.3, 0.42); body.add(fender);
    const spr = springMesh(K, V3(0, axleY + 0.1, 0.2), V3(0, eqY - 0.25, 0.2), 0.09, 7, 0.016, K.MAT.std(0xffd43b, 0.4, 0.4)); g.add(spr);
    const damp = K.cyl(0.035, 0.035, 0.5, K.MAT.metal(0x495057), 12); g.add(damp); const rodD = K.cyl(0.015, 0.015, 0.5, K.MAT.metal(), 8); g.add(rodD);
    const vFs = K.vector(F.T, 'F resorte'), vFd = K.vector(F.f, 'F amort.'), vv = K.vector(F.v, 'v');
    const S = {x: 0.25, v: 0, t: 0, stopX: null, Tm: null, lastC: null};
    const scaleX = 1.0;
    const M = {group: g, P, vectors: [vFs, vFd, vv],
      views: {lado: {label: 'Lado', t: [0, 0.9, 0], yaw: 0.1, pitch: 0.06, d: 7}, tres: {label: '3/4', t: [0, 0.9, 0], yaw: -0.6, pitch: 0.2, d: 7}},
      overlays: [{key: 'f', label: 'Fuerzas', on: true}],
      readouts: [{label: 'x (desde el equilibrio)', get: () => N1(S.x, 3) + ' m'}, {label: 'Velocidad', get: () => N1(S.v, 2) + ' m/s'}, {label: 'ω = √(k/m)', get: () => N1(sqrt(P.k / P.m), 2) + ' rad/s'}, {label: 'f = ω / 2π', get: () => N1(sqrt(P.k / P.m) / TAU, 2) + ' Hz', big: 1}, {label: 'T medido', get: () => S.Tm ? N1(S.Tm, 3) + ' s' : '—', acc: 1}],
      bars: {title: 'Energía (J)', max: () => 0.5 * P.k * P.A * P.A, items: [{label: 'K', color: F.K, get: () => 0.5 * P.m * S.v * S.v, dec: 2}, {label: 'U elástica', color: F.U, get: () => 0.5 * P.k * S.x * S.x, dec: 2}, {label: 'Total', color: F.W, get: () => 0.5 * P.m * S.v * S.v + 0.5 * P.k * S.x * S.x, dec: 2}]},
      chart: {title: 'x(t)', series: [{label: 'x', color: F.x}], unit: 'm', span: 6},
      sample: () => [S.t, [S.x]],
      controls: [{type: 'range', key: 'k', label: 'Constante k', min: 10, max: 400, step: 1, fmt: v => v + ' N/m'}, {type: 'range', key: 'm', label: 'Masa m', min: 0.2, max: 5, step: 0.05, fmt: v => v.toFixed(2) + ' kg'}, {type: 'range', key: 'b', label: 'Amortiguador b', min: 0, max: 20, step: 0.1, fmt: v => v.toFixed(1) + ' kg/s'}, {type: 'range', key: 'A', label: 'Hundimiento inicial A', min: 0.05, max: 0.5, step: 0.01, fmt: v => v.toFixed(2) + ' m', on: () => M.reset()}, {type: 'buttons', key: 'c', primary: 1, items: [['Soltar', () => M.reset()], ['Pasar un tope', () => { S.v = -1.5; }]]}],
      calls: {tres: [[() => V3(0, (axleY + eqY) / 2, 0.2), 'Resorte', 'F = −k x', 1], [() => V3(0, (axleY + eqY) / 2, -0.2), 'Amortiguador', 'F = −b v', -1]], lado: []},
      reset() { S.x = -P.A; S.v = 0; S.t = 0; S.Tm = null; S.lastC = null; S.stopX = null; },
      update(dt) { const n = 40, h = dt / n; for (let i = 0; i < n; i++) { const a = (-P.k * S.x - P.b * S.v) / P.m, xp = S.x; S.v += a * h; S.x += S.v * h; S.t += h; if (xp < 0 && S.x >= 0) { if (S.lastC !== null) S.Tm = S.t - S.lastC; S.lastC = S.t; } if (S.stopX !== null && ((S.stopDir > 0 && S.x >= S.stopX) || (S.stopDir < 0 && S.x <= S.stopX))) { K.running = false; S.hitStop = true; break; } } },
      pose() { const y = eqY + S.x * scaleX; body.position.y = y; spr.userData.set(V3(0, axleY + 0.1, 0.2), V3(0, y - 0.25, 0.2)); damp.position.set(0, axleY + 0.35, -0.2); rodD.position.set(0, (y - 0.25 + axleY + 0.6) / 2, -0.2); rodD.scale.y = max(0.2, (y - 0.25 - axleY - 0.35) / 0.5 + 0.5);
        const o = V3(0.95, y, 0.3), sc = 0.06; if (K.ov('f')) { abs(S.x) > 0.002 ? vFs.set(o, V3(0, -P.k * S.x, 0), sc / 2) : vFs.hide(); P.b > 0 && abs(S.v) > 0.01 ? vFd.set(o.clone().add(V3(0.2, 0, 0)), V3(0, -P.b * S.v, 0), sc / 2) : vFd.hide(); } else { vFs.hide(); vFd.hide(); } abs(S.v) > 0.01 ? vv.set(V3(-0.95, y, 0.3), V3(0, S.v, 0), 0.3, `v<small>${N1(abs(S.v), 2)} m/s</small>`) : vv.hide(); },
      problem: {title: 'Suspensión de un auto', text: 'Cada rueda de un auto carga ≈ 300 kg y su resorte tiene k = 30 000 N/m. La simulación usa la misma razón k/m (k = 100 N/m, m = 1 kg).', q: '¿Con qué frecuencia rebota el auto al pasar un tope si no tuviera amortiguadores? ¿Qué hacen los amortiguadores?',
        steps: ['ω = √(k/m) = √(30 000 / 300) = 10 rad/s.', 'f = ω / 2π ≈ 1.59 Hz; T ≈ 0.63 s.', 'Los amortiguadores agregan −b v. Sube b a ≈ 3 kg/s: la oscilación muere en pocos ciclos.'], ans: 'f ≈ 1.6 Hz (T ≈ 0.63 s). Los amortiguadores disipan la energía para que no siga rebotando.', load() { Object.assign(P, {k: 100, m: 1, b: 0, A: 0.25}); M.reset(); }},
      reto: {title: 'Rapidez a medio camino', text: 'Cambiamos el modelo: m = 2 kg y k = 50 N/m, sin amortiguador. Se hunde 0.5 m y se suelta desde el reposo.', q: '¿Qué rapidez tiene al pasar por x = −0.3 m (a 0.3 m del equilibrio)?', unit: 'm/s', answer: 2, tol: 0.02,
        hint: 'conserva la energía: ½ k A² = ½ k x² + ½ m v².', steps: ['ω = √(k/m) = 5 rad/s.', 'v = ω √(A² − x²) = 5 √(0.25 − 0.09) = 5 × 0.4.'], ans: 'v = 2.0 m/s',
        setup() { Object.assign(P, {k: 50, m: 2, b: 0, A: 0.5}); M.reset(); }, preview: 300, reveal() { M.reset(); S.stopX = -0.3; S.stopDir = 1; }, done: () => !!S.hitStop, measured: () => { S.hitStop = false; S.stopX = null; return `en x = ${N1(S.x, 3)} m: v = ${N1(abs(S.v), 3)} m/s`; }},
      tour: [{at: 0.5, view: 'tres'}, {at: 8, key: 'b', to: 3}, {at: 10, sel: '[data-key="c1"]'}, {at: 16, view: 'lado'}, {at: 18, key: 'b', to: 0}, {at: 19, sel: '[data-key="c0"]'}]
    };
    return M;
  }
};

/* ======================= 6.3 · MAS como proyección: la boya ======================= */
const boya = {id: 'mas', tab: '6.3 MAS', kicker: KICK('6.3'), title: 'MAS como proyección de un círculo · la boya en el oleaje', specs: 'Boya en olas de 0.8 m de amplitud · ω = 1.6 rad/s · fasor giratorio', noteTag: 'x = A cos(ωt + φ)',
  notes: `<p>Un punto que gira con ω constante en un círculo de radio A, visto «de canto», hace un movimiento armónico simple. Por eso ω se llama frecuencia angular y φ es un ángulo.</p><div class="eq">x = A cos(ωt + φ) · v = −Aω sin(ωt + φ) · a = −ω² x</div>
    <ul><li>v es máxima al pasar por el nivel medio; a es máxima en crestas y valles.</li><li>La aceleración siempre apunta hacia el equilibrio.</li></ul>${legend([[F.x, 'x'], [F.v, 'v'], [F.a, 'a']])}`,
  build(K) {
    const g = new THREE.Group(), P = {A: 0.8, w: 1.6, phi: 0};
    const N = 60, sea = new THREE.PlaneGeometry(14, 6, N, 4); sea.rotateX(-PI / 2); const seaM = K.mesh(sea, new THREE.MeshStandardMaterial({color: 0x3f86b6, roughness: 0.25, transparent: true, opacity: 0.85}), false); seaM.position.x = 2; g.add(seaM);
    const base = sea.attributes.position.array.slice();
    const buoy = new THREE.Group(); const bb = K.cyl(0.35, 0.25, 0.5, K.MAT.plastic(0xf59f00, 0.4), 24); buoy.add(bb); const st = K.box(0.35, 0.08, 0.35, K.MAT.plastic(0xf8f9fa, 0.4), 0.02); st.position.y = 0.2; buoy.add(st); const mast = K.cyl(0.03, 0.03, 0.8, K.MAT.metal(), 8); mast.position.y = 0.6; buoy.add(mast); const lamp = K.sph(0.07, new THREE.MeshStandardMaterial({color: 0xff3b3b, emissive: 0xff3b3b, emissiveIntensity: 0.8}), 12); lamp.position.y = 1.02; buoy.add(lamp); g.add(buoy);
    const cx = -2.6, ring = K.mesh(new THREE.TorusGeometry(1, 0.012, 8, 96), K.MAT.std(0x16181b, 0.5)); ring.position.set(cx, 0, 0); g.add(ring);
    const dot = K.sph(0.07, K.MAT.std(0xf05a23, 0.4), 16); g.add(dot); const radius = K.tubeBetween(V3(), V3(1, 0, 0), 0.01, K.MAT.std(0xf05a23, 0.5)); g.add(radius); const proj = K.tubeBetween(V3(), V3(1, 0, 0), 0.006, new THREE.MeshBasicMaterial({color: 0x16181b, transparent: true, opacity: 0.4})); g.add(proj);
    const vv = K.vector(F.v, 'v'), va = K.vector(F.a, 'a');
    const S = {t: 0, amax: 0, vmax: 0};
    const ph = () => P.w * S.t + P.phi, x = () => P.A * cos(ph()), v = () => -P.A * P.w * sin(ph()), a = () => -P.w * P.w * x();
    const M = {group: g, P, vectors: [vv, va],
      views: {frente: {label: 'Frente', t: [-0.9, 0.3, 0], yaw: 0, pitch: 0.08, d: 11.5}, tres: {label: '3/4', t: [-0.9, 0.3, 0], yaw: -0.4, pitch: 0.25, d: 11.5}},
      overlays: [{key: 'va', label: 'v y a', on: true}],
      readouts: [{label: 'x', get: () => N1(x(), 2) + ' m'}, {label: 'v', get: () => N1(v(), 2) + ' m/s'}, {label: 'a', get: () => N1(a(), 2) + ' m/s²'}, {label: 'v máxima = A ω', get: () => N1(P.A * P.w, 2) + ' m/s', acc: 1}, {label: 'a máxima = A ω²', get: () => N1(P.A * P.w * P.w, 2) + ' m/s²', acc: 1}, {label: 'Periodo T = 2π/ω', get: () => N1(TAU / P.w, 2) + ' s'}, {label: 'Fase ωt + φ', get: () => N1((ph() / D) % 360, 0) + '°'}],
      chart: {title: 'x(t), v(t) y a(t)', series: [{label: 'x', color: F.x}, {label: 'v', color: F.v}, {label: 'a', color: F.a}], unit: '', span: 8},
      sample: () => [S.t, [x(), v(), a()]],
      controls: [{type: 'range', key: 'A', label: 'Amplitud A', min: 0.1, max: 1, step: 0.01, fmt: v => v.toFixed(2) + ' m'}, {type: 'range', key: 'w', label: 'Frecuencia angular ω', min: 0.4, max: 4, step: 0.05, fmt: v => v.toFixed(2) + ' rad/s'}, {type: 'range', key: 'phi', label: 'Fase inicial φ', min: -3.14, max: 3.14, step: 0.01, fmt: v => v.toFixed(2) + ' rad'}, {type: 'buttons', key: 'c', items: [['t = 0', () => M.reset()]]}],
      calls: {frente: [[() => dot.position, 'Fasor', 'Gira con ω', -1], [() => buoy.position.clone().add(V3(0, 1, 0)), 'Boya', 'Su sombra en el eje', 1]], tres: []},
      reset() { S.t = 0; S.amax = 0; S.vmax = 0; K.clearChart(); },
      update(dt) { const n = 10, h = dt / n; for (let i = 0; i < n; i++) { S.t += h; S.amax = max(S.amax, abs(a())); S.vmax = max(S.vmax, abs(v())); } },
      pose() { const X = x(); buoy.position.set(0, X, 0); const p = sea.attributes.position; for (let i = 0; i < p.count; i++) { const bx = base[i * 3] + 2; p.array[i * 3 + 1] = P.A * cos(P.w * S.t + P.phi - 0.9 * bx); } p.needsUpdate = true; sea.computeVertexNormals();
        const ang = ph(), dp = V3(cx + cos(ang - PI / 2) * 0, 0, 0); const pt = V3(cx + sin(-ang) * P.A * 0 + P.A * sin(ang) * 0, 0, 0); const D3 = V3(cx - P.A * sin(ang), P.A * cos(ang), 0); dot.position.copy(D3); ring.scale.setScalar(P.A); radius.userData.set(V3(cx, 0, 0), D3); proj.userData.set(D3, V3(-0.4, X, 0));
        if (K.ov('va')) { abs(v()) > 0.01 ? vv.set(V3(0.5, X + 0.2, 0), V3(0, v(), 0), 0.5, `v<small>${N1(v(), 2)}</small>`) : vv.hide(); abs(a()) > 0.01 ? va.set(V3(0.7, X + 0.2, 0), V3(0, a(), 0), 0.3, `a<small>${N1(a(), 2)}</small>`) : va.hide(); } else { vv.hide(); va.hide(); } },
      problem: {title: 'Boya en el oleaje', text: 'Una boya sube y baja con las olas en un MAS de amplitud 0.8 m. Una ola completa pasa cada ≈ 3.9 s (ω = 1.6 rad/s).', q: '¿Cuál es la velocidad máxima de la boya? ¿Y su aceleración máxima? ¿En qué posiciones ocurren?',
        steps: ['v = −A ω sin(ωt + φ) ⇒ v_máx = A ω = 0.8 × 1.6.', 'a = −ω² x ⇒ a_máx = A ω² = 0.8 × 2.56.', 'v es máxima en el nivel medio; a es máxima en crestas y valles.'], ans: 'v_máx ≈ 1.28 m/s (nivel medio); a_máx ≈ 2.05 m/s² (crestas y valles).', load() { P.A = 0.8; P.w = 1.6; P.phi = 0; M.reset(); }},
      reto: {title: 'Olas cortas', text: 'Con olas más cortas, la boya hace un MAS de amplitud 0.5 m y frecuencia angular de 2 rad/s.', q: '¿Cuál es su aceleración máxima?', unit: 'm/s²', answer: 0.5 * 4, tol: 0.02,
        hint: 'a = −ω² x; el máximo es en el extremo.', steps: ['a_máx = A ω² = 0.5 × 2².'], ans: 'a_máx = 2.0 m/s²',
        setup() { P.A = 0.8; P.w = 1.6; M.reset(); }, preview: 800, reveal() { P.A = 0.5; P.w = 2; P.phi = 0; M.reset(); TD.K.refresh(); this.t0 = 0; }, done: () => S.t > PI / 2 + 0.1, measured: () => `a máxima medida: ${N1(S.amax, 3)} m/s²`},
      tour: [{at: 0.5, view: 'frente'}, {at: 8, key: 'w', to: 3}, {at: 14, key: 'w', to: 1.6}, {at: 16, view: 'tres'}, {at: 18, key: 'A', to: 0.4}, {at: 24, key: 'A', to: 0.8}]
    };
    return M;
  }
};

/* ======================= 6.4 · El péndulo simple (y el reloj) ======================= */
const pendulo = {id: 'pendulo', tab: '6.4 El péndulo', kicker: KICK('6.4'), title: 'Aplicaciones · el péndulo simple en cuatro planetas', specs: 'Lenteja de 1 kg · ℓ ajustable · ángulo grande sin aproximar', noteTag: 'T ≈ 2π √(ℓ/g)',
  notes: `<div class="eq">d²θ/dt² = −(g/ℓ) sin θ ≈ −(g/ℓ) θ · T ≈ 2π √(ℓ / g)</div><p>La fuerza restauradora es la componente del peso tangente al arco, −m g sin θ. Para ángulos pequeños, sin θ ≈ θ y el péndulo es un oscilador armónico.</p>
    <ul><li>El periodo no depende de la masa.</li><li>Para ángulos grandes el periodo real es mayor (aquí se resuelve sin aproximar).</li><li>Mira cómo un reloj real usa un péndulo de segundos en el teardown del <a href="../reloj/" target="_top">reloj de péndulo</a>.</li></ul>${legend([[F.W, 'Peso m g'], [F.S, 'Componente tangente'], [F.T, 'Tensión']])}`,
  build(K) {
    const g = new THREE.Group(), P = {L: 0.994, g: 9.81, th0: 10};
    const frame = K.box(0.08, 2.4, 0.08, K.MAT.std(0x495057, 0.5)); frame.position.set(-0.7, 1.2, -0.2); g.add(frame); const top = K.box(1.2, 0.08, 0.3, K.MAT.std(0x495057, 0.5), 0.02); top.position.set(-0.2, 2.42, -0.1); g.add(top);
    const piv = new THREE.Group(); piv.position.set(0, 2.38, 0); g.add(piv);
    const rod = K.cyl(0.005, 0.005, 1, K.MAT.metal(), 6); piv.add(rod); const bob = K.sph(0.07, K.MAT.brass(), 24); piv.add(bob);
    const arc = new THREE.Group(); g.add(arc);
    const vW = K.vector(F.W, 'm g'), vt = K.vector(F.S, 'm g sin θ'), vT = K.vector(F.T, 'T');
    const S = {th: 0, w: 0, t: 0, Tm: null, last: null};
    const T0 = () => TAU * sqrt(P.L / P.g);
    const M = {group: g, P, vectors: [vW, vt, vT],
      views: {frente: {label: 'Frente', t: [0, 1.45, 0], yaw: 0, pitch: 0.04, d: 5.6}, tres: {label: '3/4', t: [0, 1.4, 0], yaw: -0.5, pitch: 0.15, d: 5.6}},
      overlays: [{key: 'f', label: 'Fuerzas', on: true}],
      readouts: [{label: 'Gravedad', get: () => N1(P.g, 2) + ' m/s²'}, {label: 'Longitud ℓ', get: () => N1(P.L, 3) + ' m'}, {label: 'T (ángulo pequeño)', get: () => N1(T0(), 3) + ' s'}, {label: 'T medido', get: () => S.Tm ? N1(S.Tm, 3) + ' s' : '—', big: 1, acc: 1}, {label: 'Diferencia', get: () => S.Tm ? `+${N1(100 * (S.Tm / T0() - 1), 2)} %` : '—'}, {label: 'θ', get: () => N1(S.th / D, 1) + '°'}],
      chart: {title: 'Ángulo θ(t)', series: [{label: 'θ', color: F.T}], unit: '°', span: 10},
      sample: () => [S.t, [S.th / D]],
      controls: [{type: 'chips', key: 'g', label: 'Planeta', options: [['Tierra', 9.81], ['Luna', 1.62], ['Marte', 3.71], ['Júpiter', 24.79]], on: () => M.reset()}, {type: 'range', key: 'L', label: 'Longitud ℓ', min: 0.2, max: 2, step: 0.001, fmt: v => v.toFixed(3) + ' m', on: () => M.reset()}, {type: 'range', key: 'th0', label: 'Ángulo inicial θ₀', min: 2, max: 90, step: 1, fmt: v => v + '°', on: () => M.reset()}, {type: 'buttons', key: 'c', primary: 1, items: [['Soltar', () => M.reset()], ['Péndulo de segundos', () => { P.L = 0.994; P.g = 9.81; P.th0 = 10; M.reset(); }]]}],
      calls: {frente: [[() => bob.getWorldPosition(V3()), 'Lenteja · 1 kg', 'La masa no cambia T', 1]], tres: []},
      reset() { S.th = P.th0 * D; S.w = 0; S.t = 0; S.Tm = null; S.last = null; S.n = 0; K.clearChart(); },
      update(dt) { const n = 40, h = dt / n; for (let i = 0; i < n; i++) { const tp = S.th; S.w += -(P.g / P.L) * sin(S.th) * h; S.th += S.w * h; S.t += h; if (tp > 0 && S.th <= 0) { if (S.last !== null) { S.Tm = S.t - S.last; S.n++; } S.last = S.t; } } },
      pose() { piv.rotation.z = S.th; const Lv = min(P.L, 2.3); rod.scale.y = Lv; rod.position.y = -Lv / 2; bob.position.y = -Lv;
        if (K.ov('f')) { const p = bob.getWorldPosition(V3()).add(V3(0, 0, 0.1)), sc = 0.03, m = 1; vW.set(p, V3(0, -m * P.g, 0), sc); const tg = V3(-cos(S.th), -sin(S.th), 0); vt.set(p, tg.multiplyScalar(m * P.g * sin(S.th)), sc); const toP = V3(-sin(S.th), cos(S.th), 0); vT.set(p, toP.multiplyScalar(m * P.g * cos(S.th) + m * S.w * S.w * P.L), sc); } else [vW, vt, vT].forEach(v => v.hide()); },
      problem: {title: 'El péndulo de un reloj de pared', text: 'Los relojes de pared clásicos usan un «péndulo de segundos»: cada ida dura 1 s, es decir, T = 2 s.', q: '¿Qué longitud debe tener? Si llevaras ese reloj a la Luna (g = 1.62 m/s²), ¿cuál sería su periodo?',
        steps: ['T = 2π √(ℓ/g) ⇒ ℓ = g T² / 4π² = 9.81 × 4 / 39.48 ≈ 0.994 m.', 'En la Luna: T = 2π √(0.994 / 1.62) ≈ 4.9 s: el reloj se atrasaría muchísimo.', 'La amplitud debe ser pequeña (10°). Prueba θ₀ = 60° y compara.'], ans: 'ℓ ≈ 0.99 m. En la Luna, T ≈ 4.9 s.', load() { P.L = 0.994; P.g = 1.62; P.th0 = 10; M.reset(); }},
      reto: {title: 'Un reloj para Marte', text: 'Quieres un reloj de péndulo que funcione en Marte (g = 3.71 m/s²) con un periodo de 3 s (oscilaciones pequeñas).', q: '¿Qué longitud debe tener el péndulo?', unit: 'm', answer: 3.71 * 9 / (4 * PI * PI), tol: 0.02,
        hint: 'despeja ℓ de T = 2π √(ℓ / g).', steps: ['ℓ = g T² / (4π²) = 3.71 × 9 / 39.48.', 'ℓ ≈ 0.85 m (en la Tierra ese péndulo tendría T ≈ 1.85 s).'], ans: 'ℓ ≈ 0.846 m',
        setup() { P.g = 3.71; P.L = 1.5; P.th0 = 5; M.reset(); }, preview: 1500, reveal() { P.L = +(3.71 * 9 / (4 * PI * PI)).toFixed(3); P.th0 = 5; M.reset(); TD.K.refresh(); }, done: () => S.n >= 1, measured: () => `con ℓ = ${N1(P.L, 3)} m en Marte: T = ${N1(S.Tm, 3)} s`},
      tour: [{at: 0.5, view: 'frente'}, {at: 8, sel: '[data-key="g"] [data-v="1.62"]'}, {at: 16, sel: '[data-key="g"] [data-v="9.81"]'}, {at: 17, key: 'th0', to: 70}, {at: 26, key: 'th0', to: 10}, {at: 27, view: 'tres'}]
    };
    return M;
  }
};

TD.start({machines: [sistemas, suspension, boya, pendulo]});
})();
