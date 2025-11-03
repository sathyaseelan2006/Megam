// ============================================================================
// DATA COLLECTION SERVICE - Real Historical Air Quality Data
// ============================================================================
// Fetches and stores historical AQI data for ML training
// Sources: OpenAQ (ground stations), NASA POWER (satellite), WAQI (backup)
// ============================================================================

import { LocationData } from '../types';

export interface HistoricalDataPoint {
  timestamp: number; // Unix timestamp
  date: string; // ISO date string
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  source: 'openaq' | 'nasa' | 'waqi' | 'interpolated';
  confidence: number; // 0-1 score
}

export interface TrainingDataset {
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  data: HistoricalDataPoint[];
  startDate: string;
  endDate: string;
  totalPoints: number;
  completeness: number; // % of days with data
}

/**
 * Fetch historical data from OpenAQ API v3
 * Returns daily average AQI for the last N days
 */
const fetchOpenAQHistory = async (
  lat: number,
  lng: number,
  days: number
): Promise<HistoricalDataPoint[]> => {
  try {
    const radius = 50000; // 50km search radius
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // OpenAQ v3 measurements endpoint
    const openaqUrl = `https://api.openaq.org/v3/locations?coordinates=${lat},${lng}&radius=${radius}&limit=100`;
    const url = `/api/openaq?url=${encodeURIComponent(openaqUrl)}`;
    
    console.log(`📡 Fetching OpenAQ locations near ${lat.toFixed(2)}, ${lng.toFixed(2)}...`);
    
    const locationsResponse = await fetch(url);
    if (!locationsResponse.ok) {
      throw new Error(`OpenAQ locations failed: ${locationsResponse.status}`);
    }
    
    const locationsData = await locationsResponse.json();
    if (!locationsData.results || locationsData.results.length === 0) {
      console.log('❌ No OpenAQ stations found nearby');
      return [];
    }

    // Get the closest station
    const station = locationsData.results[0];
    const locationId = station.id;
    
    console.log(`📊 Found station: ${station.name} (${locationId})`);

    // Fetch historical measurements
    const openaqMeasurementsUrl = `https://api.openaq.org/v3/locations/${locationId}/measurements?date_from=${startDate.toISOString()}&date_to=${endDate.toISOString()}&limit=1000`;
    const measurementsUrl = `/api/openaq?url=${encodeURIComponent(openaqMeasurementsUrl)}`;
    
    const measurementsResponse = await fetch(measurementsUrl);
    if (!measurementsResponse.ok) {
      throw new Error(`OpenAQ measurements failed: ${measurementsResponse.status}`);
    }

    const measurementsData = await measurementsResponse.json();
    
    // Group by day and calculate daily averages
    const dailyData = new Map<string, {
      pm25: number[];
      pm10: number[];
      o3: number[];
      no2: number[];
      so2: number[];
      co: number[];
    }>();

    measurementsData.results?.forEach((measurement: any) => {
      const date = measurement.date.utc.split('T')[0]; // Get YYYY-MM-DD
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          pm25: [],
          pm10: [],
          o3: [],
          no2: [],
          so2: [],
          co: []
        });
      }

      const dayData = dailyData.get(date)!;
      const parameter = measurement.parameter;
      const value = measurement.value;

      if (parameter === 'pm25') dayData.pm25.push(value);
      else if (parameter === 'pm10') dayData.pm10.push(value);
      else if (parameter === 'o3') dayData.o3.push(value);
      else if (parameter === 'no2') dayData.no2.push(value);
      else if (parameter === 'so2') dayData.so2.push(value);
      else if (parameter === 'co') dayData.co.push(value);
    });

    // Convert to HistoricalDataPoint array
    const historicalData: HistoricalDataPoint[] = [];
    
    dailyData.forEach((pollutants, dateStr) => {
      const avgPM25 = pollutants.pm25.length > 0
        ? pollutants.pm25.reduce((a, b) => a + b, 0) / pollutants.pm25.length
        : 0;
      
      const avgPM10 = pollutants.pm10.length > 0
        ? pollutants.pm10.reduce((a, b) => a + b, 0) / pollutants.pm10.length
        : 0;

      const avgO3 = pollutants.o3.length > 0
        ? pollutants.o3.reduce((a, b) => a + b, 0) / pollutants.o3.length
        : 0;

      const avgNO2 = pollutants.no2.length > 0
        ? pollutants.no2.reduce((a, b) => a + b, 0) / pollutants.no2.length
        : 0;

      const avgSO2 = pollutants.so2.length > 0
        ? pollutants.so2.reduce((a, b) => a + b, 0) / pollutants.so2.length
        : 0;

      const avgCO = pollutants.co.length > 0
        ? pollutants.co.reduce((a, b) => a + b, 0) / pollutants.co.length
        : 0;

      // Calculate AQI from PM2.5 (simplified - US EPA formula)
      const aqi = calculateAQIFromPM25(avgPM25);

      historicalData.push({
        timestamp: new Date(dateStr).getTime(),
        date: dateStr,
        aqi,
        pm25: Math.round(avgPM25 * 10) / 10,
        pm10: Math.round(avgPM10 * 10) / 10,
        o3: Math.round(avgO3 * 10) / 10,
        no2: Math.round(avgNO2 * 10) / 10,
        so2: Math.round(avgSO2 * 10) / 10,
        co: Math.round(avgCO * 10) / 10,
        source: 'openaq',
        confidence: pollutants.pm25.length >= 12 ? 1.0 : 0.7 // High confidence if 12+ readings per day
      });
    });

    console.log(`✅ Collected ${historicalData.length} days of OpenAQ data`);
    return historicalData.sort((a, b) => a.timestamp - b.timestamp);

  } catch (error) {
    console.error('❌ OpenAQ history fetch failed:', error);
    return [];
  }
};

/**
 * Calculate US EPA AQI from PM2.5 concentration
 * PM2.5 in µg/m³ → AQI (0-500 scale)
 */
const calculateAQIFromPM25 = (pm25: number): number => {
  if (pm25 < 0) return 0;
  if (pm25 <= 12.0) return Math.round(((50 - 0) / (12.0 - 0.0)) * pm25 + 0);
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  if (pm25 <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301);
  if (pm25 <= 500.4) return Math.round(((500 - 401) / (500.4 - 350.5)) * (pm25 - 350.5) + 401);
  return 500;
};

/**
 * Fetch NASA POWER satellite data (backup for ground stations)
 * AOD (Aerosol Optical Depth) can be converted to approximate AQI
 */
const fetchNASAHistory = async (
  lat: number,
  lng: number,
  days: number
): Promise<HistoricalDataPoint[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=AOD_550&community=RE&longitude=${lng}&latitude=${lat}&start=${startDateStr}&end=${endDateStr}&format=JSON`;

    console.log(`🛰️ Fetching NASA POWER data for ${days} days...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA API failed: ${response.status}`);
    }

    const data = await response.json();
    const aodData = data.properties?.parameter?.AOD_550;

    if (!aodData) {
      console.log('❌ No NASA AOD data available');
      return [];
    }

    const historicalData: HistoricalDataPoint[] = [];

    Object.entries(aodData).forEach(([dateStr, aodValue]) => {
      const aod = aodValue as number;
      
      // Skip invalid values (-999 = no data)
      if (aod < 0) return;

      // Convert AOD to approximate AQI (empirical formula)
      // AOD 0.0-0.1 = Good (0-50)
      // AOD 0.1-0.3 = Moderate (51-100)
      // AOD 0.3-0.5 = Unhealthy for Sensitive (101-150)
      // AOD > 0.5 = Unhealthy+ (150+)
      const aqi = Math.min(500, Math.round(aod * 300));

      // Parse date YYYYMMDD to ISO
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const isoDate = `${year}-${month}-${day}`;

      historicalData.push({
        timestamp: new Date(isoDate).getTime(),
        date: isoDate,
        aqi,
        pm25: 0, // NASA doesn't provide individual pollutants
        pm10: 0,
        o3: 0,
        no2: 0,
        so2: 0,
        co: 0,
        source: 'nasa',
        confidence: 0.6 // Lower confidence than ground stations
      });
    });

    console.log(`✅ Collected ${historicalData.length} days of NASA data`);
    return historicalData.sort((a, b) => a.timestamp - b.timestamp);

  } catch (error) {
    console.error('❌ NASA history fetch failed:', error);
    return [];
  }
};

/**
 * Fill gaps in historical data with interpolation
 * Creates smooth transitions between known data points
 */
const interpolateMissingDays = (
  data: HistoricalDataPoint[],
  totalDays: number
): HistoricalDataPoint[] => {
  if (data.length === 0) return [];

  const filledData: HistoricalDataPoint[] = [];
  const dataMap = new Map(data.map(d => [d.date, d]));

  const endDate = new Date();
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(endDate);
    currentDate.setDate(currentDate.getDate() - (totalDays - 1 - i));
    const dateStr = currentDate.toISOString().split('T')[0];

    if (dataMap.has(dateStr)) {
      // Use existing data
      filledData.push(dataMap.get(dateStr)!);
    } else {
      // Interpolate from nearest neighbors
      const beforeData = data.filter(d => d.timestamp < currentDate.getTime());
      const afterData = data.filter(d => d.timestamp > currentDate.getTime());

      if (beforeData.length > 0 && afterData.length > 0) {
        const before = beforeData[beforeData.length - 1];
        const after = afterData[0];
        
        // Linear interpolation
        const ratio = (currentDate.getTime() - before.timestamp) / (after.timestamp - before.timestamp);
        const interpolatedAQI = Math.round(before.aqi + (after.aqi - before.aqi) * ratio);

        filledData.push({
          timestamp: currentDate.getTime(),
          date: dateStr,
          aqi: interpolatedAQI,
          pm25: Math.round((before.pm25 + after.pm25) / 2 * 10) / 10,
          pm10: Math.round((before.pm10 + after.pm10) / 2 * 10) / 10,
          o3: Math.round((before.o3 + after.o3) / 2 * 10) / 10,
          no2: Math.round((before.no2 + after.no2) / 2 * 10) / 10,
          so2: Math.round((before.so2 + after.so2) / 2 * 10) / 10,
          co: Math.round((before.co + after.co) / 2 * 10) / 10,
          source: 'interpolated',
          confidence: 0.5
        });
      } else if (beforeData.length > 0) {
        // Use last known value
        const last = beforeData[beforeData.length - 1];
        filledData.push({
          ...last,
          timestamp: currentDate.getTime(),
          date: dateStr,
          source: 'interpolated',
          confidence: 0.4
        });
      }
    }
  }

  return filledData;
};

/**
 * Main function: Collect comprehensive historical dataset
 * Combines multiple sources and fills gaps
 */
export const collectHistoricalData = async (
  lat: number,
  lng: number,
  days: number = 180, // 6 months default for ML training
  city: string = 'Unknown',
  country: string = 'Unknown'
): Promise<TrainingDataset> => {
  console.log(`🔍 Collecting ${days} days of historical data for ${city}, ${country}...`);
  console.log(`📍 Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

  // Fetch from multiple sources in parallel
  const [openaqData, nasaData] = await Promise.all([
    fetchOpenAQHistory(lat, lng, days),
    fetchNASAHistory(lat, lng, days)
  ]);

  // Merge data, preferring OpenAQ (higher confidence)
  const mergedMap = new Map<string, HistoricalDataPoint>();
  
  // Add NASA data first (lower priority)
  nasaData.forEach(point => {
    mergedMap.set(point.date, point);
  });

  // Overwrite with OpenAQ data (higher priority)
  openaqData.forEach(point => {
    mergedMap.set(point.date, point);
  });

  const mergedData = Array.from(mergedMap.values()).sort((a, b) => a.timestamp - b.timestamp);

  // Fill gaps with interpolation
  const completeData = interpolateMissingDays(mergedData, days);

  const startDate = completeData.length > 0 ? completeData[0].date : '';
  const endDate = completeData.length > 0 ? completeData[completeData.length - 1].date : '';
  const completeness = (completeData.filter(d => d.source !== 'interpolated').length / days) * 100;

  console.log(`✅ Dataset complete: ${completeData.length} days, ${completeness.toFixed(1)}% real data`);

  return {
    location: { lat, lng, city, country },
    data: completeData,
    startDate,
    endDate,
    totalPoints: completeData.length,
    completeness: Math.round(completeness * 10) / 10
  };
};

/**
 * Cache historical data in localStorage
 * Reduces API calls for repeated predictions
 */
export const cacheHistoricalData = (dataset: TrainingDataset): void => {
  const cacheKey = `aqi_history_${dataset.location.lat.toFixed(2)}_${dataset.location.lng.toFixed(2)}`;
  const cacheData = {
    dataset,
    cachedAt: Date.now()
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  console.log(`💾 Cached ${dataset.totalPoints} days of data`);
};

/**
 * Retrieve cached historical data (if less than 24 hours old)
 */
export const getCachedHistoricalData = (lat: number, lng: number): TrainingDataset | null => {
  const cacheKey = `aqi_history_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (!cached) return null;

  try {
    const { dataset, cachedAt } = JSON.parse(cached);
    const ageHours = (Date.now() - cachedAt) / (1000 * 60 * 60);
    
    if (ageHours < 24) {
      console.log(`📦 Using cached data (${ageHours.toFixed(1)}h old)`);
      return dataset;
    } else {
      console.log(`⏰ Cache expired (${ageHours.toFixed(1)}h old), fetching fresh data`);
      return null;
    }
  } catch {
    return null;
  }
};
