/* Tema 2 · Trabajo y energía — seven teardown machines. */
(() => {
const {PI, sin, cos, tan, abs, sqrt, min, max, atan, atan2, hypot, pow} = Math, D = PI / 180, g0 = 9.8;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const F = {W: '#16181b', T: '#3d8fe0', N: '#7048e8', f: '#2f9e44', S: '#f05a23', v: '#0ca678', a: '#f59f00', d: '#0ca678', K: '#3d8fe0', U: '#f05a23', E: '#16181b', Q: '#e8590c'};
const legend = items => `<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin:8px 0 2px;font-size:10.5px;font-weight:600">${items.map(([c, t]) => `<span><i style="display:inline-block;width:12px;height:3px;background:${c};vertical-align:middle;margin-right:4px"></i>${t}</span>`).join('')}</div>`;
const N1 = (v, d = 1) => TD.K.fx(v, d);
const KICK = n => `Teardown · Tema 2 · Trabajo y energía · ${n}`;

function wagonModel(K, color = 0xe03131) {
  const g = new THREE.Group(); const tub = K.box(0.8, 0.22, 0.45, K.MAT.plastic(color, 0.35), 0.04); tub.position.y = 0.3; g.add(tub);
  [[0.28, 0.24], [0.28, -0.24], [-0.28, 0.24], [-0.28, -0.24]].forEach(([x, z]) => { const w = K.cyl(0.1, 0.1, 0.05, K.MAT.rubber(), 20); w.rotation.x = PI / 2; w.position.set(x, 0.1, z); g.add(w); g.userData.w = (g.userData.w || []).concat(w); });
  return g;
}
function carModel(K, color = 0xe03131) {
  const g = new THREE.Group(); const body = K.box(4.2, 0.62, 1.75, K.MAT.plastic(color, 0.25), 0.2); body.position.y = 0.6; g.add(body);
  const cab = K.box(2.2, 0.55, 1.6, K.MAT.glass(), 0.18); cab.position.set(-0.25, 1.15, 0); g.add(cab);
  const roof = K.box(1.9, 0.08, 1.5, K.MAT.plastic(color, 0.25), 0.04); roof.position.set(-0.3, 1.44, 0); g.add(roof);
  g.userData.w = [];
  [[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]].forEach(([x, z]) => { const w = K.cyl(0.33, 0.33, 0.24, K.MAT.rubber(), 24); w.rotation.x = PI / 2; w.position.set(x, 0.33, z); g.add(w); const hub = K.cyl(0.18, 0.18, 0.25, K.MAT.metal(), 16); hub.rotation.x = PI / 2; hub.position.copy(w.position); g.add(hub); g.userData.w.push(w); });
  [[2.1, 0.55], [2.1, -0.55]].forEach(([x, z]) => { const l = K.sph(0.09, new THREE.MeshStandardMaterial({color: 0xfff3bf, emissive: 0xfff3bf, emissiveIntensity: 0.6}), 12); l.position.set(x, 0.65, z); g.add(l); });
  return g;
}

/* ======================= 2.1 · Trabajo de una fuerza constante ======================= */
const trabajo = {id: 'trabajo', tab: '2.1 Trabajo', kicker: KICK('2.1'), title: 'Trabajo · jalar un carrito con una cuerda', specs: 'Carrito de juguete · cuerda inclinada φ · W = F d cos φ', noteTag: 'W = F · d',
  notes: `<p>El trabajo es el <b>producto escalar</b> de la fuerza por el desplazamiento. Solo cuenta la componente de F a lo largo de d.</p><div class="eq">W = F · d = F d cos φ</div>
    <p>Es un escalar (1 J = 1 N·m): positivo si la fuerza ayuda, cero si es perpendicular, negativo si se opone.</p><ul><li>Gira la cuerda manteniendo |F|: W es máximo con φ = 0°, cero con 90° y negativo pasando de 90°.</li><li>Cargar una mochila caminando en horizontal: la fuerza que la sostiene no hace trabajo.</li><li>La fricción siempre hace trabajo negativo.</li></ul>${legend([[F.T, 'Fuerza de la cuerda'], [F.d, 'Desplazamiento'], [F.f, 'Fricción']])}`,
  build(K) {
    const g = new THREE.Group(), P = {F: 5, phi: 37, d: 8, fric: 0};
    const ground = K.mesh(new THREE.BoxGeometry(18, 0.04, 3), K.MAT.tex('concrete', [6, 1], 0.9)); ground.position.set(5, 0.02, 0); g.add(ground);
    for (let x = 0; x <= 12; x++) { const tk = K.box(0.02, 0.005, x % 2 ? 0.25 : 0.5, K.MAT.std(0x16181b)); tk.position.set(x, 0.045, 1.1); g.add(tk); }
    const wag = wagonModel(K); g.add(wag);
    const kid = K.person({shirt: 0xf59f00, pants: 0x1864ab, scale: 0.72}); g.add(kid.group);
    const rope = K.tubeBetween(V3(), V3(1, 0, 0), 0.006, K.MAT.std(0xc9a46a, 0.9)); g.add(rope);
    const vF = K.vector(F.T, 'F'), vFp = K.vector(F.T, 'F cos φ', {ghost: 1, r: 0.012}), vFn = K.vector(F.T, 'F sin φ', {ghost: 1, r: 0.012}), vd = K.vector(F.d, 'd'), vf = K.vector(F.f, 'f');
    const S = {x: 0, t: 0, walking: false, W: 0, Wf: 0};
    const M = {group: g, P, vectors: [vF, vFp, vFn, vd, vf],
      views: {lado: {label: 'Lado', t: [1.0, 0.6, 0], yaw: 0, pitch: 0.06, d: 7}, tres: {label: '3/4', t: [1.0, 0.5, 0], yaw: -0.6, pitch: 0.28, d: 7}},
      follow: () => V3(S.x, 0, 0),
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'comp', label: 'Componentes', on: true}, {key: 'd', label: 'Desplazamiento', on: true}],
      readouts: [{label: 'Fuerza |F|', get: () => N1(P.F) + ' N'}, {label: 'Ángulo φ', get: () => P.phi + '°'}, {label: 'F cos φ (útil)', get: () => N1(P.F * cos(P.phi * D), 2) + ' N'}, {label: 'Recorrido d', get: () => N1(S.x, 2) + ' m'}, {label: 'Trabajo de F', get: () => N1(S.W, 1) + ' J', big: 1, acc: 1}, {label: 'Trabajo de la fricción', get: () => N1(S.Wf, 1) + ' J'}],
      chart: {title: 'Trabajo acumulado contra distancia', xy: true, xr: () => [0, max(2, P.d)], yr: () => { const a = P.F * P.d; return [min(-a * 0.3, -P.fric * P.d), max(a, 1) * 1.1]; }, series: [{label: 'W de F', color: F.T}, {label: 'W fricción', color: F.f}], unit: 'J', xLabel: 'x (m)'},
      sample: () => S.walking ? [S.x, [S.W, S.Wf]] : null,
      controls: [{type: 'range', key: 'F', label: 'Fuerza en la cuerda', min: 0, max: 60, step: 0.5, fmt: v => v.toFixed(1) + ' N'}, {type: 'range', key: 'phi', label: 'Ángulo φ con el camino', min: 0, max: 180, step: 1, fmt: v => v + '°'}, {type: 'range', key: 'd', label: 'Distancia a recorrer', min: 1, max: 12, step: 0.5, fmt: v => v + ' m'},
        {type: 'range', key: 'fric', label: 'Fricción sobre el carrito', min: 0, max: 30, step: 0.5, fmt: v => v.toFixed(1) + ' N'},
        {type: 'buttons', key: 'w', primary: 1, items: [['Caminar', () => M.reset(true)], ['Cargar (φ = 90°)', () => { P.phi = 90; M.reset(true); }], ['Frenar (φ = 180°)', () => { P.phi = 180; M.reset(true); }]]},
        {type: 'note', text: 'El niño camina a 1 m/s: aquí no importa cómo se mueve, solo cuánto se desplaza el carrito.'}],
      calls: {tres: [[() => wag.position.clone().add(V3(0, 0.45, 0)), 'Carrito', 'Se desplaza d', 1]], lado: []},
      reset(walk) { S.x = 0; S.t = 0; S.W = 0; S.Wf = 0; S.walking = !!walk; K.clearChart(); },
      update(dt) { S.t += dt; if (S.t > 0.8 && !S.walking && S.x === 0) { S.walking = true; K.clearChart(); } if (S.walking && S.x < P.d) { const dx = min(dt * 1.0, P.d - S.x); S.x += dx; S.W += P.F * cos(P.phi * D) * dx; S.Wf -= P.fric * dx; } },
      pose() {
        wag.position.set(S.x, 0.04, 0); (wag.userData.w || []).forEach(w => w.rotation.y = 0); const att = V3(S.x + 0.42, 0.35, 0), a = P.phi * D;
        const hand = att.clone().add(V3(cos(a), sin(a), 0).multiplyScalar(1.1)); rope.userData.set(att, hand);
        kid.group.position.set(hand.x + (cos(a) >= 0 ? 0.25 : -0.25), 0.04, 0.0); kid.group.rotation.y = cos(a) >= 0 ? PI : 0; kid.pose({armR: -1.0, armL: 0.2, stride: S.walking && S.x < P.d ? sin(S.t * 8) * 0.4 : 0});
        const sc = min(0.09, 1.1 / max(P.F, P.fric, 1)), Fv = V3(cos(a), sin(a), 0).multiplyScalar(P.F), o = att.clone().add(V3(0, 0, 0.3));
        K.ov('f') && P.F > 0.05 ? vF.set(o, Fv, sc) : vF.hide();
        if (K.ov('comp')) { vFp.set(o, V3(Fv.x, 0, 0), sc, `F cos φ<small>${N1(Fv.x)}</small>`); abs(Fv.y) > 0.05 ? vFn.set(o, V3(0, Fv.y, 0), sc, `F sin φ<small>${N1(Fv.y)}</small>`) : vFn.hide(); } else { vFp.hide(); vFn.hide(); }
        K.ov('d') && S.x > 0.02 ? vd.set(V3(0, 0.06, 0.6), V3(S.x, 0, 0), 1, `d<small>${N1(S.x, 2)} m</small>`) : vd.hide();
        K.ov('f') && P.fric > 0 ? vf.set(V3(S.x - 0.4, 0.15, 0.3), V3(-P.fric, 0, 0), sc) : vf.hide();
      },
      problem: {title: 'Jalar un carrito con una cuerda', text: 'Un niño jala su carrito con una cuerda inclinada: la fuerza es de 5 N a 37° sobre la horizontal (Fₓ = 4 N, F_y = 3 N). El carrito avanza 8 m por el suelo.', q: '¿Cuánto trabajo hace el niño? ¿Qué parte de la fuerza «se desperdicia»?',
        steps: ['W = F · d = Fₓdₓ + F_yd_y = 4 × 8 + 3 × 0.', 'Equivalente: W = F d cos φ = 5 × 8 × cos 37° = 5 × 8 × 0.8.', 'La componente vertical (3 N) es perpendicular al desplazamiento: no hace trabajo.'], ans: 'W = 32 J. Solo la componente de 4 N a lo largo del camino hace trabajo.', load() { P.F = 5; P.phi = 37; P.d = 8; P.fric = 0; M.reset(true); }},
      reto: {title: 'Arrastrar la caja', text: 'Arrastras una caja 10 m por el piso con una cuerda: la tensión es de 50 N a 60° sobre la horizontal. La fricción sobre la caja es de 20 N.', q: '¿Cuál es el trabajo neto sobre la caja?', unit: 'J', answer: 50 * 10 * 0.5 - 200, tol: 0.02,
        hint: 'suma el trabajo de cada fuerza: W = F d cos φ; la fricción va a 180°.', steps: ['W_F = 50 × 10 × cos 60° = 250 J.', 'W_f = 20 × 10 × cos 180° = −200 J.', 'Peso y normal son ⊥ a d: W = 0. W_neto = 50 J.'], ans: 'W_neto = 50 J',
        setup() { P.F = 50; P.phi = 60; P.d = 10; P.fric = 20; M.reset(false); S.t = -99; }, preview: 600, reveal() { M.reset(true); }, done: () => S.x >= P.d - 1e-6, measured: () => `W_F = ${N1(S.W)} J, W_f = ${N1(S.Wf)} J ⇒ W_neto = ${N1(S.W + S.Wf)} J`},
      tour: [{at: 0.5, view: 'tres'}, {at: 9.5, key: 'phi', to: 0}, {at: 12, sel: '[data-key="w0"]'}, {at: 22, sel: '[data-key="w1"]'}, {at: 33, view: 'lado'}, {at: 34, key: 'phi', to: 37}]
    };
    return M;
  }
};

/* ======================= 2.1 · Trabajo de una fuerza variable: resortera ======================= */
const resortera = {id: 'fuerza-variable', tab: '2.1 Fuerza variable', kicker: KICK('2.1'), title: 'Trabajo de una fuerza variable · la resortera', specs: 'Ligas con k = 40 N/m · estirón de 0.5 m · piedrita de 50 g', noteTag: 'Área bajo F(x)',
  notes: `<p>Si F cambia con la posición, el trabajo es el <b>área bajo la curva F(x)</b>: se suma F Δx en pedazos pequeños (una integral).</p><div class="eq">W = ∫ F(x) dx · resorte: F = −k x ⇒ W = ½ k (x₁² − x₂²)</div>
    <ul><li>La zona sombreada de la gráfica es el trabajo que la liga ya hizo sobre la piedra.</li><li>Duplica el estirón: el trabajo se cuadruplica (área de un triángulo).</li><li>Teorema trabajo–energía: ese trabajo aparece como energía cinética, ½ m v².</li></ul>${legend([[F.T, 'Fuerza de la liga'], [F.v, 'Velocidad']])}`,
  build(K) {
    const g = new THREE.Group(), P = {k: 40, x1: 0.5, m: 50, model: 'lin'};
    const post = K.cyl(0.03, 0.035, 1.0, K.MAT.tex('wood', [0.3, 1], 0.6), 12); post.position.set(0, 0.5, 0); g.add(post);
    const forkL = K.cyl(0.022, 0.022, 0.35, K.MAT.tex('wood', [0.3, 1], 0.6), 10); forkL.position.set(0, 1.13, 0.12); forkL.rotation.x = 0.35; g.add(forkL);
    const forkR = forkL.clone(); forkR.position.z = -0.12; forkR.rotation.x = -0.35; g.add(forkR);
    const tipL = V3(0, 1.28, 0.18), tipR = V3(0, 1.28, -0.18);
    const bandL = K.tubeBetween(tipL, V3(-0.3, 1.28, 0), 0.008, K.MAT.std(0xc92a2a, 0.6)), bandR = K.tubeBetween(tipR, V3(-0.3, 1.28, 0), 0.008, K.MAT.std(0xc92a2a, 0.6)); g.add(bandL, bandR);
    const pouch = K.box(0.06, 0.05, 0.08, K.MAT.std(0x6b4127, 0.8), 0.01); g.add(pouch);
    const stone = K.sph(0.025, K.MAT.std(0x868e96, 0.7), 16); g.add(stone);
    const target = K.cyl(0.4, 0.4, 0.04, K.MAT.std(0xffffff, 0.6), 32); target.rotation.z = PI / 2; target.position.set(14, 1.2, 0); g.add(target); [0.3, 0.2, 0.1].forEach((r, i) => { const d = K.cyl(r, r, 0.045, K.MAT.std(i % 2 ? 0xffffff : 0xe03131, 0.6), 32); d.rotation.z = PI / 2; d.position.set(13.99, 1.2, 0); g.add(d); });
    const ground = K.mesh(new THREE.BoxGeometry(18, 0.04, 3), K.MAT.std(0x9bbf73, 0.95)); ground.position.set(6, 0.0, 0); g.add(ground);
    const vF = K.vector(F.T, 'F liga'), vV = K.vector(F.v, 'v');
    const S = {x: -0.5, v: 0, t: 0, phase: 'held', p: V3(), vel: V3(), W: 0};
    const b = () => P.k / P.x1;   // non-linear: same force at the full stretch
    const Fx = x => x >= 0 ? 0 : (P.model === 'lin' ? -P.k * x : b() * x * x);   // force (+x direction) for x < 0 (pulled back)
    const Wdone = x => P.model === 'lin' ? 0.5 * P.k * (P.x1 * P.x1 - x * x) : b() / 3 * (P.x1 ** 3 - abs(x) ** 3);
    const M = {group: g, P, vectors: [vF, vV],
      defaultView: 'tres', views: {lado: {label: 'Lado', t: [-0.1, 1.15, 0], yaw: 0.0, pitch: 0.05, d: 2.6}, tres: {label: '3/4', t: [-0.1, 1.05, 0], yaw: -0.75, pitch: 0.22, d: 2.8}, vuelo: {label: 'Vuelo', t: [6, 1.1, 0], yaw: 0, pitch: 0.06, d: 14}},
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'v', label: 'Velocidad', on: true}],
      readouts: [{label: 'Estirón x', get: () => N1(abs(min(0, S.x)), 3) + ' m'}, {label: 'Fuerza de la liga', get: () => N1(Fx(min(0, S.x))) + ' N'}, {label: 'Trabajo hecho W', get: () => N1(S.W, 2) + ' J', big: 1, acc: 1}, {label: 'Energía cinética ½ m v²', get: () => N1(0.5 * P.m / 1000 * S.vel.length() ** 2, 2) + ' J', big: 1}, {label: 'Rapidez', get: () => N1(S.vel.length(), 1) + ' m/s'}],
      chart: {title: 'Fuerza de la liga F(x) · el área es el trabajo', xy: true, xr: () => [-0.65, 0.05], yr: () => [0, P.k * 0.65 * 1.05], series: [{label: 'F(x)', color: F.T, noTrace: true}], curve: x => [Fx(x)], curveColors: [F.T], fill: () => S.phase !== 'held' || true ? {a: -P.x1, b: min(0, S.phase === 'held' ? -P.x1 : S.x), y: Fx} : null, marker: () => [min(0, S.x), Fx(min(0, S.x))], unit: 'N', xLabel: 'x (m)'},
      sample: () => null,
      controls: [{type: 'range', key: 'k', label: 'Constante de la liga k', min: 10, max: 100, step: 1, fmt: v => v + ' N/m'}, {type: 'range', key: 'x1', label: 'Estirón', min: 0.1, max: 0.6, step: 0.01, fmt: v => v.toFixed(2) + ' m', on: () => M.reset()}, {type: 'range', key: 'm', label: 'Masa de la piedra', min: 20, max: 200, step: 5, fmt: v => v + ' g'},
        {type: 'chips', key: 'model', label: 'Liga', options: [['Lineal F = kx', 'lin'], ['No lineal F ∝ x²', 'nl']]}, {type: 'buttons', key: 's', primary: 1, items: [['Soltar', () => { M.reset(); S.phase = 'fire'; }], ['Estirar de nuevo', () => M.reset()]]}],
      calls: {lado: [[() => S.p, 'Piedrita', 'Recibe el trabajo de la liga', 1], [() => tipL, 'Ligas · k = 40 N/m', 'Fuerza variable', -1]], tres: [], vuelo: []},
      reset() { S.x = -P.x1; S.vel.set(0, 0, 0); S.phase = 'held'; S.W = 0; S.t = 0; S.hold = 1.2; },
      update(dt) {
        S.t += dt; if (S.phase === 'held') { S.hold -= dt; if (S.hold <= 0 && S.auto !== false) S.phase = 'fire'; }
        const m = P.m / 1000, n = 40, h = dt / n;
        for (let i = 0; i < n; i++) {
          if (S.phase === 'fire') { const a = Fx(S.x) / m; S.vel.x += a * h; S.x += S.vel.x * h; if (S.x >= 0) { S.x = 0; S.phase = 'fly'; S.p.set(0, 1.28, 0); } S.W = Wdone(min(0, S.x)); }
          else if (S.phase === 'fly') { S.vel.y -= g0 * h; S.p.addScaledVector(S.vel, h); if (S.p.y < 0.05 || S.p.x > 13.9) { S.phase = 'done'; S.vel.set(0, 0, 0); } }
        }
      },
      pose() {
        const pp = S.phase === 'held' || S.phase === 'fire' ? V3(S.x, 1.28, 0) : V3(0, 1.28, 0);
        if (S.phase === 'held' || S.phase === 'fire') S.p.copy(pp);
        bandL.userData.set(tipL, pp); bandR.userData.set(tipR, pp); pouch.position.copy(pp); stone.position.copy(S.p);
        K.ov('f') && (S.phase === 'held' || S.phase === 'fire') && S.x < -0.005 ? vF.set(pp.clone().add(V3(0, 0.08, 0)), V3(Fx(S.x), 0, 0), 0.012) : vF.hide();
        K.ov('v') && S.vel.length() > 0.1 ? vV.set(S.p.clone().add(V3(0, -0.07, 0)), S.vel, 0.04, `v<small>${N1(S.vel.length(), 1)} m/s</small>`) : vV.hide();
      },
      problem: {title: 'Resortera (tirachinas)', text: 'Las ligas de una resortera se comportan como un resorte de k = 40 N/m. Se estiran 0.5 m y se suelta una piedrita de 50 g.', q: '¿Cuánto trabajo hace la liga sobre la piedra al regresar a x = 0? ¿Con qué rapidez sale?',
        steps: ['W = ∫ F dx con F = −k x, de 0.5 m a 0: W = ½ k x₁² = ½ × 40 × 0.25.', 'Es el área del triángulo bajo F(x) (sombreada en la gráfica).', 'Trabajo–energía: ½ m v² = 5 J ⇒ v = √(2 × 5 / 0.05).'], ans: 'W = 5 J; la piedra sale a ≈ 14 m/s (≈ 51 km/h).', load() { P.k = 40; P.x1 = 0.5; P.m = 50; P.model = 'lin'; M.reset(); }},
      reto: {title: 'Liga más dura', text: 'Ahora la liga tiene k = 60 N/m, la estiras 0.4 m y lanzas una piedrita de 40 g.', q: '¿Con qué rapidez sale la piedra?', unit: 'm/s', answer: sqrt(60 * 0.16 / 0.04), tol: 0.02,
        hint: 'W = ½ k x² se vuelve ½ m v².', steps: ['W = ½ · 60 · 0.4² = 4.8 J.', '½ · 0.04 · v² = 4.8 ⇒ v² = 240.', 'v ≈ 15.5 m/s.'], ans: 'v ≈ 15.5 m/s',
        setup() { P.k = 60; P.x1 = 0.4; P.m = 40; P.model = 'lin'; M.reset(); S.hold = 99; }, preview: 600, reveal() { M.reset(); S.phase = 'fire'; }, done: () => S.phase === 'fly' || S.phase === 'done', measured: () => `sale a ${N1(S.vel.length(), 2)} m/s`},
      tour: [{at: 0.5, view: 'lado'}, {at: 4, view: 'vuelo'}, {at: 8, view: 'lado'}, {at: 9, key: 'x1', to: 0.25}, {at: 12, sel: '[data-key="s0"]'}, {at: 16, key: 'x1', to: 0.5}, {at: 18, sel: '[data-key="model"] [data-v="nl"]'}, {at: 20, sel: '[data-key="s0"]'}, {at: 25, sel: '[data-key="model"] [data-v="lin"]'}]
    };
    return M;
  }
};

/* ======================= 2.2 · Potencia: auto compacto ======================= */
const potencia = {id: 'potencia', tab: '2.2 Potencia', kicker: KICK('2.2'), title: 'Potencia · el motor de un auto compacto', specs: 'Auto de 1200 kg · motor de 75 kW · aire F = 0.4 v²', noteTag: 'P = F · v',
  notes: `<p>La potencia es la <b>rapidez con la que se hace trabajo</b>.</p><div class="eq">P = dW/dt = F · v   [W = J/s]</div><p>Un motor tiene una potencia máxima. Con P fija, la fuerza disponible baja al subir la velocidad: F = P / v. Por eso un auto acelera fuerte al arrancar y cada vez menos.</p>
    <ul><li>Con potencia constante, la aceleración decae; la velocidad máxima llega cuando P / v = c v².</li><li>Con fuerza constante, la potencia crece con v hasta que el motor no da más.</li><li>La tracción limita la fuerza al arrancar: F ≤ 0.8 m g.</li></ul>${legend([[F.T, 'Fuerza del motor'], [F.f, 'Resistencia del aire'], [F.S, 'Fuerza neta']])}`,
  build(K) {
    const g = new THREE.Group(), P = {mode: 'P', Pk: 75, Fk: 3, m: 1200, air: 1};
    const road = K.mesh(new THREE.PlaneGeometry(4000, 8), K.MAT.std(0x3b3d42, 0.9), false); road.rotation.x = -PI / 2; road.position.set(1900, 0.01, 0); g.add(road);
    for (let x = -50; x < 3900; x += 12) { const dsh = K.box(4, 0.005, 0.15, K.MAT.std(0xf1f3f5, 0.5)); dsh.position.set(x, 0.015, 0); g.add(dsh); }
    for (let x = 0; x < 3900; x += 40) { const pole = K.cyl(0.07, 0.07, 6, K.MAT.std(0x868e96, 0.5), 8); pole.position.set(x, 3, -5); g.add(pole); const lamp = K.box(0.8, 0.15, 0.3, K.MAT.std(0x495057), 0.04); lamp.position.set(x + 0.4, 6, -4.7); g.add(lamp); }
    for (let x = 100; x < 3900; x += 100) { const s = K.box(0.06, 1.2, 0.6, K.MAT.std(0x2f9e44, 0.6)); s.position.set(x, 0.6, 4.5); g.add(s); }
    const car = carModel(K); g.add(car);
    const vF = K.vector(F.T, 'F motor'), vA = K.vector(F.f, 'F aire'), vS = K.vector(F.S, 'ΣF');
    const S = {x: 0, v: 0, t: 0, Fm: 0, Fa: 0, t100: null, stopV: 0};
    const M = {group: g, P, vectors: [vF, vA, vS],
      views: {lado: {label: 'Lado', t: [1, 1, 0], yaw: 0.15, pitch: 0.12, d: 13}, tres: {label: '3/4', t: [1, 0.8, 0], yaw: -0.8, pitch: 0.25, d: 11}},
      follow: () => V3(S.x, 0, 0),
      overlays: [{key: 'f', label: 'Fuerzas', on: true}],
      readouts: [{label: 'Velocidad', get: () => `${N1(S.v * 3.6, 0)} km/h · ${N1(S.v, 1)} m/s`, big: 1}, {label: 'Fuerza del motor', get: () => N1(S.Fm, 0) + ' N'}, {label: 'Resistencia del aire', get: () => N1(S.Fa, 0) + ' N'}, {label: 'Potencia P = F v', get: () => N1(S.Fm * S.v / 1000, 1) + ' kW', acc: 1, big: 1}, {label: 'Aceleración', get: () => N1((S.Fm - S.Fa) / P.m, 2) + ' m/s²'}, {label: '0 → 100 km/h', get: () => S.t100 ? N1(S.t100, 1) + ' s' : '—'}, {label: 'Tiempo', get: () => N1(S.t, 1) + ' s'}],
      chart: {title: 'Velocidad v(t)', series: [{label: 'v', color: F.v}], unit: 'km/h', span: 40, xFrom0: true, refs: [{v: 100, label: '100 km/h', color: F.S}], min: 0},
      sample: () => [S.t, [S.v * 3.6]],
      controls: [{type: 'chips', key: 'mode', label: 'Motor', options: [['Potencia constante', 'P'], ['Fuerza constante', 'F']]}, {type: 'range', key: 'Pk', label: 'Potencia', min: 20, max: 200, step: 1, fmt: v => v + ' kW'}, {type: 'range', key: 'Fk', label: 'Fuerza (modo F)', min: 0.5, max: 8, step: 0.1, fmt: v => v.toFixed(1) + ' kN'},
        {type: 'range', key: 'm', label: 'Masa del auto', min: 800, max: 2500, step: 10, fmt: v => v + ' kg'}, {type: 'chips', key: 'air', label: 'Aire', options: [['Con aire c = 0.4', 1], ['Sin aire', 0]]}, {type: 'buttons', key: 'c', primary: 1, items: [['Arrancar', () => M.reset()]]}],
      calls: {tres: [[() => car.localToWorld(V3(1.2, 0.8, 0)), 'Motor · 75 kW', 'Fuerza disponible F = P / v', 1]], lado: []},
      reset() { S.x = 0; S.v = 0; S.t = 0; S.t100 = null; S.stopV = 0; },
      update(dt) {
        if (S.stopV && S.v >= S.stopV) { K.running = false; return; }
        const n = 10, h = dt / n;
        for (let i = 0; i < n; i++) {
          const cap = 0.8 * P.m * g0; S.Fm = P.mode === 'P' ? min(cap, P.Pk * 1000 / max(S.v, 0.1)) : min(P.Fk * 1000, cap);
          S.Fa = P.air ? 0.4 * S.v * S.v : 0; S.v = max(0, S.v + (S.Fm - S.Fa) / P.m * h); S.x += S.v * h; S.t += h;
          if (!S.t100 && S.v >= 100 / 3.6) S.t100 = S.t;
          if (S.stopV && S.v >= S.stopV) { S.v = S.stopV; break; }
        }
      },
      pose() { car.position.set(S.x, 0, 0); car.userData.w.forEach(w => w.rotation.y += S.v * 0.016 / 0.33); const o = V3(S.x, 1.8, 1.0), sc = min(0.0006, 3.2 / max(S.Fm, S.Fa, 1));
        if (K.ov('f')) { vF.set(o, V3(S.Fm, 0, 0), sc); S.Fa > 1 ? vA.set(o.clone().add(V3(0, 0.3, 0)), V3(-S.Fa, 0, 0), sc) : vA.hide(); abs(S.Fm - S.Fa) > 1 ? vS.set(o.clone().add(V3(0, 0.6, 0)), V3(S.Fm - S.Fa, 0, 0), sc) : vS.hide(); } else [vF, vA, vS].forEach(v => v.hide()); },
      problem: {title: 'Velocidad máxima de un auto compacto', text: 'Un auto de 1200 kg tiene un motor de 75 kW (≈ 100 hp). La resistencia del aire es F = c v² con c = 0.4 kg/m.', q: '¿Cuál es su velocidad máxima en carretera plana? ¿Cuánto tarda en llegar a 100 km/h?',
        steps: ['A máxima velocidad la aceleración es cero: F_motor = F_aire. Con P = F v: P / v = c v².', 'v_máx = (P / c)^(1/3) = (75 000 / 0.4)^(1/3) ≈ 57 m/s.', 'El tiempo a 100 km/h no tiene fórmula sencilla (F = P/v cambia): léelo en «0 → 100 km/h».'], ans: 'v_máx ≈ 57 m/s ≈ 206 km/h. 0–100 km/h en ≈ 8–9 s en la simulación.', load() { P.mode = 'P'; P.Pk = 75; P.m = 1200; P.air = 1; M.reset(); }},
      reto: {title: 'Potencia a 72 km/h', text: 'Sin resistencia del aire, el motor empuja un auto de 1200 kg con fuerza constante de 3 kN (limitada por la caja de cambios).', q: '¿Qué potencia entrega el motor justo al llegar a 20 m/s (72 km/h)?', unit: 'kW', answer: 60, tol: 0.02,
        hint: 'P = F v en ese instante.', steps: ['P = F · v = 3000 N × 20 m/s.', 'P = 60 000 W = 60 kW (al arrancar era casi cero).'], ans: 'P = 60 kW',
        setup() { P.mode = 'F'; P.Fk = 3; P.Pk = 200; P.m = 1200; P.air = 0; M.reset(); }, preview: 1200, reveal() { M.reset(); S.stopV = 20; }, done: () => S.v >= 20 - 1e-6, measured: () => `a ${N1(S.v, 1)} m/s: P = ${N1(S.Fm * S.v / 1000, 1)} kW`},
      tour: [{at: 0.5, view: 'tres'}, {at: 6, view: 'lado'}, {at: 14, sel: '[data-key="mode"] [data-v="F"]'}, {at: 15, sel: '[data-key="c0"]'}, {at: 26, sel: '[data-key="mode"] [data-v="P"]'}, {at: 27, sel: '[data-key="c0"]'}]
    };
    return M;
  }
};

/* ======================= 2.3 · Energía cinética: carrito de supermercado ======================= */
const cinetica = {id: 'energia-cinetica', tab: '2.3 Energía cinética', kicker: KICK('2.3'), title: 'Teorema trabajo–energía · el carrito de supermercado', specs: 'Carrito de 10 kg · empuje de 25 N · μₖ = 0.1', noteTag: 'W neto = ΔK',
  notes: `<div class="eq">W_neto = ΔK = ½ m v_f² − ½ m v_i²</div><p>El trabajo neto (de todas las fuerzas) es igual al cambio de energía cinética. Fuerzas a favor del movimiento aumentan K; fuerzas en contra (fricción, viento) la disminuyen.</p>
    <ul><li>En las barras, W neto mide siempre lo mismo que ΔK.</li><li>Pon F = 0 con velocidad inicial: solo la fricción hace trabajo; se detiene cuando W_f = −Kᵢ.</li><li>El peso y la normal no hacen trabajo: son ⊥ al desplazamiento.</li></ul>${legend([[F.T, 'Empuje'], [F.f, 'Fricción'], ['#868e96', 'Viento'], [F.S, 'Fuerza neta']])}`,
  build(K) {
    const g = new THREE.Group(), P = {F: 25, dp: 10, m: 10, v0: 0, mu: 0.1, wind: 0};
    const floor = K.mesh(new THREE.BoxGeometry(30, 0.04, 4), K.MAT.std(0xe9e4da, 0.4)); floor.position.set(10, 0.02, 0); g.add(floor);
    for (let x = 0; x <= 25; x += 1) { const tl = K.box(0.015, 0.003, 4, K.MAT.std(0xcfc8bb, 0.5)); tl.position.set(x, 0.042, 0); g.add(tl); }
    const shelfMat = K.MAT.std(0xf8f9fa, 0.5); for (let x = -2; x < 26; x += 3.2) { const sh = K.box(3, 1.8, 0.6, shelfMat, 0.02); sh.position.set(x, 0.92, -2.2); g.add(sh); for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const it = K.box(0.3, 0.32, 0.3, K.MAT.plastic([0xe03131, 0xf59f00, 0x1c7ed6, 0x2f9e44, 0x7048e8][(k + r) % 5], 0.5), 0.02); it.position.set(x - 1.2 + k * 0.48, 0.35 + r * 0.55, -1.95); g.add(it); } }
    const cart = new THREE.Group(); g.add(cart);
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.55), new THREE.MeshStandardMaterial({color: 0xadb5bd, metalness: 0.8, roughness: 0.35, wireframe: true})); basket.position.y = 0.75; cart.add(basket);
    const frame = K.box(0.92, 0.03, 0.57, K.MAT.metal(), 0.01); frame.position.y = 0.5; cart.add(frame);
    const handle = K.cyl(0.015, 0.015, 0.55, K.MAT.plastic(0xe03131), 10); handle.rotation.x = PI / 2; handle.position.set(-0.55, 1.05, 0); cart.add(handle);
    [[0.38, 0.24], [0.38, -0.24], [-0.38, 0.24], [-0.38, -0.24]].forEach(([x, z]) => { const w = K.cyl(0.06, 0.06, 0.03, K.MAT.rubber(), 16); w.rotation.x = PI / 2; w.position.set(x, 0.07, z); cart.add(w); const leg = K.cyl(0.01, 0.01, 0.43, K.MAT.metal(), 6); leg.position.set(x, 0.29, z); cart.add(leg); });
    const shopper = K.person({shirt: 0x7048e8, pants: 0x343a40}); g.add(shopper.group);
    const vP = K.vector(F.T, 'F'), vf = K.vector(F.f, 'f'), vw = K.vector('#868e96', 'viento'), vS = K.vector(F.S, 'ΣF');
    const S = {x: 0, v: 0, t: 0, WF: 0, Wf: 0, Ww: 0, stopped: false, hold: 0.8};
    const Kin = () => 0.5 * P.m * S.v * S.v, K0 = () => 0.5 * P.m * P.v0 * P.v0;
    const M = {group: g, P, vectors: [vP, vf, vw, vS],
      views: {lado: {label: 'Lado', t: [1, 0.8, 0], yaw: 0.05, pitch: 0.08, d: 6}, tres: {label: '3/4', t: [1, 0.7, 0], yaw: -0.6, pitch: 0.25, d: 6.5}},
      follow: () => V3(S.x, 0, 0),
      overlays: [{key: 'f', label: 'Fuerzas', on: true}],
      readouts: [{label: 'Posición', get: () => N1(S.x, 2) + ' m'}, {label: 'Velocidad', get: () => N1(S.v, 2) + ' m/s', big: 1}, {label: 'Energía cinética K', get: () => N1(Kin(), 1) + ' J'}],
      bars: {title: 'Trabajo y energía (J)', items: [{label: 'W empuje', color: F.T, get: () => S.WF}, {label: 'W fricción', color: F.f, get: () => S.Wf}, {label: 'W viento', color: '#868e96', get: () => S.Ww}, {label: 'W neto', color: F.N, get: () => S.WF + S.Wf + S.Ww}, {label: 'ΔK', color: F.S, get: () => Kin() - K0()}]},
      chart: {title: 'K y W neto contra distancia', xy: true, xr: () => [0, 14], yr: () => [min(-K0(), -20), max(P.F * P.dp, K0(), 40) * 1.1], series: [{label: 'K − Kᵢ', color: F.S}, {label: 'W neto', color: F.N, w: 1}], unit: 'J', xLabel: 'x (m)'},
      sample: () => [S.x, [Kin() - K0(), S.WF + S.Wf + S.Ww]],
      controls: [{type: 'range', key: 'F', label: 'Empuje', min: 0, max: 60, step: 0.5, fmt: v => v + ' N'}, {type: 'range', key: 'dp', label: 'Distancia de empuje', min: 0, max: 14, step: 0.5, fmt: v => v + ' m'}, {type: 'range', key: 'm', label: 'Masa', min: 2, max: 40, step: 0.5, fmt: v => v + ' kg'},
        {type: 'range', key: 'v0', label: 'Velocidad inicial', min: 0, max: 8, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'}, {type: 'range', key: 'mu', label: 'μₖ', min: 0, max: 0.5, step: 0.01, fmt: v => v.toFixed(2)}, {type: 'range', key: 'wind', label: 'Viento en contra', min: 0, max: 10, step: 0.5, fmt: v => v + ' N'},
        {type: 'buttons', key: 'c', primary: 1, items: [['Empezar', () => { M.reset(); S.hold = 0; }]]}],
      calls: {tres: [[() => cart.localToWorld(V3(0.3, 1.0, 0)), 'Carrito · 10 kg', 'K = ½ m v²', 1]], lado: []},
      reset() { S.x = 0; S.v = P.v0; S.t = 0; S.WF = 0; S.Wf = 0; S.Ww = 0; S.stopped = false; S.hold = 0.8; K.clearChart(); },
      update(dt) {
        S.t += dt; if (S.hold > 0) { S.hold -= dt; return; } const n = 20, h = dt / n;
        for (let i = 0; i < n; i++) {
          const push = S.x < P.dp ? P.F : 0, fr = P.mu * P.m * g0;
          if (S.v <= 1e-6 && push - P.wind <= fr) { S.v = 0; S.f = push - P.wind; S.stopped = true; S.Fn = 0; continue; }
          S.stopped = false; const Fn = push - fr - P.wind; S.Fn = Fn; S.f = fr; const v1 = max(0, S.v + Fn / P.m * h), dx = (S.v + v1) / 2 * h; S.v = v1; S.x += dx; S.WF += push * dx; S.Wf -= fr * dx; S.Ww -= P.wind * dx;
        }
        if (S.x > 24) { S.x = 24; S.v = 0; }
      },
      pose() { cart.position.set(S.x, 0.04, 0); const pushing = S.x < P.dp && P.F > 0; shopper.group.position.set(S.x - (pushing ? 1.05 : 1.6 + max(0, S.x - P.dp) * 0), 0.04, 0); if (!pushing) shopper.group.position.x = min(shopper.group.position.x, P.dp - 1.2); shopper.pose({armL: pushing ? -1.3 : 0.1, armR: pushing ? -1.3 : 0.1, lean: pushing ? 0.15 : 0, stride: pushing && S.v > 0.05 ? sin(S.t * 7) * 0.35 : 0});
        const o = V3(S.x, 0.9, 0.4), sc = 0.03, push = S.x < P.dp ? P.F : 0;
        if (K.ov('f')) { push > 0 ? vP.set(o, V3(push, 0, 0), sc) : vP.hide(); (S.v > 1e-6 && P.mu > 0) ? vf.set(o.clone().add(V3(0, -0.6, 0)), V3(-P.mu * P.m * g0, 0, 0), sc) : vf.hide(); P.wind > 0 ? vw.set(o.clone().add(V3(0, 0.25, 0)), V3(-P.wind, 0, 0), sc) : vw.hide(); abs(S.Fn || 0) > 0.05 && !S.stopped ? vS.set(o.clone().add(V3(0, 0.5, 0)), V3(S.Fn, 0, 0), sc) : vS.hide(); } else [vP, vf, vw, vS].forEach(v => v.hide()); },
      problem: {title: 'Carrito de supermercado', text: 'Empujas un carrito de supermercado de 10 kg, que parte del reposo, con una fuerza horizontal de 25 N durante 10 m. La fricción equivale a μₖ = 0.1.', q: '¿Con qué rapidez va el carrito después de los 10 m?',
        steps: ['Trabajo de tu fuerza: W_F = 25 × 10 = 250 J.', 'Trabajo de la fricción: W_f = −0.1 × 10 × 9.8 × 10 = −98 J.', 'W_neto = 152 J = ΔK = ½ × 10 × v² ⇒ v = √30.4.'], ans: 'v ≈ 5.5 m/s (lee la velocidad al pasar x = 10 m).', load() { Object.assign(P, {F: 25, dp: 10, m: 10, v0: 0, mu: 0.1, wind: 0}); M.reset(); }},
      reto: {title: 'Frenado con viento en contra', text: 'Un carrito de 2 kg rueda a 6 m/s sin que nadie lo empuje, con μₖ = 0.30 (μₛ igual). Además, el viento lo empuja hacia atrás con 4 N.', q: '¿Qué distancia recorre hasta detenerse?', unit: 'm', answer: 36 / (4 + 0.3 * 2 * g0), tol: 0.03,
        hint: 'teorema trabajo–energía: (F_viento + f) d = ½ m v².', steps: ['Fuerzas en contra: 4 N + μₖ m g = 4 + 5.88 = 9.88 N.', '−9.88 d = 0 − ½ × 2 × 36 = −36 J.', 'd = 36 / 9.88. Después no regresa: 4 N < μₛ m g = 5.88 N.'], ans: 'd ≈ 3.64 m',
        setup() { Object.assign(P, {F: 0, dp: 0, m: 2, v0: 6, mu: 0.3, wind: 4}); M.reset(); S.hold = 99; }, preview: 500, reveal() { M.reset(); S.hold = 0; }, done: () => S.stopped && S.x > 0.1, measured: () => `se detiene a ${N1(S.x, 2)} m`},
      tour: [{at: 0.5, view: 'tres'}, {at: 14, view: 'lado'}, {at: 16, key: 'F', to: 0}, {at: 17, key: 'v0', to: 5}, {at: 19, sel: '[data-key="c0"]'}, {at: 28, key: 'v0', to: 0}, {at: 29, key: 'F', to: 25}]
    };
    return M;
  }
};

/* ======================= 2.4 · Fuerzas conservativas: la mochila y tres caminos ======================= */
const conservativas = {id: 'conservativas', tab: '2.4 Conservativas', kicker: KICK('2.4'), title: 'Fuerzas conservativas · subir la mochila por tres caminos', specs: 'Mochila de 1 kg · de A a B: 4 m más arriba · gravedad o fricción de 3 N', noteTag: 'W = −ΔU',
  notes: `<p>Una fuerza es <b>conservativa</b> si el trabajo que hace entre A y B no depende del camino (o, igual, si su trabajo en cualquier camino cerrado es cero). Solo entonces existe una energía potencial U.</p><div class="eq">W_A→B = −[U(B) − U(A)] · gravedad: U = m g y</div>
    <ul><li>La gravedad hace −39.2 J por cualquiera de los tres caminos.</li><li>La fricción no es conservativa: su trabajo crece con la longitud del camino.</li><li>Lazo cerrado A → B → A: la gravedad suma cero; la fricción, no.</li></ul>${legend([[F.W, 'Peso (gravedad)'], [F.f, 'Fricción'], [F.v, 'Dirección del movimiento']])}`,
  build(K) {
    const g = new THREE.Group(), P = {path: 'recto', field: 'g'};
    const A = V3(0, 0.05, 0), B = V3(5, 4.05, 0);
    const plat = K.box(2.4, 0.1, 2, K.MAT.std(0xdee2e6, 0.7), 0.02); plat.position.set(5.8, 4.0, 0); g.add(plat);
    const tower = K.box(2.4, 4, 2, K.MAT.std(0xf1f3f5, 0.9)); tower.position.set(5.8, 2, -0.2); tower.scale.z = 0.8; g.add(tower);
    const PATHS = {
      recto: t => A.clone().lerp(B, t),
      escalon: t => { const pts = [A, V3(0, 4.05, 0), B]; const L1 = 4, L2 = 5, L = L1 + L2, s = t * L; return s < L1 ? A.clone().lerp(pts[1], s / L1) : pts[1].clone().lerp(B, (s - L1) / L2); },
      curvo: t => { const p0 = A, p1 = V3(-2, 6, 0), p2 = V3(3, 8, 0), p3 = B; const u = 1 - t; return p0.clone().multiplyScalar(u * u * u).addScaledVector(p1, 3 * u * u * t).addScaledVector(p2, 3 * u * t * t).addScaledVector(p3, t * t * t); },
      lazo: t => t < 0.5 ? PATHS.escalon(t * 2) : PATHS.recto(1 - (t - 0.5) * 2)
    };
    const len = {}; Object.keys(PATHS).forEach(k => { let L = 0, p = PATHS[k](0); for (let i = 1; i <= 400; i++) { const q = PATHS[k](i / 400); L += q.distanceTo(p); p = q; } len[k] = L; });
    const tubes = {}; const COLS = {recto: 0x3d8fe0, escalon: 0x7048e8, curvo: 0x0ca678, lazo: 0xf59f00};
    Object.keys(PATHS).forEach(k => { if (k === 'lazo') return; const pts = []; for (let i = 0; i <= 120; i++) pts.push(PATHS[k](i / 120)); const tb = K.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 240, 0.03, 8, false), new THREE.MeshStandardMaterial({color: COLS[k], roughness: 0.4, transparent: true, opacity: 0.35})); g.add(tb); tubes[k] = tb; });
    const pa = K.sph(0.08, K.MAT.std(0x16181b), 16); pa.position.copy(A); g.add(pa); const pb = K.sph(0.08, K.MAT.std(0x16181b), 16); pb.position.copy(B); g.add(pb);
    const bag = new THREE.Group(); const bb = K.box(0.3, 0.38, 0.18, K.MAT.plastic(0xe03131, 0.6), 0.06); bag.add(bb); const pk = K.box(0.2, 0.15, 0.04, K.MAT.plastic(0xc92a2a, 0.6), 0.02); pk.position.set(0, -0.06, 0.1); bag.add(pk); g.add(bag);
    const field = new THREE.Group(); g.add(field); for (let x = -2; x <= 6; x += 1.6) for (let y = 0.8; y <= 8; y += 1.6) { const a = K.vector(F.W, '', {ghost: 1, r: 0.008}); a.set(V3(x, y, -0.4), V3(0, -1, 0), 0.4, ''); a.label.style.display = 'none'; a.label.remove(); field.add(a.group); }
    const vW = K.vector(F.W, 'W'), vf = K.vector(F.f, 'f'), vdir = K.vector(F.v, 'dr');
    const S = {t: 0, u: 0, W: 0, dist: 0, prev: A.clone(), run: true};
    const force = (dir) => P.field === 'g' ? V3(0, -1 * g0, 0) : dir.clone().multiplyScalar(-3);
    const M = {group: g, P, vectors: [vW, vf, vdir],
      views: {frente: {label: 'Frente', t: [2.5, 3.6, 0], yaw: 0, pitch: 0.05, d: 17}, tres: {label: '3/4', t: [2.5, 3.4, 0], yaw: -0.55, pitch: 0.2, d: 17}},
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'field', label: 'Campo', on: true}],
      readouts: [{label: 'Camino', get: () => ({recto: 'Recto', escalon: 'Escalón', curvo: 'Rodeo curvo', lazo: 'Lazo A→B→A'})[P.path]}, {label: 'Longitud del camino', get: () => N1(len[P.path], 2) + ' m'}, {label: 'Recorrido', get: () => N1(S.dist, 2) + ' m'}, {label: 'Trabajo acumulado', get: () => N1(S.W, 1) + ' J', big: 1, acc: 1},
        {label: 'W gravedad (cualquier camino)', get: () => P.path === 'lazo' ? '0.0 J' : N1(-g0 * 4, 1) + ' J'}, {label: 'W fricción (este camino)', get: () => N1(-3 * len[P.path], 1) + ' J'}],
      chart: {title: 'Trabajo acumulado contra distancia recorrida', xy: true, xr: () => [0, len[P.path]], yr: () => P.field === 'g' ? [-45, 10] : [-3 * len[P.path] * 1.05, 2], series: [{label: 'W', color: P.field === 'g' ? F.W : F.f}], unit: 'J', xLabel: 's (m)'},
      sample: () => [S.dist, [S.W]],
      controls: [{type: 'chips', key: 'path', label: 'Camino de A a B', options: [['Recto', 'recto'], ['Escalón', 'escalon'], ['Rodeo', 'curvo'], ['Lazo cerrado', 'lazo']], on: () => M.reset()}, {type: 'chips', key: 'field', label: 'Fuerza', options: [['Gravedad (1 kg)', 'g'], ['Fricción 3 N', 'fr']], on: () => M.reset()},
        {type: 'buttons', key: 'c', primary: 1, items: [['Llevar la mochila', () => M.reset()]]}, {type: 'note', text: 'La mochila se mueve a ritmo constante: la fuerza que la lleva no importa aquí; medimos el trabajo de la gravedad o de la fricción.'}],
      calls: {frente: [[() => A, 'A · suelo', 'y = 0', -1], [() => B, 'B · 4 m arriba', 'U = m g y', 1]], tres: []},
      reset() { S.u = 0; S.W = 0; S.dist = 0; S.prev = A.clone(); S.run = true; K.clearChart(); Object.entries(tubes).forEach(([k, tb]) => tb.material.opacity = (P.path === k || (P.path === 'lazo' && (k === 'escalon' || k === 'recto'))) ? 0.95 : 0.2); },
      update(dt) { if (!S.run) return; const L = len[P.path], du = dt * 1.6 / L; const n = 20; for (let i = 0; i < n; i++) { S.u = min(1, S.u + du / n); const p = PATHS[P.path](S.u), dr = p.clone().sub(S.prev); const dl = dr.length(); if (dl > 0) { S.W += force(dr.clone().normalize()).dot(dr); S.dist += dl; S.dir = dr.normalize(); } S.prev = p; } if (S.u >= 1) S.run = false; },
      pose() {
        const p = PATHS[P.path](S.u); bag.position.copy(p).add(V3(0, 0.22, 0));
        field.visible = K.ov('field') && P.field === 'g';
        const o = p.clone().add(V3(0, 0.22, 0.25)), dir = S.dir || V3(1, 0, 0);
        if (K.ov('f')) { if (P.field === 'g') { vW.set(o, V3(0, -g0, 0), 0.07); vf.hide(); } else { vf.set(o, dir.clone().multiplyScalar(-3), 0.15); vW.hide(); } vdir.set(o, dir, 0.5, 'dr'); } else [vW, vf, vdir].forEach(v => v.hide());
      },
      problem: {title: 'Subir una mochila al estante', text: 'Llevas una mochila de 1 kg del punto A al punto B, que está 4 m más arriba. Puedes ir por la escalera recta, por un camino en escalón o dando un rodeo.', q: '¿Cuánto trabajo hace la gravedad en cada camino? ¿Y si la fuerza fuera fricción?',
        steps: ['La gravedad es conservativa: W = −ΔU = −m g Δy = −1 × 9.8 × 4.', 'Es igual para los tres caminos: solo importan la altura inicial y final.', 'Con «Fricción 3 N»: W = −3 N × longitud, y el camino más largo pierde más energía.'], ans: 'W_gravedad = −39.2 J por cualquier camino. Con fricción, W depende de la longitud.', load() { P.field = 'g'; P.path = 'curvo'; M.reset(); }},
      reto: {title: 'El rodeo con fricción', text: 'Con una fuerza de fricción de 3 N, llevas la mochila de A a B por el rodeo curvo (la longitud aparece en las lecturas al elegir ese camino), y regresas a A por el camino recto.', q: '¿Cuál es el trabajo total de la fricción en el viaje de ida por el rodeo y vuelta por el recto?', unit: 'J', answer: -3 * (len_c => len_c)(0), tol: 0.03,
        hint: 'W_f = −f × (longitud total recorrida); el recto mide √(5² + 4²).', steps: ['Ida por el rodeo: −3 × L_rodeo.', 'Vuelta por el recto: −3 × √41 ≈ −19.2 J.', 'La fricción nunca «devuelve» energía: el total es la suma de ambas.'], ans: '',
        setup() { P.field = 'fr'; P.path = 'curvo'; M.reset(); S.run = false; }, preview: 300, reveal() { P.path = 'curvo'; P.field = 'fr'; M.reset(); this.stage = 1; }, done() { if (!S.run && this.stage === 1) { this.Wa = S.W; P.path = 'recto'; const Wkeep = S.W; M.reset(); S.u = 0; S.W = 0; this.stage = 2; this.back = true; return false; } return !S.run && this.stage === 2; }, measured() { return `ida ${N1(this.Wa, 1)} J + vuelta ${N1(S.W, 1)} J = ${N1(this.Wa + S.W, 1)} J`; }},
      tour: [{at: 0.5, view: 'frente'}, {at: 6, sel: '[data-key="path"] [data-v="escalon"]'}, {at: 14, sel: '[data-key="path"] [data-v="curvo"]'}, {at: 24, sel: '[data-key="field"] [data-v="fr"]'}, {at: 34, sel: '[data-key="field"] [data-v="g"]'}, {at: 35, sel: '[data-key="path"] [data-v="recto"]'}]
    };
    const r = M.reto; r.answer = -3 * (len.curvo + len.recto); r.ans = `W_f = −3 × (${N1(len.curvo, 2)} + ${N1(len.recto, 2)}) ≈ ${N1(r.answer, 1)} J`; r.steps[0] = `Ida por el rodeo: −3 × ${N1(len.curvo, 2)} m = ${N1(-3 * len.curvo, 1)} J.`;
    r.text = `Con una fuerza de fricción de 3 N, llevas la mochila de A a B por el rodeo curvo (${N1(len.curvo, 2)} m de largo) y regresas a A por el camino recto.`;
    return M;
  }
};

/* ======================= 2.5 · Curvas de energía potencial ======================= */
const curvas = {id: 'curvas-u', tab: '2.5 Curvas de U', kicker: KICK('2.5'), title: 'Curvas de energía potencial · la canica en la pista U(x)', specs: 'Masa 1 kg · la altura de la pista dibuja U(x) · E = K + U', noteTag: 'F = −dU/dx',
  notes: `<p>Una gráfica U(x) dice casi todo sobre el movimiento en 1D. La fuerza es menos la pendiente.</p><div class="eq">F(x) = −dU/dx · K = E − U(x) ≥ 0</div>
    <p>El cuerpo solo puede estar donde U ≤ E; donde U = E están los <b>puntos de retorno</b>. En un mínimo de U hay equilibrio estable; en un máximo, inestable.</p><ul><li>Donde la pista sube hacia la derecha, F apunta a la izquierda, y viceversa.</li><li>Doble pozo: con E &lt; 0 la canica queda atrapada en un pozo; con E &gt; 0 pasa de uno a otro.</li><li>Molécula: con E &lt; 0 los átomos quedan ligados; con E &gt; 0 se separan.</li></ul>${legend([[F.S, 'F = −dU/dx'], [F.E, 'Nivel de energía E']])}`,
  build(K) {
    const g = new THREE.Group(), P = {pot: 'dw', x0: 2.0, Kx: 0};
    const POT = {
      spring: {U: x => x * x, dU: x => 2 * x, xr: [-2.6, 2.6], hs: 0.32, ur: [-1, 7.5], x0: 2},
      dw: {U: x => x ** 4 - 4 * x * x, dU: x => 4 * x ** 3 - 8 * x, xr: [-2.3, 2.3], hs: 0.32, ur: [-5, 8], x0: 2},
      lj: {U: x => 8 * ((1 / x) ** 12 - (1 / x) ** 6), dU: x => 8 * (-12 / x ** 13 + 6 / x ** 7), xr: [0.95, 3.5], hs: 0.5, ur: [-2.5, 4], x0: 1.05}
    };
    let track = null, fillM = null; const trackG = new THREE.Group(); g.add(trackG);
    const ball = K.sph(0.09, K.MAT.std(0x1c7ed6, 0.25, 0.2), 24); g.add(ball);
    const eLine = K.box(1, 0.012, 0.012, K.MAT.std(0x16181b, 0.5)); g.add(eLine);
    const tp = [K.cyl(0.012, 0.012, 0.5, K.MAT.std(0xf05a23, 0.5), 8), K.cyl(0.012, 0.012, 0.5, K.MAT.std(0xf05a23, 0.5), 8)]; tp.forEach(t => g.add(t));
    const vF = K.vector(F.S, 'F'), vV = K.vector(F.v, 'v');
    const S = {x: 2, v: 0, t: 0};
    const pot = () => POT[P.pot], E = () => pot().U(P.x0) + P.Kx, X = x => (x - (pot().xr[0] + pot().xr[1]) / 2) * 1.0, Y = u => (u - pot().ur[0]) * pot().hs;
    function rebuild() { if (track) trackG.remove(track); if (fillM) trackG.remove(fillM); const p = pot(), pts = [], sh = new THREE.Shape(); const N = 200; for (let i = 0; i <= N; i++) { const x = p.xr[0] + (p.xr[1] - p.xr[0]) * i / N, u = min(p.ur[1], p.U(x)); pts.push(V3(X(x), Y(u), 0)); i ? sh.lineTo(X(x), Y(u)) : sh.moveTo(X(x), Y(u)); } sh.lineTo(X(p.xr[1]), 0); sh.lineTo(X(p.xr[0]), 0); sh.closePath();
      track = K.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.025, 8, false), K.MAT.metal(0x495057, 0.35)); trackG.add(track);
      fillM = K.mesh(new THREE.ExtrudeGeometry(sh, {depth: 0.3, bevelEnabled: false}), K.MAT.std(0xe9ecef, 0.8)); fillM.position.z = -0.32; trackG.add(fillM); P.bk = P.pot; }
    const M = {group: g, P, vectors: [vF, vV],
      views: {frente: {label: 'Frente', t: [0, 1.6, 0], yaw: 0, pitch: 0.05, d: 7}, tres: {label: '3/4', t: [0, 1.4, 0], yaw: -0.5, pitch: 0.2, d: 7}},
      overlays: [{key: 'f', label: 'Fuerza', on: true}, {key: 'e', label: 'Línea de E', on: true}],
      readouts: [{label: 'Posición x', get: () => N1(S.x, 2) + ' m'}, {label: 'U(x)', get: () => N1(pot().U(S.x), 2) + ' J'}, {label: 'K = E − U', get: () => N1(0.5 * S.v * S.v, 2) + ' J'}, {label: 'E total', get: () => N1(E(), 2) + ' J', acc: 1}, {label: 'F = −dU/dx', get: () => N1(-pot().dU(S.x), 2) + ' N', big: 1}],
      chart: {title: 'U(x) con el nivel de energía E', xy: true, xr: () => pot().xr, yr: () => pot().ur, series: [{label: 'U(x)', color: F.U, noTrace: true}], curve: x => [pot().U(x)], curveColors: [F.U], hlines: [{v: () => E(), label: 'E', color: F.E}], marker: () => [S.x, pot().U(S.x)], unit: 'J', xLabel: 'x (m)'},
      sample: () => null,
      controls: [{type: 'chips', key: 'pot', label: 'Potencial', options: [['Resorte', 'spring'], ['Doble pozo', 'dw'], ['Molécula', 'lj']], on: () => { P.x0 = pot().x0; P.Kx = 0; M.reset(); K.refresh(); }}, {type: 'range', key: 'x0', label: 'Soltar desde x₀', min: -2.3, max: 3.5, step: 0.01, fmt: v => v.toFixed(2) + ' m', on: () => M.reset()}, {type: 'range', key: 'Kx', label: 'Energía cinética extra', min: 0, max: 6, step: 0.05, fmt: v => v.toFixed(2) + ' J', on: () => M.reset()},
        {type: 'buttons', key: 'c', primary: 1, items: [['Soltar', () => M.reset()], ['En la cima x = 0', () => { P.x0 = 0.001; P.Kx = 0; M.reset(); }]]}],
      calls: {frente: [[() => ball.position, 'Canica · 1 kg', 'Solo vive donde U ≤ E', 1]], tres: []},
      reset() { const p = pot(); P.x0 = max(p.xr[0] + 0.02, min(p.xr[1] - 0.02, P.x0)); S.x = P.x0; S.v = -sqrt(2 * P.Kx) * Math.sign(P.x0 || 1); S.t = 0; },
      update(dt) { if (P.bk !== P.pot) rebuild(); const p = pot(), n = 60, h = dt / n; for (let i = 0; i < n; i++) { S.v += -p.dU(S.x) * h; S.x += S.v * h; if (S.x < p.xr[0]) { S.x = p.xr[0]; S.v = abs(S.v); } if (S.x > p.xr[1]) { S.x = p.xr[1]; S.v = -abs(S.v); if (P.pot === 'lj') S.v = 0; } S.vmax = max(S.vmax || 0, abs(S.v)); } S.t += dt; },
      pose() {
        const p = pot(), u = p.U(S.x), slope = p.dU(S.x) * p.hs, nrm = V3(-slope, 1, 0).normalize();
        ball.position.set(X(S.x), Y(u), 0).addScaledVector(nrm, 0.11);
        const e = E(); eLine.visible = K.ov('e') && e < p.ur[1]; eLine.position.set(0, Y(e), 0.05); eLine.scale.x = (p.xr[1] - p.xr[0]);
        const tps = []; const N = 600; for (let i = 0; i < N; i++) { const a = p.xr[0] + (p.xr[1] - p.xr[0]) * i / N, b = a + (p.xr[1] - p.xr[0]) / N; if ((p.U(a) - e) * (p.U(b) - e) < 0) tps.push((a + b) / 2); }
        tp.forEach((t, i) => { const xv = tps[i === 0 ? 0 : tps.length - 1]; t.visible = K.ov('e') && xv !== undefined && tps.length > (i ? 1 : 0); if (t.visible) t.position.set(X(xv), Y(e) - 0.25, 0.05); });
        K.ov('f') && abs(p.dU(S.x)) > 0.02 ? vF.set(ball.position.clone().add(V3(0, 0.18, 0.12)), V3(-p.dU(S.x), 0, 0), 0.12) : vF.hide();
        abs(S.v) > 0.02 ? vV.set(ball.position.clone().add(V3(0, -0.02, 0.15)), V3(S.v, 0, 0), 0.25, `v<small>${N1(abs(S.v), 2)} m/s</small>`) : vV.hide();
      },
      problem: {title: 'Interruptor biestable (MEMS)', text: 'Muchos microinterruptores tienen dos posiciones estables. Un modelo es el doble pozo U(x) = x⁴ − 4x² (en J, x en m). El interruptor descansa en un mínimo.', q: '¿Dónde están las posiciones estables? ¿Cuánta energía mínima hay que darle para cambiarlo de estado?',
        steps: ['Equilibrio: F = −dU/dx = −(4x³ − 8x) = 0 ⇒ x = 0 o x = ±√2 ≈ ±1.41 m.', 'x = ±√2 son mínimos (estables), con U = −4 J; x = 0 es un máximo (inestable), U = 0.', 'Para cruzar la barrera, E debe superar U(0): ΔE = 0 − (−4) = 4 J.', 'Prueba: suelta desde x₀ = 1.41 con energía extra de 3.9 J y luego de 4.1 J.'], ans: 'Estables en x = ±1.41 m; se necesitan más de 4 J para cambiar de estado.', load() { P.pot = 'dw'; P.x0 = 1.414; P.Kx = 3.9; M.reset(); }},
      reto: {title: 'La canica en el doble pozo', text: 'En el doble pozo U(x) = x⁴ − 4x² (masa 1 kg), sueltas la canica desde el reposo en x = 2 m.', q: '¿Cuál es su rapidez máxima?', unit: 'm/s', answer: sqrt(8), tol: 0.02,
        hint: 'la rapidez máxima está donde U es mínima: K = E − U_mín.', steps: ['E = U(2) = 16 − 16 = 0 J.', 'U_mín = −4 J en x = ±√2 ⇒ K_máx = 4 J.', 'v = √(2 · 4 / 1) = √8.'], ans: 'v_máx ≈ 2.83 m/s',
        setup() { P.pot = 'dw'; P.x0 = 2; P.Kx = 0; M.reset(); S.hold = true; }, preview: 300, reveal() { M.reset(); S.vmax = 0; this.t0 = S.t; }, done() { return S.t - this.t0 > 3; }, measured() { return `rapidez máxima ${N1(S.vmax, 2)} m/s`; }},
      tour: [{at: 0.5, view: 'frente'}, {at: 8, key: 'Kx', to: 4.5}, {at: 16, key: 'Kx', to: 0}, {at: 18, sel: '[data-key="pot"] [data-v="lj"]'}, {at: 26, sel: '[data-key="pot"] [data-v="spring"]'}, {at: 33, sel: '[data-key="pot"] [data-v="dw"]'}]
    };
    rebuild();
    return M;
  }
};

/* ======================= 2.6 · Conservación de la energía: montaña rusa ======================= */
const coaster = {id: 'conservacion', tab: '2.6 Conservación', kicker: KICK('2.6'), title: 'Conservación de la energía · la montaña rusa', specs: 'Carro de 500 kg · cimas de 5.5 m y 3.2 m · fricción opcional', noteTag: 'K + U + E_térm = cte',
  notes: `<p>Si solo trabajan fuerzas conservativas, la energía mecánica E = K + U se conserva. Si hay fricción, su trabajo convierte energía mecánica en <b>térmica</b>, pero el total no cambia.</p><div class="eq">ΔK + ΔU = W_nc ⇔ K + U + E_térm = cte</div>
    <ul><li>Sin fricción, el carro regresa siempre a su altura inicial.</li><li>La masa se cancela: v = √(2 g (h₀ − h)).</li><li>Con fricción, la barra térmica crece y el carro ya no sube tan alto.</li></ul>${legend([[F.K, 'Cinética'], [F.U, 'Potencial'], [F.Q, 'Térmica'], [F.E, 'Total']])}`,
  build(K) {
    const g = new THREE.Group(), P = {h0: 5.5, mu: 0, m: 500};
    const KP = [[-1, 6.2], [3, 0.6], [8, 3.2], [12, 0.6], [16, 2.2], [20, 0.6], [23, 1.2]];
    const y = x => { if (x <= KP[0][0]) return KP[0][1]; for (let i = 0; i < KP.length - 1; i++) { const [a, ya] = KP[i], [b, yb] = KP[i + 1]; if (x <= b) { const t = (x - a) / (b - a); return ya + (yb - ya) * (1 - cos(PI * t)) / 2; } } return KP[KP.length - 1][1]; };
    const dy = x => (y(x + 1e-4) - y(x - 1e-4)) / 2e-4;
    const pts = []; for (let x = -1; x <= 23; x += 0.1) pts.push(V3(x, y(x) + 0.05, 0));
    [-0.35, 0.35].forEach(z => g.add(K.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => p.clone().setZ(z))), 600, 0.045, 8, false), K.MAT.metal(0xc92a2a, 0.35))));
    for (let x = -0.5; x <= 23; x += 0.8) { const hh = y(x); const sp = K.cyl(0.05, 0.05, hh, K.MAT.metal(0x868e96, 0.4), 8); sp.position.set(x, hh / 2, 0); g.add(sp); const tie = K.box(0.08, 0.04, 0.8, K.MAT.metal(0x495057), 0.01); tie.position.set(x, hh + 0.02, 0); tie.rotation.z = atan(dy(x)); g.add(tie); }
    const car = new THREE.Group(); const body = K.box(1.1, 0.5, 0.8, K.MAT.plastic(0x1c7ed6, 0.3), 0.1); body.position.y = 0.38; car.add(body); [-0.25, 0.25].forEach(z => { const rider = K.sph(0.13, K.MAT.plastic(0xe0b48f, 0.6), 16); rider.position.set(-0.1, 0.8, z); car.add(rider); }); g.add(car);
    const hl = K.box(25, 0.012, 0.012, K.MAT.std(0x16181b, 0.5)); hl.position.x = 11; g.add(hl);
    const vV = K.vector(F.v, 'v');
    const S = {x: 0, v: 0, t: 0, Q: 0, stop: null, vTop: null};
    const x0 = () => { let a = -1, b = 3; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (y(m) > P.h0) a = m; else b = m; } return (a + b) / 2; };
    const KE = () => 0.5 * P.m * S.v * S.v / 1000, UE = () => P.m * g0 * y(S.x) / 1000, E0 = () => P.m * g0 * y(x0()) / 1000;
    const M = {group: g, P, vectors: [vV],
      views: {lado: {label: 'Lado', t: [10.5, 3, 0], yaw: 0, pitch: 0.06, d: 33}, sigue: {label: 'Seguir', t: [0, 1.2, 0], yaw: -0.5, pitch: 0.2, d: 7}},
      follow: () => TD.M && viewIsFollow() ? V3(S.x, y(S.x), 0) : null,
      overlays: [{key: 'v', label: 'Velocidad', on: true}, {key: 'e', label: 'Altura de E', on: true}],
      readouts: [{label: 'Altura h', get: () => N1(y(S.x), 2) + ' m'}, {label: 'Rapidez', get: () => N1(abs(S.v), 2) + ' m/s', big: 1}, {label: 'v en la cima de 3.2 m', get: () => S.vTop !== null ? N1(S.vTop, 2) + ' m/s' : '—'}],
      bars: {title: 'Energía (kJ)', max: () => E0(), items: [{label: 'Cinética', color: F.K, get: () => KE()}, {label: 'Potencial', color: F.U, get: () => UE()}, {label: 'Térmica', color: F.Q, get: () => S.Q / 1000}, {label: 'Total', color: F.E, get: () => KE() + UE() + S.Q / 1000}]},
      chart: {title: 'Energías en el tiempo', series: [{label: 'K', color: F.K}, {label: 'U', color: F.U}, {label: 'Térmica', color: F.Q}, {label: 'Total', color: F.E, w: 2}], unit: 'kJ', span: 12, min: 0},
      sample: () => [S.t, [KE(), UE(), S.Q / 1000, KE() + UE() + S.Q / 1000]],
      controls: [{type: 'range', key: 'h0', label: 'Altura de salida', min: 1, max: 6.1, step: 0.01, fmt: v => v.toFixed(2) + ' m', on: () => M.reset()}, {type: 'range', key: 'mu', label: 'Fricción μ', min: 0, max: 0.2, step: 0.005, fmt: v => v.toFixed(3)}, {type: 'range', key: 'm', label: 'Masa del carro', min: 100, max: 1500, step: 10, fmt: v => v + ' kg'},
        {type: 'buttons', key: 'c', primary: 1, items: [['Soltar', () => M.reset()]]}],
      calls: {lado: [[() => V3(8, 3.25, 0), 'Cima · 3.2 m', '¿Pasa o no pasa?', 1]], sigue: []},
      reset() { S.x = x0(); S.v = 0; S.t = 0; S.Q = 0; S.vTop = null; S.stopX = null; },
      update(dt) { const n = 40, h = dt / n; for (let i = 0; i < n; i++) { const phi = atan(dy(S.x)), a = -g0 * sin(phi) - (abs(S.v) > 1e-4 ? Math.sign(S.v) * P.mu * g0 * cos(phi) : 0); const v0 = S.v; S.v += a * h; if (P.mu > 0 && v0 !== 0 && Math.sign(S.v) !== Math.sign(v0) && abs(sin(phi)) < P.mu * cos(phi)) S.v = 0; const dx = S.v * cos(phi) * h; const ds = abs(S.v) * h; S.Q += P.mu * P.m * g0 * cos(phi) * ds; const xp = S.x; S.x += dx; if (S.vTop === null && xp < 8 && S.x >= 8) { S.vTop = abs(S.v); if (S.stopAtTop) { K.running = false; break; } } if (S.x > 22.8) { S.x = 22.8; S.v = 0; } if (S.x < -0.9) { S.x = -0.9; S.v = 0; } } S.t += dt; },
      pose() { car.position.set(S.x, y(S.x) + 0.06, 0); car.rotation.z = atan(dy(S.x)); hl.visible = K.ov('e'); hl.position.y = (E0() - S.Q / 1000) * 1000 / (P.m * g0) + 0.05;
        K.ov('v') && abs(S.v) > 0.05 ? vV.set(car.position.clone().add(V3(0, 1.2, 0.5)), V3(cos(car.rotation.z), sin(car.rotation.z), 0).multiplyScalar(S.v), 0.18, `v<small>${N1(abs(S.v), 1)} m/s</small>`) : vV.hide(); },
      problem: {title: 'Montaña rusa', text: 'Un carro parte del reposo desde una altura de 5.5 m. La parte más baja de la pista está a 0.6 m y la siguiente cima a 3.2 m. Ignora la fricción.', q: '¿Qué rapidez lleva en la parte más baja? ¿Logra pasar la cima de 3.2 m, y con qué rapidez?',
        steps: ['Conservación: m g h₀ = ½ m v² + m g h ⇒ v = √(2 g (h₀ − h)). La masa se cancela.', 'En h = 0.6 m: v = √(2 × 9.8 × 4.9) ≈ 9.8 m/s.', 'En h = 3.2 m: v = √(2 × 9.8 × 2.3) ≈ 6.7 m/s > 0, así que sí pasa.', 'Agrega fricción (μ = 0.1): parte de la energía se vuelve térmica.'], ans: '≈ 9.8 m/s abajo; sí pasa la cima, a ≈ 6.7 m/s.', load() { P.h0 = 5.5; P.mu = 0; M.reset(); }},
      reto: {title: '¿Desde qué altura soltarlo?', text: 'En esta montaña rusa sin fricción, la siguiente cima mide 3.20 m de altura.', q: '¿Desde qué altura (en reposo) hay que soltar el carro para que pase esa cima a exactamente 4 m/s?', unit: 'm', answer: 3.2 + 16 / (2 * g0), tol: 0.02,
        hint: 'conserva la energía entre la salida y la cima: m g h₀ = m g h + ½ m v².', steps: ['m g h₀ = m g (3.20) + ½ m (4)²: la masa se cancela.', 'h₀ = 3.20 + 16 / (2 × 9.8) = 3.20 + 0.82.'], ans: 'h₀ ≈ 4.02 m',
        setup() { P.h0 = 5.5; P.mu = 0; M.reset(); }, preview: 1200, reveal() { P.h0 = +(3.2 + 16 / (2 * g0)).toFixed(3); M.reset(); S.stopAtTop = true; TD.K.refresh(); }, done: () => S.vTop !== null, measured: () => { S.stopAtTop = false; return `desde ${N1(P.h0, 2)} m pasa la cima a ${N1(S.vTop, 2)} m/s`; }},
      tour: [{at: 0.5, view: 'lado'}, {at: 9, view: 'sigue'}, {at: 16, view: 'lado'}, {at: 17, key: 'mu', to: 0.08}, {at: 18, sel: '[data-key="c0"]'}, {at: 32, key: 'mu', to: 0}]
    };
    const viewIsFollow = () => document.querySelector('[data-view="sigue"].on') !== null;
    return M;
  }
};

TD.start({machines: [trabajo, resortera, potencia, cinetica, conservativas, curvas, coaster]});
})();
