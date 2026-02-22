const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SWAPI_BASE_URL = "https://swapi.info/api";
const CDN_BASE = "https://cdn.jsdelivr.net/gh/tbone849/star-wars-guide@master/build/assets/img";

const RESOURCE_MAP = {
  people: "characters",
  planets: "planets",
  starships: "starships",
  vehicles: "vehicles",
  species: "species",
  films: "films",
};

// ─── FILMS EXTRA (episodios 7, 8, 9 — no están en ninguna SWAPI pública) ─────
// Posters Ep 7-9: el CDN tbone849 no los tiene, usamos Wikimedia (dominio público)
const POSTER_EP7 = "https://upload.wikimedia.org/wikipedia/en/a/a2/Star_Wars_The_Force_Awakens_Theatrical_Poster.jpg";
const POSTER_EP8 = "https://upload.wikimedia.org/wikipedia/en/7/7f/Star_Wars_The_Last_Jedi.jpg";
const POSTER_EP9 = "https://upload.wikimedia.org/wikipedia/en/a/af/Star_Wars_The_Rise_of_Skywalker_poster.jpg";

const EXTRA_FILMS = [
  {
    title: "The Force Awakens",
    episode_id: 7,
    opening_crawl: "Luke Skywalker has vanished. In his absence, the sinister FIRST ORDER has risen from the ashes of the Empire and will not rest until Skywalker, the last Jedi, has been destroyed.",
    director: "J.J. Abrams",
    producer: "Kathleen Kennedy, J.J. Abrams, Bryan Burk",
    release_date: "2015-12-18",
    characters: [], planets: [], starships: [], vehicles: [], species: [],
    url: "https://swapi.info/api/films/7/",
    id: "7",
    image: POSTER_EP7,
  },
  {
    title: "The Last Jedi",
    episode_id: 8,
    opening_crawl: "The FIRST ORDER reigns. Having decimated the peaceful Republic, Supreme Leader Snoke now deploys his merciless legions to seize military control of the galaxy.",
    director: "Rian Johnson",
    producer: "Kathleen Kennedy, Ram Bergman",
    release_date: "2017-12-15",
    characters: [], planets: [], starships: [], vehicles: [], species: [],
    url: "https://swapi.info/api/films/8/",
    id: "8",
    image: POSTER_EP8,
  },
  {
    title: "The Rise of Skywalker",
    episode_id: 9,
    opening_crawl: "The dead speak! The galaxy has heard a mysterious broadcast, a threat of REVENGE in the sinister voice of the late Emperor Palpatine.",
    director: "J.J. Abrams",
    producer: "Kathleen Kennedy, J.J. Abrams, Michelle Rejwan",
    release_date: "2019-12-20",
    characters: [], planets: [], starships: [], vehicles: [], species: [],
    url: "https://swapi.info/api/films/9/",
    id: "9",
    image: POSTER_EP9,
  },
];

// ─── CACHE en memoria ─────────────────────────────────────────────────────────
const cache = {
  people: [],
  planets: [],
  starships: [],
  vehicles: [],
  species: [],
  films: [],
  loaded: {},   // { people: true/false, ... }
  loading: {},  // evita fetches duplicados
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const extractId = (url) => {
  const parts = (url || "").split("/").filter(Boolean);
  return parts[parts.length - 1];
};

const getImagePath = (resource, id) =>
  `${CDN_BASE}/${RESOURCE_MAP[resource]}/${id}.jpg`;

const enrichItem = (resource, item) => {
  const id = item.id || extractId(item.url);
  return { ...item, id, image: item.image || getImagePath(resource, id) };
};

// ─── FETCH Y CACHEO de un recurso completo ────────────────────────────────────
async function loadResource(resource) {
  if (cache.loaded[resource]) return;          // ya tenemos todo
  if (cache.loading[resource]) {               // espera si ya está en curso
    await new Promise((r) => setTimeout(r, 200));
    return loadResource(resource);
  }

  cache.loading[resource] = true;
  console.log(`⬇️  Fetching ALL ${resource} from swapi.info...`);

  try {
    const response = await axios.get(`${SWAPI_BASE_URL}/${resource}/`, {
      timeout: 15000,
    });

    let results = Array.isArray(response.data)
      ? response.data
      : response.data.results || [];

    results = results.map((item) => enrichItem(resource, item));

    // Agregar los films extra si corresponde
    if (resource === "films") {
      const existingIds = new Set(results.map((f) => f.id));
      EXTRA_FILMS.forEach((f) => {
        if (!existingIds.has(f.id)) results.push(f);
      });
      results.sort((a, b) => a.episode_id - b.episode_id);
    }

    cache[resource] = results;
    cache.loaded[resource] = true;
    console.log(`✅ ${resource}: ${results.length} items cacheados`);
  } catch (err) {
    console.error(`❌ Error cargando ${resource}:`, err.message);
  } finally {
    cache.loading[resource] = false;
  }
}

// ─── PRECARGA al arrancar (todo en paralelo) ──────────────────────────────────
async function preloadAll() {
  console.log("🚀 Precargando toda la galaxia...");
  await Promise.all(
    Object.keys(RESOURCE_MAP).map((r) => loadResource(r))
  );
  console.log("🌟 Cache lista. El universo Star Wars está disponible.");
}

// ─── FILTER + PAGINATE desde cache ───────────────────────────────────────────
function fromCache(resource, { search, page, limit = 20 }) {
  let results = [...cache[resource]];

  if (search) {
    const term = search.toLowerCase();
    results = results.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.title && item.title.toLowerCase().includes(term))
    );
  }

  const total = results.length;
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 20;
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = results.slice(start, start + itemsPerPage);

  return { total, currentPage, itemsPerPage, paginated, all: results };
}

// ─── RUTA GENÉRICA (respuesta inmediata desde cache) ─────────────────────────
function makeRoute(resource) {
  // Lista paginada
  app.get(`/api/${resource}`, async (req, res) => {
    // Si aún no cargó, espera (máx 10s)
    if (!cache.loaded[resource]) {
      loadResource(resource); // dispara sin await
      let waited = 0;
      while (!cache.loaded[resource] && waited < 10000) {
        await new Promise((r) => setTimeout(r, 100));
        waited += 100;
      }
    }

    const { total, currentPage, itemsPerPage, paginated } = fromCache(
      resource, req.query
    );
    const base = `${req.protocol}://${req.get("host")}${req.path}`;
    const qs = req.query.search ? `&search=${req.query.search}` : "";

    res.json({
      count: total,
      next:
        currentPage * itemsPerPage < total
          ? `${base}?page=${currentPage + 1}${qs}`
          : null,
      previous: currentPage > 1 ? `${base}?page=${currentPage - 1}${qs}` : null,
      results: paginated,
    });
  });

  // Detalle por ID
  app.get(`/api/${resource}/:id`, async (req, res) => {
    if (!cache.loaded[resource]) await loadResource(resource);

    const item = cache[resource].find((i) => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  });

  // ── SSE STREAM: primeros 10 al instante, resto después ────────────────────
  app.get(`/api/${resource}/stream`, async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event, data) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    // Si no hay cache, empieza a cargar
    const alreadyLoaded = cache.loaded[resource];
    if (!alreadyLoaded) loadResource(resource);

    // Espera a tener al menos algo en cache
    let waited = 0;
    while (cache[resource].length === 0 && waited < 10000) {
      await new Promise((r) => setTimeout(r, 100));
      waited += 100;
    }

    const { search } = req.query;
    const getFiltered = () => {
      let r = [...cache[resource]];
      if (search) {
        const term = search.toLowerCase();
        r = r.filter(
          (i) =>
            (i.name && i.name.toLowerCase().includes(term)) ||
            (i.title && i.title.toLowerCase().includes(term))
        );
      }
      return r;
    };

    // Manda los primeros 10 inmediatamente
    const firstBatch = getFiltered().slice(0, 10);
    send("batch", { items: firstBatch, offset: 0, done: false });

    // Si ya estaba todo cargado, manda el resto de una
    if (alreadyLoaded) {
      const rest = getFiltered().slice(10);
      if (rest.length > 0) send("batch", { items: rest, offset: 10, done: false });
      send("done", { total: getFiltered().length });
      return res.end();
    }

    // Si estaba cargando, espera y manda el resto cuando termine
    let sent = firstBatch.length;
    const interval = setInterval(() => {
      const all = getFiltered();
      if (all.length > sent) {
        const newItems = all.slice(sent);
        send("batch", { items: newItems, offset: sent, done: false });
        sent = all.length;
      }
      if (cache.loaded[resource]) {
        send("done", { total: all.length });
        clearInterval(interval);
        res.end();
      }
    }, 500);

    req.on("close", () => clearInterval(interval));
  });
}

// ─── REGISTRAR RUTAS ──────────────────────────────────────────────────────────
Object.keys(RESOURCE_MAP).forEach(makeRoute);

// ─── RUTA: TODO el universo de una vez ───────────────────────────────────────
app.get("/api/universe", async (req, res) => {
  const resources = Object.keys(RESOURCE_MAP);
  const notLoaded = resources.filter((r) => !cache.loaded[r]);
  if (notLoaded.length > 0) await Promise.all(notLoaded.map(loadResource));

  res.json({
    films:     { count: cache.films.length,     results: cache.films },
    people:    { count: cache.people.length,    results: cache.people },
    planets:   { count: cache.planets.length,   results: cache.planets },
    starships: { count: cache.starships.length, results: cache.starships },
    vehicles:  { count: cache.vehicles.length,  results: cache.vehicles },
    species:   { count: cache.species.length,   results: cache.species },
  });
});

// ─── ESTADO DEL CACHE ─────────────────────────────────────────────────────────
app.get("/api/cache/status", (req, res) => {
  res.json(
    Object.keys(RESOURCE_MAP).reduce((acc, r) => {
      acc[r] = { loaded: !!cache.loaded[r], count: cache[r].length };
      return acc;
    }, {})
  );
});

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Star Wars API is running 🚀" });
});

// ─── ARRANQUE ─────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🌌 Star Wars API → http://localhost:${PORT}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   GET /api/films              → 9 películas (cache)`);
  console.log(`   GET /api/people             → todos los personajes`);
  console.log(`   GET /api/planets            → todos los planetas`);
  console.log(`   GET /api/starships          → todas las naves`);
  console.log(`   GET /api/vehicles           → todos los vehículos`);
  console.log(`   GET /api/species            → todas las species`);
  console.log(`   GET /api/{resource}/stream  → SSE: primeros 10 al instante`);
  console.log(`   GET /api/universe           → todo el universo de una vez`);
  console.log(`   GET /api/cache/status       → estado del cache`);
  console.log(`\n   ?search=yoda  ?page=2  ?limit=10  (en todos los endpoints)\n`);

  // Precarga en background sin bloquear el servidor
  preloadAll();
});