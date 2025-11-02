import React, { useEffect, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { LocationData } from '../types';
import { BACKGROUND_IMG_URL, GLOBE_IMG_URL } from '../constants';

interface GlobeComponentProps {
  globeRef: React.RefObject<GlobeMethods>;
  locationData: LocationData | null;
  isSatelliteView: boolean;
  onGlobeClick: (coords: { lat: number; lng: number }) => void;
  onBackgroundClick: () => void;
}

const GlobeComponent: React.FC<GlobeComponentProps> = ({ globeRef, locationData, isSatelliteView, onGlobeClick, onBackgroundClick }) => {
    const [rings, setRings] = useState<object[]>([]);

    // Effect to control rings and camera based on location data
    useEffect(() => {
        if (locationData) {
            setRings([{
                lat: locationData.lat,
                lng: locationData.lng,
                maxR: 5,
                propagationSpeed: 3,
                ringColor: () => 'rgba(0, 255, 255, 0.6)',
            }]);

            // Stop auto-rotation to focus on the selected location
            if(globeRef.current) {
                globeRef.current.controls().autoRotate = false;
            }

            globeRef.current?.pointOfView({ lat: locationData.lat, lng: locationData.lng, altitude: 1.5 }, 1000);

        } else {
            setRings([]);
            // Resume auto-rotation when no location is selected
            if(globeRef.current) {
                globeRef.current.controls().autoRotate = true;
            }
        }
    }, [locationData, globeRef]);

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
            
            atmosphereColor="rgba(80, 200, 255, 0.4)"
            atmosphereAltitude={0.3}
        />
    );
};

export default GlobeComponent;