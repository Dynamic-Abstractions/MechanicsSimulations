# Mecánica para Ingeniería · Simulaciones interactivas

Interactive 3D physics simulations for the *Mecánica para Ingeniería* course (UTM). The interface is in Spanish, with an English toggle.

**Live site:** https://dynamic-abstractions.github.io/MechanicsSimulations/

| Tema | Contenido |
|---|---|
| [1 · Dinámica](t1.html) | Leyes de Newton como vectores, aplicaciones de la 2ª ley, fricción |
| [2 · Trabajo y energía](t2.html) | Trabajo, potencia, energía cinética y potencial, curvas de U, conservación |
| [3 · Colisiones](t3.html) | Impulso, conservación del ímpetu, choques en 1D y 2D |
| [4 · Cinemática de la rotación](t4.html) | Variables angulares, α constante, relaciones lineal–angular |
| [5 · Dinámica de la rotación](t5.html) | Inercia, torca, ímpetu angular y su conservación |
| [6 · Oscilaciones](t6.html) | MAS, energía, péndulos, amortiguamiento |

Each tab includes:
- an interactive simulation, with arrows for forces, velocities and momentum;
- a real-life problem that loads into the simulation, with a hidden step-by-step solution;
- in tabs marked ★, a **Reto** (challenge problem): students watch the setup, enter a prediction, and then the simulation reveals the result.

## Misión Física (team game)

`juego/host.html` is a live classroom game. The projector shows 3D scenes with exact physics, and students join from their phones by scanning a QR code. Each teammate receives different data, and the rotating captain sends the team's answer. There are 18 challenges, 3 per theme, of four kinds: predict, mark, tune and choose. See [juego/README.md](juego/README.md). To try it without phones, open `juego/host.html?demo=1`.

## Teardown machines

`maquinas/t1/` holds Theme 1 (Dynamics) as eight teardown machines, each with its forces drawn as live 3D vectors: hanging picture, curling stone, drone, skaters, loading ramp, furniture, sling and falling ball. Each includes notes, a real-life problem and a reto. The shared kit is in `maquinas/kit/`.

`maquinas/t2/` to `maquinas/t6/` cover the remaining themes in the same format: Work and energy (7 machines), Collisions (7), Rotational kinematics (3), Rotational dynamics (7) and Oscillations (4). Every reto is checked against its theoretical answer.

`maquinas/reloj/` is a pendulum clock with a Graham deadbeat escapement that you can take apart. It follows the teardown method: one physics model drives the motion and every panel, each subsystem opens with a button, it uses a light studio with a single accent color, and it runs an auto-tour until a student touches it.

## Technical notes

- Static site with no build step: each page is self-contained HTML and JavaScript.
- 3D rendering uses [three.js](https://threejs.org) r160 (`lib/`). Without WebGL, pages fall back to 2D diagrams.
- Served with GitHub Pages from the `main` branch root.
