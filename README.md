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

## Technical notes

- Static site with no build step: each page is self-contained HTML and JavaScript.
- 3D rendering uses [three.js](https://threejs.org) r160 (`lib/`). Without WebGL, pages fall back to 2D diagrams.
- Served with GitHub Pages from the `main` branch root.
