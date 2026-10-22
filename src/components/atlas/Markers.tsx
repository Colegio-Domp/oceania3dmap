import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  CITIES,
  VOLCANOES,
  type LayerId,
  type Volcano,
  cityGrowth,
  latToZ,
  lonToX,
  sampleTerrain,
  volcanicActivity,
} from "@/lib/oceania";

interface Props {
  layer: LayerId;
  timeline: number;
  selectedVolcano: string | null;
  onSelectVolcano: (v: Volcano) => void;
}

export function Markers({ layer, timeline, selectedVolcano, onSelectVolcano }: Props) {
  const volcanoData = useMemo(
    () =>
      VOLCANOES.map((v) => ({
        v,
        x: lonToX(v.lon),
        z: latToZ(v.lat),
        y: Math.max(sampleTerrain(v.lon, v.lat).h, 0.02),
        size: 0.05 + (v.height / 3000) * 0.12,
      })),
    [],
  );

  const cityData = useMemo(
    () =>
      CITIES.map((c) => ({
        c,
        x: lonToX(c.lon),
        z: latToZ(c.lat),
        y: Math.max(sampleTerrain(c.lon, c.lat).h, 0.02),
      })),
    [],
  );

  const showVolcanoes = layer === "volcano" || timeline < 0.3;
  const showCities = layer === "population" || timeline >= 0.3;
  const activity = volcanicActivity(timeline);

  const glowRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      const pulse = 1 + 0.18 * Math.sin(clock.elapsedTime * 2.2);
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      {showVolcanoes && (
        <group>
          {volcanoData.map(({ v, x, y, z, size }) => {
            const active = selectedVolcano === v.id;
            return (
              <group key={v.id} position={[x, y, z]}>
                <mesh
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVolcano(v);
                  }}
                  onPointerOver={() => {
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={() => {
                    document.body.style.cursor = "auto";
                  }}
                  castShadow
                >
                  <coneGeometry args={[size * 0.85, size * 1.6, 7]} />
                  <meshStandardMaterial
                    color={active ? "#ffb347" : "#7a2f22"}
                    emissive={active ? "#ff7a18" : "#8a2b10"}
                    emissiveIntensity={active ? 1.2 : 0.35 * activity}
                    roughness={0.8}
                    flatShading
                  />
                </mesh>
                <group ref={active ? glowRef : null} position={[0, size * 1.1, 0]}>
                  <mesh>
                    <sphereGeometry args={[size * 0.34, 10, 10]} />
                    <meshBasicMaterial
                      color="#ff8a3d"
                      transparent
                      opacity={0.35 + 0.5 * activity}
                    />
                  </mesh>
                </group>
                {active && (
                  <Html center distanceFactor={14} position={[0, size * 2.2, 0]}>
                    <div className="whitespace-nowrap rounded-sm border border-warn/60 bg-panel/90 px-2 py-0.5 font-mono text-[10px] tracking-wider text-warn">
                      {v.name.toUpperCase()}
                    </div>
                  </Html>
                )}
              </group>
            );
          })}
        </group>
      )}

      {showCities &&
        cityData.map(({ c, x, y, z }) => {
          const g = cityGrowth(c, timeline);
          if (g <= 0) return null;
          const blocks = Math.min(9, 1 + Math.round(Math.sqrt(c.pop) * 4));
          const spread = 0.06 + Math.sqrt(c.pop) * 0.1;
          return (
            <group key={c.id} position={[x, y, z]}>
              {Array.from({ length: blocks }).map((_, i) => {
                const a = (i * 2.399) % (Math.PI * 2);
                const r = spread * Math.sqrt(i / blocks);
                const hgt = (0.05 + Math.sqrt(c.pop) * 0.12) * g * (0.5 + ((i * 37) % 10) / 10);
                return (
                  <mesh
                    key={i}
                    position={[Math.cos(a) * r, hgt / 2, Math.sin(a) * r]}
                    castShadow
                  >
                    <boxGeometry args={[spread * 0.35, hgt, spread * 0.35]} />
                    <meshStandardMaterial
                      color="#dfe9ff"
                      emissive="#5fd2ff"
                      emissiveIntensity={layer === "population" ? 0.9 : 0.35}
                      roughness={0.4}
                    />
                  </mesh>
                );
              })}
              {layer === "population" && c.pop >= 1.3 && (
                <Html center distanceFactor={16} position={[0, 0.34, 0]}>
                  <div className="whitespace-nowrap font-mono text-[9px] tracking-wider text-accent">
                    {c.name.toUpperCase()}
                  </div>
                </Html>
              )}
            </group>
          );
        })}
    </group>
  );
}
