import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  LAT_MAX,
  LAT_MIN,
  LON_MAX,
  LON_MIN,
  SCALE,
  type LayerId,
  type Sample,
  latToZ,
  layerColor,
  lonToX,
  sampleTerrain,
  seaLevel,
} from "@/lib/oceania";

const COLS = 200;
const ROWS = 164;

interface TerrainProps {
  layer: LayerId;
  timeline: number;
}

export function Terrain({ layer, timeline }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, samples, lats } = useMemo(() => {
    const positions = new Float32Array(COLS * ROWS * 3);
    const colors = new Float32Array(COLS * ROWS * 3);
    const samples: Sample[] = new Array(COLS * ROWS);
    const lats: number[] = new Array(COLS * ROWS);

    for (let j = 0; j < ROWS; j++) {
      const lat = LAT_MIN + ((LAT_MAX - LAT_MIN) * j) / (ROWS - 1);
      for (let i = 0; i < COLS; i++) {
        const lon = LON_MIN + ((LON_MAX - LON_MIN) * i) / (COLS - 1);
        const idx = j * COLS + i;
        const s = sampleTerrain(lon, lat);
        samples[idx] = s;
        lats[idx] = lat;
        positions[idx * 3] = lonToX(lon);
        positions[idx * 3 + 1] = s.h;
        positions[idx * 3 + 2] = latToZ(lat);
      }
    }

    const indices: number[] = [];
    for (let j = 0; j < ROWS - 1; j++) {
      for (let i = 0; i < COLS - 1; i++) {
        const a = j * COLS + i;
        const b = a + 1;
        const c = a + COLS;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return { geometry, samples, lats };
  }, []);

  // recolore a maquete quando a camada ou a época muda
  useMemo(() => {
    const attr = geometry.getAttribute("color") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let idx = 0; idx < samples.length; idx++) {
      const c = layerColor(layer, samples[idx]!, lats[idx]!, timeline);
      arr[idx * 3] = c[0];
      arr[idx * 3 + 1] = c[1];
      arr[idx * 3 + 2] = c[2];
    }
    attr.needsUpdate = true;
  }, [geometry, samples, lats, layer, timeline]);

  // exagero vertical suave por camada
  const targetScale = layer === "relief" ? 1.25 : layer === "ocean" ? 1 : 0.8;
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const k = 1 - Math.exp(-5 * Math.min(delta, 0.05));
    mesh.scale.y += (targetScale - mesh.scale.y) * k;
  });

  const sea = seaLevel(timeline);
  const oceanMode = layer === "ocean";

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* lâmina de água */}
      <mesh position={[0, sea, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry
          args={[(LON_MAX - LON_MIN) * SCALE, (LAT_MAX - LAT_MIN) * SCALE]}
        />
        <meshStandardMaterial
          color={oceanMode ? "#0a3a52" : "#0b3550"}
          transparent
          opacity={oceanMode ? 0.12 : 0.62}
          roughness={0.15}
          metalness={0.6}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
