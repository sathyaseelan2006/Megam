import React, { useState } from 'react';
import {
  POLLUTANT_ENCYCLOPEDIA,
  AIR_QUALITY_FACTS,
  SCIENCE_RESEARCH_RESOURCES,
  SCIENCE_NEWS_SOURCES,
  ScienceResource
} from '../educationalContent';
import { CloseIcon, BookOpenIcon } from './icons';

interface EducationPanelProps {
  pollutantSymbol?: string;
  onClose: () => void;
}

const EducationPanel: React.FC<EducationPanelProps> = ({ pollutantSymbol, onClose }) => {
  const [activeView, setActiveView] = useState<'encyclopedia' | 'science'>('encyclopedia');
  const [selectedPollutant, setSelectedPollutant] = useState(pollutantSymbol || 'PM2.5');
  const [scienceQuery, setScienceQuery] = useState('');
  const [scienceTopic, setScienceTopic] = useState<'all' | ScienceResource['topic']>('all');
  const pollutant = POLLUTANT_ENCYCLOPEDIA[selectedPollutant] || POLLUTANT_ENCYCLOPEDIA['PM2.5'];

  const pollutantKeys = Object.keys(POLLUTANT_ENCYCLOPEDIA);

  const topicLabel = (topic: ScienceResource['topic']) => {
    if (topic === 'air-pollution') return 'Air Pollution';
    if (topic === 'climate-change') return 'Climate Change';
    if (topic === 'global-warming') return 'Global Warming';
    return 'Weather & Atmosphere';
  };

  const resourceMatches = (resource: ScienceResource) => {
    const q = scienceQuery.trim().toLowerCase();
    const text = `${resource.title} ${resource.source} ${resource.summary}`.toLowerCase();
    const topicOk = scienceTopic === 'all' || resource.topic === scienceTopic;
    const queryOk = !q || text.includes(q);
    return topicOk && queryOk;
  };

  const filteredResearch = SCIENCE_RESEARCH_RESOURCES.filter(resourceMatches);
  const filteredNews = SCIENCE_NEWS_SOURCES.filter(resourceMatches);

  return (
    <div className="fixed left-20 md:left-24 top-4 bottom-4 z-40 w-[calc(100vw-6rem)] max-w-2xl bg-slate-950/90 text-white rounded-2xl backdrop-blur-2xl border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] animate-fadeIn flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/60 to-slate-900/60 border-b border-cyan-500/30 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <BookOpenIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wider uppercase text-cyan-100 flex items-center gap-2">
              {activeView === 'encyclopedia' ? 'Pollutant Encyclopedia' : 'Science Research Hub'}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">HUD-EDU</span>
            </h2>
            <p className="text-xs text-cyan-400/70 font-mono">Atmospheric & Chemical Composition Database</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700/60 hover:border-red-500/40 transition-all duration-200"
          aria-label="Close education panel"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Top-level view switch */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-700 flex gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveView('encyclopedia')}
          className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
            activeView === 'encyclopedia'
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
          }`}
        >
          Encyclopedia
        </button>
        <button
          onClick={() => setActiveView('science')}
          className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
            activeView === 'science'
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
          }`}
        >
          Research + News
        </button>
      </div>

      {/* Pollutant Selector */}
      {activeView === 'encyclopedia' && (
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
      )}

      {/* Science controls */}
      {activeView === 'science' && (
        <div className="p-4 border-b border-gray-700 flex flex-col gap-2 flex-shrink-0">
          <input
            type="text"
            value={scienceQuery}
            onChange={(e) => setScienceQuery(e.target.value)}
            placeholder="Search topics, journals, climate and atmospheric research..."
            className="w-full bg-gray-900/60 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setScienceTopic('all')}
              className={`px-3 py-1 rounded text-xs ${scienceTopic === 'all' ? 'bg-cyan-500 text-white' : 'bg-gray-700/60 text-gray-300'}`}
            >
              All
            </button>
            {(['air-pollution', 'climate-change', 'global-warming', 'weather-atmosphere'] as const).map((topic) => (
              <button
                key={topic}
                onClick={() => setScienceTopic(topic)}
                className={`px-3 py-1 rounded text-xs ${scienceTopic === topic ? 'bg-cyan-500 text-white' : 'bg-gray-700/60 text-gray-300'}`}
              >
                {topicLabel(topic)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="p-4 overflow-y-auto flex-1">
        {activeView === 'encyclopedia' ? (
          <>
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
          </>
        ) : (
          <>
            <div className="mb-4 p-3 bg-cyan-900/20 border border-cyan-700/40 rounded-lg">
              <p className="text-sm text-cyan-200">
                Explore trusted scientific resources and news focused on air pollution, climate change, global warming,
                earth weather, and atmospheric conditions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold mb-2 text-cyan-300">Research Explorer</h4>
                <div className="space-y-3">
                  {filteredResearch.length === 0 && (
                    <p className="text-sm text-gray-400">No research resources match your filters.</p>
                  )}
                  {filteredResearch.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-700/30 rounded-lg border border-gray-700 hover:border-cyan-500/40 transition-colors"
                    >
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-cyan-300 mt-1">{item.source} • {topicLabel(item.topic)}</p>
                      <p className="text-xs text-gray-300 mt-2 leading-relaxed">{item.summary}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 text-green-300">News Column</h4>
                <div className="space-y-3">
                  {filteredNews.length === 0 && (
                    <p className="text-sm text-gray-400">No news sources match your filters.</p>
                  )}
                  {filteredNews.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-700/30 rounded-lg border border-gray-700 hover:border-green-500/40 transition-colors"
                    >
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-green-300 mt-1">{item.source} • {topicLabel(item.topic)}</p>
                      <p className="text-xs text-gray-300 mt-2 leading-relaxed">{item.summary}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EducationPanel;
