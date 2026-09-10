# MOTE MAYHEM: LAB ESCAPE

An original, playable sci-fi cartoon browser game. Pick one of four expressive Motes, collect eight Energy Cores, evade security robots, and reach the exit in a 90-second mission.

## JavaScript stack

JavaScript ES6+, React 19, Vite, Phaser 3, organized global CSS, Vitest, and ESLint. No TypeScript source, configuration, or direct TypeScript dependencies. All artwork is original SVG or Phaser graphics; no image assets or paid APIs are needed. Optional Google Fonts gracefully fall back to system fonts.

## Run locally

Requires Node.js 22.12+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The dev server uses polling to work in environments with limited file watchers.

```bash
npm run lint
npm test
npm run build
npm run preview
```

The production build is in `dist/`. Serve it with any static web host. Phaser is split into its own bundle and gameplay loads on demand.

## Playing

- WASD or arrow keys: move.
- Space: use your character's special ability.
- E: interact with the exit portal once all eight cores are collected.
- Escape: pause or resume.
- Mobile landscape: virtual joystick, Interact, Ability, and pause buttons.
- Mobile portrait: menus are supported; gameplay asks you to rotate and pauses the mission.

Cores are collected on contact. Three robot hits or an expired timer ends a mission. Damage grants 1.1 seconds of invulnerability. Robots patrol, chase within detection range, return to patrol when you escape, and briefly stop after attacking. Backgrounding the page pauses the mission.

| Mote              | Ability                                     | Cooldown   |
| ----------------- | ------------------------------------------- | ---------- |
| Volt, Engineer    | EMP stuns nearby robots for 3 seconds       | 8 seconds  |
| Pip, Scout        | 65% speed boost for 3 seconds               | 6 seconds  |
| Glitch, Trickster | Holographic distraction for 4 seconds       | 10 seconds |
| Moss, Brute       | Pushes enemies away and stuns for 2 seconds | 9 seconds  |

Score: 250 per core, 1,500 for escaping, 25 per remaining second on escape, minus 100 per damage received, plus 25 per ability use (capped at ten). Scores never go below zero. XP: 15 per collected core plus 120 for success or 20 for failure. Every 300 XP gains a level.

## Features

Animated loading screen and original Mote portraits; mission-control menu; four character profiles with interactive animation previews; playable top-down lab with wall collision, particle effects, robot AI, health, timer, and portal; React HUD; pause/restart; success and failure reports; cosmetic inventory with category/rarity filters and locked/equipped states; settings and instructions dialogs; local player progression and last five mission results.

Visors, body color, antenna accessories, and ability-effect choices alter the drawn game appearance. Footwear appears in portraits; victory animation appears in the results portrait. All cosmetics are presentation-only. Preview animations are demonstrative; gameplay abilities use their real effects in the mission.

## Structure

```text
src/
  App.jsx                   React screens and application navigation
  main.jsx                  React entry
  components/Mote.jsx       Original animated SVG portraits
  screens/Game.jsx          Phaser lifecycle, HUD, mobile input
  game/
    config/constants.js     Mission tuning, map walls and cores
    scenes/LabScene.js       Simulation, graphics, physics and robot AI
    systems/bridge.js       Isolated React/Phaser event bridge
  data/catalog.js           Character, ability, cosmetic and settings objects
  services/local.js         Replaceable local service adapters
  utils/logic.js            Scoring, cooldown, result and filtering logic
  utils/logic.test.js        Important logic and storage tests
  styles/global.css         Responsive interface and motion preferences
```

The event bridge emits `game-started`, `health-changed`, `core-collected`, `ability-activated`, `cooldown-changed`, `game-paused`, `mission-completed`, and `mission-failed`, plus HUD snapshots and objectives. React sends movement and commands without reading scene internals. Phaser owns runtime player/robot entities. Character and ability definitions are structured catalog objects; missions use centralized configuration; mission results and player/settings/inventory/wallet profiles are plain JavaScript objects.

`playerService`, `inventoryService`, `missionService`, `settingsService`, and `walletService` are replaceable service boundaries. Data lives under `mote:` localStorage keys. Reads validate shape and recover from corrupt or unavailable storage. The Phaser instance is created once per mounted mission, its listeners are removed on exit, and it is destroyed when leaving gameplay.

## Verification

Vitest covers score calculation, cooldown boundaries, mission-result generation, inventory filters, locked-item enforcement, storage parsing and invalid fallback, disabled storage, settings validation, reward persistence, best score, and history limits. Browser smoke testing covers desktop/mobile layouts, movement, ability use, pause/resume, core collection, portal completion, timeout failure, inventory equip, and refreshing character selection. Browser mission-flow checks reposition the player to exercise all pickups and the portal without waiting for a manual run.

## Current frontend limitations

One handcrafted solo level, local device-only progression, simple direct-chase robot AI (no maze pathfinding), and no server authority or anti-cheat. Synthesized sound effects are included; music volume is saved for a future soundtrack, with no music file shipped. Mobile input is implemented, but physical-device testing is recommended. The Phaser engine bundle is comparatively large. Fullscreen depends on browser support.

No backend, database, authentication, wallet connection, blockchain, transactions, cryptocurrency, minting, or paid API is implemented. The disabled wallet button is intentionally a Coming Soon placeholder. Player profile includes clearly marked mock disconnected, connecting, connected, wrong-network, and error previews; the fake address is not a real account.

## Future backend plan

Replace local service adapters with a Node.js API and authenticated persistence for profiles, cosmetic ownership, missions, and achievements. Validate mission events and scores server-side. Add authoritative multiplayer rooms and reconciliation, matchmaking, rate limits, and integration tests while keeping rendering and interface concerns separate.

## Future Web3 plan

Keep normal play independent of wallets. Add optional wallet identity only after backend ownership boundaries exist. Future features may include cosmetic NFT ownership, opt-in mint-on-demand rewards, achievement badges, tournament records, and a cosmetic marketplace. Cosmetics must never increase gameplay power. Network errors must never block ordinary solo play. No Web3 library is included in this prototype.

## Intellectual property

Motes, their designs, names, silhouettes, digital visors, lab setting, and artwork are original for this prototype. This project is not affiliated with or endorsed by Illumination or the owners of Minions or Despicable Me. It uses none of their characters, costumes, voices, logos, or copyrighted assets.
