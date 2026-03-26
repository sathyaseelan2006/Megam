# Megam Air Quality Monitor

Megam is a state-of-the-art 3D interactive application for monitoring real-time global air quality. By combining ground measurements, model-backed history, and atmospheric intelligence, it provides practical insights for cities and remote locations.

![Megam Globe](https://placehold.co/800x400?text=Megam+3D+Globe+Preview)

## Key Features

- **3D Interactive Globe**: Explore global air quality on a realistic 3D Earth model (`react-globe.gl`).
- **Hybrid Data Engine**: Integrates multiple sources:
  - **OpenAQ** (ground measurements)
  - **IQAir** (premium city data)
  - **NASA MODIS** (satellite context)
  - **WAQI** (aggregated fallback)
- **Global Historical Analytics**:
  - Uses **OpenAQ measurements first** and **Open-Meteo model fallback** for wider location coverage.
  - Supports day-level history over **30 / 90 / 365** day windows.
- **Advanced Charting**:
  - Chart types: **Line, Area, Bar, Composed, Scatter**
  - Metric switching: **AQI, PM2.5, PM10**
- **Compare Mode (2-4 locations total)**:
  - Overlay current city with up to **3 additional locations**.
  - Source sync toggle: **Merged (all sources)** vs **Measured only (OpenAQ)**.
  - Optional normalization: **Index (base=100)** for clearer trend-direction comparison.
- **Pollutant Breakdown Charts**:
  - Stacked view for **PM2.5 + PM10**
  - Optional extended layers for **O3 / NO2**
- **AI-Powered Forecasting**:
  - **Client-side ML** with TensorFlow.js for browser-based training/inference.
  - **Generative summaries** using Google Gemini integration.
- **Personalized Health Recommendations**:
  - Dynamic advice based on **AQI + pollutant profile + user profile**.
  - User profile inputs include respiratory sensitivity (e.g., asthma) and outdoor activity level.
- **Education Science Hub**:
  - **Pollutant Encyclopedia** (sources, short/long-term impacts, safe levels).
  - **Research Explorer + News Column** focused on air pollution, climate change, global warming, weather, and atmospheric science.
  - Topic filters and search to quickly discover relevant resources.
- **Privacy & Speed**:
  - Zero-login local experience with browser storage.
  - Vercel-ready serverless proxy architecture.

## Latest Enhancements

- Added resilient history retrieval with Open-Meteo fallback when local measurements are missing.
- Added additional chart modes and richer chart controls.
- Added compare mode with source consistency controls and normalization.
- Added pollutant stacked breakdown visualization.
- Added profile-driven health recommendations in report view.
- Added science-focused research and news discovery in the education area.

## Technical Architecture

For a deeper system overview, see [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md).

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Visualization**: `three.js`, `react-globe.gl`, `recharts`
- **Machine Learning**: `@tensorflow/tfjs`
- **AI Integration**: `@google/genai`
- **Styling**: Tailwind CSS
- **Backend/Proxy**: Vercel serverless functions

### Data & Analytics Notes

- Historical timelines prioritize measured data and backfill with model-based history when needed.
- Data completeness indicators distinguish measured vs non-measured timeline points.
- Compare mode can enforce measured-only mode to improve fairness across locations.
- Education now includes both foundational pollutant content and science/news discovery.

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/megam.git
cd megam
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment setup**

Create your environment file and set API keys:

```bash
cp .env.example .env
```

Example keys:

```env
VITE_OPENAQ_API_KEY=your_openaq_key
VITE_IQAIR_API_KEY=your_iqair_key
VITE_WAQI_API_KEY=your_waqi_key
VITE_NASA_API_KEY=your_nasa_key
VITE_GOOGLE_GENAI_API_KEY=your_gemini_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

4. **Run development server**

```bash
npm run dev
```

5. **Type-check and build**

```bash
npm run lint
npm run build
```

## Machine Learning Pipeline

Megam uses a dual prediction flow:

1. **ML Mode (TensorFlow.js)**: Activated when sufficient historical data is available.
2. **Fast Mode (Statistical)**: Used for sparse-data scenarios and quick response.

## Contributing

Contributions are welcome. Open an issue or submit a PR.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
