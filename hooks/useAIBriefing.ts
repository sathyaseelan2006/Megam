import { useState, useEffect } from 'react';
import { AtmosphericBriefing, BriefingInputContext } from '../core/ai/types';
import { globalAIEngine } from '../core/ai/geminiStreamingEngine';
import { globalCache } from '../core/cache/multiTierCache';
import { isErr } from '../core/types/result';

export interface UseAIBriefingReturn {
  briefing: AtmosphericBriefing | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAIBriefing(context: BriefingInputContext | null): UseAIBriefingReturn {
  const [briefing, setBriefing] = useState<AtmosphericBriefing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async () => {
    if (!context || !context.city) return;

    setIsLoading(true);
    setError(null);

    const cacheKey = globalCache.generateSpatialKey(context.lat, context.lng, 'ai_briefing', 5);

    try {
      const cachedOutcome = await globalCache.getOrFetch<AtmosphericBriefing>(
        cacheKey,
        async () => {
          const res = await globalAIEngine.generateAtmosphericBriefing(context);
          if (isErr(res)) throw res.error;
          return res.value;
        },
        30 * 60 * 1000 // 30-minute AI briefing cache
      );

      setBriefing(cachedOutcome.data);
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize AI briefing');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [context?.city, context?.aqi, context?.lat, context?.lng]);

  return {
    briefing,
    isLoading,
    error,
    refresh: fetchBriefing,
  };
}
