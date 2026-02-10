# 👑 Royal 3D Game — Sky Crown Runner

A browser-based 3D mini-runner built with **HTML, CSS, and JavaScript** using Three.js from a CDN. The project ships with three incremental, fully playable versions inside this folder.

## 📂 Structure

```
Royal_3D_Game/
├── README.md              # Overview & run instructions
├── GAME_STRATEGY.md       # Vision, mechanics, art direction
├── VERSION_NOTES.md       # What changed in each playable build
├── version_01/            # v0.1 — first playable slice
├── version_02/            # v0.2 — collectibles & scoring
└── version_03/            # v0.3 — hazards & polish
```

## 🕹️ Controls (all versions)
- **W / A / S / D** — Move forward/left/back/right
- **Space** — Jump (versions 2–3)
- **R** — Reset the run (versions 2–3)
- **Mouse** — Orbit camera while paused (v0.3 only, when the game ends)

## 🚀 Running locally
Open any `index.html` in `version_01`, `version_02`, or `version_03` directly in your browser, or serve the folder:

```bash
python -m http.server 8000
# then open http://localhost:8000/04_Website/Royal_3D_Game/version_01/index.html
```

## ✨ Version highlights
- **v0.1** — Minimal royal runway with a controllable cube knight.
- **v0.2** — Adds floating crowns to collect, scoring HUD, jump & reset.
- **v0.3** — Introduces hazards, sky lighting, end-state modal, and richer polish.

## 🎨 Royal aesthetic
- Palette: Gold Royal `#FFD700`, Royal Blue `#0033A0`, Mystic Violet `#6A0DAD`, Pearl White `#FFFFFF`, Deep Black `#000000`.
- Fonts: `Play` for UI readability with subtle glow accents.
- Visual cues: crowns glow in gold, hazards pulse crimson, and the path is framed in royal blue.
