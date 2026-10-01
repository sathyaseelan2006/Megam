import { IAirQualityProvider, NormalizedAirQualityReading, ProviderError } from './types';
import { Result, Ok, Err, isOk } from '../types/result';
import { CircuitBreaker } from '../resilience/circuitBreaker';
import { RateLimiter } from '../resilience/rateLimiter';

export class OpenAQAdapter implements IAirQualityProvider {
  public readonly id = 'openaq';
  public readonly name = 'OpenAQ Global Ground Sensors';
  public readonly priority = 2;

  private breaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAQ_API_KEY || '';
    this.breaker = new CircuitBreaker({
      name: 'OpenAQ_API',
      failureThreshold: 3,
      recoveryTimeoutMs: 30000,
    });
    // Limit to 5 requests per second bursts, 1 req/sec steady
    this.rateLimiter = new RateLimiter({
      capacity: 5,
      refillRatePerSecond: 1,
    });
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey) && this.breaker.getState() !== 'OPEN';
  }

  public async fetchByCoordinates(
    lat: number,
    lng: number,
    radiusKm: number = 25
  ): Promise<Result<NormalizedAirQualityReading, ProviderError>> {
    if (!this.apiKey) {
      return Err({
        provider: this.id,
        code: 'UNAUTHORIZED',
        message: 'OpenAQ API key is not configured in environment',
      });
    }

    const acquired = await this.rateLimiter.acquireOrWait(1, 3000);
    if (!acquired) {
      return Err({
        provider: this.id,
        code: 'RATE_LIMIT',
        message: 'OpenAQ rate limit exceeded on client throttle',
      });
    }

    const executionResult = await this.breaker.execute(async () => {
      const maxRadiusMeters = Math.min(radiusKm * 1000, 25000);
      const url = `https://api.openaq.org/v3/locations?coordinates=${lat},${lng}&radius=${maxRadiusMeters}&limit=3`;
      const proxyUrl = `/api/openaq?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);
      if (response.status === 429) {
        throw new Error('OPENAQ_429');
      }
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const data = await response.json();
      const locations = data.results || [];
      if (locations.length === 0) {
        throw new Error('NO_STATIONS_FOUND');
      }

      const primaryStation = locations[0];
      const latestUrl = `https://api.openaq.org/v3/latest?location_id=${primaryStation.id}`;
      const proxyLatest = `/api/openaq?url=${encodeURIComponent(latestUrl)}`;
      const latestRes = await fetch(proxyLatest);
      const latestData = latestRes.ok ? await latestRes.json() : { results: [] };

      const params = latestData.results?.[0]?.parameters || [];
      const pollutants: Record<string, number> = {};

      for (const p of params) {
        const paramName = (p.parameter || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (typeof p.lastValue === 'number' && p.lastValue >= 0) {
          pollutants[paramName] = p.lastValue;
        }
      }

      // Calculate approximate AQI from PM2.5 or PM10 if present
      const pm25 = pollutants['pm25'] ?? pollutants['pm2.5'];
      const aqi = pm25 ? Math.round(pm25 * 3.5) : (pollutants['pm10'] ? Math.round(pollutants['pm10'] * 1.5) : 50);

      const reading: NormalizedAirQualityReading = {
        source: this.id,
        aqi: Math.min(500, Math.max(0, aqi)),
        category: this.getCategory(aqi),
        dominantPollutant: pm25 ? 'PM2.5' : (pollutants['pm10'] ? 'PM10' : 'O3'),
        pollutants: {
          pm25,
          pm10: pollutants['pm10'],
          o3: pollutants['o3'],
          no2: pollutants['no2'],
          so2: pollutants['so2'],
          co: pollutants['co'],
        },
        coordinates: {
          lat: primaryStation.coordinates?.latitude || lat,
          lng: primaryStation.coordinates?.longitude || lng,
        },
        locationName: primaryStation.name || primaryStation.locality || 'OpenAQ Station',
        stationDistanceKm: primaryStation.distance ? Math.round(primaryStation.distance / 1000) : undefined,
        timestamp: new Date().toISOString(),
        confidenceScore: 0.92,
        isSatelliteEstimate: false,
      };

      return reading;
    });

    if (isOk(executionResult)) {
      return Ok(executionResult.value);
    }

    const err = executionResult.error;
    const isRateLimit = err.message.includes('OPENAQ_429');
    const isNotFound = err.message.includes('NO_STATIONS_FOUND');

    return Err({
      provider: this.id,
      code: isRateLimit ? 'RATE_LIMIT' : (isNotFound ? 'NOT_FOUND' : 'NETWORK_ERROR'),
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
