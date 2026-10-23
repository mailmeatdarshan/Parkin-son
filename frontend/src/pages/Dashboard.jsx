import React from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Flame, Award, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || "/parkinson.svg"}
              alt="Avatar"
              className="w-14 h-14 rounded-full border-2 border-blue-500/50 object-cover bg-zinc-800"
            />
            <div>
              <h1 className="text-xl font-bold">{user?.name}</h1>
              <p className="text-xs text-zinc-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 px-4 py-2 rounded-xl text-xs font-medium transition-all"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-orange-400 mb-2">
              <Flame size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider">Current Streak</span>
            </div>
            <p className="text-3xl font-extrabold">{user?.streak || 0} Days</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-purple-400 mb-2">
              <Award size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider">Badges</span>
            </div>
            <p className="text-3xl font-extrabold">{user?.badges?.length || 1}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <CheckCircle size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider">Session Status</span>
            </div>
            <p className="text-sm font-medium text-emerald-400">Authenticated & Secure</p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-xl p-4 text-center">
           <strong>Day 7 Complete!</strong> Authentication flow is fully wired to MongoDB. Next up: Day 8 (Full Workspace & Tasks Shell)!
        </div>
      </div>
    </div>
  );
}