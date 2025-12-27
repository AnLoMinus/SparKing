# Design Brief — Royal 3D Runner

## Goal
Create a minimalist but atmospheric 3D-style endless runner that embodies SparKing's regal tone without external engines.

## Tone & Visuals
- **Palette:** Royal Blue backgrounds with Gold Royal highlights and Mystic Violet accents.
- **Typography:** Playfair Display for headings, Inter for HUD text.
- **Geometry:** Clean prism-like lanes with depth cues (perspective scaling, vignette, soft glows).
- **Particles:** Lightweight spark streaks on movement and charges.

## Experience Pillars
1. **Readability first** — clear lanes, obvious obstacles, legible HUD.
2. **Rhythmic flow** — consistent tempo with mild acceleration over time.
3. **Royal empowerment** — charge mechanic framed as a crown aura, crowns as currency.

## Constraints
- Pure HTML/CSS/JS (no build step, no external JS libraries).
- Works offline (procedural graphics only).
- Responsive layout for desktop and mobile landscape.

## Success Definition
- Player can survive >30 seconds with fair telegraphing.
- 60 FPS on modern browsers with no stutter on spawns.
- Visual hierarchy matches SparKing branding.
