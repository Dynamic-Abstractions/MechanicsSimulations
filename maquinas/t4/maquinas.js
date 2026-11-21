/* Tema 4 · Cinemática de la rotación — three teardown machines. */
(() => {
const {PI, sin, cos, abs, sqrt, min, max, atan2, hypot} = Math, D = PI / 180, TAU = 2 * PI;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const F = {w: '#7048e8', a: '#f59f00', v: '#0ca678', ac: '#3d8fe0', at: '#f59f00', A: '#f05a23'};
const legend = items => `<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin:8px 0 2px;font-size:10.5px;font-weight:600">${items.map(([c, t]) => `<span><i style="display:inline-block;width:12px;height:3px;background:${c};vertical-align:middle;margin-right:4px"></i>${t}</span>`).join('')}</div>`;
const N1 = (v, d = 1) => TD.K.fx(v, d);
const KICK = n => `Teardown · Tema 4 · Cinemática de la rotación · ${n}`;

function fan(K) {
  const g = new THREE.Group(), rot = new THREE.Group(); g.add(rot);
  const rod = K.cyl(0.02, 0.02, 0.5, K.MAT.metal(0x868e96), 10); rod.position.y = 0.25; g.add(rod);
  const canopy = K.cyl(0.09, 0.06, 0.06, K.MAT.std(0xf8f9fa, 0.4), 24); canopy.position.y = 0.52; g.add(canopy);
  const motor = K.cyl(0.13, 0.13, 0.16, K.MAT.std(0xf1f3f5, 0.35), 32); rot.add(motor);
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU, arm = K.box(0.18, 0.015, 0.04, K.MAT.metal(0xadb5bd), 0.005); arm.position.set(cos(a) * 0.2, -0.03, -sin(a) * 0.2); arm.rotation.y = a; rot.add(arm);
    const bl = K.box(0.55, 0.012, 0.13, K.MAT.tex('wood', [0.6, 0.3], 0.5), 0.02); bl.position.set(cos(a) * 0.52, -0.035, -sin(a) * 0.52); bl.rotation.y = a; rot.add(bl); }
  const mark = K.box(0.12, 0.02, 0.14, new THREE.MeshStandardMaterial({color: 0xf05a23, emissive: 0xf05a23, emissiveIntensity: 0.4}), 0.01); mark.position.set(0.74, -0.02, 0); rot.add(mark);
  return {g, rot};
}

/* ======================= 4.1 · Variables de la rotación: ventilador de techo ======================= */
const variables = {id: 'variables', tab: '4.1 Variables', kicker: KICK('4.1'), title: 'Las variables de la rotación · el ventilador de techo', specs: 'Aspas de 0.8 m · ω ajustable · θ en radianes', noteTag: 'θ = s / r',
  notes: `<p>Un cuerpo rígido que gira alrededor de un eje fijo se describe con un solo ángulo θ, en <b>radianes</b>: el ángulo cuyo arco mide lo mismo que el radio.</p><div class="eq">θ = s / r · ω = dθ/dt · α = dω/dt · ω = 2π f · T = 2π / ω</div>
    <p>ω y α son vectores sobre el eje de giro (regla de la mano derecha): giro antihorario visto desde abajo → ω apunta hacia abajo, hacia ti.</p><ul><li>Activa «1 radián»: el arco naranja mide lo mismo que el radio.</li><li>Cambia el signo de ω: la flecha del eje se invierte.</li></ul>${legend([[F.w, 'ω (sobre el eje)'], [F.A, 'Arco de 1 rad']])}`,
  build(K) {
    const g = new THREE.Group(), P = {w: 5.24};
    const ceiling = K.box(4, 0.06, 4, K.MAT.std(0xf8f9fa, 0.9)); ceiling.position.y = 2.85; g.add(ceiling);
    const f = fan(K); f.g.position.y = 2.3; g.add(f.g);
    const arcG = new THREE.Group(); f.g.add(arcG);
    const rad = K.mesh(new THREE.TorusGeometry(0.74, 0.012, 8, 60, 1), new THREE.MeshStandardMaterial({color: 0xf05a23, emissive: 0xf05a23, emissiveIntensity: 0.4})); rad.rotation.x = PI / 2; rad.position.y = -0.06; arcG.add(rad);
    const r1 = K.tubeBetween(V3(0, -0.06, 0), V3(0.74, -0.06, 0), 0.008, K.MAT.std(0xf05a23, 0.5)); arcG.add(r1); const r2 = K.tubeBetween(V3(0, -0.06, 0), V3(0.74 * cos(1), -0.06, -0.74 * sin(1)), 0.008, K.MAT.std(0xf05a23, 0.5)); arcG.add(r2);
    const vw = K.vector(F.w, 'ω', {r: 0.02});
    const S = {th: 0, t: 0, stopT: 0};
    const M = {group: g, P, vectors: [vw],
      views: {abajo: {label: 'Desde abajo', t: [0, 2.25, 0], yaw: 0.0001, pitch: -1.15, d: 4.6}, lado: {label: 'Lado', t: [0, 2.2, 0], yaw: 0.4, pitch: 0.05, d: 4.6}},
      overlays: [{key: 'w', label: 'ω', on: true}, {key: 'rad', label: '1 radián'}],
      readouts: [{label: 'θ', get: () => `${N1(S.th, 2)} rad · ${N1(S.th / D, 0)}°`, big: 1}, {label: 'Vueltas', get: () => N1(S.th / TAU, 2)}, {label: 'ω', get: () => `${N1(P.w, 2)} rad/s · ${N1(P.w * 60 / TAU, 0)} rpm`, acc: 1}, {label: 'Frecuencia f', get: () => N1(abs(P.w) / TAU, 3) + ' Hz'}, {label: 'Periodo T', get: () => abs(P.w) > 1e-3 ? N1(TAU / abs(P.w), 2) + ' s' : '∞'}, {label: 'Tiempo', get: () => N1(S.t, 2) + ' s'}],
      chart: {title: 'Ángulo θ(t)', series: [{label: 'θ', color: F.w}], unit: 'rad', span: 8},
      sample: () => [S.t, [S.th]],
      controls: [{type: 'range', key: 'w', label: 'Rapidez angular ω', min: -10, max: 10, step: 0.01, fmt: v => `${v.toFixed(2)} rad/s`}, {type: 'buttons', key: 'b', items: [['θ = 0', () => { S.th = 0; S.t = 0; K.clearChart(); }], ['50 rpm', () => { P.w = 50 * TAU / 60; }], ['Detener', () => { P.w = 0; }]]}, {type: 'note', text: 'ω positiva = antihorario visto desde abajo.'}],
      calls: {lado: [[() => f.g.position.clone().add(V3(0, -0.05, 0)), 'Eje de giro', 'ω vive sobre el eje', 1]], abajo: []},
      reset() { S.th = 0; S.t = 0; S.stopT = 0; },
      update(dt) { if (S.stopT) { dt = min(dt, S.stopT - S.t); if (dt <= 1e-9) { K.running = false; return; } } S.th += P.w * dt; S.t += dt; },
      pose() { f.rot.rotation.y = -S.th; arcG.visible = K.ov('rad'); arcG.rotation.y = -S.th; K.ov('w') && abs(P.w) > 0.01 ? vw.set(V3(0, 2.2, 0), V3(0, -P.w, 0), 0.08, `ω<small>${N1(abs(P.w), 2)} rad/s</small>`) : vw.hide(); },
      problem: {title: 'Ventilador de techo', text: 'Un ventilador de techo gira a 50 rpm (revoluciones por minuto) en sentido antihorario visto desde abajo.', q: '¿Cuánto es ω en rad/s? ¿Cuál es su periodo? ¿Qué ángulo gira en 2 s?',
        steps: ['ω = 50 rev/min × 2π rad/rev × 1 min/60 s ≈ 5.24 rad/s.', 'T = 2π / ω = 60 / 50 = 1.2 s.', 'θ = ω t = 5.24 × 2 ≈ 10.5 rad ≈ 600° ≈ 1.67 vueltas. Pulsa «θ = 0» y lee θ a los 2 s.'], ans: 'ω ≈ 5.24 rad/s; T = 1.2 s; en 2 s gira ≈ 10.5 rad (600°).', load() { P.w = 50 * TAU / 60; M.reset(); }},
      reto: {title: 'Ventilador en alta', text: 'En su velocidad alta, el ventilador gira a 120 rpm.', q: '¿Qué ángulo, en radianes, gira en 3 s?', unit: 'rad', answer: 120 * TAU / 60 * 3, tol: 0.02,
        hint: 'convierte rpm a rad/s (× 2π / 60) y multiplica por t.', steps: ['ω = 120 × 2π / 60 = 4π ≈ 12.57 rad/s.', 'θ = ω t = 12.57 × 3.'], ans: 'θ ≈ 37.7 rad (6 vueltas)',
        setup() { P.w = 2; M.reset(); }, preview: 800, reveal() { P.w = 4 * PI; M.reset(); S.stopT = 3; TD.K.refresh(); }, done: () => S.t >= 3 - 1e-9, measured: () => { S.stopT = 0; return `θ(3 s) = ${N1(S.th, 2)} rad`; }},
      tour: [{at: 0.5, view: 'abajo'}, {at: 5, ov: 'rad', on: true}, {at: 10, key: 'w', to: -4}, {at: 15, view: 'lado'}, {at: 19, key: 'w', to: 5.24}, {at: 22, ov: 'rad', on: false}]
    };
    return M;
  }
};

/* ======================= 4.2 · Aceleración angular constante: la centrífuga ======================= */
const centrifuga = {id: 'alfa-constante', tab: '4.2 α constante', kicker: KICK('4.2'), title: 'Aceleración angular constante · la centrífuga de laboratorio', specs: 'Rotor de 30 cm con 6 tubos · ω₀ y α ajustables', noteTag: 'Lineal ↔ rotacional',
  notes: `<div class="eq">ω = ω₀ + α t · θ = ω₀ t + ½ α t² · ω² = ω₀² + 2 α θ</div><p>Son las mismas ecuaciones del movimiento rectilíneo uniformemente acelerado, cambiando x → θ, v → ω, a → α.</p>
    <ul><li>ω(t) es una recta de pendiente α; θ(t) es una parábola.</li><li>Si α y ω apuntan igual, acelera; si se oponen, frena.</li><li>Con «se detiene al parar», el freno deja de actuar en ω = 0, como en la vida real.</li></ul>${legend([[F.w, 'ω'], [F.a, 'α']])}`,
  build(K) {
    const g = new THREE.Group(), P = {w0: 2, a: 0.5, stop: 1};
    const bench = K.box(1.6, 0.06, 0.9, K.MAT.std(0xe9ecef, 0.6), 0.02); bench.position.y = 0.88; g.add(bench);
    const base = K.box(0.6, 0.3, 0.6, K.MAT.std(0xf8f9fa, 0.35), 0.05); base.position.y = 1.06; g.add(base);
    const bowl = K.cyl(0.26, 0.24, 0.12, K.MAT.std(0xdee2e6, 0.4), 40); bowl.position.y = 1.27; g.add(bowl);
    const rot = new THREE.Group(); rot.position.y = 1.3; g.add(rot);
    rot.add(K.cyl(0.22, 0.22, 0.03, K.MAT.metal(0x868e96, 0.3), 48));
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, tb = K.cyl(0.018, 0.018, 0.14, K.MAT.glass(), 12); tb.position.set(cos(a) * 0.15, 0.04, -sin(a) * 0.15); tb.rotation.set(-sin(a) * 0.4, 0, -cos(a) * 0.4); rot.add(tb); const liq = K.cyl(0.015, 0.015, 0.08, K.MAT.plastic(k % 2 ? 0xe03131 : 0xf59f00, 0.3), 10); liq.position.copy(tb.position); liq.rotation.copy(tb.rotation); rot.add(liq); }
    const mk = K.box(0.06, 0.02, 0.03, new THREE.MeshStandardMaterial({color: 0xf05a23, emissive: 0xf05a23, emissiveIntensity: 0.4})); mk.position.set(0.2, 0.025, 0); rot.add(mk);
    const vw = K.vector(F.w, 'ω', {r: 0.012}), va = K.vector(F.a, 'α', {r: 0.012});
    const S = {th: 0, w: 2, t: 0, stopped: false, stopT: 0};
    const M = {group: g, P, vectors: [vw, va],
      views: {tres: {label: '3/4', t: [0, 1.25, 0], yaw: -0.5, pitch: 0.55, d: 2.5}, arriba: {label: 'Arriba', t: [0, 1.3, 0], yaw: 0, pitch: 1.45, d: 1.9}},
      overlays: [{key: 'v', label: 'Vectores ω y α', on: true}],
      readouts: [{label: 'ω', get: () => N1(S.w, 2) + ' rad/s', big: 1}, {label: 'α', get: () => N1(S.stopped ? 0 : P.a, 2) + ' rad/s²'}, {label: 'θ', get: () => N1(S.th, 2) + ' rad'}, {label: 'Vueltas', get: () => N1(S.th / TAU, 2), acc: 1}, {label: 'Tiempo', get: () => N1(S.t, 2) + ' s'}, {label: 'Comprobación ω² − ω₀² = 2αθ', get: () => `${N1(S.w * S.w - P.w0 * P.w0, 2)} = ${N1(2 * (S.stopped ? 0 : P.a) * S.th, 2)}`}],
      chart: {title: 'ω(t) — recta de pendiente α', series: [{label: 'ω', color: F.w}], unit: 'rad/s', span: 10, xFrom0: true},
      sample: () => [S.t, [S.w]],
      controls: [{type: 'range', key: 'w0', label: 'ω₀', min: -6, max: 6, step: 0.1, fmt: v => v.toFixed(1) + ' rad/s', on: () => M.reset()}, {type: 'range', key: 'a', label: 'α', min: -3, max: 3, step: 0.05, fmt: v => v.toFixed(2) + ' rad/s²'}, {type: 'chips', key: 'stop', label: 'Al llegar a ω = 0', options: [['Se detiene', 1], ['Sigue (α fija)', 0]]}, {type: 'buttons', key: 'b', primary: 1, items: [['Reiniciar', () => M.reset()], ['Apagar (ω₀ = 5, α = −1)', () => { P.w0 = 5; P.a = -1; P.stop = 1; M.reset(); }]]}],
      calls: {tres: [[() => rot.localToWorld(V3(0.15, 0.08, 0)), 'Tubos de muestra', 'Todos con el mismo ω', 1]], arriba: []},
      reset() { S.th = 0; S.w = P.w0; S.t = 0; S.stopped = false; S.stopT = 0; K.clearChart(); },
      update(dt) { if (S.stopT) { dt = min(dt, S.stopT - S.t); if (dt <= 1e-9) { K.running = false; return; } } const n = 20, h = dt / n; for (let i = 0; i < n; i++) { if (S.stopped) break; const w1 = S.w + P.a * h; if (P.stop && S.w !== 0 && Math.sign(w1) !== Math.sign(S.w) && Math.sign(P.a) !== Math.sign(S.w)) { const hh = -S.w / P.a; S.th += S.w * hh + 0.5 * P.a * hh * hh; S.w = 0; S.stopped = true; S.t += hh; break; } S.th += S.w * h + 0.5 * P.a * h * h; S.w = w1; S.t += h; } if (S.stopped) S.t += 0; },
      pose() { rot.rotation.y = -S.th; if (K.ov('v')) { abs(S.w) > 0.02 ? vw.set(V3(0, 1.36, 0), V3(0, S.w, 0), 0.06, `ω<small>${N1(S.w, 2)}</small>`) : vw.hide(); !S.stopped && abs(P.a) > 0.01 ? va.set(V3(0.04, 1.36, 0.04), V3(0, P.a, 0), 0.12, `α<small>${N1(P.a, 2)}</small>`) : va.hide(); } else { vw.hide(); va.hide(); } },
      problem: {title: 'Apagar el ventilador', text: 'Un rotor gira a 5 rad/s. Al apagarlo, la fricción lo frena con aceleración angular constante y se detiene en 5 s.', q: '¿Cuál es α? ¿Cuántas vueltas da antes de detenerse?',
        steps: ['ω = ω₀ + α t ⇒ 0 = 5 + 5α ⇒ α = −1 rad/s².', 'ω² = ω₀² + 2αθ ⇒ θ = ω₀² / (2|α|) = 12.5 rad.', 'Vueltas: 12.5 / 2π ≈ 1.99.'], ans: 'α = −1 rad/s²; da ≈ 2 vueltas (12.5 rad).', load() { P.w0 = 5; P.a = -1; P.stop = 1; M.reset(); }},
      reto: {title: 'Vueltas de una centrífuga', text: 'Un rotor gira a ω₀ = 2 rad/s y empieza a acelerar con α = 0.5 rad/s² constante.', q: '¿Cuántas vueltas completa en los primeros 6 s?', unit: 'vueltas', answer: 21 / TAU, tol: 0.02,
        hint: 'θ = ω₀ t + ½ α t², y luego divide entre 2π.', steps: ['θ = 2 × 6 + ½ × 0.5 × 36 = 12 + 9 = 21 rad.', 'Vueltas = 21 / 2π.'], ans: '≈ 3.34 vueltas',
        setup() { P.w0 = 2; P.a = 0.5; M.reset(); }, preview: 800, reveal() { M.reset(); S.stopT = 6; }, done: () => S.t >= 6 - 1e-9, measured: () => { S.stopT = 0; return `θ(6 s) = ${N1(S.th, 2)} rad = ${N1(S.th / TAU, 3)} vueltas`; }},
      tour: [{at: 0.5, view: 'tres'}, {at: 8, sel: '[data-key="b1"]'}, {at: 17, view: 'arriba'}, {at: 19, sel: '[data-key="stop"] [data-v="0"]'}, {at: 20, sel: '[data-key="b1"]'}, {at: 30, sel: '[data-key="stop"] [data-v="1"]'}]
    };
    return M;
  }
};

/* ======================= 4.3 · Lineales y angulares: el carrusel ======================= */
const carrusel = {id: 'lineal-angular', tab: '4.3 Lineal ↔ angular', kicker: KICK('4.3'), title: 'Variables lineales y angulares · niños en el carrusel', specs: 'Carrusel de 2.2 m de radio · un niño a distancia r ajustable', noteTag: 'v = ω × r',
  notes: `<div class="eq">v = ω × r · a = α × r − ω² r = aₜ + a꜀</div><p>Todos los puntos del disco tienen el mismo ω y α, pero su velocidad lineal depende de la distancia al eje.</p><div class="eq">v = ω r · aₜ = α r · a꜀ = ω² r = v²/r</div>
    <ul><li>Acerca al niño al eje: v y a꜀ bajan en proporción a r.</li><li>Con α ≠ 0 aparece aₜ, tangente; la aceleración total ya no apunta al centro.</li></ul>${legend([[F.w, 'ω'], [F.v, 'v'], [F.ac, 'a centrípeta'], [F.at, 'a tangencial'], [F.A, 'a total']])}`,
  build(K) {
    const g = new THREE.Group(), P = {w0: 1.5, a: 0, r: 2};
    const ground = K.mesh(new THREE.CircleGeometry(6, 64), K.MAT.std(0xc9b99a, 0.95), false); ground.rotation.x = -PI / 2; ground.position.y = 0.005; g.add(ground);
    const rot = new THREE.Group(); rot.position.y = 0.3; g.add(rot);
    const plat = K.cyl(2.2, 2.2, 0.16, K.MAT.plastic(0xf59f00, 0.4), 64); rot.add(plat);
    for (let k = 0; k < 8; k++) { const sec = K.mesh(new THREE.CylinderGeometry(2.21, 2.21, 0.165, 32, 1, false, k * PI / 4, PI / 8), K.MAT.plastic(0xe03131, 0.4)); rot.add(sec); }
    for (let k = 0; k < 4; k++) { const a = k * PI / 2, bar = K.cyl(0.03, 0.03, 0.9, K.MAT.metal(), 8); bar.position.set(cos(a) * 1.4, 0.5, sin(a) * 1.4); rot.add(bar); }
    const hub = K.cyl(0.25, 0.25, 1.2, K.MAT.metal(0xc92a2a, 0.4), 24); hub.position.y = 0.6; rot.add(hub);
    const kid = K.person({shirt: 0x37b24d, pants: 0x1864ab, scale: 0.6}); rot.add(kid.group);
    const vw = K.vector(F.w, 'ω'), vv = K.vector(F.v, 'v'), vac = K.vector(F.ac, 'a꜀'), vat = K.vector(F.at, 'aₜ'), vA = K.vector(F.A, 'a');
    const S = {th: 0, w: 1.5, t: 0, stopT: 0};
    const pos = () => { const a = S.th; return V3(P.r * cos(a), 0.9, -P.r * sin(a)); };
    const M = {group: g, P, vectors: [vw, vv, vac, vat, vA],
      views: {tres: {label: '3/4', t: [0, 0.6, 0], yaw: -0.4, pitch: 0.55, d: 9}, arriba: {label: 'Arriba', t: [0, 0.6, 0], yaw: 0, pitch: 1.5, d: 9.5}},
      overlays: [{key: 'v', label: 'Velocidad', on: true}, {key: 'a', label: 'Aceleraciones', on: true}, {key: 'w', label: 'ω', on: true}],
      readouts: [{label: 'ω', get: () => N1(S.w, 2) + ' rad/s'}, {label: 'Distancia al eje r', get: () => N1(P.r, 2) + ' m'}, {label: 'v = ω r', get: () => N1(S.w * P.r, 2) + ' m/s', big: 1}, {label: 'a꜀ = ω² r', get: () => N1(S.w * S.w * P.r, 2) + ' m/s²'}, {label: 'aₜ = α r', get: () => N1(P.a * P.r, 2) + ' m/s²'}, {label: '|a| total', get: () => N1(hypot(S.w * S.w * P.r, P.a * P.r), 2) + ' m/s²', acc: 1, big: 1}, {label: 'Tiempo', get: () => N1(S.t, 2) + ' s'}],
      controls: [{type: 'range', key: 'r', label: 'Distancia del niño al eje', min: 0.3, max: 2.1, step: 0.01, fmt: v => v.toFixed(2) + ' m'}, {type: 'range', key: 'w0', label: 'ω inicial', min: -3, max: 3, step: 0.05, fmt: v => v.toFixed(2) + ' rad/s', on: () => M.reset()}, {type: 'range', key: 'a', label: 'α (empujón)', min: -1, max: 1, step: 0.05, fmt: v => v.toFixed(2) + ' rad/s²'}, {type: 'buttons', key: 'b', primary: 1, items: [['Reiniciar ω', () => M.reset()]]}],
      calls: {tres: [[() => pos().add(V3(0, 0.4, 0)), 'Niño', 'v y a dependen de r', 1]], arriba: []},
      reset() { S.w = P.w0; S.t = 0; S.stopT = 0; },
      update(dt) { if (S.stopT) { dt = min(dt, S.stopT - S.t); if (dt <= 1e-9) { K.running = false; return; } } S.th += S.w * dt + 0.5 * P.a * dt * dt; S.w += P.a * dt; S.w = max(-4, min(4, S.w)); S.t += dt; },
      pose() { rot.rotation.y = S.th; kid.group.position.set(P.r, 0.08, 0); kid.group.rotation.y = PI / 2; kid.pose({armL: -0.5, armR: -0.5});
        const p = pos(), tang = V3(-sin(S.th), 0, -cos(S.th)), toC = V3(-cos(S.th), 0, sin(S.th));
        K.ov('w') && abs(S.w) > 0.01 ? vw.set(V3(0, 1.5, 0), V3(0, S.w, 0), 0.5, `ω<small>${N1(S.w, 2)} rad/s</small>`) : vw.hide();
        K.ov('v') ? vv.set(p, tang.clone().multiplyScalar(S.w * P.r), 0.35, `v<small>${N1(abs(S.w * P.r), 2)} m/s</small>`) : vv.hide();
        if (K.ov('a')) { const ac = toC.clone().multiplyScalar(S.w * S.w * P.r), at = tang.clone().multiplyScalar(P.a * P.r); vac.set(p.clone().add(V3(0, 0.25, 0)), ac, 0.2, `a꜀<small>${N1(ac.length(), 2)}</small>`); at.length() > 0.01 ? vat.set(p.clone().add(V3(0, 0.25, 0)), at, 0.2, `aₜ<small>${N1(at.length(), 2)}</small>`) : vat.hide(); at.length() > 0.01 ? vA.set(p.clone().add(V3(0, 0.27, 0)), ac.clone().add(at), 0.2, `a<small>${N1(ac.clone().add(at).length(), 2)}</small>`) : vA.hide(); } else [vac, vat, vA].forEach(v => v.hide()); },
      problem: {title: 'Niños en un carrusel', text: 'Un carrusel de 2 m de radio gira a 1.5 rad/s constantes. Un niño va en la orilla (r = 2 m) y otro a la mitad (r = 1 m).', q: '¿Qué rapidez y qué aceleración tiene cada niño? ¿Hacia dónde apunta la aceleración?',
        steps: ['Ambos tienen el mismo ω = 1.5 rad/s.', 'v = ω r: orilla 3 m/s; mitad 1.5 m/s.', 'α = 0 ⇒ solo hay a꜀ = ω² r: orilla 4.5 m/s²; mitad 2.25 m/s², ambas hacia el centro.', 'Mueve al niño de r = 2 m a r = 1 m y compara.'], ans: 'Orilla: 3 m/s y 4.5 m/s². Mitad: 1.5 m/s y 2.25 m/s². La aceleración apunta al eje.', load() { P.w0 = 1.5; P.a = 0; P.r = 2; M.reset(); }},
      reto: {title: 'El niño en la orilla', text: 'El carrusel gira a ω₀ = 1 rad/s y lo empujan con α = 0.5 rad/s². Un niño va a 2 m del eje.', q: '¿Cuál es la magnitud de la aceleración del niño a los 2 s?', unit: 'm/s²', answer: hypot(8, 1), tol: 0.02,
        hint: 'a los 2 s, ω = ω₀ + α t; combina a꜀ = ω² r con aₜ = α r (perpendiculares).', steps: ['ω(2 s) = 1 + 0.5 × 2 = 2 rad/s.', 'a꜀ = ω² r = 8 m/s²; aₜ = α r = 1 m/s².', '|a| = √(8² + 1²).'], ans: '|a| ≈ 8.06 m/s²',
        setup() { P.w0 = 1; P.a = 0; P.r = 2; M.reset(); }, preview: 800, reveal() { P.a = 0.5; M.reset(); S.stopT = 2; TD.K.refresh(); }, done: () => S.t >= 2 - 1e-9, measured: () => { S.stopT = 0; return `a los 2 s: ω = ${N1(S.w, 2)} rad/s, |a| = ${N1(hypot(S.w * S.w * P.r, P.a * P.r), 3)} m/s²`; }},
      tour: [{at: 0.5, view: 'tres'}, {at: 6, key: 'r', to: 1}, {at: 11, key: 'r', to: 2}, {at: 14, key: 'a', to: 0.5}, {at: 19, view: 'arriba'}, {at: 23, key: 'a', to: 0}, {at: 24, sel: '[data-key="b0"]'}]
    };
    return M;
  }
};

TD.start({machines: [variables, centrifuga, carrusel]});
})();
