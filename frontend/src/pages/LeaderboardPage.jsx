import React from "react";
import Sidebar from "../components/common/Sidebar";
import Leaderboard from "../components/leaderboard/Leaderboard";

export default function LeaderboardPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950">
      {/* 1. Persistent Navigation Sidebar */}
      <Sidebar />

      {/* 2. Main Community Leaderboard Canvas */}
      <Leaderboard />
    </div>
  );
}
