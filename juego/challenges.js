/* Misión Física · challenge bank (3 per theme). Answers are computed from the physics, not typed.
   kind: predict (number) | mark (drag a marker on a track/dial) | tune (slider) | choose (tap an option)
   clues: data pieces split among teammates; question: only the captain's phone shows it. */
const G = 9.8, deg = Math.PI / 180;
const THEMES = ['Dinámica', 'Trabajo y energía', 'Colisiones', 'Cinemática de la rotación', 'Dinámica de la rotación', 'Oscilaciones'];

const CHALLENGES = [
  /* ---------------- Tema 1 · Dinámica ---------------- */
  {id: 'rampa', theme: 1, kind: 'predict', title: 'La caja fugitiva',
   scene: {type: 'ramp', mode: 'slide', theta: 35, mu: 0.30, d: 5},
   situation: 'Una caja se suelta en una rampa con fricción. ¿Qué tan rápido llegará abajo?',
   clues: ['La rampa está inclinada 35°.', 'Coeficientes caja–rampa: μₛ = 0.40 y μₖ = 0.30.', 'La caja parte del reposo a 5 m de la base (medidos sobre la rampa). Su masa es 8 kg.'],
   question: '¿Con qué rapidez llega la caja a la base de la rampa?', unit: 'm/s',
   get answer() { const a = G * (Math.sin(35 * deg) - 0.30 * Math.cos(35 * deg)); return Math.sqrt(2 * a * 5); }, tol: 0.03,
   explain: ['tan 35° = 0.70 > μₛ = 0.40 ⇒ sí desliza.', 'a = g(sin θ − μₖ cos θ) = 3.21 m/s² (la masa no importa).', 'v = √(2 a d) = √(2 · 3.21 · 5) ≈ 5.67 m/s']},
  {id: 'disco', theme: 1, kind: 'mark', title: 'El tejo de curling',
   scene: {type: 'ice', v0: 8, mu: 0.15, len: 30},
   situation: 'Lanzan un disco sobre la pista de hielo. ¿Dónde se detendrá?',
   clues: ['El disco sale de la línea de lanzamiento (0 m) a 8 m/s.', 'Entre disco y hielo μₖ = 0.15.', 'El disco pesa 18 kg y nadie lo vuelve a tocar.'],
   question: 'Arrastra el marcador: ¿a qué distancia de la línea se detiene el disco?', unit: 'm',
   mark: {type: 'line', min: 0, max: 30, step: 0.1, label: 'Distancia desde la línea de lanzamiento (m)'},
   get answer() { return 8 * 8 / (2 * 0.15 * G); }, tol: 0.03, scale: 30,
   explain: ['La única fuerza horizontal es la fricción: a = −μₖ g = −1.47 m/s².', 'v² = v₀² + 2 a d ⇒ d = v₀² / (2 μₖ g).', 'd = 64 / 2.94 ≈ 21.8 m']},
  {id: 'dcl', theme: 1, kind: 'choose', title: 'Diagrama sospechoso',
   scene: {type: 'ramp', mode: 'static', theta: 25},
   situation: 'Una caja descansa quieta sobre una rampa. Alguien dibujó su diagrama de cuerpo libre… con un error.',
   clues: ['La caja está en reposo: la fuerza neta es cero.', 'La rampa está inclinada 25° y μₛ = 0.60.', 'La fricción estática se opone a la tendencia de movimiento.'],
   question: 'Toca la flecha que está MAL en el diagrama.',
   choose: {draw: 'fbd', options: [{id: 'A', label: 'Peso'}, {id: 'B', label: 'Normal'}, {id: 'C', label: 'Fricción'}], correct: 'C'},
   explain: ['Sin fricción, la caja tendería a deslizar hacia abajo.', 'Por eso la fricción estática apunta hacia ARRIBA de la rampa.', 'La flecha C (fricción hacia abajo) está mal; peso y normal son correctos.']},

  /* ---------------- Tema 2 · Trabajo y energía ---------------- */
  {id: 'montana', theme: 2, kind: 'tune', title: 'Justo en la cima',
   scene: {type: 'coaster', hill: 3.2},
   situation: 'El carro de la montaña rusa debe cruzar la cima a una rapidez exacta. Ustedes eligen desde qué altura soltarlo.',
   clues: ['No hay fricción ni resistencia del aire.', 'La cima de la colina mide 3.20 m de altura.', 'Se quiere que el carro pase la cima a exactamente 4 m/s.'],
   question: 'Ajusta la altura desde la que se suelta el carro (en reposo).', unit: 'm',
   tune: {min: 3, max: 6, step: 0.01, label: 'Altura de salida (m)', start: 3.5},
   get answer() { return 3.2 + 16 / (2 * G); }, tol: 0.02,
   explain: ['Conservación de energía: m g h₀ = m g h + ½ m v².', 'h₀ = 3.20 + 4² / (2 · 9.8) = 3.20 + 0.82', 'h₀ ≈ 4.02 m']},
  {id: 'resorte', theme: 2, kind: 'mark', title: 'El lanzador de resorte',
   scene: {type: 'ramp', mode: 'spring', theta: 30, k: 800, x: 0.15, m: 0.5},
   situation: 'Un resorte comprimido lanza un bloque rampa arriba. ¿Hasta dónde subirá?',
   clues: ['El resorte tiene k = 800 N/m y está comprimido 15 cm.', 'El bloque tiene masa de 0.5 kg.', 'La rampa está inclinada 30° y no tiene fricción.'],
   question: 'Arrastra el marcador: ¿qué distancia sube el bloque sobre la rampa medida desde su posición inicial (resorte comprimido)?', unit: 'm',
   mark: {type: 'ramp', min: 0, max: 6, step: 0.05, label: 'Distancia sobre la rampa (m)', theta: 30},
   get answer() { return 800 * 0.15 * 0.15 / (2 * 0.5 * G * Math.sin(30 * deg)); }, tol: 0.03, scale: 6,
   explain: ['Energía del resorte: ½ k x² = ½ · 800 · 0.15² = 9 J.', 'Toda se vuelve potencial: m g h = 9 J ⇒ h = 1.84 m.', 'Sobre la rampa: d = h / sin 30° ≈ 3.67 m']},
  {id: 'potencia', theme: 2, kind: 'predict', title: '¿Cuántos caballos?',
   scene: {type: 'road', mode: 'power', m: 1200, v: 20, t: 8},
   situation: 'Un auto arranca en el semáforo. ¿Qué potencia promedio entregó el motor?',
   clues: ['El auto tiene masa de 1200 kg.', 'Pasa de 0 a 20 m/s (72 km/h).', 'Tarda 8 s; desprecia fricción y aire.'],
   question: '¿Cuál es la potencia promedio entregada al auto?', unit: 'kW',
   get answer() { return 0.5 * 1200 * 400 / 8 / 1000; }, tol: 0.03,
   explain: ['Trabajo neto = ΔK = ½ · 1200 · 20² = 240 000 J.', 'P = W / t = 240 000 J / 8 s', 'P = 30 kW (≈ 40 hp)']},

  /* ---------------- Tema 3 · Colisiones ---------------- */
  {id: 'alcance', theme: 3, kind: 'predict', title: 'Choque por alcance',
   scene: {type: 'road', mode: 'crash', m1: 1500, v1: 10, m2: 1000},
   situation: 'Un auto choca por detrás a otro detenido y quedan trabados. ¿Qué tan rápido se mueven juntos?',
   clues: ['El auto de atrás tiene 1500 kg y va a 10 m/s.', 'El auto de adelante tiene 1000 kg y está detenido.', 'Las defensas se traban: salen juntos.'],
   question: '¿Con qué rapidez se mueven los dos autos justo después del choque?', unit: 'm/s',
   get answer() { return 1500 * 10 / 2500; }, tol: 0.03,
   explain: ['Se conserva el ímpetu: m₁ v₁ = (m₁ + m₂) v′.', 'v′ = 1500 · 10 / 2500', 'v′ = 6 m/s (se pierde 40 % de la energía cinética)']},
  {id: 'riel', theme: 3, kind: 'mark', title: 'Riel de aire',
   scene: {type: 'track', mode: 'elastic', m1: 1, v1: 3, m2: 3, x2: 10, after: 2},
   situation: 'Un carrito ligero choca de forma elástica con uno pesado en un riel de aire. ¿Dónde estará el pesado poco después?',
   clues: ['Carrito ligero: 1 kg a 3 m/s hacia la derecha.', 'Carrito pesado: 3 kg en reposo, en la marca de 10 m.', 'El choque es perfectamente elástico (e = 1) y no hay fricción.'],
   question: 'Arrastra el marcador: ¿en qué marca del riel estará el carrito pesado 2 s después del choque?', unit: 'm',
   mark: {type: 'line', min: 0, max: 20, step: 0.1, label: 'Posición en el riel (m)'},
   get answer() { return 10 + 2 * (2 * 1 / (1 + 3)) * 3; }, tol: 0.02, scale: 20,
   explain: ['Elástico: v₂′ = 2 m₁ v₁ / (m₁ + m₂) = 2 · 1 · 3 / 4 = 1.5 m/s.', 'En 2 s recorre 1.5 · 2 = 3 m.', 'Posición: 10 + 3 = 13 m']},
  {id: 'rebote', theme: 3, kind: 'tune', title: 'Rebote a la medida',
   scene: {type: 'track', mode: 'tune', m1: 1, v1: 4},
   situation: 'Cada equipo elige la masa del carrito blanco. Queremos que el carrito rojo rebote exactamente a 2 m/s.',
   clues: ['El carrito rojo tiene 1 kg y llega a 4 m/s.', 'El carrito blanco está en reposo.', 'El choque es elástico: se conserva la energía cinética.'],
   question: 'Ajusta la masa del carrito blanco para que el rojo rebote a 2 m/s.', unit: 'kg',
   tune: {min: 0.5, max: 8, step: 0.1, label: 'Masa del carrito blanco (kg)', start: 1.5},
   get answer() { return 3; }, tol: 0.04,
   explain: ['Elástico: v₁′ = (m₁ − m₂) v₁ / (m₁ + m₂).', '−2 = (1 − m₂) · 4 / (1 + m₂) ⇒ −2 − 2 m₂ = 4 − 4 m₂', 'm₂ = 3 kg']},

  /* ---------------- Tema 4 · Cinemática de la rotación ---------------- */
  {id: 'vueltas', theme: 4, kind: 'predict', title: 'La centrífuga',
   scene: {type: 'disk', mode: 'turns', w0: 2, a: 0.5, T: 6},
   situation: 'Una centrífuga que ya gira empieza a acelerar. ¿Cuántas vueltas dará?',
   clues: ['Al empezar a acelerar gira a 2 rad/s.', 'La aceleración angular es constante: 0.5 rad/s².', 'Se cuentan las vueltas durante 6 s.'],
   question: '¿Cuántas vueltas completa en esos 6 s?', unit: 'vueltas',
   get answer() { return (2 * 6 + 0.5 * 0.5 * 36) / (2 * Math.PI); }, tol: 0.03,
   explain: ['θ = ω₀ t + ½ α t² = 2 · 6 + ½ · 0.5 · 36', 'θ = 21 rad', 'Vueltas = 21 / 2π ≈ 3.34']},
  {id: 'carrusel', theme: 4, kind: 'predict', title: 'Agárrate fuerte',
   scene: {type: 'disk', mode: 'carousel', w0: 1, a: 0.5, r: 2, T: 2},
   situation: 'Empujan el carrusel cada vez más rápido. ¿Qué aceleración siente el niño de la orilla?',
   clues: ['El niño está a 2 m del eje.', 'El carrusel gira a 1 rad/s cuando lo empiezan a empujar.', 'Lo empujan con α = 0.5 rad/s² constante durante 2 s.'],
   question: '¿Cuál es la magnitud de la aceleración del niño al final de esos 2 s?', unit: 'm/s²',
   get answer() { const w = 1 + 0.5 * 2; return Math.hypot(w * w * 2, 0.5 * 2); }, tol: 0.03,
   explain: ['ω = ω₀ + α t = 2 rad/s.', 'a_c = ω² r = 8 m/s² (al centro); a_t = α r = 1 m/s² (tangente).', '|a| = √(8² + 1²) ≈ 8.06 m/s²']},
  {id: 'ruleta', theme: 4, kind: 'mark', title: 'La ruleta',
   scene: {type: 'disk', mode: 'wheel', w0: 4, a: -1},
   situation: 'La ruleta del juego gira y frena sola. ¿Dónde quedará la flecha roja?',
   clues: ['La marca roja empieza en 0° y la ruleta gira en sentido antihorario.', 'Rapidez inicial: 4 rad/s.', 'Frena con α = −1 rad/s² hasta detenerse.'],
   question: 'Gira el marcador: ¿en qué ángulo se detiene la marca roja?', unit: '°',
   mark: {type: 'dial', min: 0, max: 360, step: 1, label: 'Ángulo final (°)'},
   get answer() { const th = 4 * 4 / 2 / (Math.PI / 180); return th % 360; }, tol: 0.015, scale: 360, circular: true,
   explain: ['Se detiene cuando ω = 0: t = 4 s.', 'θ = ω₀² / (2|α|) = 16 / 2 = 8 rad = 458.4°', 'Una vuelta completa + 98.4° ⇒ queda en ≈ 98°']},

  /* ---------------- Tema 5 · Dinámica de la rotación ---------------- */
  {id: 'carrera', theme: 5, kind: 'mark', title: 'La gran carrera',
   scene: {type: 'ramp', mode: 'race', theta: 20, L: 6},
   situation: 'Una bola de boliche y una rueda de bicicleta ruedan sin deslizar desde lo alto de la rampa.',
   clues: ['La rampa mide 6 m y está inclinada 20°.', 'Bola de boliche = esfera sólida (I = ⅖ m r²).', 'Rueda de bicicleta = aro (I = m r²). Ambas salen del reposo al mismo tiempo.'],
   question: 'Arrastra el marcador: ¿dónde va la rueda cuando la bola llega abajo? (distancia desde arriba)', unit: 'm',
   mark: {type: 'ramp', min: 0, max: 6, step: 0.05, label: 'Distancia desde lo alto de la rampa (m)', theta: 20},
   get answer() { return 6 * 1.4 / 2; }, tol: 0.03, scale: 6,
   explain: ['Rodando: a = g sin θ / (1 + I/mr²).', 'Esfera: 1 + 0.4 = 1.4; aro: 1 + 1 = 2. Al mismo t: s_aro / s_esfera = 1.4 / 2.', 's_aro = 0.7 · 6 = 4.2 m (¡no depende del ángulo!)']},
  {id: 'patinadora', theme: 5, kind: 'tune', title: 'Giro de campeonato',
   scene: {type: 'skater', I0: 1, m: 2, r0: 1, w0: 2},
   situation: 'La patinadora gira con pesas en las manos. Ustedes deciden qué tanto las acerca al cuerpo.',
   clues: ['Gira a 2 rad/s con los brazos extendidos: pesas a 1 m del eje.', 'Cada pesa tiene 2 kg (lleva dos). Su cuerpo aporta I₀ = 1 kg·m².', 'No hay torcas externas sobre la patinadora.'],
   question: 'Ajusta la distancia de las pesas al eje para que gire a 5 rad/s.', unit: 'm',
   tune: {min: 0.2, max: 1, step: 0.01, label: 'Distancia de las pesas al eje (m)', start: 0.8},
   get answer() { return 0.5; }, tol: 0.03,
   explain: ['L = I ω se conserva: L = (1 + 4 · 1²) · 2 = 10 kg·m²/s.', 'Para ω = 5: I = 10 / 5 = 2 = 1 + 4 r².', 'r = 0.5 m']},
  {id: 'llave', theme: 5, kind: 'choose', title: 'El tornillo oxidado',
   scene: {type: 'wrench'},
   situation: 'Cuatro personas intentan aflojar un tornillo oxidado con la misma llave. ¿Quién produce la mayor torca?',
   clues: ['Fuerza A: 40 N, perpendicular a la llave, a 0.30 m del tornillo.', 'Fuerza B: 60 N, a 30° del mango, a 0.20 m del tornillo.', 'Fuerza C: 30 N, perpendicular, a 0.45 m del tornillo.', 'Fuerza D: 80 N, a lo largo del mango, a 0.30 m del tornillo.'],
   question: 'Toca la fuerza que produce la mayor torca sobre el tornillo.',
   choose: {draw: 'wrench', options: [{id: 'A', label: 'A'}, {id: 'B', label: 'B'}, {id: 'C', label: 'C'}, {id: 'D', label: 'D'}], correct: 'C'},
   explain: ['τ = r F sin φ.', 'A: 12 N·m · B: 0.2 · 60 · sin 30° = 6 N·m · C: 13.5 N·m · D: 0 (paralela al mango).', 'Gana C: menos fuerza, pero más brazo de palanca.']},

  /* ---------------- Tema 6 · Oscilaciones ---------------- */
  {id: 'masa', theme: 6, kind: 'predict', title: 'A medio camino',
   scene: {type: 'spring', mode: 'speed', k: 50, m: 2, A: 0.5, stopX: 0.3},
   situation: 'Un bloque unido a un resorte se suelta desde el reposo. ¿Qué tan rápido pasa por cierto punto?',
   clues: ['El resorte tiene k = 50 N/m.', 'El bloque tiene 2 kg y no hay fricción.', 'Se suelta desde x = 0.5 m y queremos su rapidez en x = 0.3 m.'],
   question: '¿Qué rapidez tiene el bloque al pasar por x = 0.3 m?', unit: 'm/s',
   get answer() { return Math.sqrt(50 / 2) * Math.sqrt(0.25 - 0.09); }, tol: 0.03,
   explain: ['½ k A² = ½ k x² + ½ m v²', 'v = √(k/m) · √(A² − x²) = 5 · 0.4', 'v = 2.0 m/s']},
  {id: 'marte', theme: 6, kind: 'tune', title: 'Un reloj para Marte',
   scene: {type: 'pendulum', g: 3.71, T: 3},
   situation: 'Cada equipo construye un péndulo para un reloj en Marte. El tic-tac debe durar exactamente 3 s.',
   clues: ['En Marte g = 3.71 m/s².', 'El periodo deseado es 3 s (ida y vuelta).', 'Oscilaciones pequeñas: T = 2π √(ℓ / g).'],
   question: 'Ajusta la longitud del péndulo para que su periodo en Marte sea 3 s.', unit: 'm',
   tune: {min: 0.2, max: 2, step: 0.01, label: 'Longitud del péndulo (m)', start: 1.5},
   get answer() { return 3.71 * 9 / (4 * Math.PI * Math.PI); }, tol: 0.03,
   explain: ['T = 2π √(ℓ / g) ⇒ ℓ = g T² / 4π²', 'ℓ = 3.71 · 9 / 39.48', 'ℓ ≈ 0.85 m (en la Tierra ese péndulo tardaría 1.85 s)']},
  {id: 'donde', theme: 6, kind: 'mark', title: '¿Dónde está el bloque?',
   scene: {type: 'spring', mode: 'where', k: 50, m: 2, A: 0.4, T: 0.5},
   situation: 'Se suelta el bloque y se toma una foto medio segundo después. ¿Dónde aparecerá?',
   clues: ['k = 50 N/m y la masa es de 2 kg.', 'Se suelta desde el reposo en x = +0.4 m.', 'La foto se toma 0.5 s después de soltarlo.'],
   question: 'Arrastra el marcador: ¿dónde está el bloque en la foto?', unit: 'm',
   mark: {type: 'line', min: -0.5, max: 0.5, step: 0.005, label: 'Posición x (m)'},
   get answer() { return 0.4 * Math.cos(5 * 0.5); }, tol: 0.03, scale: 1,
   explain: ['ω = √(k/m) = 5 rad/s; x(t) = A cos(ω t).', 'x(0.5) = 0.4 · cos(2.5 rad) = 0.4 · (−0.801)', 'x ≈ −0.32 m (ya pasó el equilibrio)']}
];

/* ---------- scoring ---------- */
function errorOf(ch, v) {
  if (ch.kind === 'choose') return v === ch.choose.correct ? 0 : 1;
  const a = ch.answer; let d = Math.abs(v - a);
  if (ch.circular) d = Math.min(d, 360 - d % 360);
  return ch.scale ? d / ch.scale : d / Math.max(Math.abs(a), 1e-9);
}
function accuracyPts(ch, v) {
  if (v === null || v === undefined || v === '') return 0;
  if (ch.kind === 'choose') return v === ch.choose.correct ? 700 : 0;
  const e = errorOf(ch, v), full = ch.tol, zero = ch.scale ? 0.25 : 0.35;
  if (e <= full) return 700;
  if (e >= zero) return 0;
  return Math.round(700 * (1 - (e - full) / (zero - full)));
}
function fmt(v, unit) {
  if (typeof v !== 'number' || !isFinite(v)) return String(v);
  const a = Math.abs(v), d = a >= 100 ? 0 : a >= 10 ? 1 : 2;
  return v.toFixed(d) + (unit ? ' ' + unit : '');
}
