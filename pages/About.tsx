import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  useEffect(() => {
    document.title = 'About — Megam';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'About Megam — mission, data sources, and technology behind the global air quality platform.');
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'About Megam — mission, data sources, and technology behind the global air quality platform.';
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-3xl">🌍</span>
            <span className="text-xl font-bold text-white">Megam</span>
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link to="/about" className="text-cyan-400 font-semibold">About</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative py-16 px-6 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-b border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            About Megam
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Making air quality information accessible to everyone, everywhere. 
            Real-time data from satellites and 80,000+ ground stations worldwide.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Our Mission</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-lg text-gray-300 leading-relaxed">
              Megam is dedicated to making air quality information accessible to everyone, everywhere. 
              We believe that clean air is a fundamental right, and access to accurate, real-time air 
              quality data empowers individuals and communities to make informed decisions about their 
              health and environment.
            </p>
          </div>
        </section>

        {/* What We Do */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-800/50 rounded-xl p-6">
              <div className="text-4xl mb-4">🛰️</div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">Global Coverage</h3>
              <p className="text-gray-300">
                Combining data from 80,000+ monitoring stations and NASA satellites for 
                worldwide air quality information.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-800/50 rounded-xl p-6">
              <div className="text-4xl mb-4">🌡️</div>
              <h3 className="text-xl font-semibold mb-3 text-purple-400">Weather Integration</h3>
              <p className="text-gray-300">
                Real-time temperature, humidity, wind, and pressure data integrated with 
                air quality metrics.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border border-green-800/50 rounded-xl p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-3 text-green-400">ML Predictions</h3>
              <p className="text-gray-300">
                Short-term air quality forecasts using TensorFlow.js LSTM models trained 
                on historical data.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-800/50 rounded-xl p-6">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-3 text-orange-400">3D Visualization</h3>
              <p className="text-gray-300">
                Interactive globe powered by WebGL and Three.js for intuitive exploration 
                of global air quality.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Our Data Sources</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-1">1️⃣</div>
              <div>
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">IQAir AirVisual</h3>
                <p className="text-gray-300">
                  Premium air quality data from 80,000+ stations worldwide. Highest priority 
                  source with 92% confidence, includes comprehensive weather data.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-1">2️⃣</div>
              <div>
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">OpenAQ</h3>
                <p className="text-gray-300">
                  Open-source government monitoring data from 100+ countries. 95% confidence 
                  for real ground-based measurements.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-1">3️⃣</div>
              <div>
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">NASA POWER</h3>
                <p className="text-gray-300">
                  Satellite aerosol optical depth measurements providing global coverage 
                  even in remote areas. 70% confidence.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-1">4️⃣</div>
              <div>
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">WAQI</h3>
                <p className="text-gray-300">
                  World Air Quality Index aggregating 30,000+ stations. 80% confidence 
                  fallback for additional coverage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'React 19', icon: '⚛️' },
              { name: 'TypeScript', icon: '📘' },
              { name: 'Vite', icon: '⚡' },
              { name: 'Three.js', icon: '🎮' },
              { name: 'TensorFlow.js', icon: '🧠' },
              { name: 'Tailwind CSS', icon: '🎨' },
              { name: 'Vercel', icon: '▲' },
              { name: 'NASA APIs', icon: '🛰️' },
            ].map((tech) => (
              <div key={tech.name} className="bg-slate-800/30 border border-gray-700 rounded-lg p-4 text-center hover:border-cyan-700 transition-colors">
                <div className="text-3xl mb-2">{tech.icon}</div>
                <div className="text-sm text-gray-300">{tech.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Team & Contact */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Team & Contact</h2>
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-gray-700 rounded-xl p-8">
            <p className="text-lg text-gray-300 mb-6">
              Megam is developed and maintained by <span className="text-cyan-400 font-semibold">Sathyaseelan</span> and 
              contributors from the open-source community.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="mailto:k.sathyaseelan2006@gmail.com"
                className="flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/50 px-5 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>k.sathyaseelan2006@gmail.com</span>
              </a>
              <a 
                href="https://github.com/sathyaseelan2006"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600 px-5 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span>@sathyaseelan2006</span>
              </a>
              <a 
                href="https://github.com/sathyaseelan2006/Megam"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 px-5 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>View Repository</span>
              </a>
            </div>
          </div>
        </section>

        {/* Acknowledgments */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Acknowledgments</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-4">Megam would not be possible without:</p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong className="text-white">Data Providers:</strong> IQAir, OpenAQ, WAQI, NASA for providing accessible APIs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong className="text-white">Open Source Community:</strong> React, TensorFlow.js, Three.js, and countless other libraries</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong className="text-white">Environmental Agencies:</strong> Government monitoring stations worldwide contributing to OpenAQ</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong className="text-white">Users:</strong> Everyone who uses Megam to stay informed about air quality</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105"
          >
            <span className="text-2xl">🌍</span>
            <span>Explore the Globe</span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-slate-900/50 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Megam. Open source and free for everyone.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/about" className="hover:text-cyan-400 transition-colors">About</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
