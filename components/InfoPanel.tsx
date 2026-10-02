import React, { useState } from 'react';
import { AQI_LEVELS } from '../constants';
import { LocationData, AQILevel } from '../types';
import { CloseIcon, InfoIcon, ShieldCheckIcon, ShareIcon } from './icons';
import { POLLUTANT_ENCYCLOPEDIA } from '../educationalContent';
import { AIBriefingCard } from './AIBriefingCard';
import { useAIBriefing } from '../hooks/useAIBriefing';
import { BriefingInputContext } from '../core/ai/types';

interface InfoPanelProps {
  data: LocationData | null;
  onClose: () => void;
  loading: boolean;
}

type OutdoorActivityLevel = 'low' | 'moderate' | 'high';

const getPollutantKey = (name: string): string | null => {
  const normalized = name.trim().toUpperCase();
  if (normalized === 'PM2.5' || normalized === 'PM25') return 'PM2.5';
  if (normalized === 'PM10') return 'PM10';
  if (normalized === 'O3' || normalized === 'O₃' || normalized.includes('OZONE')) return 'O3';
  if (normalized === 'NO2' || normalized === 'NO₂' || normalized.includes('NITROGEN')) return 'NO2';
  if (normalized === 'SO2' || normalized === 'SO₂' || normalized.includes('SULFUR')) return 'SO2';
  if (normalized === 'CO' || normalized.includes('CARBON MONOXIDE')) return 'CO';
  return null;
};

const getDynamicRecommendations = (
  data: LocationData,
  hasAsthma: boolean,
  outdoorLevel: OutdoorActivityLevel
): string[] => {
  const recs: string[] = [];
  const aqi = data.aqi;

  if (aqi <= 50) {
    recs.push('Air quality is optimal. Outdoor exercise and ventilation recommended.');
  } else if (aqi <= 100) {
    recs.push('Air quality is acceptable. Hypersensitive individuals should monitor symptoms.');
  } else if (aqi <= 150) {
    recs.push('Unhealthy for sensitive groups. Reduce prolonged outdoor exertion.');
  } else if (aqi <= 200) {
    recs.push('Unhealthy air conditions. Keep windows closed and avoid strenuous outdoor exercise.');
  } else if (aqi <= 300) {
    recs.push('Very unhealthy air. Run HEPA filtration indoors and minimize outdoor exposure.');
  } else {
    recs.push('Hazardous atmospheric emergency. Wear N95/FFP2 masks outdoors, seal indoor ventilation.');
  }

  if (hasAsthma) {
    if (aqi > 100) {
      recs.push('Asthma profile: carry rescue inhaler, minimize outdoor exposure.');
    } else {
      recs.push('Asthma profile: standard atmospheric baseline, maintain normal precautions.');
    }
  }

  if (outdoorLevel === 'high') {
    if (aqi > 100) {
      recs.push('High exertion: reschedule intense workouts indoors.');
    } else {
      recs.push('High exertion: favorable conditions for outdoor endurance training.');
    }
  }

  const topPollutant = [...(data.pollutants || [])]
    .sort((a, b) => b.concentration - a.concentration)[0];

  if (topPollutant) {
    const key = getPollutantKey(topPollutant.name);
    if (key && POLLUTANT_ENCYCLOPEDIA[key]) {
      const p = POLLUTANT_ENCYCLOPEDIA[key];
      recs.push(`Dominant vector: ${p.symbol} (${p.name}). Primary source: ${p.sources[0]}.`);
    }
  }

  return recs.slice(0, 5);
};

const getAqiLevel = (aqi: number): AQILevel | undefined => {
  return AQI_LEVELS.find(level => aqi >= level.range[0] && aqi <= level.range[1]);
};

const getAqiColorMeta = (aqi: number) => {
  if (aqi <= 50) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400', label: 'Good' };
  if (aqi <= 100) return { stroke: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', text: 'text-yellow-400', label: 'Moderate' };
  if (aqi <= 150) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', text: 'text-orange-400', label: 'Sensitive Unhealthy' };
  if (aqi <= 200) return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: 'text-red-400', label: 'Unhealthy' };
  if (aqi <= 300) return { stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', text: 'text-purple-400', label: 'Very Unhealthy' };
  return { stroke: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)', text: 'text-pink-400', label: 'Hazardous' };
};

const InfoPanel: React.FC<InfoPanelProps> = ({ data, onClose, loading }) => {
  const [showShareToast, setShowShareToast] = useState(false);
  const [hasAsthma, setHasAsthma] = useState(false);
  const [outdoorLevel, setOutdoorLevel] = useState<OutdoorActivityLevel>('moderate');

  const aqiLevel = data ? getAqiLevel(data.aqi) : undefined;
  const dynamicRecommendations = data ? getDynamicRecommendations(data, hasAsthma, outdoorLevel) : [];

  const briefingContext: BriefingInputContext | null = data
    ? {
        city: data.city,
        country: data.country,
        lat: data.lat,
        lng: data.lng,
        aqi: data.aqi,
        dominantPollutant:
          data.pollutants && data.pollutants.length > 0
            ? [...data.pollutants].sort((a, b) => b.concentration - a.concentration)[0]?.name || 'PM2.5'
            : 'PM2.5',
        pollutants: (data.pollutants || []).reduce((acc, p) => {
          const key = p.name.toLowerCase().replace('.', '') as keyof BriefingInputContext['pollutants'];
          acc[key] = p.concentration;
          return acc;
        }, {} as Record<string, number>),
        weather: data.weather
          ? {
              temperature: data.weather.temperature,
              humidity: data.weather.humidity,
              windSpeed: data.weather.windSpeed,
              windDirection: data.weather.windDirection
            }
          : undefined,
        isSatelliteEstimate: data.dataSource === 'satellite'
      }
    : null;

  const { briefing, isLoading: briefingLoading, refresh: refreshBriefing } = useAIBriefing(briefingContext);

  if (!data && !loading) {
    return null;
  }

  const handleShare = async () => {
    if (!data) return;
    const shareData = {
      title: `Air Quality in ${data.city}, ${data.country}`,
      text: `Current AQI: ${data.aqi} (${aqiLevel?.level})\n${data.summary}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const aqiMeta = data ? getAqiColorMeta(data.aqi) : getAqiColorMeta(0);
  const aqiGaugePct = data ? Math.min(100, Math.max(0, (data.aqi / 350) * 100)) : 0;
  const strokeDashoffset = 251.2 - (251.2 * aqiGaugePct) / 100;

  return (
    <aside className="fixed left-3 right-3 md:left-20 md:right-auto top-20 bottom-4 z-40 w-auto md:w-[420px] bg-slate-950/95 text-slate-100 rounded-2xl backdrop-blur-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fadeInRight pointer-events-auto">
      
      {/* Header Bar */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-slate-950/80 border-b border-cyan-500/20 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <span className="text-xs font-mono font-bold">AQI</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Atmospheric Telemetry
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">LIVE</span>
            </h2>
            {data && (
              <p className="text-xs text-cyan-300/80 font-mono truncate max-w-[200px]">
                {data.city}, {data.country}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {data && (
            <button 
              onClick={handleShare} 
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition-all"
              title="Share Report"
              aria-label="Share air quality report"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700/60 hover:border-red-500/40 transition-all"
            aria-label="Close panel"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="absolute top-16 right-4 bg-emerald-500/90 text-slate-950 px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-mono font-bold animate-fadeIn z-50">
          ✓ Link Copied to Clipboard
        </div>
      )}

      {/* Loading State */}
      {loading && data && <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 text-xs text-slate-400" role="status"><span className="w-3.5 h-3.5 rounded-full border border-cyan-500/40 border-t-cyan-300 animate-spin" />Refreshing air quality data…</div>}
      {loading && !data && (
        <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
          <p className="text-xs text-slate-300">Loading air quality data…</p>
        </div>
      )}

      {/* Main Content Area */}
      {data && (
        <div className="p-4 overflow-y-auto flex-1 space-y-4 font-sans scrollbar-thin scrollbar-thumb-cyan-500/20">
          
          {/* Hero Cyber Gauge Card */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/20 shadow-inner flex items-center justify-between gap-4">
            
            {/* Radial SVG Gauge */}
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={aqiMeta.stroke}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 6px ${aqiMeta.stroke})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-3xl font-black font-mono tracking-tight ${aqiMeta.text}`}>
                  {data.aqi}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                  US AQI
                </span>
              </div>
            </div>

            {/* Severity Status & Coordinates */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: aqiMeta.stroke }} />
                <span className={`text-base font-bold tracking-wide ${aqiMeta.text}`}>
                  {aqiLevel?.level || aqiMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">
                {aqiLevel?.healthImpact || 'Standard atmospheric metrics.'}
              </p>
              <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>LAT: {data.lat.toFixed(3)}</span>
                <span>LON: {data.lng.toFixed(3)}</span>
              </div>
            </div>

          </div>

          {/* Data Origin & Confidence Badge */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 10a13 13 0 0 1 18 0M6 13a8 8 0 0 1 12 0m-9 3a4 4 0 0 1 6 0"/><circle cx="12" cy="19" r="1"/></svg>
              <span className="text-slate-300">
                {data.dataSource === 'satellite' ? 'NASA / Satellite Feed' :
                 data.dataSource === 'ground' ? 'WAQI / OpenAQ Ground' : 'Hybrid Sensor Fusion'}
              </span>
            </div>
            {data.confidence && (
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px]">
                {data.confidence}% Confidence
              </span>
            )}
          </div>

          {/* AI Atmospheric Intelligence Card */}
          <AIBriefingCard
            briefing={briefing}
            isLoading={briefingLoading}
            onRefresh={refreshBriefing}
          />

          {/* Environmental Sensor Matrix */}
          {data.weather && (
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-cyan-500/20 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Meteorological Telemetry
                </span>
                <span className="text-[10px] font-mono text-slate-400">LIVE SENSOR</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Temp */}
                {data.weather.temperature !== undefined && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400 font-mono">TEMP</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {data.weather.temperature}°C
                    </span>
                  </div>
                )}
                {/* Humidity */}
                {data.weather.humidity !== undefined && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400 font-mono">HUMID</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm">
                      {data.weather.humidity}%
                    </span>
                  </div>
                )}
                {/* Wind */}
                {data.weather.windSpeed !== undefined && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400 font-mono">WIND</span>
                    <span className="font-mono font-bold text-emerald-300 text-sm">
                      {data.weather.windSpeed} m/s
                    </span>
                  </div>
                )}
                {/* Pressure */}
                {data.weather.pressure !== undefined && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400 font-mono">BARO</span>
                    <span className="font-mono font-bold text-purple-300 text-sm">
                      {data.weather.pressure} hPa
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Primary Pollutant Spectrum */}
          {data.pollutants && data.pollutants.length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Pollutant Spectrum
                </span>
                <span className="text-[10px] font-mono text-slate-400">µg/m³ & ppm</span>
              </div>

              <div className="space-y-2">
                {data.pollutants.map((p, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-semibold text-slate-200">{p.name}</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {p.concentration} <span className="text-[10px] text-slate-400">{p.unit}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Advisory & Dynamic Personalization */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-cyan-500/20 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-cyan-400" />
                Adaptive Health Profile
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasAsthma}
                  onChange={(e) => setHasAsthma(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                />
                Asthma / Respiratory Sensitivity Profile
              </label>

              <div className="flex items-center justify-between text-slate-300">
                <span>Exertion Target:</span>
                <select
                  value={outdoorLevel}
                  onChange={(e) => setOutdoorLevel(e.target.value as OutdoorActivityLevel)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-200 focus:outline-none"
                >
                  <option value="low">Low (Resting / Casual)</option>
                  <option value="moderate">Moderate (Commuting)</option>
                  <option value="high">High (Athletics / Running)</option>
                </select>
              </div>
            </div>

            <ul className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              {dynamicRecommendations.map((item, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="text-cyan-400 mt-0.5">›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}

    </aside>
  );
};

export default InfoPanel;
