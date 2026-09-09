import { createGlobe } from '@globiojs/core';
import { WORLD_PRESETS } from '../src/components/home/landing/data/world-presets.ts';

const SIZE = 1200;
const EDGE_FADE = 0.16;
const KINDS = Object.freeze([
  'cinematic',
  'dotted',
  'hologram',
  'paper',
  'outline',
  'wireframe',
]);
const SEEDS = Object.freeze({
  cinematic: 0x19c8a4d1,
  dotted: 0x64f091bd,
  hologram: 0x7a2e3c51,
  paper: 0x2d18b7e3,
  outline: 0x53c9e201,
  wireframe: 0x6e0b4f87,
});

/** Stable browser-side PRNG for procedural scene details in repeat captures. */
const createRandom = (seed) => () => {
  seed |= 0;
  seed = seed + 0x6d2b79f5 | 0;
  let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
  value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

let globe;

/** Mount one real scene at a time, releasing its GPU resources before the next capture. */
window.renderWorld = async (kind) => {
  if (!KINDS.includes(kind)) throw new Error(`Unknown globe kind: ${kind}`);
  window.captureReady = null;
  if (globe) {
    const context = globe.getCanvas().getContext('webgl2');
    globe.destroy();
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    globe = null;
  }

  const originalRandom = Math.random;
  Math.random = createRandom(SEEDS[kind]);
  try {
    globe = createGlobe({
      ...WORLD_PRESETS[kind],
      container: document.querySelector('#globe'),
      // The published site still uses the compatible `transparent` flag in
      // WORLD_PRESETS; the capture additionally exercises the new core API.
      background: { canvas: 'transparent', edgeFade: EDGE_FADE },
      autoRotate: { enabled: false },
      performance: {
        pixelRatio: 1,
        antialias: kind !== 'cinematic',
        adaptiveQuality: false,
        pauseWhenHidden: false,
        maxFps: 30,
      },
    });

    await new Promise((resolve, reject) => {
      globe.on('ready', resolve);
      globe.on('error', reject);
      globe.mount();
    });
    // Let surface textures and time-based materials settle before freezing the frame.
    await new Promise((resolve) => setTimeout(resolve, 1800));
    globe.setPaused(true);
  } finally {
    Math.random = originalRandom;
  }

  window.captureReady = kind;
  return { kind, width: globe.getCanvas().width, height: globe.getCanvas().height };
};

/** Export through the public engine API, then compress without resizing or compositing. */
window.downloadWorld = async () => {
  const kind = window.captureReady;
  if (!globe || !kind) throw new Error('Await renderWorld(kind) before downloading.');

  const source = new Image();
  source.src = await globe.toImage({
    width: SIZE,
    height: SIZE,
    background: 'transparent',
    includeBackdrop: false,
    edgeFade: EDGE_FADE,
  });
  await source.decode();
  if (source.naturalWidth !== SIZE || source.naturalHeight !== SIZE) {
    throw new Error(`Core export is ${source.naturalWidth}x${source.naturalHeight}; expected ${SIZE}x${SIZE}.`);
  }

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas context is unavailable.');
  context.drawImage(source, 0, 0);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92));
  if (!blob || blob.type !== 'image/webp') throw new Error('WebP encoding is unavailable.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `world-${kind}.webp`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { kind, width: canvas.width, height: canvas.height };
};

window.captureLoaded = true;
