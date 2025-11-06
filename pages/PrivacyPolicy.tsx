import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    document.title = 'Privacy Policy — Megam';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Megam Privacy Policy — how we collect, use, and protect your data.');
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Megam Privacy Policy — how we collect, use, and protect your data.';
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
            <Link to="/about" className="text-gray-400 hover:text-cyan-400 transition-colors">About</Link>
            <Link to="/privacy" className="text-cyan-400 font-semibold">Privacy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative py-16 px-6 bg-gradient-to-r from-green-900/20 to-teal-900/20 border-b border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            We respect your privacy. This policy explains what data we collect, how we use it, 
            and your rights regarding your information.
          </p>
          <p className="text-sm text-gray-400 mt-4">Last Updated: {currentDate}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Quick Summary */}
        <section className="mb-12 bg-green-900/10 border border-green-800/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Quick Summary</h2>
          <div className="space-y-3 text-gray-300">
            <p className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>No account required - use anonymously</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>We don't sell your data</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Minimal cookies (localStorage for preferences only)</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>No tracking across other websites</span>
            </p>
          </div>
        </section>

        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">1. Information We Collect</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">1.1 Location Data (Optional)</h3>
              <p className="text-gray-300 mb-3">
                If you use the "My Location" feature, we request access to your device's approximate 
                location. This data is:
              </p>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Only used to fetch air quality data for your area</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Never stored on our servers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Not shared with third parties</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">1.2 Search History (Local Only)</h3>
              <p className="text-gray-300">
                Your search history is stored locally in your browser's localStorage. It never leaves 
                your device and can be cleared at any time using the history panel.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">1.3 Usage Analytics (Optional)</h3>
              <p className="text-gray-300 mb-3">
                With your consent, we may collect anonymous usage statistics to improve the service:
              </p>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Page views and feature usage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Browser type and device information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Anonymous error reports</span>
                </li>
              </ul>
              <p className="text-gray-400 text-sm mt-3">
                You can opt out of analytics via the cookie consent banner.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">2. How We Use Your Information</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 space-y-4">
            <p className="text-gray-300">We use collected information only to:</p>
            <ul className="space-y-3 text-gray-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">1.</span>
                <span><strong className="text-white">Provide the Service:</strong> Fetch and display air quality data for your requested locations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">2.</span>
                <span><strong className="text-white">Improve Performance:</strong> Optimize loading times and fix bugs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">3.</span>
                <span><strong className="text-white">Understand Usage:</strong> Learn which features are most valuable (with consent)</span>
              </li>
            </ul>
            <p className="text-gray-300 font-semibold mt-6">
              We do NOT:
            </p>
            <ul className="space-y-2 text-gray-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>Sell or rent your data to third parties</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>Use your data for advertising targeting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>Track you across other websites</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>Store personally identifiable information</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">3. Cookies and Local Storage</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">Essential Storage</h3>
              <p className="text-gray-300">
                We use localStorage to store:
              </p>
              <ul className="space-y-2 text-gray-300 ml-6 mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Your cookie consent preference</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Search history (client-side only)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>UI preferences (theme, settings)</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">Analytics Cookies (Optional)</h3>
              <p className="text-gray-300">
                If you consent, we may use third-party analytics (Google Analytics) to understand usage patterns. 
                You can opt out at any time via browser settings or the cookie banner.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">4. Third-Party Services</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 space-y-4">
            <p className="text-gray-300 mb-4">We integrate with the following third-party services:</p>
            <div className="space-y-4">
              <div className="border-l-4 border-cyan-600 pl-4">
                <h4 className="font-semibold text-white mb-1">IQAir, OpenAQ, WAQI, NASA</h4>
                <p className="text-gray-300 text-sm">
                  Air quality and weather data providers. Your location queries are sent to their APIs. 
                  See their respective privacy policies for details.
                </p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h4 className="font-semibold text-white mb-1">Vercel (Hosting)</h4>
                <p className="text-gray-300 text-sm">
                  Our infrastructure provider. They may collect standard server logs (IP addresses, request times). 
                  See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Vercel's Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">5. Your Rights</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="space-y-3 text-gray-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong className="text-white">Access:</strong> Request information about what data we have (minimal, as we store almost nothing)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong className="text-white">Delete:</strong> Clear your browser's localStorage to remove all local data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong className="text-white">Opt-Out:</strong> Decline analytics cookies via the consent banner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong className="text-white">Contact Us:</strong> Email <a href="mailto:k.sathyaseelan2006@gmail.com" className="text-cyan-400 hover:underline">k.sathyaseelan2006@gmail.com</a> with any privacy concerns</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">6. Data Security</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-4">
              We take reasonable measures to protect your data:
            </p>
            <ul className="space-y-2 text-gray-300 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>HTTPS encryption for all connections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>No server-side storage of personal data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Regular security audits of our codebase</span>
              </li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              Since we collect minimal data and store almost nothing on our servers, your privacy risk is minimal.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">7. Children's Privacy</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300">
              Megam is safe for all ages. We do not knowingly collect personal information from children 
              under 13. Since we don't require accounts or collect personal data, there are no age restrictions.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">8. Changes to This Policy</h2>
          <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300">
              We may update this Privacy Policy from time to time. Changes will be posted on this page 
              with an updated "Last Updated" date. Continued use of Megam after changes constitutes 
              acceptance of the updated policy.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">9. Contact Us</h2>
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-gray-700 rounded-xl p-8">
            <p className="text-gray-300 mb-6">
              If you have questions about this Privacy Policy or your data, contact us:
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105"
          >
            <span className="text-2xl">🌍</span>
            <span>Back to Megam</span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-slate-900/50 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Megam. Your privacy matters.</p>
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

export default PrivacyPolicy;
