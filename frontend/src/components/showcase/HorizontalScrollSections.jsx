import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';
import ArchitectureSection from './ArchitectureSection';
import ProgressSection from './ProgressSection';
import FeatureFlowSection from './FeatureFlowSection';

const HorizontalScrollSections = () => {
  const targetRef = useRef(null);
  
  // Track scroll within the 300vh section
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  // Move horizontally by -200vw (which means sliding 2 screen widths left)
  // Using vw instead of % gives the browser GPU more precise pixels to work with
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", "-200vw"]);
  
  // Progress bar animation for the 3 steps
  const indicatorX = useTransform(scrollYProgress, [0, 0.5, 1], ["0%", "100%", "200%"]);
  
  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) setActiveStep(0);
    else if (latest < 0.66) setActiveStep(1);
    else setActiveStep(2);
  });

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col bg-black">
        
        {/* Top Progress Navigation */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 flex flex-col items-center pointer-events-none px-4">
          <div className="flex w-full text-center mb-3 text-[11px] md:text-[12px] font-cinzel font-bold uppercase tracking-[0.25em]">
            <div className={`flex-1 transition-colors duration-500 ${activeStep === 0 ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-zinc-600"}`}>Vault</div>
            <div className={`flex-1 transition-colors duration-500 ${activeStep === 1 ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-zinc-600"}`}>Progress</div>
            <div className={`flex-1 transition-colors duration-500 ${activeStep === 2 ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-zinc-600"}`}>Sanctum</div>
          </div>
          <div className="w-full h-[2.5px] bg-zinc-800/90 rounded-full relative overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-white rounded-full w-1/3 shadow-[0_0_12px_rgba(255,255,255,0.9)] will-change-transform transform-gpu"
              style={{ x: indicatorX }}
            />
          </div>
        </div>

        {/* The horizontal sliding canvas */}
        {/* Added will-change-transform and transform-gpu to force hardware acceleration and eliminate jitter */}
        <motion.div style={{ x }} className="flex h-full w-[300vw] will-change-transform transform-gpu">
          <div className="w-screen h-full shrink-0 flex items-center justify-center relative">
            <ArchitectureSection />
          </div>
          <div className="w-screen h-full shrink-0 flex items-center justify-center relative">
            <ProgressSection />
          </div>
          <div className="w-screen h-full shrink-0 flex items-start justify-center relative">
            <FeatureFlowSection />
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default HorizontalScrollSections;
