import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Console } from "@/components/atlas/Console";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "OCEANIA 4D — The Living Atlas" },
      { name: "description", content: "Maquete 3D interativa da Oceania: relevo, clima, oceano, vulcões, população e linha do tempo." },
      { property: "og:title", content: "OCEANIA 4D — The Living Atlas" },
      { property: "og:description", content: "Sobrevoe uma maquete geográfica 3D da Oceania controlada por um mapa 2D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [entered, setEntered] = useState(false);
  if (entered) return <Console />;
  return (
    <main className="atlas-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <p className="font-mono text-xs tracking-[0.5em] text-accent">◉ SYSTEM ONLINE · 47°S — 18°N</p>
      <h1 className="mt-6 font-display text-6xl font-bold tracking-[0.25em] text-foreground md:text-8xl">
        OCEANIA <span className="text-accent">4D</span>
      </h1>
      <p className="mt-4 font-mono text-sm tracking-[0.4em] text-muted-foreground">DIGITAL GEOGRAPHIC LABORATORY</p>
      <p className="mt-8 max-w-xl text-foreground/75">
        Uma maquete topográfica viva: o mapa 2D comanda a maquete 3D, e a maquete 3D explica a Geografia.
      </p>
      <button
        onClick={() => setEntered(true)}
        className="mt-10 rounded-sm border border-accent bg-accent/10 px-10 py-3 font-mono text-sm tracking-[0.4em] text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        ENTER THE ATLAS
      </button>
    </main>
  );
}
