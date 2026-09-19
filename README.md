# 🪔 Mushika Mandap (Dhundh K Dikhao) — Low-Poly 3D Multiplayer Prop Hunt

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-blue.svg)](https://github.com/websockets/ws)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A wholesome, festive 3D Prop Hunt game set in an Indian temple courtyard (*mandap*). Play solo with AI or assemble a real-time multiplayer party across PC and mobile!

---

## 🎮 Game Concept

- **Hiders (Mushika the Mouse)**:
  - Disguise yourself as 12+ authentic festival props (modaks, terracotta diyas, sacred kalash urns, heavy dhol drums, and Ganesha idols).
  - Use **Rigid Freeze [F]** to lock static and orbit your camera in 360°.
  - Lock facing direction with **Orientation Lock [L]**.
  - Match your color with nearby floors and walls using **Chameleon Auto-Blend [C]**.
  - Confuse the seeker with directional **Festive Taunts [T]**!
  - Snatch sacred Prasad modaks and deposit them into mouseholes for bonus points.

- **Seeker (Bala the Elephant Calf)**:
  - First-person retro FPS search perspective.
  - Inspect suspicious static props and use **Sacred Bless / Tag [E] or Left Click** within proximity to reveal disguised mice.
  - Follow subtle 3D directional anti-camp chimes emitted periodically by hiding props.

---

## 🚀 Quick Start (Local Play)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/dhundh-k-dikhao.git
cd dhundh-k-dikhao
npm install
```

### 2. Start Server
```bash
npm start
```
The game will be live at:
👉 **`http://localhost:8080`**

---

## 👥 Real-Time Multiplayer Flow

1. **Host**:
   - Click **[2] PLAY WITH FRIENDS** $\rightarrow$ **[+] CREATE ROOM**.
   - A unique 4-letter room code (e.g. `K9XP`) will be generated on screen (click to copy).
2. **Guest**:
   - Open the game on mobile or another PC.
   - Click **[2] PLAY WITH FRIENDS** $\rightarrow$ **[>] JOIN ROOM** $\rightarrow$ enter the 4-letter code $\rightarrow$ **ENTER ROOM**.
3. **Lobby & Match**:
   - Both players appear in the live roster.
   - Host clicks **[▶] START MATCH NOW**.
   - Server randomly assigns Seeker & Hider roles and launches the match simultaneously!

---

## ☁️ 1-Click Cloud Deployment (Free)

### Deploy to Render.com (Recommended)
Render supports WebSockets (`wss://`) and HTTPS automatically out of the box on the free tier.

1. Push your repository to **GitHub**.
2. Log in to [Render.com](https://render.com) and click **New + $\rightarrow$ Web Service**.
3. Select your GitHub repository.
4. Set the following fields:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click **Create Web Service**.
6. Render will generate your live public HTTPS/WSS URL (e.g., `https://mushika-mandap.onrender.com`).

---

## ⌨️ Controls Cheatsheet

### Desktop Controls

| Action | Key / Input |
| :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` / Arrow Keys |
| **Look / Aim** | Mouse Move |
| **Hop / Jump** | `Spacebar` |
| **Morph into Aimed Prop** | `E` (or Left Click) |
| **Revert to Mouse** | `Q` |
| **Rigid Freeze Disguise** | `F` |
| **Lock Orientation** | `L` |
| **Unstuck from Wall** | `U` |
| **Directional Taunt Echo** | `T` |
| **Chameleon Color Blend** | `C` |
| **Open Chameleon Studio** | `B` |
| **Seeker Bless / Tag** | `E` / Left Click |

### Mobile Controls
- **Virtual Joystick**: Drag thumb anywhere on bottom-left for 360° locomotion.
- **Look & Orbit**: Drag on right half of screen.
- **1-Touch Tap**: Tap directly on world objects to morph or hop.
- **HUD Ability Chips**: Dedicated buttons for Revert, Freeze, Lock, Taunt, Blend, and Bless.

---

## 📁 Project Architecture

```
DHUNDH-K-DIKHAOO/
├── index.html               # Semantic HTML5 UI, HUD overlay, modals & party room
├── style.css                # Retro festival theme, CRT filters & mobile responsive CSS
├── server.js                # Production Node.js HTTP + WebSocket server (rooms & sync)
├── package.json             # ES module dependencies and start scripts
├── .gitignore               # Excludes node_modules, temp files, and logs
└── js/
    ├── main.js              # Three.js orchestrator, RAF loop, entity sync
    ├── network.js           # Client WebSocket network manager with message queueing
    ├── state.js             # Game state machine (Hide, Aarti, Seek, Result)
    ├── audio.js             # Procedural Web Audio API festival soundscape
    ├── camera.js            # Third-person spring follow boom + First-person Seeker POV
    ├── input.js             # Dual input (Desktop keyboard/mouse + Mobile touch)
    ├── entities/
    │   ├── mushika.js       # Low-poly mouse model, rig, physics & morph transitions
    │   ├── bala.js          # Calf elephant seeker entity
    │   └── morphs.js        # 12+ authentic festival prop geometries & mass configs
    ├── systems/
    │   ├── blessSystem.js   # Seeker raycast tagging & proximity verification
    │   ├── paintSystem.js   # Dynamic HSV palette & surface color auto-blending
    │   ├── particles.js     # Marigold petals, diya sparks & blessing bursts
    │   ├── aiHider.js       # Bot hiding logic (solo mode)
    │   └── aiSeeker.js      # Bot seeker navigation (solo mode)
    └── world/
        ├── mandapMap.js     # Courtyard, pandal, steps, ghat, and temple geometry
        └── slots.js         # Authentic prop placement coordinates
```

---

## 📜 License
MIT License. Created for the Indian Game Jam / Festival Arcade Showcase.
