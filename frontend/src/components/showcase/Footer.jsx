import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-black border-t border-zinc-900 pt-16 pb-12 px-6 md:px-12 text-zinc-400">
      <div className="max-w-6xl mx-auto">

        {/* Top Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-4 md:mb-0">
            <img src="/parkinson.svg" alt="Parkin'son Logo" className="w-5 h-5 object-contain filter invert" />
            <h3 className="font-cinzel text-xl font-bold text-white tracking-widest">
              Parkin'son
            </h3>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-5">
            {/* GitHub */}
            <a 
              href="https://github.com/mailmeatdarshan" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-8 mb-8 font-cinzel text-xs tracking-widest uppercase">
          <span onClick={() => { document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" }); }} className="cursor-pointer text-zinc-400 hover:text-white transition-colors">Sanctum</span>
          <span onClick={() => { document.getElementById("dashboard-section")?.scrollIntoView({ behavior: "smooth" }); }} className="cursor-pointer text-zinc-400 hover:text-white transition-colors">Features</span>
          <span onClick={() => { document.getElementById("leaderboard-section")?.scrollIntoView({ behavior: "smooth" }); }} className="cursor-pointer text-zinc-400 hover:text-white transition-colors">Pantheon</span>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-zinc-900 mb-8"></div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-zinc-500">
          <p className="font-cinzel tracking-wider">
            © 2026 Parkin'son. An immovable sanctuary for deep focus.
          </p>
          <p className="font-sans">
            Crafted with discipline by{' '}
            <a 
              href="https://github.com/mailmeatdarshan" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-zinc-200 hover:text-white font-bodoni italic font-medium text-sm transition-colors"
            >
              Darshan Dubey
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
