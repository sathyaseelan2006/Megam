import { IAirQualityProvider, NormalizedAirQualityReading, ProviderError } from './types';
import { IQAirAdapter } from './iqairAdapter';
import { OpenAQAdapter } from './openaqAdapter';
import { NASAAdapter } from './nasaAdapter';
import { WAQIAdapter } from './waqiAdapter';
import { globalCache } from '../cache/multiTierCache';
import { Result, Ok, Err, isOk } from '../types/result';

export interface FusionResult {
  reading: NormalizedAirQualityReading;
  attemptedProviders: {
    provider: string;
    success: boolean;
    error?: string;
  }[];
  isFromCache: boolean;
  isStale: boolean;
}

export class DataFusionOrchestrator {
  private providers: IAirQualityProvider[];

  constructor(customProviders?: IAirQualityProvider[]) {
    this.providers = customProviders || [
      new IQAirAdapter(),
      new OpenAQAdapter(),
      new NASAAdapter(),
      new WAQIAdapter(),
    ];
    // Sort strictly by priority (1 = highest)
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  public async getAirQuality(
    lat: number,
    lng: number,
    radiusKm: number = 25
  ): Promise<Result<FusionResult, Error>> {
    const cacheKey = globalCache.generateSpatialKey(lat, lng, 'fusion_telemetry', 5);

    try {
      const cacheOutcome = await globalCache.getOrFetch<FusionResult>(
        cacheKey,
        async () => {
          return await this.executeWaterfall(lat, lng, radiusKm);
        },
        20 * 60 * 1000 // 20-minute cache TTL
      );

      return Ok({
        ...cacheOutcome.data,
        isFromCache: cacheOutcome.fromCache,
        isStale: cacheOutcome.isStale,
      });
    } catch (err: any) {
      return Err(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async executeWaterfall(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<FusionResult> {
    const attemptedProviders: FusionResult['attemptedProviders'] = [];

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        attemptedProviders.push({
          provider: provider.name,
          success: false,
          error: 'Provider currently unavailable or circuit open',
        });
        continue;
      }

      try {
        const result = await provider.fetchByCoordinates(lat, lng, radiusKm);
        if (isOk(result)) {
          attemptedProviders.push({
            provider: provider.name,
            success: true,
          });

          return {
            reading: result.value,
            attemptedProviders,
            isFromCache: false,
            isStale: false,
          };
        } else {
          attemptedProviders.push({
            provider: provider.name,
            success: false,
            error: `[${result.error.code}] ${result.error.message}`,
          });
        }
      } catch (err: any) {
        attemptedProviders.push({
          provider: provider.name,
          success: false,
          error: err.message || 'Unexpected exception',
        });
      }
    }

    throw new Error(
      `All 4 data providers failed to retrieve measurements for coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}).`
    );
  }
}

export const globalFusionOrchestrator = new DataFusionOrchestrator();
