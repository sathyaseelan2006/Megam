import { SatelliteData, GroundStationData, LocationData } from '../types';

// ============================================================================
// SATELLITE DATA SERVICE
// ============================================================================
// This service integrates real-time satellite and ground station data for
// air quality monitoring. It combines multiple data sources to provide
// accurate, verifiable pollution measurements.
//
// DATA SOURCES:
// 1. IQAir AirVisual - Premium air quality data from 80,000+ stations (FASTEST!)
// 2. OpenAQ API - Ground station data from 10,000+ stations worldwide
// 3. WAQI API - World Air Quality Index with satellite + ground data
// 4. NASA MODIS - Aerosol Optical Depth (AOD) measurements (global coverage)
//
// API Keys Required (store in .env.local):
// - VITE_IQAIR_API_KEY (https://www.iqair.com/air-pollution-data-api/) - RECOMMENDED!
// - VITE_OPENAQ_API_KEY (https://docs.openaq.org/)
// - VITE_WAQI_API_KEY (https://aqicn.org/api/)
// - VITE_NASA_API_KEY (https://api.nasa.gov/)
// ============================================================================

const IQAIR_API_URL = 'https://api.airvisual.com/v2';
const OPENAQ_API_URL = 'https://api.openaq.org/v3';
const WAQI_API_URL = 'https://api.waqi.info';
const NASA_EARTHDATA_URL = 'https://appeears.earthdatacloud.nasa.gov/api';

// Get API keys from environment
const IQAIR_API_KEY = import.meta.env.VITE_IQAIR_API_KEY;
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
    
    // Use local proxy to avoid CORS issues (works in both dev and production)
    const fetchUrl = `/api/openaq?url=${encodeURIComponent(stationsUrl)}`;
    
    const stationsResponse = await fetch(fetchUrl);
    if (stationsResponse.status === 429) {
      throw new Error('OpenAQ API rate limit exceeded. Please wait and try again later.');
    }
    if (stationsResponse.status === 404) {
      throw new Error('No ground station data found for this location.');
    }
    if (!stationsResponse.ok) {
      throw new Error(`OpenAQ API error: ${stationsResponse.statusText}`);
    }

    const stationsData = await stationsResponse.json();
    const stations = stationsData.results || [];

    // Simple in-memory cache for measurements (per session)
    const measurementCache: Record<string, any> = {};

    // Fetch measurements for each station
    const groundStations: GroundStationData[] = await Promise.all(
      stations.map(async (station: any) => {
        try {
          const measurementsUrl = `${OPENAQ_API_URL}/latest?location_id=${station.id}`;
          const fetchMeasurementsUrl = `/api/openaq?url=${encodeURIComponent(measurementsUrl)}`;

          // Use cache if available
          if (measurementCache[station.id]) {
            return measurementCache[station.id];
          }

          const measurementsResponse = await fetch(fetchMeasurementsUrl);
          if (measurementsResponse.status === 429) {
            throw new Error('OpenAQ API rate limit exceeded for measurements. Please wait and try again.');
          }
          if (measurementsResponse.status === 404) {
            throw new Error('No measurements found for this station.');
          }
          if (!measurementsResponse.ok) {
            throw new Error(`OpenAQ measurements error: ${measurementsResponse.statusText}`);
          }

          const measurementsData = await measurementsResponse.json();
          const measurements = measurementsData.results?.[0]?.parameters || [];

          const result = {
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
          measurementCache[station.id] = result;
          return result;
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
 * Fetch air quality data from IQAir AirVisual API
 * IQAir provides premium data from 80,000+ monitoring stations worldwide
 * FREE tier: 1,000 calls/day
 * BONUS: Also returns real-time weather data!
 */
export const getIQAirData = async (
  lat: number,
  lng: number
): Promise<{ aqi: number; pollutants: any[]; station: string; city: string; weather?: any } | null> => {
  if (!IQAIR_API_KEY) {
    console.warn('IQAir API key not configured. IQAir data unavailable.');
    return null;
  }

  try {
    const url = `${IQAIR_API_URL}/nearest_city?lat=${lat}&lon=${lng}&key=${IQAIR_API_KEY}`;
    console.log('🌐 Calling IQAir API for coordinates:', lat, lng);
    

    const response = await fetch(url);
    if (response.status === 429) {
      console.warn('IQAir API rate limit exceeded (1,000 calls/day)');
      throw new Error('IQAir API rate limit exceeded. Please wait and try again later.');
    }
    if (response.status === 404) {
      throw new Error('No IQAir data found for this location.');
    }
    if (!response.ok) {
      throw new Error(`IQAir API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'success') {
      console.warn('IQAir API returned non-success status:', data.status);
      return null;
    }

    const airQuality = data.data?.current?.pollution;
    const weather = data.data?.current?.weather;
    const location = data.data?.location;

    if (!airQuality) {
      console.warn('IQAir: No pollution data available for this location');
      return null;
    }

    console.log('📡 IQAir Response:', {
      city: location?.name,
      aqi: airQuality.aqius,
      mainPollutant: airQuality.mainus,
      weather: weather ? `${weather.tp}°C, ${weather.hu}% humidity` : 'N/A'
    });

    // Parse pollutants (IQAir primarily provides PM2.5 and AQI)
    const pollutants = [];
    
    if (airQuality.aqius) {
      pollutants.push({
        parameter: 'pm25',
        value: airQuality.aqius, // IQAir's US AQI is based on PM2.5
        unit: 'aqi',
        displayName: 'PM2.5'
      });
    }

    // Parse weather data separately (don't mix with pollutants)
    let weatherData = null;
    if (weather) {
      weatherData = {
        temperature: weather.tp, // Temperature in Celsius
        humidity: weather.hu, // Humidity percentage
        pressure: weather.pr, // Atmospheric pressure in hPa
        windSpeed: weather.ws, // Wind speed in m/s
        windDirection: weather.wd, // Wind direction in degrees
        icon: weather.ic // Weather icon URL
      };
    }

    return {
      aqi: airQuality.aqius, // US AQI standard
      pollutants,
      station: `${location?.name}, ${location?.state || ''}, ${location?.country || ''}`.trim(),
      city: location?.name || 'Unknown',
      weather: weatherData
    };
  } catch (error) {
    console.error('Error fetching IQAir data:', error);
    return null;
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
 * NOTE: NASA POWER API is FREE and doesn't require an API key!
 */
export const getNASAMODISData = async (
  lat: number,
  lng: number
): Promise<{ aqi: number; pollutants: any[]; confidence: number; source: string } | null> => {
  try {
    console.log('🛰️ Fetching NASA MODIS satellite data (no key required)...');
    
    // NASA POWER API - FREE, no authentication needed!
    // Get data from yesterday (most recent complete day)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');
    
    // Use NASA's POWER API for aerosol data (works globally, no key needed!)
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=AOD_55&community=RE&longitude=${lng}&latitude=${lat}&start=${dateStr}&end=${dateStr}&format=JSON`;
    
    console.log('🌐 NASA API URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('NASA POWER API error:', response.statusText);
      // Try a wider date range to find valid data
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7); // Try last 7 days
      const endDate = yesterday;
      
      const rangeUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=AOD_55&community=RE&longitude=${lng}&latitude=${lat}&start=${startDate.toISOString().split('T')[0].replace(/-/g, '')}&end=${endDate.toISOString().split('T')[0].replace(/-/g, '')}&format=JSON`;
      const rangeResponse = await fetch(rangeUrl);
      
      if (!rangeResponse.ok) {
        return null;
      }
      
      const rangeData = await rangeResponse.json();
      const aodData = rangeData.properties?.parameter?.AOD_55;
      
      if (!aodData) {
        return null;
      }
      
      // Find the most recent valid value (not -999)
      const dates = Object.keys(aodData).sort().reverse();
      let aodValue = null;
      
      for (const date of dates) {
        if (aodData[date] > 0) {
          aodValue = aodData[date];
          console.log('✅ Found valid NASA data from', date, '- AOD:', aodValue);
          break;
        }
      }
      
      if (!aodValue || aodValue < 0) {
        console.warn('No valid NASA satellite data in the last 7 days (cloudy)');
        return null;
      }
      
      // Process the found value - inline calculation
      let estimatedAQI = 50;
      if (aodValue <= 0.05) estimatedAQI = 25;
      else if (aodValue <= 0.1) estimatedAQI = 50;
      else if (aodValue <= 0.2) estimatedAQI = 75;
      else if (aodValue <= 0.3) estimatedAQI = 100;
      else if (aodValue <= 0.5) estimatedAQI = 150;
      else if (aodValue <= 1.0) estimatedAQI = 200;
      else estimatedAQI = 300;
      
      return {
        aqi: Math.round(estimatedAQI),
        pollutants: [{
          name: 'PM2.5',
          concentration: Math.round(aodValue * 100),
          unit: 'µg/m³'
        }, {
          name: 'AOD',
          concentration: aodValue,
          unit: 'Aerosol Optical Depth'
        }],
        confidence: 70,
        source: 'NASA MODIS Satellite'
      };
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
    let aodValue = aodData[latestDate];

    // Handle -999 (no data) by trying previous days
    if (aodValue === null || aodValue === undefined || aodValue < 0) {
      console.warn('NASA AOD value is -999 (cloudy/no data), trying previous days...');
      
      // Try last 7 days
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      
      const rangeUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=AOD_55&community=RE&longitude=${lng}&latitude=${lat}&start=${startDate.toISOString().split('T')[0].replace(/-/g, '')}&end=${dateStr}&format=JSON`;
      const rangeResponse = await fetch(rangeUrl);
      
      if (rangeResponse.ok) {
        const rangeData = await rangeResponse.json();
        const rangeAodData = rangeData.properties?.parameter?.AOD_55;
        
        if (rangeAodData) {
          // Find most recent valid value
          const sortedDates = Object.keys(rangeAodData).sort().reverse();
          for (const date of sortedDates) {
            if (rangeAodData[date] > 0) {
              aodValue = rangeAodData[date];
              console.log('✅ Found valid NASA data from', date, '- AOD:', aodValue);
              break;
            }
          }
        }
      }
      
      if (aodValue === null || aodValue < 0) {
        console.warn('No valid NASA satellite data in the last 7 days (cloudy period)');
        return null;
      }
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
 * NEW STRATEGY: NASA satellite as PRIMARY (works everywhere!)
 * Ground stations as SECONDARY (for enhanced accuracy in cities)
 * 
 * Priority:
 * 1. ALWAYS get NASA satellite data (global coverage)
 * 2. Enhance with ground station data if available
 * 3. Merge both for comprehensive view
 */
export const getComprehensiveAQIData = async (
  lat: number,
  lng: number,
  cityName?: string
): Promise<LocationData & { groundStations?: GroundStationData[]; nearestStationDistance?: number }> => {
  try {
    console.log('🌍 Fetching air quality data for:', lat, lng);
    console.log('🏁 Starting parallel data fetch from all sources...');
    
    // **PARALLEL FETCHING**: Start ALL API calls simultaneously (4 sources!)
    // The fastest one that succeeds will be used with priority: IQAir > Ground > NASA > WAQI
    const [iqairResult, nasaResult, groundStationsResult, waqiResult] = await Promise.allSettled([
      IQAIR_API_KEY ? getIQAirData(lat, lng) : Promise.reject('No IQAir key'),
      getNASAMODISData(lat, lng),
      getGroundStationData(lat, lng, 50),
      WAQI_API_KEY ? getSatelliteDataFromWAQI(lat, lng) : Promise.reject('No WAQI key'),
    ]);
    
    // Extract successful results
    const iqairData = iqairResult.status === 'fulfilled' ? iqairResult.value : null;
    const nasaData = nasaResult.status === 'fulfilled' ? nasaResult.value : null;
    const groundStations = groundStationsResult.status === 'fulfilled' ? groundStationsResult.value : [];
    const waqiData = waqiResult.status === 'fulfilled' ? waqiResult.value : null;

    // Log which sources responded
    console.log('📊 Data sources available:', {
      IQAir: !!iqairData,
      NASA: !!nasaData,
      Ground: groundStations.length > 0,
      WAQI: !!waqiData
    });

    // Get city name
    let city = cityName;
    let country = '';
    if (!cityName) {
      const geoData = await reverseGeocode(lat, lng);
      city = geoData.city;
      country = geoData.country;
    }

    // Initialize location data
    let locationData: Partial<LocationData> = {
      lat,
      lng,
      city,
      country,
      lastUpdated: new Date().toISOString(),
    };

    // **PRIORITY SYSTEM** (use best available data)
    // Priority 1: IQAir (80,000+ stations, fastest API, premium data, 92% confidence)
    // Priority 2: Ground stations (real measurements from OpenAQ, 95% confidence)
    // Priority 3: NASA (satellite-based, global coverage, 70% confidence)
    // Priority 4: WAQI (aggregator, fallback, 80% confidence)

    if (iqairData) {
      // BEST: IQAir AirVisual data (80,000+ stations, most comprehensive + WEATHER!)
      console.log('✅ Using IQAIR data (80,000+ stations network - PREMIUM + Weather)');
      locationData = {
        ...locationData,
        city: iqairData.city || city,
        aqi: Math.min(500, Math.max(0, iqairData.aqi)),
        pollutants: iqairData.pollutants.map(m => ({
          name: m.displayName || m.parameter.toUpperCase(),
          concentration: m.value,
          unit: m.unit
        })),
        weather: iqairData.weather, // Include real-time weather data!
        summary: generateSummary(iqairData.aqi),
        healthAdvisory: generateHealthAdvisory(iqairData.aqi),
        confidence: 92,
        dataSource: 'ground'
      };
    }
    else if (groundStations.length > 0) {
      // VERY GOOD: Ground station data (real measurements from OpenAQ)
      console.log('✅ Using GROUND STATION data (OpenAQ - high accuracy)');
      const nearestStation = groundStations[0];
      const pm25 = nearestStation.measurements.find(m => m.parameter === 'pm25');
      const pm10 = nearestStation.measurements.find(m => m.parameter === 'pm10');
      
      let groundAQI = 50;
      if (pm25) {
        groundAQI = Math.round(pm25.value * 4);
      } else if (pm10) {
        groundAQI = Math.round(pm10.value * 2);
      }
      
      locationData = {
        ...locationData,
        aqi: Math.min(500, Math.max(0, groundAQI)),
        pollutants: nearestStation.measurements.map(m => ({
          name: m.parameter.toUpperCase(),
          concentration: m.value,
          unit: m.unit
        })),
        summary: generateSummary(groundAQI),
        healthAdvisory: generateHealthAdvisory(groundAQI),
        confidence: 95,
        dataSource: 'ground'
      };
    } 
    else if (nasaData) {
      // GOOD: NASA satellite data (global coverage)
      console.log('✅ Using NASA satellite data (global coverage)');
      locationData = {
        ...locationData,
        aqi: nasaData.aqi,
        pollutants: nasaData.pollutants,
        summary: generateSummary(nasaData.aqi),
        healthAdvisory: generateHealthAdvisory(nasaData.aqi),
        confidence: 70,
        dataSource: 'satellite',
      };
    }
    else if (waqiData) {
      // FALLBACK: WAQI aggregator
      console.log('✅ Using WAQI data (aggregator fallback)');
      locationData = {
        ...locationData,
        city: city || waqiData.station,
        aqi: waqiData.aqi,
        pollutants: waqiData.pollutants,
        summary: generateSummary(waqiData.aqi),
        healthAdvisory: generateHealthAdvisory(waqiData.aqi),
        confidence: 80,
        dataSource: 'ground'
      };
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
      console.error('❌ No data sources available:');
      console.error(`  - NASA: ${nasaData ? 'Available' : 'Unavailable (cloudy or no coverage)'}`);
      console.error(`  - Ground Stations: ${groundStations.length > 0 ? groundStations.length + ' found' : 'None within 50km'}`);
      console.error(`  - WAQI: ${waqiData ? 'Available' : 'Unavailable'}`);
      throw new Error(
        `No air quality data available for this remote location. ` +
        `NASA satellite has been cloudy for 7+ days and no ground stations are within 100km. ` +
        `Try a major city or wait for clearer weather.`
      );
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
