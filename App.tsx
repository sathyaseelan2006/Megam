import React, { lazy, Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { GlobeMethods } from 'react-globe.gl';
import { TopCommandBar } from './components/TopCommandBar';
import InfoPanel from './components/InfoPanel';
import GlobeComponent from './components/GlobeComponent';
import CookieConsent from './components/CookieConsent';
import { ExtremeHazardBanner } from './components/ExtremeHazardBanner';
import { ISSTelemetryCard } from './components/ISSTelemetryCard';
import { issTrackerService, ISSTelemetry } from './core/satellite/issTracker';
import Footer from './components/Footer';
import { LocationData } from './types';
import { smartLocationSearch, reverseGeocode } from './services/geocodingService';
import { getComprehensiveAQIData } from './services/satelliteService';
import { historyService } from './services/historyService';
import { GLOBAL_DANGER_ZONE_SEEDS } from './constants';

const EducationPanel = lazy(() => import('./components/EducationPanel'));
const HistoryPanel = lazy(() => import('./components/HistoryPanel'));
const ForecastPanel = lazy(() => import('./components/ForecastPanel'));
const AnalyticsPanel = lazy(() => import('./components/AnalyticsPanel'));

interface DangerZonePoint {
  lat: number;
  lng: number;
  place: string;
  aqi: number;
  reason: string;
}

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
  const [activePanel, setActivePanel] = useState<'education' | 'history' | 'forecast' | 'analytics' | null>(null);
  const showEducation = activePanel === 'education';
  const showHistory = activePanel === 'history';
  const showForecast = activePanel === 'forecast';
  const showAnalytics = activePanel === 'analytics';
  const [dangerZones, setDangerZones] = useState<DangerZonePoint[]>([]);
  const [closedDangerNoticeId, setClosedDangerNoticeId] = useState<string | null>(null);

  // ISS Real-time 3D Telemetry and Tracking State
  const [issTelemetry, setIssTelemetry] = useState<ISSTelemetry | null>(() => issTrackerService.getTelemetry());
  const [showISSCard, setShowISSCard] = useState(false);
  const [isISSTrackingCamera, setIsISSTrackingCamera] = useState(false);

  useEffect(() => {
    const unsubscribe = issTrackerService.subscribe((telemetry) => {
      setIssTelemetry(telemetry);
      if (isISSTrackingCamera && globeRef.current) {
        globeRef.current.pointOfView(
          { lat: telemetry.lat, lng: telemetry.lng, altitude: 0.8 },
          800
        );
      }
    });
    return unsubscribe;
  }, [isISSTrackingCamera]);

  const handleTrackISS = useCallback(() => {
    setShowISSCard(true);
    setIsISSTrackingCamera(true);
    if (issTelemetry) {
      globeRef.current?.pointOfView(
        { lat: issTelemetry.lat, lng: issTelemetry.lng, altitude: 0.8 },
        1200
      );
    }
  }, [issTelemetry]);

  const getLikelyReason = useCallback((data: LocationData): string => {
    const topPollutant = [...(data.pollutants || [])].sort((a, b) => b.concentration - a.concentration)[0];
    if (topPollutant) {
      return `High ${topPollutant.name} concentration`;
    }
    if (data.aqi >= 300) return 'Hazardous atmospheric conditions';
    if (data.aqi >= 200) return 'Very unhealthy air mass';
    if (data.aqi >= 150) return 'Unhealthy pollution episode';
    return 'Elevated pollution levels';
  }, []);

  const refreshDangerZones = useCallback((currentData: LocationData | null) => {
    const seededZones: DangerZonePoint[] = GLOBAL_DANGER_ZONE_SEEDS
      .filter((seed) => seed.aqi >= 120)
      .map((seed) => ({
        lat: seed.lat,
        lng: seed.lng,
        place: seed.place,
        aqi: seed.aqi,
        reason: seed.reason
      }));

    const highHistory = historyService
      .getHistory()
      .filter((h) => h.aqi >= 120)
      .slice(0, 8)
      .map((h) => ({
        lat: h.location.lat,
        lng: h.location.lng,
        place: `${h.location.city}, ${h.location.country}`,
        aqi: h.aqi,
        reason: h.aqi >= 200 ? 'Very unhealthy recorded event' : 'Unhealthy recorded event'
      }));

    const combined: DangerZonePoint[] = [...seededZones, ...highHistory];

    if (currentData && currentData.aqi >= 120) {
      combined.unshift({
        lat: currentData.lat,
        lng: currentData.lng,
        place: `${currentData.city}, ${currentData.country}`,
        aqi: currentData.aqi,
        reason: getLikelyReason(currentData)
      });
    }

    const deduped = combined.filter((zone, index, arr) =>
      arr.findIndex((z) => Math.abs(z.lat - zone.lat) < 0.05 && Math.abs(z.lng - zone.lng) < 0.05) === index
    );

    const prioritized = deduped.sort((a, b) => b.aqi - a.aqi);
    setDangerZones(prioritized.slice(0, 14));
  }, [getLikelyReason]);

  useEffect(() => {
    refreshDangerZones(locationData);
  }, [locationData, refreshDangerZones]);

  const topDangerZone = [...dangerZones].sort((a, b) => b.aqi - a.aqi)[0] || null;
  const topDangerZoneId = topDangerZone
    ? `${topDangerZone.lat.toFixed(2)}_${topDangerZone.lng.toFixed(2)}_${topDangerZone.aqi}`
    : null;
  const showDangerNotice = !!topDangerZone && topDangerZoneId !== closedDangerNoticeId;

  useEffect(() => {
    // Re-open the danger card automatically when a new top hotspot appears.
    if (topDangerZoneId && topDangerZoneId !== closedDangerNoticeId) {
      return;
    }
    if (!topDangerZoneId) {
      setClosedDangerNoticeId(null);
    }
  }, [topDangerZoneId, closedDangerNoticeId]);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
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
    setActivePanel(null);
    globeRef.current?.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
    
    setIsLoading(true);
    setError(null);
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
        if (activePanel) setActivePanel(null);
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
        setActivePanel((panel) => panel === 'education' ? null : 'education');
      }
      // Ctrl/Cmd + H for history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setActivePanel((panel) => panel === 'history' ? null : 'history');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locationData, error, activePanel, handlePanelClose]);

  const handleHazardFocus = useCallback((lat: number, lng: number) => {
    globeRef.current?.pointOfView({ lat, lng, altitude: 1.5 }, 1200);
    handleGlobeClick({ lat, lng });
  }, [handleGlobeClick]);

  return (
    <div className="relative w-screen h-[100dvh] min-h-[480px] bg-black overflow-hidden">
      <GlobeComponent 
        globeRef={globeRef}
        locationData={locationData}
        dangerZones={dangerZones}
        isSatelliteView={isSatelliteView}
        issTelemetry={issTelemetry || undefined}
        onSelectISS={handleTrackISS}
        onGlobeClick={handleGlobeClick}
        onBackgroundClick={handlePanelClose}
      />
      
      {/* Global Real-time Extreme Hazard Alert Banner */}
      <ExtremeHazardBanner onFocusLocation={handleHazardFocus} />

        {/* Unified Futuristic Top Command Bar */}
        <TopCommandBar 
          onSearch={handleSearch}
          onMyLocation={handleMyLocation}
          isSatelliteView={isSatelliteView}
          onToggleSatelliteView={handleToggleSatelliteView}
          onCenterGlobe={handleCenterGlobe}
          onTrackISS={handleTrackISS}
          isISSTracking={showISSCard}
          dangerZonesCount={dangerZones.length}
          onDangerZoneClick={() => {
            if (topDangerZone) {
              handleHazardFocus(topDangerZone.lat, topDangerZone.lng);
            }
          }}
          loading={isLoading}
          currentCity={locationData?.city}
          currentCountry={locationData?.country}
        />

        {/* ISS Mission Control Telemetry Card */}
        {showISSCard && issTelemetry && (
          <ISSTelemetryCard
            telemetry={issTelemetry}
            isTrackingCamera={isISSTrackingCamera}
            onToggleTrackingCamera={() => setIsISSTrackingCamera(!isISSTrackingCamera)}
            onClose={() => {
              setShowISSCard(false);
              setIsISSTrackingCamera(false);
            }}
          />
        )}
        
        {error && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 p-4 w-[90%] max-w-md bg-red-950/90 text-red-100 rounded-2xl backdrop-blur-2xl border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] pointer-events-auto flex items-center justify-between gap-3">
                <div>
                  <p className='font-mono text-xs font-bold uppercase tracking-wider text-red-400'>Telemetry Error</p>
                  <p className="text-xs text-red-200 mt-0.5">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="p-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-mono"
                >
                  ✕
                </button>
            </div>
        )}

        <div className='pointer-events-auto'>
        {!(showAnalytics || showForecast) && <InfoPanel
              data={locationData}
              onClose={handlePanelClose}
              loading={isLoading}
          />}
        </div>

        {topDangerZone && showDangerNotice && (
          <div className="fixed top-20 right-3 md:right-4 z-30 pointer-events-auto w-[calc(100%-1.5rem)] max-w-sm md:max-w-md">
            <div className="relative rounded-xl border border-red-400/40 bg-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className="px-3 py-2 bg-gradient-to-r from-red-600/40 to-pink-600/30 border-b border-red-400/30 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-widest text-red-200">DANGER ZONE ALERT</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-100/90">Live hotspot</span>
                  <button
                    onClick={() => setClosedDangerNoticeId(topDangerZoneId)}
                    className="w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 text-red-100 text-sm leading-none"
                    title="Close alert"
                    aria-label="Close danger notification"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="px-3 py-3 space-y-1">
                <p className="text-sm text-white font-semibold truncate">{topDangerZone.place}</p>
                <p className="text-sm text-red-300">
                  AQI <span className="font-bold text-red-200">{topDangerZone.aqi}</span>
                </p>
                <p className="text-xs text-gray-200/90">{topDangerZone.reason}</p>
              </div>
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-slate-900 border-r border-b border-red-400/40 rotate-45" />
            </div>
          </div>
        )}

        {/* Futuristic Cyber-HUD Command Dock */}
        <div className="fixed z-50 pointer-events-auto left-1/2 -translate-x-1/2 bottom-14 flex flex-row items-center gap-2 p-2 bg-slate-950/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl md:left-4 md:translate-x-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-3 md:p-2.5">
          {/* Cyber Status Indicator LED */}
          <div className="hidden md:flex flex-col items-center pb-1 border-b border-cyan-500/20 w-full mb-0.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="text-[8px] font-mono text-cyan-400/70 tracking-widest mt-1">HUD</span>
          </div>

          {/* Analytics Button */}
          <div className="relative group">
            <button
              onClick={() => locationData && setActivePanel((panel) => panel === 'analytics' ? null : 'analytics')}
              disabled={!locationData}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                showAnalytics 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-300 ring-2 ring-blue-400/40' 
                  : locationData
                    ? 'bg-slate-900/80 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-900/40 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              aria-label="Toggle analytics panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl hidden md:block z-50">
              {locationData ? "Deep Analytics" : "Select Location First"}
            </span>
          </div>

          {/* Forecast Button */}
          <div className="relative group">
            <button
              onClick={() => locationData && setActivePanel((panel) => panel === 'forecast' ? null : 'forecast')}
              disabled={!locationData}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                showForecast 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] border border-purple-300 ring-2 ring-purple-400/40' 
                  : locationData
                    ? 'bg-slate-900/80 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-900/40 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              aria-label="Toggle forecast panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl hidden md:block z-50">
              {locationData ? "AI Neural Forecast" : "Select Location First"}
            </span>
          </div>

          {/* Education Button */}
          <div className="relative group">
            <button
              onClick={() => setActivePanel((panel) => panel === 'education' ? null : 'education')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                showEducation 
                  ? 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-cyan-300 ring-2 ring-cyan-400/40' 
                  : 'bg-slate-900/80 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              }`}
              aria-label="Toggle education panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </button>
            {!showEducation && <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl hidden md:block z-[60]">
              Science Hub <span className="ml-1 text-slate-400">Ctrl+E</span>
            </span>}
          </div>

          {/* History Button */}
          <div className="relative group">
            <button
              onClick={() => setActivePanel((panel) => panel === 'history' ? null : 'history')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                showHistory 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)] border border-emerald-300 ring-2 ring-emerald-400/40' 
                  : 'bg-slate-900/80 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
              aria-label="Toggle history panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
            <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl hidden md:block z-50">
              Telemetry Log (Ctrl+H)
            </span>
          </div>
        </div>

        {/* Education Panel */}
        {showEducation && (
          <Suspense fallback={<div className="fixed inset-x-3 top-20 z-40 mx-auto max-w-sm rounded-lg border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm text-slate-300 shadow-xl">Loading panel…</div>}><div className='pointer-events-auto'>
            <EducationPanel 
              onClose={() => setActivePanel(null)}
            />
          </div></Suspense>
        )}

        {/* History Panel */}
        {showHistory && (
          <Suspense fallback={<div className="fixed inset-x-3 top-20 z-40 mx-auto max-w-sm rounded-lg border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm text-slate-300 shadow-xl">Loading panel…</div>}><div className='pointer-events-auto'>
            <HistoryPanel 
              onClose={() => setActivePanel(null)}
              onLocationSelect={handleHistoryLocationSelect}
            />
          </div></Suspense>
        )}

        {/* Analytics Panel */}
        {showAnalytics && locationData && (
          <Suspense fallback={<div className="fixed inset-x-3 top-20 z-40 mx-auto max-w-sm rounded-lg border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm text-slate-300 shadow-xl">Loading panel…</div>}><div className='pointer-events-auto'>
            <AnalyticsPanel 
              data={locationData}
              onClose={() => setActivePanel(null)}
            />
          </div></Suspense>
        )}

        {/* Forecast Panel */}
        {showForecast && locationData && (
          <Suspense fallback={<div className="fixed inset-x-3 top-20 z-40 mx-auto max-w-sm rounded-lg border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm text-slate-300 shadow-xl">Loading panel…</div>}><div className='pointer-events-auto'>
            <ForecastPanel 
              data={locationData}
              onClose={() => setActivePanel(null)}
            />
          </div></Suspense>
        )}

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
