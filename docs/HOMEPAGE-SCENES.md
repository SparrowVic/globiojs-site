# Homepage scenes

The homepage composes the globe and its surroundings as separate layers. The page owns a single fixed atmosphere canvas; each live globe has a transparent canvas with its own starfield disabled. Gallery images are real transparent renders from the engine, not screenshots of a dark page.

## Art direction

Keep the existing Bricolage/Geist typography and ice/ember brand palette. The opening composition puts the planet beside the headline, then moves it into the six-style explorer as the visitor scrolls. Earthrise, Nightfall and Aurora change the same live cinematic scene; camera destinations use the engine’s flight API.

The atmosphere follows the selected kind and theme. Nebula uses a cached procedural density field and sparse stars; Starlight keeps only the stars; Quiet space is static. The painter is shared with PNG composition. Reduced motion, a paused scene and a hidden tab stop ambient motion. No extra WebGL context is needed for the sky.

References for spatial storytelling: [NASA Eyes](https://eyes.nasa.gov/apps/earth/) and [Active Theory](https://v5.activetheory.net/). The shipped scene uses GlobioJS’s own renderer and local Earth textures.

## Rendering and export

- Hero and gallery live views use `transparent: true` and `starfield: { enabled: false }`. This remains compatible with the published core 0.1.0.
- A short feather at the hero canvas boundary softens the tail of bloom without clipping the planet. Camera controls have their own contrast surface so they remain legible over bright themes.
- Cinematic grain and vignette are disabled in embedded homepage views so the page can supply the surroundings.
- `world-presets.ts` holds the six gallery compositions. Motion previews and the poster generator consume the same poses, materials and lights.
- Only one gallery motion preview can exist at a time. Leaving its viewport destroys it; reduced motion uses the poster.
- PNG export offers a transparent globe or the selected page backdrop at exactly 1200 × 1000 pixels, including on high-density displays.
- Poster generation and optional local core preview are documented in [capture-worlds.md](../scripts/capture-worlds.md). The normal site build still uses the npm package; local core selection is explicit and never changes the lockfile.

The accompanying core branch adds `background.canvas`, `background.edgeFade`, export background overrides and exact export pixel dimensions. Those changes can be reviewed separately and do not require publishing a package to review this homepage.

## Validation

Run the normal site checks from CONTRIBUTING.md. The homepage browser test checks all six kinds, live context cleanup, PNG dimensions, opaque/transparent alpha and backdrop changes. The poster generator validates every image’s dimensions and transparent corners before replacing the complete set.

Manually inspect the opening frame, scrolled style explorer and all gallery globes at desktop, tablet and phone widths. Bright styles such as Paper and Outline Light must remain free of rectangular backgrounds; the planet’s rim must have space to fade.
