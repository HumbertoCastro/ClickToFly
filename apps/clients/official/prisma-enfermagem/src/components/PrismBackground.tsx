import { useEffect, useMemo, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';

type AnimationType = 'rotate' | 'hover' | '3drotate';

export type PrismBackgroundProps = {
  height?: number;
  baseWidth?: number;
  animationType?: AnimationType;
  glow?: number;
  offset?: { x?: number; y?: number };
  noise?: number;
  transparent?: boolean;
  scale?: number;
  colorFrequency?: number;
  hoverStrength?: number;
  inertia?: number;
  bloom?: number;
  suspendWhenOffscreen?: boolean;
  timeScale?: number;
  colors?: [string, string, string, string];
  className?: string;
};

const defaultColors: [string, string, string, string] = ['#062f45', '#0b7c9d', '#25d4e6', '#73c98f'];

function hexToRgb(hex: string) {
  const value = hex.replace('#', '').trim();
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
  const int = Number.parseInt(full, 16);

  if (Number.isNaN(int)) {
    return [1, 1, 1] as const;
  }

  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255] as const;
}

function setMat3FromEuler(yawY: number, pitchX: number, rollZ: number, out: Float32Array) {
  const cy = Math.cos(yawY);
  const sy = Math.sin(yawY);
  const cx = Math.cos(pitchX);
  const sx = Math.sin(pitchX);
  const cz = Math.cos(rollZ);
  const sz = Math.sin(rollZ);

  const r00 = cy * cz + sy * sx * sz;
  const r01 = -cy * sz + sy * sx * cz;
  const r02 = sy * cx;
  const r10 = cx * sz;
  const r11 = cx * cz;
  const r12 = -sx;
  const r20 = -sy * cz + cy * sx * sz;
  const r21 = sy * sz + cy * sx * cz;
  const r22 = cy * cx;

  out[0] = r00;
  out[1] = r10;
  out[2] = r20;
  out[3] = r01;
  out[4] = r11;
  out[5] = r21;
  out[6] = r02;
  out[7] = r12;
  out[8] = r22;

  return out;
}

export default function PrismBackground({
  height = 3.5,
  baseWidth = 5.5,
  animationType = 'rotate',
  glow = 1,
  offset = { x: 0, y: 0 },
  noise = 0.35,
  transparent = true,
  scale = 3.6,
  colorFrequency = 1,
  hoverStrength = 1.6,
  inertia = 0.06,
  bloom = 1,
  suspendWhenOffscreen = true,
  timeScale = 0.45,
  colors = defaultColors,
  className = '',
}: PrismBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const colorUniforms = useMemo(() => colors.map(hexToRgb), [colors]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prismHeight = Math.max(0.001, height);
    const prismBaseWidth = Math.max(0.001, baseWidth);
    const baseHalf = prismBaseWidth * 0.5;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const renderer = new Renderer({ dpr, alpha: transparent, antialias: false });
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    } satisfies Partial<CSSStyleDeclaration>);

    container.appendChild(canvas);

    const vertex = /* glsl */ `
      attribute vec2 position;

      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;

      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHeight;
      uniform mat3 uRot;
      uniform int uUseBaseWobble;
      uniform float uGlow;
      uniform vec2 uOffsetPx;
      uniform float uNoise;
      uniform float uScale;
      uniform float uColorFreq;
      uniform float uBloom;
      uniform float uCenterShift;
      uniform float uInvBaseHalf;
      uniform float uInvHeight;
      uniform float uMinAxis;
      uniform float uPxScale;
      uniform float uTimeScale;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform vec3 uColorD;

      vec4 tanh4(vec4 x) {
        vec4 e2x = exp(2.0 * x);
        return (e2x - 1.0) / (e2x + 1.0);
      }

      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float sdOctaAnisoInv(vec3 p) {
        vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
        float m = q.x + q.y + q.z - 1.0;
        return m * uMinAxis * 0.5773502691896258;
      }

      float sdPyramidUpInv(vec3 p) {
        float oct = sdOctaAnisoInv(p);
        float halfSpace = -p.y;
        return max(oct, halfSpace);
      }

      void main() {
        vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;
        float z = 5.0;
        float d = 0.0;
        vec3 p;
        vec4 o = vec4(0.0);

        mat2 wob = mat2(1.0);
        if (uUseBaseWobble == 1) {
          float t = iTime * uTimeScale;
          float c0 = cos(t);
          float c1 = cos(t + 33.0);
          float c2 = cos(t + 11.0);
          wob = mat2(c0, c1, c2, c0);
        }

        const int STEPS = 100;
        for (int i = 0; i < STEPS; i++) {
          p = vec3(f, z);
          p.xz = p.xz * wob;
          p = uRot * p;
          vec3 q = p;
          q.y += uCenterShift;
          d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
          z -= d;
          o += (sin((p.y + z) * uColorFreq + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
        }

        o = tanh4(o * o * (uGlow * uBloom) / 1e5);

        float energy = clamp(dot(o.rgb, vec3(0.34)), 0.0, 1.0);
        vec3 deep = mix(uColorA, uColorB, smoothstep(0.08, 0.92, o.r));
        vec3 bright = mix(uColorC, uColorD, smoothstep(0.14, 0.86, o.g));
        vec3 col = mix(deep, bright, smoothstep(0.2, 0.92, energy));
        col *= 0.58 + energy * 1.45;

        float n = rand(gl_FragCoord.xy + vec2(iTime));
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);

        float alpha = clamp(o.a * 0.72 + energy * 0.28, 0.08, 0.9);
        gl_FragColor = vec4(col, alpha);
      }
    `;

    const iResBuf = new Float32Array(2);
    const offsetPxBuf = new Float32Array(2);
    const rotBuf = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: iResBuf },
        iTime: { value: 0 },
        uHeight: { value: prismHeight },
        uUseBaseWobble: { value: animationType === 'rotate' ? 1 : 0 },
        uRot: { value: rotBuf },
        uGlow: { value: Math.max(0, glow) },
        uOffsetPx: { value: offsetPxBuf },
        uNoise: { value: Math.max(0, noise) },
        uScale: { value: Math.max(0.001, scale) },
        uColorFreq: { value: Math.max(0.001, colorFrequency) },
        uBloom: { value: Math.max(0, bloom) },
        uCenterShift: { value: prismHeight * 0.25 },
        uInvBaseHalf: { value: 1 / baseHalf },
        uInvHeight: { value: 1 / prismHeight },
        uMinAxis: { value: Math.min(baseHalf, prismHeight) },
        uPxScale: { value: 1 },
        uTimeScale: { value: Math.max(0, timeScale) },
        uColorA: { value: colorUniforms[0] },
        uColorB: { value: colorUniforms[1] },
        uColorC: { value: colorUniforms[2] },
        uColorD: { value: colorUniforms[3] },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const width = container.clientWidth || 1;
      const sizeHeight = container.clientHeight || 1;
      renderer.setSize(width, sizeHeight);
      iResBuf[0] = gl.drawingBufferWidth;
      iResBuf[1] = gl.drawingBufferHeight;
      offsetPxBuf[0] = (offset?.x ?? 0) * dpr;
      offsetPxBuf[1] = (offset?.y ?? 0) * dpr;
      program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * Math.max(0.001, scale));
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const random = () => Math.random();
    const wX = 0.3 + random() * 0.6;
    const wY = 0.2 + random() * 0.7;
    const wZ = 0.1 + random() * 0.5;
    const phX = random() * Math.PI * 2;
    const phZ = random() * Math.PI * 2;

    let raf = 0;
    let yaw = 0;
    let pitch = 0;
    let roll = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    const t0 = performance.now();
    const pointer = { x: 0, y: 0, inside: true };
    const smoothness = Math.max(0, Math.min(1, inertia));

    const startRAF = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const stopRAF = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (event: PointerEvent) => {
      const viewportWidth = Math.max(1, window.innerWidth);
      const viewportHeight = Math.max(1, window.innerHeight);
      pointer.x = Math.max(-1, Math.min(1, (event.clientX - viewportWidth * 0.5) / (viewportWidth * 0.5)));
      pointer.y = Math.max(-1, Math.min(1, (event.clientY - viewportHeight * 0.5) / (viewportHeight * 0.5)));
      pointer.inside = true;
      startRAF();
    };

    const onLeave = () => {
      pointer.inside = false;
    };

    if (animationType === 'hover') {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('mouseleave', onLeave);
      window.addEventListener('blur', onLeave);
    }

    function render(now: number) {
      const time = (now - t0) * 0.001;
      const timeScaled = time * Math.max(0, timeScale);
      program.uniforms.iTime.value = time;

      if (animationType === 'hover') {
        const max = 0.6 * Math.max(0.1, hoverStrength);
        targetYaw = (pointer.inside ? -pointer.x : 0) * max;
        targetPitch = (pointer.inside ? pointer.y : 0) * max;
        yaw += (targetYaw - yaw) * smoothness;
        pitch += (targetPitch - pitch) * smoothness;
        roll += (0 - roll) * 0.1;
      } else if (animationType === '3drotate') {
        yaw = timeScaled * wY;
        pitch = Math.sin(timeScaled * wX + phX) * 0.6;
        roll = Math.sin(timeScaled * wZ + phZ) * 0.5;
      } else {
        yaw = 0;
        pitch = 0;
        roll = 0;
      }

      program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(render);
    }

    let io: IntersectionObserver | undefined;
    if (suspendWhenOffscreen) {
      io = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) startRAF();
        else stopRAF();
      });
      io.observe(container);
      startRAF();
    } else {
      startRAF();
    }

    return () => {
      stopRAF();
      ro.disconnect();
      io?.disconnect();
      if (animationType === 'hover') {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('blur', onLeave);
      }
      if (canvas.parentElement === container) container.removeChild(canvas);
    };
  }, [
    animationType,
    baseWidth,
    bloom,
    colorFrequency,
    colorUniforms,
    glow,
    height,
    hoverStrength,
    inertia,
    noise,
    offset?.x,
    offset?.y,
    scale,
    suspendWhenOffscreen,
    timeScale,
    transparent,
  ]);

  return <div ref={containerRef} className={`prism-background ${className}`} aria-hidden="true" />;
}
