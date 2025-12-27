# Gameplay Strategy — Royal 3D Runner

## Core Loop
1. Dodge incoming obstacles across three royal lanes.
2. Collect crowns to fuel a **Charge** (temporary invulnerability) in later versions.
3. Survive as speed ramps up; streaks reward perfect runs.

## Systems
- **Obstacles:** Blocks spawn at varying lanes and depths; speed scales with time.
- **Crowns:** Optional pickups that increase score and fill the charge meter.
- **Charge Aura (v2+):** Spacebar activates a short invulnerable dash that also attracts nearby crowns.
- **Streaks (v3):** Consecutive perfect dodges boost score multiplier.

## Controls
- `← / →` — Shift lanes.
- `Space` — Activate charge when meter is full (v2+).
- `R` — Quick restart after a fail.

## Difficulty Ramps
- Spawn intervals shorten over time.
- Obstacle speed increases in small, capped increments.
- Charge meter gain balances the ramp so skilled players can extend runs.

## UX & Feedback
- **HUD:** Score, streak, and charge meter presented in high contrast.
- **Audio Stubs:** Hooks for future sound effects (not implemented yet to keep pure JS/Canvas).
- **Particles:** Brief spark bursts on lane switches and charge activation.

## Future Ideas
- Boss totems that require charge to break.
- Dynamic weather shaders (rain/light shafts) done via canvas gradients.
- Leaderboard backed by static JSON (no backend) for local highscores.
