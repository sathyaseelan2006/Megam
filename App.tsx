import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GlobeMethods } from 'react-globe.gl';
import SearchBar from './components/SearchBar';
import InfoPanel from './components/InfoPanel';
import GlobeToolbar from './components/GlobeToolbar';
import GlobeComponent from './components/GlobeComponent';
import EducationPanel from './components/EducationPanel';
import HistoryPanel from './components/HistoryPanel';
import ForecastPanel from './components/ForecastPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';
import { LocationData } from './types';
import { smartLocationSearch, reverseGeocode } from './services/geocodingService';
import { getComprehensiveAQIData } from './services/satelliteService';
import { historyService } from './services/historyService';
import { preloadTensorFlow } from './services/mlPreloader';

// Utility: Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function App() {
  const globeRef = useRef<GlobeMethods>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Smart ML preloading: only load when user shows interest
  useEffect(() => {
    // Preload when user interacts with location features
    const shouldPreload = locationData !== null || showForecast;
    
    if (shouldPreload) {
      preloadTensorFlow().catch(err => {
        console.log('ML features will use Fast Mode:', err);
      });
    }
  }, [locationData, showForecast]);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    setLocationData(null);
    try {
      // Get coordinates from geocoding service (no AI needed!)
      const locationInfo = await smartLocationSearch(query);
      
      // Get real-time satellite/ground station data
      const satelliteData = await getComprehensiveAQIData(
        locationInfo.lat,
        locationInfo.lng,
        locationInfo.city
      );
      
      // Merge location info with satellite data
      const finalData = {
        ...satelliteData,
        city: locationInfo.city,
        country: locationInfo.country,
      };
      
      setLocationData(finalData);
      console.log('✅ Using 100% real-time data (no AI estimates):', satelliteData.dataSource);
      
      // Add to history
      historyService.addToHistory({
        location: {
          city: finalData.city,
          country: finalData.country,
          lat: finalData.lat,
          lng: finalData.lng
        },
        aqi: finalData.aqi
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch air quality data.';
      setError(errorMessage);
      
      // Log helpful suggestions
      if (errorMessage.includes('within 100km')) {
        console.log('💡 Try searching for nearby major cities instead');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLocationData(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Get real-time satellite/ground station data
          const satelliteData = await getComprehensiveAQIData(latitude, longitude);
          
          setLocationData(satelliteData);
          console.log('✅ Using 100% real-time data for your location');
          
          // Add to history
          historyService.addToHistory({
            location: {
              city: satelliteData.city,
              country: satelliteData.country,
              lat: satelliteData.lat,
              lng: satelliteData.lng
            },
            aqi: satelliteData.aqi
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch air quality data for your location.');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setError(`Failed to get your location: ${err.message}`);
        setIsLoading(false);
      }
    );
  }, []);

  const handleGlobeClick = useCallback(async ({ lat, lng }: { lat: number; lng: number }) => {
    // Animate the globe camera to the clicked location for a smooth transition.
    globeRef.current?.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
    
    setIsLoading(true);
    setError(null);
    setLocationData(null);
    
    try {
      console.log(`🔍 Clicked at coordinates: ${lat.toFixed(3)}, ${lng.toFixed(3)}`);
      
      // STEP 1: Find out what location was clicked (reverse geocode)
      const locationInfo = await reverseGeocode(lat, lng);
      console.log(`📍 Identified location: ${locationInfo.city}, ${locationInfo.country}`);
      
      // STEP 2: Get air quality data for the clicked coordinates
      // NASA satellite will work anywhere, ground stations will enhance if available
      const satelliteData = await getComprehensiveAQIData(lat, lng);
      
      // STEP 3: Merge the geocoded location name with the air quality data
      const finalData = {
        ...satelliteData,
        city: locationInfo.city, // Use the reverse-geocoded city name
        country: locationInfo.country,
      };
      
      setLocationData(finalData);
      
      // Calculate distance from clicked point to data source (if different)
      const distance = calculateDistance(lat, lng, satelliteData.lat, satelliteData.lng);
      if (distance > 1) { // More than 1km away
        console.log(`📏 Showing data from nearest monitoring location (${distance.toFixed(1)}km away)`);
      }
      console.log(`✅ Data source: ${satelliteData.dataSource} (${satelliteData.confidence}% confidence)`);
      
      // Add to history
      historyService.addToHistory({
        location: {
          city: finalData.city,
          country: finalData.country,
          lat: satelliteData.lat, // Use the actual data location coordinates
          lng: satelliteData.lng,
        },
        aqi: finalData.aqi
      });
    } catch (err) {
      // If the exact location fails, try to find the nearest major city
      const errorMessage = err instanceof Error ? err.message : '';
      
      if (errorMessage.includes('remote location') || errorMessage.includes('no ground stations')) {
        console.log('⚠️ Remote location detected. Searching for nearest major city...');
        setError('No data at this exact location. Searching for nearest city...');
        
        try {
          // Try to search for nearby cities using the location name
          const locationInfo = await reverseGeocode(lat, lng);
          console.log(`🔍 Trying nearby city: ${locationInfo.city}`);
          
          // Search for the city by name (will find nearest monitoring station)
          if (locationInfo.city && locationInfo.city !== 'Unknown Location') {
            const cityData = await smartLocationSearch(locationInfo.city);
            const nearbyData = await getComprehensiveAQIData(cityData.lat, cityData.lng, cityData.city);
            
            const finalData = {
              ...nearbyData,
              city: cityData.city,
              country: cityData.country,
            };
            
            const distance = calculateDistance(lat, lng, cityData.lat, cityData.lng);
            console.log(`✅ Found data from ${cityData.city} (${distance.toFixed(1)}km away)`);
            
            setLocationData(finalData);
            setError(null); // Clear the searching message
            
            // Show info message
            setTimeout(() => {
              console.log(`ℹ️ Showing data for nearest city: ${cityData.city} (${distance.toFixed(0)}km from clicked location)`);
            }, 100);
            
            // Add to history
            historyService.addToHistory({
              location: {
                city: finalData.city,
                country: finalData.country,
                lat: nearbyData.lat,
                lng: nearbyData.lng,
              },
              aqi: finalData.aqi
            });
          } else {
            setError('This area is too remote. Try clicking on a major city or coastline.');
          }
        } catch (fallbackErr) {
          console.error('Fallback city search also failed:', fallbackErr);
          setError('Unable to find air quality data for this area. Try clicking on a major city.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'No air quality data available for this location.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePanelClose = useCallback(() => {
    setLocationData(null);
    setError(null);
  }, []);

  const handleHistoryLocationSelect = useCallback(async (lat: number, lng: number) => {
    setShowHistory(false);
    globeRef.current?.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
    
    setIsLoading(true);
    setError(null);
    setLocationData(null);
    try {
      // Get real-time satellite/ground station data
      const satelliteData = await getComprehensiveAQIData(lat, lng);
      setLocationData(satelliteData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch air quality data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleToggleSatelliteView = useCallback(() => {
    setIsSatelliteView(prev => !prev);
  }, []);
  
  const handleCenterGlobe = useCallback(() => {
    globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close panels
      if (e.key === 'Escape') {
        if (showEducation) setShowEducation(false);
        else if (showHistory) setShowHistory(false);
        else if (showAnalytics) setShowAnalytics(false);
        else if (locationData || error) handlePanelClose();
      }
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Ctrl/Cmd + E for education
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setShowEducation(!showEducation);
      }
      // Ctrl/Cmd + H for history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(!showHistory);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locationData, error, showEducation, showHistory, showAnalytics, handlePanelClose]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <GlobeComponent 
        globeRef={globeRef}
        locationData={locationData}
        isSatelliteView={isSatelliteView}
        onGlobeClick={handleGlobeClick}
        onBackgroundClick={handlePanelClose}
      />
      
      <div className="absolute inset-0 pointer-events-none">
        <div className='pointer-events-auto'>
          <SearchBar 
              onSearch={handleSearch}
              onMyLocation={handleMyLocation}
              loading={isLoading}
          />
        </div>
        
        {error && (
            <div className="absolute top-20 left-4 z-10 p-4 max-w-md bg-red-600/80 text-white rounded-lg backdrop-blur-md border border-red-400 pointer-events-auto">
                <p className='font-bold'>Error</p>
                <p>{error}</p>
            </div>
        )}

        <div className='pointer-events-auto'>
          <InfoPanel 
              data={locationData}
              onClose={handlePanelClose}
              loading={isLoading}
          />
        </div>

        <div className='pointer-events-auto'>
          <GlobeToolbar
            isSatelliteView={isSatelliteView}
            onToggleSatelliteView={handleToggleSatelliteView}
            onCenterGlobe={handleCenterGlobe}
            loading={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className='absolute bottom-12 right-4 z-10 flex space-x-2 pointer-events-auto'>
          <button
            onClick={() => locationData && setShowAnalytics(!showAnalytics)}
            disabled={!locationData}
            className={`p-3 rounded-full transition-all duration-300 backdrop-blur-md border ${
              showAnalytics 
                ? 'bg-blue-500/50 border-blue-400 text-white' 
                : locationData
                  ? 'bg-gray-700/60 hover:bg-blue-500/50 border-gray-600 text-gray-300'
                  : 'bg-gray-700/30 border-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            title={locationData ? "Monthly & Yearly Analysis" : "Select a location first"}
            aria-label="Toggle analytics panel"
          >
            <span className="text-2xl">📊</span>
          </button>
          <button
            onClick={() => locationData && setShowForecast(!showForecast)}
            disabled={!locationData}
            className={`p-3 rounded-full transition-all duration-300 backdrop-blur-md border ${
              showForecast 
                ? 'bg-purple-500/50 border-purple-400 text-white' 
                : locationData
                  ? 'bg-gray-700/60 hover:bg-purple-500/50 border-gray-600 text-gray-300'
                  : 'bg-gray-700/30 border-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            title={locationData ? "ML Forecast (7-30 days)" : "Select a location first"}
            aria-label="Toggle forecast panel"
          >
            <span className="text-2xl">🔮</span>
          </button>
          <button
            onClick={() => setShowEducation(!showEducation)}
            className={`p-3 rounded-full transition-all duration-300 backdrop-blur-md border ${
              showEducation 
                ? 'bg-cyan-500/50 border-cyan-400 text-white' 
                : 'bg-gray-700/60 hover:bg-cyan-500/50 border-gray-600 text-gray-300'
            }`}
            title="Educational content (Ctrl+E)"
            aria-label="Toggle education panel"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 rounded-full transition-all duration-300 backdrop-blur-md border ${
              showHistory 
                ? 'bg-cyan-500/50 border-cyan-400 text-white' 
                : 'bg-gray-700/60 hover:bg-cyan-500/50 border-gray-600 text-gray-300'
            }`}
            title="Search history (Ctrl+H)"
            aria-label="Toggle history panel"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </button>
        </div>

        {/* Education Panel */}
        {showEducation && (
          <div className='pointer-events-auto'>
            <EducationPanel 
              onClose={() => setShowEducation(false)}
            />
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className='pointer-events-auto'>
            <HistoryPanel 
              onClose={() => setShowHistory(false)}
              onLocationSelect={handleHistoryLocationSelect}
            />
          </div>
        )}

        {/* Analytics Panel */}
        {showAnalytics && locationData && (
          <div className='pointer-events-auto'>
            <AnalyticsPanel 
              data={locationData}
              onClose={() => setShowAnalytics(false)}
            />
          </div>
        )}

        {/* Forecast Panel */}
        {showForecast && locationData && (
          <div className='pointer-events-auto'>
            <ForecastPanel 
              data={locationData}
              onClose={() => setShowForecast(false)}
            />
          </div>
        )}

      </div>

      {/* Cookie Consent Banner */}
      <CookieConsent 
        onAccept={() => {
          console.log('✅ User accepted cookies - analytics enabled');
          // Initialize Google Analytics or other analytics here
          // Example: gtag('consent', 'update', { analytics_storage: 'granted' });
        }}
        onDecline={() => {
          console.log('❌ User declined cookies - essential only');
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;