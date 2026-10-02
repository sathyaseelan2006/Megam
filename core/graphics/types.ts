export interface WindVector {
  u: number; // East-West velocity component (m/s)
  v: number; // North-South velocity component (m/s)
  speed: number; // Magnitude (m/s)
  directionDeg: number;
}

export interface AtmosphericPlumePath {
  id: string;
  name: string;
  category: 'WILDFIRE_SMOKE' | 'INDUSTRIAL_HAZE' | 'DUST_STORM' | 'TRADE_WIND_DISPERSION' | 'ISS_ORBIT_PATH';
  aqi: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  dashAnimateTime: number; // ms for animation cycle
  altitude: number;
}

export interface GlobalAtmosphericStreamlineData {
  plumes: AtmosphericPlumePath[];
  generatedAt: string;
}
