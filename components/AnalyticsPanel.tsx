import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { collectHistoricalData, getCachedHistoricalData } from '../services/dataCollectionService';
import {
  analyzeMonthlyTrends,
  analyzeYearlyTrends,
  analyzePollutantTrends,
  analyzeWeeklyTrends,
  getQuickSummary,
  MonthlyAnalysis,
  YearlyAnalysis,
  PollutantTrend,
  WeeklyAnalysis
} from '../services/analyticsService';

interface AnalyticsPanelProps {
  data: LocationData;
  onClose: () => void;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ data, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly' | 'pollutants'>('weekly');
  
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalysis[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalysis[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyAnalysis[]>([]);
  const [pollutantTrends, setPollutantTrends] = useState<PollutantTrend[]>([]);
  const [quickSummary, setQuickSummary] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Loading...');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  useEffect(() => {
    loadAnalytics();
  }, [data.lat, data.lng]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    
    try {
      console.log('📊 Loading analytics for', data.city);
      setLoadingStatus('Checking cache...');
      setLoadingProgress(10);
      
      // Try to get cached data first
      let dataset = getCachedHistoricalData(data.lat, data.lng);
      
      // If no cache or insufficient cached data, fetch fresh data
      if (!dataset || dataset.data.length < 7) {
        console.log('📥 Fetching historical data for analytics (365 days)...');
        setLoadingStatus('📡 Connecting to OpenAQ API...');
        setLoadingProgress(20);
        
        // Simulate progress during fetch (OpenAQ can take 20-30 seconds)
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => Math.min(prev + 5, 60));
        }, 2000);
        
        dataset = await collectHistoricalData(
          data.lat,
          data.lng,
          365,
          data.city,
          data.country
        );
        
        clearInterval(progressInterval);
        setLoadingProgress(70);
        
        // Cache the newly fetched data
        if (dataset && dataset.data.length > 0) {
          const { cacheHistoricalData } = await import('../services/dataCollectionService');
          cacheHistoricalData(dataset);
        }
      }
      
      // Check if we have enough data after fetching
      if (!dataset || dataset.data.length === 0) {
        throw new Error('No historical data available for this location. Try a major city with monitoring stations.');
      }
      
      if (dataset.data.length < 7) {
        throw new Error(`Only ${dataset.data.length} days of data available. Need at least 7 days for meaningful analysis.`);
      }
      
      console.log(`✅ Loaded ${dataset.data.length} days of historical data (${dataset.completeness}% real, ${100 - dataset.completeness}% interpolated)`);
      
      // Show warning if completeness is low
      if (dataset.completeness < 30) {
        console.warn(`⚠️ Low data quality: only ${dataset.completeness}% real measurements`);
      }
      
      setLoadingStatus('📊 Analyzing trends...');
      setLoadingProgress(75);
      
      // Calculate weekly trends (last 7 days)
      const weekly = analyzeWeeklyTrends(dataset.data);
      setWeeklyData(weekly);
      setLoadingProgress(80);
      
      // Calculate monthly trends
      const monthly = analyzeMonthlyTrends(dataset.data);
      setMonthlyData(monthly);
      
      // Calculate yearly trends
      const yearly = analyzeYearlyTrends(dataset.data);
      setYearlyData(yearly);
      
      // Calculate pollutant trends (last 30 vs previous 30 days)
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);
      
      const last30Days = dataset.data.filter(d => d.timestamp > thirtyDaysAgo);
      const previous30Days = dataset.data.filter(d => d.timestamp > sixtyDaysAgo && d.timestamp <= thirtyDaysAgo);
      
      if (last30Days.length > 0 && previous30Days.length > 0) {
        const pollutants = analyzePollutantTrends(last30Days, previous30Days);
        setPollutantTrends(pollutants);
      }
      
      // Get quick summary
      setLoadingStatus('✅ Finalizing...');
      setLoadingProgress(95);
      const summary = getQuickSummary(dataset.data);
      setQuickSummary(summary);
      setLoadingProgress(100);
      
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'worsening' | 'up' | 'down') => {
    if (trend === 'improving' || trend === 'down') return '📉';
    if (trend === 'worsening' || trend === 'up') return '📈';
    return '➡️';
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'worsening' | 'up' | 'down') => {
    if (trend === 'improving' || trend === 'down') return 'text-green-400';
    if (trend === 'worsening' || trend === 'up') return 'text-red-400';
    return 'text-gray-400';
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-400';
    if (aqi <= 100) return 'text-yellow-400';
    if (aqi <= 150) return 'text-orange-400';
    if (aqi <= 200) return 'text-red-400';
    if (aqi <= 300) return 'text-purple-400';
    return 'text-fuchsia-400';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl z-30 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-cyan-500/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Air Quality Analytics</h2>
              <p className="text-sm text-gray-300">
                {data.city}, {data.country}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close analytics panel"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 text-center">{loadingStatus}</p>
            
            {/* Progress bar */}
            <div className="w-full max-w-md">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">{loadingProgress}% complete</p>
            </div>
            
            <p className="text-xs text-gray-500 text-center max-w-md">
              This may take 30-60 seconds as we fetch up to 365 days of historical data from multiple sources
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
            <p className="font-semibold mb-2">⚠️ Error</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* Data Quality Notice */}
            {monthlyData.length > 0 && (
              <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
                <p className="flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>
                    Showing analysis based on {monthlyData.reduce((sum, m) => sum + m.totalDays, 0)} days of historical data
                  </span>
                </p>
              </div>
            )}

            {/* Quick Summary */}
            {quickSummary && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20">
                  <p className="text-xs text-gray-400 mb-1">Last 7 Days</p>
                  <p className={`text-2xl font-bold ${getAQIColor(quickSummary.last7Days.avgAQI)}`}>
                    {quickSummary.last7Days.avgAQI}
                  </p>
                  <p className={`text-xs ${getTrendColor(quickSummary.last7Days.trend)}`}>
                    {getTrendIcon(quickSummary.last7Days.trend)} {quickSummary.last7Days.trend}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">PM2.5:</span>{' '}
                      <span className="text-white font-semibold">{quickSummary.last7Days.avgPM25}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">PM10:</span>{' '}
                      <span className="text-white font-semibold">{quickSummary.last7Days.avgPM10}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20">
                  <p className="text-xs text-gray-400 mb-1">Last 30 Days</p>
                  <p className={`text-2xl font-bold ${getAQIColor(quickSummary.last30Days.avgAQI)}`}>
                    {quickSummary.last30Days.avgAQI}
                  </p>
                  <p className={`text-xs ${getTrendColor(quickSummary.last30Days.trend)}`}>
                    {getTrendIcon(quickSummary.last30Days.trend)} {quickSummary.last30Days.trend}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">PM2.5:</span>{' '}
                      <span className="text-white font-semibold">{quickSummary.last30Days.avgPM25}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">PM10:</span>{' '}
                      <span className="text-white font-semibold">{quickSummary.last30Days.avgPM10}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20">
                  <p className="text-xs text-gray-400 mb-1">Last 12 Months</p>
                  <p className={`text-2xl font-bold ${getAQIColor(quickSummary.last12Months.avgAQI)}`}>
                    {quickSummary.last12Months.avgAQI}
                  </p>
                  <p className={`text-xs ${getTrendColor(quickSummary.last12Months.trend)}`}>
                    {getTrendIcon(quickSummary.last12Months.trend)} {quickSummary.last12Months.trend}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">PM2.5:</span>{' '}
                      <span className="text-white font-semibold">{quickSummary.last12Months.avgPM25}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">PM10:</span>{' '}
                      <span className="text-white font-semibold">{quickSummary.last12Months.avgPM10}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-green-500/20 col-span-1 md:col-span-1">
                  <p className="text-xs text-gray-400 mb-1">Best Time</p>
                  <p className="text-sm font-semibold text-green-400">{quickSummary.bestTime}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-red-500/20 col-span-1 md:col-span-1">
                  <p className="text-xs text-gray-400 mb-1">Worst Time</p>
                  <p className="text-sm font-semibold text-red-400">{quickSummary.worstTime}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-700 overflow-x-auto">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'weekly'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'monthly'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActiveTab('yearly')}
                className={`px-4 py-2 font-semibold transition-all ${
                  activeTab === 'yearly'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setActiveTab('pollutants')}
                className={`px-4 py-2 font-semibold transition-all ${
                  activeTab === 'pollutants'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Pollutants
              </button>
            </div>

            {/* Weekly Analysis */}
            {activeTab === 'weekly' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3">Last 7 Days Breakdown</h3>
                {weeklyData.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Not enough data for weekly analysis
                  </p>
                ) : (
                  <>
                    {/* Day-by-day bars */}
                    <div className="space-y-3">
                      {weeklyData.map((day, index) => (
                        <div key={day.date} className="bg-slate-800/30 rounded-lg p-4 border border-gray-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-white">{day.dayOfWeek}</h4>
                              <p className="text-xs text-gray-400">{day.date}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getAQIColor(day.avgAQI)}`}>
                                {day.avgAQI || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {day.avgAQI > 0 ? day.category : 'No data'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Visual bar */}
                          {day.avgAQI > 0 && (
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  day.avgAQI <= 50 ? 'bg-green-500' :
                                  day.avgAQI <= 100 ? 'bg-yellow-500' :
                                  day.avgAQI <= 150 ? 'bg-orange-500' :
                                  day.avgAQI <= 200 ? 'bg-red-500' :
                                  day.avgAQI <= 300 ? 'bg-purple-500' : 'bg-fuchsia-500'
                                }`}
                                style={{ width: `${Math.min((day.avgAQI / 300) * 100, 100)}%` }}
                              />
                            </div>
                          )}

                          {day.avgAQI > 0 && (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">PM2.5:</span>{' '}
                                <span className="text-white font-semibold">{day.avgPM25} µg/m³</span>
                              </div>
                              <div>
                                <span className="text-gray-400">PM10:</span>{' '}
                                <span className="text-white font-semibold">{day.avgPM10} µg/m³</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Source:</span>{' '}
                                <span className="text-white font-semibold capitalize">{day.source}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Weekly summary */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                      <p className="text-sm text-blue-200">
                        <span className="font-semibold">💡 Tip:</span> Best air quality days are shown in green. 
                        Plan outdoor activities accordingly!
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Monthly Analysis */}
            {activeTab === 'monthly' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3">Monthly Breakdown</h3>
                {monthlyData.map((month, index) => (
                  <div key={month.month} className="bg-slate-800/30 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{month.monthName}</h4>
                        <p className="text-xs text-gray-400">{month.totalDays} days of data</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getAQIColor(month.avgAQI)}`}>
                          {month.avgAQI}
                        </p>
                        {index > 0 && (
                          <p className={`text-xs ${getTrendColor(month.trend)}`}>
                            {getTrendIcon(month.trend)} {month.changePercent > 0 ? '+' : ''}{month.changePercent}%
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-green-500/20 rounded p-2 text-center">
                        <p className="text-green-400 font-semibold">{month.goodDays}</p>
                        <p className="text-gray-400">Good</p>
                      </div>
                      <div className="bg-yellow-500/20 rounded p-2 text-center">
                        <p className="text-yellow-400 font-semibold">{month.moderateDays}</p>
                        <p className="text-gray-400">Moderate</p>
                      </div>
                      <div className="bg-red-500/20 rounded p-2 text-center">
                        <p className="text-red-400 font-semibold">{month.unhealthyDays}</p>
                        <p className="text-gray-400">Unhealthy</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">PM2.5:</span>{' '}
                        <span className="text-white font-semibold">{month.avgPM25} µg/m³</span>
                      </div>
                      <div>
                        <span className="text-gray-400">PM10:</span>{' '}
                        <span className="text-white font-semibold">{month.avgPM10} µg/m³</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Min:</span>{' '}
                        <span className="text-green-400 font-semibold">{month.minAQI}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Max:</span>{' '}
                        <span className="text-red-400 font-semibold">{month.maxAQI}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Yearly Analysis */}
            {activeTab === 'yearly' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3">Yearly Overview</h3>
                {yearlyData.map((year) => (
                  <div key={year.year} className="bg-slate-800/30 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-white">{year.year}</h4>
                        <p className="text-xs text-gray-400">{year.totalDays} days of data</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${getAQIColor(year.avgAQI)}`}>
                          {year.avgAQI}
                        </p>
                        {year.yearOverYearChange !== undefined && (
                          <p className={`text-xs ${year.yearOverYearChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {year.yearOverYearChange > 0 ? '+' : ''}{year.yearOverYearChange}% vs prev year
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <div className="bg-green-500/20 rounded p-2 text-center">
                        <p className="text-green-400 font-semibold">{year.goodDays}</p>
                        <p className="text-gray-400">Good Days</p>
                      </div>
                      <div className="bg-yellow-500/20 rounded p-2 text-center">
                        <p className="text-yellow-400 font-semibold">{year.moderateDays}</p>
                        <p className="text-gray-400">Moderate Days</p>
                      </div>
                      <div className="bg-red-500/20 rounded p-2 text-center">
                        <p className="text-red-400 font-semibold">{year.unhealthyDays}</p>
                        <p className="text-gray-400">Unhealthy Days</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Overall Trend:</span>
                        <span className={getTrendColor(year.overallTrend)}>
                          {getTrendIcon(year.overallTrend)} {year.overallTrend}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Best Month:</span>
                        <span className="text-green-400 font-semibold">{year.bestMonth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Worst Month:</span>
                        <span className="text-red-400 font-semibold">{year.worstMonth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Range:</span>
                        <span className="text-white font-semibold">{year.minAQI} - {year.maxAQI}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pollutant Trends */}
            {activeTab === 'pollutants' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3">Pollutant Trends (Last 30 Days)</h3>
                {pollutantTrends.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Not enough data to calculate pollutant trends
                  </p>
                ) : (
                  pollutantTrends.map((pollutant) => (
                    <div key={pollutant.pollutant} className="bg-slate-800/30 rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white">{pollutant.pollutant}</h4>
                        <span className={`text-2xl ${getTrendColor(pollutant.trend)}`}>
                          {getTrendIcon(pollutant.trend)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Current Average</p>
                          <p className="text-lg font-bold text-white">
                            {pollutant.currentAvg} <span className="text-xs text-gray-400">{pollutant.unit}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Previous Average</p>
                          <p className="text-lg font-bold text-gray-300">
                            {pollutant.previousAvg} <span className="text-xs text-gray-400">{pollutant.unit}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className={`text-sm ${getTrendColor(pollutant.trend)}`}>
                          <span className="font-semibold">
                            {pollutant.changePercent > 0 ? '+' : ''}{pollutant.changePercent}%
                          </span>
                          {' '}change from previous 30 days
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
