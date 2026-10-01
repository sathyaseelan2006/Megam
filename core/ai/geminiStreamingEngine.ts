import { GoogleGenAI, Type } from '@google/genai';
import { AtmosphericBriefing, BriefingInputContext } from './types';
import { Result, Ok, Err, isOk } from '../types/result';
import { CircuitBreaker } from '../resilience/circuitBreaker';

const getApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.VITE_GOOGLE_GENAI_KEY ||
      import.meta.env.VITE_API_KEY
    );
  }
  return undefined;
};

const briefingSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: 'A 2-sentence executive summary of current air safety and primary pollutant concerns.',
    },
    airQualityStatus: {
      type: Type.STRING,
      enum: ['OPTIMAL', 'MODERATE', 'CAUTION', 'HAZARDOUS'],
    },
    rootCauseAnalysis: {
      type: Type.STRING,
      description: 'Scientific explanation of why the dominant pollutant reached its current concentration.',
    },
    meteorologicalInfluence: {
      type: Type.STRING,
      description: 'Analysis of how local temperature, wind velocity, and humidity amplify or disperse pollution.',
    },
    healthAdvisories: {
      type: Type.OBJECT,
      properties: {
        generalPublic: { type: Type.STRING },
        sensitiveGroups: { type: Type.STRING },
        outdoorAthletes: { type: Type.STRING },
      },
      required: ['generalPublic', 'sensitiveGroups', 'outdoorAthletes'],
    },
    actionableRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 concise, high-impact precautions (ventilation, air filters, timing).',
    },
    suggestedProtectiveGear: {
      type: Type.STRING,
      enum: ['NONE', 'SURGICAL_MASK', 'N95_RESPIRATOR', 'FULL_SEAL_RESPIRATOR'],
    },
  },
  required: [
    'executiveSummary',
    'airQualityStatus',
    'rootCauseAnalysis',
    'meteorologicalInfluence',
    'healthAdvisories',
    'actionableRecommendations',
    'suggestedProtectiveGear',
  ],
};

export class GeminiAtmosphericEngine {
  private aiClient: GoogleGenAI | null = null;
  private breaker: CircuitBreaker;

  constructor() {
    this.breaker = new CircuitBreaker({
      name: 'Gemini_GenAI_API',
      failureThreshold: 3,
      recoveryTimeoutMs: 60000,
    });
    this.initClient();
  }

  private initClient(): void {
    const key = getApiKey();
    if (key) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: key });
      } catch (err) {
        console.warn('[GeminiAtmosphericEngine] Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.aiClient) && this.breaker.getState() !== 'OPEN';
  }

  public async generateAtmosphericBriefing(
    context: BriefingInputContext
  ): Promise<Result<AtmosphericBriefing, Error>> {
    if (!this.aiClient) {
      // Return scientific fallback generator if no API key is provided
      return Ok(this.generateHeuristicBriefing(context));
    }

    const executionResult = await this.breaker.execute(async () => {
      const prompt = `You are an expert atmospheric scientist and environmental epidemiologist.
Analyze the following real-time telemetry:
- Location: ${context.city}, ${context.country} (${context.lat.toFixed(4)}, ${context.lng.toFixed(4)})
- Current AQI: ${context.aqi} (Dominant Pollutant: ${context.dominantPollutant})
- Pollutant Concentrations: PM2.5=${context.pollutants.pm25 ?? 'N/A'} µg/m³, PM10=${context.pollutants.pm10 ?? 'N/A'} µg/m³, O3=${context.pollutants.o3 ?? 'N/A'} ppb, NO2=${context.pollutants.no2 ?? 'N/A'} ppb, SO2=${context.pollutants.so2 ?? 'N/A'} ppb, CO=${context.pollutants.co ?? 'N/A'} ppm
- Weather Conditions: Temperature=${context.weather?.temperature ?? 'N/A'}°C, Humidity=${context.weather?.humidity ?? 'N/A'}%, WindSpeed=${context.weather?.windSpeed ?? 'N/A'} m/s, WindDirection=${context.weather?.windDirection ?? 'N/A'}°
- Data Source Type: ${context.isSatelliteEstimate ? 'NASA Satellite AOD Observation' : 'Ground Sensor Network'}

Produce a structured, rigorous atmospheric intelligence briefing.`;

      const response = await this.aiClient!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: briefingSchema,
        },
      });

      const rawText = response.text ? response.text.trim() : '';
      if (!rawText) throw new Error('Empty response from Gemini API');

      const parsed = JSON.parse(rawText) as AtmosphericBriefing;
      parsed.timestamp = new Date().toISOString();
      parsed.model = 'Gemini 2.5 Flash';
      return parsed;
    });

    if (isOk(executionResult)) {
      return Ok(executionResult.value);
    }

    // Gracefully degrade to heuristic briefing on API error
    console.warn('[GeminiAtmosphericEngine] API invocation failed, falling back to heuristic engine:', executionResult.error);
    return Ok(this.generateHeuristicBriefing(context));
  }

  private generateHeuristicBriefing(ctx: BriefingInputContext): AtmosphericBriefing {
    const aqi = ctx.aqi;
    let status: AtmosphericBriefing['airQualityStatus'] = 'OPTIMAL';
    let mask: AtmosphericBriefing['suggestedProtectiveGear'] = 'NONE';

    if (aqi <= 50) {
      status = 'OPTIMAL';
      mask = 'NONE';
    } else if (aqi <= 100) {
      status = 'MODERATE';
      mask = 'NONE';
    } else if (aqi <= 150) {
      status = 'CAUTION';
      mask = 'SURGICAL_MASK';
    } else {
      status = 'HAZARDOUS';
      mask = 'N95_RESPIRATOR';
    }

    const windSpeed = ctx.weather?.windSpeed ?? 2.5;
    const windEffect = windSpeed < 2.0
      ? 'Low atmospheric boundary velocity is causing localized pollutant stagnation and particulate accumulation.'
      : 'Moderate wind flow is actively dispersing airborne particulates across regional tropospheric channels.';

    return {
      executiveSummary: `Air quality in ${ctx.city} is currently categorized as ${status} (AQI ${aqi}), governed primarily by ${ctx.dominantPollutant}.`,
      airQualityStatus: status,
      rootCauseAnalysis: `Elevated levels of ${ctx.dominantPollutant} typically correlate with combustion emissions, vehicular transport, and industrial aerosol precursors.`,
      meteorologicalInfluence: windEffect,
      healthAdvisories: {
        generalPublic: aqi > 100 ? 'Reduce prolonged outdoor exertion during peak afternoon hours.' : 'Outdoor activities are generally safe for the general population.',
        sensitiveGroups: aqi > 75 ? 'Individuals with asthma, COPD, or cardiovascular conditions should limit heavy outdoor exertion and maintain inhaler access.' : 'Air conditions are favorable with minimal respiratory risk.',
        outdoorAthletes: aqi > 100 ? 'Reschedule intense aerobic workouts indoors or train during early morning hours.' : 'Normal endurance training parameters permitted.',
      },
      actionableRecommendations: [
        aqi > 100 ? 'Run HEPA-grade indoor air purifiers.' : 'Maintain natural room ventilation while outdoor levels remain low.',
        aqi > 150 ? 'Wear an N95/FFP2 rated respirator for necessary outdoor transit.' : 'No respiratory PPE required for healthy individuals.',
        'Hydrate regularly to support upper respiratory tract mucosal clearance.',
      ],
      suggestedProtectiveGear: mask,
      timestamp: new Date().toISOString(),
      model: 'Heuristic Atmospheric Expert Engine (Offline Mode)',
    };
  }
}

export const globalAIEngine = new GeminiAtmosphericEngine();
