# Assets and licences

## Game assets

The game ships **no third-party art, model, texture or audio files**. The only third-party files are four open-source UI fonts, listed under [Fonts](#fonts).

| Asset type | Source |
|---|---|
| Terrain, water, sky, clouds | Generated at run time from seeded noise and shaders written for this project |
| Plant and animal models | Procedural geometry built in code (`src/world/vegetation/plantModels.ts`, `src/entities/wildlife/models.ts`) |
| Structures, artifacts | Procedural geometry (`src/world/structures/Structures.tsx`) |
| Textures | Painted at start-up in code (`src/engine/rendering/proceduralTextures.ts`): a 1024 px foliage atlas (leaf clusters, needles, fronds, grass, reeds, bark, rock, coat and scale grain), two 512 px tiling ground sheets, and a mist sprite |
| Audio | Synthesised with the Web Audio API (`src/engine/audio/audio.ts`) |
| Fonts | Four bundled open-source families, see [Fonts](#fonts) |
| Icons | Unicode glyphs and an inline SVG favicon |

No art or audio is downloaded from asset libraries, so the fonts are the only files that carry a licence notice.

### Why no glTF models or PBR texture packs

The art pass was asked to use licensed external assets where available. They were not used, for three reasons:

1. The build environment can reach only the npm registry and GitHub, so the usual CC0 libraries could not be browsed and their licence pages could not be read. Shipping a file whose licence was not checked would break the rule this document exists for.
2. The catalogue is 36 specific Southeast Asian species. Generic stock animals relabelled as, say, a sambar or a great hornbill would be wrong in a game whose point is identification.
3. One procedural pipeline keeps every plant and animal in the same visual style and keeps the whole game small.

If licensed models are added later, list each file here with its author, source URL and licence, and load them through the same LOD and instancing paths.

## Fonts

The interface uses four families, bundled as WOFF2 in `src/assets/fonts/` (19 files) and declared in `src/fonts.css`. Only the Latin and Vietnamese subsets are shipped, so every accented Vietnamese character is drawn in the intended face.

| Family | Role (CSS variable) | Faces shipped | Licence |
|---|---|---|---|
| Chakra Petch | Titles, HUD labels, viewfinder and scanner headings, scientific names (`--display`) | 500, 600, 400 italic | SIL Open Font License 1.1 |
| Be Vietnam Pro | Body text and controls (`--sans`) | 400, 500, 600, 400 italic | SIL Open Font License 1.1 |
| JetBrains Mono | Readouts, compass, small caps labels (`--mono`) | 400, 600 | SIL Open Font License 1.1 |
| Noto Sans KR | Korean interface text (subset of the glyphs used by the ko locale) | variable 100–900 | SIL Open Font License 1.1 |

The Chakra Petch, Be Vietnam Pro and JetBrains Mono files were copied unmodified from the `@fontsource/chakra-petch`, `@fontsource/be-vietnam-pro` and `@fontsource/jetbrains-mono` npm packages (version 5.3.0), which repackage the Google Fonts releases. Noto Sans KR was subset (glyphs used by the Korean locale only) from the Google Fonts variable release with fonttools. The subset files carry no licence metadata of their own, so the copyright notices and the full licence text ship with the game in `public/licenses/FONTS-OFL.txt` (served as `licenses/FONTS-OFL.txt`). Keep that file with any copy of the build. The OFL allows bundling and redistribution with software; it does not allow selling the fonts on their own.

The system font stacks remain as a fallback while the files load. Fonts are kept as separate files in the build rather than inlined, see `assetsInlineLimit` in `vite.config.ts`.

## Species text

Descriptions were written for this project. Classification and Red List categories that were checked are cited per species in `docs/species-sources.md` and on each species page in the game.

## Open-source dependencies (runtime)

| Package | Licence |
|---|---|
| react, react-dom | MIT |
| three | MIT |
| @react-three/fiber | MIT |
| @react-three/drei | MIT |
| zustand | MIT |
| @dimforge/rapier3d-compat | Apache-2.0 |

## Development dependencies

vite (MIT), @vitejs/plugin-react (MIT), typescript (Apache-2.0), vitest (MIT), @playwright/test (Apache-2.0), eslint and typescript-eslint (MIT), eslint-plugin-react-hooks (MIT), globals (MIT), fake-indexeddb (Apache-2.0), @types/* (MIT).

Licences are as declared in each package's `package.json` in `node_modules`; check them again if you upgrade.
