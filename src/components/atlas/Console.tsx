import { Suspense, useEffect, useRef, useState } from "react";
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
  SCALE,
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

  const readout = useRef<HTMLDivElement>(null);
  const onHover = (x: number, z: number, h: number | null) => {
    const el = readout.current;
    if (!el) return;
    if (h === null) { el.textContent = "Passe o mouse sobre a maquete"; return; }
    const lon = x / SCALE + 150;
    const lat = -z / SCALE - 16;
    const m = Math.round(h * HEIGHT_UNIT_KM * 1000);
    el.textContent = `${Math.abs(lat).toFixed(2)}°${lat < 0 ? "S" : "N"}  ${(lon > 180 ? 360 - lon : lon).toFixed(2)}°${lon > 180 ? "W" : "E"}  ·  ${m >= 0 ? "ALT" : "PROF"} ${Math.abs(m).toLocaleString("pt-BR")} m`;
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= LAYERS.length) setLayer(LAYERS[n - 1]!.id);
      if (e.key === "ArrowRight") setTimeline((t) => Math.min(1, t + 0.05));
      if (e.key === "ArrowLeft") setTimeline((t) => Math.max(0, t - 0.05));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

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
            onHover={onHover}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-sm border border-line bg-panel/85 px-4 py-2 text-center font-mono text-[11px] tracking-wider text-foreground backdrop-blur-md">
        <div ref={readout} className="text-accent">Passe o mouse sobre a maquete</div>
        <div className="mt-1 text-[10px] text-muted-foreground">Arraste: girar · Botão direito: mover · Roda: zoom · Teclas 1–6: camadas · setas: tempo</div>
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-[0.3em] text-foreground [text-shadow:0_1px_6px_var(--background)]">
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
          <div className="pointer-events-auto flex w-[306px] flex-col gap-3 overflow-y-auto">
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
              <Legend layer={layer} />
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

const LEGENDS: Record<LayerId, { title: string; items: [string, string][]; tip: string }> = {
  relief: { title: "ALTITUDE", items: [["#6b7350", "Planícies 0–300 m"], ["#8c6b3d", "Planaltos 300–1.000 m"], ["#7a5742", "Montanhas 1–2 km"], ["#d1d6e0", "Picos acima de 2 km"]], tip: "A altura está exagerada para o relevo ficar visível. Sombras mostram as encostas." },
  climate: { title: "ZONAS CLIMÁTICAS", items: [["#1a804d", "Tropical úmido"], ["#c79938", "Árido / semiárido"], ["#3d8573", "Temperado"], ["#b8cce6", "Frio de montanha"]], tip: "O Trópico de Capricórnio corta o centro árido da Austrália." },
  vegetation: { title: "COBERTURA VEGETAL", items: [["#0d5c29", "Floresta tropical"], ["#245738", "Floresta temperada"], ["#9e8c33", "Savana"], ["#b88f52", "Deserto"]], tip: "Quanto mais longe do mar, menos chuva e menos vegetação." },
  ocean: { title: "PROFUNDIDADE", items: [["#33bfc7", "Recifes e águas rasas"], ["#14527a", "Plataforma continental"], ["#0a2952", "Oceano profundo"], ["#03051a", "Fossas (até 10 km)"]], tip: "As fossas surgem onde uma placa mergulha sob a outra." },
  volcano: { title: "VULCANISMO", items: [["#ff6a2b", "Vulcão ativo"], ["#ffb347", "Brilho = atividade"], ["#3a3a44", "Terra (realce neutro)"]], tip: "O Anel de Fogo acompanha as bordas das placas tectônicas." },
  population: { title: "OCUPAÇÃO", items: [["#38e8ff", "Cidade (tamanho = população)"], ["#2a3346", "Áreas pouco habitadas"]], tip: "Mova a linha do tempo para ver as cidades crescerem no litoral." },
};

function Legend({ layer }: { layer: LayerId }) {
  const l = LEGENDS[layer];
  return (
    <div className="mt-3 border-t border-line pt-2">
      <div className="font-mono text-[9px] tracking-[0.2em] text-accent/80">LEGENDA · {l.title}</div>
      <ul className="mt-1 space-y-1">
        {l.items.map(([c, t]) => (
          <li key={t} className="flex items-center gap-2 text-xs text-foreground/85">
            <span className="h-2.5 w-5 rounded-sm border border-line" style={{ background: c }} />
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{l.tip}</p>
    </div>
  );
}
