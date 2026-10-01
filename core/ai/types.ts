export interface HealthAudienceAdvisory {
  generalPublic: string;
  sensitiveGroups: string; // Children, elderly, respiratory/cardiac conditions
  outdoorAthletes: string;
}

export interface AtmosphericBriefing {
  executiveSummary: string;
  airQualityStatus: 'OPTIMAL' | 'MODERATE' | 'CAUTION' | 'HAZARDOUS';
  rootCauseAnalysis: string;
  meteorologicalInfluence: string; // How wind, temperature, humidity interact with pollutants
  healthAdvisories: HealthAudienceAdvisory;
  actionableRecommendations: string[];
  suggestedProtectiveGear?: 'NONE' | 'SURGICAL_MASK' | 'N95_RESPIRATOR' | 'FULL_SEAL_RESPIRATOR';
  timestamp: string;
  model: string;
}

export interface BriefingInputContext {
  city: string;
  country: string;
  lat: number;
  lng: number;
  aqi: number;
  dominantPollutant: string;
  pollutants: {
    pm25?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
    so2?: number;
    co?: number;
  };
  weather?: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
  };
  isSatelliteEstimate?: boolean;
}
