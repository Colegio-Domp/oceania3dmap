import { useMemo } from "react";
import { Environment, Html, Lightformer, Line, Sparkles, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, SMAA, Vignette } from "@react-three/postprocessing";
import { REGIONS } from "@/lib/oceania";
import {
  LAT_MAX,
  LAT_MIN,
  LON_MAX,
  LON_MIN,
  SCALE,
  type LayerId,
  type Region,
  type Volcano,
  latToZ,
  lonToX,
} from "@/lib/oceania";
import { Terrain } from "./Terrain";
import { Markers } from "./Markers";
import { CameraRig } from "./CameraRig";

interface Props {
  layer: LayerId;
  timeline: number;
  region: Region;
  selectedVolcano: string | null;
  onSelectVolcano: (v: Volcano) => void;
}

function RegionFrame({ region }: { region: Region }) {
  const points = useMemo(() => {
    const [lonMin, latMin, lonMax, latMax] = region.bbox;
    const x0 = lonToX(lonMin);
    const x1 = lonToX(lonMax);
    const z0 = latToZ(latMin);
    const z1 = latToZ(latMax);
    const y = 0.02;
    return [
      [x0, y, z0],
      [x1, y, z0],
      [x1, y, z1],
      [x0, y, z1],
      [x0, y, z0],
    ] as [number, number, number][];
  }, [region]);

  return <Line points={points} color="#38e8ff" lineWidth={1.4} transparent opacity={0.75} />;
}

export function AtlasScene({ layer, timeline, region, selectedVolcano, onSelectVolcano }: Props) {
  const target: [number, number, number] = [
    lonToX(region.center[0]),
    0,
    latToZ(region.center[1]),
  ];

  return (
    <>
      <color attach="background" args={["#05070d"]} />
      <fog attach="fog" args={["#05070d", 30, 70]} />

      <hemisphereLight args={["#7fb6ff", "#0b1220", 0.55]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[9, 14, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <pointLight position={[-12, 6, -8]} intensity={18} color="#1f6bff" distance={40} />

      <Terrain layer={layer} timeline={timeline} />
      <Markers
        layer={layer}
        timeline={timeline}
        selectedVolcano={selectedVolcano}
        onSelectVolcano={onSelectVolcano}
      />
      <RegionFrame region={region} />
      {REGIONS.map((r) => (
        <Html
          key={r.id}
          position={[lonToX(r.center[0]), 0.9, latToZ(r.bbox[3]) - 0.15]}
          center
          distanceFactor={14}
          style={{ pointerEvents: "none" }}
        >
          <div className={`atlas-region-label ${r.id === region.id ? "is-active" : ""}`}>{r.name.toUpperCase()}</div>
        </Html>
      ))}

      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
        <Lightformer intensity={1.2} color="#7fd4ff" position={[-8, 2, -2]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
        <Lightformer intensity={0.8} color="#ffb070" position={[8, 2, 3]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
      </Environment>
      <Stars radius={60} depth={30} count={1800} factor={2.5} fade speed={0.4} />
      <Sparkles count={70} scale={[24, 3, 20]} position={[0, 1.5, 0]} size={2} speed={0.25} color="#8fe9ff" opacity={0.5} />

      <EffectComposer multisampling={0}>
        <SMAA />
        <Bloom intensity={0.7} luminanceThreshold={0.75} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>

      {/* grade técnica do laboratório */}
      <gridHelper
        args={[
          Math.max(LON_MAX - LON_MIN, LAT_MAX - LAT_MIN) * SCALE,
          28,
          "#123a4a",
          "#0b1d28",
        ]}
        position={[0, -2.2, 0]}
      />

      <CameraRig target={target} dist={region.dist} flyKey={region.id} />
    </>
  );
}
