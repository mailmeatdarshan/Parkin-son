import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Save, Flame, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../../apiClient";

export default function Stopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [taskName, setTaskName] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [todayStats, setTodayStats] = useState({ totalDaytime: 0, totalSessions: 0 });
  const [toastMessage, setToastMessage] = useState(null);

  const timerRef = useRef(null);

  // 1. Fetch Today's Stopwatch Stats
  const fetchStats = async () => {
    try {
      const res = await apiFetch("/api/session/stopwatch/today-stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTodayStats({
            totalDaytime: data.totalDaytime || 0,
            totalSessions: data.totalSessions || 0,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch today stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 2. High-precision Timer Interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 3. Start / Pause Handler
  const handleStartPause = async () => {
    if (!isRunning) {
      // START TIMER
      setIsRunning(true);
      showToast("Timer Started - Lock in!");

      try {
        const res = await apiFetch("/api/session/stopwatch/start", {
          method: "POST",
          body: JSON.stringify({ taskName: taskName.trim() || "Deep Work Session" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSessionId(data.sessionId);
          }
        }
      } catch (err) {
        console.error("Backend start error:", err);
      }
    } else {
      // PAUSE TIMER
      setIsRunning(false);
      showToast("Timer Paused");

      try {
        await apiFetch("/api/session/stopwatch/stop", {
          method: "POST",
          body: JSON.stringify({ sessionId, isFinalSave: false }),
        });
      } catch (err) {
        console.error("Backend pause error:", err);
      }
    }
  };

  // 4. Save Session Handler
  const handleSave = async () => {
    if (seconds === 0) return;

    setIsRunning(false);
    showToast("Session Saved Successfully! 🔥");

    try {
      await apiFetch("/api/session/stopwatch/stop", {
        method: "POST",
        body: JSON.stringify({ sessionId, isFinalSave: true }),
      });
      setSeconds(0);
      setSessionId(null);
      setTaskName("");
      fetchStats();
    } catch (err) {
      console.error("Backend save error:", err);
    }
  };

  // 5. Reset Handler
  const handleReset = async () => {
    if (seconds === 0) return;

    if (!window.confirm("Are you sure you want to reset this session?")) return;

    setIsRunning(false);
    showToast("Session Reset");

    try {
      await apiFetch("/api/session/stopwatch/stop", {
        method: "POST",
        body: JSON.stringify({ sessionId, isReset: true }),
      });
      setSeconds(0);
      setSessionId(null);
    } catch (err) {
      console.error("Backend reset error:", err);
    }
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n) => String(n).padStart(2, "0");
    return {
      hrs: pad(hrs),
      mins: pad(mins),
      secs: pad(secs),
    };
  };

  // Format today focus time to readable text (e.g., 1h 45m or 24m)
  const formatTodayTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);

    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return `${totalSec}s`;
  };

  const { hrs, mins, secs } = formatTime(seconds);

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col justify-between overflow-y-auto relative">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-blue-600/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 border border-blue-400/30"
          >
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl w-full mx-auto space-y-8 my-auto">
        {/* Top Header & Today Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Today's Focus</p>
              <p className="text-lg font-bold text-white tracking-tight">
                {formatTodayTime(todayStats.totalDaytime)}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Flame size={20} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Sessions Logged</p>
              <p className="text-lg font-bold text-white tracking-tight">
                {todayStats.totalSessions} {todayStats.totalSessions === 1 ? "Session" : "Sessions"}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                isRunning
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500"
              }`}
            >
              <Sparkles size={20} className={isRunning ? "animate-pulse" : ""} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Status</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? "bg-emerald-400 animate-ping" : "bg-zinc-600"
                  }`}
                />
                <p className="text-sm font-semibold text-zinc-200">
                  {isRunning ? "Focusing..." : "Idle"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Central Stopwatch Card */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle Glow Background */}
          {isRunning && (
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none transition-all duration-1000" />
          )}

          {/* Optional Task Title Input */}
          <div className="max-w-md mx-auto mb-8">
            <input
              type="text"
              disabled={isRunning}
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="What are you locking into? (optional)"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-center text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-60"
            />
          </div>

          {/* Giant Digital Digits */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono select-none my-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 shadow-inner">
              <span className="text-4xl sm:text-7xl font-bold tracking-tight text-white">{hrs}</span>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-2 font-sans font-semibold">Hours</p>
            </div>

            <span className="text-3xl sm:text-6xl font-bold text-zinc-700 pb-6">:</span>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 shadow-inner">
              <span className="text-4xl sm:text-7xl font-bold tracking-tight text-white">{mins}</span>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-2 font-sans font-semibold">Mins</p>
            </div>

            <span className="text-3xl sm:text-6xl font-bold text-zinc-700 pb-6">:</span>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 shadow-inner">
              <span className={`text-4xl sm:text-7xl font-bold tracking-tight ${isRunning ? "text-blue-400" : "text-white"}`}>
                {secs}
              </span>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-2 font-sans font-semibold">Secs</p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-center gap-4 mt-10">
            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={seconds === 0}
              title="Reset Timer"
              className="p-3.5 sm:px-5 sm:py-3.5 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 rounded-2xl text-xs font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
            >
              <RotateCcw size={18} />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Start / Pause Main CTA */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartPause}
              className={`px-8 sm:px-12 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-semibold flex items-center gap-2.5 transition-all shadow-xl ${
                isRunning
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause size={20} fill="currentColor" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={20} fill="currentColor" />
                  <span>{seconds > 0 ? "Resume" : "Start Focus"}</span>
                </>
              )}
            </motion.button>

            {/* Save Session CTA */}
            <button
              onClick={handleSave}
              disabled={seconds === 0}
              title="Save Session to Database"
              className="p-3.5 sm:px-5 sm:py-3.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
            >
              <Save size={18} />
              <span className="hidden sm:inline">Save Session</span>
            </button>
          </div>
        </div>

        {/* Pro Tip Footer */}
        <p className="text-center text-xs text-zinc-500 font-mono">
          Tip: Hit "Save Session" when you finish to log this time directly to your Daily Focus streak.
        </p>
      </div>
    </div>
  );
}
