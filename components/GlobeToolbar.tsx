
import React from 'react';
import { SatelliteIcon, GlobeIcon } from './icons';

interface GlobeToolbarProps {
  isSatelliteView: boolean;
  onToggleSatelliteView: () => void;
  onCenterGlobe: () => void;
  loading: boolean;
}

const ToolbarButton: React.FC<{onClick: () => void, disabled: boolean, isActive: boolean, title: string, children: React.ReactNode}> = 
({ onClick, disabled, isActive, title, children }) => {
  const baseClasses = "p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center backdrop-blur-md border";
  const activeClasses = "bg-cyan-500/50 border-cyan-400 text-white";
  const inactiveClasses = "bg-gray-700/60 hover:bg-cyan-500/50 border-gray-600 text-gray-300";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      title={title}
    >
      {children}
    </button>
  );
};


const GlobeToolbar: React.FC<GlobeToolbarProps> = ({ isSatelliteView, onToggleSatelliteView, onCenterGlobe, loading }) => {
  return (
    <div className="absolute bottom-16 left-4 z-10 flex space-x-2 animate-fadeIn mx-4 sm:mx-0" style={{ animationDelay: '0.4s' }}>
      <ToolbarButton
        onClick={onToggleSatelliteView}
        disabled={loading}
        isActive={isSatelliteView}
        title={isSatelliteView ? "Hide Satellite Pollution Data" : "Show Satellite Pollution Data"}
      >
        <SatelliteIcon className="w-6 h-6" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onCenterGlobe}
        disabled={loading}
        isActive={false}
        title="Recenter Globe"
      >
        <GlobeIcon className="w-6 h-6" aria-hidden="true" />
      </ToolbarButton>
    </div>
  );
};

export default GlobeToolbar;