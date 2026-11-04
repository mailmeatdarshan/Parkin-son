import React from 'react';
import { motion } from 'framer-motion';

const ProgressSection = () => {
  return (
    <div className="w-screen min-h-screen md:h-screen bg-black text-zinc-100 flex flex-col justify-center relative overflow-hidden shrink-0 py-20 md:py-0" id="progress-section">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative">
          
          {/* Vertical Divider (Desktop Only) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2"></div>
          
          {/* Left Column: Text & Stoic Warrior Statue */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="hidden sm:block w-36 md:w-36 h-106 md:h-106 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative group">
              <img src="/stoic4.jpg" alt="Stoic Warrior Statue" className="w-full h-full object-cover object-left filter grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <span className="font-cinzel text-[8px] uppercase tracking-widest text-zinc-400">Endurance</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel text-xs font-bold uppercase tracking-[0.25em] text-zinc-400 mb-2">
                The Architecture of Habit
              </span>
              <div className="flex flex-col gap-0.5 mb-4">
                <h2 className="font-bodoni text-2xl md:text-4xl font-normal text-white tracking-tight">
                  Understand
                </h2>
                <h2 className="font-bodoni text-2xl md:text-4xl italic text-zinc-400">
                  Your Progress
                </h2>
              </div>
              
              <p className="text-zinc-400 leading-relaxed text-sm md:text-[15px] font-sans">
                Track your daily focus, identify productivity rhythms, and fortify unwavering work habits with intelligent, stone-cold insights.
              </p>
              
              <div className="w-full h-px bg-zinc-800 my-6 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-white"></div>
              </div>

              <p className="text-zinc-500 font-cinzel text-[10px] tracking-[0.2em] uppercase font-bold">
                Stoic Wisdom
              </p>
              <p className="mt-1 text-zinc-400 text-xs md:text-sm font-medium italic font-bodoni">
                "Well-being is realized by small steps, but is truly no small thing."
              </p>
              <span className="text-[10px] text-zinc-600 font-cinzel uppercase tracking-widest mt-1">
                — Zeno of Citium
              </span>
            </div>
          </div>

          {/* Right Column: Chart */}
          <div className="relative w-full aspect-[4/3] bg-zinc-950/90 border border-zinc-800/90 rounded-3xl flex items-center justify-center p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            
            <div className="relative w-full h-full max-h-[300px] flex flex-col justify-end">
              
              {/* Threshold Line */}
              <div className="absolute left-0 right-0 bottom-[60%] border-t border-dashed border-zinc-800 z-0">
                <span className="absolute right-0 -top-5 font-cinzel text-[9px] uppercase tracking-wider text-zinc-600">Peak Threshold</span>
              </div>
              
              {/* Baseline */}
              <div className="absolute left-0 right-0 bottom-0 border-t border-zinc-700 z-0"></div>

              {/* Data Lines (Bars) */}
              <div className="relative w-full h-full flex items-end justify-between px-2 z-10 pb-[1px]">
                
                {/* Regular lines */}
                <div className="w-[2px] h-[30%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[45%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[25%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[50%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[35%] bg-zinc-700 rounded-t-sm"></div>
                
                {/* Anomaly Line 1 (Peak) */}
                <div className="relative w-[2.5px] h-[85%] bg-gradient-to-t from-zinc-700 via-white/70 to-white shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                  {/* Floating Time Text */}
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-white font-cinzel text-[10px] font-bold tracking-wider uppercase whitespace-nowrap bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded shadow-sm">
                    8h 15m Peak
                  </span>
                  
                  <motion.div 
                    className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_14px_rgba(255,255,255,1)]"
                    animate={{ top: ["-12px", "100%", "60%", "100%", "80%", "100%"] }}
                    transition={{ 
                      duration: 1.8, 
                      ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"],
                      repeat: Infinity,
                      repeatDelay: 1.5
                    }}
                  />
                </div>
                
                {/* More regular lines */}
                <div className="w-[2px] h-[30%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[40%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[20%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[55%] bg-zinc-700 rounded-t-sm"></div>
                
                {/* Anomaly Line 2 */}
                <div className="relative w-[2px] h-[75%] bg-zinc-400">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full ring-4 ring-zinc-950 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                </div>

                {/* Final regular lines */}
                <div className="w-[2px] h-[40%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[25%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[35%] bg-zinc-700 rounded-t-sm"></div>
                <div className="w-[2px] h-[20%] bg-zinc-700 rounded-t-sm"></div>
              </div>
              
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProgressSection;
