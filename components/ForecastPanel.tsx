import React, { useState, useEffect } from 'react';
import { ForecastResult, generateForecast } from '../services/predictionService';
import { TrainingProgress } from '../services/mlModelService';
import { generateSimpleForecast, SimpleForecastResult } from '../services/simplePredictionService';
import { isTensorFlowReady } from '../services/mlPreloader';
import { LocationData } from '../types';
import { CloseIcon } from './icons';
import { TrainingModal } from './TrainingModal';

interface ForecastPanelProps {
  data: LocationData;
  onClose: () => void;
}

const ForecastPanel: React.FC<ForecastPanelProps> = ({ data, onClose }) => {
  const [forecast, setForecast] = useState<ForecastResult | SimpleForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [useML, setUseML] = useState(() => isTensorFlowReady()); // Auto-enable if TF is ready

  useEffect(() => {
    const loadForecast = async () => {
      setLoading(true);
      try {
        if (useML) {
          // Use heavy ML model (TensorFlow.js LSTM)
          // Note: generateForecast already has internal fallback to simple forecast
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
          // Use lightweight statistical prediction (instant!)
          const result = generateSimpleForecast(data, days);
          setForecast(result);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Failed to load forecast:', errorMsg);
        
        // Show user-friendly error message
        setForecast({
          location: {
            city: data.city,
            country: data.country,
            lat: data.lat,
            lng: data.lng
          },
          currentAQI: data.aqi,
          predictions: [],
          modelInfo: {
            algorithm: 'Error',
            trainedOn: 'N/A',
            accuracy: 0,
            isRealML: false,
            dataSource: errorMsg.includes('No historical data') 
              ? 'No historical air quality data available for this location. Try a major city with monitoring stations.'
              : 'Unable to generate forecast. Please try again later.',
            trainingDays: 0
          },
          needsTraining: false
        });
        setIsTraining(false);
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
  }, [data, days, useML]);

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-900';
  };

  const getAQILabel = (aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy (Sensitive)';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') {
      return (
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      );
    }
    if (trend === 'worsening') {
      return (
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l5-5m0 0l-5-5m5 5H6" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-full max-w-md mx-4 sm:mx-0 bg-gray-800/50 text-white rounded-lg backdrop-blur-md border border-gray-600 shadow-2xl animate-fadeInLeft max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800/90 backdrop-blur-md z-10">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <span className="text-2xl mr-2">🔮</span>
            Air Quality Forecast
          </h2>
          <p className="text-sm text-gray-400">{data.city}, {data.country}</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Close forecast panel"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {loading && (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Generating forecast...</p>
        </div>
      )}

      {!loading && forecast && (
        <div className="p-4">
          {/* Current AQI */}
          <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current AQI</p>
                <p className="text-3xl font-bold">{forecast.currentAQI}</p>
                <p className="text-sm text-gray-300">{getAQILabel(forecast.currentAQI)}</p>
              </div>
              <div className={`w-16 h-16 ${getAQIColor(forecast.currentAQI)} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold">{forecast.currentAQI}</span>
              </div>
            </div>
          </div>

          {/* ML Toggle */}
          <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Prediction Mode</p>
                <p className="text-xs text-gray-400">
                  {useML ? '🧠 AI/ML Model (slower, more accurate)' : '⚡ Fast Statistical (instant)'}
                </p>
              </div>
              <button
                onClick={() => setUseML(!useML)}
                title={useML ? "Switch to Fast Mode" : "Switch to ML Mode"}
                aria-label={useML ? "Switch to Fast Mode" : "Switch to ML Mode"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useML ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useML ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Forecast Days Selector */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setDays(7)}
              className={`flex-1 py-2 px-3 rounded transition-colors ${
                days === 7 ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDays(14)}
              className={`flex-1 py-2 px-3 rounded transition-colors ${
                days === 14 ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`flex-1 py-2 px-3 rounded transition-colors ${
                days === 30 ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Predictions or Error Message */}
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">Daily Predictions</h3>
            
            {forecast.predictions.length === 0 ? (
              <div className="p-6 bg-yellow-900/20 border border-yellow-600/30 rounded-lg text-center">
                <span className="text-4xl mb-2 block">⚠️</span>
                <p className="text-yellow-200 font-semibold mb-2">No Data Available</p>
                <p className="text-sm text-gray-300 mb-3">
                  {forecast.modelInfo.dataSource}
                </p>
                <p className="text-xs text-gray-400">
                  Forecasts require historical air quality measurements from monitoring stations. 
                  Try searching for a major city with active air quality monitors.
                </p>
              </div>
            ) : (
              forecast.predictions.map((pred, index) => {
              const date = new Date(pred.date);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              
              return (
                <div 
                  key={pred.date} 
                  className={`p-3 rounded-lg ${
                    isWeekend ? 'bg-gray-700/50' : 'bg-gray-900/50'
                  } hover:bg-gray-700/70 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        {getTrendIcon(pred.trend)}
                      </div>
                      <p className="text-xs text-gray-400">
                        {pred.confidence}% confidence
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{pred.predictedAQI}</p>
                      <p className="text-xs text-gray-400">{getAQILabel(pred.predictedAQI)}</p>
                    </div>
                  </div>
                  
                  {/* AQI Bar */}
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-300 ${getAQIColor(pred.predictedAQI)}`}
                      aria-label={`AQI level ${pred.predictedAQI}`}
                      {...{style: { width: `${Math.min((pred.predictedAQI / 500) * 100, 100)}%` }}}
                    ></div>
                  </div>
                  
                  {/* Factors (show for first 3 days) */}
                  {index < 3 && pred.factors && pred.factors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1">Key factors:</p>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {pred.factors.slice(0, 2).map((factor, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-cyan-400 mr-1">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>

          {/* Model Info */}
          <div className={`${forecast.modelInfo.isRealML ? 'bg-green-900/20 border-green-700/50' : 'bg-blue-900/20 border-blue-700/50'} border rounded-lg p-3`}>
            <div className="flex items-start">
              <div className="text-2xl mr-2 flex-shrink-0">
                {forecast.modelInfo.isRealML ? '🧠' : 'ℹ️'}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${forecast.modelInfo.isRealML ? 'text-green-300' : 'text-blue-300'} mb-2 flex items-center gap-2`}>
                  {forecast.modelInfo.isRealML && (
                    <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">REAL ML</span>
                  )}
                  Model Information
                </p>
                <p className="text-xs text-gray-300 mb-1">
                  <strong>Algorithm:</strong> {forecast.modelInfo.algorithm}
                </p>
                <p className="text-xs text-gray-300 mb-1">
                  <strong>Training Data:</strong> {forecast.modelInfo.trainedOn}
                </p>
                {forecast.modelInfo.isRealML && (
                  <>
                    <p className="text-xs text-gray-300 mb-1">
                      <strong>Data Source:</strong> {forecast.modelInfo.dataSource}
                    </p>
                    <p className="text-xs text-gray-300 mb-1">
                      <strong>Training Days:</strong> {forecast.modelInfo.trainingDays} days
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-300">
                  <strong>Estimated Accuracy:</strong> {forecast.modelInfo.accuracy}%
                </p>
                {forecast.needsTraining && forecast.modelInfo.isRealML && (
                  <div className="mt-2 text-xs text-green-400 bg-green-900/30 rounded px-2 py-1">
                    ✨ Model was just trained for this location!
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-400 text-center">
            {forecast.modelInfo.isRealML ? (
              <>
                <p>🔮 Predictions powered by TensorFlow.js LSTM neural network</p>
                <p>Trained on real historical measurements from government stations</p>
              </>
            ) : (
              <>
                <p>Predictions are estimates based on historical patterns.</p>
                <p>Actual conditions may vary due to weather and local events.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Training Modal */}
      <TrainingModal
        isTraining={isTraining}
        progress={trainingProgress}
      />
    </div>
  );
};

export default ForecastPanel;
