# Speed Drill Racer — Design

This document describes the high-level architecture, components, data flows, animation/timing math, and integration points for the Speed Drill Racing game. No implementation is included here — this is a design artifact to confirm choices before coding.

**High-level architecture**

- Views / Routes:
  - `DemoScreen` — shows instructions and `Start` button.
  - `RacingScreen` — main gameplay view (problem display, race area, HUD).
  - `SessionResults` — summary at end of session with improvements and a return button.

- Top-level components (React-style names):
  - `SpeedDrillRacer` (controller/container)
    - manages session lifecycle, problem list, stats snapshots, and transitions between rounds
  - `DemoPanel` (child of container)
  - `RaceArea` — visual playfield
    - `ProblemDisplay` — renders the current problem text
    - `Car` — renders player car, handles rotation/position transform
    - `BarrierPair` — two barrier elements with a gap; animates vertical movement
    - `Explosion` — transient animation shown on crash
  - `HUD` — round counter, timer, small hint area

**State shape (in `SpeedDrillRacer` controller)**

- `sessionProblems: Array<ProblemStats>` — 20 selected problems with fields: `p`, `score`, `logs`, `oper`, plus `oldScore` and `oldAccuracy` snapshot for session scoring
- `currentRound: number` — index 0..19
- `roundState: 'idle'|'running'|'passed'|'crashed'|'finished'` 
- `carX: number` — current car center x (px)
- `carTargetX: number` — target x computed from answer choice
- `barrierY: number` — current y for barrier pair (px)
- `barrierSpeed: number` — vertical speed (px/s)
- `timeToImpact: number` — computed per problem (s)
- `sessionMin`, `sessionMax` — numeric anchors used to map answers to x positions

**Problem selection & session setup**

- Call `getLowestPercentile(50, activeOperations)` to retrieve candidate problems. Pick 20 unique problems, keeping them sorted with descending scores.
- Compute `sessionMin` = min(0, 0.95 * min(correctAnswersOfProblems))
- Compute `sessionMax` = max(1.05 * correctAnswersOfProblems)
- Left anchor `L = 50px`, Right anchor `R = screenWidth - 50px`. `startX` (car center starting x) = `screenWidth / 2`.
- Save `oldScore` and `oldAccuracy` snapshots for each problem for end-of-session comparison.

**State transition - Main game**

- State: demo (initial)
  - Show the demo screen with instructions
  - Wait for user to click "Start" or "Back"
  - Transition to playing (round-play) when user clicks "Start"

- State: playing (round-play)
  - Display the current round candidate answers
  - Move car and barriers according to State transition - Car
  - Transition to results when last problem is answered or car crashes

- State: results (session-end)
  - Show results to user

**State transition - Car**

- State: straight-ahead (initial)
  - move barriers according barrierSpeed
  - V_x = 0 (car not moving horizontally)
  - Transition to crashed when barrier reaches car and carX != targetX
  - Transition to panning when user chooses an answer

- State: panning
  - move barriers according barrierSpeed
  - V_x calculated according to carX and targetX
  - Move carX according to V_x
  - Transition to straight-ahead when carX reaches targetX
  - Transition to crashed when barrier reaches car and carX != targetX
  - Transition to panning when user chooses an answer

- State: crashed
  - barrierSpeed = 0
  - V_x = 0
  - Show explosion animation
  - Pause for 2 seconds
  - End the session (results state in main game)

**Per-round timing and motion**

- For the chosen problem, obtain `score_ms` = `getProblemScore(opa, opb, oper)` (ms).
- The spec requires that the barrier reaches the front of the car after $T$ seconds where $T$ = problem score + 1s. Convert milliseconds to seconds:

  $$ T = \frac{score\_ms}{1000} + 1 $$

- Vertical distance and speed to travel (example calculation):
  - Let `barrierStartY` be offscreen (e.g. `-barrierHeight`). Let `carFrontY` be the vertical coordinate where the barrier should intersect (car vertical position minus half car height). `carFrontY = carCenterY - carHeight / 2`. $D_y$ is vertical distance. $v_y$ is vertical barrierSpeed. Then

  $$ D_y = carFrontY - barrierStartY $$

  $$ v_y = \frac{D_y}{T} \quad (\text{px/s}) $$

- Target horizontal position for an answer value `ans`: interpolate between anchors:

  $$ carTargetX = getCarTargetX(ans) = L + \frac{ans - sessionMin}{sessionMax - sessionMin} \times (R - L) $$

  (Clamp the fraction to $[0,1]$ when `ans` is outside session range.)

- Horizontal speed is the same as vertical speed but with the sign set so that the car moves toward the target:

  $$ D_x = carTargetX - carX $$

  $$ v_x = sign(D_x) * abs(v_y) \quad (\text{px/s}) $$

  This ensures the car appears to travel at a 45 degree angle until carCenterX = targetX.

**Animation approach**

Use DOM + SVG + CSS transforms, with requestAnimationFrame where needed.

- Use requestAnimationFrame loop or CSS transitions for smooth movement. Recommended hybrid:
  - Compute `barrierSpeed` synchronously at round start.
  - Use `transform: translateY()` for barrier and `transform: translateX() rotate()` for car; update these transforms from a RAF loop so we can stop both precisely when needed.
  - Use a 0.5s CSS transition for rotation only (car tilt), and position updated via RAF for deterministic timing.

**Answer flow & collision**

- When user answers, compute `carTargetX(answer)` and set `roundState='running'` and start the car moving horizontally.
- During RAF, update `barrierY += v_y * dt` and `carX += v_x * dt` (clamping at `carTargetX`).
- When `barrierY` reaches `carFrontY`, evaluate:
  - `correctAnswerTargetX = getCarTargetX(correctAnswer)`
  - `tolerance = carWidth / 2`
  - If `Math.abs(carX - correctAnswerTargetX) < tolerance` then success -> increment round, snapshot stats update, move to next round.
  - Else -> set `roundState='crashed'`, stop RAF, show `Explosion` for 2s, then show `SessionResults`.

**Statistics integration**

- At session start: call statistics API `getProblemScore()` for each selected problem and store `oldScore` and compute `oldAccuracy` from `getAllStats()` or problem logs.
- On each correct answer: call `addLog(problem, timeToCorrect_ms, attempts)` to record attempt before moving to next round.
- After final round: call `getProblemScore()` and `getProblemAccuracy()` (or `getAllStats()` and compute) to get `newScore` and `newAccuracy` for the session problems. Compute `accuracyDiff` and `scoreDiff` per the spec, then call `trimLogs(activeOperations)`.

**Edge cases and notes**

- If `sessionMax === sessionMin`, expand the range slightly to avoid division by zero.
- Clamp `targetX` to `[L, R]` to avoid off-screen placements for out-of-range answers.
- Use a small pixel tolerance when comparing `carX` to target to allow for timing rounding.

**Testing & accessibility**

- Ensure `ProblemDisplay` uses proper semantic text for screen readers.
- Provide keyboard alternatives for selecting answers for accessibility testing.
- Add unit tests for the mapping functions `targetX(ans, min, max, L, R)` and the timing math (pure functions).

**Next steps**
Review SpeedRacingGameSpec.md
* Implement UI components (`DemoPanel`, `RaceArea`, `Car`, `BarrierPair`).
* Implement statistics hooks and end-of-session scoring UI.
