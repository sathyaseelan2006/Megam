import React, { useEffect, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { LocationData } from '../types';
import { BACKGROUND_IMG_URL, GLOBE_IMG_URL } from '../constants';

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
  onGlobeClick: (coords: { lat: number; lng: number }) => void;
  onBackgroundClick: () => void;
}

const GlobeComponent: React.FC<GlobeComponentProps> = ({ globeRef, locationData, dangerZones, isSatelliteView, onGlobeClick, onBackgroundClick }) => {
    const [rings, setRings] = useState<object[]>([]);

    // Effect to control rings and camera based on location data
    useEffect(() => {
        const dangerRings = dangerZones.map((zone) => ({
            lat: zone.lat,
            lng: zone.lng,
            maxR: zone.aqi >= 250 ? 8 : 6,
            propagationSpeed: zone.aqi >= 250 ? 2.4 : 2,
            ringColor: () => zone.aqi >= 250
              ? 'rgba(255, 40, 40, 0.65)'
              : 'rgba(255, 90, 90, 0.5)'
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
            if(globeRef.current) {
                globeRef.current.controls().autoRotate = false;
            }

            globeRef.current?.pointOfView({ lat: locationData.lat, lng: locationData.lng, altitude: 1.5 }, 1000);

        } else {
            setRings(dangerRings);
            // Resume auto-rotation when no location is selected
            if(globeRef.current) {
                globeRef.current.controls().autoRotate = true;
            }
        }
    }, [locationData, globeRef, dangerZones]);

    // Effect to set up initial globe properties like auto-rotation
    useEffect(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.2; // Set a gentle spin speed
            controls.enableDamping = true; // Makes manual rotation feel smoother
        }
        // This effect runs once when the globe is initialized
    }, [globeRef]);
    
    return (
        <Globe
            ref={globeRef}
            globeImageUrl={GLOBE_IMG_URL}
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl={BACKGROUND_IMG_URL}
            
            onGlobeClick={onGlobeClick}
            onBackgroundClick={onBackgroundClick}

            ringsData={rings}
            ringMaxRadius="maxR"
            ringPropagationSpeed="propagationSpeed"
            ringColor="ringColor"

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
            
            atmosphereColor="rgba(80, 200, 255, 0.4)"
            atmosphereAltitude={0.3}
        />
    );
};

export default GlobeComponent;