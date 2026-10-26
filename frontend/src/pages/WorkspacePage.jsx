import React from "react";
import Sidebar from "../components/common/Sidebar";
import Workspace from "../components/workspace/Workspace";

export default function WorkspacePage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950">
      {/* 1. Persistent Left Sidebar */}
      <Sidebar />

      {/* 2. Main Scrollable Workspace Canvas */}
      <Workspace />
    </div>
  );
}