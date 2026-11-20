# Misión Física · juego en equipo para el salón

A live team game for *Mecánica para Ingeniería*. The projector shows a 3D scene with exact physics. Each student joins from their phone, and the team can only win by talking: every phone holds different data, and only the captain's phone has the question.

## How to play

1. On the computer connected to the projector, open **`juego/host.html`** (for example `https://dynamic-abstractions.github.io/MechanicsSimulations/juego/host.html`).
2. Students scan the QR code, type their name and pick a team.
3. Choose the themes, the number of teams and the time per challenge, then press **Comenzar misión**.
4. Each challenge runs like this:
   - The projector plays the situation up to the key moment.
   - Every phone shows a different **clue**. The **captain** (★, rotates each challenge) has the question and sends the team's answer.
   - When every team has answered, or time runs out, the simulation reveals the real result. It shows each team's prediction (flags, lanes or a number line), the points and the solution.
5. **Todo o nada** (optional): in the last challenge, teams bet their points.

Keys: `Enter` reveals now · `→` or `Space` moves on.

**Try it without phones:** open `host.html?demo=1` to play with simulated teams.

## Challenges (3 per theme)

| Theme | Challenges |
|---|---|
| 1 · Dinámica | Sliding box with friction (predict) · Curling stone on ice (mark) · Suspicious free-body diagram (choose) |
| 2 · Trabajo y energía | Coaster crossing the hilltop at 4 m/s (tune) · Spring launcher on a ramp (mark) · Average engine power (predict) |
| 3 · Colisiones | Rear-end crash, cars stick together (predict) · Elastic collision on an air track (mark) · Mass for a 2 m/s rebound (tune) |
| 4 · Cinemática rot. | Centrifuge turns (predict) · Acceleration on a merry-go-round (predict) · Where the roulette stops (mark) |
| 5 · Dinámica rot. | Ball vs. bicycle wheel race (mark) · Skater's arm distance (tune) · Largest torque on a wrench (choose) |
| 6 · Oscilaciones | Spring speed halfway in (predict) · Pendulum for Mars (tune) · Block position in a photo (mark) |

**Scoring:** up to 700 points for accuracy (full within ~3 %) plus up to 300 for speed. Speed points only count if the answer is close.

## Connection

- Phones connect straight to the projector page over WebRTC (PeerJS), with no server to set up. The projector and the phones need internet. Being on the same Wi-Fi works best.
- If a phone drops (screen locked, app switched), it reconnects by itself and returns to the same team.
- Test mode in a single browser: `host.html?local=1`. The QR code then opens phones in the same mode.

Files: `host.html` (projector), `play.html` (phone), `stage.js` (3D scenes, three.js), `challenges.js` (challenges and scoring), `net.js` (connection), `lib/`.
