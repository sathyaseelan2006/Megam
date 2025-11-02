import { SatelliteData, GroundStationData, LocationData } from '../types';

// ============================================================================
// SATELLITE DATA SERVICE
// ============================================================================
// This service integrates real-time satellite and ground station data for
// air quality monitoring. It combines multiple data sources to provide
// accurate, verifiable pollution measurements.
//
// DATA SOURCES:
// 1. OpenAQ API - Ground station data from 10,000+ stations worldwide
// 2. WAQI API - World Air Quality Index with satellite + ground data
// 3. Sentinel-5P (Copernicus) - European satellite for NO2, SO2, O3, CO
// 4. NASA MODIS - Aerosol Optical Depth (AOD) measurements
//
// API Keys Required (store in .env.local):
// - VITE_OPENAQ_API_KEY (https://docs.openaq.org/)
// - VITE_WAQI_API_KEY (https://aqicn.org/api/)
// - VITE_NASA_API_KEY (https://api.nasa.gov/)
// ============================================================================

const OPENAQ_API_URL = 'https://api.openaq.org/v3';
const WAQI_API_URL = 'https://api.waqi.info';
const NASA_EARTHDATA_URL = 'https://appeears.earthdatacloud.nasa.gov/api';

// Get API keys from environment
const OPENAQ_API_KEY = import.meta.env.VITE_OPENAQ_API_KEY;
const WAQI_API_KEY = import.meta.env.VITE_WAQI_API_KEY;
const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY;

/**
 * Fetch ground station data from OpenAQ
 * OpenAQ provides real-time measurements from government monitoring stations
 */
export const getGroundStationData = async (
  lat: number,
  lng: number,
  radiusKm: number = 25
): Promise<GroundStationData[]> => {
  if (!OPENAQ_API_KEY) {
    console.warn('OpenAQ API key not configured. Ground station data unavailable.');
    return [];
  }

  try {
    // OpenAQ v3 API has a max radius of 25km
    const maxRadius = Math.min(radiusKm * 1000, 25000);
    
    // Find nearby stations using v3 API
    const stationsUrl = `${OPENAQ_API_URL}/locations?coordinates=${lat},${lng}&radius=${maxRadius}&limit=10`;
    const stationsResponse = await fetch(stationsUrl, {
      headers: {
        'X-API-Key': OPENAQ_API_KEY,
      },
    });

    if (!stationsResponse.ok) {
      throw new Error(`OpenAQ API error: ${stationsResponse.statusText}`);
    }

    const stationsData = await stationsResponse.json();
    const stations = stationsData.results || [];

    // Fetch measurements for each station
    const groundStations: GroundStationData[] = await Promise.all(
      stations.map(async (station: any) => {
        try {
          const measurementsUrl = `${OPENAQ_API_URL}/latest?location_id=${station.id}`;
          const measurementsResponse = await fetch(measurementsUrl, {
            headers: {
              'X-API-Key': OPENAQ_API_KEY,
            },
          });

          const measurementsData = await measurementsResponse.json();
          const measurements = measurementsData.results?.[0]?.parameters || [];

          return {
            stationId: station.id,
            stationName: station.name,
            distance: calculateDistance(lat, lng, station.coordinates?.latitude, station.coordinates?.longitude),
            measurements: measurements.map((m: any) => ({
              parameter: m.parameter,
              value: m.lastValue,
              unit: m.unit,
              timestamp: m.lastUpdated,
            })),
            dataQuality: determineDataQuality(measurements),
          };
        } catch (error) {
          console.error(`Error fetching measurements for station ${station.id}:`, error);
          return null;
        }
      })
    );

    return groundStations.filter((s): s is GroundStationData => s !== null);
  } catch (error) {
    console.error('Error fetching ground station data:', error);
    return [];
  }
};

/**
 * Fetch satellite data from WAQI (World Air Quality Index)
 * WAQI aggregates data from multiple sources including satellites
 */
export const getSatelliteDataFromWAQI = async (
  lat: number,
  lng: number
): Promise<{ aqi: number; pollutants: any[]; dataSource: string; station: string }> => {
  if (!WAQI_API_KEY) {
    throw new Error('WAQI API key not configured. Please add VITE_WAQI_API_KEY to .env.local');
  }

  try {
    const url = `${WAQI_API_URL}/feed/geo:${lat};${lng}/?token=${WAQI_API_KEY}`;
    console.log('🌐 Calling WAQI API:', url.replace(WAQI_API_KEY, '***KEY***'));
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`WAQI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📡 WAQI Response:', data);

    if (data.status !== 'ok') {
      if (data.data === 'Invalid key') {
        throw new Error('WAQI API key is invalid. Please get a new one at https://aqicn.org/data-platform/token/');
      }
      throw new Error(`WAQI API returned status: ${data.status} - ${data.data}`);
    }

    const station = data.data;
    
    // Extract pollutant data
    const pollutants: any[] = [];
    if (station.iaqi) {
      Object.entries(station.iaqi).forEach(([key, value]: [string, any]) => {
        if (key !== 'h' && key !== 'p' && key !== 't' && key !== 'w' && key !== 'wg') {
          pollutants.push({
            name: key.toUpperCase(),
            concentration: value.v,
            unit: getUnitForParameter(key),
          });
        }
      });
    }

    return {
      aqi: station.aqi,
      pollutants,
      dataSource: station.attributions?.[0]?.name || 'WAQI Network',
      station: station.city?.name || 'Unknown',
    };
  } catch (error) {
    console.error('Error fetching WAQI data:', error);
    throw error;
  }
};

/**
 * Get NASA MODIS Aerosol Optical Depth (AOD) data
 * This provides GLOBAL coverage - works anywhere on Earth!
 */
export const getNASAMODISData = async (
  lat: number,
  lng: number
): Promise<{ aqi: number; pollutants: any[]; confidence: number; source: string } | null> => {
  if (!NASA_API_KEY) {
    console.warn('NASA API key not configured.');
    return null;
  }

  try {
    console.log('🛰️ Fetching NASA MODIS satellite data...');
    
    // NASA GIBS (Global Imagery Browse Services) - Real-time satellite imagery
    // We'll use MODIS Combined Dark Target and Deep Blue AOD
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // Use NASA's POWER API for aerosol data (works globally)
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=AOD_55&community=RE&longitude=${lng}&latitude=${lat}&start=${dateStr.replace(/-/g, '')}&end=${dateStr.replace(/-/g, '')}&format=JSON`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('NASA POWER API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const aodData = data.properties?.parameter?.AOD_55;
    
    if (!aodData || Object.keys(aodData).length === 0) {
      console.warn('No NASA satellite data available for this location');
      return null;
    }

    // Get the most recent AOD value
    const dates = Object.keys(aodData);
    const latestDate = dates[dates.length - 1];
    const aodValue = aodData[latestDate];

    if (aodValue === null || aodValue === undefined || aodValue < 0) {
      console.warn('Invalid NASA AOD value');
      return null;
    }

    // Convert AOD to estimated AQI
    // AOD ranges: 0-0.1 (Good), 0.1-0.3 (Moderate), 0.3-0.5 (Unhealthy for sensitive), >0.5 (Unhealthy)
    let estimatedAQI = 50; // Default moderate
    
    if (aodValue <= 0.05) {
      estimatedAQI = 25; // Good
    } else if (aodValue <= 0.1) {
      estimatedAQI = 50; // Good to Moderate
    } else if (aodValue <= 0.2) {
      estimatedAQI = 75; // Moderate
    } else if (aodValue <= 0.3) {
      estimatedAQI = 100; // Moderate to Unhealthy for sensitive
    } else if (aodValue <= 0.5) {
      estimatedAQI = 150; // Unhealthy for sensitive groups
    } else if (aodValue <= 1.0) {
      estimatedAQI = 200; // Unhealthy
    } else {
      estimatedAQI = 300; // Very unhealthy
    }

    console.log('✅ NASA satellite data retrieved. AOD:', aodValue, 'Estimated AQI:', estimatedAQI);

    return {
      aqi: Math.round(estimatedAQI),
      pollutants: [{
        name: 'PM2.5',
        concentration: Math.round(aodValue * 100), // Rough estimate
        unit: 'µg/m³'
      }, {
        name: 'AOD',
        concentration: aodValue,
        unit: 'Aerosol Optical Depth'
      }],
      confidence: 70, // Satellite estimates are less accurate than ground stations
      source: 'NASA MODIS Satellite'
    };
  } catch (error) {
    console.error('Error fetching NASA MODIS data:', error);
    return null;
  }
};

/**
 * Get Sentinel-5P satellite data
 * Note: This requires setting up access to Google Earth Engine or Copernicus Data Space
 * For production, you'll need to implement proper authentication
 */
export const getSentinel5PData = async (
  lat: number,
  lng: number
): Promise<SatelliteData[]> => {
  // This is a placeholder for Sentinel-5P integration
  // You'll need to set up Google Earth Engine API or Copernicus Data Space Ecosystem
  console.warn('Sentinel-5P integration requires additional setup. See documentation.');
  
  // For now, return empty array
  // TODO: Implement proper Sentinel-5P integration
  return [];
};

/**
 * Reverse geocode coordinates to get city/country
 */
const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string; country: string }> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Megam Air Quality Monitor',
      },
    });

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.county || 'Unknown Location',
      country: address.country || 'Unknown',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      city: `Location at ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      country: 'Unknown',
    };
  }
};

/**
 * Try to find nearest monitoring station within radius
 */
const findNearestStation = async (lat: number, lng: number, maxRadiusKm: number = 100): Promise<{ data: any; distance: number } | null> => {
  if (!WAQI_API_KEY) return null;

  try {
    // Search for nearest station using WAQI API
    const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${WAQI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok' && data.data) {
      const stationLat = data.data.city?.geo?.[0];
      const stationLng = data.data.city?.geo?.[1];
      
      if (stationLat && stationLng) {
        const distance = calculateDistance(lat, lng, stationLat, stationLng);
        
        // Only use if within max radius
        if (distance <= maxRadiusKm) {
          return { data: data.data, distance };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding nearest station:', error);
    return null;
  }
};

/**
 * Combine multiple data sources to create comprehensive LocationData
 * This function merges satellite data, ground station data
 * No AI needed - pure real-time data!
 * 
 * Fallback strategy:
 * 1. Try exact coordinates
 * 2. If no data, search within 50km
 * 3. If still no data, search within 100km
 * 4. If still no data, throw error with suggestions
 */
export const getComprehensiveAQIData = async (
  lat: number,
  lng: number,
  cityName?: string
): Promise<LocationData & { groundStations?: GroundStationData[]; nearestStationDistance?: number }> => {
  try {
    console.log('🌍 Fetching air quality data for:', lat, lng);
    
    // Fetch all data sources in parallel
    const [groundStationsResult, waqiResult, nasaResult] = await Promise.allSettled([
      getGroundStationData(lat, lng, 25),
      WAQI_API_KEY ? getSatelliteDataFromWAQI(lat, lng) : Promise.reject('No WAQI key'),
      getNASAMODISData(lat, lng)
    ]);
    
    const groundStations = groundStationsResult.status === 'fulfilled' ? groundStationsResult.value : [];
    const waqiData = waqiResult.status === 'fulfilled' ? waqiResult.value : null;
    const nasaData = nasaResult.status === 'fulfilled' ? nasaResult.value : null;

    // Process data
    let locationData: Partial<LocationData> = {
      lat,
      lng,
      dataSource: 'ground',
      lastUpdated: new Date().toISOString(),
    };

    // Try to get city name
    let city = cityName;
    let country = '';
    if (!cityName) {
      const geoData = await reverseGeocode(lat, lng);
      city = geoData.city;
      country = geoData.country;
    }

    // Priority 1: Use OpenAQ ground station data
    if (groundStations.length > 0) {
      const nearestStation = groundStations[0];
      const pm25 = nearestStation.measurements.find(m => m.parameter === 'pm25');
      const pm10 = nearestStation.measurements.find(m => m.parameter === 'pm10');
      const o3 = nearestStation.measurements.find(m => m.parameter === 'o3');
      const no2 = nearestStation.measurements.find(m => m.parameter === 'no2');
      
      // Calculate AQI from pollutants (simplified - use PM2.5 as primary)
      let aqi = 50; // default moderate
      if (pm25) {
        aqi = Math.round(pm25.value * 4); // Rough PM2.5 to AQI conversion
      } else if (pm10) {
        aqi = Math.round(pm10.value * 2);
      }
      
      locationData = {
        ...locationData,
        city,
        country,
        aqi: Math.min(500, Math.max(0, aqi)),
        pollutants: nearestStation.measurements.map(m => ({
          name: m.parameter.toUpperCase(),
          concentration: m.value,
          unit: m.unit
        })),
        summary: generateSummary(aqi),
        healthAdvisory: generateHealthAdvisory(aqi),
        confidence: 90, // Ground station data is highly reliable
        dataSource: 'ground'
      };
    }
    
    // Priority 2: Use WAQI if available and no OpenAQ data
    if (!locationData.aqi && waqiData) {
      locationData = {
        ...locationData,
        city: city || waqiData.station,
        country,
        aqi: waqiData.aqi,
        pollutants: waqiData.pollutants,
        summary: generateSummary(waqiData.aqi),
        healthAdvisory: generateHealthAdvisory(waqiData.aqi),
        confidence: 85,
        dataSource: 'hybrid'
      };
    }

    // Priority 3: Use NASA satellite data if no ground station data
    if (!locationData.aqi && nasaData) {
      console.log('✅ Using NASA MODIS satellite data (global coverage)');
      locationData = {
        ...locationData,
        city,
        country,
        aqi: nasaData.aqi,
        pollutants: nasaData.pollutants,
        summary: generateSummary(nasaData.aqi) + ' (Satellite estimate)',
        healthAdvisory: generateHealthAdvisory(nasaData.aqi),
        confidence: nasaData.confidence,
        dataSource: 'satellite'
      };
    }

    // Add ground station metadata
    if (groundStations.length > 0) {
      locationData.dataSource = 'hybrid';
    }

    // If no real data available at exact location, try nearest station
    if (!locationData.aqi) {
      console.log('⚠️ No data at exact coordinates, searching for nearest station...');
      
      // Try within 50km first
      let nearestStation = await findNearestStation(lat, lng, 50);
      
      // If not found, try within 100km
      if (!nearestStation) {
        nearestStation = await findNearestStation(lat, lng, 100);
      }

      if (nearestStation) {
        console.log(`✅ Found nearest station ${nearestStation.distance.toFixed(1)}km away`);
        
        // Extract pollutants from nearest station
        const stationData = nearestStation.data;
        const pollutants: any[] = [];
        
        if (stationData.iaqi) {
          Object.entries(stationData.iaqi).forEach(([key, value]: [string, any]) => {
            if (key !== 'h' && key !== 'p' && key !== 't' && key !== 'w' && key !== 'wg') {
              pollutants.push({
                name: key.toUpperCase(),
                concentration: value.v,
                unit: getUnitForParameter(key),
              });
            }
          });
        }

        // Get city name for the searched location
        const geoData = cityName ? { city: cityName, country: '' } : await reverseGeocode(lat, lng);

        locationData = {
          lat,
          lng,
          city: geoData.city,
          country: geoData.country,
          aqi: stationData.aqi,
          pollutants,
          summary: generateSummary(stationData.aqi) + ` (Data from nearest station ${nearestStation.distance.toFixed(1)}km away)`,
          healthAdvisory: generateHealthAdvisory(stationData.aqi),
          dataSource: 'hybrid',
          confidence: Math.max(50, 85 - Math.floor(nearestStation.distance / 2)), // Reduce confidence based on distance
          lastUpdated: new Date().toISOString(),
        };

        return {
          ...locationData as LocationData,
          groundStations,
          nearestStationDistance: nearestStation.distance,
        };
      }

      // Last resort: Try NASA satellite data again (already tried but double-check)
      if (nasaData) {
        console.log('✅ No ground stations, using NASA satellite data');
        return {
          lat,
          lng,
          city,
          country,
          aqi: nasaData.aqi,
          pollutants: nasaData.pollutants,
          summary: generateSummary(nasaData.aqi) + ' (Satellite estimate - no ground stations nearby)',
          healthAdvisory: generateHealthAdvisory(nasaData.aqi),
          confidence: nasaData.confidence,
          dataSource: 'satellite',
          lastUpdated: new Date().toISOString(),
          groundStations,
        };
      }

      // No data available anywhere
      throw new Error('No air quality data available for this location. NASA satellite may not have recent coverage.');
    }

    return {
      ...locationData as LocationData,
      groundStations,
    };
  } catch (error) {
    console.error('Error in comprehensive AQI data fetch:', error);
    throw error;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Determine data quality based on measurement freshness and completeness
 */
function determineDataQuality(measurements: any[]): 'high' | 'medium' | 'low' {
  if (measurements.length === 0) return 'low';
  
  const now = new Date().getTime();
  const latestMeasurement = new Date(measurements[0].lastUpdated).getTime();
  const ageInHours = (now - latestMeasurement) / (1000 * 60 * 60);

  if (ageInHours < 1 && measurements.length >= 4) return 'high';
  if (ageInHours < 3 && measurements.length >= 2) return 'medium';
  return 'low';
}

/**
 * Get standard unit for pollutant parameter
 */
function getUnitForParameter(parameter: string): string {
  const units: Record<string, string> = {
    pm25: 'µg/m³',
    pm10: 'µg/m³',
    o3: 'µg/m³',
    no2: 'µg/m³',
    so2: 'µg/m³',
    co: 'mg/m³',
  };
  return units[parameter.toLowerCase()] || 'µg/m³';
}

/**
 * Generate AQI summary based on value
 */
function generateSummary(aqi: number): string {
  if (aqi <= 50) return 'Air quality is satisfactory, and air pollution poses little or no risk.';
  if (aqi <= 100) return 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
  if (aqi <= 150) return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
  if (aqi <= 200) return 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.';
  if (aqi <= 300) return 'Health alert: The risk of health effects is increased for everyone.';
  return 'Health warning of emergency conditions: everyone is more likely to be affected.';
}

/**
 * Generate health advisory based on AQI
 */
function generateHealthAdvisory(aqi: number): string[] {
  if (aqi <= 50) {
    return [
      'Enjoy outdoor activities without restrictions',
      'Perfect time for exercising outside',
    ];
  }
  if (aqi <= 100) {
    return [
      'Most people can enjoy outdoor activities',
      'Sensitive individuals should limit prolonged outdoor exertion',
      'Consider reducing intense outdoor activities if you experience symptoms',
    ];
  }
  if (aqi <= 150) {
    return [
      'Sensitive groups should reduce prolonged or heavy outdoor exertion',
      'Take more breaks during outdoor activities',
      'Consider moving activities indoors if you experience symptoms',
      'People with asthma should follow their asthma action plans',
    ];
  }
  if (aqi <= 200) {
    return [
      'Everyone should reduce prolonged or heavy outdoor exertion',
      'Sensitive groups should avoid prolonged outdoor activities',
      'Keep windows closed to minimize indoor pollution',
      'Use air purifiers if available',
    ];
  }
  if (aqi <= 300) {
    return [
      'Everyone should avoid all outdoor physical activities',
      'Sensitive groups should remain indoors',
      'Keep windows and doors closed',
      'Run air purifiers on high settings',
    ];
  }
  return [
    'Stay indoors with windows and doors closed',
    'Avoid all physical activities, even indoors',
    'Use N95 masks if you must go outside',
    'Seek medical attention if experiencing symptoms',
  ];
}
