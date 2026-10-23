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

const COLS = 300;
const ROWS = 244;

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
    const normals = geometry.getAttribute("normal").array as Float32Array;
    for (let idx = 0; idx < samples.length; idx++) {
      const c = layerColor(layer, samples[idx]!, lats[idx]!, timeline);
      const sm = samples[idx]!;
      let r = c[0], g = c[1], b = c[2];
      // faixa de areia no litoral e espuma de recife
      if (sm.shore > 0.5 && sm.h < 0.08 && layer !== "population" && layer !== "volcano") {
        const t = 1 - sm.h / 0.08;
        r += (0.86 - r) * t * 0.55; g += (0.78 - g) * t * 0.55; b += (0.58 - b) * t * 0.55;
      }
      if (sm.shore < 0.5 && sm.h > -0.12) {
        const t = 1 + sm.h / 0.12;
        r += (0.2 - r) * t * 0.6; g += (0.75 - g) * t * 0.6; b += (0.78 - b) * t * 0.6;
      }
      // sombreamento por inclinação (hillshade) para ler o relevo
      const ny = normals[idx * 3 + 1]!;
      const nx = normals[idx * 3]!;
      const shade = 0.72 + 0.28 * ny + 0.18 * nx;
      arr[idx * 3] = r * shade;
      arr[idx * 3 + 1] = g * shade;
      arr[idx * 3 + 2] = b * shade;
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
          roughness={0.85}
          metalness={0.02}
          envMapIntensity={0.25}
        />
      </mesh>

      <Water level={sea} oceanMode={oceanMode} />

      {/* base da maquete */}
      <mesh position={[0, -3.3, 0]}>
        <boxGeometry args={[(LON_MAX - LON_MIN) * SCALE + 0.3, 2, (LAT_MAX - LAT_MIN) * SCALE + 0.3]} />
        <meshStandardMaterial color="#0a1a26" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

const waterVert = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const waterFrag = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vec2 p = vWorld.xz;
    float w = sin(p.x * 3.1 + uTime * 0.9) * 0.5 + sin(p.y * 2.7 - uTime * 0.7) * 0.5
            + sin((p.x + p.y) * 5.3 + uTime * 1.6) * 0.25;
    vec3 n = normalize(vec3(cos(p.x * 3.1 + uTime * 0.9) * 0.08, 1.0, cos(p.y * 2.7 - uTime * 0.7) * 0.08));
    vec3 v = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    vec3 l = normalize(vec3(0.5, 0.8, 0.4));
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 60.0);
    vec3 col = mix(uDeep, uShallow, 0.35 + 0.12 * w);
    col = mix(col, vec3(0.55, 0.8, 1.0), fres * 0.55);
    col += spec * 0.9;
    // borda suave
    float edge = smoothstep(0.0, 0.03, vUv.x) * smoothstep(0.0, 0.03, vUv.y) * smoothstep(1.0, 0.97, vUv.x) * smoothstep(1.0, 0.97, vUv.y);
    gl_FragColor = vec4(col, (uOpacity + fres * 0.25) * edge);
    #include <colorspace_fragment>
  }
`;

function Water({ level, oceanMode }: { level: number; oceanMode: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0.55 },
      uDeep: { value: new THREE.Color("#06243a") },
      uShallow: { value: new THREE.Color("#1a6f8f") },
    }),
    [],
  );
  useFrame((_, delta) => {
    if (!mat.current) return;
    uniforms.uTime.value += Math.min(delta, 0.05);
    const target = oceanMode ? 0.12 : 0.55;
    uniforms.uOpacity.value += (target - uniforms.uOpacity.value) * (1 - Math.exp(-4 * delta));
  });
  return (
    <mesh position={[0, level, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[(LON_MAX - LON_MIN) * SCALE, (LAT_MAX - LAT_MIN) * SCALE, 1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={waterVert}
        fragmentShader={waterFrag}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
