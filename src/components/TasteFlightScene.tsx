import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ThreeModule = typeof import('three');
type ThreeMaterial = import('three').Material;
type ThreeMesh = import('three').Mesh;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getFlightPoint = (THREE: ThreeModule, progress: number, spanX = 4.8) => {
  const p = clamp(progress, 0, 1);
  const x = spanX - p * spanX * 2;
  const y = -0.56 + Math.sin(p * Math.PI * 1.04) * 0.22 + Math.sin(p * Math.PI * 2) * 0.04;
  const z = -1.08 + Math.sin((p - 0.12) * Math.PI) * 0.72;

  return new THREE.Vector3(x, y, z);
};

const getFlightTangent = (THREE: ThreeModule, progress: number, spanX: number, range = 0.026) => {
  const before = getFlightPoint(THREE, clamp(progress - range, 0, 1), spanX);
  const after = getFlightPoint(THREE, clamp(progress + range, 0, 1), spanX);
  const tangent = after.sub(before);

  if (tangent.lengthSq() === 0) {
    tangent.set(-1, 0, 0);
  }

  return tangent.normalize();
};

const getTurnAmount = (THREE: ThreeModule, progress: number, spanX: number, range = 0.07) => {
  const current = getFlightPoint(THREE, progress, spanX);
  const before = getFlightPoint(THREE, clamp(progress - range, 0, 1), spanX);
  const after = getFlightPoint(THREE, clamp(progress + range, 0, 1), spanX);
  const previousDirection = current.clone().sub(before);
  const nextDirection = after.sub(current);

  if (previousDirection.lengthSq() === 0 || nextDirection.lengthSq() === 0) {
    return 0;
  }

  return previousDirection.normalize().cross(nextDirection.normalize()).y;
};

const makeMaterial = (
  THREE: ThreeModule,
  color: string,
  roughness = 0.42,
  metalness = 0.06,
  opacity = 1,
) =>
  new THREE.MeshStandardMaterial({
    color,
    metalness,
    opacity,
    roughness,
    transparent: opacity < 1,
  });

function createTriangleGeometry(
  THREE: ThreeModule,
  a: import('three').Vector3,
  b: import('three').Vector3,
  c: import('three').Vector3,
) {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z], 3),
  );
  geometry.computeVertexNormals();

  return geometry;
}

function createFoldLine(
  THREE: ThreeModule,
  start: import('three').Vector3,
  end: import('three').Vector3,
  radius: number,
  material: ThreeMaterial,
) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const fold = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), material);

  fold.position.copy(start).add(end).multiplyScalar(0.5);
  fold.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

  return fold;
}

function createPlane(THREE: ThreeModule) {
  const group = new THREE.Group();
  const paper = makeMaterial(THREE, '#fbfdff', 0.58, 0.01);
  const paperCool = makeMaterial(THREE, '#d8eef8', 0.62, 0.01);
  const paperShadow = makeMaterial(THREE, '#9fc7d5', 0.7, 0.01);
  const foldMaterial = makeMaterial(THREE, '#ffffff', 0.5, 0, 0.72);
  const accent = makeMaterial(THREE, '#12d2c8', 0.48, 0.02, 0.8);
  paper.side = THREE.DoubleSide;
  paperCool.side = THREE.DoubleSide;
  paperShadow.side = THREE.DoubleSide;
  accent.side = THREE.DoubleSide;

  const nose = new THREE.Vector3(1.72, 0.02, 0);
  const spineRear = new THREE.Vector3(-1.18, 0.12, 0);
  const tailLeft = new THREE.Vector3(-1.02, -0.16, -1.28);
  const tailRight = new THREE.Vector3(-1.02, -0.16, 1.28);
  const lowerLeft = new THREE.Vector3(-1.12, -0.34, -0.2);
  const lowerRight = new THREE.Vector3(-1.12, -0.34, 0.2);
  const foldLeft = new THREE.Vector3(-0.24, -0.05, -0.46);
  const foldRight = new THREE.Vector3(-0.24, -0.05, 0.46);

  const leftWing = new THREE.Mesh(createTriangleGeometry(THREE, nose, spineRear, tailLeft), paper);
  const rightWing = new THREE.Mesh(createTriangleGeometry(THREE, nose, tailRight, spineRear), paperCool);
  const leftUnderFold = new THREE.Mesh(createTriangleGeometry(THREE, nose, tailLeft, lowerLeft), paperCool);
  const rightUnderFold = new THREE.Mesh(createTriangleGeometry(THREE, nose, lowerRight, tailRight), paper);
  const keelLeft = new THREE.Mesh(createTriangleGeometry(THREE, nose, lowerLeft, spineRear), paperShadow);
  const keelRight = new THREE.Mesh(createTriangleGeometry(THREE, nose, spineRear, lowerRight), paperShadow);
  const leftInnerCrease = new THREE.Mesh(createTriangleGeometry(THREE, nose, foldLeft, tailLeft), paperShadow);
  const rightInnerCrease = new THREE.Mesh(createTriangleGeometry(THREE, nose, tailRight, foldRight), paperShadow);

  group.add(
    leftWing,
    rightWing,
    leftUnderFold,
    rightUnderFold,
    keelLeft,
    keelRight,
    leftInnerCrease,
    rightInnerCrease,
    createFoldLine(THREE, nose, spineRear, 0.018, foldMaterial),
    createFoldLine(THREE, nose, tailLeft, 0.012, foldMaterial),
    createFoldLine(THREE, nose, tailRight, 0.012, foldMaterial.clone()),
  );

  const tailAccent = new THREE.Mesh(
    createTriangleGeometry(
      THREE,
      new THREE.Vector3(-0.98, -0.13, -1.22),
      new THREE.Vector3(-0.68, -0.08, -0.62),
      new THREE.Vector3(-0.98, -0.24, -0.34),
    ),
    accent,
  );
  const tailAccentMirror = new THREE.Mesh(
    createTriangleGeometry(
      THREE,
      new THREE.Vector3(-0.98, -0.13, 1.22),
      new THREE.Vector3(-0.98, -0.24, 0.34),
      new THREE.Vector3(-0.68, -0.08, 0.62),
    ),
    accent.clone(),
  );
  group.add(tailAccent, tailAccentMirror);

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  group.scale.setScalar(0.96);
  return group;
}

function createTrailGeometry(THREE: ThreeModule, spanX: number) {
  const points = Array.from({ length: 120 }, (_, index) => getFlightPoint(THREE, index / 119, spanX));
  const curve = new THREE.CatmullRomCurve3(points);

  return new THREE.TubeGeometry(curve, 180, 0.012, 8, false);
}

function createTrail(THREE: ThreeModule, spanX: number) {
  const geometry = createTrailGeometry(THREE, spanX);
  const material = new THREE.MeshBasicMaterial({
    color: '#12d2c8',
    opacity: 0.18,
    transparent: true,
  });

  return new THREE.Mesh(geometry, material);
}

export function TasteFlightScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flightRef = useRef({ glow: 0.42, progress: 0 });

  useGSAP(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      flightRef.current.progress = 0.58;
      return;
    }

    gsap.to(flightRef.current, {
      glow: 1,
      progress: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.taste-desire',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.15,
      },
    });

    gsap.fromTo(
      '.taste-flight-scene',
      { opacity: 0.42 },
      {
        opacity: 0.64,
        ease: 'none',
        scrollTrigger: {
          trigger: '.taste-desire',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      },
    );
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
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

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0.28, 7.6);

      scene.add(new THREE.AmbientLight('#dffbff', 1.45));

      const keyLight = new THREE.DirectionalLight('#ffffff', 3.8);
      keyLight.position.set(3.6, 4.4, 5.5);
      scene.add(keyLight);

      const rimLight = new THREE.PointLight('#12d2c8', 2.1, 9);
      rimLight.position.set(-2.5, -0.6, 2.4);
      scene.add(rimLight);

      let flightSpanX = 4.8;
      const plane = createPlane(THREE);
      const trail = createTrail(THREE, flightSpanX);
      scene.add(trail);
      scene.add(plane);

      const forwardAxis = new THREE.Vector3(1, 0, 0);
      const worldUp = new THREE.Vector3(0, 1, 0);
      const xAxis = new THREE.Vector3();
      const yAxis = new THREE.Vector3();
      const zAxis = new THREE.Vector3();
      const orientationMatrix = new THREE.Matrix4();
      const rollQuaternion = new THREE.Quaternion();

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        const distanceToRoute = Math.abs(camera.position.z - -0.78);
        const halfViewportHeight =
          Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distanceToRoute;
        const visibleHalfWidth = halfViewportHeight * camera.aspect;
        const edgePadding = width < 700 ? 0.46 : 0.72;
        const nextFlightSpanX = Math.max(width < 700 ? 1.95 : 3.85, visibleHalfWidth + edgePadding);

        if (Math.abs(nextFlightSpanX - flightSpanX) > 0.08) {
          flightSpanX = nextFlightSpanX;
          const nextGeometry = createTrailGeometry(THREE, flightSpanX);
          trail.geometry.dispose();
          trail.geometry = nextGeometry;
        }
      };

      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();

      let renderedProgress = flightRef.current.progress;

      const animate = () => {
        const targetProgress = flightRef.current.progress;
        renderedProgress += (targetProgress - renderedProgress) * 0.085;

        const point = getFlightPoint(THREE, renderedProgress, flightSpanX);
        const tangent = getFlightTangent(THREE, renderedProgress, flightSpanX);
        const turnAmount = getTurnAmount(THREE, renderedProgress, flightSpanX);
        const bankAngle = clamp(-turnAmount * 1.85, -0.52, 0.52);
        const responsiveScale = canvas.clientWidth < 700 ? 0.3 : 0.54;

        plane.position.copy(point);
        xAxis.copy(tangent);
        yAxis.copy(worldUp).addScaledVector(xAxis, -worldUp.dot(xAxis));

        if (yAxis.lengthSq() < 0.0001) {
          yAxis.set(0, 0, 1);
        }

        yAxis.normalize();
        zAxis.crossVectors(xAxis, yAxis).normalize();
        yAxis.crossVectors(zAxis, xAxis).normalize();
        orientationMatrix.makeBasis(xAxis, yAxis, zAxis);
        plane.quaternion.setFromRotationMatrix(orientationMatrix);
        rollQuaternion.setFromAxisAngle(forwardAxis, bankAngle);
        plane.quaternion.multiply(rollQuaternion);
        plane.scale.setScalar(responsiveScale + Math.sin(renderedProgress * Math.PI) * 0.1);

        rimLight.intensity = 1.5 + flightRef.current.glow * 1.2;
        trail.rotation.z = Math.sin(renderedProgress * Math.PI) * 0.025;

        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(animate);
      };

      frame = window.requestAnimationFrame(animate);

      cleanupScene = () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        trail.geometry.dispose();
        disposeMaterial(trail.material);

        plane.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mesh = child as ThreeMesh;
            mesh.geometry.dispose();
            disposeMaterial(mesh.material);
          }
        });

        renderer.dispose();
      };
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      cleanupScene?.();
    };
  }, []);

  return (
    <div className="taste-flight-scene" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
