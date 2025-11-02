// ============================================================================
// GEOCODING SERVICE
// ============================================================================
// This service handles location lookups using free geocoding APIs
// No API key required for basic usage
//
// Providers:
// 1. Nominatim (OpenStreetMap) - Free, no key required
// 2. WAQI built-in geocoding - Already have the key
// ============================================================================

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const WAQI_API_KEY = import.meta.env.VITE_WAQI_API_KEY;

interface GeocodingResult {
  city: string;
  country: string;
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Convert location name to coordinates using Nominatim (OpenStreetMap)
 * Free service, no API key required
 */
export const searchLocation = async (query: string): Promise<GeocodingResult> => {
  try {
    const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Megam Air Quality Monitor (contact: your-email@example.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`Location "${query}" not found. Please try a different search.`);
    }

    const result = data[0];
    const address = result.address || {};

    return {
      city: address.city || address.town || address.village || address.county || 'Unknown',
      country: address.country || 'Unknown',
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
    };
  } catch (error) {
    console.error('Error in Nominatim geocoding:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to get city/country name
 * Uses Nominatim (free, no key required)
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string; country: string }> => {
  try {
    const url = `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Megam Air Quality Monitor (contact: your-email@example.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.county || 'Unknown Location',
      country: address.country || 'Unknown',
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    // Return fallback
    return {
      city: `Location at ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      country: 'Unknown',
    };
  }
};

/**
 * Search for city using WAQI's built-in search
 * This gives us cities with known air quality monitoring
 */
export const searchAQICity = async (query: string): Promise<{ city: string; country: string; lat: number; lng: number } | null> => {
  if (!WAQI_API_KEY) {
    return null;
  }

  try {
    const url = `https://api.waqi.info/search/?keyword=${encodeURIComponent(query)}&token=${WAQI_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 'ok' || !data.data || data.data.length === 0) {
      return null;
    }

    // Get the first result
    const result = data.data[0];
    
    // WAQI returns station data with geo coordinates
    if (result.station && result.station.geo) {
      return {
        city: result.station.name || 'Unknown',
        country: '', // WAQI doesn't always provide country
        lat: result.station.geo[0],
        lng: result.station.geo[1],
      };
    }

    return null;
  } catch (error) {
    console.error('Error in WAQI city search:', error);
    return null;
  }
};

/**
 * Smart location search that tries multiple sources
 * 1. Try WAQI first (gives cities with AQI data)
 * 2. Fallback to Nominatim (comprehensive global coverage)
 */
export const smartLocationSearch = async (query: string): Promise<GeocodingResult> => {
  // Try WAQI first if available
  if (WAQI_API_KEY) {
    try {
      const waqiResult = await searchAQICity(query);
      if (waqiResult) {
        console.log('✅ Found location via WAQI search');
        return {
          ...waqiResult,
          displayName: waqiResult.city,
        };
      }
    } catch (error) {
      console.warn('WAQI search failed, trying Nominatim');
    }
  }

  // Fallback to Nominatim
  console.log('🔍 Using Nominatim for location search');
  return searchLocation(query);
};
