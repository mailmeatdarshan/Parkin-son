import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hourglass,
  Clock,
  Sparkle,
  Star,
  PencilSimple,
  Trash,
  Plus,
  X,
  Sliders,
  Check,
  CalendarBlank,
  Fire,
  Heartbeat,
  Briefcase,
  GraduationCap,
  AirplaneTilt,
  Flag,
  CaretRight,
  Quotes,
  ArrowsOut,
  ArrowsIn,
  Target
} from '@phosphor-icons/react';
import { apiFetch } from '../../apiClient';

// STOIC TIME REFLECTIONS
const QUOTES = [
  { text: "You could leave life right now. Let that determine what you do and say and think.", author: "Marcus Aurelius" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "Life is long if you know how to use it.", author: "Seneca" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" }
];

const CATEGORIES = [
  { id: 'milestone', label: 'Milestone', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', icon: Star },
  { id: 'career', label: 'Career', color: '#5278E8', bg: 'rgba(82, 120, 232, 0.15)', border: 'rgba(82, 120, 232, 0.4)', icon: Briefcase },
  { id: 'personal', label: 'Personal', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', icon: Sparkle },
  { id: 'health', label: 'Health', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', icon: Heartbeat },
  { id: 'education', label: 'Education', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', icon: GraduationCap },
  { id: 'travel', label: 'Travel', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', icon: AirplaneTilt },
];

const LifeView = ({ onNavigateToSettings }) => {
  // DOB & Lifespan state
  const [dob, setDob] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('app_user_dob') || '') : '';
  });
  const [lifespan, setLifespan] = useState(() => {
    return typeof window !== 'undefined' ? (Number(localStorage.getItem('app_user_lifespan')) || 90) : 90;
  });

  // Milestones state: [{ id, age, week, title, note, category, color, date }]
  const [milestones, setMilestones] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('app_user_milestones');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // View Scope: 'full' (all 90 years, fits on screen) | 'era' (current life era, e.g. 20s/30s) | 'decades' (10-year chunks)
  const [viewScope, setViewScope] = useState('full');
  const [selectedDecadeIndex, setSelectedDecadeIndex] = useState(2); // default decade (e.g. 20s)

  // Setup / Edit Modal State
  const [showDobModal, setShowDobModal] = useState(false);
  const [tempDob, setTempDob] = useState(dob);
  const [tempLifespan, setTempLifespan] = useState(lifespan);

  // Hovered tile tooltip state
  const [hoveredWeek, setHoveredWeek] = useState(null);

  // Selected tile modal state (for viewing/adding milestones)
  const [selectedTile, setSelectedTile] = useState(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    category: 'milestone',
    note: ''
  });

  // Quote cycle
  const [quoteIndex, setQuoteIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 14000);
    return () => clearInterval(timer);
  }, []);

  // Sync user profile on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await apiFetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.user.dob && !dob) {
              const formattedDob = typeof data.user.dob === 'string' ? data.user.dob.split('T')[0] : '';
              setDob(formattedDob);
              setTempDob(formattedDob);
              localStorage.setItem('app_user_dob', formattedDob);
            }
            if (data.user.expectedLifespan) {
              setLifespan(data.user.expectedLifespan);
              setTempLifespan(data.user.expectedLifespan);
              localStorage.setItem('app_user_lifespan', String(data.user.expectedLifespan));
            }
            if (Array.isArray(data.user.lifeMilestones) && data.user.lifeMilestones.length > 0) {
              setMilestones(data.user.lifeMilestones);
              localStorage.setItem('app_user_milestones', JSON.stringify(data.user.lifeMilestones));
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync life view settings:', err);
      }
    };
    fetchUserData();
  }, []);

  // Save DOB / Lifespan handler
  const handleSaveDobSettings = async (e) => {
    if (e) e.preventDefault();
    if (!tempDob) return;

    setDob(tempDob);
    setLifespan(tempLifespan);
    localStorage.setItem('app_user_dob', tempDob);
    localStorage.setItem('app_user_lifespan', String(tempLifespan));
    setShowDobModal(false);

    try {
      await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dob: tempDob,
          expectedLifespan: Number(tempLifespan)
        })
      });
    } catch (err) {
      console.error('Failed to persist DOB to backend profile:', err);
    }
  };

  // Save Milestones
  const persistMilestones = async (newMilestones) => {
    setMilestones(newMilestones);
    localStorage.setItem('app_user_milestones', JSON.stringify(newMilestones));
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lifeMilestones: newMilestones
        })
      });
    } catch (err) {
      console.error('Failed to sync milestones to backend:', err);
    }
  };

  // Life statistics calculation
  const lifeStats = useMemo(() => {
    if (!dob) {
      return {
        hasDob: false,
        totalWeeks: lifespan * 52,
        weeksLived: 0,
        weeksLeft: lifespan * 52,
        percentLived: 0,
        currentAge: 0,
        currentAgeExact: '0.0',
        birthDate: null,
      };
    }

    const birthDate = new Date(`${dob}T00:00:00`);
    const today = new Date();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const diffMs = Math.max(0, today.getTime() - birthDate.getTime());
    const weeksLived = Math.floor(diffMs / oneWeekMs);
    const totalWeeks = lifespan * 52;
    const weeksLeft = Math.max(0, totalWeeks - weeksLived);
    const percentLived = Math.min(100, Math.max(0, (weeksLived / totalWeeks) * 100));
    const currentAge = Math.floor(weeksLived / 52);
    const currentAgeExact = (weeksLived / 52).toFixed(1);

    return {
      hasDob: true,
      totalWeeks,
      weeksLived,
      weeksLeft,
      percentLived,
      currentAge,
      currentAgeExact,
      birthDate,
    };
  }, [dob, lifespan]);

  // Set default decade based on current age
  useEffect(() => {
    if (lifeStats.hasDob) {
      const dec = Math.min(8, Math.floor(lifeStats.currentAge / 10));
      setSelectedDecadeIndex(dec);
    }
  }, [lifeStats.hasDob, lifeStats.currentAge]);

  // Determine rows array based on viewScope (fits 100% on screen without scroll)
  const rows = useMemo(() => {
    const list = [];
    if (viewScope === 'full') {
      // All 90 rows (rendered in micro-density so it fits 100% on screen!)
      for (let age = 0; age < lifespan; age++) {
        list.push(age);
      }
    } else if (viewScope === 'era') {
      // Current Life Era: 15 years centered on user's current age (e.g. 18-33, or 20-35)
      const start = Math.max(0, lifeStats.currentAge - 5);
      const end = Math.min(lifespan, start + 18);
      for (let age = start; age < end; age++) {
        list.push(age);
      }
    } else {
      // 10-Year Decade chunk
      const start = selectedDecadeIndex * 10;
      const end = Math.min(lifespan, start + 10);
      for (let age = start; age < end; age++) {
        list.push(age);
      }
    }
    return list;
  }, [viewScope, lifespan, lifeStats.currentAge, selectedDecadeIndex]);

  // Format date range for specific week
  const getWeekDateRange = useCallback((age, week) => {
    if (!lifeStats.birthDate) return '';
    const weekIndex = age * 52 + week;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const startDate = new Date(lifeStats.birthDate.getTime() + weekIndex * oneWeekMs);
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);

    const sMonth = startDate.toLocaleString('default', { month: 'short' });
    const eMonth = endDate.toLocaleString('default', { month: 'short' });
    const sYear = startDate.getFullYear();
    const eYear = endDate.getFullYear();

    if (sYear === eYear) {
      return `${sMonth} ${startDate.getDate()} – ${eMonth} ${endDate.getDate()}, ${sYear}`;
    }
    return `${sMonth} ${startDate.getDate()}, ${sYear} – ${eMonth} ${endDate.getDate()}, ${eYear}`;
  }, [lifeStats.birthDate]);

  // Add Milestone Handler
  const handleAddMilestone = () => {
    if (!selectedTile || !milestoneForm.title.trim()) return;
    const cat = CATEGORIES.find(c => c.id === milestoneForm.category) || CATEGORIES[0];
    const newEntry = {
      id: `ms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      age: selectedTile.age,
      week: selectedTile.week,
      title: milestoneForm.title.trim(),
      category: milestoneForm.category,
      color: cat.color,
      note: milestoneForm.note.trim(),
      date: getWeekDateRange(selectedTile.age, selectedTile.week)
    };

    const updated = [...milestones, newEntry];
    persistMilestones(updated);
    setMilestoneForm({ title: '', category: 'milestone', note: '' });
    setIsAddingMilestone(false);
  };

  // Delete Milestone Handler
  const handleDeleteMilestone = (milestoneId) => {
    const updated = milestones.filter(m => m.id !== milestoneId);
    persistMilestones(updated);
  };

  // ONBOARDING SETUP (When no DOB is configured yet)
  if (!lifeStats.hasDob) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-[#08080A] text-white overflow-hidden select-none relative">
        <div className="max-w-[460px] w-full bg-[#0E0F14] border border-white/[0.08] rounded-2xl p-7 text-center shadow-2xl relative">
          <div className="w-12 h-12 rounded-xl bg-[#5278E8]/15 border border-[#5278E8]/30 flex items-center justify-center text-[#5278E8] mx-auto mb-4">
            <Hourglass size={24} weight="duotone" className="animate-pulse" />
          </div>

          <h2 className="text-[20px] font-black tracking-tight text-white">Your Life in Weeks</h2>
          <p className="text-[13px] text-zinc-400 mt-1.5 leading-relaxed">
            4,680 weeks of human life. Enter your birthdate to map your existence into a single visual canvas.
          </p>

          <form onSubmit={handleSaveDobSettings} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                required
                value={tempDob}
                onChange={(e) => setTempDob(e.target.value)}
                className="w-full bg-[#14151B] border border-white/[0.1] text-white px-3.5 py-2.5 rounded-xl text-[13px] font-mono focus:outline-none focus:border-[#5278E8]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                <span className="text-zinc-400 uppercase tracking-wider">Lifespan Target</span>
                <span className="text-[#5278E8] font-bold">{tempLifespan} Years</span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                step="1"
                value={tempLifespan}
                onChange={(e) => setTempLifespan(Number(e.target.value))}
                className="w-full accent-[#5278E8] cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-[#5278E8] hover:bg-[#4367D4] text-white font-bold py-2.5 px-4 rounded-xl text-[13px] transition-all shadow-lg shadow-[#5278E8]/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkle size={15} weight="bold" />
              <span>Generate Life Matrix</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col justify-between bg-[#08080A] text-white overflow-hidden select-none p-3 md:px-6 md:py-3.5 relative">
      {/* 1. MINIMALIST MEMENTO MORI HUD HEADER (Height: ~42px) */}
      <div className="flex items-center justify-between gap-3 shrink-0 pb-2.5 border-b border-white/[0.06] z-10">
        {/* Left: Matrix Title & Live Week Beacon */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5278E8] shadow-[0_0_10px_#5278E8] animate-pulse" />
            <span className="font-mono font-black text-[12px] md:text-[13px] tracking-[0.18em] uppercase text-white">
              Life Matrix
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-zinc-300">
            <span className="text-[#5278E8] font-bold">Week {lifeStats.weeksLived}</span>
            <span className="text-zinc-600">/</span>
            <span>{lifeStats.totalWeeks}</span>
          </div>

          <div className="hidden md:flex items-center text-[11px] font-mono text-zinc-400">
            <span>Age {lifeStats.currentAgeExact} yrs</span>
          </div>
        </div>

        {/* Center: Sleek Life Tape Progress Bar */}
        <div className="flex-1 max-w-[340px] hidden lg:flex flex-col gap-1 mx-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="text-[#5278E8] font-bold">{lifeStats.weeksLived} lived ({lifeStats.percentLived.toFixed(1)}%)</span>
            <span>{lifeStats.weeksLeft} left</span>
          </div>
          <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden p-0.5 border border-white/[0.04] flex items-center">
            <div
              className="bg-gradient-to-r from-[#5278E8] to-[#819BE8] h-full rounded-full shadow-[0_0_8px_rgba(82,120,232,0.8)]"
              style={{ width: `${lifeStats.percentLived}%` }}
            />
          </div>
        </div>

        {/* Right: View Scope Switcher & Config Button */}
        <div className="flex items-center gap-2">
          {/* Scope Segmented Control */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-white/[0.08]">
            <button
              onClick={() => setViewScope('full')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                viewScope === 'full'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="View all 90 years at a glance (zero scrolling)"
            >
              Full (90y)
            </button>
            <button
              onClick={() => setViewScope('era')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                viewScope === 'era'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Zoom into your current life era"
            >
              Current Era
            </button>
            <button
              onClick={() => setViewScope('decades')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                viewScope === 'decades'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Inspect 10-year decade chunks"
            >
              Decades
            </button>
          </div>

          {/* Quick Decade Selector if in decades mode */}
          {viewScope === 'decades' && (
            <select
              value={selectedDecadeIndex}
              onChange={(e) => setSelectedDecadeIndex(Number(e.target.value))}
              className="bg-[#121318] border border-white/[0.1] text-white text-[11px] font-mono rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <option key={i} value={i}>
                  Ages {i * 10}–{i * 10 + 10}
                </option>
              ))}
            </select>
          )}

          {/* Edit DOB pill */}
          <button
            onClick={() => {
              setTempDob(dob);
              setTempLifespan(lifespan);
              setShowDobModal(true);
            }}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Edit Date of Birth & Lifespan"
          >
            <PencilSimple size={13} />
          </button>
        </div>
      </div>

      {/* 2. THE CHRONO MATRIX (FITS 100% IN VIEWPORT WITHOUT SCROLLING) */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative my-1">
        <div className="flex flex-col items-center justify-center max-h-full">
          {/* Week Columns Ruler (Weeks 1 to 52) */}
          <div className="flex items-center pl-10 md:pl-12 mb-1.5">
            <div
              className="flex justify-between text-[9px] md:text-[10px] font-mono text-zinc-500 font-bold tracking-wider"
              style={{
                width: viewScope === 'full'
                  ? 'clamp(440px, 62vw, 680px)'
                  : 'clamp(520px, 70vw, 840px)'
              }}
            >
              <span>W1 (JAN)</span>
              <span>W13 (Q1)</span>
              <span>W26 (MID)</span>
              <span>W39 (Q3)</span>
              <span>W52 (DEC)</span>
            </div>
          </div>

          {/* Matrix Rows (Ages) */}
          <div
            className="flex flex-col overflow-hidden"
            style={{
              gap: viewScope === 'full' ? '1.5px' : '3.5px'
            }}
          >
            {rows.map((age) => {
              const isDecade = age % 10 === 0;

              // Tile dimensions calculated so 90 rows fit inside ~520px height perfectly
              const tileHeightClass = viewScope === 'full'
                ? 'h-[4.5px] sm:h-[5.5px] md:h-[6px]'
                : viewScope === 'era'
                ? 'h-[16px] sm:h-[18px]'
                : 'h-[22px] sm:h-[26px]';

              const tileWidthClass = viewScope === 'full'
                ? 'w-[7px] sm:w-[9px] md:w-[11px]'
                : viewScope === 'era'
                ? 'w-[10px] sm:w-[12px] md:w-[14px]'
                : 'w-[12px] sm:w-[14px] md:w-[16px]';

              const tileRadius = viewScope === 'full' ? 'rounded-[1px]' : 'rounded-[2px]';

              return (
                <div key={age} className="flex items-center group/row">
                  {/* Left Age Marker */}
                  <div
                    className={`w-10 md:w-12 text-right pr-2.5 font-mono select-none transition-colors ${
                      isDecade
                        ? 'text-white font-bold text-[10px]'
                        : viewScope === 'full'
                        ? 'text-transparent group-hover/row:text-zinc-500 text-[9px]'
                        : 'text-zinc-500 text-[10px]'
                    }`}
                  >
                    {isDecade || viewScope !== 'full' ? `${age}` : ''}
                  </div>

                  {/* 52 Week Tiles in Current Row */}
                  <div
                    className="flex"
                    style={{
                      gap: viewScope === 'full' ? '1.5px' : '3px'
                    }}
                  >
                    {Array.from({ length: 52 }).map((_, weekIndex) => {
                      const absoluteWeekIndex = age * 52 + weekIndex;
                      const isPast = absoluteWeekIndex < lifeStats.weeksLived;
                      const isCurrent = absoluteWeekIndex === lifeStats.weeksLived;
                      const isFuture = absoluteWeekIndex > lifeStats.weeksLived;

                      const weekMilestones = milestones.filter(
                        (m) => m.age === age && m.week === weekIndex
                      );
                      const hasMilestone = weekMilestones.length > 0;

                      // Minimalist Brutalist Palette
                      let tileClass = 'bg-[#0B0C10] border border-white/[0.05] hover:border-white/40';

                      if (hasMilestone) {
                        tileClass = 'bg-gradient-to-tr from-[#D97706] to-[#F59E0B] border border-[#FDE68A] shadow-[0_0_8px_rgba(245,158,11,0.8)] z-10';
                      } else if (isCurrent) {
                        tileClass = 'bg-[#5278E8] shadow-[0_0_12px_#5278E8,0_0_20px_rgba(82,120,232,0.8)] ring-1.5 ring-white z-20 animate-pulse';
                      } else if (isPast) {
                        tileClass = 'bg-[#181C2B] border border-[#262C42]/60 hover:bg-[#2A3350] hover:border-[#5278E8]';
                      }

                      return (
                        <div
                          key={weekIndex}
                          onClick={() => {
                            setSelectedTile({
                              age,
                              week: weekIndex,
                              absoluteWeekIndex,
                              isPast,
                              isCurrent,
                              isFuture,
                              milestones: weekMilestones,
                              dateRange: getWeekDateRange(age, weekIndex)
                            });
                            setIsAddingMilestone(false);
                          }}
                          onMouseEnter={() => {
                            setHoveredWeek({
                              age,
                              week: weekIndex + 1,
                              isPast,
                              isCurrent,
                              isFuture,
                              milestones: weekMilestones,
                              dateRange: getWeekDateRange(age, weekIndex)
                            });
                          }}
                          onMouseLeave={() => setHoveredWeek(null)}
                          className={`${tileWidthClass} ${tileHeightClass} ${tileRadius} cursor-pointer transition-transform duration-100 hover:scale-140 flex items-center justify-center relative ${tileClass}`}
                        >
                          {hasMilestone && viewScope !== 'full' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MINIMALIST FOOTER & FLOATING LENS BAR (Height: ~32px) */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.06] shrink-0 text-[11px] font-mono z-10">
        {/* Left: Minimal Legend */}
        <div className="flex items-center gap-3.5 text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1.5px] bg-[#181C2B] border border-[#262C42]" />
            <span>Lived</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1.5px] bg-[#5278E8] shadow-[0_0_8px_#5278E8] animate-pulse" />
            <span className="text-[#819BE8] font-bold">Now</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1.5px] bg-[#0B0C10] border border-white/[0.08]" />
            <span>Future</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1.5px] bg-[#F59E0B] border border-[#FDE68A]" />
            <span className="text-[#F59E0B]">Milestone</span>
          </div>
        </div>

        {/* Center: Live Hovered Inspection HUD (or Stoic Quote when idle) */}
        <div className="flex-1 max-w-[460px] text-center truncate">
          {hoveredWeek ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-white animate-fadeIn">
              <span className="font-bold text-[#5278E8]">Age {hoveredWeek.age}, Wk {hoveredWeek.week}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300">{hoveredWeek.dateRange}</span>
              <span className="text-zinc-600">•</span>
              <span className={hoveredWeek.isCurrent ? 'text-[#819BE8] font-bold' : hoveredWeek.isPast ? 'text-zinc-400' : 'text-zinc-500'}>
                {hoveredWeek.isCurrent ? '● Present (Now)' : hoveredWeek.isPast ? 'Lived' : 'Unwritten'}
              </span>
              {hoveredWeek.milestones.length > 0 && (
                <span className="text-[#F59E0B] font-bold">★ {hoveredWeek.milestones[0].title}</span>
              )}
            </div>
          ) : (
            <span className="text-zinc-500 italic font-serif text-[12px] truncate block">
              "{QUOTES[quoteIndex].text}" — {QUOTES[quoteIndex].author}
            </span>
          )}
        </div>

        {/* Right: Quick Parameters */}
        <div className="hidden sm:flex items-center gap-2 text-zinc-500 text-[10px]">
          <span>4,680 WEEKS</span>
          <span>•</span>
          <span>{lifespan}Y HORIZON</span>
        </div>
      </div>

      {/* 4. MODAL: WEEK INSPECTOR & MILESTONE PINNER */}
      <AnimatePresence>
        {selectedTile && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-[#0C0D12] border border-white/[0.12] rounded-2xl w-full max-w-[440px] p-6 shadow-2xl relative text-left"
            >
              <button
                onClick={() => setSelectedTile(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.08] cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] font-mono ${
                    selectedTile.isCurrent
                      ? 'bg-[#5278E8]/20 text-[#819BE8] border border-[#5278E8]/40'
                      : selectedTile.isPast
                      ? 'bg-[#181C2B] text-zinc-200 border border-white/10'
                      : 'bg-[#0B0C10] text-zinc-500 border border-white/[0.08]'
                  }`}
                >
                  {selectedTile.age}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-white">
                    Age {selectedTile.age}, Week {selectedTile.week + 1}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {selectedTile.dateRange}
                  </p>
                </div>
              </div>

              {/* Status Tag */}
              <div className="mb-4 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                    selectedTile.isCurrent
                      ? 'bg-[#5278E8]/20 text-[#819BE8] border border-[#5278E8]/40'
                      : selectedTile.isPast
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-white/[0.04] text-zinc-500'
                  }`}
                >
                  {selectedTile.isCurrent
                    ? '● Present Moment (Now)'
                    : selectedTile.isPast
                    ? 'Week Lived'
                    : 'Unwritten Future'}
                </span>

                {selectedTile.milestones.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center gap-1">
                    <Star size={11} weight="fill" />
                    <span>{selectedTile.milestones.length} Milestone{selectedTile.milestones.length > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>

              {/* Existing Milestones List */}
              {selectedTile.milestones.length > 0 && !isAddingMilestone && (
                <div className="space-y-2.5 mb-4 max-h-[180px] overflow-y-auto pr-1">
                  {selectedTile.milestones.map((ms) => {
                    const cat = CATEGORIES.find(c => c.id === ms.category) || CATEGORIES[0];
                    return (
                      <div
                        key={ms.id}
                        className="bg-[#12131A] border border-white/[0.08] rounded-xl p-3 relative group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider inline-block mb-1"
                              style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
                            >
                              {cat.label}
                            </span>
                            <h4 className="text-[13px] font-bold text-white">{ms.title}</h4>
                            {ms.note && (
                              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                {ms.note}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              handleDeleteMilestone(ms.id);
                              setSelectedTile(prev => ({
                                ...prev,
                                milestones: prev.milestones.filter(m => m.id !== ms.id)
                              }));
                            }}
                            className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                            title="Delete Milestone"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Milestone Form / Button */}
              {isAddingMilestone ? (
                <div className="bg-[#12131A] border border-white/[0.08] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white font-mono uppercase tracking-wider">
                      Pin Life Milestone
                    </span>
                    <button
                      onClick={() => setIsAddingMilestone(false)}
                      className="text-zinc-400 hover:text-white text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Launched lockedIn, Moved to SF, Marathon"
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full bg-[#181A22] border border-white/[0.1] text-white px-3 py-2 rounded-lg text-[12px] focus:outline-none focus:border-[#5278E8]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map(c => {
                      const isCatSelected = milestoneForm.category === c.id;
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => setMilestoneForm(f => ({ ...f, category: c.id }))}
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all border cursor-pointer ${
                            isCatSelected
                              ? 'border-white text-white font-bold'
                              : 'border-white/[0.08] text-zinc-400 hover:text-white bg-white/[0.02]'
                          }`}
                          style={{
                            backgroundColor: isCatSelected ? c.bg : undefined,
                            borderColor: isCatSelected ? c.color : undefined,
                            color: isCatSelected ? c.color : undefined
                          }}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      placeholder="Personal reflection or memory from this week..."
                      value={milestoneForm.note}
                      onChange={(e) => setMilestoneForm(f => ({ ...f, note: e.target.value }))}
                      className="w-full bg-[#181A22] border border-white/[0.1] text-white px-3 py-1.5 rounded-lg text-[11px] focus:outline-none focus:border-[#5278E8] resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingMilestone(false)}
                      className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleAddMilestone();
                        setSelectedTile(prev => ({
                          ...prev,
                          milestones: [
                            ...prev.milestones,
                            {
                              id: `ms_${Date.now()}`,
                              age: prev.age,
                              week: prev.week,
                              title: milestoneForm.title,
                              category: milestoneForm.category,
                              note: milestoneForm.note,
                              date: prev.dateRange
                            }
                          ]
                        }));
                      }}
                      className="px-4 py-1.5 rounded-lg bg-[#5278E8] hover:bg-[#4367D4] text-white text-[11px] font-bold shadow-md cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingMilestone(true)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.12] hover:border-white/[0.25] text-zinc-300 hover:text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all bg-white/[0.02] cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Pin a Milestone to this Week</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: EDIT PARAMETERS (DOB & LIFESPAN) */}
      <AnimatePresence>
        {showDobModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-[#0C0D12] border border-white/[0.12] rounded-2xl w-full max-w-[400px] p-6 shadow-2xl relative text-left"
            >
              <button
                onClick={() => setShowDobModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.08] cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-[17px] font-bold text-white mb-1">Life Parameters</h3>
              <p className="text-[11px] text-zinc-400 mb-5">
                Calibrate your birthdate and lifespan to re-render your Life Matrix.
              </p>

              <form onSubmit={handleSaveDobSettings} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={tempDob}
                    onChange={(e) => setTempDob(e.target.value)}
                    className="w-full bg-[#14151B] border border-white/[0.1] text-white px-3.5 py-2.5 rounded-xl text-[13px] font-mono focus:outline-none focus:border-[#5278E8]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                    <span className="text-zinc-400 uppercase tracking-wider">Lifespan Target</span>
                    <span className="text-[#5278E8] font-bold">{tempLifespan} Years</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="100"
                    step="1"
                    value={tempLifespan}
                    onChange={(e) => setTempLifespan(Number(e.target.value))}
                    className="w-full accent-[#5278E8] cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDobModal(false)}
                    className="px-3.5 py-2 rounded-xl text-zinc-400 hover:text-white text-[12px] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#5278E8] hover:bg-[#4367D4] text-white text-[12px] font-bold shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LifeView;
