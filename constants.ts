
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