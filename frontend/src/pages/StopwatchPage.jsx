import React from "react";
import Sidebar from "../components/common/Sidebar";
import Stopwatch from "../components/stopwatch/Stopwatch";

export default function StopwatchPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950">
      {/* 1. Persistent Left Navigation Sidebar */}
      <Sidebar />

      {/* 2. Main Stopwatch Focus Engine Canvas */}
      <Stopwatch />
    </div>
  );
}
