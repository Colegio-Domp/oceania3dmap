/**
 * OCEANIA 4D — modelo de dados geográfico.
 * Fonte única usada pelo mapa 2D, pela maquete 3D e pelas fichas informativas.
 * Módulo puro (sem APIs de browser) para poder ser importado em qualquer lugar.
 */

export type LayerId =
  | "relief"
  | "climate"
  | "ocean"
  | "volcano"
  | "population"
  | "vegetation";

export interface LayerDef {
  id: LayerId;
  code: string;
  label: string;
  hint: string;
}

export const LAYERS: LayerDef[] = [
  { id: "relief", code: "01", label: "RELIEF", hint: "Relevo — altitudes exageradas" },
  { id: "climate", code: "02", label: "CLIMATE", hint: "Zonas climáticas" },
  { id: "vegetation", code: "03", label: "VEGETATION", hint: "Cobertura vegetal" },
  { id: "ocean", code: "04", label: "OCEAN", hint: "Relevo submarino e fossas" },
  { id: "volcano", code: "05", label: "VOLCANISM", hint: "Anel de Fogo do Pacífico" },
  { id: "population", code: "06", label: "POPULATION", hint: "Ocupação humana" },
];

export const ERAS = [
  { t: 0, label: "FORMAÇÃO", note: "Placas em choque, vulcanismo intenso, nenhuma ocupação humana." },
  { t: 0.34, label: "COLONIZAÇÃO", note: "Povos oceânicos e portos coloniais no litoral." },
  { t: 0.68, label: "ATUALIDADE", note: "Grandes áreas metropolitanas concentradas no litoral." },
  { t: 1, label: "CENÁRIO FUTURO", note: "Simulação: mais urbanização e nível do mar mais alto." },
];

/* ------------------------------------------------------------------ */
/* Projeção lon/lat -> mundo 3D                                        */
/* ------------------------------------------------------------------ */

export const LON_MIN = 108;
export const LON_MAX = 192;
export const LAT_MIN = -50;
export const LAT_MAX = 18;
const LON_0 = 150;
const LAT_0 = -16;
export const SCALE = 0.28;
/** metros de altitude por unidade de mundo (usado nas fichas) */
export const HEIGHT_UNIT_KM = 2;

export function lonToX(lon: number) {
  return (lon - LON_0) * SCALE;
}
export function latToZ(lat: number) {
  return -(lat - LAT_0) * SCALE;
}

/* ------------------------------------------------------------------ */
/* Ruído determinístico                                                */
/* ------------------------------------------------------------------ */

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * vnoise(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

export function clamp(v: number, a = 0, b = 1) {
  return v < a ? a : v > b ? b : v;
}
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/* ------------------------------------------------------------------ */
/* Massas de terra (elipses)                                           */
/* ------------------------------------------------------------------ */

interface Blob {
  lon: number;
  lat: number;
  rx: number;
  ry: number;
  rot?: number;
  w?: number;
}

const LANDMASS: Blob[] = [
  // Austrália
  { lon: 134, lat: -25, rx: 19, ry: 11.5 },
  { lon: 117.5, lat: -23, rx: 7, ry: 8 },
  { lon: 145, lat: -20.5, rx: 7.5, ry: 7.5 },
  { lon: 142.7, lat: -13.5, rx: 3.2, ry: 4.5 },
  { lon: 131, lat: -12.6, rx: 3.4, ry: 2.2 },
  { lon: 149.5, lat: -30, rx: 5.5, ry: 6 },
  // Tasmânia
  { lon: 146.8, lat: -42, rx: 1.7, ry: 1.9 },
  // Nova Zelândia
  { lon: 175.6, lat: -38.4, rx: 1.9, ry: 2.9, rot: 18 },
  { lon: 174.4, lat: -35.6, rx: 1.1, ry: 1.6, rot: 30 },
  { lon: 170.8, lat: -44.2, rx: 2.3, ry: 2.9, rot: -32 },
  // Nova Guiné / Melanésia
  { lon: 142.5, lat: -5.6, rx: 7.5, ry: 2.9, rot: 12 },
  { lon: 149.5, lat: -8.4, rx: 3.6, ry: 1.4, rot: 28 },
  { lon: 151, lat: -5.6, rx: 2.4, ry: 0.9, rot: -15 },
  { lon: 159.6, lat: -8.6, rx: 2.8, ry: 0.8, rot: -22 },
  { lon: 167.5, lat: -16.6, rx: 0.7, ry: 2.2 },
  { lon: 165.9, lat: -21.3, rx: 2.3, ry: 0.7, rot: -32 },
  { lon: 178.2, lat: -17.8, rx: 1.2, ry: 0.9 },
  // Micronésia
  { lon: 134.5, lat: 7.4, rx: 0.5, ry: 0.8 },
  { lon: 144.8, lat: 13.4, rx: 0.4, ry: 0.6 },
  { lon: 151.8, lat: 7.4, rx: 0.45, ry: 0.4 },
  { lon: 158.2, lat: 6.9, rx: 0.4, ry: 0.4 },
  { lon: 171.2, lat: 7.1, rx: 0.4, ry: 0.4 },
  { lon: 173, lat: 1.4, rx: 0.5, ry: 0.35 },
  { lon: 166.9, lat: -0.5, rx: 0.3, ry: 0.3 },
  // Polinésia ocidental
  { lon: 188.2, lat: -13.8, rx: 0.8, ry: 0.5 },
  { lon: 184.9, lat: -20.4, rx: 0.5, ry: 1.3 },
];

interface Ridge {
  lon: number;
  lat: number;
  r: number;
  peak: number;
}

/** Cadeias montanhosas: peak em unidades de mundo (1 ≈ 2000 m) */
const MOUNTAINS: Ridge[] = [
  // Grande Cordilheira Australiana (leste)
  { lon: 152.5, lat: -28.5, r: 2.4, peak: 0.34 },
  { lon: 150.5, lat: -32.5, r: 2.2, peak: 0.42 },
  { lon: 148.2, lat: -36.2, r: 2, peak: 0.56 },
  { lon: 145.8, lat: -37.4, r: 1.8, peak: 0.4 },
  { lon: 146.3, lat: -19.2, r: 2, peak: 0.3 },
  // MacDonnell / interior
  { lon: 133.4, lat: -23.6, r: 2.2, peak: 0.22 },
  { lon: 116.5, lat: -31.8, r: 2, peak: 0.18 },
  // Alpes do Sul (Nova Zelândia)
  { lon: 168.6, lat: -44.8, r: 1.5, peak: 0.75 },
  { lon: 170.2, lat: -43.6, r: 1.4, peak: 0.95 },
  { lon: 172, lat: -42.4, r: 1.3, peak: 0.7 },
  { lon: 175.9, lat: -39.1, r: 1, peak: 0.5 },
  // Cordilheira central da Nova Guiné
  { lon: 140, lat: -4.4, r: 2.2, peak: 0.9 },
  { lon: 143.5, lat: -5.6, r: 2.2, peak: 1.05 },
  { lon: 146.5, lat: -6.4, r: 2, peak: 0.85 },
  // Tasmânia / Novas Hébridas
  { lon: 146.3, lat: -42, r: 1.2, peak: 0.35 },
  { lon: 167.6, lat: -16.4, r: 0.9, peak: 0.4 },
  { lon: 178.1, lat: -17.7, r: 0.9, peak: 0.35 },
  { lon: 165.7, lat: -21.4, r: 1.1, peak: 0.4 },
  { lon: 159.6, lat: -8.6, r: 1.2, peak: 0.4 },
];

/** Fossas oceânicas (aprofundam o leito) */
const TRENCHES: Blob[] = [
  { lon: 183.5, lat: -22, rx: 1.1, ry: 6, rot: 8, w: 1 }, // Tonga–Kermadec
  { lon: 179.5, lat: -32, rx: 1.1, ry: 5.5, rot: -6, w: 1 },
  { lon: 166.2, lat: -16.5, rx: 0.9, ry: 4, rot: 6, w: 0.9 }, // Novas Hébridas
  { lon: 152.5, lat: -1.5, rx: 3.5, ry: 0.8, rot: -12, w: 0.9 }, // Nova Bretanha
  { lon: 156.5, lat: -6, rx: 2.8, ry: 0.7, rot: -25, w: 0.8 },
];

function blobWeight(b: Blob, lon: number, lat: number) {
  const rot = ((b.rot ?? 0) * Math.PI) / 180;
  const dx = lon - b.lon;
  const dy = lat - b.lat;
  const cx = Math.cos(rot) * dx + Math.sin(rot) * dy;
  const cy = -Math.sin(rot) * dx + Math.cos(rot) * dy;
  const d2 = (cx / b.rx) ** 2 + (cy / b.ry) ** 2;
  if (d2 >= 1) return 0;
  return (b.w ?? 1) * Math.pow(1 - d2, 1.5);
}

export interface Sample {
  /** altura em unidades de mundo (positivo = terra, negativo = leito oceânico) */
  h: number;
  /** máscara de terra bruta */
  land: number;
  /** 0 = oceano, 1 = terra firme */
  shore: number;
  /** aridez 0..1 (continentalidade) */
  arid: number;
}

export function sampleTerrain(lon: number, lat: number): Sample {
  let mask = 0;
  for (const b of LANDMASS) mask += blobWeight(b, lon, lat);
  mask = Math.min(mask, 1.5);

  const coastNoise = fbm(lon * 0.42 + 11, lat * 0.42 - 7, 4) - 0.5;
  const land = mask + 0.2 * coastNoise;
  const shore = smoothstep(0.38, 0.56, land);

  // terra
  let mountains = 0;
  if (shore > 0) {
    for (const m of MOUNTAINS) {
      const d2 = ((lon - m.lon) / m.r) ** 2 + ((lat - m.lat) / m.r) ** 2;
      if (d2 < 1) mountains += m.peak * Math.pow(1 - d2, 1.4);
    }
  }
  const detail = fbm(lon * 1.3 + 3, lat * 1.3 + 5, 4) - 0.45;
  const landH = shore * (0.06 + mountains + 0.09 * detail + 0.05 * mask);

  // oceano
  const shelf = clamp(land / 0.4);
  let depth = -(0.03 + 1.05 * Math.pow(1 - shelf, 1.6) + 0.05 * detail);
  for (const t of TRENCHES) depth -= 0.85 * blobWeight(t, lon, lat) * (1 - shore);

  const h = shore * landH + (1 - shore) * depth;

  // continentalidade (usada no clima/vegetação)
  const arid = clamp((mask - 0.55) / 0.75) * clamp((Math.abs(lat + 24) < 14 ? 1 : 0.25) + 0.2);

  return { h, land, shore, arid };
}

/* ------------------------------------------------------------------ */
/* Cores por camada                                                    */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];

function mix(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

const DEEP: RGB = [0.02, 0.06, 0.16];
const MID_SEA: RGB = [0.04, 0.16, 0.32];
const SHELF: RGB = [0.08, 0.32, 0.46];
const TRENCH: RGB = [0.01, 0.02, 0.09];

function oceanRamp(h: number, highlight: boolean): RGB {
  const d = clamp(-h / 1.9);
  let c = mix(SHELF, MID_SEA, smoothstep(0.1, 0.45, d));
  c = mix(c, DEEP, smoothstep(0.45, 0.8, d));
  c = mix(c, TRENCH, smoothstep(0.85, 1, d));
  if (highlight) return mix(c, [0.0, 0.55, 0.62], 0.25 * smoothstep(0.6, 1, d));
  return mix(c, [0.03, 0.07, 0.13], 0.45);
}

export function layerColor(
  layer: LayerId,
  s: Sample,
  lat: number,
  timeline: number,
): RGB {
  if (s.shore < 0.5) {
    return oceanRamp(s.h, layer === "ocean");
  }
  const alt = clamp(s.h / 1.1);
  const absLat = Math.abs(lat);

  switch (layer) {
    case "relief": {
      let c = mix([0.42, 0.45, 0.3], [0.55, 0.42, 0.24], smoothstep(0, 0.3, alt));
      c = mix(c, [0.48, 0.34, 0.26], smoothstep(0.3, 0.6, alt));
      c = mix(c, [0.82, 0.84, 0.88], smoothstep(0.62, 0.95, alt));
      return c;
    }
    case "climate": {
      // tropical úmido -> árido -> temperado -> alpino
      const tropical: RGB = [0.1, 0.5, 0.3];
      const arid: RGB = [0.78, 0.6, 0.22];
      const temperate: RGB = [0.24, 0.52, 0.45];
      const alpine: RGB = [0.72, 0.8, 0.9];
      let c = absLat < 23.5 ? tropical : temperate;
      c = mix(c, arid, s.arid);
      c = mix(c, alpine, smoothstep(0.55, 0.95, alt));
      return c;
    }
    case "vegetation": {
      const rainforest: RGB = [0.05, 0.36, 0.16];
      const savanna: RGB = [0.62, 0.55, 0.2];
      const desert: RGB = [0.72, 0.56, 0.32];
      const forest: RGB = [0.14, 0.34, 0.22];
      const rock: RGB = [0.5, 0.5, 0.5];
      let c = absLat < 20 ? rainforest : forest;
      c = mix(c, savanna, clamp(s.arid * 1.3));
      c = mix(c, desert, smoothstep(0.55, 1, s.arid));
      c = mix(c, rock, smoothstep(0.6, 1, alt));
      return c;
    }
    case "ocean":
      return mix([0.16, 0.17, 0.2], [0.3, 0.31, 0.34], alt);
    case "volcano": {
      const base = mix([0.14, 0.14, 0.17], [0.3, 0.28, 0.3], alt);
      return base;
    }
    case "population": {
      const base = mix([0.1, 0.12, 0.16], [0.22, 0.24, 0.3], alt);
      return mix(base, [0.16, 0.2, 0.3], 0.4 * timeline);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Regiões                                                             */
/* ------------------------------------------------------------------ */

export interface RegionInfo {
  localizacao: string;
  relevo: string;
  clima: string;
  populacao: string;
  curiosidade: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  /** [lonMin, latMin, lonMax, latMax] */
  bbox: [number, number, number, number];
  center: [number, number];
  /** distância da câmera em unidades de mundo */
  dist: number;
  info: RegionInfo;
}

export const REGIONS: Region[] = [
  {
    id: "australia",
    name: "Austrália",
    code: "AU",
    bbox: [112, -44, 154, -10],
    center: [134, -25],
    dist: 12,
    info: {
      localizacao: "Maior massa de terra da Oceania, entre os oceanos Índico e Pacífico.",
      relevo:
        "Planaltos antigos e muito erodidos no interior; a Grande Cordilheira Australiana acompanha o litoral leste.",
      clima: "Deserto e semiárido no centro, tropical ao norte e temperado no sudeste e na Tasmânia.",
      populacao: "Cerca de 26 milhões de habitantes, concentrados em cidades litorâneas.",
      curiosidade: "Aproximadamente 70% do território é árido ou semiárido.",
    },
  },
  {
    id: "new-zealand",
    name: "Nova Zelândia",
    code: "NZ",
    bbox: [166, -47.5, 179, -34],
    center: [172.5, -41],
    dist: 5.5,
    info: {
      localizacao: "Duas ilhas principais no sudoeste do Pacífico, sobre o encontro de duas placas.",
      relevo:
        "Alpes do Sul com vales glaciais e fiordes; planalto vulcânico com lagos de cratera na Ilha do Norte.",
      clima: "Temperado oceânico, muito chuvoso a oeste das montanhas.",
      populacao: "Cerca de 5 milhões, mais de um terço na região de Auckland.",
      curiosidade: "O Aoraki / Mount Cook chega a 3.724 m de altitude.",
    },
  },
  {
    id: "papua",
    name: "Papua-Nova Guiné",
    code: "PG",
    bbox: [138, -12, 156, -1],
    center: [145, -6],
    dist: 6.5,
    info: {
      localizacao: "Metade oriental da ilha da Nova Guiné e arquipélagos vizinhos.",
      relevo: "Cordilheira central acima de 4.000 m, com vales profundos e grandes planícies aluviais.",
      clima: "Equatorial úmido, com chuvas abundantes durante todo o ano.",
      populacao: "Cerca de 10 milhões, em grande parte rural e distribuída em vales isolados.",
      curiosidade: "É um dos lugares com maior diversidade linguística do planeta.",
    },
  },
  {
    id: "melanesia",
    name: "Melanésia",
    code: "ML",
    bbox: [156, -24, 182, -6],
    center: [168, -16],
    dist: 8,
    info: {
      localizacao: "Arco de arquipélagos: Ilhas Salomão, Vanuatu, Nova Caledônia e Fiji.",
      relevo: "Ilhas de origem vulcânica e recifes de coral, muitas com cones ativos.",
      clima: "Tropical marítimo, na rota dos ciclones do Pacífico Sul.",
      populacao: "Poucos milhões distribuídos em centenas de ilhas.",
      curiosidade: "A Nova Caledônia guarda uma das maiores lagoas de recife do mundo.",
    },
  },
  {
    id: "micronesia",
    name: "Micronésia",
    code: "MC",
    bbox: [130, -2, 176, 16],
    center: [155, 7],
    dist: 11,
    info: {
      localizacao: "Milhares de ilhas pequenas ao norte do equador, no Pacífico ocidental.",
      relevo: "Predominam atóis baixos de coral, com raras ilhas vulcânicas mais altas.",
      clima: "Equatorial e tropical úmido, com forte influência oceânica.",
      populacao: "Populações pequenas, dispersas por enormes distâncias marítimas.",
      curiosidade: "Muitos atóis têm altitude média inferior a 3 m — daí a sensibilidade ao nível do mar.",
    },
  },
  {
    id: "polynesia",
    name: "Polinésia",
    code: "PL",
    bbox: [178, -24, 192, -10],
    center: [186, -17],
    dist: 7,
    info: {
      localizacao: "Triângulo imenso no Pacífico central; aqui aparecem Samoa e Tonga.",
      relevo: "Ilhas vulcânicas altas junto à fossa de Tonga, uma das mais profundas da Terra.",
      clima: "Tropical oceânico, com estação de chuvas bem marcada.",
      populacao: "Comunidades insulares pequenas, com longa tradição de navegação.",
      curiosidade: "A navegação polinésia cruzou milhares de quilômetros usando estrelas e correntes.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Vulcões e cidades                                                   */
/* ------------------------------------------------------------------ */

export interface Volcano {
  id: string;
  name: string;
  lon: number;
  lat: number;
  height: number;
  note: string;
}

export const VOLCANOES: Volcano[] = [
  { id: "ruapehu", name: "Ruapehu", lon: 175.57, lat: -39.28, height: 2797, note: "Estratovulcão ativo no planalto central da Nova Zelândia." },
  { id: "taranaki", name: "Taranaki", lon: 174.06, lat: -39.3, height: 2518, note: "Cone quase perfeito na costa oeste da Ilha do Norte." },
  { id: "whakaari", name: "Whakaari / White Island", lon: 177.18, lat: -37.52, height: 321, note: "Ilha-vulcão permanentemente fumegante." },
  { id: "taupo", name: "Taupo", lon: 176.0, lat: -38.8, height: 760, note: "Caldeira gigante ocupada hoje por um lago." },
  { id: "yasur", name: "Yasur", lon: 169.45, lat: -19.53, height: 361, note: "Em erupção quase contínua há séculos, em Vanuatu." },
  { id: "ambrym", name: "Ambrym", lon: 168.12, lat: -16.25, height: 1334, note: "Caldeira com lagos de lava em Vanuatu." },
  { id: "tavurvur", name: "Tavurvur", lon: 152.2, lat: -4.27, height: 688, note: "Destruiu parte da cidade de Rabaul em 1994." },
  { id: "ulawun", name: "Ulawun", lon: 151.33, lat: -5.05, height: 2334, note: "Um dos vulcões mais ativos da Papua-Nova Guiné." },
  { id: "bagana", name: "Bagana", lon: 154.98, lat: -6.14, height: 1855, note: "Cone jovem em Bougainville." },
  { id: "savo", name: "Savo", lon: 159.82, lat: -9.13, height: 485, note: "Pequena ilha vulcânica nas Ilhas Salomão." },
  { id: "hunga", name: "Hunga Tonga", lon: 184.7, lat: -20.55, height: 114, note: "Erupção submarina de 2022 foi sentida no mundo inteiro." },
];

export interface City {
  id: string;
  name: string;
  lon: number;
  lat: number;
  /** população em milhões */
  pop: number;
  /** momento da linha do tempo em que a cidade aparece */
  since: number;
}

export const CITIES: City[] = [
  { id: "sydney", name: "Sydney", lon: 151.2, lat: -33.87, pop: 5.3, since: 0.3 },
  { id: "melbourne", name: "Melbourne", lon: 144.96, lat: -37.81, pop: 5.2, since: 0.34 },
  { id: "brisbane", name: "Brisbane", lon: 153.03, lat: -27.47, pop: 2.6, since: 0.38 },
  { id: "perth", name: "Perth", lon: 115.86, lat: -31.95, pop: 2.2, since: 0.36 },
  { id: "adelaide", name: "Adelaide", lon: 138.6, lat: -34.93, pop: 1.4, since: 0.4 },
  { id: "canberra", name: "Canberra", lon: 149.13, lat: -35.28, pop: 0.46, since: 0.6 },
  { id: "darwin", name: "Darwin", lon: 130.84, lat: -12.46, pop: 0.15, since: 0.45 },
  { id: "cairns", name: "Cairns", lon: 145.77, lat: -16.92, pop: 0.16, since: 0.5 },
  { id: "auckland", name: "Auckland", lon: 174.76, lat: -36.85, pop: 1.7, since: 0.32 },
  { id: "wellington", name: "Wellington", lon: 174.78, lat: -41.29, pop: 0.42, since: 0.36 },
  { id: "christchurch", name: "Christchurch", lon: 172.64, lat: -43.53, pop: 0.38, since: 0.38 },
  { id: "moresby", name: "Port Moresby", lon: 147.15, lat: -9.44, pop: 0.4, since: 0.42 },
  { id: "lae", name: "Lae", lon: 147, lat: -6.73, pop: 0.12, since: 0.55 },
  { id: "suva", name: "Suva", lon: 178.44, lat: -18.14, pop: 0.09, since: 0.4 },
  { id: "noumea", name: "Nouméa", lon: 166.45, lat: -22.27, pop: 0.1, since: 0.4 },
  { id: "vila", name: "Port Vila", lon: 168.32, lat: -17.73, pop: 0.05, since: 0.45 },
  { id: "honiara", name: "Honiara", lon: 159.96, lat: -9.43, pop: 0.08, since: 0.5 },
  { id: "apia", name: "Apia", lon: 188.22, lat: -13.83, pop: 0.04, since: 0.4 },
  { id: "nukualofa", name: "Nuku'alofa", lon: 184.8, lat: -21.14, pop: 0.03, since: 0.4 },
  { id: "hagatna", name: "Hagåtña", lon: 144.75, lat: 13.48, pop: 0.15, since: 0.5 },
  { id: "tarawa", name: "Tarawa", lon: 173, lat: 1.33, pop: 0.06, since: 0.55 },
  { id: "majuro", name: "Majuro", lon: 171.38, lat: 7.1, pop: 0.03, since: 0.55 },
];

/** crescimento urbano ao longo da linha do tempo */
export function cityGrowth(city: City, timeline: number) {
  if (timeline < city.since) return 0;
  const span = clamp((timeline - city.since) / (1 - city.since));
  return 0.35 + 0.65 * span + (timeline > 0.8 ? 0.25 * (timeline - 0.8) * 5 : 0);
}

/** nível do mar em unidades de mundo (sobe no cenário futuro) */
export function seaLevel(timeline: number) {
  return timeline > 0.7 ? (timeline - 0.7) * 0.18 : 0;
}

/** atividade vulcânica: máxima na formação, presente hoje no Anel de Fogo */
export function volcanicActivity(timeline: number) {
  return lerp(1, 0.45, smoothstep(0, 0.55, timeline));
}
