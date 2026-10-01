import { IAirQualityProvider, NormalizedAirQualityReading, ProviderError } from './types';
import { Result, Ok, Err, isOk } from '../types/result';
import { CircuitBreaker } from '../resilience/circuitBreaker';

export class NASAAdapter implements IAirQualityProvider {
  public readonly id = 'nasa';
  public readonly name = 'NASA MODIS Satellite AOD';
  public readonly priority = 3;

  private breaker: CircuitBreaker;

  constructor() {
    this.breaker = new CircuitBreaker({
      name: 'NASA_MODIS_API',
      failureThreshold: 4,
      recoveryTimeoutMs: 30000,
    });
  }

  public isAvailable(): boolean {
    return this.breaker.getState() !== 'OPEN';
  }

  public async fetchByCoordinates(
    lat: number,
    lng: number
  ): Promise<Result<NormalizedAirQualityReading, ProviderError>> {
    const executionResult = await this.breaker.execute(async () => {
      // Calculate date range for NASA POWER API (last 7 days to get reliable data)
      const now = new Date();
      const end = now.toISOString().slice(0, 10).replace(/-/g, '');
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const start = past.toISOString().slice(0, 10).replace(/-/g, '');

      // NASA POWER API for meteorological and aerosol estimates
      const targetUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,WS10M,AOD_550&community=RE&longitude=${lng}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
      const proxyUrl = `/api/nasa?url=${encodeURIComponent(targetUrl)}`;

      const res = await fetch(proxyUrl);
      if (!res.ok) {
        throw new Error(`NASA_HTTP_${res.status}`);
      }

      const data = await res.json();
      const params = data.properties?.parameter || {};

      // Get latest valid values
      const aodObj = params['AOD_550'] || {};
      const t2mObj = params['T2M'] || {};
      const rhObj = params['RH2M'] || {};
      const wsObj = params['WS10M'] || {};

      const aodKeys = Object.keys(aodObj).filter((k) => aodObj[k] > -900);
      const latestAodKey = aodKeys[aodKeys.length - 1];
      const rawAod = latestAodKey ? aodObj[latestAodKey] : 0.25;

      // Approximate PM2.5 from Aerosol Optical Depth (AOD)
      // Standard empirical conversion: PM2.5 (ug/m3) ~= AOD * 45 to 60
      const estimatedPm25 = Math.max(5, Math.round(rawAod * 52));
      const aqi = Math.round(estimatedPm25 * 3.6);

      const latestTempKey = Object.keys(t2mObj).pop();
      const latestRhKey = Object.keys(rhObj).pop();
      const latestWsKey = Object.keys(wsObj).pop();

      const reading: NormalizedAirQualityReading = {
        source: this.id,
        aqi: Math.min(500, Math.max(10, aqi)),
        category: this.getCategory(aqi),
        dominantPollutant: 'PM2.5 (Satellite Estimated)',
        pollutants: {
          pm25: estimatedPm25,
          pm10: Math.round(estimatedPm25 * 1.8),
        },
        weather: {
          temperature: latestTempKey ? t2mObj[latestTempKey] : undefined,
          humidity: latestRhKey ? rhObj[latestRhKey] : undefined,
          windSpeed: latestWsKey ? wsObj[latestWsKey] : undefined,
        },
        coordinates: { lat, lng },
        locationName: 'Satellite Observation Grid',
        timestamp: new Date().toISOString(),
        confidenceScore: 0.68,
        isSatelliteEstimate: true,
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
