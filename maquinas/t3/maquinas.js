/* Tema 3 · Colisiones y sistemas de partículas — seven teardown machines. */
(() => {
const {PI, sin, cos, tan, abs, sqrt, min, max, atan, atan2, asin, hypot, log, exp} = Math, D = PI / 180, g0 = 9.8;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const F = {W: '#16181b', T: '#3d8fe0', N: '#7048e8', f: '#2f9e44', S: '#f05a23', v: '#0ca678', p1: '#3d8fe0', p2: '#7048e8', P: '#f05a23'};
const legend = items => `<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin:8px 0 2px;font-size:10.5px;font-weight:600">${items.map(([c, t]) => `<span><i style="display:inline-block;width:12px;height:3px;background:${c};vertical-align:middle;margin-right:4px"></i>${t}</span>`).join('')}</div>`;
const N1 = (v, d = 1) => TD.K.fx(v, d);
const KICK = n => `Teardown · Tema 3 · Colisiones · ${n}`;
const zeta = e => e >= 1 ? 0 : e <= 0 ? 1 : -log(e) / sqrt(PI * PI + log(e) ** 2);   // damping ratio that gives restitution e

function carModel(K, color) {
  const g = new THREE.Group(); const body = K.box(4.2, 0.62, 1.75, K.MAT.plastic(color, 0.25), 0.2); body.position.y = 0.6; g.add(body);
  const cab = K.box(2.2, 0.55, 1.6, K.MAT.glass(), 0.18); cab.position.set(-0.25, 1.15, 0); g.add(cab); const roof = K.box(1.9, 0.08, 1.5, K.MAT.plastic(color, 0.25), 0.04); roof.position.set(-0.3, 1.44, 0); g.add(roof);
  g.userData.w = []; [[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]].forEach(([x, z]) => { const w = K.cyl(0.33, 0.33, 0.24, K.MAT.rubber(), 24); w.rotation.x = PI / 2; w.position.set(x, 0.33, z); g.add(w); g.userData.w.push(w); });
  return g;
}

/* ======================= 3.1 · Impulso: se te cae el celular ======================= */
const impulso = {id: 'impulso', tab: '3.1 Impulso', kicker: KICK('3.1'), title: 'Impulso · se te cae el celular', specs: 'Celular de 0.2 kg · llega a 6 m/s · piso duro, alfombra o cojín', noteTag: 'J = ∫F dt = Δp',
  notes: `<p>Durante un choque la fuerza es grande y breve. Su efecto total es el <b>impulso</b>: el área bajo F(t), igual al cambio de ímpetu.</p><div class="eq">J = ∫ F dt = Δp = m v_f − m v_i · F_prom = J / Δt</div>
    <p>Para el mismo Δp, si el choque dura más, la fuerza máxima es menor: así funcionan las fundas, los cascos y las bolsas de aire.</p><ul><li>Suelta el celular sobre el piso duro y luego sobre el cojín: el área bajo F(t) es la misma; el pico, muy distinto.</li><li>El contacto dura milisegundos: la escena entra en cámara lenta durante el choque.</li></ul>${legend([[F.N, 'Fuerza del suelo'], [F.W, 'Peso'], [F.v, 'Velocidad']])}`,
  build(K) {
    const g = new THREE.Group(), P = {surf: 'duro', m: 0.2, v: 6, e: 0.3};
    const SURF = {duro: [50000, 0xd9d4cc, 'Piso duro'], media: [5000, 0x868e96, 'Alfombra'], cojin: [605, 0xf59f00, 'Cojín']};
    const slab = K.box(1.6, 0.1, 1.2, K.MAT.std(0xd9d4cc, 0.6), 0.02); slab.position.y = -0.05; g.add(slab);
    const cush = K.box(1.0, 0.16, 0.8, K.MAT.std(0xf59f00, 0.95), 0.06); g.add(cush);
    const phone = new THREE.Group(); const body = K.box(0.075, 0.155, 0.009, K.MAT.std(0x212529, 0.3, 0.3), 0.008); phone.add(body); const scr = K.mesh(new THREE.PlaneGeometry(0.066, 0.142), new THREE.MeshStandardMaterial({color: 0x1c7ed6, emissive: 0x1864ab, emissiveIntensity: 0.4, roughness: 0.2})); scr.position.z = 0.0051; phone.add(scr); g.add(phone);
    const vN = K.vector(F.N, 'F suelo', {r: 0.004}), vW = K.vector(F.W, 'W', {r: 0.004}), vV = K.vector(F.v, 'v', {r: 0.004});
    const S = {y: 0.5, vy: 0, t: 0, Fc: 0, J: 0, Fmax: 0, tc: 0, inC: false, done: false, vimp: 0, vout: 0, slow: 1, ct: 0};
    const k = () => SURF[P.surf][0], top = () => P.surf === 'cojin' ? 0.16 : 0, half = 0.0775;
    const M = {group: g, P, vectors: [vN, vW, vV],
      views: {lado: {label: 'Lado', t: [0, 0.2, 0], yaw: 0.25, pitch: 0.08, d: 1.15}, lejos: {label: 'Caída', t: [0, 0.4, 0], yaw: 0.3, pitch: 0.1, d: 2.2}},
      overlays: [{key: 'f', label: 'Fuerzas', on: true}, {key: 'v', label: 'Velocidad', on: true}],
      readouts: [{label: 'Superficie', get: () => SURF[P.surf][2]}, {label: 'Rapidez al llegar', get: () => N1(S.vimp, 2) + ' m/s'}, {label: 'Fuerza máxima', get: () => N1(S.Fmax, 0) + ' N', big: 1, acc: 1}, {label: 'Duración del contacto', get: () => N1(S.tc * 1000, 1) + ' ms'}, {label: 'Impulso J = ∫F dt', get: () => N1(S.J, 3) + ' N·s', big: 1}, {label: 'Δp = m (v_f − v_i)', get: () => S.done ? N1(P.m * (S.vout + S.vimp), 3) + ' N·s' : '—'}, {label: 'Cámara', get: () => S.slow < 1 ? `lenta ×${Math.round(1 / S.slow)}` : 'normal'}],
      chart: {title: 'Fuerza del suelo durante el contacto F(t)', xy: true, xr: () => [0, max(0.01, S.tcAll || 0.02) * 1.1 * 1000], yr: () => [0, max(10, S.FmaxAll || 10) * 1.1], series: [{label: 'F(t)', color: F.N}], unit: 'N', xLabel: 't (ms)'},
      sample: () => S.inC ? [S.ct * 1000, [S.Fc]] : null,
      controls: [{type: 'chips', key: 'surf', label: 'Superficie', options: [['Piso duro', 'duro'], ['Alfombra', 'media'], ['Cojín', 'cojin']], on: () => M.reset()}, {type: 'range', key: 'm', label: 'Masa', min: 0.05, max: 1, step: 0.01, fmt: v => v.toFixed(2) + ' kg'}, {type: 'range', key: 'v', label: 'Rapidez al llegar', min: 1, max: 10, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'}, {type: 'range', key: 'e', label: 'Restitución e', min: 0, max: 1, step: 0.01, fmt: v => v.toFixed(2)},
        {type: 'buttons', key: 'c', primary: 1, items: [['Soltar', () => M.reset()]]}],
      calls: {lado: [[() => phone.position, 'Celular · 0.2 kg', 'Mismo Δp en cualquier suelo', 1]], lejos: []},
      reset() { const h = 0.35; S.y = top() + half + h; S.vy = -sqrt(max(0, P.v * P.v - 2 * g0 * h)); S.t = 0; S.J = 0; S.Fmax = 0; S.tc = 0; S.inC = false; S.done = false; S.vimp = 0; S.ct = 0; K.clearChart(); S.FmaxAll = P.v * sqrt(P.m * k()) * 1.05; S.tcAll = PI * sqrt(P.m / k()) * 1.2; cush.visible = P.surf === 'cojin'; slab.material.color.setHex(SURF[P.surf][1]); },
      update(dt) {
        const pen = top() + half - S.y; S.slow = (pen > -0.02 && !S.done) ? (P.surf === 'duro' ? 0.004 : P.surf === 'media' ? 0.015 : 0.06) : 1;
        const h0 = dt * S.slow, n = 40, h = h0 / n;
        for (let i = 0; i < n; i++) {
          const d = top() + half - S.y; let Fc = 0;
          if (d > 0 && !S.done) { if (!S.inC) { S.inC = true; S.vimp = -S.vy; S.ct = 0; S.dmax = 0; S.unl = false; }
            if (!S.unl && S.vy < 0) { S.dmax = max(S.dmax, d); Fc = k() * d; } else { S.unl = true; const d0 = S.dmax * (1 - P.e * P.e); Fc = d > d0 ? k() * S.dmax * (d - d0) / max(1e-9, S.dmax - d0) : 0; if (d <= d0 + 1e-12 || (P.e === 0)) { S.inC = false; S.done = true; S.vout = max(0, S.vy); if (P.e === 0) { S.vy = 0; } } } }
          else if (S.inC) { S.inC = false; S.done = true; S.vout = S.vy; }
          S.Fc = Fc; const a = Fc / P.m - g0; S.vy += a * h; S.y += S.vy * h; S.t += h;
          if (S.inC) { S.J += Fc * h; S.tc += h; S.ct += h; S.Fmax = max(S.Fmax, Fc); }
        }
        if (S.done && S.y < top() + half) { S.y = top() + half; if (S.vy < 0) S.vy = 0; }
      },
      pose() { phone.position.set(0, S.y, 0); phone.rotation.set(0, 0.4, 0); const d = max(0, top() + half - S.y); cush.scale.y = P.surf === 'cojin' ? max(0.4, 1 - d / 0.16) : 1; cush.position.y = P.surf === 'cojin' ? 0.08 * cush.scale.y : 0;
        const o = V3(0.09, S.y, 0.05), sc = min(0.0012, 0.3 / max(S.FmaxAll || 1, 1));
        if (K.ov('f')) { S.Fc > 0.01 ? vN.set(o.clone().add(V3(0, -half, 0)), V3(0, S.Fc, 0), sc, `F suelo<small>${N1(S.Fc, 0)} N</small>`) : vN.hide(); vW.set(o.clone().add(V3(0.04, 0, 0)), V3(0, -P.m * g0, 0), 0.05); } else { vN.hide(); vW.hide(); }
        K.ov('v') && abs(S.vy) > 0.05 ? vV.set(V3(-0.09, S.y, 0.05), V3(0, S.vy, 0), 0.04, `v<small>${N1(abs(S.vy), 2)} m/s</small>`) : vV.hide(); },
      problem: {title: 'Se te cae el celular', text: 'Un celular de 0.2 kg cae y llega al suelo a 6 m/s (≈ 1.8 m de altura). Rebota con e = 0.3. Compara un piso duro con un cojín blando.', q: '¿Qué impulso recibe en cada caso? ¿Por qué el cojín lo salva?',
        steps: ['Δp = m (v_f − vᵢ) con v_f = e·6 = 1.8 m/s de rebote: |Δp| = 0.2 × (6 + 1.8) = 1.56 N·s.', 'El impulso J = ∫F dt = Δp es igual en el piso y en el cojín (mismas m, v, e).', 'Pero el cojín alarga el contacto unas 9 veces, así que la fuerza máxima baja otro tanto (≈ 600 N contra ≈ 66 N).', 'Suelta en «Piso duro», luego en «Cojín» y compara la fuerza máxima y el impulso.'], ans: 'J ≈ 1.56 N·s en ambos casos; con el cojín la fuerza pico es ≈ 9 veces menor.', load() { P.surf = 'duro'; P.m = 0.2; P.v = 6; P.e = 0.3; M.reset(); }},
      reto: {title: 'El rebote de la pelota', text: 'Una pelota de 0.5 kg llega al piso a 8 m/s y rebota con e = 0.5.', q: '¿Qué impulso le da el piso?', unit: 'N·s', answer: 0.5 * (8 + 4), tol: 0.03,
        hint: 'J = Δp = m (v_f − v_i), con v_f hacia arriba y v_i hacia abajo.', steps: ['Rebota a e·8 = 4 m/s hacia arriba.', 'J = 0.5 × (4 − (−8)) = 0.5 × 12.'], ans: 'J = 6 N·s',
        setup() { P.surf = 'duro'; P.m = 0.5; P.v = 8; P.e = 0.5; M.reset(); }, preview: 300, reveal() { M.reset(); }, done: () => S.done, measured: () => `J = ${N1(S.J, 2)} N·s (rebota a ${N1(S.vout, 2)} m/s)`},
      tour: [{at: 0.5, view: 'lejos'}, {at: 3, view: 'lado'}, {at: 9, sel: '[data-key="surf"] [data-v="cojin"]'}, {at: 18, sel: '[data-key="surf"] [data-v="media"]'}, {at: 26, sel: '[data-key="surf"] [data-v="duro"]'}]
    };
    return M;
  }
};

/* ======================= 3.2 · Conservación del ímpetu: molécula que vibra ======================= */
const molecula = {id: 'conservacion-p', tab: '3.2 Conservación de p', kicker: KICK('3.2'), title: 'Conservación del ímpetu · una molécula que vibra mientras viaja', specs: 'Tres átomos de 1, 2 y 3 kg (modelo) · enlaces como resortes', noteTag: 'ΣF_ext = 0 ⇒ P = cte',
  notes: `<div class="eq">P = Σ mᵢ vᵢ = M v_cm · dP/dt = Σ F_ext</div><p>Si la fuerza externa neta es cero, P se conserva, sin importar lo complicadas que sean las fuerzas internas (aquí, resortes entre los átomos).</p>
    <ul><li>Sacude la molécula: cada pᵢ cambia sin parar, pero P total no.</li><li>El centro de masa viaja en línea recta a velocidad constante.</li><li>Una fuerza externa cambia P: ΔP = F Δt.</li></ul>${legend([[F.p1, 'pᵢ de cada átomo'], [F.P, 'P total'], [F.T, 'Fuerza externa']])}`,
  build(K) {
    const g = new THREE.Group(), P = {vd: 0.75, Fe: 0};
    const grid = K.mesh(new THREE.PlaneGeometry(60, 20, 60, 20), new THREE.MeshBasicMaterial({color: 0xc9ccd0, wireframe: true, transparent: true, opacity: 0.35})); grid.rotation.x = -PI / 2; grid.position.set(20, 0.001, 0); g.add(grid);
    const ms = [1, 2, 3], cols = [0xe03131, 0x1c7ed6, 0xf59f00];
    const at = ms.map((m, i) => { const s = K.sph(0.12 * Math.cbrt(m), K.MAT.std(cols[i], 0.3, 0.1), 24); g.add(s); return s; });
    const bonds = [[0, 1], [1, 2], [0, 2]].map(() => { const b = K.tubeBetween(V3(), V3(1, 0, 0), 0.018, K.MAT.std(0xadb5bd, 0.5)); g.add(b); return b; });
    const vp = ms.map((_, i) => K.vector('#' + cols[i].toString(16).padStart(6, '0'), `p${i + 1}`, {r: 0.012})), vP = K.vector(F.P, 'P'), vF = K.vector(F.T, 'F ext');
    const cmBall = K.sph(0.05, K.MAT.std(0x16181b), 12); g.add(cmBall);
    const L0 = [[0, 1, 0.7], [1, 2, 0.8], [0, 2, 0.9]], kk = 40;
    const S = {x: [], v: [], t: 0, trail: []};
    const M = {group: g, P, vectors: [...vp, vP, vF],
      views: {arriba: {label: 'Arriba', t: [0, 0, 0], yaw: 0, pitch: 1.35, d: 7}, tres: {label: '3/4', t: [0, 0.2, 0], yaw: -0.5, pitch: 0.6, d: 6}},
      follow: () => cm(),
      overlays: [{key: 'p', label: 'Ímpetus', on: true}],
      readouts: [{label: 'Masa total', get: () => '6 kg'}, {label: 'Pₓ', get: () => N1(Pt().x, 2) + ' kg·m/s'}, {label: 'P_y (lateral)', get: () => N1(-Pt().z, 2) + ' kg·m/s'}, {label: '|P|', get: () => N1(Pt().length(), 2) + ' kg·m/s', big: 1, acc: 1}, {label: 'v_cm = P / M', get: () => N1(Pt().length() / 6, 3) + ' m/s'}, {label: 'Fuerza externa', get: () => N1(P.Fe, 1) + ' N'}],
      chart: {title: 'Ímpetu: un átomo contra el total', series: [{label: 'p₁ₓ', color: '#e03131', w: 1}, {label: 'Pₓ total', color: F.P, w: 2.2}, {label: 'P_y total', color: F.T, w: 2.2}], unit: 'kg·m/s', span: 8},
      sample: () => [S.t, [ms[0] * S.v[0].x, Pt().x, -Pt().z]],
      controls: [{type: 'range', key: 'vd', label: 'Velocidad de deriva del CM', min: 0, max: 2, step: 0.05, fmt: v => v.toFixed(2) + ' m/s', on: () => M.reset()}, {type: 'range', key: 'Fe', label: 'Fuerza externa sobre m₁ (lateral)', min: 0, max: 6, step: 0.1, fmt: v => v.toFixed(1) + ' N'},
        {type: 'buttons', key: 'c', primary: 1, items: [['Sacudir (fuerzas internas)', () => shake()], ['Reiniciar', () => M.reset()]]}],
      calls: {tres: [[() => cm(), 'Centro de masa', 'Sigue en línea recta', 1]], arriba: []},
      reset() { S.feUntil = 0; S.x = [V3(-0.4, 0.3, 0.2), V3(0.3, 0.3, 0.25), V3(0, 0.3, -0.45)]; const c = cm(); S.x.forEach(p => p.sub(c).add(V3(0, 0.3, 0))); S.v = ms.map(() => V3(P.vd, 0, 0)); S.t = 0; P.Fe = 0; shake(); },
      update(dt) { const n = 40, h = dt / n; for (let i = 0; i < n; i++) { if (S.feUntil && S.t + i * h >= S.feUntil) { P.Fe = 0; S.feUntil = 0; } const Fa = ms.map(() => V3()); L0.forEach(([a, b, L]) => { const d = S.x[b].clone().sub(S.x[a]), l = d.length(), f = d.multiplyScalar(kk * (l - L) / l); Fa[a].add(f); Fa[b].sub(f); }); Fa[0].add(V3(0, 0, -P.Fe)); ms.forEach((m, j) => { S.v[j].addScaledVector(Fa[j], h / m); S.x[j].addScaledVector(S.v[j], h); S.x[j].y = 0.3; S.v[j].y = 0; }); } S.t += dt; },
      pose() { at.forEach((a, i) => a.position.copy(S.x[i])); [[0, 1], [1, 2], [0, 2]].forEach(([a, b], i) => bonds[i].userData.set(S.x[a], S.x[b])); cmBall.position.copy(cm());
        if (K.ov('p')) { ms.forEach((m, i) => vp[i].set(S.x[i].clone().add(V3(0, 0.15, 0)), S.v[i].clone().multiplyScalar(m), 0.25, `p${i + 1}<small>${N1(S.v[i].length() * m, 2)}</small>`)); vP.set(cm().add(V3(0, 0.25, 0)), Pt(), 0.25, `P<small>${N1(Pt().length(), 2)} kg·m/s</small>`); } else { vp.forEach(v => v.hide()); vP.hide(); }
        P.Fe > 0 ? vF.set(S.x[0].clone().add(V3(0, 0.2, 0)), V3(0, 0, -P.Fe), 0.12) : vF.hide(); },
      problem: {title: 'Una molécula que vibra mientras viaja', text: 'Una molécula triatómica (masas 1 : 2 : 3) viaja por un gas y sus enlaces la hacen vibrar sin parar. Su ímpetu total es P = 4.5 kg·m/s en el modelo.', q: '¿Cambia el ímpetu total por las vibraciones? ¿Cuánto cambia si actúa una fuerza externa de 4 N durante 2 s?',
        steps: ['Los enlaces son fuerzas internas (pares acción–reacción): Σ F_int = 0 ⇒ P no cambia, aunque cada pᵢ sí.', 'v_cm = P / M = 4.5 / 6 = 0.75 m/s, en línea recta.', 'Con fuerza externa: ΔP = F Δt = 4 × 2 = 8 kg·m/s en la dirección de la fuerza.', 'Pruébalo: sube la fuerza externa a 4 N unos 2 s y mira P_y.'], ans: 'Las vibraciones no cambian P. La fuerza externa aumenta P_y en 8 kg·m/s.', load() { P.vd = 0.75; M.reset(); }},
      reto: {title: 'Un empujón de costado', text: 'La molécula (6 kg en total) viaja con P = 4.5 kg·m/s. Durante 2 s, una fuerza externa de 3 N actúa de lado (perpendicular a P) sobre un átomo.', q: '¿Cuánto vale |P| al terminar el empujón?', unit: 'kg·m/s', answer: hypot(4.5, 6), tol: 0.02,
        hint: 'ΔP = F Δt en la dirección de la fuerza; luego suma como vectores.', steps: ['ΔP = 3 N × 2 s = 6 kg·m/s de lado.', '|P| = √(4.5² + 6²).'], ans: '|P| = 7.5 kg·m/s',
        setup() { P.vd = 0.75; M.reset(); }, preview: 1200, reveal() { this.t0 = S.t; S.feUntil = S.t + 2; P.Fe = 3; TD.K.refresh(); }, done() { return !S.feUntil && P.Fe === 0 && S.t - this.t0 >= 2; }, measured: () => `|P| = ${N1(Pt().length(), 2)} kg·m/s`},
      tour: [{at: 0.5, view: 'tres'}, {at: 6, sel: '[data-key="c0"]'}, {at: 12, view: 'arriba'}, {at: 14, key: 'Fe', to: 4}, {at: 17, key: 'Fe', to: 0}]
    };
    const cm = () => { const c = V3(); ms.forEach((m, i) => c.addScaledVector(S.x[i], m)); return c.multiplyScalar(1 / 6); };
    const Pt = () => { const p = V3(); ms.forEach((m, i) => p.addScaledVector(S.v[i], m)); return p; };
    function shake() { const kick = [V3(0.6, 0, 0.8), V3(-0.5, 0, -0.2), V3(0, 0, -0.4)]; const pk = V3(); kick.forEach((k, i) => pk.addScaledVector(k, ms[i])); kick.forEach((k, i) => { k.addScaledVector(pk, -1 / 6); S.v[i].add(k); }); }
    return M;
  }
};

/* ======================= 3.3 · Choques en 1D: dos autos ======================= */
const choque1d = {id: 'choques-1d', tab: '3.3 Choques 1D', kicker: KICK('3.3'), title: 'Choques en una dimensión · dos autos en el semáforo', specs: 'Auto rojo 1500 kg a 3 m/s · auto azul 1000 kg detenido · e ajustable', noteTag: 'p se conserva siempre',
  notes: `<div class="eq">m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′ · e = −(v₁′ − v₂′)/(v₁ − v₂)</div><p>En un choque las fuerzas internas dominan: el ímpetu total se conserva siempre. La energía cinética solo se conserva si el choque es elástico.</p>
    <ul><li>e = 1: elástico. 0 &lt; e &lt; 1: inelástico. e = 0: salen juntos.</li><li>Ligero contra pesado en reposo, elástico: el ligero rebota.</li><li>Pesado contra ligero: el ligero sale disparado más rápido que el pesado.</li></ul>${legend([[F.p1, 'p auto rojo'], [F.p2, 'p auto azul'], [F.S, 'Fuerza de contacto']])}`,
  build(K) {
    const g = new THREE.Group(), P = {m1: 1500, m2: 1000, v1: 3, v2: 0, e: 0};
    const road = K.mesh(new THREE.PlaneGeometry(80, 7), K.MAT.std(0x3b3d42, 0.9), false); road.rotation.x = -PI / 2; road.position.set(0, 0.01, 0); g.add(road);
    for (let x = -40; x < 40; x += 6) { const d = K.box(3, 0.005, 0.12, K.MAT.std(0xf1f3f5)); d.position.set(x, 0.015, -1.7); g.add(d); }
    const c1 = carModel(K, 0xe03131), c2 = carModel(K, 0x1c7ed6); g.add(c1, c2);
    const v1v = K.vector(F.p1, 'p₁'), v2v = K.vector(F.p2, 'p₂'), fv1 = K.vector(F.S, 'F₁₂'), fv2 = K.vector(F.S, 'F₂₁');
    const S = {x1: -7, x2: 0, u1: 0, u2: 0, t: 0, Fc: 0, hit: false, after: false, K0: 0, Kf: null};
    const kc = 6e5, gap = 4.2;
    const M = {group: g, P, vectors: [v1v, v2v, fv1, fv2],
      views: {lado: {label: 'Lado', t: [-2, 1, 0], yaw: 0.1, pitch: 0.12, d: 15}, tres: {label: '3/4', t: [-2, 0.8, 0], yaw: -0.7, pitch: 0.3, d: 14}},
      follow: () => V3((S.x1 + S.x2) / 2 * 0.6, 0, 0),
      overlays: [{key: 'p', label: 'Ímpetus', on: true}, {key: 'f', label: 'Fuerza de choque', on: true}],
      readouts: [{label: 'v₁ · v₂', get: () => `${N1(S.u1, 2)} · ${N1(S.u2, 2)} m/s`, big: 1}, {label: 'p₁ · p₂', get: () => `${N1(P.m1 * S.u1, 0)} · ${N1(P.m2 * S.u2, 0)}`}, {label: 'P total', get: () => N1(P.m1 * S.u1 + P.m2 * S.u2, 0) + ' kg·m/s', acc: 1}, {label: 'K antes', get: () => N1(S.K0 / 1000, 2) + ' kJ'}, {label: 'K ahora', get: () => N1((0.5 * P.m1 * S.u1 ** 2 + 0.5 * P.m2 * S.u2 ** 2) / 1000, 2) + ' kJ'}, {label: 'Energía perdida', get: () => S.after ? N1(100 * (1 - (0.5 * P.m1 * S.u1 ** 2 + 0.5 * P.m2 * S.u2 ** 2) / S.K0), 1) + ' %' : '—'}],
      chart: {title: 'Ímpetus durante el choque', series: [{label: 'p₁', color: F.p1}, {label: 'p₂', color: F.p2}, {label: 'P total', color: F.P, w: 2.2}], unit: 'kg·m/s', span: 6},
      sample: () => [S.t, [P.m1 * S.u1, P.m2 * S.u2, P.m1 * S.u1 + P.m2 * S.u2]],
      controls: [{type: 'range', key: 'm1', label: 'Masa auto rojo', min: 500, max: 4000, step: 50, fmt: v => v + ' kg'}, {type: 'range', key: 'm2', label: 'Masa auto azul', min: 500, max: 4000, step: 50, fmt: v => v + ' kg'}, {type: 'range', key: 'v1', label: 'v₁ inicial', min: 0, max: 6, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'}, {type: 'range', key: 'v2', label: 'v₂ inicial', min: -4, max: 4, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'}, {type: 'range', key: 'e', label: 'Restitución e', min: 0, max: 1, step: 0.01, fmt: v => v.toFixed(2)},
        {type: 'buttons', key: 'c', primary: 1, items: [['Chocar', () => M.reset()], ['Elástico iguales', () => { Object.assign(P, {m1: 1000, m2: 1000, v1: 3, v2: 0, e: 1}); M.reset(); }], ['Ligero vs pesado', () => { Object.assign(P, {m1: 1000, m2: 3000, v1: 3, v2: 0, e: 1}); M.reset(); }]]}],
      calls: {tres: [[() => c1.localToWorld(V3(2.1, 0.7, 0)), 'Defensas', 'Aquí actúan F₁₂ y F₂₁', 1]], lado: []},
      reset() { S.x1 = -7; S.x2 = 0; S.u1 = P.v1; S.u2 = P.v2; S.t = 0; S.hit = false; S.after = false; S.K0 = 0.5 * P.m1 * P.v1 ** 2 + 0.5 * P.m2 * P.v2 ** 2; },
      update(dt) { const n = 200, h = dt / n; for (let i = 0; i < n; i++) { const d = S.x1 + gap - S.x2; let Fc = 0; if (d > 0) { S.hit = true; const mr = P.m1 * P.m2 / (P.m1 + P.m2), c = 2 * zeta(P.e) * sqrt(mr * kc); Fc = max(0, kc * d + c * (S.u1 - S.u2)); if (P.e === 0 && S.u1 - S.u2 < 1e-3) { const vc = (P.m1 * S.u1 + P.m2 * S.u2) / (P.m1 + P.m2); S.u1 = S.u2 = vc; Fc = 0; S.after = true; } } else if (S.hit) S.after = true; S.Fc = Fc; S.u1 -= Fc / P.m1 * h; S.u2 += Fc / P.m2 * h; S.x1 += S.u1 * h; S.x2 += S.u2 * h; } S.t += dt; if (S.x2 > 30 || S.x1 < -30) { S.u1 *= 0.98; S.u2 *= 0.98; } },
      pose() { c1.position.set(S.x1, 0, 0); c2.position.set(S.x2, 0, 0); c1.userData.w.forEach(w => w.rotation.y += S.u1 * 0.016 / 0.33); c2.userData.w.forEach(w => w.rotation.y += S.u2 * 0.016 / 0.33);
        if (K.ov('p')) { abs(S.u1) > 0.01 ? v1v.set(V3(S.x1, 2.0, 0), V3(P.m1 * S.u1, 0, 0), 0.0006) : v1v.hide(); abs(S.u2) > 0.01 ? v2v.set(V3(S.x2, 2.4, 0), V3(P.m2 * S.u2, 0, 0), 0.0006) : v2v.hide(); } else { v1v.hide(); v2v.hide(); }
        if (K.ov('f') && S.Fc > 1) { const sc = 2 / 1.5e5; fv1.set(V3(S.x1 + 2.1, 0.8, 1.0), V3(-S.Fc, 0, 0), sc, `F₁₂<small>${N1(S.Fc / 1000, 0)} kN</small>`); fv2.set(V3(S.x2 - 2.1, 0.8, 1.0), V3(S.Fc, 0, 0), sc, `F₂₁<small>${N1(S.Fc / 1000, 0)} kN</small>`); } else { fv1.hide(); fv2.hide(); } },
      problem: {title: 'Choque por alcance en un semáforo', text: 'Un auto de 1500 kg a 3 m/s (≈ 11 km/h) choca por detrás a uno de 1000 kg detenido. Las defensas se traban y quedan unidos (e = 0).', q: '¿Con qué velocidad se mueven juntos? ¿Qué porcentaje de la energía cinética se pierde?',
        steps: ['Conservación del ímpetu: 1500 × 3 + 0 = (1500 + 1000) v′ ⇒ v′ = 4500 / 2500.', 'Kᵢ = ½ × 1500 × 3² = 6750 J; K_f = ½ × 2500 × 1.8² = 4050 J.', 'Pérdida: 2700 J de 6750 J (deformación, calor y sonido).'], ans: 'v′ = 1.8 m/s; se pierde el 40 % de la energía cinética.', load() { Object.assign(P, {m1: 1500, m2: 1000, v1: 3, v2: 0, e: 0}); M.reset(); }},
      reto: {title: 'Ligero contra pesado', text: 'Un auto de 1000 kg a 3 m/s choca elásticamente (e = 1) con una camioneta de 3000 kg detenida.', q: '¿Cuál es la velocidad final del auto ligero? (con signo: + adelante, − hacia atrás)', unit: 'm/s', answer: -1.5, tol: 0.03, abs: 0.05,
        hint: 'conserva el ímpetu y usa v₂′ − v₁′ = v₁ − v₂ (elástico).', steps: ['Ímpetu: 1000·3 = 1000 v₁′ + 3000 v₂′. Elástico: v₂′ − v₁′ = 3.', 'v₂′ = 1.5 m/s y v₁′ = −1.5 m/s: el ligero rebota.'], ans: 'v₁′ = −1.5 m/s',
        setup() { Object.assign(P, {m1: 1000, m2: 3000, v1: 3, v2: 0, e: 1}); M.reset(); S.u1 = 0; }, preview: 400, reveal() { M.reset(); }, done: () => S.after && S.u1 < 0, measured: () => `v₁′ = ${N1(S.u1, 2)} m/s, v₂′ = ${N1(S.u2, 2)} m/s`},
      tour: [{at: 0.5, view: 'tres'}, {at: 7, view: 'lado'}, {at: 9, sel: '[data-key="c1"]'}, {at: 17, sel: '[data-key="c2"]'}, {at: 25, sel: '[data-key="c0"]'}]
    };
    return M;
  }
};

/* ======================= 3.3 · Choques en 2D: tiro de billar ======================= */
const billar = {id: 'choques-2d', tab: '3.3 Choques 2D', kicker: KICK('3.3'), title: 'Choques en dos dimensiones · el tiro de billar', specs: 'Bolas de 170 g · la blanca a 2 m/s golpea de lado a la bola 8', noteTag: 'p se conserva por componentes',
  notes: `<div class="eq">p₁ + p₂ = p₁′ + p₂′ (en x y en y)</div><p>El ímpetu es un vector: se conserva en cada componente. La fuerza de contacto va por la <b>línea de centros</b>.</p>
    <ul><li>Masas iguales y choque elástico, con una en reposo: salen a 90° para cualquier b.</li><li>Activa el diagrama: p₁′ y p₂′ punta con cola cierran sobre P inicial.</li><li>b = 0: choque de frente; b cerca de 1: apenas un roce.</li></ul>${legend([[F.p1, 'p bola blanca'], [F.p2, 'p bola 8'], [F.P, 'P total']])}`,
  build(K) {
    const g = new THREE.Group(), P = {b: 0.5, e: 1, v: 2};
    const felt = K.box(2.6, 0.05, 1.4, K.MAT.std(0x1b7a43, 0.95)); felt.position.y = 0.76; g.add(felt);
    const rail = K.MAT.tex('walnut', [3, 1], 0.5); [[0, 0.74], [0, -0.74]].forEach(([x, z]) => { const r = K.box(2.8, 0.1, 0.12, rail, 0.02); r.position.set(x, 0.8, z); g.add(r); }); [[1.36, 0], [-1.36, 0]].forEach(([x, z]) => { const r = K.box(0.12, 0.1, 1.6, rail, 0.02); r.position.set(x, 0.8, z); g.add(r); });
    const legs = [[1.2, 0.6], [1.2, -0.6], [-1.2, 0.6], [-1.2, -0.6]]; legs.forEach(([x, z]) => { const l = K.cyl(0.06, 0.05, 0.74, rail, 12); l.position.set(x, 0.37, z); g.add(l); });
    const R = 0.0286, y0 = 0.785 + R;
    const balls = [K.sph(R, K.MAT.std(0xf8f9fa, 0.15), 24), K.sph(R, K.MAT.std(0x16181b, 0.15), 24)]; balls.forEach(b => g.add(b));
    const vp1 = K.vector(F.p1, 'p₁', {r: 0.006}), vp2 = K.vector(F.p2, 'p₂', {r: 0.006}), dg = [K.vector(F.p1, "p₁′", {ghost: 1, r: 0.005}), K.vector(F.p2, "p₂′", {ghost: 1, r: 0.005}), K.vector(F.P, 'P', {r: 0.005})];
    const S = {p: [V3(), V3()], v: [V3(), V3()], t: 0, hit: false};
    const m = 0.17;
    const M = {group: g, P, vectors: [vp1, vp2, ...dg],
      views: {arriba: {label: 'Arriba', t: [0, 0.8, 0], yaw: 0, pitch: 1.5, d: 2.6}, tres: {label: '3/4', t: [0, 0.8, 0], yaw: -0.5, pitch: 0.55, d: 2.6}},
      overlays: [{key: 'p', label: 'Ímpetus', on: true}, {key: 'dg', label: 'Diagrama de suma', on: true}],
      readouts: [{label: 'Bola blanca', get: () => `${N1(S.v[0].length(), 2)} m/s a ${N1(atan2(-S.v[0].z, S.v[0].x) / D, 0)}°`, big: 1}, {label: 'Bola 8', get: () => `${N1(S.v[1].length(), 2)} m/s a ${N1(atan2(-S.v[1].z, S.v[1].x) / D, 0)}°`, big: 1}, {label: 'Ángulo entre ellas', get: () => S.hit && S.v[0].length() > 0.01 && S.v[1].length() > 0.01 ? N1(S.v[0].angleTo(S.v[1]) / D, 1) + '°' : '—'}, {label: 'Pₓ · P_y', get: () => `${N1(m * (S.v[0].x + S.v[1].x), 3)} · ${N1(-m * (S.v[0].z + S.v[1].z), 3)}`}, {label: 'K total', get: () => N1(0.5 * m * (S.v[0].lengthSq() + S.v[1].lengthSq()), 3) + ' J'}],
      controls: [{type: 'range', key: 'b', label: 'Parámetro de impacto b', min: 0, max: 0.95, step: 0.01, fmt: v => v.toFixed(2) + ' diám.', on: () => M.reset()}, {type: 'range', key: 'e', label: 'Restitución e', min: 0, max: 1, step: 0.01, fmt: v => v.toFixed(2)}, {type: 'range', key: 'v', label: 'Rapidez de la blanca', min: 0.5, max: 4, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'}, {type: 'buttons', key: 'c', primary: 1, items: [['Tirar', () => M.reset()]]}],
      calls: {tres: [[() => balls[1].position, 'Bola 8', 'Sale por la línea de centros', 1]], arriba: []},
      reset() { S.p[0].set(-0.9, y0, -P.b * 2 * R); S.p[1].set(0, y0, 0); S.v[0].set(P.v, 0, 0); S.v[1].set(0, 0, 0); S.t = 0; S.hit = false; },
      update(dt) { const n = 20, h = dt / n; for (let i = 0; i < n; i++) { S.p.forEach((p, k) => p.addScaledVector(S.v[k], h)); const d = S.p[1].clone().sub(S.p[0]); if (!S.hit && d.length() <= 2 * R) { S.hit = true; const nrm = d.normalize(), vr = S.v[0].clone().sub(S.v[1]).dot(nrm); if (vr > 0) { const J = (1 + P.e) * vr / 2; S.v[0].addScaledVector(nrm, -J); S.v[1].addScaledVector(nrm, J); } } S.p.forEach((p, k) => { if (abs(p.x) > 1.27) { S.v[k].multiplyScalar(0); } if (abs(p.z) > 0.65) S.v[k].multiplyScalar(0); }); } S.t += dt; },
      pose() { balls.forEach((b, k) => b.position.copy(S.p[k]));
        if (K.ov('p')) { S.v[0].length() > 0.01 ? vp1.set(S.p[0].clone().add(V3(0, 0.04, 0)), S.v[0].clone().multiplyScalar(m), 0.6, `p₁<small>${N1(m * S.v[0].length(), 3)}</small>`) : vp1.hide(); S.v[1].length() > 0.01 ? vp2.set(S.p[1].clone().add(V3(0, 0.04, 0)), S.v[1].clone().multiplyScalar(m), 0.6, `p₂<small>${N1(m * S.v[1].length(), 3)}</small>`) : vp2.hide(); } else { vp1.hide(); vp2.hide(); }
        if (K.ov('dg') && S.hit) { const o = V3(0.55, 0.82, 0.45); dg[0].set(o, S.v[0].clone().multiplyScalar(m), 0.6, "p₁′"); const t = o.clone().addScaledVector(S.v[0], m * 0.6); dg[1].set(t, S.v[1].clone().multiplyScalar(m), 0.6, "p₂′"); dg[2].set(o.clone().add(V3(0, 0.003, 0)), V3(m * P.v, 0, 0), 0.6, 'P inicial'); } else dg.forEach(v => v.hide()); },
      problem: {title: 'Tiro de billar', text: 'La bola blanca va a 2 m/s y golpea de lado a la bola 8, en reposo y de la misma masa. El punto de contacto queda desplazado medio diámetro (b = 0.5). Choque elástico.', q: '¿En qué direcciones y con qué rapidez salen las dos bolas?',
        steps: ['La fuerza de contacto va por la línea de centros: sin α = b = 0.5 ⇒ la bola 8 sale a 30° de la dirección inicial.', 'Masas iguales y elástico ⇒ salen a 90° entre sí: la blanca sale a 60° del otro lado.', 'v₈ = v cos 30° ≈ 1.73 m/s; v_blanca = v sin 30° = 1.0 m/s. Comprueba que 1.73² + 1² = 2².'], ans: 'Bola 8: 1.73 m/s a 30°. Blanca: 1.0 m/s a 60° del otro lado. Ángulo entre ellas: 90°.', load() { P.b = 0.5; P.e = 1; P.v = 2; M.reset(); }},
      reto: {title: 'Choque oblicuo que se «pega»', text: 'La blanca (2 m/s) golpea de lado a la bola 8 en reposo con b = 0.5. Ahora el contacto es totalmente inelástico en la línea de centros (e = 0), sin fricción.', q: '¿Con qué rapidez sale la bola 8?', unit: 'm/s', answer: sqrt(3) / 2, tol: 0.03,
        hint: 'solo la componente de v₁ por la línea de centros participa; con e = 0, ambas terminan con la misma velocidad en esa dirección.', steps: ['sin α = 0.5 ⇒ α = 30°.', 'Componente normal: 2 cos 30° = 1.732 m/s; con e = 0 y masas iguales, cada una queda con la mitad.', 'La bola 8 solo recibe fuerza normal: sale con 0.866 m/s.'], ans: 'v₈ ≈ 0.87 m/s',
        setup() { P.b = 0.5; P.e = 0; P.v = 2; M.reset(); }, preview: 500, reveal() { M.reset(); }, done: () => S.hit && S.t > 0.6, measured: () => `bola 8: ${N1(S.v[1].length(), 3)} m/s`},
      tour: [{at: 0.5, view: 'tres'}, {at: 5, view: 'arriba'}, {at: 7, key: 'b', to: 0.2}, {at: 12, key: 'b', to: 0.8}, {at: 17, key: 'e', to: 0.4}, {at: 18, sel: '[data-key="c0"]'}, {at: 24, key: 'e', to: 1}, {at: 25, key: 'b', to: 0.5}]
    };
    return M;
  }
};

/* ======================= Extra · Centro de masa: cargar la camioneta ======================= */
const cm = {id: 'centro-de-masa', tab: 'Extra · Centro de masa', kicker: KICK('Extra'), title: 'Centro de masa · ¿dónde cargar la camioneta?', specs: 'Cabina y motor 1000 kg · caja 300 kg · carga de 600 kg movible', noteTag: 'x_cm = Σ mᵢxᵢ / M',
  notes: `<div class="eq">r_cm = Σ mᵢ rᵢ / M · M = Σ mᵢ</div><p>El centro de masa es la posición promedio de las partes, ponderada por su masa. Un cuerpo apoyado en su CM queda en equilibrio.</p>
    <ul><li>Mueve la carga hacia atrás: el CM se desplaza hacia atrás y el eje trasero carga más peso.</li><li>Dos masas iguales: el CM está a la mitad; si una es 4 veces mayor, el CM queda a 1/5 de ella.</li></ul>${legend([[F.W, 'Peso de cada parte'], [F.N, 'Reacción en cada eje'], [F.S, 'Centro de masa']])}`,
  build(K) {
    const g = new THREE.Group(), P = {xc: 3, mc: 600};
    const road = K.mesh(new THREE.PlaneGeometry(20, 5), K.MAT.std(0x3b3d42, 0.9), false); road.rotation.x = -PI / 2; road.position.y = 0.01; g.add(road);
    const truck = new THREE.Group(); g.add(truck);
    const cab = K.box(2.2, 1.5, 1.9, K.MAT.plastic(0xf8f9fa, 0.3), 0.15); cab.position.set(-2.6, 1.25, 0); truck.add(cab); const win = K.box(0.05, 0.6, 1.6, K.MAT.glass(), 0.02); win.position.set(-1.5, 1.6, 0); truck.add(win);
    const bed = K.box(3.6, 0.5, 1.9, K.MAT.plastic(0xf8f9fa, 0.3), 0.06); bed.position.set(1.4, 0.75, 0); truck.add(bed); const chassis = K.box(6.6, 0.25, 1.4, K.MAT.std(0x343a40, 0.6)); chassis.position.set(-0.4, 0.5, 0); truck.add(chassis);
    const axles = [-2.6, 2.0]; axles.forEach(x => [0.9, -0.9].forEach(z => { const w = K.cyl(0.42, 0.42, 0.3, K.MAT.rubber(), 24); w.rotation.x = PI / 2; w.position.set(x, 0.42, z); truck.add(w); }));
    const cargo = K.box(1.0, 0.8, 1.2, K.MAT.tex('cardboard', [1, 1], 0.8), 0.03); g.add(cargo);
    const marker = new THREE.Group(); const disc = K.cyl(0.16, 0.16, 0.02, K.MAT.std(0x16181b), 32); disc.rotation.x = PI / 2; marker.add(disc); [0, 1].forEach(i => { const q = K.mesh(new THREE.CircleGeometry(0.15, 32, i * PI / 2 * 2, PI / 2), K.MAT.std(0xffd43b)); q.position.z = 0.012; marker.add(q); const q2 = q.clone(); q2.rotation.z = PI / 2; q2.material = K.MAT.std(0x16181b); marker.add(q2); }); marker.position.z = 1.02; g.add(marker);
    const parts = () => [{n: 'Cabina y motor', m: 1000, x: -3, y: 1.2}, {n: 'Caja', m: 300, x: 2, y: 0.8}, {n: 'Carga', m: P.mc, x: P.xc, y: 1.4}];
    const vW = [0, 1, 2].map(i => K.vector(F.W, '', {r: 0.02})), vN = [0, 1].map(i => K.vector(F.N, '', {r: 0.02})), vC = K.vector(F.S, 'M g');
    const xcm = () => { const ps = parts(), Mt = ps.reduce((a, p) => a + p.m, 0); return ps.reduce((a, p) => a + p.m * p.x, 0) / Mt; };
    const Mt = () => parts().reduce((a, p) => a + p.m, 0);
    const axleLoads = () => { const W = Mt() * g0, xc = xcm(), [a, b] = axles; const Nb = W * (xc - a) / (b - a); return [W - Nb, Nb]; };
    const M = {group: g, P, vectors: [...vW, ...vN, vC],
      views: {lado: {label: 'Lado', t: [-0.3, 1.2, 0], yaw: 0, pitch: 0.05, d: 15}, tres: {label: '3/4', t: [-0.3, 1, 0], yaw: -0.6, pitch: 0.25, d: 15}},
      overlays: [{key: 'f', label: 'Fuerzas', on: true}],
      readouts: [{label: 'Masa total', get: () => N1(Mt(), 0) + ' kg'}, {label: 'Posición de la carga', get: () => N1(P.xc, 2) + ' m'}, {label: 'x del centro de masa', get: () => N1(xcm(), 2) + ' m', big: 1, acc: 1}, {label: 'Eje delantero', get: () => N1(axleLoads()[0] / 1000, 2) + ' kN'}, {label: 'Eje trasero', get: () => N1(axleLoads()[1] / 1000, 2) + ' kN'}, {label: 'Reparto', get: () => `${N1(100 * axleLoads()[0] / (Mt() * g0), 0)} % · ${N1(100 * axleLoads()[1] / (Mt() * g0), 0)} %`}],
      controls: [{type: 'range', key: 'xc', label: 'Posición de la carga', min: -0.5, max: 3, step: 0.05, fmt: v => v.toFixed(2) + ' m'}, {type: 'range', key: 'mc', label: 'Masa de la carga', min: 0, max: 1500, step: 10, fmt: v => v + ' kg'}, {type: 'note', text: 'El origen x = 0 está a la mitad de la camioneta; cabina en x = −3 m, caja en x = 2 m.'}],
      calls: {lado: [[() => marker.position, 'Centro de masa', 'Aquí actúa el peso total', 1]], tres: []},
      reset() {}, update() {},
      pose() { cargo.position.set(P.xc, 1.4, 0); cargo.scale.setScalar(max(0.3, Math.cbrt(P.mc / 600))); marker.position.set(xcm(), 1.15, 1.02);
        const ps = parts(), sc = 1 / 9000; if (K.ov('f')) { ps.forEach((p, i) => p.m > 0 ? vW[i].set(V3(p.x, p.y + (i === 2 ? 0.4 : 0.6), 1.15), V3(0, -p.m * g0, 0), sc, `${p.n}<small>${N1(p.m * g0 / 1000, 1)} kN</small>`) : vW[i].hide()); const L = axleLoads(); axles.forEach((x, i) => vN[i].set(V3(x, 0, 1.25), V3(0, L[i], 0), sc, `N${i ? ' trasero' : ' delantero'}<small>${N1(L[i] / 1000, 1)} kN</small>`)); vC.set(V3(xcm(), 1.15, 1.3), V3(0, -Mt() * g0, 0), sc * 0.5, `M g<small>${N1(Mt() * g0 / 1000, 1)} kN</small>`); } else [...vW, ...vN, vC].forEach(v => v.hide()); },
      problem: {title: '¿Dónde cargar una camioneta?', text: 'Una camioneta se modela con tres masas sobre su eje: cabina y motor 1000 kg en x = −3 m, caja 300 kg en x = 2 m y la carga, 600 kg, en x = 3 m.', q: '¿Dónde queda el centro de masa? ¿Hacia dónde se mueve si la carga se pone más atrás?',
        steps: ['M = 1000 + 300 + 600 = 1900 kg.', 'x_cm = (1000·(−3) + 300·2 + 600·3) / 1900 = (−3000 + 600 + 1800) / 1900.', 'Mueve la carga y mira cómo el CM y el reparto en los ejes cambian.'], ans: 'x_cm ≈ −0.32 m (un poco hacia la cabina). Mover la carga atrás lo desplaza hacia atrás.', load() { P.xc = 3; P.mc = 600; }},
      reto: {title: 'Equilibrar la camioneta', text: 'Con la misma camioneta (cabina 1000 kg en −3 m, caja 300 kg en 2 m), quieres que el centro de masa quede justo en x = 0.', q: '¿Cuánta carga, colocada en x = 3 m, lo logra?', unit: 'kg', answer: 2400 / 3, tol: 0.02,
        hint: 'pide Σ mᵢxᵢ = 0.', steps: ['1000·(−3) + 300·2 + m·3 = 0.', '−2400 + 3 m = 0 ⇒ m = 800 kg.'], ans: 'm = 800 kg',
        setup() { P.xc = 3; P.mc = 200; }, preview: 200, reveal() { P.mc = 800; TD.K.refresh(); }, done: () => true, measured: () => `con 800 kg en x = 3 m: x_cm = ${N1(xcm(), 3)} m`},
      tour: [{at: 0.5, view: 'lado'}, {at: 4, key: 'xc', to: 0}, {at: 9, key: 'xc', to: 3}, {at: 13, key: 'mc', to: 1400}, {at: 18, view: 'tres'}, {at: 20, key: 'mc', to: 600}]
    };
    return M;
  }
};

/* ======================= Extra · Movimiento del CM: fuegos artificiales ======================= */
const cohete = {id: 'movimiento-cm', tab: 'Extra · Movimiento del CM', kicker: KICK('Extra'), title: 'El centro de masa se mueve como una partícula · fuegos artificiales', specs: 'Cohete a 25 m/s, 60° · estalla en el punto más alto en 8 fragmentos', noteTag: 'M a_cm = Σ F_ext',
  notes: `<div class="eq">M a_cm = Σ F_ext</div><p>Las fuerzas internas aparecen en pares acción–reacción y se cancelan. Por eso el CM solo responde a las fuerzas externas.</p><p>Un cohete que estalla: los fragmentos salen en todas direcciones, pero <b>su CM sigue la misma parábola</b>, porque solo actúa la gravedad.</p>${legend([[F.S, 'Trayectoria del CM'], [F.v, 'Velocidad del CM'], [F.W, 'Peso total']])}`,
  build(K) {
    const g = new THREE.Group(), P = {v0: 25, ang: 60, Fx: 8};
    const grass = K.mesh(new THREE.PlaneGeometry(140, 30), K.MAT.std(0x8fb36a, 0.95), false); grass.rotation.x = -PI / 2; grass.position.set(40, 0.005, 0); g.add(grass);
    for (let x = 0; x <= 100; x += 10) { const tk = K.box(0.08, 0.02, 1.2, K.MAT.std(0xf8f9fa)); tk.position.set(x, 0.02, 2); g.add(tk); }
    const launcher = K.cyl(0.25, 0.3, 0.6, K.MAT.std(0x495057, 0.6), 16); launcher.position.y = 0.3; g.add(launcher);
    const rocket = new THREE.Group(); const rb = K.cyl(0.12, 0.12, 0.8, K.MAT.plastic(0xe03131, 0.4), 16); rocket.add(rb); const nose = K.mesh(new THREE.ConeGeometry(0.12, 0.3, 16), K.MAT.plastic(0xffd43b, 0.4)); nose.position.y = 0.55; rocket.add(nose); g.add(rocket);
    const fcol = [0xe03131, 0xf59f00, 0xffd43b, 0x2f9e44, 0x1c7ed6, 0x7048e8, 0xd6336c, 0x0ca678];
    const frags = fcol.map(c => { const s = K.sph(0.18, new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: 0.7, roughness: 0.4}), 12); s.visible = false; g.add(s); return s; });
    const cmB = K.sph(0.22, K.MAT.std(0x16181b, 0.4), 16); g.add(cmB);
    const trailPts = []; let trail = null;
    const vV = K.vector(F.v, 'v_cm', {r: 0.06}), vW = K.vector(F.W, 'M g', {r: 0.06});
    const S = {t: 0, exploded: false, p: V3(), v: V3(), fr: [], fv: [], mass: 8, land: null};
    const M = {group: g, P, vectors: [vV, vW],
      views: {lado: {label: 'Lado', t: [30, 14, 0], yaw: 0, pitch: 0.05, d: 85}, tres: {label: '3/4', t: [30, 12, 0], yaw: -0.5, pitch: 0.2, d: 85}},
      overlays: [{key: 'v', label: 'Vectores', on: true}],
      readouts: [{label: 'Altura del CM', get: () => N1(cmp().y, 1) + ' m'}, {label: 'Distancia del CM', get: () => N1(cmp().x, 1) + ' m'}, {label: 'Altura máxima teórica', get: () => N1((P.v0 * sin(P.ang * D)) ** 2 / (2 * g0), 1) + ' m'}, {label: 'Alcance teórico', get: () => N1(P.v0 ** 2 * sin(2 * P.ang * D) / g0, 1) + ' m', acc: 1}, {label: 'Estado', get: () => S.land !== null ? `el CM cae a ${N1(S.land, 1)} m` : S.exploded ? 'estalló · el CM sigue la parábola' : 'subiendo'}],
      controls: [{type: 'range', key: 'v0', label: 'Rapidez de lanzamiento', min: 10, max: 35, step: 0.5, fmt: v => v + ' m/s'}, {type: 'range', key: 'ang', label: 'Ángulo', min: 20, max: 85, step: 1, fmt: v => v + '°'}, {type: 'range', key: 'Fx', label: 'Fuerza de la explosión', min: 2, max: 20, step: 0.5, fmt: v => v + ' m/s'},
        {type: 'buttons', key: 'c', primary: 1, items: [['Lanzar', () => M.reset()], ['Estallar ahora', () => explode()]]}, {type: 'note', text: 'Si no pulsas «Estallar», estalla sola en el punto más alto. Los fragmentos atraviesan el suelo para que el CM complete su parábola.'}],
      calls: {lado: [[() => cmp(), 'Centro de masa', 'No le importa la explosión', 1]], tres: []},
      reset() { S.t = 0; S.exploded = false; S.land = null; S.p.set(0, 0.6, 0); S.v.set(P.v0 * cos(P.ang * D), P.v0 * sin(P.ang * D), 0); frags.forEach(f => f.visible = false); rocket.visible = true; trailPts.length = 0; if (trail) { g.remove(trail); trail = null; } },
      update(dt) { if (S.land !== null) return; const n = 10, h = dt / n; for (let i = 0; i < n; i++) { if (!S.exploded) { S.v.y -= g0 * h; S.p.addScaledVector(S.v, h); if (S.v.y <= 0) explode(); } else { S.fv.forEach((v, k) => { v.y -= g0 * h; S.fr[k].addScaledVector(v, h); }); } const c = cmp(); if (S.land === null && S.t > 0.3 && c.y <= 0.6) { S.land = c.x; break; } S.t += h; } const c = cmp(); if (trailPts.length === 0 || c.distanceTo(trailPts[trailPts.length - 1]) > 0.8) { if (S.land === null) { trailPts.push(c.clone()); if (trailPts.length > 2) { if (trail) g.remove(trail); trail = K.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trailPts), trailPts.length * 3, 0.08, 6, false), K.MAT.std(0xf05a23, 0.4), false); g.add(trail); } } } },
      pose() { rocket.position.copy(S.p); rocket.rotation.z = atan2(S.v.y, S.v.x) - PI / 2; frags.forEach((f, k) => { if (S.exploded) { f.position.copy(S.fr[k]); f.visible = S.fr[k].y > 0; } }); cmB.position.copy(cmp());
        const c = cmp(), vc = cmv(); if (K.ov('v') && S.land === null) { vV.set(c, vc, 0.5, `v_cm<small>${N1(vc.length(), 1)} m/s</small>`); vW.set(c, V3(0, -S.mass * g0, 0), 0.06, 'M g'); } else { vV.hide(); vW.hide(); } },
      problem: {title: 'Fuegos artificiales', text: 'Un cohete de fuegos artificiales sale a 25 m/s con 60° de inclinación y estalla en el punto más alto en varios fragmentos.', q: '¿A qué altura estalla? ¿Dónde caería el centro de masa de los fragmentos?',
        steps: ['Altura máxima: H = (v₀ sin θ)² / 2g = (21.65)² / 19.6 ≈ 23.9 m.', 'La explosión es interna: el CM sigue la parábola original.', 'Alcance: R = v₀² sin 2θ / g = 625 × 0.866 / 9.8 ≈ 55 m.'], ans: 'Estalla a ≈ 24 m; el CM caería a ≈ 55 m del lanzamiento.', load() { P.v0 = 25; P.ang = 60; M.reset(); }},
      reto: {title: 'Lanzamiento a 45°', text: 'Ahora el cohete sale a 30 m/s con 45° y estalla en 8 fragmentos de igual masa en el punto más alto.', q: '¿A qué distancia del lanzamiento cae el centro de masa?', unit: 'm', answer: 900 / g0, tol: 0.02,
        hint: 'el CM ignora la explosión: usa el alcance de un proyectil, R = v₀² sin 2θ / g.', steps: ['R = 30² × sin 90° / 9.8.', 'R = 900 / 9.8 ≈ 91.8 m.'], ans: 'R ≈ 91.8 m',
        setup() { P.v0 = 30; P.ang = 45; M.reset(); }, preview: 1500, reveal() {}, done: () => S.land !== null, measured: () => `el CM cae a ${N1(S.land, 1)} m`},
      tour: [{at: 0.5, view: 'lado'}, {at: 9, view: 'tres'}, {at: 11, key: 'ang', to: 45}, {at: 12, sel: '[data-key="c0"]'}, {at: 15, sel: '[data-key="c1"]'}, {at: 24, key: 'ang', to: 60}]
    };
    const cmp = () => S.exploded ? S.fr.reduce((a, p) => a.add(p), V3()).multiplyScalar(1 / S.fr.length) : S.p.clone();
    const cmv = () => S.exploded ? S.fv.reduce((a, p) => a.add(p), V3()).multiplyScalar(1 / S.fv.length) : S.v.clone();
    function explode() { if (S.exploded) return; S.exploded = true; rocket.visible = false; S.fr = []; S.fv = []; const kicks = []; for (let k = 0; k < 8; k++) { const th = k / 8 * 2 * PI + 0.3, ph = (k % 2 ? 0.5 : -0.4); kicks.push(V3(cos(th) * cos(ph), sin(ph) + 0.15 * sin(th * 3), sin(th) * cos(ph)).multiplyScalar(P.Fx * (0.7 + 0.6 * ((k * 37) % 10) / 10))); } const mean = kicks.reduce((a, k) => a.add(k.clone()), V3()).multiplyScalar(1 / 8); kicks.forEach(kk => { kk.sub(mean); S.fr.push(S.p.clone()); S.fv.push(S.v.clone().add(kk)); }); frags.forEach(f => f.visible = true); }
    return M;
  }
};

/* ======================= Extra · Velocidad relativa: cruzar el río ======================= */
const rio = {id: 'velocidad-relativa', tab: 'Extra · Velocidad relativa', kicker: KICK('Extra'), title: 'Velocidad relativa · la lancha que cruza el río', specs: 'Río de 60 m · corriente 2 m/s · lancha 3 m/s respecto al agua', noteTag: 'v_B/T = v_B/A + v_A/T',
  notes: `<div class="eq">v_B/T = v_B/A + v_A/T</div><p>La velocidad depende del marco de referencia. La lancha (B) se mueve respecto al agua (A), y el agua respecto a la tierra (T): las velocidades se suman como vectores (transformación de Galileo).</p>
    <ul><li>Apunta recto: cruzas en el mínimo tiempo, pero la corriente te arrastra.</li><li>Para llegar justo enfrente, apunta río arriba: 3 sin α = 2.</li><li>Cambia al marco del agua: la lancha va recta hacia donde apunta.</li></ul>${legend([[F.T, 'v lancha / agua'], ['#868e96', 'v agua / tierra'], [F.S, 'v lancha / tierra']])}`,
  build(K) {
    const g = new THREE.Group(), P = {vc: 2, vb: 3, al: 0, frame: 'tierra'}, W = 60;
    const water = K.mesh(new THREE.PlaneGeometry(240, W), new THREE.MeshStandardMaterial({color: 0x4f8fb8, roughness: 0.25, metalness: 0.1}), false); water.rotation.x = -PI / 2; water.position.set(40, 0.01, 0); g.add(water);
    [W / 2 + 3, -W / 2 - 3].forEach(z => { const bank = K.box(240, 1, 6, K.MAT.std(0x8fb36a, 0.95)); bank.position.set(40, 0.3, z); g.add(bank); });
    const flows = []; for (let i = 0; i < 70; i++) { const f = K.box(1.6, 0.02, 0.08, new THREE.MeshBasicMaterial({color: 0xd0ebff, transparent: true, opacity: 0.7})); f.position.set(-40 + Math.random() * 160, 0.03, -W / 2 + 2 + Math.random() * (W - 4)); g.add(f); flows.push(f); }
    const boat = new THREE.Group(); const hull = K.box(3.2, 0.6, 1.3, K.MAT.plastic(0xf8f9fa, 0.3), 0.25); hull.position.y = 0.3; boat.add(hull); const stripe = K.box(3.22, 0.12, 1.32, K.MAT.plastic(0xe03131, 0.3), 0.05); stripe.position.y = 0.45; boat.add(stripe); const bow = K.mesh(new THREE.ConeGeometry(0.65, 1.0, 4), K.MAT.plastic(0xf8f9fa, 0.3)); bow.rotation.z = -PI / 2; bow.rotation.x = PI / 4; bow.position.set(2.05, 0.3, 0); boat.add(bow); g.add(boat);
    const target = K.cyl(0.4, 0.4, 2.5, K.MAT.std(0xf05a23, 0.5), 12); target.position.set(0, 1.2, -W / 2 - 1); g.add(target);
    const vb = K.vector(F.T, 'v B/A', {r: 0.15}), vc = K.vector('#868e96', 'v A/T', {r: 0.15}), vr = K.vector(F.S, 'v B/T', {r: 0.15});
    const trailPts = []; let trail = null;
    const S = {x: 0, z: W / 2 - 1, t: 0, done: false, drift: null, T: null, wx: 0};
    const M = {group: g, P, vectors: [vb, vc, vr],
      views: {arriba: {label: 'Arriba', t: [10, 0, 0], yaw: 0, pitch: 1.4, d: 95}, tres: {label: '3/4', t: [10, 0, 0], yaw: -0.4, pitch: 0.55, d: 90}},
      overlays: [{key: 'v', label: 'Vectores', on: true}, {key: 'tr', label: 'Rastro', on: true}],
      readouts: [{label: 'Rumbo α (río arriba +)', get: () => P.al + '°'}, {label: 'v lancha / tierra', get: () => N1(hypot(P.vc - P.vb * sin(P.al * D), P.vb * cos(P.al * D)), 2) + ' m/s', big: 1}, {label: 'Tiempo', get: () => N1(S.t, 1) + ' s'}, {label: 'Tiempo para cruzar', get: () => S.T !== null ? N1(S.T, 1) + ' s' : '—'}, {label: 'Deriva río abajo', get: () => S.drift !== null ? N1(S.drift, 1) + ' m' : N1(S.x, 1) + ' m', acc: 1}, {label: 'Marco', get: () => P.frame === 'tierra' ? 'visto desde la orilla' : 'visto desde el agua'}],
      controls: [{type: 'range', key: 'vc', label: 'Corriente v A/T', min: 0, max: 4, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'}, {type: 'range', key: 'vb', label: 'Lancha v B/A', min: 0.5, max: 6, step: 0.1, fmt: v => v.toFixed(1) + ' m/s'}, {type: 'range', key: 'al', label: 'Rumbo α (río arriba +)', min: -60, max: 80, step: 0.5, fmt: v => v + '°'},
        {type: 'chips', key: 'frame', label: 'Marco de referencia', options: [['Orilla', 'tierra'], ['Agua', 'agua']]}, {type: 'buttons', key: 'c', primary: 1, items: [['Zarpar', () => M.reset()], ['Rumbo para cruzar recto', () => { P.al = +(asin(min(1, P.vc / P.vb)) / D).toFixed(1); M.reset(); }]]}],
      calls: {tres: [[() => target.position, 'Justo enfrente', 'Meta para cruzar recto', 1]], arriba: []},
      reset() { S.x = 0; S.z = W / 2 - 1.5; S.t = 0; S.done = false; S.drift = null; S.T = null; S.wx = 0; trailPts.length = 0; if (trail) { g.remove(trail); trail = null; } },
      update(dt) { if (S.done) return; const vx = P.vc - P.vb * sin(P.al * D), vz = -P.vb * cos(P.al * D); S.x += vx * dt; S.z += vz * dt; S.t += dt; S.wx += P.vc * dt; if (S.z <= -W / 2 + 1.5) { S.done = true; S.T = S.t; S.drift = S.x; }
        flows.forEach(f => { f.position.x += P.vc * dt; if (f.position.x > 120) f.position.x -= 160; });
        if (!trailPts.length || hypot(S.x - trailPts[trailPts.length - 1].x, S.z - trailPts[trailPts.length - 1].z) > 1.5) { trailPts.push(V3(S.x, 0.1, S.z)); if (trailPts.length > 2) { if (trail) g.remove(trail); trail = K.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trailPts), trailPts.length * 2, 0.15, 6, false), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.7}), false); g.add(trail); } } },
      pose() { const off = P.frame === 'agua' ? -S.wx : 0; g.position.x = 0; boat.position.set(S.x + off, 0, S.z); boat.rotation.y = PI / 2 + P.al * D; target.position.x = 0 + off; flows.forEach(f => f.visible = P.frame === 'tierra'); if (trail) { trail.visible = K.ov('tr'); trail.position.x = off; }
        const o = V3(S.x + off, 1.5, S.z), sc = 4; if (K.ov('v')) { const vbv = V3(-P.vb * sin(P.al * D), 0, -P.vb * cos(P.al * D)), vcv = V3(P.frame === 'tierra' ? P.vc : 0, 0, 0); vb.set(o, vbv, sc); vcv.x ? vc.set(o.clone().addScaledVector(vbv, sc), vcv, sc) : vc.hide(); vr.set(o, vbv.clone().add(vcv), sc, `v B/${P.frame === 'tierra' ? 'T' : 'A'}<small>${N1(vbv.clone().add(vcv).length(), 2)} m/s</small>`); } else [vb, vc, vr].forEach(v => v.hide()); },
      problem: {title: 'Lancha que cruza un río', text: 'Un río de 60 m de ancho corre a 2 m/s. Una lancha navega a 3 m/s respecto al agua.', q: 'a) Si apunta directo a la otra orilla, ¿cuánto tarda y qué tanto la arrastra la corriente? b) ¿Hacia dónde debe apuntar para llegar justo enfrente?',
        steps: ['a) La velocidad perpendicular es 3 m/s: t = 60 / 3 = 20 s. Deriva: 2 m/s × 20 s = 40 m.', 'b) La componente río arriba debe cancelar la corriente: 3 sin α = 2 ⇒ α = arcsin(2/3) ≈ 41.8° río arriba.', 'Entonces v = 3 cos 41.8° ≈ 2.24 m/s y t = 60 / 2.24 ≈ 26.8 s. Usa «Rumbo para cruzar recto».'], ans: 'a) 20 s y 40 m río abajo. b) 41.8° río arriba; tarda ≈ 26.8 s.', load() { P.vc = 2; P.vb = 3; P.al = 0; M.reset(); }},
      reto: {title: 'Cruce rápido', text: 'Otro río: 60 m de ancho, corriente de 1.5 m/s. La lancha va a 2.5 m/s respecto al agua y apunta directo a la otra orilla (α = 0°).', q: '¿Cuántos metros río abajo llega?', unit: 'm', answer: 1.5 * (57 / 2.5), tol: 0.02,
        hint: 'el tiempo de cruce solo depende de la componente perpendicular; la deriva es corriente × tiempo.', steps: ['La lancha recorre 57 m de agua abierta entre los muelles (empieza y termina a 1.5 m de cada orilla).', 't = 57 / 2.5 = 22.8 s.', 'Deriva = 1.5 × 22.8 ≈ 34.2 m.'], ans: 'Deriva ≈ 34.2 m (≈ 36 m si cruzara los 60 m completos)',
        setup() { P.vc = 1.5; P.vb = 2.5; P.al = 0; P.frame = 'tierra'; M.reset(); }, preview: 1500, reveal() {}, done: () => S.done, measured: () => `llega ${N1(S.drift, 1)} m río abajo en ${N1(S.T, 1)} s`},
      tour: [{at: 0.5, view: 'tres'}, {at: 14, view: 'arriba'}, {at: 16, sel: '[data-key="c1"]'}, {at: 30, sel: '[data-key="frame"] [data-v="agua"]'}, {at: 38, sel: '[data-key="frame"] [data-v="tierra"]'}]
    };
    return M;
  }
};

TD.start({machines: [impulso, molecula, choque1d, billar, cm, cohete, rio]});
})();
