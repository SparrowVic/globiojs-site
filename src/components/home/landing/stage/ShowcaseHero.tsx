import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { GlobeInstance, GlobeKind, ThemePresetName } from '@globiojs/core';
import { isGlobeRuntimeLoadError, loadGlobeRuntime } from '@/lib/globe-runtime';
import { studioHref } from '@/lib/studio-link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngular, faJs, faReact, faVuejs } from '@fortawesome/free-brands-svg-icons';
import { KIND_THEMES, defaultThemeFor } from '../data/kind-themes';
import { STAGE_ARCS, STAGE_CINEMATIC } from './stage-config';
import { useInViewport } from '../hooks/use-in-viewport';
import { useHomeAtmosphere } from './HomeAtmosphere';
import { paintAtmosphere, type AtmosphereMode } from './atmosphere-painter';

const STYLES: ReadonlyArray<{ kind: GlobeKind; title: string; detail: string; description: string }> = [
  { kind: 'cinematic', title: 'Cinematic', detail: 'Light. Atmosphere. Earth.', description: 'An Earth with depth: textured terrain, drifting clouds, sunlit oceans and a scattering atmosphere.' },
  { kind: 'outline', title: 'Outline', detail: 'Every border tells a story.', description: 'Crisp country outlines, precise selection and the full collection of data layers. Built for the bigger picture.' },
  { kind: 'dotted', title: 'Dotted', detail: 'A world made of points.', description: 'Continents become a field of light, with ripples, responsive dots and optional constellations that follow your cursor.' },
  { kind: 'wireframe', title: 'Wireframe', detail: 'See the underlying structure.', description: 'Latitude, longitude and moving signals. A geometric globe with grid pulses and a dedicated active-country ring.' },
  { kind: 'hologram', title: 'Hologram', detail: 'A different kind of presence.', description: 'A luminous shell of scanlines, rim light and shifting signals. Give a network or an interface its own visual language.' },
  { kind: 'paper', title: 'Paper', detail: 'The feeling of an atlas.', description: 'Inky borders, pastel countries and textured paper. A softer place for exploration, education and stories.' },
];
const CINEMATIC = {
  ...STAGE_CINEMATIC,
  surface: { ...STAGE_CINEMATIC.surface, lightDirection: [-0.4, 0.65, 0.6] as const, keyIntensity: 1.1, fillIntensity: 0.2, rimIntensity: 0.7 },
  clouds: { enabled: true, coverage: 0.32, opacity: 0.6, shadows: true },
  aurora: { enabled: false },
  network: { enabled: false },
  borders: { enabled: true, intensity: 0.45 },
  sun: { ...STAGE_CINEMATIC.sun, visible: false },
  textures: { day: '/textures/earth/earth_atmos_2048.jpg', normal: '/textures/earth/earth_normal_2048.jpg', specular: '/textures/earth/earth_specular_2048.jpg', fadeMs: 500 },
};

const CAMERA_VIEWS = [
  { id: 'atlantic', label: 'Atlantic', position: [28, -24] as const },
  { id: 'pacific', label: 'Pacific', position: [18, 132] as const },
  { id: 'polar', label: 'Polar', position: [70, -15] as const },
];
const SHOTS = [
  { id: 'earthrise', label: 'Earthrise', description: 'Ocean blue. First light.' },
  { id: 'nightfall', label: 'Nightfall', description: 'The world after dark.' },
  { id: 'aurora', label: 'Aurora', description: 'Light at the edge of space.' },
] as const;
type Shot = typeof SHOTS[number]['id'];
const SHOT_POSITIONS = { earthrise: [28, -24], nightfall: [32, 20], aurora: [61, 8] } as const;
function cinematicShot(shot: Shot) {
  return {
    ...CINEMATIC,
    surface: { ...CINEMATIC.surface,
      lightDirection: shot === 'nightfall' ? [-0.8, 0.35, -0.15] as const : shot === 'aurora' ? [-0.75, 0.6, 0.28] as const : [-0.6, 0.7, 0.6] as const,
      keyIntensity: shot === 'nightfall' ? 0.8 : 1.05, fillIntensity: shot === 'nightfall' ? 0.09 : 0.2, rimIntensity: 0.42,
    },
    aurora: { enabled: shot === 'aurora', intensity: 0.65 },
    cityLights: { ...CINEMATIC.cityLights, enabled: shot !== 'earthrise', intensity: 1.05, twinkle: false },
    clouds: { ...CINEMATIC.clouds, coverage: 0.35, opacity: 0.55 },
    borders: { enabled: shot === 'nightfall', intensity: 0.28 },
  };
}

/** One owned WebGL context; a style change keeps its poster visible while rebuilding. */
function ShowcaseGlobe({ kind, theme, shot, cameraView, paused, onStatus, onInstance }: {
  readonly kind: GlobeKind;
  readonly theme: ThemePresetName;
  readonly shot: Shot;
  readonly cameraView: string;
  readonly paused: boolean;
  readonly onStatus: (status: 'loading' | 'ready' | 'error', error?: unknown) => void;
  readonly onInstance: (instance: GlobeInstance | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const shotRef = useRef(shot); shotRef.current = shot;
  const viewRef = useRef(cameraView); viewRef.current = cameraView;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;
  const instanceCallback = useRef(onInstance);
  instanceCallback.current = onInstance;
  const [live, setLive] = useState(false);
  useEffect(() => { globeRef.current?.setPaused(paused); }, [paused]);
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || kind !== 'cinematic') return;
    globe.update({ cinematic: cinematicShot(shot) });
    globe.setArcs(shot === 'nightfall' ? STAGE_ARCS : []);
    globe.flyTo(SHOT_POSITIONS[shot], undefined, { duration: pausedRef.current ? 0 : 1800 });
    if (pausedRef.current) globe.resize();
  }, [kind, shot]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let frame = 0;
    let globe: GlobeInstance | undefined;
    const cleanups: Array<() => void> = [];
    const release = () => {
      cancelAnimationFrame(frame);
      cleanups.splice(0).forEach((cleanup) => cleanup());
      globe?.destroy();
      globe = undefined;
      globeRef.current = null;
      instanceCallback.current(null);
    };
    const fail = (error?: unknown) => {
      if (disposed) return;
      release();
      setLive(false);
      statusRef.current('error', error);
    };
    setLive(false);
    statusRef.current('loading');
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(async () => {
        if (disposed) return;
        try {
          const { createGlobe } = await loadGlobeRuntime();
          if (disposed) return;
          globe = createGlobe({
            container, kind, theme, transparent: true,
            initialPosition: CAMERA_VIEWS.find((view) => view.id === viewRef.current)?.position ?? (kind === 'cinematic' ? SHOT_POSITIONS[shotRef.current] : [28, -24]), axisTilt: 12,
            framing: { padding: 0.14, lockZoom: true },
            countries: { resolution: 'low', hoverEnabled: true },
            autoRotate: { enabled: true, speed: 0.08 },
            atmosphere: { enabled: true }, starfield: { enabled: false },
            focusPulse: { enabled: false },
            ...(kind === 'cinematic' ? { cinematic: cinematicShot(shotRef.current), arcs: shotRef.current === 'nightfall' ? STAGE_ARCS : [], postprocessing: { bloom: { strength: 0.22, radius: 0.45 }, streak: { enabled: false }, grain: { enabled: false }, vignette: { enabled: false } } } : {}),
            performance: { maxFps: 40, pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5), adaptiveQuality: true, pauseWhenHidden: true, antialias: kind !== 'cinematic' },
          });
          globeRef.current = globe;
          cleanups.push(globe.on('ready', () => {
            if (disposed) return;
            frame = requestAnimationFrame(() => {
              if (disposed) return;
              setLive(true);
              statusRef.current('ready');
              globe?.setPaused(pausedRef.current);
              instanceCallback.current(globe ?? null);
            });
          }));
          cleanups.push(globe.on('error', fail));
          globe.mount();
        } catch (error: unknown) {
          fail(error);
        }
      });
    });
    return () => {
      disposed = true;
      release();
    };
  }, [kind, theme]);
  return <div className="home-globe-art">
    <img src={`/home/world-${kind}.webp`} alt="" width="1200" height="1200" className={`home-globe-poster${live ? ' is-hidden' : ''}`} />
    <div ref={host} className={`home-globe-canvas${live ? ' is-live' : ''}`} aria-hidden="true" />
  </div>;
}

export function ShowcaseHero() {
  const atmosphere = useHomeAtmosphere();
  const [shot, setShot] = useState<Shot>('earthrise');
  const [cameraView, setCameraView] = useState('atlantic');
  const [imageBackground, setImageBackground] = useState<'scene' | 'transparent'>('scene');
  const [kind, setKind] = useState<GlobeKind>('cinematic');
  const [theme, setTheme] = useState<ThemePresetName>('cinematic-night');
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [coarsePointer] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [runtimeDownloadFailed, setRuntimeDownloadFailed] = useState(false);
  const [capture, setCapture] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saving = useRef(false);
  const captureGeneration = useRef(0);
  const instance = useRef<GlobeInstance | null>(null);
  const mounted = useRef(true);
  const onInstance = useCallback((globe: GlobeInstance | null) => { instance.current = globe; }, []);
  const onStatus = useCallback((next: 'loading' | 'ready' | 'error', error?: unknown) => {
    setStatus(next);
    setRuntimeDownloadFailed(isGlobeRuntimeLoadError(error));
  }, []);
  const scene = useRef<HTMLDivElement>(null);
  const journey = useRef<HTMLDivElement>(null);
  const stylePicker = useRef<HTMLDivElement>(null);
  const pendingExploreFocus = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const visible = useInViewport(stage, { rootMargin: '120px' });
  const current = STYLES.find((style) => style.kind === kind)!;
  const themeOptions = KIND_THEMES[kind];
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => { captureGeneration.current++; setCapture((previous) => previous === 'saving' ? previous : 'idle'); }, [kind, theme, shot, imageBackground, atmosphere.mode]);
  useEffect(() => { atmosphere.setWorld(kind, theme); }, [kind, theme, atmosphere.setWorld]);
  useEffect(() => { atmosphere.setPaused(paused || reducedMotion); }, [paused, reducedMotion, atmosphere.setPaused]);
  useEffect(() => {
    const element = journey.current;
    if (!element) return;
    const desktop = window.matchMedia('(min-width: 1101px) and (min-height: 700px)');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!scene.current) return;
      const animated = desktop.matches && !reducedMotion;
      element.dataset.animated = String(animated);
      if (!animated) return;
      const bounds = element.getBoundingClientRect();
      const distance = element.offsetHeight - scene.current.offsetHeight;
      const progress = Math.max(0, Math.min(1, (80 - bounds.top) / Math.max(1, distance)));
      const eased = progress * progress * (3 - 2 * progress);
      element.style.setProperty('--journey', eased.toFixed(4));
      element.style.setProperty('--intro-opacity', '1');
      element.style.setProperty('--picker-opacity', '1');
      element.dataset.phase = progress > 0.45 ? 'explore' : 'intro';
      if (progress >= 0.98 && pendingExploreFocus.current) {
        pendingExploreFocus.current = false;
        stylePicker.current?.querySelector<HTMLButtonElement>('.home-style-option[aria-pressed="true"]')?.focus({ preventScroll: true });
      }
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);
  const exploreStyles = (event: MouseEvent<HTMLAnchorElement>) => {
    const element = journey.current;
    if (element?.dataset.animated !== 'true' || !scene.current) return;
    event.preventDefault();
    pendingExploreFocus.current = event.detail === 0;
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top + element.offsetHeight - scene.current.offsetHeight - 80,
      behavior: 'smooth',
    });
  };
  const captureGlobe = async () => {
    const globe = instance.current;
    if (!globe || saving.current) return;
    saving.current = true;
    const generation = captureGeneration.current;
    setCapture('saving');
    try {
      const source = await globe.toImage({ width: 1200, height: 1000 });
      const image = new Image(); image.src = source; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1000;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image composition is unavailable.');
      if (imageBackground === 'scene') paintAtmosphere(context, canvas.width, canvas.height, atmosphere);
      // Keep the requested pixel dimensions with older core versions on Retina too.
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/png');
      if (!mounted.current || instance.current !== globe || generation !== captureGeneration.current) return;
      const link = document.createElement('a');
      link.href = url;
      link.download = `globiojs-${kind}${imageBackground === 'transparent' ? '-transparent' : ''}.png`;
      link.click();
      setCapture('saved');
    } catch {
      if (mounted.current && instance.current === globe && generation === captureGeneration.current) setCapture('error');
    } finally {
      saving.current = false;
      if (mounted.current && (generation !== captureGeneration.current || instance.current !== globe)) setCapture('idle');
    }
  };
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const chooseKind = (next: GlobeKind) => {
    if (next === kind) return;
    setKind(next); setTheme(defaultThemeFor(next)); setCameraView(next === 'cinematic' ? '' : 'atlantic');
  };
  const chooseCamera = (view: typeof CAMERA_VIEWS[number]) => {
    const globe = instance.current;
    const still = paused || reducedMotion;
    globe?.flyTo(view.position, undefined, { duration: still ? 0 : 1600 });
    if (still) globe?.resize();
    setCameraView(view.id);
  };

  return <section className="home-hero" aria-label="Interactive globe showcase">
    <div ref={journey} className="home-hero-journey">
    <div ref={scene} className="home-hero-main">
      <div className="home-hero-copy">
        <p className="home-intro">An open-source engine for extraordinary worlds.</p>
        <h1>The world is<br /> <span>your canvas.</span></h1>
        <p className="home-hero-lead">Turn your next idea into a world people can explore. Light it, move it, make it yours.</p>
        <div className="home-hero-actions">
          <Link to={studioHref(kind, theme)} className="home-button home-button-accent">Create your world <span aria-hidden="true">↗</span></Link>
          <a href="#kinds" onClick={exploreStyles} className="home-button home-button-secondary">Explore six worlds <span aria-hidden="true">↓</span></a>
        </div>
      </div>
      <label className="home-mobile-preview home-wrap">
        <span>Globe style</span>
        <select value={kind} onChange={(event) => chooseKind(event.target.value as GlobeKind)}>
          {STYLES.map((style) => <option key={style.kind} value={style.kind}>{style.title}</option>)}
        </select>
      </label>
      <div ref={stage} className="home-globe-stage" aria-label={`${current.title} globe preview`}>
        <ShowcaseGlobe key={`${kind}:${theme}`} kind={kind} theme={theme} shot={shot} cameraView={cameraView} paused={paused || reducedMotion || !visible} onStatus={onStatus} onInstance={onInstance} />
      </div>
      <div className="home-director home-wrap">
        {kind === 'cinematic' && <div className="home-shot-options" role="group" aria-label="Cinematic scene">
          <span className="home-director-label">Set the scene</span>
          {SHOTS.map((entry) => <button key={entry.id} type="button" aria-pressed={shot === entry.id} onClick={() => { if (entry.id !== shot) { setShot(entry.id); setCameraView(''); } }} title={entry.description}>{entry.label}</button>)}
        </div>}
        <div className="home-camera-options" role="group" aria-label="Camera view"><span className="home-director-label">Fly to</span>{CAMERA_VIEWS.map((view) => <button key={view.id} type="button" disabled={status !== 'ready'} aria-pressed={cameraView === view.id} onClick={() => chooseCamera(view)}>{view.label}</button>)}</div>
      </div>
      <div className="home-hero-floor home-wrap">
        <div className="home-hero-note"><span>Rendered with GlobioJS</span><p className="home-globe-status" role="status">{status === 'loading' ? 'Your world is loading…' : status === 'error' ? runtimeDownloadFailed ? 'The globe engine could not download. Reload the page to try again.' : 'Showing a preview. Explore this style in Studio.' : reducedMotion || paused || coarsePointer ? 'Six worlds to explore. Choose yours below.' : 'This is a real globe. Go on, give it a spin.'}</p></div>
        <div className="home-globe-caption">
          <span>{current.title}<span className="home-caption-separator">/</span>{themeOptions.find((option) => option.preset === theme)?.label}</span>
          <button type="button" onClick={() => setPaused(!paused)} disabled={reducedMotion || status !== 'ready'} aria-pressed={paused || reducedMotion} aria-label={reducedMotion ? 'Globe animation disabled for reduced motion' : paused ? 'Play globe animation' : 'Pause globe animation'}>{reducedMotion ? 'Reduced motion' : paused ? 'Play' : 'Pause'}<span aria-hidden="true">{paused || reducedMotion ? '▷' : 'Ⅱ'}</span></button>
          <label className="home-export-format"><span>PNG</span><select aria-label="PNG background" value={imageBackground} onChange={(event) => setImageBackground(event.target.value as 'scene' | 'transparent')}><option value="scene">With backdrop</option><option value="transparent">Transparent</option></select></label>
          <button type="button" onClick={captureGlobe} disabled={status !== 'ready' || capture === 'saving'}>{capture === 'saving' ? 'Capturing…' : 'Save PNG'}<span aria-hidden="true">↓</span></button>
          {status === 'error' && runtimeDownloadFailed && <button type="button" onClick={() => window.location.reload()}>Reload page</button>}
          <span className="home-capture-status" role="status">{capture === 'saved' ? 'Your PNG is ready.' : capture === 'error' ? 'Capture unavailable. Try another style.' : ''}</span>
        </div>
      </div>
    <div ref={stylePicker} className="home-wrap home-kind-picker" id="kinds" tabIndex={-1}>
      <div className="home-picker-heading"><h2>Find your<br /> <span>point of view.</span></h2><p>One engine. Six completely different characters.<br /> Pick a world and make it yours.</p></div>
      <div className="home-style-options" role="group" aria-label="Globe style">
        {STYLES.map((style) => <button type="button" key={style.kind} className={`home-style-option${style.kind === kind ? ' is-selected' : ''}`} aria-label={style.title} aria-pressed={kind === style.kind} onClick={() => chooseKind(style.kind)}>
          <img src={`/home/world-${style.kind}.webp`} alt="" width="160" height="100" />
          <span>{style.title}<span className="home-style-check" aria-hidden="true">{style.kind === kind ? '↗' : '+'}</span></span>
        </button>)}
      </div>
      <div className="home-backdrop-picker"><label htmlFor="home-backdrop">Surround your world</label><select id="home-backdrop" aria-label="Page backdrop" value={atmosphere.mode} onChange={(event) => atmosphere.setMode(event.target.value as AtmosphereMode)}><option value="nebula">Nebula</option><option value="stars">Starlight</option><option value="clear">Quiet space</option></select></div>
      <div className="home-style-details">
        <div><h3>{current.detail}</h3><p>{current.description}</p></div>
        <div className="home-style-tools">
          {themeOptions.length > 1 && <div className="home-theme-options" role="group" aria-label={`${current.title} theme`}>
            {themeOptions.map((option) => <button key={option.preset} type="button" aria-pressed={theme === option.preset} onClick={() => setTheme(option.preset)}><span style={{ backgroundColor: option.swatch }} aria-hidden="true" />{option.label}</button>)}
          </div>}
          <Link to={studioHref(kind, theme)} className="home-text-link">Edit in Studio <span aria-hidden="true">↗</span></Link>
          <button type="button" className="home-text-link home-return-preview" onClick={() => stage.current?.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' })}>View this globe <span aria-hidden="true">↑</span></button>
        </div>
      </div>
    </div>
    </div>
    </div>
    <div className="home-stack-strip home-wrap">
      <p>Open source.<br /><strong>Made for the way you build.</strong></p>
      <div className="home-stack-list" aria-label="Supported frameworks">
        <span><FontAwesomeIcon icon={faJs} />JavaScript</span><span><FontAwesomeIcon icon={faReact} />React</span><span><FontAwesomeIcon icon={faVuejs} />Vue</span><span><FontAwesomeIcon icon={faAngular} />Angular</span>
      </div>
    </div>
  </section>;
}
