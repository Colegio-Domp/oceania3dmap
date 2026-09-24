import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface Props {
  /** alvo no espaço do mundo */
  target: [number, number, number];
  /** distância desejada da câmera */
  dist: number;
  /** muda a cada nova seleção para disparar o voo */
  flyKey: string;
}

export function CameraRig({ target, dist, flyKey }: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const flying = useRef(false);
  const { camera } = useThree();

  const targetVec = useRef(new THREE.Vector3(...target));
  const posVec = useRef(new THREE.Vector3());

  useEffect(() => {
    targetVec.current.set(...target);
    posVec.current.set(
      target[0] + dist * 0.12,
      target[1] + dist * 0.72,
      target[2] + dist * 0.88,
    );
    flying.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyKey]);

  useFrame((_, rawDelta) => {
    if (!flying.current || !controls.current) return;
    const delta = Math.min(rawDelta, 0.05);
    const k = 1 - Math.exp(-3.2 * delta);
    camera.position.lerp(posVec.current, k);
    controls.current.target.lerp(targetVec.current, k);
    controls.current.update();
    if (
      camera.position.distanceTo(posVec.current) < 0.05 &&
      controls.current.target.distanceTo(targetVec.current) < 0.03
    ) {
      flying.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableDamping
      dampingFactor={0.08}
      minDistance={1.5}
      maxDistance={40}
      maxPolarAngle={Math.PI * 0.49}
      onStart={() => {
        flying.current = false;
      }}
    />
  );
}
