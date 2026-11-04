import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  // Randomize between background1.jpg and background2.jpg and alternate on subsequent visits
  const [heroBg] = useState(() => {
    const images = ['/background1.jpg', '/background2.jpg'];
    try {
      const last = sessionStorage.getItem('parkinson_hero_bg');
      let nextIndex;
      if (last !== null) {
        nextIndex = last === '0' ? 1 : 0;
      } else {
        nextIndex = Math.random() < 0.5 ? 0 : 1;
      }
      sessionStorage.setItem('parkinson_hero_bg', String(nextIndex));
      return images[nextIndex];
    } catch (e) {
      return Math.random() < 0.5 ? '/background1.jpg' : '/background2.jpg';
    }
  });

  return (
    <section className="w-full relative flex flex-col items-center justify-center bg-black text-white pt-20 pb-12 md:pb-20 overflow-hidden">
      
      {/* Grand Elliptical Hero Container */}
      <div 
        className="relative w-full min-h-[75vh] md:min-h-[85vh] lg:min-h-[88vh] flex flex-col items-center justify-center px-6 sm:px-8 text-center overflow-hidden"
        style={{
          clipPath: "ellipse(60% 80% at 50% 20%)",
          WebkitClipPath: "ellipse(60% 80% at 50% 20%)"
        }}
      >
        <img 
          src={heroBg} 
          alt="Classical Neoclassical Roman Architecture" 
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.12]"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/75 pointer-events-none" />

        {/* Centered Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center px-4 -mt-6 sm:-mt-8">
          
          {/* Top Inscriptional Pill Badge */}
          {/* <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/25 backdrop-blur-md mb-6 shadow-2xl"
          >
            <img src="/parkinson.svg" alt="Stoic Emblem" className="w-4 h-4 object-contain filter invert" />
            <span className="font-cinzel text-[10px] sm:text-xs font-bold tracking-[0.28em] uppercase text-zinc-200">
              A Temple Of Unbroken Discipline
            </span>
          </motion.div> */}

          <motion.h1 
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: "'Bodoni Moda', 'Didot', 'Bodoni MT', Georgia, serif", fontOpticalSizing: "auto" }}
            className="font-bodoni text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[0.08em] uppercase text-white font-normal leading-none mb-4 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
          >
            ParkIn'son.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            style={{ fontFamily: "'Bodoni Moda', Georgia, serif", fontStyle: "italic" }}
            className="font-bodoni italic text-xl sm:text-2xl md:text-3xl lg:text-4xl text-zinc-200 font-light tracking-wide mb-3 drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]"
          >
            Master Your Mind. Conquer Your Time.
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45 }}
            style={{ fontFamily: "'Cinzel', Georgia, serif" }}
            className="font-cinzel text-xs sm:text-sm tracking-[0.3em] uppercase text-zinc-300 font-semibold mb-8 drop-shadow-md"
          >
            Caesarem Decet Stantem Mori • Virtus & Ratio
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto font-cinzel text-xs uppercase tracking-widest font-bold px-8 py-4 rounded-md bg-white hover:bg-zinc-200 text-black transition-all duration-300 shadow-[0_0_35px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
            >
              <span>Initiate Focus</span>
              <span className="text-base leading-none">&rarr;</span>
            </button>

            <button
              onClick={() => {
                const target = document.getElementById("dashboard-section");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="w-full sm:w-auto font-cinzel text-xs uppercase tracking-widest font-semibold px-8 py-4 rounded-md border border-white/30 bg-black/60 hover:bg-black/80 hover:border-white/60 text-white backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg"
            >
              <span>Explore The Sanctum</span>
            </button>
          </motion.div>

        </div>

      </div>

    </section>
  );
};

export default Hero;