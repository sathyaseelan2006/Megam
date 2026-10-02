import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, LocationMarkerIcon, SatelliteIcon, GlobeIcon } from './icons';

interface TopCommandBarProps {
  onSearch: (query: string) => void;
  onMyLocation: () => void;
  isSatelliteView: boolean;
  onToggleSatelliteView: () => void;
  onCenterGlobe: () => void;
  onTrackISS?: () => void;
  isISSTracking?: boolean;
  dangerZonesCount: number;
  onDangerZoneClick?: () => void;
  loading: boolean;
  currentCity?: string;
  currentCountry?: string;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  onSearch,
  onMyLocation,
  isSatelliteView,
  onToggleSatelliteView,
  onCenterGlobe,
  onTrackISS,
  isISSTracking,
  dangerZonesCount,
  onDangerZoneClick,
  loading,
  currentCity,
  currentCountry,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <header className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-6xl z-50 pointer-events-auto">
      <div className="flex items-center justify-between gap-2 md:gap-4 px-3 py-2 md:px-4 md:py-2.5 bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.2)]">
        
        {/* Brand & Live Satellite Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="text-lg font-black tracking-tighter text-cyan-300">M</span>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
                MEGAM
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                v2.5 AI
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400">
                {currentCity ? `${currentCity}, ${currentCountry}` : 'GLOBAL TELEMETRY ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* High-Tech Omnibar Search */}
        <form 
          onSubmit={handleFormSubmit}
          className={`relative flex-1 max-w-md transition-all duration-300 ${
            isFocused ? 'ring-2 ring-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.35)]' : ''
          } rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center px-3 py-1.5`}
        >
          <SearchIcon className="w-4 h-4 text-cyan-400 flex-shrink-0 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any global city, coordinate, or region..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
            disabled={loading}
            aria-label="Search city or coordinates"
            autoComplete="off"
          />

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-500 hover:text-slate-300 text-xs font-mono"
                title="Clear input"
              >
                ✕
              </button>
            )}

            <button
              type="button"
              onClick={onMyLocation}
              disabled={loading}
              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center justify-center disabled:opacity-40"
              title="Locate Me (GPS)"
              aria-label="Use my GPS location"
            >
              <LocationMarkerIcon className="w-4 h-4" />
            </button>

            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
              ⌘K
            </span>
          </div>
        </form>

        {/* Quick Command Action Pills */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          {/* ISS Orbital Tracking Pill */}
          <button
            onClick={onTrackISS}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all duration-300 border ${
              isISSTracking
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-400/50'
            }`}
            title="Track International Space Station (3D Model & Orbit)"
          >
            <span className="text-xs">🛰️</span>
            <span className="hidden sm:inline font-bold">ISS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </button>

          {/* Satellite Layer Toggle */}
          <button
            onClick={onToggleSatelliteView}
            disabled={loading}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all duration-300 border ${
              isSatelliteView
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
            title={isSatelliteView ? "Disable Satellite Pollution Layer" : "Enable Satellite Pollution Layer"}
          >
            <SatelliteIcon className="w-4 h-4" />
            <span className="hidden lg:inline">{isSatelliteView ? 'Satellite: ON' : 'Satellite'}</span>
          </button>

          {/* Recenter Globe */}
          <button
            onClick={onCenterGlobe}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all duration-200 shadow-sm"
            title="Reset Camera to Global View"
            aria-label="Recenter 3D Globe"
          >
            <GlobeIcon className="w-4 h-4" />
          </button>

          {/* Danger Zone Counter Badge */}
          {dangerZonesCount > 0 && (
            <button
              onClick={onDangerZoneClick}
              className="px-2.5 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/50 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-1.5 transition-all duration-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="Click to view extreme danger zones"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{dangerZonesCount} <span className="hidden sm:inline">Hotspots</span></span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
