const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Base URLs
const SWAPI_BASE_URL = "https://swapi.info/api"; // Using the source requested by the user
const IMAGE_BASE_URL = "https://starwars-visualguide.com/assets/img";

// Helper to extract ID from SWAPI URL
const extractId = (url) => {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1];
};

// Helper to map SWAPI resource to image path
// Helper to map SWAPI resource to image path
const getImagePath = (resource, id) => {
  // ✨ NUEVA URL: jsDelivr CDN desde GitHub
  const cdnBase = "https://cdn.jsdelivr.net/gh/tbone849/star-wars-guide@master/build/assets/img";
  
  const resourceMap = {
    people: "characters",
    planets: "planets",
    starships: "starships",
    vehicles: "vehicles",
    species: "species",
    films: "films",
  };
  
  return `${cdnBase}/${resourceMap[resource]}/${id}.jpg`;
};
// Generic function to fetch and map data
const fetchData = async (resource, req, res) => {
  try {
    const { page, search } = req.query;
    let url = `${SWAPI_BASE_URL}/${resource}/`;

    const response = await axios.get(url);
    let data = response.data;

    // Handle array response from swapi.info
    let results = Array.isArray(data) ? data : data.results || [];

    // Implement search/filtering
    if (search) {
      const searchTerm = search.toLowerCase();
      results = results.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(searchTerm)) ||
          (item.title && item.title.toLowerCase().includes(searchTerm)),
      );
    }

    const totalCount = results.length;
    const itemsPerPage = 10;
    const currentPage = parseInt(page) || 1;

    // Implement pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Enrich with IDs and images
    const enrichedResults = paginatedResults.map((item) => {
      const id = extractId(item.url);
      return {
        ...item,
        id,
        image: getImagePath(resource, id),
      };
    });

    // Construct response compatible with original SWAPI
    const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
    const nextLine =
      startIndex + itemsPerPage < totalCount
        ? `${baseUrl}?page=${currentPage + 1}${search ? `&search=${search}` : ""}`
        : null;
    const prevLine =
      currentPage > 1
        ? `${baseUrl}?page=${currentPage - 1}${search ? `&search=${search}` : ""}`
        : null;

    res.json({
      count: totalCount,
      next: nextLine,
      previous: prevLine,
      results: enrichedResults,
    });
  } catch (error) {
    console.error(`Error fetching ${resource}:`, error.message);
    res.status(500).json({ error: `Failed to fetch ${resource}` });
  }
};

// Routes
app.get("/api/people", (req, res) => fetchData("people", req, res));
app.get("/api/people/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/people/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath("people", id),
    });
  } catch (error) {
    console.error("Error fetching person:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to fetch person" });
  }
});

app.get("/api/planets", (req, res) => fetchData("planets", req, res));
app.get("/api/planets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/planets/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath("planets", id),
    });
  } catch (error) {
    console.error("Error fetching planet:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to fetch planet" });
  }
});

app.get("/api/starships", (req, res) => fetchData("starships", req, res));
app.get("/api/starships/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/starships/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath("starships", id),
    });
  } catch (error) {
    console.error("Error fetching starship:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to fetch starship" });
  }
});

app.get("/api/vehicles", (req, res) => fetchData("vehicles", req, res));
app.get("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/vehicles/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath("vehicles", id),
    });
  } catch (error) {
    console.error("Error fetching vehicle:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to fetch vehicle" });
  }
});

app.get("/api/films", (req, res) => fetchData("films", req, res));
app.get("/api/films/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/films/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath("films", id),
    });
  } catch (error) {
    console.error("Error fetching film:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to fetch film" });
  }
});

app.get("/api/species", (req, res) => fetchData("species", req, res));
app.get("/api/species/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/species/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath("species", id),
    });
  } catch (error) {
    console.error("Error fetching species:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to fetch species" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Star Wars API is running" });
});



// Start server
app.listen(PORT, () => {
  console.log(`🚀 Star Wars API server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   GET /api/people    - All characters`);
  console.log(`   GET /api/planets   - All planets`);
  console.log(`   GET /api/starships - All starships`);
  console.log(`   GET /api/vehicles  - All vehicles`);
  console.log(`   GET /api/films     - All films`);
  console.log(`   GET /health        - Health check`);
});
