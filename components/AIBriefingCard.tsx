import React, { useState } from 'react';
import { AtmosphericBriefing } from '../core/ai/types';

interface AIBriefingCardProps {
  briefing: AtmosphericBriefing | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const AIBriefingCard: React.FC<AIBriefingCardProps> = ({
  briefing,
  isLoading,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'sensitive' | 'athletes'>('sensitive');

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/90 to-indigo-950/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-5 shadow-2xl animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></svg>
            </div>
            <div>
              <div className="h-4 w-36 bg-slate-700 rounded mb-1.5" />
              <div className="h-2.5 w-24 bg-slate-800 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-indigo-500/20 rounded-full" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full bg-slate-800 rounded" />
          <div className="h-3 w-5/6 bg-slate-800 rounded" />
        </div>
        <div className="h-20 bg-slate-900/50 rounded-xl border border-slate-800" />
      </div>
    );
  }

  if (!briefing) return null;

  const statusColors = {
    OPTIMAL: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    MODERATE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    CAUTION: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    HAZARDOUS: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };

  const badgeColor = statusColors[briefing.airQualityStatus] || statusColors.MODERATE;

  return (
    <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
      {/* Ambient decorative glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              Atmospheric AI Briefing
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {briefing.model.includes('Gemini') ? 'Gemini 2.5' : 'Expert ML'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Epidemiological & Dispersion Analysis</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}>
            {briefing.airQualityStatus}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Briefing"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <p className="text-xs text-slate-200 leading-relaxed mb-3">
        {briefing.executiveSummary}
      </p>

      {/* Meteorological & Root Cause Snippet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-[11px]">
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
          <span className="text-indigo-400 font-medium block mb-1">🔬 Root Cause</span>
          <span className="text-slate-300">{briefing.rootCauseAnalysis}</span>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
          <span className="text-cyan-400 font-medium block mb-1">💨 Meteorological Influence</span>
          <span className="text-slate-300">{briefing.meteorologicalInfluence}</span>
        </div>
      </div>

      {/* Target Audience Advisory Tabs */}
      <div className="mb-4">
        <div className="flex space-x-1 border-b border-slate-800 pb-1 mb-2.5">
          <button
            onClick={() => setActiveTab('sensitive')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              activeTab === 'sensitive'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🫁 Sensitive Groups
          </button>
          <button
            onClick={() => setActiveTab('athletes')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              activeTab === 'athletes'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏃 Athletes
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👥 General Public
          </button>
        </div>

        <div className="bg-indigo-950/30 rounded-xl p-3 border border-indigo-500/20 text-xs text-indigo-100/90 leading-relaxed">
          {activeTab === 'sensitive' && briefing.healthAdvisories.sensitiveGroups}
          {activeTab === 'athletes' && briefing.healthAdvisories.outdoorAthletes}
          {activeTab === 'general' && briefing.healthAdvisories.generalPublic}
        </div>
      </div>

      {/* Actionable Recommendations & PPE Badge */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <span className="text-amber-400">🛡️ Recommended PPE:</span>
          <span className="font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {briefing.suggestedProtectiveGear || 'NONE'}
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          Updated {new Date(briefing.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
