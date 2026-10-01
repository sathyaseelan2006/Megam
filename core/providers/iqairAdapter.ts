import { IAirQualityProvider, NormalizedAirQualityReading, ProviderError } from './types';
import { Result, Ok, Err, isOk } from '../types/result';
import { CircuitBreaker } from '../resilience/circuitBreaker';
import { RateLimiter } from '../resilience/rateLimiter';

export class IQAirAdapter implements IAirQualityProvider {
  public readonly id = 'iqair';
  public readonly name = 'IQAir AirVisual';
  public readonly priority = 1;

  private breaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_IQAIR_API_KEY || '';
    this.breaker = new CircuitBreaker({
      name: 'IQAir_API',
      failureThreshold: 3,
      recoveryTimeoutMs: 45000,
    });
    this.rateLimiter = new RateLimiter({
      capacity: 5,
      refillRatePerSecond: 0.5, // Conservative for free tier
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
        message: 'IQAir API key is not configured in environment',
      });
    }

    const acquired = await this.rateLimiter.acquireOrWait(1, 3000);
    if (!acquired) {
      return Err({
        provider: this.id,
        code: 'RATE_LIMIT',
        message: 'IQAir rate limit exceeded on client throttle',
      });
    }

    const executionResult = await this.breaker.execute(async () => {
      const url = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lng}&key=${this.apiKey}`;
      const response = await fetch(url);

      if (response.status === 429) {
        throw new Error('IQAIR_429');
      }
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const data = await response.json();
      if (data.status !== 'success' || !data.data) {
        throw new Error(`IQAIR_ERROR: ${data.data?.message || 'Data unavailable'}`);
      }

      const current = data.data.current;
      const pollution = current?.pollution;
      const weather = current?.weather;

      if (!pollution) {
        throw new Error('IQAIR_NO_POLLUTION_DATA');
      }

      const aqi = pollution.aqius ?? pollution.aqicn ?? 50;

      const reading: NormalizedAirQualityReading = {
        source: this.id,
        aqi,
        category: this.getCategory(aqi),
        dominantPollutant: (pollution.mainus || 'PM2.5').toUpperCase(),
        pollutants: {
          pm25: pollution.mainus === 'p2' ? Math.round(aqi / 3.5) : undefined,
          pm10: pollution.mainus === 'p1' ? Math.round(aqi / 1.5) : undefined,
        },
        weather: weather ? {
          temperature: weather.tp,
          humidity: weather.hu,
          pressure: weather.pr,
          windSpeed: weather.ws,
          windDirection: weather.wd,
        } : undefined,
        coordinates: {
          lat: data.data.location?.coordinates?.[1] || lat,
          lng: data.data.location?.coordinates?.[0] || lng,
        },
        locationName: `${data.data.city || 'Nearest City'}, ${data.data.country || ''}`,
        timestamp: pollution.ts || new Date().toISOString(),
        confidenceScore: 0.98,
        isSatelliteEstimate: false,
      };

      return reading;
    });

    if (isOk(executionResult)) {
      return Ok(executionResult.value);
    }

    const err = executionResult.error;
    const isRateLimit = err.message.includes('IQAIR_429');

    return Err({
      provider: this.id,
      code: isRateLimit ? 'RATE_LIMIT' : 'NETWORK_ERROR',
      message: err.message,
      raw: err,
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
