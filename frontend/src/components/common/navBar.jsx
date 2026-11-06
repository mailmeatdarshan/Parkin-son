import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleScroll = (id) => {
    if (id === "features") {
      id = window.innerWidth >= 768 ? "features-desktop-anchor" : "features-mobile-anchor";
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const navigateToLogin = () => {
    navigate("/login");
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[999] bg-transparent pointer-events-none">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6 pointer-events-auto">
        
        {/* LOGO */}
        <div
          onClick={() => handleScroll("hero-section")}
          className="cursor-pointer text-xl md:text-2xl font-cinzel font-bold tracking-wider select-none text-white"
        >
          <span className="inline-flex items-center gap-2.5">
            <img src="/parkinson.svg" alt="Parkin'son Logo" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            <span className="tracking-[0.1em]">Parkin'son</span>
          </span>
        </div>
        
        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex items-center gap-8 text-[13px] uppercase tracking-widest font-cinzel text-zinc-400">
          <span
            onClick={() => handleScroll("hero-section")}
            className="cursor-pointer hover:text-white transition-colors"
          >
            Sanctum
          </span>
          <span
            onClick={() => handleScroll("features")}
            className="cursor-pointer hover:text-white transition-colors"
          >
            Features
          </span>
          <span
            onClick={() => handleScroll("leaderboard-section")}
            className="cursor-pointer hover:text-white transition-colors"
          >
            Pantheon
          </span>
          
          <button 
            onClick={navigateToLogin}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-100 font-cinzel text-[12px] tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-black/50"
          >
            LOGIN <span className="text-base leading-none">&rarr;</span>
          </button>
        </div>
        
        {/* Mobile Hamburger Trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden p-2.5 rounded-full pointer-events-auto text-zinc-200 hover:text-white bg-transparent"
        >
          <Menu size={24} />
        </button>
        
      </div>
      
      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-20 right-4 h-fit w-[200px] sm:w-[220px] bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/[0.15] rounded-[32px] p-5 z-50 md:hidden flex flex-col gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto origin-top-right"
            >
              
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.038] mix-blend-overlay z-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
              />
              
              <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div
                    style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    className="text-xl font-cinzel font-bold text-white tracking-wider select-none flex items-center gap-2"
                  >
                    <img src="/parkinson.svg" alt="Parkin'son Logo" className="w-5 h-5 object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]" />
                    <span>Parkin'son</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-zinc-400 hover:text-white p-1 rounded-full bg-white/5 border border-white/5 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-3 font-cinzel text-xs tracking-wider">
                  <span
                    onClick={() => handleScroll("hero-section")}
                    className="cursor-pointer font-medium text-zinc-300 hover:text-white bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 transition-all duration-200 block shadow-inner"
                  >
                    Sanctum
                  </span>
                  <span
                    onClick={() => handleScroll("features")}
                    className="cursor-pointer font-medium text-zinc-300 hover:text-white bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 transition-all duration-200 block shadow-inner"
                  >
                    Features
                  </span>
                  <span
                    onClick={() => handleScroll("leaderboard-section")}
                    className="cursor-pointer font-medium text-zinc-300 hover:text-white bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 transition-all duration-200 block shadow-inner"
                  >
                    Pantheon
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mb-4 relative z-10 font-cinzel">
                <button 
                  onClick={navigateToLogin}
                  className="w-full text-center text-xs font-bold text-white uppercase tracking-wider px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  LOGIN <span className="text-base leading-none">&rarr;</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;