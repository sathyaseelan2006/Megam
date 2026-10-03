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
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 md:gap-4 px-3 py-2 md:px-4 md:py-2.5 bg-slate-950/90 backdrop-blur-xl border border-slate-700 rounded-xl shadow-xl">
        {/* High-Tech Omnibar Search */}
        <form 
          onSubmit={handleFormSubmit}
          className={`relative order-1 basis-full md:order-none md:basis-auto flex-1 max-w-none md:max-w-2xl transition-all duration-200 ${
            isFocused ? 'ring-2 ring-cyan-400/50' : ''
          } rounded-lg bg-slate-900 border border-slate-700 flex items-center px-3 py-1.5`}
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
        <div className="order-2 flex items-center gap-1.5 md:order-none md:gap-2 flex-shrink-0">
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
            <SatelliteIcon className="w-4 h-4" />
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
