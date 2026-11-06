import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Command, Timer, Award } from "lucide-react";

const NAV_ITEMS = [
  { name: "Workspace", path: "/workspace", icon: Command },
  { name: "Stopwatch", path: "/stopwatch", icon: Timer },
  { name: "Leaderboard", path: "/leaderboard", icon: Award },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-screen bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-start p-4 shrink-0 select-none">
      {/* 1. App Logo & Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800/50 p-1.5 shadow-inner">
            <img src="/parkinson.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Parkin'son</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Focus Workspace</p>
          </div>
        </div>

        {/* 2. Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Icon size={18} className={isActive ? "text-blue-400" : "text-zinc-500"} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}