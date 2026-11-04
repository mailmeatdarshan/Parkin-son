import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../apiClient';

const CtaSection = () => {
  const [displayValues, setDisplayValues] = useState([0, 0, 365]);
  const [realTargets, setRealTargets] = useState([0, 0, 365]);
  const hasAnimated = useRef(false);

  // Count-up animation function
  const animateCountUp = useCallback((targets) => {
    const duration = 1500;
    const intervalTime = 20;
    const totalSteps = duration / intervalTime;
    const increments = targets.map(t => t / totalSteps);
    let current = [0, 0, 0];
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = current.map((val, i) => {
        const next = val + increments[i];
        return next >= targets[i] ? targets[i] : next;
      });
      setDisplayValues(current.map(Math.floor));

      if (step >= totalSteps) {
        clearInterval(interval);
        setDisplayValues([...targets]);
      }
    }, intervalTime);

    return interval;
  }, []);

  // Fetch real stats from backend + poll every 30s
  useEffect(() => {
    let animInterval;

    const fetchStats = async () => {
      try {
        const res = await apiFetch('/api/auth/public-stats', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        if (json.success && json.data) {
          const targets = [
            json.data.totalUsers || 0,
            json.data.totalSessions || 0,
            365
          ];
          setRealTargets(targets);

          // First time: animate count-up. After that: just update directly
          if (!hasAnimated.current) {
            hasAnimated.current = true;
            animInterval = animateCountUp(targets);
          } else {
            setDisplayValues(targets);
          }
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        // Fallback: at least show heatmap
        if (!hasAnimated.current) {
          hasAnimated.current = true;
          animInterval = animateCountUp([0, 0, 365]);
        }
      }
    };

    fetchStats();

    // Poll every 30 seconds for live updates
    const pollInterval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(pollInterval);
      if (animInterval) clearInterval(animInterval);
    };
  }, [animateCountUp]);

  const stats = [
    { label: 'Registered Users', value: displayValues[0], suffix: '+' },
    { label: 'Sessions Logged', value: displayValues[1], suffix: '+' },
    { label: 'Consistency Heatmap', value: displayValues[2], suffix: ' Days' }
  ];

  return (
    <section className="w-full bg-black py-20 md:py-28 flex flex-col items-center justify-center border-t border-zinc-900 text-white relative overflow-hidden">
      
      {/* Subtle Ambient Radial Lighting */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%)"
        }}
      />

      {/* Subtle Stoic Statue Accent on Left (The Self-Made Man) */}
      <div 
        className="absolute left-24 top-1/2 -translate-y-1/2 w-75 md:w-88 h-[810px] pointer-events-none opacity-25 hidden lg:block z-0"
        style={{
          backgroundImage: 'url(/stoic1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) contrast(1.3) brightness(0.8)',
          maskImage: 'linear-gradient(to right, black 30%, transparent 95%), linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 95%), linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
        }}
      />

      <div className="max-w-4xl w-full px-6 flex flex-col items-center text-center relative z-10">
        
        {/* Stars and Reviews */}
        <div className="mb-5 flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} fill="#e4e4e7" className="text-zinc-200" />
            ))}
          </div>
          <p className="font-cinzel text-zinc-400 font-bold uppercase text-xs tracking-[0.2em] mt-1">
            Revered by {realTargets[0] || displayValues[0]}+ disciplined minds
          </p>
        </div>

        {/* Headlines */}
        <h2 className="font-bodoni text-4xl sm:text-5xl md:text-6xl font-normal leading-tight text-white mb-6">
          Are you prepared to master<br />
          <span className="italic font-light text-zinc-400">your inner sovereign?</span>
        </h2>
        
        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mb-12 font-sans font-normal leading-relaxed">
          Join thousands of developers, architects, and thinkers forging unbroken streaks and conquering distraction in the sanctum.
        </p>

        {/* Dynamic Stats Row */}
        <div className="w-full max-w-3xl border-t border-b border-zinc-800/80 py-8 mb-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <span className="text-4xl md:text-5xl font-bodoni font-semibold text-white mb-2">
                {stat.value.toLocaleString()}{stat.suffix}
              </span>
              <span className="text-[11px] font-cinzel font-bold text-zinc-500 tracking-[0.25em] uppercase">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/signup" className="w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto font-cinzel text-xs font-bold uppercase tracking-widest bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-md transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              Initiate Discipline &rarr;
            </motion.button>
          </Link>
          <Link to="/leaderboard" className="w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto font-cinzel text-xs font-semibold uppercase tracking-widest bg-zinc-950 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-zinc-300 hover:text-white px-8 py-4 rounded-md transition-all cursor-pointer"
            >
              View Pantheon
            </motion.button>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default CtaSection;
