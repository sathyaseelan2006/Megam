# 🌍 Megam - Advanced Air Quality Intelligence<div align="center">



<div align="center"># 🌍 Megam - Advanced Air Quality Intelligence



![Megam Logo](https://img.shields.io/badge/Megam-Air%20Quality%20Monitor-blue?style=for-the-badge)<img src="./public/favicon.svg" alt="Megam Logo" width="120" height="120" />

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)**100% Real-Time Data from Satellites & Ground Stations - No AI Estimates**

[![NASA](https://img.shields.io/badge/NASA-MODIS-E03C31?style=flat&logo=nasa)](https://power.larc.nasa.gov/)

[![OpenAQ](https://img.shields.io/badge/OpenAQ-API-00A5E0?style=flat)](https://openaq.org/)[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**Monitor real-time global air quality with an interactive 3D globe powered by NASA satellites and government monitoring stations**[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)



[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [API Setup](#-api-setup) • [Documentation](#-documentation)[Live Demo](https://ai.studio/apps/drive/1AgyUS9DrCGIayt5T07qUBiYvuDQrWSn-) • [Report Bug](https://github.com/yourusername/aura/issues) • [Request Feature](https://github.com/yourusername/aura/issues)



</div></div>



------



## 🎯 Overview## ✨ Features



**Megam** is a cutting-edge air quality monitoring platform that combines **real-time satellite data** from NASA with **ground station measurements** from government agencies worldwide. Built with React and TypeScript, it provides **global coverage** - working even in remote areas where traditional monitoring stations don't exist.### 🎯 Core Features

- **Interactive 3D Globe** - Beautiful, rotatable Earth visualization powered by `react-globe.gl`

### 🌟 What Makes Megam Different?- **100% Real-Time Data** - Verified measurements from WAQI (30,000+ stations) and OpenAQ (10,000+ sensors)

- **Satellite Integration** - Data from Sentinel-5P and NASA MODIS satellites

- **🛰️ True Global Coverage** - Works anywhere on Earth using NASA MODIS satellites- **No AI Estimates** - Only verified, real-time measurements from actual sensors

- **📡 Real Government Data** - 10,000+ monitoring stations via OpenAQ- **Data Source Transparency** - See exactly where your data comes from (satellite/ground/hybrid)

- **🎯 No AI Estimates** - 100% real measurements (no artificial intelligence guesswork)- **Health Advisories** - Personalized recommendations based on real air quality levels

- **🌐 Interactive 3D Globe** - Beautiful WebGL visualization- **Pollutant Breakdown** - Detailed information about PM2.5, PM10, O₃, NO₂, SO₂, CO

- **📊 Multiple Pollutants** - PM2.5, PM10, O₃, NO₂, SO₂, CO- **Educational Content** - Learn about 8 major pollutants and their health impacts

- **📚 Educational** - Learn about pollutants and their health impacts- **Location Search** - Free geocoding with OpenStreetMap Nominatim

- **📖 History Tracking** - Save and revisit your favorite locations- **Search History** - Track visited locations with favorites

- **One-Click Sharing** - Share air quality reports with others

---

### 🎨 User Experience

## ✨ Features- **Smooth Animations** - Polished transitions and micro-interactions

- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### 🌍 Real-Time Air Quality Data- **Dark Mode** - Eye-friendly dark theme with gradient backgrounds

- **Government Monitoring Stations** (OpenAQ) - 10,000+ stations in 100+ countries- **Keyboard Shortcuts** - Navigate efficiently with keyboard controls

- **NASA Satellite Data** (MODIS) - Global aerosol measurements from space  - `Ctrl/Cmd + K` - Focus search bar

- **Smart Fallback System** - Ground stations first, satellite as backup  - `Escape` - Close info panel

- **Confidence Scoring** - Know how reliable each measurement is- **Accessibility** - WCAG compliant with ARIA labels and keyboard navigation



### 🗺️ Interactive Globe### 🚀 Technical Highlights

- **3D Visualization** - Rotate, zoom, and explore the Earth- **Error Boundaries** - Graceful error handling with user-friendly messages

- **Click Anywhere** - Get air quality for any location- **Loading States** - Beautiful loading screens and skeletons

- **Satellite/Earth Views** - Toggle between different map styles- **Production Optimized** - Code splitting, tree shaking, and minification

- **Location Search** - Find cities, countries, or coordinates- **SEO Ready** - Complete Open Graph and Twitter Card meta tags

- **PWA Support** - Installable as a Progressive Web App

---   cd aura
"""
# Megam — Air Quality Intelligence

Clean, modern README that explains how Megam works, how to run it, and the methods used.

[Live Demo](https://megam-n2z95mbl0-sathyaseelan2006s-projects.vercel.app) • [GitHub Repo](https://github.com/sathyaseelan2006/Megam)

---

## Quick summary

- Purpose: provide accurate, real-time air quality and weather information worldwide using a mix of ground stations and satellite data.
- Primary data sources: IQAir (AirVisual), OpenAQ (ground stations), WAQI (aggregator), NASA MODIS (satellite).
- Stack: React 19 + TypeScript, Vite, TensorFlow.js (for ML predictions), react-globe.gl (3D globe).

---

## Highlights — what this project does

- Interactive 3D globe to query any point on Earth and show AQI + weather.
- Data priority system (best available source is chosen automatically).
- Real-time weather included (IQAir provides temperature, humidity, pressure, wind).
- Lightweight LSTM model in TensorFlow.js for short-term AQI predictions with persistence in IndexedDB.
- Local proxy (Vite or serverless) for OpenAQ to avoid CORS in development.

---

## Architecture (high level)

```mermaid
flowchart TB
   A[User: Click on globe] --> B[Client: getComprehensiveAQIData]
   B -->|parallel| C(IQAir API)
   B -->|parallel| D(OpenAQ proxy)
   B -->|parallel| E(WAQI)
   B -->|parallel| F(NASA MODIS)
   C --> G{IQAir Data?}
   D --> H{GroundStations?}
   E --> I{WAQI Data?}
   F --> J{NASA AOD?}
   G -->|yes| K[Use IQAir (primary): AQI + Weather]
   H -->|yes| L[Use Ground Station]
   J -->|yes| M[Use NASA satellite]
   I -->|yes| N[Use WAQI fallback]
   K & L & M & N --> O[LocationData -> InfoPanel]
   O --> P[Optional: TF.js LSTM prediction]
```

Notes: the client starts all API calls in parallel (Promise.allSettled) and uses a simple priority to pick the best available data:

- IQAir (if key present) → Ground (OpenAQ) → NASA MODIS → WAQI

This gives fastest responses and highest-quality measurements while ensuring global coverage.

---

## Key files to inspect

- `services/satelliteService.ts` — orchestrates all data fetches and contains priority logic.
- `components/InfoPanel.tsx` — renders AQI, pollutant breakdown and the redesigned weather card.
- `types.ts` — TypeScript definitions including `LocationData` and `WeatherData`.
- `vite.config.ts` — dev proxy configuration for OpenAQ (CORS workaround).

---

## How data is fetched and chosen (method)

1. User clicks a lat/lng on the globe.
2. `getComprehensiveAQIData(lat,lng)` is called.
3. The function fires parallel requests to available sources with `Promise.allSettled`.
4. The system examines results and applies this selection rule:

    - If IQAir returns data -> use IQAir (AQI + weather).
    - Else if nearby OpenAQ station(s) -> use ground station measurements.
    - Else if NASA satellite data valid -> use satellite-derived AOD mapped to AQI.
    - Else if WAQI returns a station -> use WAQI.

5. The chosen result is normalized to a `LocationData` object used by the UI and ML components.

Why this method?

- Parallel fetches minimize latency (fastest successful source wins).
- Prioritizing ground measurements yields better accuracy; IQAir improves coverage and gives weather data.
- Satellite AOD is used only when ground data is absent (global fallback).

---

## Weather & Climate

IQAir provides a `current.weather` object (temperature °C, humidity %, pressure hPa, wind speed m/s, wind direction °). We surface that in `InfoPanel` with a compact, modern design. No extra external weather API required by default.

If you want additional climate/time-series data, you can optionally wire OpenWeatherMap or other services in `services/`.

---

## ML: short-term AQI predictions

- Implementation: small LSTM model in `tfjs` (2-layer LSTM, saved to IndexedDB).
- Purpose: short-term (hours–days) smoothing and trend preview in UI.
- Model persistence: uses IndexedDB so the model and weights persist across sessions.

Notes: ML is additive (presented as optional prediction), not the source of raw AQI values.

---

## Environment variables

Create `.env.local` (this file must NOT be committed). Example variables:

```env
# Required
VITE_OPENAQ_API_KEY=your_openaq_key_here

# Optional (recommended)
VITE_IQAIR_API_KEY=your_iqair_key_here
VITE_WAQI_API_KEY=your_waqi_key_here
VITE_NASA_API_KEY=your_nasa_key_here
```

Add secrets in Vercel (or your chosen host) for production.

---

## Development — run locally

1. Install

```powershell
git clone https://github.com/sathyaseelan2006/Megam.git
cd Megam
npm install
cp .env.example .env.local
# Edit .env.local and add your API keys
```

2. Start dev server (Vite)

```powershell
npm run dev
# Open http://localhost:5174
```

3. Click the globe and open the browser console to see which source was used.

---

## Production & deployment

- We recommend Vercel. Add environment variables in the Vercel dashboard and deploy. The repo is already configured to build with Vite.

Power user commands:

```powershell
# Push to GitHub
git add .
git commit -m "feat: add README"
git push origin main

# Deploy via Vercel CLI
vercel --prod
```

---

## Diagrams & flow (quick)

Mermaid diagram above shows the runtime flow. Here is a compact ASCII fallback:

```
User Click -> Parallel requests -> {IQAir?} -> pick -> normalize -> show
                               \-> OpenAQ?     
                               \-> NASA?      
                               \-> WAQI?      
```

---

## Testing & troubleshooting

- If you see `404` from `/api/openaq` in dev, ensure Vite is running on the port referenced in `vite.config.ts` and that the dev proxy logs (console) show rewrite actions. The proxy rewrites requests like `/api/openaq?url=https://api.openaq.org/v3/...` to the remote path.
- NASA satellite AOD may be `-999` on cloudy days — the code falls back through the last 7 days and then to other sources.

---

## Contributing

Contributions welcome. Open a PR against `main`. See `CONTRIBUTING.md` in the repo (or follow these steps):

1. Fork
2. Create branch
3. Commit & PR

---

## License

MIT — see `LICENSE`.

---

If you'd like, I can also:

- Generate a `README-screenshot.png` of the new weather UI
- Add a short `DOCS.md` with architecture diagrams expanded
- Create a small integration test that simulates a globe click and verifies priority logic

Tell me which of the above you'd like next and I'll implement it.


Visit **http://localhost:5173/** and start exploring! 🎉```bash

# Build the app

---npm run build



## 🔑 API Setup# Preview the production build locally

npm run preview

Megam uses multiple data sources. Here's how to get your API keys:```



### 1. OpenAQ API Key (Required) ✅The optimized build will be in the `dist` folder, ready for deployment.



**Get Your Key:**---

1. Visit: https://explore.openaq.org/register

2. Sign up for a free account## 🛠️ Tech Stack

3. Get your API key from the dashboard

4. Add to `.env.local`:| Technology | Purpose |

```env|------------|---------|

VITE_OPENAQ_API_KEY=your_openaq_key_here| **React 19** | UI framework with latest features |

```| **TypeScript** | Type-safe development |

| **Vite** | Lightning-fast build tool |

**Coverage:** 10,000+ stations in major cities worldwide| **Tailwind CSS** | Utility-first styling |

| **react-globe.gl** | 3D globe visualization |

---| **Google Gemini AI** | Real-time AQI data and insights |

| **Three.js** | 3D graphics (via react-globe.gl) |

### 2. NASA API Key (Optional - No Key Required!) 🛰️

---

**Important:** NASA POWER API is **completely free** and doesn't require an API key! The satellite data works out of the box.

## 📂 Project Structure

If you want to use other NASA services in the future, you can get a key:

1. Visit: https://api.nasa.gov/```

2. Sign up (takes 30 seconds)aura/

3. Add to `.env.local`:├── components/          # React components

```env│   ├── GlobeComponent.tsx   # 3D globe visualization

VITE_NASA_API_KEY=your_nasa_key_here│   ├── InfoPanel.tsx        # Air quality data panel

```│   ├── SearchBar.tsx        # City search component

│   ├── GlobeToolbar.tsx     # Globe controls

**Coverage:** 100% of Earth's surface!│   ├── ErrorBoundary.tsx    # Error handling

│   ├── LoadingScreen.tsx    # Loading state

---│   └── icons.tsx            # SVG icon components

├── services/            # API services

### 3. WAQI API Key (Optional) 🌐│   └── geminiService.ts     # Gemini AI integration

├── public/              # Static assets

For additional coverage (30,000+ stations):│   ├── favicon.svg          # App icon

1. Visit: https://aqicn.org/data-platform/token/│   └── manifest.json        # PWA manifest

2. Fill the registration form├── App.tsx              # Main application component

3. Check your email for the token├── index.tsx            # Application entry point

4. Add to `.env.local`:├── types.ts             # TypeScript type definitions

```env├── constants.ts         # App constants (AQI levels, etc.)

VITE_WAQI_API_KEY=your_waqi_key_here├── vite.config.ts       # Vite configuration

```├── tsconfig.json        # TypeScript configuration

└── package.json         # Dependencies and scripts

**Coverage:** 30,000+ stations in 130 countries```



------



### Complete .env.local Example## 🎯 Usage



```env### Search for a Location

# OpenAQ - REQUIRED1. Type a city name in the search bar

VITE_OPENAQ_API_KEY=your_openaq_key_here2. Press Enter or click the search icon

3. View detailed air quality information in the side panel

# NASA - Optional (satellite works without key)

VITE_NASA_API_KEY=your_nasa_key_here### Use Current Location

1. Click the location pin icon in the search bar

# WAQI - Optional (for more coverage)2. Allow location permissions when prompted

VITE_WAQI_API_KEY=your_waqi_key_here3. View air quality for your current location

```

### Explore the Globe

**Important:** Restart the development server after updating `.env.local`!1. Click anywhere on the globe to get AQI data for that location

2. Drag to rotate the globe

---3. Scroll to zoom in/out

4. Use the toolbar to recenter or toggle satellite view

## 📖 Usage

### Share Reports

### Search for a Location1. Click the share icon in the info panel header

1. Type city name in search bar (e.g., "New York", "Tokyo", "London")2. Choose to share via native share or copy to clipboard

2. Or enter coordinates (e.g., "40.7, -74.0")3. Share air quality information with friends!

3. Press Enter or click Search

---

### Explore the Globe

1. Click anywhere on the 3D globe## 🔐 Environment Variables

2. Drag to rotate, scroll to zoom

3. Toggle satellite/earth view with the toolbar| Variable | Required | Description |

|----------|----------|-------------|

### View Air Quality Details| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key for fetching AQI data |

- **AQI Value** - Overall air quality index (0-500)

- **Pollutants** - Detailed measurements for each pollutant> **Note:** Never commit your `.env.local` file to version control. It's already in `.gitignore`.

- **Health Advisory** - What the AQI means for your health

- **Data Source** - Where the data came from (ground/satellite)---

- **Confidence** - How reliable the measurement is

## 🚢 Deployment

### Educational Mode

1. Click the "Education" button (bottom right)### Deploy to Vercel (Recommended)

2. Learn about each pollutant

3. Understand health impacts[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/aura)

4. See WHO safe levels

1. Push your code to GitHub

### History2. Import the project in Vercel

1. Click "History" button3. Add your `GEMINI_API_KEY` environment variable

2. View recent searches4. Deploy!

3. Add favorites (star icon)

4. Click to revisit locations### Deploy to Netlify



---```bash

# Build the app

## 🏗️ Project Structurenpm run build



```# Deploy to Netlify

Megam/netlify deploy --prod --dir=dist

├── components/           # React components```

│   ├── GlobeComponent.tsx      # 3D Earth visualization

│   ├── InfoPanel.tsx           # Air quality display### Deploy to GitHub Pages

│   ├── SearchBar.tsx           # Location search

│   ├── EducationPanel.tsx      # Pollutant education```bash

│   └── HistoryPanel.tsx        # Search history# Build the app

├── services/            # API integrationsnpm run build

│   ├── satelliteService.ts     # NASA + OpenAQ + WAQI

│   ├── geocodingService.ts     # Location search# Deploy to gh-pages branch

│   └── historyService.ts       # LocalStorage historynpm run deploy

├── public/              # Static assets```

├── App.tsx              # Main application

├── types.ts             # TypeScript definitions---

└── vite.config.ts       # Build configuration

```## 🤝 Contributing



---Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.



## 🛠️ Tech Stack1. Fork the Project

2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)

### Frontend3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)

- **React 19.2.0** - UI framework4. Push to the Branch (`git push origin feature/AmazingFeature`)

- **TypeScript 5.8.2** - Type safety5. Open a Pull Request

- **Vite 6.2.0** - Build tool & dev server

- **react-globe.gl 2.36.0** - 3D globe visualization---

- **Tailwind CSS** - Styling (via CDN)

## 📝 License

### Data Sources

- **OpenAQ API v3** - Government monitoring stationsDistributed under the MIT License. See `LICENSE` for more information.

- **NASA POWER API** - MODIS satellite aerosol data

- **WAQI API** - World Air Quality Index---

- **Nominatim** - Free geocoding (OpenStreetMap)

## 🙏 Acknowledgments

### APIs Used

- `https://api.openaq.org/v3` - Ground station data- [Google Gemini](https://ai.google.dev/) for providing the AI API

- `https://power.larc.nasa.gov/api` - Satellite data- [react-globe.gl](https://github.com/vasturiano/react-globe.gl) for the beautiful 3D globe

- `https://api.waqi.info` - Additional stations- [Tailwind CSS](https://tailwindcss.com/) for the styling framework

- `https://nominatim.openstreetmap.org` - Geocoding- [Heroicons](https://heroicons.com/) for the icon designs

- [NASA](https://visibleearth.nasa.gov/) for Earth textures

---

---

## 🌐 Data Sources & Attribution

## 📞 Contact

### OpenAQ

Real-time air quality data from government monitoring stations worldwide. Data sourced from:**Project Link:** [https://github.com/yourusername/aura](https://github.com/yourusername/aura)

- US EPA (Environmental Protection Agency)

- EEA (European Environment Agency)  **AI Studio Link:** [https://ai.studio/apps/drive/1AgyUS9DrCGIayt5T07qUBiYvuDQrWSn-](https://ai.studio/apps/drive/1AgyUS9DrCGIayt5T07qUBiYvuDQrWSn-)

- CPCB (Central Pollution Control Board - India)

- MEE (Ministry of Ecology and Environment - China)---

- Local government agencies in 100+ countries

<div align="center">

**License:** Open Data (CC BY 4.0)  

**Website:** https://openaq.org**Made with ❤️ by the Aura Team**



### NASA MODIS⭐ Star us on GitHub — it helps!

Aerosol Optical Depth measurements from Terra and Aqua satellites. Part of NASA's Earth Observing System providing global atmospheric composition data.

</div>

**License:** Public Domain (NASA Open Data)  
**Website:** https://power.larc.nasa.gov

### WAQI (Optional)
World Air Quality Index project aggregating data from 130 countries.

**License:** Varies by source  
**Website:** https://aqicn.org

---

## 🎨 Screenshots

### Main Interface
![Main Interface](https://via.placeholder.com/800x400/667eea/ffffff?text=Megam+Main+Interface)

### Air Quality Details
![Air Quality Panel](https://via.placeholder.com/400x300/764ba2/ffffff?text=AQI+Details)

### Education Mode
![Education Panel](https://via.placeholder.com/400x300/f093fb/ffffff?text=Learn+About+Pollutants)

---

## 📊 How It Works

### Data Priority System

```
User searches for "Tokyo"
    ↓
1️⃣ Try OpenAQ ground stations (within 25km)
    ├─ Found? → Use this data (90% confidence) ✅
    └─ Not found → Next step ⬇️
    
2️⃣ Try WAQI stations (if API key available)
    ├─ Found? → Use this data (85% confidence) ✅
    └─ Not found → Next step ⬇️
    
3️⃣ Try NASA satellite data (global coverage)
    ├─ Found? → Use satellite estimate (70% confidence) ✅
    └─ Not found → Show error message ❌
```

### Coverage Areas

| Location Type | Data Source | Coverage |
|---------------|-------------|----------|
| **Major Cities** | OpenAQ/WAQI | 90%+ |
| **Suburbs** | OpenAQ/WAQI | 70%+ |
| **Rural Areas** | NASA Satellite | 100% |
| **Remote Regions** | NASA Satellite | 100% |
| **Oceans** | NASA Satellite | 100% |

**Result:** Truly global air quality monitoring! 🌍

---

## 🚀 Deployment

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Build
npm run build

# Deploy dist folder to Netlify
```

### Environment Variables
Remember to add your API keys in the deployment platform's environment variables:
- `VITE_OPENAQ_API_KEY`
- `VITE_NASA_API_KEY` (optional)
- `VITE_WAQI_API_KEY` (optional)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ideas for Contributions
- 🌍 Add support for more data sources (Sentinel-5P, PurpleAir)
- 📊 Create data visualization charts
- 🗺️ Add heatmap overlays on the globe
- 📱 Improve mobile responsiveness
- 🌐 Add internationalization (i18n)
- 📈 Build ML prediction models
- 🔔 Add air quality alerts
- 📸 Add screenshot/share features

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Sathyaseelan**
- GitHub: [@sathyaseelan2006](https://github.com/sathyaseelan2006)
- Repository: [Megam](https://github.com/sathyaseelan2006/Megam)

---

## 🙏 Acknowledgments

- **OpenAQ** - For providing free access to global air quality data
- **NASA** - For open satellite data and Earth observations
- **WAQI** - For comprehensive air quality index data
- **OpenStreetMap** - For free geocoding services
- **React Globe GL** - For the amazing 3D globe component
- **Vite** - For blazing fast development experience

---

## 📚 Documentation

Additional documentation available in the repository:

- **[NASA_API_TUTORIAL.md](NASA_API_TUTORIAL.md)** - Complete guide to NASA POWER API
- **[DATA_SOURCES_EXPLAINED.md](DATA_SOURCES_EXPLAINED.md)** - Detailed explanation of all data sources
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[API_STATUS.md](API_STATUS.md)** - Current API configuration status

---

## 🐛 Known Issues

- NASA satellite data may return `-999` on cloudy days (no data available)
- OpenAQ API v3 has a 25km max radius limit
- WAQI requires valid API key (get free at aqicn.org)

---

## 🔮 Future Enhancements

### Coming Soon
- [ ] 📈 ML-based air quality predictions (5-month forecasts)
- [ ] 🗺️ Heatmap overlay on globe
- [ ] 📊 Historical data charts and trends
- [ ] 🔔 Air quality alerts and notifications
- [ ] 📱 Progressive Web App (PWA)
- [ ] 🌐 Multi-language support
- [ ] 📸 Screenshot/share functionality
- [ ] 🎨 Dark/light theme toggle

### On the Roadmap
- [ ] Integration with Sentinel-5P (ESA satellite)
- [ ] PurpleAir sensor network
- [ ] Comparison between multiple cities
- [ ] Export data to CSV/PDF
- [ ] Mobile native apps (iOS/Android)
- [ ] API for developers

---

## ⭐ Star History

If you find Megam useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=sathyaseelan2006/Megam&type=Date)](https://star-history.com/#sathyaseelan2006/Megam&Date)

---

## 📞 Support

Having trouble? Here are some resources:

- 📖 Check the [Documentation](#-documentation)
- 🐛 Report bugs via [GitHub Issues](https://github.com/sathyaseelan2006/Megam/issues)
- 💬 Ask questions in [Discussions](https://github.com/sathyaseelan2006/Megam/discussions)
- 📧 Email: [Your email if you want]

---

<div align="center">

**Made with ❤️ and ☕ by Sathyaseelan**

**Monitoring the air we breathe, one location at a time 🌍**

[⬆ Back to Top](#-megam---advanced-air-quality-intelligence)

</div>
