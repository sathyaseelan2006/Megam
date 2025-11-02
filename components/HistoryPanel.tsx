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
    <div className="absolute top-4 right-4 z-10 w-full max-w-md mx-4 sm:mx-0 bg-gray-800/95 text-white rounded-lg backdrop-blur-md border border-gray-600 shadow-2xl animate-fadeInRight max-h-[calc(100vh-32px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center">
          <HistoryIcon className="w-6 h-6 mr-2 text-cyan-400" />
          <h2 className="text-xl font-bold">Search History</h2>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Close history panel"
        >
          <CloseIcon className="w-6 h-6" />
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
            <p className="text-gray-400 mb-2">
              {activeTab === 'favorites' 
                ? '⭐ No favorites yet' 
                : '📍 No search history'}
            </p>
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
