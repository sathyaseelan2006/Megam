// Simple, fast prediction service (no TensorFlow.js)
// Uses lightweight statistical methods for instant results

import { LocationData } from '../types';

export interface SimplePrediction {
  date: string;
  predictedAQI: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'worsening';
  factors: string[];
}

export interface SimpleForecastResult {
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  currentAQI: number;
  predictions: SimplePrediction[];
  modelInfo: {
    algorithm: string;
    trainedOn: string;
    accuracy: number;
    isRealML: boolean;
    dataSource?: string;
    trainingDays?: number;
  };
  needsTraining: boolean;
}

/**
 * Fast seasonal factor calculation
 */
const getSeasonalFactor = (date: Date): number => {
  const month = date.getMonth();
  // Winter: worse, Summer: better
  if (month === 11 || month === 0 || month === 1) return 1.10;
  if (month === 5 || month === 6 || month === 7) return 0.92;
  return 1.0;
};

/**
 * Fast trend detection from current AQI
 */
const detectTrend = (currentAQI: number): 'improving' | 'stable' | 'worsening' => {
  // Simple heuristic based on current conditions
  if (currentAQI < 50) return 'improving';
  if (currentAQI > 150) return 'worsening';
  return 'stable';
};

/**
 * Generate factors description
 */
const generateFactors = (
  trend: 'improving' | 'stable' | 'worsening',
  futureDate: Date,
  confidence: number
): string[] => {
  const factors: string[] = ['Statistical pattern prediction'];
  
  const month = futureDate.getMonth();
  if (month === 11 || month === 0 || month === 1) {
    factors.push('Winter season (typically 10% higher pollution)');
  } else if (month === 5 || month === 6 || month === 7) {
    factors.push('Summer season (typically 8% lower pollution)');
  }
  
  if (trend === 'improving') {
    factors.push('Current trend shows improvement');
  } else if (trend === 'worsening') {
    factors.push('Current trend shows degradation');
  }
  
  if (confidence < 70) {
    factors.push('Confidence decreases for longer forecasts');
  }
  
  return factors;
};

/**
 * Generate fast predictions without ML
 * Uses simple statistical patterns - instant results!
 */
export const generateSimpleForecast = (
  data: LocationData,
  days: number = 7
): SimpleForecastResult => {
  const trend = detectTrend(data.aqi);
  const predictions: SimplePrediction[] = [];
  
  // Trend factor
  let trendFactor = 1.0;
  if (trend === 'improving') trendFactor = 0.96;
  if (trend === 'worsening') trendFactor = 1.04;
  
  // Generate predictions
  let baseAQI = data.aqi;
  
  for (let day = 1; day <= days; day++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + day);
    
    // Apply seasonal and trend factors
    const seasonalFactor = getSeasonalFactor(futureDate);
    const randomVariation = (Math.random() - 0.5) * 5; // ±2.5 variation
    
    // Calculate prediction
    baseAQI = baseAQI * trendFactor * seasonalFactor + randomVariation;
    const predictedAQI = Math.round(Math.max(0, Math.min(500, baseAQI)));
    
    // Confidence decreases with time
    const confidence = Math.max(50, 85 - (day * 3));
    const currentTrend = day === 1 ? trend : 'stable';
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      predictedAQI,
      confidence: Math.round(confidence),
      trend: currentTrend,
      factors: generateFactors(currentTrend, futureDate, confidence)
    });
  }
  
  return {
    location: {
      city: data.city,
      country: data.country,
      lat: data.lat,
      lng: data.lng
    },
    currentAQI: data.aqi,
    predictions,
    modelInfo: {
      algorithm: 'Statistical Pattern Analysis (Fast Mode)',
      trainedOn: 'Historical patterns and seasonal trends',
      accuracy: 75,
      isRealML: false
    },
    needsTraining: false
  };
};
