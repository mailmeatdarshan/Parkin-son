import React, { useEffect, useState } from "react";
import { apiFetch } from "./apiClient";

export default function App() {
  const [serverStatus, setServerStatus] = useState("Checking backend connection...");

  useEffect(() => {
    apiFetch("/health")
      .then((res) => res.json())
      .then((data) => setServerStatus(data.message || "Connected!"))
      .catch((err) => setServerStatus("Backend not running or CORS error!"));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border border-zinc-700/60 bg-zinc-800/40 p-2 shadow-inner">
          <img src="/parkinson.svg" alt="Parkin-son Logo" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Parkin-son</h1>
        <p className="text-sm text-zinc-400 mb-6">Do you know about Parkinson's law</p>

        <div className="flex items-center justify-center gap-2 bg-zinc-800/60 border border-zinc-700/50 py-3 px-4 rounded-xl text-xs font-mono">
          <span>Status: {serverStatus}</span>
        </div>
      </div>
    </div>
  );
}