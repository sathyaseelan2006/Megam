import React, { useState } from 'react';

const DataProvidersFooter: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const providers = [
    {
      name: 'WAQI',
      fullName: 'World Air Quality Index',
      description: 'Real-time air quality data from 130+ countries and 30,000+ monitoring stations',
      url: 'https://aqicn.org/',
      icon: '🌐',
      coverage: 'Global',
    },
    {
      name: 'OpenAQ',
      fullName: 'Open Air Quality',
      description: 'Open-source air quality data from 10,000+ government monitoring stations',
      url: 'https://openaq.org/',
      icon: '📡',
      coverage: '100+ countries',
    },
    {
      name: 'Nominatim',
      fullName: 'OpenStreetMap Nominatim',
      description: 'Free geocoding service for location searches powered by OpenStreetMap',
      url: 'https://nominatim.openstreetmap.org/',
      icon: '🗺️',
      coverage: 'Global',
    },
    {
      name: 'Sentinel-5P',
      fullName: 'Copernicus Sentinel-5P',
      description: 'European satellite mission monitoring atmospheric pollutants (NO₂, SO₂, O₃, CO)',
      url: 'https://sentinel.esa.int/web/sentinel/missions/sentinel-5p',
      icon: '🛰️',
      coverage: 'Global (Coming Soon)',
    },
    {
      name: 'NASA MODIS',
      fullName: 'NASA MODIS',
      description: 'Aerosol Optical Depth measurements from Terra and Aqua satellites',
      url: 'https://modis.gsfc.nasa.gov/',
      icon: '🛰️',
      coverage: 'Global (Coming Soon)',
    },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto">
      {/* Collapsed State - Minimal Bar */}
      {!isExpanded && (
        <div className="bg-gray-900/90 backdrop-blur-md border-t border-gray-700 px-4 py-2.5 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 font-medium">Powered by:</span>
              <div className="flex items-center space-x-2">
                {providers.slice(0, 3).map((provider) => (
                  <a
                    key={provider.name}
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center space-x-1"
                    title={provider.fullName}
                  >
                    <span>{provider.icon}</span>
                    <span className="hidden sm:inline">{provider.name}</span>
                  </a>
                ))}
                <span className="text-xs text-gray-500">& more</span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-gray-400 hover:text-cyan-400 transition-colors flex items-center space-x-1"
            >
              <span>View All Sources</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Expanded State - Full Details */}
      {isExpanded && (
        <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-700 shadow-2xl animate-slideUp max-h-[70vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Trusted Data Sources</h3>
                <p className="text-xs text-gray-400">
                  We combine multiple verified sources to provide the most accurate air quality information
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Collapse data providers"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {providers.map((provider) => (
                <a
                  key={provider.name}
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700 hover:border-cyan-500/50 rounded-lg p-3 transition-all duration-300 group"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl" role="img" aria-label={provider.name}>
                      {provider.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {provider.fullName}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {provider.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {provider.coverage}
                        </span>
                        <svg 
                          className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="border-t border-gray-800 pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verified Data Sources</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Transparent Attribution</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Global Coverage</span>
              </div>
            </div>

            {/* Footer Credits */}
            <div className="border-t border-gray-800 mt-4 pt-3 text-center">
              <p className="text-xs text-gray-500">
                Megam aggregates data from multiple trusted sources to provide comprehensive air quality insights. 
                {' '}
                <a href="https://github.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Learn more about our methodology
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataProvidersFooter;
