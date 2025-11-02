import React, { useState } from 'react';
import { POLLUTANT_ENCYCLOPEDIA, AIR_QUALITY_FACTS } from '../educationalContent';
import { CloseIcon, BookOpenIcon } from './icons';

interface EducationPanelProps {
  pollutantSymbol?: string;
  onClose: () => void;
}

const EducationPanel: React.FC<EducationPanelProps> = ({ pollutantSymbol, onClose }) => {
  const [selectedPollutant, setSelectedPollutant] = useState(pollutantSymbol || 'PM2.5');
  const pollutant = POLLUTANT_ENCYCLOPEDIA[selectedPollutant];

  if (!pollutant) return null;

  const pollutantKeys = Object.keys(POLLUTANT_ENCYCLOPEDIA);

  return (
    <div className="absolute top-4 left-4 z-10 w-full max-w-2xl mx-4 sm:mx-0 bg-gray-800/95 text-white rounded-lg backdrop-blur-md border border-cyan-500/50 shadow-2xl animate-fadeIn max-h-[calc(100vh-32px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center">
          <BookOpenIcon className="w-6 h-6 mr-2 text-cyan-400" />
          <h2 className="text-xl font-bold">Pollutant Encyclopedia</h2>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Close education panel"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Pollutant Selector */}
      <div className="p-4 border-b border-gray-700 overflow-x-auto flex-shrink-0">
        <div className="flex space-x-2">
          {pollutantKeys.map(key => {
            const p = POLLUTANT_ENCYCLOPEDIA[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedPollutant(key)}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                  selectedPollutant === key
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                }`}
                style={{ borderColor: p.color }}
              >
                {p.icon} {p.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="p-4 overflow-y-auto flex-1">
        {/* Title */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-4xl mr-3">{pollutant.icon}</span>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: pollutant.color }}>
                {pollutant.symbol} - {pollutant.name}
              </h3>
              <p className="text-sm text-gray-400">{pollutant.fullName}</p>
            </div>
          </div>
          <p className="text-gray-300 leading-relaxed">{pollutant.description}</p>
        </div>

        {/* Safe Level */}
        <div className="mb-4 p-3 bg-green-900/20 rounded-lg border border-green-700/50">
          <p className="text-sm font-semibold text-green-400 mb-1">Safe Level (WHO Guideline)</p>
          <p className="text-lg font-bold text-white">{pollutant.safeLevel}</p>
        </div>

        {/* Sources */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-cyan-400 flex items-center">
            <span className="mr-2">🏭</span> Main Sources
          </h4>
          <ul className="space-y-1 text-sm text-gray-300">
            {pollutant.sources.map((source, i) => (
              <li key={i} className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>{source}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Health Impacts */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-red-400 flex items-center">
            <span className="mr-2">⚕️</span> Health Impacts
          </h4>
          
          <div className="mb-3">
            <p className="text-sm font-medium text-orange-400 mb-1">Short-Term Effects:</p>
            <ul className="space-y-1 text-sm text-gray-300">
              {pollutant.healthImpacts.shortTerm.map((impact, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-orange-400 mr-2">▸</span>
                  <span>{impact}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-red-400 mb-1">Long-Term Effects:</p>
            <ul className="space-y-1 text-sm text-gray-300">
              {pollutant.healthImpacts.longTerm.map((impact, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-red-400 mr-2">▸</span>
                  <span>{impact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Environmental Impacts */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-green-400 flex items-center">
            <span className="mr-2">🌍</span> Environmental Impacts
          </h4>
          <ul className="space-y-1 text-sm text-gray-300">
            {pollutant.environmentalImpacts.map((impact, i) => (
              <li key={i} className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>{impact}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Facts */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-lg font-semibold mb-3 text-cyan-400">Did You Know?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AIR_QUALITY_FACTS.slice(0, 4).map((fact, i) => (
              <div key={i} className="p-3 bg-gray-700/30 rounded-lg">
                <p className="text-2xl mb-1">{fact.icon}</p>
                <p className="text-xs font-semibold text-cyan-300 mb-1">{fact.title}</p>
                <p className="text-xs text-gray-300">{fact.fact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationPanel;
