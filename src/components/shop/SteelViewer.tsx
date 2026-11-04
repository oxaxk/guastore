import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createSteelObject, createSteelStudio } from './steelGeometry';
import './SteelViewer.css';

type View = 'front' | 'edge' | 'back';

export default function SteelViewer({ compact = false }: { compact?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const actions = useRef<{ view: (view: View) => void }>();
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [activeView, setActiveView] = useState<View>('front');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setState('fallback');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 0, 5.5);
    const environment = createSteelStudio(renderer);
    scene.environment = environment.texture;
    const product = createSteelObject();
    scene.add(product);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let targetX = 0.12;
    let targetY = -0.31;
    product.rotation.set(targetX, targetY, -0.10);
    let raf = 0;
    let disposed = false;
    let visible = true;
    const draw = () => {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      if (motion.matches) {
        product.rotation.x = targetX;
        product.rotation.y = targetY;
      } else {
        product.rotation.x += (targetX - product.rotation.x) * 0.16;
        product.rotation.y += (targetY - product.rotation.y) * 0.16;
      }
      renderer.render(scene, camera);
      if (Math.abs(targetX - product.rotation.x) + Math.abs(targetY - product.rotation.y) > 0.001) {
        raf = requestAnimationFrame(draw);
      }
    };
    const requestDraw = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(draw);
    };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < 0.82 ? 6.4 : 5.5;
      camera.updateProjectionMatrix();
      requestDraw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestDraw();
    });
    intersection.observe(host);
    document.addEventListener('visibilitychange', requestDraw);
    motion.addEventListener('change', requestDraw);
    let start: { x: number; y: number; rx: number; ry: number; id: number } | undefined;
    const down = (event: PointerEvent) => {
      if (compact || event.button !== 0) return;
      start = { x: event.clientX, y: event.clientY, rx: targetX, ry: targetY, id: event.pointerId };
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (compact) {
        const bounds = host.getBoundingClientRect();
        targetY = -0.31 + ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.55;
        targetX = 0.12 + ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.2;
      } else if (start) {
        targetY = start.ry + (event.clientX - start.x) * 0.012;
        targetX = THREE.MathUtils.clamp(start.rx + (event.clientY - start.y) * 0.008, -1.3, 1.3);
      } else return;
      requestDraw();
    };
    const up = () => { start = undefined; };
    const key = (event: KeyboardEvent) => {
      if (compact || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') targetY -= 0.18;
      if (event.key === 'ArrowRight') targetY += 0.18;
      if (event.key === 'ArrowUp') targetX = Math.max(-1.3, targetX - 0.18);
      if (event.key === 'ArrowDown') targetX = Math.min(1.3, targetX + 0.18);
      if (event.key === 'Home') { targetX = 0.12; targetY = -0.31; }
      requestDraw();
    };
    const lost = (event: Event) => { event.preventDefault(); setState('fallback'); };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('webglcontextlost', lost);
    host.addEventListener('keydown', key);
    actions.current = {
      view: view => {
        targetX = view === 'edge' ? 1.24 : 0.12;
        targetY = view === 'back' ? Math.PI - 0.31 : -0.31;
        requestDraw();
      },
    };
    resize();
    setState('ready');
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', requestDraw);
      motion.removeEventListener('change', requestDraw);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('webglcontextlost', lost);
      host.removeEventListener('keydown', key);
      actions.current = undefined;
      product.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [compact]);

  return (
    <div className={`steel-viewer ${compact ? 'steel-viewer--compact' : ''}`} data-state={state}>
      <div
        ref={hostRef}
        className="steel-viewer__canvas"
        tabIndex={compact || state !== 'ready' ? -1 : 0}
        role={compact ? undefined : 'group'}
        aria-label={compact ? undefined : 'Edelstahl Gua Sha in 3D. Mit Ziehen oder Pfeiltasten drehen. Pos1 setzt die Ansicht zurück.'}
      />
      {state !== 'ready' && <img className="steel-viewer__fallback" src="/img/steel/the-steel-studio.webp" alt="The Steel – spiegelpolierter Edelstahl Gua Sha" />}
      {!compact && state === 'ready' && (
        <div className="steel-viewer__controls">
          <span>Ziehen zum Drehen</span>
          <div aria-label="Produktperspektive">
            {(['front', 'edge', 'back'] as const).map(view => (
              <button key={view} type="button" aria-pressed={activeView === view} onClick={() => { actions.current?.view(view); setActiveView(view); }}>
                {view === 'front' ? 'Vorne' : view === 'edge' ? 'Kante' : 'Hinten'}
              </button>
            ))}
          </div>
        </div>
      )}
      {!compact && state === 'fallback' && <p className="steel-viewer__notice">Die 3D-Ansicht ist hier nicht verfügbar. Die Produktfotos kannst du weiterhin ansehen.</p>}
    </div>
  );
}
