import { IAirQualityProvider, NormalizedAirQualityReading, ProviderError } from './types';
import { Result, Ok, Err, isOk } from '../types/result';
import { CircuitBreaker } from '../resilience/circuitBreaker';
import { RateLimiter } from '../resilience/rateLimiter';

export class WAQIAdapter implements IAirQualityProvider {
  public readonly id = 'waqi';
  public readonly name = 'World Air Quality Index (WAQI)';
  public readonly priority = 4;

  private breaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_WAQI_API_KEY || '';
    this.breaker = new CircuitBreaker({
      name: 'WAQI_API',
      failureThreshold: 3,
      recoveryTimeoutMs: 30000,
    });
    this.rateLimiter = new RateLimiter({
      capacity: 10,
      refillRatePerSecond: 2,
    });
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey) && this.breaker.getState() !== 'OPEN';
  }

  public async fetchByCoordinates(
    lat: number,
    lng: number
  ): Promise<Result<NormalizedAirQualityReading, ProviderError>> {
    if (!this.apiKey) {
      return Err({
        provider: this.id,
        code: 'UNAUTHORIZED',
        message: 'WAQI API key is not configured in environment',
      });
    }

    const acquired = await this.rateLimiter.acquireOrWait(1, 3000);
    if (!acquired) {
      return Err({
        provider: this.id,
        code: 'RATE_LIMIT',
        message: 'WAQI client rate limit exceeded',
      });
    }

    const executionResult = await this.breaker.execute(async () => {
      const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${this.apiKey}`;
      const response = await fetch(url);

      if (response.status === 429) {
        throw new Error('WAQI_429');
      }
      if (!response.ok) {
        throw new Error(`WAQI_HTTP_${response.status}`);
      }

      const data = await response.json();
      if (data.status !== 'ok' || !data.data) {
        throw new Error(`WAQI_ERROR: ${data.data || 'Invalid response'}`);
      }

      const d = data.data;
      const aqi = typeof d.aqi === 'number' ? d.aqi : 50;
      const iaqi = d.iaqi || {};

      const reading: NormalizedAirQualityReading = {
        source: this.id,
        aqi: Math.min(500, Math.max(0, aqi)),
        category: this.getCategory(aqi),
        dominantPollutant: (d.dominentpol || 'PM2.5').toUpperCase(),
        pollutants: {
          pm25: iaqi.pm25?.v,
          pm10: iaqi.pm10?.v,
          o3: iaqi.o3?.v,
          no2: iaqi.no2?.v,
          so2: iaqi.so2?.v,
          co: iaqi.co?.v,
        },
        weather: {
          temperature: iaqi.t?.v,
          humidity: iaqi.h?.v,
          pressure: iaqi.p?.v,
          windSpeed: iaqi.w?.v,
        },
        coordinates: {
          lat: d.city?.geo?.[0] || lat,
          lng: d.city?.geo?.[1] || lng,
        },
        locationName: d.city?.name || 'WAQI Station',
        timestamp: d.time?.iso || new Date().toISOString(),
        confidenceScore: 0.88,
        isSatelliteEstimate: false,
      };

      return reading;
    });

    if (isOk(executionResult)) {
      return Ok(executionResult.value);
    }

    return Err({
      provider: this.id,
      code: 'NETWORK_ERROR',
      message: executionResult.error.message,
      raw: executionResult.error,
    });
  }

  private getCategory(aqi: number): NormalizedAirQualityReading['category'] {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }
}
