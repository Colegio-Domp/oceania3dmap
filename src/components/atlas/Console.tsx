import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ERAS,
  LAYERS,
  REGIONS,
  type LayerId,
  type Region,
  type Volcano,
  seaLevel,
  volcanicActivity,
  CITIES,
  cityGrowth,
  HEIGHT_UNIT_KM,
} from "@/lib/oceania";
import { AtlasScene } from "./AtlasScene";
import { MapPanel } from "./MapPanel";

function Panel({ title, code, children, className = "" }: { title: string; code: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`pointer-events-auto rounded-sm border border-line bg-panel/80 p-3 backdrop-blur-md ${className}`}>
      <header className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
        <span className="text-accent">{title}</span>
        <span>{code}</span>
      </header>
      {children}
    </section>
  );
}

export function Console() {
  const [layer, setLayer] = useState<LayerId>("relief");
  const [timeline, setTimeline] = useState(0.68);
  const [region, setRegion] = useState<Region>(REGIONS[0]!);
  const [volcano, setVolcano] = useState<Volcano | null>(null);

  const era = ERAS.reduce((best, e) => (Math.abs(e.t - timeline) < Math.abs(best.t - timeline) ? e : best), ERAS[0]!);
  const urbanPop = CITIES.reduce((s, c) => s + (cityGrowth(c, timeline) > 0 ? c.pop * cityGrowth(c, timeline) : 0), 0);

  return (
    <div className="fixed inset-0 bg-background">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 14, 16], fov: 45 }}>
        <Suspense fallback={null}>
          <AtlasScene
            layer={layer}
            timeline={timeline}
            region={region}
            selectedVolcano={volcano?.id ?? null}
            onSelectVolcano={(v) => {
              setVolcano(v);
              setLayer("volcano");
            }}
          />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-[0.3em] text-foreground">
              OCEANIA <span className="text-accent">4D</span>
            </h1>
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
              DIGITAL GEOGRAPHIC LABORATORY · v1.0
            </p>
          </div>
          <div className="text-right font-mono text-[10px] leading-relaxed text-muted-foreground">
            <div>ERA <span className="text-warn">{era.label}</span></div>
            <div>SEA LVL <span className="text-accent">+{(seaLevel(timeline) * HEIGHT_UNIT_KM * 1000).toFixed(0)} m*</span></div>
            <div>VOLC ACT <span className="text-warn">{Math.round(volcanicActivity(timeline) * 100)}%</span></div>
            <div>URBAN IDX <span className="text-accent">{urbanPop.toFixed(1)}</span></div>
          </div>
        </div>

        <div className="mt-4 flex flex-1 justify-between gap-4 overflow-hidden">
          <div className="flex w-[306px] flex-col gap-3">
            <Panel title="MAP" code="2D → 3D">
              <MapPanel layer={layer} timeline={timeline} region={region} onSelect={(r) => { setRegion(r); setVolcano(null); }} />
              <div className="mt-2 grid grid-cols-3 gap-1">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRegion(r); setVolcano(null); }}
                    className={`rounded-sm border px-1 py-1 font-mono text-[9px] tracking-wider transition-colors ${
                      r.id === region.id ? "border-accent bg-accent/15 text-accent" : "border-line text-muted-foreground hover:border-accent/60 hover:text-foreground"
                    }`}
                  >
                    {r.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title="LAYERS" code="06">
              <div className="grid grid-cols-2 gap-1">
                {LAYERS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayer(l.id)}
                    title={l.hint}
                    className={`flex items-center gap-2 rounded-sm border px-2 py-1.5 text-left font-mono text-[10px] tracking-wider transition-colors ${
                      layer === l.id ? "border-accent bg-accent/15 text-accent" : "border-line text-muted-foreground hover:border-accent/60 hover:text-foreground"
                    }`}
                  >
                    <span className="opacity-60">{l.code}</span>
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{LAYERS.find((l) => l.id === layer)?.hint}</p>
            </Panel>
          </div>

          <div className="flex w-[320px] flex-col gap-3 overflow-y-auto">
            <Panel title="INFO" code={region.code}>
              <h2 className="font-display text-xl font-semibold tracking-wide text-foreground">{region.name}</h2>
              <dl className="mt-2 space-y-2 text-sm">
                {(
                  [
                    ["LOCALIZAÇÃO", region.info.localizacao],
                    ["RELEVO", region.info.relevo],
                    ["CLIMA", region.info.clima],
                    ["POPULAÇÃO", region.info.populacao],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] tracking-[0.2em] text-accent/80">{k}</dt>
                    <dd className="leading-snug text-foreground/85">{v}</dd>
                  </div>
                ))}
                <div className="border-l-2 border-warn/70 pl-2 text-foreground/80">
                  <dt className="font-mono text-[10px] tracking-[0.2em] text-warn">CURIOSIDADE</dt>
                  <dd className="leading-snug">{region.info.curiosidade}</dd>
                </div>
              </dl>
            </Panel>
            {volcano && (
              <Panel title="VOLCANO" code="RING OF FIRE">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-lg font-semibold text-warn">{volcano.name}</h3>
                  <span className="font-mono text-xs text-muted-foreground">{volcano.height.toLocaleString("pt-BR")} m</span>
                </div>
                <p className="mt-1 text-sm text-foreground/85">{volcano.note}</p>
                <button onClick={() => setVolcano(null)} className="mt-2 font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground">
                  [ FECHAR ]
                </button>
              </Panel>
            )}
            {layer === "volcano" && !volcano && (
              <Panel title="HINT" code="05">
                <p className="text-sm text-muted-foreground">Clique em um cone vulcânico na maquete para abrir sua ficha.</p>
              </Panel>
            )}
          </div>
        </div>

        <Panel title="TIMELINE" code={era.label} className="mx-auto mt-3 w-full max-w-3xl">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={timeline}
            onChange={(e) => setTimeline(Number(e.target.value))}
            className="atlas-range w-full"
            aria-label="Linha do tempo"
          />
          <div className="mt-1 flex justify-between">
            {ERAS.map((e) => (
              <button
                key={e.label}
                onClick={() => setTimeline(e.t)}
                className={`font-mono text-[10px] tracking-[0.15em] ${era.label === e.label ? "text-warn" : "text-muted-foreground hover:text-foreground"}`}
              >
                {e.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {era.note}
            {timeline > 0.7 && " *Visualização ilustrativa, não é previsão."}
          </p>
        </Panel>
      </div>
    </div>
  );
}
