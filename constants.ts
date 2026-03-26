
import { AQILevel } from './types';

export const AQI_LEVELS: AQILevel[] = [
  { level: 'Good', range: [0, 50], className: 'bg-green-500/80 text-green-50', healthImpact: 'Air quality is considered satisfactory, and air pollution poses little or no risk.' },
  { level: 'Moderate', range: [51, 100], className: 'bg-yellow-400/80 text-yellow-900', healthImpact: 'Air quality is acceptable; however, there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.' },
  { level: 'Unhealthy for Sensitive Groups', range: [101, 150], className: 'bg-orange-500/80 text-orange-50', healthImpact: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.' },
  { level: 'Unhealthy', range: [151, 200], className: 'bg-red-600/80 text-red-50', healthImpact: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.' },
  { level: 'Very Unhealthy', range: [201, 300], className: 'bg-purple-600/80 text-purple-50', healthImpact: 'Health alert: everyone may experience more serious health effects.' },
  { level: 'Hazardous', range: [301, 500], className: 'bg-fuchsia-900/80 text-fuchsia-50', healthImpact: 'Health warnings of emergency conditions. The entire population is more likely to be affected.' },
];

export const GLOBE_IMG_URL = '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
export const BACKGROUND_IMG_URL = '//unpkg.com/three-globe/example/img/night-sky.png';

export interface GlobalDangerZoneSeed {
  place: string;
  lat: number;
  lng: number;
  aqi: number;
  reason: string;
}

// Curated global hotspot seeds for broad regional visibility.
// Values are representative snapshots and should be treated as informational, not real-time.
export const GLOBAL_DANGER_ZONE_SEEDS: GlobalDangerZoneSeed[] = [
  { place: 'Dhaka, Bangladesh', lat: 23.8103, lng: 90.4125, aqi: 299, reason: 'Vehicular + industrial emissions with winter inversion buildup' },
  { place: 'Delhi, India', lat: 28.6139, lng: 77.2090, aqi: 264, reason: 'Traffic, construction dust, biomass burning, inversion effects' },
  { place: 'Lahore, Pakistan', lat: 31.5204, lng: 74.3587, aqi: 228, reason: 'Transport emissions, crop burning, and seasonal smog episodes' },
  { place: 'Kolkata, India', lat: 22.5726, lng: 88.3639, aqi: 225, reason: 'Dense traffic, industrial plumes, and urban dust loading' },
  { place: 'Byrnihat, India', lat: 26.0148, lng: 91.8749, aqi: 210, reason: 'Rapid industrial expansion and particulate emissions' },
  { place: 'Bishkek, Kyrgyzstan', lat: 42.8746, lng: 74.5698, aqi: 213, reason: 'Winter heating emissions and stagnant air masses' },
  { place: 'Sarajevo, Bosnia & Herzegovina', lat: 43.8563, lng: 18.4131, aqi: 201, reason: 'Cold-season combustion emissions and valley inversion' },
  { place: 'Krakow, Poland', lat: 50.0647, lng: 19.9450, aqi: 195, reason: 'Residential heating and transport-related particulates' },
  { place: 'Medan, Indonesia', lat: 3.5952, lng: 98.6722, aqi: 194, reason: 'Urban traffic emissions and periodic biomass smoke transport' },
  { place: 'Warsaw, Poland', lat: 52.2297, lng: 21.0122, aqi: 180, reason: 'Transport + heating emissions under low-dispersion conditions' },
  { place: 'Kabul, Afghanistan', lat: 34.5553, lng: 69.2075, aqi: 175, reason: 'Road dust, fuel combustion, and urban basin trapping' }
];