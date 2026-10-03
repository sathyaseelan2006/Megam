import React, { useState, useEffect } from 'react';
import { historyService } from '../services/historyService';
import { HistoryEntry } from '../types';
import { AQI_LEVELS } from '../constants';
import { CloseIcon, HistoryIcon, StarIcon, StarFilledIcon, TrashIcon } from './icons';
import { format } from 'date-fns';

interface HistoryPanelProps {
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onClose, onLocationSelect }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setHistory(historyService.getHistory());
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    historyService.toggleFavorite(id);
    loadHistory();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Remove this location from history?')) {
      historyService.deleteEntry(id);
      loadHistory();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all history? This cannot be undone.')) {
      historyService.clearHistory();
      loadHistory();
    }
  };

  const getAQILevel = (aqi: number) => {
    return AQI_LEVELS.find(level => aqi >= level.range[0] && aqi <= level.range[1]);
  };

  const displayedHistory = activeTab === 'favorites' 
    ? history.filter(h => h.isFavorite)
    : history;

  return (
    <div className="fixed left-3 right-3 top-20 bottom-16 z-40 sm:left-auto sm:right-4 sm:bottom-auto sm:w-[calc(100vw-2rem)] sm:max-w-md sm:max-h-[calc(100dvh-6rem)] bg-slate-950/95 text-white rounded-2xl backdrop-blur-xl border border-slate-700 shadow-2xl animate-fadeInRight flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/60 to-slate-900/60 border-b border-cyan-500/30 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wider uppercase text-cyan-100 flex items-center gap-2">
              Telemetry Log
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">HUD-HIST</span>
            </h2>
            <p className="text-xs text-cyan-400/70 font-mono">Temporal Observation Archive</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700/60 hover:border-red-500/40 transition-all duration-200"
          aria-label="Close history panel"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-3 font-medium transition-colors ${
            activeTab === 'recent'
              ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Recent ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-3 font-medium transition-colors ${
            activeTab === 'favorites'
              ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Favorites ({history.filter(h => h.isFavorite).length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayedHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-2 flex justify-center text-slate-500"><svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 14.8 9l6.2.7-4.6 4.2 1.3 6.1L12 17l-5.7 3 1.3-6.1L3 9.7 9.2 9 12 3Z"/></svg></div>
            <p className="text-gray-400 mb-2">{activeTab === 'favorites' ? 'No favorites yet' : 'No search history'}</p>
            <p className="text-sm text-gray-500">
              {activeTab === 'favorites'
                ? 'Star locations to save them as favorites'
                : 'Search for locations to build your history'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedHistory.map((entry) => {
              const aqiLevel = getAQILevel(entry.aqi);
              return (
                <div
                  key={entry.id}
                  onClick={() => onLocationSelect(entry.location.lat, entry.location.lng)}
                  className="p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {entry.location.city}, {entry.location.country}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {format(new Date(entry.timestamp), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleToggleFavorite(entry.id, e)}
                        className="p-1 hover:scale-110 transition-transform"
                        aria-label="Toggle favorite"
                      >
                        {entry.isFavorite ? (
                          <StarFilledIcon className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <StarIcon className="w-5 h-5 text-gray-400 hover:text-yellow-400" />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="p-1 hover:scale-110 transition-transform"
                        aria-label="Delete entry"
                      >
                        <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  {aqiLevel && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${aqiLevel.className}`}>
                      AQI: {entry.aqi} • {aqiLevel.level}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {history.length > 0 && (
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={handleClearAll}
            className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
          >
            Clear All History
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
