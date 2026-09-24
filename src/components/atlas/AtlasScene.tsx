import { useMemo } from "react";
import { Line } from "@react-three/drei";
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
      <fog attach="fog" args={["#05070d", 26, 62]} />

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
