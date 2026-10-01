import { Result } from '../types/result';

export type AirQualitySource = 'iqair' | 'openaq' | 'nasa' | 'waqi' | 'simple_forecast' | 'lstm_neural';

export interface PollutantMetrics {
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
}

export interface WeatherMetrics {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  windSpeed?: number;
  windDirection?: number;
}

export interface NormalizedAirQualityReading {
  source: AirQualitySource;
  aqi: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  dominantPollutant: string;
  pollutants: PollutantMetrics;
  weather?: WeatherMetrics;
  coordinates: {
    lat: number;
    lng: number;
  };
  locationName: string;
  stationDistanceKm?: number;
  timestamp: string;
  confidenceScore: number; // 0.0 to 1.0
  isSatelliteEstimate: boolean;
}

export interface ProviderError {
  provider: AirQualitySource;
  code: 'RATE_LIMIT' | 'NOT_FOUND' | 'CIRCUIT_OPEN' | 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'TIMEOUT';
  message: string;
  raw?: unknown;
}

export interface IAirQualityProvider {
  readonly id: AirQualitySource;
  readonly name: string;
  readonly priority: number; // 1 = highest
  
  isAvailable(): boolean;
  fetchByCoordinates(
    lat: number,
    lng: number,
    radiusKm?: number
  ): Promise<Result<NormalizedAirQualityReading, ProviderError>>;
}
