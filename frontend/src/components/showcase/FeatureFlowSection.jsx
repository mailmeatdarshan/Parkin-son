import React, { useRef, useState, useEffect } from 'react';
import { Lottie } from 'lottie-react';
import lottiePatternData from '../../assets/lottiepattern.json';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Flame, Clock, Grid, User, Users, Trophy, BarChart2, Settings,
  Calendar, Activity, Target, TrendingUp, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const topIcons = [
  { name: 'Streaks', icon: Flame },
  { name: 'Focus Time', icon: Clock },
  { name: 'Heatmap', icon: Grid },
  { name: 'Profile', icon: User },
  { name: 'Follow', icon: Users },
  { name: 'Leaderboard', icon: Trophy },
  { name: 'Analytics', icon: BarChart2 },
  { name: 'Settings', icon: Settings },
];

const features = [
  {
    title: 'Track Everything',
    desc: 'Every focus session, task, and minute is automatically tracked.',
    icon: Calendar
  },
  {
    title: 'Understand Patterns',
    desc: 'Heatmaps and analytics reveal your habits and productivity trends.',
    icon: Activity
  },
  {
    title: 'Compete & Connect',
    desc: 'Follow others, compare stats, and climb the global leaderboard.',
    icon: Users
  },
  {
    title: 'Build Consistency',
    desc: 'Grow streaks, earn achievements, and improve a little every day.',
    icon: Target
  }
];

const LottieWrapper = ({ animationData }) => {
  return (
    <Lottie
      src={animationData}
      loop={true}
      autoplay={true}
      className="w-full h-full p-1 sm:p-2 invert"
      rendererSettings={{
        preserveAspectRatio: 'xMidYMid meet'
      }}
    />
  );
};

const FeatureCard = ({ feature, index, isEven, scrollDir, onBranchActive }) => {
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["center center", "end center"] 
  });

  const leftPos = useTransform(scrollYProgress, [0, 1], ["100%", "0%"]);
  const rightPos = useTransform(scrollYProgress, [0, 1], ["100%", "0%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      const isActive = latest > 0.05 && latest < 0.95;
      onBranchActive(index, isActive);
    });
  }, [scrollYProgress, index, onBranchActive]);

  return (
    <div ref={ref} className={`relative flex w-full ${isEven ? 'md:justify-start' : 'md:justify-end'} ${index > 0 ? 'md:-mt-12 lg:-mt-14' : ''} z-10`}>
      
      {/* Horizontal Connector Line (Desktop Only) */}
      <div 
        className="hidden md:block absolute top-1/2 -translate-y-1/2 border-t-2 border-dashed border-zinc-700"
        style={{
          left: isEven ? '45%' : '49.5%',
          right: isEven ? '49.5%' : '45%',
          zIndex: -1
        }}
      >
         {/* Branching Animated Scroll Arrow */}
         <motion.div
           style={{
             position: 'absolute',
             top: '50%',
             translateY: '-50%',
             left: isEven ? leftPos : 'auto',
             right: !isEven ? rightPos : 'auto',
             opacity: opacity,
           }}
           className="z-20 flex items-center justify-center bg-black px-1"
         >
           <motion.div
             animate={{ 
               opacity: scrollDir === 'up' ? 0 : 1,
               rotate: isEven 
                 ? (scrollDir === 'down' ? 90 : -90)
                 : (scrollDir === 'down' ? -90 : 90)
             }}
             transition={{ duration: 0.2 }}
           >
             <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] border-t-zinc-400"></div>
           </motion.div>
         </motion.div>
      </div>
      
      <div className="w-full md:w-[45%] bg-zinc-950/90 border border-zinc-800/90 rounded-[24px] p-4 lg:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between gap-2 group hover:shadow-xl hover:border-zinc-500 transition-all">
        
        <h4 className="font-bodoni font-normal text-white text-[20px] lg:text-[22px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">
          {feature.title}
        </h4>
        
        <div className="flex justify-between items-center gap-4 mt-1">
          <p className="text-zinc-400 text-[13px] lg:text-[14px] font-sans leading-relaxed w-[45%]">
            {feature.desc}
          </p>
          
          <div className="relative w-[50%] max-w-[240px] h-[90px] sm:h-[110px] bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-inner group-hover:-translate-y-1 transition-all duration-300 overflow-hidden shrink-0 grayscale contrast-[1.08]">
            {index === 0 ? (
              <video autoPlay muted loop playsInline webkit-playsinline="true" className="w-full h-full object-cover">
                <source src="/1st.webm" type="video/webm" />
              </video>
            ) : index === 1 ? (
              <LottieWrapper animationData={lottiePatternData} />
            ) : index === 2 ? (
              <video autoPlay muted loop playsInline webkit-playsinline="true" className="w-full h-full object-cover">
                <source src="/2nd.webm" type="video/webm" />
              </video>
            ) : index === 3 ? (
              <video autoPlay muted loop playsInline webkit-playsinline="true" className="w-full h-full object-cover">
                <source src="/4.webm" type="video/webm" />
              </video>
            ) : (
              <feature.icon size={36} className="text-zinc-300" strokeWidth={1.5} />
            )}

            {/* Black & White Stoic Theme Overlay */}
            <div className="absolute inset-0 bg-black/25 pointer-events-none" />
          </div>
        </div>
        
      </div>
    </div>
  );
};

const FeatureFlowSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const [scrollDir, setScrollDir] = useState('down');
  const [activeBranches, setActiveBranches] = useState({});
  
  const handleBranchActive = React.useCallback((index, isActive) => {
    setActiveBranches(prev => {
      if (prev[index] === isActive) return prev;
      return { ...prev, [index]: isActive };
    });
  }, []);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      const prev = scrollY.getPrevious();
      if (latest > prev) setScrollDir('down');
      else if (latest < prev) setScrollDir('up');
    });
  }, [scrollY]);

  const arrowTop = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="w-screen min-h-screen bg-black flex flex-col justify-start pt-20 md:pt-[10vh] lg:pt-[12vh] pb-8 relative overflow-hidden shrink-0" id="feature-flow-section">
      {/* Applying scale to fit screen and ensure it clears the top nav */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center origin-top scale-95 md:scale-[0.75] lg:scale-[0.80]">
        
        {/* Top Icons Row */}
        <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-between gap-2 md:gap-0 w-full max-w-3xl mb-4 relative z-10">
          
          {/* Master SVG overlay for all connecting lines */}
          <div className="absolute top-[64px] left-0 w-full h-[60px] pointer-events-none -z-10 hidden md:block">
            <style>
              {`
                @keyframes dashFlow {
                  from { stroke-dashoffset: 100; }
                  to { stroke-dashoffset: 0; }
                }
                .animate-flow {
                  animation: dashFlow 1.2s linear infinite;
                }
              `}
            </style>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {topIcons.map((_, index) => {
                const startX = 3.125 + index * 13.39;
                
                // Calculate number of dashes based on path length (distance from center)
                const distFromCenter = Math.abs(index - 3.5);
                const numDashes = distFromCenter > 1.5 ? 5 : 3; 
                
                // pathLength="100" normalizes the total length to 100
                const patternLength = 100 / numDashes;
                const dashLength = 4; // Length of the dash
                const gapLength = patternLength - dashLength;
                
                return (
                  <React.Fragment key={index}>
                    {/* Background track line */}
                    <path 
                      d={`M ${startX} 0 C ${startX} 50, 50 60, 50 100`} 
                      stroke="#27272a" strokeWidth="1.5" fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                    {/* Animated flowing dashed line */}
                    <path 
                      d={`M ${startX} 0 C ${startX} 50, 50 60, 50 100`} 
                      stroke="#ffffff" strokeWidth="2.5" strokeDasharray={`${dashLength} ${gapLength}`} fill="none"
                      vectorEffect="non-scaling-stroke"
                      pathLength="100"
                      className="animate-flow"
                    />
                  </React.Fragment>
                );
              })}
            </svg>
          </div>

          {topIcons.map((item, index) => (
            <div key={index} className="w-[64px] h-[64px] border border-zinc-800 bg-zinc-950/80 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-zinc-500 hover:bg-zinc-900 transition-all relative z-20 cursor-default shadow-sm shadow-black">
              <item.icon size={22} strokeWidth={1.5} className="text-zinc-500 group-hover:text-white transition-colors" />
              <span className="text-[10px] font-cinzel font-semibold text-zinc-400 capitalize group-hover:text-white transition-colors">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Central CTA Button */}
        <div className="relative z-20 mb-6">
          <Link to="/signup" className="group block">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 px-8 py-3.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] flex flex-col items-center transition-all"
            >
              <h3 className="font-cinzel text-white text-2xl font-bold tracking-widest mb-0.5 flex items-center gap-3">
                Parkin'son
              </h3>
              <p className="font-cinzel text-zinc-400 text-xs font-semibold tracking-widest uppercase">The Indomitable Sanctum</p>
            </motion.div>
          </Link>
          {/* SVG line down from CTA */}
          <div className="absolute left-1/2 top-full w-px h-8 bg-transparent -translate-x-1/2">
             <svg width="2" height="32" className="absolute top-0 left-0">
               <line x1="1" y1="0" x2="1" y2="32" stroke="#71717a" strokeWidth="2" strokeDasharray="4 4" />
             </svg>
          </div>
        </div>

        {/* Alternating Timeline Feature Flow */}
        <div ref={containerRef} className="flex flex-col gap-6 md:gap-0 w-full relative z-10 pb-4 mt-4">
          
          {/* Center Vertical Dashed Line (Desktop Only) */}
          <div className="hidden md:block absolute left-1/2 top-0 -bottom-32 w-px border-l-2 border-dashed border-zinc-700 -translate-x-1/2 z-0">
            {/* Upward Scroll Arrow Only */}
            <motion.div 
              style={{ top: arrowTop }}
              animate={{ opacity: scrollDir === 'up' ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 -translate-x-1/2 -ml-[1px] z-20 flex items-center justify-center bg-black py-1.5"
            >
               <motion.div
                 animate={{ rotate: scrollDir === 'down' ? 0 : 180 }}
                 transition={{ duration: 0.3 }}
               >
                 <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] border-t-white"></div>
               </motion.div>
            </motion.div>
          </div>

          {features.map((feature, index) => {
            const isEven = index % 2 === 0;
            return (
              <FeatureCard 
                key={index} 
                feature={feature} 
                index={index} 
                isEven={isEven} 
                scrollDir={scrollDir} 
                onBranchActive={handleBranchActive}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default FeatureFlowSection;
