import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function HelmetModel() {
  const groupRef = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const update = () => {
      scrollRef.current = window.scrollY;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }
    groupRef.current.rotation.y = -0.35 + scrollRef.current * 0.00045 + Math.sin(clock.elapsedTime * 0.35) * 0.08;
    groupRef.current.rotation.x = -0.08 + Math.sin(clock.elapsedTime * 0.25) * 0.04;
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      <mesh castShadow receiveShadow scale={[1.05, 1.2, 0.78]} position={[0, 0.2, 0]}>
        <sphereGeometry args={[1.45, 64, 32, 0, Math.PI * 2, 0.2, Math.PI * 0.86]} />
        <meshStandardMaterial color="#2e271f" metalness={0.92} roughness={0.31} envMapIntensity={1.2} />
      </mesh>
      <mesh castShadow position={[0, -0.82, 0.55]} scale={[0.22, 1.08, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#b4742f" metalness={0.9} roughness={0.24} />
      </mesh>
      <mesh castShadow position={[-0.78, -0.48, 0.35]} rotation={[0, 0, -0.16]} scale={[0.28, 1.1, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#33291f" metalness={0.88} roughness={0.34} />
      </mesh>
      <mesh castShadow position={[0.78, -0.48, 0.35]} rotation={[0, 0, 0.16]} scale={[0.28, 1.1, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#33291f" metalness={0.88} roughness={0.34} />
      </mesh>
      <mesh castShadow position={[0, 1.78, -0.08]} rotation={[0, 0, 0]} scale={[0.22, 1.7, 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5a2417" metalness={0.25} roughness={0.74} />
      </mesh>
      <mesh castShadow position={[0, 1.42, -0.08]} rotation={[Math.PI / 2, 0, 0]} scale={[0.75, 0.22, 0.2]}>
        <torusGeometry args={[1, 0.05, 16, 72, Math.PI]} />
        <meshStandardMaterial color="#b4742f" metalness={0.85} roughness={0.26} />
      </mesh>
      <mesh position={[0, -0.1, 0.9]} scale={[0.9, 0.55, 0.06]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#080706" metalness={0.35} roughness={0.58} />
      </mesh>
    </group>
  );
}

function HelmetFallback() {
  return (
    <div className="helmet-fallback" aria-hidden="true">
      <span />
    </div>
  );
}

export function SpartanHelmet() {
  const [useCanvas, setUseCanvas] = useState(() =>
    window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const updateCanvasPreference = () => setUseCanvas(media.matches);
    media.addEventListener("change", updateCanvasPreference);
    return () => media.removeEventListener("change", updateCanvasPreference);
  }, []);

  if (!useCanvas) {
    return <HelmetFallback />;
  }

  return (
    <div className="helmet-canvas" aria-label="Capacete espartano em 3D">
      <HelmetFallback />
      <Canvas
        camera={{ position: [0, 0.2, 5.2], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl, scene }) => {
          scene.background = null;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.42} />
        <directionalLight position={[2.8, 3.8, 2.4]} intensity={3.2} castShadow color="#f2b35e" />
        <pointLight position={[-2.8, -1.2, 1.5]} intensity={1.7} color="#d94f2d" />
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.32}>
          <HelmetModel />
        </Float>
        <Sparkles count={42} speed={0.2} size={2.2} color="#d9792b" scale={[4, 3, 2]} />
      </Canvas>
    </div>
  );
}
