/**
 * Typed, lightweight Pub/Sub Event Bus for decoupled cross-component communication.
 */

export type AppEventType =
  | 'LOCATION_SELECTED'
  | 'HAZARD_ALERT_TRIGGERED'
  | 'CACHE_INVALIDATED'
  | 'ML_TRAINING_PROGRESS'
  | 'PROVIDER_CIRCUIT_STATE_CHANGED';

export interface HazardAlertPayload {
  id: string;
  lat: number;
  lng: number;
  place: string;
  aqi: number;
  severity: 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  reason: string;
  source: string;
  timestamp: string;
}

export type EventPayloadMap = {
  LOCATION_SELECTED: { lat: number; lng: number; city?: string };
  HAZARD_ALERT_TRIGGERED: HazardAlertPayload;
  CACHE_INVALIDATED: { spatialKey: string };
  ML_TRAINING_PROGRESS: { epoch: number; totalEpochs: number; loss: number };
  PROVIDER_CIRCUIT_STATE_CHANGED: { provider: string; state: string };
};

type EventCallback<K extends AppEventType> = (payload: EventPayloadMap[K]) => void;

export class EventBus {
  private listeners: Map<AppEventType, Set<EventCallback<any>>> = new Map();

  public on<K extends AppEventType>(event: K, callback: EventCallback<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return un-subscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit<K extends AppEventType>(event: K, payload: EventPayloadMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Error handling event ${event}:`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const globalEventBus = new EventBus();
