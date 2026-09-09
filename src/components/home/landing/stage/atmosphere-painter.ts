import type { GlobeKind, ThemePresetName } from '@globiojs/core';

export type AtmosphereMode = 'nebula' | 'stars' | 'clear';
export interface AtmosphereScene { kind: GlobeKind; theme: ThemePresetName; mode: AtmosphereMode }
type RGB = readonly [number, number, number];
const PALETTES: Record<GlobeKind, readonly [RGB, RGB]> = {
  cinematic: [[47, 105, 154], [174, 92, 61]],
  outline: [[40, 117, 161], [52, 106, 123]],
  dotted: [[28, 121, 142], [81, 83, 154]],
  hologram: [[21, 137, 143], [37, 86, 148]],
  wireframe: [[71, 92, 155], [124, 81, 135]],
  paper: [[126, 117, 76], [94, 129, 113]],
};
export function atmospherePalette(scene: AtmosphereScene): readonly [RGB, RGB] {
  if (scene.theme === 'cinematic-dawn' || scene.theme === 'outline-sunset') return [[155, 87, 62], [104, 80, 130]];
  if (scene.theme === 'cinematic-noir' || scene.theme === 'outline-monochrome') return [[94, 108, 124], [75, 83, 95]];
  return PALETTES[scene.kind];
}
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function smoothNoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return (noise(ix, iy) * (1 - u) + noise(ix + 1, iy) * u) * (1 - v)
    + (noise(ix, iy + 1) * (1 - u) + noise(ix + 1, iy + 1) * u) * v;
}
// A small, cached density field supplies detail; animation moves the field,
// instead of recomputing noise or adding another WebGL context to the page.
const clouds = new Map<string, HTMLCanvasElement>();
function cloudTexture(color: RGB) {
  const key = color.join(',');
  const cached = clouds.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 384; canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const pixels = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const nx = x / canvas.width, ny = y / canvas.height;
    let density = 0, amplitude = 0.58, frequency = 3;
    for (let octave = 0; octave < 4; octave++) {
      density += smoothNoise(nx * frequency, ny * frequency + 7) * amplitude;
      frequency *= 2.1; amplitude *= 0.5;
    }
    const center = 0.64 - nx * 0.38 + Math.sin(nx * 7) * 0.075;
    const ribbon = Math.exp(-Math.pow((ny - center) / 0.17, 2));
    const edge = Math.sin(Math.PI * nx) * Math.sin(Math.PI * ny);
    const i = (y * canvas.width + x) * 4;
    pixels.data[i] = color[0]; pixels.data[i + 1] = color[1]; pixels.data[i + 2] = color[2];
    pixels.data[i + 3] = Math.max(0, density - 0.22) * ribbon * edge * 150;
  }
  context.putImageData(pixels, 0, 0);
  if (clouds.size >= 8) clouds.delete(clouds.keys().next().value!);
  clouds.set(key, canvas);
  return canvas;
}
const STARS = Array.from({ length: 155 }, (_, i) => ({
  x: noise(i, 13), y: noise(i, 47), size: 0.4 + Math.pow(noise(i, 73), 4) * 1.1,
  phase: noise(i, 91) * Math.PI * 2, depth: 0.25 + noise(i, 109) * 0.75,
}));
/** Shared by the page and PNG composition, so a saved scene keeps its sky. */
export function paintAtmosphere(context: CanvasRenderingContext2D, width: number, height: number,
  scene: AtmosphereScene, seconds = 0, pointer = { x: 0, y: 0 }) {
  context.save();
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#050608'; context.fillRect(0, 0, width, height);
  if (scene.mode === 'clear') { context.restore(); return; }
  const [cool, warm] = atmospherePalette(scene);
  if (scene.mode === 'nebula') {
    const x = width * 0.75 + pointer.x * 15, y = height * 0.53 + pointer.y * 9;
    const glow = context.createRadialGradient(x, y, 0, x, y, Math.max(width * 0.55, height * 0.75));
    glow.addColorStop(0, `rgba(${cool.join(',')},0.17)`);
    glow.addColorStop(0.55, `rgba(${cool.join(',')},0.065)`); glow.addColorStop(1, `rgba(${cool.join(',')},0)`);
    context.fillStyle = glow; context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.85;
    context.drawImage(cloudTexture(cool), -width * 0.08 + Math.sin(seconds * 0.025) * 20 + pointer.x * 12,
      -height * 0.1 + pointer.y * 7, width * 1.16, height * 1.2);
    context.globalAlpha = 0.24;
    context.save(); context.translate(width, height); context.rotate(Math.PI);
    context.drawImage(cloudTexture(warm), 0, -height * 0.18, width * 1.1, height * 1.3); context.restore();
    context.globalAlpha = 1;
  }
  for (const star of STARS) {
    const x = star.x * width + pointer.x * 9 * star.depth;
    const y = star.y * height + pointer.y * 6 * star.depth;
    context.globalAlpha = (0.2 + star.depth * 0.45) * (0.85 + Math.sin(seconds * 0.35 + star.phase) * 0.15);
    context.fillStyle = star.depth > 0.7 ? '#c7e0f4' : '#8a9eae';
    context.beginPath(); context.arc(x, y, star.size, 0, Math.PI * 2); context.fill();
    if (star.size > 1.2) {
      context.globalAlpha *= 0.2;
      context.fillRect(x - 3, y - 0.25, 6, 0.5); context.fillRect(x - 0.25, y - 3, 0.5, 6);
    }
  }
  context.restore();
}
