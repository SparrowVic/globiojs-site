import type { GlobeConfig, GlobeKind, ThemePresetName } from '@globiojs/core';

/** Visual identity shared by still captures and the on-demand gallery renderer. */
export type WorldSceneConfig = Omit<GlobeConfig, 'container' | 'autoRotate' | 'performance'>;

// Leave space for the atmosphere to fade before the edge of the image.
export const WORLD_FRAMING_PADDING = 0.14;

export const WORLD_THEMES = {
  cinematic: 'cinematic-night',
  dotted: 'dotted-dark',
  hologram: 'hologram-cyan',
  paper: 'paper-default',
  outline: 'outline-cyber',
  wireframe: 'wireframe-tron',
} satisfies Readonly<Record<GlobeKind, ThemePresetName>>;

const CONFIGURATIONS: Readonly<Record<GlobeKind, WorldSceneConfig>> = {
  cinematic: {
    initialPosition: [21, 5],
    axisTilt: 12,
    cinematic: {
      quality: 'ultra',
      surface: {
        lightingMode: 'hero', lightDirection: [-0.68, 0.72, 0.22],
        terminatorSoftness: 0.42, terminatorContrast: 1.5,
        keyIntensity: 1.35, fillIntensity: 0.18, rimIntensity: 0.9, rimPower: 2.5,
        specularIntensity: 0.8, oceanSheen: 0.58, relief: 1.1, shallows: 0.65,
      },
      sun: { mode: 'fixed', visible: true, glare: 0.5 },
      clouds: { enabled: true, coverage: 0.46, opacity: 0.8, shadows: true },
      aurora: { enabled: true, intensity: 0.55 },
      cityLights: { enabled: true, intensity: 1.15, count: 11800, size: 0.0042, twinkle: false },
      network: { enabled: true, opacity: 0.15, maxConnections: 42 },
      borders: { enabled: true, intensity: 0.75 },
    },
    postprocessing: {
      enabled: true, resolutionScale: 1, exposure: 1,
      bloom: { enabled: true, strength: 0.28, threshold: 0.9, radius: 0.3 },
      streak: { enabled: true, strength: 0.09, length: 0.35 },
      grain: { enabled: false }, chromaticAberration: { enabled: false }, vignette: { enabled: false },
    },
  },
  dotted: {
    initialPosition: [24, -76], axisTilt: -8,
    dotted: {
      appearance: { color: '#bceeff', sizeScale: 0.95, opacity: 1 },
      latitudeBands: { enabled: true, equatorBoost: 0.3, tropicsBoost: 0.15 },
    },
    atmosphere: { intensity: 0.9, color: '#367cbb', radiusScale: 1.12 },
  },
  hologram: {
    initialPosition: [22, 31], axisTilt: 16,
    hologram: {
      scanlines: { density: 340, opacity: 0.3 }, rimGlow: { intensity: 1.15, width: 2.8 },
      glitch: { enabled: false }, noise: { intensity: 0.08 }, outerGlow: { intensity: 0.065, spread: 1.025 },
    },
    atmosphere: { enabled: false },
  },
  paper: {
    initialPosition: [24, -24], axisTilt: -10,
    paper: {
      surface: { color: '#c7d7c7', noiseAmount: 0.065, waterLineAmount: 0.42 },
      fill: { mode: 'pastel', opacity: 0.62 }, borders: { roughness: 0.0008, opacity: 0.85 },
      compassRose: { enabled: true, lat: 22, lng: -39, size: 9, opacity: 0.65 },
      grid: { opacity: 0.18, majorOpacity: 0.3 },
    },
    atmosphere: { enabled: false },
  },
  outline: {
    initialPosition: [23, 20], axisTilt: 12,
    countries: { fill: { mode: 'always', defaultColor: '#11283e', defaultOpacity: 0.6 } },
    atmosphere: { color: '#367cbb', intensity: 0.85, radiusScale: 1.12 },
  },
  wireframe: {
    initialPosition: [27, -20], axisTilt: -18,
    wireframe: {
      color: '#bce6ff', density: 2, opacity: 0.95, pulse: 0,
      hierarchy: { majorBoost: 1.8, minorBoost: 1.05 },
      equatorBeam: { enabled: true, color: '#ff9b69', opacity: 0.9 },
      emphasis: { enabled: false }, dataPackets: { enabled: true, count: 30 },
      poleStreams: { enabled: true, count: 20, color: '#dcebff' },
    },
    atmosphere: { color: '#447aa6', intensity: 0.75, radiusScale: 1.1 },
  },
};

function createWorldPreset(kind: GlobeKind): WorldSceneConfig {
  const configuration = CONFIGURATIONS[kind];
  return {
    ...configuration,
    kind,
    theme: {
      extends: WORLD_THEMES[kind],
      tokens: {
        'background.color': kind === 'paper' ? '#100f0d' : '#050608',
        ...(kind === 'outline' ? { 'globe.surfaceColor': '#06101c', 'countries.border.color': '#83bfff', 'countries.border.opacity': 0.75 } : {}),
        ...(kind === 'dotted' ? { 'countries.dotted.density': 0.72 } : {}),
      },
    },
    transparent: true,
    framing: { padding: WORLD_FRAMING_PADDING, lockZoom: true },
    countries: { resolution: 'low', hoverEnabled: false, ...configuration.countries },
    starfield: { enabled: false },
    atmosphere: { enabled: true, ...configuration.atmosphere },
    focusPulse: { enabled: false },
    postprocessing: {
      ...configuration.postprocessing,
      grain: { enabled: false },
      chromaticAberration: { enabled: false },
      vignette: { enabled: false },
    },
  };
}

/** Stable references avoid rebuilding a live scene when its status text changes. */
export const WORLD_PRESETS: Readonly<Record<GlobeKind, WorldSceneConfig>> = {
  cinematic: createWorldPreset('cinematic'),
  dotted: createWorldPreset('dotted'),
  hologram: createWorldPreset('hologram'),
  paper: createWorldPreset('paper'),
  outline: createWorldPreset('outline'),
  wireframe: createWorldPreset('wireframe'),
};
