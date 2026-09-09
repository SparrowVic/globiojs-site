import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GlobeKind } from '@globiojs/core';
import { DecorationGlobe } from '@/components/shared/components/DecorationGlobe';
import { studioHref } from '@/lib/studio-link';
import { WORLD_PRESETS, WORLD_THEMES } from '../data/world-presets';
import { useInViewport } from '../hooks/use-in-viewport';
import './visual-worlds.css';

interface WorldStudy {
  readonly kind: GlobeKind;
  readonly name: string;
  readonly character: string;
  readonly description: string;
  readonly uses: string;
  readonly imageDescription: string;
}

const WORLDS = {
  cinematic: {
    kind: 'cinematic',
    name: 'Cinematic',
    character: 'Film',
    description: 'Clouds cast shadows. Cities light the night. Sunlight catches the atmosphere. Build a procedural Earth, or bring your own textures for the surface, clouds and night lights.',
    uses: 'Product reveals · Earth stories · Global brands',
    imageDescription: 'Cinematic Earth with a blue atmosphere, textured continents and drifting clouds.',
  },
  dotted: {
    kind: 'dotted',
    name: 'Dotted',
    character: 'Signal',
    description: 'Continents become fields of light. Hover lifts the dots; clicks send ripples across them. Add markers and routes, or place a choropleth beneath the point field.',
    uses: 'Global presence · Networks · Technology launches',
    imageDescription: 'North and South America formed from dense fields of luminous cyan dots against a black globe.',
  },
  hologram: {
    kind: 'hologram',
    name: 'Hologram',
    character: 'Projection',
    description: 'A luminous shell with scanning bands, bright borders and a shifting rim. Tune the noise, shimmer and glitches, then use country interaction to bring the projection into the experience.',
    uses: 'Interactive exhibits · Science fiction · Game interfaces',
    imageDescription: 'A cyan holographic globe with luminous country borders and horizontal scanlines across its translucent surface.',
  },
  paper: {
    kind: 'paper',
    name: 'Paper',
    character: 'Atlas',
    description: 'Rough ink borders and pastel land on a textured surface. Add country labels, a compass rose and your own story to give the globe the character of an illustrated atlas.',
    uses: 'Education · Museums · Travel stories',
    imageDescription: 'An illustrated atlas with sage oceans, pastel countries, fine ink borders and a compass rose over the Atlantic.',
  },
  outline: {
    kind: 'outline',
    name: 'Outline',
    character: 'Clarity',
    description: 'Crisp borders leave room for the data. The full set of data layers is available here: choropleth, bars, extruded countries, heatmap, hexbin and charts.',
    uses: 'Analytics · Country comparisons · Data journalism',
    imageDescription: 'A deep blue globe with crisp country outlines and a subtle blue atmosphere.',
  },
  wireframe: {
    kind: 'wireframe',
    name: 'Wireframe',
    character: 'Structure',
    description: 'Strip the surface back to latitude and longitude. Pulses, moving packets and pole streams animate the grid. Add your own markers and arcs to trace connections through it.',
    uses: 'Network views · Retro interfaces · Abstract worlds',
    imageDescription: 'A dark globe made from thin cyan latitude and longitude lines, surrounded by a luminous rim.',
  },
} satisfies Record<GlobeKind, WorldStudy>;

type PreviewStatus = 'poster' | 'loading' | 'live' | 'error';

function WorldStudy({ world, featured = false, active, reducedMotion, onPreview, onStop }: {
  readonly world: WorldStudy;
  readonly featured?: boolean;
  readonly active: boolean;
  readonly reducedMotion: boolean;
  readonly onPreview: (kind: GlobeKind) => void;
  readonly onStop: (kind: GlobeKind) => void;
}) {
  const article = useRef<HTMLElement>(null);
  const visible = useInViewport(article, { threshold: 0 });
  const [status, setStatus] = useState<PreviewStatus>('poster');
  const previewWasVisible = useRef(false);
  const headingId = `home-worlds-${world.kind}`;
  const statusId = `${headingId}-status`;
  const href = studioHref(world.kind, WORLD_THEMES[world.kind]);
  const live = active && status === 'live';

  // Release the preview when the visitor moves on; the six studies share one
  // optional context, rather than mounting a renderer for every photograph.
  // Keyboard focus may scroll here before IntersectionObserver reports entry.
  useEffect(() => {
    if (!active) previewWasVisible.current = false;
    else if (visible) previewWasVisible.current = true;
    else if (previewWasVisible.current) onStop(world.kind);
  }, [active, visible, onStop, world.kind]);

  const togglePreview = () => {
    if (active) {
      onStop(world.kind);
      setStatus('poster');
    } else {
      setStatus('loading');
      onPreview(world.kind);
    }
  };

  return (
    <article ref={article} aria-labelledby={headingId} className={`home-worlds__study home-worlds__study--${world.kind}${featured ? ' home-worlds__study--featured' : ''}${active ? ' is-previewing' : ''}`}>
      <div className="home-worlds__art">
        <Link className="home-worlds__art-link" to={href} aria-label={`Create a globe in ${world.name} style in Studio`}>
          <img
            className={`home-worlds__poster${live ? ' is-hidden' : ''}`}
            src={`/home/world-${world.kind}.webp`}
            alt={world.imageDescription}
            width={1200}
            height={1200}
            loading="lazy"
            decoding="async"
          />
          {active && visible && <DecorationGlobe
            key={world.kind}
            kind={world.kind}
            scene={WORLD_PRESETS[world.kind]}
            speed={0.04}
            maxFps={30}
            resolution="low"
            interactive={false}
            paused={reducedMotion || !visible}
            className={`home-worlds__canvas${live ? ' is-live' : ''}`}
            onLive={() => setStatus('live')}
            onError={() => { setStatus('error'); onStop(world.kind); }}
          />}
          <span className="home-worlds__image-action" aria-hidden="true">Make it yours <span>↗</span></span>
        </Link>
      </div>
      <div className="home-worlds__study-copy">
        <div className="home-worlds__study-title">
          <h3 id={headingId}>{world.name}</h3>
          <span className="home-worlds__character">{world.character}</span>
        </div>
        <p className="home-worlds__description">{world.description}</p>
        {featured && (
          <ul className="home-worlds__features" aria-label="Cinematic features">
            <li>Sunrise on your schedule</li>
            <li>Cloud shadows. Atmospheric depth.</li>
            <li>Your textures, or a procedural Earth</li>
          </ul>
        )}
        <p className="home-worlds__uses">{world.uses}</p>
        <div className="home-worlds__actions">
          <button
            type="button"
            className="home-worlds__motion"
            onClick={togglePreview}
            aria-label={`${active ? 'Stop' : 'Preview'} ${world.name} motion`}
            aria-pressed={active}
            aria-describedby={reducedMotion ? 'home-worlds-motion-preference' : status === 'error' || active ? statusId : undefined}
            disabled={reducedMotion}
          >
            <span className="home-worlds__play-icon" aria-hidden="true">{active ? 'Ⅱ' : '▷'}</span>
            {active ? 'Stop preview' : 'Preview motion'}
          </button>
          <Link to={href} className="home-worlds__studio" aria-label={`Open ${world.name} in Studio`}>Open in Studio <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="home-worlds__details">
          <Link to={`/docs/kinds/${world.kind}`}>{world.name} guide <span aria-hidden="true">→</span></Link>
          <p id={statusId} role="status">{status === 'error' ? 'Preview unavailable. Try this world in Studio.' : active ? status === 'loading' ? 'Starting preview…' : 'Live render' : ''}</p>
        </div>
      </div>
    </article>
  );
}

export function VisualWorldsSection() {
  const [activeKind, setActiveKind] = useState<GlobeKind | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const stopPreview = useCallback((kind: GlobeKind) => {
    setActiveKind((current) => current === kind ? null : current);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(media.matches);
      if (media.matches) setActiveKind(null);
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const study = (kind: GlobeKind, featured = false) => <WorldStudy
    key={kind}
    world={WORLDS[kind]}
    featured={featured}
    active={activeKind === kind}
    reducedMotion={reducedMotion}
    onPreview={setActiveKind}
    onStop={stopPreview}
  />;

  return (
    <section id="worlds" className="home-worlds" aria-labelledby="home-worlds-heading">
      <div className="home-wrap">
        <header className="home-worlds__intro">
          <h2 id="home-worlds-heading">One planet.<br /> Six different worlds<span>.</span></h2>
          <p>Light it like a film. Draw it in ink. Turn it into a field of signals. Each kind has its own materials, movement and character.</p>
        </header>

        {study('cinematic', true)}

        <div className="home-worlds__signals">
          {study('dotted')}
          {study('hologram')}
        </div>

        <p className="home-worlds__rail-hint">Three more perspectives <span>Swipe to explore <span aria-hidden="true">→</span></span></p>
        <div className="home-worlds__perspectives" aria-label="Paper, Outline and Wireframe styles">
          {study('paper')}
          {study('outline')}
          {study('wireframe')}
        </div>

        <div className="home-worlds__next">
          <p>Choose the character.<br /> <strong>Then make it your world.</strong></p>
          <Link className="home-button-secondary" to="/studio">Try the kinds in Studio <span aria-hidden="true">↗</span></Link>
        </div>
        {reducedMotion && <p id="home-worlds-motion-preference" className="home-worlds__motion-preference">Your reduced-motion setting keeps these previews still.</p>}
      </div>
    </section>
  );
}
