export interface AQILevel {
  level: string;
  range: [number, number];
  className: string;
  healthImpact: string;
}

export interface Pollutant {
  name: string;
  concentration: number;
  unit: string;
}

export interface WeatherData {
  temperature?: number; // Celsius
  humidity?: number; // Percentage
  pressure?: number; // hPa
  windSpeed?: number; // m/s
  windDirection?: number; // degrees
  description?: string; // e.g., "Clear sky", "Cloudy"
  icon?: string; // Weather condition icon
}

export interface LocationData {
  city: string;
  country: string;
  lat: number;
  lng: number;
  aqi: number;
  summary: string;
  pollutants: Pollutant[];
  healthAdvisory: string[];
  weather?: WeatherData; // Weather/Climate information
  dataSource?: 'satellite' | 'ground' | 'hybrid' | 'ai';
  lastUpdated?: string;
  confidence?: number; // 0-100
  nearestStationDistance?: number; // km from searched location
}

export interface HistoryEntry {
  id: string;
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  aqi: number;
  timestamp: number;
  isFavorite?: boolean;
}

export interface PredictionData {
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  predictions: {
    date: string;
    predictedAQI: number;
    confidence: number;
    trend: 'improving' | 'stable' | 'worsening';
    factors: string[];
  }[];
  modelVersion: string;
  generatedAt: string;
}

export interface SatelliteData {
  source: string; // e.g., 'Sentinel-5P', 'NASA MODIS', 'ESA Copernicus'
  parameter: string; // e.g., 'NO2', 'O3', 'AOD'
  value: number;
  unit: string;
  timestamp: string;
  coverage: 'global' | 'regional' | 'local';
}

export interface GroundStationData {
  stationId: string;
  stationName: string;
  distance: number; // km from query location
  measurements: {
    parameter: string;
    value: number;
    unit: string;
    timestamp: string;
  }[];
  dataQuality: 'high' | 'medium' | 'low';
}

export interface Review {
  id: string;
  username: string;
  comment: string;
  timestamp: number;
  rating?: number; // Optional 1-5 star rating
  location?: string; // Optional location context
}
