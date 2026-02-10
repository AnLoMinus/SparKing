# 👑 Royal 3D Runner

A browser-based 3D-inspired royal runner built with **HTML, CSS, and JavaScript only**. The project includes three early playable builds plus strategy docs that outline the design intent, version goals, and next steps.

## 📂 Structure
```
Royal_3D_Runner/
├── README.md
├── strategy/
│   ├── design_brief.md
│   ├── gameplay_strategy.md
│   └── version_plan.md
└── versions/
    ├── v1/
    ├── v2/
    └── v3/
```

## 🕹️ Playing the builds
Each version is self-contained. Open the `index.html` file of the desired version in your browser or serve the folder locally (e.g., `python -m http.server 8000`).

- **v1** — Core three-lane royal dash with obstacles and instant restart.
- **v2** — Adds crowns to collect, a charge ability, and smoother parallax lighting.
- **v3** — Difficulty scaling, momentum streaks, and clearer HUD for a polished loop.

## 🎯 Vision
Deliver a fast, readable, and mobile-friendly 3D runner that keeps the royal atmosphere while remaining framework-free. Each iteration keeps the same controls (`← →` to change lanes, `Space` to charge in later builds) and improves pacing, feedback, and depth.

## 📜 Notes
- Colors follow the SparKing palette (Gold, Royal Blue, Mystic Violet, Pearl White, Deep Black).
- No external dependencies beyond a Google Font for legibility.
- Assets are procedural (drawn via canvas) to keep the repo lightweight.
