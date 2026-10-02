import React, { useEffect, useState, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { LocationData } from '../types';
import { BACKGROUND_IMG_URL, GLOBE_IMG_URL } from '../constants';
import { globalStreamlineEngine } from '../core/graphics/streamlineEngine';
import { AtmosphericPlumePath } from '../core/graphics/types';
import { ISSTelemetry, issTrackerService } from '../core/satellite/issTracker';
import { issModelEngine } from '../core/graphics/issModelLoader';

interface DangerZonePoint {
  lat: number;
  lng: number;
  place: string;
  aqi: number;
  reason: string;
}

interface GlobeComponentProps {
  globeRef: React.RefObject<GlobeMethods>;
  locationData: LocationData | null;
  dangerZones: DangerZonePoint[];
  isSatelliteView: boolean;
  issTelemetry?: ISSTelemetry;
  onSelectISS?: () => void;
  onGlobeClick: (coords: { lat: number; lng: number }) => void;
  onBackgroundClick: () => void;
}

const GlobeComponent: React.FC<GlobeComponentProps> = ({
  globeRef,
  locationData,
  dangerZones,
  isSatelliteView,
  issTelemetry,
  onSelectISS,
  onGlobeClick,
  onBackgroundClick,
}) => {
  const [rings, setRings] = useState<object[]>([]);

  // Base global atmospheric transport corridors
  const globalCorridors = useMemo(() => {
    return globalStreamlineEngine.getGlobalStreamlines().plumes;
  }, []);

  // Compute active arcs: global corridors + localized dispersion vector + ISS predicted orbit track
  const activeArcs = useMemo<AtmosphericPlumePath[]>(() => {
    const list: AtmosphericPlumePath[] = [...globalCorridors];

    if (locationData) {
      const localArc = globalStreamlineEngine.generateLocalDispersionArc(
        locationData.lat,
        locationData.lng,
        locationData.aqi,
        locationData.weather
          ? {
              speed: locationData.weather.windSpeed,
              windDirection: locationData.weather.windDirection,
            }
          : undefined
      );
      list.unshift(localArc);
    }

    // Add ISS predicted orbit path arc segments
    if (issTelemetry) {
      const orbitPoints = issTrackerService.getPredictedOrbitPath(36);
      for (let i = 0; i < orbitPoints.length - 1; i++) {
        list.push({
          id: `iss-orbit-seg-${i}`,
          startLat: orbitPoints[i].lat,
          startLng: orbitPoints[i].lng,
          endLat: orbitPoints[i + 1].lat,
          endLng: orbitPoints[i + 1].lng,
          color: 'rgba(56, 189, 248, 0.7)',
          altitude: 0.16,
          dashAnimateTime: 2500,
          name: 'ISS Orbital Trajectory',
          category: 'ISS_ORBIT_PATH',
          aqi: 0,
        });
      }
    }

    return list;
  }, [locationData, globalCorridors, issTelemetry]);

  // ISS 3D Custom Layer Object
  const issObjects = useMemo(() => {
    if (!issTelemetry) return [];
    return [
      {
        lat: issTelemetry.lat,
        lng: issTelemetry.lng,
        altitude: 0.16, // Relative LEO orbital altitude
        name: 'International Space Station (ISS)',
        speed: issTelemetry.velocity,
      }
    ];
  }, [issTelemetry]);

  // Effect to control rings and camera based on location data
  useEffect(() => {
    const dangerRings = dangerZones.map((zone) => ({
      lat: zone.lat,
      lng: zone.lng,
      maxR: zone.aqi >= 250 ? 8 : 6,
      propagationSpeed: zone.aqi >= 250 ? 2.4 : 2,
      ringColor: () =>
        zone.aqi >= 250 ? 'rgba(255, 40, 40, 0.65)' : 'rgba(255, 90, 90, 0.5)',
    }));

    if (locationData) {
      const focusRing = {
        lat: locationData.lat,
        lng: locationData.lng,
        maxR: 5,
        propagationSpeed: 3,
        ringColor: () => 'rgba(0, 255, 255, 0.6)',
      };

      setRings([focusRing, ...dangerRings]);

      // Stop auto-rotation to focus on the selected location
      if (globeRef.current) {
        globeRef.current.controls().autoRotate = false;
      }

      globeRef.current?.pointOfView(
        { lat: locationData.lat, lng: locationData.lng, altitude: 1.5 },
        1000
      );
    } else {
      setRings(dangerRings);
      // Resume auto-rotation when no location is selected
      if (globeRef.current) {
        globeRef.current.controls().autoRotate = true;
      }
    }
  }, [locationData, globeRef, dangerZones]);

  // Effect to set up initial globe properties
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.2;
      controls.enableDamping = true;
    }
  }, [globeRef]);

  return (
    <Globe
      ref={globeRef}
      globeImageUrl={GLOBE_IMG_URL}
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundImageUrl={BACKGROUND_IMG_URL}
      onGlobeClick={onGlobeClick}
      onBackgroundClick={onBackgroundClick}
      // Pulsing Danger and Focus Rings
      ringsData={rings}
      ringMaxRadius="maxR"
      ringPropagationSpeed="propagationSpeed"
      ringColor="ringColor"
      // Danger Hotspot Points
      pointsData={dangerZones}
      pointLat="lat"
      pointLng="lng"
      pointAltitude={(d: object) => {
        const zone = d as DangerZonePoint;
        return zone.aqi >= 250 ? 0.03 : 0.02;
      }}
      pointRadius={(d: object) => {
        const zone = d as DangerZonePoint;
        return zone.aqi >= 250 ? 0.35 : 0.26;
      }}
      pointColor={(d: object) => {
        const zone = d as DangerZonePoint;
        return zone.aqi >= 250 ? '#ff2e2e' : '#ff6b6b';
      }}
      // Dynamic Atmospheric Streamlines & ISS Orbit Track
      arcsData={activeArcs}
      arcStartLat="startLat"
      arcStartLng="startLng"
      arcEndLat="endLat"
      arcEndLng="endLng"
      arcColor="color"
      arcAltitude="altitude"
      arcStroke={0.55}
      arcDashLength={0.35}
      arcDashGap={0.15}
      arcDashAnimateTime="dashAnimateTime"
      arcLabel={(d: object) => {
        const p = d as AtmosphericPlumePath;
        if (p.name.includes('ISS')) {
          return `<div class="bg-slate-900/90 text-amber-200 text-xs px-2.5 py-1 rounded-lg border border-amber-500/40 shadow-xl font-mono">🛰️ ${p.name}</div>`;
        }
        return `<div class="bg-slate-900/90 text-white text-xs px-2.5 py-1 rounded-lg border border-slate-700 shadow-lg font-mono">💨 ${p.name} <span class="font-bold text-amber-300">(AQI ${p.aqi})</span></div>`;
      }}
      // ISS 3D Custom Objects Layer
      objectsData={issObjects}
      objectLat="lat"
      objectLng="lng"
      objectAltitude="altitude"
      objectThreeObject={() => issModelEngine.getStationObject()}
      onObjectClick={() => {
        if (onSelectISS) {
          onSelectISS();
        }
      }}
      objectLabel={() => {
        return `<div class="bg-slate-950/90 text-cyan-200 text-xs px-3 py-1.5 rounded-xl border border-cyan-400 shadow-2xl font-mono flex items-center gap-2">
          <span>🛰️</span>
          <span><strong>International Space Station</strong> (Click to Track)</span>
        </div>`;
      }}
      atmosphereColor="rgba(80, 200, 255, 0.4)"
      atmosphereAltitude={0.3}
    />
  );
};

export default GlobeComponent;