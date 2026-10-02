/**
 * Real-time International Space Station (ISS) Orbital Tracker & Physics Engine
 * Handles live ephemeris telemetry, orbital propagation (51.6° inclination),
 * velocity vectors, and ground track predictions.
 */

export interface ISSTelemetry {
  lat: number;
  lng: number;
  altitude: number; // in kilometers (e.g. 418)
  velocity: number; // in km/h (e.g. 27580)
  visibility: 'daylight' | 'eclipsed';
  solarHeading: number; // degrees
  timestamp: number;
  orbitPeriodMinutes: number;
  passOverLocation?: {
    city: string;
    distanceKm: number;
    elevationDeg: number;
  };
}

export interface ISSOrbitTrackPoint {
  lat: number;
  lng: number;
  altitude: number;
}

class ISSTrackerService {
  private currentTelemetry: ISSTelemetry = {
    lat: 28.5721,
    lng: -80.648,
    altitude: 418,
    velocity: 27580,
    visibility: 'daylight',
    solarHeading: 51.6,
    timestamp: Date.now(),
    orbitPeriodMinutes: 92.68
  };

  private listeners: ((telemetry: ISSTelemetry) => void)[] = [];
  private updateTimer: number | null = null;
  private isLiveFeedActive = false;

  constructor() {
    this.startTracking();
  }

  public subscribe(callback: (telemetry: ISSTelemetry) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentTelemetry);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public getTelemetry(): ISSTelemetry {
    return this.currentTelemetry;
  }

  /**
   * Generates a 360-degree predicted orbital ground track loop for the ISS
   */
  public getPredictedOrbitPath(pointsCount = 64): ISSOrbitTrackPoint[] {
    const points: ISSOrbitTrackPoint[] = [];
    const inclination = 51.64; // ISS orbital inclination in degrees
    const currentLng = this.currentTelemetry.lng;
    const currentLat = this.currentTelemetry.lat;

    // Orbital phase offset from current position
    const currentPhase = Math.asin(Math.max(-1, Math.min(1, currentLat / inclination)));

    for (let i = 0; i <= pointsCount; i++) {
      const fraction = i / pointsCount;
      const angle = currentPhase + fraction * Math.PI * 2;
      const lat = inclination * Math.sin(angle);
      
      // Account for Earth's rotation during orbit (~22.5 deg westward drift per 90 min)
      const earthRotationDrift = fraction * (360 / (1440 / 92.68));
      let lng = currentLng + fraction * 360 - earthRotationDrift;
      while (lng > 180) lng -= 360;
      while (lng < -180) lng += 360;

      points.push({
        lat,
        lng,
        altitude: 0.18 // scaled relative altitude for globe
      });
    }

    return points;
  }

  private startTracking(): void {
    this.fetchLiveTelemetry();
    // Update every 3 seconds
    this.updateTimer = window.setInterval(() => {
      this.fetchLiveTelemetry();
    }, 3500);
  }

  private async fetchLiveTelemetry(): Promise<void> {
    // 1. Try WhereTheISS (HTTPS)
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      if (res.ok) {
        const data = await res.json();
        this.currentTelemetry = {
          lat: Number(data.latitude),
          lng: Number(data.longitude),
          altitude: Math.round(Number(data.altitude)) || 418,
          velocity: Math.round(Number(data.velocity)) || 27580,
          visibility: data.visibility === 'daylight' ? 'daylight' : 'eclipsed',
          solarHeading: Number(data.solar_lat) || 51.6,
          timestamp: Number(data.timestamp) * 1000,
          orbitPeriodMinutes: 92.68
        };
        this.isLiveFeedActive = true;
        this.notifyListeners();
        return;
      }
    } catch {
      // Continue to Open-Notify fallback
    }

    // 2. Try Open-Notify API (http://api.open-notify.org/iss-now.json)
    try {
      const res = await fetch('https://api.open-notify.org/iss-now.json');
      if (res.ok) {
        const data = await res.json();
        if (data && data.iss_position) {
          this.currentTelemetry = {
            ...this.currentTelemetry,
            lat: parseFloat(data.iss_position.latitude),
            lng: parseFloat(data.iss_position.longitude),
            timestamp: (data.timestamp || Date.now() / 1000) * 1000,
          };
          this.isLiveFeedActive = true;
          this.notifyListeners();
          return;
        }
      }
    } catch {
      // Continue to orbital propagator
    }

    // 3. Fallback to orbital simulation step
    this.simulateOrbitalStep();
  }

  private simulateOrbitalStep(): void {
    const prev = this.currentTelemetry;
    // Step forward ~3.5 seconds in orbit (360 deg in 92.68 min = ~0.065 deg/sec)
    const angularSpeed = (360 / (92.68 * 60)) * 3.5;
    const newLng = ((prev.lng + angularSpeed + 180) % 360) - 180;
    const newLat = 51.6 * Math.sin(((newLng + 180) * Math.PI) / 180);

    this.currentTelemetry = {
      ...prev,
      lat: newLat,
      lng: newLng,
      timestamp: Date.now()
    };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.currentTelemetry));
  }
}

export const issTrackerService = new ISSTrackerService();
