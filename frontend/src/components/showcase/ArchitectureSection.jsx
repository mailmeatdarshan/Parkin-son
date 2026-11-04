import { motion } from 'framer-motion';

const ArchitectureSection = () => {
  return (
    <div className="w-screen min-h-screen md:h-screen bg-black text-zinc-100 flex flex-col justify-center relative overflow-hidden shrink-0 py-20 md:py-0" id="architecture-section">

      <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative">
          
          {/* Vertical Divider (Desktop Only) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2"></div>
          
          {/* Left Column: Text & Stoic Statue Accent */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="hidden sm:block w-36 md:w-36 h-108 md:h-108 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative group">
              <img src="/stoic3.jpg" alt="Stoic Philosopher Bust" className="w-full h-full object-cover filter grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <span className="font-cinzel text-[8px] uppercase tracking-widest text-zinc-400">Citadel</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel text-xs font-bold uppercase tracking-[0.25em] text-zinc-400 mb-2">
                The Fortress of Privacy
              </span>
              <h2 className="font-bodoni text-2xl md:text-4xl font-normal text-white mb-3 tracking-tight leading-tight">
                Create Your Sanctuary
              </h2>
              <p className="text-zinc-400 leading-relaxed text-sm md:text-[15px] font-sans">
                Mathematical client-side encryption. Your tasks, sessions, and reflections are sealed with PBKDF2 keys before leaving your device. Even we cannot penetrate your vault.
              </p>
              
              <div className="w-full h-px bg-zinc-800 my-6 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-white"></div>
              </div>

              <div className="flex flex-col gap-0.5">
                <h3 className="font-bodoni text-2xl md:text-3xl text-white">
                  Zero Knowledge
                </h3>
                <h3 className="font-bodoni text-2xl md:text-3xl italic text-zinc-400">
                  Architecture
                </h3>
              </div>
              
              <p className="mt-4 text-zinc-500 font-cinzel text-[10px] tracking-[0.2em] uppercase font-bold">
                Stoic Principle
              </p>
              <p className="mt-1 text-zinc-400 text-xs md:text-sm font-medium italic font-bodoni">
                "Confine yourself to the present. Guard your inner citadel as you would an empire."
              </p>
            </div>
          </div>

          {/* Right Column: Diagram */}
          <div className="relative w-full py-12 md:py-0 md:aspect-[4/3] bg-zinc-950/90 border border-zinc-800/90 rounded-3xl p-4 md:p-8 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">

            {/* Custom Diagram Node Container */}
            <div className="relative w-full max-w-[600px] h-[250px] md:h-[350px] z-10 px-0 md:px-12 mt-8 md:mt-12">
              
              {/* Horizontal Connecting Line */}
              <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-0 border-t-[2px] border-dashed border-zinc-700 -z-10"></div>
              
              {/* Traveling Dot */}
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_14px_rgba(255,255,255,0.9)] z-20"
                animate={{ left: ["10%", "10%", "50%", "90%", "90%"], scale: [0, 1, 1, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", times: [0, 0.05, 0.4, 0.75, 1] }}
              />

              {/* Vertical Connecting Line to Account */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[50%] top-[10%] w-0 border-l-[2px] border-dashed border-zinc-700 -z-10"></div>

              {/* Top Node (Account) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[0%] flex flex-col items-center bg-zinc-950 z-10 px-3 py-1 rounded-md border border-zinc-800/80">
                <span className="font-bodoni italic text-white text-xl font-medium tracking-wide mb-1.5">Vault Key</span>
                <div className="w-2.5 h-2.5 bg-zinc-400 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.4)]"></div>
              </div>

              {/* Node 1: Signup */}
              <div className="absolute left-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center group">
                <span className="absolute -top-10 font-cinzel text-zinc-300 text-[10px] sm:text-xs md:text-sm tracking-wider uppercase whitespace-nowrap">1. Initiate</span>
                <div className="relative w-7 h-7 flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-full z-10">
                  <div className="absolute inset-0 border border-white/40 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                  <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white absolute z-20" animate={{ scale: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.05, 0.1, 0.95, 1] }}>
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                </div>
              </div>

              {/* Node 2: Secure Your Vault */}
              <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group">
                <span className="absolute -bottom-10 md:-bottom-12 font-cinzel text-zinc-300 text-[10px] sm:text-xs md:text-sm tracking-wider uppercase text-center w-28 md:w-auto whitespace-normal md:whitespace-nowrap leading-tight">2. Seal Vault</span>
                <div className="relative w-7 h-7 bg-zinc-900 border-2 border-white rounded-full flex items-center justify-center z-10 group-hover:bg-zinc-800 transition-colors duration-300 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white absolute z-20" animate={{ scale: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.35, 0.45, 0.95, 1] }}>
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                </div>
              </div>

              {/* Node 3: Start Using Parkin'son */}
              <div className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center group">
                <span className="absolute -top-10 md:-top-12 font-cinzel text-zinc-300 text-[10px] sm:text-xs md:text-sm tracking-wider uppercase text-center w-28 md:w-auto whitespace-normal md:whitespace-nowrap leading-tight">3. Enter Sanctum</span>
                <div className="relative w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-full z-10">
                  <div className="absolute inset-0 border border-zinc-600 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                  <div className="absolute w-7 h-7 border border-white rounded-full flex items-center justify-center bg-zinc-800">
                    <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white absolute z-20" animate={{ scale: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.7, 0.8, 0.95, 1] }}>
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ArchitectureSection;
