# Homepage world posters

The six `public/home/world-*.webp` files are real `@globiojs/core` renders. The
capture page exports a transparent 1200 × 1200 PNG through the public
`toImage()` API, then encodes that frame as a 92% quality WebP without resizing
or compositing a background. The same profiles drive the stills and the live
gallery previews, so their cross-fade preserves the camera and art direction.
Those profiles live in
`src/components/home/landing/data/world-presets.ts`.

## Regenerate from a local core build

Build the library first, then point the site's opt-in Vite alias at that exact
`dist` directory:

```sh
cd /path/to/globiojs
pnpm --filter @globiojs/core build

cd /path/to/globiojs-site
GLOBIOJS_LOCAL_CORE_DIST=/path/to/globiojs/packages/core/dist \
  node scripts/generate-world-posters.mjs
```

The generator starts a loopback-only Vite server and a headless Chromium
session, renders the six worlds one at a time, and downloads each public PNG
export to a temporary directory. It checks the WebP signature, dimensions,
visible pixels, transparent pixels, and transparent corners before replacing
any tracked asset. A failed render or validation leaves all existing posters
in place.

Verify existing files without starting Vite or loading the core:

```sh
node scripts/generate-world-posters.mjs --check
```

The capture still needs the core's country geometry source to be reachable on a
cold browser cache. Procedural details use stable per-kind seeds, although GPU
and WebP implementations can still produce small byte-level differences.

## Preview a local core without changing dependencies

The same environment variable works with the normal site commands:

```sh
GLOBIOJS_LOCAL_CORE_DIST=/path/to/globiojs/packages/core/dist pnpm dev
```

When the variable is set, Vite aliases only the exact `@globiojs/core` import to
the supplied build and deduplicates its Three.js peer with the site's copy. When
it is unset, local development, CI, Netlify, and production builds keep using
the version declared in `package.json`. This workflow does not edit the package
manifest or lockfile.

The alias affects Vite runtime and bundle resolution. To test declaration files
or package installation behavior for an unpublished core, run `pnpm pack` from
the library's `packages/core` directory and install that tarball in a disposable
copy of the site; do not commit a sibling `file:` dependency or the resulting
lockfile.

## Manual capture debugging

With Vite running under `GLOBIOJS_LOCAL_CORE_DIST`, open
`/scripts/capture-worlds.html` in a WebGL-capable browser and run:

```js
await window.renderWorld('cinematic');
await window.downloadWorld();
```

Valid kinds are `cinematic`, `dotted`, `hologram`, `paper`, `outline`, and
`wireframe`. Mounting the next world releases the previous WebGL context.
