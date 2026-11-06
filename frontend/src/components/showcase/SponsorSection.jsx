import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Heart } from 'lucide-react';

const SponsorSection = () => {
  return (
    <section className="w-full bg-black py-16 md:py-20 px-4 md:px-12 border-t border-zinc-900 text-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[28px] overflow-hidden min-h-[280px] md:min-h-[320px] bg-zinc-950 border border-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div 
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: "radial-gradient(ellipse at 80% 50%, rgba(255, 255, 255, 0.04) 0%, transparent 70%)"
            }}
          />

          {/* Background Image */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: 'url(/bheek.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
              opacity: 0.15,
              filter: 'grayscale(100%) brightness(0.6)'
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between h-full p-8 md:p-12 gap-8">
            
            {/* Left Side - Text */}
            <div className="flex-1 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <Heart size={13} className="text-red-400 fill-red-400" />
                <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-zinc-300">Patron of Parkin'son</span>
              </div>

              <h2 className="font-bodoni text-3xl md:text-[40px] leading-tight font-normal text-white mb-4 tracking-tight">
                Help Us Build The<br />Ultimate Sanctuary.
              </h2>

              <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-sans font-normal">
                Parkin'son is indie-crafted, ad-free, and private by design. Your support sustains zero-knowledge servers, empowers timeless new focus tools, and preserves an unpolluted web.
              </p>
            </div>

            {/* Right Side - Buttons */}
            <div className="flex flex-col gap-3.5 w-full md:w-auto min-w-[240px]">
              <a 
                href="https://github.com/mailmeatdarshan" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white hover:bg-zinc-200 text-black px-6 py-4 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer transition-all"
                >
                  <span>GitHub Sponsors</span>
                  <ExternalLink size={16} />
                </motion.div>
              </a>
              <a 
                href="https://github.com/mailmeatdarshan" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-6 py-4 rounded-xl font-cinzel font-semibold text-xs uppercase tracking-wider flex items-center justify-between gap-3 shadow-sm cursor-pointer transition-all"
                >
                  <span>Buy A Coffee</span>
                  <ExternalLink size={16} />
                </motion.div>
              </a>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SponsorSection;
