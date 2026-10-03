import React, { useEffect, useState } from 'react';
import { HotspotRecord, globalHotspotService } from '../core/hotspots/hotspotService';
import { globalEventBus, HazardAlertPayload } from '../core/events/eventBus';

interface ExtremeHazardBannerProps {
  onFocusLocation: (lat: number, lng: number, place: string) => void;
}

export const ExtremeHazardBanner: React.FC<ExtremeHazardBannerProps> = ({
  onFocusLocation,
}) => {
  const [currentHazard, setCurrentHazard] = useState<HotspotRecord | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Initial top hazard
    const initialTop = globalHotspotService.getTopEmergencyHazard();
    if (initialTop) {
      setCurrentHazard(initialTop);
    }

    // Listen for live hazard alerts triggered across the event bus
    const unsubscribe = globalEventBus.on('HAZARD_ALERT_TRIGGERED', (alert: HazardAlertPayload) => {
      setCurrentHazard({
        id: alert.id,
        lat: alert.lat,
        lng: alert.lng,
        place: alert.place,
        aqi: alert.aqi,
        severity: alert.severity,
        reason: alert.reason,
        detectedAt: alert.timestamp,
      });
      setIsDismissed(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!currentHazard || isDismissed) return null;

  const severityBadge = {
    EMERGENCY: 'bg-red-600 text-white border-red-500 animate-pulse',
    CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  }[currentHazard.severity];

  return (
    <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-40 w-11/12 max-w-2xl animate-bounce-short">
      <div className="bg-gradient-to-r from-red-950/90 via-slate-900/95 to-slate-900/90 backdrop-blur-xl border border-red-500/40 rounded-2xl p-3 px-4 shadow-2xl shadow-red-950/50 flex items-center justify-between gap-3 text-white">
        {/* Pulsing Alarm Icon */}
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
            <svg aria-hidden="true" className="h-4 w-4 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2.8 19a1.3 1.3 0 0 0 1.1 2h16.2a1.3 1.3 0 0 0 1.1-2L12 3Z"/><path d="M12 9v4m0 3h.01"/></svg>
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityBadge}`}>
                {currentHazard.severity} HAZARD
              </span>
              <span className="text-xs font-semibold text-white truncate">
                {currentHazard.place}
              </span>
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                AQI {currentHazard.aqi}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {currentHazard.reason}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => onFocusLocation(currentHazard.lat, currentHazard.lng, currentHazard.place)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-medium shadow-md shadow-red-600/30 transition transform hover:scale-105 flex items-center gap-1.5"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></svg>
            <span className="hidden sm:inline">Track Plume</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Dismiss Alert"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
