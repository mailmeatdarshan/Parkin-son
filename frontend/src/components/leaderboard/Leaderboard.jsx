import React, { useState, useEffect } from "react";
import { Trophy, Crown, Flame, Medal, Clock, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { apiFetch } from "../../apiClient";
import { useAuth } from "../../context/AuthContext";

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("allTime"); // "allTime" or "today"

  const fetchLeaderboard = async () => {
    try {
      const res = await apiFetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Format seconds to readable format
  const formatTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return "0m";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Sort based on active filter
  const sortedList = [...leaderboard].sort((a, b) => {
    const xpA = filterMode === "today" ? a.todayXp || 0 : a.allTimeXp || 0;
    const xpB = filterMode === "today" ? b.todayXp || 0 : b.allTimeXp || 0;
    return xpB - xpA;
  });

  const topThree = sortedList.slice(0, 3);
  const restList = sortedList.slice(3);

  // Position assignments for visual podium: [Rank 2, Rank 1, Rank 3]
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Trophy className="text-amber-400" size={24} />
              <h1 className="text-2xl font-bold tracking-tight">Focus Arena Leaderboard</h1>
            </div>
            <p className="text-xs text-zinc-400">
              Compete with developers locking in their deep work streaks.
            </p>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilterMode("allTime")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === "allTime"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All-Time Focus
            </button>
            <button
              onClick={() => setFilterMode("today")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === "today"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Today's Standings
            </button>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 bg-zinc-900/50 rounded-2xl border border-zinc-800/60 animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 animate-pulse" />
          </div>
        )}

        {!loading && sortedList.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-8">
            <Trophy size={48} className="mx-auto text-zinc-600 mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">No session data logged yet</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Start your first focus session in the Stopwatch to claim the #1 spot on the leaderboard!
            </p>
          </div>
        )}

        {!loading && sortedList.length > 0 && (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 items-end">
              {/* Rank 2 (Silver) */}
              {topThree[1] && (
                <div className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 text-center flex flex-col items-center relative transition-all shadow-xl order-2 sm:order-1">
                  <div className="absolute -top-3.5 bg-zinc-800 border border-zinc-600 text-zinc-300 px-3 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider flex items-center gap-1 shadow-md">
                    <Medal size={12} className="text-zinc-400" /> #2 SILVER
                  </div>

                  <img
                    src={topThree[1].avatar}
                    alt={topThree[1].name}
                    className="w-16 h-16 rounded-full border-2 border-zinc-500/50 bg-zinc-800 mb-3 object-cover shadow-inner mt-2"
                  />
                  <h3 className="text-sm font-bold text-white truncate max-w-[150px]">
                    {topThree[1].name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono mt-1 font-semibold">
                    <Flame size={14} />
                    <span>{topThree[1].streak || 0}d streak</span>
                  </div>
                  <div className="mt-3 bg-zinc-950/80 border border-zinc-800/80 px-4 py-1.5 rounded-xl text-xs font-mono text-zinc-300">
                    {formatTime(filterMode === "today" ? topThree[1].todayXp : topThree[1].allTimeXp)}
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold) */}
              {topThree[0] && (
                <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900/90 to-zinc-900 border-2 border-amber-500/40 rounded-3xl p-7 text-center flex flex-col items-center relative transition-all shadow-2xl order-1 sm:order-2 -translate-y-2">
                  <div className="absolute -top-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 px-4 py-1 rounded-full text-xs font-black font-mono tracking-widest flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                    <Crown size={14} fill="currentColor" /> #1 CHAMPION
                  </div>

                  <div className="relative mt-2">
                    <img
                      src={topThree[0].avatar}
                      alt={topThree[0].name}
                      className="w-20 h-20 rounded-full border-2 border-amber-400 bg-zinc-800 mb-3 object-cover shadow-2xl"
                    />
                    <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                  </div>

                  <h3 className="text-base font-extrabold text-white tracking-tight truncate max-w-[180px]">
                    {topThree[0].name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono mt-1 font-semibold">
                    <Flame size={14} />
                    <span>{topThree[0].streak || 0}d streak</span>
                  </div>

                  <div className="mt-4 bg-amber-500/20 border border-amber-500/30 px-5 py-2 rounded-xl text-sm font-bold font-mono text-amber-300 shadow-inner">
                    {formatTime(filterMode === "today" ? topThree[0].todayXp : topThree[0].allTimeXp)}
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {topThree[2] && (
                <div className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 text-center flex flex-col items-center relative transition-all shadow-xl order-3">
                  <div className="absolute -top-3.5 bg-zinc-800 border border-amber-700/60 text-amber-500 px-3 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider flex items-center gap-1 shadow-md">
                    <Medal size={12} className="text-amber-600" /> #3 BRONZE
                  </div>

                  <img
                    src={topThree[2].avatar}
                    alt={topThree[2].name}
                    className="w-16 h-16 rounded-full border-2 border-amber-800/50 bg-zinc-800 mb-3 object-cover shadow-inner mt-2"
                  />
                  <h3 className="text-sm font-bold text-white truncate max-w-[150px]">
                    {topThree[2].name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono mt-1 font-semibold">
                    <Flame size={14} />
                    <span>{topThree[2].streak || 0}d streak</span>
                  </div>
                  <div className="mt-3 bg-zinc-950/80 border border-zinc-800/80 px-4 py-1.5 rounded-xl text-xs font-mono text-zinc-300">
                    {formatTime(filterMode === "today" ? topThree[2].todayXp : topThree[2].allTimeXp)}
                  </div>
                </div>
              )}
            </div>

            {/* Complete Rankings Table */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  All Contenders ({sortedList.length})
                </h3>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {filterMode === "today" ? "Filtered: Today Only" : "Filtered: All-Time Focus"}
                </span>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {sortedList.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrent = currentUser?.id === entry.id || currentUser?._id === entry.id;
                  const timeSpent = filterMode === "today" ? entry.todayXp : entry.allTimeXp;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between px-6 py-3.5 transition-colors ${
                        isCurrent
                          ? "bg-blue-600/10 border-l-2 border-blue-500"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Left: Rank & User Details */}
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-6 text-center font-mono font-bold text-xs ${
                            rank === 1
                              ? "text-amber-400"
                              : rank === 2
                              ? "text-zinc-300"
                              : rank === 3
                              ? "text-amber-600"
                              : "text-zinc-600"
                          }`}
                        >
                          #{rank}
                        </span>

                        <img
                          src={entry.avatar}
                          alt={entry.name}
                          className="w-9 h-9 rounded-full bg-zinc-800 object-cover border border-zinc-700/60 shrink-0"
                        />

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                              {entry.name}
                            </span>
                            {isCurrent && (
                              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                            <span className="flex items-center gap-1 text-amber-500/90 font-mono">
                              <Flame size={12} /> {entry.streak || 0} streak
                            </span>
                            <span>•</span>
                            <span>{entry.badges?.[0] || "Novice"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Time / Focus XP */}
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end text-xs sm:text-sm font-bold font-mono text-zinc-200">
                          <Clock size={14} className="text-zinc-500" />
                          <span>{formatTime(timeSpent)}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-0.5">
                          {entry.totalSessions || 0} sessions
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
