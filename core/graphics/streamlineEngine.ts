import { AtmosphericPlumePath, WindVector, GlobalAtmosphericStreamlineData } from './types';

// Pre-seeded primary global tropospheric transport corridors
const GLOBAL_ATMOSPHERIC_CORRIDORS: Omit<AtmosphericPlumePath, 'id'>[] = [
  {
    name: 'Indo-Gangetic Severe Industrial & Biomass Haze',
    category: 'INDUSTRIAL_HAZE',
    aqi: 310,
    startLat: 28.6139,
    startLng: 77.2090, // New Delhi
    endLat: 22.5726,
    endLng: 88.3639, // Bay of Bengal corridor
    color: 'rgba(255, 60, 60, 0.85)',
    dashAnimateTime: 2200,
    altitude: 0.08,
  },
  {
    name: 'Sahara-to-Atlantic Mineral Aerosol Plume',
    category: 'DUST_STORM',
    aqi: 175,
    startLat: 18.0735,
    startLng: -15.9582, // West Africa
    endLat: 14.5364,
    endLng: -40.0000, // Mid-Atlantic
    color: 'rgba(255, 180, 50, 0.75)',
    dashAnimateTime: 3500,
    altitude: 0.12,
  },
  {
    name: 'East Asian Industrial Tropospheric Stream',
    category: 'INDUSTRIAL_HAZE',
    aqi: 195,
    startLat: 39.9042,
    startLng: 116.4074, // Beijing
    endLat: 35.6762,
    endLng: 139.6503, // Sea of Japan / Tokyo
    color: 'rgba(255, 110, 50, 0.80)',
    dashAnimateTime: 2600,
    altitude: 0.09,
  },
  {
    name: 'Pacific Coastal Jet Dispersion Corridor',
    category: 'TRADE_WIND_DISPERSION',
    aqi: 45,
    startLat: 37.7749,
    startLng: -122.4194, // SF Bay
    endLat: 32.7157,
    endLng: -117.1611, // SoCal
    color: 'rgba(50, 220, 255, 0.75)',
    dashAnimateTime: 3000,
    altitude: 0.06,
  },
  {
    name: 'Amazonian Biomass Aerosol Dispersion',
    category: 'WILDFIRE_SMOKE',
    aqi: 140,
    startLat: -3.4653,
    startLng: -62.2159, // Amazon Basin
    endLat: -15.7975,
    endLng: -47.8919, // Central Brazil
    color: 'rgba(255, 140, 40, 0.75)',
    dashAnimateTime: 3200,
    altitude: 0.07,
  },
  {
    name: 'Mediterranean North African Inflow',
    category: 'DUST_STORM',
    aqi: 110,
    startLat: 32.8872,
    startLng: 13.1913, // Tripoli
    endLat: 37.9838,
    endLng: 23.7275, // Athens
    color: 'rgba(240, 200, 60, 0.70)',
    dashAnimateTime: 2900,
    altitude: 0.08,
  },
  {
    name: 'Persian Gulf Industrial Hydrocarbon Stream',
    category: 'INDUSTRIAL_HAZE',
    aqi: 220,
    startLat: 29.3759,
    startLng: 47.9774, // Kuwait / Gulf
    endLat: 24.4539,
    endLng: 54.3773, // UAE
    color: 'rgba(255, 80, 80, 0.80)',
    dashAnimateTime: 2400,
    altitude: 0.07,
  }
];

export class AtmosphericStreamlineEngine {
  /**
   * Generates active global atmospheric particle streamline paths
   */
  public getGlobalStreamlines(): GlobalAtmosphericStreamlineData {
    const plumes: AtmosphericPlumePath[] = GLOBAL_ATMOSPHERIC_CORRIDORS.map((c, i) => ({
      ...c,
      id: `corridor_${i}_${Date.now()}`,
    }));

    return {
      plumes,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates localized dispersion vector arc when user selects a target location
   */
  public generateLocalDispersionArc(
    lat: number,
    lng: number,
    aqi: number,
    wind?: { speed?: number; windDirection?: number }
  ): AtmosphericPlumePath {
    const windSpeed = wind?.speed ?? 3.5;
    const windDirDeg = wind?.windDirection ?? 90; // Default Eastward

    // Convert meteorological wind direction (direction wind is coming FROM) to radian trajectory
    const rad = ((windDirDeg + 180) % 360) * (Math.PI / 180);
    const displacementDistanceDeg = Math.min(6.0, Math.max(1.5, windSpeed * 0.8));

    const endLat = Math.max(-85, Math.min(85, lat + Math.cos(rad) * displacementDistanceDeg));
    const endLng = ((lng + Math.sin(rad) * displacementDistanceDeg + 180) % 360) - 180;

    const color =
      aqi <= 50
        ? 'rgba(0, 255, 200, 0.85)'
        : aqi <= 100
        ? 'rgba(240, 220, 40, 0.85)'
        : aqi <= 200
        ? 'rgba(255, 120, 30, 0.90)'
        : 'rgba(255, 40, 40, 0.95)';

    return {
      id: `local_vector_${lat.toFixed(2)}_${lng.toFixed(2)}`,
      name: `Local Pollutant Dispersion Vector (${windSpeed} m/s @ ${windDirDeg}°)`,
      category: aqi > 150 ? 'INDUSTRIAL_HAZE' : 'TRADE_WIND_DISPERSION',
      aqi,
      startLat: lat,
      startLng: lng,
      endLat,
      endLng,
      color,
      dashAnimateTime: Math.max(1200, Math.round(4000 - windSpeed * 300)),
      altitude: 0.06,
    };
  }
}

export const globalStreamlineEngine = new AtmosphericStreamlineEngine();
