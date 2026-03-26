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
  source: 'openaq' | 'openmeteo' | 'waqi' | 'interpolated';
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

const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);

// Simple approximation used across the app (see satelliteService.ts)
const estimateAQIFromPM25 = (pm25: number): number => {
  if (!Number.isFinite(pm25) || pm25 <= 0) return 0;
  return Math.min(500, Math.max(0, Math.round(pm25 * 4)));
};

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
    // OpenAQ v3 radius is capped (meters). Keep this at/under 25km to avoid 422.
    const radius = 25000; // 25km search radius
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // OpenAQ v3 measurements endpoint
    const openaqUrl = `https://api.openaq.org/v3/locations?coordinates=${lat},${lng}&radius=${radius}&limit=100`;
    const url = `/api/openaq?url=${encodeURIComponent(openaqUrl)}`;
    
    console.log(`📡 Fetching OpenAQ locations near ${lat.toFixed(2)}, ${lng.toFixed(2)}...`);
    
    const locationsResponse = await fetch(url);
    if (!locationsResponse.ok) {
      let details = '';
      try {
        const errJson = await locationsResponse.json();
        details = typeof errJson === 'string' ? errJson : JSON.stringify(errJson);
      } catch {
        // ignore
      }
      throw new Error(`OpenAQ locations failed: ${locationsResponse.status}${details ? ` - ${details}` : ''}`);
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
    // OpenAQ v3 exposes measurements as a top-level collection; some per-location routes return 404.
    const openaqMeasurementsUrl = `https://api.openaq.org/v3/measurements?location_id=${locationId}&date_from=${startDate.toISOString()}&date_to=${endDate.toISOString()}&limit=1000`;
    const measurementsUrl = `/api/openaq?url=${encodeURIComponent(openaqMeasurementsUrl)}`;
    
    const measurementsResponse = await fetch(measurementsUrl);
    if (measurementsResponse.status === 404) {
      console.log('❌ No OpenAQ measurements found for this station');
      return [];
    }
    if (!measurementsResponse.ok) {
      let details = '';
      try {
        const errJson = await measurementsResponse.json();
        details = typeof errJson === 'string' ? errJson : JSON.stringify(errJson);
      } catch {
        // ignore
      }
      throw new Error(`OpenAQ measurements failed: ${measurementsResponse.status}${details ? ` - ${details}` : ''}`);
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
      const dateUtc = measurement?.date?.utc || measurement?.date?.local;
      if (!dateUtc || typeof dateUtc !== 'string') return;

      const date = dateUtc.split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { pm25: [], pm10: [], o3: [], no2: [], so2: [], co: [] });
      }

      const value = Number(measurement?.value);
      if (!Number.isFinite(value)) return;

      const parameter = String(measurement?.parameter || '').toLowerCase();
      const dayData = dailyData.get(date)!;

      if (parameter === 'pm25' || parameter === 'pm2.5' || parameter === 'pm2_5') dayData.pm25.push(value);
      else if (parameter === 'pm10') dayData.pm10.push(value);
      else if (parameter === 'o3' || parameter === 'ozone') dayData.o3.push(value);
      else if (parameter === 'no2' || parameter === 'nitrogen_dioxide') dayData.no2.push(value);
      else if (parameter === 'so2' || parameter === 'sulphur_dioxide' || parameter === 'sulfur_dioxide') dayData.so2.push(value);
      else if (parameter === 'co' || parameter === 'carbon_monoxide') dayData.co.push(value);
    });

    if (dailyData.size === 0) {
      console.log('❌ No OpenAQ measurements found');
      return [];
    }

    const historicalData: HistoricalDataPoint[] = Array.from(dailyData.entries())
      .map(([date, v]) => {
        const pm25 = avg(v.pm25);
        const pm10 = avg(v.pm10);
        const o3 = avg(v.o3);
        const no2 = avg(v.no2);
        const so2 = avg(v.so2);
        const co = avg(v.co);

        const aqiFromPm25 = estimateAQIFromPM25(pm25);
        const aqiFromPm10 = pm10 > 0 ? Math.min(500, Math.max(0, Math.round(pm10 * 2))) : 0;
        const aqi = aqiFromPm25 || aqiFromPm10;

        return {
          timestamp: new Date(date).getTime(),
          date,
          aqi,
          pm25: Math.round(pm25 * 10) / 10,
          pm10: Math.round(pm10 * 10) / 10,
          o3: Math.round(o3 * 10) / 10,
          no2: Math.round(no2 * 10) / 10,
          so2: Math.round(so2 * 10) / 10,
          co: Math.round(co * 10) / 10,
          source: 'openaq' as const,
          confidence: 0.9
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    console.log(`✅ Collected ${historicalData.length} days of OpenAQ measurements`);
    return historicalData;
  } catch (error) {
    console.error('❌ OpenAQ history fetch failed:', error);
    return [];
  }
};

/**
 * Fetch model-based historical air quality from Open-Meteo (global coverage).
 * We request hourly data and aggregate into daily averages.
 *
 * Source: CAMS Global / CAMS Europe (Open-Meteo air quality API)
 */
const fetchOpenMeteoHistory = async (
  lat: number,
  lng: number,
  days: number
): Promise<HistoricalDataPoint[]> => {
  try {
    console.log(`🌫️ Fetching Open-Meteo air quality history for ${days} days...`);

    const endDate = new Date();
    const overallStart = new Date(endDate);
    overallStart.setDate(overallStart.getDate() - (days - 1));

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    // Chunk requests to keep URLs and response sizes reasonable.
    const maxChunkDays = 90;
    const allDaily: Map<
      string,
      { aqi: number[]; pm25: number[]; pm10: number[]; o3: number[]; no2: number[]; so2: number[]; co: number[] }
    > = new Map();

    for (
      let chunkStart = new Date(overallStart);
      chunkStart.getTime() <= endDate.getTime();
      chunkStart = new Date(chunkStart.getTime())
    ) {
      const chunkEnd = new Date(chunkStart);
      chunkEnd.setDate(chunkEnd.getDate() + maxChunkDays - 1);
      if (chunkEnd.getTime() > endDate.getTime()) {
        chunkEnd.setTime(endDate.getTime());
      }

      const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lng));
      url.searchParams.set('hourly', 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide');
      url.searchParams.set('timezone', 'GMT');
      url.searchParams.set('start_date', fmt(chunkStart));
      url.searchParams.set('end_date', fmt(chunkEnd));

      const response = await fetch(url.toString());
      if (!response.ok) {
        let details = '';
        try {
          const err = await response.json();
          details = typeof err === 'string' ? err : JSON.stringify(err);
        } catch {
          // ignore
        }
        throw new Error(`Open-Meteo failed: ${response.status}${details ? ` - ${details}` : ''}`);
      }

      const json = await response.json();
      const time: string[] = json.hourly?.time || [];
      const usAqi: Array<number | null> = json.hourly?.us_aqi || [];
      const pm25: Array<number | null> = json.hourly?.pm2_5 || [];
      const pm10: Array<number | null> = json.hourly?.pm10 || [];
      const o3: Array<number | null> = json.hourly?.ozone || [];
      const no2: Array<number | null> = json.hourly?.nitrogen_dioxide || [];
      const so2: Array<number | null> = json.hourly?.sulphur_dioxide || [];
      const co: Array<number | null> = json.hourly?.carbon_monoxide || [];

      for (let i = 0; i < time.length; i++) {
        const date = time[i].split('T')[0];
        if (!allDaily.has(date)) {
          allDaily.set(date, { aqi: [], pm25: [], pm10: [], o3: [], no2: [], so2: [], co: [] });
        }
        const day = allDaily.get(date)!;

        const pushIf = (arr: number[], v: number | null | undefined) => {
          if (v === null || v === undefined) return;
          if (!Number.isFinite(v)) return;
          arr.push(v);
        };

        pushIf(day.aqi, usAqi[i]);
        pushIf(day.pm25, pm25[i]);
        pushIf(day.pm10, pm10[i]);
        pushIf(day.o3, o3[i]);
        pushIf(day.no2, no2[i]);
        pushIf(day.so2, so2[i]);
        pushIf(day.co, co[i]);
      }

      // Next chunk starts the day after chunkEnd
      chunkStart = new Date(chunkEnd);
      chunkStart.setDate(chunkStart.getDate() + 1);
    }

    const startStr = fmt(overallStart);
    const endStr = fmt(endDate);

    const historical: HistoricalDataPoint[] = Array.from(allDaily.entries())
      .filter(([date]) => date >= startStr && date <= endStr)
      .map(([date, v]) => {
        const avgAqi = avg(v.aqi);
        const avgPm25 = avg(v.pm25);
        const aqi = avgAqi > 0 ? Math.round(avgAqi) : estimateAQIFromPM25(avgPm25);

        return {
          timestamp: new Date(date).getTime(),
          date,
          aqi,
          pm25: Math.round(avgPm25 * 10) / 10,
          pm10: Math.round(avg(v.pm10) * 10) / 10,
          o3: Math.round(avg(v.o3) * 10) / 10,
          no2: Math.round(avg(v.no2) * 10) / 10,
          so2: Math.round(avg(v.so2) * 10) / 10,
          co: Math.round(avg(v.co) * 10) / 10,
          source: 'openmeteo' as const,
          confidence: 0.55
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    console.log(`✅ Collected ${historical.length} days of Open-Meteo model data`);
    return historical;
  } catch (error) {
    console.error('❌ Open-Meteo history fetch failed:', error);
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
  const [openaqData, openMeteoData] = await Promise.all([
    fetchOpenAQHistory(lat, lng, days),
    fetchOpenMeteoHistory(lat, lng, days)
  ]);

  // Merge data, preferring OpenAQ (higher confidence)
  const mergedMap = new Map<string, HistoricalDataPoint>();
  
  // Add Open-Meteo model data first (lower priority than measurements)
  openMeteoData.forEach(point => {
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
  // "Completeness" is the percent of days backed by real measurements (OpenAQ).
  // Model-based (Open-Meteo) and interpolated points do not count as measured.
  const completeness = (completeData.filter(d => d.source === 'openaq').length / days) * 100;

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
