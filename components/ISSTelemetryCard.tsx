import React from 'react';
import { ISSTelemetry } from '../core/satellite/issTracker';
import { CloseIcon } from './icons';

interface ISSTelemetryCardProps {
  telemetry: ISSTelemetry;
  isTrackingCamera: boolean;
  onToggleTrackingCamera: () => void;
  onClose: () => void;
}

export const ISSTelemetryCard: React.FC<ISSTelemetryCardProps> = ({
  telemetry,
  isTrackingCamera,
  onToggleTrackingCamera,
  onClose,
}) => {
  return (
    <div className="fixed bottom-6 right-4 z-40 w-[calc(100vw-2rem)] sm:w-[380px] bg-slate-950/90 text-slate-100 rounded-2xl backdrop-blur-2xl border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.3)] animate-fadeInUp flex flex-col overflow-hidden pointer-events-auto font-sans">
      
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-cyan-950/70 via-slate-900/80 to-slate-950/80 border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <span className="text-base">🛰️</span>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-100 flex items-center gap-1.5">
              ISS Zarya Ephemeris
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                ORBIT
              </span>
            </h3>
            <p className="text-[11px] font-mono text-cyan-400/70">Low Earth Orbit • 51.6° Inclination</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700/60 hover:border-red-500/40 transition-all"
          aria-label="Close ISS panel"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Body Metrics */}
      <div className="p-4 space-y-3 font-mono text-xs">
        
        {/* Speed & Altitude Tiles */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">ORBITAL SPEED</span>
            <span className="text-base font-bold text-amber-300">
              {telemetry.velocity.toLocaleString()} <span className="text-[10px] text-slate-400">km/h</span>
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Mach 22.5</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">ALTITUDE</span>
            <span className="text-base font-bold text-cyan-300">
              {telemetry.altitude} <span className="text-[10px] text-slate-400">km</span>
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Thermosphere</span>
          </div>
        </div>

        {/* Coordinates & Illumination */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Subsolar State:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              telemetry.visibility === 'daylight' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {telemetry.visibility === 'daylight' ? '☀️ Daylight Pass' : '🌑 Earth Shadow (Eclipse)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Ground Subpoint:</span>
            <span className="text-cyan-200">
              {telemetry.lat.toFixed(2)}°N, {telemetry.lng.toFixed(2)}°E
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Period / Revolution:</span>
            <span className="text-slate-200">{telemetry.orbitPeriodMinutes} min (~15.54 orbits/day)</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={onToggleTrackingCamera}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 border ${
              isTrackingCamera
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900 hover:bg-cyan-500/20 border-slate-700 hover:border-cyan-500/40 text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{isTrackingCamera ? 'Locking Cupola View' : 'Track ISS Orbit'}</span>
          </button>
        </div>

        {/* 3D Model Info Notice */}
        <div className="text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
          💡 <span className="text-slate-300 font-semibold">Custom 3D Model:</span> Drop your custom <code className="text-cyan-300">iss.glb</code> into <code className="text-cyan-300">public/models/iss.glb</code> to override the procedural 3D model.
        </div>

      </div>

    </div>
  );
};
