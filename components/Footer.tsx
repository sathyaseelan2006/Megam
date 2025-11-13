import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show footer when mouse is near bottom (within 100px)
      if (window.innerHeight - e.clientY < 100) {
        setIsVisible(true);
      } else {
        // Hide immediately when mouse moves away
        setIsVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <footer 
      className={`fixed bottom-0 left-0 right-0 bg-slate-900/85 backdrop-blur-md border-t border-gray-800 text-gray-400 py-2 px-4 z-[15] pointer-events-auto transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🌍</span>
            <span className="font-semibold text-white text-sm">Megam</span>
            <span className="text-[10px] text-gray-500">© {currentYear}</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-3 text-[11px]">
            <Link
              to="/about"
              className="hover:text-cyan-300 transition-colors"
            >
              About
            </Link>
            <Link
              to="/privacy"
              className="hover:text-cyan-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-cyan-300 transition-colors"
            >
              Terms
            </Link>
          </nav>

          {/* Contact & Data */}
          <div className="flex items-center gap-3 text-[10px]">
            <a
              href="mailto:k.sathyaseelan2006@gmail.com"
              className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
              title="Email: k.sathyaseelan2006@gmail.com"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden md:inline">Contact</span>
            </a>
            <a
              href="https://github.com/sathyaseelan2006"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
              title="GitHub: @sathyaseelan2006"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              <span className="hidden md:inline">GitHub</span>
            </a>
            <span className="text-gray-600 hidden sm:inline">·</span>
            <span className="text-gray-500 hidden sm:inline">IQAir · OpenAQ · WAQI · NASA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
