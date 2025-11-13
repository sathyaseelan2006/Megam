import React, { useState, useEffect } from 'react';
import { isTensorFlowReady, waitForTensorFlow } from '../services/mlPreloader';

/**
 * Shows ML preload status in the UI
 */
export const MLStatusIndicator: React.FC = () => {
  const [isReady, setIsReady] = useState(isTensorFlowReady());
  const [isLoading, setIsLoading] = useState(!isTensorFlowReady());

  useEffect(() => {
    if (isReady) return;

    setIsLoading(true);
    waitForTensorFlow().then((ready) => {
      setIsReady(ready);
      setIsLoading(false);
    });
  }, [isReady]);

  if (isReady) {
    return (
      <div className="fixed bottom-20 left-4 z-10 px-3 py-1.5 bg-green-600/80 backdrop-blur-md rounded-full border border-green-400/50 text-white text-xs font-medium flex items-center gap-2 animate-fadeIn">
        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
        🧠 ML Ready
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-20 left-4 z-10 px-3 py-1.5 bg-blue-600/80 backdrop-blur-md rounded-full border border-blue-400/50 text-white text-xs font-medium flex items-center gap-2 animate-fadeIn">
        <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
        Loading ML...
      </div>
    );
  }

  return null;
};
