import React, { useState, useEffect, useCallback, useRef, memo, useSyncExternalStore } from 'react';
import { 
    Play, 
    Pause, 
    ArrowCounterClockwise, 
    FloppyDisk, 
    Target, 
    CaretDown, 
    Check, 
    X, 
    Clock, 
    Timer, 
    Hourglass, 
    Coffee, 
    FastForward 
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

import { DitherButton } from "../dither-kit/button";
import { apiFetch } from '../../apiClient';
import { useCrypto } from '../../context/CryptoContext';

const POMODORO_DURATIONS = {
    focus: 25 * 60,       // 1500s (25 mins)
    shortBreak: 5 * 60,   // 300s (5 mins)
    longBreak: 15 * 60,   // 900s (15 mins)
};

// Web Audio Chime on Pomodoro / Break Completion
const playChime = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 1.2);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12); // A5
        gain2.gain.setValueAtTime(0.18, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 1.6);
    } catch (e) {
        console.warn("Audio chime error:", e);
    }
};

// THE ULTIMATE ZERO-RENDER STORE ENGINE (ATOMIC STATE) 
function createStore(initialState) {
    const store = {
        state: initialState,
        listeners: new Set(),
        getState() { return this.state; },
        setState(newState) {
            let hasChanges = false;
            for (let key in newState) {
                if (this.state[key] !== newState[key]) hasChanges = true;
            }
            if (!hasChanges) return;
            this.state = { ...this.state, ...newState };
            this.listeners.forEach(l => l());
        },
        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }
    };
    return store;
}

const timerStore = createStore({ 
    isRunning: false, 
    time: 0, 
    timerMode: 'stopwatch',         // 'stopwatch' | 'pomodoro'
    pomodoroPhase: 'focus',         // 'focus' | 'shortBreak' | 'longBreak'
    pomodoroCycles: 0,              // 0 to 4
    initialDuration: 0, 
    taskName: "", 
    selectedTaskId: null, 
    strictMode: false, 
    sessionId: null, 
    showSaveModal: false 
});
const statsStore = createStore({ totalDaytime: 0, totalSessions: 0, todaySessions: [] }); 
const toastStore = createStore({ toasts: [] }); 

const useTimer = (selector) => useSyncExternalStore((l) => timerStore.subscribe(l), () => selector(timerStore.getState()));
const useStats = (selector) => useSyncExternalStore((l) => statsStore.subscribe(l), () => selector(statsStore.getState()));
const useToast = (selector) => useSyncExternalStore((l) => toastStore.subscribe(l), () => selector(toastStore.getState()));

const showToast = (message) => {
    const id = Date.now();
    const currentToasts = toastStore.getState().toasts;
    toastStore.setState({ toasts: [...currentToasts, { id, message }] });
    setTimeout(() => {
        const remainingToasts = toastStore.getState().toasts.filter(t => t.id !== id);
        toastStore.setState({ toasts: remainingToasts });
    }, 3000);
};

const COLORS = {
    bg: '#050505',          
    card: '#000000',        
    textPrimary: '#E0E0E0', 
    textSecondary: '#A3A3A3',
    textMuted: '#737373', 
    border: 'rgba(255, 255, 255, 0.12)', 
    borderHover: 'rgba(255, 255, 255, 0.18)',
};

// PREMIUM CARD STYLING 
const heavyCardStyle = {
    background: 'linear-gradient(180deg, #111111 0%, #000000 100%)', 
    border: `1px solid ${COLORS.border}`, 
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 32px 64px rgba(0,0,0,1), 0 0 40px rgba(255,255,255,0.02)'
};

const heavyInputStyle = {
    background: '#070707', 
    border: '1px solid rgba(255,255,255,0.03)',
    boxShadow: 'inset 0 2px 12px rgba(0,0,0,1), 0 1px 0px rgba(255,255,255,0.04)'
};

const secondaryButtonStyle = {
    background: 'linear-gradient(180deg, #18181B 0%, #050505 100%)', 
    border: `1px solid ${COLORS.border}`,
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 8px 16px rgba(0,0,0,0.8)'
};

const capsuleStyle = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)',
    padding: '6px 14px',
    borderRadius: '999px',
    display: 'inline-block'
};

const ToastOverlay = memo(() => {
    const toasts = useToast(s => s.toasts);
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="bg-[#22262B] text-[#E0E0E0] px-6 py-3.5 rounded-2xl shadow-2xl border border-white/10 font-medium text-[14px] flex items-center gap-3 backdrop-blur-xl"
                        style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
                    >
                        {t.message.includes("Saved") ? <Target size={16} weight="bold" className="text-[#34D399]" /> : <Play size={16} weight="fill" className="text-[#60A5FA]" />}
                        {t.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
});

const switchTimerMode = (newMode) => {
    const state = timerStore.getState();
    if (state.timerMode === newMode) return;

    if (state.isRunning) {
        if (state.timerMode === 'stopwatch') {
            handleStopBackend(state.sessionId, false, state.time, state.taskName);
        } else if (state.pomodoroPhase === 'focus') {
            const elapsed = Math.max(0, (state.initialDuration || 1500) - state.time);
            handleStopBackend(state.sessionId, false, elapsed, state.taskName);
        }
    }

    if (newMode === 'pomodoro') {
        const phaseDuration = POMODORO_DURATIONS[state.pomodoroPhase] || POMODORO_DURATIONS.focus;
        timerStore.setState({
            timerMode: 'pomodoro',
            isRunning: false,
            time: phaseDuration,
            initialDuration: phaseDuration,
            sessionId: null,
        });
        showToast("Switched to Pomodoro");
    } else {
        timerStore.setState({
            timerMode: 'stopwatch',
            isRunning: false,
            time: 0,
            initialDuration: 0,
            sessionId: null,
        });
        showToast("Switched to Stopwatch");
    }
};

const switchPomodoroPhase = (phase) => {
    const state = timerStore.getState();
    if (state.isRunning) {
        if (state.pomodoroPhase === 'focus') {
            const elapsed = Math.max(0, (state.initialDuration || 1500) - state.time);
            handleStopBackend(state.sessionId, false, elapsed, state.taskName);
        }
    }
    const newDuration = POMODORO_DURATIONS[phase] || POMODORO_DURATIONS.focus;
    timerStore.setState({
        pomodoroPhase: phase,
        time: newDuration,
        initialDuration: newDuration,
        isRunning: false,
        sessionId: null,
    });
};

const Header = memo(() => {
    const timerMode = useTimer(s => s.timerMode);

    return (
        <div className="w-full mb-4 md:mb-8 mt-1 sm:mt-2 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between items-center text-center sm:text-left gap-3.5 sm:gap-4">
            <div className="flex flex-col items-center sm:items-start">
                <h1 className="text-2xl sm:text-3xl md:text-[34px] font-bold tracking-tight text-[#E0E0E0] leading-tight">
                    {timerMode === 'pomodoro' ? 'Pomodoro Focus' : 'Focus Session'}
                </h1>
                <p className="hidden sm:block text-[14px] md:text-[16px] text-[#A3A3A3] mt-2 font-medium">
                    {timerMode === 'pomodoro' 
                        ? 'Structured 25-minute sprints with scheduled recovery breaks.'
                        : 'Track and save your deep work intervals.'}
                </p>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10 self-center sm:self-auto backdrop-blur-md">
                <button
                    type="button"
                    onClick={() => switchTimerMode('stopwatch')}
                    className={`flex items-center justify-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-[12px] md:text-[13px] font-semibold transition-all cursor-pointer ${
                        timerMode === 'stopwatch'
                            ? 'bg-white/15 text-white shadow-sm border border-white/20'
                            : 'text-neutral-400 hover:text-white border border-transparent'
                    }`}
                >
                    <Timer size={15} weight="bold" className="shrink-0" />
                    <span>Stopwatch</span>
                </button>

                <button
                    type="button"
                    onClick={() => switchTimerMode('pomodoro')}
                    className={`flex items-center justify-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-[12px] md:text-[13px] font-semibold transition-all cursor-pointer ${
                        timerMode === 'pomodoro'
                            ? 'bg-white/15 text-white shadow-sm border border-white/20'
                            : 'text-neutral-400 hover:text-white border border-transparent'
                    }`}
                >
                    <Hourglass size={15} weight="bold" className="shrink-0" />
                    <span>Pomodoro</span>
                </button>
            </div>
        </div>
    );
});

const TodaySessionsList = memo(() => {
    const todaySessions = useStats(s => s.todaySessions);

    const formatSessionDuration = (secs) => {
        if (!secs || secs === 0) return '0s';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`;
        return `${s}s`;
    };

    const formatSessionTime = (isoString) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="hidden lg:flex w-full rounded-[32px] p-6 md:p-7 flex-col relative flex-1 min-h-[220px]" style={heavyCardStyle}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] md:text-[12px] font-bold tracking-[0.15em] text-[#E0E0E0] uppercase" style={capsuleStyle}>
                    Today's Sessions
                </h3>
                {todaySessions.length > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-[#0A84FF] border border-blue-500/20">
                        {todaySessions.length}
                    </span>
                )}
            </div>

            {todaySessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={heavyInputStyle}>
                        <Clock size={22} weight="regular" className="text-[#737373]" />
                    </div>
                    <h4 className="text-[#E0E0E0] font-semibold text-[14px] mb-1">No Sessions Logged Yet</h4>
                    <p className="text-[12px] text-[#A3A3A3] leading-relaxed max-w-[200px]">
                        Save your timer to record your completed focus intervals here.
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto max-h-[190px] pr-1 flex flex-col gap-2 hide-scrollbar">
                    {todaySessions.map((s, idx) => (
                        <div 
                            key={s._id || idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all"
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] font-medium text-neutral-200 truncate leading-snug">
                                        {s.taskName || "Focus Session"}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                        {formatSessionTime(s.createdAt || s.endTime)}
                                    </span>
                                </div>
                            </div>

                            <span className="text-[11px] font-mono font-bold text-blue-400/90 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 shrink-0">
                                {formatSessionDuration(s.duration)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

const QuickStats = memo(() => {
    const totalDaytime = useStats(s => s.totalDaytime);
    const totalSessions = useStats(s => s.totalSessions);

    const formatProgressTime = (secs) => {
        if (!secs || secs === 0) return '0m';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`;
        return `${s}s`;
    };

    return (
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-3 md:gap-6 flex-shrink-0">
            <div className="w-full rounded-[20px] md:rounded-[32px] p-5 md:p-8 flex flex-col justify-start flex-1 min-h-[120px] md:min-h-[220px]" style={heavyCardStyle}>
                
                <div className="flex items-center mb-4 md:mb-8">
                    <h3 className="text-[10px] md:text-[12px] font-bold tracking-[0.15em] text-[#E0E0E0] uppercase" style={capsuleStyle}>
                        Today's Progress
                    </h3>
                </div>
                
                <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start w-full mt-auto md:mt-0">
                    <div className="mb-0 md:mb-6 flex flex-col items-center md:items-start">
                        <div className="text-2xl md:text-[38px] font-bold text-[#E0E0E0] tracking-tight leading-none">
                            {formatProgressTime(totalDaytime)}
                        </div>
                        <div className="text-[12px] md:text-[14px] text-[#A3A3A3] mt-2 font-medium">Focus Time</div>
                    </div>
                    <div className="hidden md:block w-full h-[1px] bg-white/10 mb-6" style={{boxShadow: '0 1px 0 rgba(0,0,0,0.5)'}}></div>
                    <div className="flex flex-col items-center md:items-start">
                        <div className="text-2xl md:text-[38px] font-bold text-[#E0E0E0] tracking-tight leading-none">{totalSessions}</div>
                        <div className="text-[12px] md:text-[14px] text-[#A3A3A3] mt-2 font-medium">Sessions</div>
                    </div>
                </div>
            </div>
            
            <TodaySessionsList />
        </div>
    );
});

const TaskInput = memo(() => {
    const taskName = useTimer(s => s.taskName);
    const isRunning = useTimer(s => s.isRunning);
    const { isLocked, decryptData } = useCrypto();

    const [isOpen, setIsOpen] = useState(false);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch and decrypt today's pending tasks
    const fetchPendingTasks = useCallback(async () => {
        try {
            setLoadingTasks(true);
            const res = await apiFetch("/api/tasks/today-pending", { credentials: "include" });
            if (res.ok) {
                const rawTasks = await res.json();
                const decryptedList = await Promise.all(
                    rawTasks.map(async (t) => {
                        let displayTitle = t.title || "Untitled Task";
                        if (!isLocked && decryptData && t.encryptedDescription) {
                            try {
                                displayTitle = await decryptData(t.encryptedDescription);
                            } catch (e) {
                                displayTitle = t.title || "⚠️ Encrypted Task";
                            }
                        }
                        return {
                            ...t,
                            displayTitle,
                        };
                    })
                );
                setPendingTasks(decryptedList);
            }
        } catch (err) {
            console.error("Failed to fetch today's pending tasks:", err);
        } finally {
            setLoadingTasks(false);
        }
    }, [isLocked, decryptData]);

    // Fetch on mount and when crypto unlocks
    useEffect(() => {
        fetchPendingTasks();
    }, [fetchPendingTasks]);

    // Re-fetch when dropdown is opened to ensure fresh list
    useEffect(() => {
        if (isOpen) {
            fetchPendingTasks();
        }
    }, [isOpen, fetchPendingTasks]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Close dropdown on Escape without resetting timer
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape, true);
        return () => window.removeEventListener('keydown', handleEscape, true);
    }, [isOpen]);

    const handleSelectTask = (task) => {
        timerStore.setState({ 
            taskName: task.displayTitle,
            selectedTaskId: task._id
        });
        setIsOpen(false);
    };

    const handleClearTask = (e) => {
        e.stopPropagation();
        timerStore.setState({ taskName: "", selectedTaskId: null });
        if (inputRef.current) inputRef.current.focus();
    };

    const getPriorityDot = (p) => {
        switch (Number(p)) {
            case 5: return '#EF4444';
            case 3: return '#F59E0B';
            case 1: return '#3B82F6';
            default: return '#71717A';
        }
    };

    const timerMode = useTimer(s => s.timerMode);
    const pomodoroPhase = useTimer(s => s.pomodoroPhase);
    const isBreak = timerMode === 'pomodoro' && pomodoroPhase !== 'focus';

    return (
        <div className="w-full mb-3 md:mb-6 flex-shrink-0 relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-2 px-2">
                <label className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-[#A3A3A3] uppercase">
                    {isBreak ? 'Break Session' : 'Current Task'}
                </label>
                {!isBreak && pendingTasks.length > 0 && (
                    <button 
                        type="button"
                        onClick={() => setIsOpen(prev => !prev)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer"
                    >
                        <span>{pendingTasks.length} pending today</span>
                        <CaretDown size={12} weight="bold" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            <div 
                className="w-full flex items-center gap-2 md:gap-3 rounded-[14px] md:rounded-2xl px-4 py-3 md:px-5 md:py-4 transition-all relative" 
                style={heavyInputStyle}
            >
                {isBreak ? (
                    <Coffee size={18} weight="bold" className="flex-shrink-0 md:w-5 md:h-5 text-emerald-400" />
                ) : (
                    <Target size={18} weight="bold" className={`flex-shrink-0 md:w-5 md:h-5 ${isRunning ? 'text-[#E0E0E0]' : 'text-[#A3A3A3]'}`} />
                )}
                
                <input 
                    ref={inputRef}
                    type="text" 
                    value={isBreak ? "" : taskName} 
                    disabled={isBreak}
                    onChange={(e) => {
                        const val = e.target.value;
                        const matching = pendingTasks.find(t => (t.displayTitle || "").trim().toLowerCase() === val.trim().toLowerCase());
                        timerStore.setState({ 
                            taskName: val,
                            selectedTaskId: matching ? matching._id : null
                        });
                    }}
                    onFocus={() => {
                        if (!isBreak && pendingTasks.length > 0) setIsOpen(true);
                    }}
                    placeholder={
                        isBreak 
                            ? pomodoroPhase === 'longBreak' 
                                ? '☕ Long break: 15 minutes of rest...' 
                                : '☕ Short break: 5 minutes of rest...' 
                            : 'What are you focusing on?'
                    } 
                    className="bg-transparent border-none outline-none text-[#E0E0E0] placeholder:text-[#737373] w-full text-[14px] md:text-[16px] font-medium disabled:cursor-not-allowed"
                />

                {/* Clear button if text entered */}
                {!isBreak && taskName && (
                    <button
                        type="button"
                        onClick={handleClearTask}
                        className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer"
                        title="Clear task"
                    >
                        <X size={15} weight="bold" />
                    </button>
                )}

                {/* Dropdown toggle button */}
                {!isBreak && (
                    <button
                        type="button"
                        onClick={() => setIsOpen(prev => !prev)}
                        className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg border transition-all shrink-0 cursor-pointer ${
                            isOpen 
                                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-neutral-400 hover:text-white'
                        }`}
                        title="Select today's task"
                    >
                        <CaretDown size={14} weight="bold" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#0E0E10] shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
                    >
                        <div className="px-4 py-2.5 bg-[#141416] border-b border-white/[0.06] flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={13} weight="bold" className="text-neutral-400" />
                                Today's Pending Tasks
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-[#0A84FF] border border-blue-500/20">
                                {pendingTasks.length}
                            </span>
                        </div>

                        <div className="max-h-[220px] overflow-y-auto p-1.5 flex flex-col gap-1 hide-scrollbar">
                            {loadingTasks ? (
                                <div className="py-6 text-center text-[12px] text-neutral-500 font-medium">
                                    Loading tasks...
                                </div>
                            ) : pendingTasks.length === 0 ? (
                                <div className="py-6 px-4 text-center text-neutral-500 flex flex-col items-center gap-1">
                                    <span className="text-[13px] font-medium text-neutral-400">No pending tasks for today</span>
                                    <span className="text-[11px] text-neutral-600">Type a custom task in the field above</span>
                                </div>
                            ) : (
                                pendingTasks.map((t) => {
                                    const isSelected = taskName === t.displayTitle;
                                    return (
                                        <div
                                            key={t._id}
                                            onClick={() => handleSelectTask(t)}
                                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                                    : 'hover:bg-white/[0.06] text-[#E0E0E0] border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                                <div 
                                                    className="w-2 h-2 rounded-full shrink-0" 
                                                    style={{ backgroundColor: getPriorityDot(t.priority) }} 
                                                />
                                                <span className="text-[13px] font-medium truncate">
                                                    {t.displayTitle}
                                                </span>
                                            </div>

                                            {isSelected ? (
                                                <Check size={14} weight="bold" className="text-blue-400 shrink-0" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-neutral-500 uppercase">Select</span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

const PomodoroBar = memo(() => {
    const timerMode = useTimer(s => s.timerMode);
    const pomodoroPhase = useTimer(s => s.pomodoroPhase);
    const pomodoroCycles = useTimer(s => s.pomodoroCycles);

    if (timerMode !== 'pomodoro') return null;

    const phases = [
        { key: 'focus', label: 'Focus', time: '25m', icon: Target },
        { key: 'shortBreak', label: 'Short Break', time: '5m', icon: Coffee },
        { key: 'longBreak', label: 'Long Break', time: '15m', icon: Hourglass },
    ];

    return (
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-2 md:mb-5 px-1 flex-shrink-0">
            {/* Phase Selector Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] w-full sm:w-auto">
                {phases.map(p => {
                    const isActive = pomodoroPhase === p.key;
                    const IconComp = p.icon;
                    return (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => switchPomodoroPhase(p.key)}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] md:text-[12px] font-semibold transition-all cursor-pointer ${
                                isActive
                                    ? p.key === 'focus'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm'
                                        : p.key === 'shortBreak'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm'
                                    : 'text-neutral-400 hover:text-white border border-transparent'
                            }`}
                        >
                            <IconComp size={14} weight={isActive ? "fill" : "regular"} />
                            <span>{p.label}</span>
                            <span className="text-[10px] opacity-60">({p.time})</span>
                        </button>
                    );
                })}
            </div>

            {/* Cycle Dots Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                    Cycle
                </span>
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${
                                i < pomodoroCycles
                                    ? 'bg-blue-400 shadow-sm shadow-blue-500/50'
                                    : 'bg-white/10 border border-white/20'
                            }`}
                        />
                    ))}
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                    {pomodoroCycles}/4
                </span>
            </div>
        </div>
    );
});

const StrictModeToggle = memo(() => {
    const strictMode = useTimer(s => s.strictMode);
    
    return (
        <div className="flex items-center justify-end w-full pr-2 mb-2 md:mb-6 flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
                <span className={`text-[10px] md:text-[11px] font-bold tracking-[0.1em] uppercase transition-colors ${strictMode ? 'text-[#E0E0E0]' : 'text-[#A3A3A3]'}`}>
                    Strict Mode
                </span>
                
                {/* PURE CSS BRUTALIST SWITCH */}
                <label className="switch sw-10">
                    <input 
                        type="checkbox" 
                        tabIndex="-1" 
                        checked={strictMode}
                        onChange={(e) => timerStore.setState({ strictMode: e.target.checked })} 
                    />
                    <span className="track"><span className="thumb"></span></span>
                </label>
            </div>
        </div>
    );
});

const AnimatedDigit = memo(({ digit }) => (
    <div className="relative inline-block overflow-hidden" style={{ width: '1ch', height: '1.2em' }}>
        <AnimatePresence>
            <motion.span 
                key={digit} 
                initial={{ y: "100%", opacity: 0 }} 
                animate={{ y: "0%", opacity: 1 }} 
                exit={{ y: "-100%", opacity: 0 }} 
                transition={{ type: "spring", stiffness: 350, damping: 30 }} 
                className="absolute inset-0 flex items-center justify-center"
            >
                {digit}
            </motion.span>
        </AnimatePresence>
    </div>
));

const DigitSubscriber = memo(({ selector }) => {
    const digit = useTimer(selector);
    return <AnimatedDigit digit={digit} />;
});

const TimerDigits = memo(() => (
    <div className="text-[44px] xs:text-[54px] sm:text-[80px] md:text-[120px] lg:text-[150px] font-black tabular-nums leading-none flex items-center justify-center select-none text-[#888888] w-full"
        style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif", letterSpacing: '-0.04em' }}>
        <DigitSubscriber selector={s => Math.floor(s.time / 600)} />
        <DigitSubscriber selector={s => Math.floor((s.time / 60) % 10)} />
        <span className="text-[#555555] font-bold mx-1 sm:mx-2 md:mx-4" style={{ transform: 'translateY(-6%)' }}>:</span>
        <DigitSubscriber selector={s => Math.floor((s.time % 60) / 10)} />
        <DigitSubscriber selector={s => s.time % 10} />
    </div>
));

const fetchTodayStats = async () => {
    try {
        const res = await apiFetch("/api/session/stopwatch/today-stats", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
            statsStore.setState({ 
                totalDaytime: data.totalDaytime || 0, 
                totalSessions: data.totalSessions || 0,
                todaySessions: data.sessions || []
            });
        }
    } catch (err) {
        console.error("Failed to fetch stats", err);
    }
};

const handleStartBackend = async (taskName) => {
    try {
        const res = await apiFetch("/api/session/stopwatch/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ taskName })
        });
        const data = await res.json();
        if (data.success) {
            timerStore.setState({ sessionId: data.sessionId });
        }
    } catch (err) {
        console.error("Backend Start failed", err);
    }
};

const handleStopBackend = async (sessionId, isFinalSave = false, duration = 0, taskName = "") => {
    try {
        await apiFetch("/api/session/stopwatch/stop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ sessionId, isFinalSave, duration, taskName }) 
        });
        await fetchTodayStats(); 
    } catch (err) {
        console.error("Backend Stop failed", err);
    }
};

const handlePomodoroComplete = async () => {
    timerStore.setState({ isRunning: false });
    playChime();

    const state = timerStore.getState();
    const phase = state.pomodoroPhase;

    if (phase === 'focus') {
        const sprintDuration = state.initialDuration || 1500;
        const newCycles = (state.pomodoroCycles || 0) + 1;

        if (state.selectedTaskId) {
            timerStore.setState({ 
                showSaveModal: true,
                pomodoroCycles: newCycles >= 4 ? 0 : newCycles
            });
        } else {
            await handleStopBackend(state.sessionId, true, sprintDuration, state.taskName || "Pomodoro Focus");
            showToast("Focus sprint complete! Session saved.");
            
            if (newCycles >= 4) {
                switchPomodoroPhase('longBreak');
                timerStore.setState({ pomodoroCycles: 0 });
                showToast("4 Cycles Completed! Take a 15m Long Break.");
            } else {
                switchPomodoroPhase('shortBreak');
                timerStore.setState({ pomodoroCycles: newCycles });
                showToast(`Cycle ${newCycles}/4 complete! Take a 5m break.`);
            }
        }
    } else {
        showToast("Break over! Ready for your next focus session?");
        switchPomodoroPhase('focus');
    }
};

const triggerSaveFlow = () => {
    const state = timerStore.getState();

    let durationToSave;
    if (state.timerMode === 'pomodoro') {
        if (state.pomodoroPhase !== 'focus') return; // Breaks don't log as focus time
        durationToSave = Math.max(0, (state.initialDuration || 1500) - state.time);
    } else {
        durationToSave = state.time;
    }

    if (durationToSave <= 0) return;

    if (state.isRunning) {
        timerStore.setState({ isRunning: false });
        handleStopBackend(state.sessionId, false, durationToSave, state.taskName);
    }

    if (state.selectedTaskId) {
        timerStore.setState({ showSaveModal: true });
    } else {
        handleStopBackend(state.sessionId, true, durationToSave, state.taskName || "Focus Session");
        showToast("Session Saved Successfully!");
        if (state.timerMode === 'pomodoro') {
            const nextCycles = (state.pomodoroCycles || 0) + 1;
            if (nextCycles >= 4) {
                switchPomodoroPhase('longBreak');
                timerStore.setState({ pomodoroCycles: 0, taskName: "", selectedTaskId: null, showSaveModal: false });
            } else {
                switchPomodoroPhase('shortBreak');
                timerStore.setState({ pomodoroCycles: nextCycles, taskName: "", selectedTaskId: null, showSaveModal: false });
            }
        } else {
            timerStore.setState({ 
                isRunning: false, 
                time: 0, 
                taskName: "", 
                selectedTaskId: null, 
                sessionId: null, 
                showSaveModal: false 
            });
        }
    }
};

const StartPauseButton = memo(() => {
    const isRunning = useTimer(s => s.isRunning);

    const handleStartPause = useCallback(() => {
        const state = timerStore.getState();
        const newState = !state.isRunning;

        // If in pomodoro and countdown is at 0, reset to initialDuration before starting
        if (newState && state.timerMode === 'pomodoro' && state.time <= 0) {
            const freshDuration = POMODORO_DURATIONS[state.pomodoroPhase] || 1500;
            timerStore.setState({ time: freshDuration, initialDuration: freshDuration });
        }

        timerStore.setState({ isRunning: newState });

        if (newState) {
            showToast("Timer Started");
            if (state.timerMode === 'stopwatch' || state.pomodoroPhase === 'focus') {
                handleStartBackend(state.taskName);
            }
        } else {
            showToast("Timer Paused");
            if (state.timerMode === 'stopwatch') {
                handleStopBackend(state.sessionId, false, state.time, state.taskName);
            } else if (state.pomodoroPhase === 'focus') {
                const elapsed = Math.max(0, (state.initialDuration || 1500) - state.time);
                handleStopBackend(state.sessionId, false, elapsed, state.taskName);
            }
        }
    }, []);

    return (
        <motion.div whileTap={{ scale: 0.95 }} className="flex-1 sm:w-56">
            <DitherButton 
                color="blue" 
                variant="hatched" 
                bloom="aura" 
                onClick={handleStartPause}
                className="w-full flex items-center justify-center gap-2 py-3.5 md:py-5 font-semibold text-[14px] md:text-[15px] text-white cursor-pointer"
            >
                <AnimatePresence mode="wait">
                    <motion.div key={isRunning ? 'pause' : 'play'} initial={{ opacity: 0, scale: 0.5, rotate: -45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 45 }} transition={{ duration: 0.15 }}>
                        {isRunning ? <Pause size={20} weight="fill" className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]" /> : <Play size={20} weight="fill" className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]" />}
                    </motion.div>
                </AnimatePresence>
                {isRunning ? 'Pause' : 'Start'}
            </DitherButton>
        </motion.div>
    );
});

const SaveButton = memo(() => {
    const timerMode = useTimer(s => s.timerMode);
    const pomodoroPhase = useTimer(s => s.pomodoroPhase);
    const time = useTimer(s => s.time);
    const initialDuration = useTimer(s => s.initialDuration);

    const isBreak = timerMode === 'pomodoro' && pomodoroPhase !== 'focus';
    const hasWorked = timerMode === 'pomodoro' ? (initialDuration - time > 0) : (time > 0);

    const handleAction = useCallback(() => {
        if (isBreak) {
            switchPomodoroPhase('focus');
            showToast("Break skipped. Ready to focus!");
        } else {
            triggerSaveFlow();
        }
    }, [isBreak]);

    return (
        <motion.button 
            onClick={handleAction} 
            disabled={!isBreak && !hasWorked} 
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 px-4 sm:px-0 sm:w-36 py-3.5 md:py-5 rounded-[14px] md:rounded-2xl font-medium text-[14px] md:text-[15px] text-[#A3A3A3] hover:text-[#E0E0E0] transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" 
            style={secondaryButtonStyle}
        >
            {isBreak ? (
                <>
                    <FastForward size={16} weight="bold" className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">Skip Break</span>
                </>
            ) : (
                <>
                    <FloppyDisk size={16} weight="bold" className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">Save</span>
                </>
            )}
        </motion.button>
    );
});

const ResetButton = memo(() => {
    const time = useTimer(s => s.time);
    const timerMode = useTimer(s => s.timerMode);
    const initialDuration = useTimer(s => s.initialDuration);

    const canReset = timerMode === 'pomodoro' ? (time !== initialDuration) : (time > 0);

    const handleReset = useCallback(() => {
        const state = timerStore.getState();
        
        // Send isReset: true explicitly to backend
        if (state.timerMode === 'stopwatch' || state.pomodoroPhase === 'focus') {
            apiFetch("/api/session/stopwatch/stop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ sessionId: state.sessionId, isFinalSave: false, isReset: true })
            });
        }
        
        if (state.timerMode === 'pomodoro') {
            const fresh = POMODORO_DURATIONS[state.pomodoroPhase] || 1500;
            timerStore.setState({ isRunning: false, time: fresh, initialDuration: fresh, sessionId: null, showSaveModal: false });
        } else {
            timerStore.setState({ isRunning: false, time: 0, sessionId: null, showSaveModal: false });
        }
    }, []);

    return (
        <motion.button 
            onClick={handleReset} 
            disabled={!canReset} 
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-[46px] h-[46px] sm:w-[64px] sm:h-auto py-0 sm:py-5 rounded-[14px] md:rounded-2xl text-[#A3A3A3] hover:text-[#E0E0E0] transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" 
            style={secondaryButtonStyle}
            title="Reset timer"
        >
            <ArrowCounterClockwise size={16} weight="bold" className="md:w-[18px] md:h-[18px]" />
        </motion.button>
    );
});

const ControlsBar = memo(() => (
    <div className="flex flex-row items-center gap-2 md:gap-4 w-full justify-center mt-auto flex-shrink-0">
        <StartPauseButton />
        <SaveButton />
        <ResetButton />
    </div>
));

// ULTIMATE BACKGROUND WORKER ENGINE (Zero Lag, Zero Jump) 
const TimerEngine = memo(() => {
    const isRunning = useTimer(s => s.isRunning);
    
    useEffect(() => {
        if (!isRunning) return;

        const startTimestamp = Date.now();
        const startAccumulatedTime = timerStore.getState().time;
        
        const tick = () => {
            const state = timerStore.getState();
            const elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000);

            if (state.timerMode === 'pomodoro') {
                const remaining = Math.max(0, startAccumulatedTime - elapsedSeconds);
                timerStore.setState({ time: remaining });
                if (remaining <= 0) {
                    handlePomodoroComplete();
                }
            } else {
                timerStore.setState({ time: startAccumulatedTime + elapsedSeconds });
            }
        };

        const workerCode = `
            let interval;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    interval = setInterval(() => {
                        self.postMessage('tick');
                    }, 250);
                } else if (e.data === 'stop') {
                    clearInterval(interval);
                }
            };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        const worker = new Worker(blobUrl);

        worker.onmessage = () => {
            tick();
        };

        worker.postMessage('start'); 

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') tick();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            worker.postMessage('stop');
            worker.terminate(); 
            URL.revokeObjectURL(blobUrl);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [isRunning]);
    
    return null; 
});

const SystemEffects = memo(() => {
    const isRunning = useTimer(s => s.isRunning);
    const time = useTimer(s => s.time);
    const timerMode = useTimer(s => s.timerMode);
    const pomodoroPhase = useTimer(s => s.pomodoroPhase);

    useEffect(() => {
        if (isRunning || time > 0) {
            const m = Math.floor(time / 60);
            const s = time % 60;
            const prefix = timerMode === 'pomodoro' 
                ? pomodoroPhase === 'focus' ? '⏳' : '☕' 
                : '⏱';
            document.title = `${prefix} (${Math.floor(m/10)}${m%10}:${Math.floor(s/10)}${s%10}) Parkin'son Focus`;
        } else {
            document.title = "Parkin'son | Focus";
        }
    }, [isRunning, time, timerMode, pomodoroPhase]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const state = timerStore.getState();
            if (state.strictMode && document.visibilityState === 'hidden' && state.isRunning) {
                timerStore.setState({ isRunning: false });
                if (state.timerMode === 'stopwatch') {
                    handleStopBackend(state.sessionId, false, state.time, state.taskName);
                } else if (state.pomodoroPhase === 'focus') {
                    const elapsed = Math.max(0, (state.initialDuration || 1500) - state.time);
                    handleStopBackend(state.sessionId, false, elapsed, state.taskName);
                }
                showToast("Timer Paused (Strict Mode)");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            const state = timerStore.getState();
            
            if (e.code === 'Space') { 
                e.preventDefault(); 
                const newState = !state.isRunning;
                if (newState && state.timerMode === 'pomodoro' && state.time <= 0) {
                    const fresh = POMODORO_DURATIONS[state.pomodoroPhase] || 1500;
                    timerStore.setState({ time: fresh, initialDuration: fresh });
                }
                timerStore.setState({ isRunning: newState }); 
                if (newState) {
                    showToast("Timer Started");
                    if (state.timerMode === 'stopwatch' || state.pomodoroPhase === 'focus') {
                        handleStartBackend(state.taskName);
                    }
                } else {
                    showToast("Timer Paused");
                    if (state.timerMode === 'stopwatch') {
                        handleStopBackend(state.sessionId, false, state.time, state.taskName);
                    } else if (state.pomodoroPhase === 'focus') {
                        const elapsed = Math.max(0, (state.initialDuration || 1500) - state.time);
                        handleStopBackend(state.sessionId, false, elapsed, state.taskName);
                    }
                }
            } 
            else if (e.code === 'Escape') { 
                e.preventDefault(); 
                if (state.isRunning) {
                    if (state.timerMode === 'stopwatch') {
                        handleStopBackend(state.sessionId, false, state.time, state.taskName);
                    } else if (state.pomodoroPhase === 'focus') {
                        const elapsed = Math.max(0, (state.initialDuration || 1500) - state.time);
                        handleStopBackend(state.sessionId, false, elapsed, state.taskName);
                    }
                }
                if (state.timerMode === 'pomodoro') {
                    const fresh = POMODORO_DURATIONS[state.pomodoroPhase] || 1500;
                    timerStore.setState({ isRunning: false, time: fresh, initialDuration: fresh, sessionId: null, showSaveModal: false });
                } else {
                    timerStore.setState({ isRunning: false, time: 0, sessionId: null, showSaveModal: false });
                }
            } 
            else if (e.code === 'Enter') {
                e.preventDefault();
                triggerSaveFlow();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    return null;
});

const SaveModal = memo(() => {
    const showSaveModal = useTimer(s => s.showSaveModal);
    const time = useTimer(s => s.time);
    const initialDuration = useTimer(s => s.initialDuration);
    const timerMode = useTimer(s => s.timerMode);
    const taskName = useTimer(s => s.taskName);
    const selectedTaskId = useTimer(s => s.selectedTaskId);
    const sessionId = useTimer(s => s.sessionId);
    const [isSaving, setIsSaving] = useState(false);

    if (!showSaveModal) return null;

    const loggedDuration = timerMode === 'pomodoro'
        ? ((initialDuration - time > 0) ? (initialDuration - time) : (initialDuration || 1500))
        : time;

    const formatModalDuration = (secs) => {
        if (!secs || secs === 0) return '0s';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}h ${m}m ${s > 0 ? `${s}s` : ''}`;
        if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`;
        return `${s}s`;
    };

    const handleCompleteAndSave = async () => {
        try {
            setIsSaving(true);
            const state = timerStore.getState();
            let durationToSave = state.time;
            if (state.timerMode === 'pomodoro') {
                durationToSave = Math.max(0, (state.initialDuration || 1500) - state.time);
                if (durationToSave <= 0) durationToSave = state.initialDuration || 1500;
            }

            if (selectedTaskId) {
                await apiFetch(`/api/task/patchtask/${selectedTaskId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ status: true })
                });
            }
            await handleStopBackend(sessionId, true, durationToSave, taskName || "Focus Session");
            showToast("Task completed & session saved!");

            if (state.timerMode === 'pomodoro') {
                const nextCycles = (state.pomodoroCycles || 0) + 1;
                if (nextCycles >= 4) {
                    switchPomodoroPhase('longBreak');
                    timerStore.setState({ pomodoroCycles: 0, taskName: "", selectedTaskId: null, showSaveModal: false });
                } else {
                    switchPomodoroPhase('shortBreak');
                    timerStore.setState({ pomodoroCycles: nextCycles, taskName: "", selectedTaskId: null, showSaveModal: false });
                }
            } else {
                timerStore.setState({ 
                    isRunning: false, 
                    time: 0, 
                    taskName: "", 
                    selectedTaskId: null, 
                    sessionId: null, 
                    showSaveModal: false 
                });
            }
        } catch (err) {
            console.error("Failed to complete task and save session", err);
            showToast("Failed to save session");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveOnly = async () => {
        try {
            setIsSaving(true);
            const state = timerStore.getState();
            let durationToSave = state.time;
            if (state.timerMode === 'pomodoro') {
                durationToSave = Math.max(0, (state.initialDuration || 1500) - state.time);
                if (durationToSave <= 0) durationToSave = state.initialDuration || 1500;
            }

            await handleStopBackend(sessionId, true, durationToSave, taskName || "Focus Session");
            showToast("Session saved!");

            if (state.timerMode === 'pomodoro') {
                const nextCycles = (state.pomodoroCycles || 0) + 1;
                if (nextCycles >= 4) {
                    switchPomodoroPhase('longBreak');
                    timerStore.setState({ pomodoroCycles: 0, taskName: "", selectedTaskId: null, showSaveModal: false });
                } else {
                    switchPomodoroPhase('shortBreak');
                    timerStore.setState({ pomodoroCycles: nextCycles, taskName: "", selectedTaskId: null, showSaveModal: false });
                }
            } else {
                timerStore.setState({ 
                    isRunning: false, 
                    time: 0, 
                    taskName: "", 
                    selectedTaskId: null, 
                    sessionId: null, 
                    showSaveModal: false 
                });
            }
        } catch (err) {
            console.error("Failed to save session", err);
            showToast("Failed to save session");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (isSaving) return;
        timerStore.setState({ showSaveModal: false });
    };

    return (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md rounded-[28px] p-6 sm:p-7 relative flex flex-col gap-5 border border-white/10"
                style={heavyCardStyle}
            >
                <button 
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving}
                    className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                    <X size={18} weight="bold" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                        <FloppyDisk size={20} weight="bold" />
                    </div>
                    <div>
                        <h3 className="text-[17px] font-bold text-white tracking-tight">Save Focus Session</h3>
                        <p className="text-[12px] text-neutral-400 font-mono">
                            Logged {formatModalDuration(loggedDuration)}
                        </p>
                    </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase block mb-1">
                        Focus Task
                    </span>
                    <p className="text-[14px] font-medium text-neutral-200 truncate">
                        {taskName || "Focus Session"}
                    </p>
                </div>

                <p className="text-[13px] text-neutral-300 leading-relaxed">
                    Do you want to mark this task as completed in your Workspace and Calendar?
                </p>

                <div className="flex flex-col gap-2.5 pt-1">
                    <button
                        type="button"
                        onClick={handleCompleteAndSave}
                        disabled={isSaving}
                        className="w-full py-3.5 px-4 rounded-xl font-semibold text-[14px] bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                    >
                        <Check size={16} weight="bold" />
                        <span>Complete Task & Save</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveOnly}
                        disabled={isSaving}
                        className="w-full py-3 px-4 rounded-xl font-medium text-[13px] text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <span>Save Session Only (Keep Task Pending)</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
});

const FocusCard = memo(() => {
    return (
        <div className="lg:col-span-2 rounded-[24px] md:rounded-[32px] p-5 sm:p-6 md:p-12 flex flex-col relative w-full min-h-[360px] md:h-full md:min-h-0" style={heavyCardStyle}>
            <TaskInput />
            <PomodoroBar />
            <StrictModeToggle />
            
            <div className="flex-1 flex flex-col justify-center items-center py-2 md:py-8 w-full">
                <TimerDigits />
            </div>
            
            <ControlsBar />
            <TimerEngine />
            <SystemEffects />
        </div>
    );
});

const MainContainer = memo(({ children }) => {
    return (
        <main className="w-full min-h-full lg:h-full flex flex-col justify-start lg:justify-center items-center transition-all duration-300 relative z-10">
            {children}
        </main>
    );
});

const Stopwatch = () => {
    useEffect(() => {
        fetchTodayStats();
    }, []);

    return (
        <>
            <style>{`
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

                /* =========================================
                   🔥 PURE CSS BRUTALIST SWITCH 🔥
                   ========================================= */
                .switch {
                  /* Theme tokens — override these to recolour the switch */
                  --primary: #F4FF2B;
                  --secondary: #0F191E;
                  --surface: #E2F1F2;
                  --on: var(--secondary);                                       
                  --off: color-mix(in srgb, var(--secondary) 22%, var(--surface)); 
                  --thumb: var(--surface);
                  position: relative;
                  display: inline-flex;
                  cursor: pointer;
                  -webkit-tap-highlight-color: transparent;
                }
                .switch input { position: absolute; opacity: 0; width: 0; height: 0; }
                .switch .track {
                  position: relative;
                  width: 52px; height: 28px;
                  border-radius: 9999px;
                  background: var(--off);
                  transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                }
                .switch .thumb {
                  position: absolute;
                  top: 3px; left: 3px;
                  width: 22px; height: 22px;
                  border-radius: 50%;
                  background: var(--thumb);
                  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease, box-shadow 0.3s ease;
                }
                .switch input:checked + .track { background: var(--on); }
                .switch input:checked + .track .thumb { transform: translateX(24px); }
                .switch input:focus-visible + .track { outline: 2px solid var(--primary); outline-offset: 2px; }

                /* .sw-10 Variation */
                .sw-10 .track { background: var(--surface); border: 2px solid var(--secondary); box-shadow: 3px 3px 0 var(--secondary); }
                .sw-10 .thumb { top: 1px; left: 1px; background: var(--secondary); }
                .sw-10 input:checked + .track { background: var(--primary); }

                /* Respect prefers-reduced-motion */
                @media (prefers-reduced-motion: reduce) {
                  .switch .track, .switch .thumb { transition: none !important; }
                }
            `}</style>

            <div className="min-h-screen lg:h-screen w-full relative overflow-y-auto lg:overflow-hidden font-mono flex flex-col" style={{ backgroundColor: COLORS.bg, color: COLORS.textPrimary }}>
                <ToastOverlay />
                <SaveModal />
                <div className="w-full flex-1 flex flex-col relative z-10 px-3 sm:px-6 md:px-10 lg:px-16 pt-14 sm:pt-16 md:pt-8 pb-8">
                
                <MainContainer>
                    <div className="w-full max-w-5xl mx-auto flex flex-col justify-center h-full max-h-full">
                        <Header />
                        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 pb-4 md:pb-0">
                            <FocusCard />
                            <QuickStats />
                        </div>
                    </div>
                </MainContainer>
                </div>
            </div>
        </>
    );
};

export default Stopwatch;