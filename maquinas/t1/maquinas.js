/* Tema 1 · Dinámica — eight teardown machines. Each one: a real object, its forces as 3D vectors computed from
   the same model that moves it, live readouts, notes, a real-life problem and a reto. */
(() => {
const {PI, sin, cos, tan, abs, sqrt, min, max, atan2, hypot} = Math, D = PI / 180, g0 = 9.8;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const F = {W: '#16181b', T: '#3d8fe0', N: '#7048e8', f: '#2f9e44', S: '#f05a23', v: '#0ca678', a: '#f59f00', wind: '#868e96'};
const legend = items => `<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin:8px 0 2px;font-size:10.5px;font-weight:600">${items.map(([c, t]) => `<span><i style="display:inline-block;width:12px;height:3px;background:${c};vertical-align:middle;margin-right:4px"></i>${t}</span>`).join('')}</div>`;
const N1 = (v, d = 1) => K().fx(v, d);
let K = () => TD.K;

/* ======================= 1.1 · Fuerzas como vectores: cuadro colgado ======================= */
const cuadro = {id: 'vectores', tab: '1.1 Vectores', kicker: 'Teardown · Tema 1 · Dinámica · 1.1', title: 'Fuerzas como vectores · un cuadro colgado',
  specs: 'Tres fuerzas concurrentes en el nudo · ΣF = T₁ + T₂ + W = 0', noteTag: 'Superposición',
  notes: `<p>Una fuerza tiene <b>magnitud, dirección y sentido</b>. Si varias actúan sobre el mismo cuerpo, el efecto total es su suma vectorial: la fuerza neta.</p>
    <div class="eq">ΣF = F₁ + F₂ + … ⇒ ΣFₓ = ΣFᵢₓ · ΣF_y = ΣFᵢ_y</div>
    <p>Si ΣF = 0, el cuerpo está en <b>equilibrio</b>. En el nudo del cuadro, las tensiones de los cables y el peso se cancelan.</p>
    <ul><li>Activa <b>Polígono</b>: puestas punta con cola, las tres fuerzas cierran un triángulo.</li><li>Activa <b>Componentes</b>: las x se cancelan entre sí; las y de los cables suman el peso.</li><li>Haz los cables casi horizontales: la tensión se dispara (T = W / 2 sin θ).</li><li>Corta un cable: ΣF ≠ 0 y el cuadro acelera.</li></ul>${legend([[F.T, 'Tensión'], [F.W, 'Peso'], [F.S, 'Fuerza neta']])}`,
  build(K) {
    const g = new THREE.Group(), P = {m: 2, th1: 40, th2: 55}, L = 0.75, O0 = V3(0, 1.75, 0.04);
    const wall = K.mesh(new THREE.PlaneGeometry(6, 3.2), K.MAT.std(0xf3f1ec, 0.95)); wall.position.set(0, 1.6, -0.02); g.add(wall);
    const frame = new THREE.Group(); g.add(frame);
    const fr = K.box(0.66, 0.5, 0.04, K.MAT.tex('walnut', [1, 1], 0.5), 0.01); frame.add(fr);
    const art = K.mesh(new THREE.PlaneGeometry(0.56, 0.4), K.MAT.tex('canvasArt', [1, 1], 0.8)); art.position.z = 0.021; frame.add(art);
    const ringM = K.mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 20), K.MAT.brass()); g.add(ringM);
    const wireStub = K.tubeBetween(V3(), V3(0, 0.1, 0), 0.003, K.MAT.cable()); g.add(wireStub);
    const hooks = [0, 1].map(() => { const h = new THREE.Group(); const pl = K.cyl(0.02, 0.02, 0.02, K.MAT.brass(), 16); pl.rotation.x = PI / 2; h.add(pl); const pin = K.cyl(0.005, 0.005, 0.06, K.MAT.brass(), 8); pin.rotation.x = PI / 2; pin.position.z = 0.03; h.add(pin); g.add(h); return h; });
    const cables = [0, 1].map(() => { const c = K.tubeBetween(V3(), V3(0, 1, 0), 0.0035, K.MAT.cable()); g.add(c); return c; });
    const vT1 = K.vector(F.T, 'T₁'), vT2 = K.vector(F.T, 'T₂'), vW = K.vector(F.W, 'W'), vS = K.vector(F.S, 'ΣF');
    const cx = [K.vector(F.T, 'T₁ₓ', {ghost: 1, r: 0.012}), K.vector(F.T, 'T₁ᵧ', {ghost: 1, r: 0.012}), K.vector(F.T, 'T₂ₓ', {ghost: 1, r: 0.012}), K.vector(F.T, 'T₂ᵧ', {ghost: 1, r: 0.012})];
    const pg = [K.vector(F.T, 'T₁', {ghost: 1, r: 0.012}), K.vector(F.T, 'T₂', {ghost: 1, r: 0.012}), K.vector(F.W, 'W', {ghost: 1, r: 0.012})];
    const S = {cut: false, phi: 0, om: 0, O: O0.clone(), T1: 0, T2: 0, sc: 0.03, t: 0};
    const W = () => P.m * g0;
    function solve() { const a1 = P.th1 * D, a2 = P.th2 * D, s = sin(a1 + a2); S.T1 = W() * cos(a2) / s; S.T2 = W() * cos(a1) / s; }
    const hookPos = i => { const a = (i ? P.th2 : P.th1) * D; return V3(O0.x + (i ? 1 : -1) * L * cos(a), O0.y + L * sin(a), 0.03); };
    const M = {group: g, P, vectors: [vT1, vT2, vW, vS, ...cx, ...pg],
      views: {frente: {label: 'Frente', t: [0, 1.7, 0], yaw: 0, pitch: 0.04, d: 3.4}, nudo: {label: 'Nudo', t: [0, 1.82, 0.04], yaw: 0.25, pitch: 0.08, d: 1.6}, lado: {label: '3/4', t: [0, 1.6, 0], yaw: -0.6, pitch: 0.12, d: 3.6}},
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'comp', label: 'Componentes'}, {key: 'poly', label: 'Polígono'}],
      readTag: 'N = kg·m/s²',
      readouts: [{label: 'Peso W = m g', get: () => N1(W()) + ' N'}, {label: 'Tensión T₁', get: () => S.cut ? N1(S.T1) + ' N' : N1(S.T1) + ' N', big: 1}, {label: 'Tensión T₂', get: () => S.cut ? 'cortado' : N1(S.T2) + ' N', big: 1},
        {label: 'ΣFₓ', get: () => N1(S.Sx) + ' N'}, {label: 'ΣF_y', get: () => N1(S.Sy) + ' N'}, {label: '|ΣF|', get: () => N1(hypot(S.Sx, S.Sy)) + ' N', acc: 1}, {label: 'Estado', get: () => S.cut ? 'ΣF ≠ 0 → acelera' : 'equilibrio'}],
      chart: {title: 'Tensiones y peso', series: [{label: 'T₁', color: F.T}, {label: 'T₂', color: '#9ec5f5'}, {label: 'W', color: F.W}], unit: 'N'},
      sample: () => [S.t, [S.T1, S.cut ? 0 : S.T2, W()]],
      controls: [{type: 'range', key: 'm', label: 'Masa del cuadro', min: 0.5, max: 6, step: 0.1, fmt: v => v.toFixed(1) + ' kg'},
        {type: 'range', key: 'th1', label: 'Ángulo del cable 1', min: 8, max: 85, step: 1, fmt: v => v + '°'},
        {type: 'range', key: 'th2', label: 'Ángulo del cable 2', min: 8, max: 85, step: 1, fmt: v => v + '°'},
        {type: 'buttons', key: 'b', items: [['Simétricos', () => { P.th2 = P.th1; }], ['Cortar cable 2', () => { if (!S.cut) { S.cut = true; const h = hookPos(0); const d = O0.clone().sub(h); S.phi = atan2(d.x, -d.y); S.om = 0; } }], ['Reparar', () => { S.cut = false; }]]},
        {type: 'note', text: 'Ángulos medidos desde la horizontal. Los ganchos se mueven para mantener cables de 75 cm.'}],
      calls: {frente: [[() => S.O, 'Nudo', 'Aquí actúan las tres fuerzas', -1], [() => frame.position.clone().add(V3(0.33, -0.1, 0)), 'Cuadro', 'Su peso cuelga del nudo', 1]], nudo: [], lado: []},
      reset() { S.cut = false; S.t = 0; },
      update(dt) {
        S.t += dt; solve();
        if (S.cut) { const h = hookPos(0), n = 40, k = dt / n; for (let i = 0; i < n; i++) { S.om += -(g0 / L) * sin(S.phi) * k - 0.3 * S.om * k; S.phi += S.om * k; }
          S.O = V3(h.x + L * sin(S.phi), h.y - L * cos(S.phi), O0.z);
          const v = L * S.om, Tm = P.m * (g0 * cos(S.phi) + v * v / L); S.T1 = Tm; S.T2 = 0;
          const dir = h.clone().sub(S.O).normalize(); S.Sx = dir.x * Tm; S.Sy = dir.y * Tm - W(); S.dir1 = dir;
        } else { S.O.copy(O0); const a1 = P.th1 * D, a2 = P.th2 * D; S.Sx = -S.T1 * cos(a1) + S.T2 * cos(a2); S.Sy = S.T1 * sin(a1) + S.T2 * sin(a2) - W(); S.dir1 = V3(-cos(a1), sin(a1), 0); }
      },
      pose() {
        const O = S.O, h1 = hookPos(0), h2 = hookPos(1);
        hooks[0].position.copy(h1); hooks[1].position.copy(h2);
        cables[0].userData.set(h1, O); cables[1].visible = !S.cut; if (!S.cut) cables[1].userData.set(h2, O);
        ringM.position.copy(O); const top = O.clone().add(V3(0, -0.08, -0.02)); wireStub.userData.set(O, top);
        frame.position.set(O.x, O.y - 0.33, 0.02); frame.rotation.z = S.cut ? S.phi * 0.3 : 0;
        const fmax = max(W(), S.T1, S.T2); S.sc += (min(0.035, 0.85 / fmax) - S.sc) * 0.2; const sc = S.sc;
        const a2 = P.th2 * D, T1v = S.dir1.clone().multiplyScalar(S.T1), T2v = V3(cos(a2), sin(a2), 0).multiplyScalar(S.cut ? 0 : S.T2), Wv = V3(0, -W(), 0), Sv = V3(S.Sx, S.Sy, 0);
        const o = O.clone().setZ(0.07), on = K.ov('f');
        on ? vT1.set(o, T1v, sc) : vT1.hide(); on && !S.cut ? vT2.set(o, T2v, sc) : vT2.hide(); on ? vW.set(o, Wv, sc) : vW.hide();
        hypot(S.Sx, S.Sy) > 0.05 ? vS.set(o, Sv, sc) : vS.hide();
        if (K.ov('comp')) { cx[0].set(o, V3(T1v.x, 0, 0), sc, `T₁ₓ<small>${N1(T1v.x)}</small>`); cx[1].set(o, V3(0, T1v.y, 0), sc, `T₁ᵧ<small>${N1(T1v.y)}</small>`); if (!S.cut) { cx[2].set(o, V3(T2v.x, 0, 0), sc, `T₂ₓ<small>${N1(T2v.x)}</small>`); cx[3].set(o, V3(0, T2v.y, 0), sc, `T₂ᵧ<small>${N1(T2v.y)}</small>`); } else { cx[2].hide(); cx[3].hide(); } } else cx.forEach(c => c.hide());
        if (K.ov('poly')) { const b = o.clone().add(V3(0.55, -0.2, 0.02)); pg[0].set(b, T1v, sc, 'T₁'); const p2 = b.clone().addScaledVector(T1v, sc); pg[1].set(p2, T2v, sc, 'T₂'); const p3 = p2.clone().addScaledVector(T2v, sc); pg[2].set(p3, Wv, sc, 'W'); } else pg.forEach(c => c.hide());
      },
      problem: {title: 'Colgar un cuadro con dos cables', text: 'Un cuadro de 6 N (≈ 0.61 kg) cuelga de dos cables simétricos que forman 45° con la horizontal. El cuadro está en reposo.', q: '¿Qué tensión soporta cada cable?',
        steps: ['Reposo ⇒ ΣF = 0: T₁ + T₂ + W = 0, con W = (0, −6) N.', 'Eje x: −T cos 45° + T cos 45° = 0 (se cumple por simetría).', 'Eje y: 2 T sin 45° − 6 = 0 ⇒ T = 6 / (2 × 0.707).'],
        ans: 'T ≈ 4.24 N en cada cable: más que la mitad del peso. Por eso los cables casi horizontales se revientan.', load() { S.cut = false; P.m = 0.612; P.th1 = 45; P.th2 = 45; TD.set('comp', true); }},
      reto: {title: 'Cuando la tensión iguala al peso', text: 'Un cuadro de 2 kg cuelga de dos cables simétricos. Al abrir los ganchos (cables más horizontales), la tensión de cada cable crece.', q: '¿A qué ángulo sobre la horizontal la tensión de cada cable iguala el peso completo del cuadro?', unit: '°', answer: 30, tol: 0.02, abs: 0.6,
        hint: 'en el eje y: 2 T sin θ = W, y quieres T = W.', steps: ['Equilibrio vertical: 2 T sin θ = m g.', 'Con T = m g: 2 sin θ = 1 ⇒ sin θ = 0.5.', 'θ = 30°. Por debajo de 30°, ¡cada cable sostiene más que el cuadro entero!'], ans: 'θ = 30°',
        setup() { S.cut = false; P.m = 2; P.th1 = 60; P.th2 = 60; }, preview: 900, reveal() { this.k = 0; this.iv = setInterval(() => { this.k = Math.min(1, this.k + 0.04); P.th1 = P.th2 = Math.round(60 - 30 * this.k); if (this.k >= 1) clearInterval(this.iv); }, 50); }, done() { return P.th1 === 30; }, measured: () => `con θ = 30°: T = ${N1(S.T1)} N y W = ${N1(W())} N`},
      tour: [{at: 0.5, view: 'frente'}, {at: 3, ov: 'comp', on: true}, {at: 7, ov: 'poly', on: true}, {at: 11, key: 'th1', to: 14}, {at: 15, key: 'th1', to: 40}, {at: 18, view: 'nudo'}, {at: 22, sel: '[data-key="b1"]'}, {at: 28, sel: '[data-key="b2"]'}, {at: 30, view: 'frente'}, {at: 31, ov: 'poly', on: false}, {at: 32, ov: 'comp', on: false}]
    };
    return M;
  }
};

/* ======================= 1.1 · Primera ley: piedra de curling ======================= */
const curling = {id: 'primera-ley', tab: '1.1 Primera ley', kicker: 'Teardown · Tema 1 · Dinámica · 1.1', title: 'Primera ley · la piedra de curling',
  specs: 'Piedra de granito de 19.96 kg · pista de 45 m · μₖ del hielo ≈ 0.02', noteTag: 'Inercia',
  notes: `<p>Si la fuerza neta sobre un cuerpo es cero, <b>su velocidad no cambia</b>: ni su magnitud ni su dirección. Sigue en reposo o en movimiento rectilíneo uniforme (marco inercial).</p><div class="eq">ΣF = 0 ⇔ v = constante</div>
    <ul><li>Sin fricción, los puntos del rastro (uno cada 0.3 s) quedan equidistantes y en línea recta.</li><li>Empuja de lado: la fuerza cambia la <b>dirección</b> de v, no solo su magnitud.</li><li>Con fricción, ΣF ≠ 0 y la piedra frena. Lo «natural» no es detenerse: detenerse requiere una fuerza.</li><li>Una masa mayor responde menos al mismo empujón: la masa mide la inercia.</li></ul>${legend([[F.v, 'Velocidad'], [F.f, 'Fricción'], [F.T, 'Empujón'], [F.S, 'Fuerza neta']])}`,
  build(K) {
    const g = new THREE.Group(), P = {mu: 0, m: 20, v0: 2};
    const ice = K.mesh(new THREE.BoxGeometry(48, 0.05, 4.4), K.MAT.tex('ice', [10, 1], 0.12)); ice.position.set(22, 0.025, 0); g.add(ice);
    [-2.25, 2.25].forEach(z => { const b = K.box(48, 0.12, 0.1, K.MAT.plastic(0xf8f9fa), 0.02); b.position.set(22, 0.06, z); g.add(b); });
    const house = new THREE.Group(); [[1.83, 0x1c7ed6], [1.22, 0xffffff], [0.61, 0xe03131], [0.15, 0xffffff]].forEach(([r, c], i) => { const d = K.mesh(new THREE.CircleGeometry(r, 48), K.MAT.std(c, 0.3)); d.rotation.x = -PI / 2; d.position.y = 0.052 + i * 0.0006; house.add(d); }); house.position.x = 38; g.add(house);
    for (let x = 0; x <= 44; x += 4) { const l = K.mesh(new THREE.BoxGeometry(0.03, 0.004, 4.3), K.MAT.std(0x9aa7b4, 0.5)); l.position.set(x, 0.053, 0); g.add(l); }
    const stone = new THREE.Group(); const body = K.cyl(0.145, 0.145, 0.115, K.MAT.std(0x6c727a, 0.45, 0.2), 40); body.position.y = 0.11; stone.add(body);
    const band = K.cyl(0.147, 0.147, 0.03, K.MAT.plastic(0xe03131), 40); band.position.y = 0.17; stone.add(band); const handle = K.box(0.2, 0.035, 0.05, K.MAT.plastic(0xe03131), 0.012); handle.position.set(0.04, 0.2, 0); stone.add(handle); g.add(stone);
    const dots = []; const dotG = new THREE.CircleGeometry(0.03, 12), dotM = K.MAT.std(0x16181b, 0.6);
    const vV = K.vector(F.v, 'v'), vF = K.vector(F.f, 'f'), vP = K.vector(F.T, 'F'), vS = K.vector(F.S, 'ΣF');
    const S = {x: 0, z: 0, vx: 2, vz: 0, t: 0, push: null, lastDot: 0, d: 0};
    function addDot() { const d = K.mesh(dotG, dotM, false); d.rotation.x = -PI / 2; d.position.set(S.x, 0.054, S.z); g.add(d); dots.push(d); if (dots.length > 160) g.remove(dots.shift()); }
    const pushes = {fwd: [1, 0], side: [0, -1]};
    const M = {group: g, P, vectors: [vV, vF, vP, vS],
      views: {lado: {label: '3/4', t: [0.8, 0.2, 0], yaw: -0.55, pitch: 0.4, d: 5.2}, arriba: {label: 'Arriba', t: [1.5, 0, 0], yaw: 0, pitch: 1.45, d: 8}, cerca: {label: 'Cerca', t: [0, 0.15, 0], yaw: -0.9, pitch: 0.3, d: 2.4}},
      follow: () => V3(S.x, 0, S.z * 0.5),
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'v', label: 'Velocidad', on: true}, {key: 'trail', label: 'Rastro', on: true}],
      readouts: [{label: 'Rapidez |v|', get: () => N1(hypot(S.vx, S.vz), 2) + ' m/s', big: 1}, {label: 'Dirección', get: () => N1(atan2(-S.vz, S.vx) / D, 0) + '°'}, {label: 'Fuerza neta |ΣF|', get: () => N1(S.Fn) + ' N', acc: 1}, {label: 'Aceleración |a|', get: () => N1(S.Fn / P.m, 3) + ' m/s²'}, {label: 'Recorrido', get: () => N1(S.d) + ' m'}, {label: 'Tiempo', get: () => N1(S.t) + ' s'}],
      chart: {title: 'Rapidez |v| (t)', series: [{label: '|v|', color: F.v}], unit: 'm/s', span: 12, dec: 2},
      sample: () => [S.t, [hypot(S.vx, S.vz)]],
      controls: [{type: 'chips', key: 'mu', label: 'Superficie', options: [['Sin fricción', 0], ['Hielo · μ 0.02', 0.02], ['Hielo con arena · 0.15', 0.15]]},
        {type: 'chips', key: 'm', label: 'Masa', options: [['10 kg', 10], ['20 kg', 20], ['40 kg', 40]]},
        {type: 'range', key: 'v0', label: 'Velocidad de lanzamiento', min: 0, max: 4, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'},
        {type: 'buttons', key: 'p', items: [['Lanzar', () => M.reset()], ['Empujar → 1 s', () => { S.push = {dir: pushes.fwd, t: 1, F: 20}; }], ['Empujar de lado 1 s', () => { S.push = {dir: pushes.side, t: 1, F: 20}; }]]},
        {type: 'note', text: 'Cada empujón: 20 N durante 1 s. Impulso = 20 N·s.'}],
      calls: {lado: [[() => stone.position.clone().add(V3(0, 0.22, 0)), 'Piedra · granito', 'Masa = inercia', 1]], arriba: [], cerca: []},
      reset() { S.x = 0; S.z = 0; S.vx = P.v0; S.vz = 0; S.t = 0; S.d = 0; S.push = null; S.lastDot = -1; dots.forEach(d => g.remove(d)); dots.length = 0; },
      update(dt) {
        const n = 10, h = dt / n;
        for (let i = 0; i < n; i++) {
          let fx = 0, fz = 0; S.pF = [0, 0];
          if (S.push) { fx += S.push.dir[0] * S.push.F; fz += S.push.dir[1] * S.push.F; S.pF = [fx, fz]; S.push.t -= h; if (S.push.t <= 0) S.push = null; }
          const sp = hypot(S.vx, S.vz), fr = P.mu * P.m * g0; S.fr = [0, 0];
          if (sp > 1e-4 && fr > 0) { const k = min(fr, sp * P.m / h) / sp; S.fr = [-S.vx * k, -S.vz * k]; fx += S.fr[0]; fz += S.fr[1]; }
          S.vx += fx / P.m * h; S.vz += fz / P.m * h; S.x += S.vx * h; S.z += S.vz * h; S.d += hypot(S.vx, S.vz) * h; S.Fn = hypot(fx, fz); S.Fv = [fx, fz];
        }
        if (S.z > 2) { S.z = 2; S.vz = -abs(S.vz) * 0.4; } if (S.z < -2) { S.z = -2; S.vz = abs(S.vz) * 0.4; } if (S.x > 46) { S.x = 46; S.vx = 0; S.vz = 0; }
        S.t += dt; if (K.ov('trail') && S.t - S.lastDot >= 0.3) { S.lastDot = S.t; addDot(); }
      },
      pose() {
        stone.position.set(S.x, 0, S.z); stone.rotation.y -= 0.01 * hypot(S.vx, S.vz);
        const o = V3(S.x, 0.32, S.z);
        K.ov('v') ? vV.set(o, V3(S.vx, 0, S.vz), 0.45, `v<small>${N1(hypot(S.vx, S.vz), 2)} m/s</small>`) : vV.hide();
        const sf = 0.035;
        if (K.ov('f')) { vF.set(o.clone().add(V3(0, 0.05, 0)), V3(S.fr[0], 0, S.fr[1]), sf); vP.set(o.clone().add(V3(0, 0.1, 0)), V3(S.pF[0], 0, S.pF[1]), sf); S.Fn > 0.05 ? vS.set(o.clone().add(V3(0, 0.15, 0)), V3(S.Fv[0], 0, S.Fv[1]), sf) : vS.hide(); } else [vF, vP, vS].forEach(v => v.hide());
        dots.forEach(d => d.visible = K.ov('trail'));
      },
      problem: {title: 'Piedra de curling', text: 'Una piedra de curling sale a 2 m/s sobre hielo pulido. El coeficiente de fricción cinética es apenas μₖ = 0.02.', q: '¿Qué distancia recorre antes de detenerse? ¿Y si no hubiera fricción?',
        steps: ['La única fuerza horizontal es la fricción: f = μₖ m g, así que a = −μₖ g = −0.196 m/s².', 'Distancia: d = v² / (2 μₖ g) = 4 / 0.392.', 'Tiempo: t = v / (μₖ g) = 2 / 0.196.', 'Sin fricción ΣF = 0 y, por la 1ª ley, seguiría a 2 m/s indefinidamente.'],
        ans: 'd ≈ 10.2 m en t ≈ 10.2 s. Sin fricción, nunca se detiene.', load() { P.mu = 0.02; P.m = 20; P.v0 = 2; M.reset(); }},
      reto: {title: 'Empujón de costado', text: 'Sin fricción, una piedra de 20 kg avanza a 2 m/s. Le das un empujón de 20 N hacia un lado (perpendicular a v) durante 1 s.', q: '¿Con qué rapidez sigue después del empujón?', unit: 'm/s', answer: sqrt(5), tol: 0.02,
        hint: 'el impulso F·t cambia solo la componente lateral de v; la otra no cambia.', steps: ['Δv_lado = F t / m = 20 × 1 / 20 = 1 m/s.', 'La componente original sigue en 2 m/s (no hubo fuerza en esa dirección).', '|v| = √(2² + 1²) = √5.'], ans: '|v| ≈ 2.24 m/s, girada 26.6°',
        setup() { P.mu = 0; P.m = 20; P.v0 = 2; M.reset(); }, preview: 1500, reveal() { S.push = {dir: pushes.side, t: 1, F: 20}; this.t0 = S.t; }, done() { return S.t - this.t0 > 1.6; }, measured: () => `|v| = ${N1(hypot(S.vx, S.vz), 3)} m/s`},
      tour: [{at: 0.5, view: 'lado'}, {at: 5, sel: '[data-key="p2"]'}, {at: 9, view: 'arriba'}, {at: 13, key: 'mu', val: 0.02, sel: '[data-key="mu"] [data-v="0.02"]'}, {at: 21, sel: '[data-key="p1"]'}, {at: 26, key: 'mu', val: 0, sel: '[data-key="mu"] [data-v="0"]'}, {at: 27, sel: '[data-key="p0"]'}]
    };
    return M;
  }
};

/* ======================= 1.2 · Segunda ley: dron de reparto ======================= */
const dron = {id: 'segunda-ley', tab: '1.2 Segunda ley', kicker: 'Teardown · Tema 1 · Dinámica · 1.2', title: 'Segunda ley · el dron de reparto',
  specs: 'Cuadricóptero de 1.5 kg · paquete de 0 a 1 kg · empuje hasta 40 N', noteTag: 'ΣF = m a',
  notes: `<div class="eq">ΣF = m a</div><p>Es una ecuación <b>vectorial</b>: la aceleración apunta siempre en la dirección de la fuerza neta, aunque la velocidad apunte a otro lado.</p>
    <ul><li>Empuje = peso ⇒ ΣF = 0: el dron flota (o sigue a velocidad constante).</li><li>Sube el empuje: ΣF apunta hacia arriba y el dron acelera hacia arriba.</li><li>Inclina el dron: la componente horizontal del empuje lo acelera de lado.</li><li>Con la misma fuerza, más masa (paquete) ⇒ menos aceleración.</li><li>El viento lateral cambia la dirección de v, no su componente original.</li></ul>${legend([[F.T, 'Empuje'], [F.W, 'Peso'], [F.wind, 'Viento'], [F.S, 'Fuerza neta'], [F.v, 'Velocidad']])}`,
  build(K) {
    const g = new THREE.Group(), P = {pk: 0.5, T: 19.6, tilt: 0, wind: 0};
    const hover0 = true;
    const pad = K.cyl(1.2, 1.2, 0.04, K.MAT.std(0x495057, 0.8), 48); pad.position.y = 0.02; g.add(pad);
    const hmark = K.mesh(new THREE.RingGeometry(0.8, 0.9, 48), K.MAT.std(0xffd43b, 0.6)); hmark.rotation.x = -PI / 2; hmark.position.y = 0.042; g.add(hmark);
    for (let y = 1; y <= 30; y++) { const tk = K.box(y % 5 ? 0.12 : 0.3, 0.012, 0.012, K.MAT.std(0x16181b, 0.6)); tk.position.set(-2, y, -1); g.add(tk); }
    const pole = K.cyl(0.02, 0.02, 30, K.MAT.std(0x868e96, 0.6), 8); pole.position.set(-2, 15, -1); g.add(pole);
    const drone = new THREE.Group(); g.add(drone);
    const body = K.box(0.34, 0.09, 0.34, K.MAT.plastic(0xf1f3f5, 0.3), 0.03); drone.add(body);
    const props = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { const arm = K.box(0.42, 0.025, 0.035, K.MAT.plastic(0x343a40), 0.01); arm.position.set(a * 0.17, 0.02, b * 0.17); arm.rotation.y = a * b > 0 ? -PI / 4 : PI / 4; drone.add(arm);
      const motor = K.cyl(0.03, 0.03, 0.05, K.MAT.metal(0x495057), 16); motor.position.set(a * 0.3, 0.05, b * 0.3); drone.add(motor);
      const pr = K.mesh(new THREE.BoxGeometry(0.34, 0.004, 0.035), K.MAT.plastic(0x16181b)); pr.position.set(a * 0.3, 0.08, b * 0.3); drone.add(pr); props.push(pr);
      const disc = K.mesh(new THREE.CircleGeometry(0.17, 24), new THREE.MeshBasicMaterial({color: 0x16181b, transparent: true, opacity: 0.06, depthWrite: false}), false); disc.rotation.x = -PI / 2; disc.position.set(a * 0.3, 0.085, b * 0.3); drone.add(disc); });
    const box = K.box(0.24, 0.18, 0.24, K.MAT.tex('cardboard', [1, 1], 0.8), 0.01); box.position.y = -0.22; drone.add(box);
    const strap = K.cyl(0.004, 0.004, 0.12, K.MAT.cable(), 6); strap.position.y = -0.1; drone.add(strap);
    const vT = K.vector(F.T, 'T'), vW = K.vector(F.W, 'W'), vWi = K.vector(F.wind, 'F viento'), vS = K.vector(F.S, 'ΣF'), vV = K.vector(F.v, 'v');
    const S = {p: V3(0, 0.3, 0), v: V3(), t: 0, landed: true, h0: 0.3};
    const m = () => 1.5 + P.pk, W = () => m() * g0;
    const M = {group: g, P, vectors: [vT, vW, vWi, vS, vV],
      views: {lado: {label: 'Lado', t: [0, 0, 0], yaw: 0, pitch: 0.06, d: 4.2}, tres: {label: '3/4', t: [0, 0, 0], yaw: -0.7, pitch: 0.2, d: 4.6}, cerca: {label: 'Cerca', t: [0, -0.1, 0], yaw: -0.5, pitch: 0.15, d: 2.0}},
      follow: () => V3(S.p.x, S.p.y, S.p.z),
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'v', label: 'Velocidad', on: true}],
      readouts: [{label: 'Masa total', get: () => N1(m(), 2) + ' kg'}, {label: 'Empuje T', get: () => N1(P.T) + ' N'}, {label: 'Peso W', get: () => N1(W()) + ' N'}, {label: 'Fuerza neta |ΣF|', get: () => N1(S.Fn) + ' N', acc: 1, big: 1}, {label: 'a = ΣF / m', get: () => N1(S.Fn / m(), 2) + ' m/s²', big: 1}, {label: 'Velocidad |v|', get: () => N1(S.v.length(), 2) + ' m/s'}, {label: 'Altura', get: () => N1(S.p.y - 0.3, 2) + ' m'}],
      chart: {title: 'Componentes de la velocidad', series: [{label: 'vₓ', color: F.v}, {label: 'v_y', color: F.T}, {label: 'v_z (viento)', color: F.wind}], unit: 'm/s', span: 8},
      sample: () => [S.t, [S.v.x, S.v.y, -S.v.z]],
      controls: [{type: 'chips', key: 'pk', label: 'Paquete', options: [['Sin paquete', 0], ['0.5 kg', 0.5], ['1 kg', 1]], on: () => {}},
        {type: 'range', key: 'T', label: 'Empuje de las hélices', min: 0, max: 40, step: 0.1, fmt: v => v.toFixed(1) + ' N'},
        {type: 'range', key: 'tilt', label: 'Inclinación', min: -30, max: 30, step: 1, fmt: v => v + '°'},
        {type: 'range', key: 'wind', label: 'Viento lateral', min: 0, max: 6, step: 0.5, fmt: v => v.toFixed(1) + ' N'},
        {type: 'buttons', key: 'd', items: [['Flotar (T = m g)', () => { P.T = +(W() / cos(P.tilt * D)).toFixed(1); }], ['Aterrizar', () => { P.T = W() * 0.9; P.tilt = 0; P.wind = 0; }]]}],
      calls: {cerca: [[() => drone.localToWorld(V3(0.3, 0.08, 0.3)), 'Hélices', 'Empujan el aire hacia abajo', 1], [() => drone.localToWorld(V3(0, -0.22, 0)), 'Paquete', 'Más masa, menos aceleración', -1]], lado: [], tres: []},
      reset() { S.p.set(0, 2.3, 0); S.v.set(0, 0, 0); S.t = 0; S.until = 0; P.T = +(W()).toFixed(2); },
      update(dt) {
        if (S.until) { dt = min(dt, S.until - S.t); if (dt <= 1e-9) { K.running = false; return; } }
        const n = 10, h = dt / n; S.t += dt;
        for (let i = 0; i < n; i++) {
          const a = P.tilt * D, Tv = V3(sin(a) * P.T, cos(a) * P.T, 0), Wv = V3(0, -W(), 0), Wi = V3(0, 0, -P.wind), drag = V3();
          const Fs = Tv.clone().add(Wv).add(Wi).add(drag);
          if (S.p.y <= 0.3 && Fs.y <= 0 && S.v.y <= 0) { Fs.y = 0; S.v.y = 0; S.v.x *= 0.9; S.v.z *= 0.9; S.p.y = 0.3; if (P.wind === 0 && abs(Tv.x) < 1e-6) Fs.set(0, 0, 0); }
          S.v.addScaledVector(Fs, h / m()); S.p.addScaledVector(S.v, h); S.F = Fs; S.Tv = Tv; S.Wi = Wi;
        }
        if (S.p.y < 0.3) { S.p.y = 0.3; S.v.y = max(0, S.v.y); } if (S.p.y > 30) { S.p.y = 30; S.v.y = min(0, S.v.y); }
        S.Fn = S.F.length();
      },
      pose() {
        drone.position.copy(S.p); drone.rotation.z = -P.tilt * D; props.forEach((p, i) => p.rotation.y += (P.T > 1 ? 0.9 : 0.05) * (i % 2 ? 1 : -1)); box.visible = strap.visible = P.pk > 0; box.scale.setScalar(P.pk > 0.6 ? 1.2 : 1);
        const o = S.p.clone().add(V3(0, 0.0, 0.25)), sc = 0.026;
        if (K.ov('f')) { vT.set(o, S.Tv, sc); vW.set(o, V3(0, -W(), 0), sc); P.wind > 0 ? vWi.set(o, S.Wi, sc) : vWi.hide(); S.Fn > 0.05 ? vS.set(o.clone().add(V3(0.0, 0, 0.12)), S.F, sc) : vS.hide(); } else [vT, vW, vWi, vS].forEach(v => v.hide());
        K.ov('v') && S.v.length() > 0.02 ? vV.set(o.clone().add(V3(0, 0, -0.5)), S.v, 0.3, `v<small>${N1(S.v.length(), 2)} m/s</small>`) : vV.hide();
      },
      problem: {title: 'Dron con viento lateral', text: 'Un dron de reparto de 1.5 kg avanza a 2 m/s hacia el este (flotando: empuje = peso). De pronto, una ráfaga lo empuja con una fuerza neta de 3 N hacia el norte.', q: '¿Qué aceleración tiene? ¿Cuál es su velocidad (magnitud y dirección) 2 s después?',
        steps: ['a = ΣF / m = 3 / 1.5 = 2 m/s² hacia el norte (misma dirección que la fuerza, no que la velocidad).', 'Por componentes: vₓ = 2 m/s (sin fuerza en x, no cambia); v_norte = 0 + 2 × 2 = 4 m/s.', '|v| = √(2² + 4²) ≈ 4.47 m/s, θ = arctan(4/2) ≈ 63° al norte del este.'],
        ans: 'a = 2 m/s² (norte); v ≈ 4.47 m/s a 63° del este. La trayectoria es una parábola.', load() { P.pk = 0; P.tilt = 0; P.T = 14.7; P.wind = 0; M.reset(); S.p.y = 3; S.v.set(2, 0, 0); setTimeout(() => { P.wind = 3; TD.K.refresh(); }, 600); }},
      reto: {title: 'Despegue con paquete', text: 'El dron (1.5 kg) carga un paquete de 0.5 kg y está quieto, flotando. El piloto sube el empuje a 25 N.', q: '¿Cuánta altura gana en los siguientes 2 s?', unit: 'm', answer: 0.5 * (25 - 2 * g0) / 2 * 4, tol: 0.03,
        hint: 'a = (T − m g) / m con la masa total; luego h = ½ a t².', steps: ['Masa total 2 kg, peso 19.6 N.', 'a = (25 − 19.6) / 2 = 2.7 m/s² hacia arriba.', 'h = ½ · 2.7 · 2² = 5.4 m.'], ans: 'h = 5.4 m',
        setup() { P.pk = 0.5; P.tilt = 0; P.wind = 0; P.T = 19.6; M.reset(); S.p.y = 2.3; }, preview: 1500, reveal() { this.y0 = S.p.y; this.t0 = S.t; S.until = S.t + 2; P.T = 25; TD.K.refresh(); }, done() { return S.until && S.t >= S.until - 1e-9; }, measured() { return `sube ${N1(S.p.y - this.y0, 2)} m en ${N1(S.t - this.t0, 2)} s`; }},
      tour: [{at: 0.5, view: 'lado'}, {at: 2, key: 'T', to: 23}, {at: 7, sel: '[data-key="d0"]'}, {at: 10, key: 'tilt', to: 15}, {at: 15, key: 'tilt', to: 0}, {at: 16, sel: '[data-key="d0"]'}, {at: 18, view: 'tres'}, {at: 20, key: 'wind', to: 4}, {at: 26, key: 'wind', to: 0}, {at: 27, view: 'cerca'}, {at: 31, sel: '[data-key="d1"]'}]
    };
    return M;
  }
};

/* ======================= 1.3 · Tercera ley: patinadores ======================= */
const patinadores = {id: 'tercera-ley', tab: '1.3 Tercera ley', kicker: 'Teardown · Tema 1 · Dinámica · 1.3', title: 'Tercera ley · dos patinadores se empujan',
  specs: 'Ana 50 kg · Beto 75 kg · empujón de 0.5 s · pista sin fricción', noteTag: 'Acción y reacción',
  notes: `<div class="eq">F₁₂ = − F₂₁ (en todo instante)</div><p>Si Beto empuja a Ana, Ana empuja a Beto con una fuerza de <b>igual magnitud y sentido opuesto</b>. Actúan sobre cuerpos distintos, por eso no se cancelan.</p>
    <p>Consecuencia: m₁a₁ = −m₂a₂ y el ímpetu total p = m₁v₁ + m₂v₂ se conserva.</p><ul><li>Las dos flechas miden siempre lo mismo, aunque las masas sean distintas.</li><li>Misma fuerza, distinta aceleración: el más ligero sale más rápido.</li><li>En la gráfica, p total no cambia en ningún momento.</li></ul>${legend([[F.T, 'Fuerza sobre Ana'], [F.N, 'Fuerza sobre Beto'], [F.v, 'Velocidad']])}`,
  build(K) {
    const g = new THREE.Group(), P = {m1: 50, m2: 75, Fm: 236};
    const ice = K.mesh(new THREE.BoxGeometry(24, 0.04, 7), K.MAT.tex('ice', [5, 1.5], 0.12)); ice.position.y = 0.02; g.add(ice);
    const ana = K.person({shirt: 0xd6336c, pants: 0x212529, hair: 0x5c3317, skates: 1, scale: 0.92}), beto = K.person({shirt: 0x1c7ed6, pants: 0x343a40, skates: 1, scale: 1.04});
    ana.group.rotation.y = 0; beto.group.rotation.y = PI; g.add(ana.group, beto.group);
    const vA = K.vector(F.T, 'F sobre Ana'), vB = K.vector(F.N, 'F sobre Beto'), vvA = K.vector(F.v, 'v Ana'), vvB = K.vector(F.v, 'v Beto');
    const tau = 0.5, S = {x1: -0.42, x2: 0.42, v1: 0, v2: 0, t: 0, tp: -1, F: 0};
    const M = {group: g, P, vectors: [vA, vB, vvA, vvB],
      views: {lado: {label: 'Lado', t: [0, 1.0, 0], yaw: 0, pitch: 0.08, d: 7}, tres: {label: '3/4', t: [0, 1.0, 0], yaw: -0.6, pitch: 0.22, d: 7.5}, manos: {label: 'Manos', t: [0, 1.35, 0], yaw: 0.35, pitch: 0.05, d: 2.4}},
      follow: () => V3((S.x1 + S.x2) / 2 * 0.3, 0, 0),
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'v', label: 'Velocidad', on: true}],
      readouts: [{label: 'F sobre Ana', get: () => N1(S.F, 0) + ' N', big: 1}, {label: 'F sobre Beto', get: () => N1(S.F, 0) + ' N', big: 1}, {label: 'a Ana · a Beto', get: () => `${N1(S.F / P.m1, 2)} · ${N1(S.F / P.m2, 2)} m/s²`}, {label: 'v Ana · v Beto', get: () => `${N1(-S.v1, 2)} · ${N1(S.v2, 2)} m/s`},
        {label: 'p Ana · p Beto', get: () => `${N1(P.m1 * S.v1, 1)} · ${N1(P.m2 * S.v2, 1)}`}, {label: 'p total', get: () => N1(P.m1 * S.v1 + P.m2 * S.v2, 2) + ' kg·m/s', acc: 1}],
      chart: {title: 'Ímpetu p = m v', series: [{label: 'Ana', color: F.T}, {label: 'Beto', color: F.N}, {label: 'Total', color: F.S, w: 2.2}], unit: 'kg·m/s', span: 5},
      sample: () => [S.t, [P.m1 * S.v1, P.m2 * S.v2, P.m1 * S.v1 + P.m2 * S.v2]],
      controls: [{type: 'range', key: 'm1', label: 'Masa de Ana', min: 30, max: 100, step: 1, fmt: v => v + ' kg'}, {type: 'range', key: 'm2', label: 'Masa de Beto', min: 30, max: 120, step: 1, fmt: v => v + ' kg'},
        {type: 'range', key: 'Fm', label: 'Fuerza máxima del empujón', min: 50, max: 500, step: 1, fmt: v => v + ' N'},
        {type: 'buttons', key: 'e', primary: 1, items: [['¡Empujar!', () => { M.reset(); S.delay = 0; S.tp = 0; }], ['Juntar de nuevo', () => M.reset()]]},
        {type: 'note', text: 'El empujón dura 0.5 s; la fuerza sube y baja suavemente (perfil senoidal). Impulso J = (2/π)·F·0.5 s.'}],
      calls: {manos: [[() => V3((S.x1 + S.x2) / 2, 1.42, 0.2), 'Manos en contacto', 'Dos fuerzas, dos cuerpos', 1]], lado: [], tres: []},
      reset() { S.x1 = -0.42; S.x2 = 0.42; S.v1 = 0; S.v2 = 0; S.t = 0; S.tp = -1; S.delay = 0.8; S.F = 0; },
      update(dt) {
        const n = 10, h = dt / n; S.t += dt;
        if (S.delay > 0) { S.delay -= dt; if (S.delay <= 0) S.tp = 0; }
        for (let i = 0; i < n; i++) { S.F = 0; if (S.tp >= 0 && S.tp < tau) S.F = P.Fm * sin(PI * S.tp / tau);
          if (S.tp >= 0) S.tp += h; if (S.tp >= tau) S.tp = -1;
          S.v1 -= S.F / P.m1 * h; S.v2 += S.F / P.m2 * h; S.x1 += S.v1 * h; S.x2 += S.v2 * h; }
        if (S.tp > 0 && S.tp < 0.0001) {}
        S.x1 = max(-11, S.x1); S.x2 = min(11, S.x2);
      },
      pose() {
        const pushing = S.F > 0 || (S.tp >= 0 && S.tp < tau);
        ana.group.position.set(S.x1, 0.04, 0); beto.group.position.set(S.x2, 0.04, 0);
        const reach = min(1.4, (S.x2 - S.x1) * 1.3); ana.pose({armL: pushing || S.x2 - S.x1 < 1 ? -1.45 : 0.2, armR: pushing || S.x2 - S.x1 < 1 ? -1.45 : 0.2, lean: pushing ? 0.12 : 0.03}); beto.pose({armL: pushing || S.x2 - S.x1 < 1 ? -1.45 : 0.2, armR: pushing || S.x2 - S.x1 < 1 ? -1.45 : 0.2, lean: pushing ? 0.12 : 0.03});
        const y = 1.42, sc = 0.004;
        if (K.ov('f') && S.F > 0.5) { vA.set(V3(S.x1, y, 0.35), V3(-S.F, 0, 0), sc); vB.set(V3(S.x2, y, 0.35), V3(S.F, 0, 0), sc); } else { vA.hide(); vB.hide(); }
        if (K.ov('v')) { abs(S.v1) > 0.01 ? vvA.set(V3(S.x1, 0.3, 0.4), V3(S.v1, 0, 0), 0.8, `v<small>${N1(abs(S.v1), 2)} m/s</small>`) : vvA.hide(); abs(S.v2) > 0.01 ? vvB.set(V3(S.x2, 0.3, 0.4), V3(S.v2, 0, 0), 0.8, `v<small>${N1(abs(S.v2), 2)} m/s</small>`) : vvB.hide(); } else { vvA.hide(); vvB.hide(); }
      },
      problem: {title: 'Patinadores que se empujan', text: 'En la pista de hielo, Ana (50 kg) y Beto (75 kg) están quietos y se empujan con las manos. Ana sale hacia atrás a 1.5 m/s.', q: '¿Quién empuja más fuerte? ¿A qué velocidad sale Beto?',
        steps: ['3ª ley: la fuerza sobre Ana y sobre Beto es igual y opuesta en todo momento.', 'Mismo tiempo de contacto ⇒ mismo impulso ⇒ m_A v_A = m_B v_B (el ímpetu total sigue siendo 0).', 'v_B = 50 × 1.5 / 75.'],
        ans: 'Ninguno: las fuerzas son iguales. Beto sale a 1.0 m/s en sentido opuesto.', load() { P.m1 = 50; P.m2 = 75; P.Fm = Math.round(50 * 1.5 * PI / (2 * tau)); M.reset(); }},
      reto: {title: 'Ímpetu compartido', text: 'Ahora Ana pesa 40 kg y Beto 80 kg. El empujón les da a cada uno un impulso de 96 N·s (en sentidos opuestos).', q: '¿Con qué rapidez sale Beto?', unit: 'm/s', answer: 1.2, tol: 0.02,
        hint: 'impulso = cambio de ímpetu: J = m Δv.', steps: ['J = m_B v_B ⇒ v_B = 96 / 80.', 'Ana: v_A = 96 / 40 = 2.4 m/s (el doble, porque pesa la mitad).', 'p total = 40·2.4 − 80·1.2 = 0.'], ans: 'v_B = 1.2 m/s',
        setup() { P.m1 = 40; P.m2 = 80; P.Fm = Math.round(96 * PI / (2 * tau)); M.reset(); S.delay = 99; }, preview: 900, reveal() { M.reset(); S.delay = 0.2; }, done: () => S.t > 1.6, measured: () => `v Beto = ${N1(S.v2, 2)} m/s · v Ana = ${N1(-S.v1, 2)} m/s`},
      tour: [{at: 0.5, view: 'manos'}, {at: 5, view: 'lado'}, {at: 7, sel: '[data-key="e0"]'}, {at: 12, key: 'm2', to: 110}, {at: 16, sel: '[data-key="e0"]'}, {at: 22, view: 'tres'}, {at: 24, key: 'm2', to: 75}]
    };
    return M;
  }
};

/* ======================= 1.4 · Aplicaciones: caja en la rampa ======================= */
function wedge(K, L, th, depth, mat) { const c = cos(th), s = sin(th), sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-L * c, 0); sh.lineTo(-L * c, L * s); sh.lineTo(0, 0); const geo = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled: false}); geo.translate(0, 0, -depth / 2); return K.mesh(geo, mat); }
const rampa = {id: 'aplicaciones', tab: '1.4 Plano inclinado', kicker: 'Teardown · Tema 1 · Dinámica · 1.4', title: 'Aplicaciones de la 2ª ley · caja en la rampa de carga',
  specs: 'Rampa de 4 m · caja de cartón 8 kg · μₛ = 0.4 · μₖ = 0.3', noteTag: 'Diagrama de cuerpo libre',
  notes: `<p>Método general: (1) aislar el cuerpo, (2) dibujar <b>todas</b> las fuerzas, (3) elegir ejes cómodos (paralelo y perpendicular al plano), (4) aplicar ΣF = m a en cada eje.</p>
    <div class="eq">N = m g cos θ · ΣF∥ = F − m g sin θ ± f</div><p>Fricción estática: fₛ ≤ μₛ N (toma el valor que haga falta). Cinética: fₖ = μₖ N, opuesta a la velocidad.</p>
    <ul><li>Con F = 0 sube θ poco a poco: desliza justo cuando tan θ = μₛ.</li><li>En reposo, la fricción estática iguala exactamente a m g sin θ.</li><li>Empuja hacia arriba: la fricción cambia de sentido.</li><li>N no es m g: aquí N = m g cos θ.</li></ul>${legend([[F.W, 'Peso'], [F.N, 'Normal'], [F.f, 'Fricción'], [F.T, 'Empuje'], [F.S, 'Fuerza neta']])}`,
  build(K) {
    const g = new THREE.Group(), P = {th: 20, m: 8, mus: 0.4, muk: 0.3, F: 0}, L = 4.2, depth = 1.0;
    let wd = null; const wg = new THREE.Group(); g.add(wg);
    const crate = K.box(0.45, 0.4, 0.45, K.MAT.tex('cardboard', [1, 1], 0.8), 0.015); g.add(crate);
    const vW = K.vector(F.W, 'W'), vN = K.vector(F.N, 'N'), vf = K.vector(F.f, 'f'), vF = K.vector(F.T, 'F'), vS = K.vector(F.S, 'ΣF'), vWp = K.vector(F.W, 'W∥', {ghost: 1, r: 0.012}), vWn = K.vector(F.W, 'W⊥', {ghost: 1, r: 0.012});
    const S = {s: 2.6, v: 0, t: 0, f: 0, kin: false, thB: null};
    const th = () => P.th * D, Nn = () => P.m * g0 * cos(th());
    function rebuild() { if (wd) wg.remove(wd); wd = wedge(K, L, th(), depth, K.MAT.tex('wood', [1, 1], 0.6)); wd.position.x = L * cos(th()) / 2; wg.add(wd); S.thB = P.th; }
    const posOn = (s, h) => { const c = cos(th()), si = sin(th()); return V3(L * cos(th()) / 2 - s * c + si * h, s * si + c * h, 0); };
    const M = {group: g, P, vectors: [vW, vN, vf, vF, vS, vWp, vWn],
      views: {lado: {label: 'Lado', t: [0, 0.8, 0], yaw: 0, pitch: 0.05, d: 8.5}, tres: {label: '3/4', t: [0, 0.7, 0], yaw: -0.6, pitch: 0.25, d: 8.5}, dcl: {label: 'DCL', t: [0, 0.9, 0.4], yaw: 0, pitch: 0.02, d: 3.6}},
      follow: () => { const p = posOn(S.s, 0.2); return V3(p.x * 0.4, (p.y - 0.9) * 0.4, 0); },
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'comp', label: 'Componentes del peso'}],
      readouts: [{label: 'Normal N = m g cos θ', get: () => N1(Nn()) + ' N'}, {label: 'm g sin θ', get: () => N1(P.m * g0 * sin(th())) + ' N'}, {label: 'Fricción', get: () => `${N1(abs(S.f))} N · ${S.kin ? 'cinética' : 'estática'}`, big: 1}, {label: 'Máx. estática μₛN', get: () => N1(P.mus * Nn()) + ' N'}, {label: 'Fuerza neta ΣF∥', get: () => N1(S.Fn) + ' N', acc: 1}, {label: 'Aceleración', get: () => N1(S.Fn / P.m, 2) + ' m/s²'}, {label: 'Velocidad', get: () => N1(S.v, 2) + ' m/s'}],
      chart: {title: 'Fricción y fuerza neta (a lo largo de la rampa)', series: [{label: 'f', color: F.f}, {label: 'ΣF', color: F.S}], unit: 'N', span: 8},
      sample: () => [S.t, [S.f, S.Fn]],
      controls: [{type: 'range', key: 'th', label: 'Ángulo de la rampa', min: 0, max: 45, step: 0.5, fmt: v => v + '°'}, {type: 'range', key: 'm', label: 'Masa de la caja', min: 1, max: 20, step: 0.5, fmt: v => v + ' kg'},
        {type: 'range', key: 'F', label: 'Empuje (rampa arriba +)', min: -40, max: 100, step: 1, fmt: v => v + ' N'}, {type: 'range', key: 'mus', label: 'μₛ', min: 0, max: 1, step: 0.01, fmt: v => v.toFixed(2)}, {type: 'range', key: 'muk', label: 'μₖ', min: 0, max: 1, step: 0.01, fmt: v => v.toFixed(2)},
        {type: 'buttons', key: 'r', items: [['Caja al centro', () => { S.s = 2.6; S.v = 0; }], ['Sin fricción', () => { P.mus = 0; P.muk = 0; }]]}],
      calls: {tres: [[() => posOn(S.s, 0.4), 'Caja · cartón', 'm = 8 kg', 1], [() => posOn(0.6, 0), 'Rampa de madera', 'θ ajustable', -1]], lado: [], dcl: []},
      reset() { S.s = 2.6; S.v = 0; S.t = 0; S.kin = false; },
      update(dt) {
        if (S.thB !== P.th) rebuild(); if (P.muk > P.mus) P.muk = P.mus;
        const n = 20, h = dt / n; S.t += dt;
        for (let i = 0; i < n; i++) {
          const drive = P.F - P.m * g0 * sin(th()), Nv = Nn();
          if (abs(S.v) < 1e-3 && abs(drive) <= P.mus * Nv) { S.v = 0; S.f = -drive; S.kin = false; S.Fn = 0; }
          else { const dir = abs(S.v) > 1e-3 ? Math.sign(S.v) : Math.sign(drive); S.f = -dir * P.muk * Nv; S.kin = true; S.Fn = drive + S.f; const v0 = S.v, s0 = S.s; S.v += S.Fn / P.m * h; if (v0 !== 0 && Math.sign(S.v) !== Math.sign(v0)) S.v = 0; S.s += S.v * h; if (S.s < 0.25 && s0 >= 0.25) { S.vmax = max(S.vmax || 0, sqrt(v0 * v0 + 2 * abs(S.Fn / P.m) * (s0 - 0.25))); S.s = 0.25; S.v = 0; break; } }
        }
        if (S.s > 0.25) S.vmax = max(S.vmax || 0, abs(S.v));
        if (S.s < 0.25) { S.s = 0.25; S.v = 0; } if (S.s > L - 0.25) { S.s = L - 0.25; S.v = 0; }
      },
      pose() {
        crate.position.copy(posOn(S.s, 0.2)); crate.rotation.z = -th();
        const o = posOn(S.s, 0.2).add(V3(0, 0, 0.3)), sc = 0.012, up = V3(-cos(th()), sin(th()), 0), nrm = V3(sin(th()), cos(th()), 0);
        if (K.ov('f')) { vW.set(o, V3(0, -P.m * g0, 0), sc); vN.set(o, nrm.clone().multiplyScalar(Nn()), sc); abs(S.f) > 0.05 ? vf.set(o, up.clone().multiplyScalar(S.f), sc) : vf.hide(); abs(P.F) > 0.05 ? vF.set(o, up.clone().multiplyScalar(P.F), sc) : vF.hide(); abs(S.Fn) > 0.05 ? vS.set(o.clone().add(V3(0, 0, 0.1)), up.clone().multiplyScalar(S.Fn), sc) : vS.hide(); } else [vW, vN, vf, vF, vS].forEach(v => v.hide());
        if (K.ov('comp')) { vWp.set(o, up.clone().multiplyScalar(-P.m * g0 * sin(th())), sc, `W∥<small>${N1(P.m * g0 * sin(th()))}</small>`); vWn.set(o, nrm.clone().multiplyScalar(-Nn()), sc, `W⊥<small>${N1(Nn())}</small>`); } else { vWp.hide(); vWn.hide(); }
      },
      problem: {title: 'Subir una caja por una rampa de carga', text: 'Un repartidor empuja una caja de 8 kg, paralelo a una rampa de 20°. Entre caja y rampa: μₛ = 0.4 y μₖ = 0.3.', q: '¿Qué fuerza mínima hace que empiece a subir? ¿Y cuál la mantiene subiendo a velocidad constante?',
        steps: ['N = m g cos 20° ≈ 73.7 N; m g sin 20° ≈ 26.8 N.', 'Para arrancar: F = m g sin θ + μₛ N = 26.8 + 0.4 × 73.7 ≈ 56.3 N.', 'Ya en movimiento (a = 0): F = m g sin θ + μₖ N = 26.8 + 0.3 × 73.7 ≈ 48.9 N.', 'En la simulación: con F = 57 N arranca; luego baja F a 49 N y la aceleración se vuelve ≈ 0.'],
        ans: 'F para arrancar ≈ 56 N; F a velocidad constante ≈ 49 N.', load() { P.th = 20; P.m = 8; P.mus = 0.4; P.muk = 0.3; P.F = 57; S.s = 0.5; S.v = 0; }},
      reto: {title: 'La caja que se escapa', text: 'Una caja de 4 kg se suelta desde el reposo a 3.5 m de la base (medidos sobre la rampa) en una rampa de 30°. μₛ = 0.30 y μₖ = 0.25.', q: '¿Con qué rapidez llega a la base?', unit: 'm/s', answer: sqrt(2 * g0 * (sin(30 * D) - 0.25 * cos(30 * D)) * (3.5 - 0.25)), tol: 0.03,
        hint: 'verifica que sí desliza (tan θ vs μₛ); luego a = g(sin θ − μₖ cos θ) y v² = 2 a d. Ojo: la caja se detiene a 0.25 m del borde (su centro).', steps: ['tan 30° = 0.577 > 0.30 ⇒ desliza.', 'a = g (sin 30° − 0.25 cos 30°) ≈ 2.78 m/s².', 'El centro de la caja recorre 3.25 m: v = √(2 · 2.78 · 3.25).'], ans: 'v ≈ 4.25 m/s',
        setup() { P.th = 30; P.m = 4; P.mus = 0.3; P.muk = 0.25; P.F = 0; S.s = 3.5; S.v = 0; this.holdS = true; }, preview: 200, reveal() { S.s = 3.5; S.v = 0; S.vmax = 0; }, done() { return S.s <= 0.2501; }, measured() { return `v = ${N1(S.vmax, 2)} m/s al llegar`; }},
      tour: [{at: 0.5, view: 'tres'}, {at: 3, view: 'dcl'}, {at: 5, ov: 'comp', on: true}, {at: 9, key: 'th', to: 23}, {at: 14, key: 'th', to: 20}, {at: 15, sel: '[data-key="r0"]'}, {at: 17, key: 'F', to: 60}, {at: 23, key: 'F', to: 49}, {at: 29, key: 'F', to: 0}, {at: 30, ov: 'comp', on: false}, {at: 31, view: 'lado'}]
    };
    rebuild();
    return M;
  }
};

/* ======================= 1.5 · Fricción: arrastrar un mueble ======================= */
const mueble = {id: 'friccion', tab: '1.5 Fricción', kicker: 'Teardown · Tema 1 · Dinámica · 1.5', title: 'Fricción estática y cinética · arrastrar un mueble',
  specs: 'Mueble de madera 10 kg · piso de madera μₛ = 0.5 · μₖ = 0.3 · cuerda a θ', noteTag: 'fₛ ≤ μₛN · fₖ = μₖN',
  notes: `<p>Mientras el mueble no se mueve, la fricción estática toma <b>el valor que haga falta</b> para impedir el movimiento, hasta un máximo μₛN. Al deslizar, la fricción cinética es casi constante y menor.</p>
    <div class="eq">N = m g − F sin θ · arranca si F cos θ > μₛ N</div><ul><li>Usa la <b>rampa de fuerza</b>: f sube igual que F, y cae de golpe a μₖN cuando el mueble arranca.</li><li>Por eso cuesta más arrancar un mueble que mantenerlo en movimiento.</li><li>Jala con la cuerda inclinada: N baja y arranca con menos fuerza. El mínimo está en tan θ = μₛ.</li></ul>${legend([[F.T, 'Cuerda'], [F.W, 'Peso'], [F.N, 'Normal'], [F.f, 'Fricción'], [F.S, 'Fuerza neta']])}`,
  build(K) {
    const g = new THREE.Group(), P = {m: 10, th: 0, F: 0, surf: 'madera'};
    const SURF = {madera: [0.5, 0.3], hule: [0.9, 0.7], hielo: [0.1, 0.03]};
    const floor = K.mesh(new THREE.BoxGeometry(14, 0.04, 4), K.MAT.tex('wood', [4, 1.2], 0.55)); floor.position.set(2, 0.02, 0); g.add(floor);
    const cab = new THREE.Group(); g.add(cab);
    const carc = K.box(0.7, 1.1, 0.5, K.MAT.tex('walnut', [1, 1.4], 0.5), 0.02); carc.position.y = 0.59; cab.add(carc);
    [0.35, 0.75].forEach(y => { const dr = K.box(0.62, 0.32, 0.02, K.MAT.tex('walnut', [1, 0.5], 0.45), 0.01); dr.position.set(0, y, 0.255); cab.add(dr); const kn = K.sph(0.02, K.MAT.brass(), 12); kn.position.set(0, y, 0.275); cab.add(kn); });
    const puller = K.person({shirt: 0x2f9e44, pants: 0x343a40}); g.add(puller.group);
    const rope = K.tubeBetween(V3(), V3(1, 0, 0), 0.008, K.MAT.std(0xc9a46a, 0.9)); g.add(rope);
    const vF = K.vector(F.T, 'F'), vW = K.vector(F.W, 'W'), vN = K.vector(F.N, 'N'), vf = K.vector(F.f, 'f'), vS = K.vector(F.S, 'ΣF');
    const S = {x: 0, v: 0, t: 0, f: 0, kin: false, ramp: false, Fstart: null};
    const mus = () => SURF[P.surf][0], muk = () => SURF[P.surf][1];
    const Nn = () => max(0, P.m * g0 - P.F * sin(P.th * D));
    const M = {group: g, P, vectors: [vF, vW, vN, vf, vS],
      views: {lado: {label: 'Lado', t: [1.3, 0.9, 0], yaw: 0, pitch: 0.05, d: 8}, tres: {label: '3/4', t: [1.3, 0.8, 0], yaw: -0.65, pitch: 0.25, d: 8}, dcl: {label: 'DCL', t: [0, 0.6, 0.3], yaw: 0, pitch: 0.02, d: 3.2}},
      follow: () => V3(S.x, 0, 0),
      overlays: [{key: 'f', label: 'Fuerzas', on: true}],
      readouts: [{label: 'Normal N = m g − F sin θ', get: () => N1(Nn()) + ' N'}, {label: 'Jalón horizontal F cos θ', get: () => N1(P.F * cos(P.th * D)) + ' N'}, {label: 'Fricción', get: () => `${N1(abs(S.f))} N · ${S.kin ? 'cinética' : 'estática'}`, big: 1}, {label: 'μₛN · μₖN', get: () => `${N1(mus() * Nn())} · ${N1(muk() * Nn())} N`}, {label: 'Fuerza neta', get: () => N1(S.Fn) + ' N', acc: 1}, {label: 'F de arranque', get: () => S.Fstart ? N1(S.Fstart) + ' N' : '—'}, {label: 'Velocidad', get: () => N1(S.v, 2) + ' m/s'}],
      chart: {title: 'Fuerza aplicada F cos θ y fricción', series: [{label: 'F cos θ', color: F.T}, {label: 'fricción', color: F.f}], unit: 'N', span: 10},
      sample: () => [S.t, [P.F * cos(P.th * D), abs(S.f)]],
      controls: [{type: 'range', key: 'F', label: 'Fuerza en la cuerda', min: 0, max: 100, step: 0.5, fmt: v => v.toFixed(1) + ' N'}, {type: 'range', key: 'th', label: 'Ángulo de la cuerda', min: 0, max: 60, step: 0.5, fmt: v => v + '°'}, {type: 'range', key: 'm', label: 'Masa del mueble', min: 2, max: 30, step: 0.5, fmt: v => v + ' kg'},
        {type: 'chips', key: 'surf', label: 'Piso', options: [['Madera 0.5/0.3', 'madera'], ['Hule 0.9/0.7', 'hule'], ['Hielo 0.1/0.03', 'hielo']]},
        {type: 'buttons', key: 'k', primary: 1, items: [['Rampa de fuerza', () => { M.reset(); S.ramp = true; P.F = 0; }], ['Soltar la cuerda', () => { S.ramp = false; P.F = 0; }]]}, {type: 'note', text: 'La rampa sube F a 8 N/s hasta que el mueble arranca.'}],
      calls: {tres: [[() => cab.localToWorld(V3(0.35, 1.0, 0)), 'Mueble de madera', 'm = 10 kg', 1], [() => V3(S.x + 0.36, 0.05, 0.2), 'Contacto madera–madera', 'Aquí nace la fricción', -1]], lado: [], dcl: []},
      reset() { S.x = 0; S.v = 0; S.t = 0; S.kin = false; S.ramp = false; S.Fstart = null; P.F = 0; },
      update(dt) {
        const n = 20, h = dt / n; S.t += dt;
        for (let i = 0; i < n; i++) {
          if (S.ramp) { P.F = min(100, P.F + 8 * h); if (S.kin) S.ramp = false; }
          const Fx = P.F * cos(P.th * D), Nv = Nn();
          if (abs(S.v) < 1e-3 && Fx <= mus() * Nv) { S.v = 0; S.f = -Fx; S.kin = false; S.Fn = 0; }
          else { if (!S.kin && S.Fstart === null) S.Fstart = P.F; S.kin = true; S.f = -muk() * Nv * (S.v >= 0 ? 1 : -1); S.Fn = Fx + S.f; S.v = max(0, S.v + S.Fn / P.m * h); if (S.v === 0) S.kin = false; S.x += S.v * h; }
        }
        if (S.x > 6) { S.x = 6; S.v = 0; }
      },
      pose() {
        cab.position.set(S.x, 0.04, 0);
        const anchor = V3(S.x + 0.36, 0.95, 0), a = P.th * D, hand = anchor.clone().add(V3(cos(a) * 1.5, sin(a) * 1.5, 0));
        rope.userData.set(anchor, hand); puller.group.position.set(hand.x + 0.42, 0.04 + min(0, hand.y - 1.25), 0); puller.group.rotation.y = PI; puller.pose({lean: P.F > 5 ? -0.25 : 0, armL: -1.2 + a * 0.6, armR: -1.2 + a * 0.6, stride: P.F > 5 ? 0.35 : 0});
        const o = V3(S.x, 0.6, 0.32), sc = 0.01;
        if (K.ov('f')) { P.F > 0.2 ? vF.set(o, V3(cos(a), sin(a), 0).multiplyScalar(P.F), sc) : vF.hide(); vW.set(o.clone().add(V3(0.07, 0, 0)), V3(0, -P.m * g0, 0), sc); vN.set(o.clone().add(V3(-0.07, 0, 0)), V3(0, Nn(), 0), sc); abs(S.f) > 0.2 ? vf.set(o.clone().add(V3(0, -0.5, 0)), V3(S.f, 0, 0), sc) : vf.hide(); abs(S.Fn) > 0.2 ? vS.set(o.clone().add(V3(0, 0.15, 0.05)), V3(S.Fn, 0, 0), sc) : vS.hide(); } else [vF, vW, vN, vf, vS].forEach(v => v.hide());
      },
      problem: {title: 'Arrastrar un mueble', text: 'Quieres mover un mueble de madera de 10 kg sobre un piso de madera (μₛ = 0.5, μₖ = 0.3).', q: '¿Qué fuerza horizontal necesitas para arrancarlo? ¿Y si jalas con una cuerda a 30° sobre la horizontal?',
        steps: ['Horizontal: N = m g = 98 N ⇒ F = μₛ N = 49 N.', 'A 30°: la componente vertical aligera al mueble: N = m g − F sin 30°.', 'Arranca cuando F cos 30° = μₛ (m g − F sin 30°) ⇒ F = μₛ m g / (cos 30° + μₛ sin 30°) = 49 / 1.116.', 'Usa la rampa de fuerza y lee «F de arranque».'],
        ans: '49 N jalando horizontal; ≈ 43.9 N jalando a 30° (¡10 % menos!).', load() { P.m = 10; P.surf = 'madera'; P.th = 30; M.reset(); S.ramp = true; }},
      reto: {title: 'El ángulo más eficiente', text: 'Para el mismo mueble (10 kg, μₛ = 0.5), la fuerza de arranque depende del ángulo de la cuerda.', q: '¿A qué ángulo sobre la horizontal la fuerza para arrancarlo es mínima?', unit: '°', answer: atan2(0.5, 1) / D, tol: 0.03, abs: 0.8,
        hint: 'F(θ) = μₛ m g / (cos θ + μₛ sin θ); el denominador es máximo cuando su derivada es cero.', steps: ['Minimizar F ⇔ maximizar cos θ + μₛ sin θ.', 'Derivada: −sin θ + μₛ cos θ = 0 ⇒ tan θ = μₛ = 0.5.', 'θ ≈ 26.6°, con F_mín = μₛ m g / √(1 + μₛ²) ≈ 43.8 N.'], ans: 'θ ≈ 26.6°',
        setup() { P.m = 10; P.surf = 'madera'; P.th = 0; M.reset(); S.ramp = true; }, preview: 2500, reveal() { P.th = 26.6; M.reset(); S.ramp = true; TD.K.refresh(); }, done: () => S.Fstart !== null && S.t > 0.5, measured: () => `a 26.6° arranca con F = ${N1(S.Fstart)} N (a 0°: 49 N)`},
      tour: [{at: 0.5, view: 'tres'}, {at: 4, sel: '[data-key="k0"]'}, {at: 13, view: 'dcl'}, {at: 15, sel: '[data-key="k1"]'}, {at: 17, key: 'th', to: 30}, {at: 21, sel: '[data-key="k0"]'}, {at: 30, key: 'th', to: 0}, {at: 31, view: 'lado'}]
    };
    return M;
  }
};

/* ======================= Extra · Movimiento circular: la honda ======================= */
const honda = {id: 'circular', tab: 'Extra · Circular', kicker: 'Teardown · Tema 1 · Dinámica · Extra', title: 'Movimiento circular · la honda que se revienta',
  specs: 'Piedra de 0.5 kg · radio de 1 m · cuerda que aguanta 40 N', noteTag: 'Fuerza centrípeta',
  notes: `<p>Aunque la rapidez sea constante, la dirección de v cambia todo el tiempo: hay aceleración y apunta al <b>centro</b>.</p><div class="eq">a꜀ = v² / r · ΣF = m v² / r (hacia el centro)</div>
    <p>La «fuerza centrípeta» no es un tipo nuevo de fuerza: es la fuerza neta hacia el centro que aporta algo real (aquí, la tensión de la cuerda).</p><ul><li>Corta la cuerda: la piedra sale en línea recta, <b>tangente</b>, no hacia afuera.</li><li>Duplica v: la tensión se multiplica por 4. Duplica r con v fija: se reduce a la mitad.</li></ul>${legend([[F.T, 'Tensión = ΣF'], [F.v, 'Velocidad']])}`,
  build(K) {
    const g = new THREE.Group(), P = {v: 6, r: 1, m: 0.5, Tmax: 40};
    const yH = 1.55, kid = K.person({shirt: 0xf59f00, pants: 0x1864ab}); g.add(kid.group);
    const stone = K.sph(0.05, K.MAT.std(0x868e96, 0.7), 20); g.add(stone);
    const cordM = K.tubeBetween(V3(), V3(1, 0, 0), 0.004, K.MAT.std(0x8d6e63, 0.9)); g.add(cordM);
    const ring = K.mesh(new THREE.RingGeometry(0.995, 1.005, 96), new THREE.MeshBasicMaterial({color: 0x16181b, transparent: true, opacity: 0.18, side: THREE.DoubleSide})); ring.rotation.x = -PI / 2; ring.position.y = yH; g.add(ring);
    const vT = K.vector(F.T, 'T'), vV = K.vector(F.v, 'v');
    const S = {ang: 0, t: 0, cut: false, p: V3(), vel: V3(), broke: false, vbreak: null};
    const T = () => P.m * P.v * P.v / P.r;
    const M = {group: g, P, vectors: [vT, vV],
      views: {arriba: {label: 'Arriba', t: [0, yH, 0], yaw: 0, pitch: 1.5, d: 6}, tres: {label: '3/4', t: [0, 1.2, 0], yaw: -0.5, pitch: 0.45, d: 6}},
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'v', label: 'Velocidad', on: true}],
      readouts: [{label: 'Rapidez v', get: () => N1(P.v, 2) + ' m/s'}, {label: 'Radio r', get: () => N1(P.r, 2) + ' m'}, {label: 'Tensión T = m v²/r', get: () => S.cut ? '0 (cortada)' : N1(T()) + ' N', big: 1, acc: 1}, {label: 'a꜀ = v²/r', get: () => N1(P.v * P.v / P.r) + ' m/s²'}, {label: 'Límite de la cuerda', get: () => N1(P.Tmax) + ' N'}, {label: 'ω = v / r', get: () => N1(P.v / P.r, 2) + ' rad/s'}],
      chart: {title: 'Tensión de la cuerda', series: [{label: 'T', color: F.T}], unit: 'N', span: 8, refs: [{v: 40, label: 'se rompe', color: F.S}], min: 0},
      sample: () => [S.t, [S.cut ? 0 : T()]],
      controls: [{type: 'range', key: 'v', label: 'Rapidez de la piedra', min: 1, max: 12, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'}, {type: 'range', key: 'r', label: 'Largo de la cuerda', min: 0.4, max: 1.4, step: 0.01, fmt: v => v.toFixed(2) + ' m'}, {type: 'range', key: 'm', label: 'Masa de la piedra', min: 0.1, max: 1.5, step: 0.05, fmt: v => v.toFixed(2) + ' kg'},
        {type: 'buttons', key: 'c', primary: 1, items: [['Cortar la cuerda', () => { if (!S.cut) cut(); }], ['Cuerda nueva', () => M.reset()]]}],
      calls: {tres: [[() => stone.position, 'Piedra', 'Sigue la tangente si se suelta', 1], [() => V3(0, yH, 0), 'Mano', 'Tira hacia el centro', -1]], arriba: []},
      reset() { S.cut = false; S.broke = false; S.t = 0; S.vbreak = null; },
      update(dt) {
        S.t += dt;
        if (!S.cut) { S.ang += P.v / P.r * dt; S.p.set(P.r * cos(S.ang), yH, -P.r * sin(S.ang)); S.vel.set(-sin(S.ang) * P.v, 0, -cos(S.ang) * P.v); if (T() > P.Tmax) { S.broke = true; S.vbreak = P.v; cut(); } }
        else { S.p.addScaledVector(S.vel, dt); S.vel.y -= g0 * dt; if (S.p.y < 0.05) { S.p.y = 0.05; S.vel.set(0, 0, 0); } }
      },
      pose() {
        stone.position.copy(S.p); kid.group.position.set(-0.05, 0, 0.0); kid.group.rotation.y = S.cut ? kid.group.rotation.y : S.ang + PI / 2; kid.pose({armR: -2.6, armL: 0.1});
        cordM.visible = !S.cut; if (!S.cut) cordM.userData.set(V3(0, yH, 0), S.p); ring.scale.setScalar(P.r);
        const o = S.p.clone().add(V3(0, 0.08, 0));
        K.ov('f') && !S.cut ? vT.set(o, V3(-S.p.x, 0, -S.p.z).normalize().multiplyScalar(T()), 0.018) : vT.hide();
        K.ov('v') ? vV.set(o, S.vel, 0.12, `v<small>${N1(S.vel.length(), 1)} m/s</small>`) : vV.hide();
      },
      problem: {title: 'Honda que se revienta', text: 'Haces girar una piedra de 0.5 kg en un círculo horizontal de 1 m de radio con una cuerda que aguanta como máximo 40 N.', q: '¿Qué tensión hay a 8 m/s? ¿Cuál es la rapidez máxima antes de que la cuerda se rompa? ¿Hacia dónde sale la piedra?',
        steps: ['La tensión es la fuerza centrípeta: T = m v² / r = 0.5 × 64 / 1 = 32 N.', 'Límite: 40 = 0.5 v² / 1 ⇒ v_máx = √80.', 'Al romperse, la piedra sale en línea recta, tangente al círculo (prueba «Cortar la cuerda»).'],
        ans: 'T = 32 N; v_máx ≈ 8.9 m/s; sale tangente, no hacia afuera.', load() { P.m = 0.5; P.r = 1; P.v = 8; M.reset(); }},
      reto: {title: 'Cuerda más corta', text: 'Con la misma piedra (0.5 kg) y la misma cuerda (máx. 40 N), ahora el radio es de 0.5 m. Vas aumentando la rapidez poco a poco.', q: '¿A qué rapidez se rompe la cuerda?', unit: 'm/s', answer: sqrt(40 * 0.5 / 0.5), tol: 0.02,
        hint: 'T = m v² / r; despeja v con T = 40 N.', steps: ['40 = 0.5 v² / 0.5 ⇒ v² = 40.', 'v ≈ 6.32 m/s (con r = 1 m aguantaba hasta 8.9 m/s).'], ans: 'v ≈ 6.32 m/s',
        setup() { P.m = 0.5; P.r = 0.5; P.v = 3; M.reset(); }, preview: 1200, reveal() { M.reset(); this.iv = setInterval(() => { if (S.cut) { clearInterval(this.iv); return; } P.v = +(P.v + 0.05).toFixed(2); }, 40); }, done: () => S.cut, measured: () => `se rompió a v = ${N1(S.vbreak || P.v, 2)} m/s`},
      tour: [{at: 0.5, view: 'tres'}, {at: 4, key: 'v', to: 8}, {at: 9, view: 'arriba'}, {at: 12, sel: '[data-key="c0"]'}, {at: 17, sel: '[data-key="c1"]'}, {at: 18, key: 'v', to: 6}]
    };
    function cut() { S.cut = true; }
    return M;
  }
};

/* ======================= Extra · Fuerzas de arrastre: balón que cae ======================= */
const arrastre = {id: 'arrastre', tab: 'Extra · Arrastre', kicker: 'Teardown · Tema 1 · Dinámica · Extra', title: 'Fuerzas de arrastre · el balón que cae del edificio',
  specs: 'Balón de basquetbol 0.6 kg · F = c v² con c ≈ 0.015 kg/m · edificio de 120 m', noteTag: 'Velocidad terminal',
  notes: `<p>Un fluido ejerce sobre un cuerpo en movimiento una fuerza <b>opuesta a su velocidad</b> que crece con la rapidez.</p><div class="eq">F = b v (lineal) · F = c v² (cuadrático)</div>
    <p>Al caer, el arrastre crece hasta igualar al peso: ΣF = 0 y la velocidad deja de cambiar: <b>velocidad terminal</b> vₜ = √(m g / c).</p><ul><li>La flecha verde (arrastre) crece hasta igualar a la negra (peso).</li><li>En la gráfica, v(t) se acerca a la línea punteada vₜ; en el vacío seguiría subiendo.</li><li>Cuadruplica la masa: vₜ se duplica (cuadrático).</li></ul>${legend([[F.W, 'Peso'], [F.f, 'Arrastre'], [F.S, 'Fuerza neta'], [F.v, 'Velocidad']])}`,
  build(K) {
    const g = new THREE.Group(), P = {m: 0.6, c: 0.015, model: 'quad'}, H = 120;
    const bld = K.box(6, H, 6, K.MAT.std(0xdedcd6, 0.9)); bld.position.set(-3.6, H / 2, -3); g.add(bld);
    for (let y = 3; y < H; y += 3) { const s = K.box(6.04, 0.12, 6.04, K.MAT.std(y % 15 ? 0xc9c6bf : 0x9a968e, 0.8)); s.position.set(-3.6, y, -3); g.add(s); if (y % 15 === 0) { const lab = K.mesh(new THREE.PlaneGeometry(0.01, 0.01), K.MAT.std(0xffffff)); lab.position.set(-0.55, y, 0.02); g.add(lab); } }
    for (let y = 1.5; y < H; y += 3) for (let k = -2; k <= 2; k++) { const w = K.mesh(new THREE.PlaneGeometry(0.8, 1.4), K.MAT.std(0x8fa7b8, 0.15, 0.4)); w.position.set(-3.6 + k * 1.1, y, 0.01); g.add(w); }
    const ballMat = new THREE.MeshStandardMaterial({color: 0xe8590c, roughness: 0.7}); const ball = K.sph(0.12, ballMat, 32); g.add(ball);
    [0, PI / 2].forEach(r => { const s = K.mesh(new THREE.TorusGeometry(0.121, 0.003, 6, 48), K.MAT.std(0x16181b, 0.8), false); s.rotation.y = r; ball.add(s); }); const s3 = K.mesh(new THREE.TorusGeometry(0.121, 0.003, 6, 48), K.MAT.std(0x16181b, 0.8), false); s3.rotation.x = PI / 2; ball.add(s3);
    const vW = K.vector(F.W, 'W'), vD = K.vector(F.f, 'F arrastre'), vS = K.vector(F.S, 'ΣF'), vV = K.vector(F.v, 'v');
    const S = {y: H, v: 0, t: 0, landed: false};
    const vt = () => P.model === 'none' ? Infinity : P.model === 'lin' ? P.m * g0 / (P.c * 10) : sqrt(P.m * g0 / P.c);
    const drag = v => P.model === 'none' ? 0 : P.model === 'lin' ? P.c * 10 * v : P.c * v * abs(v);
    const M = {group: g, P, vectors: [vW, vD, vS, vV],
      views: {lado: {label: 'Lado', t: [0, 0, 0], yaw: 0.25, pitch: 0.05, d: 3.6}, lejos: {label: 'Edificio', t: [0, -20, 0], yaw: 0.4, pitch: 0.1, d: 60}},
      follow: () => V3(0, S.y, 0),
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'v', label: 'Velocidad', on: true}],
      readouts: [{label: 'Velocidad', get: () => N1(S.v, 2) + ' m/s', big: 1}, {label: 'Velocidad terminal vₜ', get: () => isFinite(vt()) ? N1(vt(), 2) + ' m/s' : '∞ (vacío)'}, {label: 'Peso W', get: () => N1(P.m * g0, 2) + ' N'}, {label: 'Arrastre', get: () => N1(drag(S.v), 2) + ' N'}, {label: 'Fuerza neta', get: () => N1(P.m * g0 - drag(S.v), 2) + ' N', acc: 1}, {label: 'Caída', get: () => N1(H - S.y, 1) + ' m'}, {label: 'Tiempo', get: () => N1(S.t, 2) + ' s'}],
      chart: {title: 'Velocidad de caída v(t)', series: [{label: 'v', color: F.v}], unit: 'm/s', span: 10, xFrom0: true, refs: [{v: () => isFinite(vt()) ? vt() : 0, label: 'vₜ', color: F.S}], min: 0},
      sample: () => [S.t, [S.v]],
      controls: [{type: 'chips', key: 'model', label: 'Aire', options: [['Vacío', 'none'], ['Lineal', 'lin'], ['Cuadrático', 'quad']]}, {type: 'range', key: 'm', label: 'Masa', min: 0.1, max: 2.4, step: 0.05, fmt: v => v.toFixed(2) + ' kg'}, {type: 'range', key: 'c', label: 'Coeficiente c', min: 0.003, max: 0.05, step: 0.001, fmt: v => v.toFixed(3) + ' kg/m'},
        {type: 'buttons', key: 'b', primary: 1, items: [['Soltar desde la azotea', () => M.reset()]]}],
      calls: {lado: [[() => ball.position.clone().add(V3(0.12, 0, 0)), 'Balón · 0.6 kg', 'El aire lo frena', 1]], lejos: []},
      reset() { S.y = H; S.v = 0; S.t = 0; S.landed = false; S.stopFall = 0; },
      update(dt) { if (S.landed) return; const n = 20, h = dt / n; for (let i = 0; i < n; i++) { const a = g0 - drag(S.v) / P.m; S.v += a * h; S.y -= S.v * h; S.t += h; if (S.y <= 0.12) { S.y = 0.12; S.landed = true; break; } if (S.stopFall && H - S.y >= S.stopFall) { S.landed = true; K.running = false; break; } } },
      pose() {
        ball.position.set(0, S.y, 0.6); ball.rotation.x += S.v * 0.01;
        const o = V3(0.3, S.y, 0.6), sc = 0.12;
        if (K.ov('f')) { vW.set(o, V3(0, -P.m * g0, 0), sc); drag(S.v) > 0.01 ? vD.set(o.clone().add(V3(0.12, 0, 0)), V3(0, drag(S.v), 0), sc) : vD.hide(); const net = P.m * g0 - drag(S.v); abs(net) > 0.02 && !S.landed ? vS.set(o.clone().add(V3(0.24, 0, 0)), V3(0, -net, 0), sc) : vS.hide(); } else [vW, vD, vS].forEach(v => v.hide());
        K.ov('v') && S.v > 0.05 && !S.landed ? vV.set(V3(-0.3, S.y, 0.6), V3(0, -S.v, 0), 0.04, `v<small>${N1(S.v, 1)} m/s</small>`) : vV.hide();
      },
      problem: {title: 'Balón que cae desde un edificio', text: 'Se deja caer un balón de basquetbol (0.6 kg) desde la azotea de un edificio alto. Para el aire, F = c v² con c ≈ 0.015 kg/m.', q: '¿Cuál es su velocidad terminal? ¿Cuánto tarda en llegar al 90 % de ella?',
        steps: ['En velocidad terminal el arrastre iguala al peso: c vₜ² = m g.', 'vₜ = √(m g / c) = √(0.6 × 9.8 / 0.015) ≈ 19.8 m/s (≈ 71 km/h).', 'La solución exacta es v(t) = vₜ tanh(g t / vₜ); 90 % cuando g t / vₜ = arctanh 0.9 ≈ 1.47 ⇒ t ≈ 3.0 s.'],
        ans: 'vₜ ≈ 19.8 m/s; llega al 90 % en ≈ 3.0 s.', load() { P.m = 0.6; P.c = 0.015; P.model = 'quad'; M.reset(); }},
      reto: {title: 'Los primeros 50 m', text: 'El balón de 0.6 kg se suelta desde el reposo; el aire ejerce F = c v² con c = 0.015 kg/m.', q: '¿Cuánto tarda en caer los primeros 50 m? (en el vacío tardaría 3.19 s)', unit: 's', answer: (sqrt(0.6 * g0 / 0.015) / g0) * Math.acosh(Math.exp(50 * g0 / (0.6 * g0 / 0.015))), tol: 0.03,
        hint: 'integra dos veces: y = (vₜ²/g) ln cosh(g t / vₜ).', steps: ['vₜ = √(m g / c) ≈ 19.8 m/s y vₜ²/g = 40 m.', '50 = 40 ln cosh(x), con x = g t / vₜ ⇒ cosh x = e^1.25 ⇒ x ≈ 1.92.', 't = x vₜ / g ≈ 3.88 s.'], ans: 't ≈ 3.88 s',
        setup() { P.m = 0.6; P.c = 0.015; P.model = 'quad'; M.reset(); }, preview: 700, reveal() { S.stopFall = 50; }, done: () => H - S.y >= 50, measured: () => `t = ${N1(S.t, 2)} s al caer ${N1(H - S.y, 1)} m`},
      tour: [{at: 0.5, view: 'lado'}, {at: 9, view: 'lejos'}, {at: 13, view: 'lado'}, {at: 15, key: 'model', sel: '[data-key="model"] [data-v="none"]'}, {at: 16, sel: '[data-key="b0"]'}, {at: 23, key: 'model', sel: '[data-key="model"] [data-v="quad"]'}, {at: 24, sel: '[data-key="b0"]'}]
    };
    return M;
  }
};

TD.start({machines: [cuadro, curling, dron, patinadores, rampa, mueble, honda, arrastre]});
})();
