// ============================================================================
// TRAINING MODAL - Shows ML Model Training Progress
// ============================================================================
// Displays real-time training metrics, progress bar, and ETA
// ============================================================================

import React from 'react';
import { TrainingProgress } from '../services/mlModelService';

interface TrainingModalProps {
  isTraining: boolean;
  progress: TrainingProgress | null;
  onCancel?: () => void;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  isTraining,
  progress,
  onCancel
}) => {
  if (!isTraining || !progress) return null;

  const progressPercent = (progress.epoch / progress.totalEpochs) * 100;
  const minutes = Math.floor(progress.estimatedTimeRemaining / 60);
  const seconds = Math.floor(progress.estimatedTimeRemaining % 60);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-3xl">🧠</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Training AI Model</h2>
          <p className="text-gray-600">Building neural network for accurate predictions...</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Epoch {progress.epoch} / {progress.totalEpochs}</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
              {...{ style: { width: `${progressPercent}%` } }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Training Loss */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
            <div className="text-xs font-medium text-red-600 mb-1">Training Loss</div>
            <div className="text-2xl font-bold text-red-700">
              {progress.loss.toFixed(4)}
            </div>
          </div>

          {/* Validation Loss */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
            <div className="text-xs font-medium text-orange-600 mb-1">Val Loss</div>
            <div className="text-2xl font-bold text-orange-700">
              {progress.valLoss.toFixed(4)}
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="text-xs font-medium text-green-600 mb-1">Accuracy</div>
            <div className="text-2xl font-bold text-green-700">
              {progress.accuracy.toFixed(1)}%
            </div>
          </div>

          {/* Time Remaining */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="text-xs font-medium text-blue-600 mb-1">Time Left</div>
            <div className="text-2xl font-bold text-blue-700">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Training Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1 text-sm text-blue-800">
              <strong>First-time training:</strong> The model is learning patterns from 180 days of real air quality data. This takes ~30-60 seconds but only happens once per location!
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2 text-center text-sm text-gray-600">
          {progress.epoch < 10 && (
            <p>🔄 Initializing neural network layers...</p>
          )}
          {progress.epoch >= 10 && progress.epoch < 30 && (
            <p>📊 Learning historical patterns...</p>
          )}
          {progress.epoch >= 30 && progress.epoch < 45 && (
            <p>🎯 Optimizing prediction accuracy...</p>
          )}
          {progress.epoch >= 45 && (
            <p>✨ Finalizing model weights...</p>
          )}
        </div>

        {/* Cancel Button (optional) */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel Training
          </button>
        )}

        {/* Background Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>
    </div>
  );
};
