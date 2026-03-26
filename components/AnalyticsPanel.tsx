import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { collectHistoricalData, getCachedHistoricalData } from '../services/dataCollectionService';
import type { HistoricalDataPoint } from '../services/dataCollectionService';
import { searchLocation } from '../services/geocodingService';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
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

interface ComparedLocation {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  data: HistoricalDataPoint[];
  completeness: number;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ data, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly' | 'pollutants'>('weekly');

  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [dataCompleteness, setDataCompleteness] = useState<number>(0);
  const [chartMetric, setChartMetric] = useState<'aqi' | 'pm25' | 'pm10'>('aqi');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'composed' | 'scatter'>('line');
  const [chartDays, setChartDays] = useState<30 | 90 | 365>(90);
  const [compareQuery, setCompareQuery] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareLocations, setCompareLocations] = useState<ComparedLocation[]>([]);
  const [compareSourceMode, setCompareSourceMode] = useState<'merged' | 'measured-only'>('merged');
  const [normalizeCompare, setNormalizeCompare] = useState(false);
  const [showExtendedBreakdown, setShowExtendedBreakdown] = useState(false);
  
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

      setHistoricalData(dataset.data);
      setDataCompleteness(dataset.completeness);
      
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

  const metricLabel = (metric: 'aqi' | 'pm25' | 'pm10') => {
    if (metric === 'pm25') return 'PM2.5 (µg/m³)';
    if (metric === 'pm10') return 'PM10 (µg/m³)';
    return 'AQI';
  };

  const metricColorClass = (metric: 'aqi' | 'pm25' | 'pm10') => {
    if (metric === 'pm25') return 'text-emerald-300';
    if (metric === 'pm10') return 'text-blue-300';
    return 'text-cyan-300';
  };

  const chartValue = (p: HistoricalDataPoint) => {
    if (chartMetric === 'aqi') return p.aqi;
    if (chartMetric === 'pm25') return p.pm25 > 0 ? p.pm25 : null;
    return p.pm10 > 0 ? p.pm10 : null;
  };

  const chartData = historicalData
    .slice(-chartDays)
    .map((p) => ({
      timestamp: p.timestamp,
      date: p.date,
      value: chartValue(p),
      source: p.source,
      confidence: p.confidence
    }));

  const comparePalette = ['#34d399', '#60a5fa', '#f59e0b'];

  const toMetricValue = (metric: 'aqi' | 'pm25' | 'pm10', p: HistoricalDataPoint) => {
    if (metric === 'aqi') return p.aqi;
    if (metric === 'pm25') return p.pm25 > 0 ? p.pm25 : null;
    return p.pm10 > 0 ? p.pm10 : null;
  };

  const applyCompareSourceMode = (points: HistoricalDataPoint[]) => {
    if (compareSourceMode === 'measured-only') {
      return points.filter((p) => p.source === 'openaq');
    }
    return points;
  };

  const normalizeSeries = (series: Array<{ date: string; value: number | null }>) => {
    if (!normalizeCompare) return series;

    const base = series.find((point) => point.value !== null && point.value > 0)?.value ?? null;
    if (!base) return series;

    return series.map((point) => ({
      ...point,
      value: point.value === null ? null : Math.round((point.value / base) * 1000) / 10
    }));
  };

  const buildCompareSeries = (points: HistoricalDataPoint[]) => {
    const selected = applyCompareSourceMode(points)
      .slice(-chartDays)
      .map((p) => ({ date: p.date, value: toMetricValue(chartMetric, p) }));

    return normalizeSeries(selected);
  };

  const compareChartData = (() => {
    const merged = new Map<string, Record<string, string | number | null>>();

    const pushPoint = (date: string, key: string, value: number | null) => {
      if (!merged.has(date)) {
        merged.set(date, { date });
      }
      merged.get(date)![key] = value;
    };

    buildCompareSeries(historicalData).forEach((p) => {
      pushPoint(p.date, 'primary', p.value);
    });

    compareLocations.forEach((loc) => {
      buildCompareSeries(loc.data).forEach((p) => {
        pushPoint(p.date, loc.id, p.value);
      });
    });

    return Array.from(merged.values()).sort((a, b) => {
      const da = String(a.date);
      const db = String(b.date);
      return da.localeCompare(db);
    });
  })();

  const compareMetricLabel = normalizeCompare ? 'Index (base=100)' : metricLabel(chartMetric);

  const pollutantBreakdownData = historicalData
    .slice(-chartDays)
    .map((p) => ({
      date: p.date,
      pm25: p.pm25 > 0 ? p.pm25 : 0,
      pm10: p.pm10 > 0 ? p.pm10 : 0,
      o3: p.o3 > 0 ? p.o3 : 0,
      no2: p.no2 > 0 ? p.no2 : 0
    }));

  const removeComparedLocation = (id: string) => {
    setCompareLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  const addComparedLocation = async () => {
    const query = compareQuery.trim();
    if (!query || compareLoading) return;

    if (compareLocations.length >= 3) {
      setCompareError('You can compare up to 3 additional locations.');
      return;
    }

    setCompareError(null);
    setCompareLoading(true);

    try {
      const found = await searchLocation(query);

      const isCurrent =
        Math.abs(found.lat - data.lat) < 0.02 && Math.abs(found.lng - data.lng) < 0.02;
      if (isCurrent) {
        throw new Error('This is the current location already shown on the chart.');
      }

      const duplicate = compareLocations.some(
        (loc) => Math.abs(loc.lat - found.lat) < 0.02 && Math.abs(loc.lng - found.lng) < 0.02
      );

      if (duplicate) {
        throw new Error('Location already added to compare mode.');
      }

      let dataset = getCachedHistoricalData(found.lat, found.lng);
      if (!dataset || dataset.data.length < 7) {
        dataset = await collectHistoricalData(found.lat, found.lng, 365, found.city, found.country);
      }

      if (!dataset || dataset.data.length < 7) {
        throw new Error(`Not enough history for ${found.city}.`);
      }

      const id = `cmp_${Date.now()}_${Math.round(found.lat * 1000)}_${Math.round(found.lng * 1000)}`;
      setCompareLocations((prev) => [
        ...prev,
        {
          id,
          city: found.city,
          country: found.country,
          lat: found.lat,
          lng: found.lng,
          data: dataset.data,
          completeness: dataset.completeness
        }
      ]);
      setCompareQuery('');
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : 'Could not add compared location.');
    } finally {
      setCompareLoading(false);
    }
  };

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0]?.payload;
    const value = payload[0]?.value;
    const displayLabel = item?.date ?? label;
    return (
      <div className="rounded-lg border border-gray-700 bg-slate-900/95 backdrop-blur px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-300 font-semibold">{displayLabel}</p>
        <p className="text-sm text-white">
          <span className="text-gray-400 mr-2">{metricLabel(chartMetric)}:</span>
          <span className="font-bold">{value ?? 'N/A'}</span>
        </p>
        {item?.source && (
          <p className="text-xs text-gray-400 mt-1">
            Source: <span className="capitalize text-gray-300">{item.source}</span> • Confidence: <span className="text-gray-300">{Math.round((item.confidence ?? 0) * 100)}%</span>
          </p>
        )}
      </div>
    );
  };

  const CompareTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="rounded-lg border border-gray-700 bg-slate-900/95 backdrop-blur px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-300 font-semibold">{label}</p>
        <p className="text-xs text-gray-400 mb-1">{compareMetricLabel}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value ?? 'N/A'}</span>
          </p>
        ))}
      </div>
    );
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
            <div className="mb-6 bg-slate-800/30 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">History chart</h3>
                  <p className="text-xs text-gray-400">
                    {chartDays} days • {metricLabel(chartMetric)} • {dataCompleteness}% real measurements
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={chartMetric}
                    onChange={(e) => setChartMetric(e.target.value as any)}
                    className="bg-slate-900/50 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1"
                    aria-label="Select chart metric"
                  >
                    <option value="aqi">AQI</option>
                    <option value="pm25">PM2.5</option>
                    <option value="pm10">PM10</option>
                  </select>

                  <select
                    value={chartDays}
                    onChange={(e) => setChartDays(parseInt(e.target.value, 10) as any)}
                    className="bg-slate-900/50 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1"
                    aria-label="Select chart time range"
                  >
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>365 days</option>
                  </select>
                </div>
              </div>

              {/* Chart type selector */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setChartType('line')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors border ${
                    chartType === 'line'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                      : 'bg-slate-900/40 text-gray-300 border-gray-700 hover:bg-slate-900/60'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors border ${
                    chartType === 'area'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                      : 'bg-slate-900/40 text-gray-300 border-gray-700 hover:bg-slate-900/60'
                  }`}
                >
                  Area
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors border ${
                    chartType === 'bar'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                      : 'bg-slate-900/40 text-gray-300 border-gray-700 hover:bg-slate-900/60'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('composed')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors border ${
                    chartType === 'composed'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                      : 'bg-slate-900/40 text-gray-300 border-gray-700 hover:bg-slate-900/60'
                  }`}
                >
                  Composed
                </button>
                <button
                  onClick={() => setChartType('scatter')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors border ${
                    chartType === 'scatter'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                      : 'bg-slate-900/40 text-gray-300 border-gray-700 hover:bg-slate-900/60'
                  }`}
                >
                  Scatter
                </button>
              </div>

              {/* Chart */}
              {chartData.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No historical points available.</div>
              ) : (
                <div className={`w-full h-[260px] ${metricColorClass(chartMetric)}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: 'currentColor' }} tickMargin={8} minTickGap={24} />
                        <YAxis tick={{ fill: 'currentColor' }} width={40} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="value" stroke="currentColor" strokeWidth={2} dot={false} connectNulls />
                      </LineChart>
                    ) : chartType === 'area' ? (
                      <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: 'currentColor' }} tickMargin={8} minTickGap={24} />
                        <YAxis tick={{ fill: 'currentColor' }} width={40} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="currentColor" fill="currentColor" fillOpacity={0.18} strokeWidth={2} connectNulls />
                      </AreaChart>
                    ) : chartType === 'bar' ? (
                      <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: 'currentColor' }} tickMargin={8} minTickGap={24} />
                        <YAxis tick={{ fill: 'currentColor' }} width={40} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" fill="currentColor" fillOpacity={0.7} />
                      </BarChart>
                    ) : chartType === 'composed' ? (
                      <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: 'currentColor' }} tickMargin={8} minTickGap={24} />
                        <YAxis tick={{ fill: 'currentColor' }} width={40} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" fill="currentColor" fillOpacity={0.25} />
                        <Line type="monotone" dataKey="value" stroke="currentColor" strokeWidth={2} dot={false} connectNulls />
                      </ComposedChart>
                    ) : (
                      <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis
                          dataKey="timestamp"
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          tick={{ fill: 'currentColor' }}
                          tickMargin={8}
                          minTickGap={24}
                          tickFormatter={(v) => {
                            const d = new Date(Number(v));
                            return Number.isFinite(d.getTime()) ? d.toISOString().slice(5, 10) : '';
                          }}
                        />
                        <YAxis tick={{ fill: 'currentColor' }} width={40} />
                        <Tooltip content={<ChartTooltip />} />
                        <Scatter data={chartData} fill="currentColor" fillOpacity={0.7} />
                      </ScatterChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                Values are daily averages. Gaps can occur when sources don’t report PM values.
              </p>
            </div>

            {/* Compare Mode */}
            <div className="mb-6 bg-slate-800/30 rounded-lg p-4 border border-emerald-500/20">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Compare mode</h3>
                  <p className="text-xs text-gray-400">
                    Overlay {compareMetricLabel} for {chartDays} days across locations.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-3">
                <label className="text-xs text-gray-300 flex items-center gap-2">
                  Source mode
                  <select
                    value={compareSourceMode}
                    onChange={(e) => setCompareSourceMode(e.target.value as 'merged' | 'measured-only')}
                    className="bg-slate-900/50 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1"
                  >
                    <option value="merged">Merged (all sources)</option>
                    <option value="measured-only">Measured only (OpenAQ)</option>
                  </select>
                </label>

                <label className="text-xs text-gray-300 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={normalizeCompare}
                    onChange={(e) => setNormalizeCompare(e.target.checked)}
                  />
                  Normalize to index 100
                </label>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={compareQuery}
                  onChange={(e) => setCompareQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addComparedLocation();
                    }
                  }}
                  placeholder="Add city to compare (e.g. Delhi, Tokyo)"
                  className="flex-1 bg-slate-900/50 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2"
                />
                <button
                  onClick={addComparedLocation}
                  disabled={compareLoading || compareLocations.length >= 3}
                  className="px-3 py-2 rounded text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 disabled:opacity-50"
                >
                  {compareLoading ? 'Adding...' : 'Add'}
                </button>
              </div>

              {compareError && <p className="text-xs text-red-300 mb-2">{compareError}</p>}

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 rounded text-xs border border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
                  {data.city}, {data.country} (current)
                </span>
                {compareLocations.map((loc, idx) => (
                  <button
                    key={loc.id}
                    onClick={() => removeComparedLocation(loc.id)}
                    className="px-2 py-1 rounded text-xs border bg-slate-900/40 text-gray-200"
                    style={{ borderColor: comparePalette[idx % comparePalette.length] }}
                    title="Remove location"
                  >
                    {loc.city}, {loc.country || 'Unknown'} • {loc.completeness}% real ✕
                  </button>
                ))}
              </div>

              <div className="w-full h-[260px] text-emerald-300">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'currentColor' }} tickMargin={8} minTickGap={24} />
                    <YAxis tick={{ fill: 'currentColor' }} width={40} />
                    <Tooltip content={<CompareTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="primary" name={`${data.city} (current)`} stroke="#22d3ee" strokeWidth={2.5} dot={false} connectNulls />
                    {compareLocations.map((loc, idx) => (
                      <Line
                        key={loc.id}
                        type="monotone"
                        dataKey={loc.id}
                        name={`${loc.city}${loc.country ? `, ${loc.country}` : ''}`}
                        stroke={comparePalette[idx % comparePalette.length]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pollutant Breakdown */}
            <div className="mb-6 bg-slate-800/30 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Pollutant breakdown</h3>
                  <p className="text-xs text-gray-400">
                    Stacked daily contribution for PM2.5 and PM10.
                  </p>
                </div>
                <label className="text-xs text-gray-300 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showExtendedBreakdown}
                    onChange={(e) => setShowExtendedBreakdown(e.target.checked)}
                  />
                  Include O₃ / NO₂
                </label>
              </div>

              <div className="w-full h-[260px] text-blue-300">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pollutantBreakdownData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'currentColor' }} tickMargin={8} minTickGap={24} />
                    <YAxis tick={{ fill: 'currentColor' }} width={40} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="pm25" stackId="pollutants" stroke="#34d399" fill="#34d399" fillOpacity={0.35} name="PM2.5" />
                    <Area type="monotone" dataKey="pm10" stackId="pollutants" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.35} name="PM10" />
                    {showExtendedBreakdown && (
                      <Area type="monotone" dataKey="o3" stackId="pollutants" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="O3" />
                    )}
                    {showExtendedBreakdown && (
                      <Area type="monotone" dataKey="no2" stackId="pollutants" stroke="#f472b6" fill="#f472b6" fillOpacity={0.3} name="NO2" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

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
