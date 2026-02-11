# Star Wars Backend API

A simple and fast Node.js backend using Express to fetch data from the Star Wars API (SWAPI) and enrich it with character images.

## 🚀 Features

- **Character Enrichment**: Automatically links characters, planets, starships, etc., with their corresponding images from [Star Wars Visual Guide](https://starwars-visualguide.com/).
- **API Source**: Uses `swapi.info` as the data source.
- **Search & Pagination**: Full support for query parameters on main endpoints.
- **Health Check**: Endpoint to verify system status.

## 🛠️ Technologies

- **Node.js**
- **Express.js**
- **Axios**
- **CORS**
- **Dotenv**

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd starwars-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on the example:

   ```bash
   cp .env.example .env
   ```

4. Start the server:

   ```bash
   # Production mode
   npm start

   # Development mode (requires nodemon)
   npm run dev
   ```

## 📡 Endpoints

The server runs by default on `http://localhost:3002`.

| Endpoint              | Description                    |
| --------------------- | ------------------------------ |
| `GET /api/people`     | List of all characters (paged) |
| `GET /api/people/:id` | Detail of a specific character |
| `GET /api/planets`    | List of all planets            |
| `GET /api/starships`  | List of all starships          |
| `GET /api/vehicles`   | List of all vehicles           |
| `GET /api/films`      | List of all films              |
| `GET /health`         | API status check               |

## 🖼️ Image Mapping

This backend maps IDs from SWAPI to the Visual Guide assets to provide high-quality images for every resource.

---

Created by [Gerardo Balboa](https://github.com/gerardobalboa)
