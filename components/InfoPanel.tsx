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