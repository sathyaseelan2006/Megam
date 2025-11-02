// Educational content about air pollutants and their impacts

export interface PollutantInfo {
  symbol: string;
  name: string;
  fullName: string;
  description: string;
  sources: string[];
  healthImpacts: {
    shortTerm: string[];
    longTerm: string[];
  };
  environmentalImpacts: string[];
  safeLevel: string;
  color: string;
  icon: string;
}

export const POLLUTANT_ENCYCLOPEDIA: Record<string, PollutantInfo> = {
  'PM2.5': {
    symbol: 'PM2.5',
    name: 'Fine Particulate Matter',
    fullName: 'Particulate Matter 2.5 micrometers or smaller',
    description: 'Microscopic particles or droplets in the air that are 2.5 micrometers or smaller in diameter. These particles are so small they can penetrate deep into the lungs and even enter the bloodstream.',
    sources: [
      'Vehicle emissions (especially diesel)',
      'Industrial combustion processes',
      'Wildfires and biomass burning',
      'Cooking with solid fuels',
      'Construction activities',
      'Power plant emissions'
    ],
    healthImpacts: {
      shortTerm: [
        'Eye, nose, and throat irritation',
        'Coughing and difficulty breathing',
        'Aggravated asthma symptoms',
        'Increased respiratory infections',
        'Reduced lung function'
      ],
      longTerm: [
        'Chronic respiratory diseases (bronchitis, COPD)',
        'Cardiovascular disease and heart attacks',
        'Reduced lung development in children',
        'Lung cancer',
        'Premature death',
        'Cognitive decline and dementia'
      ]
    },
    environmentalImpacts: [
      'Reduced visibility (haze)',
      'Damages vegetation and crops',
      'Acidifies water bodies',
      'Contributes to climate change',
      'Deteriorates building materials'
    ],
    safeLevel: '0-12 μg/m³ (WHO guideline)',
    color: '#8b5cf6',
    icon: '🔬'
  },
  
  'PM10': {
    symbol: 'PM10',
    name: 'Coarse Particulate Matter',
    fullName: 'Particulate Matter 10 micrometers or smaller',
    description: 'Inhalable particles with diameters of 10 micrometers or smaller. These particles can be inhaled into the nose and throat, causing respiratory issues.',
    sources: [
      'Dust from roads and construction',
      'Agricultural activities',
      'Mining operations',
      'Industrial processes',
      'Crushing and grinding operations',
      'Wind-blown dust'
    ],
    healthImpacts: {
      shortTerm: [
        'Respiratory irritation',
        'Coughing and sneezing',
        'Asthma attacks',
        'Increased hospitalizations'
      ],
      longTerm: [
        'Chronic bronchitis',
        'Reduced lung function',
        'Premature mortality',
        'Cardiovascular problems'
      ]
    },
    environmentalImpacts: [
      'Reduced visibility',
      'Damages ecosystems',
      'Affects plant growth',
      'Soil contamination'
    ],
    safeLevel: '0-15 μg/m³ (WHO guideline)',
    color: '#a855f7',
    icon: '💨'
  },

  'O3': {
    symbol: 'O₃',
    name: 'Ground-Level Ozone',
    fullName: 'Tropospheric Ozone',
    description: 'A highly reactive gas formed when nitrogen oxides and volatile organic compounds react in sunlight. Unlike the protective ozone layer high in the atmosphere, ground-level ozone is a harmful pollutant.',
    sources: [
      'Vehicle exhaust (NOx + VOCs + sunlight)',
      'Industrial emissions',
      'Chemical solvents',
      'Gasoline vapors',
      'Power plant emissions',
      'Natural sources (lightning, wildfires)'
    ],
    healthImpacts: {
      shortTerm: [
        'Chest pain and throat irritation',
        'Coughing and breathing difficulty',
        'Reduced lung function',
        'Aggravated asthma',
        'Increased susceptibility to respiratory infections'
      ],
      longTerm: [
        'Permanent lung damage',
        'Worsened chronic respiratory diseases',
        'Accelerated aging of lung tissue',
        'Premature death'
      ]
    },
    environmentalImpacts: [
      'Damages crops and forests (reduces yields by 10-30%)',
      'Harms vegetation and ecosystems',
      'Contributes to greenhouse effect',
      'Accelerates rubber and material deterioration'
    ],
    safeLevel: '0-100 μg/m³ (WHO guideline)',
    color: '#3b82f6',
    icon: '☀️'
  },

  'NO2': {
    symbol: 'NO₂',
    name: 'Nitrogen Dioxide',
    fullName: 'Nitrogen Dioxide',
    description: 'A reddish-brown gas with a sharp, biting odor. It forms from combustion at high temperatures and is a precursor to ozone and acid rain.',
    sources: [
      'Vehicle emissions (major source)',
      'Power plants',
      'Industrial processes',
      'Home heating systems',
      'Cooking stoves',
      'Cigarette smoke'
    ],
    healthImpacts: {
      shortTerm: [
        'Airway inflammation',
        'Reduced immunity to lung infections',
        'Aggravated asthma symptoms',
        'Coughing and wheezing',
        'Increased emergency room visits'
      ],
      longTerm: [
        'Development of asthma in children',
        'Reduced lung development',
        'Chronic respiratory diseases',
        'Increased mortality risk'
      ]
    },
    environmentalImpacts: [
      'Forms acid rain (damages ecosystems)',
      'Contributes to ozone formation',
      'Causes eutrophication of water bodies',
      'Damages vegetation',
      'Corrodes metals and buildings'
    ],
    safeLevel: '0-25 μg/m³ (WHO guideline)',
    color: '#ef4444',
    icon: '🚗'
  },

  'SO2': {
    symbol: 'SO₂',
    name: 'Sulfur Dioxide',
    fullName: 'Sulfur Dioxide',
    description: 'A colorless gas with a pungent, suffocating smell. It is produced from burning fossil fuels containing sulfur and is a major precursor to acid rain.',
    sources: [
      'Coal-fired power plants',
      'Oil refineries',
      'Industrial processes (metal smelting)',
      'Diesel engines',
      'Volcanic eruptions',
      'Ships and locomotives'
    ],
    healthImpacts: {
      shortTerm: [
        'Respiratory irritation',
        'Breathing difficulty',
        'Asthma attacks',
        'Bronchial constriction',
        'Increased respiratory symptoms'
      ],
      longTerm: [
        'Chronic bronchitis',
        'Cardiovascular disease',
        'Premature mortality',
        'Increased respiratory infections'
      ]
    },
    environmentalImpacts: [
      'Primary cause of acid rain',
      'Damages forests and crops',
      'Acidifies lakes and streams (kills fish)',
      'Corrodes buildings and monuments',
      'Reduces visibility'
    ],
    safeLevel: '0-40 μg/m³ (WHO guideline)',
    color: '#f59e0b',
    icon: '🏭'
  },

  'CO': {
    symbol: 'CO',
    name: 'Carbon Monoxide',
    fullName: 'Carbon Monoxide',
    description: 'A colorless, odorless, and tasteless gas produced by incomplete combustion. It is extremely dangerous as it reduces oxygen delivery to the body\'s organs and tissues.',
    sources: [
      'Vehicle exhaust (major source)',
      'Malfunctioning furnaces and heaters',
      'Tobacco smoke',
      'Wood-burning stoves',
      'Industrial processes',
      'Wildfires'
    ],
    healthImpacts: {
      shortTerm: [
        'Headaches and dizziness',
        'Nausea and vomiting',
        'Confusion and disorientation',
        'Reduced cognitive function',
        'Chest pain in heart disease patients',
        'Fatal at high concentrations'
      ],
      longTerm: [
        'Cardiovascular damage',
        'Neurological effects',
        'Vision problems',
        'Increased mortality risk'
      ]
    },
    environmentalImpacts: [
      'Contributes to ground-level ozone formation',
      'Affects global carbon cycle',
      'Indirect greenhouse gas effect'
    ],
    safeLevel: '0-4 mg/m³ (WHO guideline)',
    color: '#6b7280',
    icon: '⚠️'
  },

  'VOCs': {
    symbol: 'VOCs',
    name: 'Volatile Organic Compounds',
    fullName: 'Volatile Organic Compounds',
    description: 'A diverse group of carbon-containing gases that easily evaporate at room temperature. They include benzene, formaldehyde, toluene, and many others.',
    sources: [
      'Paints and solvents',
      'Cleaning products',
      'Gasoline and fuels',
      'Industrial processes',
      'Building materials',
      'Personal care products',
      'Vehicle emissions'
    ],
    healthImpacts: {
      shortTerm: [
        'Eye, nose, and throat irritation',
        'Headaches and nausea',
        'Dizziness and fatigue',
        'Allergic skin reactions',
        'Breathing difficulty'
      ],
      longTerm: [
        'Liver and kidney damage',
        'Central nervous system damage',
        'Cancer (some VOCs are carcinogenic)',
        'Reproductive and developmental effects'
      ]
    },
    environmentalImpacts: [
      'Forms ground-level ozone',
      'Contributes to smog',
      'Some are greenhouse gases',
      'Damages vegetation'
    ],
    safeLevel: 'Varies by compound',
    color: '#10b981',
    icon: '🧪'
  },

  'Lead': {
    symbol: 'Pb',
    name: 'Lead',
    fullName: 'Lead Particles',
    description: 'A heavy metal that can be found in air as fine particles. Once widely used in gasoline and paint, it remains a persistent environmental contaminant.',
    sources: [
      'Industrial processes (smelters, battery plants)',
      'Aircraft fuel',
      'Waste incinerators',
      'Old lead-based paint',
      'Contaminated soil dust',
      'Mining operations'
    ],
    healthImpacts: {
      shortTerm: [
        'Anemia',
        'Weakness and fatigue',
        'Abdominal pain',
        'Kidney problems'
      ],
      longTerm: [
        'Permanent brain damage (especially in children)',
        'Learning disabilities',
        'Reduced IQ',
        'Behavioral problems',
        'Reproductive issues',
        'Cardiovascular effects',
        'Kidney disease'
      ]
    },
    environmentalImpacts: [
      'Toxic to wildlife',
      'Persists in soil for decades',
      'Bioaccumulates in food chains',
      'Contaminates water sources'
    ],
    safeLevel: 'No safe level (WHO)',
    color: '#64748b',
    icon: '☠️'
  }
};

// Quick facts for educational panel
export const AIR_QUALITY_FACTS = [
  {
    title: 'Global Impact',
    fact: '99% of the world\'s population breathes air that exceeds WHO guideline limits.',
    icon: '🌍'
  },
  {
    title: 'Health Burden',
    fact: 'Air pollution causes an estimated 7 million premature deaths annually worldwide.',
    icon: '💔'
  },
  {
    title: 'Children at Risk',
    fact: 'Children are most vulnerable as they breathe faster and their organs are still developing.',
    icon: '👶'
  },
  {
    title: 'Indoor vs Outdoor',
    fact: 'Indoor air can be 2-5 times more polluted than outdoor air in many homes.',
    icon: '🏠'
  },
  {
    title: 'Economic Cost',
    fact: 'Air pollution costs the global economy $8.1 trillion annually (6.1% of global GDP).',
    icon: '💰'
  },
  {
    title: 'Climate Connection',
    fact: 'Many air pollutants also contribute to climate change, creating a double threat.',
    icon: '🌡️'
  }
];

// Protection tips for different AQI levels
export const PROTECTION_TIPS = {
  good: [
    'Perfect day for outdoor activities!',
    'Air quality is ideal for everyone.',
    'Enjoy outdoor exercise without restrictions.'
  ],
  moderate: [
    'Unusually sensitive individuals should limit prolonged outdoor activities.',
    'Everyone else can enjoy normal outdoor activities.',
    'Monitor air quality if you have respiratory conditions.'
  ],
  unhealthySensitive: [
    'People with respiratory or heart disease, children, and older adults should limit prolonged outdoor activities.',
    'Wear a mask (N95/KN95) if you must be outside for extended periods.',
    'Close windows and use air purifiers indoors.',
    'Reduce physical exertion outdoors.'
  ],
  unhealthy: [
    'Everyone should avoid prolonged outdoor activities.',
    'Sensitive groups should stay indoors.',
    'Wear N95/KN95 masks when outside.',
    'Use air purifiers with HEPA filters indoors.',
    'Keep windows closed.',
    'Avoid outdoor exercise.'
  ],
  veryUnhealthy: [
    'Everyone should avoid all outdoor activities.',
    'Stay indoors with air filtration.',
    'Wear N95/KN95 masks if you must go outside.',
    'Keep windows and doors sealed.',
    'Run air purifiers on high setting.',
    'Seek medical attention if experiencing symptoms.'
  ],
  hazardous: [
    'EMERGENCY CONDITIONS: Remain indoors.',
    'Evacuate if advised by authorities.',
    'Seal all windows and doors.',
    'Use air purifiers continuously.',
    'Wear N95/KN95 masks even indoors if needed.',
    'Seek immediate medical help if experiencing health effects.',
    'Follow official emergency guidelines.'
  ]
};
