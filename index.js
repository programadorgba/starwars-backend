const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Base URLs
const SWAPI_BASE_URL = 'https://swapi.info/api'; // Using the source requested by the user
const IMAGE_BASE_URL = 'https://starwars-visualguide.com/assets/img';

// Helper to extract ID from SWAPI URL
const extractId = (url) => {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1];
};

// Helper to map SWAPI resource to image path
const getImagePath = (resource, id) => {
  const resourceMap = {
    people: 'characters',
    planets: 'planets',
    starships: 'starships',
    vehicles: 'vehicles',
    species: 'species',
    films: 'films'
  };
  return `${IMAGE_BASE_URL}/${resourceMap[resource]}/${id}.jpg`;
};

// Generic function to fetch and map data
const fetchData = async (resource, req, res) => {
  try {
    const { page, search } = req.query;
    let url = `${SWAPI_BASE_URL}/${resource}/`;
    
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (search) params.append('search', search);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    const data = response.data;

    const results = data.results.map(item => {
      const id = extractId(item.url);
      return {
        ...item,
        id,
        image: getImagePath(resource, id)
      };
    });

    res.json({
      count: data.count,
      next: data.next,
      previous: data.previous,
      results
    });
  } catch (error) {
    console.error(`Error fetching ${resource}:`, error.message);
    res.status(500).json({ error: `Failed to fetch ${resource}` });
  }
};

// Routes
app.get('/api/people', (req, res) => fetchData('people', req, res));
app.get('/api/people/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/people/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath('people', id)
    });
  } catch (error) {
    console.error('Error fetching person:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch person' });
  }
});

app.get('/api/planets', (req, res) => fetchData('planets', req, res));
app.get('/api/planets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/planets/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath('planets', id)
    });
  } catch (error) {
    console.error('Error fetching planet:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch planet' });
  }
});

app.get('/api/starships', (req, res) => fetchData('starships', req, res));
app.get('/api/starships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/starships/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath('starships', id)
    });
  } catch (error) {
    console.error('Error fetching starship:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch starship' });
  }
});

app.get('/api/vehicles', (req, res) => fetchData('vehicles', req, res));
app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/vehicles/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath('vehicles', id)
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch vehicle' });
  }
});

app.get('/api/films', (req, res) => fetchData('films', req, res));
app.get('/api/films/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SWAPI_BASE_URL}/films/${id}/`);
    const data = response.data;
    res.json({
      ...data,
      id,
      image: getImagePath('films', id)
    });
  } catch (error) {
    console.error('Error fetching film:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch film' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Star Wars API is running' });
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
