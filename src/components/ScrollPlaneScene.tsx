import { useEffect, useRef } from 'react';

type ThreeModule = typeof import('three');
type ThreeMaterial = import('three').Material;
type ThreeMesh = import('three').Mesh;

type ScrollPlaneSceneProps = {
  activeIndex: number;
  progress: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getFlightPoint = (THREE: ThreeModule, progress: number) => {
  const p = clamp(progress, 0, 1);
  const x = -4.2 + p * 8.4;
  const y = 0.6 + Math.sin(p * Math.PI * 1.4) * 0.9 - p * 0.3;
  const z = Math.sin(p * Math.PI * 2.1) * 0.82 - 0.28;

  return new THREE.Vector3(x, y, z);
};

const makeMaterial = (THREE: ThreeModule, color: string, roughness = 0.42, metalness = 0.04) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function createPlane(THREE: ThreeModule) {
  const group = new THREE.Group();
  const body = makeMaterial(THREE, '#f8fdff', 0.38, 0.08);
  const shadow = makeMaterial(THREE, '#c9e8ed', 0.5, 0.02);
  const teal = makeMaterial(THREE, '#10c9c3', 0.34, 0.08);
  const ink = makeMaterial(THREE, '#102235', 0.42, 0.02);

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.85, 28), body);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;
  group.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 28), body);
  nose.position.x = 1.12;
  nose.rotation.z = -Math.PI / 2;
  nose.castShadow = true;
  group.add(nose);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.32, 24), shadow);
  tail.position.x = -1.05;
  tail.rotation.z = Math.PI / 2;
  tail.castShadow = true;
  group.add(tail);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 1.85), teal);
  wing.position.set(-0.06, -0.02, 0);
  wing.rotation.y = -0.12;
  wing.castShadow = true;
  group.add(wing);

  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.88), teal);
  tailWing.position.set(-0.86, 0.05, 0);
  tailWing.rotation.y = 0.16;
  group.add(tailWing);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.05), teal);
  fin.position.set(-0.9, 0.26, 0);
  fin.rotation.z = -0.2;
  group.add(fin);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), ink);
  cockpit.scale.set(1.55, 0.42, 0.72);
  cockpit.position.set(0.72, 0.16, 0);
  group.add(cockpit);

  const engineLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 18), shadow);
  engineLeft.rotation.x = Math.PI / 2;
  engineLeft.position.set(0.18, -0.12, -0.58);
  group.add(engineLeft);

  const engineRight = engineLeft.clone();
  engineRight.position.z = 0.58;
  group.add(engineRight);

  group.scale.setScalar(0.62);
  return group;
}

function createTrail(THREE: ThreeModule) {
  const points = Array.from({ length: 90 }, (_, index) => getFlightPoint(THREE, index / 89));
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 120, 0.018, 8, false);
  const material = new THREE.MeshBasicMaterial({
    color: '#10c9c3',
    opacity: 0.2,
    transparent: true,
  });

  return new THREE.Mesh(geometry, material);
}

export function ScrollPlaneScene({ activeIndex, progress }: ScrollPlaneSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress);
  const activeRef = useRef(activeIndex);

  useEffect(() => {
    progressRef.current = progress;
    activeRef.current = activeIndex;
  }, [activeIndex, progress]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      return undefined;
    }

    let cleanupScene: (() => void) | undefined;
    let cancelled = false;
    let frame = 0;

    const disposeMaterial = (material: ThreeMaterial | ThreeMaterial[]) => {
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else {
        material.dispose();
      }
    };

    void import('three').then((THREE) => {
      if (cancelled) {
        return;
      }

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.8, 8.2);

      scene.add(new THREE.AmbientLight('#ffffff', 1.5));

      const keyLight = new THREE.DirectionalLight('#ffffff', 3.2);
      keyLight.position.set(3, 4, 5);
      scene.add(keyLight);

      const tealLight = new THREE.PointLight('#10c9c3', 1.4, 9);
      tealLight.position.set(-2, -0.4, 2);
      scene.add(tealLight);

      const plane = createPlane(THREE);
      const trail = createTrail(THREE);
      scene.add(trail);
      scene.add(plane);

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();

      let lastProgress = progressRef.current;

      const animate = () => {
        const targetProgress = progressRef.current;
        lastProgress += (targetProgress - lastProgress) * 0.08;

        const current = getFlightPoint(THREE, lastProgress);
        const next = getFlightPoint(THREE, clamp(lastProgress + 0.012, 0, 1));
        const delta = next.sub(current);

        plane.position.copy(current);
        plane.rotation.y = -Math.atan2(delta.z, delta.x);
        plane.rotation.z = -0.2 + Math.sin(lastProgress * Math.PI * 1.15) * 0.34;
        plane.rotation.x = 0.1 + Math.cos(lastProgress * Math.PI * 1.8) * 0.16;
        plane.scale.setScalar(0.62 + activeRef.current * 0.012);

        trail.rotation.z = Math.sin(lastProgress * Math.PI) * 0.035;
        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(animate);
      };

      frame = window.requestAnimationFrame(animate);

      cleanupScene = () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        renderer.dispose();
        trail.geometry.dispose();
        disposeMaterial(trail.material);

        plane.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mesh = child as ThreeMesh;
            mesh.geometry.dispose();
            disposeMaterial(mesh.material);
          }
        });
      };
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      cleanupScene?.();
    };
  }, []);

  return (
    <div className="why-plane-scene" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
