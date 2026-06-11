import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import styled from "styled-components";
import heroEyewear from "../assets/mirage-hero-2-5d-translucent.png";

const ACTIVE_ATTR = "data-eyewear-bridge-active";

const BridgeLayer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 12;
  pointer-events: none;
  overflow: hidden;
`;

const BridgeImage = styled(motion.img)`
  position: absolute;
  left: 0;
  top: 0;
  height: auto;
  max-width: none;
  transform-origin: center;
  filter: drop-shadow(0 34px 34px rgba(6, 16, 68, 0.2))
    drop-shadow(0 9px 12px rgba(182, 144, 74, 0.14));
  will-change: transform, opacity, width;
`;

type DocRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function smoothstep(value: number) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

function toDocumentRect(rect: DOMRect): DocRect {
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

export function ScrollEyewearBridge() {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const width = useMotionValue(0);
  const rotate = useMotionValue(0);
  const opacity = useMotionValue(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    document.body.removeAttribute(ACTIVE_ATTR);

    if (shouldReduceMotion) {
      return undefined;
    }

    const start = document.querySelector<HTMLElement>("[data-eyewear-start]");
    const target = document.querySelector<HTMLElement>("[data-eyewear-drop-target]");

    if (!start || !target) {
      return undefined;
    }

    const setActive = (active: boolean) => {
      if (active) {
        document.body.setAttribute(ACTIVE_ATTR, "true");
      } else {
        document.body.removeAttribute(ACTIVE_ATTR);
      }
    };

    const update = () => {
      rafRef.current = null;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 720;
      const startDoc = toDocumentRect(start.getBoundingClientRect());
      const targetDoc = toDocumentRect(target.getBoundingClientRect());

      const startScroll = Math.max(0, startDoc.top - viewportHeight * 0.25);
      const endScroll = Math.max(
        startScroll + 1,
        targetDoc.top - viewportHeight * (isMobile ? 0.56 : 0.42),
      );
      const raw = (scrollY - startScroll) / (endScroll - startScroll);
      const progress = smoothstep(raw);

      const startWidth = startDoc.width;
      const startLeft = startDoc.left - window.scrollX;
      const startTop = startDoc.top - startScroll;
      const targetWidth = targetDoc.width;
      const targetLeft = targetDoc.left - window.scrollX;
      const targetTop = targetDoc.top - endScroll;

      const fadeIn = smoothstep((raw - 0.02) / 0.08);
      const fadeOut = 1 - smoothstep((raw - 0.9) / 0.09);
      const nextOpacity = clamp(fadeIn * fadeOut);

      x.set(lerp(startLeft, targetLeft, progress));
      y.set(lerp(startTop, targetTop, progress));
      width.set(lerp(startWidth, targetWidth, progress));
      rotate.set(lerp(0, isMobile ? -3.5 : -5.5, progress));
      opacity.set(nextOpacity);
      setActive(nextOpacity > 0.04 && raw > 0.03 && raw < 0.995);
    };

    const scheduleUpdate = () => {
      if (rafRef.current !== null) {
        return;
      }

      rafRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("load", scheduleUpdate);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("load", scheduleUpdate);
      document.body.removeAttribute(ACTIVE_ATTR);
    };
  }, [opacity, rotate, shouldReduceMotion, width, x, y]);

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <BridgeLayer aria-hidden="true">
      <BridgeImage
        src={heroEyewear}
        alt=""
        width={1689}
        height={931}
        decoding="async"
        draggable="false"
        style={{ x, y, width, rotate, opacity }}
      />
    </BridgeLayer>
  );
}
