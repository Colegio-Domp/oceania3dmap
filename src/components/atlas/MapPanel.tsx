import { useEffect, useRef, useState } from "react";
import {
  LAT_MAX,
  LAT_MIN,
  LON_MAX,
  LON_MIN,
  REGIONS,
  type LayerId,
  type Region,
  layerColor,
  sampleTerrain,
} from "@/lib/oceania";

const W = 280;
const H = Math.round((W * (LAT_MAX - LAT_MIN)) / (LON_MAX - LON_MIN));

const toPx = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
const toPy = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;

interface Props {
  layer: LayerId;
  timeline: number;
  region: Region;
  onSelect: (r: Region) => void;
}

export function MapPanel({ layer, timeline, region, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState<{ lon: number; lat: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const lat = LAT_MAX - ((LAT_MAX - LAT_MIN) * y) / H;
      for (let x = 0; x < W; x++) {
        const lon = LON_MIN + ((LON_MAX - LON_MIN) * x) / W;
        const s = sampleTerrain(lon, lat);
        const c = layerColor(layer === "ocean" ? "ocean" : "relief", s, lat, timeline);
        const i = (y * W + x) * 4;
        img.data[i] = c[0] * 255;
        img.data[i + 1] = c[1] * 255;
        img.data[i + 2] = c[2] * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [layer, timeline]);

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-sm border border-line" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block" />
        <svg
          width={W}
          height={H}
          className="absolute inset-0"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const px = e.clientX - r.left;
            const py = e.clientY - r.top;
            setCursor({
              lon: LON_MIN + (px / W) * (LON_MAX - LON_MIN),
              lat: LAT_MAX - (py / H) * (LAT_MAX - LAT_MIN),
            });
          }}
          onMouseLeave={() => setCursor(null)}
        >
          {/* linhas de referência: equador e trópico de Capricórnio */}
          <line x1={0} x2={W} y1={toPy(0)} y2={toPy(0)} className="stroke-accent/30" strokeDasharray="3 3" />
          <line x1={0} x2={W} y1={toPy(-23.44)} y2={toPy(-23.44)} className="stroke-warn/30" strokeDasharray="2 4" />
          {REGIONS.map((r) => {
            const [a, b, c, d] = r.bbox;
            const active = r.id === region.id;
            return (
              <g key={r.id} className="cursor-pointer" onClick={() => onSelect(r)}>
                <rect
                  x={toPx(a)}
                  y={toPy(d)}
                  width={toPx(c) - toPx(a)}
                  height={toPy(b) - toPy(d)}
                  className={
                    active
                      ? "fill-accent/15 stroke-accent"
                      : "fill-transparent stroke-foreground/20 hover:fill-accent/10 hover:stroke-accent/70"
                  }
                  strokeWidth={active ? 1.4 : 1}
                />
                <text
                  x={toPx(a) + 3}
                  y={toPy(d) + 10}
                  className={active ? "fill-accent" : "fill-foreground/60"}
                  style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: 1 }}
                >
                  {r.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>EQ ── TRÓPICO</span>
        <span>
          {cursor
            ? `${Math.abs(cursor.lat).toFixed(1)}°${cursor.lat < 0 ? "S" : "N"}  ${(cursor.lon > 180 ? 360 - cursor.lon : cursor.lon).toFixed(1)}°${cursor.lon > 180 ? "W" : "E"}`
            : "— · —"}
        </span>
      </div>
    </div>
  );
}
