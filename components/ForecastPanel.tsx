import React, { useState, useEffect } from 'react';
import { ForecastResult, generateForecast } from '../services/predictionService';
import { TrainingProgress } from '../services/mlModelService';
import { generateSimpleForecast, SimpleForecastResult } from '../services/simplePredictionService';
import { LocationData } from '../types';
import { CloseIcon } from './icons';

interface ForecastPanelProps {
  data: LocationData;
  onClose: () => void;
}

const ForecastPanel: React.FC<ForecastPanelProps> = ({ data, onClose }) => {
  const [forecast, setForecast] = useState<ForecastResult | SimpleForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [useML, setUseML] = useState(true); // Default to off-thread ML Web Worker

  useEffect(() => {
    const loadForecast = async () => {
      setLoading(true);
      try {
        if (useML) {
          const result = await generateForecast(
            data.lat,
            data.lng,
            data,
            days,
            (progress: TrainingProgress) => {
              setIsTraining(true);
              setTrainingProgress(progress);
            }
          );
          setForecast(result);
          setIsTraining(false);
        } else {
          const result = generateSimpleForecast(data, days);
          setForecast(result);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Failed to load forecast:', errorMsg);

        setForecast({
          location: {
            city: data.city,
            country: data.country,
            lat: data.lat,
            lng: data.lng,
          },
          currentAQI: data.aqi,
          predictions: [],
          modelInfo: {
            algorithm: 'Error',
            trainedOn: 'N/A',
            accuracy: 0,
            isRealML: false,
            dataSource: 'Telemetry stream unavailable for this coordinate grid.',
            trainingDays: 0,
          },
          needsTraining: false,
        });
        setIsTraining(false);
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
  }, [data, days, useML]);

  const getAQIColorConfig = (aqi: number) => {
    if (aqi <= 50) return { bg: 'from-emerald-500 to-teal-400', text: 'text-emerald-300', glow: 'shadow-emerald-500/30', border: 'border-emerald-500/40' };
    if (aqi <= 100) return { bg: 'from-amber-400 to-yellow-500', text: 'text-yellow-300', glow: 'shadow-amber-500/30', border: 'border-amber-500/40' };
    if (aqi <= 150) return { bg: 'from-orange-500 to-amber-600', text: 'text-orange-300', glow: 'shadow-orange-500/30', border: 'border-orange-500/40' };
    if (aqi <= 200) return { bg: 'from-rose-500 to-red-600', text: 'text-rose-300', glow: 'shadow-rose-500/30', border: 'border-rose-500/40' };
    if (aqi <= 300) return { bg: 'from-purple-600 to-indigo-600', text: 'text-purple-300', glow: 'shadow-purple-500/30', border: 'border-purple-500/40' };
    return { bg: 'from-red-900 to-rose-950', text: 'text-red-400', glow: 'shadow-red-600/40', border: 'border-red-600/50' };
  };

  const getAQILabel = (aqi: number): string => {
    if (aqi <= 50) return 'Optimal';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy (Sensitive)';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous Alert';
  };

  const currentConfig = getAQIColorConfig(data.aqi);

  return (
    <aside
      aria-label="Air Quality Forecasting Console"
      className="fixed left-20 md:left-24 top-4 bottom-4 w-[calc(100vw-6rem)] max-w-lg z-40 bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.18)] flex flex-col overflow-hidden animate-fadeInLeft"
    >
      {/* Cyberpunk Ambient Neon Glow */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Futuristic HUD Header */}
      <div className="p-4 px-5 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300/30">
            <span className="text-xl">🔮</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold bg-gradient-to-r from-cyan-300 via-teal-200 to-white bg-clip-text text-transparent tracking-wide">
                NEURAL FORECAST
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[220px]">
              {data.city}, {data.country}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center hover:scale-105"
          aria-label="Close forecast panel"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scrollable HUD Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {/* Current State Hologram Card */}
        <div className="bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between relative overflow-hidden">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">Current Telemetry</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-white">{data.aqi}</span>
              <span className="text-xs text-slate-400 font-medium">US-AQI</span>
            </div>
            <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentConfig.border} ${currentConfig.text} bg-slate-900/80`}>
              {getAQILabel(data.aqi)}
            </span>
          </div>

          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentConfig.bg} flex items-center justify-center shadow-lg ${currentConfig.glow} border border-white/20`}>
            <span className="text-2xl font-mono font-black text-slate-950">{data.aqi}</span>
          </div>
        </div>

        {/* Prediction Mode & Engine Switcher */}
        <div className="p-3.5 bg-slate-900/70 border border-cyan-500/20 rounded-2xl backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-lg">⚡</span>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">
                {useML ? 'TensorFlow.js LSTM Engine' : 'Statistical Momentum Model'}
              </p>
              <p className="text-[10px] text-slate-400">
                {useML ? 'Off-Thread Web Worker • WebGL GPU' : 'Instant moving-average extrapolation'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setUseML(!useML)}
            title={useML ? "Switch to Fast Mode" : "Switch to Neural Engine"}
            aria-label={useML ? "Switch to Fast Mode" : "Switch to Neural Engine"}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 ${
              useML ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                useML ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Futuristic Time Horizon Matrix Selector */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d as 7 | 14 | 30)}
              className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all duration-300 ${
                days === d
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {d}D HORIZON
            </button>
          ))}
        </div>

        {/* Loading Spinner / Training Progress */}
        {loading && (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3 animate-pulse">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-cyan-300 tracking-wider">
              {isTraining ? `TRAINING LSTM (${trainingProgress?.epoch ?? 0}/20 EPOCHS)...` : 'COMPUTING TIME-SERIES PROJECTIONS...'}
            </p>
          </div>
        )}

        {/* Daily Predictions Stream */}
        {!loading && forecast && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>📊</span> Temporal Predictions
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">
                {forecast.predictions.length} Steps Projected
              </span>
            </div>

            {forecast.predictions.length === 0 ? (
              <div className="p-6 bg-amber-950/20 border border-amber-500/30 rounded-2xl text-center space-y-2">
                <span className="text-3xl">⚠️</span>
                <p className="text-xs font-bold text-amber-200">Historical Depth Insufficient</p>
                <p className="text-[11px] text-slate-300">{forecast.modelInfo.dataSource}</p>
              </div>
            ) : (
              forecast.predictions.map((pred, index) => {
                const date = new Date(pred.date);
                const aqiConfig = getAQIColorConfig(pred.predictedAQI);
                const percent = Math.min((pred.predictedAQI / 400) * 100, 100);

                return (
                  <div
                    key={pred.date}
                    className="p-3.5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/30 rounded-2xl transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {pred.confidence}% Conf.
                          </span>
                        </div>
                        <span className={`text-[10px] font-medium ${aqiConfig.text}`}>
                          {getAQILabel(pred.predictedAQI)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-mono font-black text-white">
                          {pred.predictedAQI}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">AQI</span>
                      </div>
                    </div>

                    {/* Futuristic Gradient Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${aqiConfig.bg} transition-all duration-500`}
                        style={{ width: `${Math.max(8, percent)}%` }}
                      />
                    </div>

                    {/* Factors Snippet for top days */}
                    {index < 2 && pred.factors && pred.factors.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/50 flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                        {pred.factors.slice(0, 2).map((factor, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300">
                            • {factor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Model Specs Terminal Footer */}
        {forecast && (
          <div className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-2xl text-[10px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">ARCHITECTURE:</span>
              <span className="text-cyan-400 truncate max-w-[200px]">{forecast.modelInfo.algorithm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TRAINED DATASET:</span>
              <span className="text-slate-300">{forecast.modelInfo.trainedOn}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ForecastPanel;
