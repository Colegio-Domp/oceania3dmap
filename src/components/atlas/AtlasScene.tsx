import { useMemo } from "react";
import { Environment, Html, Lightformer, Line, Sky } from "@react-three/drei";
import { Bloom, EffectComposer, SMAA, Vignette } from "@react-three/postprocessing";
import { REGIONS } from "@/lib/oceania";
import {
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
  onHover?: (x: number, z: number, h: number | null) => void;
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

export function AtlasScene({ layer, timeline, region, selectedVolcano, onSelectVolcano, onHover }: Props) {
  const target: [number, number, number] = [
    lonToX(region.center[0]),
    0,
    latToZ(region.center[1]),
  ];

  return (
    <>
      <Sky distance={450} sunPosition={[9, 6, 8]} turbidity={6} rayleigh={1.6} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <fog attach="fog" args={["#a9c3d6", 35, 90]} />

      <hemisphereLight args={["#cfe6ff", "#3a3222", 0.7]} />
      <directionalLight
        position={[9, 14, 8]}
        intensity={2.6}
        color="#fff1dc"
        castShadow
        shadow-bias={-0.0008}
        shadow-normalBias={0.04}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />

      <Terrain layer={layer} timeline={timeline} onHover={onHover} />
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
        <Lightformer intensity={0.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
        <Lightformer intensity={0.4} color="#7fd4ff" position={[-8, 2, -2]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
        <Lightformer intensity={0.3} color="#ffb070" position={[8, 2, 3]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
      </Environment>

      <EffectComposer multisampling={0}>
        <SMAA />
        <Bloom intensity={0.25} luminanceThreshold={0.95} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.3} darkness={0.45} />
      </EffectComposer>

      <CameraRig target={target} dist={region.dist} flyKey={region.id} />
    </>
  );
}
