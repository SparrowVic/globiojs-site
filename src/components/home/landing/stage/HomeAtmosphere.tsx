import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GlobeKind, ThemePresetName } from '@globiojs/core';
import { paintAtmosphere, type AtmosphereMode, type AtmosphereScene } from './atmosphere-painter';

interface AtmosphereContextValue extends AtmosphereScene {
  paused: boolean;
  setWorld: (kind: GlobeKind, theme: ThemePresetName) => void;
  setMode: (mode: AtmosphereMode) => void;
  setPaused: (paused: boolean) => void;
}
const AtmosphereContext = createContext<AtmosphereContextValue | null>(null);
export function useHomeAtmosphere() {
  const value = useContext(AtmosphereContext);
  if (!value) throw new Error('Home atmosphere requires its provider.');
  return value;
}
export function HomeAtmosphereProvider({ children }: { children: ReactNode }) {
  const [world, setWorld] = useState<{kind: GlobeKind; theme: ThemePresetName}>({ kind: 'cinematic', theme: 'cinematic-night' });
  const [mode, setMode] = useState<AtmosphereMode>('nebula');
  const [paused, setPaused] = useState(false);
  const value = useMemo(() => ({ ...world, mode, paused, setMode, setPaused,
    setWorld: (kind: GlobeKind, theme: ThemePresetName) => setWorld((previous) => previous.kind === kind && previous.theme === theme ? previous : {kind, theme}),
  }), [world, mode, paused]);
  return <AtmosphereContext.Provider value={value}>{children}</AtmosphereContext.Provider>;
}
export function HomeAtmosphere() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useHomeAtmosphere();
  const latest = useRef(scene); latest.current = scene;
  const time = useRef(0);
  const cursor = useRef({ x: 0, y: 0 });
  const previousKey = useRef('');
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d', { alpha: false });
    if (!element || !context) return;
    const previous = document.createElement('canvas');
    previous.width = element.width; previous.height = element.height;
    previous.getContext('2d')?.drawImage(element, 0, 0);
    const key = `${scene.kind}:${scene.theme}:${scene.mode}`;
    const transitionStart = previousKey.current && previousKey.current !== key ? performance.now() : -Infinity;
    previousKey.current = key;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = cursor.current, target = { ...pointer };
    let frame = 0, width = 1, height = 1, last = 0;
    const draw = (now: number) => {
      frame = 0;
      if (document.hidden) return;
      const delta = Math.min(100, now - last);
      const moving = !reduced.matches && !latest.current.paused && latest.current.mode !== 'clear';
      if (delta >= 45 || !moving) {
        last = now;
        if (moving) time.current += delta / 1000;
        if (moving) { pointer.x += (target.x - pointer.x) * 0.035; pointer.y += (target.y - pointer.y) * 0.035; }
        paintAtmosphere(context, width, height, latest.current, time.current, reduced.matches ? { x: 0, y: 0 } : pointer);
        const fade = reduced.matches ? 0 : Math.max(0, 1 - (now - transitionStart) / 850);
        if (fade > 0 && previous.width > 0 && previous.height > 0) {
          context.save(); context.globalAlpha = fade;
          context.drawImage(previous, 0, 0, width, height); context.restore();
        }
      }
      if (moving || (!reduced.matches && now - transitionStart < 850)) frame = requestAnimationFrame(draw);
    };
    const start = () => { cancelAnimationFrame(frame); last = 0; frame = requestAnimationFrame(draw); };
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth; height = window.innerHeight;
      element.width = Math.round(width * ratio); element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0); start();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      target.x = event.clientX / width * 2 - 1; target.y = event.clientY / height * 2 - 1;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', start);
    return () => {
      cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', move);
      document.removeEventListener('visibilitychange', start); reduced.removeEventListener('change', start);
    };
  }, [scene.kind, scene.theme, scene.mode, scene.paused]);
  return <div className="home-atmosphere" data-world={scene.kind} data-backdrop={scene.mode} aria-hidden="true"><canvas ref={canvas} /></div>;
}
