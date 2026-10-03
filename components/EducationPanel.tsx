import React, { useState } from 'react';
import {
  POLLUTANT_ENCYCLOPEDIA,
  AIR_QUALITY_FACTS,
  SCIENCE_RESEARCH_RESOURCES,
  SCIENCE_NEWS_SOURCES,
  ScienceResource
} from '../educationalContent';
import { CloseIcon, BookOpenIcon } from './icons';

const PollutantIcon: React.FC<{ symbol: string; className?: string }> = ({ symbol, className = 'h-5 w-5' }) => {
  const shared = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (symbol === 'O₃') return <svg {...shared}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>;
  if (symbol === 'NO₂' || symbol === 'SO₂' || symbol === 'CO') return <svg {...shared}><circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m7 7 3 3m7-3-3 3m-7 7 3-3m7 3-3-3"/></svg>;
  if (symbol === 'VOC') return <svg {...shared}><path d="M9 3h6m-5 0v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3"/><path d="M8 15h8"/></svg>;
  return <svg {...shared}><circle cx="7" cy="8" r="2"/><circle cx="16" cy="6" r="1.5"/><circle cx="14" cy="15" r="2.5"/><circle cx="6" cy="18" r="1.5"/><path d="m9 8 5-1m-6 3 4 3m-5 3 5-.5"/></svg>;
};

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
    <div className="fixed left-3 right-3 top-20 bottom-24 z-40 md:left-24 md:right-auto md:top-28 md:bottom-4 w-auto md:w-[calc(100vw-6rem)] md:max-w-2xl bg-slate-950/95 text-white rounded-2xl backdrop-blur-xl border border-slate-700/80 shadow-[0_20px_60px_rgba(2,6,23,0.55)] animate-fadeIn flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300">
            <BookOpenIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              {activeView === 'encyclopedia' ? 'Pollutant Encyclopedia' : 'Science Research Hub'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">Explore pollutants, health effects and current research</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors duration-200"
          aria-label="Close education panel"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Top-level view switch */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800 flex gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveView('encyclopedia')}
          className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'encyclopedia'
              ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600'
              : 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Encyclopedia
        </button>
        <button
          onClick={() => setActiveView('science')}
          className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'science'
              ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600'
              : 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Research + News
        </button>
      </div>

      {/* Pollutant Selector */}
      {activeView === 'encyclopedia' && (
        <div className="flex-shrink-0 overflow-x-auto border-b border-slate-800 px-4 py-3">
          <div className="flex min-w-max gap-2">
            {pollutantKeys.map(key => {
              const p = POLLUTANT_ENCYCLOPEDIA[key];
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPollutant(key)}
                  aria-pressed={selectedPollutant === key}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    selectedPollutant === key
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'border-transparent bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  style={{ borderColor: selectedPollutant === key ? p.color : undefined }}
                >
                  <PollutantIcon symbol={p.symbol} className="h-4 w-4" /> {p.symbol}
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
            <div className="mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900" style={{ color: pollutant.color }}><PollutantIcon symbol={pollutant.symbol} className="h-6 w-6" /></div>
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
            <svg aria-hidden="true" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V10l6 3V9l6 4V5h6v16H3Z"/><path d="M17 8h1m-1 4h1m-9 5h1m4 0h1"/></svg> Main Sources
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
            <svg aria-hidden="true" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="M9 12h6m-3-3v6"/></svg> Health Impacts
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
            <svg className="inline w-4 h-4 mr-2 align-[-3px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18"/></svg> Environmental Impacts
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
