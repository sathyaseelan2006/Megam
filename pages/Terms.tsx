import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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
            <Link to="/about" className="text-gray-400 hover:text-cyan-400 transition-colors">About</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-cyan-400 font-semibold">Terms</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative py-16 px-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Please read these terms carefully before using Megam. By accessing or using our service, 
            you agree to be bound by these terms.
          </p>
          <p className="text-sm text-gray-400 mt-4">Last Updated: {currentDate}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Quick Summary */}
        <section className="mb-12 bg-purple-900/10 border border-purple-800/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Key Points</h2>
          <div className="space-y-3 text-gray-300">
            <p className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>Free to use for personal and educational purposes</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>Data provided "as is" - not for life-critical decisions</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>Open source under MIT License</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>We're not liable for decisions made based on our data</span>
            </p>
          </div>
        </section>

        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">1. Acceptance of Terms</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-4">
              By accessing and using Megam ("the Service"), you accept and agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
            <p className="text-gray-300">
              These terms apply to all users, including visitors, registered users, and contributors.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">2. Description of Service</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 space-y-4">
            <p className="text-gray-300">
              Megam provides real-time air quality information aggregated from multiple sources including:
            </p>
            <ul className="space-y-2 text-gray-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>IQAir AirVisual monitoring network</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>OpenAQ government monitoring stations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>World Air Quality Index (WAQI)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>NASA satellite measurements</span>
              </li>
            </ul>
            <p className="text-gray-300 mt-4">
              The Service also provides weather data, machine learning forecasts, and educational 
              content about air quality.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">3. Use License and Restrictions</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">3.1 Permitted Use</h3>
              <p className="text-gray-300 mb-3">You may use Megam for:</p>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Personal, non-commercial purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Educational and research purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>News reporting and journalism</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Contributing to the open-source project</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">3.2 Prohibited Use</h3>
              <p className="text-gray-300 mb-3">You may NOT:</p>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Scrape, crawl, or automatically extract data from the Service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Use the Service for any illegal or unauthorized purpose</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Attempt to gain unauthorized access to any part of the Service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Transmit viruses, malware, or harmful code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Overload or interfere with the Service's infrastructure</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">4. Data Accuracy and Disclaimers</h2>
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-8 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-xl font-semibold text-amber-400 mb-3">Important Notice</h3>
                <p className="text-gray-300 mb-4">
                  Air quality data is provided "AS IS" without warranty of any kind. While we strive for 
                  accuracy, we cannot guarantee:
                </p>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Complete accuracy or timeliness of data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Availability or uptime of the Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Suitability for any particular purpose</span>
                  </li>
                </ul>
                <p className="text-gray-300 mt-4 font-semibold">
                  Do not make life-critical decisions (medical, safety, etc.) based solely on Megam data. 
                  Always consult official government sources and healthcare professionals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">5. Third-Party Data Sources</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-4">
              Megam aggregates data from third-party APIs. You acknowledge that:
            </p>
            <ul className="space-y-3 text-gray-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Data providers (IQAir, OpenAQ, WAQI, NASA) have their own terms and licenses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>We are not responsible for the accuracy of third-party data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Third-party services may become unavailable without notice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>You should review the terms of service of each data provider</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">6. Intellectual Property</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">6.1 Open Source</h3>
              <p className="text-gray-300">
                Megam's source code is open source under the MIT License. You may use, modify, and 
                distribute the code subject to the MIT License terms. See our{' '}
                <a 
                  href="https://github.com/sathyaseelan2006/Megam/blob/main/LICENSE" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  GitHub repository
                </a>{' '}
                for details.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">6.2 Trademarks</h3>
              <p className="text-gray-300">
                "Megam" and associated logos are trademarks. Unauthorized use of our trademarks is prohibited.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">6.3 User Content</h3>
              <p className="text-gray-300">
                If you contribute code, feedback, or suggestions to Megam, you grant us a non-exclusive, 
                worldwide license to use, modify, and incorporate your contributions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">7. Limitation of Liability</h2>
          <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-8">
            <p className="text-gray-300 mb-4 font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="space-y-3 text-gray-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>
                  Megam and its contributors are NOT LIABLE for any direct, indirect, incidental, 
                  consequential, or punitive damages arising from your use of the Service
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>
                  This includes, but is not limited to, damages for loss of profits, data, or other 
                  intangible losses
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>
                  We are not liable for decisions made based on information provided by the Service
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">8. Privacy</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300">
              Your use of Megam is also governed by our{' '}
              <Link to="/privacy" className="text-cyan-400 hover:underline font-semibold">
                Privacy Policy
              </Link>
              . Please review it to understand how we collect, use, and protect your information.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">9. Changes to Terms</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-4">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective 
              immediately upon posting. Your continued use of the Service after changes constitutes acceptance 
              of the new terms.
            </p>
            <p className="text-gray-300">
              We recommend reviewing these terms periodically.
            </p>
          </div>
        </section>

        {/* Section 10 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">10. Termination</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-4">
              We reserve the right to:
            </p>
            <ul className="space-y-2 text-gray-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Terminate or suspend access to the Service for violations of these terms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Discontinue the Service at any time without notice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Refuse service to anyone for any reason</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 11 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">11. Governing Law</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300">
              These Terms of Service shall be governed by and construed in accordance with applicable 
              international laws. Any disputes arising from these terms or your use of the Service shall 
              be resolved through good faith negotiation or, if necessary, through appropriate legal channels.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">12. Contact</h2>
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-6">
              If you have questions about these Terms of Service, please contact us:
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
                href="https://github.com/sathyaseelan2006/Megam/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600 px-5 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span>GitHub Issues</span>
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105"
          >
            <span className="text-2xl">🌍</span>
            <span>Back to Megam</span>
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

export default Terms;
