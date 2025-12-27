# 🧭 GAME STRATEGY — Sky Crown Runner

## Vision
Create a lightweight, royal-themed 3D runner that feels energetic even without heavy assets. Each version adds one focused layer: movement → rewards → challenge + polish.

## Core pillars
- **Clarity** — Simple controls, readable UI, short sessions.
- **Royal vibe** — Gold crowns, blue runways, violet glow, soaring sky.
- **Progression** — Each build adds one meaningful mechanic.
- **Performance-first** — Lightweight meshes, no textures, baked gradients.

## Gameplay loop (v0.2+)
1. Start on the runway with momentum.
2. Dodge hazards, collect crowns for score.
3. Reach target score before timer ends, or reset.

## Mechanics by version
- **v0.1** — Basic movement (WASD), smooth camera follow, rotating runway and ambient light. Goal: prove the feel of motion.
- **v0.2** — Jump + crowns to collect, scoring HUD, reset button (R). Goal: add motivation and feedback.
- **v0.3** — Hazards that end the run, countdown timer, end-state overlay with restart, ambient sky lighting, camera pause to review the scene. Goal: create a complete loop.

## World & art direction
- **Runway** — Long royal-blue strip with gold lane markers and subtle bloom-inspired glow.
- **Player** — Pearl-white cube with violet edges; scale reads as a knight piece.
- **Crowns** — Gold torus knots floating above the lane with gentle bobbing.
- **Hazards** — Deep black spikes with crimson pulse to signal danger (v0.3).
- **Lighting** — Hemisphere + directional lights, tuned per version; fog adds depth.

## Controls
- Move with **WASD**, jump with **Space** (v0.2+), reset with **R** (v0.2+).
- Camera gently follows; in v0.3, when the run ends, the camera can orbit with the mouse to showcase the scene.

## Technical notes
- **Three.js CDN** — `https://unpkg.com/three@0.164.0/build/three.min.js`
- **No build tools** — Plain HTML/CSS/JS. Each version is standalone.
- **Physics** — Simple velocity integration for jump + gravity; bounding-box checks for collectibles and hazards.
- **Performance** — Low-poly meshes, requestAnimationFrame loop, frugal materials.

## Roadmap beyond v0.3
- Add checkpoint gates that boost speed when aligned.
- Mobile touch controls (swipe left/right/jump).
- Dynamic difficulty scaling (speed up as score rises).
- Particle sparks on crown collection.
- Leaderboard persistence via localStorage.
