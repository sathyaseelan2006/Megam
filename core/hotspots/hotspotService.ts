import { HazardAlertPayload, globalEventBus } from '../events/eventBus';
import { GLOBAL_DANGER_ZONE_SEEDS } from '../../constants';

export interface HotspotRecord {
  id: string;
  lat: number;
  lng: number;
  place: string;
  aqi: number;
  severity: 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  reason: string;
  detectedAt: string;
}

export class HotspotService {
  private activeHotspots: Map<string, HotspotRecord> = new Map();

  constructor() {
    this.seedInitialHotspots();
  }

  private seedInitialHotspots(): void {
    GLOBAL_DANGER_ZONE_SEEDS.forEach((seed, index) => {
      const severity: HotspotRecord['severity'] =
        seed.aqi >= 300 ? 'EMERGENCY' : seed.aqi >= 200 ? 'CRITICAL' : 'HIGH';

      const id = `hotspot_seed_${index}`;
      this.activeHotspots.set(id, {
        id,
        lat: seed.lat,
        lng: seed.lng,
        place: seed.place,
        aqi: seed.aqi,
        severity,
        reason: seed.reason,
        detectedAt: new Date().toISOString(),
      });
    });
  }

  public registerTelemetryObservation(
    lat: number,
    lng: number,
    city: string,
    aqi: number,
    dominantPollutant: string
  ): void {
    if (aqi < 150) return; // Only process elevated pollution

    const severity: HotspotRecord['severity'] =
      aqi >= 300 ? 'EMERGENCY' : aqi >= 200 ? 'CRITICAL' : 'HIGH';

    const id = `hotspot_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const reason = `Severe ${dominantPollutant} concentration spike (${aqi} AQI)`;

    const record: HotspotRecord = {
      id,
      lat,
      lng,
      place: city,
      aqi,
      severity,
      reason,
      detectedAt: new Date().toISOString(),
    };

    const isNew = !this.activeHotspots.has(id);
    this.activeHotspots.set(id, record);

    if (isNew && aqi >= 200) {
      // Broadcast high priority hazard alert across the application
      const payload: HazardAlertPayload = {
        ...record,
        source: 'Real-time Telemetry Monitor',
        timestamp: record.detectedAt,
      };
      globalEventBus.emit('HAZARD_ALERT_TRIGGERED', payload);
    }
  }

  public getActiveHotspots(limit: number = 10): HotspotRecord[] {
    return Array.from(this.activeHotspots.values())
      .sort((a, b) => b.aqi - a.aqi)
      .slice(0, limit);
  }

  public getTopEmergencyHazard(): HotspotRecord | null {
    const list = this.getActiveHotspots(1);
    return list.length > 0 && list[0].aqi >= 180 ? list[0] : null;
  }
}

export const globalHotspotService = new HotspotService();
