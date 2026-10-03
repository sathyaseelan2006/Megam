import React, { useState } from 'react';
import { AtmosphericBriefing } from '../core/ai/types';

interface AIBriefingCardProps {
  briefing: AtmosphericBriefing | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

const Icon = ({ name, className = 'h-4 w-4' }: { name: 'spark' | 'refresh' | 'science' | 'wind' | 'lungs' | 'run' | 'people' | 'shield'; className?: string }) => {
  const paths: Record<typeof name, React.ReactNode> = {
    spark: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 9a7 7 0 0 1 12-2l2 2M4 15l2 2a7 7 0 0 0 12-2"/></>,
    science: <><path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3"/><path d="M8 15h8"/></>,
    wind: <><path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7a3 3 0 1 1-3 3"/></>,
    lungs: <><path d="M12 11V5M12 11c-2-4-3-5-4-4-2 2-3 6-3 9 0 3 2 4 4 3l3-2m0-6c2-4 3-5 4-4 2 2 3 6 3 9 0 3-2 4-4 3l-3-2"/></>,
    run: <><circle cx="14" cy="5" r="2"/><path d="m7 21 3-6 3-2 2 3 4 2M10 11l3-3 4 2 3-1M10 15l-4-1-3 3"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
  };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
};

export const AIBriefingCard: React.FC<AIBriefingCardProps> = ({ briefing, isLoading, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'sensitive' | 'athletes'>('sensitive');
  if (isLoading) return <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-xl animate-pulse"><div className="mb-5 h-5 w-48 rounded bg-slate-700"/><div className="mb-3 h-3 w-full rounded bg-slate-800"/><div className="h-20 rounded-xl bg-slate-800/70"/></div>;
  if (!briefing) return null;

  const statusColors: Record<string, string> = {
    OPTIMAL: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    MODERATE: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    CAUTION: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    HAZARDOUS: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  };
  const tabs = [
    { id: 'sensitive' as const, label: 'Sensitive groups', icon: 'lungs' as const },
    { id: 'athletes' as const, label: 'Outdoor activity', icon: 'run' as const },
    { id: 'general' as const, label: 'General public', icon: 'people' as const },
  ];

  return (
    <section aria-label="Air quality briefing" className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 text-slate-100 shadow-[0_18px_50px_rgba(2,6,23,0.35)] sm:p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-cyan-300"><Icon name="spark" className="h-5 w-5"/></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-semibold tracking-tight text-white sm:text-base">Air quality briefing</h3>
              <span className="rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">{briefing.model.includes('Gemini') ? 'Gemini 2.5' : 'Expert ML'}</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">Health guidance and atmospheric conditions</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${statusColors[briefing.airQualityStatus] || statusColors.MODERATE}`}>{briefing.airQualityStatus}</span>
          {onRefresh && <button type="button" onClick={onRefresh} title="Refresh briefing" aria-label="Refresh briefing" className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white"><Icon name="refresh"/></button>}
        </div>
      </header>

      <p className="mb-4 text-sm leading-6 text-slate-200">{briefing.executiveSummary}</p>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-3.5">
          <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-200"><Icon name="science" className="h-4 w-4 text-cyan-400"/>Likely source</h4>
          <p className="text-xs leading-5 text-slate-400">{briefing.rootCauseAnalysis}</p>
        </article>
        <article className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-3.5">
          <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-200"><Icon name="wind" className="h-4 w-4 text-cyan-400"/>Weather influence</h4>
          <p className="text-xs leading-5 text-slate-400">{briefing.meteorologicalInfluence}</p>
        </article>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-slate-700/80 bg-slate-950/60 p-1">
        {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition sm:text-xs ${activeTab === tab.id ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Icon name={tab.icon} className="h-4 w-4 shrink-0"/><span>{tab.label}</span></button>)}
      </div>
      <div className="rounded-xl border border-slate-700/80 bg-slate-800/50 px-3.5 py-3 text-xs leading-5 text-slate-300">
        {activeTab === 'sensitive' && briefing.healthAdvisories.sensitiveGroups}
        {activeTab === 'athletes' && briefing.healthAdvisories.outdoorAthletes}
        {activeTab === 'general' && briefing.healthAdvisories.generalPublic}
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/80 pt-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400"><Icon name="shield" className="h-4 w-4 text-cyan-400"/><span>Suggested protection</span><span className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 font-medium text-slate-200">{briefing.suggestedProtectiveGear || 'None'}</span></div>
        <span className="text-[11px] text-slate-500">Updated {new Date(briefing.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </footer>
    </section>
  );
};
