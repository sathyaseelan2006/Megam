import React, { useState } from 'react';
import { AQI_LEVELS } from '../constants';
import { LocationData, AQILevel } from '../types';
import { CloseIcon, InfoIcon, ShieldCheckIcon, ShareIcon } from './icons';

interface InfoPanelProps {
  data: LocationData | null;
  onClose: () => void;
  loading: boolean;
}

const getAqiLevel = (aqi: number): AQILevel | undefined => {
  return AQI_LEVELS.find(level => aqi >= level.range[0] && aqi <= level.range[1]);
};

const InfoPanel: React.FC<InfoPanelProps> = ({ data, onClose, loading }) => {
  const [showShareToast, setShowShareToast] = useState(false);
  
  if (!data && !loading) return null;

  const aqiLevel = data ? getAqiLevel(data.aqi) : undefined;

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
        // Fallback: copy to clipboard
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 w-full max-w-sm mx-4 sm:mx-0 bg-gray-800/50 text-white rounded-lg backdrop-blur-md border border-gray-600 shadow-2xl animate-fadeInRight">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold">Air Quality Report</h2>
        <div className="flex items-center space-x-2">
          {data && (
            <button 
              onClick={handleShare} 
              className="p-1 rounded-full hover:bg-gray-700 transition-colors"
              title="Share this report"
              aria-label="Share air quality report"
            >
              <ShareIcon className="w-6 h-6" />
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close panel"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Share Toast Notification */}
      {showShareToast && (
        <div className="absolute top-16 right-4 bg-green-600/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-md animate-fadeIn z-20">
          <p className="text-sm font-medium">Copied to clipboard!</p>
        </div>
      )}

      {loading && (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Fetching latest data...</p>
        </div>
      )}

      {!loading && data && aqiLevel && (
        <div className="p-4 max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="text-center mb-4">
            <h3 className="text-2xl font-semibold">{data.city}, {data.country}</h3>
            <p className="text-gray-400 text-sm">Lat: {data.lat.toFixed(4)}, Lng: {data.lng.toFixed(4)}</p>
          </div>

          <div className={`p-4 rounded-lg text-center mb-4 ${aqiLevel.className}`}>
            <p className="text-sm uppercase tracking-wider font-medium">US AQI</p>
            <p className="text-6xl font-bold">{data.aqi}</p>
            <p className="text-xl font-semibold">{aqiLevel.level}</p>
          </div>

          {/* Data Source Badge */}
          {data.dataSource && (
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xs text-gray-400">Data Source:</span>
              <span className={`
                px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1
                ${data.dataSource === 'satellite' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : ''}
                ${data.dataSource === 'ground' ? 'bg-green-500/20 text-green-300 border border-green-400/30' : ''}
                ${data.dataSource === 'hybrid' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'}
              `}>
                {data.dataSource === 'satellite' && '🛰️ Satellite Data'}
                {data.dataSource === 'ground' && '📡 Ground Station'}
                {data.dataSource === 'hybrid' && '🔀 Hybrid (Satellite + Ground)'}
                {!data.dataSource && '🔀 Real-time Data'}
              </span>
                {data.confidence && (
                  <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                    {data.confidence}% confidence
                  </span>
                )}
              </div>
              {/* Provider Attribution */}
              <div className="text-center">
                <span className="text-xs text-gray-500">
                  {data.dataSource === 'hybrid' && 'Provided by WAQI & OpenAQ'}
                  {data.dataSource === 'satellite' && 'Provided by WAQI'}
                  {data.dataSource === 'ground' && 'Provided by OpenAQ'}
                  {!data.dataSource && 'Real-time monitoring data'}
                </span>
              </div>
            </div>
          )}

          {/* Last Updated */}
          {data.lastUpdated && (
            <div className="text-center mb-4">
              <span className="text-xs text-gray-400">
                Last updated: {new Date(data.lastUpdated).toLocaleString()}
              </span>
            </div>
          )}

          {/* Weather & Climate Data - Modern Redesign */}
          {data.weather && (
            <div className="mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-blue-400/20 shadow-lg">
              {/* Header with Icon */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-3 border-b border-blue-400/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    Weather Conditions
                  </h4>
                  <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">Live</span>
                </div>
              </div>

              {/* Main Weather Grid */}
              <div className="p-4">
                {/* Featured: Temperature (Large) */}
                {data.weather.temperature !== undefined && (
                  <div className="text-center mb-4 pb-4 border-b border-gray-700/50">
                    <div className="inline-flex items-baseline gap-1">
                      <span className="text-5xl font-bold bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                        {data.weather.temperature}
                      </span>
                      <span className="text-2xl font-semibold text-gray-400">°C</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 font-medium">
                      {data.weather.temperature > 35 ? '🔥 Extremely Hot' :
                       data.weather.temperature > 30 ? '☀️ Very Warm' :
                       data.weather.temperature > 25 ? '🌤️ Warm' :
                       data.weather.temperature > 20 ? '😊 Pleasant' :
                       data.weather.temperature > 15 ? '🍂 Mild' :
                       data.weather.temperature > 10 ? '🧥 Cool' :
                       data.weather.temperature > 5 ? '❄️ Cold' : '🥶 Very Cold'}
                    </p>
                  </div>
                )}

                {/* Compact Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Humidity */}
                  {data.weather.humidity !== undefined && (
                    <div className="group relative bg-gradient-to-br from-blue-500/5 to-blue-600/10 hover:from-blue-500/10 hover:to-blue-600/20 rounded-lg p-3 transition-all duration-300 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Humidity</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-blue-300">{data.weather.humidity}</span>
                        <span className="text-sm text-gray-400">%</span>
                      </div>
                      <div className="mt-1 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(data.weather.humidity, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pressure */}
                  {data.weather.pressure !== undefined && (
                    <div className="group relative bg-gradient-to-br from-purple-500/5 to-purple-600/10 hover:from-purple-500/10 hover:to-purple-600/20 rounded-lg p-3 transition-all duration-300 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Pressure</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-purple-300">{data.weather.pressure}</span>
                        <span className="text-xs text-gray-400">hPa</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {data.weather.pressure > 1020 ? '⬆️ High pressure' :
                         data.weather.pressure > 1013 ? '→ Normal' : '⬇️ Low pressure'}
                      </p>
                    </div>
                  )}

                  {/* Wind Speed */}
                  {data.weather.windSpeed !== undefined && (
                    <div className="group relative bg-gradient-to-br from-green-500/5 to-emerald-600/10 hover:from-green-500/10 hover:to-emerald-600/20 rounded-lg p-3 transition-all duration-300 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Wind</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-green-300">{data.weather.windSpeed}</span>
                        <span className="text-xs text-gray-400">m/s</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {data.weather.windSpeed > 10 ? '💨 Strong wind' :
                         data.weather.windSpeed > 5 ? '🍃 Moderate' : '😌 Calm'}
                      </p>
                    </div>
                  )}

                  {/* Wind Direction */}
                  {data.weather.windDirection !== undefined && (
                    <div className="group relative bg-gradient-to-br from-cyan-500/5 to-teal-600/10 hover:from-cyan-500/10 hover:to-teal-600/20 rounded-lg p-3 transition-all duration-300 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Direction</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-cyan-300">
                          {data.weather.windDirection >= 337.5 || data.weather.windDirection < 22.5 ? 'N' :
                           data.weather.windDirection >= 22.5 && data.weather.windDirection < 67.5 ? 'NE' :
                           data.weather.windDirection >= 67.5 && data.weather.windDirection < 112.5 ? 'E' :
                           data.weather.windDirection >= 112.5 && data.weather.windDirection < 157.5 ? 'SE' :
                           data.weather.windDirection >= 157.5 && data.weather.windDirection < 202.5 ? 'S' :
                           data.weather.windDirection >= 202.5 && data.weather.windDirection < 247.5 ? 'SW' :
                           data.weather.windDirection >= 247.5 && data.weather.windDirection < 292.5 ? 'W' : 'NW'}
                        </span>
                        <span 
                          className="text-xl transform transition-transform duration-300"
                          style={{ transform: `rotate(${data.weather.windDirection}deg)` }}
                        >
                          ↓
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{data.weather.windDirection}°</p>
                    </div>
                  )}
                </div>

                {/* Powered by Badge */}
                <div className="mt-3 pt-3 border-t border-gray-700/30 text-center">
                  <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    Powered by IQAir AirVisual
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nearest Station Warning */}
          {(data as any).nearestStationDistance && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-yellow-300 mb-1">Using Nearby Station</p>
                  <p className="text-xs text-gray-300">
                    No monitoring station at this exact location. Using data from the nearest station 
                    <span className="font-semibold text-yellow-300"> {(data as any).nearestStationDistance.toFixed(1)}km away</span>.
                    Actual air quality may vary.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-900/50 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <InfoIcon className="w-5 h-5 mr-2 mt-1 text-cyan-400 flex-shrink-0" />
              <p className="text-sm text-gray-300">{aqiLevel.healthImpact}</p>
            </div>
          </div>
          
          <div className="mb-4">
             <h4 className="text-lg font-semibold mb-2 border-b border-gray-700 pb-1">Summary</h4>
             <p className="text-sm text-gray-300">{data.summary}</p>
          </div>

          {data.healthAdvisory && data.healthAdvisory.length > 0 && (
            <div className="mb-4">
                <h4 className="text-lg font-semibold mb-2 border-b border-gray-700 pb-1 flex items-center">
                    <ShieldCheckIcon className="w-5 h-5 mr-2 text-cyan-400" />
                    Health Advisory
                </h4>
                <ul className="space-y-2 text-sm list-disc list-inside text-gray-300 pl-2">
                    {data.healthAdvisory.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
          )}

          <div>
            <h4 className="text-lg font-semibold mb-2 border-b border-gray-700 pb-1">Primary Pollutants</h4>
            <ul className="space-y-2 text-sm">
              {data.pollutants.map((p, index) => (
                <li key={index} className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
                  <span className="font-medium text-gray-200">{p.name}</span>
                  <span className="text-gray-300">{p.concentration} <span className="text-xs text-gray-400">{p.unit}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;