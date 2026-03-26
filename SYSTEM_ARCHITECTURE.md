# Megam System Architecture

## 1. High-Level Overview

Megam is a cutting-edge real-time air quality monitoring application that combines 3D visualization, satellite data, machine learning, and environmental education. The system is designed as a modern Single Page Application (SPA) built with React 19 and Vite, deployed on Vercel's edge network.

The core philosophy of Megam is **"Data Fusion"**: seamlessly merging ground-station measurements (OpenAQ, IQAir) with satellite observations (NASA MODIS, WAQI) to provide comprehensive global air quality coverage, even in remote areas where ground sensors are absent.

## 2. Core Architecture Components

The application follows a modular, service-oriented layered architecture:

```mermaid
graph TD
    subgraph "Frontend Layer (React 19 + Vite)"
        UI[User Interface Components]
        Globe[3D Globe (react-globe.gl)]
        Panels[Info, Analytics, Forecast, History Panels]
        State[React State & Hooks]
    end

    subgraph "Service Layer"
        SatService[Satellite & Data Service]
        MLService[ML & Prediction Service]
        GeoService[Geocoding Service]
        HistService[History Service]
        AnalyticService[Analytics Service]
    end

    subgraph "External APIs & Cloud"
        OpenAQ[OpenAQ API (Ground)]
        IQAir[IQAir API (Premium)]
        NASA[NASA POWER API (Satellite)]
        WAQI[WAQI API (Aggregator)]
        Nominatim[OSM Nominatim (Geocoding)]
        Gemini[Google Gemini AI (LLM)]
    end

    subgraph "Storage & Infrastructure"
        LocStore[Browser LocalStorage]
        IndexedDB[IndexedDB (ML Models)]
        Vercel[Vercel Serverless Functions]
        Env[Environment Variables]
    end

    UI --> Globe
    UI --> Panels
    Panels --> State
    State --> SatService
    State --> MLService
    State --> GeoService

    SatService --> Vercel
    Vercel --> OpenAQ
    SatService --> IQAir
    SatService --> NASA
    SatService --> WAQI

    MLService --> IndexedDB
    MLService --> SatService

    GeoService --> Nominatim

    HistService --> LocStore
```

### 2.1 Frontend Layer
- **Framework:** React 19 with TypeScript, utilizing functional components and hooks.
- **Build Tool:** Vite for lightning-fast HMR and optimized production builds.
- **3D Visualization:** `react-globe.gl` (Three.js wrapper) handles the interactive 3D earth model, rendering air quality data points, heatmaps, and markers.
- **Styling:** Tailwind CSS provides a responsive, glassmorphism-inspired dark UI theme suitable for data visualization.
- **Key Components:**
  - `GlobeComponent`: Renders the 3D earth and interactive markers.
  - `InfoPanel`: Displays comprehensive real-time AQI, pollutants, and weather data.
  - `AnalyticsPanel`: Visualizes historical trends (weekly/monthly/yearly) using `recharts` or custom metrics.
  - `ForecastPanel`: Shows AI-generated or statistical predictions for future air quality.
  - `EducationalPanel`: Interactive encyclopedia of pollutants (PM2.5, NO₂, Ozone, etc.).

### 2.2 Service Layer (Business Logic)
This layer abstracts data fetching, transformation, and complex logic from the UI.
- **`satelliteService.ts`**: The brain of the data operation. It implements a smart "fallback & merge" strategy:
  1.  **Priority 1: IQAir** (Premium, high accuracy, includes weather).
  2.  **Priority 2: OpenAQ** (Official ground stations).
  3.  **Priority 3: NASA MODIS** (Satellite Optical Depth for global coverage).
  4.  **Priority 4: WAQI** (Aggregator fallback).
  - *Data Fusion:* If ground data is missing, it seamlessly falls back to NASA satellite estimates or searches for the nearest station within 100km.
- **`predictionService.ts` & `mlModelService.ts`**: 
  - Uses **TensorFlow.js** (LSTM Neural Networks) running entirely in the browser (Client-side ML).
  - Trains custom models for specific locations using historical data fetched on-demand.
  - Falls back to `simplePredictionService.ts` (statistical heuristics) if ML is disabled or data is insufficient.
- **`geocodingService.ts`**: Handles address-to-coordinate and coordinate-to-address conversions using OpenStreetMap's Nominatim, preventing heavy reliance on paid maps APIs.

### 2.3 Backend / Infrastructure (Serverless)
- **Vercel Serverless Functions (`/api/openaq.ts`)**:
  - Acts as a secure proxy for OpenAQ API requests to handle CORS issues and potentially hide API keys.
  - Ensures reliable data fetching without exposing browser security restrictions.
- **Vercel Deployment**: 
  - Automatic deployments from Git.
  - Edge caching and global CDN distribution.

## 3. Key Feature Workflows

### 3.1 Smart Location Search
1.  User types a city name.
2.  `geocodingService` queries Nominatim or WAQI search to find lat/lng.
3.  App moves the 3D globe camera to the coordinates.
4.  `satelliteService` triggers parallel fetches to all data providers (IQAir, OpenAQ, NASA, WAQI).
5.  The best available data source is selected and displayed, with a "confidence score" indicating reliability.
6.  Location is saved to `localStorage` via `historyService`.

### 3.2 Real-Time ML Forecasting
1.  User opens "Forecast" panel.
2.  App checks if a trained model exists for this location in **IndexedDB**.
3.  **If No Model:** 
    - Fetches 180 days of historical data (OpenAQ/NASA).
    - Initializes TensorFlow.js in a web worker/background process.
    - Trains an LSTM model (Long Short-Term Memory) in the browser.
    - Saves the trained model to IndexedDB.
4.  **Prediction:** Uses the model to forecast the next 7-30 days of AQI trends.
5.  **Fallback:** If ML fails or takes too long, `simplePredictionService` uses statistical analysis (seasonal trends + current momentum) to generate an instant forecast.

### 3.3 Data Privacy & Analytics
- **Zero-Login Architecture:** No user accounts are needed; all preferences (favorites, history) are stored on the device (`localStorage`).
- **Cookie Consent:** A dedicated component manages analytics opt-in.
- **Education:** Integrated content explains complex pollutants (e.g., "What is PM2.5?") without leaving the app.

## 4. Technical Stack Summary

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript | Core application framework |
| **Build** | Vite | Dev server & bundler |
| **3D Engine** | Three.js / React-Globe.gl | Globe rendering & interaction |
| **Styling** | Tailwind CSS | Responsive styling & theming |
| **ML / AI** | TensorFlow.js | Client-side neural network training |
| **GenAI** | Google Gemini (Optional) | Generating natural language summaries |
| **Data APIs** | OpenAQ, IQAir, NASA, WAQI | Air quality data sources |
| **Geocoding** | OSM Nominatim | Location search & reverse geocoding |
| **Deployment** | Vercel | Hosting & Serverless Functions |
| **Storage** | LocalStorage, IndexedDB | Client-side persistence |
