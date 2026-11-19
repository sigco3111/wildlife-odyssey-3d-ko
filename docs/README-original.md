# Wildlife Odyssey 3D — The Living World

![version](https://img.shields.io/badge/version-0.1.0-2f6f4f) ![license](https://img.shields.io/badge/license-MIT-3da638) ![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2020.19-339933?logo=nodedotjs&logoColor=white) ![languages](https://img.shields.io/badge/languages-Ti%E1%BA%BFng%20Vi%E1%BB%87t%20%7C%20English-d99432) ![backend](https://img.shields.io/badge/backend-none-555555) ![art and audio](https://img.shields.io/badge/art%20and%20audio-procedural-34513a)

A browser-based 3D wildlife exploration and scientific discovery game. Explore Emerald Valley Research Reserve, observe 36 real Southeast Asian species, photograph and film them, and build a field journal. Vietnamese and English.

![Walking out of the research camp towards the forest edge](docs/media/demo-explore.gif)

Everything you see and hear is generated procedurally at run time: terrain, plants, animals, textures and sound. There are no model, texture or audio files, and there is no backend.

## A look at the game

### Photograph wildlife

![Raising the camera on a sambar deer, zooming in, waiting for focus and taking a scored photograph](docs/media/demo-photo.gif)

Raise the camera, zoom, wait for focus lock, release the shutter. Each photograph is scored on seven criteria and identifies its subject.

### Identify species and fill the field journal

![Scanning a sambar deer, the discovery card, then its page in the field journal](docs/media/demo-journal.gif)

Hold a species in the scanner to identify it, then read its entry: names in both languages, taxonomy, habitat, diet, conservation status.

The clips are the real game, played by a script and captured frame by frame (see `qa/demo/`). They were recorded in a software renderer on the Medium preset at reduced resolution, with shadows off and a short draw distance, so they are smaller and plainer than the game on a graphics card.

## Tech stack

| Layer | Stack | Used for |
|---|---|---|
| App | ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-6%20strict-3178C6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white) | Interface, type safety, dev server and static build |
| 3D | ![Three.js](https://img.shields.io/badge/Three.js-r187-000000?logo=threedotjs&logoColor=white) ![React Three Fiber](https://img.shields.io/badge/React%20Three%20Fiber-9-20232a?logo=react&logoColor=61DAFB) ![Drei](https://img.shields.io/badge/Drei-10-20232a) ![WebGL](https://img.shields.io/badge/WebGL-2-990000?logo=webgl&logoColor=white) | Rendering the world, the camera rigs and the inspection view |
| State and physics | ![Zustand](https://img.shields.io/badge/Zustand-5-443E38) ![Rapier](https://img.shields.io/badge/Rapier-0.21%20WASM-4f46a5) | Game and UI state; player collision and ground following |
| Browser APIs | ![IndexedDB](https://img.shields.io/badge/IndexedDB-saves%20and%20media-1e63b8) ![Web Audio](https://img.shields.io/badge/Web%20Audio-synthesised%20sound-8a4fbf) ![MediaRecorder](https://img.shields.io/badge/MediaRecorder-video%20capture-c2452d) ![Pointer Lock](https://img.shields.io/badge/Pointer%20Lock-mouse%20look-555555) | Saving, sound, video recording and mouse look, with no server |
| Quality | ![Vitest](https://img.shields.io/badge/Vitest-5-6E9F18?logo=vitest&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-1.65-2EAD33) ![ESLint](https://img.shields.io/badge/ESLint-10-4B32C3?logo=eslint&logoColor=white) | Unit tests, browser tests in real Chrome, linting |
| Fonts | ![Chakra Petch](https://img.shields.io/badge/Chakra%20Petch-OFL%201.1-a14b2b) ![Be Vietnam Pro](https://img.shields.io/badge/Be%20Vietnam%20Pro-OFL%201.1-a14b2b) ![JetBrains Mono](https://img.shields.io/badge/JetBrains%20Mono-OFL%201.1-a14b2b) | Bundled typefaces with full Vietnamese coverage |

**Status:** version 0.1.0. The full acceptance scenario passes in automated browser tests. Frame rate on a real GPU, audio, and browsers other than Chrome have not been tested; see [`docs/implementation-status.md`](docs/implementation-status.md) for what was verified and how.

Developed and tested with Node.js 22 (Vite 8 needs Node.js 20.19 or newer, or 22.12 or newer). The browser tests also need Google Chrome installed.

## Run

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

Production build (static files in `dist/`, relocatable — `base: './'`):

```bash
npm run build
npm run preview    # http://127.0.0.1:4173
```

Deploy by copying `dist/` to any static host. No server-side code or environment variables are required.

## Checks

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (strict)
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright, runs against `npm run preview` in system Chrome
npm run check      # lint + typecheck + unit tests + build
```

`npm run build` must have been run before `npm run test:e2e`. The browser tests use software WebGL (SwiftShader) so they work without a GPU; on such machines the three tests take about 15 minutes in total.

## Controls

| Input | Action |
|---|---|
| W A S D | Move |
| Mouse (click to capture) / arrow keys | Look around |
| Shift | Sprint |
| Ctrl | Crouch; dive while swimming |
| Space | Jump |
| E | Interact / inspect |
| F | Bio scanner |
| C | Camera (T switches photo / video, 1-4 or wheel zoom, [ ] exposure, R size, O depth of field, - = aperture, G composition guides, H hide UI) |
| B | Binoculars |
| X | Macro lens |
| Z | Slow motion 1.0 / 0.5 / 0.25x |
| V | First / third person |
| M | Map (click to set a waypoint) |
| J | Field journal |
| I | Inventory |
| Tab | Equipment wheel |
| F3 | Performance overlay |
| Esc | Pause and settings |

If the browser refuses pointer capture (for example inside a sandboxed frame), drag with the mouse or use the arrow keys to look.

## Repository layout

```
src/
  app/          application shell and the 3D canvas
  engine/       rendering loop, input, physics, audio, camera maths
  world/        terrain, vegetation, water, weather, structures
  entities/     player and wildlife (models, behaviour, animation)
  systems/      photography, video, identification, quests, persistence, interaction
  ui/           HUD, tool overlays, journal, map, menus
  data/         species, biomes and quests (JSON and typed tables)
  i18n/         Vietnamese and English strings
  store/        game state (Zustand) and per-frame runtime state
  assets/fonts/ bundled typefaces
  tests/        unit tests (Vitest)
e2e/            browser tests (Playwright)
qa/harness/     exploratory QA scripts behind docs/qa-report.md
qa/demo/        scripts that record and encode the README clips
scripts/        maintenance scripts
docs/           design, architecture, status, QA report, handbook, prompts, media
public/         files copied as-is into the build (font licence)
```

## Documentation

- `docs/game-design.md` — design, biomes, tools, expeditions
- `docs/architecture.md` — module layout and decisions
- `docs/implementation-status.md` — feature checklist, test results, known issues
- `docs/performance.md` — budgets, measurements, settings
- `docs/qa-report.md` — end-to-end QA pass: verified checklist, defects found and fixed, what was not executed
- `docs/handbook.html` — sổ tay cho người mới (tiếng Việt): tech stack, kiến trúc, bảy sơ đồ, roadmap học lập trình game
- `docs/species-sources.md` — species list with verification state and sources
- `docs/asset-licenses.md` — asset provenance, bundled fonts and dependency licences
- `docs/prompts/` — the prompts each work pass started from
- `CHANGELOG.md` — what changed in each pass

The interface fonts (Chakra Petch, Be Vietnam Pro, JetBrains Mono; SIL Open Font License 1.1) are bundled in `src/assets/fonts/`, so the game needs no network access for them. Their licence text is in `public/licenses/FONTS-OFL.txt` and must stay with any copy of the build.

## Adding a species

1. Add a record to `src/data/species/animals.json` or `plants.json`.
2. Animals: add a behaviour profile and a habitat group in `src/entities/wildlife/profiles.ts` and a parameter recipe in `src/entities/wildlife/models.ts`. Plants: add metadata and a builder in `src/world/vegetation/plantModels.ts` and list the plant in a biome in `src/data/biomes/biomes.ts`.
3. Add its sources to `src/data/species/verification.json` once checked, then run `node scripts/species-report.mjs`.
4. `npm run test` — the catalog tests check schema, wiring and localisation.

## Licence

Code: MIT, see [`LICENSE`](LICENSE). Bundled fonts: SIL Open Font License 1.1, see `public/licenses/FONTS-OFL.txt`. Dependency licences are listed in `docs/asset-licenses.md`.
