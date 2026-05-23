import { useEffect, useRef, useState } from 'react';
import airplaneIcon from '../../airplane.svg';

type CursorState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  targetAngle: number;
  scale: number;
};

type TrailPoint = {
  id: number;
  x: number;
  y: number;
};

const clickableSelector =
  "a, button, input, textarea, select, [role='button'], [data-cursor='pointer']";

const normalizeAngleDelta = (current: number, target: number) => {
  return ((((target - current) % 360) + 540) % 360) - 180;
};

export function PlaneCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const hasCursorMovedRef = useRef(false);
  const trailIdRef = useRef(0);
  const lastTrailRef = useRef({ x: 0, y: 0, time: 0 });
  const stateRef = useRef<CursorState>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    angle: 0,
    targetAngle: 0,
    scale: 1,
  });

  const [enabled, setEnabled] = useState(false);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouchDevice || prefersReducedMotion) {
      return;
    }

    setEnabled(true);
    document.body.classList.add('has-plane-cursor');

    const handleMouseMove = (event: MouseEvent) => {
      if (!hasCursorMovedRef.current) {
        hasCursorMovedRef.current = true;
        cursorRef.current?.classList.add('is-visible');
      }

      const state = stateRef.current;
      const dx = event.clientX - state.targetX;
      const dy = event.clientY - state.targetY;

      state.targetX = event.clientX;
      state.targetY = event.clientY;

      if (Math.hypot(dx, dy) > 4) {
        state.targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      }

      const target = event.target;

      if (target instanceof Element) {
        state.scale = target.closest(clickableSelector) ? 1.35 : 1;
      }

      const now = performance.now();
      const trail = lastTrailRef.current;
      const distance = Math.hypot(event.clientX - trail.x, event.clientY - trail.y);

      if (distance > 16 || now - trail.time > 90) {
        const id = trailIdRef.current;
        trailIdRef.current += 1;
        lastTrailRef.current = { x: event.clientX, y: event.clientY, time: now };

        setTrailPoints((current) => [...current.slice(-18), { id, x: event.clientX, y: event.clientY }]);

        window.setTimeout(() => {
          setTrailPoints((current) => current.filter((point) => point.id !== id));
        }, 1600);
      }
    };

    const animate = () => {
      const state = stateRef.current;

      state.x += (state.targetX - state.x) * 0.18;
      state.y += (state.targetY - state.y) * 0.18;
      state.angle += normalizeAngleDelta(state.angle, state.targetAngle) * 0.14;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%) rotate(${state.angle}deg) scale(${state.scale})`;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.classList.remove('has-plane-cursor');
      setTrailPoints([]);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div className="plane-cursor-trail-layer" aria-hidden="true">
        {trailPoints.map((point) => (
          <span
            className="plane-cursor-trail-dot"
            key={point.id}
            style={{ left: point.x, top: point.y }}
          />
        ))}
      </div>
      <div ref={cursorRef} className="plane-cursor" aria-hidden="true">
        <img src={airplaneIcon} alt="" />
      </div>
    </>
  );
}
